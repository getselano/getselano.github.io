import type { ISODate } from '../dates'
import type {
  CoachCall,
  Deal,
  DailyLog,
  Goal,
  MilestoneKind,
  Participant,
  ParticipantBundle,
  ScheduleSlot,
  Staff,
  StaffRole,
} from '../types'

export type Viewer =
  | { role: 'participant'; participant: Participant }
  | { role: StaffRole; staff: Staff }

export type MarkField = 'nutrition_logged' | 'workout_attended' | 'measurement_logged'

export type ParticipantInput = Pick<
  Participant,
  'full_name' | 'phone' | 'email' | 'start_date' | 'price' | 'coach_id' | 'nutritionist_id' | 'status' | 'marketing_consent'
>

export type LogPatch = Partial<Pick<DailyLog, 'nutrition_logged' | 'workout_attended' | 'measurement_logged' | 'weight' | 'note'>>

/**
 * Data access as the signed-in user. The Supabase implementation runs every
 * call through RLS; the demo implementation enforces the same scoping.
 */
export interface UserRepo {
  viewer(): Promise<Viewer | null>
  signOut(): Promise<void>

  /** One participant's data, if the viewer may see it. */
  bundle(participantId: string): Promise<ParticipantBundle | null>
  /** Participants the viewer is assigned to (admin: all). */
  bundles(): Promise<ParticipantBundle[]>
  /** The current (not superseded) goal. */
  currentGoal(participantId: string): Promise<Goal | null>
  staff(): Promise<Staff[]>
  schedule(): Promise<ScheduleSlot[]>
  /** Deal details from the signing system (admin only; null for everyone else). */
  deal(participantId: string): Promise<Deal | null>

  // participant
  markToday(field: MarkField, value: boolean, weight?: number | null): Promise<void>
  markMilestoneSeen(kind: MilestoneKind): Promise<void>

  // staff
  logCall(call: Omit<CoachCall, 'id' | 'staff_id'>): Promise<void>
  confirmWorkout(participantId: string, date: ISODate, confirm: boolean): Promise<void>
  /** Through save_goal(): edits an unconfirmed goal, versions a confirmed one. */
  saveGoal(goal: Goal): Promise<void>
  /** Every version of the participant's goal, newest first. */
  goalHistory(participantId: string): Promise<Goal[]>
  /** Fixed weekly call slot with the mental coach; null clears it. */
  setCallSlot(participantId: string, weekday: number | null, time: string | null): Promise<void>

  // admin
  saveParticipant(input: ParticipantInput, id?: string): Promise<string>
  saveLog(participantId: string, date: ISODate, patch: LogPatch): Promise<void>
  saveStaff(input: Omit<Staff, 'id'>, id?: string): Promise<void>
  deleteStaff(id: string): Promise<void>
  saveSlot(input: Omit<ScheduleSlot, 'id'>, id?: string): Promise<void>
  deleteSlot(id: string): Promise<void>
}

/** Data access with no user behind it: webhooks, cron, the milestone engine. */
export interface ServiceRepo {
  isRegisteredPhone(phone: string): Promise<boolean>
  allBundles(): Promise<ParticipantBundle[]>
  staff(): Promise<Staff[]>
  addMilestones(participantId: string, kinds: MilestoneKind[]): Promise<void>
  /**
   * A signed agreement → a participant (matched by phone, never duplicated)
   * plus their deal details. The start date only moves while nothing has
   * been logged yet.
   */
  recordSignup(input: SignupInput): Promise<{ id: string; created: boolean }>
  /**
   * Fills an empty coach / nutritionist slot when the team has exactly one
   * person in that role. Returns who is assigned afterwards.
   */
  autoAssign(participantId: string): Promise<{ coach: Staff | null; nutritionist: Staff | null }>
  /** Records a send; false if this (kind, recipient, day) was already sent. */
  claimNotification(kind: string, recipient: string, day: ISODate): Promise<boolean>
  finishNotification(kind: string, recipient: string, day: ISODate, status: string, detail?: string): Promise<void>
  /** The participant's "this is my goal", with the IP the server saw. False if nothing was waiting. */
  confirmGoal(participantId: string, ip: string | null): Promise<boolean>
  /**
   * A goal signed in the signing form. Matches the participant by phone
   * (creating them if needed). The same phone + signedAt twice → the first
   * goal, untouched.
   */
  intakeGoal(input: GoalIntake): Promise<{ participantId: string; goalId: string; duplicate: boolean; createdParticipant: boolean }>
  logGoalIntake(entry: GoalIntakeLog): Promise<void>
}

export interface GoalIntake {
  phone: string
  full_name: string
  email: string | null
  start_date: ISODate | null
  /** ISO 8601, normalized. Also the confirmation time: the signature is the confirmation. */
  signed_at: string
  pdf_url: string | null
  goal: Pick<Goal, 'goal_type' | 'goal_text' | 'goal_why' | 'start_weight' | 'start_body_fat' | 'start_measurements'>
  details: Record<string, string | null>
}

export interface GoalIntakeLog {
  status: number
  outcome: 'recorded' | 'duplicate' | 'bad_secret' | 'bad_json' | 'invalid' | 'error'
  ip: string | null
  phone?: string | null
  signed_at?: string | null
  participant_id?: string | null
  goal_id?: string | null
  detail?: string | null
  payload?: unknown
}

export interface SignupInput {
  full_name: string
  phone: string
  email: string | null
  start_date?: ISODate
  price?: number
  marketing_consent?: boolean | null
  deal: Omit<Deal, 'participant_id'>
}
