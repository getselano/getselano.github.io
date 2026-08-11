import React, { useEffect, useRef, useState } from 'react'
import { t } from '../../theme/tokens'
import { useI18n } from '../../i18n/i18n'

// Canvas-based signature pad. Captures the user's handwritten
// signature as strokes, exports a trimmed PNG data URL. Works
// with mouse + touch (pointer events).
//
// Props:
//   onChange(dataUrl | null)  — fires when signature changes / is cleared
//   height (default 180)      — pad height in px

export function SignaturePad({ onChange, height = 180 }) {
  const { isRTL } = useI18n()
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const [hasSignature, setHasSignature] = useState(false)

  // Setup canvas + DPI scaling
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = '#f5f0e6'
    ctxRef.current = ctx
  }, [])

  const posFromEvent = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e) => {
    e.preventDefault()
    canvasRef.current.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = posFromEvent(e)
    const ctx = ctxRef.current
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    // Draw a small dot in case of a single tap
    ctx.arc(last.current.x, last.current.y, 1, 0, Math.PI * 2)
    ctx.fill()
  }
  const onPointerMove = (e) => {
    if (!drawing.current) return
    const pos = posFromEvent(e)
    const ctx = ctxRef.current
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    last.current = pos
  }
  const onPointerUp = (e) => {
    if (!drawing.current) return
    drawing.current = false
    canvasRef.current.releasePointerCapture(e.pointerId)
    setHasSignature(true)
    // Report the current signature back
    try {
      onChange?.(canvasRef.current.toDataURL('image/png'))
    } catch {
      onChange?.(null)
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onChange?.(null)
  }

  return (
    <div>
      <div style={{
        position: 'relative',
        background: '#0a0806',
        border: `1px solid ${hasSignature ? t.color.wineLight : t.color.border}`,
        borderRadius: t.radius.md,
        height,
        overflow: 'hidden',
        transition: t.transition,
      }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            width: '100%', height: '100%',
            touchAction: 'none', cursor: 'crosshair',
            display: 'block',
          }}
        />
        {/* Guide line + prompt when empty */}
        {!hasSignature && (
          <>
            <div style={{
              position: 'absolute',
              left: '10%', right: '10%', bottom: '35%',
              borderTop: `1px dashed ${t.color.border}`,
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute',
              inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
              fontSize: 12, color: t.color.silver2,
              fontFamily: t.font.family.mono, letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}>
              {isRTL ? 'חתום כאן — אצבע או עכבר' : 'Sign here — finger or mouse'}
            </div>
          </>
        )}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 8,
      }}>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.2em',
          color: hasSignature ? '#4a9c6a' : t.color.silver2, fontWeight: 600,
          textTransform: 'uppercase',
        }}>
          {hasSignature ? (isRTL ? 'נחתם' : 'Signed') : (isRTL ? 'ממתין לחתימה' : 'Awaiting signature')}
        </div>
        <button
          type="button"
          onClick={clear}
          disabled={!hasSignature}
          style={{
            background: 'transparent',
            border: `1px solid ${t.color.border}`,
            color: hasSignature ? t.color.silver1 : t.color.silver2,
            fontFamily: 'inherit', fontSize: 11, fontWeight: 600,
            padding: '5px 12px', borderRadius: t.radius.sm,
            cursor: hasSignature ? 'pointer' : 'default',
            opacity: hasSignature ? 1 : 0.5,
          }}
        >
          {isRTL ? 'נקה חתימה' : 'Clear signature'}
        </button>
      </div>
    </div>
  )
}
