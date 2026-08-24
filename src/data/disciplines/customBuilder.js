// Build-your-own session for HYROX and Gymnastics.
//
// The premade generators assume a full box: a sled, a rower, rings, a rope.
// Most people training at home or in a hotel gym have none of that, and the
// honest answer is not "come back when you have a sled" — every HYROX station
// and every gymnastics skill has a substitute that trains the same quality
// with the equipment actually on hand.
//
// So the builder works from what the user has rather than from what the sport
// prescribes. Each movement declares what it needs; nothing that cannot be
// performed is ever offered. Bodyweight alone is a first-class option, not a
// degraded one — the pools below carry enough no-equipment work to fill any
// session length at any intensity.
//
// Where a movement stands in for a race station, it says so, so the user knows
// what they are actually training and what the real thing would be.

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Equipment ────────────────────────────────────────────────────
// Ordered roughly by how likely someone is to own it.

export const EQUIPMENT = {
  hyrox: [
    { key:'none',       he:'ללא ציוד',            note:'משקל גוף בלבד' },
    { key:'space',      he:'מקום לריצה',          note:'חוץ / הליכון' },
    { key:'backpack',   he:'תיק / שק חול',        note:'עומס נייד' },
    { key:'dumbbell',   he:'דמבל / קטלבל' },
    { key:'jump_rope',  he:'חבל קפיצה' },
    { key:'box',        he:'ספסל / מדרגה' },
    { key:'band',       he:'גומייה' },
    { key:'bar',        he:'מוט מתח' },
    { key:'machine',    he:'מכונת חתירה / סקי',   note:'Row / Ski / Bike' },
    { key:'sled',       he:'מזחלת',               note:'Sled Push / Pull' },
    { key:'wallball',   he:'כדור כוח',            note:'Wall Ball' },
  ],
  gymnastics: [
    { key:'none',       he:'ללא ציוד',            note:'משקל גוף בלבד' },
    { key:'wall',       he:'קיר פנוי',            note:'עמידת ידיים' },
    { key:'bar',        he:'מוט מתח' },
    { key:'rings',      he:'טבעות' },
    { key:'parallettes', he:'מקבילים / פרלטס' },
    { key:'box',        he:'ספסל / מדרגה' },
    { key:'band',       he:'גומיית עזר' },
    { key:'rope',       he:'חבל טיפוס' },
  ],
}

// ─── Movement pools ───────────────────────────────────────────────
//
// `needs` is an any-of list: the movement is available if the user has at
// least one entry. An empty list means bodyweight — always available.
// `standsFor` names the real station or skill this substitutes, so a
// no-equipment session still teaches what it is training toward.

const HYROX_POOL = [
  // Bodyweight — the backbone of an equipment-free session
  { id:'burpee', he:'Burpees', nameHe:'Burpees',                    needs:[], reps:[10,20], quality:'engine' },
  { id:'burpee_broad', he:'Burpee Broad Jumps', nameHe:'Burpee Broad Jumps',         needs:[], reps:[8,15],  quality:'engine', station:'Burpee Broad Jump' },
  { id:'air_squat', he:'Air Squats', nameHe:'Air Squats',                 needs:[], reps:[20,40], quality:'legs' },
  { id:'jump_squat', he:'Jump Squats', nameHe:'Jump Squats',                needs:[], reps:[15,25], quality:'legs' },
  { id:'lunge_walk', he:'Walking Lunges (steps)', nameHe:'Walking Lunges (צעדים)',     needs:[], reps:[20,40], quality:'legs', standsFor:'Sandbag Lunges' },
  { id:'mountain', he:'Mountain Climbers', nameHe:'Mountain Climbers',          needs:[], reps:[30,50], quality:'engine' },
  { id:'bear_crawl', he:'Bear Crawl (m)', nameHe:'Bear Crawl (מטרים)',         needs:[], reps:[15,30], quality:'grind', standsFor:'Sled Push' },
  { id:'plank_pull', he:'Superman Pulls', nameHe:'Superman Pulls',             needs:[], reps:[15,25], quality:'pull',  standsFor:'Sled Pull' },
  { id:'pushup', he:'Push-ups', nameHe:'Push-ups',                   needs:[], reps:[10,25], quality:'push' },
  { id:'sit_up', he:'Sit-ups', nameHe:'Sit-ups',                    needs:[], reps:[20,35], quality:'core' },
  { id:'high_knees', he:'High Knees (sec)', nameHe:'High Knees (שניות)',         needs:[], reps:[30,60], quality:'engine' },
  { id:'wall_sit', he:'Wall Sit (sec)', nameHe:'Wall Sit (שניות)',           needs:[], reps:[30,60], quality:'legs' },
  { id:'squat_press', he:'Squat to Press', nameHe:'Squat to Press (ידיים ריקות)', needs:[], reps:[20,30], quality:'legs', standsFor:'Wall Balls' },

  // Running / distance
  { id:'run', he:'Run (m)', nameHe:'ריצה (מטרים)',               needs:['space'], reps:[200,600], quality:'run', station:'Run' },
  { id:'shuttle', he:'Shuttle Run 20m', nameHe:'Shuttle Run 20m (סבבים)',    needs:['space'], reps:[6,12],   quality:'run', standsFor:'Run' },

  // Loaded carries and lifts
  { id:'bp_lunge', he:'Backpack Lunges (steps)', nameHe:'Backpack Lunges (צעדים)',    needs:['backpack','dumbbell'], reps:[20,40], quality:'legs', station:'Sandbag Lunges' },
  { id:'bp_carry', he:'Loaded Carry (m)', nameHe:'Loaded Carry (מטרים)',       needs:['backpack','dumbbell'], reps:[40,100], quality:'grind', station:'Farmers Carry' },
  { id:'bp_thruster', he:'Backpack Thrusters', nameHe:'Backpack Thrusters',         needs:['backpack','dumbbell'], reps:[12,20], quality:'legs', standsFor:'Wall Balls' },
  { id:'bp_squat', he:'Loaded Squats', nameHe:'Loaded Squats',              needs:['backpack','dumbbell'], reps:[15,30], quality:'legs' },
  { id:'db_snatch', he:'DB Snatch (alt)', nameHe:'DB Snatch (לסירוגין)',       needs:['dumbbell'], reps:[16,30], quality:'engine' },
  { id:'db_swing', he:'KB / DB Swings', nameHe:'KB / DB Swings',             needs:['dumbbell'], reps:[20,35], quality:'engine' },
  { id:'db_clean', he:'DB Clean & Jerk', nameHe:'DB Clean & Jerk',            needs:['dumbbell'], reps:[12,24], quality:'grind' },

  // Equipment-specific
  { id:'rope_single', he:'Single Unders', nameHe:'Single Unders',              needs:['jump_rope'], reps:[60,120], quality:'engine' },
  { id:'rope_double', he:'Double Unders', nameHe:'Double Unders',              needs:['jump_rope'], reps:[30,60],  quality:'engine' },
  { id:'box_step', he:'Box Step-ups', nameHe:'Box Step-ups',               needs:['box'], reps:[20,40], quality:'legs' },
  { id:'box_jump', he:'Box Jumps', nameHe:'Box Jumps',                  needs:['box'], reps:[15,25], quality:'legs' },
  { id:'band_pull', he:'Band Pull-downs', nameHe:'Band Pull-downs',            needs:['band'], reps:[20,30], quality:'pull', standsFor:'SkiErg' },
  { id:'band_row', he:'Band Rows', nameHe:'Band Rows',                  needs:['band'], reps:[20,30], quality:'pull', standsFor:'Sled Pull' },
  { id:'pullup', he:'Pull-ups', nameHe:'Pull-ups',                   needs:['bar'], reps:[6,15], quality:'pull' },
  { id:'hang_knee', he:'Hanging Knee Raises', nameHe:'Hanging Knee Raises',        needs:['bar'], reps:[12,20], quality:'core' },
  { id:'ski', he:'SkiErg (m)', nameHe:'SkiErg (מטרים)',             needs:['machine'], reps:[250,750], quality:'engine', station:'SkiErg' },
  { id:'row', he:'Row (m)', nameHe:'Row (מטרים)',                needs:['machine'], reps:[250,750], quality:'engine', station:'Row' },
  { id:'sled_push', he:'Sled Push (m)', nameHe:'Sled Push (מטרים)',          needs:['sled'], reps:[20,50], quality:'grind', station:'Sled Push' },
  { id:'sled_pull', he:'Sled Pull (m)', nameHe:'Sled Pull (מטרים)',          needs:['sled'], reps:[20,50], quality:'grind', station:'Sled Pull' },
  { id:'wall_ball', he:'Wall Balls', nameHe:'Wall Balls',                 needs:['wallball'], reps:[20,40], quality:'legs', station:'Wall Balls' },
]

const GYMN_POOL = [
  // Bodyweight foundations
  { id:'pushup', he:'Push-ups', nameHe:'Push-ups',                   needs:[], reps:[10,25], quality:'push' },
  { id:'pike_pushup', he:'Pike Push-ups', nameHe:'Pike Push-ups',              needs:[], reps:[8,15],  quality:'push', standsFor:'HSPU' },
  { id:'hollow', he:'Hollow Hold (sec)', nameHe:'Hollow Hold (שניות)',        needs:[], reps:[20,45], quality:'core' },
  { id:'arch', he:'Arch Hold (sec)', nameHe:'Arch Hold (שניות)',          needs:[], reps:[20,45], quality:'core' },
  { id:'hollow_rock', he:'Hollow Rocks', nameHe:'Hollow Rocks',               needs:[], reps:[20,40], quality:'core' },
  { id:'vup', he:'V-ups', nameHe:'V-ups',                      needs:[], reps:[15,25], quality:'core', standsFor:'Toes-to-Bar' },
  { id:'plank', he:'Plank (sec)', nameHe:'Plank (שניות)',              needs:[], reps:[30,60], quality:'core' },
  { id:'squat_bw', he:'Air Squats', nameHe:'Air Squats',                 needs:[], reps:[20,40], quality:'legs' },
  { id:'split_squat', he:'Bulgarian Split Squat', nameHe:'Bulgarian Split Squat',      needs:[], reps:[10,16], quality:'legs', standsFor:'Pistol' },
  { id:'pistol_assist', he:'Assisted Pistol', nameHe:'Pistol לספסל / נגד קיר',     needs:[], reps:[6,12],  quality:'legs', standsFor:'Pistol Squat' },
  { id:'crab_dip', he:'Crab Dips', nameHe:'Crab Dips',                  needs:[], reps:[12,20], quality:'push', standsFor:'Ring Dips' },
  { id:'burpee', he:'Burpees', nameHe:'Burpees',                    needs:[], reps:[10,20], quality:'engine' },
  { id:'superman', he:'Superman Pulls', nameHe:'Superman Pulls',             needs:[], reps:[15,25], quality:'pull' },
  { id:'towel_row', he:'Towel Row', nameHe:'Towel Row (מגבת בדלת)',      needs:[], reps:[12,20], quality:'pull', standsFor:'Ring Row' },

  // Wall
  { id:'wall_hs', he:'Wall Handstand Hold (sec)', nameHe:'Handstand מול קיר (שניות)',  needs:['wall'], reps:[20,45], quality:'handstand', station:'Handstand Hold' },
  { id:'wall_walk', he:'Wall Walks', nameHe:'Wall Walks',                 needs:['wall'], reps:[3,8],   quality:'handstand', station:'Wall Walk' },
  { id:'wall_hspu', he:'Wall HSPU', nameHe:'Wall HSPU',                  needs:['wall'], reps:[4,10],  quality:'push', station:'HSPU' },
  { id:'wall_shoulder', he:'Handstand Shoulder Taps', nameHe:'Shoulder Taps בעמידת ידיים', needs:['wall'], reps:[10,20], quality:'handstand' },

  // Bar
  { id:'pullup', he:'Pull-ups', nameHe:'Pull-ups',                   needs:['bar'], reps:[5,12],  quality:'pull', station:'Pull-up' },
  { id:'chinup', he:'Chin-ups', nameHe:'Chin-ups',                   needs:['bar'], reps:[5,12],  quality:'pull' },
  { id:'ttb', he:'Toes-to-Bar', nameHe:'Toes-to-Bar',                needs:['bar'], reps:[8,15],  quality:'core', station:'Toes-to-Bar' },
  { id:'knee_raise', he:'Hanging Knee Raises', nameHe:'Hanging Knee Raises',        needs:['bar'], reps:[12,20], quality:'core' },
  { id:'kipswing', he:'Kip Swings', nameHe:'Kip Swings',                 needs:['bar'], reps:[10,20], quality:'pull' },
  { id:'hang', he:'Dead Hang (sec)', nameHe:'Dead Hang (שניות)',          needs:['bar'], reps:[20,45], quality:'pull' },
  { id:'bar_mu', he:'Bar Muscle-ups', nameHe:'Bar Muscle-ups',             needs:['bar'], reps:[3,8],   quality:'pull', station:'Muscle-up' },

  // Rings
  { id:'ring_row', he:'Ring Rows', nameHe:'Ring Rows',                  needs:['rings'], reps:[10,20], quality:'pull', station:'Ring Row' },
  { id:'ring_dip', he:'Ring Dips', nameHe:'Ring Dips',                  needs:['rings'], reps:[5,12],  quality:'push', station:'Ring Dip' },
  { id:'ring_support', he:'Ring Support Hold (sec)', nameHe:'Ring Support Hold (שניות)',  needs:['rings'], reps:[15,40], quality:'core' },
  { id:'ring_mu', he:'Ring Muscle-ups', nameHe:'Ring Muscle-ups',            needs:['rings'], reps:[2,6],   quality:'pull', station:'Muscle-up' },
  { id:'false_grip', he:'False Grip Hang (sec)', nameHe:'False Grip Hang (שניות)',    needs:['rings'], reps:[15,30], quality:'pull' },

  // Parallettes / dip bars
  { id:'dip', he:'Dips', nameHe:'Dips',                       needs:['parallettes'], reps:[6,14], quality:'push', station:'Dip' },
  { id:'lsit', he:'L-Sit (sec)', nameHe:'L-Sit (שניות)',              needs:['parallettes'], reps:[15,35], quality:'core', station:'L-Sit' },
  { id:'tuck_planche', he:'Tuck Planche (sec)', nameHe:'Tuck Planche (שניות)',       needs:['parallettes'], reps:[10,25], quality:'core' },

  // Box / band / rope
  { id:'box_pike', he:'Box Pike Push-ups', nameHe:'Box Pike Push-ups',          needs:['box'], reps:[8,15],  quality:'push', standsFor:'HSPU' },
  { id:'step_up', he:'Step-ups', nameHe:'Step-ups',                   needs:['box'], reps:[16,30], quality:'legs' },
  { id:'band_pullup', he:'Banded Pull-ups', nameHe:'Pull-ups עם גומייה',         needs:['band'], reps:[8,15], quality:'pull', standsFor:'Pull-up' },
  { id:'band_pullapart', he:'Band Pull-aparts', nameHe:'Band Pull-aparts',          needs:['band'], reps:[20,30], quality:'pull' },
  { id:'rope_climb', he:'Rope Climbs', nameHe:'Rope Climbs',                needs:['rope'], reps:[2,5],  quality:'pull', station:'Rope Climb' },
]

const POOLS = { hyrox: HYROX_POOL, gymnastics: GYMN_POOL }

// ─── Options ──────────────────────────────────────────────────────

export const DURATIONS = [
  { key:10, he:'10 דק׳' },
  { key:15, he:'15 דק׳' },
  { key:20, he:'20 דק׳' },
  { key:30, he:'30 דק׳' },
  { key:40, he:'40 דק׳' },
]

export const FORMATS = [
  { key:'amrap',     he:'AMRAP',     note:'כמה שיותר סבבים בזמן' },
  { key:'emom',      he:'EMOM',      note:'תרגיל בכל דקה' },
  { key:'for_time',  he:'For Time',  note:'לסיים מהר ככל האפשר' },
  { key:'intervals', he:'אינטרוולים', note:'עבודה / מנוחה' },
  { key:'circuit',   he:'סבבים',      note:'תחנות עם מנוחה' },
]

export const INTENSITIES = [
  { key:'easy',   he:'קל',    mult:0.7 },
  { key:'medium', he:'בינוני', mult:1.0 },
  { key:'hard',   he:'קשה',   mult:1.3 },
]

export const GOALS = {
  hyrox: [
    { key:'mixed',   he:'משולב',    qualities:['engine','legs','grind','run','pull','push'] },
    { key:'engine',  he:'מנוע',     qualities:['engine','run'] },
    { key:'legs',    he:'רגליים',   qualities:['legs','grind'] },
    { key:'grind',   he:'כוח־סבולת', qualities:['grind','pull','push'] },
    { key:'run',     he:'ריצה',     qualities:['run','engine'] },
  ],
  gymnastics: [
    { key:'mixed',     he:'משולב',      qualities:['pull','push','core','handstand','legs'] },
    { key:'pull',      he:'משיכה',      qualities:['pull'] },
    { key:'push',      he:'דחיפה',      qualities:['push'] },
    { key:'core',      he:'ליבה',       qualities:['core'] },
    { key:'handstand', he:'עמידת ידיים', qualities:['handstand','push'] },
    { key:'legs',      he:'רגליים',     qualities:['legs'] },
  ],
}

// ─── Availability ─────────────────────────────────────────────────

// A movement is available when it needs nothing, or when the user has at
// least one of the things it can be done with.
export function isAvailable(movement, owned) {
  if (!movement.needs.length) return true
  return movement.needs.some(n => owned.includes(n))
}

export function availableMovements(discipline, equipment) {
  const pool = POOLS[discipline] || []
  const owned = equipment.filter(e => e !== 'none')
  return pool.filter(m => isAvailable(m, owned))
}

// What the user is missing, phrased as what it would unlock. Shown so the
// equipment list reads as an opportunity rather than a restriction.
export function unlockHints(discipline, equipment) {
  const pool = POOLS[discipline] || []
  const owned = equipment.filter(e => e !== 'none')
  const catalog = EQUIPMENT[discipline] || []
  return catalog
    .filter(e => e.key !== 'none' && !owned.includes(e.key))
    .map(e => ({
      ...e,
      unlocks: pool.filter(m => m.needs.includes(e.key) && !isAvailable(m, owned)).length,
    }))
    .filter(e => e.unlocks > 0)
    .sort((a, b) => b.unlocks - a.unlocks)
}

// ─── Generation ───────────────────────────────────────────────────

const LEVEL_MULT = { beginner: 0.65, intermediate: 1, advanced: 1.25, rx: 1.45 }

function repsFor(movement, intensityMult, levelMult) {
  const [lo, hi] = movement.reps
  const mid = lo + (hi - lo) * Math.random()
  const scaled = Math.round(mid * intensityMult * levelMult)
  // Distances stay in round numbers; a 237m run helps nobody.
  const round = movement.quality === 'run' || /מטרים/.test(movement.he) ? 10 : 1
  return Math.max(lo * 0.5, Math.round(scaled / round) * round)
}

// How many distinct movements a session of this length and format wants.
function movementCount(format, minutes) {
  if (format === 'emom') return Math.min(4, Math.max(2, Math.round(minutes / 8)))
  if (format === 'for_time') return Math.min(5, Math.max(3, Math.round(minutes / 6)))
  if (format === 'intervals') return Math.min(4, Math.max(2, Math.round(minutes / 8)))
  if (format === 'circuit') return Math.min(6, Math.max(3, Math.round(minutes / 5)))
  return Math.min(5, Math.max(3, Math.round(minutes / 5)))   // amrap
}

// Prefer movements matching the goal, then fill from whatever is left so a
// narrow goal on thin equipment still produces a full session rather than a
// two-movement one.
function selectMovements(pool, goalQualities, count) {
  const onGoal = shuffle(pool.filter(m => goalQualities.includes(m.quality)))
  const rest = shuffle(pool.filter(m => !goalQualities.includes(m.quality)))
  const chosen = []
  for (const m of [...onGoal, ...rest]) {
    if (chosen.length >= count) break
    if (chosen.some(c => c.id === m.id)) continue
    chosen.push(m)
  }
  return chosen
}

function warmupFor(discipline, hasSpace) {
  if (discipline === 'gymnastics') {
    return [
      '2 סבבים:',
      '  10 Scapular Pulls / Shrugs',
      '  20 שניות Hollow Hold',
      '  10 Push-ups',
      '  מתיחות כתפיים ופרקי ידיים',
    ]
  }
  return [
    hasSpace ? '3 דק׳ ריצה קלה' : '3 דק׳ קפיצות במקום / High Knees',
    '2 סבבים:',
    '  10 Air Squats · 10 Push-ups · 10 Walking Lunges',
    '  פתיחת ירכיים וקרסוליים',
  ]
}

// Builds the session body, in the sport's own notation.
function bodyFor(format, movements, minutes, mult, levelMult) {
  const line = (m) => `  ${repsFor(m, mult, levelMult)} ${m.he}`

  switch (format) {
    case 'amrap':
      return [`AMRAP ${minutes} דקות:`, ...movements.map(line)]

    case 'emom': {
      const rounds = Math.floor(minutes / movements.length)
      return [
        `EMOM ${movements.length * rounds} דקות — ${movements.length} תרגילים בסבב:`,
        ...movements.map((m, i) => `  דקה ${i + 1}: ${repsFor(m, mult, levelMult)} ${m.he}`),
        '',
        `חוזר ${rounds} פעמים. מה שנשאר מהדקה — מנוחה.`,
      ]
    }

    case 'for_time': {
      const rounds = minutes <= 15 ? 3 : minutes <= 25 ? 4 : 5
      return [
        `${rounds} סבבים לזמן:`,
        ...movements.map(line),
        '',
        `Cap: ${minutes} דקות.`,
      ]
    }

    case 'intervals': {
      const work = mult >= 1.3 ? 40 : mult <= 0.7 ? 20 : 30
      const rest = 60 - work
      const sets = Math.max(4, Math.floor((minutes * 60) / ((work + rest) * movements.length)))
      return [
        `אינטרוולים · ${work} שנ׳ עבודה / ${rest} שנ׳ מנוחה:`,
        ...movements.map(m => `  ${m.he} — מקסימום חזרות`),
        '',
        `${sets} סבבים. מנוחה 60 שנ׳ בין סבבים.`,
      ]
    }

    case 'circuit':
    default: {
      const rounds = minutes <= 15 ? 3 : minutes <= 30 ? 4 : 5
      return [
        `${rounds} סבבים · מנוחה 90 שנ׳ בין סבבים:`,
        ...movements.map(line),
      ]
    }
  }
}

// Turns a set of choices into a session in the same shape the premade
// generators produce, so it renders and logs through the existing path.
export function buildCustomWod({
  discipline = 'hyrox',
  equipment = ['none'],
  minutes = 20,
  format = 'amrap',
  intensity = 'medium',
  goal = 'mixed',
  level = 'intermediate',
} = {}) {
  const pool = availableMovements(discipline, equipment)
  if (pool.length < 2) {
    return {
      error: 'לא נבחר מספיק ציוד כדי לבנות אימון. סמן לפחות "ללא ציוד" — יש מספיק תרגילי משקל גוף לאימון מלא.',
    }
  }

  const goals = GOALS[discipline] || []
  const goalDef = goals.find(g => g.key === goal) || goals[0]
  const mult = (INTENSITIES.find(i => i.key === intensity) || INTENSITIES[1]).mult
  const levelMult = LEVEL_MULT[level] ?? 1

  const count = Math.min(movementCount(format, minutes), pool.length)
  const movements = selectMovements(pool, goalDef.qualities, count)

  const hasSpace = equipment.includes('space')
  const fmtLabel = (FORMATS.find(f => f.key === format) || FORMATS[0]).he
  const title = `${goalDef.he} · ${fmtLabel} · ${minutes} דק׳`

  // Substitutions are stated rather than hidden: someone doing Bear Crawls
  // should know it is standing in for a Sled Push.
  const subs = movements.filter(m => m.standsFor)
  const stations = movements.filter(m => m.station)

  const lines = [
    title.toUpperCase(),
    '',
    'A · חימום',
    ...warmupFor(discipline, hasSpace),
    '',
    'B · האימון',
    ...bodyFor(format, movements, minutes, mult, levelMult),
    '',
    'C · שחרור',
    '5 דק׳ הליכה או נשימות + מתיחות לשרירים שעבדו',
  ]

  if (subs.length) {
    lines.push(
      '',
      'תחליפים בשימוש:',
      ...subs.map(m => `  ${m.he} — במקום ${m.standsFor}`),
    )
  }

  return {
    title,
    format: format === 'emom' ? 'emom' : format === 'for_time' ? 'for_time' : 'amrap',
    lines,
    movements: [],
    discipline,
    focus: goal,
    custom: true,
    meta: {
      minutes, intensity, goal, level,
      equipment: equipment.filter(e => e !== 'none'),
      poolSize: pool.length,
      picked: movements.map(m => m.id),
      substitutions: subs.map(m => ({ he: m.he, standsFor: m.standsFor })),
      stationsCovered: stations.map(m => m.station),
    },
  }
}
