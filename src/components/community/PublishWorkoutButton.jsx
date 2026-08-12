import React, { useState } from 'react'
import { t } from '../../theme/tokens'
import { Button } from '../ui/UI'
import { useAuth } from '../../auth/AuthContext'
import { publishWorkout } from '../../services/sharedWorkouts'

// Strip any personal load/weight/log data before publishing — keep only the
// template shape (movement/exercise ids, target reps/sets, format).
export function sanitizeWorkoutForShare(rawData, type) {
  if (!rawData) return null
  if (type === 'wod') {
    // WOD from crossfit generator — keep the prescription lines + movements
    return {
      title: rawData.title || 'WOD',
      format: rawData.format,
      lines: Array.isArray(rawData.lines) ? rawData.lines : [],
      movements: (rawData.movements || []).map(m => ({
        id: m.id, he: m.he, en: m.en,
      })),
      timecap: rawData.timecap || null,
    }
  }
  if (type === 'routine') {
    // Bodybuilding routine — session with exercises + prescribed sets/reps
    return {
      name: rawData.name || 'Routine',
      exercises: (rawData.exercises || []).map(ex => ({
        exerciseId: ex.exerciseId || ex.id,
        name: ex.name,
        sets: (ex.sets || []).map(s => ({
          type: s.type || 'work',
          reps: s.reps || null,
          rir: s.rir ?? null,
          // NOTE: intentionally NO weight/load, actualReps, or completed status
        })),
        superset: ex.superset || null,
      })),
    }
  }
  // Freeform / custom text
  return { text: String(rawData?.text || rawData || '').slice(0, 2000) }
}

export function PublishWorkoutButton({ workoutType, workoutData, buttonLabel, style }) {
  const { user } = useAuth()
  const [status, setStatus] = useState('idle') // idle | sending | ok | err
  const [message, setMessage] = useState('')

  if (!user) return null

  const handleClick = async () => {
    if (!confirm('לפרסם את האימון לקהילה? כל המתאמנים יראו את התבנית (בלי המשקלים האישיים שלך).')) return
    setStatus('sending')
    const clean = sanitizeWorkoutForShare(workoutData, workoutType)
    const result = await publishWorkout({
      userId: user.id,
      userName: user.name,
      workoutType,
      workoutData: clean,
    })
    if (!result.ok) {
      const missing = /does not exist/i.test(result.error || '') || result.code === '42P01'
      setStatus('err')
      setMessage(missing
        ? 'הטבלה shared_workouts עדיין לא קיימת ב־Supabase. פתח מרכז בקרה → שלח הודעה לראות SQL.'
        : (result.error || 'פרסום נכשל'))
      return
    }
    setStatus('ok')
    setMessage('פורסם לקהילה ✓')
    setTimeout(() => { setStatus('idle'); setMessage('') }, 3000)
  }

  return (
    <div style={{ display:'flex', alignItems:'center', gap: 10, flexWrap:'wrap', ...style }}>
      <Button
        variant="outline"
        onClick={handleClick}
        disabled={status === 'sending' || status === 'ok'}
      >
        {status === 'sending' ? 'מפרסם…' : status === 'ok' ? 'פורסם ✓' : (buttonLabel || 'פרסם לקהילה')}
      </Button>
      {status === 'err' && (
        <div style={{
          fontSize: 12, color: t.color.danger,
          padding:'6px 10px', borderRadius: t.radius.sm,
          background: `${t.color.danger}18`,
          border: `1px solid ${t.color.danger}44`,
          maxWidth: 320,
        }}>{message}</div>
      )}
    </div>
  )
}
