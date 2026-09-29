import { Grip } from '@/components/icons'

export const dynamic = 'force-static'

export default function Offline() {
  return (
    <main className="app nonav login">
      <div className="card stack" style={{ textAlign: 'center', alignItems: 'center' }}>
        <div className="brand-mark"><Grip /></div>
        <h1>אין חיבור כרגע</h1>
        <p className="muted">הסימון של היום יחכה לך. ברגע שהחיבור יחזור, פותחים שוב והכל כאן.</p>
      </div>
    </main>
  )
}
