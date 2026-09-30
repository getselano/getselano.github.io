'use client'
import { useActionState } from 'react'
import { importAttendanceAction, type ImportState } from './actions'

const dmy = (d: string | null) => (d ? d.split('-').reverse().join('.') : '')

export function ImportForm() {
  const [state, run, pending] = useActionState<ImportState, FormData>(importAttendanceAction, null)
  const plan = state?.plan
  return (
    <div className="stack" style={{ gap: 14 }}>
      <form action={run} className="card stack">
        <div className="field">
          <label htmlFor="file">דוח נוכחות מבוסטאפ (Excel)</label>
          <input id="file" name="file" type="file" accept=".xlsx,.csv" required />
        </div>
        <label className="check">
          <input type="checkbox" name="remove" defaultChecked /> להסיר &quot;הגעתי לאימון&quot; שהמשתתף סימן, אם הדוח מראה שלא הגיע באותו יום
        </label>
        <p className="hint">רק משתתפי האתגר מתעדכנים. שאר המתאמנים בדוח מדולגים ולא נשמרים.</p>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          <button className="btn light" name="mode" value="preview" disabled={pending}>{pending ? 'קוראים…' : 'תצוגה מקדימה'}</button>
          <button className="btn accent" name="mode" value="apply" disabled={pending}>קליטה</button>
        </div>
        {state?.error && <p className="error" role="alert">{state.error}</p>}
      </form>

      {plan && (
        <section className={`card ${state?.applied ? 'soft-green' : ''}`} aria-live="polite">
          <div className="card-title">
            <h2>{state?.applied ? 'נקלט ✓' : 'תצוגה מקדימה, עוד לא נשמר'}</h2>
            <span className="hint">{state?.fileName} · <span className="num">{dmy(plan.from)}–{dmy(plan.to)}</span></span>
          </div>
          <div className="grid3" style={{ marginBottom: 14 }}>
            <div className="mini"><div className="num">{plan.add.length}</div><div className="small">אימונים {state?.applied ? 'נוספו' : 'יתווספו'}</div></div>
            <div className="mini"><div className="num">{plan.remove.length}</div><div className="small">סימונים {state?.applied ? 'הוסרו' : 'יוסרו'}</div></div>
            <div className="mini"><div className="num">{plan.matched}</div><div className="small">משתתפי אתגר בדוח</div></div>
          </div>
          <p className="hint" style={{ marginBottom: 10 }}><span className="num">{plan.otherRows}</span> שורות של מתאמנים אחרים דולגו.</p>
          {plan.add.length > 0 && <List title="אימונים שנקלטים מבוסטאפ" items={plan.add.map((a) => `${a.name} · ${dmy(a.date)}`)} />}
          {plan.remove.length > 0 && <List title="סומנו באפליקציה אבל לא מופיעים בבוסטאפ" items={plan.remove.map((a) => `${a.name} · ${dmy(a.date)}`)} />}
          {plan.notFound.length > 0 && (
            <div className="banner" style={{ marginTop: 12 }}>
              <p className="small"><strong>לא מופיעים בדוח:</strong> {plan.notFound.map((n) => n.name).join(', ')}. או שלא הזמינו אף שיעור בתאריכים האלה, או שהטלפון שלהם בבוסטאפ שונה מהטלפון באפליקציה (כדאי לבדוק). הסימונים שלהם לא שונו.</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginTop: 10 }}>
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      <ul className="small" style={{ margin: 0, paddingInlineStart: 18 }}>
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  )
}
