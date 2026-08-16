// The 15 most famous CrossFit benchmark WODs — "The Girls" + "Heroes" + Open highlights.
// Each keeps a fixed prescription (the whole point of a benchmark is that it doesn't change),
// but the display resolves loads by sex and shows a scaled version too.

export const BENCHMARKS = [
  // ═══════════════════ THE GIRLS ═══════════════════
  {
    id: 'fran',
    name: 'Fran',
    category: 'girls',
    icon: '',
    format: 'for_time',
    timeCap: 5 * 60, // elite <3min, most people 5-10
    description: 'הקלאסיקה האולטימטיבית — 21-15-9 של Thrusters ו-Pull-ups.',
    prescription: {
      scheme: '21-15-9',
      movements: [
        { id: 'thruster', label: 'Thrusters', rx: '43/30 ק"ג' },
        { id: 'pullups',  label: 'Pull-ups',  rx: '' },
      ],
    },
    lines: ['For Time — 21-15-9:', '  Thrusters (43/30 kg)', '  Pull-ups'],
    eliteBenchmark: { male: '2:20', female: '2:40' },
    avgTime: { male: '5:30', female: '7:00' },
  },
  {
    id: 'cindy',
    name: 'Cindy',
    category: 'girls',
    icon: '',
    format: 'amrap',
    timeCap: 20 * 60,
    description: 'AMRAP 20 דקות — משקל גוף בלבד. סבבים = כשירות.',
    prescription: {
      scheme: '5-10-15 חוזר',
      movements: [
        { id: 'pullups',    label: 'Pull-ups' },
        { id: 'pushups',    label: 'Push-ups' },
        { id: 'air_squats', label: 'Air Squats' },
      ],
    },
    lines: ['AMRAP 20 דקות:', '  5 Pull-ups', '  10 Push-ups', '  15 Air Squats'],
    eliteBenchmark: { male: '30+ סבבים', female: '25+ סבבים' },
    avgTime: { male: '18 סבבים', female: '15 סבבים' },
  },
  {
    id: 'helen',
    name: 'Helen',
    category: 'girls',
    icon: '',
    format: 'for_time',
    timeCap: 15 * 60,
    description: '3 סבבים For Time — ריצה + סווינגים + עליות מתח.',
    prescription: {
      scheme: '3 סבבים',
      movements: [
        { id: 'running',  label: 'Run', rx: '400 מ׳' },
        { id: 'kb_swing', label: 'KB Swing', rx: '24/16 ק"ג × 21' },
        { id: 'pullups',  label: 'Pull-ups', rx: '× 12' },
      ],
    },
    lines: ['3 סבבים For Time:', '  400 מ׳ ריצה', '  21 KB Swings (24/16 kg)', '  12 Pull-ups'],
    eliteBenchmark: { male: '7:00', female: '8:30' },
    avgTime: { male: '11:00', female: '13:00' },
  },
  {
    id: 'grace',
    name: 'Grace',
    category: 'girls',
    icon: '',
    format: 'for_time',
    timeCap: 10 * 60,
    description: '30 חזרות Clean & Jerk For Time. פשוט וכואב.',
    prescription: {
      scheme: '30 חזרות',
      movements: [
        { id: 'clean_and_jerk', label: 'Clean & Jerk', rx: '60/42 ק"ג' },
      ],
    },
    lines: ['For Time:', '  30 Clean & Jerks (60/42 kg)'],
    eliteBenchmark: { male: '1:30', female: '2:00' },
    avgTime: { male: '5:00', female: '7:00' },
  },
  {
    id: 'diane',
    name: 'Diane',
    category: 'girls',
    icon: '',
    format: 'for_time',
    timeCap: 10 * 60,
    description: '21-15-9 של Deadlifts ו-HSPU.',
    prescription: {
      scheme: '21-15-9',
      movements: [
        { id: 'deadlift', label: 'Deadlifts', rx: '102/70 ק"ג' },
        { id: 'hspu',     label: 'HSPU', rx: '' },
      ],
    },
    lines: ['For Time — 21-15-9:', '  Deadlifts (102/70 kg)', '  Handstand Push-ups'],
    eliteBenchmark: { male: '2:30', female: '3:30' },
    avgTime: { male: '7:00', female: '9:00' },
  },
  {
    id: 'karen',
    name: 'Karen',
    category: 'girls',
    icon: '',
    format: 'for_time',
    timeCap: 15 * 60,
    description: '150 Wall Balls For Time — פשוט, בלתי נגמר.',
    prescription: {
      scheme: '150 חזרות',
      movements: [
        { id: 'wall_ball_shots', label: 'Wall Balls', rx: '9/6 ק"ג' },
      ],
    },
    lines: ['For Time:', '  150 Wall Ball Shots (9/6 kg, 10/9 ft)'],
    eliteBenchmark: { male: '4:30', female: '5:30' },
    avgTime: { male: '8:00', female: '10:00' },
  },
  {
    id: 'angie',
    name: 'Angie',
    category: 'girls',
    icon: '',
    format: 'for_time',
    timeCap: 30 * 60,
    description: '100 של כל תרגיל For Time — סדרתי, לא במעגל.',
    prescription: {
      scheme: 'סדרתי',
      movements: [
        { id: 'pullups',    label: 'Pull-ups',   rx: '× 100' },
        { id: 'pushups',    label: 'Push-ups',   rx: '× 100' },
        { id: 'situps',     label: 'Sit-ups',    rx: '× 100' },
        { id: 'air_squats', label: 'Air Squats', rx: '× 100' },
      ],
    },
    lines: ['For Time — סדרתי:', '  100 Pull-ups', '  100 Push-ups', '  100 Sit-ups', '  100 Air Squats'],
    eliteBenchmark: { male: '10:00', female: '13:00' },
    avgTime: { male: '20:00', female: '25:00' },
  },
  {
    id: 'annie',
    name: 'Annie',
    category: 'girls',
    icon: '',
    format: 'for_time',
    timeCap: 10 * 60,
    description: '50-40-30-20-10 של Double-unders ו-Sit-ups.',
    prescription: {
      scheme: '50-40-30-20-10',
      movements: [
        { id: 'double_unders', label: 'Double-unders' },
        { id: 'situps',        label: 'Sit-ups' },
      ],
    },
    lines: ['For Time — 50-40-30-20-10:', '  Double-unders', '  Sit-ups'],
    eliteBenchmark: { male: '4:00', female: '4:30' },
    avgTime: { male: '8:00', female: '9:00' },
  },

  // ═══════════════════ HEROES ═══════════════════
  {
    id: 'murph',
    name: 'Murph',
    category: 'heroes',
    icon: '',
    format: 'for_time',
    timeCap: 60 * 60,
    description: 'לזכר Lt. Michael Murphy. ריצה של מייל + 100 עליות מתח + 200 שכיבות סמיכה + 300 סקוואטים + מייל נוסף. עם אפוד 20/14 ליברות ב-Rx.',
    prescription: {
      scheme: 'סדרתי',
      movements: [
        { id: 'running',    label: '1 mile run' },
        { id: 'pullups',    label: '100 Pull-ups' },
        { id: 'pushups',    label: '200 Push-ups' },
        { id: 'air_squats', label: '300 Air Squats' },
        { id: 'running',    label: '1 mile run' },
      ],
    },
    lines: ['For Time (עם אפוד 9/6 ק"ג):', '  1 מייל ריצה', '  100 Pull-ups', '  200 Push-ups', '  300 Air Squats', '  1 מייל ריצה'],
    eliteBenchmark: { male: '32:00', female: '38:00' },
    avgTime: { male: '55:00', female: '65:00' },
  },
  {
    id: 'dt',
    name: 'DT',
    category: 'heroes',
    icon: '',
    format: 'for_time',
    timeCap: 20 * 60,
    description: '5 סבבים — Deadlifts + Hang Cleans + Push Jerks. מכה קשה לגב.',
    prescription: {
      scheme: '5 סבבים',
      movements: [
        { id: 'deadlift',   label: 'Deadlifts',   rx: '70/47.5 ק"ג × 12' },
        { id: 'squat_clean', label: 'Hang Cleans', rx: '70/47.5 ק"ג × 9' },
        { id: 'push_jerk',  label: 'Push Jerks',  rx: '70/47.5 ק"ג × 6' },
      ],
    },
    lines: ['5 סבבים For Time (70/47.5 ק"ג):', '  12 Deadlifts', '  9 Hang Power Cleans', '  6 Push Jerks'],
    eliteBenchmark: { male: '8:00', female: '10:00' },
    avgTime: { male: '15:00', female: '18:00' },
  },
  {
    id: 'jt',
    name: 'JT',
    category: 'heroes',
    icon: '',
    format: 'for_time',
    timeCap: 15 * 60,
    description: '21-15-9 של HSPU + Ring Dips + Push-ups. אימון דחיפה טהור.',
    prescription: {
      scheme: '21-15-9',
      movements: [
        { id: 'hspu',    label: 'HSPU' },
        { id: 'dips',    label: 'Ring Dips' },
        { id: 'pushups', label: 'Push-ups' },
      ],
    },
    lines: ['For Time — 21-15-9:', '  Handstand Push-ups', '  Ring Dips', '  Push-ups'],
    eliteBenchmark: { male: '7:00', female: '9:00' },
    avgTime: { male: '13:00', female: '15:00' },
  },
  {
    id: 'kelly',
    name: 'Kelly',
    category: 'heroes',
    icon: '',
    format: 'for_time',
    timeCap: 40 * 60,
    description: '5 סבבים — ריצה 400 מ׳ + 30 Box Jumps + 30 Wall Balls.',
    prescription: {
      scheme: '5 סבבים',
      movements: [
        { id: 'running',         label: '400 מ׳ ריצה' },
        { id: 'box_jumps',       label: '30 Box Jumps', rx: '60/50 ס"מ' },
        { id: 'wall_ball_shots', label: '30 Wall Balls', rx: '9/6 ק"ג' },
      ],
    },
    lines: ['5 סבבים For Time:', '  400 מ׳ ריצה', '  30 Box Jumps (60/50 ס"מ)', '  30 Wall Balls (9/6 kg)'],
    eliteBenchmark: { male: '22:00', female: '26:00' },
    avgTime: { male: '35:00', female: '40:00' },
  },

  // ═══════════════════ OPEN CLASSICS ═══════════════════
  {
    id: 'open_17_1',
    name: '17.1',
    category: 'open',
    icon: '',
    format: 'for_time',
    timeCap: 20 * 60,
    description: 'CrossFit Open 2017 — סולם עולה של DB Snatch ו-Burpee Box Jump-Overs.',
    prescription: {
      scheme: '10-20-30-40-50 סנאץ׳',
      movements: [
        { id: 'db_snatch',            label: 'DB Snatch', rx: '22.5/15 ק"ג' },
        { id: 'burpee_box_jump_overs', label: 'Burpee Box Jump-Overs', rx: '60/50 ס"מ × 15 בין כל סט' },
      ],
    },
    lines: ['For Time:', '  10 DB Snatch, 15 Burpee Box Jump-Overs', '  20 DB Snatch, 15 Burpee Box Jump-Overs', '  30 DB Snatch, 15 Burpee Box Jump-Overs', '  40 DB Snatch, 15 Burpee Box Jump-Overs', '  50 DB Snatch, 15 Burpee Box Jump-Overs'],
    eliteBenchmark: { male: '10:00', female: '11:30' },
    avgTime: { male: '17:00', female: '19:00' },
  },
  {
    id: 'open_18_1',
    name: '18.1',
    category: 'open',
    icon: '',
    format: 'amrap',
    timeCap: 20 * 60,
    description: 'AMRAP 20 דקות — Toes-to-Bar + DB Hang Clean & Jerk + Row Calories.',
    prescription: {
      scheme: 'סבב חוזר',
      movements: [
        { id: 'toes_to_bar', label: 'Toes-to-Bar', rx: '× 8' },
        { id: 'db_clean',    label: 'DB Hang Clean & Jerk', rx: '22.5/15 × 10' },
        { id: 'rowing',      label: 'Row', rx: '14/12 קלוריות' },
      ],
    },
    lines: ['AMRAP 20 דקות:', '  8 Toes-to-Bar', '  10 DB Hang Clean & Jerk (22.5/15 kg)', '  14/12 Calorie Row'],
    eliteBenchmark: { male: '9+ סבבים', female: '8+ סבבים' },
    avgTime: { male: '6 סבבים', female: '5 סבבים' },
  },
  {
    id: 'open_21_1',
    name: '21.1',
    category: 'open',
    icon: '',
    format: 'for_time',
    timeCap: 15 * 60,
    description: 'סולם של Wall Walks + Double-unders — 1-3-5-7-9-11 wall walks עם DU בין כל סט.',
    prescription: {
      scheme: '1-3-5-7... wall walks',
      movements: [
        { id: 'wall_walks',    label: 'Wall Walks' },
        { id: 'double_unders', label: 'Double-unders (10× מספר ה-wall walks)' },
      ],
    },
    lines: ['For Time (15 דקות cap):', '  1 wall walk, 10 double-unders', '  3 wall walks, 30 double-unders', '  5 wall walks, 50 double-unders', '  7 wall walks, 70 double-unders', '  9 wall walks, 90 double-unders', '  11 wall walks, 110 double-unders'],
    eliteBenchmark: { male: '9:00', female: '10:00' },
    avgTime: { male: '13:00', female: '14:00' },
  },

  // ═══════════════════ GAMES · אימוני דגל מהתחרויות ═══════════════════
  {
    id: 'fight_gone_bad',
    name: 'Fight Gone Bad',
    category: 'games',
    format: 'reps_max',
    timeCap: 17 * 60,
    description: 'קלאסיקה מ־Games 2005 — 3 סבבים של 5 תחנות דקה כל אחת + דקת מנוחה. סופרים חזרות/קלוריות.',
    prescription: {
      scheme: '3 rounds × (5 stations × 1 min work + 1 min rest)',
      movements: [
        { id: 'wall_ball_shots', label: 'Wall Balls (9/6 kg)' },
        { id: 'sdhp',            label: 'Sumo Deadlift High Pull (35/25 kg)' },
        { id: 'box_jumps',       label: 'Box Jumps (50 cm)' },
        { id: 'push_press',      label: 'Push Press (35/25 kg)' },
        { id: 'rowing',          label: 'Row (calories)' },
      ],
    },
    lines: ['3 סבבים · 1 דקה על כל תחנה · 1 דקת מנוחה בין סבבים:', '  Wall Balls (9/6 kg)', '  SDHP (35/25 kg)', '  Box Jumps (50cm)', '  Push Press (35/25 kg)', '  Row (calories)'],
    eliteBenchmark: { male: '450+', female: '400+' },
    avgTime: { male: '320', female: '280' },
  },
  {
    id: 'cf_total',
    name: 'CF Total',
    category: 'games',
    format: 'load_max',
    timeCap: 60 * 60,
    description: 'מבחן הכוח הטהור — סכום 1RM של Back Squat + Strict Press + Deadlift. 3 ניסיונות לכל תרגיל.',
    prescription: {
      scheme: 'sum of 1RM',
      movements: [
        { id: 'back_squat',      label: 'Back Squat 1RM' },
        { id: 'overhead_press',  label: 'Strict Press 1RM' },
        { id: 'deadlift',        label: 'Deadlift 1RM' },
      ],
    },
    lines: ['CrossFit Total — סכום 1RM:', '  Back Squat', '  Strict Press', '  Deadlift', '  (3 ניסיונות לכל תרגיל)'],
    eliteBenchmark: { male: '500+ kg', female: '340+ kg' },
    avgTime: { male: '350 kg', female: '230 kg' },
  },
  {
    id: 'nasty_girls',
    name: 'Nasty Girls',
    category: 'games',
    format: 'for_time',
    timeCap: 25 * 60,
    description: 'אימון קרב מ־Games 2007 — Kristan Clever הפכה אותו למיתולוגי. 3 סבבים של סקוואטים + מסל־אפים + hang power cleans.',
    prescription: {
      scheme: '3 rounds',
      movements: [
        { id: 'air_squats',        label: 'Air Squats × 50' },
        { id: 'ring_muscle_up',    label: 'Ring Muscle-ups × 7' },
        { id: 'hang_power_clean',  label: 'Hang Power Cleans × 10 (65/45 kg)' },
      ],
    },
    lines: ['3 סבבים For Time:', '  50 Air Squats', '  7 Muscle-ups', '  10 Hang Power Cleans (65/45 kg)'],
    eliteBenchmark: { male: '7:30', female: '9:00' },
    avgTime: { male: '15:00', female: '18:00' },
  },
  {
    id: 'open_18_5',
    name: 'Open 18.5',
    category: 'games',
    format: 'for_time',
    timeCap: 7 * 60,
    description: 'הפינאלה של Open 2018 — Thrusters + Chest-to-Bar Pull-ups. סולם יורד קטלני.',
    prescription: {
      scheme: '21-18-15-12-9-6-3',
      movements: [
        { id: 'thruster',      label: 'Thrusters (45/30 kg)' },
        { id: 'chest_to_bar',  label: 'Chest-to-Bar Pull-ups' },
      ],
    },
    lines: ['For Time (7 min cap) — 21-18-15-12-9-6-3:', '  Thrusters (45/30 kg)', '  Chest-to-Bar Pull-ups'],
    eliteBenchmark: { male: '4:30', female: '5:15' },
    avgTime: { male: '7:00', female: '7:00' },
  },
  {
    id: 'open_22_1',
    name: 'Open 22.1',
    category: 'games',
    format: 'amrap',
    timeCap: 15 * 60,
    description: 'האימון הפותח של Open 2022 — Wall Walks + DB Snatches + Box Jump Overs. AMRAP 15 דקות.',
    prescription: {
      scheme: 'AMRAP 15',
      movements: [
        { id: 'wall_walks', label: 'Wall Walks × 3' },
        { id: 'db_snatch',  label: 'DB Snatches × 12 (22.5/15 kg)' },
        { id: 'box_overs',  label: 'Box Jump Overs × 15 (60/50 cm)' },
      ],
    },
    lines: ['AMRAP 15 דקות:', '  3 Wall Walks', '  12 DB Snatches (22.5/15 kg)', '  15 Box Jump Overs (60/50 cm)'],
    eliteBenchmark: { male: '10+ rounds', female: '8+ rounds' },
    avgTime: { male: '6 rounds', female: '5 rounds' },
  },
  {
    id: 'open_24_1',
    name: 'Open 24.1',
    category: 'games',
    format: 'for_time',
    timeCap: 15 * 60,
    description: 'הפתיחה של Open 2024 — DB Snatch + Burpees Over Dumbbell. סולם עולה + יורד.',
    prescription: {
      scheme: '21-15-9 (R arm) + 9-15-21 (L arm) — burpees between',
      movements: [
        { id: 'db_snatch',  label: 'DB Snatch (22.5/15 kg)' },
        { id: 'burpees',    label: 'Burpees Over the DB' },
      ],
    },
    lines: ['For Time (15 min cap):', '  21 DB Snatches (R) → 21 Burpees Over DB', '  15 DB Snatches (R) → 15 Burpees Over DB', '  9  DB Snatches (R) → 9  Burpees Over DB', '  9  DB Snatches (L) → 9  Burpees Over DB', '  15 DB Snatches (L) → 15 Burpees Over DB', '  21 DB Snatches (L) → 21 Burpees Over DB'],
    eliteBenchmark: { male: '9:00', female: '10:30' },
    avgTime: { male: '13:00', female: '14:00' },
  },
  {
    id: 'chad_1000x',
    name: 'Chad 1000x',
    category: 'games',
    format: 'for_time',
    timeCap: 90 * 60,
    description: 'מבחן ה־Hero של Chad Wilkinson — 1000 עליות על קופסה עם וסט 20/14 ק"ג. מנטלית ופיזית בלתי אפשרי כמעט.',
    prescription: {
      scheme: '1000 reps',
      movements: [
        { id: 'box_step_ups', label: 'Box Step-ups (50 cm) עם וסט 20/14 kg' },
      ],
    },
    lines: ['For Time:', '  1000 Box Step-ups (50 cm)', '  * ללבוש וסט 20/14 kg', '  * לתעד גם ללא וסט אם אין'],
    eliteBenchmark: { male: '35:00', female: '42:00' },
    avgTime: { male: '75:00', female: '85:00' },
  },
  {
    id: 'amanda',
    name: 'Amanda',
    category: 'games',
    format: 'for_time',
    timeCap: 10 * 60,
    description: 'הופיע ב־Games 2010 — Muscle-ups + Squat Snatches. אחד מהכי טכניים.',
    prescription: {
      scheme: '9-7-5',
      movements: [
        { id: 'ring_muscle_up', label: 'Muscle-ups' },
        { id: 'snatch',         label: 'Squat Snatches (61/43 kg)' },
      ],
    },
    lines: ['For Time (10 min cap) — 9-7-5:', '  Muscle-ups', '  Squat Snatches (61/43 kg)'],
    eliteBenchmark: { male: '4:00', female: '5:00' },
    avgTime: { male: '9:00', female: '10:00' },
  },
]

export const BENCHMARK_CATEGORIES = {
  girls:  { he: 'The Girls',   description: 'הבנצ׳מרקים הקלאסיים — הבסיס של כל מתאמן פונקציונאלי' },
  heroes: { he: 'Heroes',      description: 'לזכר לוחמים שנפלו — האימונים הכבדים ביותר' },
  games:  { he: 'Games',       description: 'אימוני דגל מתחרויות ה-Games ו-Open הבינלאומיות' },
}

export const BENCHMARK_BY_ID = Object.fromEntries(BENCHMARKS.map(b => [b.id, b]))

// PR utility — compare a new time to previous PRs and return classification.
export function classifyResult(benchmark, timeSeconds) {
  const eliteStr = benchmark.eliteBenchmark?.male || ''
  const avgStr = benchmark.avgTime?.male || ''
  const parseMS = (str) => {
    if (!str) return null
    const [m, s] = str.split(':').map(Number)
    if (!isNaN(m) && !isNaN(s)) return m * 60 + s
    return null
  }
  const elite = parseMS(eliteStr)
  const avg = parseMS(avgStr)
  if (elite && timeSeconds <= elite) return { tier: 'elite', color: '#c8a84b' }
  if (avg && timeSeconds <= avg)     return { tier: 'strong', color: '#5ac889' }
  return { tier: 'completed', color: '#a09b8c' }
}
