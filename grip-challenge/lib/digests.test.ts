import { describe, expect, it } from 'vitest'
import { snapshot } from './calc'
import { addDays } from './dates'
import { coachEveningMissing, coachMorningFor, nutriMorningFor } from './digests'
import type { DailyLog, Goal, Participant, ParticipantBundle } from './types'

const today = '2026-10-04' // a Sunday
function row(name: string, o: { day?: number; calls?: number[]; logged?: number[]; slot?: [number, string]; goal?: boolean; joinedDaysAgo?: number } = {}) {
  const day = o.day ?? 10
  const start = addDays(today, -(day - 1))
  const p = {
    id: name, full_name: `${name} כהן`, phone: '972', email: null, start_date: start, end_date: addDays(start, 41), price: 2500,
    coach_id: 'c', nutritionist_id: 'n', status: 'active', marketing_consent: false,
    created_at: `${addDays(today, -(o.joinedDaysAgo ?? day))}T09:00:00Z`,
    call_weekday: o.slot?.[0] ?? null, call_time: o.slot?.[1] ?? null,
  } as Participant
  const logs: DailyLog[] = (o.logged ?? Array.from({ length: day }, (_, i) => i + 1)).map((n) => ({ log_date: addDays(start, n - 1), nutrition_logged: true, workout_attended: true, measurement_logged: false, weight: null }))
  const calls = (o.calls ?? [day]).map((n) => ({ participant_id: name, staff_id: 'c', call_date: addDays(start, n - 1), summary: null, risk_flag: false }))
  const goal = o.goal === false ? null : ({ goal_type: 'weight', goal_text: 'x' } as Goal)
  const bundle: ParticipantBundle = { participant: p, goal, logs, calls, milestones: [] }
  return { bundle, snap: snapshot({ start, today, logs, calls, goal }) }
}

describe('digests', () => {
  it('coach morning: today\'s slots, weeks about to go red, missing intro calls', () => {
    const m = coachMorningFor(
      [
        row('רונית', { slot: [0, '10:00:00'] }),
        row('דנה', { slot: [0, '08:30'] }),
        row('יוסי', { calls: [4] }), // day 10, last call day 4 → 6 days
        row('גיל', { calls: [], day: 4, joinedDaysAgo: 4 }),
        row('טל', { calls: [], day: 2, joinedDaysAgo: 2 }), // joined 2 days ago: not yet
      ],
      today,
    )
    expect(m.today).toEqual([{ name: 'דנה', time: '08:30' }, { name: 'רונית', time: '10:00' }])
    expect(m.weekEnding).toEqual([{ name: 'יוסי', days: 6 }])
    expect(m.noFirstCall).toEqual([{ name: 'גיל', days: 4 }])
  })

  it('coach evening: slots today with no call logged today', () => {
    expect(coachEveningMissing([row('רונית', { slot: [0, '10:00'], calls: [5] }), row('דנה', { slot: [0, '12:00'] })], today)).toEqual(['רונית'])
  })

  it('nutritionist morning: no report for 2+ days, no goal after 3 days, ending on day 42', () => {
    const m = nutriMorningFor(
      [
        row('רונית', { logged: [1, 2, 3, 4, 5, 6, 7, 8] }), // day 10, last log day 8 → 2 days
        row('דנה', { goal: false, joinedDaysAgo: 3 }),
        row('יוסי', { day: 40 }),
        row('גיל'),
      ],
      today,
    )
    expect(m.noLog).toEqual([{ name: 'רונית', days: 2 }])
    expect(m.noGoal).toEqual([{ name: 'דנה', days: 3 }])
    expect(m.ending.map((x) => x.name)).toEqual(['יוסי'])
  })
})
