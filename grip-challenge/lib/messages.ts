// Outgoing WhatsApp messages (spec §10). Pure builders: `text` is what is
// sent; `params` are its variable parts, kept for tests and in case the
// club later moves to template-based sending. Compare a participant only
// with their own last week.
import type { Row } from './data'
import { REWARD_DAYS } from './program'

export interface Message {
  template: 'daily_reminder' | 'weekly_summary' | 'staff_summary' | 'welcome' | 'staff_new' | 'admin_new' | 'attendance_reminder' | 'staff_alert' | 'digest' | 'call_today'
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
export function staffNewParticipant(
  role: 'nutritionist' | 'coach',
  staffName: string,
  p: NewParticipantInfo,
  link: string,
  goalLink: string | null = null,
): Message {
  const first = p.full_name.split(' ')[0]
  const next =
    role === 'coach'
      ? ['הצעד שלך: שיחת היכרות קצרה השבוע, לפני שהאתגר יוצא לדרך. כל המעקב כאן:', link]
      : goalLink
        ? [
            'הצעד שלך: לתאם שיחת קליטה בזום.',
            `בסוף השיחה שלח/י ל${first} את הקישור האישי לחתימה על נספח היעד. השם והטלפון כבר ממולאים, והיעד נכנס לאפליקציה לבד אחרי החתימה:`,
            goalLink,
            '',
            'הכרטיס באפליקציה:',
            link,
          ]
        : ['הצעד שלך: לתאם שיחת קליטה בזום, לקבוע יחד את היעד ולהזין אותו באפליקציה:', link]
  const text = [`היי ${staffName.split(' ')[0]}, הצטרפות חדשה לאתגר: ${p.full_name} (${localPhone(p.phone)})`, `תחילת האתגר: ${dmy(p.start_date)}`, '', ...next].join('\n')
  return { template: 'staff_new', params: [staffName, p.full_name, dmy(p.start_date), link], text }
}

/** To each admin: who joined, for how much, and who they were assigned to. */
export function adminNewParticipant(
  adminName: string,
  p: NewParticipantInfo,
  assigned: { nutritionist: string | null; coach: string | null },
  link: string,
  phoneBelongsTo: string | null = null,
): Message {
  const assignedLine =
    assigned.nutritionist && assigned.coach
      ? `שובץ/ה ל: ${assigned.nutritionist} (תזונה), ${assigned.coach} (מאמן/ת מנטלי/ת)`
      : `ממתין/ה לשיבוץ צוות: ${link}`
  const text = [
    `היי ${adminName.split(' ')[0]}, הצטרפות חדשה: ${p.full_name} · ${p.price.toLocaleString('he-IL')} ₪`,
    `תחילת האתגר: ${dmy(p.start_date)}`,
    assignedLine,
    ...(phoneBelongsTo
      ? ['', `⚠️ הטלפון שנרשם בהסכם (${localPhone(p.phone)}) הוא של ${phoneBelongsTo}, כנראה טעות בהקלדה. לא נשלחה הודעת ברוכים הבאים. לתקן את המספר כאן, וההודעה תישלח למספר הנכון: ${link}`]
      : []),
  ].join('\n')
  return { template: 'admin_new', params: [adminName, p.full_name, String(p.price)], text }
}

/** Saturday evening, to each admin: export the week's attendance from Boostapp and upload it. */
export function attendanceReminder(adminName: string, activeCount: number, link: string): Message {
  const text = [
    `היי ${adminName.split(' ')[0]}, שבוע טוב!`,
    `הגיע הזמן לקלוט את נוכחות השבוע מבוסטאפ${activeCount ? ` (${activeCount} משתתפים פעילים באתגר)` : ''}.`,
    '',
    '1. בבוסטאפ: דוחות ← דוח נוכחות ← השבוע האחרון ← ייצוא לאקסל',
    '2. להעלות את הקובץ כאן:',
    link,
  ].join('\n')
  return { template: 'attendance_reminder', params: [adminName, String(activeCount), link], text }
}

const first = (name: string) => name.split(' ')[0]

/** To admins, once, when the nutritionist saves a participant's first goal (the intake call happened). */
export function intakeDone(adminName: string, nutriName: string, participant: string, goalText: string, startWeight: number | null, link: string): Message {
  const w = startWeight != null ? ` · משקל פתיחה: ${startWeight}` : ''
  const text = `היי ${first(adminName)}, ✅ ${nutriName} סיים/ה שיחת קליטה עם ${participant}\nהיעד: ${goalText}${w}\n${link}`
  return { template: 'staff_alert', params: [participant], text }
}

/** To admins, once, when the mental coach logs the first call with a participant. */
export function firstCallDone(adminName: string, coachName: string, participant: string, link: string): Message {
  return { template: 'staff_alert', params: [participant], text: `היי ${first(adminName)}, ✅ ${coachName} ביצע/ה שיחה ראשונה עם ${participant}\n${link}` }
}

/** To admins, once, when a participant reaches 36 marked days. */
export function rewardEarned(adminName: string, participant: string, link: string): Message {
  return {
    template: 'staff_alert',
    params: [participant],
    text: `היי ${first(adminName)}, 🎉 ${participant} הגיע/ה ל-36 ימים מסומנים. לתאם את האימון האישי מתנה (250 ₪)\n${link}`,
  }
}

/** To the participant, on the morning of their weekly call. */
export function callToday(participant: string, coachName: string, time: string): Message {
  return { template: 'call_today', params: [participant, time], text: `היי ${first(participant)}, היום ב-${time} שיחה שבועית עם ${first(coachName)} 💬` }
}

export interface CoachMorning {
  today: { name: string; time: string }[]
  weekEnding: { name: string; days: number }[]
  noFirstCall: { name: string; days: number }[]
}

/** 08:00 to the mental coach. null when there is nothing to say. */
export function coachMorning(coachName: string, d: CoachMorning, link: string): Message | null {
  const lines: string[] = []
  if (d.today.length) lines.push(`☀️ השיחות שלך היום: ${d.today.map((x) => `${x.name} ${x.time}`).join(', ')}`)
  if (d.weekEnding.length)
    lines.push(`⚠️ ייגמר השבוע בלי שיחה (עוד יום-יומיים יהפכו לאדום): ${d.weekEnding.map((x) => `${x.name} (${x.days} ימים)`).join(', ')}`)
  if (d.noFirstCall.length) lines.push(`👋 עוד לא הייתה שיחת היכרות: ${d.noFirstCall.map((x) => `${x.name} (הצטרף/ה לפני ${x.days} ימים)`).join(', ')}`)
  if (!lines.length) return null
  return { template: 'digest', params: [coachName], text: [`בוקר טוב ${first(coachName)},`, ...lines, '', link].join('\n') }
}

/** 20:30 to the mental coach: today's slots with no call logged. null when none. */
export function coachEvening(coachName: string, missing: string[], link: string): Message | null {
  if (!missing.length) return null
  return { template: 'digest', params: [coachName], text: `היי ${first(coachName)}, לא תועדה היום שיחה עם: ${missing.join(', ')}. בוצעה? לתעד כאן:\n${link}` }
}

export interface NutriMorning {
  noLog: { name: string; days: number }[]
  noGoal: { name: string; days: number }[]
  ending: { name: string; endDate: string }[]
}

/** 09:00 to the nutritionist. null when there is nothing to say. */
export function nutriMorning(nutriName: string, d: NutriMorning, link: string): Message | null {
  const lines: string[] = []
  if (d.noLog.length) lines.push(`• בלי דיווח תזונה: ${d.noLog.map((x) => `${x.name} (${x.days} ימים)`).join(', ')}`)
  if (d.noGoal.length) lines.push(`• בלי יעד: ${d.noGoal.map((x) => `${x.name} (הצטרף/ה לפני ${x.days} ימים)`).join(', ')}`)
  if (d.ending.length) lines.push(`• מסיימים בעוד יומיים, לתאם מדידת סיום ולסמן עמידה ביעד: ${d.ending.map((x) => `${x.name} (${dmy(x.endDate)})`).join(', ')}`)
  if (!lines.length) return null
  return { template: 'digest', params: [nutriName], text: [`בוקר טוב ${first(nutriName)}, 📋 לטיפול היום:`, ...lines, '', link].join('\n') }
}
