// Before/after comparison for marketing: opening weight vs latest, as two
// bars on one scale (one measure, one axis), with the delta called out.
import { fmt } from './participant'

export function BeforeAfterBars({ before, after }: { before: number; after: number }) {
  const W = 320
  const H = 220
  const base = H - 34
  const top = 30
  const lo = Math.min(before, after) * 0.85
  const hi = Math.max(before, after)
  const h = (v: number) => ((v - lo) / (hi - lo || 1)) * (base - top)
  const bars = [
    { label: 'לפני', v: before, x: 70, fill: '#9AA09C' },
    { label: 'אחרי', v: after, x: 190, fill: '#0F6E56' },
  ]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`לפני ${before} ק"ג, אחרי ${after} ק"ג`} style={{ direction: 'ltr', display: 'block', maxWidth: 360, margin: '0 auto' }}>
      <line x1="20" x2={W - 20} y1={base} y2={base} stroke="#E5E3DC" />
      {bars.map((b) => {
        const bh = Math.max(4, h(b.v))
        return (
          <g key={b.label}>
            <title>{`${b.label}: ${fmt(b.v)} ק"ג`}</title>
            <rect x={b.x} y={base - bh} width="60" height={bh} rx="4" fill={b.fill} />
            <text x={b.x + 30} y={base - bh - 8} textAnchor="middle" fontSize="18" fontWeight="800" fill="#141413" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(b.v)}</text>
            <text x={b.x + 30} y={H - 12} textAnchor="middle" fontSize="14" fill="#6C7470">{b.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
