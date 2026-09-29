import { redirect } from 'next/navigation'
import { addDays, fullDate } from '@/lib/dates'
import { CLUB_WHATSAPP } from '@/lib/env'
import { participantView } from '@/lib/participant-view'
import { whatsappLink } from '@/lib/phone'
import { PERSONAL_TRAINING_VALUE, REWARD_VALIDITY_DAYS } from '@/lib/program'
import { WinMoment } from './WinMoment'

export const metadata = { title: 'האימון האישי שלך מחכה' }

/** Full-screen, once: when the 36th day is marked (spec §5.4). */
export default async function WinPage() {
  const v = await participantView()
  if (!v.snap.rewardEligible) redirect('/')
  const first = v.participant.full_name.split(' ')[0]
  const to = CLUB_WHATSAPP || v.coach?.phone || ''
  const text = `היי, זה ${first}. הגעתי ל-36 ימים באתגר ואני רוצה לתאם את האימון האישי שלי`
  return (
    <WinMoment
      name={first}
      coachName={v.coach?.full_name ?? null}
      value={PERSONAL_TRAINING_VALUE}
      validUntil={fullDate(addDays(v.participant.end_date, REWARD_VALIDITY_DAYS))}
      bookUrl={to ? whatsappLink(to, text) : null}
    />
  )
}
