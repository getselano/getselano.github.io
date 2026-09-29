import { StaffNav } from '@/components/StaffNav'
import { Logout } from '@/components/icons'
import { requireRole } from '@/lib/data'
import { signOut } from '../login/actions'

const ROLE_LABEL = { coach: 'מאמן', nutritionist: 'תזונאית', admin: 'ניהול' } as const

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const v = await requireRole('coach', 'nutritionist', 'admin')
  return (
    <div className="app wide">
      <div className="topbar">
        <div className="row">
          <span className="avatar" style={{ background: 'var(--accent)', color: '#fff', width: 40, height: 40 }}>{v.staff.full_name.slice(0, 1)}</span>
          <div>
            <strong>{v.staff.full_name}</strong>
            <div className="hint">{ROLE_LABEL[v.role]}</div>
          </div>
        </div>
        <div className="row">
          <StaffNav admin={v.role === 'admin'} />
          <form action={signOut}>
            <button className="btn ghost small" aria-label="יציאה"><Logout size={18} /></button>
          </form>
        </div>
      </div>
      {children}
    </div>
  )
}
