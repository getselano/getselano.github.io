// Admin → member messaging.
// Admin sends from Control Center (broadcast or personal). Members see it
// as a top toast (3s) and in a persistent bell dropdown until dismissed.
//
// Requires two Supabase tables (see SQL at bottom of this file).

import { supabase, supabaseEnabled } from '../lib/supabase'

// ─── Categories the sender can tag a message with ─────────────
export const MESSAGE_CATEGORIES = [
  { key: 'general',   label: 'כללי',    color: '#7a7167' },
  { key: 'important', label: 'חשוב',    color: '#c74050' },
  { key: 'tip',       label: 'טיפ',     color: '#c9a961' },
  { key: 'reminder',  label: 'תזכורת',  color: '#4a90c7' },
  { key: 'motivation',label: 'מוטיבציה', color: '#5ab674' },
]

// ─── SEND (admin only — enforced by RLS) ──────────────────────
// targetUserId=null → broadcast to every member
export async function sendAdminMessage({ title, body, category = 'general', targetUserId = null, senderName = null }) {
  if (!supabaseEnabled) return { ok: false, error: 'Supabase לא מוגדר' }
  const payload = {
    title: (title || '').trim().slice(0, 60),
    body: (body || '').trim().slice(0, 500),
    category,
    target_user_id: targetUserId || null,
    sender_name: senderName || null,
    created_at: new Date().toISOString(),
  }
  if (!payload.body) return { ok: false, error: 'הודעה ריקה' }
  const { data, error } = await supabase.from('admin_messages').insert(payload).select().single()
  if (error) {
    console.warn('[adminMessages] send failed:', error.message)
    return { ok: false, error: error.message, code: error.code }
  }
  return { ok: true, data }
}

// ─── LIST for a member (broadcast + personal) ─────────────────
// Returns messages joined with read state for this user.
export async function listMessagesForMember(userId) {
  if (!supabaseEnabled || !userId) return []
  // 1) messages targeting me OR broadcast
  const { data: messages, error: mErr } = await supabase
    .from('admin_messages')
    .select('*')
    .or(`target_user_id.eq.${userId},target_user_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(50)
  if (mErr) {
    console.warn('[adminMessages] list failed:', mErr.message)
    return []
  }
  if (!messages?.length) return []
  // 2) read receipts for me
  const ids = messages.map(m => m.id)
  const { data: reads } = await supabase
    .from('admin_message_reads')
    .select('message_id, read_at')
    .eq('user_id', userId)
    .in('message_id', ids)
  const readMap = new Map((reads || []).map(r => [r.message_id, r.read_at]))
  return messages.map(m => ({ ...m, read_at: readMap.get(m.id) || null }))
}

// ─── LIST for admin (sent history) ────────────────────────────
export async function listSentMessages() {
  if (!supabaseEnabled) return []
  const { data, error } = await supabase
    .from('admin_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) {
    console.warn('[adminMessages] admin list failed:', error.message)
    return []
  }
  return data || []
}

// ─── MARK READ ────────────────────────────────────────────────
export async function markMessageRead(messageId, userId) {
  if (!supabaseEnabled || !userId || !messageId) return { ok: false }
  const { error } = await supabase.from('admin_message_reads').upsert({
    message_id: messageId,
    user_id: userId,
    read_at: new Date().toISOString(),
  }, { onConflict: 'message_id,user_id' })
  if (error) {
    console.warn('[adminMessages] mark read failed:', error.message)
    return { ok: false }
  }
  return { ok: true }
}

// ─── DELETE (admin only — RLS enforced) ───────────────────────
export async function deleteAdminMessage(messageId) {
  if (!supabaseEnabled) return { ok: false }
  const { error } = await supabase.from('admin_messages').delete().eq('id', messageId)
  if (error) {
    console.warn('[adminMessages] delete failed:', error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true }
}

// ─── Real-time subscription for members ───────────────────────
// Fires the callback whenever a new admin_messages row is inserted
// that targets me (personal or broadcast).
export function subscribeToMemberMessages(userId, onInsert) {
  if (!supabaseEnabled || !userId) return () => {}
  const channel = supabase
    .channel(`admin_messages_${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'admin_messages',
    }, (payload) => {
      const row = payload.new
      if (!row) return
      // Deliver only if broadcast OR targeted at me
      if (row.target_user_id === null || row.target_user_id === userId) {
        onInsert(row)
      }
    })
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

/*
SQL to run in Supabase SQL editor (once):

create table admin_messages (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text not null,
  category text default 'general',
  target_user_id uuid references auth.users(id) on delete cascade,
  sender_name text,
  created_at timestamptz not null default now()
);
create index on admin_messages (target_user_id, created_at desc);
alter table admin_messages enable row level security;
-- members read own + broadcast
create policy "read own or broadcast" on admin_messages for select
  using (target_user_id = auth.uid() or target_user_id is null);
-- only admins can write
create policy "admin insert" on admin_messages for insert
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "admin update" on admin_messages for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "admin delete" on admin_messages for delete
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create table admin_message_reads (
  message_id uuid references admin_messages(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table admin_message_reads enable row level security;
create policy "own reads" on admin_message_reads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
*/
