import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { withAttendance } from '../attendance'
import { snapshot, type Snapshot } from '../calc'
import { todayIL } from '../dates'
import { isDemo } from '../env'
import type { ParticipantBundle, Role, Staff } from '../types'
import { DemoServiceRepo, DemoUserRepo } from './demo-repo'
import type { ServiceRepo, UserRepo, Viewer } from './repo'
import { SupabaseServiceRepo, SupabaseUserRepo } from './supabase-repo'

export type { Viewer } from './repo'

/** The signed-in user's repo, once per request. */
export const userRepo = cache(async (): Promise<UserRepo> => (isDemo ? DemoUserRepo.create() : SupabaseUserRepo.create()))

export function serviceRepo(): ServiceRepo {
  return isDemo ? new DemoServiceRepo() : new SupabaseServiceRepo()
}

export const currentViewer = cache(async (): Promise<Viewer | null> => (await userRepo()).viewer())

/** Where each role lands. */
export function homeFor(v: Viewer): string {
  if (v.role === 'participant') return '/'
  if (v.role === 'admin') return '/admin'
  return '/team'
}

/** Signed in with one of these roles, or redirected. */
export async function requireRole<R extends Role>(...roles: R[]): Promise<ViewerAs<R>> {
  const v = await currentViewer()
  if (!v) redirect('/login')
  if (!roles.includes(v.role as R)) redirect(homeFor(v))
  return v as ViewerAs<R>
}

type ViewerAs<R extends Role> = R extends 'participant'
  ? Extract<Viewer, { role: 'participant' }>
  : { role: Exclude<R, 'participant'>; staff: Staff }

export interface Row {
  bundle: ParticipantBundle
  snap: Snapshot
}

function toRow(b: ParticipantBundle, today: string): Row {
  return {
    bundle: b,
    snap: snapshot({ start: b.participant.start_date, today, logs: b.logs, calls: b.calls, goal: b.goal }),
  }
}

/** One participant, with attendance from the active provider and the computed snapshot. */
export async function loadParticipant(participantId: string): Promise<Row | null> {
  const b = await (await userRepo()).bundle(participantId)
  if (!b) return null
  const [withAtt] = await withAttendance([b])
  return toRow(withAtt, todayIL())
}

/** Every participant the viewer may see (admin: all), computed. */
export async function loadRows(): Promise<Row[]> {
  const bundles = await withAttendance(await (await userRepo()).bundles())
  const today = todayIL()
  return bundles.map((b) => toRow(b, today))
}
