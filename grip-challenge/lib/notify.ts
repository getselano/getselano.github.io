import 'server-only'
import { withAttendance } from './attendance'
import { snapshot } from './calc'
import { serviceRepo, type Row } from './data'
import { todayIL } from './dates'
import { dailyReminder, staffSummary, weeklySummary, type Message } from './messages'
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
async function deliver(kind: string, recipient: string, phone: string, msg: Message, day: string): Promise<Outcome> {
  const repo = serviceRepo()
  if (!(await repo.claimNotification(kind, recipient, day))) return { recipient, status: 'already_sent' }
  let r: Awaited<ReturnType<typeof sendWhatsApp>>
  try {
    r = await sendWhatsApp(phone, msg)
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
