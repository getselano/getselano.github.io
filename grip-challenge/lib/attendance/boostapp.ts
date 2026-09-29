import { todayIL } from '../dates'
import type { AttendanceProvider, AttendanceRecord } from './provider'

/**
 * Skeleton for Boostapp. Whether Boostapp exposes an attendance API is still
 * being checked; when it is, fill in `fetchCheckIns` and turn it on with
 * ATTENDANCE_PROVIDER=boostapp (plus BOOSTAPP_API_URL / BOOSTAPP_API_KEY).
 *
 * Participants are matched to Boostapp clients by phone number.
 */
export class BoostappAttendanceProvider implements AttendanceProvider {
  readonly selfReport = false

  constructor(
    private readonly phoneFor: (participantId: string) => Promise<string | null>,
    private readonly apiUrl = process.env.BOOSTAPP_API_URL || '',
    private readonly apiKey = process.env.BOOSTAPP_API_KEY || '',
  ) {}

  isAvailable(): boolean {
    return !!(this.apiUrl && this.apiKey)
  }

  async getAttendance(participantId: string, from: Date, to: Date): Promise<AttendanceRecord[]> {
    if (!this.isAvailable()) return []
    const phone = await this.phoneFor(participantId)
    if (!phone) return []
    const checkIns = await this.fetchCheckIns(phone, todayIL(from), todayIL(to))
    const days = new Set(checkIns.map((c) => c.date))
    return [...days].sort().map((date) => ({ participantId, date, attended: true, confirmed: true, source: 'boostapp' as const }))
  }

  /**
   * TODO(boostapp): replace with the real endpoint once the API is confirmed.
   * Expected to return one entry per class the client checked into.
   */
  protected async fetchCheckIns(phone: string, from: string, to: string): Promise<{ date: string }[]> {
    const url = new URL('/attendance', this.apiUrl)
    url.searchParams.set('phone', phone)
    url.searchParams.set('from', from)
    url.searchParams.set('to', to)
    const res = await fetch(url, { headers: { Authorization: `Bearer ${this.apiKey}` }, cache: 'no-store' })
    if (!res.ok) throw new Error(`Boostapp attendance: HTTP ${res.status}`)
    const body = (await res.json()) as { items?: { date: string }[] }
    return body.items ?? []
  }
}
