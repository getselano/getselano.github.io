// Personalized coaching calculators — layer A of the guide's answer stack.
// The question either matches a calculator pattern and gets a deterministic
// personalised answer from the user's own data, or it falls through to the
// knowledge base / Gemini fallback.
//
// Every calculator returns either:
//   null                       → not a calculator question
//   { text, nav?, missing? }   → answered / needs profile fields filled
//
// `nav` becomes a clickable button in the chat (`{ page, label }`).
// `missing` is an array of profile field names — used to tell the user
// which onboarding fields they should fill so we can answer.
//
// All calorie / macro / water math comes from utils/calc so the chat can
// never quote a different number than the Nutrition tab shows.

import { nutritionTargets, goalAdjustments, waterLiters, resolveActivity, activityFactors } from '../utils/calc'

// ─── Constants ────────────────────────────────────────────────
// Maps the intent detected in the question onto a goalKey from utils/calc.
// The multipliers and protein-per-kg values live there, not here.
const INTENT_TO_GOAL_KEY = {
  cutting: 'cut',
  maintenance: 'maintain',
  recomp: 'recomp',
  bulk: 'bulk',
}

// Rest-between-sets recommendation per training mode
const REST_BY_MODE = {
  strength:    { sec: 240, hint: '3-5 דקות' },
  hypertrophy: { sec: 75,  hint: '60-90 שניות' },
  endurance:   { sec: 45,  hint: '30-60 שניות' },
}

// ─── Helpers ──────────────────────────────────────────────────
function activeGoal(state) {
  return (state.goals || []).find(g => g.status === 'active') || null
}

// Detect intent inside the question — user may ask a general "כמה קלוריות"
// or a specific "כמה קלוריות בחיטוב". The in-question intent WINS.
function goalIntentFrom(question, profile, active) {
  const q = question || ''
  if (/(חיטוב|להתחטב|לרדת|cutting|deficit|לחתוך)/i.test(q)) return 'cutting'
  if (/(תחזוק|לתחזק|לשמור על|maintenance)/i.test(q)) return 'maintenance'
  if (/(עלייה|לעלות במשקל|לבנות מסה|bulk|surplus)/i.test(q)) return 'bulk'
  if (/(recomp|הרכב גוף)/i.test(q)) return 'recomp'
  // Fall back to profile goal
  const key = profile?.goalKey
  if (key === 'cut') return 'cutting'
  if (key === 'bulk') return 'bulk'
  if (key === 'recomp') return 'recomp'
  // Or the active SMART goal kind
  if (active?.kind === 'weight_change') {
    if ((active.metric?.delta || 0) < 0) return 'cutting'
    if ((active.metric?.delta || 0) > 0) return 'bulk'
  }
  return 'maintenance'
}

// Resolve the profile plus the intent detected in the question into the same
// target object the Nutrition tab renders.
function targetsFor(profile, intent) {
  const goalKey = INTENT_TO_GOAL_KEY[intent] || 'maintain'
  return nutritionTargets({ ...profile, goalKey })
}

function missingProfileFields(profile, required) {
  return required.filter(f => !profile?.[f])
}

function missingProfileAnswer(missing) {
  return {
    text: `כדי לענות אישית אני צריך את הנתונים האלה בפרופיל: **${missing.join(' · ')}**. עדכן ונחזור לחשב.`,
    nav: { page: 'profile', label: 'עדכן פרופיל' },
    source: 'calculator',
  }
}

// ─── Calculator: calories ─────────────────────────────────────
function calcCalories(question, state) {
  if (!/(כמה\s+קלוריות|קלוריות\s+ליום|יומי|calorie|תצרוכת|BMR|TDEE|מטבוליזם)/i.test(question)) return null

  const p = state.profile || {}
  const missing = missingProfileFields(p, ['weightKg', 'heightCm', 'age', 'sex'])
  if (missing.length) {
    const heMap = { weightKg: 'משקל', heightCm: 'גובה', age: 'גיל', sex: 'מין' }
    return missingProfileAnswer(missing.map(k => heMap[k] || k))
  }

  const intent = goalIntentFrom(question, p, activeGoal(state))
  const tg = targetsFor(p, intent)

  return {
    text:
      `לפי הנתונים שלך (${p.weightKg}ק״ג · ${p.heightCm}ס״מ · גיל ${p.age}, פעילות ×${tg.activityFactor}) — ` +
      `**${tg.kcal.toLocaleString()} קלוריות ליום** ל־${tg.goal.label}.\n\n` +
      `פירוט: BMR ${tg.bmr.toLocaleString()} · TDEE ${tg.tdee.toLocaleString()} · יעד ×${tg.goal.kcalMul}\n` +
      `מקרו: חלבון ${tg.protein} ג׳ · פחמימות ${tg.carbs} ג׳ · שומן ${tg.fat} ג׳`,
    nav: { page: 'nutrition', label: 'תזונה — עדכן ארוחה' },
    source: 'calculator',
  }
}

// ─── Calculator: protein ──────────────────────────────────────
function calcProtein(question, state) {
  if (!/(כמה\s+חלבון|חלבון\s+ליום|protein|גרם\s+חלבון|כמות\s+חלבון)/i.test(question)) return null

  const p = state.profile || {}
  if (!p.weightKg) return missingProfileAnswer(['משקל'])

  const intent = goalIntentFrom(question, p, activeGoal(state))
  const tg = targetsFor(p, intent)
  // Same number the Nutrition tab shows: the g/kg floor, raised by the diet
  // template when that template asks for more protein.
  const grams = tg.protein || Math.round(p.weightKg * tg.goal.proteinPerKg)

  return {
    text:
      `**${grams} גרם חלבון ליום** (${tg.goal.proteinPerKg} גר׳/ק״ג · ${tg.goal.label}).\n\n` +
      `זה בערך ${Math.round(grams / 25)} מנות של 25 גרם — למשל: 150 גר׳ עוף = 33 גר׳, ` +
      `2 ביצים = 12 גר׳, שייק חלבון = 25 גר׳.`,
    nav: { page: 'nutrition', label: 'תזונה — מעקב מקרו' },
    source: 'calculator',
  }
}

// ─── Calculator: water ────────────────────────────────────────
function calcWater(question, state) {
  if (!/(כמה\s+מים|water\s+intake|כמה\s+לשתות|hydration|נוזלים)/i.test(question)) return null

  const p = state.profile || {}
  if (!p.weightKg) return missingProfileAnswer(['משקל'])

  const base = waterLiters(p.weightKg, p.activity)
  const actLabel = activityFactors[resolveActivity(p.activity)]?.label || ''
  return {
    text:
      `**${base} ליטר מים ליום** (33 מ״ל לכל ק״ג + תוספת לפי רמת פעילות${actLabel ? ` — ${actLabel}` : ''}).\n\n` +
      `ביום אימון — הוסף עוד 500-750 מ״ל לכל שעת פעילות. ` +
      `בחום קיצוני או קרדיו כבד — עד 3.5 ליטר.`,
    nav: { page: 'nutrition', label: 'תזונה — מים' },
    source: 'calculator',
  }
}

// ─── Calculator: 1RM ──────────────────────────────────────────
function calc1RM(question, state) {
  if (!/(1RM|מקסימום|יכולת\s*מירבית)/i.test(question)) return null

  const profile1RM = state.profile?.oneRMs || {}
  const which = /(סקוואט|squat)/i.test(question) ? 'squat'
              : /(בנץ|לחיצת\s*חזה|bench)/i.test(question) ? 'bench'
              : /(דדליפט|deadlift)/i.test(question) ? 'deadlift'
              : /(לחיצת\s*כתפיים|ohp|לחיצה\s*מעל\s*הראש)/i.test(question) ? 'ohp'
              : null

  if (!which) {
    const entries = Object.entries(profile1RM).filter(([, v]) => v)
    if (!entries.length) {
      return {
        text: 'עוד אין לך 1RM רשום בפרופיל. עדכן ליפט ספציפי (סקוואט/בנץ/דדליפט/OHP) ונחזור.',
        nav: { page: 'profile', label: 'הזן 1RM' },
        source: 'calculator',
      }
    }
    const list = entries.map(([lift, w]) => `${liftHe(lift)}: **${w} ק״ג**`).join(' · ')
    return { text: `ה־1RMs שרשומים אצלך: ${list}`, source: 'calculator' }
  }

  const rec = profile1RM[which]
  if (!rec) {
    return {
      text: `אין לך 1RM רשום ל־${liftHe(which)}. עדכן בפרופיל כדי שכל האחוזים בתכנית יחושבו נכון.`,
      nav: { page: 'profile', label: 'הזן 1RM' },
      source: 'calculator',
    }
  }

  return {
    text: `ה־1RM שלך ב־${liftHe(which)}: **${rec} ק״ג**.\n\n` +
          `לפי זה — עבודה סביב 70-85% (${Math.round(rec * 0.7)}-${Math.round(rec * 0.85)} ק״ג) ` +
          `בונה כוח והיפרטרופיה. סביב 60-70% זה נפח.`,
    source: 'calculator',
  }
}

// ─── Calculator: rest between sets ────────────────────────────
function calcRest(question, state) {
  if (!/(כמה\s+מנוחה|מנוחה\s+בין\s+סטים|rest\s+between|זמן\s+מנוחה)/i.test(question)) return null

  const active = activeGoal(state)
  let mode = 'hypertrophy'
  if (/(כוח|strength|1rm|power)/i.test(question) || active?.kind === 'lift_pr') mode = 'strength'
  if (/(חיטוב|סיבולת|endurance|cardio|conditioning)/i.test(question)) mode = 'endurance'

  const r = REST_BY_MODE[mode]
  const modeHe = mode === 'strength' ? 'כוח' : mode === 'endurance' ? 'סיבולת/חיטוב' : 'היפרטרופיה/נפח'
  return {
    text:
      `למצב ${modeHe}: **${r.hint}** בין סטים.\n\n` +
      `הכלל: ככל שהמשקל כבד וההעמסה על מערכת העצבים גדולה, המנוחה ארוכה יותר.`,
    nav: { page: 'train', label: 'אימונים — הגדרות טיימר' },
    source: 'calculator',
  }
}

// ─── Calculator: BMI ──────────────────────────────────────────
function calcBMI(question, state) {
  if (!/BMI|מדד\s+מסת\s+גוף/i.test(question)) return null

  const p = state.profile || {}
  if (!p.weightKg || !p.heightCm) return missingProfileAnswer(['משקל', 'גובה'])

  const bmi = +(p.weightKg / Math.pow(p.heightCm / 100, 2)).toFixed(1)
  const range =
    bmi < 18.5 ? 'תת-משקל' :
    bmi < 25   ? 'נורמלי' :
    bmi < 30   ? 'עודף משקל' :
                 'השמנה'

  return {
    text:
      `ה־BMI שלך: **${bmi}** (${range}).\n\n` +
      `⚠️ BMI לא מבחין בין שריר לשומן. אצל אימונים בכובד — הוא לא הכי מהימן. ` +
      `אחוז שומן ומדדים היקפיים יותר מדויקים.`,
    nav: { page: 'progress', label: 'התקדמות — מדידות' },
    source: 'calculator',
  }
}

// ─── Router ───────────────────────────────────────────────────
const CALCULATORS = [calcCalories, calcProtein, calcWater, calc1RM, calcRest, calcBMI]

export function tryCalculator(question, state) {
  for (const calc of CALCULATORS) {
    const res = calc(question, state)
    if (res) return res
  }
  return null
}

function liftHe(key) {
  return ({ squat: 'סקוואט', bench: 'לחיצת חזה', deadlift: 'דדליפט', ohp: 'לחיצת כתפיים', pullup: 'מתח' })[key] || key
}
