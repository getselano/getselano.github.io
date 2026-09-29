import { addDays, weekday, type ISODate } from './dates'
import { TIME_ZONE } from './program'
import type { ScheduleSlot, Staff } from './types'

export interface NextWorkout {
  date: ISODate
  weekday: number
  time: string
  title: string
  coachName: string | null
  isToday: boolean
}

const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

/** 'HH:MM' now in Jerusalem. */
export function nowTimeIL(now = new Date()): string {
  return timeFmt.format(now)
}

export function hasWorkoutOn(slots: ScheduleSlot[], d: ISODate): boolean {
  const wd = weekday(d)
  return slots.some((s) => s.active && s.weekday === wd)
}

/** The next class from now, up to the last program day. */
export function nextWorkout(
  slots: ScheduleSlot[],
  staff: Pick<Staff, 'id' | 'full_name'>[],
  today: ISODate,
  until: ISODate,
  now = nowTimeIL(),
): NextWorkout | null {
  const active = slots.filter((s) => s.active)
  if (!active.length) return null
  for (let i = 0; i < 8; i++) {
    const d = addDays(today, i)
    if (d > until) return null
    const wd = weekday(d)
    const todays = active
      .filter((s) => s.weekday === wd && (i > 0 || s.start_time.slice(0, 5) > now))
      .sort((a, b) => (a.start_time < b.start_time ? -1 : 1))
    if (todays.length) {
      const s = todays[0]
      return {
        date: d,
        weekday: wd,
        time: s.start_time.slice(0, 5),
        title: s.title,
        coachName: staff.find((x) => x.id === s.coach_id)?.full_name ?? null,
        isToday: i === 0,
      }
    }
  }
  return null
}
