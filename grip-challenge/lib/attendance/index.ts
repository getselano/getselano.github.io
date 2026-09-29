import { addDays } from '../dates'
import { PROGRAM_DAYS } from '../program'
import type { DailyLog, ParticipantBundle } from '../types'
import { BoostappAttendanceProvider } from './boostapp'
import { ManualAttendanceProvider } from './manual'
import type { AttendanceProvider } from './provider'

export type { AttendanceProvider, AttendanceRecord } from './provider'

/** Manual by default; Boostapp when ATTENDANCE_PROVIDER=boostapp and it is configured. */
export function attendanceProvider(bundles: ParticipantBundle[]): AttendanceProvider {
  const byId = new Map(bundles.map((b) => [b.participant.id, b]))
  if (process.env.ATTENDANCE_PROVIDER === 'boostapp') {
    const boostapp = new BoostappAttendanceProvider(async (id) => byId.get(id)?.participant.phone ?? null)
    if (boostapp.isAvailable()) return boostapp
  }
  return new ManualAttendanceProvider(async (id) => byId.get(id)?.logs ?? [])
}

/** Whether participants mark attendance themselves under the active provider. */
export function attendanceIsSelfReported(): boolean {
  return attendanceProvider([]).selfReport
}

/**
 * Puts the provider's attendance into each bundle's daily logs, so the
 * calculations read one source whatever the provider is.
 */
export async function withAttendance(bundles: ParticipantBundle[]): Promise<ParticipantBundle[]> {
  const provider = attendanceProvider(bundles)
  return Promise.all(
    bundles.map(async (b) => {
      const from = new Date(`${b.participant.start_date}T12:00:00Z`)
      const to = new Date(`${addDays(b.participant.start_date, PROGRAM_DAYS - 1)}T12:00:00Z`)
      let records
      try {
        records = await provider.getAttendance(b.participant.id, from, to)
      } catch (e) {
        console.error('attendance provider failed; keeping stored attendance', e)
        return b
      }
      const attended = new Map(records.filter((r) => r.attended).map((r) => [r.date, r]))
      const logs: DailyLog[] = b.logs.map((l) => ({ ...l, workout_attended: attended.has(l.log_date) }))
      for (const [date] of attended) {
        if (!logs.some((l) => l.log_date === date))
          logs.push({ log_date: date, nutrition_logged: false, workout_attended: true, measurement_logged: false, weight: null })
      }
      return { ...b, logs }
    }),
  )
}

