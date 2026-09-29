// Dashboard aggregates (spec §5.6). Built only from per-participant snapshots.
import { completionPct } from './calc'
import type { Row } from './data'
import { addDays, todayIL } from './dates'
import { FREE_MEMBERSHIP_MONTHS, MEMBERSHIP_MONTH_VALUE, PERSONAL_TRAINING_VALUE, PROGRAM_WEEKS } from './program'
import type { Owner } from './calc'

export interface Dashboard {
  active: number
  reportedToday: number
  atRisk: number
  watch: number
  avgStreak: number
  byWeek: number[]
  nutritionPct: number
  attendancePct: number
  callsThisWeek: number
  risk: { row: Row; owner: Owner }[]
  forecast: { goal: number; reward: number; rewardCost: number; membershipMonths: number; membershipCost: number | null }
}

function isCurrent(r: Row) {
  return r.bundle.participant.status === 'active' && r.snap.started && !r.snap.finished
}

export function dashboard(rows: Row[], today = todayIL()): Dashboard {
  const cur = rows.filter(isCurrent)
  const n = cur.length || 1
  const byWeek = Array.from({ length: PROGRAM_WEEKS }, (_, i) => cur.filter((r) => r.snap.programWeek === i + 1).length)
  const pctOf = (key: 'nutrition' | 'attendance') =>
    Math.round(cur.reduce((s, r) => s + completionPct(r.snap.conditions.find((c) => c.key === key)!), 0) / n)
  const weekAgo = addDays(today, -6)
  const risk = cur
    .filter((r) => r.snap.status.color === 'red')
    .sort((a, b) => b.snap.status.reasons.length - a.snap.status.reasons.length || b.snap.daysSinceLog - a.snap.daysSinceLog)
    .map((row) => ({ row, owner: row.snap.status.reasons[0].owner }))
  // Forecast covers everyone still in the program plus those who finished it.
  const pool = rows.filter((r) => r.bundle.participant.status !== 'cancelled' && r.snap.started)
  const goal = pool.filter((r) => r.snap.forecast.likelyGoal).length
  const reward = pool.filter((r) => r.snap.forecast.likelyReward).length
  const months = goal * FREE_MEMBERSHIP_MONTHS
  return {
    active: cur.length,
    reportedToday: cur.filter((r) => r.snap.loggedToday).length,
    atRisk: risk.length,
    watch: cur.filter((r) => r.snap.status.color === 'yellow').length,
    avgStreak: cur.length ? Math.round((10 * cur.reduce((s, r) => s + r.snap.currentStreak, 0)) / cur.length) / 10 : 0,
    byWeek,
    nutritionPct: cur.length ? pctOf('nutrition') : 0,
    attendancePct: cur.length ? pctOf('attendance') : 0,
    callsThisWeek: cur.filter((r) => r.bundle.calls.some((c) => c.call_date >= weekAgo && c.call_date <= today)).length,
    risk,
    forecast: {
      goal,
      reward,
      rewardCost: reward * PERSONAL_TRAINING_VALUE,
      membershipMonths: months,
      membershipCost: MEMBERSHIP_MONTH_VALUE ? months * MEMBERSHIP_MONTH_VALUE : null,
    },
  }
}
