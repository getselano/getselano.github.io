import { BottomNav } from '@/components/BottomNav'
import { requireRole } from '@/lib/data'

export default async function ParticipantLayout({ children }: { children: React.ReactNode }) {
  await requireRole('participant')
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}
