import Link from 'next/link'
import { Alert } from '@/components/icons'
import { byUrgency, isCurrent, ParticipantRow } from '@/components/staff'
import { loadRows, requireRole } from '@/lib/data'
import { STATUS_COLORS } from '@/lib/program'

export const metadata = { title: 'המשתתפים' }

type Filter = 'all' | 'yellow' | 'red'

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const v = await requireRole('coach', 'nutritionist', 'admin')
  const { f } = await searchParams
  const filter: Filter = f === 'red' || f === 'yellow' ? f : 'all'
  const rows = (await loadRows()).filter(isCurrent).sort(byUrgency)
  const reds = rows.filter((r) => r.snap.status.color === 'red')
  const yellows = rows.filter((r) => r.snap.status.color === 'yellow')
  const shown = filter === 'all' ? rows : filter === 'red' ? reds : yellows

  const tabs: { key: Filter; label: string; n: number; color?: string }[] = [
    { key: 'all', label: 'הכל', n: rows.length },
    { key: 'yellow', label: 'צהוב', n: yellows.length, color: STATUS_COLORS.yellow },
    { key: 'red', label: 'אדום', n: reds.length, color: STATUS_COLORS.red },
  ]

  return (
    <>
      <header className="greet">
        <div>
          <p className="hello">{v.role === 'admin' ? 'כל המשתתפים הפעילים' : 'המשתתפים שהוקצו לך'}</p>
          <h1>הצוות</h1>
        </div>
      </header>

      <nav className="tabs" aria-label="סינון לפי סטטוס">
        {tabs.map((t) => (
          <Link key={t.key} href={t.key === 'all' ? '/team' : `/team?f=${t.key}`} className="tab" aria-current={filter === t.key ? 'true' : undefined}>
            {t.color && <span className="swatch" style={{ background: t.color }} />}
            {t.label} · <span className="num">{t.n}</span>
          </Link>
        ))}
      </nav>

      <div className="plist">
        {shown.map((r) => <ParticipantRow key={r.bundle.participant.id} r={r} />)}
        {!shown.length && <div className="card flat muted">{filter === 'all' ? 'אין משתתפים פעילים כרגע.' : 'אין אף אחד בסטטוס הזה. יפה.'}</div>}
      </div>

      {reds.length > 0 && (
        <section className="card danger banner" aria-label="דורשים שיחה היום">
          <Alert size={22} style={{ color: 'var(--danger)' }} />
          <div>
            <strong>{reds.length === 1 ? 'אחד דורש שיחה היום' : reds.length === 2 ? 'שניים דורשים שיחה היום' : `${reds.length} דורשים שיחה היום`}</strong>
            <p className="small" style={{ marginTop: 2 }}>{reds.map((r) => r.bundle.participant.full_name).join(', ')}</p>
          </div>
        </section>
      )}
    </>
  )
}
