import React, { useCallback, useEffect, useRef, useState } from 'react'
import { t } from '../../../theme/tokens'

// Timing for a workout in progress: the countdown that starts it, the session
// clock, and the bar that keeps both in view.
//
// Both clocks are derived from wall-clock timestamps rather than counted down
// by an interval. A phone screen locks, the browser throttles background
// timers, the user checks a message — an interval loses all of that time and
// under-reports the session, and a rest timer that pauses while you actually
// rested is worse than none. Storing "when did this start" and subtracting on
// each tick means the numbers survive anything the OS does to the tab.

export const DEFAULT_REST_SEC = 90

const two = (n) => String(n).padStart(2, '0')

// mm:ss up to an hour, then h:mm:ss — a long session should not read "94:12".
export function formatClock(totalSec) {
  const s = Math.max(0, Math.floor(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${h}:${two(m)}:${two(sec)}` : `${m}:${two(sec)}`
}

// ─── Session clock ────────────────────────────────────────────────

// Counts from `startedAt` for as long as the workout is open. Returns whole
// seconds so re-renders happen once a second rather than once a frame.
export function useSessionClock(startedAt) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!startedAt) return
    const id = setInterval(() => setNow(Date.now()), 500)
    // Coming back from a locked screen should correct immediately rather than
    // waiting for the next tick.
    const onVisible = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [startedAt])

  return startedAt ? Math.floor((now - startedAt) / 1000) : 0
}

// ─── Rest timer ───────────────────────────────────────────────────

// `endsAt` is a timestamp, so time spent with the screen off still counts
// down. Fires `onDone` exactly once per rest period.
export function useRestTimer(onDone) {
  const [endsAt, setEndsAt] = useState(null)
  const [total, setTotal] = useState(DEFAULT_REST_SEC)
  const [remaining, setRemaining] = useState(0)
  const firedFor = useRef(null)

  useEffect(() => {
    if (!endsAt) { setRemaining(0); return }
    const tick = () => {
      const left = Math.ceil((endsAt - Date.now()) / 1000)
      setRemaining(Math.max(0, left))
      if (left <= 0 && firedFor.current !== endsAt) {
        firedFor.current = endsAt
        setEndsAt(null)
        onDone?.()
      }
    }
    tick()
    const id = setInterval(tick, 250)
    const onVisible = () => tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible) }
  }, [endsAt, onDone])

  const start = useCallback((seconds = DEFAULT_REST_SEC) => {
    setTotal(seconds)
    setEndsAt(Date.now() + seconds * 1000)
  }, [])

  const skip = useCallback(() => { setEndsAt(null); setRemaining(0) }, [])

  const add = useCallback((seconds) => {
    setEndsAt(prev => {
      if (!prev) return prev
      setTotal(tt => tt + seconds)
      return prev + seconds * 1000
    })
  }, [])

  return { remaining, total, running: remaining > 0, start, skip, add }
}

// A short double buzz and a tone when rest ends, so the user can look away
// from the phone. Both are best-effort: neither is available everywhere and
// neither is worth an error.
export function restEndedFeedback() {
  try { navigator.vibrate?.([120, 80, 120]) } catch { /* unsupported */ }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    osc.connect(gain); gain.connect(ctx.destination)
    // Fade out rather than cutting, which clicks.
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
    osc.onended = () => { try { ctx.close() } catch { /* already closed */ } }
  } catch { /* audio blocked — the vibration and the bar still report it */ }
}

// ─── Countdown before the workout starts ──────────────────────────

// Nothing counts until this finishes, so opening a workout by accident costs
// nothing. It does not auto-start either: the user says when they are ready,
// which is the whole point of the request.
export function StartCountdown({ session, onStart, onCancel }) {
  const [count, setCount] = useState(null)   // null = waiting for "ready"
  const exerciseCount = session?.exercises?.length || 0

  useEffect(() => {
    if (count === null) return
    if (count <= 0) { onStart(); return }
    const id = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [count, onStart])

  const waiting = count === null

  return (
    <div style={{
      position:'fixed', inset: 0, zIndex: 1200,
      background:'rgba(8,8,12,0.96)', backdropFilter:'blur(6px)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding: 24, textAlign:'center',
    }}>
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.24em',
        color: t.color.silver2, fontWeight: 700, textTransform:'uppercase', marginBottom: 10,
      }}>מתחילים</div>

      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, maxWidth: 420 }}>
        {session?.name}
      </div>
      <div style={{ fontSize: 13, color: t.color.textDim, marginBottom: 30 }}>
        {exerciseCount} תרגילים
      </div>

      {waiting ? (
        <>
          <button
            onClick={() => setCount(3)}
            style={{
              width: 190, height: 190, borderRadius:'50%',
              background: t.color.gold, color:'#0d0d14', border:'none',
              cursor:'pointer', fontFamily:'inherit',
              fontSize: 22, fontWeight: 900, marginBottom: 26,
              boxShadow:`0 0 60px ${t.color.gold}55`,
            }}
          >מוכן<br />התחל</button>
          <div style={{ fontSize: 12, color: t.color.textMuted, maxWidth: 300, lineHeight: 1.7 }}>
            השעון מתחיל רק אחרי הספירה — קח את הזמן שאתה צריך.
          </div>
        </>
      ) : (
        <>
          <div
            key={count}
            style={{
              fontSize: 130, fontWeight: 900, lineHeight: 1,
              color: t.color.gold, fontFamily: t.font.family.mono,
              marginBottom: 26,
              animation:'selanoPulse .9s ease-out',
            }}
          >{count}</div>
          <button
            onClick={() => setCount(null)}
            style={{
              background:'transparent', border:`1px solid ${t.color.border}`,
              color: t.color.text, padding:'12px 26px', borderRadius: t.radius.sm,
              cursor:'pointer', fontFamily:'inherit', fontSize: 14, fontWeight: 700,
            }}
          >רגע, המתן</button>
        </>
      )}

      <button
        onClick={onCancel}
        style={{
          marginTop: 22, background:'transparent', border:'none',
          color: t.color.textMuted, cursor:'pointer', fontFamily:'inherit',
          fontSize: 13, textDecoration:'underline', padding: 8,
        }}
      >ביטול</button>

      <style>{`@keyframes selanoPulse{from{transform:scale(1.5);opacity:.2}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  )
}

// ─── The bar ──────────────────────────────────────────────────────

// Fixed to the bottom of the viewport, not sticky inside the scroller.
// Sticky was the previous approach and it failed: the modal above it applies
// a backdrop-filter, which in Safari makes a containing block that breaks
// sticky descendants — so in a long workout the timer scrolled away and the
// user had to choose between watching the clock and seeing the exercises.
// Bottom rather than top because that is where the thumb is and where it
// covers nothing being read.
export function SessionBar({ elapsed, rest, onFinish }) {
  const pct = rest.running && rest.total ? (1 - rest.remaining / rest.total) * 100 : 0

  return (
    <div style={{
      position:'fixed', insetInline: 0, bottom: 0, zIndex: 1100,
      background: t.color.bgElevated,
      borderTop:`1px solid ${rest.running ? t.color.gold : t.color.border}`,
      padding:'10px 14px calc(10px + env(safe-area-inset-bottom))',
      boxShadow:'0 -8px 28px rgba(0,0,0,0.45)',
    }}>
      {/* Rest progress runs behind the numbers — readable without reading */}
      {rest.running && (
        <div style={{
          position:'absolute', insetInline: 0, top: 0, height: 3,
          background: t.color.border,
        }}>
          <div style={{
            height:'100%', width:`${pct}%`, background: t.color.gold,
            transition:'width .25s linear',
          }} />
        </div>
      )}

      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
        {/* Session clock — always present */}
        <div style={{ minWidth: 78 }}>
          <div style={{
            fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.16em',
            color: t.color.silver2, fontWeight: 700,
          }}>אימון</div>
          <div style={{
            fontSize: 20, fontWeight: 800, lineHeight: 1.15,
            fontFamily: t.font.family.mono, color: t.color.text,
          }}>{formatClock(elapsed)}</div>
        </div>

        {rest.running ? (
          <>
            <div style={{ flex: 1, textAlign:'center' }}>
              <div style={{
                fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.16em',
                color: t.color.gold, fontWeight: 700,
              }}>מנוחה</div>
              <div style={{
                fontSize: 26, fontWeight: 900, lineHeight: 1.1,
                fontFamily: t.font.family.mono, color: t.color.gold,
              }}>{formatClock(rest.remaining)}</div>
            </div>

            <BarButton onClick={() => rest.add(30)} label="+30" />
            <BarButton onClick={rest.skip} label="דלג" accent />
          </>
        ) : (
          <>
            <div style={{ flex: 1 }} />
            <BarButton onClick={onFinish} label="סיים אימון" accent />
          </>
        )}
      </div>
    </div>
  )
}

function BarButton({ onClick, label, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: accent ? t.color.gold : 'transparent',
        color: accent ? '#0d0d14' : t.color.text,
        border: accent ? 'none' : `1px solid ${t.color.border}`,
        padding:'10px 14px', borderRadius: t.radius.sm,
        cursor:'pointer', fontFamily:'inherit', fontSize: 13, fontWeight: 800,
        whiteSpace:'nowrap', flexShrink: 0,
      }}
    >{label}</button>
  )
}
