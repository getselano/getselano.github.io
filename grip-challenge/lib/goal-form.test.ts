import { describe, expect, it } from 'vitest'
import { goalFormInvite, goalFormLink } from './goal-form'

describe('goalFormLink', () => {
  const p = { full_name: 'דנה לוי', phone: '972501234567' }
  it('opens the goal page with name and local phone', () => {
    const u = new URL(goalFormLink('https://script.google.com/macros/s/AKfy/exec', p)!)
    expect(u.pathname).toBe('/macros/s/AKfy/exec')
    expect(u.searchParams.get('page')).toBe('goal')
    expect(u.searchParams.get('name')).toBe('דנה לוי')
    expect(u.searchParams.get('phone')).toBe('0501234567')
  })
  it('keeps nothing from a stale ?page and needs a configured address', () => {
    expect(new URL(goalFormLink('https://x/exec?page=goal', p)!).searchParams.getAll('page')).toEqual(['goal'])
    expect(goalFormLink(undefined, p)).toBeNull()
    expect(goalFormLink('not a url', p)).toBeNull()
  })
  it('the invite carries the link', () => {
    expect(goalFormInvite('דנה', 'https://l')).toMatch(/^היי דנה,[\s\S]*https:\/\/l$/)
  })
})
