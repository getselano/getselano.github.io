import 'server-only'

// WhatsApp through Green API: messages go out from Grip's business phone
// (the instance linked in the Green API console). Plain text, no templates.
// Not configured → dry run (logged, not sent).
const API_URL = (process.env.GREEN_API_URL || 'https://api.green-api.com').replace(/\/+$/, '')
const INSTANCE = process.env.GREEN_API_ID_INSTANCE || ''
const TOKEN = process.env.GREEN_API_TOKEN || ''

export const whatsappConfigured = () => !!(INSTANCE && TOKEN)

export type SendResult = { status: 'sent' | 'dry_run' | 'failed'; detail?: string }

/** `to` is digits-only E.164 (972501234567). */
export async function sendWhatsApp(to: string, text: string): Promise<SendResult> {
  if (!whatsappConfigured()) {
    console.info(`[whatsapp dry run] → ${to}: ${text}`)
    return { status: 'dry_run', detail: text }
  }
  const res = await fetch(`${API_URL}/waInstance${INSTANCE}/sendMessage/${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId: `${to}@c.us`, message: text }),
    cache: 'no-store',
  })
  if (!res.ok) return { status: 'failed', detail: `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` }
  return { status: 'sent', detail: ((await res.json().catch(() => ({}))) as { idMessage?: string }).idMessage }
}
