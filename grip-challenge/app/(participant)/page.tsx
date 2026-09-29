import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, Check, Chevron, Target } from '@/components/icons'
import { DualProgress, StreakCard } from '@/components/participant'
import { encouragement } from '@/lib/calc'
import { HEB_WEEKDAYS, hourIL, shortDate } from '@/lib/dates'
import { participantView, remainingToday } from '@/lib/participant-view'

export default async function HomePage() {
  const v = await participantView()
  if (v.winPending) redirect('/win')
  const { snap, participant: p } = v
  const first = p.full_name.split(' ')[0]
  const h = hourIL()
  const hello = h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : 'ערב טוב'
  const left = remainingToday(v)

  return (
    <main className="app">
      <header className="greet">
        <div>
          <p className="hello">{hello}, {first}</p>
          <h1>
            {snap.started ? (
              <>יום <span className="num">{snap.dayNumber}</span> מתוך <span className="num">42</span></>
            ) : (
              <>מתחילים ב-<span className="num">{shortDate(p.start_date)}</span></>
            )}
          </h1>
        </div>
      </header>

      <StreakCard streak={snap.currentStreak} longest={snap.longestStreak} />

      <DualProgress snap={snap} goalText={v.goal?.goal_text} />

      {v.active &&
        (left.length ? (
          <Link href="/today" className="cta">
            <span className="cta-text">
              <span className="cta-title" style={{ display: 'block' }}>
                {left.length === 1 ? 'נשאר לך דבר אחד היום' : `נשארו לך ${left.length} דברים היום`}
              </span>
              <span className="cta-sub">{left.map((x) => x.label).join(' · ')}</span>
            </span>
            <span className="cta-arrow"><Chevron size={22} /></span>
          </Link>
        ) : (
          <Link href="/today" className="cta done">
            <span className="cta-text">
              <span className="cta-title" style={{ display: 'block' }}>סיימת להיום</span>
              <span className="cta-sub">הכל מסומן. נתראה מחר.</span>
            </span>
            <span className="cta-arrow"><Check size={22} /></span>
          </Link>
        ))}

      {v.next && (
        <section className="card flat row" aria-label="האימון הבא" style={{ padding: 16 }}>
          <span className="mark-icon" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
            <Calendar size={22} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="hint">האימון הבא</div>
            <div style={{ fontWeight: 700 }}>
              {v.next.isToday ? 'היום' : `יום ${HEB_WEEKDAYS[v.next.weekday]}`} · <span className="num">{v.next.time}</span>
              {v.next.coachName && <span className="muted" style={{ fontWeight: 400 }}> · עם {v.next.coachName}</span>}
            </div>
          </div>
        </section>
      )}

      <section className="card soft-orange row" aria-label="עידוד" style={{ padding: 16, alignItems: 'flex-start' }}>
        <Target size={22} style={{ color: 'var(--streak-deep)', flex: 'none', marginTop: 1 }} />
        <p style={{ fontWeight: 600 }}>{encouragement(snap)}</p>
      </section>
    </main>
  )
}
