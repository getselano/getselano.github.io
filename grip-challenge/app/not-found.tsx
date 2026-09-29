import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="app nonav login">
      <div className="card stack" style={{ textAlign: 'center' }}>
        <h1>לא מצאנו את הדף</h1>
        <p className="muted">ייתכן שאין לך גישה אליו, או שהוא כבר לא קיים.</p>
        <Link href="/" className="btn block">חזרה לבית</Link>
      </div>
    </main>
  )
}
