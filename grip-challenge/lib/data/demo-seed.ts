// Demo data, generated relative to today so the screens always look alive.
// Used only when no Supabase project is configured.
import { addDays, rangeDays, todayIL, weekday } from '../dates'
import { PROGRAM_DAYS } from '../program'
import type { CoachCall, DailyLog, Deal, Goal, Milestone, Participant, ScheduleSlot, Staff } from '../types'

export interface DemoStore {
  staff: Staff[]
  participants: Participant[]
  goals: Goal[]
  logs: (DailyLog & { participant_id: string })[]
  calls: CoachCall[]
  milestones: (Milestone & { participant_id: string })[]
  schedule: ScheduleSlot[]
  deals: Deal[]
  notifications: { kind: string; recipient: string; sent_on: string; status: string; detail?: string }[]
}

export const DEMO_STAFF: Staff[] = [
  { id: 'st-aviv', full_name: 'אביב', phone: '972500000001', role: 'admin' },
  { id: 'st-hadar', full_name: 'הדר', phone: '972500000002', role: 'admin' },
  { id: 'st-ron', full_name: 'רון', phone: '972500000003', role: 'coach' },
  { id: 'st-michal', full_name: 'מיכל', phone: '972500000004', role: 'coach' },
  { id: 'st-noa', full_name: 'נועה', phone: '972500000005', role: 'nutritionist' },
]

interface Profile {
  id: string
  name: string
  /** Program day today (can exceed 42 for a finished participant). */
  day: number
  coach: string
  missed?: number[]
  /** Nothing logged after this day. */
  stopAfter?: number
  todayLogged?: boolean
  attend: number
  /** Program days with a coach call. */
  calls: number[]
  weight?: [start: number, goal: number, perWeek: number]
  goalText?: string
  status?: Participant['status']
  consent?: boolean
}

const PROFILES: Profile[] = [
  { id: 'p-dana', name: 'דנה לוי', day: 23, coach: 'st-ron', missed: [4, 13], attend: 0.95, calls: [3, 10, 17], weight: [78, 72, 1.1], goalText: 'לרדת ל-72 ק"ג', consent: true },
  { id: 'p-yossi', name: 'יוסי כהן', day: 38, coach: 'st-ron', missed: [9], stopAfter: 37, todayLogged: false, attend: 0.9, calls: [5, 12, 19, 26, 33], weight: [96, 89, 1.3], goalText: 'לרדת 7 ק"ג', consent: true },
  { id: 'p-maya', name: 'מאיה אברהם', day: 12, coach: 'st-michal', missed: [5], stopAfter: 8, attend: 0.8, calls: [4, 9], weight: [67, 63, 0.6] },
  { id: 'p-omer', name: 'עומר פרץ', day: 30, coach: 'st-ron', missed: [6, 15, 22], stopAfter: 28, attend: 0.9, calls: [2, 9, 16, 23, 28], weight: [88, 82, 1.2] },
  { id: 'p-noam', name: 'נועם ביטון', day: 18, coach: 'st-michal', missed: [11], attend: 0.3, calls: [3, 10, 15], weight: [102, 95, 1] },
  { id: 'p-shira', name: 'שירה מזרחי', day: 5, coach: 'st-ron', attend: 1, calls: [2], weight: [64, 60, 0.7], todayLogged: true },
  { id: 'p-alon', name: 'אלון דהן', day: 40, coach: 'st-michal', missed: [3, 17, 31], attend: 0.95, calls: [4, 11, 18, 25, 32, 38], weight: [84, 79, 0.9], consent: true },
  { id: 'p-rotem', name: 'רותם אוחיון', day: 16, coach: 'st-ron', missed: [7], attend: 0.95, calls: [5], weight: [71, 67, 0.6] },
  { id: 'p-tal', name: 'טל גבאי', day: 27, coach: 'st-michal', missed: [8, 20], attend: 0.72, calls: [6, 13, 20, 24], weight: [90, 85, 0.8] },
  { id: 'p-lior', name: 'ליאור חדד', day: 2, coach: 'st-ron', attend: 1, calls: [], weight: [75, 70, 0.8], todayLogged: false },
  { id: 'p-adi', name: 'עדי שטרן', day: 50, coach: 'st-michal', missed: [10, 24], attend: 0.9, calls: [3, 10, 17, 24, 31, 38], weight: [70, 65, 0.9], status: 'completed', consent: true },
  { id: 'p-gil', name: 'גיל רוזן', day: 15, coach: 'st-ron', missed: [2], attend: 0.9, calls: [6, 12], weight: [81, 77, 0.7], todayLogged: true },
]

/** Deterministic pseudo-random in [0, 1), so the demo is stable across reloads. */
function rand(seed: string, n: number): number {
  let h = 2166136261
  for (const ch of seed + ':' + n) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

const WORKOUT_DAYS = [0, 2, 4] // Sun, Tue, Thu

export function seedDemo(today = todayIL()): DemoStore {
  const phones = new Map(PROFILES.map((p, i) => [p.id, `97250100${String(i + 10).padStart(4, '0')}`]))
  const participants: Participant[] = []
  const goals: Goal[] = []
  const logs: DemoStore['logs'] = []
  const calls: CoachCall[] = []
  const milestones: DemoStore['milestones'] = []

  for (const p of PROFILES) {
    const start = addDays(today, -(p.day - 1))
    participants.push({
      id: p.id,
      full_name: p.name,
      phone: phones.get(p.id)!,
      email: null,
      start_date: start,
      end_date: addDays(start, PROGRAM_DAYS - 1),
      price: 2500,
      coach_id: p.coach,
      nutritionist_id: 'st-noa',
      status: p.status ?? 'active',
      marketing_consent: !!p.consent,
      call_weekday: p.id === 'p-dana' ? 0 : p.id === 'p-yossi' ? weekday(today) : null,
      call_time: p.id === 'p-dana' ? '10:00' : p.id === 'p-yossi' ? '18:30' : null,
      created_at: `${start}T09:00:00Z`,
    })
    const [w0, wGoal, perWeek] = p.weight ?? [80, 75, 0.8]
    goals.push({
      participant_id: p.id,
      goal_type: 'weight',
      goal_text: p.goalText ?? `להגיע ל-${wGoal} ק"ג`,
      goal_value: wGoal,
      start_weight: w0,
      start_body_fat: null,
      start_measurements: null,
      set_at: start,
      achieved: p.status === 'completed' ? true : null,
    })

    const last = addDays(start, Math.min(p.day, PROGRAM_DAYS) - 1)
    rangeDays(start, last).forEach((d, i) => {
      const n = i + 1
      const isToday = d === today
      const stopped = p.stopAfter != null && n > p.stopAfter
      const nutrition = !stopped && !(p.missed ?? []).includes(n) && (!isToday || p.todayLogged === true)
      const workout = !stopped && WORKOUT_DAYS.includes(weekday(d)) && !isToday && rand(p.id, n) < p.attend
      const measure = !stopped && n % 7 === 0 && !isToday
      const weight = measure ? Math.round((w0 - (perWeek * n) / 7 + (rand(p.id, -n) - 0.5) * 0.6) * 10) / 10 : null
      if (nutrition || workout || measure)
        logs.push({
          participant_id: p.id,
          log_date: d,
          nutrition_logged: nutrition,
          workout_attended: workout,
          measurement_logged: measure,
          weight,
          workout_confirmed_by: workout && n < p.day - 2 ? p.coach : null,
        })
    })
    p.calls.forEach((n, i) =>
      calls.push({
        id: `call-${p.id}-${i}`,
        participant_id: p.id,
        staff_id: p.coach,
        call_date: addDays(start, n - 1),
        summary: i % 2 ? 'שבוע טוב, קצת עומס בעבודה. סיכמנו על אימון בוקר.' : 'מרגיש/ה טוב, מרוצה מהתפריט.',
        risk_flag: false,
      }),
    )
  }

  // Milestones that were earned before the demo "today" are already seen,
  // except Yossi's reward, which is waiting for the win screen.
  for (const p of participants) {
    const ls = logs.filter((l) => l.participant_id === p.id)
    const n = ls.filter((l) => l.nutrition_logged).length
    const w = ls.filter((l) => l.workout_attended).length
    const kinds: Milestone['kind'][] = []
    if (w >= 1) kinds.push('first_workout')
    if (n >= 7) kinds.push('week_1')
    if (n >= 18) kinds.push('halfway')
    if (w >= 10) kinds.push('ten_workouts')
    if (n >= 36) kinds.push('reward_earned')
    for (const kind of kinds)
      milestones.push({
        participant_id: p.id,
        kind,
        earned_at: `${p.start_date}T10:00:00Z`,
        seen_at: p.id === 'p-yossi' && kind === 'reward_earned' ? null : `${p.start_date}T10:00:00Z`,
      })
  }

  const schedule: ScheduleSlot[] = [
    { id: 'slot-sun', weekday: 0, start_time: '19:00', coach_id: 'st-ron', title: 'אימון קבוצתי', active: true },
    { id: 'slot-tue', weekday: 2, start_time: '19:00', coach_id: 'st-michal', title: 'אימון קבוצתי', active: true },
    { id: 'slot-thu', weekday: 4, start_time: '07:00', coach_id: 'st-ron', title: 'אימון בוקר', active: true },
  ]

  const deals: Deal[] = participants.slice(0, 3).map((p, i) => ({
    participant_id: p.id,
    id_number: `0${31234567 + i}`,
    signed_at: `${p.start_date.split('-').reverse().join('/')} 18:30`,
    birth_date: null,
    address: null,
    payment: i === 1 ? 'אשראי · 3 תשלומים' : 'אשראי · תשלום אחד',
    price: p.price,
    photo_consent: p.marketing_consent,
    needs_medical: i === 2,
    is_minor: false,
    parent_name: null,
    parent_id: null,
    parent_phone: null,
    agreement_url: null,
  }))

  return { staff: DEMO_STAFF.map((s) => ({ ...s })), participants, goals, logs, calls, milestones, schedule, deals, notifications: [] }
}

/** Who can be picked on the demo login screen. */
export const DEMO_PERSONAS = [
  { id: 'p-dana', label: 'דנה', hint: 'משתתפת · יום 23' },
  { id: 'p-yossi', label: 'יוסי', hint: 'משתתף · רגע הזכייה' },
  { id: 'st-ron', label: 'רון', hint: 'מאמן' },
  { id: 'st-noa', label: 'נועה', hint: 'תזונאית' },
  { id: 'st-aviv', label: 'אביב', hint: 'admin' },
]
