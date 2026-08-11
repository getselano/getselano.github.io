import React, { useEffect, useRef, useState } from 'react'
import { t } from '../../theme/tokens'
import { useAuth } from '../../auth/AuthContext'
import {
  listMessagesForMember, subscribeToMemberMessages, MESSAGE_CATEGORIES,
} from '../../services/adminMessages'

// Top-of-screen slide-down toast for admin messages. Displays for 3s then
// auto-dismisses. Uses localStorage to remember which message ids have been
// "shown as toast" so a returning user doesn't get slammed with old ones.

const SEEN_KEY = 'hfos:admin_toast_seen'
const TOAST_MS = 3000

function loadSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')) }
  catch { return new Set() }
}
function saveSeen(set) {
  try {
    // Cap to last 500 ids to keep localStorage small
    const arr = Array.from(set).slice(-500)
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr))
  } catch { /* noop */ }
}

const cat = (key) => MESSAGE_CATEGORIES.find(c => c.key === key) || MESSAGE_CATEGORIES[0]

export function AdminMessageToast() {
  const { user } = useAuth()
  const [current, setCurrent] = useState(null)
  const seenRef = useRef(loadSeen())
  const queueRef = useRef([]) // pending toasts

  // Take the next pending toast from the queue
  const showNext = () => {
    const next = queueRef.current.shift()
    if (!next) { setCurrent(null); return }
    seenRef.current.add(next.id)
    saveSeen(seenRef.current)
    setCurrent(next)
    setTimeout(() => {
      setCurrent(null)
      setTimeout(showNext, 250) // brief gap before next
    }, TOAST_MS)
  }

  const enqueue = (row) => {
    if (seenRef.current.has(row.id)) return
    queueRef.current.push(row)
    if (!current) showNext()
  }

  useEffect(() => {
    if (!user?.id) return
    let alive = true
    // On mount: fetch recent messages and enqueue any never-shown ones
    // that arrived while the user was offline (within the last day).
    ;(async () => {
      const rows = await listMessagesForMember(user.id)
      if (!alive) return
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      const fresh = rows
        .filter(m => new Date(m.created_at).getTime() > cutoff)
        .filter(m => !seenRef.current.has(m.id))
        .reverse() // oldest-first so the flow feels chronological
      fresh.forEach(m => queueRef.current.push(m))
      if (queueRef.current.length && !current) showNext()
    })()

    // Realtime — enqueue as they arrive
    const unsub = subscribeToMemberMessages(user.id, enqueue)
    return () => { alive = false; unsub() }
  }, [user?.id])

  if (!current) return null
  const c = cat(current.category)

  return (
    <div style={{
      position:'fixed', top: 20, insetInlineStart: 0, insetInlineEnd: 0,
      display:'flex', justifyContent:'center', zIndex: 2000,
      padding:'0 16px', pointerEvents:'none',
    }}>
      <div
        onClick={() => setCurrent(null)}
        style={{
          maxWidth: 480, width:'100%',
          background: t.color.bgElevated,
          border: `1px solid ${c.color}88`,
          borderRadius: t.radius.md,
          padding:'14px 16px',
          boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 24px ${c.color}33`,
          direction:'rtl', pointerEvents:'auto', cursor:'pointer',
          animation: 'hfos-toast-in .28s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing:'0.14em',
            textTransform:'uppercase', color: c.color,
            padding:'3px 10px', borderRadius: 999,
            background: `${c.color}18`, border: `1px solid ${c.color}44`,
          }}>{c.label}</span>
          {current.sender_name && (
            <span style={{ fontSize: 11, color: t.color.textMuted, marginInlineStart:'auto' }}>
              {current.sender_name}
            </span>
          )}
        </div>
        {current.title && (
          <div style={{ fontWeight: 700, color: t.color.text, fontSize: 15, marginBottom: 4 }}>
            {current.title}
          </div>
        )}
        <div style={{ color: t.color.silver1, fontSize: 13, lineHeight: 1.5, whiteSpace:'pre-wrap' }}>
          {current.body}
        </div>
      </div>
      <style>{`
        @keyframes hfos-toast-in {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
