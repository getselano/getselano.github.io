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
  const repo = await userRepo()
  const [staff, deal] = await Promise.all([repo.staff(), repo.deal(id)])
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

      <section className="card">
        <div className="card-title"><h2>פרטי העסקה</h2><span className="hint">רק admin רואה</span></div>
        {deal ? (
          <table className="table">
            <tbody>
              <Row k="נחתם" v={deal.signed_at} />
              <Row k="תמורה" v={deal.price != null ? `${deal.price.toLocaleString('he-IL')} ₪` : null} />
              <Row k="אמצעי תשלום" v={deal.payment} />
              <Row k="ת.ז." v={deal.id_number} />
              <Row k="תאריך לידה" v={deal.birth_date} />
              <Row k="כתובת" v={deal.address} />
              <Row k="שימוש בתמונות" v={deal.photo_consent == null ? null : deal.photo_consent ? 'מאשר' : 'לא מאשר'} />
              <Row k="תעודה רפואית" v={deal.needs_medical == null ? null : deal.needs_medical ? 'נדרשת' : 'לא נדרשת'} />
              {deal.is_minor && <Row k="קטין · הורה חותם" v={[deal.parent_name, deal.parent_id, deal.parent_phone].filter(Boolean).join(' · ')} />}
              {deal.agreement_url && (
                <tr><th>ההסכם החתום</th><td><a className="link" href={deal.agreement_url} target="_blank" rel="noreferrer">פתיחת ה-PDF</a></td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <p className="muted small">אין פרטי עסקה. המשתתף נוצר ידנית, או לפני שמערכת החתימה חוברה.</p>
        )}
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

function Row({ k, v }: { k: string; v: string | null }) {
  if (!v) return null
  return (
    <tr>
      <th style={{ width: '38%' }}>{k}</th>
      <td>{v}</td>
    </tr>
  )
}
