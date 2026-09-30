// Netlify scheduled function → /api/cron/coach-evening. Fires at two UTC hours
// (summer/winter time); the route acts only at 20:xx Asia/Jerusalem.
export default async () => {
  const res = await fetch(`${process.env.URL}/api/cron/coach-evening`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  console.log('coach-evening', res.status, await res.text())
}

export const config = { schedule: '30 17,18 * * 0-5' }
