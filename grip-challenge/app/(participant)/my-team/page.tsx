import { Calendar, Logout, Message, Phone } from '@/components/icons'
import { signOut } from '../../login/actions'
import { HEB_WEEKDAYS, todayIL, weekday } from '@/lib/dates'
import { requireRole, userRepo } from '@/lib/data'
import { displayPhone, whatsappLink } from '@/lib/phone'
import type { Staff } from '@/lib/types'

export const metadata = { title: 'הצוות שלי' }

export default async function MyTeamPage() {
  const v = await requireRole('participant')
  const repo = await userRepo()
  const [staff, schedule] = await Promise.all([repo.staff(), repo.schedule()])
  const p = v.participant
  const coach = staff.find((s) => s.id === p.coach_id)
  const nutri = staff.find((s) => s.id === p.nutritionist_id)
  const first = p.full_name.split(' ')[0]
  const slotTime = p.call_time?.slice(0, 5)
  const nextCall =
    coach && p.call_weekday != null && slotTime
      ? `${p.call_weekday === weekday(todayIL()) ? 'היום' : `ביום ${HEB_WEEKDAYS[p.call_weekday]}`} בשעה ${slotTime}`
      : null

  return (
    <main className="app">
      <header className="greet">
        <div>
          <p className="hello">מי שמלווים אותך ב-42 הימים</p>
          <h1>הצוות שלי</h1>
        </div>
      </header>

      {coach && <Person s={coach} role="מאמן/ת מנטלי/ת" note="שיחה שבועית וליווי מנטלי" hello={`היי ${coach.full_name}, זה ${first} מאתגר 6 השבועות`} next={nextCall} />}
      {nutri && <Person s={nutri} role="תזונאי/ת" note="התפריט, הדיווח היומי והיעד" hello={`היי ${nutri.full_name}, זה ${first} מאתגר 6 השבועות`} />}
      {!coach && !nutri && <div className="card muted">הצוות שלך ישובץ בימים הקרובים.</div>}

      {schedule.some((s) => s.active) && (
        <section className="card">
          <div className="card-title"><h2>האימונים הקבועים</h2><Calendar size={20} style={{ color: 'var(--ink-3)' }} /></div>
          <div className="stack">
            {schedule.filter((s) => s.active).map((s) => (
              <div key={s.id} className="row between">
                <span>יום {HEB_WEEKDAYS[s.weekday]} · {s.title}</span>
                <span className="num" style={{ fontWeight: 700 }}>{s.start_time}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <form action={signOut} style={{ marginTop: 8 }}>
        <button className="btn ghost block"><Logout size={18} /> התנתקות</button>
      </form>
    </main>
  )
}

function Person({ s, role, note, hello, next }: { s: Staff; role: string; note: string; hello: string; next?: string | null }) {
  return (
    <section className="card">
      <div className="row" style={{ gap: 14 }}>
        <span className="avatar" style={{ width: 52, height: 52, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 18 }}>
          {s.full_name.slice(0, 1)}
        </span>
        <div style={{ flex: 1 }}>
          <h2>{s.full_name}</h2>
          <div className="muted small">{role} · {note}</div>
        </div>
      </div>
      {next && (
        <div className="row" style={{ gap: 8, marginTop: 12, padding: '10px 12px', borderRadius: 12, background: 'var(--accent-soft)' }}>
          <Calendar size={18} style={{ color: 'var(--accent)' }} />
          <span className="small">השיחה הבאה: <strong className="num">{next}</strong></span>
        </div>
      )}
      <div className="grid2" style={{ marginTop: 16 }}>
        <a className="btn accent small" href={whatsappLink(s.phone, hello)} target="_blank" rel="noreferrer"><Message size={18} /> וואטסאפ</a>
        <a className="btn light small" href={`tel:+${s.phone}`} aria-label={`התקשרות ל${s.full_name} ${displayPhone(s.phone)}`}><Phone size={18} /> שיחה</a>
      </div>
    </section>
  )
}
