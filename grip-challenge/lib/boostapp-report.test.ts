import { describe, expect, it } from 'vitest'
import { isAttended, parseAttendanceReport } from './boostapp-report'

const rows = [
  ['דוח נוכחות | BOOSTAPP', 'דוח נוכחות | BOOSTAPP'],
  ['', 'שם לקוח', 'סניף', 'טלפון', 'מנוי', 'שיעור', 'תאריך שיעור', 'שעת שיעור', 'סטטוס', 'מדריך'],
  ['', 'דנה לוי', 'סניף ראשי', '+972501234567', 'אתגר', 'wod', '13/09/2026', '20:00', 'הגיע לשיעור/מומש', 'לואיזה'],
  ['', 'דנה לוי', 'סניף ראשי', '+972501234567', 'אתגר', 'HYROX', '15/09/2026', '18:00', 'בוטל', 'לואיזה'],
  ['', 'דנה לוי', 'סניף ראשי', '+972501234567', 'אתגר', 'אימון אישי', '16/09/2026', '21:00', 'פעיל/מומש', 'יובל'],
  ['', 'יוסי', 'סניף ראשי', '+972509999999', 'שנתי', 'open gym', '19/09/2026', '07:00', 'לא הגיע', 'רון'],
  ['', '', '', '', '', '', '', '', '', ''],
]

describe('Boostapp attendance report', () => {
  it('reads the export layout and the date range', () => {
    const r = parseAttendanceReport(rows)
    expect(r.visits).toHaveLength(4)
    expect(r.from).toBe('2026-09-13')
    expect(r.to).toBe('2026-09-19')
    expect(r.visits[0]).toMatchObject({ phone: '972501234567', date: '2026-09-13', className: 'wod', attended: true })
  })
  it('counts every redeemed class, personal training included', () => {
    const r = parseAttendanceReport(rows)
    expect(r.visits.map((v) => v.attended)).toEqual([true, false, true, false]) // cancelled and no-show do not count
    expect(isAttended('פעיל/מומש')).toBe(true)
    expect(isAttended('ביטול מאוחר')).toBe(false)
  })
  it('rejects a file that is not the attendance report', () => {
    expect(() => parseAttendanceReport([['a', 'b']])).toThrow(/טלפון/)
  })
})
