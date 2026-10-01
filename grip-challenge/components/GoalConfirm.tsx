import { confirmGoalAction } from '@/app/(participant)/actions'
import { fullDate, todayIL } from '@/lib/dates'
import type { Goal, GoalType } from '@/lib/types'
import { ConfirmButton } from './ConfirmButton'
import { Target } from './icons'

export const GOAL_TYPE_LABEL: Record<GoalType, string> = {
  weight: 'משקל',
  body_fat: 'אחוז שומן',
  measurements: 'היקפים',
  attendance: 'נוכחות',
  other: 'אחר',
}

/**
 * Blocking: shown instead of the app until the participant confirms the goal
 * their nutritionist recorded. No skip, no close; it returns on every visit.
 */
export function GoalConfirm({ goal, name }: { goal: Goal; name: string }) {
  const start: [string, string][] = []
  if (goal.start_weight != null) start.push(['משקל', `${goal.start_weight} ק״ג`])
  if (goal.start_body_fat != null) start.push(['אחוז שומן', `${goal.start_body_fat}%`])
  if (goal.start_measurements) start.push(['היקפים', goal.start_measurements])
  return (
    <main className="app nonav goal-confirm">
      <header className="greet">
        <div>
          <p className="hello">{name}, לפני שממשיכים</p>
          <h1>היעד שלך ל-42 הימים</h1>
        </div>
      </header>

      <section className="card goal-hero">
        <span className="goal-icon"><Target size={22} /></span>
        <p className="hint">{GOAL_TYPE_LABEL[goal.goal_type]}{goal.goal_value != null ? <> · <span className="num">{goal.goal_value}</span></> : null}</p>
        <h2 className="goal-text">{goal.goal_text}</h2>
        {goal.goal_why && <p className="muted" style={{ marginTop: 8 }}>למה זה חשוב לך: {goal.goal_why}</p>}
      </section>

      {start.length > 0 && (
        <section className="card">
          <div className="card-title"><h2>נקודת הפתיחה</h2></div>
          <div className="stack">
            {start.map(([k, v]) => (
              <div key={k} className="row between"><span className="muted">{k}</span><strong className="num">{v}</strong></div>
            ))}
          </div>
        </section>
      )}

      <form action={confirmGoalAction} className="stack" style={{ gap: 8 }}>
        <ConfirmButton />
        <p className="hint" style={{ textAlign: 'center' }}>
          נקבע בשיחה עם התזונאי/ת{goal.recorded_at ? ` · ${fullDate(todayIL(new Date(goal.recorded_at)))}` : ''}. האישור נשמר עם התאריך והשעה.
        </p>
      </form>
    </main>
  )
}
