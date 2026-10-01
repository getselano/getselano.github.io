// Signing form (goal appendix) → the participant's goal record.
// The signature is the confirmation, so the goal arrives confirmed.
// Idempotent by phone + signedAt. Every request is logged, rejected ones too.
import { NextResponse } from 'next/server'
import { alertIntakeDone } from '@/lib/alerts'
import { clientIp } from '@/lib/client-ip'
import { serviceRepo } from '@/lib/data'
import type { GoalIntakeLog } from '@/lib/data/repo'
import { parseGoalIntake, redact } from '@/lib/goal-intake'
import { PRICE_DEFAULT } from '@/lib/program'
import { secretMatches } from '@/lib/secret'
import { todayIL } from '@/lib/dates'
import { appUrlFrom, onNewParticipant } from '@/lib/welcome'

const MAX_BODY = 64 * 1024

export async function POST(req: Request) {
  const repo = serviceRepo()
  const ip = clientIp(req.headers)
  const log = (e: Omit<GoalIntakeLog, 'ip'>) => repo.logGoalIntake({ ...e, ip })

  if (!secretMatches(req.headers.get('x-grip-secret'), process.env.GOAL_INTAKE_SECRET)) {
    await log({ status: 401, outcome: 'bad_secret' })
    return new Response(null, { status: 401 })
  }

  const text = await req.text()
  let b: Record<string, unknown>
  try {
    if (text.length > MAX_BODY) throw new Error('too large')
    b = JSON.parse(text)
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('not an object')
  } catch (e) {
    await log({ status: 400, outcome: 'bad_json', detail: (e as Error).message, payload: { raw: text.slice(0, 2000) } })
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 })
  }

  const parsed = parseGoalIntake(b)
  if (!parsed.ok) {
    await log({ status: 422, outcome: 'invalid', detail: parsed.problems.join(', '), phone: String(b.phone ?? '') || null, signed_at: String(b.signedAt ?? '') || null, payload: redact(b) })
    return NextResponse.json({ ok: false, error: 'missing or invalid', fields: parsed.problems }, { status: 422 })
  }
  const input = parsed.input

  try {
    const r = await repo.intakeGoal(input)
    await log({
      status: 200,
      outcome: r.duplicate ? 'duplicate' : 'recorded',
      phone: input.phone,
      signed_at: input.signed_at,
      participant_id: r.participantId,
      goal_id: r.goalId,
      payload: redact(b),
    })
    if (!r.duplicate) {
      // Someone the signing system never sent us: the same welcome as a signup.
      if (r.createdParticipant)
        await onNewParticipant(
          { id: r.participantId, full_name: input.full_name, phone: input.phone, start_date: input.start_date ?? todayIL(), price: PRICE_DEFAULT },
          appUrlFrom(req),
          { notifyAdmins: true },
        )
      await alertIntakeDone(r.participantId, input.details.nutritionist ?? 'טופס היעד', input.full_name, input.goal.goal_text, input.goal.start_weight)
    }
    return NextResponse.json({ ok: true, participantId: r.participantId })
  } catch (e) {
    console.error('goal-intake', e)
    await log({ status: 500, outcome: 'error', detail: (e as Error).message, phone: input.phone, signed_at: input.signed_at, payload: redact(b) })
    return NextResponse.json({ ok: false, error: 'not recorded' }, { status: 500 })
  }
}
