import React, { useEffect, useRef, useState } from 'react'
import { t } from '../../theme/tokens'
import { useAuth } from '../../auth/AuthContext'
import { subscribeToFeed } from '../../services/sharedWorkouts'

// Toast that pops when someone ELSE publishes a workout to the community feed.
// Publisher never sees their own toast. Also stores seen-ids in localStorage
// so a refresh doesn't re-show ones we've already flashed.

const SEEN_KEY = 'hfos:shared_workout_seen'
const TOAST_MS = 3000

function loadSeen() {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')) }
  catch { return new Set() }
}
function saveSeen(set) {
  try {
    const arr = Array.from(set).slice(-500)
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr))
  } catch {}
}

export function NewSharedWorkoutToast({ onOpenCommunity }) {
  const { user } = useAuth()
  const [current, setCurrent] = useState(null)
  const seenRef = useRef(loadSeen())
  const queueRef = useRef([])

  const showNext = () => {
    const next = queueRef.current.shift()
    if (!next) { setCurrent(null); return }
    seenRef.current.add(next.id)
    saveSeen(seenRef.current)
    setCurrent(next)
    setTimeout(() => {
      setCurrent(null)
      setTimeout(showNext, 250)
    }, TOAST_MS)
  }

  useEffect(() => {
    if (!user?.id) return
    const unsub = subscribeToFeed({
      onInsertWorkout: (row) => {
        if (!row) return
        if (row.user_id === user.id) return   // skip own
        if (seenRef.current.has(row.id)) return
        queueRef.current.push(row)
        if (!current) showNext()
      },
    })
    return unsub
  }, [user?.id])

  if (!current) return null

  const name = current.user_name || 'משתמש/ת'

  return (
    <div style={{
      position:'fixed', top: 20, insetInlineStart: 0, insetInlineEnd: 0,
      display:'flex', justifyContent:'center', zIndex: 2000,
      padding:'0 16px', pointerEvents:'none',
    }}>
      <div
        onClick={() => { setCurrent(null); onOpenCommunity?.() }}
        style={{
          maxWidth: 480, width:'100%',
          background: t.color.bgElevated,
          border: `1px solid ${t.color.gold}88`,
          borderRadius: t.radius.md,
          padding:'14px 16px',
          boxShadow: `0 12px 40px rgba(0,0,0,0.5), 0 0 24px ${t.color.gold}33`,
          direction:'rtl', pointerEvents:'auto', cursor:'pointer',
          animation:'hfos-share-toast-in .28s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing:'0.14em',
          textTransform:'uppercase', color: t.color.gold,
          padding:'3px 10px', borderRadius: 999,
          background: `${t.color.gold}18`, border: `1px solid ${t.color.gold}44`,
          display:'inline-block', marginBottom: 6,
        }}>קהילה</div>
        <div style={{ fontWeight: 700, color: t.color.text, fontSize: 15, marginBottom: 2 }}>
          {name} שיתף אימון חדש
        </div>
        <div style={{ color: t.color.silver1, fontSize: 12, lineHeight: 1.4 }}>
          לחץ לצפייה בפיד הקהילה
        </div>
      </div>
      <style>{`
        @keyframes hfos-share-toast-in {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
