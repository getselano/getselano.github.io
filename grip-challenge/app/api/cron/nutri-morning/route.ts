import { cronRoute } from '@/lib/cron'
import { runNutriMorning } from '@/lib/notify'

// 9:xx Asia/Jerusalem, Sunday to Friday (the runner skips Shabbat too).
export const POST = (req: Request) => cronRoute(req, 9, runNutriMorning)
