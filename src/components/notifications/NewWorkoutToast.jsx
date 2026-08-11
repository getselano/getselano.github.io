import React, { useEffect, useState } from 'react'
import { t } from '../../theme/tokens'
import { useApp } from '../../store/AppStore'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/i18n'
import { findNewlyUnlocked } from '../../data/unlockableWorkouts'

// New workout toast — checks the unlockable pool on mount, shows a soft
// gold toast for the first workout the trainee hasn't seen yet, and
// stamps its id so it never re-shows for the same workout.
//
// Trigger source: elapsed time since profile.onboardedAt (or the first
// time the user opened the app if onboardedAt is missing). Filters by
// profile.sex so men and women get their respective pools.

const SEEN_IDS_KEY = 'hfos:seen_unlocks'
const APP_FIRST_OPEN_KEY = 'hfos:first_open'
const INITIAL_DELAY_MS = 4_000
const AUTO_DISMISS_MS = 10_000

function readSeen() {
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
function writeSeen(ids) {
  try { localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(ids)) } catch {}
}
function getStartedAt(profile) {
  // Prefer profile.onboardedAt (authoritative). Fall back to the first
  // time this device opened the app — stamped once on first load.
  if (profile?.onboardedAt) return new Date(profile.onboardedAt).getTime()
  try {
    const stored = localStorage.getItem(APP_FIRST_OPEN_KEY)
    if (stored) return parseInt(stored, 10)
    const now = Date.now()
    localStorage.setItem(APP_FIRST_OPEN_KEY, String(now))
    return now
  } catch { return Date.now() }
}

export function NewWorkoutToast() {
  const { state } = useApp()
  const { user } = useAuth()
  const { isRTL } = useI18n()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [workout, setWorkout] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!user) return
    const seenIds = readSeen()
    const startedAt = getStartedAt(state?.profile)
    const newlyUnlocked = findNewlyUnlocked({
      startedAt,
      seenIds,
      sex: state?.profile?.sex,
    })
    if (!newlyUnlocked.length) return
    // Show the earliest-unlocking one first (they're already ordered by weeks)
    setWorkout(newlyUnlocked[0])

    const enterTimer = setTimeout(() => setVisible(true), INITIAL_DELAY_MS)
    const leaveTimer = setTimeout(() => setLeaving(true), INITIAL_DELAY_MS + AUTO_DISMISS_MS)
    const removeTimer = setTimeout(() => {
      writeSeen([...seenIds, newlyUnlocked[0].id])
      setVisible(false)
    }, INITIAL_DELAY_MS + AUTO_DISMISS_MS + 500)
    return () => { clearTimeout(enterTimer); clearTimeout(leaveTimer); clearTimeout(removeTimer) }
  }, [user, state?.profile?.sex])

  const dismiss = () => {
    if (workout) writeSeen([...readSeen(), workout.id])
    setLeaving(true)
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible || !workout) return null

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(20px + env(safe-area-inset-top))',
      insetInlineStart: '50%',
      transform: `translateX(${isRTL ? '50%' : '-50%'}) ${leaving ? 'translateY(-20px)' : 'translateY(0)'}`,
      opacity: leaving ? 0 : 1,
      transition: 'opacity 300ms ease, transform 300ms ease',
      zIndex: 500,
      maxWidth: 'min(440px, calc(100vw - 24px))',
      pointerEvents: 'auto',
    }}>
      <div style={{
        position: 'relative',
        padding: '16px 40px 16px 18px',
        background: `linear-gradient(135deg, ${t.color.charcoal} 0%, ${t.color.bgElevated} 100%)`,
        border: `1px solid ${t.color.gold}66`,
        borderRadius: t.radius.lg,
        boxShadow: '0 20px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(199,143,58,0.18)',
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
          {isRTL ? 'אימון חדש התווסף למאגר!' : 'New workout unlocked!'}
        </div>

        <div style={{
          fontFamily: t.font.family.hebrew,
          fontSize: 16, fontWeight: 800, color: t.color.bone,
          letterSpacing: '-0.01em', marginBottom: 4,
        }}>
          {workout.name}
        </div>

        <div style={{
          fontSize: 12, lineHeight: 1.5, color: t.color.silver1, marginBottom: 6,
        }}>
          {workout.tagline}
        </div>

        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10,
          color: t.color.silver2, letterSpacing: '0.04em',
        }}>
          {workout.schema}
        </div>

        <div style={{
          marginTop: 10, fontSize: 13, color: t.color.wineLight, fontWeight: 800,
          letterSpacing: '-0.005em',
        }}>
          {isRTL ? 'בהצלחה!' : 'Good luck!'}
        </div>
      </div>
    </div>
  )
}
