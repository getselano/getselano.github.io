import 'server-only'
import { NextResponse } from 'next/server'
import { hourIL } from './dates'
import { bearer, secretMatches } from './secret'

/**
 * Shared guard for the cron routes. The scheduler fires at two UTC hours to
 * cover both Israeli summer and winter time; the route acts only in the
 * hour it is meant for (Asia/Jerusalem), unless called with ?force=1.
 */
export async function cronRoute(req: Request, hour: number, run: () => Promise<unknown>, weekday?: number) {
  if (!secretMatches(bearer(req), process.env.CRON_SECRET)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const force = new URL(req.url).searchParams.get('force') === '1'
  const now = new Date()
  const dayIL = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short' }).format(now)
  const wdIL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dayIL)
  if (!force && (hourIL(now) !== hour || (weekday != null && wdIL !== weekday))) return NextResponse.json({ skipped: 'not the hour' })
  return NextResponse.json({ results: await run() })
}
