import React, { useEffect, useRef, useState } from 'react'
import { t } from '../../theme/tokens'
import { useAuth } from '../../auth/AuthContext'
import {
  listMessagesForMember, markMessageRead, subscribeToMemberMessages,
  MESSAGE_CATEGORIES,
} from '../../services/adminMessages'
import { listFeed, subscribeToFeed } from '../../services/sharedWorkouts'

// Unified notifications bell for members. Merges two sources:
//   1. Admin messages (persistent read state in Supabase)
//   2. Community workout publications (per-user 'seen' tracked in localStorage)
// Includes the current user's own published workouts so their history sits
// alongside everything else.

const cat = (key) => MESSAGE_CATEGORIES.find(c => c.key === key) || MESSAGE_CATEGORIES[0]
const COMMUNITY_SEEN_KEY = 'hfos:bell_community_seen'

function loadSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(COMMUNITY_SEEN_KEY) || '[]')) }
  catch { return new Set() }
}
function saveSeen(set) {
  try {
    const arr = Array.from(set).slice(-500)
    localStorage.setItem(COMMUNITY_SEEN_KEY, JSON.stringify(arr))
  } catch {}
}

export function AdminMessageBell({ onNavigate }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [seenTick, setSeenTick] = useState(0)
  const seenRef = useRef(loadSeen())
  const panelRef = useRef(null)
  const btnRef = useRef(null)

  async function loadAll() {
    if (!user?.id) return
    const [msgs, feed] = await Promise.all([
      listMessagesForMember(user.id),
      listFeed(user.id, 25),
    ])
    setMessages(msgs || [])
    setWorkouts(feed || [])
  }

  useEffect(() => {
    loadAll()
    if (!user?.id) return
    const unsubMsg = subscribeToMemberMessages(user.id, () => loadAll())
    const unsubFeed = subscribeToFeed({
      onInsertWorkout: () => loadAll(),
    })
    return () => { unsubMsg(); unsubFeed() }
  }, [user?.id])

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target)) return
      if (btnRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [open])

  // Merged list, newest-first. Each item has `_type` and `_id` for key/handling.
  const items = React.useMemo(() => {
    const mm = (messages || []).map(m => ({ ...m, _type: 'message', _id: `msg-${m.id}`, _ts: m.created_at }))
    const ww = (workouts || []).map(w => ({ ...w, _type: 'workout', _id: `wo-${w.id}`, _ts: w.created_at }))
    return [...mm, ...ww].sort((a, b) => new Date(b._ts) - new Date(a._ts)).slice(0, 60)
  }, [messages, workouts])

  const unread = items.filter(it => {
    if (it._type === 'message') return !it.read_at
    return !seenRef.current.has(it.id)
  }).length

  const markMessage = async (m) => {
    if (m.read_at) return
    setMessages(prev => prev.map(x => x.id === m.id ? { ...x, read_at: new Date().toISOString() } : x))
    await markMessageRead(m.id, user.id)
  }

  const markWorkoutSeen = (w) => {
    if (seenRef.current.has(w.id)) return
    seenRef.current.add(w.id)
    saveSeen(seenRef.current)
    setSeenTick(s => s + 1)
  }

  const handleClickItem = (it) => {
    if (it._type === 'message') {
      markMessage(it)
    } else {
      markWorkoutSeen(it)
      setOpen(false)
      onNavigate?.('community')
    }
  }

  const markAll = async () => {
    const unreadMsgs = messages.filter(m => !m.read_at)
    if (unreadMsgs.length) {
      const now = new Date().toISOString()
      setMessages(prev => prev.map(x => ({ ...x, read_at: x.read_at || now })))
      await Promise.all(unreadMsgs.map(m => markMessageRead(m.id, user.id)))
    }
    // Mark ALL workouts in list as seen
    for (const w of workouts) seenRef.current.add(w.id)
    saveSeen(seenRef.current)
    setSeenTick(s => s + 1)
  }

  return (
    <div style={{ position:'relative' }}>
      <button
        ref={btnRef}
        onClick={() => setOpen(v => !v)}
        aria-label="התראות"
        title="התראות"
        style={{
          background:'transparent',
          border:`1px solid ${t.color.border}`,
          borderRadius: t.radius.pill,
          padding:'6px 10px',
          color: t.color.text, cursor:'pointer',
          display:'flex', alignItems:'center', gap: 4,
          position:'relative',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position:'absolute', top:-3, insetInlineEnd:-3,
            minWidth: 16, height: 16, padding:'0 4px',
            background: t.color.wineLight || '#c74050', color:'#fff',
            borderRadius: 999, fontSize: 10, fontWeight: 700,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 0 0 2px ${t.color.bgElevated}`,
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div ref={panelRef} style={{
          position:'fixed', top: 68, insetInlineEnd: 12, insetInlineStart:'auto',
          width: 'min(360px, calc(100vw - 24px))',
          maxHeight: 'calc(100vh - 90px)',
          background: t.color.bgElevated,
          border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.md,
          boxShadow: '0 20px 48px rgba(0,0,0,0.65)',
          zIndex: 1400, display:'flex', flexDirection:'column',
        }}>
          <div style={{
            padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between',
            borderBottom: `1px solid ${t.color.hairline}`,
          }}>
            <div style={{ fontWeight: 700, color: t.color.text, fontSize: 14 }}>
              התראות {unread > 0 ? `(${unread} חדשות)` : ''}
            </div>
            {unread > 0 && (
              <button onClick={markAll} style={{
                background:'transparent', border:'none', color: t.color.textDim,
                cursor:'pointer', fontFamily:'inherit', fontSize: 11, padding: 4,
                textDecoration:'underline',
              }}>סמן הכל כנקרא</button>
            )}
          </div>

          <div style={{ overflowY:'auto', flex: 1 }}>
            {items.length === 0 ? (
              <div style={{ padding: 40, textAlign:'center', color: t.color.textDim, fontSize: 13 }}>
                אין התראות עדיין
              </div>
            ) : items.map(it => (
              it._type === 'message'
                ? <MessageRow key={it._id} item={it} onClick={() => handleClickItem(it)} />
                : <WorkoutRow key={it._id} item={it} isMine={it.user_id === user?.id} seen={seenRef.current.has(it.id)} onClick={() => handleClickItem(it)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MessageRow({ item, onClick }) {
  const c = cat(item.category)
  const unreadRow = !item.read_at
  return (
    <button
      onClick={onClick}
      style={{
        display:'block', width:'100%', textAlign:'right',
        padding:'12px 14px',
        background: unreadRow ? `${c.color}0f` : 'transparent',
        border:'none', borderBottom:`1px solid ${t.color.hairline}`,
        cursor: unreadRow ? 'pointer':'default',
        color: 'inherit', fontFamily:'inherit', direction:'rtl',
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing:'0.1em',
          textTransform:'uppercase', color: c.color,
          padding:'2px 8px', borderRadius: 999,
          background: `${c.color}18`, border: `1px solid ${c.color}44`,
        }}>{c.label}</span>
        {unreadRow && <span style={{
          width: 6, height: 6, borderRadius:'50%', background: c.color,
          marginInlineStart:'auto',
        }}/>}
      </div>
      {item.title && (
        <div style={{ fontWeight: 700, color: t.color.text, fontSize: 13, marginBottom: 2 }}>
          {item.title}
        </div>
      )}
      <div style={{ color: t.color.silver1, fontSize: 12, lineHeight: 1.5, whiteSpace:'pre-wrap' }}>
        {item.body}
      </div>
      <div style={{
        marginTop: 6, fontSize: 10, color: t.color.textMuted,
        fontFamily: t.font.family.mono, letterSpacing:'0.06em',
      }}>
        {new Date(item.created_at).toLocaleString('he-IL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
        {item.sender_name && ` · ${item.sender_name}`}
      </div>
    </button>
  )
}

function WorkoutRow({ item, isMine, seen, onClick }) {
  const color = t.color.gold
  const name = item.user_name || 'משתמש/ת'
  const workoutTitle = item.workout_data?.title || item.workout_data?.name || 'אימון'
  return (
    <button
      onClick={onClick}
      style={{
        display:'block', width:'100%', textAlign:'right',
        padding:'12px 14px',
        background: !seen ? `${color}0f` : 'transparent',
        border:'none', borderBottom:`1px solid ${t.color.hairline}`,
        cursor:'pointer', color:'inherit', fontFamily:'inherit', direction:'rtl',
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing:'0.1em',
          textTransform:'uppercase', color,
          padding:'2px 8px', borderRadius: 999,
          background: `${color}18`, border: `1px solid ${color}44`,
        }}>קהילה</span>
        {isMine && (
          <span style={{
            fontSize: 10, color: t.color.silver3, fontFamily: t.font.family.mono,
            letterSpacing:'0.14em',
          }}>שלך</span>
        )}
        {!seen && <span style={{
          width: 6, height: 6, borderRadius:'50%', background: color,
          marginInlineStart:'auto',
        }}/>}
      </div>
      <div style={{ fontWeight: 700, color: t.color.text, fontSize: 13, marginBottom: 2 }}>
        {name} שיתף אימון חדש
      </div>
      <div style={{ color: t.color.silver1, fontSize: 12, lineHeight: 1.5 }}>
        {workoutTitle}
      </div>
      <div style={{
        marginTop: 6, fontSize: 10, color: t.color.textMuted,
        fontFamily: t.font.family.mono, letterSpacing:'0.06em',
      }}>
        {new Date(item.created_at).toLocaleString('he-IL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
      </div>
    </button>
  )
}
