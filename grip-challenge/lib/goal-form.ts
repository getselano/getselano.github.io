// The participant's personal link to the signed goal appendix (the Apps
// Script signing app, ?page=goal). Name and phone ride along so the form
// opens prefilled and the signed goal matches the right participant.

/** GOAL_FORM_URL is the signing app's /exec address. Unset → no link. */
export function goalFormLink(base: string | undefined, p: { full_name: string; phone: string }): string | null {
  if (!base) return null
  let u: URL
  try {
    u = new URL(base)
  } catch {
    return null
  }
  u.searchParams.set('page', 'goal')
  u.searchParams.set('name', p.full_name)
  // Digits only, local format (0501234567): what the form's own check accepts.
  u.searchParams.set('phone', p.phone.startsWith('972') ? '0' + p.phone.slice(3) : p.phone)
  return u.toString()
}

/** What the nutritionist forwards to the participant on WhatsApp. */
export function goalFormInvite(firstName: string, link: string): string {
  return `היי ${firstName}, כמו שסיכמנו בשיחה: זה הקישור האישי שלך לנספח היעד.\nממלאים את מה שקבענו יחד וחותמים בסוף. העותק החתום יגיע אליך במייל.\n${link}`
}
