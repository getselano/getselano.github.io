// Outgoing WhatsApp messages (spec §10). Pure builders: `text` is what is
// sent; `params` are its variable parts, kept for tests and in case the
// club later moves to template-based sending. Compare a participant only
// with their own last week.
import type { Row } from './data'
import { REWARD_DAYS } from './program'

export interface Message {
  template: 'daily_reminder' | 'weekly_summary' | 'staff_summary' | 'welcome' | 'staff_new' | 'admin_new'
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
      ? `${s.currentStreak} ימים של עבודה עומדים על הקו. סימון אחד שומר עליהם.`
      : `הגרסה החדשה שלך נבנית יום אחרי יום. הסימון של היום מחכה.`
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

/** Sent once, the moment a participant is created (signing system or admin). */
export function welcomeMessage(p: { full_name: string; start_date: string }, appUrl: string, today: string): Message {
  const name = p.full_name.split(' ')[0]
  const [y, m, d] = p.start_date.split('-')
  const start = p.start_date <= today ? 'היום' : `ב-${Number(d)}.${Number(m)}.${y}`
  const text = [
    `היי ${name}, ברוכים הבאים לאתגר 6 השבועות של גריפ!`,
    '',
    `האתגר שלך מתחיל ${start}. מהיום יש לך אפליקציה אישית למעקב:`,
    appUrl,
    '',
    'נכנסים עם מספר הטלפון הזה, מקבלים קוד כאן בוואטסאפ, וזהו. בלי סיסמה.',
    'כדאי להוסיף אותה למסך הבית של הטלפון.',
    '',
    'כל יום: נגיעה אחת כדי לסמן שדיווחת לתזונאי/ת. 36 ימים מסומנים = אימון אישי מתנה (בשווי 250 ש"ח).',
    '',
    'השלב הבא: שיחת קליטה עם התזונאי/ת, שבה נקבע יחד את היעד שלך.',
  ].join('\n')
  return { template: 'welcome', params: [name, start, appUrl], text }
}

function dmy(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${Number(d)}.${Number(m)}.${y}`
}

function localPhone(e164: string) {
  return e164.startsWith('972') && e164.length === 12 ? `0${e164.slice(3, 5)}-${e164.slice(5, 8)}-${e164.slice(8)}` : `+${e164}`
}

export interface NewParticipantInfo {
  full_name: string
  phone: string
  start_date: string
  price: number
}

/** To the nutritionist or mental coach the new participant was assigned to. */
export function staffNewParticipant(role: 'nutritionist' | 'coach', staffName: string, p: NewParticipantInfo, link: string): Message {
  const next =
    role === 'nutritionist'
      ? 'הצעד שלך: לתאם שיחת קליטה בזום, לקבוע יחד את היעד ולהזין אותו באפליקציה:'
      : 'הצעד שלך: שיחת היכרות קצרה השבוע, לפני שהאתגר יוצא לדרך. כל המעקב כאן:'
  const text = [
    `היי ${staffName.split(' ')[0]}, הצטרפות חדשה לאתגר: ${p.full_name} (${localPhone(p.phone)})`,
    `תחילת האתגר: ${dmy(p.start_date)}`,
    '',
    next,
    link,
  ].join('\n')
  return { template: 'staff_new', params: [staffName, p.full_name, dmy(p.start_date), link], text }
}

/** To each admin: who joined, for how much, and who they were assigned to. */
export function adminNewParticipant(adminName: string, p: NewParticipantInfo, assigned: { nutritionist: string | null; coach: string | null }, link: string): Message {
  const assignedLine =
    assigned.nutritionist && assigned.coach
      ? `שובץ/ה ל: ${assigned.nutritionist} (תזונה), ${assigned.coach} (מאמן/ת מנטלי/ת)`
      : `ממתין/ה לשיבוץ צוות: ${link}`
  const text = [
    `היי ${adminName.split(' ')[0]}, הצטרפות חדשה: ${p.full_name} · ${p.price.toLocaleString('he-IL')} ₪`,
    `תחילת האתגר: ${dmy(p.start_date)}`,
    assignedLine,
  ].join('\n')
  return { template: 'admin_new', params: [adminName, p.full_name, String(p.price)], text }
}
