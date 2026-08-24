// Bodybuilding exercise catalog — the reference app-style.
// Each exercise = name + (equipment variant) as a separate entry, with:
//   • primaryMuscle (single) + secondaryMuscles (array)
//   • equipment enum
//   • 7-step "how to" instructions (matches the reference app's numbered format)
//   • rmPercentages (for %1RM prescription)
//   • contraindications (matches state.profile.injuries keys)
//
// Coverage: ~280 exercises across 20 muscle groups, all major equipment.
// Alphabetical A-Z sort is the default browse order (like the reference app).
// Muscle-group filter uses primaryMuscle. Search uses he+en.

export const MUSCLE_GROUPS = {
  upper: {
    label: 'Upper Body', he: 'פלג גוף עליון',
    muscles: {
      abdominals:  { he: 'בטן', en: 'Abdominals' },
      biceps:      { he: 'יד קדמית', en: 'Biceps' },
      chest:       { he: 'חזה', en: 'Chest' },
      forearms:    { he: 'אמות', en: 'Forearms' },
      lats:        { he: 'רחבים', en: 'Lats' },
      lower_back:  { he: 'גב תחתון', en: 'Lower Back' },
      neck:        { he: 'צוואר', en: 'Neck' },
      shoulders:   { he: 'כתפיים', en: 'Shoulders' },
      traps:       { he: 'טרפז', en: 'Traps' },
      triceps:     { he: 'יד אחורית', en: 'Triceps' },
      upper_back:  { he: 'גב עליון', en: 'Upper Back' },
    },
  },
  lower: {
    label: 'Lower Body', he: 'פלג גוף תחתון',
    muscles: {
      abductors:   { he: 'מרחיקי ירך', en: 'Abductors' },
      adductors:   { he: 'מקרבי ירך', en: 'Adductors' },
      calves:      { he: 'שוקיים', en: 'Calves' },
      glutes:      { he: 'ישבן', en: 'Glutes' },
      hamstrings:  { he: 'האמסטרינג', en: 'Hamstrings' },
      quadriceps:  { he: 'קוואדריצפס', en: 'Quadriceps' },
    },
  },
  other: {
    label: 'Other', he: 'אחר',
    muscles: {
      cardio:     { he: 'קרדיו', en: 'Cardio' },
      full_body:  { he: 'גוף מלא', en: 'Full Body' },
      other:      { he: 'אחר', en: 'Other' },
    },
  },
}

export const EQUIPMENT = {
  barbell:       { he: 'מוט משקולות', icon: '' },
  dumbbell:      { he: 'משקולות יד', icon: '' },
  cable:         { he: 'כבל', icon: '' },
  machine:       { he: 'מכונה', icon: '' },
  smith_machine: { he: 'סמית מכונה', icon: '' },
  kettlebell:    { he: 'קטלבל', icon: '' },
  band:          { he: 'גומייה', icon: '' },
  suspension:    { he: 'רצועות TRX', icon: '' },
  bodyweight:    { he: 'משקל גוף', icon: '' },
  ez_bar:        { he: 'EZ Bar', icon: '〰️' },
  ring:          { he: 'טבעות', icon: '⭕' },
  plate:         { he: 'פלטה', icon: '' },
  none:          { he: 'ללא', icon: '—' },
}

// Compact builder to keep the catalog readable
// `name` is what the app shows, and it is the English one — see
// data/movementName.js for why. `he` stays on the record so Hebrew typing
// still finds the exercise in search; it is never rendered.
const ex = (id, he, en, primary, opts = {}) => ({
  id, he, en,
  name: en,
  primaryMuscle: primary,
  secondaryMuscles: opts.secondary || [],
  equipment: opts.equipment || 'bodyweight',
  category: opts.category || 'accessory',
  ytId: opts.ytId || null,
  cues: opts.cues || null,      // 7 numbered steps (Hebrew)
  contraindications: opts.contra || [],
  rmPercentages: opts.rm || [65, 70, 75, 80, 85],
  tags: opts.tags || [],
})

// Standard cue templates (reused across variants of the same movement)
const CUE_TEMPLATES = {
  bench_press: [
    'שכיבה על הספסל, עיניים תחת המוט',
    'אחיזה מעט רחבה מרוחב כתפיים, אצבע הבוהן עוטפת מסביב',
    'שכמות נמשכות אחורה ולמטה - "נעולות" בספסל',
    'קשת קלה בגב תחתון, רגליים שטוחות על הרצפה',
    'שאיפה עמוקה, שחרר את המוט מהמעמד והביא לגובה החזה',
    'הורד את המוט לגובה הפטמות במסלול מבוקר',
    'דחיפה חזרה למעלה עד שהמרפקים נעולים - נשיפה בסוף',
  ],
  squat: [
    'עמידה ברוחב כתפיים, אצבעות פונות מעט החוצה',
    'מוט על הטרפז (High Bar) או על הדלטואיד האחורי (Low Bar)',
    'שאיפה עמוקה, הידוק ליבה, נעילת שכמות',
    'ירידה של הישבן אחורה ומטה, ברכיים בכיוון האצבעות',
    'רדת עד שהירכיים מקבילות לרצפה או מתחת',
    'דחיפה דרך העקבים חזרה למעלה',
    'נעילת ברכיים בעדינות בסוף, נשיפה',
  ],
  deadlift: [
    'עמידה ברוחב אגן, המוט מעל אמצע כף הרגל',
    'תפיסת המוט ברוחב כתפיים, ידיים מחוץ לרגליים',
    'ירידה עם ישבן אחורה - חזה למעלה, גב ישר',
    'הידוק ליבה, שאיפה עמוקה, "לחץ את הרצפה עם הרגליים"',
    'הרם את המוט צמוד לרגליים, ירכיים ובבחלץ עולים ביחד',
    'נעילת ירכיים בסוף - עמידה מלאה, כתפיים אחורה',
    'הורד את המוט חזרה בשליטה, ישבן אחורה קודם',
  ],
  overhead_press: [
    'עמידה זקופה, מוט מונח על הכתפיים הקדמיות',
    'ידיים ברוחב כתפיים, מרפקים מעט קדימה',
    'הידוק ליבה וישבן, שאיפה',
    'דחיפה של המוט מעל הראש במסלול ישר',
    'ראש "בורח קדימה" כשהמוט עובר את המצח',
    'נעילת מרפקים בסוף, אוזניים בין הזרועות',
    'הורד את המוט חזרה לכתפיים בשליטה - נשיפה',
  ],
  row: [
    'התכופפות עם ישבן אחורה, גב ישר, זווית 45°',
    'אחיזת המוט/משקולות בידיים ישרות',
    'הידוק ליבה, שכמות נעולות',
    'משוך את המוט לכיוון הבטן התחתונה',
    'מרפקים נעים אחורה ולמעלה, לא החוצה',
    'עצירה קצרה בשיא ההתכווצות',
    'החזר בשליטה למצב התחלה - נשיפה',
  ],
  curl: [
    'עמידה זקופה, זרועות לצידי הגוף',
    'אחיזת המשקל, כפות ידיים כלפי מעלה (סופיניציה)',
    'מרפקים צמודים לצלעות - לא זזים!',
    'כיפוף המרפק ומשיכת המשקל למעלה',
    'עצירה בשיא, "כווץ" את הביצפס',
    'הורדה איטית ומבוקרת בחזרה',
    'לא לנדנד עם הגוף - תנועה נקייה בלבד',
  ],
  extension: [
    'שכיבה על הספסל / עמידה - תלוי בגרסה',
    'אחיזת המשקל מעל הראש בזרועות ישרות',
    'מרפקים צמודים - לא זזים החוצה',
    'הורדת המשקל אחורה במעגל סביב המרפקים',
    'עצירה קצרה כשהמשקל ליד המצח',
    'החזרה למעלה על ידי מתיחת המרפקים בלבד',
    'ריכוז מלא בטריצפס, לא בכתפיים',
  ],
  fly: [
    'שכיבה על הספסל, משקולות ישרות מעל החזה',
    'ידיים בכיפוף קל ומקובע במרפקים',
    'הורדה איטית של הידיים לצדדים בקשת',
    'ירידה עד שהחזה מרגיש מתיחה טובה',
    'עצירה קצרה, שמור על הכיפוף במרפק',
    'חזרה למעלה באותו מסלול קשתי',
    'ריכוז בחזה, לא בכתפיים או בטריצפס',
  ],
  pulldown: [
    'ישיבה מתחת למוט, ירכיים מקובעות תחת הכריות',
    'אחיזה רחבה בהיקף - כפות ידיים קדימה',
    'שכמות למטה ואחורה - "לפני" ההתחלה',
    'משיכת המוט לחזה העליון (לא לצוואר!)',
    'מרפקים נעים אחורה ולמטה, לא רק למטה',
    'עצירה קצרה עם המוט קרוב לחזה',
    'שחרור איטי חזרה למעלה, שכמות בשליטה',
  ],
}

// Generic cues fallback for variants
const genericCues = (movement) => CUE_TEMPLATES[movement] || [
  'עמדת מוצא יציבה, ליבה מהודקת',
  'אחיזה נכונה של הציוד',
  'שאיפה עמוקה לפני התנועה',
  'ביצוע התנועה בשליטה מלאה',
  'עצירה קצרה בשיא ההתכווצות',
  'החזרה למצב התחלה בהאטה',
  'נשיפה בסוף כל חזרה',
]

export const EXERCISES = [
  // ═══════════════════════════════════════════════════════════════
  //  A
  // ═══════════════════════════════════════════════════════════════
  ex('21s_bicep_curl',       '21 כפיפות מרפק', '21s Bicep Curl', 'biceps', { equipment: 'barbell', secondary: ['forearms'], ytId: '_1BozIQvUt8', cues: genericCues('curl') }),
  ex('ab_scissors',          'מספריים בטן', 'Ab Scissors', 'abdominals', { equipment: 'bodyweight' }),
  ex('ab_wheel',             'גלגל בטן', 'Ab Wheel', 'abdominals', { equipment: 'bodyweight', secondary: ['shoulders'] }),
  ex('aerobics',             'אירובי', 'Aerobics', 'cardio', { equipment: 'bodyweight' }),
  ex('air_bike',             'אופני אוויר', 'Air Bike', 'cardio', { equipment: 'machine' }),
  ex('arnold_press',         'לחיצת ארנולד', 'Arnold Press (Dumbbell)', 'shoulders', { equipment: 'dumbbell', secondary: ['triceps'], ytId: 'vj2w851ZHRM' }),
  ex('around_the_world',     'אראונד דה וורלד', 'Around The World', 'chest', { equipment: 'dumbbell', secondary: ['shoulders'] }),
  ex('assisted_pistol',      'סקוואט פיסטול נעזר', 'Assisted Pistol Squats', 'quadriceps', { equipment: 'bodyweight', secondary: ['glutes'] }),

  // ═══════════════════════════════════════════════════════════════
  //  B
  // ═══════════════════════════════════════════════════════════════
  ex('back_ext_hyper',       'הרחבת גב', 'Back Extension (Hyperextension)', 'lower_back', { equipment: 'machine', secondary: ['glutes', 'hamstrings'], contra: ['lower_back'] }),
  ex('back_ext_machine',     'הרחבת גב במכונה', 'Back Extension (Machine)', 'lower_back', { equipment: 'machine', contra: ['lower_back'] }),
  ex('back_ext_weighted',    'הרחבת גב במשקל', 'Back Extension (Weighted)', 'lower_back', { equipment: 'plate', secondary: ['glutes', 'hamstrings'], contra: ['lower_back'] }),
  ex('ball_slams',           'הטלת כדור לרצפה', 'Ball Slams', 'full_body', { equipment: 'bodyweight' }),
  ex('band_pullaparts',      'הפרדה עם גומייה', 'Band Pullaparts', 'shoulders', { equipment: 'band', secondary: ['upper_back'] }),
  ex('battle_ropes',         'חבלי קרב', 'Battle Ropes', 'cardio', { equipment: 'none', secondary: ['shoulders'] }),
  ex('bear_crawl',           'זחילת דוב', 'Bear Crawl', 'full_body', { equipment: 'bodyweight' }),
  ex('behind_back_curl_c',   'כפיפת מרפק מאחור', 'Behind the Back Curl (Cable)', 'biceps', { equipment: 'cable' }),
  ex('behind_back_wrist_bb', 'כפיפת שורש כף היד מאחור', 'Behind the Back Wrist Curl (Barbell)', 'forearms', { equipment: 'barbell' }),
  ex('belt_squat',           'סקוואט חגורה', 'Belt Squat (Machine)', 'quadriceps', { equipment: 'machine', secondary: ['glutes'] }),
  ex('bench_dip',            'טבילת ספסל', 'Bench Dip', 'triceps', { equipment: 'bodyweight', secondary: ['shoulders'] }),

  // Bench Press variants (core compound)
  ex('bench_press_bb',       'לחיצת חזה', 'Bench Press (Barbell)', 'chest', { equipment: 'barbell', secondary: ['triceps', 'shoulders'], category: 'compound_push', ytId: 'gRVjAtPip0Y', cues: CUE_TEMPLATES.bench_press, contra: ['shoulder'], rm: [65, 70, 75, 80, 85, 90] }),
  ex('bench_press_db',       'לחיצת חזה עם דמבל', 'Bench Press (Dumbbell)', 'chest', { equipment: 'dumbbell', secondary: ['triceps', 'shoulders'], category: 'compound_push', ytId: 'VmB1G1K7v94', cues: CUE_TEMPLATES.bench_press, contra: ['shoulder'] }),
  ex('bench_press_smith',    'לחיצת חזה בסמית', 'Bench Press (Smith Machine)', 'chest', { equipment: 'smith_machine', secondary: ['triceps', 'shoulders'], cues: CUE_TEMPLATES.bench_press, contra: ['shoulder'] }),
  ex('bench_press_cable',    'לחיצת חזה בכבל', 'Bench Press (Cable)', 'chest', { equipment: 'cable', secondary: ['triceps', 'shoulders'], cues: CUE_TEMPLATES.bench_press, contra: ['shoulder'] }),
  ex('bench_press_close',    'לחיצת חזה אחיזה צרה', 'Bench Press - Close Grip (Barbell)', 'triceps', { equipment: 'barbell', secondary: ['chest', 'shoulders'], ytId: 'nEF0bv2FW94', cues: CUE_TEMPLATES.bench_press }),
  ex('bench_press_wide',     'לחיצת חזה אחיזה רחבה', 'Bench Press - Wide Grip (Barbell)', 'chest', { equipment: 'barbell', secondary: ['shoulders'], cues: CUE_TEMPLATES.bench_press, contra: ['shoulder'] }),

  // Bent Over Row variants
  ex('bent_over_row_bb',     'חתירת בנט אובר', 'Bent Over Row (Barbell)', 'upper_back', { equipment: 'barbell', secondary: ['biceps', 'lats'], category: 'compound_pull', ytId: 'FWJR5Ve8bnQ', cues: CUE_TEMPLATES.row, contra: ['lower_back'] }),
  ex('bent_over_row_db',     'חתירת בנט אובר עם דמבל', 'Bent Over Row (Dumbbell)', 'upper_back', { equipment: 'dumbbell', secondary: ['biceps', 'lats'], cues: CUE_TEMPLATES.row }),
  ex('bent_over_row_band',   'חתירת בנט אובר עם גומייה', 'Bent Over Row (Band)', 'upper_back', { equipment: 'band', secondary: ['biceps'] }),
  ex('bent_over_row_smith',  'חתירת בנט אובר בסמית', 'Bent Over Row (Smith Machine)', 'upper_back', { equipment: 'smith_machine', secondary: ['biceps'], cues: CUE_TEMPLATES.row }),

  // Bicep Curl variants
  ex('bicep_curl_bb',        'כפיפת מרפק', 'Bicep Curl (Barbell)', 'biceps', { equipment: 'barbell', secondary: ['forearms'], ytId: 'JnLFSFurrqQ', cues: CUE_TEMPLATES.curl }),
  ex('bicep_curl_db',        'כפיפת מרפק עם דמבל', 'Bicep Curl (Dumbbell)', 'biceps', { equipment: 'dumbbell', secondary: ['forearms'], ytId: 'ykJmrZ5v0Oo', cues: CUE_TEMPLATES.curl }),
  ex('bicep_curl_cable',     'כפיפת מרפק בכבל', 'Bicep Curl (Cable)', 'biceps', { equipment: 'cable', cues: CUE_TEMPLATES.curl }),
  ex('bicep_curl_susp',      'כפיפת מרפק ברצועות', 'Bicep Curl (Suspension)', 'biceps', { equipment: 'suspension' }),
  ex('bicycle_crunch',       'כפיפות אופניים', 'Bicycle Crunch', 'abdominals', { equipment: 'bodyweight' }),
  ex('bicycle_crunch_raised','כפיפות אופניים רגליים מורמות', 'Bicycle Crunch Raised Legs', 'abdominals', { equipment: 'bodyweight' }),
  ex('bird_dog',             'ציפור כלב', 'Bird Dog', 'lower_back', { equipment: 'bodyweight', secondary: ['glutes', 'abdominals'] }),
  ex('box_jump',             'קפיצת ארגז', 'Box Jump', 'quadriceps', { equipment: 'bodyweight', secondary: ['glutes', 'calves'], contra: ['knee', 'ankle'] }),
  ex('box_squat_bb',         'סקוואט ארגז', 'Box Squat (Barbell)', 'quadriceps', { equipment: 'barbell', secondary: ['glutes', 'hamstrings'], cues: CUE_TEMPLATES.squat }),
  ex('boxing',               'איגרוף', 'Boxing', 'cardio', { equipment: 'none', secondary: ['shoulders'] }),
  ex('bulgarian_split_bb',   'בולגרי סקוואט', 'Bulgarian Split Squat (Barbell)', 'quadriceps', { equipment: 'barbell', secondary: ['glutes', 'hamstrings'] }),
  ex('bulgarian_split_db',   'בולגרי סקוואט דמבל', 'Bulgarian Split Squat (Dumbbell)', 'quadriceps', { equipment: 'dumbbell', secondary: ['glutes', 'hamstrings'], ytId: '2C-uNgKwPLE' }),
  ex('burpee',               'בורפי', 'Burpee', 'full_body', { equipment: 'bodyweight', secondary: ['chest', 'quadriceps'] }),
  ex('burpee_broad_jumps',   'בורפי עם קפיצה קדימה', 'Burpee Broad Jumps', 'full_body', { equipment: 'bodyweight' }),
  ex('burpee_over_bar',      'בורפי מעל המוט', 'Burpee Over the Bar', 'full_body', { equipment: 'barbell' }),
  ex('butterfly',            'פרפר (Pec Deck)', 'Butterfly (Pec Deck)', 'chest', { equipment: 'machine', secondary: ['shoulders'], cues: CUE_TEMPLATES.fly }),

  // ═══════════════════════════════════════════════════════════════
  //  C
  // ═══════════════════════════════════════════════════════════════
  ex('cable_core_pallof',    'לחיצת פאלוף בכבל', 'Cable Core Pallof Press', 'abdominals', { equipment: 'cable' }),
  ex('cable_crunch',          'כפיפות בטן בכבל', 'Cable Crunch', 'abdominals', { equipment: 'cable' }),
  ex('cable_fly_cross',       'צלב בכבל', 'Cable Fly Crossovers', 'chest', { equipment: 'cable', secondary: ['shoulders'], cues: CUE_TEMPLATES.fly }),
  ex('cable_pull_through',    'משיכה דרך הרגליים', 'Cable Pull Through', 'glutes', { equipment: 'cable', secondary: ['hamstrings'] }),
  ex('cable_twist_dtu',       'סיבוב מלמטה למעלה', 'Cable Twist (Down to up)', 'abdominals', { equipment: 'cable' }),
  ex('cable_twist_utd',       'סיבוב מלמעלה למטה', 'Cable Twist (Up to down)', 'abdominals', { equipment: 'cable' }),
  ex('calf_ext_machine',      'הרחבת שוקיים', 'Calf Extension (Machine)', 'calves', { equipment: 'machine' }),
  ex('calf_press_machine',    'לחיצת שוקיים', 'Calf Press (Machine)', 'calves', { equipment: 'machine' }),
  ex('chest_dip',             'טבילות חזה', 'Chest Dip', 'chest', { equipment: 'bodyweight', secondary: ['triceps', 'shoulders'] }),
  ex('chest_dip_assisted',    'טבילות חזה נעזרות', 'Chest Dip (Assisted)', 'chest', { equipment: 'machine', secondary: ['triceps'] }),
  ex('chest_dip_weighted',    'טבילות חזה במשקל', 'Chest Dip (Weighted)', 'chest', { equipment: 'plate', secondary: ['triceps'] }),
  ex('chest_fly_band',        'פליי חזה בגומייה', 'Chest Fly (Band)', 'chest', { equipment: 'band', cues: CUE_TEMPLATES.fly }),
  ex('chest_fly_db',          'פליי חזה בדמבל', 'Chest Fly (Dumbbell)', 'chest', { equipment: 'dumbbell', ytId: 'eozdVDA78K0', cues: CUE_TEMPLATES.fly }),
  ex('chest_fly_machine',     'פליי חזה במכונה', 'Chest Fly (Machine)', 'chest', { equipment: 'machine', cues: CUE_TEMPLATES.fly }),
  ex('chest_fly_susp',        'פליי חזה ברצועות', 'Chest Fly (Suspension)', 'chest', { equipment: 'suspension' }),
  ex('chest_press_band',      'לחיצת חזה בגומייה', 'Chest Press (Band)', 'chest', { equipment: 'band', secondary: ['triceps'] }),
  ex('chest_press_machine',   'לחיצת חזה במכונה', 'Chest Press (Machine)', 'chest', { equipment: 'machine', secondary: ['triceps', 'shoulders'] }),
  ex('chest_supp_incline_row','חתירה משופעת עם תמיכה', 'Chest Supported Incline Row (Dumbbell)', 'upper_back', { equipment: 'dumbbell', secondary: ['biceps'] }),
  ex('chest_supp_reverse_fly','פליי הפוך עם תמיכה', 'Chest Supported Reverse Fly (Dumbbell)', 'shoulders', { equipment: 'dumbbell', secondary: ['upper_back'] }),
  ex('chest_supp_t_bar',      'חתירת T-Bar עם תמיכה', 'Chest Supported T Bar Row', 'upper_back', { equipment: 'machine', secondary: ['biceps'] }),
  ex('chest_supp_y_raise',    'הרמת Y עם תמיכה', 'Chest Supported Y Raise (Dumbbell)', 'shoulders', { equipment: 'dumbbell' }),
  ex('chin_up',               'צ׳ין אפ', 'Chin Up', 'lats', { equipment: 'bodyweight', secondary: ['biceps'], ytId: 'brhRXlOhsAM' }),
  ex('chin_up_assisted',      'צ׳ין אפ נעזר', 'Chin Up (Assisted)', 'lats', { equipment: 'machine', secondary: ['biceps'] }),
  ex('chin_up_weighted',      'צ׳ין אפ במשקל', 'Chin Up (Weighted)', 'lats', { equipment: 'plate', secondary: ['biceps'] }),
  ex('clamshell',             'צדפה', 'Clamshell', 'glutes', { equipment: 'bodyweight', secondary: ['abductors'] }),
  ex('clap_push_ups',         'שכיבות סמיכה במחיאת כף', 'Clap Push Ups', 'chest', { equipment: 'bodyweight', secondary: ['triceps', 'shoulders'] }),
  ex('clean',                 'קלין', 'Clean', 'full_body', { equipment: 'barbell', secondary: ['quadriceps', 'upper_back'] }),
  ex('clean_and_jerk',        'קלין אנד ג׳רק', 'Clean and Jerk', 'full_body', { equipment: 'barbell', secondary: ['shoulders'] }),
  ex('clean_and_press',       'קלין אנד פרס', 'Clean and Press', 'full_body', { equipment: 'barbell', secondary: ['shoulders'] }),
  ex('clean_pull',            'קלין פול', 'Clean Pull', 'full_body', { equipment: 'barbell', secondary: ['upper_back'] }),
  ex('climbing',              'טיפוס', 'Climbing', 'cardio', { equipment: 'none', secondary: ['upper_back'] }),
  ex('concentration_curl',    'כפיפת ריכוז', 'Concentration Curl', 'biceps', { equipment: 'dumbbell', ytId: 'Bwx2s3wRJIY' }),
  ex('cross_body_hammer',     'הצלבת פטיש', 'Cross Body Hammer Curl', 'biceps', { equipment: 'dumbbell', secondary: ['forearms'] }),
  ex('crunch',                'כפיפות בטן', 'Crunch', 'abdominals', { equipment: 'bodyweight', ytId: '5ER5Of3nZg4' }),
  ex('crunch_machine',        'כפיפות בטן במכונה', 'Crunch (Machine)', 'abdominals', { equipment: 'machine' }),
  ex('crunch_weighted',       'כפיפות בטן במשקל', 'Crunch (Weighted)', 'abdominals', { equipment: 'plate' }),
  ex('curtsy_lunge',          'קידה לונג', 'Curtsy Lunge (Dumbbell)', 'quadriceps', { equipment: 'dumbbell', secondary: ['glutes', 'adductors'] }),
  ex('cycling',               'רכיבה על אופניים', 'Cycling', 'cardio', { equipment: 'machine' }),

  // ═══════════════════════════════════════════════════════════════
  //  D
  // ═══════════════════════════════════════════════════════════════
  ex('dead_bug',              'חיפושית מתה', 'Dead Bug', 'abdominals', { equipment: 'bodyweight' }),
  ex('dead_hang',             'תלייה מתה', 'Dead Hang', 'upper_back', { equipment: 'bodyweight', secondary: ['forearms'] }),

  // Deadlift variants
  ex('deadlift_bb',           'דדליפט', 'Deadlift (Barbell)', 'glutes', { equipment: 'barbell', secondary: ['hamstrings', 'lower_back', 'upper_back'], category: 'compound_pull', ytId: 'op9kVnSso6Q', cues: CUE_TEMPLATES.deadlift, contra: ['lower_back'], rm: [70, 75, 80, 85, 90, 95] }),
  ex('deadlift_db',           'דדליפט עם דמבל', 'Deadlift (Dumbbell)', 'glutes', { equipment: 'dumbbell', secondary: ['hamstrings', 'lower_back'], cues: CUE_TEMPLATES.deadlift, contra: ['lower_back'] }),
  ex('deadlift_band',         'דדליפט עם גומייה', 'Deadlift (Band)', 'glutes', { equipment: 'band', secondary: ['hamstrings'] }),
  ex('deadlift_smith',        'דדליפט בסמית', 'Deadlift (Smith Machine)', 'glutes', { equipment: 'smith_machine', secondary: ['hamstrings'], cues: CUE_TEMPLATES.deadlift }),
  ex('deadlift_trap',         'דדליפט בטראפ בר', 'Deadlift (Trap bar)', 'glutes', { equipment: 'barbell', secondary: ['hamstrings', 'quadriceps'], cues: CUE_TEMPLATES.deadlift }),
  ex('deadlift_high_pull',    'דדליפט משיכה גבוהה', 'Deadlift High Pull', 'full_body', { equipment: 'barbell', secondary: ['upper_back', 'shoulders'] }),

  // Decline bench variants
  ex('decline_bb',            'לחיצת חזה בהטיה', 'Decline Bench Press (Barbell)', 'chest', { equipment: 'barbell', secondary: ['triceps'], cues: CUE_TEMPLATES.bench_press }),
  ex('decline_db',            'לחיצת חזה בהטיה דמבל', 'Decline Bench Press (Dumbbell)', 'chest', { equipment: 'dumbbell', secondary: ['triceps'] }),
  ex('decline_machine',       'לחיצת חזה בהטיה במכונה', 'Decline Bench Press (Machine)', 'chest', { equipment: 'machine', secondary: ['triceps'] }),
  ex('decline_smith',         'לחיצת חזה בהטיה בסמית', 'Decline Bench Press (Smith Machine)', 'chest', { equipment: 'smith_machine', secondary: ['triceps'] }),
  ex('decline_chest_fly',     'פליי חזה בהטיה', 'Decline Chest Fly (Dumbbell)', 'chest', { equipment: 'dumbbell', cues: CUE_TEMPLATES.fly }),
  ex('decline_crunch',        'כפיפות בטן בהטיה', 'Decline Crunch', 'abdominals', { equipment: 'bodyweight' }),
  ex('decline_crunch_wt',     'כפיפות בטן בהטיה במשקל', 'Decline Crunch (Weighted)', 'abdominals', { equipment: 'plate' }),
  ex('decline_push_up',       'שכיבות סמיכה בהטיה', 'Decline Push Up', 'chest', { equipment: 'bodyweight', secondary: ['shoulders'] }),
  ex('diamond_push_up',       'שכיבות יהלום', 'Diamond Push Up', 'triceps', { equipment: 'bodyweight', secondary: ['chest'] }),
  ex('downward_dog',          'כלב פונה מטה', 'Downward Dog', 'full_body', { equipment: 'bodyweight' }),
  ex('drag_curl',             'כפיפת גרירה', 'Drag Curl', 'biceps', { equipment: 'barbell' }),
  ex('dragon_flag',           'דגל הדרקון', 'Dragon Flag', 'abdominals', { equipment: 'bodyweight' }),
  ex('dragonfly',             'שפירית', 'Dragonfly', 'abdominals', { equipment: 'bodyweight' }),
  ex('dumbbell_row',          'חתירה בדמבל', 'Dumbbell Row', 'lats', { equipment: 'dumbbell', secondary: ['biceps', 'upper_back'], ytId: 'roCP6wCXPqo', cues: CUE_TEMPLATES.row }),
  ex('dumbbell_snatch',       'סנאץ׳ דמבל', 'Dumbbell Snatch', 'full_body', { equipment: 'dumbbell', secondary: ['shoulders'] }),
  ex('dumbbell_squeeze_press','לחיצה עם לחיצה דמבל', 'Dumbbell Squeeze Press', 'chest', { equipment: 'dumbbell', secondary: ['triceps'] }),

  // ═══════════════════════════════════════════════════════════════
  //  E
  // ═══════════════════════════════════════════════════════════════
  ex('elbow_to_knee',         'מרפק לברך', 'Elbow to Knee', 'abdominals', { equipment: 'bodyweight' }),
  ex('elliptical',            'אליפטי', 'Elliptical Trainer', 'cardio', { equipment: 'machine' }),
  ex('ez_bar_curl',           'כפיפת EZ Bar', 'EZ Bar Biceps Curl', 'biceps', { equipment: 'ez_bar', secondary: ['forearms'], ytId: 'v_g0ol9SG-o', cues: CUE_TEMPLATES.curl }),

  // ═══════════════════════════════════════════════════════════════
  //  F
  // ═══════════════════════════════════════════════════════════════
  ex('face_pull',             'משיכת פנים', 'Face Pull', 'shoulders', { equipment: 'cable', secondary: ['upper_back'], ytId: 'rep-qVOkqgk' }),
  ex('farmers_walk',          'הליכת חקלאי', 'Farmers Walk', 'full_body', { equipment: 'dumbbell', secondary: ['forearms', 'traps'] }),
  ex('feet_up_bench_bb',      'לחיצה רגליים למעלה', 'Feet Up Bench Press (Barbell)', 'chest', { equipment: 'barbell', secondary: ['triceps'] }),
  ex('fire_hydrants',         'ברז אש', 'Fire Hydrants', 'glutes', { equipment: 'bodyweight', secondary: ['abductors'] }),
  ex('floor_press_bb',        'לחיצת רצפה', 'Floor Press (Barbell)', 'chest', { equipment: 'barbell', secondary: ['triceps'] }),
  ex('floor_press_db',        'לחיצת רצפה דמבל', 'Floor Press (Dumbbell)', 'chest', { equipment: 'dumbbell', secondary: ['triceps'] }),
  ex('floor_tricep_dip',      'טבילת טריצפס רצפה', 'Floor Triceps Dip', 'triceps', { equipment: 'bodyweight' }),
  ex('flutter_kicks',         'בעיטות מסלסלות', 'Flutter Kicks', 'abdominals', { equipment: 'bodyweight' }),
  ex('frog_jumps',            'קפיצות צפרדע', 'Frog Jumps', 'quadriceps', { equipment: 'bodyweight' }),
  ex('frog_pumps_db',         'צפרדע פאמפ', 'Frog Pumps (Dumbbell)', 'glutes', { equipment: 'dumbbell' }),
  ex('front_lever_hold',      'פרונט לבר הולד', 'Front Lever Hold', 'full_body', { equipment: 'bodyweight', secondary: ['lats', 'abdominals'] }),
  ex('front_lever_raise',     'פרונט לבר', 'Front Lever Raise', 'full_body', { equipment: 'bodyweight', secondary: ['lats'] }),

  // Front Raise variants
  ex('front_raise_band',      'הרמה קדמית גומייה', 'Front Raise (Band)', 'shoulders', { equipment: 'band' }),
  ex('front_raise_bb',        'הרמה קדמית מוט', 'Front Raise (Barbell)', 'shoulders', { equipment: 'barbell' }),
  ex('front_raise_cable',     'הרמה קדמית כבל', 'Front Raise (Cable)', 'shoulders', { equipment: 'cable' }),
  ex('front_raise_db',        'הרמה קדמית דמבל', 'Front Raise (Dumbbell)', 'shoulders', { equipment: 'dumbbell', ytId: 'sxeY3aMSbxA' }),
  ex('front_raise_susp',      'הרמה קדמית רצועות', 'Front Raise (Suspension)', 'shoulders', { equipment: 'suspension' }),
  ex('front_squat',           'סקוואט קדמי', 'Front Squat', 'quadriceps', { equipment: 'barbell', secondary: ['glutes', 'upper_back'], category: 'compound_leg', ytId: 'tlfahNdNPPI', cues: CUE_TEMPLATES.squat, contra: ['knee'] }),
  ex('full_squat',            'סקוואט מלא', 'Full Squat', 'quadriceps', { equipment: 'barbell', secondary: ['glutes'], cues: CUE_TEMPLATES.squat }),

  // ═══════════════════════════════════════════════════════════════
  //  G
  // ═══════════════════════════════════════════════════════════════
  ex('glute_bridge',          'גשר ישבן', 'Glute Bridge', 'glutes', { equipment: 'bodyweight', secondary: ['hamstrings'] }),
  ex('glute_bridge_bb',       'גשר ישבן במוט', 'Glute Bridge (Barbell)', 'glutes', { equipment: 'barbell', secondary: ['hamstrings'] }),
  ex('glute_ham_raise',       'הרמת ישבן-האמסטרינג', 'Glute Ham Raise', 'hamstrings', { equipment: 'machine', secondary: ['glutes'] }),
  ex('glute_kickback_m',      'בעיטת ישבן במכונה', 'Glute Kickback (Machine)', 'glutes', { equipment: 'machine' }),
  ex('glute_kickback_floor',  'בעיטת ישבן ברצפה', 'Glute Kickback on Floor', 'glutes', { equipment: 'bodyweight' }),
  ex('goblet_squat',          'סקוואט גובלט', 'Goblet Squat', 'quadriceps', { equipment: 'dumbbell', secondary: ['glutes'], ytId: 'MxsFDhcyFyE' }),
  ex('good_morning',          'בוקר טוב', 'Good Morning (Barbell)', 'hamstrings', { equipment: 'barbell', secondary: ['glutes', 'lower_back'], contra: ['lower_back'] }),
  ex('gorilla_row',           'חתירת גורילה', 'Gorilla Row (Kettlebell)', 'upper_back', { equipment: 'kettlebell', secondary: ['biceps'] }),

  // ═══════════════════════════════════════════════════════════════
  //  H
  // ═══════════════════════════════════════════════════════════════
  ex('hack_squat_m',          'סקוואט האק', 'Hack Squat (Machine)', 'quadriceps', { equipment: 'machine', secondary: ['glutes'] }),
  ex('hammer_curl_band',      'פטיש גומייה', 'Hammer Curl (Band)', 'biceps', { equipment: 'band' }),
  ex('hammer_curl_cable',     'פטיש כבל', 'Hammer Curl (Cable)', 'biceps', { equipment: 'cable' }),
  ex('hammer_curl_db',        'פטיש דמבל', 'Hammer Curl (Dumbbell)', 'biceps', { equipment: 'dumbbell', secondary: ['forearms'], ytId: 'zC3nLlEvin4' }),
  ex('handstand_hold',        'עמידת ידיים', 'Handstand Hold', 'full_body', { equipment: 'bodyweight', secondary: ['shoulders'] }),
  ex('handstand_push_up',     'לחיצה בעמידת ידיים', 'Handstand Push Up', 'shoulders', { equipment: 'bodyweight', secondary: ['triceps'] }),
  ex('hang_clean',            'האנג קלין', 'Hang Clean', 'full_body', { equipment: 'barbell', secondary: ['quadriceps'] }),
  ex('hang_snatch',           'האנג סנאץ׳', 'Hang Snatch', 'full_body', { equipment: 'barbell', secondary: ['shoulders'] }),
  ex('heel_taps',             'נקישות עקב', 'Heel Taps', 'abdominals', { equipment: 'bodyweight' }),
  ex('hex_press',             'לחיצת הקס', 'Hex Press (Dumbbell)', 'chest', { equipment: 'dumbbell', secondary: ['triceps'] }),
  ex('high_knee_skips',       'ריצה עם ברכיים גבוהות', 'High Knee Skips', 'full_body', { equipment: 'bodyweight' }),
  ex('high_knees',            'ברכיים גבוהות', 'High Knees', 'cardio', { equipment: 'bodyweight' }),
  ex('hiit',                  'HIIT', 'HIIT', 'cardio', { equipment: 'none' }),
  ex('hiking',                'טיולים', 'Hiking', 'cardio', { equipment: 'none' }),
  ex('hip_abduction_c',       'מרחיקי ירך כבל', 'Hip Abduction (Cable)', 'abductors', { equipment: 'cable' }),
  ex('hip_abduction_m',       'מרחיקי ירך במכונה', 'Hip Abduction (Machine)', 'abductors', { equipment: 'machine' }),
  ex('hip_adduction_c',       'מקרבי ירך כבל', 'Hip Adduction (Cable)', 'adductors', { equipment: 'cable' }),
  ex('hip_adduction_m',       'מקרבי ירך במכונה', 'Hip Adduction (Machine)', 'adductors', { equipment: 'machine' }),

  // Hip Thrust variants
  ex('hip_thrust_bw',         'היפ תראסט', 'Hip Thrust', 'glutes', { equipment: 'bodyweight', secondary: ['hamstrings'] }),
  ex('hip_thrust_bb',         'היפ תראסט מוט', 'Hip Thrust (Barbell)', 'glutes', { equipment: 'barbell', secondary: ['hamstrings'], ytId: 'LM8XHLYJoYs' }),
  ex('hip_thrust_db',         'היפ תראסט דמבל', 'Hip Thrust (Dumbbell)', 'glutes', { equipment: 'dumbbell', secondary: ['hamstrings'] }),
  ex('hip_thrust_m',          'היפ תראסט במכונה', 'Hip Thrust (Machine)', 'glutes', { equipment: 'machine', secondary: ['hamstrings'] }),
  ex('hip_thrust_smith',      'היפ תראסט בסמית', 'Hip Thrust (Smith Machine)', 'glutes', { equipment: 'smith_machine' }),
  ex('hollow_rock',           'הולו רוק', 'Hollow Rock', 'abdominals', { equipment: 'bodyweight' }),

  // ═══════════════════════════════════════════════════════════════
  //  I
  // ═══════════════════════════════════════════════════════════════
  ex('incline_bench_bb',      'לחיצה משופעת', 'Incline Bench Press (Barbell)', 'chest', { equipment: 'barbell', secondary: ['triceps', 'shoulders'], ytId: 'jPLdzuHckI8', cues: CUE_TEMPLATES.bench_press }),
  ex('incline_bench_db',      'לחיצה משופעת דמבל', 'Incline Bench Press (Dumbbell)', 'chest', { equipment: 'dumbbell', secondary: ['triceps', 'shoulders'] }),
  ex('incline_bench_smith',   'לחיצה משופעת בסמית', 'Incline Bench Press (Smith Machine)', 'chest', { equipment: 'smith_machine', secondary: ['triceps'] }),
  ex('incline_chest_fly',     'פליי משופע', 'Incline Chest Fly (Dumbbell)', 'chest', { equipment: 'dumbbell', cues: CUE_TEMPLATES.fly }),
  ex('incline_chest_press_m', 'לחיצה משופעת במכונה', 'Incline Chest Press (Machine)', 'chest', { equipment: 'machine', secondary: ['triceps'] }),
  ex('incline_push_ups',      'שכיבות משופעות', 'Incline Push Ups', 'chest', { equipment: 'bodyweight' }),
  ex('inverted_row',          'חתירה הפוכה', 'Inverted Row', 'upper_back', { equipment: 'bodyweight', secondary: ['biceps'] }),
  ex('iso_chest_press_m',     'לחיצת חזה חד-צדדית', 'Iso-Lateral Chest Press (Machine)', 'chest', { equipment: 'machine', secondary: ['triceps'] }),
  ex('iso_high_row_m',        'חתירה גבוהה חד-צדדית', 'Iso-Lateral High Row (Machine)', 'lats', { equipment: 'machine' }),
  ex('iso_low_row',           'חתירה נמוכה חד-צדדית', 'Iso-Lateral Low Row', 'upper_back', { equipment: 'machine' }),
  ex('iso_row_m',             'חתירה חד-צדדית', 'Iso-Lateral Row (Machine)', 'upper_back', { equipment: 'machine' }),

  // ═══════════════════════════════════════════════════════════════
  //  J
  // ═══════════════════════════════════════════════════════════════
  ex('jack_knife_susp',       'סכין מתקפלת רצועות', 'Jack Knife (Suspension)', 'abdominals', { equipment: 'suspension' }),
  ex('jackknife_sit_up',      'סכין מתקפלת', 'Jackknife Sit Up', 'abdominals', { equipment: 'bodyweight' }),
  ex('jm_press',              'JM פרס', 'JM Press (Barbell)', 'triceps', { equipment: 'barbell' }),
  ex('jump_rope',             'קפיצה בחבל', 'Jump Rope', 'cardio', { equipment: 'none' }),
  ex('jump_shrug',            'הרמת כתפיים בקפיצה', 'Jump Shrug', 'traps', { equipment: 'barbell' }),
  ex('jump_squat',            'סקוואט קפיצה', 'Jump Squat', 'quadriceps', { equipment: 'bodyweight', secondary: ['glutes'] }),
  ex('jumping_jack',          'קפיצות מספריים', 'Jumping Jack', 'cardio', { equipment: 'bodyweight' }),
  ex('jumping_lunge',         'לונג בקפיצה', 'Jumping Lunge', 'quadriceps', { equipment: 'bodyweight' }),

  // ═══════════════════════════════════════════════════════════════
  //  K
  // ═══════════════════════════════════════════════════════════════
  ex('kb_around_world',       'קטלבל סביב העולם', 'Kettlebell Around the World', 'shoulders', { equipment: 'kettlebell' }),
  ex('kb_clean',              'קלין קטלבל', 'Kettlebell Clean', 'full_body', { equipment: 'kettlebell' }),
  ex('kb_curl',               'כפיפת קטלבל', 'Kettlebell Curl', 'biceps', { equipment: 'kettlebell' }),
  ex('kb_goblet_squat',       'סקוואט גובלט קטלבל', 'Kettlebell Goblet Squat', 'quadriceps', { equipment: 'kettlebell', secondary: ['glutes'] }),
  ex('kb_halo',               'קטלבל הלו', 'Kettlebell Halo', 'shoulders', { equipment: 'kettlebell' }),
  ex('kb_high_pull',          'קטלבל משיכה גבוהה', 'Kettlebell High Pull', 'full_body', { equipment: 'kettlebell' }),
  ex('kb_shoulder_press',     'לחיצת כתף קטלבל', 'Kettlebell Shoulder Press', 'shoulders', { equipment: 'kettlebell', secondary: ['triceps'] }),
  ex('kb_snatch',             'סנאץ׳ קטלבל', 'Kettlebell Snatch', 'full_body', { equipment: 'kettlebell', secondary: ['shoulders'] }),
  ex('kb_swing',              'סווינג קטלבל', 'Kettlebell Swing', 'full_body', { equipment: 'kettlebell', secondary: ['glutes', 'hamstrings'], ytId: 'YSxHifyI6s8' }),
  ex('kb_turkish_get_up',     'קטלבל טורקיש גט אפ', 'Kettlebell Turkish Get Up', 'full_body', { equipment: 'kettlebell' }),
  ex('kipping_pull_up',       'משיכה קיפינג', 'Kipping Pull Up', 'lats', { equipment: 'bodyweight', secondary: ['biceps'] }),
  ex('knee_raise_bars',       'הרמת ברכיים במקבילים', 'Knee Raise Parallel Bars', 'abdominals', { equipment: 'bodyweight' }),
  ex('kneeling_pulldown_band','משיכה על הברכיים גומייה', 'Kneeling Pulldown (band)', 'lats', { equipment: 'band' }),
  ex('kneeling_push_up',      'שכיבות סמיכה על הברכיים', 'Kneeling Push Up', 'chest', { equipment: 'bodyweight' }),

  // ═══════════════════════════════════════════════════════════════
  //  L
  // ═══════════════════════════════════════════════════════════════
  ex('l_sit_hold',            'L-סיט', 'L-Sit Hold', 'abdominals', { equipment: 'bodyweight' }),
  ex('landmine_180',          'לנדמיין 180', 'Landmine 180', 'abdominals', { equipment: 'barbell' }),
  ex('landmine_row',          'לנדמיין חתירה', 'Landmine Row', 'upper_back', { equipment: 'barbell', secondary: ['biceps'] }),
  ex('landmine_squat_press',  'לנדמיין סקוואט + לחיצה', 'Landmine Squat and Press', 'full_body', { equipment: 'barbell' }),

  // Lat Pulldown variants
  ex('lat_pd_close_cable',    'משיכה גב אחיזה צרה', 'Lat Pulldown - Close Grip (Cable)', 'lats', { equipment: 'cable', secondary: ['biceps'], cues: CUE_TEMPLATES.pulldown }),
  ex('lat_pd_band',           'משיכה גב גומייה', 'Lat Pulldown (Band)', 'lats', { equipment: 'band' }),
  ex('lat_pd_cable',          'משיכה גב', 'Lat Pulldown (Cable)', 'lats', { equipment: 'cable', secondary: ['biceps'], ytId: 'CAwf7n6Luuc', cues: CUE_TEMPLATES.pulldown }),
  ex('lat_pd_machine',        'משיכה גב במכונה', 'Lat Pulldown (Machine)', 'lats', { equipment: 'machine', secondary: ['biceps'], cues: CUE_TEMPLATES.pulldown }),

  // Lateral variants
  ex('lateral_band_walks',    'הליכות צד עם גומייה', 'Lateral Band Walks', 'glutes', { equipment: 'band', secondary: ['abductors'] }),
  ex('lateral_box_jump',      'קפיצת ארגז צדדית', 'Lateral Box Jump', 'quadriceps', { equipment: 'bodyweight' }),
  ex('lateral_leg_raises',    'הרמת רגל צדדית', 'Lateral Leg Raises', 'glutes', { equipment: 'bodyweight' }),
  ex('lateral_lunge',         'לונג צדדי', 'Lateral Lunge', 'quadriceps', { equipment: 'bodyweight' }),
  ex('lateral_raise_band',    'הרמה צדדית גומייה', 'Lateral Raise (Band)', 'shoulders', { equipment: 'band' }),
  ex('lateral_raise_cable',   'הרמה צדדית כבל', 'Lateral Raise (Cable)', 'shoulders', { equipment: 'cable' }),
  ex('lateral_raise_db',      'הרמה צדדית דמבל', 'Lateral Raise (Dumbbell)', 'shoulders', { equipment: 'dumbbell', ytId: '3VcKaXpzqRo' }),
  ex('lateral_raise_m',       'הרמה צדדית במכונה', 'Lateral Raise (Machine)', 'shoulders', { equipment: 'machine' }),
  ex('lateral_squat',         'סקוואט צדדי', 'Lateral Squat', 'quadriceps', { equipment: 'bodyweight', secondary: ['glutes'] }),

  ex('leg_ext_machine',       'הרחבת ברכיים', 'Leg Extension (Machine)', 'quadriceps', { equipment: 'machine', ytId: 'YyvSfVjQeL0', contra: ['knee'] }),
  ex('leg_press_m',           'לחיצת רגליים', 'Leg Press (Machine)', 'quadriceps', { equipment: 'machine', secondary: ['glutes'], ytId: 'IZxyjW7MPJQ' }),
  ex('leg_press_horizontal',  'לחיצת רגליים אופקית', 'Leg Press Horizontal (Machine)', 'quadriceps', { equipment: 'machine', secondary: ['glutes'] }),
  ex('leg_raise_bars',        'הרמת רגליים במקבילים', 'Leg Raise Parallel Bars', 'abdominals', { equipment: 'bodyweight' }),
  ex('low_cable_fly',         'צלב כבל נמוך', 'Low Cable Fly Crossovers', 'chest', { equipment: 'cable' }),

  ex('lunge_bb',              'לונג מוט', 'Lunge (Barbell)', 'quadriceps', { equipment: 'barbell', secondary: ['glutes'] }),
  ex('lunge_db',              'לונג דמבל', 'Lunge (Dumbbell)', 'quadriceps', { equipment: 'dumbbell', secondary: ['glutes'] }),
  ex('lying_knee_raise',      'הרמת ברכיים בשכיבה', 'Lying Knee Raise', 'abdominals', { equipment: 'bodyweight' }),
  ex('lying_leg_curl_m',      'כיפוף רגליים בשכיבה', 'Lying Leg Curl (Machine)', 'hamstrings', { equipment: 'machine', ytId: '1Tq3QdYUuHs' }),
  ex('lying_leg_raise',       'הרמת רגליים בשכיבה', 'Lying Leg Raise', 'abdominals', { equipment: 'bodyweight' }),
  ex('lying_neck_curls',      'כפיפות צוואר בשכיבה', 'Lying Neck Curls', 'neck', { equipment: 'bodyweight' }),
  ex('lying_neck_curls_wt',   'כפיפות צוואר במשקל', 'Lying Neck Curls (Weighted)', 'neck', { equipment: 'plate' }),
  ex('lying_neck_ext',        'הרחבת צוואר בשכיבה', 'Lying Neck Extension', 'neck', { equipment: 'bodyweight' }),
  ex('lying_neck_ext_wt',     'הרחבת צוואר במשקל', 'Lying Neck Extension (Weighted)', 'neck', { equipment: 'plate' }),

  // ═══════════════════════════════════════════════════════════════
  //  M
  // ═══════════════════════════════════════════════════════════════
  ex('meadows_rows',          'חתירת מדואוס', 'Meadows Rows (Barbell)', 'upper_back', { equipment: 'barbell', secondary: ['biceps'] }),
  ex('mountain_climber',      'מטפס הרים', 'Mountain Climber', 'full_body', { equipment: 'bodyweight', secondary: ['abdominals'] }),
  ex('muscle_up',             'מאסל אפ', 'Muscle Up', 'full_body', { equipment: 'bodyweight', secondary: ['lats', 'chest'] }),

  // ═══════════════════════════════════════════════════════════════
  //  N-O
  // ═══════════════════════════════════════════════════════════════
  ex('negative_pull_up',      'משיכת שלילית', 'Negative Pull Up', 'lats', { equipment: 'bodyweight' }),
  ex('nordic_hamstrings',     'כיפוף נורדי', 'Nordic Hamstrings Curls', 'hamstrings', { equipment: 'bodyweight' }),
  ex('oblique_crunch',        'כפיפות אלכסון', 'Oblique Crunch', 'abdominals', { equipment: 'bodyweight' }),

  ex('overhead_press_bb',     'לחיצה מעל הראש', 'Overhead Press (Barbell)', 'shoulders', { equipment: 'barbell', secondary: ['triceps'], category: 'compound_push', ytId: '_RlRDWO2jfg', cues: CUE_TEMPLATES.overhead_press, contra: ['shoulder'] }),
  ex('overhead_press_db',     'לחיצה מעל הראש דמבל', 'Overhead Press (Dumbbell)', 'shoulders', { equipment: 'dumbbell', secondary: ['triceps'], cues: CUE_TEMPLATES.overhead_press }),
  ex('overhead_squat',        'סקוואט אוברהד', 'Overhead Squat', 'full_body', { equipment: 'barbell', secondary: ['quadriceps', 'shoulders'] }),
  ex('overhead_tricep_ext_c', 'הרחבת טריצפס מאחור', 'Overhead Triceps Extension (Cable)', 'triceps', { equipment: 'cable', cues: CUE_TEMPLATES.extension }),

  // ═══════════════════════════════════════════════════════════════
  //  P
  // ═══════════════════════════════════════════════════════════════
  ex('partial_glute_bridge',  'גשר ישבן חלקי', 'Partial Glute Bridge (Barbell)', 'glutes', { equipment: 'barbell' }),
  ex('pause_squat',           'סקוואט עם עצירה', 'Pause Squat (Barbell)', 'quadriceps', { equipment: 'barbell', secondary: ['glutes'], cues: CUE_TEMPLATES.squat }),
  ex('pendlay_row',           'חתירת פנדליי', 'Pendlay Row (Barbell)', 'upper_back', { equipment: 'barbell', secondary: ['biceps'], cues: CUE_TEMPLATES.row }),
  ex('pendulum_squat_m',      'סקוואט מטוטלת', 'Pendulum Squat (Machine)', 'quadriceps', { equipment: 'machine', secondary: ['glutes'] }),
  ex('pike_pushup',           'שכיבות פייק', 'Pike Pushup', 'shoulders', { equipment: 'bodyweight', secondary: ['triceps'] }),
  ex('pilates',               'פילאטיס', 'Pilates', 'full_body', { equipment: 'bodyweight' }),
  ex('pinwheel_curl',         'כפיפת פינווהיל', 'Pinwheel Curl (Dumbbell)', 'biceps', { equipment: 'dumbbell', secondary: ['forearms'] }),
  ex('pistol_squat',          'סקוואט פיסטול', 'Pistol Squat', 'quadriceps', { equipment: 'bodyweight', secondary: ['glutes'] }),
  ex('plank',                 'פלאנק', 'Plank', 'abdominals', { equipment: 'bodyweight', secondary: ['shoulders'] }),
  ex('plank_pushup',          'פלאנק שכיבות', 'Plank Pushup', 'chest', { equipment: 'bodyweight' }),
  ex('plate_curl',            'כפיפת פלטה', 'Plate Curl', 'biceps', { equipment: 'plate' }),
  ex('plate_front_raise',     'הרמה קדמית פלטה', 'Plate Front Raise', 'shoulders', { equipment: 'plate' }),
  ex('plate_press',           'לחיצת פלטה', 'Plate Press', 'chest', { equipment: 'plate' }),
  ex('plate_squeeze',         'לחיצת פלטה (סוונד)', 'Plate Squeeze (Svend Press)', 'chest', { equipment: 'plate' }),
  ex('power_clean',           'פאואר קלין', 'Power Clean', 'full_body', { equipment: 'barbell' }),
  ex('power_snatch',          'פאואר סנאץ׳', 'Power Snatch', 'full_body', { equipment: 'barbell', secondary: ['shoulders'] }),

  // Preacher Curl variants
  ex('preacher_curl_bb',      'כפיפת מטיף', 'Preacher Curl (Barbell)', 'biceps', { equipment: 'barbell', ytId: 'fIWP-FRFNU0', cues: CUE_TEMPLATES.curl }),
  ex('preacher_curl_db',      'כפיפת מטיף דמבל', 'Preacher Curl (Dumbbell)', 'biceps', { equipment: 'dumbbell' }),
  ex('preacher_curl_m',       'כפיפת מטיף במכונה', 'Preacher Curl (Machine)', 'biceps', { equipment: 'machine' }),
  ex('press_under',           'לחיצה מתחת', 'Press Under', 'full_body', { equipment: 'barbell', secondary: ['shoulders'] }),

  // Pull Up variants
  ex('pull_up',               'משיכה', 'Pull Up', 'lats', { equipment: 'bodyweight', secondary: ['biceps'], category: 'compound_pull', ytId: 'eGo4IYlbE5g' }),
  ex('pull_up_assisted',      'משיכה נעזרת', 'Pull Up (Assisted)', 'lats', { equipment: 'machine', secondary: ['biceps'] }),
  ex('pull_up_band',          'משיכה עם גומייה', 'Pull Up (Band)', 'lats', { equipment: 'band', secondary: ['biceps'] }),
  ex('pull_up_weighted',      'משיכה במשקל', 'Pull Up (Weighted)', 'lats', { equipment: 'plate', secondary: ['biceps'] }),

  ex('pullover_db',           'פולאובר דמבל', 'Pullover (Dumbbell)', 'lats', { equipment: 'dumbbell', secondary: ['chest'] }),
  ex('pullover_m',            'פולאובר במכונה', 'Pullover (Machine)', 'lats', { equipment: 'machine' }),

  ex('push_press',            'פוש פרס', 'Push Press', 'shoulders', { equipment: 'barbell', secondary: ['triceps'] }),
  ex('push_up',               'שכיבות סמיכה', 'Push Up', 'chest', { equipment: 'bodyweight', secondary: ['triceps'], ytId: 'IODxDxX7oi4' }),
  ex('push_up_close',         'שכיבות אחיזה צרה', 'Push Up - Close Grip', 'chest', { equipment: 'bodyweight', secondary: ['triceps'] }),
  ex('push_up_weighted',      'שכיבות במשקל', 'Push Up (Weighted)', 'chest', { equipment: 'plate', secondary: ['triceps'] }),

  // ═══════════════════════════════════════════════════════════════
  //  R
  // ═══════════════════════════════════════════════════════════════
  ex('rack_pull',             'ראק פול', 'Rack Pull', 'upper_back', { equipment: 'barbell', secondary: ['glutes', 'traps'] }),
  ex('rear_delt_fly_c',       'פליי דלטואיד אחורי כבל', 'Rear Delt Reverse Fly (Cable)', 'shoulders', { equipment: 'cable', secondary: ['upper_back'] }),
  ex('rear_delt_fly_db',      'פליי דלטואיד אחורי דמבל', 'Rear Delt Reverse Fly (Dumbbell)', 'shoulders', { equipment: 'dumbbell', secondary: ['upper_back'], ytId: 'ttvfGg9d76c' }),
  ex('rear_delt_fly_m',       'פליי דלטואיד אחורי במכונה', 'Rear Delt Reverse Fly (Machine)', 'shoulders', { equipment: 'machine', secondary: ['upper_back'] }),
  ex('rear_kick_m',           'בעיטה אחורה במכונה', 'Rear Kick (Machine)', 'glutes', { equipment: 'machine' }),
  ex('recumbent_bike',        'אופני שכיבה', 'Recumbent Bike', 'cardio', { equipment: 'machine' }),
  ex('renegade_row',          'חתירת רנגייד', 'Renegade Row (Dumbbell)', 'upper_back', { equipment: 'dumbbell', secondary: ['abdominals'] }),
  ex('reverse_crunch',        'כפיפות בטן הפוכות', 'Reverse Crunch', 'abdominals', { equipment: 'bodyweight' }),
  ex('reverse_curl_bb',       'כפיפת יד הפוכה', 'Reverse Curl (Barbell)', 'biceps', { equipment: 'barbell', secondary: ['forearms'] }),
  ex('reverse_curl_cable',    'כפיפת יד הפוכה כבל', 'Reverse Curl (Cable)', 'biceps', { equipment: 'cable', secondary: ['forearms'] }),
  ex('reverse_curl_db',       'כפיפת יד הפוכה דמבל', 'Reverse Curl (Dumbbell)', 'biceps', { equipment: 'dumbbell', secondary: ['forearms'] }),
  ex('reverse_grip_conc',     'כפיפת ריכוז הפוכה', 'Reverse Grip Concentration Curl', 'biceps', { equipment: 'dumbbell' }),
  ex('reverse_grip_lat_pd',   'משיכה גב הפוכה', 'Reverse Grip Lat Pulldown (Cable)', 'lats', { equipment: 'cable', secondary: ['biceps'] }),
  ex('reverse_grip_pushdown', 'הפעלת טריצפס הפוכה', 'Reverse Grip Triceps Pushdown', 'triceps', { equipment: 'cable' }),
  ex('reverse_hyperext',      'הרחבת גב הפוכה', 'Reverse Hyperextension', 'glutes', { equipment: 'machine', secondary: ['hamstrings'] }),
  ex('reverse_lunge',         'לונג הפוך', 'Reverse Lunge', 'quadriceps', { equipment: 'bodyweight', secondary: ['glutes'] }),
  ex('reverse_lunge_bb',      'לונג הפוך מוט', 'Reverse Lunge (Barbell)', 'quadriceps', { equipment: 'barbell', secondary: ['glutes'] }),
  ex('reverse_lunge_db',      'לונג הפוך דמבל', 'Reverse Lunge (Dumbbell)', 'quadriceps', { equipment: 'dumbbell', secondary: ['glutes'] }),
  ex('reverse_plank',         'פלאנק הפוך', 'Reverse Plank', 'abdominals', { equipment: 'bodyweight' }),
  ex('reverse_wrist_curl_db', 'כפיפת שורש כף היד הפוכה', 'Reverse Wrist Curl (Dumbbell)', 'forearms', { equipment: 'dumbbell' }),
  ex('ring_dips',             'טבילות טבעות', 'Ring Dips', 'chest', { equipment: 'ring', secondary: ['triceps'] }),
  ex('ring_pull_up',          'משיכת טבעות', 'Ring Pull Up', 'lats', { equipment: 'ring' }),
  ex('ring_push_up',          'שכיבות טבעות', 'Ring Push Up', 'chest', { equipment: 'ring' }),

  // Romanian Deadlift
  ex('rdl_bb',                'רומנית דדליפט', 'Romanian Deadlift (Barbell)', 'hamstrings', { equipment: 'barbell', secondary: ['glutes', 'lower_back'], ytId: 'jEy_czb3RKA', cues: CUE_TEMPLATES.deadlift, contra: ['lower_back'] }),
  ex('rdl_db',                'רומנית דדליפט דמבל', 'Romanian Deadlift (Dumbbell)', 'hamstrings', { equipment: 'dumbbell', secondary: ['glutes'] }),
  ex('rdl_smith',             'רומנית דדליפט בסמית', 'Romanian Deadlift (Smith Machine)', 'hamstrings', { equipment: 'smith_machine', secondary: ['glutes'] }),

  ex('rope_cable_curl',       'כפיפת יד עם חבל', 'Rope Cable Curl', 'biceps', { equipment: 'cable' }),
  ex('rope_straight_arm_pd',  'משיכה זרוע ישרה', 'Rope Straight Arm Pulldown', 'lats', { equipment: 'cable' }),
  ex('rowing_machine',        'חתירה במכונה', 'Rowing Machine', 'cardio', { equipment: 'machine', secondary: ['upper_back'] }),
  ex('running',               'ריצה', 'Running', 'cardio', { equipment: 'none' }),
  ex('russian_twist_bw',      'טוויסט רוסי', 'Russian Twist (Bodyweight)', 'abdominals', { equipment: 'bodyweight' }),
  ex('russian_twist_wt',      'טוויסט רוסי במשקל', 'Russian Twist (Weighted)', 'abdominals', { equipment: 'plate' }),

  // ═══════════════════════════════════════════════════════════════
  //  S
  // ═══════════════════════════════════════════════════════════════
  ex('scapular_pull_ups',     'משיכות שכם', 'Scapular Pull Ups', 'upper_back', { equipment: 'bodyweight' }),
  ex('seal_row_bb',           'חתירת סיל', 'Seal Row (Barbell)', 'upper_back', { equipment: 'barbell', secondary: ['biceps'] }),
  ex('seal_row_db',           'חתירת סיל דמבל', 'Seal Row (Dumbbell)', 'upper_back', { equipment: 'dumbbell', secondary: ['biceps'] }),
  ex('seated_cable_row_bar',  'חתירת ישיבה בכבל', 'Seated Cable Row - Bar Grip', 'upper_back', { equipment: 'cable', secondary: ['biceps'] }),
  ex('seated_cable_row_wide', 'חתירת ישיבה רחבה', 'Seated Cable Row - Bar Wide Grip', 'upper_back', { equipment: 'cable', secondary: ['biceps'] }),
  ex('seated_cable_row_v',    'חתירת ישיבה V', 'Seated Cable Row - V Grip (Cable)', 'upper_back', { equipment: 'cable', secondary: ['biceps'], ytId: 'GZbfZ033f74' }),
  ex('seated_calf_raise',     'הרמת שוקיים בישיבה', 'Seated Calf Raise', 'calves', { equipment: 'machine' }),
  ex('seated_chest_fly_c',    'פליי חזה בישיבה', 'Seated Chest Flys (Cable)', 'chest', { equipment: 'cable' }),
  ex('seated_dip_m',          'דיפ בישיבה', 'Seated Dip Machine', 'triceps', { equipment: 'machine' }),
  ex('seated_incline_curl',   'כפיפת מרפק בישיבה משופעת', 'Seated Incline Curl (Dumbbell)', 'biceps', { equipment: 'dumbbell' }),
  ex('seated_incline_hammer', 'פטיש בישיבה משופעת', 'Seated Incline Hammer Curl (Dumbbell)', 'biceps', { equipment: 'dumbbell' }),
  ex('seated_lateral_raise',  'הרמה צדדית בישיבה', 'Seated Lateral Raise (Dumbbell)', 'shoulders', { equipment: 'dumbbell' }),
  ex('seated_leg_curl_m',     'כיפוף רגליים בישיבה', 'Seated Leg Curl (Machine)', 'hamstrings', { equipment: 'machine' }),
  ex('seated_ohp_bb',         'לחיצת אוברהד בישיבה', 'Seated Overhead Press (Barbell)', 'shoulders', { equipment: 'barbell', secondary: ['triceps'], cues: CUE_TEMPLATES.overhead_press }),
  ex('seated_ohp_db',         'לחיצת אוברהד בישיבה דמבל', 'Seated Overhead Press (Dumbbell)', 'shoulders', { equipment: 'dumbbell', secondary: ['triceps'] }),
  ex('seated_palms_up_wrist', 'כפיפת שורש כף היד בישיבה', 'Seated Palms Up Wrist Curl', 'forearms', { equipment: 'dumbbell' }),
  ex('seated_row_m',          'חתירה במכונה בישיבה', 'Seated Row (Machine)', 'upper_back', { equipment: 'machine', secondary: ['biceps'] }),
  ex('seated_shoulder_press_m','לחיצת כתף במכונה', 'Seated Shoulder Press (Machine)', 'shoulders', { equipment: 'machine', secondary: ['triceps'] }),
  ex('seated_triceps_press',  'לחיצת טריצפס בישיבה', 'Seated Triceps Press', 'triceps', { equipment: 'machine' }),

  ex('shoulder_press_db',     'לחיצת כתף דמבל', 'Shoulder Press (Dumbbell)', 'shoulders', { equipment: 'dumbbell', secondary: ['triceps'], ytId: 'qEwKCR5JCog', cues: CUE_TEMPLATES.overhead_press }),
  ex('shoulder_press_m',      'לחיצת כתף במכונה', 'Shoulder Press (Machine Plates)', 'shoulders', { equipment: 'machine', secondary: ['triceps'] }),
  ex('shoulder_taps',         'נקישות כתף', 'Shoulder Taps', 'shoulders', { equipment: 'bodyweight', secondary: ['abdominals'] }),

  // Shrug variants
  ex('shrug_bb',              'שראג', 'Shrug (Barbell)', 'traps', { equipment: 'barbell' }),
  ex('shrug_cable',           'שראג כבל', 'Shrug (Cable)', 'traps', { equipment: 'cable' }),
  ex('shrug_db',              'שראג דמבל', 'Shrug (Dumbbell)', 'traps', { equipment: 'dumbbell' }),
  ex('shrug_m',               'שראג במכונה', 'Shrug (Machine)', 'traps', { equipment: 'machine' }),
  ex('shrug_smith',           'שראג בסמית', 'Shrug (Smith Machine)', 'traps', { equipment: 'smith_machine' }),

  ex('side_bend',             'כפיפה צדדית', 'Side Bend', 'abdominals', { equipment: 'bodyweight' }),
  ex('side_bend_db',          'כפיפה צדדית דמבל', 'Side Bend (Dumbbell)', 'abdominals', { equipment: 'dumbbell' }),
  ex('side_plank',            'פלאנק צדדי', 'Side Plank', 'abdominals', { equipment: 'bodyweight' }),
  ex('single_arm_cable_cross','צלב כבל חד-ידני', 'Single Arm Cable Crossover', 'chest', { equipment: 'cable' }),
  ex('single_arm_cable_row',  'חתירה חד-ידנית כבל', 'Single Arm Cable Row', 'upper_back', { equipment: 'cable', secondary: ['biceps'] }),
  ex('single_arm_curl_c',     'כפיפת יד חד-ידנית כבל', 'Single Arm Curl (Cable)', 'biceps', { equipment: 'cable' }),
  ex('single_arm_landmine',   'לחיצת לנדמיין חד-ידנית', 'Single Arm Landmine Press (Barbell)', 'shoulders', { equipment: 'barbell' }),
  ex('single_arm_lat_pd',     'משיכה גב חד-ידנית', 'Single Arm Lat Pulldown', 'lats', { equipment: 'cable' }),
  ex('single_arm_lat_raise_c','הרמה צדדית חד-ידנית כבל', 'Single Arm Lateral Raise (Cable)', 'shoulders', { equipment: 'cable' }),
  ex('single_arm_tri_ext_db', 'הרחבת טריצפס חד-ידנית', 'Single Arm Tricep Extension (Dumbbell)', 'triceps', { equipment: 'dumbbell' }),
  ex('single_arm_tri_pd_c',   'טריצפס פאשדאון חד-ידני', 'Single Arm Triceps Pushdown (Cable)', 'triceps', { equipment: 'cable' }),
  ex('single_leg_ext',        'הרחבת ברך חד-רגלית', 'Single Leg Extensions', 'quadriceps', { equipment: 'machine' }),
  ex('single_leg_glute',      'גשר ישבן חד-רגלי', 'Single Leg Glute Bridge', 'glutes', { equipment: 'bodyweight' }),
  ex('single_leg_hip_thrust', 'היפ תראסט חד-רגלי', 'Single Leg Hip Thrust', 'glutes', { equipment: 'bodyweight' }),
  ex('single_leg_hip_db',     'היפ תראסט חד-רגלי דמבל', 'Single Leg Hip Thrust (Dumbbell)', 'glutes', { equipment: 'dumbbell' }),
  ex('single_leg_press_m',    'לחיצה חד-רגלית', 'Single Leg Press (Machine)', 'quadriceps', { equipment: 'machine' }),
  ex('single_leg_rdl_bb',     'רומנית חד-רגלית', 'Single Leg Romanian Deadlift (Barbell)', 'hamstrings', { equipment: 'barbell' }),
  ex('single_leg_rdl_db',     'רומנית חד-רגלית דמבל', 'Single Leg Romanian Deadlift (Dumbbell)', 'hamstrings', { equipment: 'dumbbell' }),
  ex('single_leg_calf',       'שוק חד-רגלי', 'Single Leg Standing Calf Raise', 'calves', { equipment: 'bodyweight' }),
  ex('single_leg_calf_bb',    'שוק חד-רגלי מוט', 'Single Leg Standing Calf Raise (Barbell)', 'calves', { equipment: 'barbell' }),
  ex('single_leg_calf_db',    'שוק חד-רגלי דמבל', 'Single Leg Standing Calf Raise (Dumbbell)', 'calves', { equipment: 'dumbbell' }),
  ex('single_leg_calf_m',     'שוק חד-רגלי במכונה', 'Single Leg Standing Calf Raise (Machine)', 'calves', { equipment: 'machine' }),
  ex('sissy_squat_wt',        'סיסי סקוואט', 'Sissy Squat (Weighted)', 'quadriceps', { equipment: 'plate' }),
  ex('sit_up',                'סיט אפ', 'Sit Up', 'abdominals', { equipment: 'bodyweight' }),
  ex('sit_up_wt',             'סיט אפ במשקל', 'Sit Up (Weighted)', 'abdominals', { equipment: 'plate' }),
  ex('skating',               'החלקה', 'Skating', 'cardio', { equipment: 'none' }),
  ex('ski_erg',               'סקי ארג', 'Ski Erg', 'cardio', { equipment: 'machine' }),
  ex('skiing',                'סקי', 'Skiing', 'cardio', { equipment: 'none' }),
  ex('skullcrusher_bb',       'סקלקראשר', 'Skullcrusher (Barbell)', 'triceps', { equipment: 'barbell', ytId: 'd_KZxkY_0cM', cues: CUE_TEMPLATES.extension }),
  ex('skullcrusher_db',       'סקלקראשר דמבל', 'Skullcrusher (Dumbbell)', 'triceps', { equipment: 'dumbbell' }),
  ex('sled_pull',             'משיכת מזחלת', 'Sled Pull', 'full_body', { equipment: 'machine' }),
  ex('sled_push',             'דחיפת מזחלת', 'Sled Push', 'full_body', { equipment: 'machine' }),
  ex('snatch',                'סנאץ׳', 'Snatch', 'full_body', { equipment: 'barbell', secondary: ['shoulders'] }),
  ex('snowboarding',          'סנובורד', 'Snowboarding', 'cardio', { equipment: 'none' }),
  ex('spider_curl_bb',        'ספיידר קרל', 'Spider Curl (Barbell)', 'biceps', { equipment: 'barbell' }),
  ex('spider_curl_db',        'ספיידר קרל דמבל', 'Spider Curl (Dumbbell)', 'biceps', { equipment: 'dumbbell' }),
  ex('spiderman',             'ספיידרמן', 'Spiderman', 'abdominals', { equipment: 'bodyweight' }),
  ex('spinning',              'ספינינג', 'Spinning', 'cardio', { equipment: 'machine' }),
  ex('split_jerk',            'ספליט ג׳רק', 'Split Jerk', 'full_body', { equipment: 'barbell', secondary: ['shoulders'] }),
  ex('split_squat_db',        'ספליט סקוואט', 'Split Squat (Dumbbell)', 'quadriceps', { equipment: 'dumbbell', secondary: ['glutes'] }),
  ex('sprints',               'ריצות ספרינט', 'Sprints', 'cardio', { equipment: 'none' }),

  // Squat variants
  ex('squat_bb',              'סקוואט', 'Squat (Barbell)', 'quadriceps', { equipment: 'barbell', secondary: ['glutes', 'hamstrings'], category: 'compound_leg', ytId: 'SW_C1A-rejs', cues: CUE_TEMPLATES.squat, contra: ['knee', 'lower_back'], rm: [65, 70, 75, 80, 85, 90] }),
  ex('squat_band',            'סקוואט גומייה', 'Squat (Band)', 'quadriceps', { equipment: 'band', secondary: ['glutes'] }),
  ex('squat_bw',              'סקוואט משקל גוף', 'Squat (Bodyweight)', 'quadriceps', { equipment: 'bodyweight', secondary: ['glutes'] }),
  ex('squat_db',              'סקוואט דמבל', 'Squat (Dumbbell)', 'quadriceps', { equipment: 'dumbbell', secondary: ['glutes'] }),
  ex('squat_m',               'סקוואט במכונה', 'Squat (Machine)', 'quadriceps', { equipment: 'machine', secondary: ['glutes'] }),
  ex('squat_smith',           'סקוואט בסמית', 'Squat (Smith Machine)', 'quadriceps', { equipment: 'smith_machine', secondary: ['glutes'], cues: CUE_TEMPLATES.squat }),
  ex('squat_susp',            'סקוואט רצועות', 'Squat (Suspension)', 'quadriceps', { equipment: 'suspension' }),
  ex('squat_row',             'סקוואט + חתירה', 'Squat Row', 'full_body', { equipment: 'cable' }),

  ex('stair_machine_floors',  'מכונת מדרגות', 'Stair Machine (Floors)', 'cardio', { equipment: 'machine' }),
  ex('stair_machine_steps',   'מכונת מדרגות (צעדים)', 'Stair Machine (Steps)', 'cardio', { equipment: 'machine' }),
  ex('standing_cable_kickback','בעיטה בכבל בעמידה', 'Standing Cable Glute Kickbacks', 'glutes', { equipment: 'cable' }),
  ex('standing_calf_raise',   'שוקיים בעמידה', 'Standing Calf Raise', 'calves', { equipment: 'bodyweight' }),
  ex('standing_calf_bb',      'שוקיים בעמידה מוט', 'Standing Calf Raise (Barbell)', 'calves', { equipment: 'barbell' }),
  ex('standing_calf_db',      'שוקיים בעמידה דמבל', 'Standing Calf Raise (Dumbbell)', 'calves', { equipment: 'dumbbell' }),
  ex('standing_calf_m',       'שוקיים בעמידה במכונה', 'Standing Calf Raise (Machine)', 'calves', { equipment: 'machine' }),
  ex('standing_calf_smith',   'שוקיים בעמידה בסמית', 'Standing Calf Raise (Smith)', 'calves', { equipment: 'smith_machine' }),
  ex('standing_leg_curls',    'כיפוף רגליים בעמידה', 'Standing Leg Curls', 'hamstrings', { equipment: 'machine' }),
  ex('standing_military_bb',  'לחיצת מיליטרי', 'Standing Military Press (Barbell)', 'shoulders', { equipment: 'barbell', secondary: ['triceps'], cues: CUE_TEMPLATES.overhead_press }),
  ex('standing_y_raise_c',    'הרמת Y בעמידה כבל', 'Standing Y Raise (Cable)', 'shoulders', { equipment: 'cable' }),
  ex('step_up',               'עלייה על ארגז', 'Step Up', 'quadriceps', { equipment: 'bodyweight', secondary: ['glutes'] }),
  ex('sternum_pull_up',       'משיכת חזה (ג׳ירונדה)', 'Sternum Pull up (Gironda)', 'lats', { equipment: 'bodyweight' }),
  ex('straight_arm_lat_pd',   'משיכה זרוע ישרה', 'Straight Arm Lat Pulldown (Cable)', 'lats', { equipment: 'cable' }),
  ex('straight_leg_deadlift', 'דדליפט רגליים ישרות', 'Straight Leg Deadlift', 'hamstrings', { equipment: 'barbell', secondary: ['glutes'] }),
  ex('stretching',            'מתיחות', 'Stretching', 'other', { equipment: 'bodyweight' }),
  ex('suitcase_carry',        'סחיבת מזוודה', 'Suitcase Carry (Dumbbell)', 'full_body', { equipment: 'dumbbell', secondary: ['forearms'] }),
  ex('sumo_deadlift',         'דדליפט סומו', 'Sumo Deadlift', 'glutes', { equipment: 'barbell', secondary: ['hamstrings', 'adductors'], cues: CUE_TEMPLATES.deadlift }),
  ex('sumo_squat',            'סקוואט סומו', 'Sumo Squat', 'adductors', { equipment: 'bodyweight', secondary: ['quadriceps'] }),
  ex('sumo_squat_bb',         'סקוואט סומו מוט', 'Sumo Squat (Barbell)', 'adductors', { equipment: 'barbell', secondary: ['quadriceps'] }),
  ex('sumo_squat_db',         'סקוואט סומו דמבל', 'Sumo Squat (Dumbbell)', 'adductors', { equipment: 'dumbbell', secondary: ['quadriceps'] }),
  ex('sumo_squat_kb',         'סקוואט סומו קטלבל', 'Sumo Squat (Kettlebell)', 'adductors', { equipment: 'kettlebell', secondary: ['quadriceps'] }),
  ex('superman',              'סופרמן', 'Superman', 'lower_back', { equipment: 'bodyweight', secondary: ['glutes'] }),
  ex('swimming',              'שחייה', 'Swimming', 'cardio', { equipment: 'none' }),

  // ═══════════════════════════════════════════════════════════════
  //  T
  // ═══════════════════════════════════════════════════════════════
  ex('t_bar_row',             'חתירת T-Bar', 'T Bar Row', 'upper_back', { equipment: 'machine', secondary: ['biceps'] }),
  ex('thruster_bb',           'תראסטר', 'Thruster (Barbell)', 'full_body', { equipment: 'barbell', secondary: ['shoulders', 'quadriceps'] }),
  ex('thruster_kb',           'תראסטר קטלבל', 'Thruster (Kettlebell)', 'full_body', { equipment: 'kettlebell', secondary: ['shoulders'] }),
  ex('toe_touch',             'נגיעה באצבעות', 'Toe Touch', 'abdominals', { equipment: 'bodyweight' }),
  ex('toes_to_bar',            'רגליים למוט', 'Toes to Bar', 'abdominals', { equipment: 'bodyweight' }),
  ex('torso_rotation',        'סיבוב פלג עליון', 'Torso Rotation', 'abdominals', { equipment: 'machine' }),
  ex('treadmill',              'הליכון', 'Treadmill', 'cardio', { equipment: 'machine' }),
  ex('triceps_dip',           'טריצפס דיפ', 'Triceps Dip', 'triceps', { equipment: 'bodyweight' }),
  ex('triceps_dip_assisted',  'טריצפס דיפ נעזר', 'Triceps Dip (Assisted)', 'triceps', { equipment: 'machine' }),
  ex('triceps_dip_weighted',  'טריצפס דיפ במשקל', 'Triceps Dip (Weighted)', 'triceps', { equipment: 'plate' }),

  // Triceps Extension variants
  ex('triceps_ext_bb',        'הרחבת טריצפס מוט', 'Triceps Extension (Barbell)', 'triceps', { equipment: 'barbell', cues: CUE_TEMPLATES.extension }),
  ex('triceps_ext_cable',     'הרחבת טריצפס כבל', 'Triceps Extension (Cable)', 'triceps', { equipment: 'cable' }),
  ex('triceps_ext_db',        'הרחבת טריצפס דמבל', 'Triceps Extension (Dumbbell)', 'triceps', { equipment: 'dumbbell' }),
  ex('triceps_ext_m',         'הרחבת טריצפס במכונה', 'Triceps Extension (Machine)', 'triceps', { equipment: 'machine' }),
  ex('triceps_ext_susp',      'הרחבת טריצפס רצועות', 'Triceps Extension (Suspension)', 'triceps', { equipment: 'suspension' }),
  ex('triceps_kickback_c',    'בעיטת טריצפס כבל', 'Triceps Kickback (Cable)', 'triceps', { equipment: 'cable' }),
  ex('triceps_kickback_db',   'בעיטת טריצפס דמבל', 'Triceps Kickback (Dumbbell)', 'triceps', { equipment: 'dumbbell' }),
  ex('triceps_pressdown',     'טריצפס פרסדאון', 'Triceps Pressdown', 'triceps', { equipment: 'cable' }),
  ex('triceps_pushdown',      'טריצפס פאשדאון', 'Triceps Pushdown', 'triceps', { equipment: 'cable', ytId: '2-LAMcpzODU' }),
  ex('triceps_rope_pushdown', 'טריצפס פאשדאון עם חבל', 'Triceps Rope Pushdown', 'triceps', { equipment: 'cable', ytId: 'kiuVA0gs3EI' }),

  // ═══════════════════════════════════════════════════════════════
  //  U-Z
  // ═══════════════════════════════════════════════════════════════
  ex('upright_row_bb',        'חתירה זקופה', 'Upright Row (Barbell)', 'shoulders', { equipment: 'barbell', secondary: ['traps'] }),
  ex('upright_row_cable',     'חתירה זקופה כבל', 'Upright Row (Cable)', 'shoulders', { equipment: 'cable', secondary: ['traps'] }),
  ex('upright_row_db',        'חתירה זקופה דמבל', 'Upright Row (Dumbbell)', 'shoulders', { equipment: 'dumbbell', secondary: ['traps'] }),
  ex('v_up',                  'V-Up', 'V Up', 'abdominals', { equipment: 'bodyweight' }),
  ex('vertical_traction_m',   'משיכה אנכית במכונה', 'Vertical Traction (Machine)', 'lats', { equipment: 'machine' }),
  ex('waiter_curl',           'כפיפת מלצר', 'Waiter Curl (Dumbbell)', 'biceps', { equipment: 'dumbbell' }),
  ex('walking',                'הליכה', 'Walking', 'cardio', { equipment: 'none' }),
  ex('walking_lunge_db',      'לונג הליכה דמבל', 'Walking Lunge (Dumbbell)', 'quadriceps', { equipment: 'dumbbell', secondary: ['glutes'] }),
  ex('walking_lunge_sandbag', 'לונג הליכה עם שק חול', 'Walking Lunge (Sandbag)', 'quadriceps', { equipment: 'none' }),
  ex('wall_ball',             'כדור לקיר', 'Wall Ball', 'full_body', { equipment: 'none' }),
  ex('wall_sit',              'ישיבה על הקיר', 'Wall Sit', 'quadriceps', { equipment: 'bodyweight' }),
  ex('warm_up',               'חימום', 'Warm Up', 'full_body', { equipment: 'bodyweight' }),
  ex('wide_pull_up',          'משיכה רחבה', 'Wide Pull Up', 'lats', { equipment: 'bodyweight', secondary: ['upper_back'] }),
  ex('wide_elbow_tri_press',  'לחיצת טריצפס מרפקים רחבים', 'Wide-Elbow Triceps Press (Dumbbell)', 'triceps', { equipment: 'dumbbell' }),
  ex('wrist_roller',          'גלגלת שורש כף היד', 'Wrist Roller', 'forearms', { equipment: 'none' }),
  ex('yoga',                  'יוגה', 'Yoga', 'full_body', { equipment: 'bodyweight' }),
  ex('zercher_squat',         'סקוואט זרצ׳ר', 'Zercher Squat', 'quadriceps', { equipment: 'barbell', secondary: ['biceps', 'core'] }),
  ex('zottman_curl',          'כפיפת זוטמן', 'Zottman Curl (Dumbbell)', 'biceps', { equipment: 'dumbbell', secondary: ['forearms'] }),
]

// ─── Helpers ────────────────────────────────────────────────────────
export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]))

export function exercisesByMuscle(muscleKey) {
  return EXERCISES.filter(e => e.primaryMuscle === muscleKey || e.secondaryMuscles?.includes(muscleKey))
}

export function exercisesByEquipment(equipKey) {
  if (!equipKey || equipKey === 'all') return EXERCISES
  return EXERCISES.filter(e => e.equipment === equipKey)
}

export function searchExercises(query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return EXERCISES
  return EXERCISES.filter(e =>
    e.he.toLowerCase().includes(q) ||
    e.en.toLowerCase().includes(q) ||
    e.id.includes(q)
  )
}

// Popular exercises (curated top-20 like the reference app's "Popular Exercises" section)
export const POPULAR_EXERCISE_IDS = [
  'bench_press_bb', 'bench_press_db', 'bent_over_row_bb', 'bicep_curl_db',
  'cable_fly_cross', 'deadlift_bb', 'face_pull', 'hammer_curl_db',
  'incline_bench_db', 'lat_pd_cable', 'lateral_raise_db', 'leg_ext_machine',
  'leg_press_m', 'lying_leg_curl_m', 'seated_cable_row_v', 'seated_leg_curl_m',
  'shoulder_press_db', 'squat_bb', 'triceps_pushdown', 'triceps_rope_pushdown',
]

export const POPULAR_EXERCISES = POPULAR_EXERCISE_IDS.map(id => EXERCISE_BY_ID[id]).filter(Boolean)
