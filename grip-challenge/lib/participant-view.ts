import 'server-only'
import { redirect } from 'next/navigation'
import { attendanceIsSelfReported } from './attendance'
import { loadParticipant, requireRole, userRepo } from './data'
import { hasWorkoutOn, nextWorkout } from './schedule'
import { syncMilestones } from './milestones'

/** Everything a participant screen needs, computed once. */
export async function participantView() {
  const v = await requireRole('participant')
  const repo = await userRepo()
  const [row, schedule, staff] = await Promise.all([loadParticipant(v.participant.id), repo.schedule(), repo.staff()])
  if (!row) redirect('/login')

  // The milestone engine runs on every participant screen load, so a
  // milestone earned by a staff edit or an attendance sync still lands.
  const fresh = await syncMilestones(row.bundle)
  const winPending =
    fresh.includes('reward_earned') || row.bundle.milestones.some((m) => m.kind === 'reward_earned' && !m.seen_at)

  const { snap, bundle } = row
  const p = bundle.participant
  const todayLog = bundle.logs.find((l) => l.log_date === snap.today)
  const active = p.status === 'active' && snap.started && !snap.finished
  // Participants book their own classes in Boostapp, so without a fixed
  // schedule (or the Boostapp integration) we cannot know who trains today.
  // Then the workout card shows every day and is optional: it never holds
  // back "סיימת להיום".
  const knownSchedule = schedule.some((s) => s.active)
  const workoutToday = !knownSchedule || hasWorkoutOn(schedule, snap.today) || !!todayLog?.workout_attended

  return {
    participant: p,
    goal: bundle.goal,
    snap,
    todayLog,
    active,
    cards: {
      workout: active && workoutToday,
      workoutOptional: !knownSchedule,
      measurement: active && (snap.isMeasurementDay || !!todayLog?.measurement_logged),
    },
    workoutSelfReport: attendanceIsSelfReported(),
    next: nextWorkout(schedule, staff, snap.today, p.end_date),
    coach: staff.find((s) => s.id === p.coach_id) ?? null,
    nutritionist: staff.find((s) => s.id === p.nutritionist_id) ?? null,
    winPending,
  }
}

export type ParticipantView = Awaited<ReturnType<typeof participantView>>

/** What is still open today, in the order the status button names it. */
export function remainingToday(v: Pick<ParticipantView, 'todayLog' | 'cards' | 'workoutSelfReport' | 'active'>) {
  if (!v.active) return []
  const out: { field: 'nutrition_logged' | 'workout_attended' | 'measurement_logged'; label: string }[] = []
  if (!v.todayLog?.nutrition_logged) out.push({ field: 'nutrition_logged', label: 'דיווח תזונה' })
  if (v.cards.workout && !v.cards.workoutOptional && v.workoutSelfReport && !v.todayLog?.workout_attended) out.push({ field: 'workout_attended', label: 'הגעה לאימון' })
  if (v.cards.measurement && !v.todayLog?.measurement_logged) out.push({ field: 'measurement_logged', label: 'מדידה שבועית' })
  return out
}
