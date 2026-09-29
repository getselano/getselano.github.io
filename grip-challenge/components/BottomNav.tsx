'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Chart, Home, Users } from './icons'

const ITEMS = [
  { href: '/', label: 'בית', Icon: Home },
  { href: '/progress', label: 'התקדמות', Icon: Chart },
  { href: '/my-team', label: 'הצוות שלי', Icon: Users },
]

export function BottomNav() {
  const path = usePathname()
  if (path === '/win') return null
  return (
    <nav className="bottom-nav" aria-label="ניווט ראשי">
      <ul>
        {ITEMS.map(({ href, label, Icon }) => {
          const on = href === '/' ? path === '/' || path === '/today' : path.startsWith(href)
          return (
            <li key={href}>
              <Link href={href} aria-current={on ? 'page' : undefined}>
                <Icon size={24} />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
