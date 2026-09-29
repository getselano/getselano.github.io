// Parsing what the signing system (Apps Script) sends. Pure functions:
// the forms are free-ish text, so everything here is forgiving and never
// throws. Anything it cannot read is left empty for a human to fill in.
import type { ISODate } from './dates'

/** 'yyyy-mm-dd', 'dd/mm/yyyy', 'dd.mm.yyyy', 'd/m/yy' → ISO date, or null. */
export function parseDate(v: unknown): ISODate | null {
  const s = String(v ?? '').trim()
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return iso(+m[1], +m[2], +m[3])
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/)
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]
    return iso(y, +m[2], +m[1])
  }
  return null
}

function iso(y: number, mo: number, d: number): ISODate | null {
  if (!(y > 2000 && mo >= 1 && mo <= 12 && d >= 1 && d <= 31)) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCMonth() !== mo - 1) return null
  return dt.toISOString().slice(0, 10)
}

/** First number in a string ("82.5 ק\"ג", "24%") → 82.5 / 24, or null. */
export function parseNum(v: unknown): number | null {
  const m = String(v ?? '').replace(',', '.').match(/\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

export function parseBool(v: unknown): boolean | null {
  if (v === true || v === false) return v
  const s = String(v ?? '').trim().toLowerCase()
  if (['yes', 'true', '1', 'כן', 'מאשר', 'on'].includes(s)) return true
  if (['no', 'false', '0', 'לא', 'לא מאשר', 'off'].includes(s)) return false
  return null
}
