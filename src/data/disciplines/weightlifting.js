// Olympic Weightlifting — multi-variant families so every generate call
// produces a different session.
// Uses %1RM from profile.oneRMs when available.

import { applyLevelToWod } from './levels'
import { wodToSession } from './wodToExercises'

const SESSIONS = {
  snatch: {
    name: 'Snatch',
    variants: [
      {
        title: 'Technique + Heavy',
        a: { title:'A · Technique (10 דק׳)', lines:['Snatch Pull → Hang Snatch × 3 @ 50%', '× 5 סבבים']},
        b: { title:'B · Snatch (עולה)', lines:['2 × 3 @ 70%', '2 × 2 @ 80%', '3 × 1 @ 85–90%']},
        c: { title:'C · Accessory', lines:['Overhead Squat 4×5 @ 65%', 'Snatch Grip Deadlift 3×5 @ 80%']},
      },
      {
        title: 'Complex Day',
        a: { title:'A · Warm-up (10 דק׳)', lines:['Overhead Squat 3×5 @ 40-50%']},
        b: { title:'B · Snatch Complex', lines:['5 × (Snatch Pull + Hang Snatch + Snatch)', 'התחל 60% · עלה בכל סט']},
        c: { title:'C · Accessory', lines:['Snatch Balance 4×3 @ 70%', 'Sots Press 3×5']},
      },
      {
        title: 'EMOM Density',
        a: { title:'A · Prep (8 דק׳)', lines:['Snatch Pull × 3 @ 60% · × 4 סבבים']},
        b: { title:'B · EMOM 10', lines:['Min 1-10: 2× Snatch @ 75%', 'שמור על טכניקה — עצור אם הכשל טכני']},
        c: { title:'C · Squat', lines:['Overhead Squat 3×5 @ 70%']},
      },
      {
        title: 'Max Out',
        a: { title:'A · Warm-up (12 דק׳)', lines:['Snatch עולה: 50 → 60 → 70 → 80% × 1', 'מנוחה 90 שנ׳']},
        b: { title:'B · Work Up to Heavy Single', lines:['3 attempts @ 85%', '3 attempts @ 90%', '2 attempts @ 95%', '1 attempt @ 100%+']},
        c: { title:'C · Down Sets', lines:['3 × 2 @ 80%']},
      },
      {
        title: 'Hang + Power',
        a: { title:'A · Warm-up (10 דק׳)', lines:['Power Snatch × 3 @ 50% · × 5 סבבים']},
        b: { title:'B · Hang Snatch (עולה)', lines:['3 × 3 @ 65%', '3 × 2 @ 75%', '3 × 1 @ 85%']},
        c: { title:'C · Explosive', lines:['Box Jump 4×3', 'Snatch Pull 4×3 @ 90%']},
      },
    ],
  },

  clean_jerk: {
    name: 'Clean & Jerk',
    variants: [
      {
        title: 'Full Movement',
        a: { title:'A · Technique (10 דק׳)', lines:['Clean Pull → Hang Clean × 2 @ 60%', '× 5 סבבים']},
        b: { title:'B · C&J (עולה)', lines:['3 × 2+1 @ 70%', '3 × 1+1 @ 80%', '2 × 1+1 @ 85–90%']},
        c: { title:'C · Accessory', lines:['Front Squat 4×5 @ 75%', 'Push Press 4×5 @ 70%']},
      },
      {
        title: 'Complex + Squat',
        a: { title:'A · Prep (10 דק׳)', lines:['Front Squat 3×5 @ 50-60%']},
        b: { title:'B · Complex', lines:['5 × (Clean + Front Squat + Jerk)', 'התחל 65% · עלה בכל סט']},
        c: { title:'C · Pull Volume', lines:['Clean Pull 5×3 @ 90%']},
      },
      {
        title: 'Heavy Singles',
        a: { title:'A · Warm-up (12 דק׳)', lines:['C&J עולה מ-50% ל-80% · סינגלים']},
        b: { title:'B · Heavy Work', lines:['5 × 1 @ 85%', '3 × 1 @ 90%', '1-2 attempts @ 95%+']},
        c: { title:'C · Down', lines:['Front Squat 3×3 @ 80%']},
      },
      {
        title: 'Split Jerk Focus',
        a: { title:'A · Jerk Balance (10 דק׳)', lines:['Jerk Balance × 3 @ 40-50% · × 5 סבבים']},
        b: { title:'B · Clean + 2 Jerks', lines:['5 × (Clean + 2 Split Jerks) עולה', '65 → 75 → 80 → 85 → 85%']},
        c: { title:'C · Overhead', lines:['Push Press 4×3 @ 80%']},
      },
      {
        title: 'Power Clean Day',
        a: { title:'A · Warm-up (10 דק׳)', lines:['Hang Power Clean × 3 @ 50% · × 5 סבבים']},
        b: { title:'B · Power Clean (עולה)', lines:['3 × 3 @ 65%', '3 × 2 @ 75%', '3 × 1 @ 85%']},
        c: { title:'C · Push Jerk', lines:['Push Jerk 5×3 @ 75%']},
      },
    ],
  },

  squat: {
    name: 'Squat Focus',
    variants: [
      {
        title: 'Front + Back',
        a: { title:'A · Front Squat', lines:['5 × 3 @ 80%', 'מנוחה 3 דק׳ בין סטים']},
        b: { title:'B · Back Squat', lines:['4 × 5 @ 75%']},
        c: { title:'C · Accessory', lines:['Snatch Balance 4×3', 'Good Morning 3×8']},
      },
      {
        title: 'Volume Pyramid',
        a: { title:'A · Warm-up (10 דק׳)', lines:['Back Squat 5-5-5 @ 50-60-70%']},
        b: { title:'B · Pyramid', lines:['Back Squat 8-6-4-2-4-6-8', 'התחל 65% · שיא ב-4×2 (~85%)']},
        c: { title:'C · Front Squat', lines:['3 × 5 @ 65%']},
      },
      {
        title: 'Heavy Singles',
        a: { title:'A · Ramp (12 דק׳)', lines:['Back Squat עולה מ-60% ל-90% · סינגלים']},
        b: { title:'B · Work', lines:['5 × 1 @ 92-95%', 'מנוחה 4 דק׳']},
        c: { title:'C · Down', lines:['Front Squat 4×3 @ 75%']},
      },
      {
        title: 'Overhead Focus',
        a: { title:'A · OHS (10 דק׳)', lines:['Overhead Squat 5×3 @ 65%']},
        b: { title:'B · Back Squat', lines:['5 × 5 @ 75%']},
        c: { title:'C · Bulgarian', lines:['3 × 8 Bulgarian Split Squats (ea)']},
      },
    ],
  },

  jerk: {
    name: 'Jerk Focus',
    variants: [
      {
        title: 'Split Jerk',
        a: { title:'A · Jerk Balance', lines:['5 × 3 Jerk Balance']},
        b: { title:'B · Split Jerk (עולה)', lines:['3 × 2 @ 70%', '3 × 1 @ 85%', '2 × 1 @ 90%']},
        c: { title:'C · Overhead', lines:['Push Jerk 4×3', 'Sots Press 3×5']},
      },
      {
        title: 'Push Jerk Density',
        a: { title:'A · Warm-up (10 דק׳)', lines:['Strict Press 3×5 @ 60%']},
        b: { title:'B · Push Jerk (עולה)', lines:['4 × 3 @ 70%', '4 × 2 @ 80%', '3 × 1 @ 88%']},
        c: { title:'C · Split Practice', lines:['5 × 2 Split Balance']},
      },
      {
        title: 'Complex',
        a: { title:'A · Prep (10 דק׳)', lines:['Push Press × 5 @ 60%']},
        b: { title:'B · Push Press + 2 Jerks', lines:['5 × (PP + 2 Split Jerks) עולה', '65 → 75 → 80 → 85 → 85%']},
        c: { title:'C · OH', lines:['Sots Press 4×5']},
      },
      {
        title: 'From Rack Jerks',
        a: { title:'A · Ramp (10 דק׳)', lines:['Jerk from Rack עולה 50→80% · סינגלים']},
        b: { title:'B · Work', lines:['5 × 2 Split Jerk from Rack @ 85%']},
        c: { title:'C · Accessory', lines:['Barbell Overhead Carry 4×20m']},
      },
    ],
  },

  power: {
    name: 'Power Variants',
    variants: [
      {
        title: 'Snatch + Clean Power',
        a: { title:'A · Power Snatch', lines:['5 × 3 @ 65%']},
        b: { title:'B · Power Clean + Push Press', lines:['5 × (2+2) @ 70%']},
        c: { title:'C · Explosive', lines:['Box Jump 4×5', 'Broad Jump 3×5']},
      },
      {
        title: 'Hang Power Day',
        a: { title:'A · Hang Snatch (10 דק׳)', lines:['Hang Power Snatch 5×3 @ 60%']},
        b: { title:'B · Hang Clean', lines:['Hang Power Clean 5×3 @ 65%']},
        c: { title:'C · Jump Work', lines:['Kettlebell Swing 4×10 heavy', 'Broad Jump 3×5']},
      },
      {
        title: 'Explosive Circuit',
        a: { title:'A · Warm-up (10 דק׳)', lines:['Med Ball Slam × 10', 'Jump Squat × 8', '× 4 סבבים']},
        b: { title:'B · EMOM 12', lines:['Min 1: 3× Power Clean @ 70%', 'Min 2: 5× Box Jump 24"', 'Min 3: 3× Power Snatch @ 60%']},
        c: { title:'C · Vertical', lines:['3 × 5 Depth Jumps']},
      },
    ],
  },
}

const SESSION_KEYS = Object.keys(SESSIONS)
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

export const OLY_FOCUSES = [
  { key:'random',      he:'הפתעה'  },
  { key:'snatch',      he:'Snatch' },
  { key:'clean_jerk',  he:'C&J'    },
  { key:'squat',       he:'Squat'  },
  { key:'jerk',        he:'Jerk'   },
  { key:'power',       he:'Power'  },
]

export function generateWeightliftingWod({ focus = 'random', level = 'intermediate', oneRMs = {} } = {}) {
  const key = focus === 'random' ? pickRandom(SESSION_KEYS) : focus
  const family = SESSIONS[key] || SESSIONS.snatch
  const variant = pickRandom(family.variants)
  const title = `${family.name} · ${variant.title}`
  const notes = []
  if (oneRMs.snatch && (key === 'snatch' || key === 'power')) notes.push(`Snatch 1RM: ${oneRMs.snatch}kg`)
  if (oneRMs.clean && (key === 'clean_jerk' || key === 'jerk' || key === 'power')) notes.push(`Clean 1RM: ${oneRMs.clean}kg`)

  const lines = [
    title.toUpperCase(),
    '',
    variant.a.title, ...variant.a.lines, '',
    variant.b.title, ...variant.b.lines, '',
    variant.c.title, ...variant.c.lines,
  ]
  if (notes.length) {
    lines.push('', '─── ה־1RM שלך ───', ...notes)
  } else {
    lines.push('', '─── טיפ ───', 'הזן את ה־1RM שלך בפרופיל כדי לראות משקלים ק״ג מחושבים')
  }

  const base = {
    title,
    format: 'strength',
    lines,
    movements: [],
    discipline: 'weightlifting',
    focus: key,
  }
  return applyLevelToWod(base, level)
}

export const OLY_PROGRAMS = [
  { id:'oly_snatch_pr', label:'Snatch PR Cycle · 12 שבועות', weeks:12, daysPerWeek:3, goal:'להעלות את ה־Snatch 1RM ב-5-10 ק״ג', schema:'Volume → Intensity → Peak', author:'Selano', origin:'Bulgarian-inspired', level:'מתקדם', sessionNames:['Snatch Volume','Snatch Intensity','Accessory'] },
  { id:'oly_cj_prog', label:'Clean & Jerk Progression · 10 שבועות', weeks:10, daysPerWeek:3, goal:'לשפר את ה־C&J עם דגש על Split Jerk', schema:'Technique → Strength → Peak', author:'Selano', origin:'Classic OL cycle', level:'בינוני', sessionNames:['Clean Focus','Jerk Focus','Squat Work'] },
  { id:'oly_total', label:'Olympic Total · 8 שבועות', weeks:8, daysPerWeek:4, goal:'להעלות את הסה״כ (Snatch + C&J + Squat) ב-10-15 ק״ג', schema:'Snatch + CJ + Squat', author:'Selano', origin:'Total-focused cycle', level:'מתקדם', sessionNames:['Snatch Day','Clean & Jerk Day','Squat Focus','Power Variants'] },
]

export function weightliftingProgramToPlan(programId, oneRMs = {}) {
  const prog = OLY_PROGRAMS.find(p => p.id === programId)
  if (!prog) return null
  const sessions = prog.sessionNames.map(name => {
    const focus = name.includes('Snatch Volume') || name.includes('Snatch Intensity') || name === 'Snatch Day' ? 'snatch'
      : name.includes('Clean Focus') || name === 'Clean & Jerk Day' ? 'clean_jerk'
      : name.includes('Jerk Focus') ? 'jerk'
      : name.includes('Squat') ? 'squat'
      : name.includes('Power') ? 'power'
      : name.includes('Accessory') ? 'power'
      : 'snatch'
    const wod = generateWeightliftingWod({ focus, oneRMs })
    return wodToSession(wod, { name: `${name} · ${wod.title}`, wodType: 'Weightlifting' })
  })
  return {
    name: prog.label,
    programId: prog.id,
    discipline: 'weightlifting',
    split: prog.schema,
    days: prog.daysPerWeek,
    weeks: prog.weeks,
    currentWeek: 1,
    sessions,
    createdAt: new Date().toISOString(),
  }
}
