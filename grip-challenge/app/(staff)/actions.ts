'use server'
import { revalidatePath } from 'next/cache'
import { requireRole, userRepo } from '@/lib/data'
import { todayIL } from '@/lib/dates'
import type { GoalType } from '@/lib/types'

export type FormState = { ok?: string; error?: string } | null

const ISO = /^\d{4}-\d{2}-\d{2}$/

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim().replace(',', '.')
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export async function logCallAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole('coach', 'nutritionist', 'admin')
  const participant_id = String(form.get('participant_id'))
  const call_date = String(form.get('call_date') || todayIL())
  if (!ISO.test(call_date) || call_date > todayIL()) return { error: 'תאריך לא תקין' }
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
  revalidatePath('/', 'layout')
  return { ok: 'השיחה נשמרה' }
}

export async function confirmWorkoutAction(form: FormData) {
  await requireRole('coach', 'nutritionist', 'admin')
  await (await userRepo()).confirmWorkout(String(form.get('participant_id')), String(form.get('date')), form.get('confirm') === '1')
  revalidatePath('/', 'layout')
}

export async function saveGoalAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole('nutritionist', 'admin')
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
  revalidatePath('/', 'layout')
  return { ok: 'היעד נשמר' }
}
