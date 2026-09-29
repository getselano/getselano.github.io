import { describe, expect, it } from 'vitest'
import { parseBool, parseDate, parseNum } from './intake'

describe('intake parsing', () => {
  it('reads dates in the formats forms produce', () => {
    expect(parseDate('2026-10-04')).toBe('2026-10-04')
    expect(parseDate('04/10/2026')).toBe('2026-10-04')
    expect(parseDate('4.10.26')).toBe('2026-10-04')
    expect(parseDate('31/02/2026')).toBeNull()
    expect(parseDate('')).toBeNull()
  })
  it('reads numbers and yes/no', () => {
    expect(parseNum('82,5 ק"ג')).toBe(82.5)
    expect(parseNum('—')).toBeNull()
    expect(parseBool('yes')).toBe(true)
    expect(parseBool('לא מאשר')).toBe(false)
    expect(parseBool(undefined)).toBeNull()
  })
})
