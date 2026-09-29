'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { homeFor, serviceRepo, userRepo } from '@/lib/data'
import { DEMO_COOKIE } from '@/lib/data/demo-repo'
import { isDemo, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { normalizePhone } from '@/lib/phone'

/** Normalizes the phone and says whether it belongs to a participant or staff member (before an SMS is spent on it). */
export async function checkPhone(raw: string): Promise<{ phone?: string; error?: string }> {
  const phone = normalizePhone(raw)
  if (!phone) return { error: 'המספר לא נראה תקין' }
  if (!isDemo && !SUPABASE_SERVICE_ROLE_KEY) return { phone } // cannot check; let the SMS go
  if (!(await serviceRepo().isRegisteredPhone(phone))) return { error: 'המספר הזה לא רשום לאתגר. דברו עם הצוות במועדון.' }
  return { phone }
}

export async function demoSignIn(formData: FormData) {
  if (!isDemo) return
  const id = String(formData.get('as') || '')
  ;(await cookies()).set(DEMO_COOKIE, id, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 60 })
  const v = await (await userRepo()).viewer()
  redirect(v ? homeFor(v) : '/login')
}

export async function signOut() {
  await (await userRepo()).signOut()
  redirect('/login')
}
