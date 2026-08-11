import React, { useEffect, useRef, useState } from 'react'
import { t } from '../../theme/tokens'
import { useI18n } from '../../i18n/i18n'
import { Button } from '../ui/UI'

// Real camera-based barcode scanner using the native BarcodeDetector API.
// Works on Chrome/Edge/Samsung Internet mobile + desktop, and on Safari 17+
// (iOS 17+). If the API is missing, we surface a clear "not supported"
// message and let the parent fall back to manual entry.
//
// Usage: <BarcodeScanner onDetected={(code) => …} onClose={() => …} />

const SUPPORTED_FORMATS = [
  'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf',
]

export function BarcodeScanner({ onDetected, onClose }) {
  const { isRTL } = useI18n()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const detectorRef = useRef(null)
  const scanningRef = useRef(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('init') // init | streaming | detected

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      // 1. Feature-detect the API
      if (typeof window === 'undefined' || !('BarcodeDetector' in window)) {
        setError(isRTL
          ? 'הדפדפן שלך לא תומך בסריקת ברקוד מובנית. השתמש/י בהזנה ידנית או פתח/י את האתר בכרום/ספארי עדכניים.'
          : 'Your browser doesn\'t support built-in barcode scanning. Use manual entry, or open the app in a recent Chrome/Safari.')
        return
      }
      try {
        // eslint-disable-next-line no-undef
        detectorRef.current = new BarcodeDetector({ formats: SUPPORTED_FORMATS })
      } catch (err) {
        setError(isRTL
          ? 'לא ניתן לאתחל את סורק הברקוד.'
          : 'Failed to initialize the barcode detector.')
        return
      }

      // 2. Ask for camera permission (prefer back camera on mobile)
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
      } catch (err) {
        setError(isRTL
          ? 'לא ניתן לגשת למצלמה. ודא/י שנתת הרשאה לאתר וסגור/י אפליקציות אחרות שמשתמשות במצלמה.'
          : 'Can\'t access the camera. Make sure you granted permission and close other apps using the camera.')
        return
      }
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        video.setAttribute('playsinline', 'true')
        try { await video.play() } catch {}
      }
      setStatus('streaming')
      scanningRef.current = true
      scanLoop()
    })()

    return () => {
      cancelled = true
      scanningRef.current = false
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scanLoop = async () => {
    const video = videoRef.current
    if (!video || !detectorRef.current) return
    while (scanningRef.current) {
      if (video.readyState >= 2) {
        try {
          const codes = await detectorRef.current.detect(video)
          if (codes && codes.length) {
            const first = codes[0]
            scanningRef.current = false
            setStatus('detected')
            // Small haptic if supported
            try { navigator.vibrate?.(80) } catch {}
            onDetected?.(String(first.rawValue || ''))
            return
          }
        } catch {}
      }
      await new Promise(r => setTimeout(r, 250))
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      color: t.color.bone,
    }}>
      {/* Video canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
          }}
          muted playsInline
        />

        {/* Sight overlay — a wine viewfinder box */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 'min(80vw, 320px)', height: 'min(35vw, 160px)',
            border: `2px solid ${t.color.wineLight}`,
            borderRadius: 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            position: 'relative',
          }}>
            {/* corner ticks */}
            {['top left', 'top right', 'bottom left', 'bottom right'].map(k => {
              const [v, h] = k.split(' ')
              return (
                <span key={k} style={{
                  position: 'absolute',
                  [v]: -4, [h]: -4,
                  width: 24, height: 24,
                  borderTop: v === 'top' ? `3px solid ${t.color.white}` : 'none',
                  borderBottom: v === 'bottom' ? `3px solid ${t.color.white}` : 'none',
                  borderLeft: h === 'left' ? `3px solid ${t.color.white}` : 'none',
                  borderRight: h === 'right' ? `3px solid ${t.color.white}` : 'none',
                }} />
              )
            })}
            {/* Scanning line animation */}
            {status === 'streaming' && (
              <div style={{
                position: 'absolute', left: 0, right: 0, top: 0,
                height: 2, background: t.color.wineLight,
                animation: 'scanline 1.6s ease-in-out infinite',
                boxShadow: `0 0 12px ${t.color.wineLight}`,
              }} />
            )}
          </div>
        </div>

        <style>{`
          @keyframes scanline {
            0%   { transform: translateY(0); opacity: 1; }
            50%  { transform: translateY(140px); opacity: 1; }
            100% { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Status pill */}
        <div style={{
          position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
          padding: '8px 18px',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          borderRadius: 999,
          fontFamily: t.font.family.mono,
          fontSize: 11, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: t.color.bone,
        }}>
          {status === 'init' && (isRTL ? 'מפעיל מצלמה…' : 'Starting camera…')}
          {status === 'streaming' && (isRTL ? 'מכוון את הברקוד לתוך המסגרת' : 'Point the barcode into the frame')}
          {status === 'detected' && (isRTL ? 'נמצא ברקוד' : 'Barcode found')}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: '16px 20px calc(16px + env(safe-area-inset-bottom))',
        background: t.color.charcoal,
        borderTop: `1px solid ${t.color.border}`,
        display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between',
      }}>
        {error ? (
          <div style={{
            flex: 1, fontSize: 13, color: t.color.warning, lineHeight: 1.5,
            letterSpacing: '-0.005em',
          }}>{error}</div>
        ) : (
          <div style={{
            flex: 1,
            fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.22em',
            color: t.color.silver2, textTransform: 'uppercase',
          }}>{isRTL ? 'סריקה אוטומטית פעילה' : 'Auto-scanning'}</div>
        )}
        <Button variant="ghost" onClick={onClose}>{isRTL ? 'סגור' : 'Close'}</Button>
      </div>
    </div>
  )
}
