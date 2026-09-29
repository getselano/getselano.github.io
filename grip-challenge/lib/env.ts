// Runtime configuration. With no Supabase URL the app runs in demo mode:
// in-memory data and a role switcher instead of SMS login.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const isDemo = !SUPABASE_URL

/** Club WhatsApp number (digits, E.164) for "אני רוצה לתאם" and general contact. */
export const CLUB_WHATSAPP = process.env.NEXT_PUBLIC_CLUB_WHATSAPP || ''
