import React, { useState, useEffect } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { useI18n } from '../../../i18n/i18n'
import { Card, Button, Input, Modal } from '../../../components/ui/UI'
import { Kicker, SectionHead, Label, Button as SButton } from '../../../design/components/primitives'
import {
  requestNotificationPermission, notificationPermission,
  fireReminder, DEFAULT_REMINDERS,
} from '../../../utils/reminders'

export function Reminders() {
  const { state, updateReminders } = useApp()
  const { isRTL } = useI18n()

  const settings = state.reminders || DEFAULT_REMINDERS
  const [perm, setPerm] = useState(() => notificationPermission())
  const [testFired, setTestFired] = useState(false)

  useEffect(() => {
    const handler = () => setPerm(notificationPermission())
    window.addEventListener('focus', handler)
    return () => window.removeEventListener('focus', handler)
  }, [])

  const askPermission = async () => {
    const result = await requestNotificationPermission()
    setPerm(result)
    if (result === 'granted' && !settings.enabled) {
      updateReminders({ enabled: true })
    }
  }

  const toggleEnabled = () => {
    if (!settings.enabled && perm !== 'granted') {
      askPermission()
      return
    }
    updateReminders({ enabled: !settings.enabled })
  }

  const updateMeal = (key, patch) => {
    updateReminders({
      meals: {
        ...settings.meals,
        [key]: { ...settings.meals[key], ...patch },
      },
    })
  }

  const updateWorkout = (dow, patch) => {
    updateReminders({
      workouts: {
        ...settings.workouts,
        [dow]: { ...settings.workouts[dow], ...patch },
      },
    })
  }

  const testNotification = () => {
    fireReminder(
      'test-' + Date.now(),
      isRTL ? 'בדיקת התראה' : 'Test notification',
      isRTL ? 'Selano · ההתראות עובדות. יופי.' : 'Selano · reminders are working. Nice.',
    )
    setTestFired(true)
    setTimeout(() => setTestFired(false), 3000)
  }

  const mealLabels = isRTL
    ? { breakfast: 'ארוחת בוקר', lunch: 'ארוחת צהריים', dinner: 'ארוחת ערב', snack: 'נשנוש' }
    : { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }

  const dayNames = isRTL
    ? ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
    : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Hero + master toggle */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: t.radius.xl,
        border: `1px solid ${t.color.hairline}`,
        background: `linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.65) 100%), linear-gradient(160deg, ${t.color.panel2} 0%, ${t.color.charcoal} 100%)`,
        padding: '24px 24px 26px',
      }}>
        <div style={{
          position: 'absolute', top: '-30%', insetInlineEnd: '-20%',
          width: 340, height: 340,
          background: `radial-gradient(circle, ${t.color.wineGlow} 0%, transparent 55%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 2, marginBottom: 12 }}>
          <Kicker>{isRTL ? 'התראות אישיות' : 'Personal reminders'}</Kicker>
        </div>
        <SectionHead size="h2" style={{ position: 'relative', zIndex: 2, marginBottom: 12 }}
          emphasis={settings.enabled ? (isRTL ? 'פעילות' : 'ON') : (isRTL ? 'כבויות' : 'OFF')}>
          {isRTL ? 'תזכורות ארוחות ואימונים' : 'Meal & workout reminders'}
        </SectionHead>
        <div style={{
          position: 'relative', zIndex: 2,
          color: t.color.silver1, fontSize: 14, lineHeight: 1.5,
          letterSpacing: '-0.005em', maxWidth: 520, marginBottom: 20,
        }}>
          {isRTL
            ? 'הגדר זמנים לארוחות ואימונים — האפליקציה תדחוף לך תזכורת בהתראת דפדפן כשמגיע הזמן.'
            : 'Set times for meals and workouts — the app pushes you a browser notification when it\'s time.'}
        </div>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <SButton variant="primary" onClick={toggleEnabled}>
            {settings.enabled
              ? (isRTL ? 'כבה התראות' : 'Turn reminders off')
              : (isRTL ? 'הפעל התראות' : 'Turn reminders on')}
          </SButton>
          <SButton variant="ghost" onClick={testNotification} disabled={perm !== 'granted'}>
            {testFired ? (isRTL ? 'נשלח' : 'Sent') : (isRTL ? 'שלח בדיקה' : 'Send test')}
          </SButton>
        </div>
      </div>

      {/* Permission notice */}
      {perm === 'unsupported' && (
        <NoticeBanner tone="warn">
          {isRTL
            ? 'הדפדפן שלך לא תומך בהתראות. נסה מכשיר אחר או דפדפן עדכני.'
            : 'Your browser doesn\'t support notifications. Try a modern browser or another device.'}
        </NoticeBanner>
      )}
      {perm === 'denied' && (
        <NoticeBanner tone="warn">
          {isRTL
            ? 'חסמת התראות בדפדפן. פתח את הגדרות האתר בדפדפן והפעל התראות כדי לקבל תזכורות.'
            : 'You blocked notifications in the browser. Open site settings in your browser and allow notifications.'}
        </NoticeBanner>
      )}
      {perm === 'default' && (
        <NoticeBanner tone="info">
          {isRTL
            ? 'הדפדפן ישאל אישור להתראות. אשר כדי לקבל תזכורות בזמן אמת.'
            : 'The browser will ask permission for notifications. Allow to receive real-time reminders.'}
        </NoticeBanner>
      )}

      {/* Meals */}
      <div style={{
        background: t.color.panel, border: `1px solid ${t.color.border}`,
        borderRadius: t.radius.lg, padding: 20,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${t.color.border}`,
        }}>
          <Kicker color="wine">{isRTL ? 'תזכורות ארוחות' : 'Meal reminders'}</Kicker>
          <Label color={t.color.silver3}>
            {Object.values(settings.meals || {}).filter(m => m?.enabled).length} {isRTL ? 'פעילות' : 'active'}
          </Label>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map(key => {
            const meal = settings.meals?.[key] || { at: '08:00', enabled: false }
            return (
              <TimeRow
                key={key}
                label={mealLabels[key]}
                enabled={meal.enabled}
                time={meal.at}
                onToggle={() => updateMeal(key, { enabled: !meal.enabled })}
                onTimeChange={(at) => updateMeal(key, { at })}
                isRTL={isRTL}
              />
            )
          })}
        </div>
      </div>

      {/* Workouts */}
      <div style={{
        background: t.color.panel, border: `1px solid ${t.color.border}`,
        borderRadius: t.radius.lg, padding: 20,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${t.color.border}`,
        }}>
          <Kicker color="wine">{isRTL ? 'תזכורות אימונים' : 'Workout reminders'}</Kicker>
          <Label color={t.color.silver3}>
            {Object.values(settings.workouts || {}).filter(w => w?.enabled).length} {isRTL ? 'ימים' : 'days'}
          </Label>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {[0, 1, 2, 3, 4, 5, 6].map(dow => {
            const w = settings.workouts?.[dow] || { at: '18:00', enabled: false }
            return (
              <TimeRow
                key={dow}
                label={dayNames[dow]}
                enabled={w.enabled}
                time={w.at}
                onToggle={() => updateWorkout(dow, { enabled: !w.enabled })}
                onTimeChange={(at) => updateWorkout(dow, { at })}
                isRTL={isRTL}
              />
            )
          })}
        </div>
      </div>

      {/* Reliability note */}
      <div style={{
        padding: 14, background: t.color.panel, border: `1px solid ${t.color.border}`,
        borderRadius: t.radius.md, fontSize: 12, lineHeight: 1.6,
        color: t.color.silver2, letterSpacing: '-0.005em',
      }}>
        <Label color={t.color.silver3}>{isRTL ? 'איך זה עובד' : 'How it works'}</Label>
        <div style={{ marginTop: 8 }}>
          {isRTL
            ? 'התזכורות פועלות באמצעות התראות דפדפן. לתוצאה טובה: התקן את האפליקציה למסך הבית ("הוסף למסך הבית" בדפדפן) והשאר אותה פתוחה ברקע. ההתראה תופיע גם כשהמסך נעול.'
            : 'Reminders use browser notifications. For best results: install the app to your home screen ("Add to home screen" in your browser) and keep it running in the background. Notifications fire even when the screen is locked.'}
        </div>
      </div>
    </div>
  )
}

// ─── Time row ───────────────────────
function TimeRow({ label, enabled, time, onToggle, onTimeChange, isRTL }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12,
      alignItems: 'center',
      padding: '12px 14px',
      background: enabled ? t.color.panel2 : t.color.charcoal,
      border: `1px solid ${enabled ? t.color.wineLight : t.color.border}`,
      borderRadius: t.radius.md,
      transition: t.transition,
    }}>
      <Toggle checked={enabled} onChange={onToggle} />
      <div style={{
        fontSize: 14, color: enabled ? t.color.white : t.color.silver2,
        fontWeight: enabled ? 500 : 400,
        letterSpacing: '-0.005em',
      }}>{label}</div>
      <input
        type="time"
        value={time || '08:00'}
        onChange={e => onTimeChange(e.target.value)}
        disabled={!enabled}
        style={{
          background: t.color.charcoal,
          border: `1px solid ${t.color.border}`,
          color: enabled ? t.color.white : t.color.silver3,
          padding: '6px 10px',
          borderRadius: t.radius.sm,
          fontFamily: t.font.family.mono,
          fontSize: 13,
          fontVariantNumeric: 'tabular-nums',
          direction: 'ltr',
          outline: 'none',
        }}
      />
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 999,
        background: checked ? t.color.wineLight : t.color.border,
        border: 'none', cursor: 'pointer',
        position: 'relative',
        transition: t.transition,
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 2, left: checked ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff',
        transition: t.transition,
      }} />
    </button>
  )
}

function NoticeBanner({ tone, children }) {
  const border = tone === 'danger' ? t.color.danger
              : tone === 'warn' ? t.color.warning
              : t.color.wineLight
  return (
    <div style={{
      padding: '12px 14px',
      background: t.color.panel,
      border: `1px solid ${border}`,
      borderRadius: t.radius.md,
      color: t.color.silver1, fontSize: 13, lineHeight: 1.5,
      letterSpacing: '-0.005em',
    }}>{children}</div>
  )
}
