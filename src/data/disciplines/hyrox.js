// HYROX — multi-variant families.
// Race format: 8 × 1km run + 8 workout stations.

import { applyLevelToWod } from './levels'
import { wodToSession } from './wodToExercises'

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

const SESSIONS = {
  race_sim_mini: {
    name: 'Race Sim · Mini',
    variants: [
      {
        title: '4 Stations',
        a: { title:'A · חימום (10 דק׳)', lines:['5 דק׳ ריצה קלה', '3× (10 Wall Balls + 10 Air Squats + 5 Burpees)']},
        b: { title:'B · Mini Sim', lines:['4 × [ 500m Run + 250m Row + 10 Burpee Broad Jumps ]', 'ללא מנוחה בין תחנות · מנוחה 2:00 בין סבבים']},
        c: { title:'C · Cool Down', lines:['5 דק׳ הליכה + מתיחות']},
      },
      {
        title: '3 Stations High-Intensity',
        a: { title:'A · חימום (10 דק׳)', lines:['1km ריצה קלה', 'Hip mobility + Sled activation']},
        b: { title:'B · Sim', lines:['3 × [ 1000m Run + 20m Sled Push + 20 Wall Balls ]', 'לזמן']},
        c: { title:'C · Cool Down', lines:['1km Easy jog']},
      },
      {
        title: 'Station Focus',
        a: { title:'A · חימום (12 דק׳)', lines:['Row 500m + Ski 500m + drills']},
        b: { title:'B · Sim', lines:['4 × [ 500m Row + 500m Ski + 500m Run + 20 Lunges ]', 'לזמן']},
        c: { title:'C · Cool Down', lines:['5 דק׳ הליכה']},
      },
    ],
  },

  race_sim_full: {
    name: 'Race Sim · Full',
    variants: [
      {
        title: 'Full HYROX',
        a: { title:'A · חימום (15 דק׳)', lines:['10 דק׳ ריצה קלה · Zone 2', 'Drills + Strides · 2 × (Sled Push 20m קל)']},
        b: { title:'B · Race Simulation', lines:['1km Run → 1km SkiErg', '1km Run → 50m Sled Push', '1km Run → 50m Sled Pull', '1km Run → 80m Burpee Broad Jump', '1km Run → 1km Row', '1km Run → 200m Farmers Carry', '1km Run → 100m Sandbag Lunges', '1km Run → 100 Wall Balls', 'מטרה: מתחת ל־90 דק׳ (RX Male) / 100 דק׳ (RX Female)']},
        c: { title:'C · Cool Down', lines:['10 דק׳ הליכה · מתיחות · פוקוס על שוקיים ורגליים']},
      },
      {
        title: 'Reverse Order Sim',
        a: { title:'A · חימום (15 דק׳)', lines:['Easy jog + full body prep']},
        b: { title:'B · Reverse Race', lines:['התחל מהתחנה האחרונה: Wall Balls 100 → 1km Run', 'המשך בסדר הפוך עד SkiErg → 1km Run', 'מודד עומס שונה מהמרוץ הרגיל']},
        c: { title:'C · Cool Down', lines:['10 דק׳ Easy']},
      },
    ],
  },

  sled: {
    name: 'Sled Work',
    variants: [
      {
        title: 'Volume Day',
        a: { title:'A · חימום (10 דק׳)', lines:['Easy jog + hip/glute activation']},
        b: { title:'B · Sled Push', lines:['8 × 25m Sled Push · משקל HYROX RX', 'מנוחה 60 שנ׳']},
        c: { title:'C · Sled Pull', lines:['8 × 25m Sled Pull · rope over shoulder', 'מנוחה 60 שנ׳']},
      },
      {
        title: 'Heavy Push',
        a: { title:'A · חימום (10 דק׳)', lines:['Low-load sled × 3 × 20m']},
        b: { title:'B · Heavy Push', lines:['6 × 25m Sled Push @ 120% RX weight', 'מנוחה 90 שנ׳']},
        c: { title:'C · Row Recovery', lines:['500m Row Easy']},
      },
      {
        title: 'EMOM Sled',
        a: { title:'A · חימום (8 דק׳)', lines:['Air squats + lunges']},
        b: { title:'B · EMOM 20', lines:['אודי: 25m Sled Push', 'זוגי: 25m Sled Pull']},
        c: { title:'C · Core', lines:['3 × 30s Plank']},
      },
      {
        title: 'For Time',
        a: { title:'A · חימום (10 דק׳)', lines:['Row 500m + activation']},
        b: { title:'B · For Time', lines:['5 × [ 25m Sled Push + 25m Sled Pull + 200m Run ]', 'Cap 20:00']},
        c: { title:'C · Cool Down', lines:['5 דק׳ Easy']},
      },
    ],
  },

  ski_row: {
    name: 'SkiErg + Row',
    variants: [
      {
        title: 'Intervals 5×500',
        a: { title:'A · חימום (8 דק׳)', lines:['500m Row easy → 500m SkiErg easy', 'Drills']},
        b: { title:'B · Intervals', lines:['5 × [ 500m SkiErg + 500m Row ]', 'מנוחה 90 שנ׳ בין', 'קצב יעד: מתחת לקצב 1k race pace']},
        c: { title:'C · Finisher', lines:['2 × 250m Row · All-out']},
      },
      {
        title: 'Long Steady 30 דק׳',
        a: { title:'A · חימום (8 דק׳)', lines:['Easy row + ski']},
        b: { title:'B · Steady', lines:['30 דק׳ ברציפות: 3 דק׳ Row → 3 דק׳ Ski · חזור', 'קצב 70% מ-race pace']},
        c: { title:'C · Cool Down', lines:['500m Easy']},
      },
      {
        title: '1k Race Pace',
        a: { title:'A · חימום (10 דק׳)', lines:['500m Row + 500m Ski']},
        b: { title:'B · Race Pace', lines:['3 × 1000m Row @ race pace · Rest 2:00', '3 × 1000m Ski @ race pace · Rest 2:00']},
        c: { title:'C · Row Down', lines:['500m Easy']},
      },
      {
        title: 'Mixed EMOM',
        a: { title:'A · חימום (8 דק׳)', lines:['Easy row/ski']},
        b: { title:'B · EMOM 20', lines:['Min 1: 250m Row', 'Min 2: 250m Ski', 'Min 3: 15 Burpees', 'Min 4: מנוחה']},
        c: { title:'C · Cool Down', lines:['5 דק׳ Easy']},
      },
    ],
  },

  sandbag_wallball: {
    name: 'Sandbag + Wall Ball',
    variants: [
      {
        title: 'Circuit 5 סבבים',
        a: { title:'A · חימום (10 דק׳)', lines:['Squat mobility + core prep']},
        b: { title:'B · Circuit', lines:['5 סבבים:', '20m Sandbag Lunges', '25 Wall Balls', '200m Run', 'מנוחה 90 שנ׳ בין']},
        c: { title:'C · Core', lines:['3 × 45s Hollow Hold']},
      },
      {
        title: 'For Time',
        a: { title:'A · חימום (10 דק׳)', lines:['Air squats + carry drills']},
        b: { title:'B · For Time', lines:['100 Wall Balls', '100m Sandbag Lunges', '200m Farmers Carry', 'Cap 15:00']},
        c: { title:'C · Cool Down', lines:['5 דק׳ הליכה']},
      },
      {
        title: 'Wall Ball Density',
        a: { title:'A · חימום (10 דק׳)', lines:['Squat prep + shoulder mobility']},
        b: { title:'B · Wall Ball Ladder', lines:['5-10-15-20-25 Wall Balls', 'בין כל שלב: 100m Run', 'מנוחה 60 שנ׳']},
        c: { title:'C · Sandbag Finisher', lines:['3 × 20m Sandbag Lunges']},
      },
      {
        title: 'Carry Focus',
        a: { title:'A · חימום (8 דק׳)', lines:['Grip prep + shoulder']},
        b: { title:'B · Carries', lines:['6 × 200m Farmers Carry @ RX weight', 'מנוחה 60 שנ׳ בין']},
        c: { title:'C · Sandbag Bear Hug', lines:['3 × 100m Sandbag Carry']},
      },
    ],
  },

  running_conditioning: {
    name: 'HYROX Running',
    variants: [
      {
        title: '8 × 400m',
        a: { title:'A · חימום (10 דק׳)', lines:['Easy jog + Strides ×4']},
        b: { title:'B · Intervals', lines:['8 × 400m @ HYROX race pace', 'מנוחה 60 שנ׳ (מדמה תחנה)']},
        c: { title:'C · Cool Down', lines:['10 דק׳ Easy']},
      },
      {
        title: '5 × 1km',
        a: { title:'A · חימום (10 דק׳)', lines:['Easy jog + drills']},
        b: { title:'B · Race-Pace Intervals', lines:['5 × 1km @ HYROX race pace', 'מנוחה 90 שנ׳']},
        c: { title:'C · Cool Down', lines:['10 דק׳ Easy']},
      },
      {
        title: 'Broken 5K',
        a: { title:'A · חימום (10 דק׳)', lines:['Easy + strides']},
        b: { title:'B · 5K Broken', lines:['1km Run → 20 Burpees → 1km Run → 20 Burpees → 1km Run', 'לזמן']},
        c: { title:'C · Cool Down', lines:['5 דק׳ Easy']},
      },
      {
        title: 'Run + Station Interval',
        a: { title:'A · חימום (10 דק׳)', lines:['Easy + activation']},
        b: { title:'B · 6 Rounds', lines:['500m Run → 15 Wall Balls', 'מנוחה 60 שנ׳']},
        c: { title:'C · Cool Down', lines:['5 דק׳']},
      },
    ],
  },
}

export const HYROX_FOCUSES = [
  { key:'random',              he:'הפתעה'    },
  { key:'race_sim_mini',       he:'Sim מיני' },
  { key:'race_sim_full',       he:'Sim מלא'  },
  { key:'sled',                he:'Sled'     },
  { key:'ski_row',             he:'Ski+Row'  },
  { key:'sandbag_wallball',    he:'Sandbag'  },
  { key:'running_conditioning',he:'ריצה'     },
]

export function generateHyroxWod({ focus = 'random', level = 'intermediate' } = {}) {
  const keys = Object.keys(SESSIONS)
  const key = focus === 'random' ? pickRandom(keys) : focus
  const family = SESSIONS[key] || SESSIONS.race_sim_mini
  const variant = pickRandom(family.variants)
  const title = `${family.name} · ${variant.title}`
  const lines = [
    title.toUpperCase(), '',
    variant.a.title, ...variant.a.lines, '',
    variant.b.title, ...variant.b.lines, '',
    variant.c.title, ...variant.c.lines,
  ]
  const base = {
    title,
    format: 'metcon',
    lines,
    movements: [],
    discipline: 'hyrox',
    focus: key,
  }
  return applyLevelToWod(base, level)
}

export const HYROX_PROGRAMS = [
  { id:'hyrox_first_race', label:'HYROX First Race Prep · 8 שבועות', weeks:8, daysPerWeek:4, goal:'להשלים את המרוץ הראשון (כל 8 התחנות)', schema:'Base → Station work → Race Sim', author:'Selano', origin:'Progression for first-timers', level:'בינוני', sessionNames:['Running','Sled','SkiErg+Row','Sandbag+WallBall'] },
  { id:'hyrox_sub90', label:'HYROX Sub-90 · 10 שבועות', weeks:10, daysPerWeek:5, goal:'לסיים מרוץ מתחת ל-90 דקות', schema:'Pace + Volume + Race Sim', author:'Selano', origin:'Advanced racing block', level:'מתקדם', sessionNames:['Running','Sled','SkiErg+Row','Sandbag+WallBall','Race Sim'] },
  { id:'hyrox_offseason', label:'HYROX Off-Season Base · 6 שבועות', weeks:6, daysPerWeek:3, goal:'לבנות בסיס אירובי + חוזק כללי', schema:'Aerobic base + Strength', author:'Selano', origin:'Between-races base', level:'מתחיל', sessionNames:['Running','Sled','SkiErg+Row'] },
]

export function hyroxProgramToPlan(programId) {
  const prog = HYROX_PROGRAMS.find(p => p.id === programId)
  if (!prog) return null
  const sessions = prog.sessionNames.map(name => {
    const focus = name === 'Running' ? 'running_conditioning'
      : name === 'Sled' ? 'sled'
      : name === 'SkiErg+Row' ? 'ski_row'
      : name === 'Sandbag+WallBall' ? 'sandbag_wallball'
      : name === 'Race Sim' ? 'race_sim_mini'
      : 'race_sim_mini'
    const wod = generateHyroxWod({ focus })
    return wodToSession(wod, { name: `${name} · ${wod.title}`, wodType: 'HYROX' })
  })
  return {
    name: prog.label,
    programId: prog.id,
    discipline: 'hyrox',
    split: prog.schema,
    days: prog.daysPerWeek,
    weeks: prog.weeks,
    currentWeek: 1,
    sessions,
    createdAt: new Date().toISOString(),
  }
}
