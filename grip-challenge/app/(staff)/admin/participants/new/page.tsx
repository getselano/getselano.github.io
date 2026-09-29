import { ParticipantForm } from '@/components/ParticipantForm'
import { requireRole, userRepo } from '@/lib/data'

export const metadata = { title: 'משתתף חדש' }

export default async function NewParticipant() {
  await requireRole('admin')
  const staff = await (await userRepo()).staff()
  return (
    <>
      <header className="greet"><div><p className="hello">יצירה ידנית, גם כשמערכת החתימה מחוברת</p><h1>משתתף חדש</h1></div></header>
      <section className="card"><ParticipantForm staff={staff} /></section>
    </>
  )
}
