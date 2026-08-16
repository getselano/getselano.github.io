import React, { useState } from 'react'
import { t } from '../../theme/tokens'
import { useApp } from '../../store/AppStore'
import { useAuth } from '../../auth/AuthContext'
import { useI18n } from '../../i18n/i18n'
import { AdminMessageBell } from '../notifications/AdminMessageBell'

// Primary member navigation — the 5 tabs a trainee opens daily. Everything
// else moved under MEMBER_MORE_KEYS which renders as a dropdown/drawer.
const MEMBER_NAV_KEYS = [
 { key:'home', i18n:'nav.home' },
 { key:'train', i18n:'nav.train' },
 { key:'nutrition', i18n:'nav.nutrition' },
 { key:'progress', i18n:'nav.progress' },
 { key:'community', i18n:'nav.community' },
]

// Secondary items — reachable via the "עוד" (More) menu in top-bar/drawer.
// Kept as valid routes so old deep-links still work.
const MEMBER_MORE_KEYS = [
 { key:'mind', i18n:'nav.mind' },
 { key:'calendar', i18n:'nav.calendar' },
 { key:'ondemand', i18n:'nav.ondemand' },
 { key:'store', i18n:'nav.store' },
 { key:'personal', i18n:'nav.personal' },
 { key:'goals', i18n:'nav.goals' },
 { key:'rehab', i18n:'nav.rehab' },
 { key:'reminders', i18n:'nav.reminders' },
 { key:'talk', i18n:'nav.talk' },
 { key:'profile', i18n:'nav.profile' },
 { key:'control', i18n:'nav.control' },
]

const ADMIN_NAV_KEYS = [
 { key:'overview', i18n:'nav.overview' },
 { key:'pilot', i18n:'nav.pilot' },
 { key:'personal', i18n:'nav.personal_requests' },
 { key:'photos', i18n:'nav.member_photos' },
 { key:'requests', i18n:'nav.coach_requests' },
 { key:'members', i18n:'nav.members' },
 { key:'team', i18n:'nav.team' },
 { key:'billing', i18n:'nav.billing' },
 { key:'analytics', i18n:'nav.analytics' },
 { key:'alerts', i18n:'nav.alerts' },
 { key:'feedback', i18n:'nav.feedback' },
 { key:'settings', i18n:'nav.settings' },
]

export function Shell({ page, setPage, children }) {
 const { state } = useApp()
 const { user, logout, viewAs, setViewAs, effectiveRole } = useAuth()
 const { t: tr, isRTL } = useI18n()
 const isAdmin = user?.role === 'admin'// real admin
 const isAdminView = effectiveRole === 'admin'// currently viewing admin console
 const navKeys = isAdminView ? ADMIN_NAV_KEYS : MEMBER_NAV_KEYS
 const moreKeys = isAdminView ? [] : MEMBER_MORE_KEYS
 const nav = navKeys.map(n => ({ ...n, label: tr(n.i18n) }))
 const more = moreKeys.map(n => ({ ...n, label: tr(n.i18n) }))
 const [mobileOpen, setMobileOpen] = useState(false)

 const switchView = (role) => {
 setViewAs(role)
 // Reset to the default page for the new view
 setPage(role === 'admin'? 'overview':'home')
 setMobileOpen(false)
 }

 return (
 <div style={{ display:'flex', minHeight:'100vh', background: t.color.bg, color: t.color.text, direction: isRTL ? 'rtl':'ltr'}}>
 {/* Sidebar - desktop */}
 <aside className="hfos-sidebar"style={{
 width: 240, background: t.color.bgElevated, borderLeft:`1px solid ${t.color.border}`,
 padding: t.space.lg, display:'flex', flexDirection:'column', gap: t.space.md,
 position:'sticky', top: 0, height:'100vh',
 overflowY:'auto', overscrollBehavior:'contain',
 scrollBehavior:'smooth', scrollbarGutter:'stable',
 }}>
 <BrandBlock isAdmin={isAdminView} />
 <UserBlock user={user} onLogout={logout} onOpenProfile={isAdminView ? undefined : () => setPage('profile')} />
 {isAdmin && <ViewAsSwitcher effectiveRole={effectiveRole} onSwitch={switchView} />}
 <LanguageSwitcher />
 <nav style={{ display:'flex', flexDirection:'column', gap: 4, marginTop: 12 }}>
 {nav.map(item => (
 <NavItem key={item.key} item={item} active={page === item.key} onClick={() => setPage(item.key)} />
 ))}
 {more.length > 0 && (
   <MoreGroup items={more} activeKey={page} onPick={setPage} label={tr('nav.more')} />
 )}
 </nav>
 <div style={{
 marginTop:'auto', padding:'12px 4px',
 borderTop: `1px solid ${t.color.hairline}`,
 fontFamily: t.font.family.mono, fontSize: 9,
 letterSpacing:'0.24em', color: t.color.silver3,
 textTransform:'uppercase', textAlign:'center',
 }}>Selano · v0.2 · WOD Hub</div>
 </aside>

 {/* Mobile sidebar drawer */}
 {mobileOpen && (
 <div onClick={() => setMobileOpen(false)} style={{
 position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex: 900, display:'none',
 }} className="hfos-mobile-overlay">
 <aside onClick={e=>e.stopPropagation()} style={{
 width: 260, background: t.color.bgElevated, height:'100%',
 display:'flex', flexDirection:'column',
 overflowY:'auto', WebkitOverflowScrolling:'touch', overscrollBehavior:'contain',
 }}>
 <div style={{
 padding: t.space.lg,
 paddingBottom: `calc(${t.space.lg} + env(safe-area-inset-bottom))`,
 display:'flex', flexDirection:'column', gap: t.space.md,
 }}>
 <BrandBlock isAdmin={isAdminView} />
 <UserBlock user={user} onLogout={() => { logout(); setMobileOpen(false) }} onOpenProfile={isAdminView ? undefined : () => { setPage('profile'); setMobileOpen(false) }} />
 {isAdmin && <ViewAsSwitcher effectiveRole={effectiveRole} onSwitch={switchView} />}
 <LanguageSwitcher />
 {nav.map(item => (
 <NavItem key={item.key} item={item} active={page === item.key} onClick={() => { setPage(item.key); setMobileOpen(false) }} />
 ))}
 {more.length > 0 && (
   <MoreGroup
     items={more} activeKey={page}
     onPick={(k) => { setPage(k); setMobileOpen(false) }}
     label={tr('nav.more')}
     initiallyOpen={more.some(m => m.key === page)}
   />
 )}
 </div>
 </aside>
 </div>
 )}

 {/* Main */}
 <main style={{ flex: 1, minWidth: 0, display:'flex', flexDirection:'column'}}>
 <TopBar page={nav.find(n => n.key === page)} isAdmin={isAdmin} isAdminView={isAdminView} onNavigate={setPage} onMenu={() => setMobileOpen(true)} />
 <div className="hfos-content"style={{ padding: t.space.xl, maxWidth: 1400, width:'100%', margin:'0 auto', flex: 1 }}>
 {children}
 </div>
 {/* Mobile bottom nav - primary 4 tabs + "עוד"opens drawer */}
 <nav className="hfos-bottomnav"style={{
 display:'none', position:'fixed', bottom:0, left:0, right:0, background: t.color.bgElevated,
 borderTop:`1px solid ${t.color.border}`, padding:'6px 4px', gap: 2, justifyContent:'space-around',
 zIndex: 100, boxShadow:'0 -4px 16px rgba(0,0,0,.3)',
 }}>
 {getPrimaryNav(nav, page).map(item => {
 const active = page === item.key
 return (
 <button key={item.key} onClick={() => setPage(item.key)} style={{
 flex:1, padding:'14px 2px 12px', border:'none', background:'transparent',
 color: active ? t.color.wineLight : t.color.bone, cursor:'pointer',
 display:'flex', flexDirection:'column', alignItems:'center', gap: 4,
 fontFamily:'inherit', position:'relative',
 }}>
 <span style={{
 fontSize: 13, fontWeight: active ? 700 : 500,
 letterSpacing:'-0.005em',
 }}>{item.label}</span>
 {active && <span style={{
 position:'absolute', bottom: 4, width: 22, height: 2,
 background: t.color.wineLight, borderRadius: 1,
 }} />}
 </button>
 )
 })}
 {/* "עוד" button in mobile bottom-nav. Only needed for admin (which has
     more than 5 pages) — member's 5 tabs already fill the strip and secondary
     items live in the top-bar burger drawer. */}
 {isAdminView && (
 <button onClick={() => setMobileOpen(true)} style={{
 flex:1, padding:'14px 2px 12px', border:'none', background:'transparent',
 color: t.color.bone, cursor:'pointer',
 display:'flex', flexDirection:'column', alignItems:'center', gap: 4,
 fontFamily:'inherit',
 }}>
 <span style={{
 fontSize: 13, fontWeight: 500, letterSpacing:'-0.005em',
 }}>{tr('nav.more', isRTL ? 'עוד':'More')}</span>
 </button>
 )}
 </nav>
 </main>
 <ResponsiveStyle />
 </div>
 )
}

function LanguageSwitcher() {
 const { lang, setLang } = useI18n()
 return (
 <div style={{ display:'flex', background: t.color.bgSoft, borderRadius: t.radius.md, padding: 3, gap: 2 }}>
 {['he','en'].map(l => {
 const active = lang === l
 return (
 <button
 key={l}
 onClick={() => setLang(l)}
 style={{
 flex: 1, padding:'8px 6px',
 background: active ? t.color.bgCard :'transparent',
 border:'none', borderRadius: t.radius.sm,
 color: active ? t.color.gold : t.color.textDim,
 fontFamily:'inherit', fontWeight: 700, fontSize: t.font.xs,
 cursor:'pointer', letterSpacing: 0.5,
 }}
 >
 {l === 'he' ? 'עברית' : 'English'}
 </button>
 )
 })}
 </div>
 )
}

function BrandBlock({ isAdmin }) {
 return (
 <div style={{
 display:'flex', flexDirection:'column', alignItems:'flex-start',
 gap: 6, padding:'6px 4px 16px',
 borderBottom: `1px solid ${t.color.border}`,
 }}>
 <div style={{
 fontFamily: t.font.family.display,
 fontSize: 24, fontWeight: 700, letterSpacing:'-0.035em',
 color: t.color.white, lineHeight: 1,
 }}>
 <span style={{ color: t.color.wineLight }}>S</span>elano
 </div>
 <div style={{
 fontFamily: t.font.family.mono,
 fontSize: 9, letterSpacing:'0.28em',
 color: t.color.silver2, textTransform:'uppercase',
 }}>{isAdmin ? 'Admin Console' : 'Performance System'}</div>
 </div>
 )
}

function ViewAsSwitcher({ effectiveRole, onSwitch }) {
 const { isRTL } = useI18n()
 const roles = [
 { key:'admin', label: isRTL ? 'מנהל' : 'Admin', disabled: false },
 { key:'coach', label: isRTL ? 'מאמן' : 'Coach', disabled: true },
 { key:'member', label: isRTL ? 'מתאמן' : 'Member', disabled: false },
 ]
 return (
 <div>
 <div style={{
 fontFamily: t.font.family.mono, fontSize: 9,
 letterSpacing:'0.28em', color: t.color.silver2,
 marginBottom: 8, paddingRight: 4, textTransform:'uppercase',
 }}>{isRTL ? 'צפייה כ־' : 'View as'}</div>
 <div style={{
 display:'flex', background: t.color.panel, borderRadius: t.radius.md,
 padding: 3, gap: 2, border: `1px solid ${t.color.border}`,
 }}>
 {roles.map(r => {
 const active = effectiveRole === r.key
 const handleClick = () => {
 if (r.disabled) {
 alert(isRTL ? `תצוגת ${r.label} עדיין בבנייה.` : `${r.label} view coming soon.`)
 return
 }
 onSwitch(r.key)
 }
 return (
 <button
 key={r.key}
 onClick={handleClick}
 title={r.disabled
   ? (isRTL ? `${r.label} — בבנייה` : `${r.label} — coming soon`)
   : (isRTL ? `צפה כ־${r.label}` : `View as ${r.label}`)}
 style={{
 flex: 1, padding:'8px 4px', border:'none',
 cursor: r.disabled ? 'not-allowed':'pointer',
 background: active ? t.color.wineLight :'transparent',
 color: r.disabled ? t.color.silver3 : active ? t.color.white : t.color.silver1,
 fontWeight: active ? 700 : 500, borderRadius: t.radius.sm,
 fontFamily:'inherit', fontSize: 11, letterSpacing:'-0.005em',
 transition: t.transition,
 opacity: r.disabled ? 0.55 : 1,
 }}
 >{r.label}</button>
 )
 })}
 </div>
 </div>
 )
}

function UserBlock({ user, onLogout, onOpenProfile }) {
 const { isRTL } = useI18n()
 if (!user) return null
 const roleLabelMap = isRTL
   ? { admin: 'מנהל', coach: 'מאמן', member: 'מתאמן' }
   : { admin: 'Admin', coach: 'Coach', member: 'Member' }
 const roleLabel = roleLabelMap[user.role] || (isRTL ? 'משתמש' : 'User')
 const roleColor = { admin: t.color.gold, coach: t.color.info, member: t.color.success }[user.role]
 // Whole avatar+name area is a button when we have a profile handler. This
 // gives one-tap access from the sidebar to editing sex/weight/etc, which
 // otherwise lived under 'עוד' → 'פרופיל' — two extra taps.
 const canOpenProfile = typeof onOpenProfile === 'function'
 return (
 <div style={{
   background: t.color.bgSoft, borderRadius: t.radius.md, padding: 10,
   display:'flex', alignItems:'center', gap: 10,
 }}>
 <button
   onClick={canOpenProfile ? onOpenProfile : undefined}
   disabled={!canOpenProfile}
   title={canOpenProfile ? (isRTL ? 'פתח פרופיל' : 'Open profile') : undefined}
   style={{
     display:'flex', alignItems:'center', gap: 10, flex: 1, minWidth: 0,
     background:'transparent', border:'none', padding: 0,
     cursor: canOpenProfile ? 'pointer' : 'default',
     color:'inherit', fontFamily:'inherit', textAlign:'right',
   }}
 >
   <div style={{
     width: 32, height: 32, borderRadius:'50%', background: roleColor, color:'#0d0d14',
     display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 700, fontSize: 13, flexShrink: 0,
   }}>{(user.name || user.email)[0]?.toUpperCase() || '?'}</div>
   <div style={{ flex: 1, minWidth: 0 }}>
     <div style={{ fontSize: 12, fontWeight: 700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
     <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
       <span style={{ fontSize: 10, color: roleColor, fontWeight: 600 }}>{roleLabel}</span>
       {canOpenProfile && (
         <span style={{
           fontSize: 9, color: t.color.silver3, fontFamily: t.font.family.mono,
           letterSpacing:'0.14em', textTransform:'uppercase',
         }}>· {isRTL ? 'פרופיל' : 'profile'}</span>
       )}
     </div>
   </div>
 </button>
 <button onClick={onLogout} title={isRTL ? 'יציאה' : 'Log out'} style={{
   background:'transparent', border: `1px solid ${t.color.border}`, color: t.color.textDim,
   borderRadius: 6, padding:'4px 8px', cursor:'pointer', fontFamily:'inherit', fontSize: 11,
 }}>{isRTL ? 'יציאה' : 'Log out'}</button>
 </div>
 )
}

// Accordion group that shows the secondary "More" nav items. Auto-opens if
// the currently-active page is one of the items inside so a user landing on a
// deep-linked "More" page sees where it lives.
function MoreGroup({ items, activeKey, onPick, label, initiallyOpen }) {
  const activeIsInside = items.some(it => it.key === activeKey)
  const [open, setOpen] = React.useState(initiallyOpen ?? activeIsInside)
  React.useEffect(() => { if (activeIsInside) setOpen(true) }, [activeIsInside])
  return (
    <div style={{ marginTop: 4 }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display:'flex', alignItems:'center', gap: 12, padding:'11px 14px', width:'100%', textAlign:'right',
        background:'transparent', border:'none',
        color: t.color.silver1, cursor:'pointer',
        borderRadius: t.radius.md, fontFamily:'inherit',
        fontSize: 14, letterSpacing:'-0.005em',
        fontWeight: 400,
      }}>
        <span style={{ width: 3, height: 16, borderRadius: 2, background:'transparent', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{label || 'עוד'}</span>
        <span style={{ fontSize: 10, color: t.color.silver3, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition:'transform .18s' }}>▾</span>
      </button>
      {open && (
        <div style={{
          display:'flex', flexDirection:'column', gap: 2,
          padding:'4px 0 4px 16px',
          borderInlineStart: `1px solid ${t.color.hairline}`,
          marginInlineStart: 16, marginTop: 2,
        }}>
          {items.map(it => (
            <button key={it.key} onClick={() => onPick(it.key)} style={{
              display:'block', width:'100%', textAlign:'right',
              padding:'8px 12px', background:'transparent', border:'none',
              color: activeKey === it.key ? t.color.white : t.color.silver2,
              cursor:'pointer', fontFamily:'inherit', fontSize: 13,
              borderRadius: t.radius.sm,
              fontWeight: activeKey === it.key ? 600 : 400,
            }}>{it.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function NavItem({ item, active, onClick }) {
 const isTalk = item.key === 'talk'
 return (
 <button onClick={onClick} style={{
 display:'flex', alignItems:'center', gap: 12, padding:'11px 14px', width:'100%', textAlign:'right',
 background: isTalk && !active ? 'rgba(199,64,80,0.06)' : 'transparent',
 border: isTalk && !active ? '1px solid rgba(199,64,80,0.25)' : 'none',
 color: active ? t.color.white : t.color.silver1,
 cursor:'pointer', borderRadius: t.radius.md, fontFamily:'inherit',
 fontSize: 14, letterSpacing:'-0.005em',
 transition: t.transition, fontWeight: active ? 600 : (isTalk ? 600 : 400),
 position:'relative',
 }}>
 <span style={{
 width: 3, height: 16, borderRadius: 2,
 background: active ? t.color.wineLight :'transparent',
 flexShrink: 0,
 }} />
 <span style={{ flex: 1 }}>{item.label}</span>
 {isTalk && (
 <span style={{
 width: 6, height: 6, borderRadius: '50%',
 background: t.color.wineLight,
 boxShadow: '0 0 8px rgba(199,64,80,0.6)',
 flexShrink: 0,
 }} />
 )}
 </button>
 )
}

function TopBar({ page, isAdmin, isAdminView, onNavigate, onMenu }) {
 const { isRTL } = useI18n()
 return (
 <header className="hfos-topbar"style={{
 display:'flex', alignItems:'center', justifyContent:'space-between',
 padding:'14px 20px', borderBottom: `1px solid ${t.color.border}`,
 background: `${t.color.bgElevated}aa`, backdropFilter:'blur(10px)', position:'sticky', top: 0, zIndex: 50,
 }}>
 <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
 <button
   className="hfos-menu-btn"
   onClick={onMenu}
   title={isRTL ? 'תפריט' : 'Menu'}
   aria-label={isRTL ? 'תפריט' : 'Menu'}
   style={{
     display:'none', background:'transparent', border:`1px solid ${t.color.border}`,
     color: t.color.silver1, padding:'8px 10px', borderRadius: t.radius.sm,
     cursor:'pointer', fontFamily:'inherit',
     alignItems:'center', justifyContent:'center',
   }}
 >
   <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
     <path d="M3 5h14M3 10h14M3 15h14"/>
   </svg>
 </button>
 <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
 <div className="hfos-page-title">
 <div style={{
 fontFamily: t.font.family.display, fontSize: 18, fontWeight: 600,
 letterSpacing:'-0.02em', color: t.color.white,
 }}>{page?.label}</div>
 </div>
 </div>
 </div>
 <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
 {!isAdminView && <AdminMessageBell onNavigate={onNavigate} />}
 <button style={{
 background: t.color.bgSoft, border:`1px solid ${t.color.border}`, borderRadius: t.radius.pill,
 padding:'5px 12px', color: t.color.text, cursor:'pointer', fontFamily:'inherit', fontSize: t.font.xs,
 display:'flex', alignItems:'center', gap: 6,
 }}>
 <span style={{ width: 7, height: 7, background: t.color.success, borderRadius:'50%'}} />
 {isRTL ? 'מחובר' : 'Online'}
 </button>
 </div>
 </header>
 )
}

function ResponsiveStyle() {
 return (
 <style>{`
 /* Thin, discreet scrollbar for the desktop sidebar */
 .hfos-sidebar {
 scrollbar-width: thin;
 scrollbar-color: rgba(199,64,80,0.28) transparent;
 }
 .hfos-sidebar::-webkit-scrollbar { width: 6px; }
 .hfos-sidebar::-webkit-scrollbar-track { background: transparent; }
 .hfos-sidebar::-webkit-scrollbar-thumb {
 background: rgba(199,64,80,0.28);
 border-radius: 999px;
 transition: background 0.2s;
 }
 .hfos-sidebar:hover::-webkit-scrollbar-thumb { background: rgba(199,64,80,0.5); }
 @media (max-width: 900px) {
 .hfos-sidebar { display: none !important; }
 .hfos-bottomnav { display: flex !important; }
 .hfos-mobile-overlay { display: block !important; }
 .hfos-menu-btn { display: inline-flex !important; }
 .hfos-page-title { display: none !important; }
 .hfos-content { padding: 14px !important; padding-bottom: 100px !important; }
 }
 `}</style>
 )
}

// Choose 4 primary items for the mobile bottom nav.
// Always includes the current page so the user sees where they are.
function getPrimaryNav(nav, currentPage) {
 // Member app: the 5 tabs ARE the primary — show all of them at the bottom.
 // Admin app: prioritize daily-use dashboard pages; a "More" button covers rest.
 const isAdmin = nav[0]?.key === 'overview'
 if (!isAdmin) {
   // Member has 5 items → show all 5 in bottom nav (no "More" button needed on
   // the strip, though it still exists as a drawer trigger).
   return nav.slice(0, 5)
 }
 const priorityAdmin = ['overview','members','requests','alerts']
 const primary = nav.filter(n => priorityAdmin.includes(n.key))
 if (!primary.find(n => n.key === currentPage)) {
   const curr = nav.find(n => n.key === currentPage)
   if (curr) primary[3] = curr
 }
 return primary.slice(0, 4)
}
