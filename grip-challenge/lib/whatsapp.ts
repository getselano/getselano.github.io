import 'server-only'
import type { Message } from './messages'

// WhatsApp Cloud API (Meta). Business-initiated messages must use templates
// approved in WhatsApp Manager; their names come from env so they can be
// renamed without a deploy. Not configured → dry run (logged, not sent).
const TOKEN = process.env.WHATSAPP_TOKEN || ''
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
const LANG = process.env.WHATSAPP_TEMPLATE_LANG || 'he'
const TEMPLATE_NAMES: Record<Message['template'], string> = {
  daily_reminder: process.env.WHATSAPP_TEMPLATE_DAILY || 'grip_daily_reminder',
  weekly_summary: process.env.WHATSAPP_TEMPLATE_WEEKLY || 'grip_weekly_summary',
  staff_summary: process.env.WHATSAPP_TEMPLATE_STAFF || 'grip_staff_summary',
}

export const whatsappConfigured = () => !!(TOKEN && PHONE_ID)

export async function sendWhatsApp(to: string, msg: Message): Promise<{ status: 'sent' | 'dry_run' | 'failed'; detail?: string }> {
  if (!whatsappConfigured()) {
    console.info(`[whatsapp dry run] → ${to}: ${msg.text}`)
    return { status: 'dry_run', detail: msg.text }
  }
  const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: TEMPLATE_NAMES[msg.template],
        language: { code: LANG },
        components: [{ type: 'body', parameters: msg.params.map((text) => ({ type: 'text', text })) }],
      },
    }),
  })
  if (!res.ok) return { status: 'failed', detail: `HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` }
  return { status: 'sent' }
}
