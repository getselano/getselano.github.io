import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { addDays, todayIL } from '../dates'
import { normalizePhone } from '../phone'
import { PRICE_DEFAULT, PROGRAM_DAYS } from '../program'
import { serviceClient, userClient } from '../supabase/server'
import type { CoachCall, DailyLog, Deal, Goal, Milestone, Participant, ParticipantBundle, ScheduleSlot, Staff } from '../types'
import type { ServiceRepo, SignupInput, UserRepo, Viewer } from './repo'

function must<T>(r: { data: unknown; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message)
  return r.data as T
}

const LOG_COLS = 'participant_id, log_date, nutrition_logged, workout_attended, measurement_logged, weight, note, workout_confirmed_by'

/** Loads bundles for the given participants in four queries, whatever the count. */
async function loadBundles(db: SupabaseClient, participants: Participant[], withCalls: boolean): Promise<ParticipantBundle[]> {
  if (!participants.length) return []
  const ids = participants.map((p) => p.id)
  const [goals, logs, calls, milestones] = await Promise.all([
    db.from('goals').select('*').in('participant_id', ids).then(must<Goal[]>),
    db.from('daily_logs').select(LOG_COLS).in('participant_id', ids).order('log_date').then(must<DailyLog[]>),
    withCalls
      ? db.from('coach_calls').select('*').in('participant_id', ids).order('call_date').then(must<CoachCall[]>)
      : Promise.resolve([] as CoachCall[]),
    db.from('milestones').select('participant_id, kind, earned_at, seen_at').in('participant_id', ids).then(must<(Milestone & { participant_id: string })[]>),
  ])
  return participants.map((p) => ({
    participant: p,
    goal: goals.find((g) => g.participant_id === p.id) ?? null,
    logs: logs.filter((l) => l.participant_id === p.id).map(numericWeight),
    calls: calls.filter((c) => c.participant_id === p.id),
    milestones: milestones.filter((m) => m.participant_id === p.id),
  }))
}

function numericWeight(l: DailyLog): DailyLog {
  return { ...l, weight: l.weight == null ? null : Number(l.weight) }
}

export class SupabaseUserRepo implements UserRepo {
  private cachedViewer: Viewer | null | undefined

  private constructor(private readonly db: SupabaseClient) {}

  static async create() {
    return new SupabaseUserRepo(await userClient())
  }

  async viewer(): Promise<Viewer | null> {
    if (this.cachedViewer !== undefined) return this.cachedViewer
    const { data } = await this.db.auth.getUser()
    const phone = data.user?.phone ? normalizePhone(data.user.phone) : null
    let v: Viewer | null = null
    if (phone) {
      const staff = await this.db.from('staff').select('*').eq('phone', phone).maybeSingle()
      if (staff.data) v = { role: staff.data.role, staff: staff.data }
      else {
        const p = await this.db.from('participants').select('*').eq('phone', phone).maybeSingle()
        if (p.data) v = { role: 'participant', participant: p.data }
      }
    }
    this.cachedViewer = v
    return v
  }

  async signOut() {
    await this.db.auth.signOut()
  }

  private async isStaff() {
    const v = await this.viewer()
    return !!v && v.role !== 'participant'
  }

  async bundle(participantId: string) {
    const p = await this.db.from('participants').select('*').eq('id', participantId).maybeSingle()
    if (!p.data) return null
    const staff = await this.isStaff()
    const [b] = await loadBundles(this.db, [p.data], staff)
    if (!staff) {
      // Participants cannot read coach_calls; they get the dates only.
      const dates = must<string[]>(await this.db.rpc('my_call_dates'))
      b.calls = dates.map((call_date) => ({ participant_id: p.data.id, staff_id: '', call_date, summary: null, risk_flag: false }))
    }
    return b
  }

  async bundles() {
    // RLS scopes this to the viewer's assignments (admin: everyone).
    const ps = must(await this.db.from('participants').select('*').order('start_date', { ascending: false }))
    return loadBundles(this.db, ps as Participant[], await this.isStaff())
  }

  async staff() {
    return must(await this.db.from('staff').select('id, full_name, phone, role').order('full_name')) as Staff[]
  }

  async schedule() {
    const rows = must(await this.db.from('schedule_slots').select('*').order('weekday').order('start_time')) as ScheduleSlot[]
    return rows.map((s) => ({ ...s, start_time: s.start_time.slice(0, 5) }))
  }

  async deal(participantId: string) {
    const r = await this.db.from('participant_deals').select('*').eq('participant_id', participantId).maybeSingle()
    return (r.data as Deal | null) ?? null
  }

  async markToday(field: string, value: boolean, weight?: number | null) {
    must(await this.db.rpc('mark_today', { field, value, weight_kg: weight ?? null }))
  }

  async markMilestoneSeen(kind: string) {
    must(await this.db.rpc('mark_milestone_seen', { milestone_kind: kind }))
  }

  async logCall(call: Omit<CoachCall, 'id' | 'staff_id'>) {
    const v = await this.viewer()
    if (!v || v.role === 'participant') throw new Error('not staff')
    must(await this.db.from('coach_calls').insert({ ...call, staff_id: v.staff.id }))
  }

  async confirmWorkout(participantId: string, date: string, confirm: boolean) {
    const v = await this.viewer()
    if (!v || v.role === 'participant') throw new Error('not staff')
    const patch = confirm
      ? { workout_attended: true, workout_confirmed_by: v.staff.id, workout_confirmed_at: new Date().toISOString() }
      : { workout_attended: false, workout_confirmed_by: null, workout_confirmed_at: null }
    must(await this.db.from('daily_logs').update(patch).eq('participant_id', participantId).eq('log_date', date))
  }

  async saveGoal(goal: Goal) {
    const { id: _id, ...row } = goal
    must(await this.db.from('goals').upsert(row, { onConflict: 'participant_id' }))
  }

  async saveParticipant(input: Parameters<UserRepo['saveParticipant']>[0], id?: string) {
    const row = { ...input, end_date: addDays(input.start_date, PROGRAM_DAYS - 1) }
    if (id) {
      must(await this.db.from('participants').update(row).eq('id', id))
      return id
    }
    const created = must(await this.db.from('participants').insert(row).select('id').single()) as { id: string }
    return created.id
  }

  async saveLog(participantId: string, date: string, patch: Parameters<UserRepo['saveLog']>[2]) {
    must(
      await this.db
        .from('daily_logs')
        .upsert({ participant_id: participantId, log_date: date, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'participant_id,log_date' }),
    )
  }

  async saveStaff(input: Omit<Staff, 'id'>, id?: string) {
    if (id) must(await this.db.from('staff').update(input).eq('id', id))
    else must(await this.db.from('staff').insert(input))
  }

  async deleteStaff(id: string) {
    must(await this.db.from('staff').delete().eq('id', id))
  }

  async saveSlot(input: Omit<ScheduleSlot, 'id'>, id?: string) {
    if (id) must(await this.db.from('schedule_slots').update(input).eq('id', id))
    else must(await this.db.from('schedule_slots').insert(input))
  }

  async deleteSlot(id: string) {
    must(await this.db.from('schedule_slots').delete().eq('id', id))
  }
}

export class SupabaseServiceRepo implements ServiceRepo {
  private readonly db = serviceClient()

  async isRegisteredPhone(phone: string) {
    const [s, p] = await Promise.all([
      this.db.from('staff').select('id').eq('phone', phone).maybeSingle(),
      this.db.from('participants').select('id').eq('phone', phone).neq('status', 'cancelled').maybeSingle(),
    ])
    return !!(s.data || p.data)
  }

  async allBundles() {
    const ps = must(await this.db.from('participants').select('*')) as Participant[]
    return loadBundles(this.db, ps, true)
  }

  async staff() {
    return must(await this.db.from('staff').select('id, full_name, phone, role')) as Staff[]
  }

  async addMilestones(participantId: string, kinds: string[]) {
    if (!kinds.length) return
    must(
      await this.db
        .from('milestones')
        .upsert(kinds.map((kind) => ({ participant_id: participantId, kind })), { onConflict: 'participant_id,kind', ignoreDuplicates: true }),
    )
  }

  async recordSignup(input: SignupInput) {
    const existing = await this.db.from('participants').select('id').eq('phone', input.phone).maybeSingle()
    let id: string
    let created = false
    if (existing.data) {
      id = existing.data.id as string
      const patch: Record<string, unknown> = { full_name: input.full_name }
      if (input.email) patch.email = input.email
      if (input.price) patch.price = input.price
      if (input.marketing_consent != null) patch.marketing_consent = input.marketing_consent
      if (input.start_date) {
        // Move the start only while nothing has been logged yet.
        const logs = await this.db.from('daily_logs').select('id', { count: 'exact', head: true }).eq('participant_id', id)
        if (!logs.count) Object.assign(patch, { start_date: input.start_date, end_date: addDays(input.start_date, PROGRAM_DAYS - 1) })
      }
      must(await this.db.from('participants').update(patch).eq('id', id))
    } else {
      const start = input.start_date || todayIL()
      const row = {
        full_name: input.full_name,
        phone: input.phone,
        email: input.email,
        start_date: start,
        end_date: addDays(start, PROGRAM_DAYS - 1),
        price: input.price ?? PRICE_DEFAULT,
        marketing_consent: input.marketing_consent ?? false,
        status: 'active',
      }
      id = (must(await this.db.from('participants').insert(row).select('id').single()) as { id: string }).id
      created = true
    }
    must(
      await this.db
        .from('participant_deals')
        .upsert({ ...input.deal, participant_id: id, updated_at: new Date().toISOString() }, { onConflict: 'participant_id' }),
    )
    return { id, created }
  }

  async autoAssign(participantId: string) {
    const [p, staff] = await Promise.all([
      this.db.from('participants').select('coach_id, nutritionist_id').eq('id', participantId).single().then(must<{ coach_id: string | null; nutritionist_id: string | null }>),
      this.staff(),
    ])
    const only = (role: Staff['role']) => {
      const list = staff.filter((x) => x.role === role)
      return list.length === 1 ? list[0] : null
    }
    const patch: Record<string, string> = {}
    if (!p.coach_id && only('coach')) patch.coach_id = only('coach')!.id
    if (!p.nutritionist_id && only('nutritionist')) patch.nutritionist_id = only('nutritionist')!.id
    if (Object.keys(patch).length) must(await this.db.from('participants').update(patch).eq('id', participantId))
    const coachId = patch.coach_id ?? p.coach_id
    const nutriId = patch.nutritionist_id ?? p.nutritionist_id
    return { coach: staff.find((x) => x.id === coachId) ?? null, nutritionist: staff.find((x) => x.id === nutriId) ?? null }
  }

  async claimNotification(kind: string, recipient: string, day: string) {
    const r = await this.db.from('notifications_log').insert({ kind, recipient, sent_on: day, status: 'sending' })
    if (r.error?.code === '23505') return false
    if (r.error) throw new Error(r.error.message)
    return true
  }

  async finishNotification(kind: string, recipient: string, day: string, status: string, detail?: string) {
    must(await this.db.from('notifications_log').update({ status, detail: detail ?? null }).match({ kind, recipient, sent_on: day }))
  }
}
