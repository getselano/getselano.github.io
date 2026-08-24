// Nutrition math — the single source of truth for calories, macros and water.
//
// Everything that shows a calorie or macro number (Nutrition, Home, Calendar,
// MealPlanner, the adaptation engine, and the chat assistant's calculators)
// resolves through nutritionTargets() so the same user can never be told two
// different numbers on two different screens.

// BMR - Mifflin-St Jeor
export function bmr({ sex, weightKg, heightCm, age }) {
  const s = sex === 'female' ? -161 : 5
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + s)
}

export const activityFactors = {
  sedentary: { label: 'יושבני', factor: 1.2 },
  light: { label: 'קל', factor: 1.375 },
  moderate: { label: 'בינוני', factor: 1.55 },
  active: { label: 'פעיל', factor: 1.725 },
  athlete: { label: 'ספורטאי', factor: 1.9 },
}

// Accept the aliases other modules historically used so an unknown key can
// never silently collapse to 'moderate' and quietly change someone's target.
const ACTIVITY_ALIASES = {
  very_active: 'athlete',
  veryActive: 'athlete',
  athlete: 'athlete',
}

export function resolveActivity(key) {
  if (!key) return 'moderate'
  if (activityFactors[key]) return key
  return ACTIVITY_ALIASES[key] || 'moderate'
}

export function tdee(bmrValue, activityKey = 'moderate') {
  const resolved = resolveActivity(activityKey)
  return Math.round(bmrValue * (activityFactors[resolved]?.factor || 1.55))
}

// goal → calorie multiplier vs TDEE + the protein floor for that goal.
//
// Multiplicative, not a fixed kcal delta: a flat −400 is a 25% deficit for a
// 1,600 kcal person and an 11% deficit for a 3,500 kcal one. The percentage
// scales with the person.
export const goalAdjustments = {
  cut:      { label: 'חיטוב / ירידה במשקל', kcalMul: 0.80, proteinPerKg: 2.2 },
  recomp:   { label: 'רה-קומפוזיציה',       kcalMul: 1.00, proteinPerKg: 2.0 },
  maintain: { label: 'שמירה',                kcalMul: 1.00, proteinPerKg: 1.6 },
  lean_bulk:{ label: 'עלייה נקייה',           kcalMul: 1.08, proteinPerKg: 1.8 },
  bulk:     { label: 'עלייה במסה',            kcalMul: 1.15, proteinPerKg: 1.8 },
}

// macros % by diet template
export const dietTemplates = {
  balanced:      { label: 'מאוזן',              p: 30, c: 40, f: 30 },
  high_protein:  { label: 'עתיר חלבון',         p: 40, c: 35, f: 25 },
  keto:          { label: 'קטו',                p: 25, c: 5,  f: 70 },
  carnivore:     { label: 'קרניבור',            p: 35, c: 0,  f: 65 },
  paleo:         { label: 'פליאו',              p: 30, c: 30, f: 40 },
  mediterranean: { label: 'ים-תיכוני',          p: 25, c: 45, f: 30 },
  dash:          { label: 'DASH (לחץ דם)',      p: 22, c: 55, f: 23 },
  whole30:       { label: 'Whole30',            p: 30, c: 35, f: 35 },
  low_carb:      { label: 'דל פחמימות',         p: 35, c: 20, f: 45 },
  low_fodmap:    { label: 'Low-FODMAP',         p: 25, c: 45, f: 30 },
  zone:          { label: 'Zone',               p: 30, c: 40, f: 30 },
  vegetarian:    { label: 'צמחוני',             p: 25, c: 50, f: 25 },
  vegan:         { label: 'טבעוני',             p: 22, c: 53, f: 25 },
  pescatarian:   { label: 'פסקטריאני',          p: 28, c: 42, f: 30 },
  if_16_8:       { label: 'צום לסירוגין 16:8',  p: 30, c: 40, f: 30 },
  if_omad:       { label: 'ארוחה אחת ביום',     p: 35, c: 30, f: 35 },
}

// Raw percentage split. Kept for callers that genuinely want "split N kcal by
// these three percentages"; prefer nutritionTargets() for user-facing numbers.
export function macros(kcal, pPct = 30, cPct = 40, fPct = 30) {
  return {
    protein: Math.round((kcal * pPct/100) / 4),
    carbs:   Math.round((kcal * cPct/100) / 4),
    fat:     Math.round((kcal * fPct/100) / 9),
  }
}

// Minimum dietary fat, g/kg — below this, hormone production suffers. Acts as
// a floor on very-high-protein / very-low-fat template combinations.
const FAT_FLOOR_PER_KG = 0.5

// Upper bound on protein, g/kg. Past roughly this point there is no further
// benefit for body composition and the extra grams only crowd out carbs and
// fat. Without it a percentage-based template runs away at high calorie
// targets — a 100 kg bulk on "high protein" resolves to 445 g (4.5 g/kg).
const PROTEIN_CEILING_PER_KG = 2.5

// THE entry point. Give it a profile, get every number the UI shows.
//
// Protein is derived from bodyweight (g/kg by goal), not from a percentage of
// calories — a percentage means a keto user's protein swings with their
// calorie target, and nothing guarantees a floor. The template percentage is
// still honoured as a *minimum*: whichever is higher wins, so a high-protein
// template is never reduced.
//
// Remaining calories are split between carbs and fat using the template's own
// carb:fat ratio, which preserves template intent (keto stays keto, carnivore
// puts everything into fat).
export function nutritionTargets(profile = {}) {
  const weightKg = Number(profile.weightKg) || 0
  const heightCm = Number(profile.heightCm) || 0
  const age = Number(profile.age) || 0
  const activityKey = resolveActivity(profile.activity)

  const bmrValue = (weightKg && heightCm && age)
    ? bmr({ sex: profile.sex, weightKg, heightCm, age })
    : 0
  const tdeeValue = bmrValue ? tdee(bmrValue, activityKey) : 0

  const goal = goalAdjustments[profile.goalKey] || goalAdjustments.maintain
  const diet = dietTemplates[profile.dietKey] || dietTemplates.balanced
  const kcal = Math.round(tdeeValue * goal.kcalMul)

  // Protein: g/kg floor from the goal, raised toward the template percentage
  // when that asks for more, then capped so a percentage can't run away at a
  // high calorie target.
  const proteinFromWeight = weightKg ? weightKg * goal.proteinPerKg : 0
  const proteinFromTemplate = (kcal * diet.p / 100) / 4
  const proteinCeiling = weightKg ? weightKg * PROTEIN_CEILING_PER_KG : Infinity
  let protein = Math.round(
    Math.min(Math.max(proteinFromWeight, proteinFromTemplate), Math.max(proteinFromWeight, proteinCeiling))
  )

  // Split what's left by the template's carb:fat ratio
  let remaining = Math.max(0, kcal - protein * 4)
  const cf = diet.c + diet.f
  const carbShare = cf > 0 ? diet.c / cf : 0
  let carbs = Math.round((remaining * carbShare) / 4)
  let fat = Math.round((remaining * (1 - carbShare)) / 9)

  // Fat floor — pull calories back from carbs if the split left fat too low
  const fatFloor = weightKg ? Math.round(weightKg * FAT_FLOOR_PER_KG) : 0
  if (fatFloor && fat < fatFloor) {
    const deficitKcal = (fatFloor - fat) * 9
    const carbsToDrop = Math.min(carbs, Math.round(deficitKcal / 4))
    carbs -= carbsToDrop
    fat = fatFloor
  }

  return {
    bmr: bmrValue,
    tdee: tdeeValue,
    kcal,
    protein,
    carbs,
    fat,
    water: weightKg ? waterLiters(weightKg, activityKey) : 0,
    goal,
    diet,
    activityKey,
    activityFactor: activityFactors[activityKey]?.factor || 1.55,
    // True when the profile lacks what we need to compute anything real
    incomplete: !bmrValue,
  }
}

// BMI
export function bmi(weightKg, heightCm) {
  const m = heightCm / 100
  return +(weightKg / (m * m)).toFixed(1)
}

// water recommendation (liters)
export function waterLiters(weightKg, activityKey = 'moderate') {
  const resolved = resolveActivity(activityKey)
  const base = weightKg * 0.033
  const bonus = { sedentary: 0, light: .3, moderate: .5, active: .8, athlete: 1.2 }[resolved] ?? .5
  return +(base + bonus).toFixed(1)
}
