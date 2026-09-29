import 'server-only'
import { earnedMilestones } from './calc'
import { isDemo, SUPABASE_SERVICE_ROLE_KEY } from './env'
import { serviceRepo } from './data'
import type { ParticipantBundle } from './types'

/**
 * The milestone engine. Earned milestones come from the calculations module;
 * this stores the ones not stored yet (earned_at = the moment it was first
 * seen earned). Returns the kinds that are new.
 */
export async function syncMilestones(b: ParticipantBundle): Promise<string[]> {
  const have = new Set(b.milestones.map((m) => m.kind))
  const fresh = earnedMilestones(b.logs, b.participant.start_date).filter((k) => !have.has(k))
  if (!fresh.length) return []
  if (!isDemo && !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('milestones not stored: SUPABASE_SERVICE_ROLE_KEY is not set')
    return []
  }
  await serviceRepo().addMilestones(b.participant.id, fresh)
  return fresh
}

/** The reward milestone is stored and the win screen has not been shown yet. */
export function winPending(b: ParticipantBundle): boolean {
  return b.milestones.some((m) => m.kind === 'reward_earned' && !m.seen_at)
}
