import { cronRoute } from '@/lib/cron'
import { runCoachEvening } from '@/lib/notify'

// 20:xx Asia/Jerusalem, Sunday to Friday (the runner skips Shabbat too).
export const POST = (req: Request) => cronRoute(req, 20, runCoachEvening)
