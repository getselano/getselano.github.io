import 'server-only'
import { withAttendance } from './attendance'
import { snapshot } from './calc'
import { serviceRepo, type Row } from './data'
import { todayIL, weekday } from './dates'
import { coachEveningMissing, coachMorningFor, nutriMorningFor } from './digests'
import { attendanceReminder, callToday, coachEvening, coachMorning, dailyReminder, nutriMorning, staffSummary, weeklySummary, type Message } from './messages'
import { sendWhatsApp } from './whatsapp'

async function currentRows(): Promise<{ rows: Row[]; today: string }> {
  const today = todayIL()
  const bundles = await withAttendance(await serviceRepo().allBundles())
  const rows = bundles
    .map((bundle) => ({
      bundle,
      snap: snapshot({ start: bundle.participant.start_date, today, logs: bundle.logs, calls: bundle.calls, goal: bundle.goal }),
    }))
    .filter((r) => r.bundle.participant.status === 'active' && r.snap.started && !r.snap.finished)
  return { rows, today }
}

type Outcome = { recipient: string; status: string }

/** Sends once per (kind, recipient, day); a retried cron skips what went out. */
export async function deliver(kind: string, recipient: string, phone: string, msg: Message, day: string): Promise<Outcome> {
  const repo = serviceRepo()
  if (!(await repo.claimNotification(kind, recipient, day))) return { recipient, status: 'already_sent' }
  let r: Awaited<ReturnType<typeof sendWhatsApp>>
  try {
    r = await sendWhatsApp(phone, msg.text)
  } catch (e) {
    r = { status: 'failed', detail: String(e) }
  }
  await repo.finishNotification(kind, recipient, day, r.status, r.detail)
  return { recipient, status: r.status }
}

/** Evening reminder to active participants who have not marked nutrition today. */
export async function runDailyReminder() {
  const { rows, today } = await currentRows()
  const out: Outcome[] = []
  for (const r of rows.filter((x) => !x.snap.loggedToday))
    out.push(await deliver('daily_reminder', r.bundle.participant.id, r.bundle.participant.phone, dailyReminder(r), today))
  return out
}

/** End-of-week summary: every active participant, then each staff member about their people. */
export async function runWeeklySummary() {
  const { rows, today } = await currentRows()
  const out: Outcome[] = []
  for (const r of rows) out.push(await deliver('weekly_summary', r.bundle.participant.id, r.bundle.participant.phone, weeklySummary(r), today))
  for (const s of await serviceRepo().staff()) {
    const mine = s.role === 'admin' ? rows : rows.filter((r) => r.bundle.participant.coach_id === s.id || r.bundle.participant.nutritionist_id === s.id)
    if (!mine.length) continue
    out.push(await deliver('staff_summary', s.id, s.phone, staffSummary(s.full_name, mine), today))
  }
  return out
}

/** Saturday 19:30: each admin is reminded to upload the week's Boostapp attendance report. */
export async function runAttendanceReminder(appUrl: string) {
  const { rows, today } = await currentRows()
  const out: Outcome[] = []
  for (const a of (await serviceRepo().staff()).filter((s) => s.role === 'admin'))
    out.push(await deliver('attendance_reminder', a.id, a.phone, attendanceReminder(a.full_name, rows.length, `${appUrl}/admin/attendance`), today))
  return out
}

/** Everyone still in the challenge, including those who start later. */
async function liveRows(): Promise<{ rows: Row[]; today: string }> {
  const today = todayIL()
  const bundles = await withAttendance(await serviceRepo().allBundles())
  const rows = bundles
    .map((bundle) => ({
      bundle,
      snap: snapshot({ start: bundle.participant.start_date, today, logs: bundle.logs, calls: bundle.calls, goal: bundle.goal }),
    }))
    .filter((r) => r.bundle.participant.status === 'active' && !r.snap.finished)
  return { rows, today }
}

/** Staff digests stay quiet on Shabbat. */
const isShabbat = (today: string) => weekday(today) === 6

/** 08:00: each mental coach gets today's calls and what is slipping; each participant with a call today gets a reminder. */
export async function runCoachMorning(appUrl: string) {
  const { rows, today } = await liveRows()
  if (isShabbat(today)) return { skipped: 'shabbat' }
  const out: Outcome[] = []
  const staff = await serviceRepo().staff()
  for (const coach of staff.filter((s) => s.role === 'coach')) {
    const mine = rows.filter((r) => r.bundle.participant.coach_id === coach.id)
    const digest = coachMorningFor(mine, today)
    const msg = coachMorning(coach.full_name, digest, `${appUrl}/team`)
    if (msg) out.push(await deliver('coach_morning', coach.id, coach.phone, msg, today))
    for (const r of mine) {
      const p = r.bundle.participant
      if (!r.snap.started || p.call_weekday !== weekday(today) || !p.call_time) continue
      out.push(await deliver('call_today', p.id, p.phone, callToday(p.full_name, coach.full_name, p.call_time.slice(0, 5)), today))
    }
  }
  return out
}

/** 20:30: each mental coach, if a call slot passed today without a logged call. */
export async function runCoachEvening(appUrl: string) {
  const { rows, today } = await liveRows()
  if (isShabbat(today)) return { skipped: 'shabbat' }
  const out: Outcome[] = []
  for (const coach of (await serviceRepo().staff()).filter((s) => s.role === 'coach')) {
    const msg = coachEvening(coach.full_name, coachEveningMissing(rows.filter((r) => r.bundle.participant.coach_id === coach.id), today), `${appUrl}/team`)
    if (msg) out.push(await deliver('coach_evening', coach.id, coach.phone, msg, today))
  }
  return out
}

/** 09:00: each nutritionist gets who has not reported, who has no goal, who is finishing. */
export async function runNutriMorning(appUrl: string) {
  const { rows, today } = await liveRows()
  if (isShabbat(today)) return { skipped: 'shabbat' }
  const out: Outcome[] = []
  for (const n of (await serviceRepo().staff()).filter((s) => s.role === 'nutritionist')) {
    const msg = nutriMorning(n.full_name, nutriMorningFor(rows.filter((r) => r.bundle.participant.nutritionist_id === n.id), today), `${appUrl}/team`)
    if (msg) out.push(await deliver('nutri_morning', n.id, n.phone, msg, today))
  }
  return out
}
