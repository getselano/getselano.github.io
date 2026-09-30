import { describe, expect, it } from 'vitest'
import { snapshot } from './calc'
import { addDays } from './dates'
import { adminNewParticipant, attendanceReminder, callToday, coachEvening, coachMorning, firstCallDone, intakeDone, nutriMorning, rewardEarned, dailyReminder, staffNewParticipant, staffSummary, weeklySummary, welcomeMessage } from './messages'
import type { DailyLog, Participant } from './types'

const START = '2026-09-06' // Sunday
const today = addDays(START, 16) // day 17, Tuesday of week 3

function row(name: string, days: number[], opts: Partial<Participant> = {}) {
  const logs: DailyLog[] = days.map((n) => ({ log_date: addDays(START, n - 1), nutrition_logged: true, workout_attended: n % 3 === 0, measurement_logged: false, weight: null }))
  const participant = { id: name, full_name: name, phone: '972500000000', start_date: START, status: 'active', ...opts } as Participant
  return { bundle: { participant, goal: null, logs, calls: [], milestones: [] }, snap: snapshot({ start: START, today, logs, calls: [], goal: null }) }
}

describe('messages', () => {
  it('daily reminder leads with the streak', () => {
    const m = dailyReminder(row('דנה כהן', Array.from({ length: 16 }, (_, i) => i + 1)))
    expect(m.params[0]).toBe('דנה')
    expect(m.text).toContain('16 ימים של עבודה עומדים על הקו')
  })
  it('weekly summary compares with the same person last week only', () => {
    // Last week (days 8–14): 4 marked. This week so far (15–17): 3.
    const m = weeklySummary(row('יוסי', [1, 2, 3, 8, 9, 10, 11, 15, 16, 17]))
    expect(m.text).toContain('השבוע סימנת 3 ימים (בשבוע שעבר 4)')
    expect(m.params).toHaveLength(3)
  })
  it('staff summary names the red ones', () => {
    const red = row('מאיה', [1, 2, 3])
    const green = row('גיל', Array.from({ length: 17 }, (_, i) => i + 1))
    const m = staffSummary('רון', [red, green])
    expect(m.text).toContain('לשיחה השבוע: מאיה')
  })
  it('welcome message has the app link and the start date', () => {
    const m = welcomeMessage({ full_name: 'רונית לוי', start_date: '2026-10-04' }, 'https://grip-challenge.netlify.app', '2026-09-29')
    expect(m.text).toContain('היי רונית')
    expect(m.text).toContain('מתחיל ב-4.10.2026')
    expect(m.text).toContain('https://grip-challenge.netlify.app')
    expect(welcomeMessage({ full_name: 'רונית', start_date: '2026-09-29' }, 'u', '2026-09-29').text).toContain('מתחיל היום')
  })
  it('briefs the nutritionist and the mental coach with their own next step', () => {
    const p = { full_name: 'רונית לוי', phone: '972501234567', start_date: '2026-10-04', price: 2500 }
    const tal = staffNewParticipant('nutritionist', 'טל', p, 'https://x/team/1').text
    expect(tal).toContain('היי טל, הצטרפות חדשה לאתגר: רונית לוי (050-123-4567)')
    expect(tal).toContain('שיחת קליטה בזום')
    expect(tal).toContain('https://x/team/1')
    expect(staffNewParticipant('coach', 'לואיזה', p, 'l').text).toContain('שיחת היכרות קצרה')
  })
  it('tells admins who joined and whether they were assigned', () => {
    const p = { full_name: 'רונית לוי', phone: '972501234567', start_date: '2026-10-04', price: 2500 }
    expect(adminNewParticipant('אביב', p, { nutritionist: 'טל', coach: 'לואיזה' }, 'l').text).toContain('שובץ/ה ל: טל (תזונה), לואיזה')
    expect(adminNewParticipant('אביב', p, { nutritionist: null, coach: 'לואיזה' }, 'https://x/admin/1').text).toContain('ממתין/ה לשיבוץ צוות: https://x/admin/1')
  })
  it('warns admins when the signed phone belongs to a staff member', () => {
    const p = { full_name: 'גלעד', phone: '972544510185', start_date: '2026-09-30', price: 3500 }
    const m = adminNewParticipant('הדר', p, { nutritionist: 'טל', coach: 'לואיזה' }, 'https://x/admin/1', 'אביב').text
    expect(m).toContain('⚠️ הטלפון שנרשם בהסכם (054-451-0185) הוא של אביב')
    expect(adminNewParticipant('הדר', p, { nutritionist: 'טל', coach: 'לואיזה' }, 'l').text).not.toContain('⚠️')
  })
  it('reminds admins to upload the weekly Boostapp report', () => {
    const t = attendanceReminder('הדר כהן', 7, 'https://x/admin/attendance').text
    expect(t).toContain('היי הדר, שבוע טוב!')
    expect(t).toContain('(7 משתתפים פעילים באתגר)')
    expect(t).toContain('https://x/admin/attendance')
  })
  it('staff alerts name the participant and link to them', () => {
    expect(intakeDone('אביב גוילי', 'טל', 'רונית לוי', 'לרדת ל-72', 78, 'L').text).toBe('היי אביב, ✅ טל סיים/ה שיחת קליטה עם רונית לוי\nהיעד: לרדת ל-72 · משקל פתיחה: 78\nL')
    expect(firstCallDone('הדר', 'לואיזה', 'רונית', 'L').text).toContain('✅ לואיזה ביצע/ה שיחה ראשונה עם רונית')
    expect(rewardEarned('הדר', 'רונית', 'L').text).toContain('36 ימים')
    expect(callToday('רונית לוי', 'לואיזה מור', '10:00').text).toBe('היי רונית, היום ב-10:00 שיחה שבועית עם לואיזה 💬')
  })
  it('digests say only what needs doing, and nothing when there is nothing', () => {
    expect(coachMorning('לואיזה', { today: [], weekEnding: [], noFirstCall: [] }, 'L')).toBeNull()
    const m = coachMorning('לואיזה', { today: [{ name: 'רונית', time: '10:00' }], weekEnding: [{ name: 'יוסי', days: 6 }], noFirstCall: [] }, 'L')!.text
    expect(m).toContain('השיחות שלך היום: רונית 10:00')
    expect(m).toContain('יוסי (6 ימים)')
    expect(m).not.toContain('היכרות')
    expect(coachEvening('לואיזה', [], 'L')).toBeNull()
    expect(coachEvening('לואיזה', ['רונית'], 'L')!.text).toContain('לא תועדה היום שיחה עם: רונית')
    expect(nutriMorning('טל', { noLog: [], noGoal: [], ending: [] }, 'L')).toBeNull()
    expect(nutriMorning('טל', { noLog: [{ name: 'דנה', days: 2 }], noGoal: [], ending: [{ name: 'רונית', endDate: '2026-11-15' }] }, 'L')!.text).toContain('רונית (15.11.2026)')
  })
})
