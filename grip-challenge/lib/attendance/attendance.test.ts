import { afterEach, describe, expect, it, vi } from 'vitest'
import { attendanceProvider, withAttendance } from '.'
import { BoostappAttendanceProvider } from './boostapp'
import type { ParticipantBundle } from '../types'

const bundle: ParticipantBundle = {
  participant: { id: 'p', full_name: 'x', phone: '972500000000', email: null, start_date: '2026-09-06', end_date: '2026-10-17', price: 2500, coach_id: null, nutritionist_id: null, status: 'active', marketing_consent: false, created_at: '' },
  goal: null,
  logs: [
    { log_date: '2026-09-06', nutrition_logged: true, workout_attended: true, measurement_logged: false, weight: null, workout_confirmed_by: 'c' },
    { log_date: '2026-09-08', nutrition_logged: true, workout_attended: false, measurement_logged: false, weight: null },
  ],
  calls: [],
  milestones: [],
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('AttendanceProvider', () => {
  it('manual is the default and reads the participant marks', async () => {
    const p = attendanceProvider([bundle])
    expect(p.selfReport).toBe(true)
    const recs = await p.getAttendance('p', new Date('2026-09-06T12:00Z'), new Date('2026-10-17T12:00Z'))
    expect(recs).toEqual([{ participantId: 'p', date: '2026-09-06', attended: true, confirmed: true, source: 'manual' }])
    expect((await withAttendance([bundle]))[0].logs).toEqual(bundle.logs.map((l) => ({ ...l })))
  })

  it('boostapp stays off until configured, even when the flag is set', () => {
    vi.stubEnv('ATTENDANCE_PROVIDER', 'boostapp')
    expect(attendanceProvider([bundle]).selfReport).toBe(true)
  })

  it('switching to boostapp changes the data, not the callers', async () => {
    vi.stubEnv('ATTENDANCE_PROVIDER', 'boostapp')
    vi.stubEnv('BOOSTAPP_API_URL', 'https://boostapp.test')
    vi.stubEnv('BOOSTAPP_API_KEY', 'k')
    vi.stubEnv('BOOSTAPP_ATTENDANCE_PATH', '/clients/check-ins')
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ items: [{ date: '2026-09-08' }, { date: '2026-09-10' }] }))))
    expect(attendanceProvider([bundle])).toBeInstanceOf(BoostappAttendanceProvider)
    const [b] = await withAttendance([bundle])
    const attended = b.logs.filter((l) => l.workout_attended).map((l) => l.log_date).sort()
    expect(attended).toEqual(['2026-09-08', '2026-09-10'])
  })
})
