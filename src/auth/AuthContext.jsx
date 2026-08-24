import React, { createContext, useContext, useEffect, useState } from 'react'
import { storage } from '../utils/storage'
import { supabase, supabaseEnabled } from '../lib/supabase'

// Admin whitelist - only these emails get admin access
const ADMIN_EMAILS = ['avivgvili6@gmail.com', 'israelgrip@gmail.com']

// Coach whitelist lives in localStorage (kept for backwards compat with
// legacy invite links). With Supabase we prefer role in profiles table.
const COACH_LIST_KEY = 'coach-whitelist'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function readCoachList() { return storage.get(COACH_LIST_KEY, []) || [] }
function writeCoachList(list) { storage.set(COACH_LIST_KEY, list) }

// Survives a reload so an admin previewing the member app stays there.
const VIEW_AS_KEY = 'selano_view_as'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => supabaseEnabled ? null : storage.get('user'))
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(supabaseEnabled)
  // Which role the admin is currently looking at the app as.
  //
  // Persisted, because a refresh used to drop it: an admin browsing as a
  // member reverted to admin, every member screen became invalid for the
  // role, and they were bounced to the admin dashboard — losing the screen
  // they were on for a reason that had nothing to do with the screen.
  const [viewAs, setViewAsState] = useState(() => {
    try {
      const saved = localStorage.getItem(VIEW_AS_KEY)
      return saved === 'member' || saved === 'coach' ? saved : null
    } catch {
      return null
    }
  })
  // When true, LoginScreen shows the "set new password" form instead of normal login.
  // Set by Supabase's PASSWORD_RECOVERY event when the user lands from a reset email.
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  // Handle URL invite param (?coach=email) - still works
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const invitedCoach = params.get('coach')
      if (invitedCoach && invitedCoach.includes('@')) {
        const list = readCoachList()
        const email = invitedCoach.trim().toLowerCase()
        if (!list.includes(email)) writeCoachList([...list, email])
        const cleanUrl = window.location.pathname + window.location.hash
        window.history.replaceState({}, '', cleanUrl)
      }
    } catch {}
  }, [])

  // Supabase auth session listener
  useEffect(() => {
    if (!supabaseEnabled) return

    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setSession(session)
      if (session?.user) {
        const u = await hydrateUser(session.user)
        setUser(u)
      }
      setLoading(false)
    })

    // Listen to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      // PASSWORD_RECOVERY fires when the user lands from a "reset password" email link.
      // Supabase gives us a temporary session that lets us call updateUser({password}).
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      setSession(session)
      if (session?.user) {
        const u = await hydrateUser(session.user)
        setUser(u)
      } else {
        setUser(null)
      }
    })

    return () => { mounted = false; sub?.subscription?.unsubscribe() }
  }, [])

  // Load profile row and merge with auth user
  async function hydrateUser(authUser) {
    const email = authUser.email?.toLowerCase() || ''
    const fallbackRole = ADMIN_EMAILS.includes(email) ? 'admin' : (readCoachList().includes(email) ? 'coach' : 'member')
    if (!supabaseEnabled) {
      return { id: authUser.id, email, name: authUser.user_metadata?.name || email.split('@')[0], role: fallbackRole }
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, role, onboarded')
      .eq('id', authUser.id)
      .maybeSingle()
    return {
      id: authUser.id,
      email,
      name: profile?.name || authUser.user_metadata?.name || email.split('@')[0],
      role: profile?.role || fallbackRole,
      onboarded: profile?.onboarded ?? false,
    }
  }

  // Persist legacy user object for non-Supabase mode
  useEffect(() => {
    if (supabaseEnabled) return
    if (user) storage.set('user', user)
    else storage.remove('user')
  }, [user])

  const roleFor = (email) => {
    const e = (email || '').trim().toLowerCase()
    if (ADMIN_EMAILS.includes(e)) return 'admin'
    if (readCoachList().includes(e)) return 'coach'
    return 'member'
  }

  // Magic-link login: sends email with sign-in URL. No passwords.
  // Falls back to legacy local-only login when Supabase isn't configured.
  const login = async (email, name) => {
    const normalizedEmail = (email || '').trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      throw new Error('כתובת מייל לא תקינה')
    }

    if (!supabaseEnabled) {
      // Legacy local-only flow
      const role = roleFor(normalizedEmail)
      const nextUser = { email: normalizedEmail, name: name || normalizedEmail.split('@')[0], role, loginAt: new Date().toISOString() }
      setUser(nextUser)
      return { user: nextUser, magicLinkSent: false }
    }

    // Real Supabase magic-link
    let response
    try {
      response = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: window.location.origin + window.location.pathname,
          data: { name: name || normalizedEmail.split('@')[0] },
        },
      })
    } catch (networkErr) {
      // Fetch/CORS failures land here. Preserve details so caller can surface them.
      const w = new Error(networkErr?.message || 'בעיית רשת - נסה שוב')
      w.code = networkErr?.code || 'NETWORK'
      w.name = networkErr?.name || 'NetworkError'
      w.cause = networkErr
      console.error('[supabase.signInWithOtp] network error:', networkErr)
      throw w
    }

    const { error } = response
    if (error) {
      // Preserve Supabase's rich AuthApiError metadata (code, status, name)
      // so LoginScreen can show the actual reason - not a generic message.
      const w = new Error(error.message || error.name || 'שגיאה בשליחת קישור הכניסה')
      w.code = error.code
      w.status = error.status
      w.name = error.name || 'AuthApiError'
      w.cause = error
      console.error('[supabase.signInWithOtp] auth error:', {
        message: error.message, code: error.code, status: error.status, name: error.name,
      })
      throw w
    }
    return { user: null, magicLinkSent: true, email: normalizedEmail }
  }

  // Password login — the primary flow now. No magic-link, no waiting for email.
  const loginWithPassword = async (email, password) => {
    const normalizedEmail = (email || '').trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('כתובת מייל לא תקינה')
    if (!password || password.length < 6) throw new Error('סיסמה חייבת להכיל לפחות 6 תווים')

    if (!supabaseEnabled) {
      // Legacy local-only fallback (no real auth, matches localStorage-only mode)
      const role = roleFor(normalizedEmail)
      const nextUser = { email: normalizedEmail, name: normalizedEmail.split('@')[0], role, loginAt: new Date().toISOString() }
      setUser(nextUser)
      return { user: nextUser }
    }

    let response
    try {
      response = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
    } catch (networkErr) {
      const w = new Error(networkErr?.message || 'בעיית רשת - נסה שוב')
      w.code = networkErr?.code || 'NETWORK'
      w.name = networkErr?.name || 'NetworkError'
      w.cause = networkErr
      console.error('[supabase.signInWithPassword] network error:', networkErr)
      throw w
    }

    const { error } = response
    if (error) {
      const w = new Error(error.message || 'שגיאה בכניסה')
      w.code = error.code
      w.status = error.status
      w.name = error.name || 'AuthApiError'
      w.cause = error
      console.error('[supabase.signInWithPassword] auth error:', { message: error.message, code: error.code, status: error.status })
      throw w
    }
    return { user: response.data?.user }
  }

  // Password signup — creates new account.
  // Requires Supabase's "Confirm email" toggle to be OFF for immediate access.
  const signupWithPassword = async (email, password, name) => {
    const normalizedEmail = (email || '').trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('כתובת מייל לא תקינה')
    if (!password || password.length < 6) throw new Error('סיסמה חייבת להכיל לפחות 6 תווים')

    if (!supabaseEnabled) {
      const role = roleFor(normalizedEmail)
      const nextUser = { email: normalizedEmail, name: name || normalizedEmail.split('@')[0], role, loginAt: new Date().toISOString() }
      setUser(nextUser)
      return { user: nextUser }
    }

    let response
    try {
      response = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { data: { name: name || normalizedEmail.split('@')[0] } },
      })
    } catch (networkErr) {
      const w = new Error(networkErr?.message || 'בעיית רשת - נסה שוב')
      w.code = networkErr?.code || 'NETWORK'
      w.name = networkErr?.name || 'NetworkError'
      w.cause = networkErr
      console.error('[supabase.signUp] network error:', networkErr)
      throw w
    }

    const { error, data } = response
    if (error) {
      const w = new Error(error.message || 'שגיאה בהרשמה')
      w.code = error.code
      w.status = error.status
      w.name = error.name || 'AuthApiError'
      w.cause = error
      console.error('[supabase.signUp] auth error:', { message: error.message, code: error.code, status: error.status })
      throw w
    }

    // If email confirmation is required, Supabase returns a user with no session.
    // We surface that so the LoginScreen can auto-fall-back to password login,
    // which will work only if the admin turned confirmation OFF in project settings.
    return { user: data?.user, session: data?.session, needsConfirmation: !data?.session }
  }

  // Send password reset email. Works for both "forgot password" AND for
  // legacy users who never had a password (magic-link era) — the reset email
  // is how they set their first password.
  const sendPasswordReset = async (email) => {
    const normalizedEmail = (email || '').trim().toLowerCase()
    if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('כתובת מייל לא תקינה')
    if (!supabaseEnabled) throw new Error('לא זמין במצב פיילוט מקומי')

    let response
    try {
      response = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: window.location.origin + window.location.pathname,
      })
    } catch (networkErr) {
      const w = new Error(networkErr?.message || 'בעיית רשת - נסה שוב')
      w.code = networkErr?.code || 'NETWORK'
      w.cause = networkErr
      console.error('[supabase.resetPasswordForEmail] network error:', networkErr)
      throw w
    }
    const { error } = response
    if (error) {
      const w = new Error(error.message || 'שגיאה בשליחת מייל האיפוס')
      w.code = error.code; w.status = error.status; w.name = error.name || 'AuthApiError'; w.cause = error
      console.error('[supabase.resetPasswordForEmail] auth error:', { message: error.message, code: error.code, status: error.status })
      throw w
    }
    return { ok: true, email: normalizedEmail }
  }

  // Set a new password (used both after PASSWORD_RECOVERY and by any
  // authenticated user who wants to change their password from settings).
  const updatePassword = async (newPassword) => {
    if (!newPassword || newPassword.length < 6) throw new Error('סיסמה חייבת להכיל לפחות 6 תווים')
    if (!supabaseEnabled) throw new Error('לא זמין במצב פיילוט מקומי')

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      const w = new Error(error.message || 'שגיאה בעדכון הסיסמה')
      w.code = error.code; w.status = error.status; w.name = error.name || 'AuthApiError'; w.cause = error
      throw w
    }
    setPasswordRecovery(false)
    return { ok: true }
  }

  const logout = async () => {
    if (supabaseEnabled) await supabase.auth.signOut()
    setUser(null); setViewAsState(null); setPasswordRecovery(false)
    try { localStorage.removeItem(VIEW_AS_KEY) } catch { /* nothing to clear */ }
  }

  const setViewAs = (role) => {
    if (user?.role !== 'admin') return
    const next = role === 'admin' ? null : role
    setViewAsState(next)
    try {
      if (next) localStorage.setItem(VIEW_AS_KEY, next)
      else localStorage.removeItem(VIEW_AS_KEY)
    } catch { /* storage unavailable — the choice just won't survive a reload */ }
  }

  const effectiveRole = (user?.role === 'admin' && viewAs) ? viewAs : user?.role

  const inviteCoach = (email) => {
    const e = (email || '').trim().toLowerCase()
    if (!e.includes('@')) return
    const list = readCoachList()
    if (!list.includes(e)) writeCoachList([...list, e])
  }
  const revokeCoach = (email) => {
    const e = (email || '').trim().toLowerCase()
    writeCoachList(readCoachList().filter(x => x !== e))
  }
  const listCoaches = () => readCoachList()

  return (
    <AuthCtx.Provider value={{
      user, session, loading, login, loginWithPassword, signupWithPassword,
      sendPasswordReset, updatePassword, passwordRecovery, logout,
      inviteCoach, revokeCoach, listCoaches,
      viewAs, setViewAs, effectiveRole,
      supabaseEnabled,
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export { ADMIN_EMAILS }
