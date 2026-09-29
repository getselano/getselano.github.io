import 'server-only'
import { timingSafeEqual } from 'node:crypto'

/** Constant-time check of a shared secret from a header. Missing secret → always false. */
export function secretMatches(given: string | null, expected: string | undefined): boolean {
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function bearer(req: Request): string | null {
  const h = req.headers.get('authorization') || ''
  return h.startsWith('Bearer ') ? h.slice(7) : null
}
