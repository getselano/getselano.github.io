import { describe, expect, it } from 'vitest'
import { planAttendanceImport } from './attendance-import'
import type { ParsedReport } from './boostapp-report'
import type { ParticipantBundle } from './types'

function bundle(id: string, phone: string, start: string, attended: string[] = []): ParticipantBundle {
  return {
    participant: { id, full_name: id, phone, email: null, start_date: start, end_date: '', price: 2500, coach_id: null, nutritionist_id: null, status: 'active', marketing_consent: false, created_at: '' },
    goal: null,
    logs: attended.map((d) => ({ log_date: d, nutrition_logged: true, workout_attended: true, measurement_logged: false, weight: null })),
    calls: [],
    milestones: [],
  }
}
const visit = (phone: string, date: string, attended = true) => ({ phone, name: '', date, className: 'wod', status: attended ? 'הגיע לשיעור/מומש' : 'בוטל', attended })

describe('planAttendanceImport', () => {
  const report: ParsedReport = {
    from: '2026-09-13',
    to: '2026-09-19',
    skipped: 0,
    visits: [
      visit('972500000001', '2026-09-13'),
      visit('972500000001', '2026-09-13'), // two classes the same day: one workout day
      visit('972500000001', '2026-09-15', false),
      visit('972500000099', '2026-09-14'), // not in the challenge
      visit('972500000002', '2026-09-01'), // before this participant started
    ],
  }

  it('adds attended days for challenge participants only, once per day', () => {
    const plan = planAttendanceImport(report, [bundle('a', '972500000001', '2026-09-10'), bundle('b', '972500000002', '2026-09-12')], { removeUnconfirmed: false })
    expect(plan.add).toEqual([{ participantId: 'a', name: 'a', date: '2026-09-13' }])
    expect(plan.otherRows).toBe(1)
    expect(plan.matched).toBe(2)
  })

  it('skips days already marked', () => {
    const plan = planAttendanceImport(report, [bundle('a', '972500000001', '2026-09-10', ['2026-09-13'])], { removeUnconfirmed: false })
    expect(plan.add).toEqual([])
  })

  it('removes self-marked days the report does not back, only inside the report range', () => {
    const b = bundle('a', '972500000001', '2026-09-10', ['2026-09-11', '2026-09-15'])
    expect(planAttendanceImport(report, [b], { removeUnconfirmed: true }).remove).toEqual([{ participantId: 'a', name: 'a', date: '2026-09-15' }])
    expect(planAttendanceImport(report, [b], { removeUnconfirmed: false }).remove).toEqual([])
  })

  it('never removes marks of someone missing from the report; lists them instead', () => {
    const missing = bundle('c', '972500000003', '2026-09-10', ['2026-09-14'])
    const plan = planAttendanceImport(report, [missing], { removeUnconfirmed: true })
    expect(plan.remove).toEqual([])
    expect(plan.notFound).toEqual([{ participantId: 'c', name: 'c' }])
  })
})
