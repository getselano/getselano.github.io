import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BeforeAfterBars } from '@/components/BeforeAfter'
import { Alert, Grip } from '@/components/icons'
import { fmt } from '@/components/participant'
import { PrintButton } from '@/components/PrintButton'
import { WeightChart } from '@/components/WeightChart'
import { loadParticipant, requireRole } from '@/lib/data'

export const metadata = { title: 'לפני-אחרי' }

export default async function Results({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  const row = await loadParticipant(id)
  if (!row) notFound()
  const { snap, bundle } = row
  const p = bundle.participant
  const w = snap.weight
  const first = p.full_name.split(' ')[0]

  return (
    <>
      <header className="greet no-print">
        <div>
          <p className="hello"><Link className="link" href={`/admin/participants/${p.id}`}>{p.full_name}</Link></p>
          <h1>לפני-אחרי</h1>
        </div>
        <PrintButton />
      </header>

      {!p.marketing_consent && (
        <section className="card danger banner no-print">
          <Alert size={22} style={{ color: 'var(--danger)' }} />
          <p><strong>אין הסכמה לשימוש שיווקי.</strong> אפשר לצפות, אבל לא לפרסם עד שמסמנים הסכמה בכרטיס המשתתף.</p>
        </section>
      )}

      <section className="ba stack" style={{ gap: 20, maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <div className="ba-head">
          <div>
            <div className="hint">אתגר 6 השבועות · גריפ</div>
            <h1 style={{ fontSize: 30 }}>{first}{snap.finished ? '' : <span className="muted" style={{ fontSize: 18 }}> · יום {snap.dayNumber}</span>}</h1>
          </div>
          <div className="brand-mark"><Grip /></div>
        </div>

        {w.start != null && w.current != null ? (
          <>
            <div className="row" style={{ justifyContent: 'center', gap: 28, textAlign: 'center' }}>
              <div>
                <div className="ba-num num" style={{ color: 'var(--accent)' }}>{w.delta! < 0 ? '−' : '+'}{fmt(Math.abs(w.delta!))}</div>
                <div className="muted">ק״ג</div>
              </div>
              <div>
                <div className="ba-num num">{snap.rewardDays}</div>
                <div className="muted">ימים מסומנים</div>
              </div>
              <div>
                <div className="ba-num num">{snap.actualWorkouts}</div>
                <div className="muted">אימונים</div>
              </div>
            </div>
            <BeforeAfterBars before={w.start} after={w.current} />
            <WeightChart w={w} today={snap.dayNumber} height={150} />
          </>
        ) : (
          <p className="muted">אין עדיין מספיק מדידות להשוואה.</p>
        )}
        {bundle.goal?.goal_text && <p className="muted" style={{ textAlign: 'center' }}>היעד: {bundle.goal.goal_text}</p>}
      </section>
    </>
  )
}
