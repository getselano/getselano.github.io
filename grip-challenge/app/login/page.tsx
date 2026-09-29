import { redirect } from 'next/navigation'
import { Grip } from '@/components/icons'
import { currentViewer, homeFor } from '@/lib/data'
import { DEMO_PERSONAS } from '@/lib/data/demo-seed'
import { isDemo } from '@/lib/env'
import { demoSignIn } from './actions'
import { PhoneLogin } from './PhoneLogin'

export default async function LoginPage() {
  const v = await currentViewer()
  if (v) redirect(homeFor(v))

  return (
    <main className="app nonav login">
      <div className="stack" style={{ gap: 24 }}>
        <div className="brand">
          <div className="brand-mark"><Grip /></div>
          <div>
            <h1>אתגר 6 השבועות</h1>
            <p className="muted">גריפ · 42 ימים</p>
          </div>
        </div>

        {isDemo ? (
          <div className="card stack">
            <h2>מצב הדגמה</h2>
            <p className="muted small">אין חיבור ל-Supabase, אז הנתונים לדוגמה והכניסה בלי SMS. בחרו את מי לראות:</p>
            <form action={demoSignIn} className="stack">
              {DEMO_PERSONAS.map((p) => (
                <button key={p.id} name="as" value={p.id} className="persona" type="submit">
                  <span className="avatar" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>{p.label.slice(0, 1)}</span>
                  <span>
                    <strong>{p.label}</strong>
                    <span className="hint" style={{ display: 'block' }}>{p.hint}</span>
                  </span>
                </button>
              ))}
            </form>
          </div>
        ) : (
          <PhoneLogin />
        )}
      </div>
    </main>
  )
}
