// Netlify scheduled function → /api/cron/daily-reminder. Fires at 17:00 and
// 18:00 UTC; the route itself acts only at 20:00 Asia/Jerusalem (DST-proof).
export default async () => {
  const res = await fetch(`${process.env.URL}/api/cron/daily-reminder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  console.log('daily-reminder', res.status, await res.text())
}

export const config = { schedule: '0 17,18 * * *' }
