'use server'
import { revalidatePath } from 'next/cache'
import { requireRole, userRepo } from '@/lib/data'
import { todayIL } from '@/lib/dates'
import type { GoalType } from '@/lib/types'
import { alertFirstCall, alertIntakeDone } from '@/lib/alerts'

export type FormState = { ok?: string; error?: string } | null

const ISO = /^\d{4}-\d{2}-\d{2}$/

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim().replace(',', '.')
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export async function logCallAction(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireRole('coach', 'nutritionist', 'admin')
  const participant_id = String(form.get('participant_id'))
  const call_date = String(form.get('call_date') || todayIL())
  if (!ISO.test(call_date) || call_date > todayIL()) return { error: 'תאריך לא תקין' }
  const before = await (await userRepo()).bundle(participant_id)
  try {
    await (await userRepo()).logCall({
      participant_id,
      call_date,
      summary: String(form.get('summary') || '').trim() || null,
      risk_flag: form.get('risk_flag') === 'on',
    })
  } catch (e) {
    console.error(e)
    return { error: 'השיחה לא נשמרה' }
  }
  // The first call with this participant: tell the admins.
  if (before && before.calls.length === 0) await alertFirstCall(participant_id, v.staff.full_name, before.participant.full_name)
  revalidatePath('/', 'layout')
  return { ok: 'השיחה נשמרה' }
}

export async function confirmWorkoutAction(form: FormData) {
  await requireRole('coach', 'nutritionist', 'admin')
  await (await userRepo()).confirmWorkout(String(form.get('participant_id')), String(form.get('date')), form.get('confirm') === '1')
  revalidatePath('/', 'layout')
}

export async function saveGoalAction(_: FormState, form: FormData): Promise<FormState> {
  const v = await requireRole('nutritionist', 'admin')
  const before = await (await userRepo()).bundle(String(form.get('participant_id')))
  const goal_text = String(form.get('goal_text') || '').trim()
  if (!goal_text) return { error: 'צריך לכתוב את היעד' }
  const achieved = String(form.get('achieved') || '')
  try {
    await (await userRepo()).saveGoal({
      participant_id: String(form.get('participant_id')),
      goal_type: String(form.get('goal_type') || 'other') as GoalType,
      goal_text,
      goal_value: num(form.get('goal_value')),
      start_weight: num(form.get('start_weight')),
      start_body_fat: num(form.get('start_body_fat')),
      start_measurements: String(form.get('start_measurements') || '').trim() || null,
      set_at: String(form.get('set_at') || '') || todayIL(),
      achieved: achieved === 'yes' ? true : achieved === 'no' ? false : null,
    })
  } catch (e) {
    console.error(e)
    return { error: 'היעד לא נשמר' }
  }
  // The first goal means the intake call happened: tell the admins.
  if (before && !before.goal) await alertIntakeDone(before.participant.id, v.staff.full_name, before.participant.full_name, goal_text, num(form.get('start_weight')))
  revalidatePath('/', 'layout')
  return { ok: 'היעד נשמר' }
}

/** The mental coach sets (or clears) the participant's fixed weekly call slot. */
export async function setCallSlotAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole('coach', 'admin')
  const wdRaw = String(form.get('call_weekday') ?? '')
  const time = String(form.get('call_time') ?? '').trim()
  const clear = wdRaw === '' || !time
  if (!clear && (!/^[0-6]$/.test(wdRaw) || !/^\d{2}:\d{2}/.test(time))) return { error: 'יום או שעה לא תקינים' }
  try {
    await (await userRepo()).setCallSlot(String(form.get('participant_id')), clear ? null : Number(wdRaw), clear ? null : time.slice(0, 5))
  } catch (e) {
    console.error(e)
    return { error: 'לא נשמר' }
  }
  revalidatePath('/', 'layout')
  return { ok: clear ? 'השעה הקבועה הוסרה' : 'השעה הקבועה נשמרה' }
}
