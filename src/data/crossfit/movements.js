// CrossFit movement catalog — 60 movements across 10 categories.
// Modeled on wod-gpt.com's taxonomy. Each movement carries:
//  • prescriptions per context (metcon vs. strength) with default loads
//  • rep ranges by workout length
//  • scaling ladder (rx / scaled / foundation)
//  • contraindications (matches state.profile.injuries keys)
//  • ytId + Hebrew cues for the exercise-guide overlay

export const CATEGORIES = {
  bodyweight:      { he: 'משקל גוף',       color: '#5a9be0' },
  weightlifting:   { he: 'הרמות אולימפיות', color: '#c8a84b' },
  kettlebell:      { he: 'קטלבל',          color: '#a878e0' },
  gymnastics:      { he: "ג'ימנסטיקה",     color: '#5ac889' },
  box:             { he: 'קופסה',          color: '#e0a05a' },
  cardio:          { he: 'קרדיו',          color: '#e05a5a' },
  odd_object:      { he: 'חפצי-חוץ',       color: '#8f7a35' },
  wall_ball:       { he: 'כדור-קיר',       color: '#5a9be0' },
  dumbbell:        { he: 'משקולות יד',     color: '#c8a84b' },
  other_functional:{ he: 'פונקציונלי',     color: '#a878e0' },
}

// Base builder — keeps the JSON compact while preserving the full schema.
// `name` is the displayed one and is always English — see
// data/movementName.js. `he` is retained for search only.
const mv = (id, he, en, category, opts = {}) => ({
  id, he, en, category,
  name: en,
  equipment: opts.equipment || [],
  contraindications: opts.contraindications || [],
  ytId: opts.ytId || null,
  cues: opts.cues || [],
  // rx = default male / female CrossFit standard (kg or meters)
  rx: opts.rx || null,
  scaled: opts.scaled || null,
  foundation: opts.foundation || null,
  // Rep ranges per workout length (short 5-12min / medium 15-25 / long 30-45)
  reps: opts.reps || { short: [10, 15], medium: [15, 25], long: [25, 40] },
  // How the movement is typically prescribed in metcon
  unit: opts.unit || 'reps',   // reps | meters | calories | seconds
  loadUnit: opts.loadUnit || 'kg',
  // Tags used by the generator to build coherent WODs
  tags: opts.tags || [],
  // Higher = more taxing (used to balance total volume in a WOD)
  intensity: opts.intensity || 3, // 1-5
})

export const MOVEMENTS = [
  // ═══════════════════ BODYWEIGHT (10) ═══════════════════
  mv('burpees', 'בורפי', 'Burpees', 'bodyweight', {
    ytId: 'auBLPXO8Fww',
    cues: ['חזה נוגע ברצפה', 'קפיצה עם ידיים מעל הראש', 'קצב אחיד', 'נשימה מתואמת'],
    reps: { short: [8, 15], medium: [10, 20], long: [15, 30] },
    tags: ['metcon', 'full_body', 'high_intensity'],
    intensity: 5, contraindications: ['wrist', 'lower_back'],
  }),
  mv('pushups', 'שכיבות סמיכה', 'Push-ups', 'bodyweight', {
    ytId: 'IODxDxX7oi4',
    cues: ['גוף בקו ישר', 'מרפקים ב-45°', 'חזה נוגע ברצפה', 'ידיים ברוחב כתפיים'],
    reps: { short: [10, 15], medium: [15, 25], long: [20, 40] },
    tags: ['metcon', 'push', 'upper_body'],
    intensity: 3, contraindications: ['wrist', 'shoulder'],
  }),
  mv('pullups', 'עליות מתח', 'Pull-ups', 'bodyweight', {
    ytId: 'eGo4IYlbE5g',
    cues: ['אחיזה מלאה', 'סנטר מעל המוט', 'שכמות למטה ולפני', 'לא לנדנד (Strict)'],
    reps: { short: [5, 10], medium: [8, 15], long: [10, 20] },
    tags: ['metcon', 'pull', 'gymnastics'], equipment: ['pullup_bar'],
    intensity: 4, contraindications: ['shoulder', 'elbow'],
  }),
  mv('situps', 'כפיפות בטן', 'Sit-ups', 'bodyweight', {
    ytId: 'jDwoBqPH0jk',
    cues: ['ידיים מעל הראש עד לרצפה', 'כפות רגליים צמודות', 'תנועה מלאה', 'לא למשוך צוואר'],
    reps: { short: [15, 25], medium: [20, 40], long: [30, 60] },
    tags: ['metcon', 'core'],
    intensity: 2, contraindications: ['lower_back'],
  }),
  mv('air_squats', 'סקוואט חופשי', 'Air Squats', 'bodyweight', {
    ytId: 'C_VtOYc6j5c',
    cues: ['ישבן מתחת למקבילה', 'עקבים על הרצפה', 'ברכיים בקו האצבעות', 'חזה למעלה'],
    reps: { short: [15, 25], medium: [20, 40], long: [30, 60] },
    tags: ['metcon', 'legs'],
    intensity: 2, contraindications: ['knee'],
  }),
  mv('hspu', 'שכיבות סמיכה על הידיים', 'Handstand Push-ups', 'bodyweight', {
    ytId: 'p6UDwB4Hycg',
    cues: ['ראש נוגע קלות ברצפה', 'קיר לגיבוי', 'ליבה נעולה', 'מרפקים ב-45°'],
    reps: { short: [3, 8], medium: [5, 12], long: [8, 15] },
    tags: ['metcon', 'gymnastics', 'push', 'skill'], equipment: ['wall'],
    intensity: 5, contraindications: ['shoulder', 'neck', 'wrist'],
  }),
  mv('pistol_squats', "סקוואט פיסטול", 'Pistol Squats', 'bodyweight', {
    ytId: 'qDCwVMlLmuk',
    cues: ['רגל אחת נעולה קדימה', 'ישבן מתחת למקבילה', 'עקב על הרצפה', 'איזון בזרועות'],
    reps: { short: [6, 10], medium: [8, 14], long: [10, 20] },
    tags: ['skill', 'legs', 'unilateral'],
    intensity: 4, contraindications: ['knee', 'ankle'],
  }),
  mv('toes_to_bar', 'רגליים למוט', 'Toes-to-Bar', 'bodyweight', {
    ytId: '_03pCKOv4l4',
    cues: ['אחיזה מלאה במוט', 'אצבעות רגליים נוגעות במוט', 'kipping לגיוס גב', 'ליבה פעילה'],
    reps: { short: [8, 12], medium: [10, 18], long: [15, 25] },
    tags: ['metcon', 'core', 'gymnastics'], equipment: ['pullup_bar'],
    intensity: 4, contraindications: ['shoulder', 'lower_back'],
  }),
  mv('knees_to_elbows', 'ברכיים למרפקים', 'Knees-to-Elbows', 'bodyweight', {
    ytId: '9nGjZgYQuVE',
    cues: ['תלוי במוט', 'ברכיים עד המרפקים', 'kipping מבוקר', 'שכמות פעילות'],
    reps: { short: [8, 15], medium: [12, 20], long: [15, 30] },
    tags: ['metcon', 'core', 'gymnastics'], equipment: ['pullup_bar'],
    intensity: 3, contraindications: ['shoulder', 'lower_back'],
  }),
  mv('dips', 'דיפים', 'Dips', 'bodyweight', {
    ytId: '2z8JmcrW-As',
    cues: ['מרפקים נעים אחורה', 'ירידה עד 90° במרפק', 'חזה מעל הידיים', 'שכמות למטה'],
    reps: { short: [8, 12], medium: [10, 18], long: [15, 25] },
    tags: ['metcon', 'push', 'upper_body'], equipment: ['dip_bars'],
    intensity: 4, contraindications: ['shoulder', 'chest'],
  }),

  // ═══════════════════ WEIGHTLIFTING / OLYMPIC (10) ═══════════════════
  mv('deadlift', 'דדליפט', 'Deadlift', 'weightlifting', {
    ytId: 'op9kVnSso6Q',
    cues: ['מוט מעל האמצע של כף הרגל', 'גב ישר', 'ליבה נעולה', 'דחיפה דרך העקבים'],
    reps: { short: [8, 12], medium: [10, 20], long: [15, 25] },
    rx: { male: 100, female: 70 }, scaled: { male: 70, female: 45 }, foundation: { male: 40, female: 25 },
    tags: ['metcon', 'strength', 'pull', 'posterior_chain'], equipment: ['barbell'],
    intensity: 5, contraindications: ['lower_back'],
  }),
  mv('thruster', 'תרסטר', 'Thruster', 'weightlifting', {
    ytId: 'L219ltL15zY',
    cues: ['סקוואט מלא לפני הדחיפה', 'מרפקים גבוהים בעמידה', 'דחיפה מהרגליים', 'נעילה מעל הראש'],
    reps: { short: [8, 12], medium: [10, 15], long: [12, 21] },
    rx: { male: 43, female: 30 }, scaled: { male: 30, female: 20 }, foundation: { male: 20, female: 15 },
    tags: ['metcon', 'full_body', 'high_intensity'], equipment: ['barbell'],
    intensity: 5, contraindications: ['shoulder', 'knee'],
  }),
  mv('squat_clean', 'סקוואט קלין', 'Squat Clean', 'weightlifting', {
    ytId: 'EKRiW9Yt3Ps',
    cues: ['מוט קרוב לגוף', 'קפיצה + משיכה עם הזרועות', 'קליטה בסקוואט עמוק', 'עמידה זקופה'],
    reps: { short: [5, 8], medium: [6, 12], long: [8, 15] },
    rx: { male: 60, female: 42 }, scaled: { male: 43, female: 30 }, foundation: { male: 30, female: 20 },
    tags: ['metcon', 'strength', 'skill', 'olympic'], equipment: ['barbell'],
    intensity: 5, contraindications: ['shoulder', 'wrist', 'knee'],
  }),
  mv('clean_and_jerk', 'קלין אנד ג׳רק', 'Clean and Jerk', 'weightlifting', {
    ytId: 'MO5PXryZTFA',
    cues: ['קלין לעמידה', 'דיפ קצר עם הרגליים', 'דחיפה + פיצול רגליים', 'נעילה מעל הראש'],
    reps: { short: [3, 6], medium: [5, 10], long: [8, 12] },
    rx: { male: 60, female: 42 }, scaled: { male: 43, female: 30 }, foundation: { male: 30, female: 20 },
    tags: ['metcon', 'strength', 'olympic'], equipment: ['barbell'],
    intensity: 5, contraindications: ['shoulder', 'wrist', 'knee'],
  }),
  mv('snatch', 'סנאץ׳', 'Snatch', 'weightlifting', {
    ytId: 'Nff4tpKD1_Y',
    cues: ['אחיזה רחבה', 'משיכה מהרגליים', 'קליטה מעל הראש בסקוואט', 'עמידה זקופה'],
    reps: { short: [3, 5], medium: [5, 8], long: [7, 12] },
    rx: { male: 43, female: 30 }, scaled: { male: 30, female: 20 }, foundation: { male: 20, female: 15 },
    tags: ['metcon', 'skill', 'olympic'], equipment: ['barbell'],
    intensity: 5, contraindications: ['shoulder', 'wrist', 'lower_back'],
  }),
  mv('overhead_press', 'לחיצה מעל הראש', 'Strict Overhead Press', 'weightlifting', {
    ytId: '_RlRDWO2jfg',
    cues: ['מוט מגובה הכתפיים', 'ראש בורח קדימה בסיום', 'ליבה נעולה', 'ללא עזרת רגליים'],
    reps: { short: [5, 8], medium: [6, 10], long: [8, 12] },
    rx: { male: 43, female: 30 }, scaled: { male: 30, female: 20 }, foundation: { male: 20, female: 12 },
    tags: ['strength', 'push', 'upper_body'], equipment: ['barbell'],
    intensity: 4, contraindications: ['shoulder', 'lower_back'],
  }),
  mv('push_press', 'פוש פרס', 'Push Press', 'weightlifting', {
    ytId: 'iaBVSJm78ko',
    cues: ['דיפ קצר עם הרגליים', 'דחיפה נמרצת', 'לא סקוואט - רק שבירה קלה בברכיים', 'נעילה מעל הראש'],
    reps: { short: [6, 10], medium: [8, 12], long: [10, 15] },
    rx: { male: 52, female: 35 }, scaled: { male: 35, female: 25 }, foundation: { male: 25, female: 15 },
    tags: ['metcon', 'push', 'upper_body'], equipment: ['barbell'],
    intensity: 4, contraindications: ['shoulder'],
  }),
  mv('push_jerk', 'פוש ג׳רק', 'Push Jerk', 'weightlifting', {
    ytId: 'YHT0nfQR6Yg',
    cues: ['דיפ + הנעה + קליטה בכיפוף ברכיים', 'ידיים נעולות מהר', 'עמידה זקופה', 'מסלול קצר'],
    reps: { short: [5, 8], medium: [7, 12], long: [10, 15] },
    rx: { male: 60, female: 42 }, scaled: { male: 43, female: 30 }, foundation: { male: 30, female: 20 },
    tags: ['metcon', 'push', 'olympic'], equipment: ['barbell'],
    intensity: 4, contraindications: ['shoulder', 'knee'],
  }),
  mv('split_jerk', 'ספליט ג׳רק', 'Split Jerk', 'weightlifting', {
    ytId: 'g_5FaJPzGe0',
    cues: ['דיפ נמרץ', 'רגל אחת קדימה השנייה אחורה', 'נעילה מעל הראש', 'החזרת הרגליים לעמידה'],
    reps: { short: [3, 6], medium: [5, 8], long: [6, 12] },
    rx: { male: 60, female: 42 }, scaled: { male: 43, female: 30 }, foundation: { male: 30, female: 20 },
    tags: ['skill', 'push', 'olympic'], equipment: ['barbell'],
    intensity: 5, contraindications: ['shoulder', 'knee', 'ankle'],
  }),
  mv('sdhp', 'סומו דדליפט הייפול', 'Sumo Deadlift High Pull', 'weightlifting', {
    ytId: 'r3rgAayaYaI',
    cues: ['רגליים רחבות', 'ידיים בין הרגליים', 'משיכה עד הסנטר', 'מרפקים גבוהים'],
    reps: { short: [10, 15], medium: [12, 20], long: [15, 25] },
    rx: { male: 34, female: 25 }, scaled: { male: 25, female: 15 }, foundation: { male: 15, female: 10 },
    tags: ['metcon', 'pull', 'full_body'], equipment: ['barbell'],
    intensity: 3, contraindications: ['lower_back', 'shoulder'],
  }),

  // ═══════════════════ KETTLEBELL (6) ═══════════════════
  mv('kb_swing', 'סווינג קטלבל', 'Kettlebell Swing', 'kettlebell', {
    ytId: 'YSxHifyI6s8',
    cues: ['היפ הינג', 'תנופה מהרגליים והאגן', 'קטלבל מגיע לגובה הראש (American) או הכתפיים (Russian)', 'שכמות נעולות'],
    reps: { short: [15, 25], medium: [20, 35], long: [30, 50] },
    rx: { male: 24, female: 16 }, scaled: { male: 16, female: 12 }, foundation: { male: 12, female: 8 },
    tags: ['metcon', 'posterior_chain', 'full_body'], equipment: ['kettlebell'],
    intensity: 4, contraindications: ['lower_back', 'shoulder'],
  }),
  mv('kb_snatch', 'סנאץ׳ קטלבל', 'Kettlebell Snatch', 'kettlebell', {
    ytId: 'lJPvz0T__1w',
    cues: ['סווינג עוצמתי', 'משיכה גבוהה', 'סיבוב סביב היד', 'נעילה מעל הראש'],
    reps: { short: [8, 15], medium: [10, 20], long: [15, 30] },
    rx: { male: 24, female: 16 }, scaled: { male: 16, female: 12 }, foundation: { male: 12, female: 8 },
    tags: ['metcon', 'unilateral', 'skill'], equipment: ['kettlebell'],
    intensity: 4, contraindications: ['shoulder', 'wrist', 'lower_back'],
  }),
  mv('kb_clean', 'קלין קטלבל', 'Kettlebell Clean', 'kettlebell', {
    ytId: 'Ohn6P8oMkzE',
    cues: ['סווינג לתוך "rack position"', 'קטלבל נוגע בזרוע ולא חובט', 'מרפק צמוד לצלעות', 'סקוואט אופציונלי'],
    reps: { short: [10, 15], medium: [15, 25], long: [20, 35] },
    rx: { male: 24, female: 16 }, scaled: { male: 16, female: 12 }, foundation: { male: 12, female: 8 },
    tags: ['metcon', 'skill', 'unilateral'], equipment: ['kettlebell'],
    intensity: 3, contraindications: ['shoulder', 'wrist'],
  }),
  mv('kb_deadlift', 'דדליפט קטלבל', 'Kettlebell Deadlift', 'kettlebell', {
    ytId: 'wrPO2sIWXtc',
    cues: ['רגליים ברוחב אגן', 'קטלבל בין הרגליים', 'גב ישר', 'דחיפה דרך העקבים'],
    reps: { short: [12, 20], medium: [15, 25], long: [20, 30] },
    rx: { male: 32, female: 24 }, scaled: { male: 24, female: 16 }, foundation: { male: 16, female: 8 },
    tags: ['strength', 'posterior_chain'], equipment: ['kettlebell'],
    intensity: 3, contraindications: ['lower_back'],
  }),
  mv('kb_thruster', 'תרסטר קטלבל', 'Kettlebell Thruster', 'kettlebell', {
    ytId: 'GLQ7RXWQyGY',
    cues: ['סקוואט מלא עם קטלבל ב-rack (או שניים)', 'עלייה + דחיפה מעל הראש', 'רצף חלק'],
    reps: { short: [10, 15], medium: [12, 20], long: [15, 25] },
    rx: { male: 24, female: 16 }, scaled: { male: 16, female: 12 }, foundation: { male: 12, female: 8 },
    tags: ['metcon', 'full_body'], equipment: ['kettlebell'],
    intensity: 5, contraindications: ['shoulder', 'knee'],
  }),
  mv('goblet_squat', 'סקוואט גוֹבּלֶט', 'Goblet Squat', 'kettlebell', {
    ytId: 'MeIiIdhvXT4',
    cues: ['קטלבל בחזה בשתי ידיים', 'מרפקים כלפי מטה', 'סקוואט עמוק', 'חזה גבוה'],
    reps: { short: [10, 15], medium: [15, 25], long: [20, 30] },
    rx: { male: 24, female: 16 }, scaled: { male: 16, female: 12 }, foundation: { male: 12, female: 8 },
    tags: ['strength', 'legs'], equipment: ['kettlebell'],
    intensity: 3, contraindications: ['knee'],
  }),

  // ═══════════════════ GYMNASTICS (10) ═══════════════════
  mv('wall_walks', 'הליכה על הקיר', 'Wall Walks', 'gymnastics', {
    ytId: 'p6UDwB4Hycg',
    cues: ['התחלה מפלאנק גבוה', 'רגליים מטפסות על הקיר', 'ידיים זוחלות לכיוון הקיר', 'ליבה נעולה'],
    reps: { short: [3, 6], medium: [5, 10], long: [8, 15] },
    tags: ['skill', 'gymnastics', 'upper_body'], equipment: ['wall'],
    intensity: 4, contraindications: ['shoulder', 'wrist'],
  }),
  mv('handstand_walks', 'הליכה על הידיים', 'Handstand Walks', 'gymnastics', {
    ytId: 'Kk3vywoS3Bc',
    cues: ['עמידת ידיים מאוזנת', 'הצטרפות משקל בצדדים', 'עיניים בין הידיים', 'צעדים קטנים'],
    reps: { short: [5, 10], medium: [10, 20], long: [15, 30] }, unit: 'meters',
    tags: ['skill', 'gymnastics'],
    intensity: 5, contraindications: ['shoulder', 'wrist', 'neck'],
  }),
  mv('bar_muscle_up', 'מאסל אפ מוט', 'Bar Muscle-up', 'gymnastics', {
    ytId: 'siJT0v65MEM',
    cues: ['kipping עוצמתי', 'משיכה עד המותניים למוט', 'תזוזה של כובד הגוף מעל המוט', 'לחיצה לעמידה'],
    reps: { short: [3, 5], medium: [5, 10], long: [7, 12] },
    tags: ['skill', 'gymnastics', 'pull', 'push'], equipment: ['pullup_bar'],
    intensity: 5, contraindications: ['shoulder', 'elbow', 'wrist'],
  }),
  mv('ring_muscle_up', 'מאסל אפ טבעות', 'Ring Muscle-up', 'gymnastics', {
    ytId: 'iCsF__uHRBM',
    cues: ['אחיזת false grip', 'kip + משיכה עוצמתית', 'מעבר מהיר לתמיכה', 'לחיצה מלאה'],
    reps: { short: [3, 5], medium: [5, 8], long: [6, 10] },
    tags: ['skill', 'gymnastics'], equipment: ['rings'],
    intensity: 5, contraindications: ['shoulder', 'elbow'],
  }),
  mv('rope_climbs', 'טיפוס על חבל', 'Rope Climbs', 'gymnastics', {
    ytId: 'BUr7cewMGZk',
    cues: ['נעילת רגליים על החבל', 'משיכה גדולה + סגירה', 'מבט למעלה', 'ירידה מבוקרת'],
    reps: { short: [2, 4], medium: [3, 6], long: [5, 8] },
    tags: ['skill', 'pull', 'full_body'], equipment: ['climbing_rope'],
    intensity: 5, contraindications: ['shoulder', 'elbow', 'hand'],
  }),
  mv('l_sits', 'L-סיט', 'L-sits', 'gymnastics', {
    ytId: 'IucAllsdz3o',
    cues: ['תמיכה על הידיים', 'רגליים ישרות במקביל לרצפה', 'ליבה נעולה', 'שכמות למטה'],
    reps: { short: [10, 20], medium: [15, 30], long: [20, 45] }, unit: 'seconds',
    tags: ['skill', 'core'],
    intensity: 4, contraindications: ['shoulder', 'wrist'],
  }),
  mv('skin_the_cat', 'סקין דה קט', 'Skin the Cat', 'gymnastics', {
    ytId: 'oL0Zg4-ktGE',
    cues: ['תלייה על טבעות', 'הפיכת גוף פנימה בין הזרועות', 'תנועה איטית', 'שליטה מלאה'],
    reps: { short: [3, 5], medium: [4, 8], long: [6, 10] },
    tags: ['skill', 'gymnastics', 'mobility'], equipment: ['rings'],
    intensity: 4, contraindications: ['shoulder'],
  }),
  mv('ring_rows', 'חתירת טבעות', 'Ring Rows', 'gymnastics', {
    ytId: 'HLYE5uZ8Nk8',
    cues: ['גוף ישר כלוח', 'שכמות ראשונות', 'חזה נוגע בטבעות', 'קושי לפי זווית'],
    reps: { short: [10, 15], medium: [12, 20], long: [15, 25] },
    tags: ['metcon', 'pull', 'upper_body'], equipment: ['rings'],
    intensity: 3, contraindications: ['shoulder', 'elbow'],
  }),
  mv('ghd_situps', 'GHD כפיפות בטן', 'GHD Sit-ups', 'gymnastics', {
    ytId: 'FQKlKZ3v4Do',
    cues: ['רגליים מאובטחות', 'ראש חוזר עד לגובה הרגליים', 'עלייה עם ידיים בשליטה', 'ליבה מקצועית'],
    reps: { short: [10, 15], medium: [15, 25], long: [20, 40] },
    tags: ['metcon', 'core'], equipment: ['ghd_machine'],
    intensity: 4, contraindications: ['lower_back', 'neck'],
  }),
  mv('ghd_hip_ext', 'GHD הרמת ירכיים', 'GHD Hip Extensions', 'gymnastics', {
    ytId: 'gLmyGwvNhLg',
    cues: ['רגליים מאובטחות', 'ירידה מבוקרת', 'עלייה עד קו ישר', 'לא לעבור מעל האופק'],
    reps: { short: [10, 15], medium: [15, 25], long: [20, 40] },
    tags: ['strength', 'posterior_chain'], equipment: ['ghd_machine'],
    intensity: 3, contraindications: ['lower_back'],
  }),

  // ═══════════════════ BOX (3) ═══════════════════
  mv('box_jumps', 'קפיצות קופסה', 'Box Jumps', 'box', {
    ytId: '52r_Ul5k03g',
    cues: ['נחיתה רכה על הקופסה', 'עמידה מלאה בסיום', 'ירידה מבוקרת', 'לא נעילה חזקה של הברך'],
    reps: { short: [10, 20], medium: [15, 30], long: [20, 40] },
    rx: { male: 60, female: 50 }, scaled: { male: 50, female: 40 }, foundation: { male: 40, female: 30 },
    loadUnit: 'cm', tags: ['metcon', 'plyometric', 'legs'], equipment: ['box'],
    intensity: 4, contraindications: ['knee', 'ankle', 'achilles'],
  }),
  mv('box_step_ups', 'עלייה על הקופסה', 'Box Step-ups', 'box', {
    ytId: 'PENpEsSc5eA',
    cues: ['רגל אחת מלאה על הקופסה', 'דחיפה דרך העקב', 'עמידה זקופה למעלה', 'ירידה מבוקרת'],
    reps: { short: [15, 25], medium: [20, 40], long: [30, 60] },
    rx: { male: 60, female: 50 }, scaled: { male: 50, female: 40 }, foundation: { male: 40, female: 30 },
    loadUnit: 'cm', tags: ['metcon', 'legs', 'unilateral'], equipment: ['box'],
    intensity: 2, contraindications: ['knee'],
  }),
  mv('box_overs', 'קפיצה מעל הקופסה', 'Box Overs', 'box', {
    ytId: 'z0-CB4CVDW8',
    cues: ['קפיצה על הקופסה או מעליה', 'נחיתה משני הצדדים', 'רצף מהיר', 'שמירה על יציבות'],
    reps: { short: [8, 15], medium: [12, 20], long: [15, 30] },
    rx: { male: 60, female: 50 }, scaled: { male: 50, female: 40 }, foundation: { male: 40, female: 30 },
    loadUnit: 'cm', tags: ['metcon', 'plyometric'], equipment: ['box'],
    intensity: 4, contraindications: ['knee', 'ankle'],
  }),

  // ═══════════════════ CARDIO (7) ═══════════════════
  mv('running', 'ריצה', 'Running', 'cardio', {
    ytId: 'brFHyOtTwH4',
    cues: ['נחיתה על אמצע כף הרגל', 'ידיים רפויות', 'נשימה קצבית', 'קיצור צעד ברמת עייפות'],
    reps: { short: [200, 400], medium: [400, 800], long: [800, 1600] }, unit: 'meters',
    tags: ['metcon', 'endurance'],
    intensity: 3, contraindications: ['knee', 'ankle', 'achilles'],
  }),
  mv('rowing', 'חתירה', 'Rowing', 'cardio', {
    ytId: 'S1uwuAiTG0M',
    cues: ['רגליים → ליבה → ידיים', 'החזרה בסדר הפוך', 'קטב 24-28', 'לא לגרור את הידית לחזה'],
    reps: { short: [250, 500], medium: [500, 1000], long: [1000, 2000] }, unit: 'meters',
    tags: ['metcon', 'endurance', 'full_body'], equipment: ['rower'],
    intensity: 3, contraindications: ['lower_back'],
  }),
  mv('double_unders', 'קפיצות כפולות', 'Double-unders', 'cardio', {
    ytId: '82jNjDS19lg',
    cues: ['קפיצה קלה על אצבעות הרגל', 'סיבוב מהיר בפרקי כף היד', 'מרפקים צמודים לצלעות', 'ריתמוס אחיד'],
    reps: { short: [30, 50], medium: [50, 100], long: [75, 150] },
    tags: ['metcon', 'skill', 'cardio'], equipment: ['jump_rope'],
    intensity: 3, contraindications: ['achilles', 'calf'],
  }),
  mv('single_unders', 'קפיצות בודדות', 'Single-unders', 'cardio', {
    ytId: '1BZM2Vre5oc',
    cues: ['קפיצה נמוכה', 'קצב אחיד', 'ידיים צמודות', 'נשימה שקטה'],
    reps: { short: [50, 100], medium: [75, 150], long: [100, 200] },
    tags: ['metcon', 'cardio'], equipment: ['jump_rope'],
    intensity: 2, contraindications: ['achilles', 'calf'],
  }),
  mv('assault_bike', 'אסולט בייק', 'Assault Bike', 'cardio', {
    ytId: 'MHKfnUlDG9U',
    cues: ['עבודת ידיים ורגליים במקביל', 'לגלגל דרך הרגליים', 'להישאר זקוף', 'לנשום עמוק'],
    reps: { short: [10, 20], medium: [15, 30], long: [25, 50] }, unit: 'calories',
    tags: ['metcon', 'endurance', 'full_body'], equipment: ['assault_bike'],
    intensity: 5, contraindications: ['knee'],
  }),
  mv('ski_erg', 'סקי ארג', 'Ski Erg', 'cardio', {
    ytId: 'YCT7EAY52pA',
    cues: ['ידיים למעלה + היפ הינג', 'משיכה עד הירכיים', 'עבודת ליבה', 'סיום בשליטה'],
    reps: { short: [200, 400], medium: [400, 800], long: [800, 1500] }, unit: 'meters',
    tags: ['metcon', 'upper_body', 'endurance'], equipment: ['ski_erg'],
    intensity: 4, contraindications: ['shoulder', 'lower_back'],
  }),
  mv('bike_erg', 'בייק ארג', 'Bike Erg', 'cardio', {
    ytId: 'OKvFcNJTgqU',
    cues: ['תנועה מעגלית של הרגליים', 'ידיים רפויות על הכידון', 'קצב אחיד', 'נשימה עמוקה'],
    reps: { short: [10, 20], medium: [15, 30], long: [25, 50] }, unit: 'calories',
    tags: ['metcon', 'endurance', 'legs'], equipment: ['bike_erg'],
    intensity: 3, contraindications: ['knee'],
  }),

  // ═══════════════════ ODD OBJECT (8) ═══════════════════
  mv('sandbag_carry', 'סחיבת שקית חול', 'Sandbag Carry', 'odd_object', {
    ytId: 'v4x1nSk-9m0',
    cues: ['השקית על הכתף או בצוואר', 'גב ישר', 'צעדים מבוקרים', 'לנשום דרך הצפיפות'],
    reps: { short: [20, 40], medium: [40, 80], long: [60, 120] }, unit: 'meters',
    rx: { male: 40, female: 25 }, scaled: { male: 25, female: 15 }, foundation: { male: 15, female: 10 },
    tags: ['metcon', 'strength', 'full_body'], equipment: ['sandbag'],
    intensity: 4, contraindications: ['lower_back'],
  }),
  mv('sandbag_clean', 'קלין שקית חול', 'Sandbag Clean', 'odd_object', {
    ytId: 'VBHzKlxsiys',
    cues: ['אחיזה חזקה בשקית', 'קלין דרך המותניים', 'סיום בכתף', 'הורדה מבוקרת'],
    reps: { short: [8, 15], medium: [10, 20], long: [15, 25] },
    rx: { male: 40, female: 25 }, scaled: { male: 25, female: 15 }, foundation: { male: 15, female: 10 },
    tags: ['metcon', 'strength', 'full_body'], equipment: ['sandbag'],
    intensity: 5, contraindications: ['lower_back', 'shoulder'],
  }),
  mv('yoke_carry', 'סחיבת יוֹק', 'Yoke Carry', 'odd_object', {
    ytId: '0kTGCsOc-Fc',
    cues: ['יוק על הכתפיים', 'צעדים קצרים', 'שמירה על יציבה זקופה', 'ליבה נעולה חזק'],
    reps: { short: [15, 25], medium: [20, 40], long: [30, 60] }, unit: 'meters',
    rx: { male: 100, female: 60 }, scaled: { male: 70, female: 40 }, foundation: { male: 40, female: 25 },
    tags: ['strength', 'full_body'], equipment: ['yoke'],
    intensity: 5, contraindications: ['lower_back', 'knee', 'shoulder'],
  }),
  mv('sled_push', 'דחיפת מגלשה', 'Sled Push', 'odd_object', {
    ytId: 'nQ2Ea34zJyc',
    cues: ['גוף כפוף קדימה', 'דחיפה חזקה מהרגליים', 'צעדים קצרים ומהירים', 'ידיים ישרות'],
    reps: { short: [15, 25], medium: [20, 40], long: [30, 60] }, unit: 'meters',
    rx: { male: 90, female: 60 }, scaled: { male: 60, female: 40 }, foundation: { male: 40, female: 20 },
    tags: ['metcon', 'strength', 'legs'], equipment: ['sled'],
    intensity: 5, contraindications: ['lower_back', 'knee'],
  }),
  mv('sled_drag', 'גרירת מגלשה', 'Sled Drag', 'odd_object', {
    ytId: 'YurAv7WEr8I',
    cues: ['גרירה עם רתמה או ידיים', 'צעדים איתנים', 'גוף מעט נטוי', 'ידיים חזקות'],
    reps: { short: [15, 25], medium: [20, 40], long: [30, 60] }, unit: 'meters',
    rx: { male: 90, female: 60 }, scaled: { male: 60, female: 40 }, foundation: { male: 40, female: 20 },
    tags: ['metcon', 'strength', 'posterior_chain'], equipment: ['sled'],
    intensity: 4, contraindications: ['lower_back', 'knee'],
  }),
  mv('farmer_carry', 'סחיבת חקלאי', 'Farmer Carry', 'odd_object', {
    ytId: 'Fkzk_RqlYig',
    cues: ['משקל בכל יד', 'עמידה זקופה', 'שכמות למטה', 'צעדים אחידים'],
    reps: { short: [15, 25], medium: [20, 40], long: [30, 60] }, unit: 'meters',
    rx: { male: 32, female: 24 }, scaled: { male: 24, female: 16 }, foundation: { male: 16, female: 10 },
    tags: ['metcon', 'strength', 'core', 'grip'], equipment: ['dumbbell', 'kettlebell'],
    intensity: 3, contraindications: ['shoulder', 'lower_back'],
  }),
  mv('atlas_stone', 'אטלס סטון', 'Atlas Stone Lift', 'odd_object', {
    ytId: 'nT3nSTRD9jY',
    cues: ['גיבוב מעל האבן', 'הרמה לחזה עם ירכיים', 'הנחה על המדף בגובה', 'הורדה מבוקרת'],
    reps: { short: [3, 6], medium: [5, 10], long: [8, 15] },
    rx: { male: 60, female: 40 }, scaled: { male: 40, female: 25 }, foundation: { male: 25, female: 15 },
    tags: ['strength', 'full_body'], equipment: ['atlas_stone'],
    intensity: 5, contraindications: ['lower_back', 'shoulder'],
  }),
  mv('tire_flip', 'הפיכת צמיג', 'Tire Flip', 'odd_object', {
    ytId: 'oMYcnehcuVc',
    cues: ['גיבוב עמוק', 'הרמה עם הרגליים', 'דחיפה עם הכתפיים בזווית עולה', 'הפיכה עם צעד קדימה'],
    reps: { short: [3, 6], medium: [5, 10], long: [8, 15] },
    rx: { male: 150, female: 100 }, scaled: { male: 100, female: 60 }, foundation: { male: 60, female: 40 },
    tags: ['strength', 'full_body'], equipment: ['tire'],
    intensity: 5, contraindications: ['lower_back', 'shoulder', 'knee'],
  }),

  // ═══════════════════ WALL BALL (1) ═══════════════════
  mv('wall_ball_shots', 'זריקות כדור לקיר', 'Wall Ball Shots', 'wall_ball', {
    ytId: 'yTsWK_G4x7g',
    cues: ['סקוואט מלא עם הכדור בחזה', 'זריקה למטרה בקיר', 'תפיסה חוזרת', 'רצף אחיד'],
    reps: { short: [15, 25], medium: [20, 40], long: [30, 50] },
    rx: { male: 9, female: 6 }, scaled: { male: 6, female: 4 }, foundation: { male: 4, female: 3 },
    tags: ['metcon', 'full_body', 'high_intensity'], equipment: ['wall_ball', 'wall'],
    intensity: 5, contraindications: ['shoulder', 'knee'],
  }),

  // ═══════════════════ DUMBBELL (8) ═══════════════════
  mv('db_snatch', 'סנאץ׳ משקולת יד', 'Dumbbell Snatch', 'dumbbell', {
    ytId: 'iBWmuXY-mS8',
    cues: ['משקולת בין הרגליים', 'משיכה מהרגליים', 'סיבוב היד לנעילה מעל הראש', 'החלפת ידיים כל חזרה'],
    reps: { short: [10, 20], medium: [15, 30], long: [20, 40] },
    rx: { male: 22.5, female: 15 }, scaled: { male: 15, female: 10 }, foundation: { male: 10, female: 5 },
    tags: ['metcon', 'unilateral', 'full_body'], equipment: ['dumbbell'],
    intensity: 4, contraindications: ['shoulder', 'lower_back'],
  }),
  mv('db_thruster', 'תרסטר משקולות יד', 'Dumbbell Thruster', 'dumbbell', {
    ytId: 'Ss1KwzDS7cM',
    cues: ['שתי משקולות ב-rack', 'סקוואט + לחיצה עליונה', 'רצף חלק', 'נעילה מעל הראש'],
    reps: { short: [10, 15], medium: [12, 20], long: [15, 25] },
    rx: { male: 22.5, female: 15 }, scaled: { male: 15, female: 10 }, foundation: { male: 10, female: 5 },
    tags: ['metcon', 'full_body'], equipment: ['dumbbell'],
    intensity: 5, contraindications: ['shoulder', 'knee'],
  }),
  mv('db_clean', 'קלין משקולות יד', 'Dumbbell Clean', 'dumbbell', {
    ytId: 'JC0iZgrDqLc',
    cues: ['משקולות בין הרגליים', 'קלין ל-rack position', 'מרפקים גבוהים', 'עמידה זקופה'],
    reps: { short: [10, 15], medium: [12, 20], long: [15, 25] },
    rx: { male: 22.5, female: 15 }, scaled: { male: 15, female: 10 }, foundation: { male: 10, female: 5 },
    tags: ['metcon', 'strength'], equipment: ['dumbbell'],
    intensity: 4, contraindications: ['lower_back', 'shoulder'],
  }),
  mv('db_deadlift', 'דדליפט משקולות יד', 'Dumbbell Deadlift', 'dumbbell', {
    ytId: 'gTUdGO2E4dY',
    cues: ['רגליים ברוחב אגן', 'משקולות בצד הגוף', 'גב ישר', 'דחיפה דרך העקבים'],
    reps: { short: [12, 20], medium: [15, 25], long: [20, 30] },
    rx: { male: 22.5, female: 15 }, scaled: { male: 15, female: 10 }, foundation: { male: 10, female: 5 },
    tags: ['strength', 'posterior_chain'], equipment: ['dumbbell'],
    intensity: 3, contraindications: ['lower_back'],
  }),
  mv('db_shoulder_press', 'לחיצת כתף משקולות יד', 'Dumbbell Shoulder Press', 'dumbbell', {
    ytId: 'B-aVuyhvLHU',
    cues: ['משקולות בגובה הכתף', 'לחיצה עליונה', 'לא לגבות', 'ליבה נעולה'],
    reps: { short: [8, 12], medium: [10, 15], long: [12, 20] },
    rx: { male: 22.5, female: 15 }, scaled: { male: 15, female: 10 }, foundation: { male: 10, female: 5 },
    tags: ['strength', 'push', 'upper_body'], equipment: ['dumbbell'],
    intensity: 3, contraindications: ['shoulder'],
  }),
  mv('db_push_press', 'פוש פרס משקולות יד', 'Dumbbell Push Press', 'dumbbell', {
    ytId: 'lJP1L-uy_-U',
    cues: ['דיפ קצר עם הרגליים', 'דחיפה מעל הראש', 'ידיים ננעלות', 'רצף אחיד'],
    reps: { short: [10, 15], medium: [12, 20], long: [15, 25] },
    rx: { male: 22.5, female: 15 }, scaled: { male: 15, female: 10 }, foundation: { male: 10, female: 5 },
    tags: ['metcon', 'push'], equipment: ['dumbbell'],
    intensity: 4, contraindications: ['shoulder'],
  }),
  mv('db_bench_press', 'לחיצת חזה משקולות יד', 'Dumbbell Bench Press', 'dumbbell', {
    ytId: 'VmB1G1K7v94',
    cues: ['ישיבה על ספסל', 'משקולות ליד החזה', 'לחיצה מלאה למעלה', 'שכמות נעולות'],
    reps: { short: [8, 12], medium: [10, 15], long: [12, 20] },
    rx: { male: 22.5, female: 15 }, scaled: { male: 15, female: 10 }, foundation: { male: 10, female: 5 },
    tags: ['strength', 'push', 'chest'], equipment: ['dumbbell', 'bench'],
    intensity: 3, contraindications: ['shoulder', 'chest'],
  }),
  mv('db_oh_walking_lunges', 'פס דוכ עם משקולות מעל הראש', 'DB Overhead Walking Lunges', 'dumbbell', {
    ytId: 'gCVaAIeIcT8',
    cues: ['משקולות נעולות מעל הראש', 'צעד ארוך קדימה', 'ברך אחורית נוגעת קלות', 'עמידה זקופה'],
    reps: { short: [10, 15], medium: [15, 20], long: [20, 30] },
    rx: { male: 22.5, female: 15 }, scaled: { male: 15, female: 10 }, foundation: { male: 10, female: 5 },
    tags: ['metcon', 'legs', 'core'], equipment: ['dumbbell'],
    intensity: 5, contraindications: ['shoulder', 'knee', 'lower_back'],
  }),

  // ═══════════════════ OTHER FUNCTIONAL (3) ═══════════════════
  mv('bear_crawl', 'זחילת דוב', 'Bear Crawl', 'other_functional', {
    ytId: 't_Q4pWZMoCM',
    cues: ['ידיים וברכיים על הרצפה', 'ברכיים 5 ס"מ מעל הרצפה', 'תנועה בקורדינציה יד-רגל נגדית', 'ליבה נעולה'],
    reps: { short: [15, 25], medium: [20, 40], long: [30, 60] }, unit: 'meters',
    tags: ['metcon', 'full_body', 'core'],
    intensity: 3, contraindications: ['wrist', 'knee'],
  }),
  mv('burpee_box_jump_overs', 'בורפי בוקס ג׳אמפ אוברס', 'Burpee Box Jump Overs', 'other_functional', {
    ytId: 'Bkv1AL9OY5s',
    cues: ['בורפי מלא', 'קפיצה על הקופסה', 'מעבר לצד השני', 'רצף מהיר'],
    reps: { short: [6, 12], medium: [10, 15], long: [12, 20] },
    rx: { male: 60, female: 50 }, scaled: { male: 50, female: 40 }, foundation: { male: 40, female: 30 },
    loadUnit: 'cm', tags: ['metcon', 'full_body', 'high_intensity'], equipment: ['box'],
    intensity: 5, contraindications: ['knee', 'ankle', 'wrist'],
  }),
  mv('devils_press', 'דבילס פרס', "Devil's Press", 'other_functional', {
    ytId: 'ppzQdWJKKgo',
    cues: ['בורפי עם משקולות', 'סנאץ׳ כפול לסיום', 'רצף חלק', 'ליבה נעולה כל הדרך'],
    reps: { short: [6, 10], medium: [8, 15], long: [10, 20] },
    rx: { male: 22.5, female: 15 }, scaled: { male: 15, female: 10 }, foundation: { male: 10, female: 5 },
    tags: ['metcon', 'full_body', 'high_intensity'], equipment: ['dumbbell'],
    intensity: 5, contraindications: ['shoulder', 'lower_back', 'wrist'],
  }),
]

// ─── Helpers ────────────────────────────────────────────────

export const MOVEMENT_BY_ID = Object.fromEntries(MOVEMENTS.map(m => [m.id, m]))

export function movementsByCategory(catId) {
  return MOVEMENTS.filter(m => m.category === catId)
}

export function filterByInjuries(movements, injuries = []) {
  if (!injuries?.length) return movements
  const injurySet = new Set(injuries.map(i => (i || '').toLowerCase()))
  return movements.filter(m => !m.contraindications.some(c => injurySet.has(c)))
}

export function movementsByEquipment(equipmentList) {
  if (!equipmentList?.length) return MOVEMENTS
  const set = new Set(equipmentList)
  return MOVEMENTS.filter(m =>
    m.equipment.length === 0 || m.equipment.every(e => set.has(e))
  )
}

// Sum "cost" of a movement list — used to balance total volume in a WOD
export function totalIntensity(movements) {
  return movements.reduce((sum, m) => sum + (m.intensity || 3), 0)
}
