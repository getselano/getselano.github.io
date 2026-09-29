// Goal appendix (נספח היעד) → goals + opening measurements, matched by phone.
import { NextResponse } from 'next/server'
import { serviceRepo } from '@/lib/data'
import { todayIL } from '@/lib/dates'
import { normalizePhone } from '@/lib/phone'
import { bearer, secretMatches } from '@/lib/secret'
import type { GoalType } from '@/lib/types'

const TYPES: GoalType[] = ['weight', 'body_fat', 'measurements', 'attendance', 'other']
const n = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))

export async function POST(req: Request) {
  if (!secretMatches(bearer(req), process.env.INTAKE_SECRET)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let b: Record<string, unknown>
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const phone = normalizePhone(String(b.phone ?? ''))
  const goal_text = String(b.goal_text ?? '').trim()
  const goal_type = (TYPES.includes(b.goal_type as GoalType) ? b.goal_type : 'other') as GoalType
  if (!phone || !goal_text) return NextResponse.json({ error: 'phone and goal_text are required' }, { status: 422 })
  const ok = await serviceRepo().upsertGoalByPhone(phone, {
    goal_type,
    goal_text,
    goal_value: n(b.goal_value),
    start_weight: n(b.start_weight),
    start_body_fat: n(b.start_body_fat),
    start_measurements: b.start_measurements ? String(b.start_measurements) : null,
    set_at: /^\d{4}-\d{2}-\d{2}$/.test(String(b.set_at ?? '')) ? String(b.set_at) : todayIL(),
    achieved: null,
  })
  if (!ok) return NextResponse.json({ error: 'no participant with this phone' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
