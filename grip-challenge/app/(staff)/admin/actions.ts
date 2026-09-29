'use server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireRole, userRepo } from '@/lib/data'
import { todayIL } from '@/lib/dates'
import { normalizePhone } from '@/lib/phone'
import { PRICE_DEFAULT } from '@/lib/program'
import type { ParticipantStatus, StaffRole } from '@/lib/types'
import type { FormState } from '../actions'
import { briefAssignedStaff, onNewParticipant } from '@/lib/welcome'

const ISO = /^\d{4}-\d{2}-\d{2}$/

function friendly(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e)
  if (/phone/.test(m) && /unique|duplicate/.test(m)) return 'המספר הזה כבר רשום'
  return 'השמירה נכשלה'
}

export async function saveParticipantAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole('admin')
  const id = String(form.get('id') || '') || undefined
  const phone = normalizePhone(String(form.get('phone') || ''))
  const full_name = String(form.get('full_name') || '').trim()
  const start_date = String(form.get('start_date') || '')
  if (!full_name) return { error: 'חסר שם' }
  if (!phone) return { error: 'מספר טלפון לא תקין' }
  if (!ISO.test(start_date)) return { error: 'תאריך התחלה לא תקין' }
  const status = String(form.get('status') || 'active') as ParticipantStatus
  let newId: string
  try {
    newId = await (await userRepo()).saveParticipant(
      {
        full_name,
        phone,
        email: String(form.get('email') || '').trim() || null,
        start_date,
        price: Number(form.get('price') || PRICE_DEFAULT),
        coach_id: String(form.get('coach_id') || '') || null,
        nutritionist_id: String(form.get('nutritionist_id') || '') || null,
        status,
        marketing_consent: form.get('marketing_consent') === 'on',
      },
      id,
    )
  } catch (e) {
    console.error(e)
    return { error: friendly(e) }
  }
  const appUrl = process.env.URL || `https://${(await headers()).get('host')}`
  if (id && status === 'active') {
    // An edit that assigns or changes staff briefs whoever is assigned now.
    const staff = await (await userRepo()).staff()
    const coach = staff.find((x) => x.id === form.get('coach_id')) ?? null
    const nutritionist = staff.find((x) => x.id === form.get('nutritionist_id')) ?? null
    await briefAssignedStaff({ id, full_name, phone, start_date, price: Number(form.get('price') || PRICE_DEFAULT) }, { coach, nutritionist }, appUrl)
  }
  if (!id && status === 'active') {
    // The admin is creating them, so no admin summary; the team is briefed.
    await onNewParticipant({ id: newId, full_name, phone, start_date, price: Number(form.get('price') || PRICE_DEFAULT) }, appUrl, { notifyAdmins: false })
  }
  revalidatePath('/', 'layout')
  if (!id) redirect(`/admin/participants/${newId}`)
  return { ok: 'נשמר' }
}

export async function saveLogAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole('admin')
  const date = String(form.get('log_date') || '')
  if (!ISO.test(date) || date > todayIL()) return { error: 'תאריך לא תקין' }
  const w = String(form.get('weight') || '').trim()
  try {
    await (await userRepo()).saveLog(String(form.get('participant_id')), date, {
      nutrition_logged: form.get('nutrition_logged') === 'on',
      workout_attended: form.get('workout_attended') === 'on',
      measurement_logged: form.get('measurement_logged') === 'on',
      weight: w ? Number(w.replace(',', '.')) : null,
      note: String(form.get('note') || '').trim() || null,
    })
  } catch (e) {
    console.error(e)
    return { error: 'השמירה נכשלה' }
  }
  revalidatePath('/', 'layout')
  return { ok: `יום ${date} נשמר` }
}

export async function saveStaffAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole('admin')
  const phone = normalizePhone(String(form.get('phone') || ''))
  const full_name = String(form.get('full_name') || '').trim()
  const role = String(form.get('role')) as StaffRole
  if (!full_name || !phone || !['coach', 'nutritionist', 'admin'].includes(role)) return { error: 'חסרים פרטים או מספר לא תקין' }
  try {
    await (await userRepo()).saveStaff({ full_name, phone, role }, String(form.get('id') || '') || undefined)
  } catch (e) {
    return { error: friendly(e) }
  }
  revalidatePath('/', 'layout')
  return { ok: 'נשמר' }
}

export async function deleteStaffAction(form: FormData) {
  const v = await requireRole('admin')
  const id = String(form.get('id'))
  if (id === v.staff.id) return // never lock yourself out
  await (await userRepo()).deleteStaff(id)
  revalidatePath('/', 'layout')
}

export async function saveSlotAction(_: FormState, form: FormData): Promise<FormState> {
  await requireRole('admin')
  const weekday = Number(form.get('weekday'))
  const start_time = String(form.get('start_time') || '')
  if (!(weekday >= 0 && weekday <= 6) || !/^\d{2}:\d{2}/.test(start_time)) return { error: 'יום או שעה לא תקינים' }
  try {
    await (await userRepo()).saveSlot(
      {
        weekday,
        start_time,
        coach_id: String(form.get('coach_id') || '') || null,
        title: String(form.get('title') || '').trim() || 'אימון',
        active: form.get('active') !== 'off',
      },
      String(form.get('id') || '') || undefined,
    )
  } catch (e) {
    console.error(e)
    return { error: 'השמירה נכשלה' }
  }
  revalidatePath('/', 'layout')
  return { ok: 'נשמר' }
}

export async function deleteSlotAction(form: FormData) {
  await requireRole('admin')
  await (await userRepo()).deleteSlot(String(form.get('id')))
  revalidatePath('/', 'layout')
}
