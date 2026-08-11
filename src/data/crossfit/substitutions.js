// Per-movement scale + substitute suggestions.
// Every entry lists 1-3 alternatives that either lower the barrier (easier
// version) or remove an equipment/skill blocker (substitute movement).
// Consumed by WodDisplay's "סקייל" panel on each movement in a generated WOD.

import { MOVEMENTS } from './movements'

// Quick lookup for movement metadata (he/en names).
const byId = Object.fromEntries(MOVEMENTS.map(m => [m.id, m]))

// Reason tags — short chip labels shown next to each suggestion.
const R = {
  easier:      { key:'easier',      label:'קל יותר',        color:'#5ab674' },
  no_bar:      { key:'no_bar',      label:'בלי מוט',        color:'#c9a961' },
  no_rig:      { key:'no_rig',      label:'בלי מתקן/רינגים', color:'#4a90c7' },
  no_ghd:      { key:'no_ghd',      label:'בלי GHD',        color:'#4a90c7' },
  no_wall:     { key:'no_wall',     label:'בלי קיר',        color:'#4a90c7' },
  no_skill:    { key:'no_skill',    label:'בלי מיומנות',    color:'#c74050' },
  no_cardio:   { key:'no_cardio',   label:'החלפה קרדיו',    color:'#a05ae0' },
  safer:       { key:'safer',       label:'עדין למפרקים',   color:'#5ab674' },
}

// swap(subId, reason, note?) — tiny helper to keep the map dense/readable.
const s = (id, reason, note) => ({ id, reason, note: note || null })

// Substitutions map. Keys are movement.id. Missing keys → no suggestions.
export const SUBS = {
  // ── Bodyweight ──────────────────────────────────────
  pullups: [
    s('ring_rows',       R.easier,   'תלוי נמוך יותר = קל יותר'),
    s('pushups',         R.no_rig,   'החליף לדחיפה במקום משיכה'),
  ],
  pushups: [
    s('pushups',         R.easier,   'ידיים על ספסל / קיר'),
    s('dips',            R.no_skill, 'שיווי משקל דומה, קל יותר'),
  ],
  hspu: [
    s('db_shoulder_press', R.no_skill, 'עומס דומה, בלי הפוך'),
    s('pushups',         R.no_wall,  'דחיפה אופקית במקום'),
  ],
  pistol_squats: [
    s('air_squats',      R.easier,   'סקוואט רגיל, x2 חזרות'),
    s('goblet_squat',    R.safer,    'עם משקולת יד'),
  ],
  toes_to_bar: [
    s('knees_to_elbows', R.easier),
    s('situps',          R.no_rig,   'ליבה על הרצפה'),
  ],
  knees_to_elbows: [
    s('situps',          R.easier),
  ],
  bar_muscle_up: [
    s('pullups',         R.easier,   'רק חלק המשיכה'),
    s('dips',            R.easier,   'רק חלק הדחיפה'),
  ],
  ring_muscle_up: [
    s('pullups',         R.easier),
    s('dips',            R.easier),
  ],
  ring_rows: [
    s('pushups',         R.no_rig,   'הפוכה — דחיפה במקום'),
  ],
  rope_climbs: [
    s('pullups',         R.no_rig,   '3 עליות מתח לכל טיפוס'),
  ],
  handstand_walks: [
    s('bear_crawl',      R.no_skill, 'הליכה על ארבע במקום'),
  ],
  wall_walks: [
    s('bear_crawl',      R.no_wall),
    s('pushups',         R.easier),
  ],
  l_sits: [
    s('situps',          R.no_rig),
  ],

  // ── Weightlifting (barbell) ─────────────────────────
  deadlift: [
    s('kb_deadlift',     R.no_bar,   'קטלבל כבד או 2 יחד'),
    s('db_deadlift',     R.no_bar,   'משקולות יד'),
  ],
  thruster: [
    s('db_thruster',     R.no_bar),
    s('goblet_squat',    R.easier,   '+ push press נפרד'),
  ],
  squat_clean: [
    s('kb_clean',        R.no_bar),
    s('db_clean',        R.no_bar),
  ],
  clean_and_jerk: [
    s('db_clean',        R.no_bar,   '+ db_push_press'),
    s('kb_clean',        R.no_bar,   '+ kb_thruster'),
  ],
  snatch: [
    s('db_snatch',       R.no_bar),
    s('kb_snatch',       R.no_bar),
  ],
  overhead_press: [
    s('db_shoulder_press', R.no_bar),
    s('push_press',      R.easier,   'עזרת רגליים'),
  ],
  push_press: [
    s('db_push_press',   R.no_bar),
    s('overhead_press',  R.easier,   'לחיצה איטית בלי דחיפה'),
  ],
  push_jerk: [
    s('db_push_press',   R.no_bar),
    s('push_press',      R.no_skill, 'בלי החלפת רגליים'),
  ],
  split_jerk: [
    s('push_jerk',       R.no_skill),
    s('db_push_press',   R.no_bar),
  ],
  sdhp: [
    s('kb_swing',        R.no_bar,   'תנועת ירך דומה'),
    s('kb_deadlift',     R.easier),
  ],

  // ── Kettlebell ──────────────────────────────────────
  kb_swing: [
    s('kb_deadlift',     R.easier,   'רק הרמה, בלי עוצמה'),
    s('db_snatch',       R.no_bar,   'עם משקולת יד'),
  ],
  kb_snatch: [
    s('kb_swing',        R.easier),
    s('db_snatch',       R.no_bar),
  ],
  kb_clean: [
    s('kb_deadlift',     R.easier),
    s('db_clean',        R.no_bar),
  ],
  kb_thruster: [
    s('goblet_squat',    R.easier,   '+ push press'),
    s('db_thruster',     R.no_bar),
  ],
  goblet_squat: [
    s('air_squats',      R.easier),
  ],

  // ── Box ─────────────────────────────────────────────
  box_jumps: [
    s('box_step_ups',    R.easier,   'ללא קפיצה — עלייה'),
    s('air_squats',      R.no_bar,   'בלי קופסה'),
  ],
  box_overs: [
    s('box_jumps',       R.easier),
    s('box_step_ups',    R.easier),
  ],
  burpee_box_jump_overs: [
    s('burpees',         R.easier,   'בלי הקפיצה על הקופסה'),
    s('box_jumps',       R.easier),
  ],
  box_step_ups: [
    s('air_squats',      R.no_bar),
  ],

  // ── Cardio ──────────────────────────────────────────
  running: [
    s('rowing',          R.no_cardio, 'החלף מטרים ב־2:1'),
    s('assault_bike',    R.no_cardio, 'החלף קלוריות'),
  ],
  rowing: [
    s('running',         R.no_cardio),
    s('assault_bike',    R.no_cardio),
    s('ski_erg',         R.no_cardio),
  ],
  assault_bike: [
    s('rowing',          R.no_cardio),
    s('running',         R.no_cardio),
    s('bike_erg',        R.no_cardio),
  ],
  ski_erg: [
    s('rowing',          R.no_cardio),
  ],
  bike_erg: [
    s('assault_bike',    R.no_cardio),
    s('rowing',          R.no_cardio),
  ],
  double_unders: [
    s('single_unders',   R.easier,   'x2 חזרות'),
  ],

  // ── Odd Object ──────────────────────────────────────
  sandbag_carry: [
    s('farmer_carry',    R.no_bar,   'עם משקולות יד'),
  ],
  sandbag_clean: [
    s('db_clean',        R.no_bar),
    s('kb_clean',        R.no_bar),
  ],
  yoke_carry: [
    s('farmer_carry',    R.no_bar),
    s('sled_push',       R.no_bar),
  ],
  sled_push: [
    s('bear_crawl',      R.no_bar,   'לרוחב פנימי דומה'),
    s('running',         R.no_bar),
  ],
  sled_drag: [
    s('running',         R.no_bar),
  ],
  farmer_carry: [
    s('kb_deadlift',     R.no_bar,   'עומס אחיזה דומה'),
  ],
  atlas_stone: [
    s('sandbag_clean',   R.no_bar),
    s('db_clean',        R.no_bar),
  ],
  tire_flip: [
    s('deadlift',        R.no_bar),
    s('kb_deadlift',     R.no_bar),
  ],

  // ── Wall ball ──────────────────────────────────────
  wall_ball_shots: [
    s('goblet_squat',    R.no_wall,  '+ push press'),
    s('db_thruster',     R.no_wall),
    s('air_squats',      R.easier),
  ],

  // ── Dumbbell ───────────────────────────────────────
  db_snatch: [
    s('kb_swing',        R.easier),
    s('kb_snatch',       R.no_bar),
  ],
  db_thruster: [
    s('goblet_squat',    R.easier,   '+ push press'),
    s('kb_thruster',     R.no_bar),
  ],
  db_clean: [
    s('kb_clean',        R.no_bar),
    s('db_deadlift',     R.easier),
  ],
  db_deadlift: [
    s('kb_deadlift',     R.no_bar),
    s('deadlift',        R.no_bar,   'עם מוט אם יש'),
  ],
  db_shoulder_press: [
    s('overhead_press',  R.no_bar),
    s('push_press',      R.easier),
  ],
  db_push_press: [
    s('push_press',      R.no_bar),
    s('db_shoulder_press', R.easier),
  ],
  db_oh_walking_lunges: [
    s('air_squats',      R.easier,   'בלי המשקולת מעל'),
    s('goblet_squat',    R.easier),
  ],

  // ── GHD ──────────────────────────────────────────────
  ghd_situps: [
    s('situps',          R.no_ghd,   'רגילים על הרצפה'),
  ],
  ghd_hip_ext: [
    s('kb_deadlift',     R.no_ghd,   'עבודת גב תחתון דומה'),
  ],

  // ── Other functional ────────────────────────────────
  devils_press: [
    s('burpees',         R.easier,   '+ db_snatch נפרד'),
    s('db_thruster',     R.no_skill),
  ],
  bear_crawl: [
    s('pushups',         R.easier),
  ],
  burpees: [
    s('pushups',         R.easier,   'בלי הקפיצה'),
    s('air_squats',      R.safer,    'בלי לרדת לרצפה'),
  ],
  air_squats: [
    s('box_step_ups',    R.safer,    'עומס נמוך יותר'),
  ],
  situps: [
    s('knees_to_elbows', R.no_skill, 'ליבה עם מתקן'),
  ],
  dips: [
    s('pushups',         R.easier),
    s('db_bench_press',  R.no_skill),
  ],
}

// Public API: returns [{movement, reasonKey, reasonLabel, reasonColor, note}]
// with resolved movement objects, ready for UI.
export function getSubs(movementId) {
  const list = SUBS[movementId]
  if (!list) return []
  return list
    .map(entry => {
      const mv = byId[entry.id]
      if (!mv) return null
      return {
        movement: mv,
        reasonKey: entry.reason.key,
        reasonLabel: entry.reason.label,
        reasonColor: entry.reason.color,
        note: entry.note,
      }
    })
    .filter(Boolean)
}
