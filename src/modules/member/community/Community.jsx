import React, { useEffect, useState } from 'react'
import { t } from '../../../theme/tokens'
import { Card, Button, EmptyState } from '../../../components/ui/UI'
import { SLoader } from '../../../components/ui/SLoader'
import { useAuth } from '../../../auth/AuthContext'
import {
  listFeed, toggleLike, listComments, addComment,
  deleteComment, deleteWorkout, subscribeToFeed,
} from '../../../services/sharedWorkouts'

// Community feed screen. Loads recent shared workouts, wires realtime updates,
// exposes like + comments + expand-to-full-workout per card.

export function Community() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [feed, setFeed] = useState(null)
  const [expanded, setExpanded] = useState({}) // id → boolean

  const load = async () => {
    const rows = await listFeed(user?.id)
    setFeed(rows)
  }

  useEffect(() => {
    load()
    const unsub = subscribeToFeed({
      onInsertWorkout: () => load(),
      onLikeChange: () => load(),
      onCommentChange: () => load(),
    })
    return unsub
  }, [user?.id])

  const handleLike = async (workout) => {
    // Optimistic UI
    setFeed(prev => prev.map(w => w.id === workout.id
      ? { ...w, meLiked: !w.meLiked, likeCount: w.likeCount + (w.meLiked ? -1 : 1) }
      : w))
    await toggleLike(workout.id, user.id, workout.meLiked)
  }

  const handleDelete = async (workout) => {
    if (!confirm('למחוק את הפרסום לצמיתות?')) return
    await deleteWorkout(workout.id)
    setFeed(prev => prev.filter(w => w.id !== workout.id))
  }

  if (feed === null) {
    return (
      <Card style={{ padding: 60 }}>
        <SLoader size={120} label="טוען את הפיד…" />
      </Card>
    )
  }

  return (
    <div style={{ display:'grid', gap: 16 }}>
      <div style={{ padding:'4px 0 8px' }}>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.28em',
          textTransform:'uppercase', color: t.color.wineLight, fontWeight: 700,
          marginBottom: 6,
        }}>קהילה · Community feed</div>
        <div style={{
          fontFamily: t.font.family.display, fontSize: 26, fontWeight: 700,
          color: t.color.white, letterSpacing:'-0.02em',
        }}>אימונים שהקהילה חולקת</div>
        <div style={{ color: t.color.textDim, fontSize: t.font.sm, marginTop: 4 }}>
          פרסם אימון משלך מכל מסך אימונים · WOD · Routine.
        </div>
      </div>

      {feed.length === 0 ? (
        <EmptyState
          title="אין עדיין אימונים בקהילה"
          subtitle="היה הראשון — צור אימון או WOD ולחץ 'פרסם לקהילה' בסוף"
        />
      ) : feed.map(w => (
        <FeedCard
          key={w.id}
          workout={w}
          currentUser={user}
          isAdmin={isAdmin}
          expanded={!!expanded[w.id]}
          onToggleExpand={() => setExpanded(p => ({ ...p, [w.id]: !p[w.id] }))}
          onLike={() => handleLike(w)}
          onDelete={() => handleDelete(w)}
          onCommentsChange={load}
        />
      ))}
    </div>
  )
}

function FeedCard({ workout, currentUser, isAdmin, expanded, onToggleExpand, onLike, onDelete, onCommentsChange }) {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const canDelete = isAdmin || workout.user_id === currentUser?.id
  const isMine = workout.user_id === currentUser?.id

  const loadComments = async () => {
    setLoadingComments(true)
    const rows = await listComments(workout.id)
    setComments(rows)
    setLoadingComments(false)
  }

  const openComments = () => {
    setCommentsOpen(v => {
      if (!v) loadComments()
      return !v
    })
  }

  const send = async () => {
    if (!draft.trim()) return
    setSending(true)
    const res = await addComment({
      workoutId: workout.id, userId: currentUser.id,
      userName: currentUser.name, body: draft,
    })
    setSending(false)
    if (res.ok) {
      setDraft('')
      setComments(prev => [...prev, res.data])
      onCommentsChange?.()
    }
  }

  const removeComment = async (c) => {
    if (!confirm('למחוק תגובה?')) return
    await deleteComment(c.id)
    setComments(prev => prev.filter(x => x.id !== c.id))
    onCommentsChange?.()
  }

  return (
    <Card style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius:'50%',
          background: `linear-gradient(135deg, ${t.color.wineLight}, ${t.color.gold})`,
          display:'grid', placeItems:'center', fontWeight: 800, color:'#0d0d14',
          fontFamily: t.font.family.display, fontSize: 16,
        }}>{(workout.user_name || '?').slice(0, 1)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: t.color.text, fontSize: 14 }}>
            {workout.user_name || 'משתמש/ת'}
            {isMine && <span style={{
              marginInlineStart: 8, fontSize: 10, color: t.color.textMuted,
              fontFamily: t.font.family.mono, letterSpacing:'0.14em',
            }}>· שלך</span>}
          </div>
          <div style={{ fontSize: 11, color: t.color.textMuted, fontFamily: t.font.family.mono }}>
            {relativeTime(workout.created_at)} · {typeLabel(workout.workout_type)}
          </div>
        </div>
        {canDelete && (
          <button onClick={onDelete} style={{
            background:'transparent', border:'none', color: t.color.danger,
            cursor:'pointer', fontSize: 12, padding: 4,
          }}>מחק</button>
        )}
      </div>

      {/* Preview */}
      <WorkoutPreview
        type={workout.workout_type}
        data={workout.workout_data}
        expanded={expanded}
      />

      {/* Toggle full view */}
      <div style={{ display:'flex', gap: 8, marginTop: 12 }}>
        <Button variant="ghost" size="sm" onClick={onToggleExpand}>
          {expanded ? 'סגור' : 'לאימון המלא'}
        </Button>
      </div>

      {/* Actions */}
      <div style={{
        display:'flex', gap: 12, alignItems:'center',
        borderTop: `1px solid ${t.color.hairline}`, paddingTop: 10, marginTop: 12,
      }}>
        <button onClick={onLike} style={{
          background:'transparent', border:'none', cursor:'pointer',
          display:'inline-flex', alignItems:'center', gap: 6,
          color: workout.meLiked ? t.color.wineLight : t.color.silver1,
          fontFamily:'inherit', fontSize: 13, padding: 4,
        }}>
          <HeartIcon filled={workout.meLiked} />
          <span style={{ fontWeight: workout.meLiked ? 700 : 500 }}>{workout.likeCount || 0}</span>
        </button>
        <button onClick={openComments} style={{
          background:'transparent', border:'none', cursor:'pointer',
          display:'inline-flex', alignItems:'center', gap: 6,
          color: t.color.silver1, fontFamily:'inherit', fontSize: 13, padding: 4,
        }}>
          <CommentIcon />
          <span>{workout.commentCount || 0} תגובות</span>
        </button>
      </div>

      {commentsOpen && (
        <div style={{
          marginTop: 12, padding: 12, background: t.color.bgSoft,
          borderRadius: t.radius.sm, display:'grid', gap: 10,
        }}>
          {loadingComments ? (
            <div style={{ color: t.color.textDim, fontSize: 12, textAlign:'center', padding: 10 }}>טוען…</div>
          ) : comments.length === 0 ? (
            <div style={{ color: t.color.textDim, fontSize: 12, textAlign:'center', padding: 6 }}>
              אין עדיין תגובות. תהיה הראשון.
            </div>
          ) : comments.map(c => (
            <div key={c.id} style={{ display:'grid', gap: 4 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 6, flexWrap:'wrap' }}>
                <span style={{ fontWeight: 700, color: t.color.text, fontSize: 12 }}>{c.user_name || 'משתמש/ת'}</span>
                <span style={{ fontSize: 10, color: t.color.textMuted, fontFamily: t.font.family.mono }}>
                  {relativeTime(c.created_at)}
                </span>
                {(isAdmin || c.user_id === currentUser?.id) && (
                  <button onClick={() => removeComment(c)} style={{
                    marginInlineStart:'auto', background:'transparent', border:'none',
                    color: t.color.danger, cursor:'pointer', fontSize: 10,
                  }}>מחק</button>
                )}
              </div>
              <div style={{ fontSize: 12, color: t.color.silver1, lineHeight: 1.5, whiteSpace:'pre-wrap' }}>
                {c.body}
              </div>
            </div>
          ))}

          {/* Comment input */}
          <div style={{ display:'flex', gap: 6, marginTop: 4 }}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value.slice(0, 400))}
              placeholder="כתוב תגובה…"
              style={{
                flex: 1, padding:'10px 12px', background: t.color.bg,
                border:`1px solid ${t.color.border}`, borderRadius: t.radius.sm,
                color: t.color.text, fontFamily:'inherit', fontSize: 13,
                outline:'none', direction:'rtl',
              }}
              onKeyDown={e => { if (e.key === 'Enter') send() }}
            />
            <Button size="sm" onClick={send} disabled={sending || !draft.trim()}>
              {sending ? '…' : 'שלח'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ─── Preview rendering per workout type ─────────────────────
function WorkoutPreview({ type, data, expanded }) {
  if (!data) return null
  if (type === 'wod') {
    const lines = data.lines || []
    const shown = expanded ? lines : lines.slice(0, 4)
    return (
      <div>
        {data.title && (
          <div style={{ fontSize: 18, fontWeight: 800, color: t.color.gold, marginBottom: 8 }}>
            {data.title}
          </div>
        )}
        <pre style={{
          margin: 0, padding: 12, borderRadius: 6,
          background: t.color.bg, border: `1px solid ${t.color.border}`,
          fontFamily:'Space Mono, ui-monospace, monospace',
          fontSize: 12, color: t.color.text, lineHeight: 1.7,
          whiteSpace:'pre-wrap', direction:'ltr', textAlign:'left',
          overflowX:'auto',
        }}>{shown.join('\n')}{!expanded && lines.length > 4 ? '\n…' : ''}</pre>
        {expanded && data.movements?.length > 0 && (
          <div style={{
            marginTop: 10, padding: 10, background: t.color.bgSoft,
            borderRadius: t.radius.sm, fontSize: 12, direction:'rtl',
          }}>
            <div style={{
              fontSize: 9, fontFamily: t.font.family.mono, letterSpacing:'0.24em',
              textTransform:'uppercase', color: t.color.silver3, marginBottom: 6,
            }}>Movements</div>
            {data.movements.map(m => (
              <div key={m.id} style={{ display:'flex', gap: 8, marginBottom: 2 }}>
                <span style={{ color: t.color.gold, fontFamily:'Space Mono, monospace', fontSize: 12 }}>
                  {m.en || m.he}
                </span>
                <span style={{ color: t.color.silver2, fontSize: 11 }}>· {m.he}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  if (type === 'routine') {
    const exs = data.exercises || []
    const shown = expanded ? exs : exs.slice(0, 4)
    return (
      <div>
        {data.name && (
          <div style={{ fontSize: 16, fontWeight: 700, color: t.color.text, marginBottom: 10 }}>
            {data.name}
          </div>
        )}
        <div style={{ display:'grid', gap: 6 }}>
          {shown.map((ex, i) => (
            <div key={i} style={{
              padding:'8px 10px', background: t.color.bg,
              border: `1px solid ${t.color.hairline}`, borderRadius: 6,
              display:'flex', gap: 8, alignItems:'baseline',
            }}>
              <span style={{ fontWeight: 600, color: t.color.text, fontSize: 13 }}>{ex.name || ex.exerciseId}</span>
              <span style={{ fontSize: 11, color: t.color.silver2, marginInlineStart:'auto', fontFamily: t.font.family.mono }}>
                {(ex.sets || []).length} × {ex.sets?.[0]?.reps || '—'}
              </span>
            </div>
          ))}
          {!expanded && exs.length > 4 && (
            <div style={{ color: t.color.textDim, fontSize: 11, textAlign:'center' }}>
              …ועוד {exs.length - 4}
            </div>
          )}
        </div>
      </div>
    )
  }
  // custom / text
  return (
    <div style={{
      padding: 10, background: t.color.bg, borderRadius: 6,
      color: t.color.text, fontSize: 13, whiteSpace:'pre-wrap',
    }}>{data.text || ''}</div>
  )
}

// ─── Tiny icons + helpers ─────────────────────────────────────
function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function CommentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function typeLabel(type) {
  if (type === 'wod') return 'WOD'
  if (type === 'routine') return 'Bodybuilding'
  return 'אימון'
}
function relativeTime(iso) {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return 'עכשיו'
  const m = Math.floor(s / 60)
  if (m < 60) return `לפני ${m} דק'`
  const h = Math.floor(m / 60)
  if (h < 24) return `לפני ${h} שעות`
  const d = Math.floor(h / 24)
  if (d < 7) return `לפני ${d} ימים`
  return new Date(iso).toLocaleDateString('he-IL', { day:'numeric', month:'short' })
}
