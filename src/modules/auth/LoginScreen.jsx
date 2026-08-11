import React, { useState } from 'react'
import { t } from '../../theme/tokens'
import { useAuth, ADMIN_EMAILS } from '../../auth/AuthContext'
import { storage } from '../../utils/storage'
import { useI18n } from '../../i18n/i18n'
import { LegalFooter } from '../../components/legal/LegalCenter'

// Nike Training Club-inspired auth. Light theme (cream ground, black type,
// wine primary action), sentence-case sport-refined typography, real form
// controls with floating labels and inline validation.

const LAST_EMAIL_KEY = 'hfos:last_email'
const LAST_NAME_KEY = 'hfos:last_name'

// Light auth palette — designed to feel like a signup form, not a dark app screen.
const AUTH = {
 bg:'#fafaf7',
 card:'#ffffff',
 ink:'#0a0a0a',
 body:'#2a2a2a',
 mute:'#7a7770',
 hairline:'#e5e2da',
 divider:'#d4d1c8',
 wine:'#6f1622',
 wineDeep:'#5a0f1c',
 wineLite:'#a52a3a',
 danger:'#c03530',
 success:'#2e8b57',
}

// ─── Small controls ──────────────────────────────────────
function TextField({ label, type = 'text', value, onChange, autoComplete, autoFocus, error, hint, dir, required, placeholder }) {
 const filled = !!value
 const [focused, setFocused] = useState(false)
 return (
 <label style={{ display:'block', width:'100%'}}>
 <div style={{
 position:'relative',
 border: `1px solid ${error ? AUTH.danger : focused ? AUTH.ink : AUTH.hairline}`,
 borderRadius: 4,
 background: AUTH.card,
 transition:'border-color .12s',
 }}>
 <span style={{
 position:'absolute',
 insetInlineStart: 14,
 top: (filled || focused) ? 6 :'50%',
 transform: (filled || focused) ? 'translateY(0)':'translateY(-50%)',
 fontFamily:'inherit',
 fontSize: (filled || focused) ? 10 : 14,
 letterSpacing: (filled || focused) ? '0.1em':'0.005em',
 textTransform: (filled || focused) ? 'uppercase':'none',
 color: error ? AUTH.danger : (filled || focused) ? AUTH.mute : AUTH.mute,
 pointerEvents:'none',
 transition:'all .14s',
 background: (filled || focused) ? AUTH.card :'transparent',
 padding: (filled || focused) ? '0 4px': 0,
 fontWeight: 500,
 }}>{label}{required && ' *'}</span>
 <input
 type={type}
 value={value || ''}
 onChange={onChange}
 autoComplete={autoComplete}
 autoFocus={autoFocus}
 placeholder={focused ? (placeholder || '') :''}
 onFocus={() => setFocused(true)}
 onBlur={() => setFocused(false)}
 dir={dir}
 style={{
 width:'100%',
 padding:'22px 14px 10px',
 border:'none',
 background:'transparent',
 color: AUTH.ink,
 fontFamily:'inherit',
 fontSize: 15,
 letterSpacing:'-0.005em',
 outline:'none',
 borderRadius: 4,
 }}
 />
 </div>
 {error && (
 <div style={{
 color: AUTH.danger, fontSize: 12, marginTop: 6,
 letterSpacing:'-0.005em', lineHeight: 1.4,
 }}>{error}</div>
 )}
 {hint && !error && (
 <div style={{
 color: AUTH.mute, fontSize: 12, marginTop: 6,
 letterSpacing:'-0.005em', lineHeight: 1.4,
 }}>{hint}</div>
 )}
 </label>
 )
}

function PrimaryButton({ children, type, onClick, disabled }) {
 return (
 <button
 type={type}
 onClick={onClick}
 disabled={disabled}
 style={{
 width:'100%',
 padding:'15px 20px',
 background: disabled ? '#c5c2b8': AUTH.ink,
 color:'#fff',
 border:'none',
 borderRadius: 999,
 fontFamily:'inherit',
 fontSize: 12,
 fontWeight: 700,
 letterSpacing:'0.16em',
 textTransform:'uppercase',
 cursor: disabled ? 'not-allowed':'pointer',
 transition:'background .12s',
 }}
 onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = AUTH.wine }}
 onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = AUTH.ink }}
 >{children}</button>
 )
}

function SecondaryButton({ children, onClick, type }) {
 return (
 <button
 type={type}
 onClick={onClick}
 style={{
 width:'100%',
 padding:'15px 20px',
 background:'transparent',
 color: AUTH.ink,
 border: `1.5px solid ${AUTH.ink}`,
 borderRadius: 999,
 fontFamily:'inherit',
 fontSize: 12,
 fontWeight: 700,
 letterSpacing:'0.16em',
 textTransform:'uppercase',
 cursor:'pointer',
 }}
 >{children}</button>
 )
}

function GhostLink({ children, onClick, type }) {
 return (
 <button
 type={type}
 onClick={onClick}
 style={{
 background:'none',
 border:'none',
 color: AUTH.body,
 fontFamily:'inherit',
 fontSize: 13,
 letterSpacing:'-0.005em',
 cursor:'pointer',
 padding:'6px 4px',
 textDecoration:'underline',
 }}
 >{children}</button>
 )
}

// Rule row: real check/x indicators for password requirements.
function Rule({ ok, text }) {
 return (
 <div style={{
 display:'flex', alignItems:'center', gap: 8,
 fontSize: 12, color: ok ? AUTH.success : AUTH.mute,
 letterSpacing:'-0.005em', lineHeight: 1.4,
 }}>
 {ok ? (
 <svg width="12"height="12"viewBox="0 0 12 12"fill="none"stroke={AUTH.success} strokeWidth="2"strokeLinecap="round"strokeLinejoin="round">
 <path d="M2 6l3 3 5-6"/>
 </svg>
 ) : (
 <svg width="12"height="12"viewBox="0 0 12 12"fill="none"stroke={AUTH.mute} strokeWidth="2"strokeLinecap="round"strokeLinejoin="round">
 <path d="M3 3l6 6M9 3l-6 6"/>
 </svg>
 )}
 <span>{text}</span>
 </div>
 )
}

// ─── Main component ──────────────────────────────────────
export function LoginScreen() {
 const {
 loginWithPassword, signupWithPassword, sendPasswordReset,
 updatePassword, passwordRecovery, supabaseEnabled,
 } = useAuth()
 const { lang, setLang, t: tr, isRTL } = useI18n()

 const rememberedEmail = storage.get(LAST_EMAIL_KEY) || ''
 const rememberedName = storage.get(LAST_NAME_KEY) || ''
 const initialStep = passwordRecovery ? 'reset-password': (rememberedEmail ? 'existing':'chooser')
 const [step, setStep] = useState(initialStep)
 const [email, setEmail] = useState(rememberedEmail)
 const [name, setName] = useState(rememberedName)
 const [password, setPassword] = useState('')
 const [error, setError] = useState('')
 const [busy, setBusy] = useState(false)

 React.useEffect(() => {
 if (passwordRecovery) setStep('reset-password')
 }, [passwordRecovery])

 const [specialty, setSpecialty] = useState('')
 const [experience, setExperience] = useState('')
 const [phone, setPhone] = useState('')

 const normalizedEmail = (email || '').trim().toLowerCase()
 const emailIsAdmin = ADMIN_EMAILS.includes(normalizedEmail)

 const humanizeError = (err) => {
 console.error('[Login] error:', {
 message: err?.message, code: err?.code, status: err?.status, name: err?.name,
 })
 const raw = typeof err?.message === 'string'? err.message :''
 const status = err?.status
 const code = err?.code || err?.name

 const heb = isRTL
 if (/invalid.?login|invalid.?credentials|invalid_grant/i.test(raw) || code === 'invalid_credentials') return heb ? 'מייל או סיסמה שגויים.' : 'Incorrect email or password.'
 if (/user.?not.?found|no.?user.?found/i.test(raw)) return heb ? 'לא נמצא משתמש עם המייל הזה — אולי צריך להירשם קודם (״אני חדש״).' : 'No user found with this email — you may need to sign up first ("I\'m new").'
 if (/user.?already.?registered|already.?exists/i.test(raw) || code === 'user_already_exists') return heb ? 'המייל הזה כבר רשום. תנסה להיכנס במקום להירשם.' : 'This email is already registered. Sign in instead.'
 if (/password.?should.?be.?at.?least|weak.?password/i.test(raw)) return heb ? 'סיסמה חלשה מדי — לפחות 8 תווים, עם אות ומספר.' : 'Password too weak — at least 8 characters, with a letter and a number.'
 if (/email.?not.?confirmed/i.test(raw)) return heb ? 'המייל עדיין לא אושר. פנה למנהל: israelgrip@gmail.com' : 'Email not confirmed yet. Contact admin: israelgrip@gmail.com'
 if (status === 429 || /rate.?limit|too.?many|for security purposes/i.test(raw)) return heb ? 'יותר מדי ניסיונות בזמן קצר. המתן דקה ונסה שוב.' : 'Too many attempts. Wait a minute and try again.'
 if (/redirect.?url|redirect_uri|not.?allowed/i.test(raw)) return heb ? 'הגדרת Redirect URL של Supabase חסרה. פנה למנהל: israelgrip@gmail.com' : 'Missing Supabase Redirect URL config. Contact admin: israelgrip@gmail.com'
 if (/failed to fetch|networkerror|connection|network.?request/i.test(raw) || code === 'NETWORK') return heb ? 'בעיית חיבור לאינטרנט — נסה שוב או בדוק את החיבור.' : 'Network error — try again or check your connection.'
 if (/invalid.?email|email.?invalid/i.test(raw)) return heb ? 'כתובת מייל לא תקינה.' : 'Invalid email address.'
 if (raw && raw.trim() && !/^[\{\[\]\}]+$/.test(raw.trim())) return code ? `${raw} (${code})` : raw
 if (status) return heb ? `שגיאה מהשרת (סטטוס ${status}). פנה למנהל: israelgrip@gmail.com` : `Server error (status ${status}). Contact admin: israelgrip@gmail.com`
 if (code) return heb ? `שגיאה: ${code}. פנה למנהל: israelgrip@gmail.com` : `Error: ${code}. Contact admin: israelgrip@gmail.com`
 return heb ? 'משהו השתבש. פנה למנהל: israelgrip@gmail.com' : 'Something went wrong. Contact admin: israelgrip@gmail.com'
 }

 // Bilingual validation error helper
 const vErr = {
   invalidEmail: () => isRTL ? 'כתובת מייל לא תקינה' : 'Invalid email address',
   shortPassword: () => isRTL ? 'הסיסמה חייבת להכיל לפחות 6 תווים' : 'Password must be at least 6 characters',
   missingName: () => isRTL ? 'חסר שם' : 'Name is required',
   needsConfirm: () => isRTL
     ? 'נרשמת בהצלחה. מנהל המערכת צריך לאשר את חשבונך. פנה: israelgrip@gmail.com'
     : 'Signup successful. Admin needs to approve your account. Contact: israelgrip@gmail.com',
   coachRequired: () => isRTL
     ? 'שם, מייל, ותחום התמחות חובה'
     : 'Name, email, and specialty are required',
 }

 const submitLogin = async (e) => {
 e?.preventDefault?.()
 setError(''); setBusy(true)
 try {
 if (!normalizedEmail || !normalizedEmail.includes('@')) { setError(vErr.invalidEmail()); setBusy(false); return }
 if (!password || password.length < 6) { setError(vErr.shortPassword()); setBusy(false); return }
 await loginWithPassword(normalizedEmail, password)
 storage.set(LAST_EMAIL_KEY, normalizedEmail)
 } catch (err) { setError(humanizeError(err)) } finally { setBusy(false) }
 }

 const submitSignup = async (e) => {
 e?.preventDefault?.()
 setError(''); setBusy(true)
 try {
 if (!name?.trim()) { setError(vErr.missingName()); setBusy(false); return }
 if (!normalizedEmail || !normalizedEmail.includes('@')) { setError(vErr.invalidEmail()); setBusy(false); return }
 if (!password || password.length < 6) { setError(vErr.shortPassword()); setBusy(false); return }
 const result = await signupWithPassword(normalizedEmail, password, name)
 storage.set(LAST_EMAIL_KEY, normalizedEmail)
 storage.set(LAST_NAME_KEY, name)
 if (result?.needsConfirmation) {
 setError(vErr.needsConfirm())
 }
 } catch (err) { setError(humanizeError(err)) } finally { setBusy(false) }
 }

 const submitForgot = async (e) => {
 e?.preventDefault?.()
 setError(''); setBusy(true)
 try {
 if (!normalizedEmail || !normalizedEmail.includes('@')) { setError(vErr.invalidEmail()); setBusy(false); return }
 await sendPasswordReset(normalizedEmail)
 storage.set(LAST_EMAIL_KEY, normalizedEmail)
 setStep('forgot-sent')
 } catch (err) { setError(humanizeError(err)) } finally { setBusy(false) }
 }

 const submitNewPassword = async (e) => {
 e?.preventDefault?.()
 setError(''); setBusy(true)
 try {
 if (!password || password.length < 6) { setError(vErr.shortPassword()); setBusy(false); return }
 await updatePassword(password)
 } catch (err) { setError(humanizeError(err)) } finally { setBusy(false) }
 }

 const submitCoachRequest = () => {
 if (!email || !name || !specialty) { setError(vErr.coachRequired()); return }
 const requests = storage.get('coach-requests') || []
 const req = {
 email: normalizedEmail, name, specialty, experience, phone,
 requestedAt: new Date().toISOString(), status:'pending',
 }
 if (!requests.find(r => r.email === normalizedEmail)) {
 storage.set('coach-requests', [req, ...requests])
 }
 setStep('coach-pending')
 }

 const forgetMe = () => {
 storage.remove(LAST_EMAIL_KEY); storage.remove(LAST_NAME_KEY)
 setEmail(''); setName(''); setPassword(''); setStep('chooser')
 }

 // Password rules (for signup + reset)
 const pwHasLen = (password || '').length >= 8
 const pwHasNum = /\d/.test(password || '')
 const pwHasLetter = /[a-zA-Zא-ת]/.test(password || '')

 return (
  <div className="hfos-auth" style={{
 minHeight:'100vh',
 background: AUTH.bg,
 display:'flex', alignItems:'flex-start', justifyContent:'center',
 direction: isRTL ? 'rtl':'ltr',
 color: AUTH.body,
 fontFamily:'"Heebo", "Inter", -apple-system, "Segoe UI", sans-serif',
 }}>
  <style>{`
   .hfos-auth input, .hfos-auth textarea {
     color: ${AUTH.wine} !important;
     -webkit-text-fill-color: ${AUTH.wine} !important;
     caret-color: ${AUTH.wine} !important;
     font-weight: 600;
   }
   .hfos-auth input::placeholder, .hfos-auth textarea::placeholder {
     color: ${AUTH.mute} !important;
     -webkit-text-fill-color: ${AUTH.mute} !important;
     font-weight: 400;
   }
   .hfos-auth input:-webkit-autofill,
   .hfos-auth input:-webkit-autofill:hover,
   .hfos-auth input:-webkit-autofill:focus {
     -webkit-box-shadow: 0 0 0 30px ${AUTH.card} inset !important;
     -webkit-text-fill-color: ${AUTH.wine} !important;
   }
 `}</style>
 <div style={{
 position:'absolute', top: 20,
 [isRTL ? 'left':'right']: 20,
 zIndex: 3, display:'flex', gap: 12,
 }}>
 {['he','en'].map(l => {
 const active = lang === l
 return (
 <button key={l} onClick={() => setLang(l)} style={{
 background:'none', border:'none', padding: 4,
 color: active ? AUTH.ink : AUTH.mute,
 fontFamily:'inherit',
 fontWeight: active ? 700 : 400, fontSize: 11,
 letterSpacing:'0.16em', textTransform:'uppercase',
 cursor:'pointer',
 textDecoration: active ? 'underline':'none',
 textUnderlineOffset: 6,
 }}>{l === 'he'? 'עב':'EN'}</button>
 )
 })}
 </div>

 {/* Centered content column */}
 <div style={{
 width:'100%', maxWidth: 440,
 padding:'80px 24px 48px',
 display:'flex', flexDirection:'column',
 alignItems:'stretch',
 minHeight:'100vh',
 }}>
 {/* Wordmark + hero slogan — brand hits before anything else */}
 <div style={{
 textAlign:'center', marginBottom: 36,
 }}>
 <div style={{
 fontFamily:'"Space Mono", ui-monospace, monospace',
 fontSize: 10, letterSpacing:'0.32em',
 textTransform:'uppercase',
 color: AUTH.mute, marginBottom: 14,
 }}>Performance System</div>
 <div style={{
 fontFamily:'"Barlow", "SF Pro Display", -apple-system, "Inter", sans-serif',
 fontSize: 30, fontWeight: 700,
 letterSpacing:'-0.035em',
 color: AUTH.ink, lineHeight: 1,
 marginBottom: 26,
 }}>
 <span style={{ color: AUTH.wine }}>S</span>elano
 </div>

 {/* The slogan — italic, oversized, dominant */}
 <div style={{
 fontFamily:'"Barlow", "SF Pro Display", -apple-system, "Inter", sans-serif',
 fontStyle:'italic',
 fontWeight: 700,
 fontSize:'clamp(38px, 10vw, 54px)',
 letterSpacing:'-0.045em',
 lineHeight: 0.92,
 color: AUTH.ink,
 textTransform:'uppercase',
 marginTop: 6,
 direction:'ltr',
 }}>
 Forged for<br/>performance<span style={{ color: AUTH.wine }}>.</span>
 </div>

 <div style={{
 fontFamily:'"Space Mono", ui-monospace, monospace',
 fontSize: 10, letterSpacing:'0.28em',
 textTransform:'uppercase',
 color: AUTH.mute, marginTop: 16,
 direction:'ltr',
 }}>Built · Tracked · Unstoppable</div>
 </div>

 {/* Step context — tiny mono caps, subordinate to the hero slogan above */}
 <div style={{
 fontFamily:'"Space Mono", ui-monospace, monospace',
 fontSize: 10, letterSpacing:'0.28em',
 textTransform:'uppercase',
 textAlign:'center', color: AUTH.mute,
 marginBottom: 20,
 display:'flex', alignItems:'center', justifyContent:'center', gap: 12,
 }}>
 <span style={{ width: 24, height: 1, background: AUTH.hairline }} />
 <span>
 {step === 'chooser'&& (isRTL ? 'התחל':'Begin')}
 {step === 'existing'&& (isRTL ? 'כניסה':'Sign in')}
 {step === 'new'&& (isRTL ? 'הרשמה':'Create account')}
 {step === 'forgot'&& (isRTL ? 'איפוס סיסמה':'Reset password')}
 {step === 'forgot-sent'&& (isRTL ? 'נשלח מייל':'Email sent')}
 {step === 'reset-password'&& (isRTL ? 'סיסמה חדשה':'New password')}
 {step === 'coach-request'&& (isRTL ? 'הרשמת מאמן':'Coach signup')}
 {step === 'coach-pending'&& (isRTL ? 'הבקשה נשלחה':'Request sent')}
 </span>
 <span style={{ width: 24, height: 1, background: AUTH.hairline }} />
 </div>

 {/* CHOOSER */}
 {step === 'chooser'&& (
 <div style={{ display:'grid', gap: 12 }}>
 <div style={{
 color: AUTH.body, fontSize: 14, lineHeight: 1.5,
 textAlign:'center', marginBottom: 8,
 }}>
 {isRTL
 ? 'מערכת לניהול ביצועים.'
 :'Performance management system.'}
 </div>

 <PrimaryButton onClick={() => setStep('existing')}>
 {tr('login.existing_user')}
 </PrimaryButton>

 <SecondaryButton onClick={() => setStep('new')}>
 {tr('login.new_user')}
 </SecondaryButton>

 <div style={{ textAlign:'center', marginTop: 16 }}>
 <GhostLink onClick={() => setStep('coach-request')}>{tr('login.coach_link')}</GhostLink>
 </div>
 </div>
 )}

 {/* EXISTING USER */}
 {step === 'existing'&& (
 <form onSubmit={submitLogin} noValidate style={{ display:'grid', gap: 14 }}>
 <TextField
 label={tr('login.email')} type="email"
 value={email} onChange={e => setEmail(e.target.value)}
 autoComplete="email"autoFocus={!rememberedEmail} required
 dir="ltr"
 />
 <TextField
 label={tr('login.password')} type="password"
 value={password} onChange={e => setPassword(e.target.value)}
 autoComplete="current-password"autoFocus={!!rememberedEmail} required
 dir="ltr"
 error={error ? String(error) :''}
 />

 {normalizedEmail && emailIsAdmin && (
 <div style={{
 padding: 10, borderRadius: 4,
 background: `${AUTH.wine}12`,
 border: `1px solid ${AUTH.wine}`,
 color: AUTH.wine,
 fontSize: 11, letterSpacing:'0.16em',
 textAlign:'center', textTransform:'uppercase',
 fontWeight: 700,
 }}>{tr('login.admin_badge')}</div>
 )}

 <div style={{ marginTop: 4 }}>
 <PrimaryButton type="submit"disabled={busy || !email || !password}>
 {busy ? tr('login.entering') : tr('login.enter')}
 </PrimaryButton>
 </div>

 <div style={{ textAlign:'center', marginTop: 6 }}>
 <GhostLink onClick={() => { setError(''); setPassword(''); setStep('forgot') }}>
 {tr('login.forgot_link')}
 </GhostLink>
 </div>

 <div style={{
 display:'flex', justifyContent:'space-between',
 paddingTop: 8, marginTop: 4,
 borderTop: `1px solid ${AUTH.hairline}`,
 }}>
 <GhostLink onClick={() => setStep('chooser')}>← {tr('login.back')}</GhostLink>
 {rememberedEmail && <GhostLink onClick={forgetMe}>{tr('login.forget_me')}</GhostLink>}
 </div>
 </form>
 )}

 {/* NEW USER — with password rules like Nike */}
 {step === 'new'&& (
 <form onSubmit={submitSignup} noValidate style={{ display:'grid', gap: 14 }}>
 <TextField
 label={tr('login.name')} value={name}
 onChange={e => setName(e.target.value)}
 autoComplete="name"autoFocus required
 />
 <TextField
 label={tr('login.email')} type="email"
 value={email} onChange={e => setEmail(e.target.value)}
 autoComplete="email"required dir="ltr"
 />
 <TextField
 label={tr('login.new_password')} type="password"
 value={password} onChange={e => setPassword(e.target.value)}
 autoComplete="new-password"required dir="ltr"
 error={error ? String(error) :''}
 />

 {/* Nike-style password rules */}
 <div style={{
 display:'grid', gap: 6, padding:'4px 2px',
 }}>
 <Rule ok={pwHasLen} text={isRTL ? 'מינימום 8 תווים':'Minimum of 8 characters'} />
 <Rule ok={pwHasLetter && pwHasNum} text={isRTL ? 'לפחות אות אחת ומספר אחד':'One letter and one number'} />
 </div>

 {normalizedEmail && emailIsAdmin && (
 <div style={{
 padding: 10, borderRadius: 4,
 background: `${AUTH.wine}12`, border: `1px solid ${AUTH.wine}`,
 color: AUTH.wine, fontSize: 11, letterSpacing:'0.16em',
 textAlign:'center', textTransform:'uppercase', fontWeight: 700,
 }}>{tr('login.admin_badge')}</div>
 )}

 <div style={{ marginTop: 4 }}>
 <PrimaryButton type="submit"disabled={busy || !email || !name || !password}>
 {busy ? tr('login.creating') : tr('login.create_account')}
 </PrimaryButton>
 </div>

 <div style={{
 paddingTop: 8, marginTop: 4,
 borderTop: `1px solid ${AUTH.hairline}`,
 }}>
 <GhostLink onClick={() => setStep('chooser')}>← {tr('login.back')}</GhostLink>
 </div>
 </form>
 )}

 {/* FORGOT PASSWORD */}
 {step === 'forgot'&& (
 <form onSubmit={submitForgot} noValidate style={{ display:'grid', gap: 14 }}>
 <div style={{
 fontSize: 14, color: AUTH.body, textAlign:'center', lineHeight: 1.55,
 marginBottom: 8,
 }}>
 {isRTL
 ? 'נשלח למייל שלך קישור לאיפוס. גם אם עוד לא יצרת סיסמה — זה יאפשר לך לקבוע אחת עכשיו.'
 : "We'll send a link to reset your password. Even if you never set one, this lets you create one now."}
 </div>
 <TextField
 label={tr('login.email')} type="email"
 value={email} onChange={e => setEmail(e.target.value)}
 autoComplete="email"autoFocus required dir="ltr"
 error={error ? String(error) :''}
 />
 <PrimaryButton type="submit"disabled={busy || !email}>
 {busy ? (isRTL ? 'שולח...':'Sending...') : (isRTL ? 'שלח קישור איפוס':'Send reset link')}
 </PrimaryButton>
 <div style={{ textAlign:'center', paddingTop: 6 }}>
 <GhostLink onClick={() => { setError(''); setStep('existing') }}>← {isRTL ? 'חזור לכניסה':'Back to sign in'}</GhostLink>
 </div>
 </form>
 )}

 {/* FORGOT SENT */}
 {step === 'forgot-sent'&& (
 <div style={{ textAlign:'center'}}>
 <div style={{
 width: 56, height: 56, borderRadius:'50%',
 background:'#fff', border: `2px solid ${AUTH.wine}`,
 display:'inline-flex', alignItems:'center', justifyContent:'center',
 marginBottom: 20,
 }}>
 <svg width="24"height="24"viewBox="0 0 26 26"fill="none"stroke={AUTH.wine} strokeWidth="1.8"strokeLinecap="round"strokeLinejoin="round">
 <rect x="3"y="6"width="20"height="14"rx="2"/>
 <path d="M3 8l10 7 10-7"/>
 </svg>
 </div>
 <div style={{
 marginBottom: 16, fontSize: 15, color: AUTH.body, lineHeight: 1.6,
 }}>
 {isRTL ? 'שלחנו קישור איפוס למייל:':'We sent a reset link to:'}<br />
 <b style={{ color: AUTH.ink, fontWeight: 700 }}>{email}</b>
 </div>
 <div style={{
 padding: 14, background:'#f0ede4', borderRadius: 4,
 fontSize: 12, color: AUTH.body, lineHeight: 1.7, marginBottom: 20,
 textAlign: isRTL ? 'right':'left',
 }}>
 {isRTL
 ? 'פתח את המייל ולחץ על הקישור — תועבר לאפליקציה לקבוע סיסמה חדשה. לא רואה? בדוק בספאם. הקישור פעיל שעה.'
 : "Open the email and click the link — you'll be sent back here to set a new password. Not seeing it? Check spam. The link expires in an hour."}
 </div>
 <SecondaryButton onClick={() => { setStep('existing'); setError('') }}>{isRTL ? 'חזור לכניסה':'Back to sign in'}</SecondaryButton>
 </div>
 )}

 {/* RESET PASSWORD */}
 {step === 'reset-password'&& (
 <form onSubmit={submitNewPassword} noValidate style={{ display:'grid', gap: 14 }}>
 <div style={{
 fontSize: 14, color: AUTH.body, textAlign:'center', lineHeight: 1.55,
 marginBottom: 8,
 }}>
 {isRTL
 ? 'קבע סיסמה חדשה לחשבון שלך. שמור אותה — היא תשמש לכניסות הבאות.'
 : "Set a new password for your account. Save it — you'll need it next time."}
 </div>
 <TextField
 label={isRTL ? 'סיסמה חדשה':'New password'} type="password"
 value={password} onChange={e => setPassword(e.target.value)}
 autoComplete="new-password"autoFocus required dir="ltr"
 error={error ? String(error) :''}
 />
 <div style={{ display:'grid', gap: 6, padding:'4px 2px'}}>
 <Rule ok={pwHasLen} text={isRTL ? 'מינימום 8 תווים':'Minimum of 8 characters'} />
 <Rule ok={pwHasLetter && pwHasNum} text={isRTL ? 'לפחות אות אחת ומספר אחד':'One letter and one number'} />
 </div>
 <PrimaryButton type="submit"disabled={busy || !password}>
 {busy ? (isRTL ? 'שומר...':'Saving...') : (isRTL ? 'קבע סיסמה והיכנס':'Set password & sign in')}
 </PrimaryButton>
 </form>
 )}

 {/* COACH REQUEST */}
 {step === 'coach-request'&& (
 <div style={{ display:'grid', gap: 12 }}>
 <div style={{
 color: AUTH.body, fontSize: 14, textAlign:'center', lineHeight: 1.55,
 marginBottom: 8,
 }}>
 {isRTL ? 'מלא פרטים — המנהל יבדוק ויאשר בהקדם':'Fill your details — the admin will review shortly'}
 </div>
 <TextField label={isRTL ? 'שם מלא':'Full name'} value={name} onChange={e => setName(e.target.value)} required />
 <TextField label={isRTL ? 'מייל':'Email'} type="email"value={email} onChange={e => setEmail(e.target.value)} required dir="ltr"/>
 <TextField label={isRTL ? 'טלפון':'Phone'} value={phone} onChange={e => setPhone(e.target.value)} dir="ltr"/>
 <TextField label={isRTL ? 'תחום התמחות':'Specialty'} value={specialty} onChange={e => setSpecialty(e.target.value)} required />
 <TextField label={isRTL ? 'שנות ניסיון':'Years of experience'} type="number"value={experience} onChange={e => setExperience(e.target.value)} dir="ltr"/>
 {error && <div style={{ color: AUTH.danger, fontSize: 12, textAlign:'center'}}>{error}</div>}
 <div style={{ display:'grid', gap: 10, marginTop: 4 }}>
 <PrimaryButton onClick={submitCoachRequest}>{isRTL ? 'שלח בקשה':'Submit request'}</PrimaryButton>
 <SecondaryButton onClick={() => setStep('chooser')}>{isRTL ? 'חזור':'Back'}</SecondaryButton>
 </div>
 </div>
 )}

 {step === 'coach-pending'&& (
 <div style={{ textAlign:'center'}}>
 <div style={{
 width: 56, height: 56, borderRadius:'50%',
 background:'#fff', border: `2px solid ${AUTH.success}`,
 display:'inline-flex', alignItems:'center', justifyContent:'center',
 marginBottom: 20,
 }}>
 <svg width="24"height="24"viewBox="0 0 26 26"fill="none"stroke={AUTH.success} strokeWidth="2"strokeLinecap="round"strokeLinejoin="round">
 <path d="M5 13l5 5 11-11"/>
 </svg>
 </div>
 <div style={{
 marginBottom: 16, fontSize: 15, color: AUTH.body, lineHeight: 1.6,
 }}>
 {isRTL
 ? 'בקשתך נשלחה למנהל. ברגע שתאושר, תקבל קישור אישי לגשת כמאמן.'
 : "Your request was sent. Once approved, you'll receive a personal link to sign in as a coach."}
 </div>
 <div style={{
 padding: 14, background:'#f0ede4', borderRadius: 4,
 fontSize: 12, color: AUTH.body, textAlign: isRTL ? 'right':'left', marginBottom: 20,
 lineHeight: 1.9,
 }}>
 <div><b style={{ color: AUTH.mute, fontWeight: 500, fontSize: 10, letterSpacing:'0.16em', textTransform:'uppercase'}}>{isRTL ? 'מייל':'Email'}</b> <span style={{ marginInlineStart: 8 }}>{email}</span></div>
 <div><b style={{ color: AUTH.mute, fontWeight: 500, fontSize: 10, letterSpacing:'0.16em', textTransform:'uppercase'}}>{isRTL ? 'תחום':'Specialty'}</b> <span style={{ marginInlineStart: 8 }}>{specialty}</span></div>
 {phone && <div><b style={{ color: AUTH.mute, fontWeight: 500, fontSize: 10, letterSpacing:'0.16em', textTransform:'uppercase'}}>{isRTL ? 'טלפון':'Phone'}</b> <span style={{ marginInlineStart: 8 }}>{phone}</span></div>}
 </div>
 <SecondaryButton onClick={() => setStep('chooser')}>{isRTL ? 'חזור למסך הכניסה':'Back to sign in'}</SecondaryButton>
 </div>
 )}

 {/* Footer note — quiet, mono, no drama */}
 <div style={{
 marginTop:'auto', paddingTop: 32,
 fontFamily:'"Space Mono", ui-monospace, monospace',
 fontSize: 9, letterSpacing:'0.24em',
 color: AUTH.mute, textAlign:'center', textTransform:'uppercase',
 lineHeight: 1.6,
 }}>
 {supabaseEnabled ? tr('login.footer_supabase') : tr('login.footer_local')}
 </div>
 <LegalFooter />
 </div>
 </div>
 )
}
