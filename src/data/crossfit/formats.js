// 7 WOD formats — each with a builder(context) that produces a WOD object.
// A WOD object is what the display + timer read:
//   { format, title, timeCap, lines: string[], movements: [...], meta: {...} }

import { adjustReps, repFactor, scaleFor, loadPair } from './scaling'

export const FORMATS = {
  emom: {
    id: 'emom', he: 'EMOM', label: 'כל דקה בדקה',
    description: 'Every Minute On the Minute',
    icon: '⏱️',
    timerType: 'emom',
  },
  amrap: {
    id: 'amrap', he: 'AMRAP', label: 'סיבובים מקסימליים',
    description: 'As Many Rounds As Possible',
    icon: '',
    timerType: 'amrap',
  },
  for_time: {
    id: 'for_time', he: 'For Time', label: 'כמה שיותר מהר',
    description: 'Complete as fast as possible',
    icon: '',
    timerType: 'for_time',
  },
  intervals: {
    id: 'intervals', he: 'Intervals', label: 'אינטרוולים',
    description: 'Timed work/rest periods',
    icon: '',
    timerType: 'intervals',
  },
  chipper: {
    id: 'chipper', he: 'Chipper', label: 'צ׳יפר',
    description: 'רשימה סדרתית של תרגילים בכמות גדולה',
    icon: '',
    timerType: 'for_time',
  },
  strength_metcon: {
    id: 'strength_metcon', he: 'Strength + MetCon', label: 'כוח + מטקון',
    description: 'חלק כוח ואחריו חלק מטאבולי',
    icon: '',
    timerType: 'compound',
  },
  random: {
    id: 'random', he: 'Random', label: 'הפתעה',
    description: 'המערכת תבחר פורמט',
    icon: '',
    timerType: 'auto',
  },
}

const LENGTHS = { short: 8, medium: 18, long: 35 }

function pickN(arr, n) {
  const out = [], pool = [...arr]
  while (out.length < n && pool.length) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

function randInRange([lo, hi]) {
  return Math.round(lo + Math.random() * (hi - lo))
}

// CrossFit standard: the prescription line uses the ENGLISH movement name
// verbatim (Burpee Box Jump Overs, Clean and Jerk, etc.) regardless of UI
// language. The Hebrew rendering happens separately in WodDisplay under
// each line, at a smaller size, so trainees see the professional term first
// and the translation as a subtitle.
function movementLine(m, count, ctx) {
  const rf = repFactor({ sex: ctx.sex, age: ctx.age })
  const [lo, hi] = adjustReps(m.reps[ctx.lengthKey], rf)
  const reps = count != null ? count : randInRange([lo, hi])
  const load = loadPair(m, ctx.sex)
  const unit = m.unit || 'reps'
  const unitEn = { reps: '', meters: 'm', calories: 'cal', seconds: 'sec' }[unit] || ''
  const nameEn = m.en || m.he

  if (unit === 'meters')   return `${reps}${unitEn ? unitEn : ''} ${nameEn}${load ? ` (${load})` : ''}`
  if (unit === 'calories') return `${reps} ${unitEn} ${nameEn}`
  if (unit === 'seconds')  return `${reps} ${unitEn} ${nameEn}`
  return `${reps} ${nameEn}${load ? ` (${load})` : ''}`
}

// ─── EMOM builder ──────────────────────────────────────
function buildEMOM(ctx) {
  const totalMin = ctx.length || LENGTHS[ctx.lengthKey] || 12
  const chosen = pickN(ctx.movements, Math.min(ctx.movements.length, 4))
  const perMinute = chosen.length === 1
    ? [{ m: chosen[0], reps: null }]
    : chosen.map(m => ({ m, reps: null }))

  const rf = repFactor({ sex: ctx.sex, age: ctx.age })

  const lines = []
  if (perMinute.length === 1) {
    const m = perMinute[0].m
    const [lo, hi] = adjustReps(m.reps.short, rf)
    const reps = Math.round((lo + hi) / 2)
    lines.push(`Every minute for ${totalMin} min · כל דקה ל־${totalMin} דקות:`)
    lines.push(`  ${reps} ${m.en || m.he}${loadPair(m, ctx.sex) ? ` (${loadPair(m, ctx.sex)})` : ''}`)
  } else {
    lines.push(`EMOM ${totalMin} min:`)
    perMinute.forEach((entry, i) => {
      const m = entry.m
      const [lo, hi] = adjustReps(m.reps.short, rf)
      const reps = Math.round((lo + hi) / 2)
      lines.push(`  Min ${i + 1}: ${reps} ${m.en || m.he}${loadPair(m, ctx.sex) ? ` (${loadPair(m, ctx.sex)})` : ''}`)
    })
  }

  return {
    format: 'emom',
    title: `EMOM ${totalMin} דקות`,
    timeCap: totalMin * 60,
    lines,
    movements: chosen,
    meta: { totalMin, perMinute },
  }
}

// ─── AMRAP builder ─────────────────────────────────────
function buildAMRAP(ctx) {
  const totalMin = ctx.length || LENGTHS[ctx.lengthKey] || 18
  const count = Math.min(ctx.movements.length, 5)
  const chosen = pickN(ctx.movements, count)

  const lines = [`AMRAP ${totalMin} min:`]
  chosen.forEach(m => lines.push(`  ${movementLine(m, null, ctx)}`))

  return {
    format: 'amrap',
    title: `AMRAP ${totalMin} דקות`,
    timeCap: totalMin * 60,
    lines,
    movements: chosen,
    meta: { totalMin, roundReps: chosen.map(m => movementLine(m, null, ctx)) },
  }
}

// ─── For Time builder ──────────────────────────────────
function buildForTime(ctx) {
  const totalMin = ctx.length || LENGTHS[ctx.lengthKey] || 15
  const chosen = pickN(ctx.movements, Math.min(ctx.movements.length, 3))
  const rounds = ctx.lengthKey === 'short' ? 3 : ctx.lengthKey === 'medium' ? 5 : 8

  const lines = [`${rounds} Rounds For Time · ${rounds} סיבובים:`]
  chosen.forEach(m => lines.push(`  ${movementLine(m, null, ctx)}`))
  lines.push(`(Time Cap: ${totalMin} min)`)

  return {
    format: 'for_time',
    title: `${rounds} סיבובים For Time`,
    timeCap: totalMin * 60,
    lines,
    movements: chosen,
    meta: { rounds, timeCap: totalMin * 60 },
  }
}

// ─── Intervals builder ─────────────────────────────────
function buildIntervals(ctx) {
  const totalMin = ctx.length || LENGTHS[ctx.lengthKey] || 20
  const workSec = ctx.lengthKey === 'short' ? 30 : ctx.lengthKey === 'medium' ? 60 : 90
  const restSec = Math.round(workSec / 2)
  const rounds = Math.floor((totalMin * 60) / (workSec + restSec))

  const chosen = pickN(ctx.movements, Math.min(ctx.movements.length, rounds))
  const cycle = chosen.length ? chosen : ctx.movements.slice(0, 1)

  const lines = [`${rounds} Intervals · ${rounds} סיבובים:`]
  lines.push(`  Work: ${workSec}s   Rest: ${restSec}s`)
  cycle.forEach((m, i) => lines.push(`  Round ${i + 1}: ${m.en || m.he}${loadPair(m, ctx.sex) ? ` (${loadPair(m, ctx.sex)})` : ''}`))

  return {
    format: 'intervals',
    title: `Intervals ${rounds}x`,
    timeCap: (workSec + restSec) * rounds,
    lines,
    movements: cycle,
    meta: { rounds, workSec, restSec, cycle },
  }
}

// ─── Chipper builder ───────────────────────────────────
function buildChipper(ctx) {
  const totalMin = ctx.length || LENGTHS[ctx.lengthKey] || 25
  const chosen = pickN(ctx.movements, Math.min(ctx.movements.length, 5))
  const rf = repFactor({ sex: ctx.sex, age: ctx.age })

  // Descending scheme: 50-40-30-20-10 or 100-80-60-40-20 based on length
  const scheme = ctx.lengthKey === 'short'
    ? [30, 20, 10]
    : ctx.lengthKey === 'long'
      ? [100, 80, 60, 40, 20]
      : [50, 40, 30, 20, 10]

  const lines = [`Chipper · For Time (${totalMin} min cap):`]
  chosen.forEach((m, i) => {
    const reps = Math.round((scheme[i] || 20) * rf * 0.5)
    lines.push(`  ${reps} ${m.en || m.he}${loadPair(m, ctx.sex) ? ` (${loadPair(m, ctx.sex)})` : ''}`)
  })

  return {
    format: 'chipper',
    title: `Chipper For Time`,
    timeCap: totalMin * 60,
    lines,
    movements: chosen,
    meta: { scheme, timeCap: totalMin * 60 },
  }
}

// ─── Strength + MetCon builder ─────────────────────────
function buildStrengthMetCon(ctx) {
  const strengthMovements = ctx.movements.filter(m => m.tags.includes('strength'))
  const metconMovements = ctx.movements.filter(m => m.tags.includes('metcon'))

  const s = strengthMovements[0] || ctx.movements[0]
  const met = pickN(metconMovements.length ? metconMovements : ctx.movements, 3)
  const metconMin = ctx.lengthKey === 'short' ? 6 : ctx.lengthKey === 'medium' ? 12 : 20
  const totalMin = 15 + metconMin // ~15 min for strength part

  const lines = [`A) Strength · 5×5 ${s.en || s.he}${loadPair(s, ctx.sex) ? ` @${loadPair(s, ctx.sex)}` : ''}`]
  lines.push(`   Rest 2-3 min between sets`)
  lines.push(``)
  lines.push(`B) MetCon — AMRAP ${metconMin} min:`)
  met.forEach(m => lines.push(`   ${movementLine(m, null, ctx)}`))

  return {
    format: 'strength_metcon',
    title: `Strength + MetCon`,
    timeCap: totalMin * 60,
    lines,
    movements: [s, ...met],
    meta: { strength: s, metcon: met, metconMin },
  }
}

// ─── Random dispatcher ─────────────────────────────────
function buildRandom(ctx) {
  const options = ['emom', 'amrap', 'for_time', 'intervals', 'chipper', 'strength_metcon']
  const pick = options[Math.floor(Math.random() * options.length)]
  return BUILDERS[pick](ctx)
}

export const BUILDERS = {
  emom: buildEMOM,
  amrap: buildAMRAP,
  for_time: buildForTime,
  intervals: buildIntervals,
  chipper: buildChipper,
  strength_metcon: buildStrengthMetCon,
  random: buildRandom,
}
