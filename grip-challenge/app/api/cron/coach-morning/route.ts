import { cronRoute } from '@/lib/cron'
import { runCoachMorning } from '@/lib/notify'

// 8:xx Asia/Jerusalem, Sunday to Friday (the runner skips Shabbat too).
export const POST = (req: Request) => cronRoute(req, 8, runCoachMorning)
