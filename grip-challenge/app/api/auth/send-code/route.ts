// Supabase "Send SMS" auth hook. Supabase generates the login code and posts
// it here; we deliver it on WhatsApp from Grip's business phone instead of SMS.
import { NextResponse } from 'next/server'
import { normalizePhone } from '@/lib/phone'
import { verifyWebhook } from '@/lib/webhook-signature'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function POST(req: Request) {
  const body = await req.text()
  const ok = verifyWebhook(
    body,
    { id: req.headers.get('webhook-id'), timestamp: req.headers.get('webhook-timestamp'), signature: req.headers.get('webhook-signature') },
    process.env.SEND_CODE_HOOK_SECRET || '',
  )
  if (!ok) return NextResponse.json({ error: { http_code: 401, message: 'bad signature' } }, { status: 401 })

  const payload = JSON.parse(body) as { user?: { phone?: string }; sms?: { otp?: string } }
  const phone = normalizePhone(payload.user?.phone ?? '')
  const otp = payload.sms?.otp
  if (!phone || !otp) return NextResponse.json({ error: { http_code: 400, message: 'missing phone or code' } }, { status: 400 })

  const r = await sendWhatsApp(phone, `קוד הכניסה שלך לאתגר 6 השבועות של גריפ: ${otp}\nאל תעבירו את הקוד לאף אחד.`)
  if (r.status === 'failed') {
    console.error('send-code failed', r.detail)
    return NextResponse.json({ error: { http_code: 502, message: 'could not send the code' } }, { status: 502 })
  }
  return NextResponse.json({})
}
