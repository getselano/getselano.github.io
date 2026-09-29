import { cronRoute } from '@/lib/cron'
import { runDailyReminder } from '@/lib/notify'

const HOUR = Number(process.env.REMINDER_HOUR_IL || 20)

export const POST = (req: Request) => cronRoute(req, HOUR, runDailyReminder)
