// Unlockable workouts — a small pool of curated routines that trickle
// into the library over time, so members keep discovering new content
// even when we're not actively pushing releases.
//
// Each entry has `unlockAfterWeeks` — the number of weeks after the user's
// onboarding that this workout becomes visible. NewWorkoutToast reads
// this pool and pops a toast the first time an entry crosses its unlock
// threshold. Currently: 6 male + 6 female, staggered every 3 weeks so
// there's a steady drip for the first ~18 weeks of a member's journey.

export const UNLOCKABLE_WORKOUTS = [
  // ─── MEN — weeks 3, 6, 9, 12, 15, 18 ─────────────────────────
  {
    id: 'm_upper_intensity_w3',
    gender: 'male',
    unlockAfterWeeks: 3,
    name: 'Upper Intensity — חזה+גב במעגל',
    goal: 'היפרטרופיה של פלג גוף עליון',
    schema: '4 סופרסטים · 12-15 חזרות · 60 שניות מנוחה',
    duration: 8,
    daysPerWeek: 4,
    tagline: 'המעגל הראשון שקורע את החזה.',
  },
  {
    id: 'm_powerbuilder_split_w6',
    gender: 'male',
    unlockAfterWeeks: 6,
    name: 'Powerbuilder Split — כוח + נפח',
    goal: 'שילוב של כוח בסיס עם היפרטרופיה',
    schema: '5 ימים · 3 מרכזי כוח + 2 ימי נפח · 70-85% 1RM',
    duration: 12,
    daysPerWeek: 5,
    tagline: 'הסטייל של האטלטים שלא בוחרים בין כוח למראה.',
  },
  {
    id: 'm_pull_focus_w9',
    gender: 'male',
    unlockAfterWeeks: 9,
    name: 'Back Attack — גב עבה כמו קיר',
    goal: 'עובי + רוחב גב',
    schema: '2 ימים / שבוע · Deadlift + Row + Pull-up + Lat Pulldown',
    duration: 8,
    daysPerWeek: 5,
    tagline: 'V-Taper אמיתי בונים ככה.',
  },
  {
    id: 'm_arms_specialization_w12',
    gender: 'male',
    unlockAfterWeeks: 12,
    name: 'Arms Specialization — 21s + Drop Sets',
    goal: 'זרועות (טופ פוקוס)',
    schema: '3 ימי זרועות בשבוע · 21s · דרופסטים · 6-8 שבועות',
    duration: 6,
    daysPerWeek: 5,
    tagline: 'תכנית "arms day every day" בגרסה בטוחה.',
  },
  {
    id: 'm_functional_hybrid_w15',
    gender: 'male',
    unlockAfterWeeks: 15,
    name: 'Functional Hybrid — כוח + מטקון',
    goal: 'ספורטאי היברידי',
    schema: '4 ימים · כוח בסיס + מטקונים קצרים · CrossFit style',
    duration: 12,
    daysPerWeek: 4,
    tagline: 'החזק ולא רק על הבמה — גם באמצע הריצה.',
  },
  {
    id: 'm_legs_domination_w18',
    gender: 'male',
    unlockAfterWeeks: 18,
    name: 'Legs Domination — Bulgarian + Front Squat',
    goal: 'רגליים חזקות + פרופורציונליות',
    schema: '2 ימי רגליים · Front Squat + Bulgarian Split + Nordic Curl',
    duration: 10,
    daysPerWeek: 5,
    tagline: 'הרגליים שקובעות אם הלוק שלך מרשים או קטן.',
  },

  // ─── WOMEN — weeks 3, 6, 9, 12, 15, 18 ────────────────────────
  {
    id: 'f_glutes_foundation_w3',
    gender: 'female',
    unlockAfterWeeks: 3,
    name: 'Glutes Foundation — Hip Thrust Focus',
    goal: 'חיטוב וחיזוק העכוז',
    schema: '3 ימי עכוז ממוקדים · Hip Thrust + Cable Kickback + Glute Bridge',
    duration: 8,
    daysPerWeek: 4,
    tagline: 'הבסיס של כל בונת עכוז אמיתית — מ־Bret Contreras.',
  },
  {
    id: 'f_bikini_advanced_w6',
    gender: 'female',
    unlockAfterWeeks: 6,
    name: 'Bikini Advanced — Prep Foundations',
    goal: 'מראה Bikini competitive',
    schema: '5 ימים · חלוקה של Push/Pull/Glutes/Shoulders/Full Body',
    duration: 12,
    daysPerWeek: 5,
    tagline: 'התכנית שהכינה את Ashley Kaltwasser ל־3 אולימפיאדות.',
  },
  {
    id: 'f_core_strength_w9',
    gender: 'female',
    unlockAfterWeeks: 9,
    name: 'Core & Abs Sculpt — 30 Day Challenge',
    goal: 'ליבה חזקה + Abs מובלטים',
    schema: 'מ־McGill Big 3 עד Hanging Leg Raise · 30 ימים',
    duration: 4,
    daysPerWeek: 6,
    tagline: 'הליבה החזקה ביותר שהיה לך אי פעם — 30 ימים.',
  },
  {
    id: 'f_hourglass_w12',
    gender: 'female',
    unlockAfterWeeks: 12,
    name: 'Hourglass Aesthetic — Shoulders + Glutes',
    goal: 'שילוב שעון חול (כתפיים רחבות + עכוז)',
    schema: '4 ימים · כתפיים ממוקדות + עכוז ממוקד',
    duration: 8,
    daysPerWeek: 4,
    tagline: 'הפרופורציות שהופכות כל דבר שלובשים לנפלא.',
  },
  {
    id: 'f_female_strength_w15',
    gender: 'female',
    unlockAfterWeeks: 15,
    name: 'Female Strength — 5×5 מותאם',
    goal: 'כוח מירבי לנשים',
    schema: '3 ימים · Squat + Bench + Deadlift + OHP + Row · 5×5',
    duration: 12,
    daysPerWeek: 5,
    tagline: 'הוכחה שנשים יכולות להרים כבד — בבטחה ובעוצמה.',
  },
  {
    id: 'f_postnatal_return_w18',
    gender: 'female',
    unlockAfterWeeks: 18,
    name: 'Postnatal Return — חזרה לאחר לידה',
    goal: 'חזרה בטוחה לפעילות אחרי לידה',
    schema: 'הליכות → Pelvic Floor → Core → משקלים · 8 שבועות',
    duration: 8,
    daysPerWeek: 5,
    tagline: 'הפרוטוקול העדין והמדויק ביותר — לפי ACOG.',
  },
]

// Return workouts that were unlocked BETWEEN two timestamps
// (i.e., the user hasn't seen them yet but should now).
// startedAt/nowMs are millis; `sex` filters to the trainee's gender.
export function findNewlyUnlocked({ startedAt, seenIds = [], sex, nowMs = Date.now() }) {
  if (!startedAt) return []
  const weeksElapsed = (nowMs - startedAt) / (7 * 24 * 60 * 60 * 1000)
  const genderKey = sex === 'female' ? 'female' : 'male'
  return UNLOCKABLE_WORKOUTS
    .filter(w => w.gender === genderKey)
    .filter(w => w.unlockAfterWeeks <= weeksElapsed)
    .filter(w => !seenIds.includes(w.id))
}
