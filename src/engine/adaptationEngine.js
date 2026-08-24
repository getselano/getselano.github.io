// Adaptation Engine - reads full app state and returns cross-module insights.
// Pure function, no side effects. Each rule returns an Insight or null.
// Future LLM provider can be swapped in - keep the same shape.

import { nutritionTargets } from '../utils/calc'
import { bloodMarkers, statusForValue } from '../data/bloodMarkers'
import { todayKey } from '../utils/date'

// severity: high (needs action today), medium (soon), low (nice-to-know)
// module: 'train' | 'nutrition' | 'mind' | 'habits' | 'recovery' | 'health'
// action: { label, target: page-key }
export function runEngine(state) {
  const ctx = buildContext(state)
  const insights = []
  for (const rule of RULES) {
    try {
      const ins = rule(ctx)
      if (Array.isArray(ins)) insights.push(...ins.filter(Boolean))
      else if (ins) insights.push(ins)
    } catch (e) { /* rule errors should never crash the app */ }
  }
  return insights.sort(bySeverity)
}

function buildContext(state) {
  const now = new Date()
  const weekAgo = new Date(now - 7 * 24 * 3600 * 1000)
  const twoWeeksAgo = new Date(now - 14 * 24 * 3600 * 1000)

  const workoutsThisWeek = state.workoutLogs.filter(l => new Date(l.date) >= weekAgo)
  const workoutsLastWeek = state.workoutLogs.filter(l => {
    const d = new Date(l.date)
    return d >= twoWeeksAgo && d < weekAgo
  })
  const daysSinceLastWorkout = state.workoutLogs.length
    ? Math.floor((now - new Date(state.workoutLogs[0].date)) / (24 * 3600 * 1000))
    : null

  const recentCheckins = state.moodCheckins.slice(0, 7)
  const avgMood = avg(recentCheckins.map(c => c.mood))
  const avgSleep = avg(recentCheckins.map(c => c.sleepHours))
  const avgStress = avg(recentCheckins.map(c => c.stress))
  const avgEnergy = avg(recentCheckins.map(c => c.energy))

  const trendMood = trend(recentCheckins.map(c => c.mood).reverse())
  const trendSleep = trend(recentCheckins.map(c => c.sleepHours).reverse())

  const _t = nutritionTargets(state.profile)
  const kcalTarget = _t.kcal
  const diet = _t.diet
  const macroTarget = { protein: _t.protein, carbs: _t.carbs, fat: _t.fat }

  const todayMeals = state.mealLogs[todayKey()] || []
  const todayKcal = todayMeals.reduce((s, m) => s + (m.kcal || 0), 0)
  const todayProtein = todayMeals.reduce((s, m) => s + (m.p || 0), 0)

  const habitsToday = state.habits.filter(h => h.doneToday).length
  const bestStreak = Math.max(0, ...state.habits.map(h => h.streak))

  const latestBlood = state.bloodTests[0]
  const bloodFlags = latestBlood
    ? bloodMarkers.map(m => {
        const v = +latestBlood.values[m.id]
        if (!v) return null
        const status = statusForValue(m, v, state.profile.sex)
        return status === 'normal' || status === 'unknown' ? null : { marker: m, value: v, status }
      }).filter(Boolean)
    : []

  return {
    state, now, profile: state.profile,
    workoutsThisWeek, workoutsLastWeek, daysSinceLastWorkout,
    recentCheckins, avgMood, avgSleep, avgStress, avgEnergy,
    trendMood, trendSleep,
    kcalTarget, macroTarget, todayKcal, todayProtein,
    habitsToday, bestStreak,
    latestBlood, bloodFlags,
    wearable: state.wearable,
  }
}

// ─── RULES ──────────────────────────────────────────────────────────────

const RULES = [
  // 1. Sleep gate - if last night's sleep is low, back off today
  ({ recentCheckins }) => {
    const last = recentCheckins[0]
    if (!last || last.sleepHours == null) return null
    if (last.sleepHours < 6) return {
      id: 'sleep-low', severity: 'high', module: 'recovery',
      icon: '',
      title: `רק ${last.sleepHours} שעות שינה אמש`,
      body: 'המערכת ממליצה להוריד את נפח האימון היום ב-20-30% ולהעדיף תרגילים פונקציונליים על כוח מקסימלי. שינה קצרה פוגעת בהחלמה, בשיפוט מוטורי ובביצועים.',
      action: { label: 'ראה תכנית מותאמת', target: 'train' },
    }
    return null
  },

  // 2. Sleep trend deterioration
  ({ trendSleep, avgSleep, recentCheckins }) => {
    if (recentCheckins.length < 4) return null
    if (avgSleep != null && avgSleep < 6.5) return {
      id: 'sleep-chronic', severity: 'high', module: 'recovery',
      icon: '',
      title: `שינה כרונית נמוכה - ממוצע ${avgSleep.toFixed(1)}ש׳`,
      body: 'שבוע של פחות מ-7 שעות שינה מפחית טסטוסטרון ~15%, מעלה קורטיזול ומקטין קצב הבנייה. פוקוס השבוע: שגרת ערב עקבית, ללא מסכים 30 דק׳ לפני שינה.',
      action: { label: 'פתח הרגלי שינה', target: 'habits' },
    }
    return null
  },

  // 3. Mood downward trend
  ({ trendMood, avgMood, recentCheckins }) => {
    if (recentCheckins.length < 4) return null
    if (avgMood != null && avgMood < 5) return {
      id: 'mood-low', severity: 'high', module: 'mind',
      icon: '',
      title: `מצב-רוח נמוך - ${avgMood.toFixed(1)}/10 בממוצע`,
      body: 'שווה שיחה עם המאמן המנטלי. הרבה פעמים ירידת מצב-רוח מגיעה מירידה בשינה או ממחסור במיקרו-נוטריאנטים (ויטמין D, B12, מגנזיום).',
      action: { label: 'פתח שיחה מנטלית', target: 'mind' },
    }
    if (trendMood === 'down' && avgMood != null && avgMood < 7) return {
      id: 'mood-trend-down', severity: 'medium', module: 'mind',
      icon: '',
      title: 'מגמת ירידה במצב-הרוח',
      body: 'שלושת ה-check-ins האחרונים בירידה. Check-in קצר יעזור לנו לזהות מה משפיע.',
      action: { label: 'עשה Check-in', target: 'mind' },
    }
    return null
  },

  // 4. Stress high
  ({ avgStress, recentCheckins }) => {
    if (recentCheckins.length < 3 || avgStress == null) return null
    if (avgStress >= 7) return {
      id: 'stress-high', severity: 'medium', module: 'mind',
      icon: '',
      title: `רמת סטרס גבוהה - ${avgStress.toFixed(1)}/10`,
      body: 'המלצה: 10 דק׳ נשימת 4-7-8 בבוקר ובערב. סטרס כרוני מעלה קורטיזול ומקשה על ירידה במשקל וגם על עלייה במסה.',
      action: { label: 'פתח כלים מנטליים', target: 'mind' },
    }
    return null
  },

  // 5. No workout in a while
  ({ daysSinceLastWorkout }) => {
    if (daysSinceLastWorkout == null) return null
    if (daysSinceLastWorkout >= 7) return {
      id: 'no-workout', severity: 'high', module: 'train',
      icon: '⏰',
      title: `${daysSinceLastWorkout} ימים ללא אימון`,
      body: 'התחל בקטן - 20 דק׳ פונקציונלי או הליכה מהירה. חזרה הדרגתית מונעת פציעות ומחזירה את המומנטום.',
      action: { label: 'בחר אימון קל', target: 'train' },
    }
    if (daysSinceLastWorkout >= 4) return {
      id: 'workout-gap', severity: 'medium', module: 'train',
      icon: '',
      title: `${daysSinceLastWorkout} ימים מאז האימון האחרון`,
      body: 'שווה לחזור לפעילות היום - עדיף אימון קצר על אימון מושלם.',
      action: { label: 'התחל אימון היום', target: 'train' },
    }
    return null
  },

  // 6. Overtraining risk
  ({ workoutsThisWeek, avgSleep }) => {
    if (workoutsThisWeek.length >= 6 && avgSleep != null && avgSleep < 7) return {
      id: 'overtrain', severity: 'medium', module: 'recovery',
      icon: '',
      title: 'סימני אימון-יתר',
      body: `${workoutsThisWeek.length} אימונים השבוע עם שינה ממוצעת של ${avgSleep.toFixed(1)}ש׳. שקול יום מנוחה פעילה (הליכה/מוביליטי).`,
      action: { label: 'צפה בשגרת מוביליטי', target: 'train' },
    }
    return null
  },

  // 7. Great momentum
  ({ workoutsThisWeek, avgMood, habitsToday }) => {
    if (workoutsThisWeek.length >= 4 && avgMood >= 7.5 && habitsToday >= 3) return {
      id: 'momentum', severity: 'low', module: 'train',
      icon: '',
      title: 'מומנטום מדהים',
      body: `${workoutsThisWeek.length} אימונים + מצב-רוח ${avgMood.toFixed(1)} + ${habitsToday} הרגלים. זמן מצוין לדחוף פרוגרסיה: +2.5 ק״ג בתרגילי מפתח.`,
      action: { label: 'ראה תכנית', target: 'train' },
    }
    return null
  },

  // 8. Protein deficit today
  ({ todayProtein, macroTarget, todayKcal }) => {
    if (todayKcal < 200) return null // haven't logged much yet
    if (todayProtein < macroTarget.protein * 0.7) return {
      id: 'protein-low', severity: 'medium', module: 'nutrition',
      icon: '',
      title: `חסרים ${Math.round(macroTarget.protein - todayProtein)}ג׳ חלבון היום`,
      body: 'חלבון = בניית שריר + שובע. הוסף מנת חזה עוף/יוגורט יווני/שייק חלבון לפני סוף היום.',
      action: { label: 'הוסף מזון', target: 'nutrition' },
    }
    return null
  },

  // 9. Calorie surplus/deficit large deviation
  ({ todayKcal, kcalTarget }) => {
    if (todayKcal < 200) return null
    const pct = (todayKcal / kcalTarget) * 100
    if (pct > 130) return {
      id: 'kcal-over', severity: 'medium', module: 'nutrition',
      icon: '',
      title: `${Math.round(pct)}% מהיעד הקלורי היום`,
      body: 'לא נורא ליום בודד. שים לב שהחריגות לא הופכות לדפוס - שקול הליכה נוספת של 30 דק׳.',
      action: { label: 'ראה יומן ארוחות', target: 'nutrition' },
    }
    return null
  },

  // 10. Blood test flags - vitamin D
  ({ bloodFlags }) => {
    const d = bloodFlags.find(f => f.marker.id === 'vitD' && f.status === 'low')
    if (d) return {
      id: 'blood-vitd', severity: 'high', module: 'health',
      icon: '',
      title: `ויטמין D נמוך (${d.value} ng/mL)`,
      body: 'מחסור נפוץ בישראל למרות השמש. משפיע על מצב-רוח, מערכת חיסון, כוח שריר. המלצה: 2000-4000 יב״ל ליום + חשיפה של 15 דק׳ בשמש.',
      action: { label: 'פתח בדיקה', target: 'nutrition' },
    }
    return null
  },

  // 11. Blood - ferritin/iron
  ({ bloodFlags, profile }) => {
    const ferr = bloodFlags.find(f => f.marker.id === 'ferritin' && f.status === 'low')
    if (ferr) return {
      id: 'blood-iron', severity: 'high', module: 'health',
      icon: '',
      title: `פריטין נמוך (${ferr.value})${profile.sex === 'female' ? ' - נפוץ בנשים' : ''}`,
      body: 'ברזל נמוך = עייפות, סחרחורות, ירידה בביצועי סבולת. הוסף: בשר אדום 2 פעמים בשבוע, עדשים, טחינה. שילוב עם ויטמין C משפר ספיגה.',
      action: { label: 'פתח בדיקה', target: 'nutrition' },
    }
    return null
  },

  // 12. Blood - B12 low (extra critical for vegetarians/vegans)
  ({ bloodFlags, profile }) => {
    const b12 = bloodFlags.find(f => f.marker.id === 'b12' && f.status === 'low')
    if (b12) {
      const veg = profile.dietKey === 'vegan' || profile.dietKey === 'vegetarian'
      return {
        id: 'blood-b12', severity: 'high', module: 'health',
        icon: '',
        title: `B12 נמוך${veg ? ' - קריטי בתזונה צמחית' : ''}`,
        body: 'B12 חיוני למערכת עצבים. מחסור מתמשך גורם לנימול, עייפות, בעיות זיכרון. תוסף יומי 1000 מק״ג עד שהערך חוזר לטווח.',
        action: { label: 'פתח בדיקה', target: 'nutrition' },
      }
    }
    return null
  },

  // 13. Blood - lipids
  ({ bloodFlags }) => {
    const ldl = bloodFlags.find(f => f.marker.id === 'ldl' && f.status === 'high')
    const tg = bloodFlags.find(f => f.marker.id === 'tg' && f.status === 'high')
    if (ldl || tg) return {
      id: 'blood-lipids', severity: 'medium', module: 'health',
      icon: '',
      title: 'שומני דם גבוהים',
      body: 'שילוב מנצח: 30ג׳ סיבים ליום (שיבולת שועל, קטניות), אומגה 3, הפחתת שומן טראנס, אימון אירובי 150 דק׳ בשבוע.',
      action: { label: 'פתח בדיקה', target: 'nutrition' },
    }
    return null
  },

  // 14. Blood - inflammation
  ({ bloodFlags }) => {
    const crp = bloodFlags.find(f => f.marker.id === 'crp' && f.status === 'high')
    if (crp) return {
      id: 'blood-crp', severity: 'medium', module: 'health',
      icon: '',
      title: 'סמן דלקת (CRP) גבוה',
      body: 'תזונה אנטי-דלקתית: כורכום, ג׳ינג׳ר, ירקות עלים ירוקים, דגים שומניים, שמן זית. הפחתה: סוכר, אלכוהול, בשר מעובד. גם: שינה איכותית.',
    }
    return null
  },

  // 15. Habits underperforming
  ({ habitsToday, state }) => {
    const total = state.habits.length
    if (total > 0 && habitsToday === 0 && new Date().getHours() >= 15) return {
      id: 'habits-zero', severity: 'medium', module: 'habits',
      icon: '',
      title: 'עדיין לא סימנת הרגלים היום',
      body: 'רק תסמן 1-2 הרגלים - זה מספיק לשמור על ה-streak ולתת לך תחושת פרודוקטיביות.',
      action: { label: 'סמן הרגלים', target: 'habits' },
    }
    return null
  },

  // 16. Consistency milestone
  ({ bestStreak }) => {
    if (bestStreak >= 30) return {
      id: 'streak-30', severity: 'low', module: 'habits',
      icon: '',
      title: `${bestStreak} ימי streak - כל הכבוד`,
      body: 'הרגל של 30+ ימים כבר חלק ממי שאתה. מוכן לאתגר הבא?',
    }
    if (bestStreak >= 7) return {
      id: 'streak-7', severity: 'low', module: 'habits',
      icon: '⭐',
      title: `שבוע רצוף - מומנטום נבנה`,
      body: 'מחקרים מראים ש-21 ימים מספיקים להטמיע הרגל. אתה בדרך.',
    }
    return null
  },

  // 17. Rehab pain trending up
  ({ state }) => {
    const active = state.rehabPrograms?.[0]
    if (!active || active.painLog.length < 2) return null
    const last = active.painLog[0]?.pain ?? 0
    const first = active.painLog[active.painLog.length - 1]?.pain ?? 0
    if (last > first + 1) return {
      id: 'rehab-pain-up', severity: 'high', module: 'health',
      icon: '',
      title: `כאב עולה בתכנית השיקום`,
      body: `רמת הכאב עלתה מ-${first} ל-${last} מאז תחילת התכנית. שקול להוריד עומס בשבוע הזה או להתייעץ עם פיזיותרפיסט לפני המשך.`,
      action: { label: 'פתח שיקום', target: 'rehab' },
    }
    return null
  },

  // 18. Wearable snapshot
  ({ wearable }) => {
    if (!wearable) return null
    if (wearable.hrv && wearable.hrv < 45) return {
      id: 'hrv-low', severity: 'medium', module: 'recovery',
      icon: '',
      title: `HRV נמוך (${wearable.hrv})`,
      body: 'HRV נמוך מעיד על עומס על מערכת העצבים. יום אימון קליל + עדיפות לשינה ושתייה.',
    }
    if (wearable.steps && wearable.steps < 5000) return {
      id: 'steps-low', severity: 'low', module: 'habits',
      icon: '',
      title: `רק ${wearable.steps.toLocaleString()} צעדים היום`,
      body: 'הליכה של 30 דק׳ תוסיף בערך 3,000 צעדים, תשפר עיכול ותוריד סטרס.',
    }
    return null
  },
]

// ─── HELPERS ────────────────────────────────────────────────────────────
const SEV_ORDER = { high: 0, medium: 1, low: 2 }
function bySeverity(a, b) { return SEV_ORDER[a.severity] - SEV_ORDER[b.severity] }

function avg(arr) {
  const nums = arr.filter(v => v != null && !isNaN(v))
  if (!nums.length) return null
  return nums.reduce((s, v) => s + v, 0) / nums.length
}

function trend(arr) {
  if (arr.length < 3) return null
  const first = avg(arr.slice(0, Math.floor(arr.length / 2)))
  const last = avg(arr.slice(-Math.ceil(arr.length / 2)))
  if (first == null || last == null) return null
  if (last > first * 1.08) return 'up'
  if (last < first * 0.92) return 'down'
  return 'flat'
}

export const severityColor = (sev) => ({ high: '#e05a5a', medium: '#e0a05a', low: '#5a9be0' })[sev] || '#a09b8c'
export const moduleLabel = (m) => ({ train:'אימון', nutrition:'תזונה', mind:'מנטלי', habits:'הרגלים', recovery:'התאוששות', health:'בריאות' })[m] || m
