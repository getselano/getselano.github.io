// Signing system (Google Apps Script) → a participant. Called when a client
// signs. Idempotent by phone: a repeat call updates name/email, never
// duplicates or moves the start date.
import { NextResponse } from 'next/server'
import { serviceRepo } from '@/lib/data'
import { normalizePhone } from '@/lib/phone'
import { bearer, secretMatches } from '@/lib/secret'

export async function POST(req: Request) {
  if (!secretMatches(bearer(req), process.env.INTAKE_SECRET)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const phone = normalizePhone(String(body.phone ?? ''))
  const full_name = String(body.full_name ?? '').trim()
  const start_date = body.start_date ? String(body.start_date) : undefined
  if (!phone || !full_name) return NextResponse.json({ error: 'full_name and a valid phone are required' }, { status: 422 })
  if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) return NextResponse.json({ error: 'start_date must be YYYY-MM-DD' }, { status: 422 })
  const price = body.price != null && body.price !== '' ? Number(body.price) : undefined
  const result = await serviceRepo().upsertParticipantByPhone({
    full_name,
    phone,
    email: body.email ? String(body.email) : null,
    start_date,
    price: Number.isFinite(price) ? price : undefined,
  })
  return NextResponse.json(result, { status: result.created ? 201 : 200 })
}
