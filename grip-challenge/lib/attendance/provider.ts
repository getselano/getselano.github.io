// Attendance behind one interface (spec §10). The rest of the system talks
// only to AttendanceProvider; swapping manual ↔ Boostapp touches no screen.

export interface AttendanceRecord {
  participantId: string
  /** 'YYYY-MM-DD', Asia/Jerusalem. */
  date: string
  attended: boolean
  /** Confirmed by staff (manual) or by the source system (Boostapp). */
  confirmed: boolean
  source: 'manual' | 'boostapp'
}

export interface AttendanceProvider {
  getAttendance(participantId: string, from: Date, to: Date): Promise<AttendanceRecord[]>
  isAvailable(): boolean
  /**
   * Whether the participant reports attendance themselves ("הגעתי לאימון").
   * Manual: yes. Boostapp: no — check-ins arrive from the club system and the
   * card shows them read-only.
   */
  readonly selfReport: boolean
}
