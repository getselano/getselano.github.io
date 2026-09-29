import 'server-only'
import { cookies } from 'next/headers'
import { addDays, todayIL } from '../dates'
import { PRICE_DEFAULT, PROGRAM_DAYS } from '../program'
import type { Participant, ParticipantBundle, Staff } from '../types'
import { seedDemo, type DemoStore } from './demo-seed'
import type { ServiceRepo, SignupInput, UserRepo, Viewer } from './repo'

export const DEMO_COOKIE = 'grip_demo_as'

// One store per server process, kept across hot reloads. Reseeded each new day.
const g = globalThis as unknown as { __gripDemo?: { day: string; store: DemoStore } }
function store(): DemoStore {
  const day = todayIL()
  if (!g.__gripDemo || g.__gripDemo.day !== day) g.__gripDemo = { day, store: seedDemo(day) }
  return g.__gripDemo.store
}

let seq = 0
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`

function bundleOf(s: DemoStore, p: Participant, withCalls: boolean): ParticipantBundle {
  return {
    participant: p,
    goal: s.goals.find((x) => x.participant_id === p.id) ?? null,
    logs: s.logs.filter((l) => l.participant_id === p.id).sort((a, b) => (a.log_date < b.log_date ? -1 : 1)),
    // Participants see their call dates only, like my_call_dates() in the migration.
    calls: s.calls
      .filter((c) => c.participant_id === p.id)
      .map((c) => (withCalls ? c : { ...c, staff_id: '', summary: null, risk_flag: false })),
    milestones: s.milestones.filter((m) => m.participant_id === p.id),
  }
}

/** Mirrors the RLS rules in the migration. */
export class DemoUserRepo implements UserRepo {
  private constructor(private readonly as: string | undefined) {}

  static async create() {
    return new DemoUserRepo((await cookies()).get(DEMO_COOKIE)?.value)
  }

  async viewer(): Promise<Viewer | null> {
    const s = store()
    const staff = s.staff.find((x) => x.id === this.as)
    if (staff) return { role: staff.role, staff }
    const p = s.participants.find((x) => x.id === this.as)
    return p ? { role: 'participant', participant: p } : null
  }

  async signOut() {
    ;(await cookies()).delete(DEMO_COOKIE)
  }

  private async canSee(p: Participant) {
    const v = await this.viewer()
    if (!v) return false
    if (v.role === 'participant') return v.participant.id === p.id
    return v.role === 'admin' || v.staff.id === p.coach_id || v.staff.id === p.nutritionist_id
  }

  private async requireStaffFor(participantId: string): Promise<Staff> {
    const v = await this.viewer()
    const p = store().participants.find((x) => x.id === participantId)
    if (!v || v.role === 'participant' || !p || !(await this.canSee(p))) throw new Error('forbidden')
    return v.staff
  }

  private async requireAdmin() {
    const v = await this.viewer()
    if (v?.role !== 'admin') throw new Error('forbidden')
  }

  async bundle(participantId: string) {
    const s = store()
    const p = s.participants.find((x) => x.id === participantId)
    if (!p || !(await this.canSee(p))) return null
    return bundleOf(s, p, (await this.viewer())?.role !== 'participant')
  }

  async bundles() {
    const s = store()
    const out: ParticipantBundle[] = []
    const staffView = (await this.viewer())?.role !== 'participant'
    for (const p of s.participants) if (await this.canSee(p)) out.push(bundleOf(s, p, staffView))
    return out.sort((a, b) => (a.participant.start_date < b.participant.start_date ? 1 : -1))
  }

  async staff() {
    return (await this.viewer()) ? store().staff : []
  }

  async schedule() {
    return (await this.viewer()) ? [...store().schedule].sort((a, b) => a.weekday - b.weekday || (a.start_time < b.start_time ? -1 : 1)) : []
  }

  async deal(participantId: string) {
    if ((await this.viewer())?.role !== 'admin') return null
    return store().deals.find((d) => d.participant_id === participantId) ?? null
  }

  async markToday(field: 'nutrition_logged' | 'workout_attended' | 'measurement_logged', value: boolean, weight?: number | null) {
    const v = await this.viewer()
    if (v?.role !== 'participant') throw new Error('not a participant')
    const p = v.participant
    const today = todayIL()
    if (p.status !== 'active' || today < p.start_date || today > p.end_date) throw new Error('outside the program')
    const s = store()
    let row = s.logs.find((l) => l.participant_id === p.id && l.log_date === today)
    if (!row) {
      row = { participant_id: p.id, log_date: today, nutrition_logged: false, workout_attended: false, measurement_logged: false, weight: null }
      s.logs.push(row)
    }
    row[field] = value
    if (field === 'measurement_logged') row.weight = value ? (weight ?? row.weight) : null
    if (field === 'workout_attended' && !value) row.workout_confirmed_by = null
  }

  async markMilestoneSeen(kind: string) {
    const v = await this.viewer()
    if (v?.role !== 'participant') return
    const m = store().milestones.find((x) => x.participant_id === v.participant.id && x.kind === kind)
    if (m && !m.seen_at) m.seen_at = new Date().toISOString()
  }

  async logCall(call: Parameters<UserRepo['logCall']>[0]) {
    const staff = await this.requireStaffFor(call.participant_id)
    store().calls.push({ ...call, id: newId('call'), staff_id: staff.id })
  }

  async confirmWorkout(participantId: string, date: string, confirm: boolean) {
    const staff = await this.requireStaffFor(participantId)
    const row = store().logs.find((l) => l.participant_id === participantId && l.log_date === date)
    if (!row) return
    row.workout_attended = confirm
    row.workout_confirmed_by = confirm ? staff.id : null
  }

  async saveGoal(goal: Parameters<UserRepo['saveGoal']>[0]) {
    await this.requireStaffFor(goal.participant_id)
    const s = store()
    s.goals = s.goals.filter((x) => x.participant_id !== goal.participant_id)
    s.goals.push(goal)
  }

  async saveParticipant(input: Parameters<UserRepo['saveParticipant']>[0], id?: string) {
    await this.requireAdmin()
    const s = store()
    if (s.participants.some((p) => p.phone === input.phone && p.id !== id)) throw new Error('duplicate key value violates unique constraint "participants_phone_key"')
    const end_date = addDays(input.start_date, PROGRAM_DAYS - 1)
    if (id) {
      const p = s.participants.find((x) => x.id === id)
      if (!p) throw new Error('not found')
      Object.assign(p, input, { end_date })
      return id
    }
    const pid = newId('p')
    s.participants.push({ ...input, id: pid, end_date, created_at: new Date().toISOString() })
    return pid
  }

  async saveLog(participantId: string, date: string, patch: Parameters<UserRepo['saveLog']>[2]) {
    await this.requireStaffFor(participantId)
    const s = store()
    let row = s.logs.find((l) => l.participant_id === participantId && l.log_date === date)
    if (!row) {
      row = { participant_id: participantId, log_date: date, nutrition_logged: false, workout_attended: false, measurement_logged: false, weight: null }
      s.logs.push(row)
    }
    Object.assign(row, patch)
  }

  async saveStaff(input: Omit<Staff, 'id'>, id?: string) {
    await this.requireAdmin()
    const s = store()
    if (s.staff.some((x) => x.phone === input.phone && x.id !== id)) throw new Error('duplicate key value violates unique constraint "staff_phone_key"')
    if (id) Object.assign(s.staff.find((x) => x.id === id) ?? {}, input)
    else s.staff.push({ ...input, id: newId('st') })
  }

  async deleteStaff(id: string) {
    await this.requireAdmin()
    const s = store()
    s.staff = s.staff.filter((x) => x.id !== id)
    for (const p of s.participants) {
      if (p.coach_id === id) p.coach_id = null
      if (p.nutritionist_id === id) p.nutritionist_id = null
    }
  }

  async saveSlot(input: Parameters<UserRepo['saveSlot']>[0], id?: string) {
    await this.requireAdmin()
    const s = store()
    if (id) Object.assign(s.schedule.find((x) => x.id === id) ?? {}, input)
    else s.schedule.push({ ...input, id: newId('slot') })
  }

  async deleteSlot(id: string) {
    await this.requireAdmin()
    const s = store()
    s.schedule = s.schedule.filter((x) => x.id !== id)
  }
}

export class DemoServiceRepo implements ServiceRepo {
  async isRegisteredPhone(phone: string) {
    const s = store()
    return s.staff.some((x) => x.phone === phone) || s.participants.some((x) => x.phone === phone)
  }

  async allBundles() {
    const s = store()
    return s.participants.map((p) => bundleOf(s, p, true))
  }

  async staff() {
    return store().staff
  }

  async addMilestones(participantId: string, kinds: string[]) {
    const s = store()
    for (const kind of kinds)
      if (!s.milestones.some((m) => m.participant_id === participantId && m.kind === kind))
        s.milestones.push({ participant_id: participantId, kind: kind as never, earned_at: new Date().toISOString(), seen_at: null })
  }

  async recordSignup(input: SignupInput) {
    const s = store()
    let p = s.participants.find((x) => x.phone === input.phone)
    let created = false
    if (p) {
      p.full_name = input.full_name
      if (input.email) p.email = input.email
      if (input.price) p.price = input.price
      if (input.marketing_consent != null) p.marketing_consent = input.marketing_consent
      if (input.start_date && !s.logs.some((l) => l.participant_id === p!.id))
        Object.assign(p, { start_date: input.start_date, end_date: addDays(input.start_date, PROGRAM_DAYS - 1) })
    } else {
      const start = input.start_date || todayIL()
      p = {
        id: newId('p'),
        full_name: input.full_name,
        phone: input.phone,
        email: input.email,
        start_date: start,
        end_date: addDays(start, PROGRAM_DAYS - 1),
        price: input.price ?? PRICE_DEFAULT,
        coach_id: null,
        nutritionist_id: null,
        status: 'active',
        marketing_consent: input.marketing_consent ?? false,
        created_at: new Date().toISOString(),
      }
      s.participants.push(p)
      created = true
    }
    s.deals = s.deals.filter((d) => d.participant_id !== p!.id)
    s.deals.push({ ...input.deal, participant_id: p.id })
    return { id: p.id, created }
  }

  async autoAssign(participantId: string) {
    const s = store()
    const p = s.participants.find((x) => x.id === participantId)
    if (!p) return { coach: null, nutritionist: null }
    const only = (role: Staff['role']) => {
      const list = s.staff.filter((x) => x.role === role)
      return list.length === 1 ? list[0] : null
    }
    if (!p.coach_id) p.coach_id = only('coach')?.id ?? null
    if (!p.nutritionist_id) p.nutritionist_id = only('nutritionist')?.id ?? null
    return { coach: s.staff.find((x) => x.id === p.coach_id) ?? null, nutritionist: s.staff.find((x) => x.id === p.nutritionist_id) ?? null }
  }

  async claimNotification(kind: string, recipient: string, day: string) {
    const s = store()
    if (s.notifications.some((n) => n.kind === kind && n.recipient === recipient && n.sent_on === day)) return false
    s.notifications.push({ kind, recipient, sent_on: day, status: 'sending' })
    return true
  }

  async finishNotification(kind: string, recipient: string, day: string, status: string, detail?: string) {
    const n = store().notifications.find((x) => x.kind === kind && x.recipient === recipient && x.sent_on === day)
    if (n) Object.assign(n, { status, detail })
  }
}
