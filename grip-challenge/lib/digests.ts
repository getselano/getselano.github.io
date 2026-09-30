// Who goes into each staff digest. Pure: takes computed rows and today.
import type { Snapshot } from './calc'
import { diffDays, todayIL, weekday, type ISODate } from './dates'
import type { CoachMorning, NutriMorning } from './messages'
import type { ParticipantBundle } from './types'

export interface DigestRow {
  bundle: ParticipantBundle
  snap: Snapshot
}

const first = (n: string) => n.split(' ')[0]

/** Days since the participant was created (joined), in Israel dates. */
export function daysSinceJoin(b: ParticipantBundle, today: ISODate): number {
  const joined = b.participant.created_at ? todayIL(new Date(b.participant.created_at)) : b.participant.start_date
  return Math.max(0, diffDays(joined, today))
}

/** Still in the challenge: active and not past day 42 (may not have started yet). */
export function inChallenge(r: DigestRow): boolean {
  return r.bundle.participant.status === 'active' && !r.snap.finished
}

const hasSlotOn = (r: DigestRow, today: ISODate) => r.bundle.participant.call_weekday === weekday(today) && !!r.bundle.participant.call_time
const slotTime = (r: DigestRow) => (r.bundle.participant.call_time ?? '').slice(0, 5)

export function coachMorningFor(rows: DigestRow[], today: ISODate): CoachMorning {
  const live = rows.filter(inChallenge)
  return {
    today: live
      .filter((r) => r.snap.started && hasSlotOn(r, today))
      .sort((a, b) => (slotTime(a) < slotTime(b) ? -1 : 1))
      .map((r) => ({ name: first(r.bundle.participant.full_name), time: slotTime(r) })),
    // Red comes at 7 days without a call; warn on days 5 and 6.
    weekEnding: live
      .filter((r) => r.snap.started && r.bundle.calls.length > 0 && (r.snap.daysSinceCall === 5 || r.snap.daysSinceCall === 6))
      .map((r) => ({ name: first(r.bundle.participant.full_name), days: r.snap.daysSinceCall })),
    noFirstCall: live
      .filter((r) => r.bundle.calls.length === 0 && daysSinceJoin(r.bundle, today) >= 3)
      .map((r) => ({ name: first(r.bundle.participant.full_name), days: daysSinceJoin(r.bundle, today) })),
  }
}

/** Evening: today's call slots with no call logged today. */
export function coachEveningMissing(rows: DigestRow[], today: ISODate): string[] {
  return rows
    .filter((r) => inChallenge(r) && r.snap.started && hasSlotOn(r, today) && !r.bundle.calls.some((c) => c.call_date === today))
    .map((r) => first(r.bundle.participant.full_name))
}

export function nutriMorningFor(rows: DigestRow[], today: ISODate): NutriMorning {
  const live = rows.filter(inChallenge)
  return {
    noLog: live
      .filter((r) => r.snap.started && r.snap.daysSinceLog >= 2)
      .sort((a, b) => b.snap.daysSinceLog - a.snap.daysSinceLog)
      .map((r) => ({ name: first(r.bundle.participant.full_name), days: r.snap.daysSinceLog })),
    noGoal: live
      .filter((r) => !r.bundle.goal && daysSinceJoin(r.bundle, today) >= 3)
      .map((r) => ({ name: first(r.bundle.participant.full_name), days: daysSinceJoin(r.bundle, today) })),
    ending: live
      .filter((r) => r.snap.started && diffDays(r.bundle.participant.start_date, today) + 1 === 40)
      .map((r) => ({ name: first(r.bundle.participant.full_name), endDate: r.bundle.participant.end_date })),
  }
}
