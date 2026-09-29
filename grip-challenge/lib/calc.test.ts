import { describe, expect, it } from 'vitest'
import {
  conditions,
  currentStreak,
  daysSinceLog,
  earnedMilestones,
  expectedWorkouts,
  forecast,
  isMeasurementDay,
  longestStreak,
  missedCall,
  rewardDays,
  rewardEligible,
  snapshot,
  statusOf,
  weekDots,
} from './calc'
import { addDays, hourIL, todayIL, weekday } from './dates'
import type { DailyLog, Goal } from './types'

// 2026-09-06 is a Sunday, so program day 1–7 is one calendar week (Sun–Sat).
const START = '2026-09-06'
const d = (n: number, start = START) => addDays(start, n - 1)

function log(date: string, over: Partial<DailyLog> = {}): DailyLog {
  return { log_date: date, nutrition_logged: true, workout_attended: false, measurement_logged: false, weight: null, ...over }
}
/** Nutrition logged on the given program days. */
function marked(days: number[], start = START): DailyLog[] {
  return days.map((n) => log(d(n, start)))
}
function range(a: number, b: number): number[] {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i)
}
function without(days: number[], ...drop: number[]): number[] {
  return days.filter((n) => !drop.includes(n))
}

describe('dates', () => {
  it('takes "today" in Asia/Jerusalem, not UTC', () => {
    // 22:30 UTC is already 01:30 the next day in Israel (summer, UTC+3).
    expect(todayIL(new Date('2026-09-29T22:30:00Z'))).toBe('2026-09-30')
    expect(todayIL(new Date('2026-09-29T20:59:00Z'))).toBe('2026-09-29')
    // Winter, UTC+2.
    expect(todayIL(new Date('2026-12-01T21:59:00Z'))).toBe('2026-12-01')
    expect(todayIL(new Date('2026-12-01T22:00:00Z'))).toBe('2026-12-02')
    expect(hourIL(new Date('2026-12-01T18:00:00Z'))).toBe(20)
  })
  it('the test calendar starts on a Sunday', () => {
    expect(weekday(START)).toBe(0)
  })
})

describe('reward_days', () => {
  it('counts total marked days, not consecutive ones', () => {
    const odd = range(1, 42).filter((n) => n % 2 === 1) // 21 scattered days
    expect(rewardDays(marked(odd), START)).toBe(21)
  })
  it('reaches eligibility at 36 days that are not consecutive', () => {
    // Six gaps, one in each week, spread across the program.
    const days = without(range(1, 42), 3, 10, 18, 25, 33, 40)
    expect(days).toHaveLength(36)
    expect(rewardEligible(marked(days), START)).toBe(true)
    expect(rewardEligible(marked(days.slice(1)), START)).toBe(false)
  })
  it('ignores logs outside the 42 days and unmarked rows', () => {
    const logs = [log(d(0)), log(d(43)), log(d(1)), log(d(2), { nutrition_logged: false, workout_attended: true })]
    expect(rewardDays(logs, START)).toBe(1)
  })
})

describe('current_streak', () => {
  it('counts consecutive marked days up to today', () => {
    expect(currentStreak(marked(range(1, 5)), START, d(5))).toBe(5)
  })

  it('an unmarked today neither counts nor breaks — it reads from yesterday', () => {
    expect(currentStreak(marked(range(1, 5)), START, d(6))).toBe(5)
  })

  it('one free day in a calendar week does not break the streak', () => {
    // Days 1–5 marked, day 3 missed (Tuesday). Same week.
    expect(currentStreak(marked(without(range(1, 5), 3)), START, d(5))).toBe(5)
  })

  it('a second missed day in the same calendar week breaks it', () => {
    // Days 2 and 4 missed, both in week 1 → the walk back stops at day 2.
    expect(currentStreak(marked(without(range(1, 6), 2, 4)), START, d(6))).toBe(4) // 6, 5, 4(free), 3
  })

  it('one free day in each of two different weeks is fine', () => {
    // Day 5 (week 1) and day 10 (week 2) missed.
    const days = without(range(1, 12), 5, 10)
    expect(currentStreak(marked(days), START, d(12))).toBe(12)
  })

  it('missing yesterday and today is still one free day while today is open', () => {
    // Marked through day 4, missed day 5, today (day 6) not marked yet.
    expect(currentStreak(marked(range(1, 4)), START, d(6))).toBe(5)
  })

  it('the free day is per calendar week, not per 7 days', () => {
    // Start on a Wednesday: program days do not line up with calendar weeks.
    const wed = '2026-09-09'
    expect(weekday(wed)).toBe(3)
    // Missed Saturday (day 4) and Sunday (day 5): different calendar weeks → no break.
    expect(currentStreak(marked(without(range(1, 8), 4, 5), wed), wed, d(8, wed))).toBe(8)
    // Missed Sunday (day 5) and Tuesday (day 7): same calendar week → break.
    expect(currentStreak(marked(without(range(1, 8), 5, 7), wed), wed, d(8, wed))).toBe(3) // 8, 7(free), 6
  })

  it('a free day at the oldest end, with nothing marked before it, is not counted', () => {
    // Day 1 missed, days 2–4 marked.
    expect(currentStreak(marked(range(2, 4)), START, d(4))).toBe(3)
    // Nothing marked at all.
    expect(currentStreak([], START, d(3))).toBe(0)
  })

  it('is 0 before the start date', () => {
    expect(currentStreak(marked([1]), START, d(0))).toBe(0)
  })

  it('does not count the forgiven day as a marked day for the reward', () => {
    const logs = marked(without(range(1, 5), 3))
    expect(currentStreak(logs, START, d(5))).toBe(5)
    expect(rewardDays(logs, START)).toBe(4)
  })
})

describe('longest_streak', () => {
  it('keeps the best run after a break', () => {
    // 1–10 marked (a run of 10), 11 and 12 missed (same week → break), 13–15 marked.
    // Walking back: 15, 14, 13, then 12 is the week's free day but 11 breaks,
    // so 12 is not followed by a marked day and is dropped.
    const logs = marked([...range(1, 10), ...range(13, 15)])
    expect(currentStreak(logs, START, d(15))).toBe(3)
    expect(longestStreak(logs, START, d(15))).toBe(10)
  })
})

describe('status color', () => {
  const calls = (days: number[]) => days.map((n) => ({ call_date: d(n) }))

  it('green: reporting, on pace with workouts, had a call this week', () => {
    const logs = marked(range(1, 10)).map((l, i) => (i % 3 === 0 ? { ...l, workout_attended: true } : l))
    // Day 10: expected ceil(12*10/42)=3, attended days 1,4,7,10 = 4.
    const s = statusOf({ start: START, today: d(10), logs, calls: calls([6]) })
    expect(s).toEqual({ color: 'green', reasons: [] })
  })

  it('yellow: two days since the last report', () => {
    const logs = marked(range(1, 3)).map((l) => ({ ...l, workout_attended: true }))
    const s = statusOf({ start: START, today: d(5), logs, calls: [] })
    expect(daysSinceLog(logs, START, d(5))).toBe(2)
    expect(s.color).toBe('yellow')
    expect(s.reasons.map((r) => r.code)).toEqual(['no_log'])
  })

  it('yellow: one workout behind the expected pace', () => {
    // Day 4: expected ceil(48/42)=2; attended 1.
    const logs = marked(range(1, 4)).map((l, i) => (i === 0 ? { ...l, workout_attended: true } : l))
    const s = statusOf({ start: START, today: d(4), logs, calls: [] })
    expect(expectedWorkouts(4)).toBe(2)
    expect(s.color).toBe('yellow')
    expect(s.reasons[0].code).toBe('behind_workouts')
  })

  it('red: three days since the last report', () => {
    const logs = marked([1, 2]).map((l) => ({ ...l, workout_attended: true }))
    expect(statusOf({ start: START, today: d(5), logs, calls: [] }).color).toBe('red')
  })

  it('red: no coach call in the last 7 days', () => {
    const logs = marked(range(1, 14)).map((l, i) => (i % 2 === 0 ? { ...l, workout_attended: true } : l))
    expect(missedCall(calls([7]), START, d(13))).toBe(false) // 6 days ago
    expect(missedCall(calls([7]), START, d(14))).toBe(true) // 7 days ago
    const s = statusOf({ start: START, today: d(14), logs, calls: calls([7]) })
    expect(s.color).toBe('red')
    expect(s.reasons.map((r) => r.code)).toEqual(['missed_call'])
  })

  it('a participant in the first week has not missed a call yet', () => {
    expect(missedCall([], START, d(7))).toBe(false)
    expect(missedCall([], START, d(8))).toBe(true)
  })

  it('red: two or more workouts behind', () => {
    // Day 14: expected ceil(168/42)=4; attended 2.
    const logs = marked(range(1, 14)).map((l, i) => (i < 2 ? { ...l, workout_attended: true } : l))
    const s = statusOf({ start: START, today: d(14), logs, calls: calls([10]) })
    expect(s.color).toBe('red')
    expect(s.reasons[0].code).toBe('behind_workouts')
  })

  it('lists red reasons before yellow ones', () => {
    // 2 days without a report (yellow) and no call for 8 days (red).
    const logs = marked(range(1, 8)).map((l) => ({ ...l, workout_attended: true }))
    const s = statusOf({ start: START, today: d(10), logs, calls: [] })
    expect(s.color).toBe('red')
    expect(s.reasons.map((r) => r.color)).toEqual(['red', 'yellow'])
  })
})

describe('conditions, milestones, week strip', () => {
  it('counts weekly measurements and calls by program week', () => {
    const logs = [
      log(d(7), { measurement_logged: true }),
      log(d(8), { measurement_logged: true }), // week 2
      log(d(9), { measurement_logged: true }), // week 2 again: still one week
    ]
    const c = conditions({ start: START, today: d(14), logs, calls: [{ call_date: d(3) }, { call_date: d(5) }] })
    expect(c.find((x) => x.key === 'measurements')).toMatchObject({ value: 2, target: 6, expectedByNow: 2 })
    expect(c.find((x) => x.key === 'calls')).toMatchObject({ value: 1, target: 6 })
  })

  it('measurement day is the last day of each program week', () => {
    expect([6, 7, 8, 14, 42, 49].map((n) => isMeasurementDay(START, d(n)))).toEqual([false, true, false, true, true, false])
  })

  it('earns milestones from the data', () => {
    const logs = marked(range(1, 18)).map((l, i) => (i < 10 ? { ...l, workout_attended: true } : l))
    expect(earnedMilestones(logs, START)).toEqual(['first_workout', 'week_1', 'halfway', 'ten_workouts'])
    expect(earnedMilestones(marked(range(1, 36)), START)).toContain('reward_earned')
  })

  it('draws the week strip Sunday to Saturday', () => {
    // Today = day 10 (Tuesday of week 2). Day 8 marked, day 9 missed.
    const dots = weekDots(marked([8, 10]), START, d(10))
    expect(dots.map((x) => x.state)).toEqual(['done', 'missed', 'done', 'future', 'future', 'future', 'future'])
    expect(weekDots(marked([8]), START, d(10))[2].state).toBe('today')
  })
})

describe('forecast and snapshot', () => {
  const goal: Goal = {
    participant_id: 'p',
    goal_type: 'weight',
    goal_text: 'לרדת ל-80',
    goal_value: 80,
    start_weight: 86,
    start_body_fat: null,
    start_measurements: null,
    set_at: START,
    achieved: null,
  }

  it('projects a steady reporter to the reward and the goal', () => {
    const logs = marked(range(1, 21)).map((l, i) => ({
      ...l,
      workout_attended: i % 7 < 3,
      measurement_logged: (i + 1) % 7 === 0,
      weight: (i + 1) % 7 === 0 ? 86 - ((i + 1) / 7) * 1.2 : null,
    }))
    const calls = [3, 10, 17].map((n) => ({ call_date: d(n) }))
    const f = forecast({ start: START, today: d(21), logs, calls, goal })
    expect(f.likelyReward).toBe(true)
    expect(f.goalOnTrack).toBe(true)
    expect(f.likelyGoal).toBe(true)
  })

  it('knows when the reward is out of reach', () => {
    const logs = marked(range(1, 5))
    const f = forecast({ start: START, today: d(20), logs, calls: [], goal: null })
    expect(f.likelyReward).toBe(false) // 5 + 23 open days < 36
  })

  it('assembles one snapshot for the screens', () => {
    const s = snapshot({ start: START, today: d(9), logs: marked(range(1, 9)), calls: [], goal })
    expect(s).toMatchObject({ dayNumber: 9, daysLeft: 33, loggedToday: true, currentStreak: 9, rewardDays: 9, rewardRemaining: 27 })
    expect(s.weight.start).toBe(86)
  })
})
