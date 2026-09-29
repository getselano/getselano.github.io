import 'server-only'
import { serviceRepo } from './data'
import { todayIL } from './dates'
import { welcomeMessage } from './messages'
import { sendWhatsApp } from './whatsapp'

/**
 * The welcome WhatsApp, once per participant (the notifications log keys it
 * on their start date). Never throws: a failed message must not fail the
 * signup or the admin form.
 */
export async function sendWelcome(p: { id: string; full_name: string; phone: string; start_date: string }, appUrl: string) {
  try {
    const repo = serviceRepo()
    if (!(await repo.claimNotification('welcome', p.id, p.start_date))) return 'already_sent'
    const r = await sendWhatsApp(p.phone, welcomeMessage(p, appUrl, todayIL()).text)
    await repo.finishNotification('welcome', p.id, p.start_date, r.status, r.detail)
    return r.status
  } catch (e) {
    console.error('welcome message failed', e)
    return 'failed'
  }
}

/** The app's public address, from the request that triggered the send. */
export function appUrlFrom(req: { url: string } | string): string {
  return process.env.URL || new URL(typeof req === 'string' ? req : req.url).origin
}
