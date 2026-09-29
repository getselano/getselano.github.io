import Link from 'next/link'
import { Chevron } from '@/components/icons'
import { encouragement } from '@/lib/calc'
import { HEB_WEEKDAYS, shortDate, weekday } from '@/lib/dates'
import { participantView } from '@/lib/participant-view'
import { DailyMarker } from './DailyMarker'

export const metadata = { title: 'הסימון של היום' }

export default async function TodayPage() {
  const v = await participantView()
  const { snap, todayLog } = v

  return (
    <main className="app">
      <header className="greet">
        <div>
          <p className="hello">יום {HEB_WEEKDAYS[weekday(snap.today)]} · <span className="num">{shortDate(snap.today)}</span></p>
          <h1>הסימון של היום</h1>
        </div>
        <Link href="/" className="day-chip" aria-label="חזרה לבית">
          יום <span className="num">{snap.dayNumber}</span> מתוך <span className="num">42</span>
        </Link>
      </header>

      {v.active ? (
        <DailyMarker
          today={snap.today}
          initial={{
            nutrition_logged: !!todayLog?.nutrition_logged,
            workout_attended: !!todayLog?.workout_attended,
            measurement_logged: !!todayLog?.measurement_logged,
          }}
          initialWeight={todayLog?.weight ?? null}
          show={v.cards}
          workoutSelfReport={v.workoutSelfReport}
          workoutConfirmed={!!todayLog?.workout_confirmed_by}
          workoutHint={v.next?.isToday ? `${v.next.time}${v.next.coachName ? ` · עם ${v.next.coachName}` : ''}` : null}
          streak={snap.currentStreak}
          longest={snap.longestStreak}
          sentence={encouragement(snap)}
          dots={snap.dots}
        />
      ) : (
        <div className="card stack">
          <h2>{snap.started ? 'התוכנית הסתיימה' : 'עוד לא התחלנו'}</h2>
          <p className="muted">{snap.started ? 'אין מה לסמן היום. כל הנתונים שלך נשמרו.' : 'הסימון נפתח ביום הראשון של התוכנית.'}</p>
          <Link href="/" className="link"><Chevron size={18} style={{ transform: 'scaleX(-1)' }} /> חזרה לבית</Link>
        </div>
      )}
    </main>
  )
}
