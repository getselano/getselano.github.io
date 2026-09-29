import { ActionForm } from './ActionForm'
import { saveParticipantAction } from '@/app/(staff)/admin/actions'
import { displayPhone } from '@/lib/phone'
import { PRICE_DEFAULT } from '@/lib/program'
import type { Participant, Staff } from '@/lib/types'
import { todayIL } from '@/lib/dates'

export function ParticipantForm({ p, staff }: { p?: Participant; staff: Staff[] }) {
  const coaches = staff.filter((s) => s.role === 'coach' || s.role === 'admin')
  const nutris = staff.filter((s) => s.role === 'nutritionist' || s.role === 'admin')
  return (
    <ActionForm action={saveParticipantAction} submit={p ? 'שמירה' : 'יצירת משתתף'}>
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="form-grid">
        <div className="field"><label htmlFor="full_name">שם מלא</label><input id="full_name" name="full_name" type="text" defaultValue={p?.full_name} required /></div>
        <div className="field"><label htmlFor="phone">טלפון</label><input id="phone" name="phone" type="tel" defaultValue={p ? displayPhone(p.phone) : ''} required /></div>
        <div className="field"><label htmlFor="email">אימייל</label><input id="email" name="email" type="email" defaultValue={p?.email ?? ''} /></div>
        <div className="field"><label htmlFor="start_date">תאריך התחלה</label><input id="start_date" name="start_date" type="date" defaultValue={p?.start_date ?? todayIL()} required /></div>
        <div className="field"><label htmlFor="price">מחיר (₪ כולל מע״מ)</label><input id="price" name="price" type="number" defaultValue={p?.price ?? PRICE_DEFAULT} /></div>
        <div className="field">
          <label htmlFor="status">סטטוס</label>
          <select id="status" name="status" defaultValue={p?.status ?? 'active'}>
            <option value="active">פעיל</option><option value="completed">סיים</option><option value="cancelled">בוטל</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="coach_id">מאמן/ת מנטלי/ת</label>
          <select id="coach_id" name="coach_id" defaultValue={p?.coach_id ?? ''}>
            <option value="">לא שובץ</option>
            {coaches.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="nutritionist_id">תזונאי/ת</label>
          <select id="nutritionist_id" name="nutritionist_id" defaultValue={p?.nutritionist_id ?? ''}>
            <option value="">לא שובץ/ה</option>
            {nutris.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
      </div>
      <label className="check"><input type="checkbox" name="marketing_consent" defaultChecked={p?.marketing_consent} /> הסכמה לשימוש בתוצאות לפני-אחרי בשיווק</label>
      <p className="hint">תאריך הסיום מחושב אוטומטית: יום 42 מההתחלה. אין הקפאה.</p>
    </ActionForm>
  )
}
