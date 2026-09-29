// Program rules (spec §2). Business constants. Change them only with a product decision.
export const PROGRAM_DAYS = 42 // 6 weeks
export const PROGRAM_WEEKS = 6
export const TOTAL_SESSIONS = 18 // available workouts
export const MIN_SESSIONS = 12 // minimum for eligibility
export const REWARD_DAYS = 36 // marked days for the personal training session
export const PRICE_DEFAULT = 2500 // ₪ incl. VAT

// Prize values, used by the forecast of prize costs.
export const PERSONAL_TRAINING_VALUE = 250 // ₪, track B
export const FREE_MEMBERSHIP_MONTHS = 2 // track A
// Value of one membership month in ₪. Not in the spec; set per club via env.
// While it is 0 the dashboard shows the track A cost as months, not shekels.
export const MEMBERSHIP_MONTH_VALUE = Number(process.env.NEXT_PUBLIC_MEMBERSHIP_MONTH_VALUE || 0)

// The nutrition condition is "daily". A day off per calendar week does not
// break the streak, so "daily" is satisfied at 6 days × 6 weeks = 36 days.
export const NUTRITION_REQUIRED_DAYS = PROGRAM_DAYS - PROGRAM_WEEKS

// Weekly measurement falls on the last day of each program week (7, 14, …, 42).
export const MEASUREMENT_EVERY = 7

export const TIME_ZONE = 'Asia/Jerusalem'

export const STATUS_COLORS = {
  red: '#C4553A',
  yellow: '#E0912B',
  green: '#1D9E75',
} as const

// How long the personal training session stays redeemable after day 42.
// Not in the spec; shown on the win screen. Adjust to the club's policy.
export const REWARD_VALIDITY_DAYS = 30
