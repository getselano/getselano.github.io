import { requireRole } from '@/lib/data'
import { ImportForm } from './ImportForm'

export const metadata = { title: 'נוכחות מבוסטאפ' }

export default async function AttendanceImport() {
  await requireRole('admin')
  return (
    <>
      <header className="greet">
        <div>
          <p className="hello">פעם בשבוע: בוסטאפ ← דוחות ← דוח נוכחות ← ייצוא לאקסל, ולהעלות כאן</p>
          <h1>נוכחות מבוסטאפ</h1>
        </div>
      </header>
      <ImportForm />
    </>
  )
}
