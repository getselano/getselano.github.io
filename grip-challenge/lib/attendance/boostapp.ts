import { todayIL } from '../dates'
import type { AttendanceProvider, AttendanceRecord } from './provider'

/**
 * Boostapp. What is known from Boostapp support:
 *   base URL  https://rest.lee.co.il   (e.g. POST /leads/create-new-lead)
 *   auth      header `x-api-key: <business API KEY>` (Settings → General → Business details)
 *   requests  POST with a JSON body
 * Still missing: the endpoint that returns a client's check-ins. Once known,
 * set BOOSTAPP_ATTENDANCE_PATH (and adjust `fetchCheckIns` to its response),
 * then turn it on with ATTENDANCE_PROVIDER=boostapp.
 *
 * Participants are matched to Boostapp clients by phone number.
 */
export class BoostappAttendanceProvider implements AttendanceProvider {
  readonly selfReport = false

  constructor(
    private readonly phoneFor: (participantId: string) => Promise<string | null>,
    private readonly apiUrl = process.env.BOOSTAPP_API_URL || 'https://rest.lee.co.il',
    private readonly apiKey = process.env.BOOSTAPP_API_KEY || '',
    private readonly attendancePath = process.env.BOOSTAPP_ATTENDANCE_PATH || '',
  ) {}

  isAvailable(): boolean {
    return !!(this.apiUrl && this.apiKey && this.attendancePath)
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
    const res = await fetch(new URL(this.attendancePath, this.apiUrl), {
      method: 'POST',
      headers: { 'x-api-key': this.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, from, to }),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Boostapp attendance: HTTP ${res.status}`)
    // TODO(boostapp): map the real response shape once the endpoint is documented.
    const body = (await res.json()) as { items?: { date: string }[] }
    return body.items ?? []
  }
}
