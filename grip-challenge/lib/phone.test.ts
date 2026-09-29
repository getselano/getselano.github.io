import { describe, expect, it } from 'vitest'
import { displayPhone, normalizePhone } from './phone'

describe('phone', () => {
  it('normalizes Israeli numbers in every common spelling', () => {
    for (const p of ['050-123-4567', '0501234567', '+972 50 123 4567', '972501234567', '00972501234567', '+972-050-1234567'])
      expect(normalizePhone(p)).toBe('972501234567')
  })
  it('rejects junk', () => {
    expect(normalizePhone('abc')).toBeNull()
    expect(normalizePhone('123')).toBeNull()
  })
  it('displays local format', () => {
    expect(displayPhone('972501234567')).toBe('050-123-4567')
  })
})
