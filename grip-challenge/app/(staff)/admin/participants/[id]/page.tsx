import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm } from '@/components/ActionForm'
import { Check } from '@/components/icons'
import { ParticipantForm } from '@/components/ParticipantForm'
import { loadParticipant, requireRole, userRepo } from '@/lib/data'
import { HEB_WEEKDAYS_SHORT, rangeDays, shortDate, todayIL, weekday } from '@/lib/dates'
import { saveLogAction } from '../../actions'

export default async function EditParticipant({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string }> }) {
  await requireRole('admin')
  const { id } = await params
  const { day } = await searchParams
  const row = await loadParticipant(id)
  if (!row) notFound()
  const staff = await (await userRepo()).staff()
  const p = row.bundle.participant
  const today = todayIL()
  const last = p.end_date < today ? p.end_date : today
  const days = p.start_date <= last ? rangeDays(p.start_date, last).reverse() : []
  const sel = day && days.includes(day) ? day : days[0]
  const selLog = row.bundle.logs.find((l) => l.log_date === sel)
  const byDate = new Map(row.bundle.logs.map((l) => [l.log_date, l]))
  const yes = <Check size={16} style={{ color: 'var(--success)' }} />

  return (
    <>
      <header className="greet">
        <div>
          <p className="hello"><Link href="/admin/participants" className="link">ניהול משתתפים</Link></p>
          <h1>{p.full_name}</h1>
        </div>
        <div className="row">
          <Link href={`/team/${p.id}`} className="btn light small">שיחות ויעד</Link>
          <Link href={`/admin/results/${p.id}`} className="btn light small">לפני-אחרי</Link>
        </div>
      </header>

      <section className="card">
        <div className="card-title"><h2>פרטים והקצאת צוות</h2></div>
        <ParticipantForm p={p} staff={staff} />
      </section>

      {sel && (
        <div className="split">
          <section className="card" style={{ padding: 8 }}>
            <div className="card-title" style={{ padding: '12px 12px 0' }}><h2>יומן ימים</h2><span className="hint">לחיצה על יום לעריכה</span></div>
            <div className="scroll-x" style={{ maxHeight: 460, overflowY: 'auto' }}>
              <table className="table">
                <thead><tr><th>יום</th><th>תאריך</th><th>תזונה</th><th>אימון</th><th>מדידה</th><th>משקל</th></tr></thead>
                <tbody>
                  {days.map((d, i) => {
                    const l = byDate.get(d)
                    return (
                      <tr key={d} style={d === sel ? { background: 'var(--accent-soft)' } : undefined}>
                        <td><Link className="link" href={`?day=${d}`}><span className="num">{days.length - i}</span></Link></td>
                        <td>{HEB_WEEKDAYS_SHORT[weekday(d)]} <span className="num">{shortDate(d)}</span></td>
                        <td>{l?.nutrition_logged && yes}</td>
                        <td>{l?.workout_attended && yes}</td>
                        <td>{l?.measurement_logged && yes}</td>
                        <td className="num">{l?.weight ?? ''}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card">
            <div className="card-title"><h2>עריכה ידנית של יום</h2></div>
            <ActionForm action={saveLogAction} submit="שמירת היום" key={sel}>
              <input type="hidden" name="participant_id" value={p.id} />
              <div className="field"><label htmlFor="log_date">תאריך</label><input id="log_date" name="log_date" type="date" defaultValue={sel} min={p.start_date} max={last} required /></div>
              <label className="check"><input type="checkbox" name="nutrition_logged" defaultChecked={selLog?.nutrition_logged} /> דיווח תזונה</label>
              <label className="check"><input type="checkbox" name="workout_attended" defaultChecked={selLog?.workout_attended} /> הגיע לאימון</label>
              <label className="check"><input type="checkbox" name="measurement_logged" defaultChecked={selLog?.measurement_logged} /> מדידה שבועית</label>
              <div className="field"><label htmlFor="weight">משקל</label><input id="weight" name="weight" type="number" step="0.1" defaultValue={selLog?.weight ?? ''} /></div>
              <div className="field"><label htmlFor="note">הערה</label><input id="note" name="note" type="text" defaultValue={selLog?.note ?? ''} /></div>
              <p className="hint">הגיבוי כשמשהו נופל. שינוי כאן משפיע על הרצף, הסטטוס והזכאות מיד.</p>
            </ActionForm>
          </section>
        </div>
      )}
    </>
  )
}
