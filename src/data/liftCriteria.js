// Per-movement technique criteria, evaluated against the angles measured by
// services/poseAnalysis.
//
// Scope note, deliberately conservative: a single 2D clip shot from the side
// gives reliable sagittal-plane information — depth, torso lean, joint flexion
// and extension. It cannot see knees caving inward, hip shift left-to-right,
// or bar path relative to midfoot, all of which need a front view or an actual
// barbell detector. Those are listed per movement as `notVisible` so the report
// says what it could not check instead of implying a clean bill of health.

export const DISCIPLINES = {
  weightlifting: { he: 'הנפות', en: 'Weightlifting' },
  gymnastics:    { he: 'ג׳ימנסטיקס', en: 'Gymnastics' },
}

// A check is one of:
//   depth   — did the hip crease drop below the knee at any point
//   max     — metric's peak must stay at or under `limit`
//   min     — metric's low point must reach at or under `limit` (range of motion)
//   atLeast — metric's peak must reach at least `limit` (extension/lockout)
export const MOVEMENTS = [
  // ── הנפות ────────────────────────────────────────────────────────
  {
    id: 'back_squat',
    he: 'סקוואט אחורי',
    en: 'Back Squat',
    discipline: 'weightlifting',
    cameraHint: 'צלם מהצד, כל הגוף בפריים, מרחק 2–3 מטר, גובה מותן',
    checks: [
      { id:'depth', he:'עומק', type:'depth',
        pass:'הירך ירדה מתחת לקו הברך',
        fail:'לא הגעת לעומק מלא — הירך נעצרה מעל הברך',
        tip:'עבוד על ניידות קרסול ומתיחת מקרבים. נסה סקוואט לתיבה בגובה שמאלץ אותך לרדת קצת יותר בכל שבוע.' },
      { id:'torso', he:'זקיפות גב', type:'max', metric:'torsoLean', stat:'max', limit: 50,
        pass:'הגב נשאר בזווית סבירה לאורך התנועה',
        fail:'נטיית פלג גוף עליון קדימה גדולה מדי — זה מעביר עומס לגב התחתון',
        tip:'חזק את הגב העליון והליבה. סקוואט קדמי או Goblet ילמדו אותך להישאר זקוף.' },
      { id:'knee_rom', he:'כיפוף ברך', type:'min', metric:'knee', stat:'min', limit: 100,
        pass:'טווח כיפוף הברך מלא',
        fail:'הברך לא התכופפה מספיק — הסקוואט חלקי',
        tip:'רד לאט יותר וספור 3 שניות בירידה כדי לשלוט בטווח.' },
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'hip', stat:'max', limit: 165,
        pass:'הירך ננעלה במלואה בסיום',
        fail:'לא ננעלת עד הסוף בין החזרות',
        tip:'סיים כל חזרה בעמידה מלאה עם כיווץ עכוז לפני שאתה יורד שוב.' },
    ],
    notVisible: ['קריסת ברכיים פנימה (דורש צילום מלפנים)', 'הסחה של האגן לצד אחד'],
  },
  {
    id: 'front_squat',
    he: 'סקוואט קדמי',
    en: 'Front Squat',
    discipline: 'weightlifting',
    cameraHint: 'צלם מהצד, כל הגוף בפריים',
    checks: [
      { id:'depth', he:'עומק', type:'depth',
        pass:'הירך ירדה מתחת לקו הברך',
        fail:'לא הגעת לעומק מלא',
        tip:'בסקוואט קדמי העומק קריטי לשמירה על המוט. עבוד על ניידות קרסול.' },
      { id:'torso', he:'זקיפות גב', type:'max', metric:'torsoLean', stat:'max', limit: 35,
        pass:'פלג הגוף העליון נשאר זקוף כנדרש',
        fail:'נטייה קדימה גדולה מדי — בסקוואט קדמי זה מפיל את המוט',
        tip:'חזק גב עליון וניידות שורש כף יד. נסה להחזיק מרפקים גבוהים לאורך כל החזרה.' },
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'hip', stat:'max', limit: 165,
        pass:'נעילה מלאה בסיום',
        fail:'לא ננעלת עד הסוף',
        tip:'עמידה מלאה, מרפקים גבוהים, ואז החזרה הבאה.' },
    ],
    notVisible: ['גובה המרפקים', 'קריסת ברכיים פנימה'],
  },
  {
    id: 'deadlift',
    he: 'דדליפט',
    en: 'Deadlift',
    discipline: 'weightlifting',
    cameraHint: 'צלם מהצד בגובה המוט, כל הגוף בפריים',
    checks: [
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'hip', stat:'max', limit: 168,
        pass:'נעילת ירך מלאה בסיום',
        fail:'לא ננעלת במלואך — הירך נשארה כפופה',
        tip:'סיים עם כיווץ עכוז ואגן מתחת לגוף. אל תיטה לאחור — זה לא נעילה.' },
      { id:'start_torso', he:'זווית גב בהתחלה', type:'max', metric:'torsoLean', stat:'max', limit: 75,
        pass:'זווית הגב בהתחלה סבירה',
        fail:'הגב כמעט מקביל לרצפה — הירך גבוהה מדי או המוט רחוק',
        tip:'הורד את הירך והבא את המוט קרוב לשוק לפני המשיכה.' },
      { id:'knee_ext', he:'יישור ברך', type:'atLeast', metric:'knee', stat:'max', limit: 168,
        pass:'הברכיים יושרו בסיום',
        fail:'הברכיים לא יושרו במלואן',
        tip:'נעל ברך וירך יחד בסוף המשיכה.' },
    ],
    notVisible: ['עיגול הגב התחתון (קשה למדוד ב-2D)', 'מסלול המוט ביחס לאמצע כף הרגל'],
  },
  {
    id: 'clean',
    he: 'ניקוי (Clean)',
    en: 'Clean',
    discipline: 'weightlifting',
    cameraHint: 'צלם מהצד, השאר מרחק שהמוט לא יוצא מהפריים בהנפה',
    checks: [
      { id:'catch_depth', he:'עומק הקבלה', type:'depth',
        pass:'ירדת מתחת למוט לקבלה',
        fail:'הקבלה הייתה גבוהה — לא ירדת מספיק תחת המוט',
        tip:'עבוד על מהירות ירידה תחת המוט. תרגל Clean מהתלייה עם משקל קל.' },
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit: 165,
        pass:'פתיחת ירך מלאה לפני הירידה',
        fail:'לא פתחת את הירך במלואה לפני שירדת תחת המוט',
        tip:'המשיכה השנייה חייבת להסתיים בפתיחה מלאה. תרגל משיכות גבוהות.' },
      { id:'lockout', he:'עמידה בסיום', type:'atLeast', metric:'knee', stat:'max', limit: 165,
        pass:'עמידה מלאה בסיום',
        fail:'לא השלמת עמידה בסיום',
        tip:'קום עד הסוף לפני שאתה מוריד את המוט.' },
    ],
    notVisible: ['מסלול המוט', 'מיקום המרפקים בקבלה', 'תזמון המשיכה השנייה'],
  },
  {
    id: 'snatch',
    he: 'חטיפה (Snatch)',
    en: 'Snatch',
    discipline: 'weightlifting',
    cameraHint: 'צלם מהצד ממרחק — התנועה מגיעה גבוה',
    checks: [
      { id:'catch_depth', he:'עומק הקבלה', type:'depth',
        pass:'ירדת לעומק בקבלה',
        fail:'הקבלה הייתה גבוהה מדי',
        tip:'Overhead Squat קל יעזור לך להרגיש בטוח בעומק עם המוט מעל.' },
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit: 168,
        pass:'פתיחת ירך מלאה',
        fail:'לא הגעת לפתיחה מלאה לפני הירידה',
        tip:'סבלנות במשיכה הראשונה, ואז פתיחה אלימה. אל תמהר לרדת.' },
      { id:'overhead', he:'יישור מרפק מעל', type:'atLeast', metric:'elbow', stat:'max', limit: 165,
        pass:'המרפקים ננעלו מעל הראש',
        fail:'המרפקים לא ננעלו במלואם מעל הראש',
        tip:'עבוד על ניידות כתף וייצוב מעל הראש עם מוט ריק.' },
    ],
    notVisible: ['מסלול המוט', 'רוחב האחיזה', 'יציבות המוט מעל הראש'],
  },
  {
    id: 'overhead_press',
    he: 'לחיצת כתפיים',
    en: 'Overhead Press',
    discipline: 'weightlifting',
    cameraHint: 'צלם מהצד, מהמותן ומעלה מספיק',
    checks: [
      { id:'lockout', he:'נעילת מרפק', type:'atLeast', metric:'elbow', stat:'max', limit: 168,
        pass:'המרפקים ננעלו מעל הראש',
        fail:'לא ננעלת מעל הראש',
        tip:'סיים כל חזרה עם זרוע ישרה והראש "עובר" קדימה מתחת למוט.' },
      { id:'torso', he:'יציבות גו', type:'max', metric:'torsoLean', stat:'max', limit: 20,
        pass:'הגו נשאר יציב',
        fail:'נטייה אחורה גדולה מדי — זה הופך את זה ללחיצה בשיפוע',
        tip:'הדק ליבה ועכוז לפני הלחיצה. אם צריך — הורד משקל.' },
    ],
    notVisible: ['סטייה של המוט קדימה או אחורה', 'הרמת כתפיים לא סימטרית'],
  },

  // ── ג׳ימנסטיקס ───────────────────────────────────────────────────
  {
    id: 'pullup',
    he: 'מתח',
    en: 'Pull-up',
    discipline: 'gymnastics',
    cameraHint: 'צלם מהצד, כל הגוף כולל המוט בפריים',
    checks: [
      { id:'full_hang', he:'תלייה מלאה', type:'atLeast', metric:'elbow', stat:'max', limit: 165,
        pass:'ירדת לתלייה מלאה עם מרפק ישר',
        fail:'לא ירדת לתלייה מלאה בין החזרות',
        tip:'טווח מלא = מרפק ישר בתחתית. עדיף פחות חזרות בטווח מלא.' },
      { id:'top_pull', he:'משיכה לראש המוט', type:'min', metric:'elbow', stat:'min', limit: 60,
        pass:'משכת גבוה מספיק',
        fail:'לא משכת מספיק גבוה — הסנטר לא עבר את המוט',
        tip:'הוסף משיכות עם גומייה או Negatives כדי לבנות את החלק העליון.' },
    ],
    notVisible: ['האם הסנטר עבר את המוט בפועל', 'נדנוד מוגזם / kipping לא מבוקר'],
  },
  {
    id: 'pushup',
    he: 'שכיבות סמיכה',
    en: 'Push-up',
    discipline: 'gymnastics',
    cameraHint: 'צלם מהצד בגובה הרצפה',
    checks: [
      { id:'depth', he:'עומק', type:'min', metric:'elbow', stat:'min', limit: 95,
        pass:'ירדת מספיק עמוק',
        fail:'לא ירדת מספיק — המרפק לא הגיע ל-90 מעלות',
        tip:'רד עד שהחזה כמעט נוגע. אם קשה — שכיבות סמיכה בשיפוע.' },
      { id:'lockout', he:'נעילה למעלה', type:'atLeast', metric:'elbow', stat:'max', limit: 165,
        pass:'יישרת מרפקים בסיום',
        fail:'לא יישרת מרפקים למעלה',
        tip:'נעל מרפק בכל חזרה — זה חלק מהטווח.' },
      { id:'hip_line', he:'קו הגוף', type:'atLeast', metric:'hip', stat:'min', limit: 155,
        pass:'הגוף נשאר בקו ישר',
        fail:'האגן צנח או התרומם — הגוף לא בקו אחד',
        tip:'הדק עכוז וליבה. תרגל פלאנק כדי להרגיש את הקו.' },
    ],
    notVisible: ['רוחב וזווית המרפקים ביחס לגוף'],
  },
  {
    id: 'dip',
    he: 'מקבילים',
    en: 'Dip',
    discipline: 'gymnastics',
    cameraHint: 'צלם מהצד, כל הגוף בפריים',
    checks: [
      { id:'depth', he:'עומק', type:'min', metric:'elbow', stat:'min', limit: 95,
        pass:'ירדת לעומק מלא',
        fail:'לא ירדת מספיק — הכתף לא ירדה מתחת למרפק',
        tip:'עבוד על ניידות כתף. אם כואב — צמצם טווח והתקדם בהדרגה.' },
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'elbow', stat:'max', limit: 168,
        pass:'נעילת מרפק מלאה בסיום',
        fail:'לא ננעלת בסיום',
        tip:'סיים כל חזרה עם מרפק ישר.' },
    ],
    notVisible: ['נטיית הכתפיים קדימה', 'יציבות הטבעות'],
  },
  {
    id: 'toes_to_bar',
    he: 'אצבעות למוט',
    en: 'Toes to Bar',
    discipline: 'gymnastics',
    cameraHint: 'צלם מהצד ממרחק — הרגליים עולות גבוה',
    checks: [
      { id:'hip_flex', he:'כיפוף ירך', type:'min', metric:'hip', stat:'min', limit: 60,
        pass:'הבאת את הרגליים גבוה',
        fail:'לא הבאת את הרגליים מספיק גבוה',
        tip:'עבוד על Hanging Knee Raise ואז Leg Raise לפני T2B מלא.' },
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit: 160,
        pass:'פתחת את הגוף במלואו בין החזרות',
        fail:'לא פתחת את הגוף בין החזרות',
        tip:'הפתיחה המלאה היא מה שיוצר את הקצב. אל תישאר מכווץ.' },
    ],
    notVisible: ['האם האצבעות נגעו במוט בפועל'],
  },
  {
    id: 'ring_row',
    he: 'חתירה בטבעות',
    en: 'Ring Row',
    discipline: 'gymnastics',
    cameraHint: 'צלם מהצד, כל הגוף בפריים',
    checks: [
      { id:'pull', he:'עומק המשיכה', type:'min', metric:'elbow', stat:'min', limit: 75,
        pass:'משכת עד הסוף',
        fail:'לא משכת מספיק — הטבעות לא הגיעו לחזה',
        tip:'הגבה את הרגליים כדי להקל, ומשוך עד שהאגודלים נוגעים בחזה.' },
      { id:'body_line', he:'קו הגוף', type:'atLeast', metric:'hip', stat:'min', limit: 160,
        pass:'הגוף נשאר בקו ישר',
        fail:'האגן צנח במהלך המשיכה',
        tip:'הדק עכוז וליבה — זו שורה בפלאנק, לא בישיבה.' },
    ],
    notVisible: ['סימטריה בין שתי הזרועות'],
  },
]

export const MOVEMENTS_BY_DISCIPLINE = (discipline) =>
  MOVEMENTS.filter(m => m.discipline === discipline)

export const findMovement = (id) => MOVEMENTS.find(m => m.id === id) || null

// ─── Evaluation ───────────────────────────────────────────────────
// Turn the measured summary into pass/fail findings for one movement.
// Returns [] rather than guessing when the metric wasn't measurable.
export function evaluateMovement(movement, summary) {
  if (!movement || !summary) return []
  const findings = []

  for (const check of movement.checks) {
    if (check.type === 'depth') {
      if (summary.reachedDepth == null) continue
      findings.push({
        id: check.id, he: check.he,
        ok: summary.reachedDepth === true,
        message: summary.reachedDepth ? check.pass : check.fail,
        tip: summary.reachedDepth ? null : check.tip,
        measured: null,
      })
      continue
    }

    const stat = summary[check.metric]
    const value = stat?.[check.stat]
    if (value == null) continue

    let ok
    if (check.type === 'max') ok = value <= check.limit
    else if (check.type === 'min') ok = value <= check.limit
    else if (check.type === 'atLeast') ok = value >= check.limit
    else continue

    findings.push({
      id: check.id, he: check.he, ok,
      message: ok ? check.pass : check.fail,
      tip: ok ? null : check.tip,
      measured: { value, limit: check.limit, metric: check.metric, stat: check.stat },
    })
  }

  return findings
}
