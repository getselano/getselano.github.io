import { TIME_ZONE } from './program'

// All dates in the app are calendar dates as 'YYYY-MM-DD' strings, taken in
// Asia/Jerusalem. Arithmetic is done in UTC on those strings, so it never
// shifts across DST or the device's own time zone.
export type ISODate = string

const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23' })

/** Today's date in Jerusalem. */
export function todayIL(now: Date = new Date()): ISODate {
  return dateFmt.format(now)
}

/** Current hour (0–23) in Jerusalem. */
export function hourIL(now: Date = new Date()): number {
  return Number(hourFmt.format(now))
}

function toUTC(d: ISODate): number {
  const [y, m, day] = d.split('-').map(Number)
  return Date.UTC(y, m - 1, day)
}

function fromUTC(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10)
}

export function addDays(d: ISODate, n: number): ISODate {
  return fromUTC(toUTC(d) + n * 86_400_000)
}

/** b − a in whole days. */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000)
}

/** 0 = Sunday … 6 = Saturday. */
export function weekday(d: ISODate): number {
  return new Date(toUTC(d)).getUTCDay()
}

/** Sunday that opens the calendar week (Israeli week, א׳–ש׳). */
export function weekStart(d: ISODate): ISODate {
  return addDays(d, -weekday(d))
}

export function rangeDays(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

export const HEB_WEEKDAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
export const HEB_WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

/** "12.10" style short date. */
export function shortDate(d: ISODate): string {
  const [, m, day] = d.split('-')
  return `${Number(day)}.${Number(m)}`
}

/** "2.11.2026" full date. */
export function fullDate(d: ISODate): string {
  const [y, m, day] = d.split('-')
  return `${Number(day)}.${Number(m)}.${y}`
}

const dateTimeFmt = new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/** A timestamp as Jerusalem date and time: "1.10.2026, 12:15". */
export function dateTimeIL(ts: string): string {
  return dateTimeFmt.format(new Date(ts))
}
