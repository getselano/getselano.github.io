'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function StaffNav({ admin }: { admin: boolean }) {
  const path = usePathname()
  const items = admin
    ? [
        { href: '/admin', label: 'דשבורד' },
        { href: '/team', label: 'משתתפים' },
        { href: '/admin/participants', label: 'ניהול' },
        { href: '/admin/staff', label: 'צוות' },
        { href: '/admin/attendance', label: 'נוכחות' },
        { href: '/admin/schedule', label: 'לו״ז' },
      ]
    : [{ href: '/team', label: 'המשתתפים שלי' }]
  const current = items.filter((i) => path === i.href || path.startsWith(i.href + '/')).sort((a, b) => b.href.length - a.href.length)[0]
  return (
    <nav className="topnav" aria-label="ניווט צוות">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={current?.href === i.href ? 'page' : undefined}>{i.label}</Link>
      ))}
    </nav>
  )
}
