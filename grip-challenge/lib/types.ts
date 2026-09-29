import type { ISODate } from './dates'

export type StaffRole = 'coach' | 'nutritionist' | 'admin'
export type Role = 'participant' | StaffRole
export type ParticipantStatus = 'active' | 'completed' | 'cancelled'
export type GoalType = 'weight' | 'body_fat' | 'measurements' | 'attendance' | 'other'
export type MilestoneKind = 'first_workout' | 'week_1' | 'halfway' | 'ten_workouts' | 'reward_earned'

export interface Staff {
  id: string
  full_name: string
  phone: string
  role: StaffRole
}

export interface Participant {
  id: string
  full_name: string
  phone: string
  email: string | null
  start_date: ISODate
  end_date: ISODate
  price: number
  nutritionist_id: string | null
  coach_id: string | null
  status: ParticipantStatus
  marketing_consent: boolean
  created_at: string
}

export interface Goal {
  id?: string
  participant_id: string
  goal_type: GoalType
  goal_text: string
  goal_value: number | null
  start_weight: number | null
  start_body_fat: number | null
  start_measurements: string | null
  set_at: ISODate | null
  achieved: boolean | null
}

export interface DailyLog {
  participant_id?: string
  log_date: ISODate
  nutrition_logged: boolean
  workout_attended: boolean
  measurement_logged: boolean
  weight: number | null
  note?: string | null
  workout_confirmed_by?: string | null
}

export interface CoachCall {
  id?: string
  participant_id: string
  staff_id: string
  call_date: ISODate
  summary: string | null
  risk_flag: boolean
}

export interface Milestone {
  kind: MilestoneKind
  earned_at: string
  seen_at: string | null
}

export interface ScheduleSlot {
  id: string
  weekday: number // 0 = Sunday
  start_time: string // 'HH:MM'
  coach_id: string | null
  title: string
  active: boolean
}

/** Everything the calculations need about one participant. */
export interface ParticipantBundle {
  participant: Participant
  goal: Goal | null
  logs: DailyLog[]
  calls: CoachCall[]
  milestones: Milestone[]
}

/** Deal details from the signing system. Admin-only. */
export interface Deal {
  participant_id: string
  id_number: string | null
  signed_at: string | null
  birth_date: string | null
  address: string | null
  payment: string | null
  price: number | null
  photo_consent: boolean | null
  needs_medical: boolean | null
  is_minor: boolean | null
  parent_name: string | null
  parent_id: string | null
  parent_phone: string | null
  agreement_url: string | null
}
