// Running — multi-variant families with pace targets from user's 5K PB.

import { applyLevelToWod } from './levels'
import { wodToSession } from './wodToExercises'

function paces(fiveKSec) {
  if (!fiveKSec) return null
  const p5k = fiveKSec / 5
  return {
    easy: Math.round(p5k * 1.32),
    marathon: Math.round(p5k * 1.16),
    threshold: Math.round(p5k * 1.06),
    interval: Math.round(p5k * 1.00),
    rep: Math.round(p5k * 0.94),
  }
}

function fmt(sec) {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60)
  return `${m}:${String(s).padStart(2,'0')}`
}

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

const SESSIONS = {
  intervals: {
    name: 'Intervals',
    variants: (p) => ([
      {
        title: '6 × 800m',
        lines: [
          'חימום (10 דק׳): Easy jog + drills + strides ×4', '',
          'Main Set',
          p ? `6 × 800m @ ${fmt(p.interval)}/km` : '6 × 800m @ 5K race pace',
          'Rest 2:00 בין חזרות', '',
          'Cool Down · 10 דק׳ Easy',
        ],
      },
      {
        title: '5 × 1000m',
        lines: [
          'חימום (12 דק׳): Easy + strides ×4', '',
          'Main Set',
          p ? `5 × 1000m @ ${fmt(p.threshold)}/km` : '5 × 1000m בקצב סף',
          'Rest 2:30 בין חזרות', '',
          'Cool Down · 10 דק׳ Easy',
        ],
      },
      {
        title: '8 × 400m',
        lines: [
          'חימום (10 דק׳): Easy + drills + 4×100m strides', '',
          'Main Set',
          p ? `8 × 400m @ ${fmt(Math.round(p.interval * 0.4))}` : '8 × 400m מהיר',
          'Rest 90 שנ׳ בין חזרות', '',
          'Cool Down · 8 דק׳ Easy',
        ],
      },
      {
        title: 'Mile Repeats',
        lines: [
          'חימום (12 דק׳)', '',
          'Main Set',
          p ? `4 × 1600m @ ${fmt(p.threshold)}/km` : '4 × 1600m @ threshold',
          'Rest 3:00 בין חזרות', '',
          'Cool Down · 10 דק׳ Easy',
        ],
      },
      {
        title: '10 × 300m',
        lines: [
          'חימום (10 דק׳) + strides ×6', '',
          'Main Set',
          p ? `10 × 300m @ ${fmt(Math.round(p.rep * 0.3))}` : '10 × 300m מהיר',
          'Rest 90 שנ׳', '',
          'Cool Down · 5 דק׳',
        ],
      },
    ]),
  },

  tempo: {
    name: 'Tempo',
    variants: (p) => ([
      {
        title: '20 דק׳ סטדי',
        lines: [
          'חימום (10 דק׳) Easy jog', '',
          'Main Set',
          p ? `20 דק׳ @ ${fmt(p.threshold)}/km (Threshold)` : '20 דק׳ בקצב סף (comfortably hard)', '',
          'Cool Down · 10 דק׳ Easy',
        ],
      },
      {
        title: '2 × 15 דק׳',
        lines: [
          'חימום (10 דק׳)', '',
          'Main Set',
          p ? `2 × 15 דק׳ @ ${fmt(p.threshold)}/km · Rest 3:00` : '2 × 15 דק׳ בקצב סף · Rest 3:00', '',
          'Cool Down · 10 דק׳ Easy',
        ],
      },
      {
        title: '3 × 10 דק׳',
        lines: [
          'חימום (10 דק׳)', '',
          'Main Set',
          p ? `3 × 10 דק׳ @ ${fmt(Math.round(p.threshold * 0.98))}/km · Rest 2:00` : '3 × 10 דק׳ · Rest 2:00', '',
          'Cool Down · 8 דק׳',
        ],
      },
      {
        title: 'Progressive Tempo',
        lines: [
          'חימום (10 דק׳) Easy', '',
          'Main Set (30 דק׳ ברציפות)',
          p ? `10 דק׳ @ ${fmt(p.marathon)}/km` : '10 דק׳ בקצב מרתון',
          p ? `10 דק׳ @ ${fmt(Math.round(p.marathon * 0.96))}/km` : '10 דק׳ מעט יותר מהיר',
          p ? `10 דק׳ @ ${fmt(p.threshold)}/km` : '10 דק׳ בקצב סף', '',
          'Cool Down · 10 דק׳',
        ],
      },
    ]),
  },

  lsd: {
    name: 'LSD',
    variants: (p) => ([
      {
        title: '60-90 דק׳ Easy',
        lines: [
          p ? `60-90 דק׳ @ ${fmt(p.easy)}/km (Easy)` : '60-90 דק׳ בקצב שיחה', '',
          'כלל הזהב: אם אתה לא יכול לדבר במשפט שלם — אתה מהיר מדי.',
          'המטרה: לבנות בסיס אירובי.',
        ],
      },
      {
        title: 'Long Progression',
        lines: [
          p ? `60 דק׳ progression: 20 easy → 20 marathon → 20 threshold` : '60 דק׳ progression',
          p ? `Easy ${fmt(p.easy)}/km · Marathon ${fmt(p.marathon)}/km · Threshold ${fmt(p.threshold)}/km` : 'עלה קצב בכל 20 דק׳',
        ],
      },
      {
        title: 'Long + Strides',
        lines: [
          p ? `70 דק׳ Easy @ ${fmt(p.easy)}/km` : '70 דק׳ Easy', '',
          '6 × 100m Strides בסוף (~85% מאמץ)',
          'Recovery: הליכה 100m בין',
        ],
      },
      {
        title: 'Recovery Jog',
        lines: [
          p ? `40-50 דק׳ @ ${fmt(Math.round(p.easy * 1.05))}/km (Super Easy)` : '40-50 דק׳ קצב איטי מאוד', '',
          'המטרה: משקם, לא בונה.',
          'שיחה שלמה אפשרית בכל רגע.',
        ],
      },
    ]),
  },

  hills: {
    name: 'Hill Repeats',
    variants: () => ([
      {
        title: '10 × 60s Hills',
        lines: [
          'חימום (10 דק׳) Easy + drills', '',
          'Main Set',
          '10 × 60s uphill חזק (~90% מאמץ)',
          'Jog חזרה כמנוחה', '',
          'Cool Down · 10 דק׳ Easy',
        ],
      },
      {
        title: 'Hill Fartlek',
        lines: [
          'חימום (10 דק׳) Easy', '',
          'Main Set (30 דק׳)',
          'רוץ במסלול הררי — כל עלייה חזק, כל ירידה איזי', '',
          'Cool Down · 5 דק׳',
        ],
      },
      {
        title: 'Long Hill 5×3min',
        lines: [
          'חימום (10 דק׳)', '',
          'Main Set',
          '5 × 3 דק׳ עלייה בקצב סף',
          'Jog חזרה + 60s מנוחה', '',
          'Cool Down · 10 דק׳',
        ],
      },
      {
        title: 'Short Steep 12×30s',
        lines: [
          'חימום (10 דק׳) + strides', '',
          'Main Set',
          '12 × 30s עלייה תלולה · All-out',
          'Walk down + 45s מנוחה', '',
          'Cool Down · 8 דק׳',
        ],
      },
    ]),
  },

  sprints: {
    name: 'Sprints',
    variants: (p) => ([
      {
        title: '8 × 200m',
        lines: [
          'חימום (12 דק׳) Easy + strides ×6', '',
          'Main Set',
          p ? `8 × 200m @ ${fmt(Math.round(p.rep * 0.2))}` : '8 × 200m מהיר',
          'Full recovery בין חזרות (60-90s)', '',
          'Cool Down · 8 דק׳',
        ],
      },
      {
        title: '10 × 100m',
        lines: [
          'חימום (12 דק׳) + drills', '',
          'Main Set',
          '10 × 100m All-out',
          'Walk 100m חזרה כמנוחה', '',
          'Cool Down · 5 דק׳',
        ],
      },
      {
        title: 'Pyramid 100→300→100',
        lines: [
          'חימום (12 דק׳)', '',
          'Main Set',
          '100-200-300-200-100m מהיר',
          'Full recovery בין', '',
          'Cool Down · 8 דק׳',
        ],
      },
      {
        title: 'Flying 30s',
        lines: [
          'חימום (12 דק׳) + acceleration builds', '',
          'Main Set',
          '6 × Flying 30m (רוץ 20m הכנה → 30m all-out)',
          'Walk-back recovery', '',
          'Cool Down · 5 דק׳',
        ],
      },
    ]),
  },

  fartlek: {
    name: 'Fartlek',
    variants: () => ([
      {
        title: '2/2 Fartlek',
        lines: [
          'חימום (10 דק׳)', '',
          'Main (25 דק׳)',
          'חלף בין 2 דק׳ מהיר / 2 דק׳ Easy',
          'הרגש את הגוף — לפי RPE, לא לפי שעון', '',
          'Cool Down · 5 דק׳',
        ],
      },
      {
        title: 'Pyramid Fartlek',
        lines: [
          'חימום (10 דק׳)', '',
          'Main',
          '1-2-3-4-3-2-1 דק׳ מהיר',
          'זמן שווה איזי בין',  '',
          'Cool Down · 5 דק׳',
        ],
      },
      {
        title: 'Landmark Fartlek',
        lines: [
          'חימום (10 דק׳)', '',
          'Main (30 דק׳)',
          'בכל landmark: רוץ מהיר עד ל־landmark הבא, איזי אחריו',
          '(מדפים, צמתים, עצים)', '',
          'Cool Down · 5 דק׳',
        ],
      },
    ]),
  },
}

export const RUN_FOCUSES = [
  { key:'random',     he:'הפתעה'   },
  { key:'intervals',  he:'אינטרוול' },
  { key:'tempo',      he:'טמפו'     },
  { key:'lsd',        he:'LSD'      },
  { key:'hills',      he:'עליות'    },
  { key:'sprints',    he:'ספרינטים' },
  { key:'fartlek',    he:'Fartlek'  },
]

export function generateRunningWod({ focus = 'random', level = 'intermediate', fiveKSec = null } = {}) {
  const keys = Object.keys(SESSIONS)
  const key = focus === 'random' ? pickRandom(keys) : focus
  const family = SESSIONS[key] || SESSIONS.intervals
  const p = paces(fiveKSec)
  const variants = family.variants(p)
  const variant = pickRandom(variants)
  const title = `${family.name} · ${variant.title}`
  const lines = [title.toUpperCase(), '', ...variant.lines]
  if (p) {
    lines.push('', '─── קצבים לפי 5K PB שלך ───',
      `5K: ${fmt(fiveKSec)} · Easy ${fmt(p.easy)}/km · Threshold ${fmt(p.threshold)}/km`)
  } else {
    lines.push('', '─── טיפ ───', 'הזן את ה־5K PB בפרופיל כדי לראות קצבים מדויקים')
  }
  const base = {
    title,
    format: 'endurance',
    lines,
    movements: [],
    discipline: 'running',
    focus: key,
  }
  return applyLevelToWod(base, level)
}

export const RUN_PROGRAMS = [
  { id:'run_5k_sub25', label:'Sub-25 · 5K · 8 שבועות', weeks:8, daysPerWeek:4, goal:'לרוץ 5K מתחת ל-25 דקות', schema:'Base → Threshold → Race', author:'Selano', origin:'Progressive base', level:'מתחיל', sessionNames:['Easy Base','Intervals','Tempo','Long'] },
  { id:'run_10k', label:'10K Builder · 10 שבועות', weeks:10, daysPerWeek:4, goal:'לסיים 10K עם קצב יציב', schema:'Long + Tempo + Intervals', author:'Selano', origin:'Balanced volume', level:'בינוני', sessionNames:['Long Run','Intervals','Tempo','Easy'] },
  { id:'run_half', label:'Half Marathon · 12 שבועות', weeks:12, daysPerWeek:5, goal:'לסיים חצי מרתון (21.1km)', schema:'Long עד 18K · Threshold work', author:'Selano', origin:'Endurance-first', level:'מתקדם', sessionNames:['Long Run','Tempo','Intervals','Easy','Recovery'] },
  { id:'run_cf_endurance', label:'Metcon Endurance · 6 שבועות', weeks:6, daysPerWeek:3, goal:'לשפר סיבולת ל־Metcons ארוכים', schema:'Intervals + Fartlek', author:'Selano', origin:'For metcon athletes', level:'בינוני', sessionNames:['Intervals','Fartlek','Hills'] },
]

export function runningProgramToPlan(programId, fiveKSec = null) {
  const prog = RUN_PROGRAMS.find(p => p.id === programId)
  if (!prog) return null
  const sessions = prog.sessionNames.map(name => {
    const focus = name === 'Easy Base' || name === 'Easy' || name === 'Recovery' ? 'lsd'
      : name === 'Long Run' || name === 'Long' ? 'lsd'
      : name === 'Intervals' ? 'intervals'
      : name === 'Tempo' ? 'tempo'
      : name === 'Fartlek' ? 'fartlek'
      : name === 'Hills' ? 'hills'
      : 'intervals'
    const wod = generateRunningWod({ focus, fiveKSec })
    return wodToSession(wod, { name: `${name} · ${wod.title}`, wodType: 'Running' })
  })
  return {
    name: prog.label,
    programId: prog.id,
    discipline: 'running',
    split: prog.schema,
    days: prog.daysPerWeek,
    weeks: prog.weeks,
    currentWeek: 1,
    sessions,
    createdAt: new Date().toISOString(),
  }
}
