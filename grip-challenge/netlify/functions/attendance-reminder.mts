// Netlify scheduled function → /api/cron/attendance-reminder. Saturdays at
// 16:30 and 17:30 UTC; the route acts only at 19:xx Asia/Jerusalem, so the
// admins get it at 19:30 in both summer and winter time.
export default async () => {
  const res = await fetch(`${process.env.URL}/api/cron/attendance-reminder`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  console.log('attendance-reminder', res.status, await res.text())
}

export const config = { schedule: '30 16,17 * * 6' }
