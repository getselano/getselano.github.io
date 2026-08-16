// Community feed — members publish their workouts (template only, no personal
// weights/logs), everyone reads, likes, comments. Real-time delivery via
// Supabase channel so the toast fires the moment a new one lands.
//
// Requires 3 Supabase tables (see SQL at bottom of file).

import { supabase, supabaseEnabled } from '../lib/supabase'

// ─── PUBLISH ──────────────────────────────────────────────
// workout_type: 'wod' | 'routine' | 'custom'
// workout_data: JSON that Community renders back. Strip personal fields
// (weights/logs) BEFORE passing here — this file trusts the caller.
export async function publishWorkout({ userId, userName, workoutType, workoutData }) {
  if (!supabaseEnabled) return { ok: false, error: 'Supabase לא מוגדר' }
  if (!userId) return { ok: false, error: 'לא מחובר' }
  if (!workoutData) return { ok: false, error: 'אימון ריק' }
  const payload = {
    user_id: userId,
    user_name: userName || null,
    workout_type: workoutType || 'custom',
    workout_data: workoutData,
    created_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('shared_workouts')
    .insert(payload)
    .select()
    .single()
  if (error) {
    console.warn('[sharedWorkouts] publish failed:', error.message)
    return { ok: false, error: error.message, code: error.code }
  }
  return { ok: true, data }
}

// ─── LIST feed with per-user like state + like counts ────
export async function listFeed(currentUserId, limit = 30) {
  if (!supabaseEnabled) return []
  const { data: workouts, error } = await supabase
    .from('shared_workouts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.warn('[sharedWorkouts] list failed:', error.message)
    return []
  }
  if (!workouts?.length) return []
  const ids = workouts.map(w => w.id)

  // Aggregate likes
  const { data: likes } = await supabase
    .from('workout_likes')
    .select('workout_id, user_id')
    .in('workout_id', ids)
  const likeMap = new Map() // workoutId → { count, meLiked }
  for (const id of ids) likeMap.set(id, { count: 0, meLiked: false })
  for (const l of (likes || [])) {
    const entry = likeMap.get(l.workout_id)
    if (!entry) continue
    entry.count++
    if (currentUserId && l.user_id === currentUserId) entry.meLiked = true
  }

  // Aggregate comment counts
  const { data: comments } = await supabase
    .from('workout_comments')
    .select('workout_id')
    .in('workout_id', ids)
  const commentCount = new Map()
  for (const id of ids) commentCount.set(id, 0)
  for (const c of (comments || [])) {
    commentCount.set(c.workout_id, (commentCount.get(c.workout_id) || 0) + 1)
  }

  return workouts.map(w => ({
    ...w,
    likeCount: likeMap.get(w.id)?.count || 0,
    meLiked: likeMap.get(w.id)?.meLiked || false,
    commentCount: commentCount.get(w.id) || 0,
  }))
}

// ─── LIKE / UNLIKE ──────────────────────────────────────────
export async function toggleLike(workoutId, userId, currentlyLiked) {
  if (!supabaseEnabled || !userId || !workoutId) return { ok: false }
  if (currentlyLiked) {
    const { error } = await supabase
      .from('workout_likes')
      .delete()
      .eq('workout_id', workoutId)
      .eq('user_id', userId)
    if (error) { console.warn('[sharedWorkouts] unlike failed:', error.message); return { ok: false } }
    return { ok: true, liked: false }
  }
  const { error } = await supabase
    .from('workout_likes')
    .insert({ workout_id: workoutId, user_id: userId })
  if (error) { console.warn('[sharedWorkouts] like failed:', error.message); return { ok: false } }
  return { ok: true, liked: true }
}

// ─── COMMENTS ────────────────────────────────────────────────
export async function listComments(workoutId) {
  if (!supabaseEnabled || !workoutId) return []
  const { data, error } = await supabase
    .from('workout_comments')
    .select('*')
    .eq('workout_id', workoutId)
    .order('created_at', { ascending: true })
  if (error) { console.warn('[sharedWorkouts] list comments failed:', error.message); return [] }
  return data || []
}

export async function addComment({ workoutId, userId, userName, body }) {
  if (!supabaseEnabled || !userId || !workoutId) return { ok: false }
  const trimmed = (body || '').trim().slice(0, 400)
  if (!trimmed) return { ok: false, error: 'ריק' }
  const { data, error } = await supabase
    .from('workout_comments')
    .insert({ workout_id: workoutId, user_id: userId, user_name: userName || null, body: trimmed })
    .select()
    .single()
  if (error) { console.warn('[sharedWorkouts] add comment failed:', error.message); return { ok: false, error: error.message } }
  return { ok: true, data }
}

export async function deleteComment(commentId) {
  if (!supabaseEnabled || !commentId) return { ok: false }
  const { error } = await supabase.from('workout_comments').delete().eq('id', commentId)
  if (error) { console.warn('[sharedWorkouts] delete comment failed:', error.message); return { ok: false } }
  return { ok: true }
}

export async function deleteWorkout(workoutId) {
  if (!supabaseEnabled || !workoutId) return { ok: false }
  const { error } = await supabase.from('shared_workouts').delete().eq('id', workoutId)
  if (error) { console.warn('[sharedWorkouts] delete workout failed:', error.message); return { ok: false } }
  return { ok: true }
}

// ─── Real-time — new workouts + likes + comments ─────────
// Toast component subscribes for INSERT on shared_workouts (excludes own).
// Community screen subscribes for everything to keep counts fresh.
// Realtime — each caller gets its own channel instance. Supabase requires
// callbacks to be registered BEFORE .subscribe(), and disallows reusing a
// channel name across multiple subscribers, so we mint a unique name per
// call (bell / toast / community feed each mount independently).
let _channelCounter = 0
export function subscribeToFeed({ onInsertWorkout, onLikeChange, onCommentChange }) {
  if (!supabaseEnabled) return () => {}
  _channelCounter += 1
  const channelName = `shared_workouts_feed_${_channelCounter}_${Math.random().toString(36).slice(2, 8)}`
  const ch = supabase.channel(channelName)
  if (onInsertWorkout) {
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shared_workouts' }, p => {
      if (p.new) onInsertWorkout(p.new)
    })
  }
  if (onLikeChange) {
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'workout_likes' }, p => {
      onLikeChange(p.new || p.old)
    })
  }
  if (onCommentChange) {
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'workout_comments' }, p => {
      onCommentChange(p.new || p.old)
    })
  }
  ch.subscribe()
  return () => { try { supabase.removeChannel(ch) } catch {} }
}

/*
SQL — run once in Supabase SQL editor:

create table shared_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  user_name text,
  workout_type text default 'custom',
  workout_data jsonb not null,
  created_at timestamptz not null default now()
);
create index on shared_workouts (created_at desc);
alter table shared_workouts enable row level security;
create policy "read all" on shared_workouts for select using (true);
create policy "insert own" on shared_workouts for insert with check (user_id = auth.uid());
create policy "delete own" on shared_workouts for delete using (user_id = auth.uid());
create policy "admin delete any workout" on shared_workouts for delete
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create table workout_likes (
  workout_id uuid references shared_workouts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (workout_id, user_id)
);
alter table workout_likes enable row level security;
create policy "read all likes" on workout_likes for select using (true);
create policy "own likes" on workout_likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table workout_comments (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid references shared_workouts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  user_name text,
  body text not null,
  created_at timestamptz not null default now()
);
create index on workout_comments (workout_id, created_at);
alter table workout_comments enable row level security;
create policy "read all comments" on workout_comments for select using (true);
create policy "insert own comment" on workout_comments for insert with check (user_id = auth.uid());
create policy "delete own comment" on workout_comments for delete using (user_id = auth.uid());
create policy "admin delete any comment" on workout_comments for delete
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
*/
