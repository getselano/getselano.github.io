// Per-movement technique criteria, evaluated against the angles measured by
// services/poseAnalysis.
//
// Coverage matches the movement vocabulary the WOD generators actually
// prescribe — every skill in GYMN_SKILLS and every lift in the weightlifting
// session library — so a trainee can review anything their programme gave them.
//
// Scope note, deliberately conservative: a single 2D clip shot from the side
// gives reliable sagittal-plane information — depth, torso lean, joint flexion
// and extension. It cannot see knees caving inward, hip shift left-to-right,
// or bar path relative to midfoot, all of which need a front view or an actual
// barbell detector. Those are listed per movement as `notVisible` so the report
// says what it could not check instead of implying a clean bill of health.
//
// `inverted: true` marks movements performed upside down. The depth check is
// never declared on those, because hip-below-knee has no meaning when the
// athlete's head is on the floor.

export const DISCIPLINES = {
  weightlifting: { he: 'הנפות', en: 'Weightlifting' },
  gymnastics:    { he: 'ג׳ימנסטיקס', en: 'Gymnastics' },
}

// Groups keep the movement picker to a short list per screen instead of a
// wall of thirty buttons.
export const MOVEMENT_GROUPS = {
  weightlifting: [
    { key:'squat',    he:'סקוואטים' },
    { key:'pull',     he:'משיכות מהרצפה' },
    { key:'olympic',  he:'הנפות מלאות' },
    { key:'overhead', he:'מעל הראש' },
  ],
  gymnastics: [
    { key:'pulling',  he:'משיכה' },
    { key:'pushing',  he:'דחיפה' },
    { key:'core',     he:'ליבה' },
    { key:'legs',     he:'רגליים ותנועה' },
  ],
}

// A check is one of:
//   depth   — did the hip crease drop below the knee at any point
//   max     — metric's peak must stay at or under `limit`
//   min     — metric's low point must reach at or under `limit` (range of motion)
//   atLeast — the chosen stat must reach at least `limit` (extension / lockout)
export const MOVEMENTS = [
  // ══ הנפות · סקוואטים ═════════════════════════════════════════════
  {
    id:'back_squat', he:'סקוואט אחורי', en:'Back Squat',
    discipline:'weightlifting', group:'squat',
    cameraHint:'צלם מהצד, כל הגוף בפריים, מרחק 2–3 מטר, גובה מותן',
    checks:[
      { id:'depth', he:'עומק', type:'depth',
        pass:'הירך ירדה מתחת לקו הברך',
        fail:'לא הגעת לעומק מלא — הירך נעצרה מעל הברך',
        tip:'עבוד על ניידות קרסול ומתיחת מקרבים. סקוואט לתיבה בגובה יורד ילמד את הגוף את הטווח.' },
      { id:'torso', he:'זקיפות גב', type:'max', metric:'torsoLean', stat:'max', limit:50,
        pass:'הגב נשאר בזווית סבירה לאורך התנועה',
        fail:'נטיית פלג גוף עליון קדימה גדולה מדי — עומס עובר לגב התחתון',
        tip:'חזק גב עליון וליבה. Goblet Squat או סקוואט קדמי ילמדו אותך להישאר זקוף.' },
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'hip', stat:'max', limit:165,
        pass:'הירך ננעלה במלואה בסיום',
        fail:'לא ננעלת עד הסוף בין החזרות',
        tip:'סיים כל חזרה בעמידה מלאה עם כיווץ עכוז לפני הירידה הבאה.' },
    ],
    notVisible:['קריסת ברכיים פנימה (דורש צילום מלפנים)','הסחת אגן לצד אחד'],
  },
  {
    id:'front_squat', he:'סקוואט קדמי', en:'Front Squat',
    discipline:'weightlifting', group:'squat',
    cameraHint:'צלם מהצד, כל הגוף בפריים',
    checks:[
      { id:'depth', he:'עומק', type:'depth',
        pass:'הירך ירדה מתחת לקו הברך',
        fail:'לא הגעת לעומק מלא',
        tip:'בסקוואט קדמי העומק קריטי לשמירה על המוט. עבוד על ניידות קרסול.' },
      { id:'torso', he:'זקיפות גב', type:'max', metric:'torsoLean', stat:'max', limit:35,
        pass:'פלג הגוף העליון נשאר זקוף כנדרש',
        fail:'נטייה קדימה גדולה מדי — בסקוואט קדמי זה מפיל את המוט',
        tip:'מרפקים גבוהים לאורך כל החזרה. עבוד על ניידות שורש כף יד וגב עליון.' },
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'hip', stat:'max', limit:165,
        pass:'נעילה מלאה בסיום', fail:'לא ננעלת עד הסוף',
        tip:'עמידה מלאה, מרפקים גבוהים, ואז החזרה הבאה.' },
    ],
    notVisible:['גובה המרפקים','קריסת ברכיים פנימה'],
  },
  {
    id:'overhead_squat', he:'סקוואט מעל הראש', en:'Overhead Squat',
    discipline:'weightlifting', group:'squat',
    cameraHint:'צלם מהצד ממרחק — המוט מעל הראש צריך להיכנס לפריים',
    checks:[
      { id:'depth', he:'עומק', type:'depth',
        pass:'ירדת לעומק מלא',
        fail:'לא הגעת לעומק — בדרך כלל סימן לניידות כתף או קרסול מוגבלת',
        tip:'התחל עם מוט PVC. עבוד על Sots Press וניידות כתף לפני שמוסיפים משקל.' },
      { id:'overhead', he:'נעילת מרפק מעל', type:'atLeast', metric:'elbow', stat:'min', limit:160,
        pass:'המרפקים נשארו נעולים לאורך התנועה',
        fail:'המרפק נכפף במהלך הסקוואט — המוט לא יציב מעל',
        tip:'דחוף את המוט "לתקרה" לאורך כל החזרה. אם המרפק נשבר — המשקל כבד מדי.' },
      { id:'torso', he:'זקיפות גב', type:'max', metric:'torsoLean', stat:'max', limit:40,
        pass:'הגו נשאר זקוף',
        fail:'נטייה קדימה — המוט ייפול קדימה',
        tip:'ניידות גב עליון. עבוד על תלייה פסיבית ומתיחות חזה.' },
    ],
    notVisible:['מיקום המוט ביחס לאמצע כף הרגל','רוחב האחיזה'],
  },
  {
    id:'pistol', he:'Pistol (סקוואט על רגל אחת)', en:'Pistol Squat',
    discipline:'gymnastics', group:'legs',
    cameraHint:'צלם מהצד של הרגל העובדת, כל הגוף בפריים',
    checks:[
      { id:'depth', he:'עומק', type:'min', metric:'knee', stat:'min', limit:75,
        pass:'ירדת לעומק מלא על רגל אחת',
        fail:'לא ירדת מספיק עמוק',
        tip:'תרגל Pistol לתיבה בגובה יורד, או עם אחיזה קלה בטבעות לאיזון.' },
      { id:'lockout', he:'עמידה מלאה', type:'atLeast', metric:'knee', stat:'max', limit:165,
        pass:'קמת לעמידה מלאה',
        fail:'לא השלמת עמידה בין החזרות',
        tip:'סיים כל חזרה בעמידה זקופה לפני שאתה יורד שוב.' },
    ],
    notVisible:['שמירת שיווי משקל לצדדים','גובה הרגל החופשית'],
  },

  // ══ הנפות · משיכות מהרצפה ════════════════════════════════════════
  {
    id:'deadlift', he:'דדליפט', en:'Deadlift',
    discipline:'weightlifting', group:'pull',
    cameraHint:'צלם מהצד בגובה המוט, כל הגוף בפריים',
    checks:[
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'hip', stat:'max', limit:168,
        pass:'נעילת ירך מלאה בסיום',
        fail:'לא ננעלת במלואך — הירך נשארה כפופה',
        tip:'סיים עם כיווץ עכוז ואגן מתחת לגוף. אל תיטה לאחור — זו לא נעילה.' },
      { id:'start_torso', he:'זווית גב בהתחלה', type:'max', metric:'torsoLean', stat:'max', limit:75,
        pass:'זווית הגב בהתחלה סבירה',
        fail:'הגב כמעט מקביל לרצפה — הירך גבוהה מדי או המוט רחוק',
        tip:'הורד את הירך והבא את המוט קרוב לשוק לפני המשיכה.' },
      { id:'knee_ext', he:'יישור ברך', type:'atLeast', metric:'knee', stat:'max', limit:168,
        pass:'הברכיים יושרו בסיום', fail:'הברכיים לא יושרו במלואן',
        tip:'נעל ברך וירך יחד בסוף המשיכה.' },
    ],
    notVisible:['עיגול הגב התחתון','מסלול המוט ביחס לאמצע כף הרגל'],
  },
  {
    id:'snatch_deadlift', he:'דדליפט חטיפה', en:'Snatch Deadlift',
    discipline:'weightlifting', group:'pull',
    cameraHint:'צלם מהצד בגובה המוט',
    checks:[
      { id:'start_torso', he:'זווית גב בהתחלה', type:'max', metric:'torsoLean', stat:'max', limit:78,
        pass:'עמדת התחלה סבירה',
        fail:'הירך גבוהה מדי בהתחלה — באחיזה רחבה הגב יורד נמוך יותר מדדליפט רגיל',
        tip:'הורד ירך והרם חזה לפני שאתה מתחיל למשוך.' },
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'hip', stat:'max', limit:165,
        pass:'הגעת לפתיחה מלאה', fail:'לא פתחת את הירך במלואה',
        tip:'המשיכה מסתיימת בפתיחה מלאה של הירך — זה מה שמעביר את הכוח למוט.' },
    ],
    notVisible:['רוחב האחיזה','מסלול המוט'],
  },
  {
    id:'clean_pull', he:'משיכת ניקוי', en:'Clean Pull',
    discipline:'weightlifting', group:'pull',
    cameraHint:'צלם מהצד ממרחק',
    checks:[
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit:168,
        pass:'פתיחת ירך מלאה בסוף המשיכה',
        fail:'לא הגעת לפתיחה מלאה — זו כל מטרת התרגיל',
        tip:'משוך לאט מהרצפה, ואז פתח בכוח. אל תמהר לחלק הראשון.' },
      { id:'knee_ext', he:'יישור ברך', type:'atLeast', metric:'knee', stat:'max', limit:165,
        pass:'הברכיים יושרו בפתיחה', fail:'הברכיים לא יושרו',
        tip:'הפתיחה כוללת ברך וירך יחד, לא רק אחת מהן.' },
    ],
    notVisible:['מסלול המוט','משיכת כתפיים'],
  },

  // ══ הנפות · הנפות מלאות ══════════════════════════════════════════
  {
    id:'clean', he:'ניקוי (Clean)', en:'Clean',
    discipline:'weightlifting', group:'olympic',
    cameraHint:'צלם מהצד, השאר מרחק שהמוט לא יוצא מהפריים בהנפה',
    checks:[
      { id:'catch_depth', he:'עומק הקבלה', type:'depth',
        pass:'ירדת מתחת למוט לקבלה',
        fail:'הקבלה הייתה גבוהה — לא ירדת מספיק תחת המוט',
        tip:'עבוד על מהירות הירידה. תרגל Clean מהתלייה עם משקל קל.' },
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit:165,
        pass:'פתיחת ירך מלאה לפני הירידה',
        fail:'לא פתחת את הירך במלואה לפני שירדת תחת המוט',
        tip:'המשיכה השנייה חייבת להסתיים בפתיחה מלאה. תרגל משיכות גבוהות.' },
      { id:'stand', he:'עמידה בסיום', type:'atLeast', metric:'knee', stat:'max', limit:165,
        pass:'עמידה מלאה בסיום', fail:'לא השלמת עמידה בסיום',
        tip:'קום עד הסוף לפני שאתה מוריד את המוט.' },
    ],
    notVisible:['מסלול המוט','מיקום המרפקים בקבלה','תזמון המשיכה השנייה'],
  },
  {
    id:'power_clean', he:'פאוור קלין', en:'Power Clean',
    discipline:'weightlifting', group:'olympic',
    cameraHint:'צלם מהצד ממרחק',
    checks:[
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit:168,
        pass:'פתיחה מלאה — קריטי בפאוור שבו אין ירידה עמוקה',
        fail:'הפתיחה לא הושלמה. בפאוור אין עומק שיפצה על זה',
        tip:'התמקד בפתיחה אלימה של הירך. תרגל משיכות גבוהות.' },
      { id:'catch_height', he:'גובה הקבלה', type:'min', metric:'knee', stat:'min', limit:120,
        pass:'הקבלה הייתה מעל מקביל — זה פאוור תקין',
        fail:'ירדת מתחת למקביל — זו כבר קבלה מלאה ולא פאוור',
        tip:'אם אתה נופל לעומק, המשקל כבד מדי לפאוור. הורד משקל.' },
      { id:'stand', he:'עמידה בסיום', type:'atLeast', metric:'knee', stat:'max', limit:165,
        pass:'עמידה מלאה', fail:'לא השלמת עמידה',
        tip:'סיים כל חזרה בעמידה זקופה.' },
    ],
    notVisible:['מסלול המוט','מהירות המרפקים'],
  },
  {
    id:'hang_clean', he:'ניקוי מהתלייה', en:'Hang Clean',
    discipline:'weightlifting', group:'olympic',
    cameraHint:'צלם מהצד, כל הגוף בפריים',
    checks:[
      { id:'hang_position', he:'עמדת התלייה', type:'max', metric:'torsoLean', stat:'max', limit:55,
        pass:'עמדת התלייה תקינה',
        fail:'נטייה קדימה מוגזמת בעמדת ההתחלה',
        tip:'שלח אגן אחורה עם חזה גבוה. הגב נשאר נוקשה.' },
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit:165,
        pass:'פתיחת ירך מלאה', fail:'לא פתחת את הירך במלואה',
        tip:'זו כל התנועה — טעינה קצרה ואז פתיחה מלאה.' },
      { id:'stand', he:'עמידה בסיום', type:'atLeast', metric:'knee', stat:'max', limit:165,
        pass:'עמידה מלאה', fail:'לא השלמת עמידה', tip:'קום עד הסוף.' },
    ],
    notVisible:['מסלול המוט','גובה נקודת התלייה'],
  },
  {
    id:'snatch', he:'חטיפה (Snatch)', en:'Snatch',
    discipline:'weightlifting', group:'olympic',
    cameraHint:'צלם מהצד ממרחק — התנועה מגיעה גבוה',
    checks:[
      { id:'catch_depth', he:'עומק הקבלה', type:'depth',
        pass:'ירדת לעומק בקבלה', fail:'הקבלה הייתה גבוהה מדי',
        tip:'Overhead Squat קל יעזור לך להרגיש בטוח בעומק עם המוט מעל.' },
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit:168,
        pass:'פתיחת ירך מלאה', fail:'לא הגעת לפתיחה מלאה לפני הירידה',
        tip:'סבלנות במשיכה הראשונה, ואז פתיחה אלימה. אל תמהר לרדת.' },
      { id:'overhead', he:'יישור מרפק מעל', type:'atLeast', metric:'elbow', stat:'max', limit:165,
        pass:'המרפקים ננעלו מעל הראש', fail:'המרפקים לא ננעלו במלואם',
        tip:'עבוד על ניידות כתף וייצוב מעל הראש עם מוט ריק.' },
    ],
    notVisible:['מסלול המוט','רוחב האחיזה','יציבות המוט מעל הראש'],
  },
  {
    id:'power_snatch', he:'פאוור סנאץ׳', en:'Power Snatch',
    discipline:'weightlifting', group:'olympic',
    cameraHint:'צלם מהצד ממרחק',
    checks:[
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit:170,
        pass:'פתיחה מלאה', fail:'הפתיחה לא הושלמה — בפאוור זה קריטי במיוחד',
        tip:'בלי עומק שיפצה, הפתיחה חייבת להיות מושלמת. תרגל Snatch High Pull.' },
      { id:'catch_height', he:'גובה הקבלה', type:'min', metric:'knee', stat:'min', limit:120,
        pass:'קבלה מעל מקביל — פאוור תקין',
        fail:'ירדת עמוק מדי — זו חטיפה מלאה ולא פאוור',
        tip:'הורד משקל אם אתה נופל לעומק.' },
      { id:'overhead', he:'נעילה מעל', type:'atLeast', metric:'elbow', stat:'max', limit:165,
        pass:'נעילה מלאה מעל הראש', fail:'לא ננעלת מעל הראש',
        tip:'עבוד על ייצוב מעל הראש עם מוט ריק.' },
    ],
    notVisible:['מסלול המוט','רוחב אחיזה'],
  },
  {
    id:'clean_and_jerk', he:'ניקוי ודחיקה (C&J)', en:'Clean & Jerk',
    discipline:'weightlifting', group:'olympic',
    cameraHint:'צלם מהצד ממרחק — צריך לתפוס גם את הרצפה וגם מעל הראש',
    checks:[
      { id:'catch_depth', he:'עומק הקבלה', type:'depth',
        pass:'ירדת תחת המוט בניקוי', fail:'הקבלה בניקוי הייתה גבוהה',
        tip:'עבוד על מהירות ירידה. תרגל את הניקוי בנפרד לפני שמחברים.' },
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit:165,
        pass:'פתיחת ירך מלאה', fail:'הפתיחה לא הושלמה',
        tip:'תרגל את שני החלקים בנפרד לפני שמחברים אותם.' },
      { id:'overhead', he:'נעילה מעל הראש', type:'atLeast', metric:'elbow', stat:'max', limit:168,
        pass:'המרפקים ננעלו בדחיקה', fail:'לא ננעלת מעל הראש בדחיקה',
        tip:'הדחיקה מסתיימת עם זרוע ישרה והראש עובר קדימה מתחת למוט.' },
    ],
    notVisible:['מסלול המוט','עומק ההתכופפות בדחיקה','מיקום כפות הרגליים בפיצול'],
  },
  {
    id:'split_jerk', he:'דחיקת פיצול', en:'Split Jerk',
    discipline:'weightlifting', group:'overhead',
    cameraHint:'צלם מהצד — הפיצול נפתח קדימה ואחורה',
    checks:[
      { id:'dip_depth', he:'עומק הטבילה', type:'min', metric:'knee', stat:'min', limit:150,
        pass:'טבילה קצרה ומבוקרת',
        fail:'הטבילה עמוקה מדי — זה הופך את הדחיקה לסקוואט',
        tip:'טבילה של 10–15 ס״מ בלבד, אנכית, ואז דחיפה מיידית.' },
      { id:'overhead', he:'נעילה מעל', type:'atLeast', metric:'elbow', stat:'max', limit:168,
        pass:'נעילת מרפק מלאה מעל הראש', fail:'לא ננעלת מעל הראש',
        tip:'סיים עם זרוע ישרה והראש "עובר" קדימה מתחת למוט.' },
      { id:'recover', he:'חזרה לעמידה', type:'atLeast', metric:'knee', stat:'max', limit:165,
        pass:'חזרת לעמידה מלאה', fail:'לא השלמת חזרה מהפיצול',
        tip:'רגל קדמית חצי צעד אחורה, ואז רגל אחורית קדימה.' },
    ],
    notVisible:['אורך הפיצול','יישור כף הרגל האחורית','נטיית הגו בפיצול'],
  },
  {
    id:'push_jerk', he:'פוש ג׳רק', en:'Push Jerk',
    discipline:'weightlifting', group:'overhead',
    cameraHint:'צלם מהצד, מהברכיים ומעלה',
    checks:[
      { id:'dip_depth', he:'עומק הטבילה', type:'min', metric:'knee', stat:'min', limit:145,
        pass:'טבילה מבוקרת', fail:'טבילה עמוקה מדי',
        tip:'טבילה קצרה ואנכית. הברך יוצאת קדימה, לא הירך אחורה.' },
      { id:'overhead', he:'נעילה מעל', type:'atLeast', metric:'elbow', stat:'max', limit:168,
        pass:'נעילה מלאה', fail:'לא ננעלת מעל הראש',
        tip:'קבל את המוט עם ברך כפופה מעט ואז נעל הכל יחד.' },
    ],
    notVisible:['סטיית המוט קדימה','מיקום הראש'],
  },
  {
    id:'push_press', he:'פוש פרס', en:'Push Press',
    discipline:'weightlifting', group:'overhead',
    cameraHint:'צלם מהצד, מהמותן ומעלה',
    checks:[
      { id:'dip_depth', he:'עומק הטבילה', type:'min', metric:'knee', stat:'min', limit:145,
        pass:'טבילה מבוקרת', fail:'טבילה עמוקה מדי — זה כבר ג׳רק',
        tip:'טבילה קצרה ואז דחיפה. אין קבלה עם ברך כפופה בפוש פרס.' },
      { id:'lockout', he:'נעילת מרפק', type:'atLeast', metric:'elbow', stat:'max', limit:168,
        pass:'המרפקים ננעלו', fail:'לא ננעלת מעל הראש',
        tip:'סיים עם זרוע ישרה מעל אמצע הגוף.' },
      { id:'torso', he:'יציבות גו', type:'max', metric:'torsoLean', stat:'max', limit:25,
        pass:'הגו נשאר יציב', fail:'נטייה אחורה גדולה מדי',
        tip:'הדק ליבה ועכוז לפני הדחיפה.' },
    ],
    notVisible:['סטיית המוט','סימטריה בין הזרועות'],
  },
  {
    id:'overhead_press', he:'לחיצת כתפיים', en:'Strict Press',
    discipline:'weightlifting', group:'overhead',
    cameraHint:'צלם מהצד, מהמותן ומעלה',
    checks:[
      { id:'lockout', he:'נעילת מרפק', type:'atLeast', metric:'elbow', stat:'max', limit:168,
        pass:'המרפקים ננעלו מעל הראש', fail:'לא ננעלת מעל הראש',
        tip:'סיים כל חזרה עם זרוע ישרה והראש עובר קדימה מתחת למוט.' },
      { id:'no_dip', he:'בלי טבילה', type:'atLeast', metric:'knee', stat:'min', limit:160,
        pass:'הרגליים נשארו ישרות — לחיצה נוקשה תקינה',
        fail:'התכופפת בברכיים — זו כבר פוש פרס ולא לחיצה נוקשה',
        tip:'אם אתה חייב טבילה כדי להרים — המשקל כבד מדי ללחיצה נוקשה.' },
      { id:'torso', he:'יציבות גו', type:'max', metric:'torsoLean', stat:'max', limit:20,
        pass:'הגו נשאר יציב', fail:'נטייה אחורה גדולה מדי — זה הופך את זה ללחיצה בשיפוע',
        tip:'הדק ליבה ועכוז. אם צריך — הורד משקל.' },
    ],
    notVisible:['סטיית המוט','הרמת כתפיים לא סימטרית'],
  },
  {
    id:'thruster', he:'תראסטר', en:'Thruster',
    discipline:'weightlifting', group:'overhead',
    cameraHint:'צלם מהצד ממרחק — צריך גם עומק וגם מעל הראש',
    checks:[
      { id:'depth', he:'עומק הסקוואט', type:'depth',
        pass:'ירדת לעומק מלא', fail:'הסקוואט היה חלקי',
        tip:'בתראסטר העומק הוא מה שמייצר את התנופה לדחיקה. אל תקצר אותו.' },
      { id:'overhead', he:'נעילה מעל', type:'atLeast', metric:'elbow', stat:'max', limit:168,
        pass:'נעילת מרפק מלאה מעל הראש', fail:'לא ננעלת מעל הראש',
        tip:'החזרה נספרת רק עם נעילה מלאה. אל תמהר לחזרה הבאה.' },
      { id:'hip_ext', he:'פתיחת ירך', type:'atLeast', metric:'hip', stat:'max', limit:165,
        pass:'פתיחת ירך מלאה', fail:'לא פתחת את הירך במלואה',
        tip:'הסקוואט והדחיקה הם תנועה אחת רציפה, לא שתי תנועות נפרדות.' },
    ],
    notVisible:['מסלול המוט','גובה המרפקים בעמדת המנוחה'],
  },

  // ══ ג׳ימנסטיקס · משיכה ═══════════════════════════════════════════
  {
    id:'strict_pullup', he:'מתח נוקשה', en:'Strict Pull-up',
    discipline:'gymnastics', group:'pulling',
    cameraHint:'צלם מהצד, כל הגוף כולל המוט בפריים',
    checks:[
      { id:'full_hang', he:'תלייה מלאה', type:'atLeast', metric:'elbow', stat:'max', limit:165,
        pass:'ירדת לתלייה מלאה עם מרפק ישר',
        fail:'לא ירדת לתלייה מלאה בין החזרות',
        tip:'טווח מלא = מרפק ישר בתחתית. עדיף פחות חזרות בטווח מלא.' },
      { id:'top_pull', he:'משיכה לראש המוט', type:'min', metric:'elbow', stat:'min', limit:60,
        pass:'משכת גבוה מספיק', fail:'לא משכת מספיק גבוה — הסנטר לא עבר את המוט',
        tip:'הוסף משיכות עם גומייה או Negatives לבניית החלק העליון.' },
      { id:'no_kip', he:'בלי קיפינג', type:'atLeast', metric:'hip', stat:'min', limit:150,
        pass:'הגוף נשאר יציב — משיכה נוקשה תקינה',
        fail:'זוהתה תנודת ירך — זה כבר קיפינג ולא משיכה נוקשה',
        tip:'אם אתה חייב לנדנד — עבור למשיכות עם גומייה במקום.' },
    ],
    notVisible:['האם הסנטר עבר את המוט בפועל','רוחב האחיזה'],
  },
  {
    id:'kipping_pullup', he:'מתח קיפינג', en:'Kipping Pull-up',
    discipline:'gymnastics', group:'pulling',
    cameraHint:'צלם מהצד ממרחק — הגוף נע קדימה ואחורה',
    checks:[
      { id:'full_hang', he:'תלייה מלאה', type:'atLeast', metric:'elbow', stat:'max', limit:165,
        pass:'הגעת לתלייה מלאה בין החזרות',
        fail:'לא פתחת את הזרוע במלואה — הקצב "נחתך"',
        tip:'הקיפינג מתחיל מתלייה פעילה מלאה. בלי זה אין תנופה.' },
      { id:'arch_hollow', he:'קשת–חלול', type:'min', metric:'hip', stat:'min', limit:135,
        pass:'זוהתה תנועת ירך — הקיפינג עובד',
        fail:'הגוף נשאר קשיח — אתה מושך בכוח זרוע בלבד',
        tip:'תרגל Kip Swings בלי משיכה עד שהמעבר קשת–חלול הופך אוטומטי.' },
      { id:'top_pull', he:'גובה המשיכה', type:'min', metric:'elbow', stat:'min', limit:70,
        pass:'משכת גבוה מספיק', fail:'לא הגעת מספיק גבוה',
        tip:'התנופה מהירך צריכה להעביר אותך למעלה — לא הזרוע לבדה.' },
    ],
    notVisible:['תזמון הדחיפה מהמוט','האם הסנטר עבר את המוט'],
  },
  {
    id:'chest_to_bar', he:'Chest-to-Bar', en:'Chest to Bar',
    discipline:'gymnastics', group:'pulling',
    cameraHint:'צלם מהצד — נדרש לראות את המרחק בין החזה למוט',
    checks:[
      { id:'full_hang', he:'תלייה מלאה', type:'atLeast', metric:'elbow', stat:'max', limit:165,
        pass:'תלייה מלאה בין החזרות', fail:'לא ירדת לתלייה מלאה',
        tip:'טווח מלא בתחתית הוא חלק מהחזרה.' },
      { id:'top_pull', he:'גובה המשיכה', type:'min', metric:'elbow', stat:'min', limit:55,
        pass:'משכת גבוה מאוד — מתאים ל-C2B',
        fail:'לא משכת מספיק גבוה כדי שהחזה יגיע למוט',
        tip:'C2B דורש משיכה גבוהה מהרגיל. חזק משיכה אופקית — Ring Row וחתירות.' },
    ],
    notVisible:['האם החזה נגע במוט בפועל — זו קריאה שדורשת זווית אחרת'],
  },
  {
    id:'bar_muscle_up', he:'Bar Muscle-up', en:'Bar Muscle-up',
    discipline:'gymnastics', group:'pulling',
    cameraHint:'צלם מהצד ממרחק — התנועה עוברת מתחת המוט למעליו',
    checks:[
      { id:'full_hang', he:'תלייה מלאה', type:'atLeast', metric:'elbow', stat:'max', limit:165,
        pass:'התחלת מתלייה מלאה', fail:'לא התחלת מתלייה מלאה',
        tip:'תלייה פעילה מלאה היא נקודת ההתחלה של כל חזרה.' },
      { id:'pull_height', he:'גובה המשיכה', type:'min', metric:'elbow', stat:'min', limit:50,
        pass:'משכת מספיק גבוה למעבר',
        fail:'לא הגעת לגובה שמאפשר מעבר מעל המוט',
        tip:'תרגל C2B גבוהים ו-Banded Transitions לפני MU מלא.' },
      { id:'lockout', he:'נעילה למעלה', type:'atLeast', metric:'elbow', stat:'max', limit:165,
        pass:'ננעלת מעל המוט בסיום', fail:'לא ננעלת מעל המוט',
        tip:'החזרה מסתיימת בזרוע ישרה מעל המוט, לא באמצע המעבר.' },
    ],
    notVisible:['איכות המעבר (transition)','מיקום שורש כף היד'],
  },
  {
    id:'ring_muscle_up', he:'Ring Muscle-up', en:'Ring Muscle-up',
    discipline:'gymnastics', group:'pulling',
    cameraHint:'צלם מהצד ממרחק, כל הגוף בפריים',
    checks:[
      { id:'full_hang', he:'תלייה מלאה', type:'atLeast', metric:'elbow', stat:'max', limit:165,
        pass:'התחלת מתלייה מלאה', fail:'לא התחלת מתלייה מלאה',
        tip:'False Grip Hang — עבוד עליו בנפרד, הוא הבסיס.' },
      { id:'pull_height', he:'גובה המשיכה', type:'min', metric:'elbow', stat:'min', limit:50,
        pass:'משכת מספיק גבוה', fail:'לא הגעת לגובה מעבר',
        tip:'False Grip Row × 5 → Transition. תרגל את המעבר עם גומייה.' },
      { id:'lockout', he:'נעילה למעלה', type:'atLeast', metric:'elbow', stat:'max', limit:165,
        pass:'ננעלת בתמיכה מלאה', fail:'לא ננעלת בתמיכה למעלה',
        tip:'Ring Support Hold 30 שניות — בנה את היציבות בסיום.' },
    ],
    notVisible:['False Grip','יציבות הטבעות לצדדים','איכות המעבר'],
  },
  {
    id:'ring_row', he:'חתירה בטבעות', en:'Ring Row',
    discipline:'gymnastics', group:'pulling',
    cameraHint:'צלם מהצד, כל הגוף בפריים',
    checks:[
      { id:'pull', he:'עומק המשיכה', type:'min', metric:'elbow', stat:'min', limit:75,
        pass:'משכת עד הסוף', fail:'לא משכת מספיק — הטבעות לא הגיעו לחזה',
        tip:'הגבה את הרגליים כדי להקל, ומשוך עד שהאגודלים נוגעים בחזה.' },
      { id:'body_line', he:'קו הגוף', type:'atLeast', metric:'hip', stat:'min', limit:160,
        pass:'הגוף נשאר בקו ישר', fail:'האגן צנח במהלך המשיכה',
        tip:'הדק עכוז וליבה — זו שורה בפלאנק, לא בישיבה.' },
    ],
    notVisible:['סימטריה בין שתי הזרועות'],
  },

  // ══ ג׳ימנסטיקס · דחיפה ═══════════════════════════════════════════
  {
    id:'pushup', he:'שכיבות סמיכה', en:'Push-up',
    discipline:'gymnastics', group:'pushing',
    cameraHint:'צלם מהצד בגובה הרצפה',
    checks:[
      { id:'depth', he:'עומק', type:'min', metric:'elbow', stat:'min', limit:95,
        pass:'ירדת מספיק עמוק', fail:'לא ירדת מספיק — המרפק לא הגיע ל-90 מעלות',
        tip:'רד עד שהחזה כמעט נוגע. אם קשה — שכיבות סמיכה בשיפוע.' },
      { id:'lockout', he:'נעילה למעלה', type:'atLeast', metric:'elbow', stat:'max', limit:165,
        pass:'יישרת מרפקים בסיום', fail:'לא יישרת מרפקים למעלה',
        tip:'נעל מרפק בכל חזרה — זה חלק מהטווח.' },
      { id:'hip_line', he:'קו הגוף', type:'atLeast', metric:'hip', stat:'min', limit:155,
        pass:'הגוף נשאר בקו ישר', fail:'האגן צנח או התרומם — הגוף לא בקו אחד',
        tip:'הדק עכוז וליבה. תרגל פלאנק כדי להרגיש את הקו.' },
    ],
    notVisible:['רוחב וזווית המרפקים ביחס לגוף'],
  },
  {
    id:'dip', he:'מקבילים', en:'Dip',
    discipline:'gymnastics', group:'pushing',
    cameraHint:'צלם מהצד, כל הגוף בפריים',
    checks:[
      { id:'depth', he:'עומק', type:'min', metric:'elbow', stat:'min', limit:95,
        pass:'ירדת לעומק מלא', fail:'לא ירדת מספיק — הכתף לא ירדה מתחת למרפק',
        tip:'עבוד על ניידות כתף. אם כואב — צמצם טווח והתקדם בהדרגה.' },
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'elbow', stat:'max', limit:168,
        pass:'נעילת מרפק מלאה בסיום', fail:'לא ננעלת בסיום',
        tip:'סיים כל חזרה עם מרפק ישר.' },
    ],
    notVisible:['נטיית הכתפיים קדימה'],
  },
  {
    id:'ring_dip', he:'מקבילים בטבעות', en:'Ring Dip',
    discipline:'gymnastics', group:'pushing',
    cameraHint:'צלם מהצד, כל הגוף בפריים',
    checks:[
      { id:'depth', he:'עומק', type:'min', metric:'elbow', stat:'min', limit:95,
        pass:'ירדת לעומק מלא', fail:'לא ירדת מספיק עמוק',
        tip:'Ring Support Hold ואז Negatives — בנה את הטווח בהדרגה.' },
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'elbow', stat:'max', limit:168,
        pass:'נעילה מלאה בסיום', fail:'לא ננעלת בסיום',
        tip:'סיים עם זרוע ישרה וטבעות צמודות לגוף.' },
      { id:'body_line', he:'קו הגוף', type:'atLeast', metric:'hip', stat:'min', limit:150,
        pass:'הגוף נשאר יציב', fail:'הרגליים התנדנדו או האגן נכפף',
        tip:'הדק ליבה. אם אתה מתנדנד — הטבעות לא יציבות מספיק עדיין.' },
    ],
    notVisible:['סטיית הטבעות לצדדים','סיבוב הטבעות בנעילה'],
  },
  {
    id:'strict_hspu', he:'HSPU נוקשה', en:'Strict Handstand Push-up',
    discipline:'gymnastics', group:'pushing', inverted:true,
    cameraHint:'צלם מהצד, מהרצפה — ודא שהראש והידיים בפריים',
    checks:[
      { id:'depth', he:'עומק', type:'min', metric:'elbow', stat:'min', limit:95,
        pass:'ירדת עד שהראש נגע', fail:'לא ירדת מספיק עמוק',
        tip:'הוסף כרית או שניים והורד בהדרגה. או תרגל Pike Push-up.' },
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'elbow', stat:'max', limit:168,
        pass:'נעילת מרפק מלאה למעלה', fail:'לא ננעלת במלואך',
        tip:'החזרה נספרת רק עם זרוע ישרה מלאה.' },
      { id:'body_line', he:'קו הגוף', type:'atLeast', metric:'hip', stat:'min', limit:150,
        pass:'הגוף נשאר בקו', fail:'האגן נכפף — הגוף לא בקו אחד',
        tip:'הדק עכוז וליבה. גב מקומר מוסיף עומס על הכתף.' },
    ],
    notVisible:['מרחק הידיים מהקיר','האם הראש נגע בפועל','סיבוב מרפקים החוצה'],
  },
  {
    id:'kipping_hspu', he:'HSPU קיפינג', en:'Kipping HSPU',
    discipline:'gymnastics', group:'pushing', inverted:true,
    cameraHint:'צלם מהצד מהרצפה, ממרחק',
    checks:[
      { id:'depth', he:'עומק', type:'min', metric:'elbow', stat:'min', limit:100,
        pass:'ירדת מספיק עמוק', fail:'לא ירדת מספיק',
        tip:'הטווח בתחתית הוא מה שמייצר את התנופה. אל תקצר אותו.' },
      { id:'kip', he:'תנופת ירך', type:'min', metric:'hip', stat:'min', limit:120,
        pass:'זוהתה תנופת ירך — הקיפינג עובד',
        fail:'לא זוהתה תנופה — אתה דוחף בכוח כתף בלבד',
        tip:'כווץ ברכיים לחזה ואז פתח בכוח כלפי מעלה בזמן הדחיפה.' },
      { id:'lockout', he:'נעילה', type:'atLeast', metric:'elbow', stat:'max', limit:168,
        pass:'נעילה מלאה למעלה', fail:'לא ננעלת במלואך',
        tip:'סיים כל חזרה בנעילה לפני שאתה יורד שוב.' },
    ],
    notVisible:['תזמון הפתיחה מול הדחיפה','מרחק מהקיר'],
  },
  {
    id:'handstand_hold', he:'עמידת ידיים', en:'Handstand Hold',
    discipline:'gymnastics', group:'pushing', inverted:true,
    cameraHint:'צלם מהצד, כל הגוף בפריים כולל הידיים',
    checks:[
      { id:'lockout', he:'יישור מרפק', type:'atLeast', metric:'elbow', stat:'min', limit:160,
        pass:'המרפקים נשארו ישרים לאורך ההחזקה',
        fail:'המרפק נכפף — אתה "יושב" על הכתפיים',
        tip:'דחוף את הרצפה והרחק כתפיים מהאוזניים. חזק Pike Push-up.' },
      { id:'body_line', he:'קו הגוף', type:'atLeast', metric:'hip', stat:'min', limit:155,
        pass:'הגוף נשאר בקו ישר',
        fail:'הגב מקומר או האגן כפוף — לא קו אחד',
        tip:'הדק עכוז וצלעות פנימה. תרגל Hollow Hold על הרצפה.' },
    ],
    notVisible:['סטייה לצדדים','מרחק מהקיר','פיזור המשקל בכף היד'],
  },
  {
    id:'wall_walk', he:'הליכה על הקיר', en:'Wall Walk',
    discipline:'gymnastics', group:'pushing', inverted:true,
    cameraHint:'צלם מהצד — צריך לראות גם את הקיר וגם את הידיים',
    checks:[
      { id:'lockout', he:'יישור מרפק', type:'atLeast', metric:'elbow', stat:'min', limit:150,
        pass:'המרפקים נשארו ישרים יחסית',
        fail:'המרפקים נכפפו — כוח הכתף עדיין לא מספיק',
        tip:'עצור בגובה שאתה עוד יכול לשמור על מרפק ישר, וקצר את המרחק בהדרגה.' },
      { id:'body_line', he:'קו הגוף', type:'atLeast', metric:'hip', stat:'min', limit:145,
        pass:'הגוף נשאר יחסית ישר', fail:'האגן נשאר גבוה — לא הגעת לעמדה אנכית',
        tip:'קרב את הידיים לקיר בכל צעד. הדק ליבה.' },
    ],
    notVisible:['מרחק הידיים מהקיר','מספר הצעדים'],
  },

  // ══ ג׳ימנסטיקס · ליבה ════════════════════════════════════════════
  {
    id:'toes_to_bar', he:'אצבעות למוט', en:'Toes to Bar',
    discipline:'gymnastics', group:'core',
    cameraHint:'צלם מהצד ממרחק — הרגליים עולות גבוה',
    checks:[
      { id:'hip_flex', he:'כיפוף ירך', type:'min', metric:'hip', stat:'min', limit:60,
        pass:'הבאת את הרגליים גבוה', fail:'לא הבאת את הרגליים מספיק גבוה',
        tip:'עבוד על Hanging Knee Raise ואז Leg Raise לפני T2B מלא.' },
      { id:'extension', he:'פתיחה מלאה', type:'atLeast', metric:'hip', stat:'max', limit:160,
        pass:'פתחת את הגוף במלואו בין החזרות',
        fail:'לא פתחת את הגוף בין החזרות',
        tip:'הפתיחה המלאה יוצרת את הקצב. אל תישאר מכווץ.' },
    ],
    notVisible:['האם האצבעות נגעו במוט בפועל'],
  },
  {
    id:'l_sit', he:'L-Sit', en:'L-Sit Hold',
    discipline:'gymnastics', group:'core',
    cameraHint:'צלם מהצד בגובה נמוך, כל הגוף בפריים',
    checks:[
      { id:'hip_angle', he:'זווית הירך', type:'min', metric:'hip', stat:'min', limit:100,
        pass:'הרגליים הגיעו לזווית L תקינה',
        fail:'הרגליים נמוכות מדי — עדיין לא זווית 90',
        tip:'התחל מ-Tuck Sit, ואז רגל אחת ישרה, ואז שתיים.' },
      { id:'knee_straight', he:'יישור ברכיים', type:'atLeast', metric:'knee', stat:'min', limit:155,
        pass:'הברכיים נשארו ישרות', fail:'הברכיים כפופות — זה Tuck ולא L-Sit',
        tip:'עבוד על גמישות מיתרי הברך. Pike Stretch יעזור.' },
    ],
    notVisible:['גובה הישיבה מהרצפה','לחיצת הכתפיים כלפי מטה'],
  },
  {
    id:'hollow_hold', he:'Hollow Hold', en:'Hollow Hold',
    discipline:'gymnastics', group:'core',
    cameraHint:'צלם מהצד בגובה הרצפה',
    checks:[
      { id:'body_line', he:'צורת הסירה', type:'max', metric:'hip', stat:'min', limit:165,
        pass:'זוהה כיווץ — הגוף בצורת סירה',
        fail:'הגוף שטוח מדי — אתה שוכב ולא מחזיק hollow',
        tip:'הרם כתפיים ורגליים מהרצפה וכווץ צלעות פנימה. הגב התחתון צמוד לרצפה.' },
      { id:'knee_straight', he:'יישור ברכיים', type:'atLeast', metric:'knee', stat:'min', limit:155,
        pass:'הרגליים נשארו ישרות', fail:'הברכיים כפופות — זו גרסה מוקלת',
        tip:'זה בסדר להתחיל מכופף. יישר בהדרגה ככל שהליבה מתחזקת.' },
    ],
    notVisible:['האם הגב התחתון צמוד לרצפה — הקריטריון החשוב ביותר, ולא נראה מהצד'],
  },
  {
    id:'ghd_situp', he:'GHD Sit-up', en:'GHD Sit-up',
    discipline:'gymnastics', group:'core',
    cameraHint:'צלם מהצד, כל מכשיר ה-GHD בפריים',
    checks:[
      { id:'extension', he:'טווח לאחור', type:'atLeast', metric:'hip', stat:'max', limit:165,
        pass:'הגעת לפתיחה מלאה לאחור',
        fail:'לא הגעת לטווח מלא לאחור',
        tip:'התקדם בהדרגה — GHD מלא דורש הסתגלות. התחל בטווח חלקי.' },
      { id:'flexion', he:'טווח קדימה', type:'min', metric:'hip', stat:'min', limit:75,
        pass:'הגעת מספיק קדימה', fail:'לא הגעת מספיק קדימה',
        tip:'סיים כל חזרה עם ידיים נוגעות ברגליים.' },
    ],
    notVisible:['מיקום הכריות','עומס על הגב התחתון בקצה'],
  },

  // ══ ג׳ימנסטיקס · רגליים ותנועה ═══════════════════════════════════
  {
    id:'burpee', he:'ברפי', en:'Burpee',
    discipline:'gymnastics', group:'legs',
    cameraHint:'צלם מהצד ממרחק, כל הגוף בפריים',
    checks:[
      { id:'bottom', he:'ירידה לרצפה', type:'atLeast', metric:'hip', stat:'max', limit:160,
        pass:'הגוף הגיע לרצפה בקו ישר',
        fail:'לא ירדת לחזה על הרצפה בקו גוף תקין',
        tip:'החזה והירכיים נוגעים יחד. אל "תקפל" את האגן קודם.' },
      { id:'jump_ext', he:'פתיחה בקפיצה', type:'atLeast', metric:'knee', stat:'max', limit:168,
        pass:'פתיחת ברך מלאה בקפיצה', fail:'לא פתחת את הגוף במלואו בקפיצה',
        tip:'הקפיצה מסתיימת בגוף פתוח לגמרי — זה חלק מהחזרה.' },
    ],
    notVisible:['האם החזה נגע ברצפה','מחיאת כף מעל הראש'],
  },
  {
    id:'box_jump', he:'קפיצה לתיבה', en:'Box Jump',
    discipline:'gymnastics', group:'legs',
    cameraHint:'צלם מהצד — התיבה והגוף המלא בפריים',
    checks:[
      { id:'top_ext', he:'פתיחה על התיבה', type:'atLeast', metric:'hip', stat:'max', limit:168,
        pass:'פתחת ירך מלאה על התיבה',
        fail:'לא נעלת את הירך על התיבה — החזרה לא הושלמה',
        tip:'עמידה זקופה מלאה על התיבה לפני הירידה. זה גם בטוח יותר לגב.' },
      { id:'landing', he:'ספיגת הנחיתה', type:'min', metric:'knee', stat:'min', limit:140,
        pass:'הנחיתה נספגה בברכיים', fail:'נחיתה נוקשה — הברך כמעט לא נכפפה',
        tip:'נחת רך עם ברך כפופה. נחיתה נוקשה מעבירה את כל הכוח למפרק.' },
    ],
    notVisible:['גובה התיבה בפועל','נחיתה סימטרית על שתי הרגליים'],
  },
]

export const MOVEMENTS_BY_DISCIPLINE = (discipline) =>
  MOVEMENTS.filter(m => m.discipline === discipline)

// Grouped for the picker, skipping any group that has no movements.
export function groupedMovements(discipline) {
  const groups = MOVEMENT_GROUPS[discipline] || []
  const list = MOVEMENTS_BY_DISCIPLINE(discipline)
  return groups
    .map(g => ({ ...g, movements: list.filter(m => m.group === g.key) }))
    .filter(g => g.movements.length > 0)
}

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
