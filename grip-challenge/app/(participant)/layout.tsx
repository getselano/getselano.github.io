import { BottomNav } from '@/components/BottomNav'
import { GoalConfirm } from '@/components/GoalConfirm'
import { requireRole, userRepo } from '@/lib/data'

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const v = await requireRole('participant')
  // A goal waiting for "זה היעד שלי" takes over the whole app until confirmed.
  const goal = await (await userRepo()).currentGoal(v.participant.id)
  if (goal && !goal.confirmed_at) return <GoalConfirm goal={goal} name={v.participant.full_name.split(' ')[0]} />
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}
