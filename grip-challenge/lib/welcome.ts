import 'server-only'
import { serviceRepo } from './data'
import { todayIL } from './dates'
import { adminNewParticipant, staffNewParticipant, welcomeMessage, type Message } from './messages'
import type { Staff } from './types'
import { sendWhatsApp } from './whatsapp'

export interface NewParticipant {
  id: string
  full_name: string
  phone: string
  start_date: string
  price: number
}

/**
 * Everything that happens when someone joins, at once:
 *   1. an empty coach / nutritionist slot is filled when the team has one of each,
 *   2. the participant gets the welcome WhatsApp,
 *   3. the assigned nutritionist and mental coach each get their next step,
 *   4. admins get a one-line summary (only when asked, e.g. from the signing system).
 * Each message goes out once (the notifications log keys it). Never throws:
 * a failed message must not fail the signup or the admin form.
 */
export async function onNewParticipant(p: NewParticipant, appUrl: string, opts: { notifyAdmins: boolean }) {
  const repo = serviceRepo()
  const out: Record<string, string> = {}
  const send = async (kind: string, recipient: string, phone: string, msg: Message) => {
    try {
      if (!(await repo.claimNotification(kind, recipient, p.start_date))) return (out[recipient] = 'already_sent')
      const r = await sendWhatsApp(phone, msg.text)
      await repo.finishNotification(kind, recipient, p.start_date, r.status, r.detail)
      out[recipient] = r.status
    } catch (e) {
      console.error(`${kind} message failed`, e)
      out[recipient] = 'failed'
    }
  }

  let assigned: Awaited<ReturnType<typeof repo.autoAssign>> = { coach: null, nutritionist: null }
  try {
    assigned = await repo.autoAssign(p.id)
  } catch (e) {
    console.error('auto-assign failed', e)
  }

  const card = `${appUrl}/team/${p.id}`
  await send('welcome', p.id, p.phone, welcomeMessage(p, appUrl, todayIL()))
  if (assigned.nutritionist)
    await send('staff_new', `${assigned.nutritionist.id}:${p.id}`, assigned.nutritionist.phone, staffNewParticipant('nutritionist', assigned.nutritionist.full_name, p, card))
  if (assigned.coach)
    await send('staff_new', `${assigned.coach.id}:${p.id}`, assigned.coach.phone, staffNewParticipant('coach', assigned.coach.full_name, p, card))
  if (opts.notifyAdmins) {
    const admins = (await repo.staff()).filter((s) => s.role === 'admin')
    for (const a of admins)
      await send(
        'admin_new',
        `${a.id}:${p.id}`,
        a.phone,
        adminNewParticipant(a.full_name, p, { nutritionist: assigned.nutritionist?.full_name ?? null, coach: assigned.coach?.full_name ?? null }, `${appUrl}/admin/participants/${p.id}`),
      )
  }
  return out
}

/**
 * After an admin assigns or changes the coach / nutritionist: brief whoever
 * is assigned now. Someone already briefed about this participant is skipped.
 */
export async function briefAssignedStaff(p: NewParticipant, staff: { coach: Staff | null; nutritionist: Staff | null }, appUrl: string) {
  const repo = serviceRepo()
  const card = `${appUrl}/team/${p.id}`
  for (const [role, who] of [['nutritionist', staff.nutritionist], ['coach', staff.coach]] as const) {
    if (!who) continue
    try {
      if (!(await repo.claimNotification('staff_new', `${who.id}:${p.id}`, p.start_date))) continue
      const r = await sendWhatsApp(who.phone, staffNewParticipant(role, who.full_name, p, card).text)
      await repo.finishNotification('staff_new', `${who.id}:${p.id}`, p.start_date, r.status, r.detail)
    } catch (e) {
      console.error('staff brief failed', e)
    }
  }
}

/** The app's public address: Netlify's URL, else the request's own origin. */
export function appUrlFrom(req: { url: string } | string): string {
  return process.env.URL || new URL(typeof req === 'string' ? req : req.url).origin
}
