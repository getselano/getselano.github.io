// Presentational pieces shared by the participant screens.
import { HEB_WEEKDAYS_SHORT } from '@/lib/dates'
import type { Snapshot, WeekDot } from '@/lib/calc'
import { MIN_SESSIONS, REWARD_DAYS } from '@/lib/program'
import { Check, Flame } from './icons'

export function StreakCard({ streak, longest, sentence }: { streak: number; longest: number; sentence?: string }) {
  return (
    <section className="card" aria-label="רצף">
      <div className="streak-card">
        <div className={`flame-badge${streak ? '' : ' cold'}`}>
          <Flame size={30} />
        </div>
        <div>
          <div className="streak-num num">{streak}</div>
          <div className="streak-label">ימים ברצף</div>
        </div>
        <div className="streak-best">
          <span className="num">{longest}</span>
          <span className="hint">השיא שלך</span>
        </div>
      </div>
      {sentence && <p className="muted small" style={{ marginTop: 14 }}>{sentence}</p>}
    </section>
  )
}

function pct(v: number, of: number) {
  return `${Math.min(100, Math.round((100 * v) / of))}%`
}

export function DualProgress({ snap, goalText }: { snap: Snapshot; goalText?: string | null }) {
  const w = snap.weight
  const weightLine =
    w.current != null && w.start != null
      ? <>
          משקל <span className="num">{fmt(w.current)}</span>
          {w.goal != null ? <> · יעד <span className="num">{fmt(w.goal)}</span></> : <> · פתיחה <span className="num">{fmt(w.start)}</span></>}
          {goalText && w.goal == null ? <> · {goalText}</> : null}
        </>
      : goalText || 'היעד נקבע בשיחת הקליטה'
  const remaining = snap.rewardRemaining
  return (
    <section className="card" aria-label="התקדמות">
      <div className="track">
        <div className="track-head">
          <span className="track-name"><span className="dot" style={{ background: 'var(--accent)' }} />היעד שלי</span>
          <span className="track-val"><Frac value={snap.actualWorkouts} of={MIN_SESSIONS} /> אימונים</span>
        </div>
        <div className="bar goal" role="progressbar" aria-valuenow={snap.actualWorkouts} aria-valuemin={0} aria-valuemax={MIN_SESSIONS}>
          <span style={{ width: pct(snap.actualWorkouts, MIN_SESSIONS) }} />
        </div>
        <div className="track-sub">{weightLine}</div>
      </div>
      <div className="track">
        <div className="track-head">
          <span className="track-name"><span className="dot" style={{ background: 'var(--streak)' }} />אימון אישי מתנה</span>
          <span className="track-val"><Frac value={snap.rewardDays} of={REWARD_DAYS} /> ימים</span>
        </div>
        <div className="bar streak" role="progressbar" aria-valuenow={snap.rewardDays} aria-valuemin={0} aria-valuemax={REWARD_DAYS}>
          <span style={{ width: pct(snap.rewardDays, REWARD_DAYS) }} />
        </div>
        <div className="track-sub">
          {remaining > 0 ? <>עוד <span className="num">{remaining}</span> ימים מסומנים והאימון האישי שלך</> : 'האימון האישי שלך. מגיע לך.'}
        </div>
      </div>
    </section>
  )
}

export function WeekStrip({ dots, today }: { dots: WeekDot[]; today: string }) {
  return (
    <div className="week" role="list" aria-label="השבוע">
      {dots.map((d) => (
        <div key={d.date} role="listitem" aria-label={`${HEB_WEEKDAYS_SHORT[d.weekday]} ${label(d.state)}`}>
          <div className={`wd${d.date === today ? ' is-today' : ''}`}>{HEB_WEEKDAYS_SHORT[d.weekday]}</div>
          <div className={`d ${d.state}`}>{d.state === 'done' && <Check size={16} />}</div>
        </div>
      ))}
    </div>
  )
}

function label(s: WeekDot['state']) {
  return { done: 'סומן', today: 'היום', missed: 'לא סומן', future: 'עוד לא', outside: 'מחוץ לתוכנית' }[s]
}

export function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/** "9 / 12" as one left-to-right unit, so it never reads reversed inside Hebrew text. */
export function Frac({ value, of }: { value: number | string; of: number | string }) {
  return (
    <span className="num frac" dir="ltr">
      {value} / {of}
    </span>
  )
}
