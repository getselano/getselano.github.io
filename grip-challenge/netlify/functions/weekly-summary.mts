// Netlify scheduled function → /api/cron/weekly-summary. Saturdays at 18:00
// and 19:00 UTC; the route acts only at 21:00 Asia/Jerusalem.
export default async () => {
  const res = await fetch(`${process.env.URL}/api/cron/weekly-summary`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  console.log('weekly-summary', res.status, await res.text())
}

export const config = { schedule: '0 18,19 * * 6' }
