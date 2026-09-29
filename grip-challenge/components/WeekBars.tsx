// Participants by week in the program (1–6). One series, so no legend box;
// the value sits on each bar and the hover title repeats it.
export function WeekBars({ counts }: { counts: number[] }) {
  const W = 480
  const H = 190
  const pad = { l: 8, r: 8, t: 22, b: 30 }
  const max = Math.max(1, ...counts)
  const slot = (W - pad.l - pad.r) / counts.length
  const bw = Math.min(46, slot - 14)
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const base = H - pad.b
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`משתתפים לפי שבוע: ${counts.map((c, i) => `שבוע ${i + 1}: ${c}`).join(', ')}`} style={{ direction: 'ltr', display: 'block' }}>
      <line x1={pad.l} x2={W - pad.r} y1={base} y2={base} stroke="#E5E3DC" />
      {counts.map((c, i) => {
        const cx = pad.l + slot * i + slot / 2
        const top = y(c)
        const h = base - top
        const r = Math.min(4, h)
        return (
          <g key={i}>
            <title>{`שבוע ${i + 1}: ${c} משתתפים`}</title>
            <rect x={cx - slot / 2} y={pad.t} width={slot} height={base - pad.t} fill="transparent" />
            {c > 0 && (
              <path
                d={`M${cx - bw / 2},${base} V${top + r} Q${cx - bw / 2},${top} ${cx - bw / 2 + r},${top} H${cx + bw / 2 - r} Q${cx + bw / 2},${top} ${cx + bw / 2},${top + r} V${base} Z`}
                fill="#0F6E56"
              />
            )}
            <text x={cx} y={top - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#141413" style={{ fontVariantNumeric: 'tabular-nums' }}>{c}</text>
            <text x={cx} y={H - 10} textAnchor="middle" fontSize="12" fill="#6C7470">שבוע {i + 1}</text>
          </g>
        )
      })}
    </svg>
  )
}
