// Boostapp's weekly attendance report (Excel export) → who attended what day.
// Pure: takes the sheet as rows of cell text, so it is testable without a file.
//
// Layout seen in the export: a title row ("דוח נוכחות | BOOSTAPP"), then a
// header row with שם לקוח · סניף · טלפון · מנוי · שיעור · תאריך שיעור ·
// שעת שיעור · סטטוס · מדריך, then one row per booking.
import type { ISODate } from './dates'
import { parseDate } from './intake'
import { normalizePhone } from './phone'

export interface Visit {
  phone: string | null
  name: string
  date: ISODate
  className: string
  status: string
  attended: boolean
}

export interface ParsedReport {
  from: ISODate | null
  to: ISODate | null
  visits: Visit[]
  /** Rows that could not be read (no date), for the summary. */
  skipped: number
}

/** A booking counts as attendance only when it was redeemed ("מומש"). */
export function isAttended(status: string): boolean {
  return /מומש/.test(status) && !/בוטל|לא הגיע/.test(status)
}

/**
 * Classes that are not challenge workouts. Personal training sessions are
 * booked in Boostapp too; they are not part of the 18 group workouts.
 */
export const EXCLUDED_CLASSES = [/אימון אישי/]

const HEADERS = { name: 'שם לקוח', phone: 'טלפון', className: 'שיעור', date: 'תאריך שיעור', status: 'סטטוס' } as const

export function parseAttendanceReport(rows: string[][]): ParsedReport {
  const headerIdx = rows.findIndex((r) => r.some((c) => c.trim() === HEADERS.phone) && r.some((c) => c.trim() === HEADERS.date))
  if (headerIdx < 0) throw new Error('לא נמצאה שורת כותרות עם "טלפון" ו"תאריך שיעור". זה דוח הנוכחות של בוסטאפ?')
  const header = rows[headerIdx].map((c) => c.trim())
  const col = (name: string) => header.indexOf(name)
  const c = { name: col(HEADERS.name), phone: col(HEADERS.phone), className: col(HEADERS.className), date: col(HEADERS.date), status: col(HEADERS.status) }

  const visits: Visit[] = []
  let skipped = 0
  for (const r of rows.slice(headerIdx + 1)) {
    if (!r.some((x) => x && x.trim())) continue
    const date = parseDate(r[c.date])
    if (!date) {
      skipped++
      continue
    }
    const status = (r[c.status] ?? '').trim()
    const className = (r[c.className] ?? '').trim()
    visits.push({
      phone: normalizePhone(r[c.phone] ?? ''),
      name: (r[c.name] ?? '').trim(),
      date,
      className,
      status,
      attended: isAttended(status) && !EXCLUDED_CLASSES.some((re) => re.test(className)),
    })
  }
  const dates = visits.map((v) => v.date).sort()
  return { from: dates[0] ?? null, to: dates[dates.length - 1] ?? null, visits, skipped }
}
