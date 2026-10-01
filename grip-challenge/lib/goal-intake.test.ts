import { describe, expect, it } from 'vitest'
import { goalTypeFrom, parseGoalIntake, redact } from './goal-intake'

const body = {
  source: 'grip-signing',
  signedAt: '2026-10-01T09:15:00Z',
  fullName: 'דנה לוי',
  idNumber: '012345678',
  phone: '050-123-4567',
  email: 'dana@example.com',
  startDate: '04/10/2026',
  endDate: '14/11/2026',
  nutritionist: 'טל',
  callDate: '01/10/2026',
  goalType: 'משקל',
  goalText: 'לרדת ל-72 ק"ג',
  goalWhy: 'להרגיש טוב בחתונה',
  startWeight: '78.5 ק"ג',
  startFat: '31%',
  startGirth: 'מותן 84',
  pdfUrl: 'https://drive.google.com/file/d/abc/view',
  confirmedBy: 'דנה לוי',
}

describe('parseGoalIntake', () => {
  it('maps the signing form fields', () => {
    const r = parseGoalIntake(body)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.input).toMatchObject({
      phone: '972501234567',
      full_name: 'דנה לוי',
      start_date: '2026-10-04',
      signed_at: '2026-10-01T09:15:00.000Z',
      pdf_url: 'https://drive.google.com/file/d/abc/view',
      goal: { goal_type: 'weight', goal_text: 'לרדת ל-72 ק"ג', goal_why: 'להרגיש טוב בחתונה', start_weight: 78.5, start_body_fat: 31, start_measurements: 'מותן 84' },
      details: { nutritionist: 'טל', callDate: '01/10/2026', confirmedBy: 'דנה לוי' },
    })
    expect(JSON.stringify(r.input)).not.toContain('012345678')
  })

  it('the same moment in two spellings is one signature', () => {
    const a = parseGoalIntake(body)
    const b = parseGoalIntake({ ...body, signedAt: '2026-10-01T12:15:00.000+03:00' })
    expect(a.ok && b.ok && a.input.signed_at === b.input.signed_at).toBe(true)
  })

  it('names what is missing or malformed', () => {
    const r = parseGoalIntake({ ...body, phone: '123', goalText: ' ', signedAt: '01/10/2026', pdfUrl: 'http://x' })
    expect(r).toEqual({ ok: false, problems: ['phone', 'goalText', 'signedAt (ISO 8601)', 'pdfUrl (https)'] })
  })

  it('reads goal types in Hebrew and English', () => {
    expect(goalTypeFrom('אחוז שומן')).toBe('body_fat')
    expect(goalTypeFrom('ירידה במשקל של 5 ק"ג')).toBe('weight')
    expect(goalTypeFrom('measurements')).toBe('measurements')
    expect(goalTypeFrom('כושר כללי')).toBe('other')
  })

  it('the log never keeps a full ID number', () => {
    expect(redact(body)).toMatchObject({ idNumber: '••••678' })
  })
})
