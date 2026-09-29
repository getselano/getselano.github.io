'use client'
// The daily marking screen. Opened 42 times per participant; every tap has to
// land instantly. State flips optimistically, the server confirms and sends
// back the recomputed streak. A tap made offline waits in localStorage and is
// replayed when the connection returns (same day only: the server marks
// "today" by its own clock).
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Check, Dumbbell, Flame, Leaf, Scale, Utensils } from '@/components/icons'
import { StreakCard, WeekStrip } from '@/components/participant'
import type { WeekDot } from '@/lib/calc'
import type { MarkField } from '@/lib/data/repo'
import { markToday, type MarkResult } from '../actions'

type Marks = Record<MarkField, boolean>

interface Props {
  today: string
  initial: Marks
  initialWeight: number | null
  show: { workout: boolean; workoutOptional: boolean; measurement: boolean }
  workoutSelfReport: boolean
  workoutConfirmed: boolean
  workoutHint: string | null
  streak: number
  longest: number
  sentence: string
  dots: WeekDot[]
}

const PENDING_KEY = 'grip_pending_marks'
type Pending = { date: string; field: MarkField; value: boolean; weight?: number | null }

function readPending(): Pending[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
  } catch {
    return []
  }
}
function writePending(list: Pending[]) {
  try {
    if (list.length) localStorage.setItem(PENDING_KEY, JSON.stringify(list))
    else localStorage.removeItem(PENDING_KEY)
  } catch {}
}

/**
 * Online but the call failed: usually this page is from a build that was
 * just replaced, so its server action no longer exists. Reload (at most once
 * a minute) and the pending tap is replayed by the new version.
 */
function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem('grip_reloaded_at') || 0)
    if (Date.now() - last < 60_000) return false
    sessionStorage.setItem('grip_reloaded_at', String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

const LABELS: Record<MarkField, string> = {
  nutrition_logged: 'דיווח תזונה',
  workout_attended: 'הגעה לאימון',
  measurement_logged: 'מדידה שבועית',
}

export function DailyMarker(props: Props) {
  const router = useRouter()
  const [marks, setMarks] = useState<Marks>(props.initial)
  const [weight, setWeight] = useState<string>(props.initialWeight != null ? String(props.initialWeight) : '')
  const [savedWeight, setSavedWeight] = useState<number | null>(props.initialWeight)
  const [streak, setStreak] = useState({ streak: props.streak, longest: props.longest, sentence: props.sentence, dots: props.dots })
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)
  const [, startTransition] = useTransition()
  const inflight = useRef(0)

  const apply = useCallback(
    (r: MarkResult) => {
      if (r.streak != null) setStreak({ streak: r.streak, longest: r.longest!, sentence: r.sentence!, dots: r.dots! })
      if (r.win) router.push('/win')
    },
    [router],
  )

  const send = useCallback(
    async (p: Pending): Promise<boolean> => {
      inflight.current++
      try {
        const r = await markToday(p.field, p.value, p.weight)
        if (!r.ok) {
          setError(r.error || 'הסימון לא נשמר')
          setMarks((m) => ({ ...m, [p.field]: !p.value }))
          return true // rejected by the server: do not retry
        }
        setError('')
        apply(r)
        return true
      } catch {
        return false // network: keep it for later
      } finally {
        inflight.current--
      }
    },
    [apply],
  )

  const flush = useCallback(async () => {
    const list = readPending().filter((p) => p.date === props.today)
    const left: Pending[] = []
    for (const p of list) if (!(await send(p))) left.push(p)
    writePending(left)
    setOffline(left.length > 0)
  }, [props.today, send])

  useEffect(() => {
    // Replay taps made while offline; drop ones from an earlier day.
    const list = readPending()
    const stale = list.filter((p) => p.date !== props.today)
    if (stale.length) writePending(list.filter((p) => p.date === props.today))
    const todays = list.filter((p) => p.date === props.today)
    if (todays.length) {
      setMarks((m) => todays.reduce((acc, p) => ({ ...acc, [p.field]: p.value }), m))
      void flush()
    }
    window.addEventListener('online', flush)
    return () => window.removeEventListener('online', flush)
  }, [flush, props.today])

  function toggle(field: MarkField, value = !marks[field], w?: number | null) {
    setMarks((m) => ({ ...m, [field]: value }))
    setError('')
    if (value) navigator.vibrate?.(12)
    const p: Pending = { date: props.today, field, value, weight: w }
    startTransition(async () => {
      if (!(await send(p))) {
        writePending([...readPending().filter((x) => !(x.date === p.date && x.field === p.field)), p])
        if (navigator.onLine && reloadOnce()) return // a new version was deployed: reload, the tap replays on load
        setOffline(true)
      }
    })
  }

  function saveWeight(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(weight.replace(',', '.'))
    if (!(n >= 25 && n <= 350)) return setError('משקל לא תקין')
    setSavedWeight(n)
    toggle('measurement_logged', true, n)
  }

  const shown: MarkField[] = ['nutrition_logged']
  if (props.show.workout) shown.push('workout_attended')
  if (props.show.measurement) shown.push('measurement_logged')
  const actionable = shown.filter((f) => f !== 'workout_attended' || (props.workoutSelfReport && !props.show.workoutOptional))
  const remaining = actionable.filter((f) => !marks[f])
  const allDone = remaining.length === 0

  return (
    <>
      <div className="mark-list">
        <MarkCard
          on={marks.nutrition_logged}
          icon={<Utensils size={26} />}
          title="דיווח תזונה"
          sub={marks.nutrition_logged ? 'דווח. הרצף ממשיך.' : 'דיווחתי לתזונאי/ת היום'}
          onTap={() => toggle('nutrition_logged')}
        />
        {props.show.workout &&
          (props.workoutSelfReport ? (
            <MarkCard
              on={marks.workout_attended}
              icon={<Dumbbell size={26} />}
              title="הגעתי לאימון"
              sub={marks.workout_attended ? (props.workoutConfirmed ? 'נספר לאימונים שלך. המאמן/ת אישר/ה.' : 'נספר לאימונים שלך.') : props.workoutHint || (props.show.workoutOptional ? 'רק בימים שהתאמנת' : 'יש אימון היום')}
              onTap={() => toggle('workout_attended')}
            />
          ) : (
            <MarkCard
              on={marks.workout_attended}
              readOnly
              icon={<Dumbbell size={26} />}
              title="אימון היום"
              sub={marks.workout_attended ? 'ההגעה נקלטה אוטומטית' : 'ההגעה תיקלט אוטומטית מהמועדון'}
            />
          ))}
        {props.show.measurement && (
          <MarkCard
            on={marks.measurement_logged}
            icon={<Scale size={26} />}
            title="מדידה שבועית"
            sub={marks.measurement_logged ? (savedWeight ? `נמדד · ${savedWeight} ק"ג` : 'נמדד') : 'היום יום המדידה'}
            onTap={() => toggle('measurement_logged')}
          >
            {marks.measurement_logged && (
              <form className="weight-entry" onSubmit={saveWeight} onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={25}
                  max={350}
                  placeholder='משקל בק"ג (לא חובה)'
                  aria-label="משקל בקילוגרם"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <button className="btn small light" type="submit" disabled={!weight}>שמירה</button>
              </form>
            )}
          </MarkCard>
        )}
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {offline && <p className="hint" role="status">אין חיבור. הסימון נשמר במכשיר ויישלח כשהחיבור יחזור.</p>}

      <section className="card" aria-label="השבוע">
        <WeekStrip dots={streak.dots} today={props.today} />
      </section>

      <StreakCard streak={streak.streak} longest={streak.longest} sentence={streak.sentence} />

      <p className="forgive">
        <Leaf size={20} />
        יום חופש אחד בשבוע לא שובר את הרצף
      </p>

      <div className="status-bar">
        {allDone ? (
          <button className="btn green status-btn" onClick={() => router.push('/')}>
            <Check size={20} /> סיימת להיום
          </button>
        ) : (
          <button className="btn status-btn" onClick={() => toggle(remaining[0])}>
            <Flame size={20} /> נשאר לסמן {remaining.map((f) => LABELS[f]).join(' ו')}
          </button>
        )}
      </div>
    </>
  )
}

function MarkCard(props: {
  on: boolean
  icon: React.ReactNode
  title: string
  sub: string
  onTap?: () => void
  readOnly?: boolean
  children?: React.ReactNode
}) {
  const body = (
    <>
      <span className="mark-icon">{props.icon}</span>
      <span className="mark-text">
        <span className="mark-title" style={{ display: 'block' }}>{props.title}</span>
        <span className="mark-sub" style={{ display: 'block' }}>{props.sub}</span>
      </span>
      <span className="tick" aria-hidden="true"><Check size={22} /></span>
    </>
  )
  if (props.readOnly)
    return (
      <div className={`mark readonly${props.on ? ' on' : ''}`} role="status">
        {body}
      </div>
    )
  return (
    <div>
      <button type="button" className={`mark${props.on ? ' on' : ''}`} aria-pressed={props.on} onClick={props.onTap}>
        {body}
      </button>
      {props.children}
    </div>
  )
}
