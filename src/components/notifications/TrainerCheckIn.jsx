import React, { useEffect, useState } from 'react'
import { t } from '../../theme/tokens'
import { useApp } from '../../store/AppStore'
import { useAuth } from '../../auth/AuthContext'
import { readHealthAck } from '../legal/HealthAcknowledgment'
import { useI18n } from '../../i18n/i18n'

// Trainer check-in — a soft toast that pops up every 3 days asking the
// trainee how they're doing. Purely informational: no CTA button, no
// WhatsApp handoff, just a warm nudge that we're here.
//
// Persistence: last-shown timestamp in localStorage. Interval is 3 days
// (72h). On first visit it waits ~10s after mount before showing so it
// doesn't collide with the greeting or the daily-boost toast.

const LAST_SHOWN_KEY = 'hfos:trainer_checkin_shown'
const INTERVAL_MS = 3 * 24 * 60 * 60 * 1000   // 3 days
const INITIAL_DELAY_MS = 10_000                // 10s after mount
const AUTO_DISMISS_MS = 9_000                  // stays 9s on screen

function pickFirstName(profile, user) {
  // Same resolution chain as Home — try in order:
  // profile → auth → signed health-ack → email prefix (prettified) → fallback
  if (profile?.name) return profile.name.split(' ')[0]
  if (user?.name) return user.name.split(' ')[0]
  const ack = readHealthAck()
  if (ack?.signerName) return ack.signerName.split(' ')[0]
  const email = user?.email
  if (email) {
    const raw = String(email).split('@')[0].replace(/[0-9]+$/, '')
    const first = raw.split(/[._-]/)[0]
    if (first) return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
  }
  return ''
}

export function TrainerCheckIn() {
  const { state } = useApp()
  const { user } = useAuth()
  const { isRTL } = useI18n()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const lastShown = parseInt(localStorage.getItem(LAST_SHOWN_KEY) || '0', 10)
    // If it's the very first time (never shown), stamp NOW-INTERVAL so the
    // first check-in only fires 3 days after signup, not on first login.
    if (!lastShown) {
      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()))
      return
    }
    if (Date.now() - lastShown < INTERVAL_MS) return

    const enterTimer = setTimeout(() => setVisible(true), INITIAL_DELAY_MS)
    const leaveTimer = setTimeout(() => setLeaving(true), INITIAL_DELAY_MS + AUTO_DISMISS_MS)
    const removeTimer = setTimeout(() => {
      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()))
      setVisible(false)
    }, INITIAL_DELAY_MS + AUTO_DISMISS_MS + 500)
    return () => { clearTimeout(enterTimer); clearTimeout(leaveTimer); clearTimeout(removeTimer) }
  }, [])

  const dismiss = () => {
    localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()))
    setLeaving(true)
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible) return null

  const firstName = pickFirstName(state?.profile, user)
  const greeting = firstName
    ? (isRTL ? `היי ${firstName}` : `Hey ${firstName}`)
    : (isRTL ? 'היי' : 'Hey')

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(20px + env(safe-area-inset-top))',
      insetInlineStart: '50%',
      transform: `translateX(${isRTL ? '50%' : '-50%'}) ${leaving ? 'translateY(-20px)' : 'translateY(0)'}`,
      opacity: leaving ? 0 : 1,
      transition: 'opacity 300ms ease, transform 300ms ease',
      zIndex: 500,
      maxWidth: 'min(420px, calc(100vw - 24px))',
      pointerEvents: 'auto',
    }}>
      <div style={{
        position: 'relative',
        padding: '16px 40px 16px 18px',
        background: `linear-gradient(135deg, ${t.color.charcoal} 0%, ${t.color.bgElevated} 100%)`,
        border: `1px solid ${t.color.wineLight}55`,
        borderRadius: t.radius.lg,
        boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(199,64,80,0.14)',
        color: t.color.text,
      }}>
        <button
          onClick={dismiss}
          aria-label={isRTL ? 'סגור' : 'Close'}
          style={{
            position: 'absolute',
            top: 6, insetInlineEnd: 6,
            width: 28, height: 28,
            background: 'transparent', border: 'none',
            color: t.color.silver2, cursor: 'pointer',
            fontSize: 20, lineHeight: 1,
          }}
        >×</button>

        <div style={{
          fontFamily: t.font.family.mono, fontSize: 9, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: t.color.gold, marginBottom: 6, fontWeight: 700,
        }}>
          {isRTL ? 'צ׳ק-אין' : 'Check-in'}
        </div>

        <div style={{
          fontFamily: t.font.family.hebrew,
          fontSize: 17, fontWeight: 800, color: t.color.bone,
          letterSpacing: '-0.01em', marginBottom: 4,
        }}>
          {greeting}
        </div>

        <div style={{
          fontSize: 14, lineHeight: 1.5, color: t.color.silver1, marginBottom: 6,
        }}>
          {isRTL ? 'מה קורה? איך הולך באימונים?' : 'How are you doing with the workouts?'}
        </div>

        <div style={{
          fontSize: 13, color: t.color.wineLight, fontWeight: 700,
          letterSpacing: '-0.005em',
        }}>
          {isRTL ? 'אני פה לכל דבר.' : 'I\'m here for anything.'}
        </div>
      </div>
    </div>
  )
}
