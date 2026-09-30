import 'server-only'
import { headers } from 'next/headers'
import { serviceRepo } from './data'
import { firstCallDone, intakeDone, rewardEarned, type Message } from './messages'
import { deliver } from './notify'

// Once-ever alerts are keyed on this fixed day in the notifications log.
const ONCE = '1970-01-01'

/** The app's public address: Netlify's URL, else the current request's host. */
export async function baseUrl(): Promise<string> {
  if (process.env.URL) return process.env.URL
  try {
    const h = await headers()
    return `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host')}`
  } catch {
    return ''
  }
}

/** One WhatsApp per admin, once per (alert kind, participant). Never throws. */
async function toAdmins(kind: string, participantId: string, build: (adminName: string, link: string) => Message) {
  try {
    const link = `${await baseUrl()}/team/${participantId}`
    for (const a of (await serviceRepo().staff()).filter((s) => s.role === 'admin'))
      await deliver(kind, `${a.id}:${participantId}`, a.phone, build(a.full_name, link), ONCE)
  } catch (e) {
    console.error(`${kind} alert failed`, e)
  }
}

export const alertIntakeDone = (participantId: string, nutriName: string, participant: string, goalText: string, startWeight: number | null) =>
  toAdmins('intake_done', participantId, (admin, link) => intakeDone(admin, nutriName, participant, goalText, startWeight, link))

export const alertFirstCall = (participantId: string, coachName: string, participant: string) =>
  toAdmins('first_call', participantId, (admin, link) => firstCallDone(admin, coachName, participant, link))

export const alertRewardEarned = (participantId: string, participant: string) =>
  toAdmins('reward_earned', participantId, (admin, link) => rewardEarned(admin, participant, link))
