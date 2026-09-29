// The calculations module (spec §3, §7). Every screen reads from here; no
// screen computes a streak, a count or a status on its own.
//
// Nothing here is stored. It all derives from daily_logs, coach_calls and the
// goal, for a given "today" in Asia/Jerusalem.

import { addDays, diffDays, rangeDays, weekStart, type ISODate } from './dates'
import {
  MEASUREMENT_EVERY,
  MIN_SESSIONS,
  NUTRITION_REQUIRED_DAYS,
  PROGRAM_DAYS,
  PROGRAM_WEEKS,
  REWARD_DAYS,
  TOTAL_SESSIONS,
} from './program'
import type { DailyLog, Goal, MilestoneKind } from './types'

// ─── Program calendar ────────────────────────────────────────────────

export function programEnd(start: ISODate): ISODate {
  return addDays(start, PROGRAM_DAYS - 1)
}

/** Raw day number: today − start + 1. Can be ≤ 0 (not started) or > 42 (over). */
export function rawDayNumber(start: ISODate, today: ISODate): number {
  return diffDays(start, today) + 1
}

/** Day number for display and for the rules, clamped to 1…42. */
export function dayNumber(start: ISODate, today: ISODate): number {
  return Math.min(PROGRAM_DAYS, Math.max(1, rawDayNumber(start, today)))
}

/** Program week (1…6) that a date falls in. */
export function programWeek(start: ISODate, d: ISODate): number {
  return Math.min(PROGRAM_WEEKS, Math.max(1, Math.floor(diffDays(start, d) / 7) + 1))
}

/** The weekly measurement falls on day 7, 14, …, 42. */
export function isMeasurementDay(start: ISODate, d: ISODate): boolean {
  const n = rawDayNumber(start, d)
  return n >= 1 && n <= PROGRAM_DAYS && n % MEASUREMENT_EVERY === 0
}

/** The last program day that has already begun (today, or day 42 once it is over). */
function effectiveToday(start: ISODate, today: ISODate): ISODate {
  const end = programEnd(start)
  return today > end ? end : today
}

function inProgram(start: ISODate, d: ISODate): boolean {
  return d >= start && d <= programEnd(start)
}

function nutritionSet(logs: DailyLog[], start: ISODate): Set<ISODate> {
  const s = new Set<ISODate>()
  for (const l of logs) if (l.nutrition_logged && inProgram(start, l.log_date)) s.add(l.log_date)
  return s
}

// ─── reward_days (§3א) ───────────────────────────────────────────────

/** Total marked days in the program. Not consecutive: every marked day counts. */
export function rewardDays(logs: DailyLog[], start: ISODate): number {
  return nutritionSet(logs, start).size
}

export function rewardEligible(logs: DailyLog[], start: ISODate): boolean {
  return rewardDays(logs, start) >= REWARD_DAYS
}

// ─── Streak (§3ב) ────────────────────────────────────────────────────

/**
 * Streak that ends on `end`, walking back day by day:
 *   marked                              → counts
 *   unmarked, first miss in its week    → counts (the free day does not break it)
 *   unmarked, second miss in that week  → stop
 * Weeks are calendar weeks, Sunday to Saturday. The walk never goes before
 * the start date. Free days at the far (oldest) end are not followed by any
 * marked day, so they are not part of a streak and are dropped; a streak
 * with no marked day is 0.
 */
function streakEndingAt(marked: Set<ISODate>, start: ISODate, end: ISODate): number {
  let count = 0
  let upToLastMarked = 0
  const weeksWithMiss = new Set<ISODate>()
  for (let d = end; d >= start; d = addDays(d, -1)) {
    if (marked.has(d)) {
      count++
      upToLastMarked = count
      continue
    }
    const wk = weekStart(d)
    if (weeksWithMiss.has(wk)) break
    weeksWithMiss.add(wk)
    count++
  }
  return upToLastMarked
}

/**
 * Current streak as of today. Today is still open: if it is not marked yet it
 * neither counts nor breaks anything, and the streak is read from yesterday.
 */
export function currentStreak(logs: DailyLog[], start: ISODate, today: ISODate): number {
  if (today < start) return 0
  const marked = nutritionSet(logs, start)
  const t = effectiveToday(start, today)
  const end = marked.has(t) || t !== today ? t : addDays(t, -1)
  if (end < start) return 0
  return streakEndingAt(marked, start, end)
}

/** Longest streak so far, by the same rules. */
export function longestStreak(logs: DailyLog[], start: ISODate, today: ISODate): number {
  if (today < start) return 0
  const marked = nutritionSet(logs, start)
  let best = 0
  for (const d of rangeDays(start, effectiveToday(start, today))) {
    if (marked.has(d)) best = Math.max(best, streakEndingAt(marked, start, d))
  }
  return best
}

// ─── Status (§7) ─────────────────────────────────────────────────────

export type StatusColor = 'red' | 'yellow' | 'green'
export type Owner = 'coach' | 'nutritionist'

export interface StatusReason {
  code: 'no_log' | 'missed_call' | 'behind_workouts'
  color: 'red' | 'yellow'
  text: string
  owner: Owner
}

export interface Status {
  color: StatusColor
  reasons: StatusReason[]
}

export function expectedWorkouts(day: number): number {
  return Math.ceil((MIN_SESSIONS * day) / PROGRAM_DAYS)
}

export function actualWorkouts(logs: DailyLog[], start: ISODate): number {
  return logs.filter((l) => l.workout_attended && inProgram(start, l.log_date)).length
}

/** Days since the last nutrition report. 0 = reported today. Never reported → counts from the day before start. */
export function daysSinceLog(logs: DailyLog[], start: ISODate, today: ISODate): number {
  const t = effectiveToday(start, today)
  let last: ISODate | null = null
  for (const d of nutritionSet(logs, start)) if (d <= t && (!last || d > last)) last = d
  return diffDays(last ?? addDays(start, -1), t)
}

/**
 * Days since the last coach call, counting the start date as the first
 * contact: a participant in their first week has not "missed" a call yet.
 */
export function daysSinceCall(calls: { call_date: ISODate }[], start: ISODate, today: ISODate): number {
  const t = effectiveToday(start, today)
  let last = start
  for (const c of calls) if (c.call_date <= t && c.call_date > last) last = c.call_date
  return diffDays(last, t)
}

/** No coach call in the last 7 days (today and the 6 before it). */
export function missedCall(calls: { call_date: ISODate }[], start: ISODate, today: ISODate): boolean {
  return daysSinceCall(calls, start, today) >= 7
}

export function statusOf(input: {
  start: ISODate
  today: ISODate
  logs: DailyLog[]
  calls: { call_date: ISODate }[]
}): Status {
  const { start, today, logs, calls } = input
  const day = dayNumber(start, today)
  const sinceLog = daysSinceLog(logs, start, today)
  const sinceCall = daysSinceCall(calls, start, today)
  const expected = expectedWorkouts(day)
  const actual = actualWorkouts(logs, start)
  const reasons: StatusReason[] = []

  if (sinceLog >= 3) {
    reasons.push({ code: 'no_log', color: 'red', text: `${sinceLog} ימים בלי דיווח תזונה`, owner: 'nutritionist' })
  } else if (sinceLog === 2) {
    reasons.push({ code: 'no_log', color: 'yellow', text: 'יומיים בלי דיווח תזונה', owner: 'nutritionist' })
  }
  if (sinceCall >= 7) {
    reasons.push({ code: 'missed_call', color: 'red', text: `אין שיחת מאמן/ת ${sinceCall} ימים`, owner: 'coach' })
  }
  if (actual <= expected - 2) {
    reasons.push({
      code: 'behind_workouts',
      color: 'red',
      text: `${expected - actual} אימונים מאחורי הקצב (${actual} מתוך ${expected})`,
      owner: 'coach',
    })
  } else if (actual === expected - 1) {
    reasons.push({ code: 'behind_workouts', color: 'yellow', text: `אימון אחד מאחורי הקצב (${actual} מתוך ${expected})`, owner: 'coach' })
  }

  const color: StatusColor = reasons.some((r) => r.color === 'red')
    ? 'red'
    : reasons.some((r) => r.color === 'yellow')
      ? 'yellow'
      : 'green'
  // Red reasons first, so the one-line explanation leads with the urgent one.
  reasons.sort((a, b) => (a.color === b.color ? 0 : a.color === 'red' ? -1 : 1))
  return { color, reasons }
}

// ─── The four conditions ─────────────────────────────────────────────

export interface Condition {
  key: 'attendance' | 'nutrition' | 'measurements' | 'calls'
  label: string
  value: number
  target: number
  /** Where the participant should be by today to stay on track. */
  expectedByNow: number
  met: boolean
}

function weeksWith(dates: ISODate[], start: ISODate): number {
  return new Set(dates.filter((d) => inProgram(start, d)).map((d) => programWeek(start, d))).size
}

export function conditions(input: {
  start: ISODate
  today: ISODate
  logs: DailyLog[]
  calls: { call_date: ISODate }[]
}): Condition[] {
  const { start, today, logs, calls } = input
  const day = dayNumber(start, today)
  const workouts = actualWorkouts(logs, start)
  const nutrition = rewardDays(logs, start)
  const measurements = weeksWith(
    logs.filter((l) => l.measurement_logged).map((l) => l.log_date),
    start,
  )
  const callWeeks = weeksWith(calls.map((c) => c.call_date), start)
  const weeksDone = Math.floor(day / 7)
  return [
    { key: 'attendance', label: 'נוכחות באימונים', value: workouts, target: MIN_SESSIONS, expectedByNow: expectedWorkouts(day), met: workouts >= MIN_SESSIONS },
    {
      key: 'nutrition',
      label: 'דיווח תזונה',
      value: nutrition,
      target: NUTRITION_REQUIRED_DAYS,
      expectedByNow: Math.ceil((NUTRITION_REQUIRED_DAYS * day) / PROGRAM_DAYS),
      met: nutrition >= NUTRITION_REQUIRED_DAYS,
    },
    { key: 'measurements', label: 'מדידה שבועית', value: measurements, target: PROGRAM_WEEKS, expectedByNow: weeksDone, met: measurements >= PROGRAM_WEEKS },
    { key: 'calls', label: 'שיחת מאמן/ת הצלחה', value: callWeeks, target: PROGRAM_WEEKS, expectedByNow: weeksDone, met: callWeeks >= PROGRAM_WEEKS },
  ]
}

/** Percent of what is expected by now, capped at 100. Used by the dashboard. */
export function completionPct(c: Condition): number {
  if (c.expectedByNow <= 0) return 100
  return Math.min(100, Math.round((100 * c.value) / c.expectedByNow))
}

// ─── Weight ──────────────────────────────────────────────────────────

export interface WeightPoint {
  date: ISODate
  day: number
  weight: number
}

export interface WeightSummary {
  start: number | null
  current: number | null
  goal: number | null
  /** current − start; negative is a loss. */
  delta: number | null
  points: WeightPoint[]
}

export function weightSummary(logs: DailyLog[], start: ISODate, goal: Goal | null): WeightSummary {
  const points: WeightPoint[] = logs
    .filter((l) => l.weight != null && inProgram(start, l.log_date))
    .sort((a, b) => (a.log_date < b.log_date ? -1 : 1))
    .map((l) => ({ date: l.log_date, day: rawDayNumber(start, l.log_date), weight: Number(l.weight) }))
  const startW = goal?.start_weight ?? points[0]?.weight ?? null
  if (goal?.start_weight != null && !points.some((p) => p.day === 1)) {
    points.unshift({ date: start, day: 1, weight: goal.start_weight })
  }
  const current = points.length ? points[points.length - 1].weight : startW
  const goalW = goal?.goal_type === 'weight' ? goal.goal_value : null
  const delta = startW != null && current != null ? round1(current - startW) : null
  return { start: startW, current, goal: goalW, delta, points }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

// ─── Achievements (milestones) ───────────────────────────────────────

export interface Achievement {
  kind: MilestoneKind
  label: string
  earned: boolean
}

export const ACHIEVEMENT_LABELS: Record<MilestoneKind, string> = {
  first_workout: 'אימון ראשון',
  week_1: '7 ימים מסומנים',
  halfway: 'חצי הדרך',
  ten_workouts: '10 אימונים',
  reward_earned: 'אימון אישי',
}

/** Which milestones the data has earned. The engine persists these; the reward one opens the win screen. */
export function earnedMilestones(logs: DailyLog[], start: ISODate): MilestoneKind[] {
  const days = rewardDays(logs, start)
  const workouts = actualWorkouts(logs, start)
  const out: MilestoneKind[] = []
  if (workouts >= 1) out.push('first_workout')
  if (days >= 7) out.push('week_1')
  if (days >= REWARD_DAYS / 2) out.push('halfway')
  if (workouts >= 10) out.push('ten_workouts')
  if (days >= REWARD_DAYS) out.push('reward_earned')
  return out
}

/** The four achievement squares on the progress screen. */
export function achievements(logs: DailyLog[], start: ISODate): Achievement[] {
  const earned = new Set(earnedMilestones(logs, start))
  return (['first_workout', 'week_1', 'halfway', 'ten_workouts'] as const).map((kind) => ({
    kind,
    label: ACHIEVEMENT_LABELS[kind],
    earned: earned.has(kind),
  }))
}

// ─── Week strip ──────────────────────────────────────────────────────

export type DotState = 'done' | 'today' | 'missed' | 'future' | 'outside'

export interface WeekDot {
  date: ISODate
  weekday: number
  state: DotState
}

/** Seven dots, Sunday to Saturday, for the calendar week that holds today. */
export function weekDots(logs: DailyLog[], start: ISODate, today: ISODate): WeekDot[] {
  const marked = nutritionSet(logs, start)
  const sun = weekStart(today)
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(sun, i)
    let state: DotState
    if (!inProgram(start, d)) state = 'outside'
    else if (marked.has(d)) state = 'done'
    else if (d === today) state = 'today'
    else if (d > today) state = 'future'
    else state = 'missed'
    return { date: d, weekday: i, state }
  })
}

/** Marked days in this calendar week so far, and in all of last week. */
export function weekComparison(logs: DailyLog[], start: ISODate, today: ISODate) {
  const marked = nutritionSet(logs, start)
  const sun = weekStart(today)
  const count = (from: ISODate, to: ISODate) => rangeDays(from, to).filter((d) => marked.has(d)).length
  return { thisWeek: count(sun, today), lastWeek: count(addDays(sun, -7), addDays(sun, -1)) }
}

// ─── Forecast ────────────────────────────────────────────────────────

export interface Forecast {
  projectedRewardDays: number
  likelyReward: boolean
  projectedWorkouts: number
  /** null when the goal cannot be projected (not a weight goal, or too few weigh-ins). */
  goalOnTrack: boolean | null
  likelyGoal: boolean
}

export function forecast(input: {
  start: ISODate
  today: ISODate
  logs: DailyLog[]
  calls: { call_date: ISODate }[]
  goal: Goal | null
}): Forecast {
  const { start, today, logs, calls, goal } = input
  const t = effectiveToday(start, today)
  const day = dayNumber(start, today)
  const marked = nutritionSet(logs, start)
  const days = marked.size
  const over = today > programEnd(start)

  // Nutrition: the pace of the last (up to) 7 finished days, over the open days left.
  const openDays = over ? 0 : PROGRAM_DAYS - day + (marked.has(t) ? 0 : 1)
  const windowFrom = addDays(t, -7) < start ? start : addDays(t, -7)
  const finished = windowFrom <= addDays(t, -1) ? rangeDays(windowFrom, addDays(t, -1)) : []
  const rate = finished.length ? finished.filter((d) => marked.has(d)).length / finished.length : 1
  const projectedRewardDays = Math.min(PROGRAM_DAYS, Math.round(days + rate * openDays))
  const likelyReward = days >= REWARD_DAYS || (days + openDays >= REWARD_DAYS && projectedRewardDays >= REWARD_DAYS)

  // Workouts: attendance rate against sessions offered so far, over sessions left.
  const workouts = actualWorkouts(logs, start)
  const offeredSoFar = (TOTAL_SESSIONS * day) / PROGRAM_DAYS
  const attendRate = day < 7 ? MIN_SESSIONS / TOTAL_SESSIONS : Math.min(1, workouts / offeredSoFar)
  const sessionsLeft = over ? 0 : (TOTAL_SESSIONS * (PROGRAM_DAYS - day)) / PROGRAM_DAYS
  const projectedWorkouts = Math.round(workouts + attendRate * sessionsLeft)

  // Weekly conditions: a week already missed cannot be made up.
  const conds = conditions({ start, today, logs, calls })
  const weeklyOk = conds
    .filter((c) => c.key === 'measurements' || c.key === 'calls')
    .every((c) => c.value >= c.expectedByNow || c.met)

  const goalOnTrack = projectGoal(logs, start, goal, over)
  const likelyGoal =
    (workouts >= MIN_SESSIONS || projectedWorkouts >= MIN_SESSIONS) &&
    (days >= NUTRITION_REQUIRED_DAYS || projectedRewardDays >= NUTRITION_REQUIRED_DAYS) &&
    weeklyOk &&
    goalOnTrack !== false &&
    goal?.achieved !== false

  return { projectedRewardDays, likelyReward, projectedWorkouts, goalOnTrack, likelyGoal }
}

/** Linear projection of weigh-ins to day 42 against a weight goal. */
function projectGoal(logs: DailyLog[], start: ISODate, goal: Goal | null, over: boolean): boolean | null {
  if (goal?.achieved != null) return goal.achieved
  if (!goal || goal.goal_type !== 'weight' || goal.goal_value == null) return null
  const w = weightSummary(logs, start, goal)
  if (w.start == null || w.current == null) return null
  const wantsLoss = goal.goal_value < w.start
  const reached = wantsLoss ? w.current <= goal.goal_value : w.current >= goal.goal_value
  if (reached) return true
  if (over) return false
  if (w.points.length < 2) return null
  const n = w.points.length
  const mx = w.points.reduce((s, p) => s + p.day, 0) / n
  const my = w.points.reduce((s, p) => s + p.weight, 0) / n
  const sxx = w.points.reduce((s, p) => s + (p.day - mx) ** 2, 0)
  if (sxx === 0) return null
  const slope = w.points.reduce((s, p) => s + (p.day - mx) * (p.weight - my), 0) / sxx
  const projected = my + slope * (PROGRAM_DAYS - mx)
  return wantsLoss ? projected <= goal.goal_value : projected >= goal.goal_value
}

// ─── Encouragement (one dynamic sentence) ────────────────────────────

export function encouragement(s: Pick<Snapshot, 'rewardDays' | 'rewardRemaining' | 'currentStreak' | 'longestStreak' | 'loggedToday' | 'week' | 'status' | 'dayNumber' | 'daysSinceLog'>): string {
  if (s.rewardRemaining === 0) return 'עשית את זה. האימון האישי שלך מחכה.'
  if (s.rewardRemaining <= 5) return `עוד ${s.rewardRemaining} ימים מסומנים והאימון האישי שלך.`
  if (s.daysSinceLog >= 2) return 'כל יום הוא התחלה חדשה. סימון אחד היום מחזיר אותך למסלול.'
  if (s.currentStreak >= 3 && s.currentStreak === s.longestStreak && s.loggedToday)
    return `${s.currentStreak} ימים — זה השיא שלך. מחר הוא שיא חדש.`
  if (!s.loggedToday && s.currentStreak > 0) return `הרצף שלך על ${s.currentStreak}. סימון אחד היום שומר עליו.`
  if (s.status.reasons.some((r) => r.code === 'behind_workouts')) return 'אימון אחד השבוע מחזיר אותך לקצב.'
  if (s.week.thisWeek > s.week.lastWeek && s.dayNumber > 7)
    return `השבוע כבר ${s.week.thisWeek} ימים מסומנים, יותר מכל השבוע שעבר.`
  if (s.dayNumber <= 3) return 'ההתחלה היא החלק הקשה, והיא כבר מאחוריך.'
  return `יום ${s.dayNumber}. עוד ${s.rewardRemaining} ימים מסומנים לאימון האישי.`
}

/** Short track estimate for the bottom of the progress screen. */
export function trajectoryText(s: Snapshot): string {
  if (s.finished) return s.rewardEligible ? 'התוכנית הושלמה, והאימון האישי שלך.' : 'התוכנית הושלמה.'
  if (s.rewardEligible) return 'האימון האישי כבר שלך. עכשיו היעד.'
  if (s.forecast.likelyReward) return `בקצב הזה: ${s.forecast.projectedRewardDays} ימים מסומנים ביום 42. על המסלול.`
  const need = REWARD_DAYS - s.rewardDays
  return `צריך ${need} ימים מסומנים מתוך ${s.daysLeft + (s.loggedToday ? 0 : 1)} שנותרו.`
}

// ─── Snapshot: the one call screens make ─────────────────────────────

export interface Snapshot {
  today: ISODate
  started: boolean
  finished: boolean
  dayNumber: number
  daysLeft: number
  loggedToday: boolean
  currentStreak: number
  longestStreak: number
  rewardDays: number
  rewardRemaining: number
  rewardEligible: boolean
  actualWorkouts: number
  expectedWorkouts: number
  daysSinceLog: number
  daysSinceCall: number
  missedCall: boolean
  status: Status
  conditions: Condition[]
  weight: WeightSummary
  achievements: Achievement[]
  week: { thisWeek: number; lastWeek: number }
  dots: WeekDot[]
  forecast: Forecast
  isMeasurementDay: boolean
  programWeek: number
}

export function snapshot(input: {
  start: ISODate
  today: ISODate
  logs: DailyLog[]
  calls: { call_date: ISODate }[]
  goal: Goal | null
}): Snapshot {
  const { start, today, logs, calls, goal } = input
  const raw = rawDayNumber(start, today)
  const day = dayNumber(start, today)
  const days = rewardDays(logs, start)
  const todayLog = logs.find((l) => l.log_date === today)
  return {
    today,
    started: raw >= 1,
    finished: raw > PROGRAM_DAYS,
    dayNumber: day,
    daysLeft: Math.max(0, PROGRAM_DAYS - Math.max(raw, 0)),
    loggedToday: !!todayLog?.nutrition_logged,
    currentStreak: currentStreak(logs, start, today),
    longestStreak: longestStreak(logs, start, today),
    rewardDays: days,
    rewardRemaining: Math.max(0, REWARD_DAYS - days),
    rewardEligible: days >= REWARD_DAYS,
    actualWorkouts: actualWorkouts(logs, start),
    expectedWorkouts: expectedWorkouts(day),
    daysSinceLog: daysSinceLog(logs, start, today),
    daysSinceCall: daysSinceCall(calls, start, today),
    missedCall: missedCall(calls, start, today),
    status: statusOf({ start, today, logs, calls }),
    conditions: conditions({ start, today, logs, calls }),
    weight: weightSummary(logs, start, goal),
    achievements: achievements(logs, start),
    week: weekComparison(logs, start, today),
    dots: weekDots(logs, start, today),
    forecast: forecast({ start, today, logs, calls, goal }),
    isMeasurementDay: isMeasurementDay(start, today),
    programWeek: programWeek(start, today),
  }
}
