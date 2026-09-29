import { ActionForm } from '@/components/ActionForm'
import { requireRole, userRepo } from '@/lib/data'
import { displayPhone } from '@/lib/phone'
import { deleteStaffAction, saveStaffAction } from '../actions'

export const metadata = { title: 'צוות' }
const ROLE = { coach: 'מאמן', nutritionist: 'תזונאית', admin: 'admin' } as const

export default async function StaffAdmin() {
  const v = await requireRole('admin')
  const staff = await (await userRepo()).staff()
  return (
    <>
      <header className="greet"><div><p className="hello">מי נכנס למערכת, ובאיזה תפקיד</p><h1>צוות</h1></div></header>
      <div className="split">
        <section className="card" style={{ padding: 8 }}>
          <table className="table">
            <thead><tr><th>שם</th><th>טלפון</th><th>תפקיד</th><th></th></tr></thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.full_name}</strong></td>
                  <td className="num">{displayPhone(s.phone)}</td>
                  <td>{ROLE[s.role]}</td>
                  <td>
                    {s.id !== v.staff.id && (
                      <form action={deleteStaffAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="btn ghost small">הסרה</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card">
          <div className="card-title"><h2>הוספת איש צוות</h2></div>
          <ActionForm action={saveStaffAction} submit="הוספה" resetOnOk>
            <div className="field"><label htmlFor="full_name">שם</label><input id="full_name" name="full_name" type="text" required /></div>
            <div className="field"><label htmlFor="phone">טלפון</label><input id="phone" name="phone" type="tel" required /></div>
            <div className="field">
              <label htmlFor="role">תפקיד</label>
              <select id="role" name="role" defaultValue="coach">
                <option value="coach">מאמן</option><option value="nutritionist">תזונאית</option><option value="admin">admin</option>
              </select>
            </div>
            <p className="hint">הכניסה בקוד שנשלח בוואטסאפ למספר הזה.</p>
          </ActionForm>
        </section>
      </div>
    </>
  )
}
