import { todayIL } from '../dates'
import type { DailyLog } from '../types'
import type { AttendanceProvider, AttendanceRecord } from './provider'

/**
 * The participant marks "הגעתי לאימון" in daily_logs and it counts at once;
 * staff only remove a mistaken mark. No daily confirmation.
 * Reads through whatever loads daily_logs for the caller (RLS-scoped).
 */
export class ManualAttendanceProvider implements AttendanceProvider {
  readonly selfReport = true

  constructor(private readonly logsFor: (participantId: string) => Promise<DailyLog[]>) {}

  isAvailable(): boolean {
    return true
  }

  async getAttendance(participantId: string, from: Date, to: Date): Promise<AttendanceRecord[]> {
    const a = todayIL(from)
    const b = todayIL(to)
    const logs = await this.logsFor(participantId)
    return logs
      .filter((l) => l.workout_attended && l.log_date >= a && l.log_date <= b)
      .map((l) => ({
        participantId,
        date: l.log_date,
        attended: true,
        confirmed: !!l.workout_confirmed_by,
        source: 'manual' as const,
      }))
  }
}
