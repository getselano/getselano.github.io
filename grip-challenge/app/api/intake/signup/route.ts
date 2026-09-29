// Signing system (Google Apps Script, submitAgreement) → a participant plus
// their deal details. Idempotent by phone: signing again updates the same
// participant, never duplicates it.
import { NextResponse } from 'next/server'
import { serviceRepo } from '@/lib/data'
import { parseBool, parseDate, parseNum } from '@/lib/intake'
import { normalizePhone } from '@/lib/phone'
import { bearer, secretMatches } from '@/lib/secret'
import { todayIL } from '@/lib/dates'
import { appUrlFrom, sendWelcome } from '@/lib/welcome'

const str = (v: unknown) => {
  const s = String(v ?? '').trim()
  return s ? s.slice(0, 500) : null
}

export async function POST(req: Request) {
  if (!secretMatches(bearer(req), process.env.INTAKE_SECRET)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let b: Record<string, unknown>
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  // Accepts the signing form's own field names (fullName, phone, startDate…).
  const phone = normalizePhone(String(b.phone ?? ''))
  const full_name = str(b.fullName ?? b.full_name)
  if (!phone || !full_name) return NextResponse.json({ error: 'fullName and a valid phone are required' }, { status: 422 })

  const price = parseNum(b.price)
  const photo = parseBool(b.photoConsent)
  const start_date = parseDate(b.startDate ?? b.start_date) ?? undefined
  const result = await serviceRepo().recordSignup({
    full_name,
    phone,
    email: str(b.email),
    start_date,
    price: price && price >= 100 ? Math.round(price) : undefined,
    marketing_consent: photo,
    deal: {
      id_number: str(b.idNumber),
      signed_at: str(b.signedAt),
      birth_date: str(b.birthDate),
      address: str(b.address),
      payment: str(b.payment),
      price: price ? Math.round(price) : null,
      photo_consent: photo,
      needs_medical: parseBool(b.needsMedical),
      is_minor: parseBool(b.isMinor),
      parent_name: str(b.parentName),
      parent_id: str(b.parentId),
      parent_phone: str(b.parentPhone),
      agreement_url: str(b.agreementUrl),
    },
  })
  // A new participant gets the welcome WhatsApp right away (once, ever).
  const welcome = result.created
    ? await sendWelcome({ id: result.id, full_name, phone, start_date: start_date ?? todayIL() }, appUrlFrom(req))
    : 'not_new'
  return NextResponse.json({ ...result, welcome }, { status: result.created ? 201 : 200 })
}
