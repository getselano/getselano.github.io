// Netlify scheduled function → /api/cron/nutri-morning. Fires at two UTC hours
// (summer/winter time); the route acts only at 9:xx Asia/Jerusalem.
export default async () => {
  const res = await fetch(`${process.env.URL}/api/cron/nutri-morning`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  console.log('nutri-morning', res.status, await res.text())
}

export const config = { schedule: '0 6,7 * * 0-5' }
