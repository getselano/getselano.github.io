// Weight over the 42 days: solid up to today, dashed from today to the goal.
import type { WeightSummary } from '@/lib/calc'
import { PROGRAM_DAYS } from '@/lib/program'

export function WeightChart({ w, today, height = 170 }: { w: WeightSummary; today: number; height?: number }) {
  const W = 340
  const H = height
  const pad = { l: 34, r: 14, t: 14, b: 24 }
  if (!w.points.length) return <p className="hint">הגרף יופיע אחרי המדידה הראשונה.</p>

  const values = [...w.points.map((p) => p.weight), ...(w.goal != null ? [w.goal] : [])]
  let lo = Math.min(...values)
  let hi = Math.max(...values)
  if (hi - lo < 2) {
    lo -= 1
    hi += 1
  }
  const span = hi - lo
  lo -= span * 0.12
  hi += span * 0.12
  const x = (day: number) => pad.l + ((day - 1) / (PROGRAM_DAYS - 1)) * (W - pad.l - pad.r)
  const y = (kg: number) => pad.t + ((hi - kg) / (hi - lo)) * (H - pad.t - pad.b)

  const last = w.points[w.points.length - 1]
  const solid = w.points.map((p) => `${x(p.day).toFixed(1)},${y(p.weight).toFixed(1)}`).join(' ')
  const nowX = x(Math.max(last.day, Math.min(today, PROGRAM_DAYS)))
  const ticks = [1, 14, 28, 42]
  const yTicks = [hi - (hi - lo) * 0.15, (hi + lo) / 2, lo + (hi - lo) * 0.15]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`גרף משקל: ${last.weight} ק"ג`} style={{ direction: 'ltr', display: 'block' }}>
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#EFEDE6" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#9AA09C" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {t.toFixed(0)}
          </text>
        </g>
      ))}
      {ticks.map((d) => (
        <text key={d} x={x(d)} y={H - 6} textAnchor="middle" fontSize="10" fill="#9AA09C">
          {d}
        </text>
      ))}
      <line x1={nowX} x2={nowX} y1={pad.t} y2={H - pad.b} stroke="#E5E3DC" strokeDasharray="2 3" />
      {w.goal != null && (
        <>
          <line x1={x(last.day)} y1={y(last.weight)} x2={x(PROGRAM_DAYS)} y2={y(w.goal)} stroke="#0F6E56" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />
          <circle cx={x(PROGRAM_DAYS)} cy={y(w.goal)} r="4" fill="#fff" stroke="#0F6E56" strokeWidth="2" />
        </>
      )}
      <polyline points={solid} fill="none" stroke="#0F6E56" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {w.points.slice(0, -1).map((p) => (
        <circle key={p.date} cx={x(p.day)} cy={y(p.weight)} r="2.5" fill="#0F6E56" />
      ))}
      <circle cx={x(last.day)} cy={y(last.weight)} r="9" fill="#0F6E56" opacity="0.15" />
      <circle cx={x(last.day)} cy={y(last.weight)} r="5" fill="#0F6E56" stroke="#fff" strokeWidth="2" />
    </svg>
  )
}
