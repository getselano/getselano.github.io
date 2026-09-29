/**
 * Israeli phone numbers → digits-only E.164 without '+', e.g. 972501234567.
 * That is how Supabase Auth stores auth.users.phone, and how every phone
 * column in the database is stored. Returns null when it is not a phone.
 */
export function normalizePhone(input: string): string | null {
  let d = (input || '').replace(/[^0-9+]/g, '')
  if (d.startsWith('+')) d = d.slice(1)
  else if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = '972' + d.slice(1)
  d = d.replace(/[^0-9]/g, '')
  if (d.startsWith('9720')) d = '972' + d.slice(4)
  return /^[0-9]{9,15}$/.test(d) ? d : null
}

/** 972501234567 → 050-123-4567 for display. */
export function displayPhone(e164: string): string {
  if (e164.startsWith('972') && e164.length === 12) {
    const local = '0' + e164.slice(3)
    return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`
  }
  return '+' + e164
}

export function whatsappLink(e164: string, text?: string): string {
  return `https://wa.me/${e164}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
