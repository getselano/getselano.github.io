import React, { useCallback, useEffect, useRef, useState } from 'react'
import { t } from '../../theme/tokens'

// Press and hold an item to be asked whether to delete it.
//
// A permanently visible X is a small target sitting next to the thing it
// destroys, which on a phone means deleting by accident while scrolling. A
// long press cannot be hit by mistake, and it is the gesture people already
// know from their photo library and home screen.
//
// The hold is confirmed twice over: a progress ring shows it registering, and
// a sheet asks before anything is removed.

const HOLD_MS = 550

export function useLongPress({ onTrigger, ms = HOLD_MS, disabled }) {
  const timer = useRef(null)
  const startedAt = useRef(0)
  const origin = useRef({ x: 0, y: 0 })
  const fired = useRef(false)
  const [progress, setProgress] = useState(0)
  const raf = useRef(null)

  const clear = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null }
    setProgress(0)
  }, [])

  useEffect(() => clear, [clear])

  const start = useCallback((e) => {
    if (disabled) return
    // Ignore anything but a primary press, so a right-click or a second
    // finger does not start a hold.
    if (e.button != null && e.button !== 0) return
    const point = e.touches?.[0] || e
    origin.current = { x: point.clientX ?? 0, y: point.clientY ?? 0 }
    fired.current = false
    startedAt.current = Date.now()

    const tick = () => {
      const elapsed = Date.now() - startedAt.current
      setProgress(Math.min(1, elapsed / ms))
      if (elapsed < ms) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    timer.current = setTimeout(() => {
      fired.current = true
      clear()
      // A hold that has done something should feel like it did.
      try { navigator.vibrate?.(18) } catch { /* unsupported */ }
      onTrigger()
    }, ms)
  }, [disabled, ms, onTrigger, clear])

  // Scrolling starts as a press. Moving out of a small radius means the user
  // is scrolling the list, not holding an item, so the hold is abandoned.
  const move = useCallback((e) => {
    if (!timer.current) return
    const point = e.touches?.[0] || e
    const dx = (point.clientX ?? 0) - origin.current.x
    const dy = (point.clientY ?? 0) - origin.current.y
    if (Math.hypot(dx, dy) > 10) clear()
  }, [clear])

  const end = useCallback(() => clear(), [clear])

  return {
    progress,
    // True while a hold just completed, so the click it produces can be
    // swallowed instead of also opening the item.
    consumedClick: () => {
      if (!fired.current) return false
      fired.current = false
      return true
    },
    handlers: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: end,
      onPointerLeave: end,
      onPointerCancel: end,
      // Holding an image or a link otherwise raises the browser's own menu.
      onContextMenu: (e) => e.preventDefault(),
    },
  }
}

// The ring that fills while the finger is down.
export function HoldIndicator({ progress }) {
  if (!progress) return null
  const size = 34
  const r = 14
  const circ = 2 * Math.PI * r
  return (
    <div style={{
      position:'absolute', inset: 0, display:'grid', placeItems:'center',
      pointerEvents:'none', background:'rgba(0,0,0,0.35)',
      borderRadius: t.radius.md, zIndex: 2,
    }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={t.color.border} strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={t.color.danger} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)} />
      </svg>
    </div>
  )
}

// The question itself. A sheet rather than window.confirm, which on iOS names
// the website in the dialog and reads like a browser warning rather than part
// of the app.
export function ConfirmDeleteSheet({ open, title, body, confirmLabel = 'מחק', onConfirm, onCancel }) {
  // Escape should cancel, and the page behind must not scroll under the sheet.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      onClick={onCancel}
      style={{
        position:'fixed', inset: 0, zIndex: 9999,
        background:'rgba(0,0,0,0.6)', backdropFilter:'blur(2px)',
        display:'flex', alignItems:'flex-end', justifyContent:'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width:'100%', maxWidth: 460,
          background: t.color.bgElevated,
          borderTop:`1px solid ${t.color.border}`,
          borderRadius: `${t.radius.md} ${t.radius.md} 0 0`,
          padding:'20px 18px calc(20px + env(safe-area-inset-bottom))',
          boxShadow:'0 -12px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          width: 38, height: 4, borderRadius: 999, background: t.color.border,
          margin:'0 auto 16px',
        }} />

        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{title}</div>
        {body && (
          <div style={{ fontSize: 13, color: t.color.textDim, lineHeight: 1.7, marginBottom: 18 }}>
            {body}
          </div>
        )}

        <div style={{ display:'grid', gap: 8 }}>
          <button
            onClick={onConfirm}
            style={{
              width:'100%', padding: 14, cursor:'pointer', fontFamily:'inherit',
              background: t.color.danger, color:'#fff', border:'none',
              borderRadius: t.radius.sm, fontSize: 15, fontWeight: 800,
            }}
          >{confirmLabel}</button>

          <button
            onClick={onCancel}
            style={{
              width:'100%', padding: 14, cursor:'pointer', fontFamily:'inherit',
              background:'transparent', color: t.color.text,
              border:`1px solid ${t.color.border}`,
              borderRadius: t.radius.sm, fontSize: 15, fontWeight: 700,
            }}
          >ביטול</button>
        </div>
      </div>
    </div>
  )
}
