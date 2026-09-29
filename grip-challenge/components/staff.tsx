import Link from 'next/link'
import type { Row } from '@/lib/data'
import type { StatusColor } from '@/lib/calc'
import { STATUS_COLORS } from '@/lib/program'
import { Flame } from './icons'

export const STATUS_LABEL: Record<StatusColor, string> = { red: 'אדום', yellow: 'צהוב', green: 'ירוק' }
export const STATUS_SOFT: Record<StatusColor, string> = { red: '#FCEDE9', yellow: '#FDF0E0', green: '#E3F1EB' }

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')
}

const ORDER: Record<StatusColor, number> = { red: 0, yellow: 1, green: 2 }

/** Red first, then yellow; inside a color, the longest silence first. */
export function byUrgency(a: Row, b: Row) {
  return ORDER[a.snap.status.color] - ORDER[b.snap.status.color] || b.snap.daysSinceLog - a.snap.daysSinceLog
}

export function isCurrent(r: Row) {
  return r.bundle.participant.status === 'active' && r.snap.started && !r.snap.finished
}

export function ParticipantRow({ r }: { r: Row }) {
  const p = r.bundle.participant
  const c = r.snap.status.color
  const color = STATUS_COLORS[c]
  const why = r.snap.status.reasons[0]?.text ?? (r.snap.loggedToday ? 'דיווח היום · על המסלול' : 'על המסלול')
  return (
    <Link href={`/team/${p.id}`} className="prow" style={{ borderRight: `4px solid ${color}` }}>
      <span className="avatar" style={{ background: STATUS_SOFT[c], color }}>{initials(p.full_name)}</span>
      <span className="who">
        <span className="name">
          {p.full_name}
          <span className="hint">יום <span className="num">{r.snap.dayNumber}</span></span>
        </span>
        <span className="why" style={{ color: c === 'green' ? 'var(--ink-2)' : color, display: 'block' }}>
          {why}
          {r.snap.status.reasons.length > 1 && <span className="hint"> · ועוד {r.snap.status.reasons.length - 1}</span>}
        </span>
      </span>
      <span className="side" aria-label={`רצף ${r.snap.currentStreak}`}>
        <span className="num">{r.snap.currentStreak}</span>
        <Flame size={14} style={{ color: r.snap.currentStreak ? 'var(--streak)' : 'var(--ink-3)' }} />
      </span>
    </Link>
  )
}
