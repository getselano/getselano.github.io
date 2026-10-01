// The signed goal appendix from the signing form → a GoalIntake. Pure:
// everything here is checked in lib/goal-intake.test.ts.
import type { GoalIntake } from './data/repo'
import { parseDate, parseNum } from './intake'
import { normalizePhone } from './phone'
import type { GoalType } from './types'

const TYPES: Record<string, GoalType> = {
  weight: 'weight', body_fat: 'body_fat', measurements: 'measurements', attendance: 'attendance', other: 'other',
  'משקל': 'weight', 'ירידה במשקל': 'weight', 'אחוז שומן': 'body_fat', 'אחוזי שומן': 'body_fat', 'שומן': 'body_fat',
  'היקפים': 'measurements', 'היקף': 'measurements', 'נוכחות': 'attendance', 'אחר': 'other',
}

export function goalTypeFrom(v: unknown): GoalType {
  const s = String(v ?? '').trim().toLowerCase()
  return TYPES[s] ?? (/משקל|weight/.test(s) ? 'weight' : /שומן|fat/.test(s) ? 'body_fat' : /היקפ|girth|measure/.test(s) ? 'measurements' : 'other')
}

const str = (v: unknown, max = 2000) => {
  const s = String(v ?? '').trim()
  return s ? s.slice(0, max) : null
}

export type Parsed = { ok: true; input: GoalIntake } | { ok: false; problems: string[] }

export function parseGoalIntake(b: Record<string, unknown>): Parsed {
  const problems: string[] = []
  const phone = normalizePhone(String(b.phone ?? ''))
  if (!phone) problems.push('phone')
  const full_name = str(b.fullName, 200)
  if (!full_name) problems.push('fullName')
  const goal_text = str(b.goalText)
  if (!goal_text) problems.push('goalText')
  const t = Date.parse(String(b.signedAt ?? ''))
  if (!/^\d{4}-\d{2}-\d{2}T/.test(String(b.signedAt ?? '')) || Number.isNaN(t)) problems.push('signedAt (ISO 8601)')
  const pdf = str(b.pdfUrl, 1000)
  if (pdf && !/^https:\/\//i.test(pdf)) problems.push('pdfUrl (https)')
  if (problems.length) return { ok: false, problems }

  return {
    ok: true,
    input: {
      phone: phone!,
      full_name: full_name!,
      email: str(b.email, 200),
      start_date: parseDate(b.startDate),
      // Normalized, so "…:00Z" and "…:00.000Z" are the same signature.
      signed_at: new Date(t).toISOString(),
      pdf_url: pdf,
      goal: {
        goal_type: goalTypeFrom(b.goalType),
        goal_text: goal_text!,
        goal_why: str(b.goalWhy),
        start_weight: parseNum(b.startWeight),
        start_body_fat: parseNum(b.startFat),
        start_measurements: str(b.startGirth, 500),
      },
      // Kept as sent, alongside the record. idNumber stays in the deal, not here.
      details: {
        source: str(b.source, 100),
        nutritionist: str(b.nutritionist, 200),
        callDate: str(b.callDate, 100),
        confirmedBy: str(b.confirmedBy, 200),
        goalType: str(b.goalType, 100),
        startDate: str(b.startDate, 100),
        endDate: str(b.endDate, 100),
      },
    },
  }
}

/** What the log keeps of a request: everything but the ID number. */
export function redact(b: unknown): unknown {
  if (!b || typeof b !== 'object' || Array.isArray(b)) return b
  const { idNumber, ...rest } = b as Record<string, unknown>
  return idNumber == null ? rest : { ...rest, idNumber: '••••' + String(idNumber).slice(-3) }
}
