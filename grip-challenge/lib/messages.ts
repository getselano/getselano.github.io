// Outgoing WhatsApp messages (spec §10). Pure builders: `text` is what is
// sent; `params` are its variable parts, kept for tests and in case the
// club later moves to template-based sending. Compare a participant only
// with their own last week.
import type { Row } from './data'
import { REWARD_DAYS } from './program'

export interface Message {
  template: 'daily_reminder' | 'weekly_summary' | 'staff_summary'
  params: string[]
  text: string
}

const firstName = (r: Row) => r.bundle.participant.full_name.split(' ')[0]

/** Evening nudge for whoever has not marked today. */
export function dailyReminder(r: Row): Message {
  const name = firstName(r)
  const s = r.snap
  const line =
    s.currentStreak > 0
      ? `הרצף שלך על ${s.currentStreak} ימים. סימון אחד שומר עליו.`
      : `עוד ${s.rewardRemaining} ימים מסומנים לאימון האישי.`
  return {
    template: 'daily_reminder',
    params: [name, line],
    text: `היי ${name}, עוד לא סימנת את היום. ${line}`,
  }
}

/** End of the calendar week: this week against last week, same person. */
export function weeklySummary(r: Row): Message {
  const name = firstName(r)
  const s = r.snap
  const cmp =
    s.week.lastWeek === 0 || s.dayNumber <= 7
      ? `השבוע סימנת ${s.week.thisWeek} ימים.`
      : s.week.thisWeek > s.week.lastWeek
        ? `השבוע סימנת ${s.week.thisWeek} ימים, יותר מ-${s.week.lastWeek} בשבוע שעבר.`
        : s.week.thisWeek === s.week.lastWeek
          ? `השבוע סימנת ${s.week.thisWeek} ימים, בדיוק כמו בשבוע שעבר.`
          : `השבוע סימנת ${s.week.thisWeek} ימים (בשבוע שעבר ${s.week.lastWeek}). שבוע חדש מתחיל מחר.`
  const reward = s.rewardEligible ? 'האימון האישי כבר שלך.' : `${s.rewardDays}/${REWARD_DAYS} ימים לאימון האישי.`
  const workouts = `${s.actualWorkouts}/12 אימונים.`
  return {
    template: 'weekly_summary',
    params: [name, cmp, `${reward} ${workouts}`],
    text: `היי ${name}, סיכום שבוע ${s.programWeek}: ${cmp} ${reward} ${workouts}`,
  }
}

/** Weekly note to a staff member about the participants assigned to them. */
export function staffSummary(staffName: string, rows: Row[]): Message {
  const red = rows.filter((r) => r.snap.status.color === 'red')
  const yellow = rows.filter((r) => r.snap.status.color === 'yellow')
  const counts = `${rows.length} פעילים: ${red.length} באדום, ${yellow.length} בצהוב.`
  const names = red.length ? `לשיחה השבוע: ${red.map((r) => r.bundle.participant.full_name).join(', ')}.` : 'אף אחד לא באדום.'
  return {
    template: 'staff_summary',
    params: [staffName, counts, names],
    text: `היי ${staffName}, ${counts} ${names}`,
  }
}
