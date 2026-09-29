import { describe, expect, it } from 'vitest'
import { hasWorkoutOn, nextWorkout } from './schedule'
import type { ScheduleSlot } from './types'

const slots: ScheduleSlot[] = [
  { id: 'a', weekday: 0, start_time: '19:00', coach_id: 'c', title: 'ערב', active: true },
  { id: 'b', weekday: 2, start_time: '07:00', coach_id: 'c', title: 'בוקר', active: true },
  { id: 'x', weekday: 3, start_time: '07:00', coach_id: 'c', title: 'מבוטל', active: false },
]
const staff = [{ id: 'c', full_name: 'רון' }]

describe('schedule', () => {
  it('knows which days have a class', () => {
    expect(hasWorkoutOn(slots, '2026-09-27')).toBe(true) // Sunday
    expect(hasWorkoutOn(slots, '2026-09-30')).toBe(false) // Wednesday, slot inactive
  })
  it('finds the next class after now', () => {
    // Sunday 18:00 → tonight's class.
    expect(nextWorkout(slots, staff, '2026-09-27', '2026-12-31', '18:00')).toMatchObject({ date: '2026-09-27', time: '19:00', coachName: 'רון', isToday: true })
    // Sunday 20:00 → Tuesday morning.
    expect(nextWorkout(slots, staff, '2026-09-27', '2026-12-31', '20:00')).toMatchObject({ date: '2026-09-29', weekday: 2, isToday: false })
  })
  it('stops at the end of the program', () => {
    expect(nextWorkout(slots, staff, '2026-09-27', '2026-09-28', '20:00')).toBeNull()
  })
})
