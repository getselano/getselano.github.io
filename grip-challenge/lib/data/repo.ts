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
  saveGoal(goal: Goal): Promise<void>

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
