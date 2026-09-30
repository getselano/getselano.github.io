// Netlify scheduled function → /api/cron/coach-morning. Fires at two UTC hours
// (summer/winter time); the route acts only at 8:xx Asia/Jerusalem.
export default async () => {
  const res = await fetch(`${process.env.URL}/api/cron/coach-morning`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  console.log('coach-morning', res.status, await res.text())
}

export const config = { schedule: '0 5,6 * * 0-5' }
