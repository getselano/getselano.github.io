import { cronRoute } from '@/lib/cron'
import { runAttendanceReminder } from '@/lib/notify'

// Saturday 19:30 Asia/Jerusalem: the scheduler fires at :30, the route checks the hour.
const HOUR = Number(process.env.ATTENDANCE_REMINDER_HOUR_IL || 19)

export const POST = (req: Request) => cronRoute(req, HOUR, runAttendanceReminder, 6)
