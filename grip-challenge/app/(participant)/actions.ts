'use server'
import { revalidatePath } from 'next/cache'
import { encouragement } from '@/lib/calc'
import { requireRole, userRepo } from '@/lib/data'
import type { MarkField } from '@/lib/data/repo'
import { participantView, remainingToday } from '@/lib/participant-view'
import type { MilestoneKind } from '@/lib/types'

export interface MarkResult {
  ok: boolean
  error?: string
  streak?: number
  longest?: number
  sentence?: string
  dots?: Awaited<ReturnType<typeof participantView>>['snap']['dots']
  remaining?: ReturnType<typeof remainingToday>
  win?: boolean
}

const FIELDS: MarkField[] = ['nutrition_logged', 'workout_attended', 'measurement_logged']

/** The daily tap. Returns the recomputed streak so the screen updates in place. */
export async function markToday(field: MarkField, value: boolean, weight?: number | null): Promise<MarkResult> {
  await requireRole('participant')
  if (!FIELDS.includes(field)) return { ok: false, error: 'bad field' }
  if (weight != null && !(weight >= 25 && weight <= 350)) return { ok: false, error: 'משקל לא תקין' }
  try {
    await (await userRepo()).markToday(field, value, weight ?? null)
  } catch (e) {
    console.error('markToday failed', e)
    return { ok: false, error: 'הסימון לא נשמר. נסו שוב.' }
  }
  const v = await participantView()
  revalidatePath('/', 'layout')
  return {
    ok: true,
    streak: v.snap.currentStreak,
    longest: v.snap.longestStreak,
    sentence: encouragement(v.snap),
    dots: v.snap.dots,
    remaining: remainingToday(v),
    win: v.winPending,
  }
}

export async function markWinSeen(kind: MilestoneKind = 'reward_earned') {
  await requireRole('participant')
  await (await userRepo()).markMilestoneSeen(kind)
  revalidatePath('/', 'layout')
}
