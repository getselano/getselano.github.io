import { cronRoute } from '@/lib/cron'
import { runWeeklySummary } from '@/lib/notify'

// Saturday evening, after the calendar week (Sun–Sat) closes.
const HOUR = Number(process.env.WEEKLY_HOUR_IL || 21)

export const POST = (req: Request) => cronRoute(req, HOUR, runWeeklySummary, 6)
