// Plans what a Boostapp attendance report changes in the challenge data.
// Pure: the admin action applies the plan. Only challenge participants are
// touched; every other gym member in the report is skipped and not stored.
import type { ParsedReport } from './boostapp-report'
import { programEnd } from './calc'
import type { ISODate } from './dates'
import type { ParticipantBundle } from './types'

export interface ImportPlan {
  from: ISODate | null
  to: ISODate | null
  /** Days to mark as attended (from the report). */
  add: { participantId: string; name: string; date: ISODate }[]
  /** Days the participant marked themselves but the report shows no attendance. */
  remove: { participantId: string; name: string; date: ISODate }[]
  /** Challenge participants found in the report. */
  matched: number
  /** Report rows of people who are not in the challenge (skipped). */
  otherRows: number
  /** Active participants inside the report's dates who do not appear in it (phone mismatch?). */
  notFound: { participantId: string; name: string }[]
}

export function planAttendanceImport(report: ParsedReport, bundles: ParticipantBundle[], opts: { removeUnconfirmed: boolean }): ImportPlan {
  const byPhone = new Map(bundles.filter((b) => b.participant.status !== 'cancelled').map((b) => [b.participant.phone, b]))
  const attendedDays = new Map<string, Set<ISODate>>() // participant id → days
  let otherRows = 0
  for (const v of report.visits) {
    const b = v.phone ? byPhone.get(v.phone) : undefined
    if (!b) {
      otherRows++
      continue
    }
    if (!attendedDays.has(b.participant.id)) attendedDays.set(b.participant.id, new Set())
    const p = b.participant
    if (v.attended && v.date >= p.start_date && v.date <= programEnd(p.start_date)) attendedDays.get(b.participant.id)!.add(v.date)
  }

  const add: ImportPlan['add'] = []
  const remove: ImportPlan['remove'] = []
  const notFound: ImportPlan['notFound'] = []
  for (const b of byPhone.values()) {
    const p = b.participant
    const days = attendedDays.get(p.id)
    if (!days) {
      // Not in the report at all: never remove their marks on a guess.
      const overlaps = report.from && report.to && p.start_date <= report.to && programEnd(p.start_date) >= report.from
      if (p.status === 'active' && overlaps) notFound.push({ participantId: p.id, name: p.full_name })
      continue
    }
    const marked = new Set(b.logs.filter((l) => l.workout_attended).map((l) => l.log_date))
    for (const d of [...days].sort()) if (!marked.has(d)) add.push({ participantId: p.id, name: p.full_name, date: d })
    if (opts.removeUnconfirmed && report.from && report.to) {
      for (const l of b.logs) {
        const inRange = l.log_date >= report.from && l.log_date <= report.to
        if (inRange && l.workout_attended && !days.has(l.log_date)) remove.push({ participantId: p.id, name: p.full_name, date: l.log_date })
      }
    }
  }
  return { from: report.from, to: report.to, add, remove, matched: attendedDays.size, otherRows, notFound }
}
