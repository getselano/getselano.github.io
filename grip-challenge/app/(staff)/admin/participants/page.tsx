import Link from 'next/link'
import { Plus } from '@/components/icons'
import { STATUS_LABEL } from '@/components/staff'
import { loadRows, requireRole, userRepo } from '@/lib/data'
import { shortDate } from '@/lib/dates'
import { displayPhone } from '@/lib/phone'

export const metadata = { title: 'ניהול משתתפים' }

const STATUS_TEXT = { active: 'פעיל', completed: 'סיים', cancelled: 'בוטל' } as const

export default async function ParticipantsAdmin() {
  await requireRole('admin')
  const [rows, staff] = await Promise.all([loadRows(), (await userRepo()).staff()])
  const name = (id: string | null) => staff.find((s) => s.id === id)?.full_name ?? <span className="hint">לא שובץ</span>

  return (
    <>
      <header className="greet">
        <div>
          <p className="hello">יצירה, עריכה והקצאת צוות. עובד גם כשהאינטגרציות מחוברות.</p>
          <h1>ניהול משתתפים</h1>
        </div>
        <Link href="/admin/participants/new" className="btn accent small"><Plus size={18} /> משתתף חדש</Link>
      </header>
      <section className="card" style={{ padding: 8 }}>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr><th>שם</th><th>טלפון</th><th>התחלה</th><th>יום</th><th>מאמן/ת</th><th>תזונאי/ת</th><th>סטטוס</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map(({ bundle: { participant: p }, snap }) => (
                <tr key={p.id}>
                  <td><strong>{p.full_name}</strong></td>
                  <td className="num">{displayPhone(p.phone)}</td>
                  <td className="num">{shortDate(p.start_date)}</td>
                  <td>{snap.started ? <span className="num">{snap.finished ? '—' : snap.dayNumber}</span> : <span className="hint">טרם</span>}</td>
                  <td>{name(p.coach_id)}</td>
                  <td>{name(p.nutritionist_id)}</td>
                  <td>
                    <span className={`pill ${p.status === 'active' ? 'green' : ''}`}>{STATUS_TEXT[p.status]}</span>{' '}
                    {p.status === 'active' && snap.started && !snap.finished && <span className={`pill ${snap.status.color === 'green' ? 'green' : snap.status.color === 'yellow' ? 'orange' : 'red'}`}>{STATUS_LABEL[snap.status.color]}</span>}
                  </td>
                  <td><Link href={`/admin/participants/${p.id}`} className="link">עריכה</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
