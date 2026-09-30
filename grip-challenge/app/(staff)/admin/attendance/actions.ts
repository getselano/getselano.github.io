'use server'
import ExcelJS from 'exceljs'
import { revalidatePath } from 'next/cache'
import { planAttendanceImport, type ImportPlan } from '@/lib/attendance-import'
import { parseAttendanceReport } from '@/lib/boostapp-report'
import { requireRole, userRepo } from '@/lib/data'

export type ImportState = { error?: string; plan?: ImportPlan; applied?: boolean; fileName?: string } | null

const MAX_BYTES = 4 * 1024 * 1024

async function readRows(file: File): Promise<string[][]> {
  const buf = Buffer.from(await file.arrayBuffer())
  if (/\.csv$/i.test(file.name)) {
    return buf.toString('utf8').replace(/^﻿/, '').split(/\r?\n/).map((line) => line.split(',').map((c) => c.replace(/^"|"$/g, '')))
  }
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buf as unknown as ArrayBuffer)
  const ws = wb.worksheets[0]
  const rows: string[][] = []
  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = []
    row.eachCell({ includeEmpty: true }, (cell, i) => {
      cells[i - 1] = cell.text ?? ''
    })
    rows.push(Array.from(cells, (c) => c ?? ''))
  })
  return rows
}

/**
 * Upload Boostapp's attendance report. "preview" shows what would change;
 * "apply" writes it: attended days become confirmed workouts, and (if chosen)
 * self-marked days the report does not back are removed.
 */
export async function importAttendanceAction(_: ImportState, form: FormData): Promise<ImportState> {
  await requireRole('admin')
  const file = form.get('file')
  if (!(file instanceof File) || !file.size) return { error: 'צריך לבחור קובץ' }
  if (file.size > MAX_BYTES) return { error: 'הקובץ גדול מדי (עד 4MB). אפשר לייצא טווח תאריכים קצר יותר.' }
  let plan: ImportPlan
  try {
    const report = parseAttendanceReport(await readRows(file))
    const repo = await userRepo()
    plan = planAttendanceImport(report, await repo.bundles(), { removeUnconfirmed: form.get('remove') === 'on' })
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'לא הצלחנו לקרוא את הקובץ' }
  }
  if (form.get('mode') !== 'apply') return { plan, fileName: file.name }

  const repo = await userRepo()
  for (const a of plan.add) {
    await repo.saveLog(a.participantId, a.date, { workout_attended: true })
    await repo.confirmWorkout(a.participantId, a.date, true)
  }
  for (const r of plan.remove) await repo.confirmWorkout(r.participantId, r.date, false)
  revalidatePath('/', 'layout')
  return { plan, applied: true, fileName: file.name }
}
