import React, { useState, useEffect } from 'react'
import { AppProvider, useApp } from './store/AppStore'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { I18nProvider } from './i18n/i18n'
import { Shell } from './components/layout/Layout'
import { FloatingAssistant } from './components/assistant/FloatingAssistant'
import { NotificationScheduler } from './components/notifications/NotificationScheduler'
import { TrainerCheckIn } from './components/notifications/TrainerCheckIn'
import { NewWorkoutToast } from './components/notifications/NewWorkoutToast'
import { AdminMessageToast } from './components/notifications/AdminMessageToast'
import { LoginScreen } from './modules/auth/LoginScreen'
import { Onboarding } from './modules/member/onboarding/Onboarding'

// member
import { Home } from './modules/member/home/Home'
import { Goals } from './modules/member/goals/Goals'
import { Progress } from './modules/member/progress/Progress'
import { Train, TrainHistory, TrainProgramsLibrary } from './modules/member/train/Train'
import { PdfImporter } from './modules/member/train/PdfImporter'
import { Rehab } from './modules/member/rehab/Rehab'
import { Nutrition } from './modules/member/nutrition/Nutrition'
import { Mind } from './modules/member/mind/Mind'
import { Calendar } from './modules/member/calendar/Calendar'
import { Store } from './modules/member/store/Store'
import { Personal } from './modules/member/personal/Personal'
import { OnDemand } from './modules/member/ondemand/OnDemand'
import { Community } from './modules/member/community/Community'
import { NewSharedWorkoutToast } from './components/notifications/NewSharedWorkoutToast'
import { Profile } from './modules/member/profile/Profile'
import { Reminders } from './modules/member/reminders/Reminders'
import { Talk } from './modules/member/talk/Talk'
import { ControlCenter } from './modules/member/control/ControlCenter'
import { SLoader } from './components/ui/SLoader'
import { HealthAcknowledgment, readHealthAck } from './components/legal/HealthAcknowledgment'
import { fetchHealthAck } from './services/supabaseSync'
import { fetchMyPilotStatus } from './services/pilot'
import { WaitlistScreen } from './modules/member/waitlist/WaitlistScreen'
import { AdminPilot } from './modules/admin/pilot/AdminPilot'
import { t as tokens } from './theme/tokens'

// admin
import { Overview } from './modules/admin/overview/Overview'
import { Members } from './modules/admin/members/Members'
import { Team } from './modules/admin/team/Team'
import { Billing } from './modules/admin/billing/Billing'
import { Analytics } from './modules/admin/analytics/Analytics'
import { Alerts } from './modules/admin/alerts/Alerts'
import { Settings } from './modules/admin/settings/Settings'
import { CoachRequests } from './modules/admin/coach-requests/CoachRequests'
import { PersonalRequests } from './modules/admin/personal-requests/PersonalRequests'
import { MemberPhotos } from './modules/admin/member-photos/MemberPhotos'
import { AdminFeedback } from './modules/admin/feedback/AdminFeedback'

// The screens each role can open. Kept as plain id lists so the hash can be
// validated before the page maps — which hold live elements — are built.
const MEMBER_PAGE_IDS = [
  'home', 'goals', 'progress', 'train', 'train-history', 'train-programs',
  'train-import', 'rehab', 'nutrition', 'mind', 'calendar', 'store',
  'personal', 'ondemand', 'community', 'reminders', 'talk', 'profile', 'control',
]
const ADMIN_PAGE_IDS = [
  'overview', 'pilot', 'personal', 'photos', 'requests', 'members', 'team',
  'billing', 'analytics', 'alerts', 'feedback', 'settings',
]

// Screen ids are a restricted alphabet, so anything else in the hash is
// somebody else's — an anchor link, a stale bookmark — and is ignored rather
// than routed to.
function pageFromHash() {
  try {
    const raw = (window.location.hash || '').replace(/^#\/?/, '')
    return /^[a-z-]{2,32}$/.test(raw) ? raw : null
  } catch {
    return null
  }
}

function AppRouter() {
 const { user, effectiveRole, loading, passwordRecovery } = useAuth()
 const { state, setRole, completeOnboarding } = useApp()
 // Deep-link support: if the URL has ?workout=<id>, start on the community
 // tab so the Community screen can auto-scroll to that card. It clears the
 // param itself after consuming it.
 // The current screen also lives in the URL hash, so a refresh — including the
 // one the service worker triggers after a deploy — comes back to the screen
 // the user was on instead of dumping them at home. The hash is used rather
 // than a path because the app is served from a static host with no rewrite
 // rules, and it gives the browser's back button something to move through.
 const initialPage = (() => {
   try {
     const url = new URL(window.location.href)
     if (url.searchParams.get('workout')) return 'community'
     const fromHash = pageFromHash()
     if (fromHash) return fromHash
   } catch {}
   return 'home'
 })()
 const [page, setPage] = useState(initialPage)

 // Back and forward move between screens rather than leaving the app.
 useEffect(() => {
   const onHashChange = () => {
     const next = pageFromHash()
     if (next) setPage(next)
   }
   window.addEventListener('hashchange', onHashChange)
   return () => window.removeEventListener('hashchange', onHashChange)
 }, [])

 // Mirror the current screen into the hash. This has to sit above the early
 // returns below — a hook that only runs on some renders is not allowed, and
 // the loading and login branches return before this point.
 //
 // replaceState rather than assigning location.hash, so moving between screens
 // does not pile up history entries the back button has to step through, and
 // a restored screen the current role cannot open is corrected in place.
 useEffect(() => {
   try {
     const allowed = effectiveRole === 'admin' ? ADMIN_PAGE_IDS : MEMBER_PAGE_IDS
     const target = allowed.includes(page)
       ? page
       : (effectiveRole === 'admin' ? 'overview' : 'home')
     if (pageFromHash() === target) return
     window.history.replaceState(null, '', `#/${target}`)
   } catch { /* hash unavailable — routing still works in memory */ }
 }, [page, effectiveRole])

 // If a member logs in and there's a pending ?workout= param, route to community.
 useEffect(() => {
   if (!user || effectiveRole === 'admin') return
   try {
     const url = new URL(window.location.href)
     if (url.searchParams.get('workout') && page !== 'community') {
       setPage('community')
     }
   } catch {}
 }, [user?.id, effectiveRole])

 // Sync auth's effective role → app role (must run every render regardless of user)
 useEffect(() => {
 if (effectiveRole && state.role !== effectiveRole) setRole(effectiveRole)
 }, [effectiveRole, state.role])

 // Sync Supabase profile.onboarded → local state. Fixes the bug where a
 // user who completed onboarding on device A gets bounced back to
 // onboarding when they open the app on device B (or after cache clear).
 useEffect(() => {
 if (user?.onboarded && !state.onboarded) {
 completeOnboarding(state.profile || {})
 }
 }, [user?.onboarded, state.onboarded])

 // Wait for Supabase session hydration before deciding login/app view
 if (loading) return (
 <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'#0f0d0b'}}>
 <SLoader size={200} />
 </div>
 )

 // Password recovery: user landed from reset-email link. Even though a session
 // exists (that's how Supabase authenticates the recovery), we MUST show the
 // LoginScreen so they can set a new password before entering the app.
 if (passwordRecovery) return <LoginScreen />

 // Not logged in → login screen
 if (!user) return <LoginScreen />

 const isAdminView = effectiveRole === 'admin'
 const isMemberView = user.role === 'member' && !isAdminView

 // Onboarding gate for members only — wrap in PilotGate so waitlisted
 // users see WaitlistScreen instead of onboarding. Health-ack gate wraps
 // BOTH onboarding and the shell so no member — new or already-in-system —
 // can use the app without signing the health/liability/privacy bundle.
 // Existing users who haven't signed yet will be prompted on their next open.
 if (isMemberView && !state.onboarded) {
   return (
     <HealthAckGate user={user}>
       <PilotGate user={user}><Onboarding /></PilotGate>
     </HealthAckGate>
   )
 }

 const memberPages = {
 home: <Home go={setPage} />,
 goals: <Goals go={setPage} />,
 progress: <Progress />,
 train: <Train />,
 'train-history': <TrainHistory />,
 'train-programs': <TrainProgramsLibrary />,
 'train-import': <PdfImporter />,
 rehab: <Rehab />,
 nutrition: <Nutrition />,
 mind: <Mind />,
 calendar: <Calendar />,
 store: <Store />,
 personal: <Personal />,
 ondemand: <OnDemand />,
 community: <Community />,
 reminders: <Reminders />,
 talk: <Talk />,
 profile: <Profile go={setPage} />,
 control: <ControlCenter go={setPage} />,
 }
 const adminPages = {
 overview: <Overview />,
 pilot: <AdminPilot />,
 personal: <PersonalRequests />,
 photos: <MemberPhotos />,
 requests: <CoachRequests />,
 members: <Members />,
 team: <Team />,
 billing: <Billing />,
 analytics: <Analytics />,
 alerts: <Alerts />,
 feedback: <AdminFeedback />,
 settings: <Settings />,
 }

 const pages = isAdminView ? adminPages : memberPages
 const defaultPage = isAdminView ? 'overview' : 'home'
 const validPage = pages[page] ? page : defaultPage

 const shellUI = (
 <>
 <Shell page={validPage} setPage={setPage}>
 {pages[validPage]}
 </Shell>
 <NotificationScheduler />
 {isMemberView && <TrainerCheckIn />}
 {isMemberView && <NewWorkoutToast />}
 {isMemberView && <AdminMessageToast />}
 {isMemberView && <NewSharedWorkoutToast onOpenCommunity={() => setPage('community')} />}
 {!isAdminView && (
 <FloatingAssistant
   onOpenMentalCoach={() => setPage('mind')}
   onNavigate={(page) => setPage(page)}
 />
 )}
 </>
 )

 // HealthAckGate now applies to EVERYONE — admin, coach, member.
 // The legal/health/privacy bundle must be signed once by every account
 // that accesses the platform; there is no bypass path. PilotGate only
 // applies to member view (waitlist cap doesn't apply to staff).
 return (
   <HealthAckGate user={user}>
     {isMemberView ? <PilotGate user={user}>{shellUI}</PilotGate> : shellUI}
   </HealthAckGate>
 )
}

// Pilot cap gate — resolves the user's pilot status, then either shows
// the waitlist blocker or renders children (rest of the app).
function PilotGate({ user, children }) {
 const [pilot, setPilot] = useState(null)
 useEffect(() => {
   let alive = true
   fetchMyPilotStatus(user.id).then(res => {
     if (alive) setPilot(res)
   })
   return () => { alive = false }
 }, [user?.id])
 if (!pilot) return (
   <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'#0f0d0b' }}>
     <SLoader size={200} />
   </div>
 )
 if (pilot.status === 'waitlisted') {
   return <WaitlistScreen position={pilot.waitlist_position} />
 }
 return children
}

// Verifies the member has signed the health/terms/privacy bundle.
// Checks localStorage first (fast path). If missing, checks Supabase.
// If both empty → renders <HealthAcknowledgment /> as a full-screen block.
function HealthAckGate({ user, children }) {
 const { updateProfile, state: appState } = useApp()
 const [state, setStateVal] = useState(() => readHealthAck() ? 'ok' : 'checking')

 useEffect(() => {
 if (state !== 'checking') return
 let alive = true
 ;(async () => {
 try {
 const remote = await fetchHealthAck(user.id)
 if (!alive) return
 if (remote) {
 // Mirror to local so future checks are instant
 try { localStorage.setItem('hfos:health_ack', JSON.stringify(remote)) } catch {}
 setStateVal('ok')
 } else {
 setStateVal('missing')
 }
 } catch {
 if (alive) setStateVal('missing')
 }
 })()
 return () => { alive = false }
 }, [state, user?.id])

 if (state === 'checking') return (
 <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'#0f0d0b' }}>
 <SLoader size={200} />
 </div>
 )

 if (state === 'missing') return (
 <div style={{ minHeight:'100vh', background: tokens.color.bg, padding: tokens.space.lg, direction:'rtl', color: tokens.color.text, display:'flex', alignItems:'center' }}>
 <div style={{ maxWidth: 900, margin:'0 auto', width:'100%' }}>
 <HealthAcknowledgment
 initialName={appState?.profile?.name || user?.name || ''}
 onConfirm={(record) => {
   // The name typed on the signature is the trainee's authoritative name —
   // adopt it as profile.name so the home greeting, coach view, and every
   // other name-dependent screen use it going forward. Only overwrite when
   // profile.name is empty (never destroy an existing profile name).
   if (record?.signerName && !appState?.profile?.name) {
     updateProfile({ name: record.signerName })
   }
   setStateVal('ok')
 }}
 />
 </div>
 </div>
 )

 return children
}

export default function App() {
 return (
 <I18nProvider>
 <AuthProvider>
 <AppProvider>
 <AppRouter />
 </AppProvider>
 </AuthProvider>
 </I18nProvider>
 )
}
