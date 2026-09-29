import { Dumbbell, Flame, Scale, Target, Trophy, Users, Utensils } from '@/components/icons'
import { fmt, Frac } from '@/components/participant'
import { WeightChart } from '@/components/WeightChart'
import { trajectoryText, type Condition } from '@/lib/calc'
import { participantView } from '@/lib/participant-view'
import type { MilestoneKind } from '@/lib/types'

export const metadata = { title: 'התקדמות' }

const COND_ICON = { attendance: Dumbbell, nutrition: Utensils, measurements: Scale, calls: Users }
const BADGE_ICON: Record<MilestoneKind, typeof Flame> = { first_workout: Dumbbell, week_1: Flame, halfway: Target, ten_workouts: Trophy, reward_earned: Trophy }

export default async function ProgressPage() {
  const { snap, goal } = await participantView()
  const w = snap.weight

  return (
    <main className="app">
      <header className="greet">
        <div>
          <p className="hello">ההשוואה היחידה היא לעצמך</p>
          <h1>התקדמות</h1>
        </div>
      </header>

      <section className="card" aria-label="משקל">
        <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 12 }}>
          <div>
            <div className="hint">משקל נוכחי</div>
            {w.current != null ? (
              <div className="row" style={{ alignItems: 'baseline', gap: 8 }}>
                <span className="big-weight num">{fmt(w.current)}</span>
                <span className="muted">ק״ג</span>
              </div>
            ) : (
              <div className="muted">עוד אין מדידה</div>
            )}
          </div>
          {w.delta != null && w.delta !== 0 && (
            <div style={{ textAlign: 'end' }}>
              <div className={`delta${w.delta > 0 ? ' up' : ''}`}>
                <span className="num">{w.delta > 0 ? '+' : '−'}{fmt(Math.abs(w.delta))}</span> ק״ג
              </div>
              <div className="hint">מהפתיחה</div>
            </div>
          )}
        </div>
        <WeightChart w={w} today={snap.dayNumber} />
        {goal?.goal_text && <p className="hint" style={{ marginTop: 8 }}>היעד: {goal.goal_text}</p>}
      </section>

      <section className="card" aria-label="ארבעת התנאים">
        <div className="card-title"><h2>ארבעת התנאים</h2><span className="hint">לחודשיים מנוי מתנה</span></div>
        {snap.conditions.map((c) => <ConditionRow key={c.key} c={c} />)}
      </section>

      <section className="card" aria-label="הישגים">
        <div className="card-title"><h2>הישגים</h2></div>
        <div className="badges">
          {snap.achievements.map((a) => {
            const Icon = BADGE_ICON[a.kind]
            return (
              <div key={a.kind} className={`badge${a.earned ? ' on' : ''}`} aria-label={`${a.label}${a.earned ? ' — הושג' : ''}`}>
                <Icon size={24} />
                {a.label}
              </div>
            )
          })}
        </div>
      </section>

      <section className="card soft-green" aria-label="הערכת מסלול">
        <div className="row between">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>
              {snap.finished ? 'התוכנית הושלמה' : <>נותרו <span className="num">{snap.daysLeft}</span> ימים</>}
            </div>
            <p className="small" style={{ color: 'var(--accent)', marginTop: 4 }}>{trajectoryText(snap)}</p>
          </div>
        </div>
      </section>
    </main>
  )
}

function ConditionRow({ c }: { c: Condition }) {
  const Icon = COND_ICON[c.key]
  const pct = Math.min(100, Math.round((100 * c.value) / c.target))
  const behind = c.value < c.expectedByNow
  return (
    <div className="cond">
      <div className="track-head">
        <span className="track-name"><Icon size={18} style={{ color: 'var(--ink-2)' }} />{c.label}</span>
        <span className="track-val"><Frac value={c.value} of={c.target} /></span>
      </div>
      <div className="bar goal thin"><span style={{ width: `${pct}%`, background: c.met ? 'var(--success)' : undefined }} /></div>
      {behind && <div className="hint" style={{ marginTop: 4 }}>בקצב: <span className="num">{c.expectedByNow}</span> עד היום</div>}
    </div>
  )
}
