// Physio-AI: injury/weakness areas with assessment questions, 4-week protocols,
// and red flags. Content is educational - never replaces a physiotherapist visit.

export const bodyAreas = [
  { id:'shoulder',    name:'כתף',           icon:'', common:['אימפינג׳מנט','דלקת שרוול המסובבים','חוסר יציבות'] },
  { id:'lower_back',  name:'גב תחתון',      icon:'', common:['כאב שריר','דיסק','חוסר יציבות ליבה'] },
  { id:'upper_back',  name:'גב עליון',      icon:'', common:['יציבה קדמית','כאב בין השכמות','נוקשות'] },
  { id:'neck',        name:'צוואר',         icon:'', common:['תסמונת הצוואר','כאבי ראש צוואריים'] },
  { id:'knee',        name:'ברך',           icon:'', common:['כאב פיקה','גיד פיקה','ITB','מיניסקוס'] },
  { id:'hip',         name:'ירך',           icon:'', common:['הבזק ירך','חולשת ישבן','בורסיטיס'] },
  { id:'ankle',       name:'קרסול',         icon:'', common:['נקע חוזר','פנטר פאשיה','אכילס'] },
  { id:'wrist_elbow', name:'מרפק/שורש-יד',   icon:'', common:['מרפק טניס','מרפק גולף','תעלת שורש היד'] },
  { id:'core',        name:'ליבה',          icon:'', common:['חולשת ליבה','דיאסטזיס','שרירי בטן חלשים'] },
  { id:'glutes',      name:'ישבן',          icon:'', common:['אמנזיה של הישבן','פירי-פורמיס','חולשת גלוט מדיוס'] },
]

// Assessment questions - shown when starting a rehab program
export const assessmentQuestions = [
  { id:'pain',         q:'רמת הכאב כרגע (0-10)?',                              type:'slider', min:0, max:10 },
  { id:'painDuration', q:'כמה זמן קיים הכאב?',                                type:'select', options:['פחות משבוע','שבוע-חודש','חודש-3','יותר מ-3 חודשים'] },
  { id:'trigger',      q:'מה מחמיר את הכאב?',                                 type:'select', options:['תנועה','מנוחה','לחץ','בכיפוף','בעליית מדרגות','לא ידוע'] },
  { id:'goal',         q:'המטרה שלך?',                                        type:'select', options:['לחזור לאימונים','להפחית כאב','למנוע פציעה חוזרת','חיזוק כללי'] },
  { id:'medical',      q:'האם היה אבחון רפואי?',                              type:'select', options:['לא','כן - שריר','כן - גיד','כן - דיסק','כן - עצם','לא בטוח'] },
]

// Red flags per area - if user answers yes, prompt to see a doctor
export const redFlags = {
  lower_back: ['ירי לרגל מתחת לברך','נימול/חולשה ברגל','אי-שליטה בסוגרים','ירידה במשקל לא-מוסברת','חום עם כאבי גב'],
  neck:       ['סחרחורות חזקות','נימול/חולשה בזרוע','כאב אחרי טראומה'],
  shoulder:   ['חוסר יכולת להרים את היד','דפורמציה נראית','נימול בזרוע'],
  knee:       ['בצקת פתאומית ומאסיבית','חוסר יציבות מוחלט','נעילה של הברך'],
  general:    ['כאב לילי חזק','חום','ירידה במשקל','כאב חוזר לאורך שבועות'],
}

// 4-week rehab protocols per area - each week has focus, exercises, notes
export const protocols = {
  shoulder: {
    title:'שיקום כתף - שרוול מסובבים ויציבות',
    duration: 4,
    principles:['עומס הדרגתי','טווח תנועה לפני חיזוק','אין כאב מעל 4/10 באימון','נוחות עדיפה על מהירות'],
    weeks:[
      { week:1, focus:'מוביליטי + הפעלת שרוול מסובבים', exercises:['Pendulum 2×10 כל כיוון','Band External Rotation 3×15','Prone T Raise 2×15','Scapular Retraction 3×10','Band Row 3×12'] },
      { week:2, focus:'חיזוק בטווח בטוח',                exercises:['Light External Rotation 3×12','Band Row 3×15','Wall Press 3×12','face pull 3×15','Prone Scapular Retraction 3×10'] },
      { week:3, focus:'הכנסת פונקציה + עומס',            exercises:['Seated Dumbbell Press 3×10','Cable Row 3×12','Light Lateral Raise 3×12','face pull 3×15','Dead Hang 3×20ש׳'] },
      { week:4, focus:'חזרה מודרגת לתרגילי כוח',        exercises:['Light Bench Press 3×10','Seated Shoulder Press 3×8','Row 4×10','Overhead Carry 3×10','Push-up 3×אמת'] },
    ],
  },
  lower_back: {
    title:'שיקום גב תחתון - יציבות ליבה + מוביליטי',
    duration: 4,
    principles:['מוביליטי ירך = פחות עומס גב','ליבה = הגנה','להוציא מ-flexion קיצוני','הליכה יומית חובה'],
    weeks:[
      { week:1, focus:'שיכוך + מוביליטי ירך',            exercises:['Knee to Chest 2×10','Cat-Cow 2×10','Bird Dog 3×8','Dead Bug 3×8','Walk 20 דק׳'] },
      { week:2, focus:'הפעלת ליבה עמוקה',                 exercises:['Plank 3×20ש׳','Glute Bridge 3×12','Bird Dog 3×10','Band Pelvic Reset','Walk 30 דק׳'] },
      { week:3, focus:'העמסה הדרגתית',                    exercises:['Loaded Glute Bridge 3×10','Light Technical Deadlift 3×5','Side Plank 3×20ש׳','farmers carry 3×20מ׳','goblet squat 3×8'] },
      { week:4, focus:'תנועה פונקציונלית',                exercises:['Deadlift 3×5 (עומס בינוני)','Squat 3×8','Bird Dog 3×10','Front Carry 3×20מ׳','Single-Leg Tempo 3×8'] },
    ],
  },
  knee: {
    title:'שיקום ברך - VMO וישבן',
    duration: 4,
    principles:['ישבן חלש = ברך חלשה','אקסצנטרי לגידים','לפחות חצי סקוואט כדי לא לעצור לגמרי','קרח לאחר אימון'],
    weeks:[
      { week:1, focus:'טווח + הפעלה',                     exercises:['ISO quad set 3×20ש׳','sTraight leg raise 3×10','side lying leg raise 3×12','wall sit 3×20ש׳','Glute Bridge 3×12'] },
      { week:2, focus:'חיזוק בטווח נוח',                  exercises:['Low Step-up 3×10','Single-Leg Glute Bridge 3×8','clamshell 3×15','wall sit 3×40ש׳','Calendar Check-in'] },
      { week:3, focus:'סקוואט עם עומס נמוך',              exercises:['Goblet Squat 3×10','Short Split Squat 3×8','High Step-up 3×10','Eccentric Nordic Curl 2×5','Light Leg Press 3×12'] },
      { week:4, focus:'חזרה למשקולות',                    exercises:['Back Squat 3×6','Walking Lunge 3×10','RDL 3×8','Short-Range Leg Extension 3×12','Low Box Jump 3×5'] },
    ],
  },
  neck: {
    title:'שיקום צוואר - תנוחה ומוביליטי',
    duration: 4,
    principles:['חיזוק צוואר עמוק > מתיחה','לצאת מ-forward head posture','ארגונומיה במחשב','הפסקות תנועה כל שעה'],
    weeks:[
      { week:1, focus:'שחרור + הפעלה',                    exercises:['chin tuck 3×10','Slow Rotations 2×5 כל כיוון','Upper Trap Release','Trap Stretch 2×30ש׳','Diaphragmatic Breathing 5 דק׳'] },
      { week:2, focus:'חיזוק צווארי עמוק',               exercises:['Wall Chin Tuck 3×10','Controlled Pronation 3×8','Scapular Squeeze 3×15','Corner Chest Stretch 3×30ש׳','face pull 3×15'] },
      { week:3, focus:'חיזוק גב עליון',                   exercises:['face pull 3×15','Row 3×12','Prone Y-T-W 2×10','Standing Band Retraction 3×15','Gentle Bench Press 3×10'] },
      { week:4, focus:'הטמעה יומיומית',                   exercises:['Posture Reminders כל שעה','5 דק׳ Neck Warm-up Before Training','face pull חובה בכל אימון עליון','No Phone Lying Down','Correct Pillow Height'] },
    ],
  },
  ankle: {
    title:'שיקום קרסול - יציבות ופרופריוצפציה',
    duration: 4,
    principles:['נעל תומכת בהתחלה','להימנע ממשטחים לא-יציבים בשבועיים הראשונים','חיזוק שרירי השוק','חזרה הדרגתית לריצה'],
    weeks:[
      { week:1, focus:'טווח + הפחתת בצקת',                exercises:['Foot ABCs 2×2','Flexion / Extension 3×20','Circles 3×10','Ice 15 דק׳ אחרי','Single-Leg Balance (שניות)'] },
      { week:2, focus:'חיזוק בסיסי',                      exercises:['Calf Raise 3×15','Band All Directions 3×12','Calf Stretch on Step 3×10','Single-Leg Balance, Eyes Closed 3×20ש׳','Full Walk'] },
      { week:3, focus:'פרופריוצפציה + כוח',               exercises:['Bosu / Cushion Balance 3×30ש׳','Eccentric Heel Drop 3×12','Light Skips 3×10','side hops 3×10','Single-Leg Hold 3×45ש׳'] },
      { week:4, focus:'חזרה לפעילות',                     exercises:['Easy Run 15 דק׳','Zig-Zag Run 3×20מ׳','Skips 3×15','Two-Foot Jump and Land 3×5','Light Sport Play'] },
    ],
  },
  hip: {
    title:'שיקום ירך - חיזוק גלוט מדיוס',
    duration: 4,
    principles:['גלוט מדיוס = יציבות אגן','להימנע מ-hip drop בהליכה','חיזוק במקום מתיחה כשיש חוסר יציבות'],
    weeks:[
      { week:1, focus:'הפעלה',                            exercises:['clamshell 3×15','side lying leg raise 3×12','Glute Bridge 3×12','fire hydrant 3×10','Quadruped Hip Abduction 3×10'] },
      { week:2, focus:'חיזוק בעומס',                      exercises:['Single-Leg Glute Bridge 3×8','side plank 3×20ש׳','monster walk 3×20צע׳','deficit split squat 3×8','Banded Clamshell 3×12'] },
      { week:3, focus:'תנועה מורכבת',                     exercises:['Step-up 3×10','Walking Lunge 3×12','Romanian Deadlift 3×10','Side Plank with Leg Raise 3×8','Banded Squat 3×12'] },
      { week:4, focus:'ספורט-ספציפי',                     exercises:['Loaded Squat 3×8','Lunge 3×10 כל רגל','Deadlift 3×5','Box Jump 3×5','Easy Run 20 דק׳'] },
    ],
  },
  wrist_elbow: {
    title:'שיקום מרפק/שורש-יד',
    duration: 4,
    principles:['אקסצנטריות מרפאות גידים','להימנע מפעולות מחמירות שבועיים','ארגונומיה של מקלדת/עכבר','חיזוק אחיזה'],
    weeks:[
      { week:1, focus:'שחרור + מוביליטי',                 exercises:['Extensor Stretch 3×30ש׳','Flexor Stretch 3×30ש׳','Forearm Ball Release','Wrist Range of Motion 3×10','Soft Ball Squeeze 3×20'] },
      { week:2, focus:'חיזוק אקסצנטרי',                   exercises:['Weighted Eccentric Wrist Curl 3×15','Weighted Pronation / Supination 3×15','Grip Ball Work','farmers walk 3×20מ׳','Reverse Curl 3×15'] },
      { week:3, focus:'חיזוק תפקודי',                     exercises:['dead hang 3×20ש׳','Fat Grip Hold 3×10','Push-up, Strong Wrists 3×10','Weighted Reverse Curl 3×12','Eccentric Wrist Curl, Moderate Load 3×12'] },
      { week:4, focus:'חזרה מלאה',                        exercises:['pull up 3×5','curl 3×10','Pull-up 3×אמת','Push-up 3×אמת','tricep pushdown 3×12'] },
    ],
  },
  core: {
    title:'חיזוק ליבה עמוקה',
    duration: 4,
    principles:['ליבה = יציבות, לא sit-ups','נשימה במהלך התרגיל','anti-flexion/rotation/extension'],
    weeks:[
      { week:1, focus:'הפעלה',                            exercises:['Diaphragmatic Breathing 3×10','dead bug 3×8','bird dog 3×10','ISO plank 3×20ש׳','Glute Bridge 3×12'] },
      { week:2, focus:'תוספת עומס',                       exercises:['plank 3×30ש׳','side plank 3×20ש׳','Loaded Dead Bug 3×8','pallof press 3×10','Technical Deadlift 3×5'] },
      { week:3, focus:'anti-rotation',                    exercises:['pallof press 3×12','farmers carry 3×30מ׳','plank pull-through 3×8','Cable Dead Bug 3×10','Side Plank with Leg Raise 3×8'] },
      { week:4, focus:'שילוב אימון',                      exercises:['Braced Squat 3×6','Deadlift 3×5','turkish get up 3×3','farmers carry 3×40מ׳','Weighted Anti-Rotation 3×10'] },
    ],
  },
  glutes: {
    title:'הפעלת ישבן + חיזוק גלוט מדיוס',
    duration: 4,
    principles:['ישבן חלש = כאבי גב/ברך','להתחיל עם isolation לפני compound','לחוש את השריר עובד'],
    weeks:[
      { week:1, focus:'התעוררות',                         exercises:['Glute Bridge 3×15','clamshell 3×15','fire hydrant 3×12','monster walk 3×15צעדים','side lying leg raise 3×12'] },
      { week:2, focus:'עומס בינוני',                      exercises:['Single-Leg Glute Bridge 3×10','Bodyweight Hip Thrust 3×15','ROMANIAN DL 3×10','Walking Lunge 3×10','Banded Squat 3×12'] },
      { week:3, focus:'עומס גבוה',                        exercises:['Barbell Hip Thrust 3×10','Romanian Deadlift 3×8','Reverse Lunge 3×10','Loaded Glute Bridge 3×12','pallof press 3×10'] },
      { week:4, focus:'compound מלא',                     exercises:['Deadlift 3×5','Squat 3×6','Heavy Hip Thrust 3×8','Jumping Lunge 3×5','Cable Abduction 3×15'] },
    ],
  },
  upper_back: {
    title:'גב עליון - יציבה וחיזוק',
    duration: 4,
    principles:['face pull הוא כוכב','להתרחק מכפיפת חזה','tempo חשוב'],
    weeks:[
      { week:1, focus:'שחרור וטווח',                      exercises:['T-Spine Ball Release','Cat-Cow 3×10','Corner Chest Release 3×30ש׳','Prone Y-T-W 2×10','Scapular Retraction 3×15'] },
      { week:2, focus:'חיזוק לב',                          exercises:['face pull 3×15','Band Row 3×15','Light Y-T-W 2×10','Machine Scapular Retraction 3×15','Dead Hang 3×15ש׳'] },
      { week:3, focus:'הכנסה לאימון',                     exercises:['Barbell Row 3×10','face pull 4×15','ROW T-BAR 3×10','Band Scapular Retraction 3×15','Scapular Squeeze 3×15'] },
      { week:4, focus:'מלא',                              exercises:['Pull-up 3×אמת','Barbell Row 4×8','face pull 3×15','pull over 3×12','ISO shrug 3×20ש׳'] },
    ],
  },
}
