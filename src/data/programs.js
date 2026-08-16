// Real-world training programs library.
// Each session block is scaled by intensity (% of 1RM) so the generator
// can compute exact working weights per user.
//
// Notation:
//   sets/reps/intensity are the loading prescription
//   format:'strength'|'hypertrophy'|'metcon'|'skill'|'accessory'
//   For MetCons (CrossFit): fields wodType, timeCap, prescription

export const KEY_LIFTS = {
  squat:    { key:'squat',    label:'סקוואט',       exId:'squat' },
  bench:    { key:'bench',    label:'לחיצת חזה',    exId:'bench' },
  deadlift: { key:'deadlift', label:'דדליפט',        exId:'deadlift' },
  ohp:      { key:'ohp',      label:'לחיצת כתפיים',  exId:'ohp' },
  clean:    { key:'clean',    label:'קלין',          exId:null },
  snatch:   { key:'snatch',   label:'סנאץ׳',         exId:null },
  frontsq:  { key:'frontsq',  label:'סקוואט קדמי',   exId:null },
}

// ─── PROGRAMS ──────────────────────────────────────────────────────────
export const programs = {

  // ─── Beginner Strength ────────────────────────────────────────────
  starting_strength: {
    id:'starting_strength',
    label:'Starting Strength',
    author:'Mark Rippetoe',
    origin:'ארה״ב · 2005',
    level:'מתחיל',
    goal:'כוח בסיסי',
    daysPerWeek: 3,
    duration: 12,
    schema:'Linear Progression - +2.5 ק״ג כל אימון',
    description:'התכנית האולטימטיבית למתחילים - 3 אימוני גוף מלא בשבוע, פוקוס על 5 תרגילי מפתח בסיסים. עלייה של 2.5 ק״ג כל אימון עד שנתקעים.',
    sessions: [
      { name:'Workout A', blocks:[
        { lift:'squat',    sets:3, reps:5, intensity:0.75, format:'strength' },
        { lift:'bench',    sets:3, reps:5, intensity:0.75, format:'strength' },
        { lift:'deadlift', sets:1, reps:5, intensity:0.85, format:'strength' },
      ]},
      { name:'Workout B', blocks:[
        { lift:'squat',    sets:3, reps:5, intensity:0.75, format:'strength' },
        { lift:'ohp',      sets:3, reps:5, intensity:0.75, format:'strength' },
        { name:'Power Clean', sets:5, reps:3, intensity:0.70, format:'strength' },
      ]},
    ],
    notes:['להתחיל עם 40% 1RM שבועיים לתרגל טכניקה','לעלות רק אם מסיימים את כל הסטים ברמת מאמץ טובה'],
  },

  stronglifts_5x5: {
    id:'stronglifts_5x5',
    label:'StrongLifts 5×5',
    author:'Mehdi',
    origin:'אירופה · 2007',
    level:'מתחיל',
    goal:'כוח + מסת שריר',
    daysPerWeek: 3,
    duration: 12,
    schema:'5 סטים × 5 חזרות · +2.5 ק״ג כל אימון',
    description:'וריאציה על Starting Strength - 5×5 במקום 3×5. אימונים A/B מתחלפים.',
    sessions: [
      { name:'Workout A', blocks:[
        { lift:'squat', sets:5, reps:5, intensity:0.78, format:'strength' },
        { lift:'bench', sets:5, reps:5, intensity:0.78, format:'strength' },
        { name:'Barbell Row', sets:5, reps:5, intensity:0.75, format:'strength' },
      ]},
      { name:'Workout B', blocks:[
        { lift:'squat',    sets:5, reps:5, intensity:0.78, format:'strength' },
        { lift:'ohp',      sets:5, reps:5, intensity:0.78, format:'strength' },
        { lift:'deadlift', sets:1, reps:5, intensity:0.85, format:'strength' },
      ]},
    ],
    notes:['+2.5 ק״ג לסקוואט/בנץ/OHP/חתירה','+5 ק״ג לדדליפט','נכשל 3 פעמים → deload 10%'],
  },

  // ─── Intermediate Strength ────────────────────────────────────────
  wendler_531: {
    id:'wendler_531',
    label:'Wendler 5/3/1',
    author:'Jim Wendler',
    origin:'ארה״ב · 2009',
    level:'בינוני',
    goal:'כוח לטווח ארוך',
    daysPerWeek: 4,
    duration: 16,
    schema:'גלים של 3 שבועות + deload · אחוזים מ-Training Max (90% מ-1RM)',
    description:'התכנית הבינונית הכי מבוססת בעולם. עלייה איטית של +2.5-5 ק״ג לחודש, אבל אמינה למשך שנים. עובד על TM (Training Max) = 90% מ-1RM.',
    sessions: [
      { name:'Squat Day (Week 1: 5s)', blocks:[
        { lift:'squat', prescription:'5 × 65% / 5 × 75% / 5+ × 85%', intensity:[0.65,0.75,0.85], sets:3, format:'strength' },
        { name:'Accessory Legs', prescription:'5×10 leg press או lunges', format:'accessory' },
        { name:'Core', prescription:'3×15 ab wheel', format:'accessory' },
      ]},
      { name:'Bench Day (Week 1: 5s)', blocks:[
        { lift:'bench', prescription:'5 × 65% / 5 × 75% / 5+ × 85%', intensity:[0.65,0.75,0.85], sets:3, format:'strength' },
        { name:'Accessory Chest', prescription:'5×10 DB press או dips', format:'accessory' },
        { name:'Rows', prescription:'5×10 dumbbell row', format:'accessory' },
      ]},
      { name:'Deadlift Day (Week 1: 5s)', blocks:[
        { lift:'deadlift', prescription:'5 × 65% / 5 × 75% / 5+ × 85%', intensity:[0.65,0.75,0.85], sets:3, format:'strength' },
        { name:'Accessory Back', prescription:'5×10 pull-ups', format:'accessory' },
        { name:'Hamstrings', prescription:'5×10 RDL', format:'accessory' },
      ]},
      { name:'OHP Day (Week 1: 5s)', blocks:[
        { lift:'ohp', prescription:'5 × 65% / 5 × 75% / 5+ × 85%', intensity:[0.65,0.75,0.85], sets:3, format:'strength' },
        { name:'Accessory Shoulders', prescription:'5×10 lateral raises', format:'accessory' },
        { name:'Chin-ups', prescription:'5×10', format:'accessory' },
      ]},
    ],
    notes:['שבוע 1: 5-5-5+','שבוע 2: 3-3-3+','שבוע 3: 5-3-1+','שבוע 4: Deload 40/50/60%','+2.5 ק״ג עליון / +5 ק״ג תחתון כל מחזור'],
  },

  sheiko: {
    id:'sheiko',
    label:'Sheiko Beginner',
    author:'Boris Sheiko',
    origin:'רוסיה · 1996',
    level:'מתקדם',
    goal:'פאוורליפטינג תחרותי',
    daysPerWeek: 4,
    duration: 12,
    schema:'נפח גבוה עם אחוזים מדויקים · 70-85% 1RM',
    description:'שיטה רוסית קלאסית לפאוורליפטינג. נפח גבוה מאוד, אחוזים מדויקים, פוקוס על טכניקה מושלמת. שרתה עשרות אלופי עולם.',
    sessions: [
      { name:'Session 1 - Bench Focus', blocks:[
        { lift:'bench',    prescription:'5×3@70%, 4×3@75%, 5×2@80%', intensity:[0.70,0.75,0.80], sets:14, format:'strength' },
        { lift:'squat',    prescription:'5×5@60%, 3×4@70%',            intensity:[0.60,0.70],     sets:8,  format:'strength' },
        { name:'Bench Accessory', prescription:'3×8 close-grip bench', format:'accessory' },
      ]},
      { name:'Session 2 - Squat Focus', blocks:[
        { lift:'squat',    prescription:'4×4@75%, 5×3@80%', intensity:[0.75,0.80], sets:9, format:'strength' },
        { lift:'deadlift', prescription:'4×3@70%, 2×2@80%', intensity:[0.70,0.80], sets:6, format:'strength' },
      ]},
      { name:'Session 3 - Bench Volume', blocks:[
        { lift:'bench', prescription:'3×5@60%, 6×4@70%, 2×3@80%', intensity:[0.60,0.70,0.80], sets:11, format:'strength' },
        { name:'Row', prescription:'4×8 barbell row', format:'accessory' },
      ]},
      { name:'Session 4 - Deadlift Focus', blocks:[
        { lift:'deadlift', prescription:'5×3@75%, 3×2@85%', intensity:[0.75,0.85], sets:8,  format:'strength' },
        { lift:'squat',    prescription:'5×5@70%',            intensity:[0.70],       sets:5,  format:'strength' },
      ]},
    ],
    notes:['הכל עם קיפוץ המוט עד סוף התנועה','נפח שבועי: 500-800 חזרות','אין sets to failure - טכניקה מעל הכל'],
  },

  // ─── Hypertrophy ──────────────────────────────────────────────────
  ppl_hypertrophy: {
    id:'ppl_hypertrophy',
    label:'Push/Pull/Legs Hypertrophy',
    author:'קונצנזוס בודיבילדינג',
    origin:'עולמי · שנות ה-90',
    level:'בינוני-מתקדם',
    goal:'מסת שריר',
    daysPerWeek: 6,
    duration: 12,
    schema:'6 ימים · 65-80% 1RM · 8-12 חזרות · נפח גבוה',
    description:'הפורמט המועדף על מתקדמים לבניית מסה - כל קבוצת שריר מקבלת שני אימונים בשבוע. נפח גבוה, טווח חזרות בינוני (8-12), 60-90 שניות מנוחה.',
    sessions: [
      { name:'Push A (חזה חזק)', blocks:[
        { lift:'bench',              sets:4, reps:6,  intensity:0.80, format:'strength' },
        { name:'Incline DB Press',    sets:4, reps:10, intensity:0.70, format:'hypertrophy' },
        { name:'Overhead Press',      sets:3, reps:8,  intensity:0.72, format:'hypertrophy' },
        { name:'Lateral Raises',      sets:4, reps:12, format:'hypertrophy' },
        { name:'Tricep Pushdown',     sets:3, reps:12, format:'hypertrophy' },
        { name:'Overhead Extension',  sets:3, reps:12, format:'hypertrophy' },
      ]},
      { name:'Pull A (גב עבה)', blocks:[
        { lift:'deadlift',           sets:3, reps:5,  intensity:0.80, format:'strength' },
        { name:'Pull-ups',            sets:4, reps:8,  format:'hypertrophy' },
        { name:'Barbell Row',         sets:4, reps:10, intensity:0.70, format:'hypertrophy' },
        { name:'Cable Row',           sets:3, reps:12, format:'hypertrophy' },
        { name:'Face Pull',           sets:3, reps:15, format:'hypertrophy' },
        { name:'Barbell Curl',        sets:3, reps:10, format:'hypertrophy' },
      ]},
      { name:'Legs A (רגליים חזקות)', blocks:[
        { lift:'squat',              sets:4, reps:6,  intensity:0.80, format:'strength' },
        { name:'Romanian Deadlift',   sets:4, reps:10, intensity:0.72, format:'hypertrophy' },
        { name:'Leg Press',           sets:3, reps:12, format:'hypertrophy' },
        { name:'Walking Lunges',      sets:3, reps:12, format:'hypertrophy' },
        { name:'Calf Raise',          sets:4, reps:15, format:'accessory' },
      ]},
      { name:'Push B (כתפיים כבד)', blocks:[
        { lift:'ohp',                sets:4, reps:6,  intensity:0.80, format:'strength' },
        { name:'Dumbbell Bench',      sets:4, reps:10, intensity:0.72, format:'hypertrophy' },
        { name:'Incline Press',       sets:3, reps:10, intensity:0.70, format:'hypertrophy' },
        { name:'Lateral Raise',       sets:5, reps:12, format:'hypertrophy' },
        { name:'Skullcrusher',        sets:3, reps:10, format:'hypertrophy' },
      ]},
      { name:'Pull B (גב רחב)', blocks:[
        { name:'Weighted Pull-ups',   sets:4, reps:6,  format:'strength' },
        { name:'T-Bar Row',           sets:4, reps:8,  format:'hypertrophy' },
        { name:'Lat Pulldown',        sets:3, reps:12, format:'hypertrophy' },
        { name:'Rear Delt Fly',       sets:4, reps:15, format:'hypertrophy' },
        { name:'DB Curl',             sets:4, reps:10, format:'hypertrophy' },
      ]},
      { name:'Legs B (רגליים נפח)', blocks:[
        { name:'Front Squat',         sets:4, reps:8,  intensity:0.72, format:'hypertrophy' },
        { name:'Hip Thrust',          sets:4, reps:10, intensity:0.75, format:'hypertrophy' },
        { name:'Leg Curl',            sets:4, reps:12, format:'hypertrophy' },
        { name:'Bulgarian Split Squat',sets:3, reps:10, format:'hypertrophy' },
        { name:'Standing Calf',       sets:5, reps:12, format:'accessory' },
      ]},
    ],
    notes:['60-90 שניות מנוחה על היפרטרופיה','2-3 דק׳ מנוחה על כוח','העלה משקל כשמסיים את כל הסטים בטווח העליון'],
  },

  gvt: {
    id:'gvt',
    label:'German Volume Training',
    author:'Charles Poliquin',
    origin:'קנדה · שנות ה-90',
    level:'מתקדם',
    goal:'עלייה במסה תוך 6 שבועות',
    daysPerWeek: 3,
    duration: 6,
    schema:'10 סטים × 10 חזרות @ 60% 1RM · 60-90 שניות מנוחה',
    description:'התכנית האגרסיבית ביותר להיפרטרופיה. 100 חזרות ברצף על תרגיל אחד יגרמו לגדילה מטורפת - אבל רק ל-4-6 שבועות ואז לעבור.',
    sessions: [
      { name:'Chest + Back', blocks:[
        { lift:'bench', sets:10, reps:10, intensity:0.60, format:'hypertrophy' },
        { name:'Barbell Row', sets:10, reps:10, intensity:0.60, format:'hypertrophy' },
        { name:'Incline DB Fly', sets:3, reps:12, format:'accessory' },
        { name:'One-arm Row', sets:3, reps:12, format:'accessory' },
      ]},
      { name:'Legs + Abs', blocks:[
        { lift:'squat', sets:10, reps:10, intensity:0.60, format:'hypertrophy' },
        { name:'Lying Leg Curl', sets:10, reps:10, intensity:0.60, format:'hypertrophy' },
        { name:'Calf Raise', sets:3, reps:15, format:'accessory' },
        { name:'Hanging Leg Raise', sets:3, reps:15, format:'accessory' },
      ]},
      { name:'Arms + Shoulders', blocks:[
        { name:'Dips', sets:10, reps:10, format:'hypertrophy' },
        { name:'Chin-ups', sets:10, reps:10, format:'hypertrophy' },
        { lift:'ohp', sets:3, reps:8, intensity:0.72, format:'strength' },
        { name:'Lateral Raise', sets:3, reps:12, format:'accessory' },
      ]},
    ],
    notes:['תנוחו 60-90 שניות בין סטים - שריפה מטורפת','אחרי 6 שבועות - שבועיים deload ולעבור לתכנית אחרת','אכלו הרבה - +500 קק״ל מעל תחזוקה'],
  },

  // ─── CrossFit ─────────────────────────────────────────────────────
  crossfit_wods: {
    id:'crossfit_wods',
    label:'CrossFit - WODs מפורסמים',
    author:'CrossFit HQ',
    origin:'ארה״ב · 2000',
    level:'מתקדם',
    goal:'MetCon · כוח מגוון · יכולת פונקציונלית',
    daysPerWeek: 5,
    duration: 8,
    schema:'MetCons + Strength + Skill Work',
    description:'התכנית שהתחילה מהפכה - שילוב של כוח אולימפי, ג׳ימנסטיקה, וסבולת. WODs (Workout Of the Day) מפורסמים כמו Fran, Cindy, Murph, ו-Grace.',
    sessions: [
      {
        name:'Fran',
        wodType:'For Time', timeCap: 8,
        prescription:'21-15-9 חזרות של:\n• Thrusters (43 ק״ג גברים / 30 ק״ג נשים)\n• Pull-ups',
        rxTime:'2:30-4:00',
        description:'ה-WOD המפורסם ביותר. סבל טהור של 3-8 דקות. הבנצ׳מרק הראשי.',
        blocks:[
          { name:'Warm-up', prescription:'5 דק׳ חתירה + מוביליטי כתפיים', format:'skill' },
          { name:'Fran', wodType:'For Time', prescription:'21-15-9 Thrusters + Pull-ups', format:'metcon' },
        ],
      },
      {
        name:'Cindy',
        wodType:'AMRAP', timeCap: 20,
        prescription:'AMRAP ב-20 דקות:\n• 5 pull-ups\n• 10 push-ups\n• 15 air squats',
        rxRounds:'15-25 סבבים',
        description:'סיבולת שריר טהורה. משקל גוף בלבד. יעד: 20+ סבבים.',
        blocks:[
          { name:'Warm-up', prescription:'2 סבבים קלים של Cindy', format:'skill' },
          { name:'Cindy', wodType:'AMRAP-20', prescription:'5 pull-ups + 10 push-ups + 15 air squats', format:'metcon' },
        ],
      },
      {
        name:'Murph',
        wodType:'For Time', timeCap: 60,
        prescription:'עם אפוד 20 lb (אופציונלי):\n• ריצה 1 מייל\n• 100 pull-ups\n• 200 push-ups\n• 300 air squats\n• ריצה 1 מייל',
        rxTime:'30-50 דקות',
        description:'ה-Hero WOD המפורסם. לזכר Michael Murphy, סגן ב-Navy SEALs שנפל באפגניסטן 2005.',
        blocks:[
          { name:'Murph', wodType:'For Time', prescription:'1mi run → 100 pull-ups → 200 push-ups → 300 squats → 1mi run', format:'metcon' },
        ],
      },
      {
        name:'Grace',
        wodType:'For Time', timeCap: 10,
        prescription:'30 clean & jerks @ 60 ק״ג (35 ק״ג נשים) - מהר ככל האפשר',
        rxTime:'2:00-5:00',
        description:'בדיקת עצמה + נפש. 30 חזרות של clean & jerk לזמן.',
        blocks:[
          { name:'Warm-up', prescription:'הפעלת ירכיים + כתפיים + טכניקה קלה', format:'skill' },
          { name:'Grace', wodType:'For Time', prescription:'30 clean & jerks @ 60 ק״ג', format:'metcon' },
        ],
      },
      {
        name:'Filthy Fifty',
        wodType:'For Time', timeCap: 30,
        prescription:'50 חזרות של כל אחד:\n• Box jumps 24"\n• Jumping pull-ups\n• KB swings 16 ק״ג\n• Walking lunges\n• Knees to elbows\n• Push press 20 ק״ג\n• Back extensions\n• Wall balls 9 ק״ג\n• Burpees\n• Double-unders',
        rxTime:'20-30 דקות',
        description:'מסוד המפורסם - 500 חזרות של 10 תרגילים.',
        blocks:[
          { name:'Filthy 50', wodType:'For Time', prescription:'50 חזרות של 10 תרגילים ברצף', format:'metcon' },
        ],
      },
    ],
    notes:['תמיד להתחמם לפחות 10 דק׳ לפני WOD','לרשום זמן/סבבים - המדד להתקדמות','גבר\'ל = משקל מלא · Scaled = משקל מותאם'],
  },

  // ─── Olympic ──────────────────────────────────────────────────────
  olympic_beginner: {
    id:'olympic_beginner',
    label:'Olympic Lifting Beginner',
    author:'IWF / USA Weightlifting',
    origin:'עולמי',
    level:'בינוני-מתקדם',
    goal:'הרמות אולימפיות · הספק · דינמיקה',
    daysPerWeek: 4,
    duration: 12,
    schema:'טכניקה + כוח · אחוזים 70-85% מ-Snatch/CJ',
    description:'בסיס להרמות אולימפיות (Snatch + Clean & Jerk). דורש מוביליטי מצוין וטכניקה מדויקת. מומלץ עם מאמן בהתחלה.',
    sessions: [
      { name:'Snatch Day', blocks:[
        { name:'Snatch Complex', prescription:'5×(1 snatch pull + 1 hang snatch + 1 OHS) @ 65%', format:'skill' },
        { name:'Snatch', sets:5, reps:2, intensity:0.75, format:'strength' },
        { name:'Overhead Squat', sets:4, reps:5, intensity:0.75, format:'strength' },
        { name:'Snatch Pulls', sets:4, reps:3, intensity:0.90, format:'strength' },
      ]},
      { name:'Clean Day', blocks:[
        { name:'Clean High Pull', prescription:'5×3 @ 70%', format:'skill' },
        { name:'Clean & Jerk', sets:5, reps:2, intensity:0.75, format:'strength' },
        { lift:'frontsq', sets:5, reps:5, intensity:0.75, format:'strength' },
        { name:'Push Press', sets:4, reps:5, intensity:0.75, format:'strength' },
      ]},
      { name:'Strength Day 1', blocks:[
        { lift:'squat', sets:5, reps:5, intensity:0.80, format:'strength' },
        { name:'Snatch Balance', sets:4, reps:3, intensity:0.70, format:'skill' },
        { name:'RDL', sets:4, reps:8, format:'accessory' },
      ]},
      { name:'Strength Day 2', blocks:[
        { name:'Deadlift', sets:5, reps:3, intensity:0.85, format:'strength' },
        { name:'Jerk from Rack', sets:5, reps:2, intensity:0.80, format:'strength' },
        { name:'Overhead Squat', sets:3, reps:5, intensity:0.70, format:'strength' },
      ]},
    ],
    notes:['תמיד להתחמם עם המוט הריק 3-5 סטים','אין sets to failure - טכניקה מעל הכל','להקליט את עצמך ולבדוק טכניקה'],
  },
}

// Programs grouped by category for UI
export const programCategories = [
  { id:'beginner', label:'מתחילים', programs:['starting_strength','stronglifts_5x5'] },
  { id:'strength', label:'כוח מירבי', programs:['wendler_531','sheiko'] },
  { id:'hypertrophy', label:'מסת שריר', programs:['ppl_hypertrophy','gvt'] },
  { id:'crossfit', label:'CrossFit', programs:['crossfit_wods'] },
  { id:'olympic', label:'אולימפי', programs:['olympic_beginner'] },
]

// Round barbell weight to nearest 2.5kg (standard plate math)
export function roundToPlate(kg) {
  if (!kg) return 0
  return Math.round(kg / 2.5) * 2.5
}

// Given user 1RM values and a block, compute recommended weight in kg.
// Returns null if 1RM unknown for that lift.
export function computeWeight(block, oneRMs) {
  const liftKey = block.lift
  if (!liftKey) return null
  const orm = oneRMs?.[liftKey]
  if (!orm) return null
  const intensity = Array.isArray(block.intensity) ? block.intensity[0] : block.intensity
  if (!intensity) return null
  return roundToPlate(orm * intensity)
}

// Prescription formatter - if it's a strength lift with intensity, expand to
// something like "5×5 @ 75% (60kg)". Otherwise return raw prescription.
export function formatPrescription(block, oneRMs) {
  if (block.prescription) return block.prescription
  if (block.sets && block.reps) {
    const intensity = Array.isArray(block.intensity) ? block.intensity[0] : block.intensity
    const weight = computeWeight(block, oneRMs)
    const pctStr = intensity ? ` @ ${Math.round(intensity * 100)}%` : ''
    const wStr = weight ? ` (${weight} ק״ג)` : intensity ? ' — הגדר 1RM' : ''
    return `${block.sets}×${block.reps}${pctStr}${wStr}`
  }
  return '—'
}
