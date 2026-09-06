// Gymnastics — skill-focused catalogue + workout generator + program library.
// Each session key has MULTIPLE variants so every "generate" gives a
// different workout even for the same focus.

import { applyLevelToWod } from './levels'
import { wodToSession } from './wodToExercises'

// Multi-variant session families.
// Each variant is a fully-worked prescription (A/B/C blocks).
const SESSIONS = {
  muscle_up: {
    name: 'Muscle-Up Day',
    variants: [
      {
        title: 'Skill + EMOM',
        a: { title:'A · Skill (15 דק׳)', lines:[
          'False Grip Row × 5 → Kipping Pull-up × 3',
          '× 5 סבבים · מנוחה כשצריך',
        ]},
        b: { title:'B · EMOM (10 דק׳)', lines:[
          'Min 1: 3× Chest-to-Bar',
          'Min 2: 5× Ring Dips',
        ]},
        c: { title:'C · Core Finisher', lines:[
          '3× Hollow Rocks 20s + L-sit 15s',
        ]},
      },
      {
        title: 'Transition Focus',
        a: { title:'A · Transition Drill (12 דק׳)', lines:[
          'Banded MU Transition × 3',
          'Russian Dip × 5',
          '× 5 סבבים',
        ]},
        b: { title:'B · Volume (15 דק׳)', lines:[
          '5×5 Chest-to-Bar Pull-ups',
          '5×5 Ring Dips',
        ]},
        c: { title:'C · Hollow Body', lines:[
          '4× Hollow Hold 30s',
        ]},
      },
      {
        title: 'Grip + Pull Density',
        a: { title:'A · False Grip (8 דק׳)', lines:[
          'False Grip Hang 20s → Row × 3',
          '× 4 סבבים',
        ]},
        b: { title:'B · For Time', lines:[
          '30 Chest-to-Bar Pull-ups · Cap 6:00',
        ]},
        c: { title:'C · Ring Support', lines:[
          '3 × Ring Support 30s',
        ]},
      },
      {
        title: 'Explosive Pull',
        a: { title:'A · Kip Work (10 דק׳)', lines:[
          'Bar Kip Swings × 6',
          'High Pull-ups (chest to belly) × 3',
          '× 5 סבבים',
        ]},
        b: { title:'B · Practice Sets', lines:[
          '5 attempts × 1 MU (or best available)',
          'מנוחה 2:00 בין ניסיונות',
        ]},
        c: { title:'C · Hollow to Arch', lines:[
          '4× 10 Hollow ↔ Arch swings',
        ]},
      },
    ],
  },

  handstand: {
    name: 'Handstand Day',
    variants: [
      {
        title: 'Wall Practice',
        a: { title:'A · Wall Walks (12 דק׳)', lines:[
          'Wall Walk × 3 → Handstand Hold 20s',
          '× 6 סבבים',
        ]},
        b: { title:'B · HSPU Strength (15 דק׳)', lines:[
          '5×5 Strict HSPU (scale: Box HSPU)',
          'מנוחה 90 שנ׳ בין סטים',
        ]},
        c: { title:'C · Core', lines:[
          'AMRAP 5:00 — 10× V-ups + 20s Plank',
        ]},
      },
      {
        title: 'Freestanding Prep',
        a: { title:'A · Balance Drill (10 דק׳)', lines:[
          'Kick-up to Wall × 5',
          'Chest-facing HS Hold 15s',
          '× 5 סבבים',
        ]},
        b: { title:'B · Volume', lines:[
          '10 × 30s Handstand Hold',
          'מנוחה 30 שנ׳ בין',
        ]},
        c: { title:'C · Shoulder Prep', lines:[
          '3 × 10 Pike Push-ups',
        ]},
      },
      {
        title: 'HSPU Density',
        a: { title:'A · Warm-up (10 דק׳)', lines:[
          'Wall Walks × 4',
          'Pike Push-ups × 10',
          '× 3 סבבים',
        ]},
        b: { title:'B · EMOM (12 דק׳)', lines:[
          'Min 1: 5× HSPU',
          'Min 2: 30s HS Hold',
          'Min 3: 8× Pike Push-ups',
        ]},
        c: { title:'C · Hollow', lines:[
          '3 × Hollow Rocks 30s',
        ]},
      },
      {
        title: 'Walking Progression',
        a: { title:'A · Wall Time (8 דק׳)', lines:[
          '3 × Wall HS Hold 45s',
        ]},
        b: { title:'B · Walking Drill (15 דק׳)', lines:[
          'Kick-up → Try 2 steps free',
          'Kick-up → 30s Hold',
          '× 8 סבבים',
        ]},
        c: { title:'C · Core Circuit', lines:[
          '3× (10 V-ups + 20s L-sit)',
        ]},
      },
    ],
  },

  pulling: {
    name: 'Pulling Volume',
    variants: [
      {
        title: 'Strict + Kipping',
        a: { title:'A · Strict Work (15 דק׳)', lines:[
          '5 × 5 Strict Pull-ups',
          'הוסף משקל אם 5 קל',
        ]},
        b: { title:'B · EMOM (12 דק׳)', lines:[
          'Min 1: 6× Kipping Pull-ups',
          'Min 2: 8× Toes-to-Bar',
          'Min 3: 20s L-sit',
        ]},
        c: { title:'C · Grip', lines:[
          '3× Max Hang from bar',
        ]},
      },
      {
        title: 'Chin-up Ladder',
        a: { title:'A · Ladder (15 דק׳)', lines:[
          '1-2-3-4-5-4-3-2-1 Chin-ups',
          'מנוחה = חצי מזמן העבודה',
        ]},
        b: { title:'B · Rope Climb', lines:[
          '5 × 1 Rope Climb (scale: 3× Rope Pulls from ground)',
        ]},
        c: { title:'C · Isometric', lines:[
          '3 × Flex Hang 20s (סנטר מעל הבר)',
        ]},
      },
      {
        title: 'For Time',
        a: { title:'A · Warm-up (8 דק׳)', lines:[
          '3× (10 Ring Rows + 30s Bar Hang)',
        ]},
        b: { title:'B · For Time', lines:[
          '50 Pull-ups לזמן (Cap 8:00)',
          'שיטה: 5-10-15-20',
        ]},
        c: { title:'C · Cool', lines:[
          '2 × Scap Pull 10',
        ]},
      },
      {
        title: 'Muscle-Up Ladder',
        a: { title:'A · Skill (10 דק׳)', lines:[
          'C2B × 3 → Ring Dip × 5',
          '× 5 סבבים',
        ]},
        b: { title:'B · Volume', lines:[
          'EMOM 15: 5× Weighted Pull-ups (add 5kg)',
        ]},
        c: { title:'C · T2B', lines:[
          '4 × 10 Toes-to-Bar',
        ]},
      },
    ],
  },

  pistol: {
    name: 'Pistol + Core',
    variants: [
      {
        title: 'Shrimp + EMOM',
        a: { title:'A · Technique (10 דק׳)', lines:[
          'Shrimp Squat 3×5 (each leg)',
          'עם TRX/עמוד תמיכה אם צריך',
        ]},
        b: { title:'B · Volume (15 דק׳)', lines:[
          'EMOM 15: 6× Pistol Squats (alt legs)',
        ]},
        c: { title:'C · Core', lines:[
          '4× GHD Sit-ups 10 + V-up 10',
        ]},
      },
      {
        title: 'Assisted → Free',
        a: { title:'A · Assisted (10 דק׳)', lines:[
          '5 × 5 Assisted Pistol (TRX)',
        ]},
        b: { title:'B · Free Pistols', lines:[
          '10-8-6-4-2 Pistol (per leg)',
          'מנוחה כשצריך',
        ]},
        c: { title:'C · Plank Series', lines:[
          '3× (Plank 45s + Side Plank 20s ea)',
        ]},
      },
      {
        title: 'Density Ladder',
        a: { title:'A · Warm-up (8 דק׳)', lines:[
          '3× (10 Air Squats + 5 Cossack Squats ea)',
        ]},
        b: { title:'B · Ladder', lines:[
          '1-2-3-4-5-6 Pistols/leg',
          '20s מנוחה בין שלבים',
        ]},
        c: { title:'C · Hollow', lines:[
          '3× Hollow Rocks 30s',
        ]},
      },
    ],
  },

  ring_work: {
    name: 'Ring Foundations',
    variants: [
      {
        title: 'Support + Dips',
        a: { title:'A · Support (10 דק׳)', lines:[
          '5 × Ring Support 30s + Ring Row 10',
        ]},
        b: { title:'B · Dips + Rows (15 דק׳)', lines:[
          '5×5 Ring Dips',
          '5×5 False Grip Rows',
        ]},
        c: { title:'C · Static', lines:[
          '4× L-sit 15s',
        ]},
      },
      {
        title: 'False Grip Focus',
        a: { title:'A · Grip (8 דק׳)', lines:[
          '5 × False Grip Hang 20s',
        ]},
        b: { title:'B · Pull (15 דק׳)', lines:[
          '5 × 5 Ring Pull-ups',
          '5 × 5 Ring Rows @ chest-touch',
        ]},
        c: { title:'C · Iron Cross Prep', lines:[
          '3× Ring Support Extended 20s',
        ]},
      },
      {
        title: 'MU Assembly',
        a: { title:'A · Elements (10 דק׳)', lines:[
          'Ring Dip × 5 → Pull-up × 5 → Support 15s',
          '× 5 סבבים',
        ]},
        b: { title:'B · Ring MU Attempts', lines:[
          'EMOM 10: 1 Ring MU attempt',
          '(scale: Jumping Ring MU)',
        ]},
        c: { title:'C · Hollow-Arch', lines:[
          '4× 10 Kip Swings',
        ]},
      },
    ],
  },
}

// Helpers
const SESSION_KEYS = Object.keys(SESSIONS)
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Single-workout generator
export function generateGymnasticsWod({ focus = 'random', level = 'intermediate' } = {}) {
  const key = focus === 'random' ? pickRandom(SESSION_KEYS) : focus
  const family = SESSIONS[key] || SESSIONS.pulling
  const variant = pickRandom(family.variants)
  const title = `${family.name} · ${variant.title}`
  const lines = [
    title.toUpperCase(),
    '',
    variant.a.title,
    ...variant.a.lines,
    '',
    variant.b.title,
    ...variant.b.lines,
    '',
    variant.c.title,
    ...variant.c.lines,
  ]
  const base = {
    title,
    format: 'strength',
    lines,
    movements: [],
    discipline: 'gymnastics',
    focus: key,
  }
  return applyLevelToWod(base, level)
}

export const GYMN_FOCUSES = [
  { key:'random',     he:'הפתעה'    },
  { key:'muscle_up',  he:'Muscle-Up' },
  { key:'handstand',  he:'Handstand' },
  { key:'pulling',    he:'משיכה'     },
  { key:'pistol',     he:'Pistol'    },
  { key:'ring_work',  he:'Rings'     },
]

// Kept for backward compat with programs that reference specific movements.
export const GYMN_SKILLS = [
  { id:'strict_pu', he:'Strict Pull-up', cat:'pull' },
  { id:'kipping_pu', he:'Kipping Pull-up', cat:'pull' },
  { id:'c2b', he:'Chest-to-Bar', cat:'pull' },
  { id:'bmu', he:'Bar Muscle-up', cat:'pull' },
  { id:'rmu', he:'Ring Muscle-up', cat:'pull' },
  { id:'hs_hold', he:'Handstand Hold', cat:'push' },
  { id:'strict_hspu', he:'Strict HSPU', cat:'push' },
  { id:'l_sit', he:'L-sit Hold', cat:'core' },
  { id:'pistol', he:'Pistol Squat', cat:'legs' },
]

// ─── Programs ─────────────────────────
export const GYMN_PROGRAMS = [
  {
    id: 'gymn_first_mu',
    label: 'First Muscle-Up · 6 שבועות',
    weeks: 6,
    daysPerWeek: 3,
    goal: 'להשלים Muscle-Up ראשון (בר או טבעות)',
    schema: 'False Grip → Transition → MU',
    author: 'Selano',
    origin: 'Progressive foundation',
    level: 'בינוני',
    sessionNames: ['Foundation','Transition','Explosive'],
  },
  {
    id: 'gymn_hs_foundations',
    label: 'Handstand Foundations · 4 שבועות',
    weeks: 4,
    daysPerWeek: 4,
    goal: 'לעמוד על הידיים 30 שניות ליד קיר',
    schema: 'Wall walks → Kick-up → Freestand → Walk',
    author: 'Selano',
    origin: 'Balance progression',
    level: 'מתחיל',
    sessionNames: ['Wall Time','Kick-up','Freestand','Skill'],
  },
  {
    id: 'gymn_pull_ladder',
    label: '30 Pull-ups Ladder · 8 שבועות',
    weeks: 8,
    daysPerWeek: 3,
    goal: 'להגיע ל-30 Pull-ups רצופים',
    schema: 'Grease-the-Groove protocol',
    author: 'Selano',
    origin: 'Volume ladder',
    level: 'בינוני',
    sessionNames: ['Ladder A','Ladder B','Volume'],
  },
]

export function gymnasticsProgramToPlan(programId) {
  const prog = GYMN_PROGRAMS.find(p => p.id === programId)
  if (!prog) return null
  const sessions = prog.sessionNames.map(name => {
    const wod = generateGymnasticsWod({
      level: 'intermediate',
      focus: name === 'Wall Time' ? 'handstand'
        : name === 'Kick-up' ? 'handstand'
        : name === 'Freestand' ? 'handstand'
        : name === 'Foundation' ? 'ring_work'
        : name === 'Transition' ? 'muscle_up'
        : name === 'Explosive' ? 'muscle_up'
        : name === 'Ladder A' ? 'pulling'
        : name === 'Ladder B' ? 'pulling'
        : 'pulling',
    })
    return wodToSession(wod, { name: `${name} · ${wod.title}`, wodType: 'Gymnastics' })
  })
  return {
    name: prog.label,
    programId: prog.id,
    discipline: 'gymnastics',
    split: prog.schema,
    days: prog.daysPerWeek,
    weeks: prog.weeks,
    currentWeek: 1,
    sessions,
    createdAt: new Date().toISOString(),
  }
}
