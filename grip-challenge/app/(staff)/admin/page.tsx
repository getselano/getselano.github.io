import Link from 'next/link'
import { Alert } from '@/components/icons'
import { initials, STATUS_SOFT } from '@/components/staff'
import { WeekBars } from '@/components/WeekBars'
import { loadRows, requireRole, userRepo } from '@/lib/data'
import { dashboard } from '@/lib/dashboard'
import { STATUS_COLORS } from '@/lib/program'

export const metadata = { title: 'דשבורד' }

const nf = new Intl.NumberFormat('he-IL')

export default async function AdminDashboard() {
  await requireRole('admin')
  const [rows, staff] = await Promise.all([loadRows(), (await userRepo()).staff()])
  const d = dashboard(rows)
  const name = (id: string | null) => staff.find((s) => s.id === id)?.full_name ?? 'לא שובץ'
  const unassigned = rows.filter(
    (r) => r.bundle.participant.status === 'active' && !r.snap.finished && (!r.bundle.participant.coach_id || !r.bundle.participant.nutritionist_id),
  )
  const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0)

  return (
    <>
      <header className="greet">
        <div>
          <p className="hello">תמונה אחת לכל האתגר</p>
          <h1>דשבורד</h1>
        </div>
      </header>

      {unassigned.length > 0 && (
        <section className="card soft-orange banner" aria-label="ממתינים לשיבוץ">
          <Alert size={22} style={{ color: 'var(--streak-deep)' }} />
          <div>
            <strong>{unassigned.length === 1 ? 'משתתף אחד ממתין לשיבוץ צוות' : `${unassigned.length} משתתפים ממתינים לשיבוץ צוות`}</strong>
            <p className="small" style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {unassigned.map((r) => (
                <Link key={r.bundle.participant.id} href={`/admin/participants/${r.bundle.participant.id}`} className="link">{r.bundle.participant.full_name}</Link>
              ))}
            </p>
          </div>
        </section>
      )}

      <div className="grid4">
        <Kpi label="משתתפים פעילים" value={d.active} />
        <Kpi label="דיווחו היום" value={d.reportedToday} sub={`${pct(d.reportedToday, d.active)}% מהפעילים`} />
        <Kpi label="בסיכון נשירה" value={d.atRisk} sub={`ועוד ${d.watch} בצהוב`} color={d.atRisk ? STATUS_COLORS.red : undefined} />
        <Kpi label="רצף ממוצע" value={d.avgStreak} sub="ימים" />
      </div>

      <div className="split">
        <div className="stack" style={{ gap: 14 }}>
          <section className="card">
            <div className="card-title"><h2>משתתפים לפי שבוע בתהליך</h2></div>
            <WeekBars counts={d.byWeek} />
          </section>

          <div className="grid3">
            <Mini label="דיווח תזונה" value={`${d.nutritionPct}%`} hint="מהקצב הנדרש" />
            <Mini label="נוכחות ממוצעת" value={`${d.attendancePct}%`} hint="מהקצב הנדרש" />
            <Mini label="שיחות שבוצעו" value={`${d.callsThisWeek}/${d.active}`} hint="ב-7 הימים האחרונים" />
          </div>

          <section className="card">
            <div className="card-title">
              <h2>דורשים התערבות היום</h2>
              <Link href="/team?f=red" className="link small">לרשימה המלאה</Link>
            </div>
            {d.risk.length ? (
              <div className="scroll-x">
                <table className="table">
                  <thead><tr><th>משתתף</th><th>הסיבה</th><th>אחראי</th></tr></thead>
                  <tbody>
                    {d.risk.map(({ row, owner }) => {
                      const p = row.bundle.participant
                      return (
                        <tr key={p.id}>
                          <td>
                            <Link href={`/team/${p.id}`} className="row" style={{ gap: 8 }}>
                              <span className="avatar" style={{ width: 32, height: 32, fontSize: 12, background: STATUS_SOFT.red, color: STATUS_COLORS.red }}>{initials(p.full_name)}</span>
                              <strong>{p.full_name}</strong>
                            </Link>
                          </td>
                          <td style={{ color: STATUS_COLORS.red }}>{row.snap.status.reasons.map((r) => r.text).join(' · ')}</td>
                          <td>{name(owner === 'coach' ? p.coach_id : p.nutritionist_id)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">אין אף אחד באדום היום.</p>
            )}
          </section>
        </div>

        <section className="card accent stack" aria-label="תחזית" style={{ gap: 16 }}>
          <div>
            <h2 style={{ color: '#fff' }}>תחזית</h2>
            <p className="muted small">לפי הקצב של כל משתתף עד יום 42</p>
          </div>
          <Forecast label="צפויים לעמוד ביעד" value={d.forecast.goal} sub={`${d.forecast.membershipMonths} חודשי מנוי מתנה`} />
          <Forecast label="אימונים אישיים" value={d.forecast.reward} sub={`${nf.format(d.forecast.rewardCost)} ₪`} />
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 14 }}>
            <div className="muted small">עלות פרסים צפויה</div>
            {d.forecast.membershipCost != null ? (
              <div className="num" style={{ fontSize: 34, fontWeight: 800 }}>{nf.format(d.forecast.rewardCost + d.forecast.membershipCost)} ₪</div>
            ) : (
              <>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                  <span className="num">{nf.format(d.forecast.rewardCost)}</span> ₪ + <span className="num">{d.forecast.membershipMonths}</span> חודשי מנוי
                </div>
                <p className="muted small" style={{ marginTop: 4 }}>לחישוב בשקלים יש להגדיר את שווי חודש המנוי (NEXT_PUBLIC_MEMBERSHIP_MONTH_VALUE).</p>
              </>
            )}
          </div>
          {d.atRisk > 0 && (
            <p className="small row" style={{ alignItems: 'flex-start' }}><Alert size={18} style={{ flex: 'none' }} /> שיחה היום עם {d.atRisk} האדומים היא מה שמזיז את התחזית.</p>
          )}
        </section>
      </div>
    </>
  )
}

function Kpi({ label, value, sub, color }: { label: string; value: number; sub?: string; color?: string }) {
  return (
    <div className="card kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-val" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}

function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card mini" style={{ padding: 16 }}>
      <div className="num">{value}</div>
      <div className="small" style={{ fontWeight: 600 }}>{label}</div>
      <div className="hint">{hint}</div>
    </div>
  )
}

function Forecast({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="row between">
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div className="muted small">{sub}</div>
      </div>
      <div className="num" style={{ fontSize: 34, fontWeight: 800 }}>{value}</div>
    </div>
  )
}
