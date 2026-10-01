import { ActionForm } from '@/components/ActionForm'
import { attendanceIsSelfReported } from '@/lib/attendance'
import { requireRole, userRepo } from '@/lib/data'
import { HEB_WEEKDAYS } from '@/lib/dates'
import { deleteSlotAction, saveSlotAction } from '../actions'

export const metadata = { title: 'לו״ז אימונים' }

export default async function ScheduleAdmin() {
  await requireRole('admin')
  const repo = await userRepo()
  const [slots, staff] = await Promise.all([repo.schedule(), repo.staff()])
  const coaches = staff.filter((s) => s.role !== 'nutritionist')
  return (
    <>
      <header className="greet">
        <div>
          <p className="hello">אופציונלי. רק אם יש אימונים קבועים. כשהלו״ז ריק (המתאמנים קובעים בבוסטאפ), הכרטיס &quot;הגעתי לאימון&quot; מופיע כל יום כרשות</p>
          <h1>לו״ז אימונים</h1>
        </div>
        <span className="pill">{attendanceIsSelfReported() ? 'נוכחות: דיווח ידני של המשתתף' : 'נוכחות: בוסטאפ'}</span>
      </header>
      <div className="split">
        <section className="card" style={{ padding: 8 }}>
          <table className="table">
            <thead><tr><th>יום</th><th>שעה</th><th>אימון</th><th>מאמן/ת</th><th></th></tr></thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id} style={s.active ? undefined : { opacity: 0.5 }}>
                  <td>{HEB_WEEKDAYS[s.weekday]}</td>
                  <td className="num">{s.start_time}</td>
                  <td>{s.title}</td>
                  <td>{staff.find((x) => x.id === s.coach_id)?.full_name ?? '—'}</td>
                  <td>
                    <form action={deleteSlotAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="btn ghost small">הסרה</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!slots.length && <tr><td colSpan={5} className="muted">אין אימונים בלו״ז.</td></tr>}
            </tbody>
          </table>
        </section>
        <section className="card">
          <div className="card-title"><h2>הוספת אימון קבוע</h2></div>
          <ActionForm action={saveSlotAction} submit="הוספה" resetOnOk>
            <div className="field">
              <label htmlFor="weekday">יום</label>
              <select id="weekday" name="weekday" defaultValue="0">{HEB_WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
            </div>
            <div className="field"><label htmlFor="start_time">שעה</label><input id="start_time" name="start_time" type="time" defaultValue="19:00" required /></div>
            <div className="field"><label htmlFor="title">שם</label><input id="title" name="title" type="text" defaultValue="אימון קבוצתי" /></div>
            <div className="field">
              <label htmlFor="coach_id">מאמן/ת</label>
              <select id="coach_id" name="coach_id" defaultValue="">
                <option value="">—</option>
                {coaches.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
          </ActionForm>
        </section>
      </div>
    </>
  )
}
