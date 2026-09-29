import { describe, expect, it } from 'vitest'
import { snapshot } from './calc'
import { addDays } from './dates'
import { dailyReminder, staffSummary, weeklySummary, welcomeMessage } from './messages'
import type { DailyLog, Participant } from './types'

const START = '2026-09-06' // Sunday
const today = addDays(START, 16) // day 17, Tuesday of week 3

function row(name: string, days: number[], opts: Partial<Participant> = {}) {
  const logs: DailyLog[] = days.map((n) => ({ log_date: addDays(START, n - 1), nutrition_logged: true, workout_attended: n % 3 === 0, measurement_logged: false, weight: null }))
  const participant = { id: name, full_name: name, phone: '972500000000', start_date: START, status: 'active', ...opts } as Participant
  return { bundle: { participant, goal: null, logs, calls: [], milestones: [] }, snap: snapshot({ start: START, today, logs, calls: [], goal: null }) }
}

describe('messages', () => {
  it('daily reminder leads with the streak', () => {
    const m = dailyReminder(row('דנה כהן', Array.from({ length: 16 }, (_, i) => i + 1)))
    expect(m.params[0]).toBe('דנה')
    expect(m.text).toContain('16 ימים של עבודה עומדים על הקו')
  })
  it('weekly summary compares with the same person last week only', () => {
    // Last week (days 8–14): 4 marked. This week so far (15–17): 3.
    const m = weeklySummary(row('יוסי', [1, 2, 3, 8, 9, 10, 11, 15, 16, 17]))
    expect(m.text).toContain('השבוע סימנת 3 ימים (בשבוע שעבר 4)')
    expect(m.params).toHaveLength(3)
  })
  it('staff summary names the red ones', () => {
    const red = row('מאיה', [1, 2, 3])
    const green = row('גיל', Array.from({ length: 17 }, (_, i) => i + 1))
    const m = staffSummary('רון', [red, green])
    expect(m.text).toContain('לשיחה השבוע: מאיה')
  })
  it('welcome message has the app link and the start date', () => {
    const m = welcomeMessage({ full_name: 'רונית לוי', start_date: '2026-10-04' }, 'https://grip-challenge.netlify.app', '2026-09-29')
    expect(m.text).toContain('היי רונית')
    expect(m.text).toContain('מתחיל ב-4.10.2026')
    expect(m.text).toContain('https://grip-challenge.netlify.app')
    expect(welcomeMessage({ full_name: 'רונית', start_date: '2026-09-29' }, 'u', '2026-09-29').text).toContain('מתחיל היום')
  })
})
