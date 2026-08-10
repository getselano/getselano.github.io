import React, { useMemo, useState } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Card, Button, Input, Select, Badge, SectionHeader, Tabs, Modal, EmptyState, ProgressBar } from '../../../components/ui/UI'
import { Sparkline } from '../../../components/charts/Charts'
import { exercises, MUSCLE_GROUPS, EQUIPMENT, CATEGORIES, LEVELS, workoutSplits } from '../../../data/exercises'
import { programs, programCategories, KEY_LIFTS, computeWeight, formatPrescription } from '../../../data/programs'
import { todayKey, DAYS_HE } from '../../../utils/date'
import { PdfImporter } from './PdfImporter'
import { DisclaimerNote } from '../../../components/legal/DisclaimerNote'
import { ExerciseGuideButton } from './ExerciseGuide'
import { workoutEvent, googleCalendarUrl, downloadICS } from '../../../utils/calendar'
import { distributeWeek, weekDates, nextSundayOf } from '../../../utils/weekSchedule'
import { WorkoutComplete } from '../../../components/celebration/WorkoutComplete'
import { adjustmentFor, applyDemographicToExercise, adjustmentBadge, RESEARCH_REFS } from '../../../utils/demographicAdjustment'
import { PlanBuilder } from '../goals/PlanBuilder'
import {
 DIFFICULTY_LEVELS, DIFFICULTY_LABELS,
 detectStyle, currentWeekOf, weekCompletion, isPlanCycleComplete,
 applyDifficultyToSession, difficultyProfile,
} from '../../../utils/weekProgression'
import { WodHub } from './disciplines/WodHub'
import { BodybuildingHub } from './bodybuilding/BodybuildingHub'
import { useI18n } from '../../../i18n/i18n'
import { Kicker, SectionHead, Label, StatRow, Button as SButton, WeightDisplay } from '../../../design/components/primitives'

export function Train() {
 const [tab, setTab] = useState('plan')
 const { t: tr } = useI18n()
 return (
 <>
 <DisclaimerNote kind="training" />
 <Tabs tabs={[
 { key:'plan', label: tr('train.tab.plan') },
 { key:'bb', label: tr('train.tab.bb','אימוני כוח') },
 { key:'crossfit', label: tr('train.tab.crossfit') },
 { key:'programs', label: tr('train.tab.programs') },
 { key:'import', label: tr('train.tab.import') },
 { key:'history', label: tr('train.tab.history') },
 ]} active={tab} onChange={setTab} />
 {tab === 'plan'&& <MyPlan />}
 {tab === 'bb'&& <BodybuildingHub />}
 {tab === 'crossfit'&& <WodHub />}
 {tab === 'programs'&& <ProgramsLibrary />}
 {tab === 'import'&& <PdfImporter />}
 {tab === 'history'&& <History />}
 </>
 )
}

function MyPlan() {
 const { state, logWorkout, setWeekDifficulty, startNewCycle, resumePlan, removeArchivedPlan, closePlan } = useApp()
 const [session, setSession] = useState(null)
 const [celebration, setCelebration] = useState(null)
 const [buildingPlan, setBuildingPlan] = useState(false)
 const [showResearch, setShowResearch] = useState(false)
 const [expanded, setExpanded] = useState(false) // collapsed by default (user request)
 const [previewPlan, setPreviewPlan] = useState(null) // archive plan being previewed
 const plan = state.plan
 const archive = state.plansArchive || []
 const demo = adjustmentFor({ sex: state.profile?.sex, age: state.profile?.age })

 // Empty state with CTA + archive if exists
 if (!plan) return <EmptyPlanScreen archive={archive} onBuildPlan={() => setBuildingPlan(true)} onResume={resumePlan} onRemove={removeArchivedPlan} building={buildingPlan} setBuilding={setBuildingPlan} />

 const style = detectStyle(plan)
 const currentWeek = currentWeekOf(plan, state.workoutLogs)
 const completion = weekCompletion(plan, state.workoutLogs, currentWeek)
 const cycleDone = isPlanCycleComplete(plan, state.workoutLogs)
 const difficulty = plan.difficultyByWeek?.[currentWeek] || 'medium'
 const profile = difficultyProfile(style, difficulty)

 // Overall plan completion + last workout
 const planLogs = (state.workoutLogs || []).filter(l => l.planId === plan.id || l.planId === plan.programId)
 const totalExpected = (plan.days || 3) * (plan.weeks || 12)
 const overallPct = totalExpected > 0 ? Math.round((planLogs.length / totalExpected) * 100) : 0
 const lastLog = planLogs[0] // logs are prepended in reducer
 const lastWorkoutDate = lastLog?.date ? new Date(lastLog.date).toLocaleDateString('he-IL') : null

 // Apply BOTH difficulty AND demographic adjustment
 const displaySessions = plan.sessions.map(s => {
 const withDiff = applyDifficultyToSession(s, style, difficulty, currentWeek)
 return {
 ...withDiff,
 exercises: (withDiff.exercises || []).map(e => applyDemographicToExercise(e, demo)),
 }
 })

 // Inline plan builder replaces the whole view while active
 if (buildingPlan) {
 return <PlanBuilder onDone={() => setBuildingPlan(false)} onCancel={() => setBuildingPlan(false)} />
 }

 const handleClosePlan = () => {
 if (confirm(`לסגור את "${plan.name}"? התכנית תעבור לארכיון ותוכל להחזיר אותה בהמשך.`)) {
 closePlan()
 }
 }

 return (
 <div style={{ display:'grid', gap: 16 }}>
 {/* COLLAPSED SUMMARY (always visible) */}
 <ActivePlanSummary
 plan={plan} overallPct={overallPct} weekPct={completion.pct}
 currentWeek={currentWeek} totalWeeks={plan.weeks}
 lastWorkoutDate={lastWorkoutDate}
 expanded={expanded}
 onToggle={() => setExpanded(v => !v)}
 onClose={handleClosePlan}
 onNewPlan={() => setBuildingPlan(true)}
 />

 {/* EXPANDED DETAIL (only when open) */}
 {expanded && <>
 <WeekBanner
 plan={plan} currentWeek={currentWeek} completion={completion}
 difficulty={difficulty} style={style} profile={profile}
 onSetDifficulty={(d) => setWeekDifficulty(currentWeek, d)}
 />

 {cycleDone && (
 <Card style={{ padding: 20, background: `linear-gradient(135deg, ${t.color.success}22 0%, ${t.color.gold}22 100%)`, border: `1px solid ${t.color.gold}` }}>
 <div style={{ display:'flex', gap: 14, alignItems:'center', flexWrap:'wrap'}}>
 <div style={{ fontSize: 40 }}> </div>
 <div style={{ flex: 1, minWidth: 220 }}>
 <div style={{ fontWeight: 800, fontSize: t.font.lg, marginBottom: 4 }}>
 כל הכבוד! סיימת מחזור של {plan.weeks} שבועות{plan.cycle ? ` (מחזור ${plan.cycle})` :''}
 </div>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim }}>
 עדכן את היכולת המירבית שלך (פרופיל → 1RM) והתחל מחזור חדש עם משקלים חדשים
 </div>
 </div>
 <Button icon="" onClick={() => { if (confirm('להתחיל מחזור חדש?')) startNewCycle() }}>
 התחל מחזור חדש
 </Button>
 </div>
 </Card>
 )}

 {/* Demographic adjustment badge */}
 {demo && (state.profile?.sex || state.profile?.age) && (
 <Card style={{ padding: 12, background: `${t.color.info}12`, border: `1px solid ${t.color.info}` }}>
 <div style={{ display:'flex', gap: 10, alignItems:'center', flexWrap:'wrap'}}>
 <span style={{ fontSize: 22 }}> </span>
 <div style={{ flex: 1, minWidth: 200 }}>
 <div style={{ fontSize: t.font.sm, fontWeight: 700, color: t.color.info }}>מותאם לך: {adjustmentBadge(demo)}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 2 }}>{demo.focusHint}</div>
 {demo.caution && <div style={{ fontSize: t.font.xs, color: t.color.warning, marginTop: 4 }}> {demo.caution}</div>}
 {demo.specialNotes.map((n, i) => <div key={i} style={{ fontSize: t.font.xs, color: t.color.gold, marginTop: 4 }}>{n.note}</div>)}
 </div>
 <button onClick={() => setShowResearch(true)} style={{
 background:'transparent', border: `1px solid ${t.color.info}`, color: t.color.info,
 padding:'4px 10px', borderRadius: 12, cursor:'pointer', fontSize: t.font.xs, fontFamily:'inherit',
 }}> מקורות</button>
 </div>
 </Card>
 )}

 <WeeklySchedule plan={{ ...plan, sessions: displaySessions }} onOpenSession={setSession} />

 <UpcomingWeeks
 plan={plan}
 currentWeek={currentWeek}
 style={style}
 difficultyByWeek={plan.difficultyByWeek || {}}
 onSetDifficulty={setWeekDifficulty}
 />
 </>}

 {/* Plans archive - always visible */}
 {archive.length > 0 && (
 <Card>
 <SectionHeader
 title="התכניות הקודמות שלך"
 subtitle={`${archive.length} תכניות בארכיון · לחיצה פותחת תצוגה מקדימה`}
 action={
 <button
 onClick={() => {
 if (confirm(`למחוק את כל ${archive.length} התכניות מהארכיון? הפעולה בלתי הפיכה.`)) {
 archive.forEach(p => removeArchivedPlan(p.id))
 }
 }}
 style={{
 background:'transparent', border:`1px solid ${t.color.danger}`,
 color: t.color.danger, cursor:'pointer',
 padding:'6px 12px', borderRadius: t.radius.sm,
 fontFamily:'inherit', fontSize: 12, fontWeight: 600,
 }}
 >מחק הכל</button>
 }
 />
 <div style={{ display:'grid', gap: 8 }}>
 {archive.map(p => {
 const daysSince = p.archivedAt ? Math.floor((Date.now() - new Date(p.archivedAt).getTime()) / 86400000) : 0
 const lastUsedLabel = daysSince === 0 ? 'היום': daysSince === 1 ? 'אתמול': `לפני ${daysSince} ימים`
 return (
 <div
 key={p.id}
 style={{
 display:'flex', gap: 12, alignItems:'center', width:'100%',
 padding: 12, background: t.color.bgSoft, borderRadius: t.radius.md,
 color: t.color.text, transition: t.transition,
 }}
 onMouseEnter={e => e.currentTarget.style.background = t.color.bgCard}
 onMouseLeave={e => e.currentTarget.style.background = t.color.bgSoft}
 >
 <div style={{
 width: 44, height: 44, borderRadius:'50%',
 background: p.completionPct >= 75 ? `${t.color.success}33` : p.completionPct >= 40 ? `${t.color.gold}33` : `${t.color.warning}33`,
 display:'flex', alignItems:'center', justifyContent:'center',
 fontWeight: 900, fontSize: t.font.sm,
 color: p.completionPct >= 75 ? t.color.success : p.completionPct >= 40 ? t.color.gold : t.color.warning,
 flexShrink: 0,
 }}>{p.completionPct}%</div>
 <button
 onClick={() => setPreviewPlan(p)}
 style={{
 flex: 1, minWidth: 0, background:'transparent', border:'none',
 color: t.color.text, cursor:'pointer', textAlign:'right',
 fontFamily:'inherit', padding: 0,
 }}
 >
 <div style={{ fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
 {p.sessionsDone}/{p.sessionsExpected} אימונים · שימוש אחרון: {lastUsedLabel}
 </div>
 </button>
 <button
 onClick={() => { if (confirm(`למחוק את התכנית "${p.name}" לצמיתות?`)) removeArchivedPlan(p.id) }}
 title="מחק תכנית"
 aria-label="מחק תכנית"
 style={{
 background:'transparent', border:`1px solid ${t.color.border}`,
 color: t.color.danger, cursor:'pointer',
 padding:'8px 12px', borderRadius: t.radius.sm,
 fontFamily:'inherit', fontSize: 12, fontWeight: 700,
 display:'inline-flex', alignItems:'center', gap: 6,
 transition: t.transition,
 }}
 onMouseEnter={e => { e.currentTarget.style.background = `${t.color.danger}18`; e.currentTarget.style.borderColor = t.color.danger }}
 onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = t.color.border }}
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"/>
 </svg>
 מחק
 </button>
 <button
 onClick={() => setPreviewPlan(p)}
 aria-label="פתח תצוגה מקדימה"
 style={{
 background:'transparent', border:'none', color: t.color.textMuted,
 cursor:'pointer', fontSize: 22, padding: '4px 8px',
 }}
 >›</button>
 </div>
 )
 })}
 </div>
 </Card>
 )}

 {/* Archive plan preview modal */}
 {previewPlan && (
 <ArchivedPlanPreview
 archivedPlan={previewPlan}
 activePlan={plan}
 onClose={() => setPreviewPlan(null)}
 onResume={() => {
 resumePlan(previewPlan.id)
 setPreviewPlan(null)
 setExpanded(true)
 }}
 />
 )}

 {/* Research modal */}
 {showResearch && (
 <div onClick={() => setShowResearch(false)} style={{
 position:'fixed', inset: 0, background:'rgba(0,0,0,.8)', zIndex: 1000,
 display:'grid', placeItems:'center', padding: 20,
 }}>
 <div onClick={e => e.stopPropagation()} style={{
 maxWidth: 560, width:'100%', maxHeight:'80vh', overflow:'auto',
 background: t.color.bgElevated, borderRadius: t.radius.lg, padding: 24, direction:'rtl',
 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14 }}>
 <h2 style={{ fontSize: t.font.xl, fontWeight: 800 }}> מחקרים שההתאמה מבוססת עליהם</h2>
 <button onClick={() => setShowResearch(false)} style={{
 background: t.color.bgSoft, border:'none', color: t.color.text,
 width: 32, height: 32, borderRadius:'50%', cursor:'pointer',
 }}> </button>
 </div>
 <div style={{ display:'grid', gap: 10 }}>
 {RESEARCH_REFS.map(r => (
 <div key={r.id} style={{ padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm, fontSize: t.font.sm, lineHeight: 1.5 }}>
 {r.label}
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 <SessionRunner session={session} onClose={() => setSession(null)} onFinish={(log) => {
 logWorkout({ ...log, date: new Date().toISOString() })
 // Compute a rough streak (consecutive days with a workout)
 const dates = new Set([todayKey(), ...state.workoutLogs.map(l => l.date?.slice(0, 10))])
 let streak = 0
 const d = new Date()
 while (dates.has(d.toISOString().slice(0, 10))) {
 streak++
 d.setDate(d.getDate() - 1)
 }
 // Refresh week completion using the new log
 const nextCompletion = { done: completion.done + 1, total: completion.total, pct: Math.min(100, Math.round(((completion.done + 1) / completion.total) * 100)) }
 nextCompletion.complete = nextCompletion.pct >= 75
 setCelebration({
 sessionName: log.sessionName,
 weekCompletion: nextCompletion,
 currentWeek,
 streak,
 })
 setSession(null)
 }} />

 <WorkoutComplete
 open={!!celebration}
 onClose={() => setCelebration(null)}
 sessionName={celebration?.sessionName}
 weekCompletion={celebration?.weekCompletion}
 currentWeek={celebration?.currentWeek}
 streak={celebration?.streak || 0}
 />
 </div>
 )
}

// ─── Weekly schedule with rest days + one-click ICS export ─────────
function WeeklySchedule({ plan, onOpenSession }) {
 const week = distributeWeek(plan)
 const workoutDays = week.filter(d => d.type === 'workout').length

 // Export the whole week to a downloadable .ics file (all workouts,
 // one file, imports into any calendar app)
 const exportWeek = () => {
 const start = nextSundayOf()
 const dates = weekDates(start)
 const events = week
 .filter(d => d.type === 'workout')
 .map(d => {
 const dt = new Date(dates[d.dayIdx])
 dt.setHours(18, 0, 0, 0) // default 18:00
 return workoutEvent({ session: d.session, date: dt, plan })
 })
 downloadICS(events, `שבוע-${plan.name}.ics`)
 }

 const exportGoogleWeek = () => {
 const start = nextSundayOf()
 const dates = weekDates(start)
 week.filter(d => d.type === 'workout').forEach((d, idx) => {
 const dt = new Date(dates[d.dayIdx])
 dt.setHours(18, 0, 0, 0)
 // Stagger window opens so browsers don't block
 setTimeout(() => window.open(googleCalendarUrl(workoutEvent({ session: d.session, date: dt, plan })),'_blank'), idx * 300)
 })
 }

 return (
 <Card>
 <SectionHeader
 title={plan.name}
 subtitle={`${plan.split || plan.days + 'ימים'} · ${plan.weeks} שבועות · חלוקה מומלצת עם ימי מנוחה`}
 />

 {/* One-click week-to-calendar export */}
 <div style={{
 padding: 14, background: t.color.goldGlow, borderRadius: t.radius.md,
 border: `1px solid ${t.color.gold}`, marginBottom: 14,
 display:'flex', gap: 12, alignItems:'center', flexWrap:'wrap',
 }}>
 <div style={{ fontSize: 28 }}> </div>
 <div style={{ flex: 1, minWidth: 180 }}>
 <div style={{ fontWeight: 800, color: t.color.gold, marginBottom: 2 }}>
 הוסף את כל השבוע ליומן בקליק אחד
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
 {workoutDays} אימונים · שבוע קרוב · ברירת מחדל 18:00
 </div>
 </div>
 <Button icon="" onClick={exportWeek}>הורד ICS</Button>
 <Button variant="outline"icon="G"onClick={exportGoogleWeek}>Google Calendar</Button>
 </div>

 {/* Weekly day-by-day grid */}
 <div style={{ display:'grid', gap: 8 }}>
 {week.map((day, i) => (
 <DayRow key={i} day={day} plan={plan} onOpen={onOpenSession} />
 ))}
 </div>
 </Card>
 )
}

function DayRow({ day, plan, onOpen }) {
 const isWorkout = day.type === 'workout'
 const s = day.session
 // Legacy programs (from data/programs.js) expose exercises as `blocks`;
 // adopted plans expose them as `exercises`. Normalize here.
 const rowExercises = s?.exercises?.length ? s.exercises : (s?.blocks || [])
 return (
 <div style={{
 display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 12, alignItems:'stretch',
 padding: 12,
 background: isWorkout ? t.color.bgCard : t.color.bgSoft,
 border: `1px solid ${isWorkout ? t.color.border :'transparent'}`,
 borderRadius: t.radius.md,
 cursor: isWorkout ? 'pointer':'default',
 opacity: isWorkout ? 1 : 0.7,
 }} onClick={() => isWorkout && onOpen(s)}>
 {/* Day label vertical */}
 <div style={{
 width: 48, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
 background: isWorkout ? t.color.goldGlow :'transparent',
 borderRadius: t.radius.sm, padding:'8px 4px',
 border: `1px solid ${isWorkout ? t.color.gold : t.color.border}`,
 }}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>יום</div>
 <div style={{ fontSize: t.font.lg, fontWeight: 900, color: isWorkout ? t.color.gold : t.color.textDim }}>{day.dayShort}</div>
 </div>

 {/* Content */}
 <div style={{ display:'grid', gap: 4, alignSelf:'center'}}>
 {isWorkout ? (
 <>
 <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap'}}>
 <div style={{ fontWeight: 800, fontSize: t.font.md }}>{s.name}</div>
 {s.wodType && <Badge color={t.color.danger}>{s.wodType}</Badge>}
 {rowExercises.some(e => e.supersetWith) && <Badge color={t.color.info}> סופרסט</Badge>}
 {rowExercises.some(e => e.dropSetOnLast) && <Badge color={t.color.danger}> דרופסט</Badge>}
 {rowExercises.some(e => e.amrap) && <Badge color={t.color.warning}> AMRAP</Badge>}
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
{rowExercises.length} תרגילים · לחץ להתחלה
 </div>
 </>
 ) : (
 <>
 <div style={{ fontWeight: 700, fontSize: t.font.md, color: t.color.textDim }}> מנוחה</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textMuted }}>{day.reason}</div>
 </>
 )}
 </div>

 {/* Icon */}
 <div style={{ alignSelf:'center', fontSize: 22 }}>
 {isWorkout ? '' :''}
 </div>
 </div>
 )
}

function SessionRunner({ session, onClose, onFinish }) {
 const { state } = useApp()
 const [log, setLog] = useState(() => buildInitialLog(session, state.workoutLogs))
 const [restRemaining, setRestRemaining] = useState(0)
 const [restTotal, setRestTotal] = useState(90)
 const timerRef = React.useRef(null)

 React.useEffect(() => {
 if (session) setLog(buildInitialLog(session, state.workoutLogs))
 }, [session])

 React.useEffect(() => {
 if (restRemaining <= 0) return
 timerRef.current = setInterval(() => setRestRemaining(r => r - 1), 1000)
 return () => clearInterval(timerRef.current)
 }, [restRemaining])

 const startRest = (seconds = 90) => { setRestTotal(seconds); setRestRemaining(seconds) }
 const skipRest = () => setRestRemaining(0)

 if (!session) return null

 return (
 <Modal open={!!session} onClose={onClose} title={`אימון: ${session.name}`} width={720}>
 {restRemaining > 0 && (
 <div style={{
 position:'sticky', top: 0, zIndex: 10, marginBottom: 12, padding: 14,
 background:`linear-gradient(90deg, ${t.color.gold}22 0%, ${t.color.gold}44 ${100 - (restRemaining/restTotal)*100}%, ${t.color.bgSoft} ${100 - (restRemaining/restTotal)*100}%)`,
 border:`1px solid ${t.color.gold}`, borderRadius: t.radius.md,
 display:'flex', alignItems:'center', gap: 12,
 }}>
 <div style={{ fontSize: 24 }}>⏱️</div>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>מנוחה</div>
 <div style={{ fontSize: t.font.xxl, fontWeight: 800, color: t.color.gold, fontFamily:'Space Mono, monospace'}}>
 {Math.floor(restRemaining/60)}:{String(restRemaining%60).padStart(2,'0')}
 </div>
 </div>
 <Button variant="ghost"size="sm"onClick={skipRest}>דלג</Button>
 </div>
 )}

 {/* Explainer for advanced techniques */}
 {(log.some(e => e.supersetWith) || log.some(e => e.dropSetOnLast) || log.some(e => e.restPause)) && (
 <div style={{
 background: `${t.color.info}11`, border: `1px solid ${t.color.info}`,
 borderRadius: t.radius.md, padding: 12, marginBottom: 12,
 fontSize: t.font.sm, color: t.color.text, lineHeight: 1.7,
 }}>
 <b style={{ color: t.color.info, display:'block', marginBottom: 6 }}>ℹ️ באימון הזה יש טכניקות מתקדמות:</b>
 {log.some(e => e.supersetWith) && <div> <b>סופרסט:</b> בצע סט של תרגיל א׳ → מיד סט של תרגיל ב׳ (ללא מנוחה) → מנוחה → חזור.</div>}
 {log.some(e => e.dropSetOnLast) && <div> <b>דרופסט:</b> בסט האחרון — סיים כרגיל → הורד את המשקל ב-40% מיד → חזרות עד כשל.</div>}
 {log.some(e => e.restPause) && <div> <b>Rest-Pause:</b> אחרי הסט האחרון — 15 שנ׳ מנוחה → עד כשל → 15 שנ׳ → עד כשל.</div>}
 </div>
 )}

 <div style={{ display:'grid', gap: 14 }}>
 {log.map((ex, i) => {
 // Find superset partner (name-based)
 const partnerIdx = ex.supersetWith ? log.findIndex(e => e.name === ex.supersetWith) : -1
 const partner = partnerIdx >= 0 ? log[partnerIdx] : null
 return (
 <Card key={i} style={{
 padding: 16,
 borderColor: ex.supersetWith ? t.color.info : t.color.border,
 borderWidth: ex.supersetWith ? 2 : 1,
 }}>
 {/* Superset partner banner */}
 {partner && (
 <div style={{
 background: `${t.color.info}22`, border: `1px solid ${t.color.info}`,
 borderRadius: t.radius.sm, padding:'6px 10px', marginBottom: 10,
 fontSize: t.font.xs, color: t.color.info, fontWeight: 600,
 }}>
 סופרסט עם: <b>{partner.name}</b>
 </div>
 )}

 {/* Rest-Pause banner */}
 {ex.restPause && (
 <div style={{
 background: `${t.color.warning}22`, border: `1px solid ${t.color.warning}`,
 borderRadius: t.radius.sm, padding:'6px 10px', marginBottom: 10,
 fontSize: t.font.xs, color: t.color.warning, fontWeight: 600,
 }}>
 Rest-Pause בסט האחרון
 </div>
 )}

 {/* Dropset banner */}
 {ex.dropSetOnLast && (
 <div style={{
 background: `${t.color.danger}22`, border: `1px solid ${t.color.danger}`,
 borderRadius: t.radius.sm, padding:'6px 10px', marginBottom: 10,
 fontSize: t.font.xs, color: t.color.danger, fontWeight: 600,
 }}>
 דרופסט בסט האחרון — הורד 40% משקל → חזרות עד כשל
 </div>
 )}

 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10, gap: 8, flexWrap:'wrap'}}>
 <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
 <div>
 <div style={{ fontWeight: 700 }}>{ex.name}</div>
 {ex.format && <Badge color={ex.format === 'strength'? t.color.gold : ex.format === 'metcon'? t.color.danger : t.color.textDim} style={{ marginTop: 4 }}>{ex.format}</Badge>}
 </div>
 <ExerciseGuideButton exerciseId={ex.id} exerciseName={ex.name} />
 </div>
 <div style={{ textAlign:'left'}}>
 <Badge>{ex.sets.length}×{ex.reps || 8}</Badge>
 {ex.intensity && (
 <div style={{ fontSize: t.font.xs, color: t.color.gold, marginTop: 4, fontFamily:'Space Mono, monospace'}}>
 @ {Math.round((Array.isArray(ex.intensity) ? ex.intensity[0] : ex.intensity) * 100)}%
 {ex.suggestedWeight ? ` = ${ex.suggestedWeight} ק״ג` :''}
 </div>
 )}
 </div>
 </div>

 {ex.prescription && !ex.sets.some(s => s.w) && (
 <div style={{ padding: 8, background: t.color.bgSoft, borderRadius: t.radius.sm, marginBottom: 10, fontSize: t.font.xs, color: t.color.textDim, fontFamily:'Space Mono, monospace'}}>
 {ex.prescription}
 </div>
 )}

 <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr', gap: 8, alignItems:'center'}}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>סט</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>משקל</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>חזרות</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>RPE</div>
 {ex.sets.map((s, j) => (
 <React.Fragment key={j}>
 <div style={{ color: t.color.gold, fontWeight: 700 }}>{j+1}</div>
 <Input value={s.w} onChange={e => updateSet(i, j,'w', e.target.value)} placeholder={ex.suggestedWeight ? `${ex.suggestedWeight}` :'ק״ג'} />
 <Input value={s.r} onChange={e => updateSet(i, j,'r', e.target.value)} placeholder={String(ex.reps || 8)} />
 <div style={{ display:'flex', gap: 4 }}>
 <Input value={s.rpe} onChange={e => updateSet(i, j,'rpe', e.target.value)} placeholder="1-10"/>
 <button type="button"onClick={() => startRest(90)} title="התחל מנוחה 90ש׳"style={{
 background: t.color.bgSoft, border:`1px solid ${t.color.border}`, color: t.color.gold,
 borderRadius: t.radius.sm, cursor:'pointer', padding:'0 10px', fontSize: 16,
 }}>⏱</button>
 </div>
 </React.Fragment>
 ))}
 {ex.suggestedWeight && !ex.sets.some(s => s.w) && (
 <div style={{ gridColumn:'1 / -1', fontSize: t.font.xs, color: t.color.textDim, marginTop: 4 }}>
 באימון האחרון: <b style={{ color: t.color.gold }}>{ex.suggestedWeight} ק״ג</b>
 </div>
 )}
 </div>
 </Card>
 )
 })}
 </div>
 <div style={{ display:'flex', gap: 10, justifyContent:'flex-end', marginTop: 20 }}>
 <Button variant="ghost"onClick={onClose}>בטל</Button>
 <Button onClick={() => onFinish({ sessionName: session.name, exercises: log })}>סיים ורשום </Button>
 </div>
 </Modal>
 )

 function updateSet(i, j, key, val) {
 setLog(l => l.map((ex, ii) => ii !== i ? ex : { ...ex, sets: ex.sets.map((s, jj) => jj !== j ? s : { ...s, [key]: val }) }))
 }
}

// ─── Superset / Dropset UI helpers ─────────────────────────
// Groups the log array into blocks: either { type:'single', exercise, index }
// or { type:'superset', exercises:[A,B], indexes:[i,j] }
function groupBySuperset(log) {
 const consumed = new Set()
 const result = []
 for (let i = 0; i < log.length; i++) {
 if (consumed.has(i)) continue
 const ex = log[i]
 if (ex.supersetWith) {
 const j = log.findIndex((e, k) => k !== i && !consumed.has(k) && e.name === ex.supersetWith)
 if (j >= 0) {
 consumed.add(i); consumed.add(j)
 result.push({ type:'superset', exercises: [ex, log[j]], indexes: [i, j] })
 continue
 }
 }
 consumed.add(i)
 result.push({ type:'single', exercise: ex, index: i })
 }
 return result
}

function supersetLetter(gi) {
 // A, B, C… based on the sequence order of supersets in the workout
 return String.fromCharCode(65 + gi)
}

function AdvancedTechniquesHelp({ hasSuperset, hasDropset, hasRestPause }) {
 const [open, setOpen] = React.useState(false)
 return (
 <Card style={{
 background: `${t.color.info}11`, borderColor: t.color.info, marginBottom: 12,
 }}>
 <button
 onClick={() => setOpen(v => !v)}
 style={{
 width:'100%', background:'transparent', border:'none',
 color: t.color.info, fontWeight: 700, fontSize: t.font.sm,
 textAlign:'right', cursor:'pointer', fontFamily:'inherit',
 display:'flex', justifyContent:'space-between', alignItems:'center',
 }}
 >
 <span>ℹ️ באימון הזה יש טכניקות מתקדמות — לחץ להסבר</span>
 <span>{open ? '▲':'▼'}</span>
 </button>
 {open && (
 <div style={{ marginTop: 12, fontSize: t.font.sm, color: t.color.text, lineHeight: 1.7, display:'grid', gap: 10 }}>
 {hasSuperset && (
 <div>
 <b style={{ color: t.color.info }}> סופרסט (A1 + A2):</b>
 <div style={{ marginTop: 4, color: t.color.textDim, fontSize: t.font.xs }}>
 בצע סט של תרגיל A1 (למשל 10 חזרות), ומיד בלי מנוחה עבור לסט של A2. סיימת סט של A2 — עכשיו מנוחה מלאה. חזור לסט הבא של A1. זה חוסך זמן ומגביר גירוי מטבולי.
 </div>
 </div>
 )}
 {hasDropset && (
 <div>
 <b style={{ color: t.color.danger }}> דרופסט (DROP):</b>
 <div style={{ marginTop: 4, color: t.color.textDim, fontSize: t.font.xs }}>
 בסט האחרון — סיים כרגיל, ואז מיד הורד את המשקל ב-30-40% והמשך עד כשל. אין מנוחה בין הסט הרגיל לסט הדרופ. מטרה: הגברת נפח וגירוי היפרטרופיה.
 </div>
 </div>
 )}
 {hasRestPause && (
 <div>
 <b style={{ color: t.color.warning }}> Rest-Pause:</b>
 <div style={{ marginTop: 4, color: t.color.textDim, fontSize: t.font.xs }}>
 אחרי הסט האחרון: 15 שניות מנוחה בלבד → כמה שיותר חזרות עד כשל → 15 שניות מנוחה → שוב עד כשל. סוחט את היחידות המוטוריות עד הסוף.
 </div>
 </div>
 )}
 </div>
 )}
 </Card>
 )
}

function SupersetPair({ label, exercises, indexes, updateSet, startRest }) {
 return (
 <Card style={{
 background: `${t.color.info}08`, borderColor: t.color.info, borderWidth: 2,
 padding: 12, position:'relative',
 }}>
 {/* Superset label */}
 <div style={{
 position:'absolute', top: -12,
 insetInlineStart: 16,
 background: t.color.info, color:'#0d0d14',
 padding:'2px 12px', borderRadius: t.radius.pill,
 fontWeight: 900, fontSize: t.font.xs, letterSpacing: 1,
 }}> סופרסט {label}</div>

 <div style={{ fontSize: t.font.xs, color: t.color.info, marginTop: 6, marginBottom: 10, fontWeight: 600 }}>
 בצע סט של {label}1 → מיד סט של {label}2 → מנוחה → חזור
 </div>

 <div style={{ display:'grid', gap: 10 }}>
 {exercises.map((ex, k) => (
 <div key={k} style={{
 padding: 12, background: t.color.bgSoft,
 border: `1px solid ${t.color.border}`, borderRadius: t.radius.sm,
 position:'relative',
 }}>
 {/* A1 / A2 tag */}
 <div style={{
 position:'absolute', top: -8, insetInlineStart: 12,
 background: t.color.info, color:'#0d0d14',
 padding:'1px 8px', borderRadius: 4,
 fontSize: t.font.xs, fontWeight: 900,
 }}>{label}{k + 1}</div>
 <ExerciseCardBody
 ex={ex}
 i={indexes[k]}
 updateSet={updateSet}
 startRest={startRest}
 compact
 />
 </div>
 ))}
 </div>
 </Card>
 )
}

function ExerciseCard({ ex, i, updateSet, startRest }) {
 return (
 <Card style={{ padding: 16 }}>
 <ExerciseCardBody ex={ex} i={i} updateSet={updateSet} startRest={startRest} />
 </Card>
 )
}

function ExerciseCardBody({ ex, i, updateSet, startRest, compact }) {
 return (
 <>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10, gap: 8, flexWrap:'wrap'}}>
 <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
 <div>
 <div style={{ fontWeight: 700, fontSize: compact ? t.font.sm : t.font.md }}>{ex.name}</div>
 {ex.format && <Badge color={ex.format === 'strength'? t.color.gold : ex.format === 'metcon'? t.color.danger : t.color.textDim} style={{ marginTop: 4 }}>{ex.format}</Badge>}
 </div>
 <ExerciseGuideButton exerciseId={ex.id} exerciseName={ex.name} />
 </div>
 <div style={{ textAlign:'left'}}>
 <Badge>{ex.sets.length}×{ex.reps || 8}</Badge>
 {ex.intensity && (
 <div style={{ fontSize: t.font.xs, color: t.color.gold, marginTop: 4, fontFamily:'Space Mono, monospace'}}>
 @ {Math.round((Array.isArray(ex.intensity) ? ex.intensity[0] : ex.intensity) * 100)}%
 {ex.suggestedWeight ? ` = ${ex.suggestedWeight} ק״ג` :''}
 </div>
 )}
 </div>
 </div>

 {/* Rest-Pause banner (per exercise) */}
 {ex.restPause && (
 <div style={{
 background: `${t.color.warning}22`, border: `1px solid ${t.color.warning}`,
 borderRadius: t.radius.sm, padding: 8, marginBottom: 10,
 fontSize: t.font.xs, color: t.color.warning, fontWeight: 600,
 }}>
 Rest-Pause בסט האחרון: 15 שנ׳ מנוחה → כמה שיותר → 15 שנ׳ → כמה שיותר
 </div>
 )}

 {ex.prescription && !ex.sets.some(s => s.w) && (
 <div style={{ padding: 8, background: t.color.bgSoft, borderRadius: t.radius.sm, marginBottom: 10, fontSize: t.font.xs, color: t.color.textDim, fontFamily:'Space Mono, monospace'}}>
 {ex.prescription}
 </div>
 )}

 <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr', gap: 8, alignItems:'center'}}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>סט</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>משקל</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>חזרות</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>RPE</div>
 {ex.sets.map((s, j) => (
 <React.Fragment key={j}>
 <div style={{ color: t.color.gold, fontWeight: 700 }}>{j+1}</div>
 <Input value={s.w} onChange={e => updateSet(i, j,'w', e.target.value)} placeholder={ex.suggestedWeight ? `${ex.suggestedWeight}` :'ק״ג'} />
 <Input value={s.r} onChange={e => updateSet(i, j,'r', e.target.value)} placeholder={String(ex.reps || 8)} />
 <div style={{ display:'flex', gap: 4 }}>
 <Input value={s.rpe} onChange={e => updateSet(i, j,'rpe', e.target.value)} placeholder="1-10"/>
 <button type="button"onClick={() => startRest(90)} title="התחל מנוחה 90ש׳"style={{
 background: t.color.bgSoft, border:`1px solid ${t.color.border}`, color: t.color.gold,
 borderRadius: t.radius.sm, cursor:'pointer', padding:'0 10px', fontSize: 16,
 }}>⏱</button>
 </div>
 </React.Fragment>
 ))}

 {/* DROP SET row - visible after regular sets when dropSetOnLast is on */}
 {ex.dropSetOnLast && (() => {
 const lastWeight = ex.sets[ex.sets.length - 1]?.w
 const dropWeight = lastWeight ? Math.round(+lastWeight * 0.6 / 2.5) * 2.5 : (ex.suggestedWeight ? Math.round(ex.suggestedWeight * 0.6 / 2.5) * 2.5 :'')
 return (
 <>
 <div style={{ color: t.color.danger, fontWeight: 900 }}> DROP</div>
 <Input value={ex._dropWeight || ''} onChange={e => updateSet(i, ex.sets.length,'_dropWeight', e.target.value)} placeholder={dropWeight ? `${dropWeight} (60%)` :'הורד 40%'} style={{ borderColor: t.color.danger }} />
 <Input value={ex._dropReps || ''} onChange={e => updateSet(i, ex.sets.length,'_dropReps', e.target.value)} placeholder="עד כשל"style={{ borderColor: t.color.danger }} />
 <div style={{ fontSize: t.font.xs, color: t.color.danger, alignSelf:'center'}}>
 מיד אחרי הסט האחרון
 </div>
 <div style={{ gridColumn:'1 / -1', fontSize: t.font.xs, color: t.color.danger, marginTop: 2 }}>
 סיים את הסט האחרון → הורד את המשקל ב-40% מיד → חזרות עד כשל טכני
 </div>
 </>
 )
 })()}

 {ex.suggestedWeight && !ex.sets.some(s => s.w) && (
 <div style={{ gridColumn:'1 / -1', fontSize: t.font.xs, color: t.color.textDim, marginTop: 4 }}>
 באימון האחרון: <b style={{ color: t.color.gold }}>{ex.suggestedWeight} ק״ג</b> · המלצה להעלות 2.5 ק״ג אם ה-RPE היה מתחת ל-8
 </div>
 )}
 </div>
 </>
 )
}

function Library() {
 const [q, setQ] = useState('')
 const [muscle, setMuscle] = useState('')
 const [cat, setCat] = useState('')
 const [lvl, setLvl] = useState('')
 const [eq, setEq] = useState('')

 const filtered = useMemo(() => exercises.filter(e =>
 (!q || e.name.includes(q)) &&
 (!muscle || e.muscle === muscle) &&
 (!cat || e.category === cat) &&
 (!lvl || e.level === lvl) &&
 (!eq || e.equipment === eq)
 ), [q, muscle, cat, lvl, eq])

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card style={{ padding: 16 }}>
 <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', gap: 10 }} className="hfos-grid-5">
 <Input value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש תרגיל..." />
 <Select value={muscle} onChange={e => setMuscle(e.target.value)}>
 <option value="">שריר</option>{MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
 </Select>
 <Select value={cat} onChange={e => setCat(e.target.value)}>
 <option value="">קטגוריה</option>{CATEGORIES.map(m => <option key={m} value={m}>{m}</option>)}
 </Select>
 <Select value={lvl} onChange={e => setLvl(e.target.value)}>
 <option value="">רמה</option>{LEVELS.map(m => <option key={m} value={m}>{m}</option>)}
 </Select>
 <Select value={eq} onChange={e => setEq(e.target.value)}>
 <option value="">ציוד</option>{EQUIPMENT.map(m => <option key={m} value={m}>{m}</option>)}
 </Select>
 </div>
 </Card>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
 {filtered.map(ex => (
 <Card key={ex.id} hover style={{ padding: 18 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 8, gap: 8 }}>
 <div style={{ fontWeight: 700, fontSize: t.font.lg }}>{ex.name}</div>
 <div style={{ display:'flex', gap: 6, alignItems:'center'}}>
 {ex.yt && <Badge color="#ff0000">▶</Badge>}
 <Badge>{ex.level}</Badge>
 </div>
 </div>
 <div style={{ display:'flex', gap: 6, flexWrap:'wrap', marginBottom: 12 }}>
 <Badge color={t.color.gold}>{ex.muscle}</Badge>
 <Badge color={t.color.textDim}>{ex.category}</Badge>
 <Badge color={t.color.textDim}>{ex.equipment}</Badge>
 </div>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, borderTop:`1px solid ${t.color.border}`, paddingTop: 10, marginBottom: 10 }}> {ex.tips}</div>
 <ExerciseGuideButton exerciseId={ex.id} exerciseName={ex.name} />
 </Card>
 ))}
 {!filtered.length && <EmptyState icon="" title="לא נמצאו תרגילים"subtitle="נסה לשנות את הפילטרים"/>}
 </div>
 <style>{`@media (max-width: 900px) { .hfos-grid-5 { grid-template-columns: 1fr 1fr !important; } }`}</style>
 </div>
 )
}

function Builder() {
 const { state, setPlan } = useApp()
 const [splitKey, setSplitKey] = useState('upper_lower')
 const [weeks, setWeeks] = useState(state.profile.targetPeriodWeeks || 8)
 const [level, setLevel] = useState(state.profile.experience || 'בינוני')

 const preview = useMemo(() => buildPlan({ splitKey, weeks, level, goalKey: state.profile.goalKey }), [splitKey, weeks, level, state.profile.goalKey])

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card>
 <SectionHeader title="מחולל תכניות חכם"subtitle="בונה תכנית מותאמת לפי מטרה, רמה ותקופה"/>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
 <Select label="פיצול"value={splitKey} onChange={e => setSplitKey(e.target.value)}>
 {Object.entries(workoutSplits).map(([k,v]) => <option key={k} value={k}>{v.label} ({v.days} ימים)</option>)}
 </Select>
 <Select label="רמה"value={level} onChange={e => setLevel(e.target.value)}>
 {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
 </Select>
 <Input type="number"label="שבועות"value={weeks} onChange={e => setWeeks(+e.target.value)} min={4} max={52} />
 </div>
 </Card>

 <Card>
 <SectionHeader title="תצוגה מקדימה"subtitle={`${preview.days} ימי אימון בשבוע · ${preview.weeks} שבועות`}
 action={<Button onClick={() => setPlan(preview)}>אמץ תכנית </Button>} />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
 {preview.sessions.map((s, i) => (
 <div key={i} style={{ padding: 14, background: t.color.bgSoft, borderRadius: t.radius.md, border:`1px solid ${t.color.border}` }}>
 <div style={{ fontWeight: 700, marginBottom: 8, color: t.color.gold }}>יום {i+1} · {s.name}</div>
 <div style={{ display:'grid', gap: 4 }}>
 {s.exercises.map((e, j) => (
 <div key={j} style={{ fontSize: t.font.sm, display:'flex', justifyContent:'space-between'}}>
 <span>{e.name}</span>
 <span style={{ color: t.color.textDim }}>{e.sets}×{e.reps}</span>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </Card>
 </div>
 )
}

function buildPlan({ splitKey, weeks, level, goalKey }) {
 const split = workoutSplits[splitKey]
 const goalRepMap = { cut:12, recomp:8, maintain:10, lean_bulk:8, bulk:6 }
 const baseReps = goalRepMap[goalKey] || 8
 const setsByLevel = {'מתחיל':3,'בינוני':4,'מתקדם':5 }
 const sets = setsByLevel[level] || 3

 const sessions = split.sessions.map(name => {
 const focus = name.toLowerCase()
 let picks
 if (focus.includes('דחיפה')) picks = ['bench','ohp','dip','pushup','triceps_pd','lateral']
 else if (focus.includes('משיכה')) picks = ['pullup','row','curl','face_pull','rdl']
 else if (focus.includes('רגליים') || focus.includes('תחתון')) picks = ['squat','rdl','leg_press','lunge','hip_thrust','plank']
 else if (focus.includes('חזה')) picks = ['bench','dip','pushup','lateral']
 else if (focus.includes('גב')) picks = ['pullup','row','face_pull','curl']
 else if (focus.includes('כתפ')) picks = ['ohp','lateral','face_pull']
 else if (focus.includes('ידיים')) picks = ['curl','triceps_pd','dip']
 else if (focus.includes('אינטרוול') || focus.includes('hiit')) picks = ['kb_swing','burpee','row_erg','pushup']
 else if (focus.includes('liss') || focus.includes('אירובי')) picks = ['bike','run','row_erg']
 else if (focus.includes('עליון')) picks = ['bench','row','ohp','pullup','curl','triceps_pd']
 else picks = ['squat','bench','row','ohp','plank','lunge']
 const exs = picks.map(id => {
 const e = exercises.find(x => x.id === id)
 return e ? { id: e.id, name: e.name, sets, reps: baseReps } : null
 }).filter(Boolean)
 return { name, exercises: exs }
 })

 return {
 name: `${split.label} · ${weeks} שבועות`,
 split: split.label,
 days: split.days,
 weeks,
 currentWeek: 1,
 sessions,
 createdAt: new Date().toISOString(),
 }
}

function ProgramsLibrary() {
 const { state, setPlan } = useApp()
 const [selected, setSelected] = useState(null)
 const [cat, setCat] = useState('all')
 const oneRMs = state.profile.oneRMs || {}
 const hasOneRMs = Object.keys(oneRMs).length > 0

 const shown = cat === 'all'
 ? Object.values(programs)
 : programCategories.find(c => c.id === cat)?.programs.map(id => programs[id]) || []

 const adopt = (prog) => {
 // Materialize the program into a plan format that MyPlan can render.
 const plan = {
 name: prog.label,
 programId: prog.id,
 split: prog.schema,
 days: prog.daysPerWeek,
 weeks: prog.duration,
 currentWeek: 1,
 sessions: prog.sessions.map(s => ({
 name: s.name,
 wodType: s.wodType,
 prescription: s.prescription,
 exercises: (s.blocks || []).map(b => ({
 id: b.lift || b.name,
 name: b.lift ? KEY_LIFTS[b.lift]?.label : b.name,
 sets: b.sets || 1,
 reps: b.reps || 8,
 intensity: b.intensity,
 format: b.format,
 prescription: b.prescription,
 wodType: b.wodType,
 suggestedWeight: b.lift ? computeWeight(b, oneRMs) : null,
 })),
 })),
 createdAt: new Date().toISOString(),
 }
 setPlan(plan)
 setSelected(null)
 alert(`התכנית ${prog.label} אומצה. עבור לטאב "התכנית שלי"`)
 }

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card style={{ background:`linear-gradient(135deg, ${t.color.bgCard} 0%, ${t.color.bgElevated} 100%)`, padding: 24 }}>
 <Badge> מאגר תכניות מהעולם</Badge>
 <h2 style={{ marginTop: 10, fontSize: t.font.xxl, fontWeight: 800 }}>תכניות אמיתיות שעובדות</h2>
 <div style={{ color: t.color.textDim, marginTop: 6 }}>
 מ-Starting Strength ל-Wendler 5/3/1 ועד METCONS ו-GVT - כל תכנית בנויה על אחוזים מ-1RM שלך.
 </div>
 {!hasOneRMs && (
 <div style={{ marginTop: 14, padding: 12, background:`${t.color.warning}15`, borderRadius: t.radius.sm, border:`1px solid ${t.color.warning}` }}>
 <div style={{ fontSize: t.font.sm, color: t.color.warning, fontWeight: 700 }}> עדיין לא הגדרת 1RM</div>
 <div style={{ fontSize: t.font.sm, color: t.color.text, marginTop: 4 }}>
 בלי 1RM נראה רק אחוזים ולא ק״ג. עבור ל-<b>פרופיל → יכולת מירבית</b> להזין ערכים.
 </div>
 </div>
 )}
 </Card>

 <div style={{ display:'flex', gap: 6, flexWrap:'wrap'}}>
 <CatChip label="הכל"active={cat === 'all'} onClick={() => setCat('all')} />
 {programCategories.map(c => (
 <CatChip key={c.id} label={c.label} active={cat === c.id} onClick={() => setCat(c.id)} />
 ))}
 </div>

 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
 {shown.map(p => (
 <Card key={p.id} hover style={{ padding: 20, cursor:'pointer'}} onClick={() => setSelected(p)}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 10 }}>
 <div>
 <div style={{ fontWeight: 800, fontSize: t.font.lg }}>{p.label}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 2 }}>{p.author} · {p.origin}</div>
 </div>
 <Badge color={t.color.gold}>{p.daysPerWeek}×/שב׳</Badge>
 </div>
 <div style={{ display:'flex', gap: 6, flexWrap:'wrap', marginBottom: 10 }}>
 <Badge color={t.color.textDim}>{p.level}</Badge>
 <Badge color={t.color.info}>{p.duration} שבועות</Badge>
 </div>
 <div style={{ fontSize: t.font.sm, color: t.color.gold, fontWeight: 600, marginBottom: 6 }}>{p.goal}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, lineHeight: 1.5 }}>{p.schema}</div>
 </Card>
 ))}
 </div>

 <ProgramModal open={!!selected} onClose={() => setSelected(null)} program={selected} onAdopt={adopt} oneRMs={oneRMs} />
 </div>
 )
}

function CatChip({ label, active, onClick }) {
 return (
 <button onClick={onClick} style={{
 padding:'8px 16px', borderRadius: t.radius.pill,
 background: active ? t.color.gold : t.color.bgSoft,
 color: active ? '#0d0d14': t.color.textDim,
 border:`1px solid ${active ? t.color.gold : t.color.border}`,
 fontFamily:'inherit', cursor:'pointer', fontWeight: 600, fontSize: t.font.sm,
 }}>{label}</button>
 )
}

function ProgramModal({ open, onClose, program, onAdopt, oneRMs }) {
 if (!program) return null
 return (
 <Modal open={open} onClose={onClose} title={program.label} width={760}>
 <div style={{ marginBottom: 14 }}>
 <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginBottom: 10 }}>
 <Badge color={t.color.gold}>{program.author}</Badge>
 <Badge color={t.color.textDim}>{program.origin}</Badge>
 <Badge color={t.color.info}>{program.level}</Badge>
 <Badge color={t.color.success}>{program.daysPerWeek} ימים/שבוע · {program.duration} שבועות</Badge>
 </div>
 <div style={{ color: t.color.gold, fontWeight: 600, marginBottom: 6 }}>{program.goal}</div>
 <div style={{ color: t.color.text, lineHeight: 1.6, marginBottom: 8 }}>{program.description}</div>
 <div style={{ padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm, fontSize: t.font.sm, color: t.color.textDim }}>
 <b style={{ color: t.color.text }}>סכימה:</b> {program.schema}
 </div>
 </div>

 <div style={{ display:'grid', gap: 12 }}>
 {program.sessions.map((s, i) => (
 <div key={i} style={{ padding: 14, background: t.color.bgSoft, borderRadius: t.radius.md }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
 <div style={{ fontWeight: 700, color: t.color.gold, fontSize: t.font.lg }}>{s.name}</div>
 {s.wodType && <Badge color={t.color.danger}>{s.wodType}{s.timeCap ? ` · ${s.timeCap} דק׳` :''}</Badge>}
 </div>
 {s.prescription && (
 <div style={{ padding: 10, background: t.color.bg, borderRadius: t.radius.sm, marginBottom: 10, fontFamily:'Space Mono, monospace', fontSize: t.font.sm, whiteSpace:'pre-wrap'}}>
 {s.prescription}
 </div>
 )}
 {s.description && <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 10, fontStyle:'italic'}}>{s.description}</div>}
 {(s.rxTime || s.rxRounds) && (
 <div style={{ fontSize: t.font.xs, color: t.color.gold, marginBottom: 10 }}>
 יעד ברמת RX: {s.rxTime || s.rxRounds}
 </div>
 )}
 {s.blocks && s.blocks.length > 0 && (
 <div style={{ display:'grid', gap: 6 }}>
 {s.blocks.map((b, j) => (
 <div key={j} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: 8, background: t.color.bg, borderRadius: t.radius.sm }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 600, fontSize: t.font.sm }}>
 {b.lift ? KEY_LIFTS[b.lift]?.label : b.name}
 </div>
 {b.format && <Badge color={b.format === 'strength'? t.color.gold : b.format === 'metcon'? t.color.danger : t.color.textDim} style={{ marginTop: 4 }}>{b.format}</Badge>}
 </div>
 <div style={{ textAlign:'left', fontFamily:'Space Mono, monospace', fontSize: t.font.sm, color: t.color.gold }}>
 {formatPrescription(b, oneRMs)}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>

 {program.notes && program.notes.length > 0 && (
 <div style={{ marginTop: 16, padding: 12, background: t.color.goldGlow, borderRadius: t.radius.sm, border:`1px solid ${t.color.gold}` }}>
 <div style={{ fontWeight: 700, color: t.color.gold, marginBottom: 8 }}> הוראות מנחות</div>
 <div style={{ display:'grid', gap: 4 }}>
 {program.notes.map((n, i) => <div key={i} style={{ fontSize: t.font.sm }}>• {n}</div>)}
 </div>
 </div>
 )}

 <div style={{ display:'flex', gap: 10, justifyContent:'flex-end', marginTop: 20 }}>
 <Button variant="ghost"onClick={onClose}>סגור</Button>
 <Button onClick={() => onAdopt(program)}>אמץ תכנית זו </Button>
 </div>
 </Modal>
 )
}

function buildInitialLog(session, priorLogs) {
 if (!session) return []
  const source = (session.exercises && session.exercises.length)
   ? session.exercises
   : (session.blocks || []).map(b => ({
       id: b.lift || b.name,
       name: b.lift ? (KEY_LIFTS[b.lift]?.label || b.lift) : b.name,
       sets: b.sets || 3,
       reps: b.reps || 8,
       intensity: b.intensity,
       format: b.format,
     }))
 return source.map(e => {
 const lastEntry = findLastEntry(priorLogs, e.id || e.name)
 const suggestedWeight = lastEntry ? topWeight(lastEntry) : null
 return {
 ...e,
 suggestedWeight,
 sets: Array.from({ length: e.sets || 3 }, () => ({ w:'', r:'', rpe:''})),
 }
 })
}

function findLastEntry(logs, exId) {
 for (const log of logs) {
 for (const ex of log.exercises || []) {
 if (ex.id === exId || ex.name === exId) return ex
 }
 }
 return null
}

function topWeight(ex) {
 const w = (ex.sets || []).map(s => +s.w).filter(x => !isNaN(x) && x > 0)
 return w.length ? Math.max(...w) : null
}

function History() {
 const { state, deleteWorkoutLog, deleteWorkoutLogsByPlan, clearAllWorkoutLogs, restoreWorkoutLog, purgeWorkoutTrash } = useApp()
 const { workoutLogs, workoutLogsTrash } = state
 const trash = workoutLogsTrash || []
 const [showTrash, setShowTrash] = useState(false)

 // Group logs by planId so user can wipe a whole plan's history in one shot
 const byPlan = useMemo(() => {
   const groups = {}
   for (const log of workoutLogs) {
     const key = log.planId || '__no_plan__'
     if (!groups[key]) groups[key] = { planId: log.planId || null, name: null, logs: [] }
     groups[key].logs.push(log)
   }
   // Best-effort plan name — from state.plan or the first log's sessionName
   const activePlanId = state.plan?.id || state.plan?.programId
   for (const g of Object.values(groups)) {
     if (g.planId === activePlanId && state.plan) g.name = state.plan.name
     else if (g.planId) g.name = g.logs[0]?.sessionName?.split(' — ')[0] || `תכנית ${g.planId}`
     else g.name = 'ללא שיוך לתכנית'
   }
   return Object.values(groups).sort((a, b) => b.logs.length - a.logs.length)
 }, [workoutLogs, state.plan])

 if (!workoutLogs.length && !trash.length) {
   return <EmptyState title="עדיין אין היסטוריה" subtitle="אימונים שתסיים ירשמו כאן אוטומטית"/>
 }

 const removeOne = (log) => {
   const label = log.sessionName || 'אימון זה'
   if (confirm(`למחוק את ${label} מ־${new Date(log.date).toLocaleDateString('he-IL')}? נשמר בסל המיחזור לשחזור.`)) {
     deleteWorkoutLog(log.id || log.date)
   }
 }
 const removePlan = (group) => {
   if (confirm(`למחוק את כל ${group.logs.length} האימונים של "${group.name}"? נשמרים בסל המיחזור לשחזור.`)) {
     deleteWorkoutLogsByPlan(group.planId)
   }
 }
 const clearAll = () => {
   if (confirm(`למחוק את כל ההיסטוריה (${workoutLogs.length} אימונים)? נשמרת בסל המיחזור.`)) {
     clearAllWorkoutLogs()
   }
 }
 const purge = () => {
   if (confirm(`למחוק לצמיתות את סל המיחזור? ${trash.length} אימונים יימחקו ללא אפשרות שחזור.`)) {
     purgeWorkoutTrash()
   }
 }

 return (
 <div style={{ display:'grid', gap: 16 }}>
   {workoutLogs.length > 0 && (
     <>
       {/* Actions bar */}
       <div style={{
         display:'flex', gap: 8, flexWrap:'wrap', alignItems:'center',
         padding:'12px 14px', background: t.color.bgSoft,
         border:`1px solid ${t.color.border}`, borderRadius: t.radius.md,
       }}>
         <div style={{ flex: 1, minWidth: 140 }}>
           <div style={{ fontWeight: 700, fontSize: t.font.md }}>
             {workoutLogs.length} אימונים בהיסטוריה
           </div>
           <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
             {byPlan.length} {byPlan.length === 1 ? 'תכנית' : 'תכניות'}
             {trash.length > 0 && <> · {trash.length} בסל המיחזור</>}
           </div>
         </div>
         {trash.length > 0 && (
           <Button variant="ghost" size="sm" onClick={() => setShowTrash(v => !v)}>
             {showTrash ? 'סגור סל' : `סל מיחזור (${trash.length})`}
           </Button>
         )}
         <Button variant="danger" size="sm" onClick={clearAll}>
           מחק את כל ההיסטוריה
         </Button>
       </div>

       {/* Grouped by plan */}
       {byPlan.map(group => (
         <Card key={group.planId || 'nogroup'}>
           <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
             <div>
               <div style={{ fontWeight: 700, fontSize: t.font.md, color: t.color.wineLight }}>
                 {group.name}
               </div>
               <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 2 }}>
                 {group.logs.length} {group.logs.length === 1 ? 'אימון' : 'אימונים'}
               </div>
             </div>
             {group.planId && (
               <Button variant="ghost" size="sm" onClick={() => removePlan(group)}>
                 מחק את התכנית
               </Button>
             )}
           </div>
           <div style={{ display:'grid', gap: 6 }}>
             {group.logs.map(log => (
               <div key={log.id || log.date} style={{
                 display:'flex', justifyContent:'space-between', alignItems:'center',
                 gap: 10, padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm,
               }}>
                 <div style={{ flex: 1, minWidth: 0 }}>
                   <div style={{ fontWeight: 600, fontSize: t.font.sm }}>{log.sessionName}</div>
                   <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
                     {new Date(log.date).toLocaleDateString('he-IL')} · {log.exercises?.length || 0} תרגילים
                     {log.bbMeta?.durationMin ? ` · ${log.bbMeta.durationMin} דק׳` : ''}
                   </div>
                 </div>
                 <button
                   onClick={() => removeOne(log)}
                   title="מחק אימון בודד"
                   aria-label="מחק אימון בודד"
                   style={{
                     background:'transparent', border:`1px solid ${t.color.border}`,
                     color: t.color.silver1, cursor:'pointer',
                     padding:'6px 10px', borderRadius: t.radius.sm,
                     fontFamily:'inherit', fontSize: 16, lineHeight: 1, flexShrink: 0,
                   }}
                   onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.danger; e.currentTarget.style.color = t.color.danger }}
                   onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border; e.currentTarget.style.color = t.color.silver1 }}
                 >×</button>
               </div>
             ))}
           </div>
         </Card>
       ))}
     </>
   )}

   {/* Trash / restore */}
   {(showTrash || (!workoutLogs.length && trash.length > 0)) && trash.length > 0 && (
     <Card style={{ borderColor: t.color.wineLight, background:`${t.color.wineLight}0d` }}>
       <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
         <div>
           <div style={{ fontWeight: 700, fontSize: t.font.md }}>סל מיחזור</div>
           <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
             {trash.length} אימונים · לחיצה על "שחזר" מחזירה להיסטוריה
           </div>
         </div>
         <Button variant="danger" size="sm" onClick={purge}>רוקן סל</Button>
       </div>
       <div style={{ display:'grid', gap: 6 }}>
         {trash.map(log => (
           <div key={log.id || log.date} style={{
             display:'flex', justifyContent:'space-between', alignItems:'center',
             gap: 10, padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm,
             opacity: 0.85,
           }}>
             <div style={{ flex: 1, minWidth: 0 }}>
               <div style={{ fontWeight: 600, fontSize: t.font.sm }}>{log.sessionName}</div>
               <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
                 בוצע ב־{new Date(log.date).toLocaleDateString('he-IL')} · נמחק ב־{new Date(log.deletedAt).toLocaleDateString('he-IL')}
               </div>
             </div>
             <Button size="sm" variant="ghost" onClick={() => restoreWorkoutLog(log.id || log.date)}>שחזר</Button>
           </div>
         ))}
       </div>
     </Card>
   )}
 </div>
 )
}

// ─── Empty plan screen with CTA + archive display ────────────
function EmptyPlanScreen({ archive, onBuildPlan, onResume, onRemove, building, setBuilding }) {
 if (building) return <PlanBuilder onDone={() => setBuilding(false)} onCancel={() => setBuilding(false)} />
 return (
 <div style={{ display:'grid', gap: 20 }}>
 {/* Sport-Refined hero — warm charcoal + wine radial + Barlow display */}
 <div style={{
 position:'relative',
 borderRadius: t.radius.xl,
 overflow:'hidden',
 border: `1px solid ${t.color.hairline}`,
 background: `linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.65) 100%), linear-gradient(160deg, ${t.color.panel2} 0%, ${t.color.charcoal} 100%)`,
 padding:'32px 26px 30px',
 minHeight: 260,
 display:'flex', flexDirection:'column', justifyContent:'space-between',
 }}>
 {/* radial wine glow */}
 <div style={{
 position:'absolute', top:'-30%', insetInlineEnd:'-20%',
 width: 340, height: 340,
 background: `radial-gradient(circle, ${t.color.wineGlow} 0%, transparent 55%)`,
 pointerEvents:'none',
 }} />
 <div style={{ position:'relative', zIndex: 2 }}>
 <Kicker>מוכן להתחיל</Kicker>
 </div>
 <div style={{ position:'relative', zIndex: 2 }}>
 <SectionHead size="h1"emphasis="הבנייה מתחילה כאן."style={{ fontSize: 36, marginBottom: 10 }}>
 עדיין אין תכנית פעילה,
 </SectionHead>
 <div style={{
 color: t.color.silver1, fontSize: t.font.body, lineHeight: 1.55,
 maxWidth: 480, marginBottom: 24, letterSpacing:'-0.005em',
 }}>
 בחר סגנון, ימים בשבוע וציוד — נבנה תכנית מדעית מותאמת אליך תוך 2 דקות. תמיד אפשר לשנות תוך כדי.
 </div>
 <SButton variant="light"onClick={onBuildPlan} size="lg">
 בנה תכנית
 <svg width="10"height="10"viewBox="0 0 12 12"fill="currentColor"style={{ transform:'rotate(180deg)'}}>
 <path d="M2 1v10l8-5z"/>
 </svg>
 </SButton>
 </div>
 </div>

 {archive.length > 0 && (
 <div style={{
 background: t.color.panel, border: `1px solid ${t.color.border}`,
 borderRadius: t.radius.lg, padding: 20,
 }}>
 <div style={{
 display:'flex', justifyContent:'space-between', alignItems:'baseline',
 paddingBottom: 10, marginBottom: 10, borderBottom: `1px solid ${t.color.border}`,
 }}>
 <Kicker color="silver"dash={false}>תכניות בארכיון</Kicker>
 <Label color={t.color.silver3}>{archive.length}</Label>
 </div>
 <div style={{ display:'grid', gap: 0 }}>
 {archive.map((p, i) => (
 <div key={p.id} style={{
 display:'flex', gap: 12, alignItems:'center', flexWrap:'wrap',
 padding:'14px 4px',
 borderTop: i === 0 ? 'none': `1px solid ${t.color.hairline}`,
 }}>
 <div style={{ flex: 1, minWidth: 180 }}>
 <div style={{
 fontFamily: t.font.family.display, fontSize: 16,
 fontWeight: t.font.weight.semi, color: t.color.white,
 letterSpacing:'-0.02em', marginBottom: 4,
 }}>{p.name}</div>
 <Label>
 {p.sessionsDone}/{p.sessionsExpected} אימונים
 <span style={{
 marginInlineStart: 8, color: p.completionPct >= 75 ? t.color.success : p.completionPct >= 40 ? t.color.wineLight : t.color.warning,
 }}>· {p.completionPct}%</span>
 </Label>
 </div>
 <SButton variant="ghost"size="sm"onClick={() => onResume(p.id)}>המשך</SButton>
 <button
 onClick={() => { if (confirm('למחוק לצמיתות?')) onRemove(p.id) }}
 title="הסר"
 style={{
 background:'transparent', border:'none', color: t.color.silver3,
 cursor:'pointer', fontSize: 18, padding: 6,
 }}
 >×</button>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )
}

// ─── Active plan summary (collapsed by default) ─────────────
function ActivePlanSummary({ plan, overallPct, weekPct, currentWeek, totalWeeks, lastWorkoutDate, expanded, onToggle, onClose, onNewPlan }) {
 return (
 <div style={{
 position:'relative',
 borderRadius: t.radius.xl,
 overflow:'hidden',
 border: `1px solid ${t.color.hairline}`,
 background: `linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.75) 100%), linear-gradient(160deg, ${t.color.panel2} 0%, ${t.color.charcoal} 100%)`,
 padding:'22px 22px 24px',
 }}>
 {/* wine radial */}
 <div style={{
 position:'absolute', top:'-30%', insetInlineEnd:'-20%',
 width: 340, height: 340,
 background: `radial-gradient(circle, ${t.color.wineGlow} 0%, transparent 55%)`,
 pointerEvents:'none',
 }} />

 {/* Top row: kicker + close */}
 <div style={{
 display:'flex', justifyContent:'space-between', alignItems:'flex-start',
 position:'relative', zIndex: 2, marginBottom: 20,
 }}>
 <Kicker>תכנית פעילה</Kicker>
 <button
 onClick={onClose}
 title="סגור תכנית"
 style={{
 background:'transparent', border: `1px solid ${t.color.border}`,
 color: t.color.silver2, borderRadius:'50%',
 width: 30, height: 30, cursor:'pointer', fontSize: 14, lineHeight: 1,
 display:'flex', alignItems:'center', justifyContent:'center',
 }}
 >×</button>
 </div>

 {/* Title */}
 <div style={{ position:'relative', zIndex: 2, marginBottom: 14 }}>
 <SectionHead size="h2"style={{ fontSize: 32 }}>{plan.name}</SectionHead>
 </div>

 {/* Meta strip */}
 <div style={{
 position:'relative', zIndex: 2, marginBottom: 22,
 display:'flex', flexWrap:'wrap', alignItems:'center', gap: 0,
 }}>
 <Label color={t.color.silver1}>שבוע {currentWeek} / {totalWeeks}</Label>
 <span style={{ color: t.color.silver3, marginInline: 10 }}>·</span>
 <Label color={t.color.silver1}>{weekPct}% השבוע</Label>
 <span style={{ color: t.color.silver3, marginInline: 10 }}>·</span>
 <Label color={t.color.silver1}>{overallPct}% סה״כ</Label>
 {lastWorkoutDate && (
 <>
 <span style={{ color: t.color.silver3, marginInline: 10 }}>·</span>
 <Label color={t.color.silver1}>אחרון: {lastWorkoutDate}</Label>
 </>
 )}
 </div>

 {/* Progress bar — full width, wine gradient */}
 <div style={{
 position:'relative', zIndex: 2, marginBottom: 20,
 height: 3, background: t.color.panel, borderRadius: 2, overflow:'hidden',
 }}>
 <div style={{
 height:'100%', width: `${overallPct}%`,
 background: `linear-gradient(90deg, ${t.color.wine}, ${t.color.wineLight})`,
 borderRadius: 2,
 }} />
 </div>

 {/* Actions */}
 <div style={{
 position:'relative', zIndex: 2,
 display:'flex', gap: 8, flexWrap:'wrap',
 }}>
 <SButton
 variant="light"
 onClick={onToggle}
 style={{ flex: 2, minWidth: 140 }}
 >
 {expanded ? 'סגור מבט':'פתח מבט'}
 <svg width="10"height="10"viewBox="0 0 10 10"fill="none"stroke="currentColor"strokeWidth="1.5"style={{ transform: expanded ? 'rotate(180deg)':'rotate(0deg)', transition: t.transition }}>
 <path d="M2 3.5l3 3 3-3"/>
 </svg>
 </SButton>
 <SButton variant="ghost"onClick={onNewPlan}>תכנית חדשה</SButton>
 </div>
 </div>
 )
}

// ─── Archived plan preview modal ────────────────────────────
function ArchivedPlanPreview({ archivedPlan, activePlan, onClose, onResume }) {
 const p = archivedPlan
 const snapshot = p.snapshot || {}
 const daysSince = p.archivedAt ? Math.floor((Date.now() - new Date(p.archivedAt).getTime()) / 86400000) : 0
 const lastUsedLabel = daysSince === 0 ? 'היום': daysSince === 1 ? 'אתמול': `לפני ${daysSince} ימים`
 const pctColor = p.completionPct >= 75 ? t.color.success : p.completionPct >= 40 ? t.color.gold : t.color.warning

 return (
 <Modal open onClose={onClose} title="תצוגה מקדימה של התכנית"width={560}>
 {/* Big header */}
 <div style={{
 background: `${pctColor}22`, borderRadius: t.radius.md,
 padding: t.space.xl, textAlign:'center', marginBottom: t.space.md,
 }}>
 <div style={{ fontSize: 40, fontWeight: 900, color: pctColor, marginBottom: 4 }}>
 {p.completionPct}%
 </div>
 <b style={{ color: t.color.text, fontSize: t.font.lg }}>{p.name}</b>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 6 }}>
 {p.sessionsDone}/{p.sessionsExpected} אימונים · שימוש אחרון: {lastUsedLabel}
 </div>
 </div>

 {/* Details */}
 <div style={{ display:'grid', gap: 10, marginBottom: t.space.md }}>
 <PreviewRow label="סגנון"value={snapshot.style || '—'} />
 <PreviewRow label="ימים בשבוע"value={String(snapshot.days || '—')} />
 <PreviewRow label="שבועות"value={String(snapshot.weeks || p.weeksScheduled || '—')} />
 <PreviewRow label={'תרגילים בסה"כ'} value={String((snapshot.sessions || []).reduce((s, sess) => s + (sess.exercises?.length || 0), 0))} />
 <PreviewRow label="הופעל לראשונה"value={p.startedAt ? new Date(p.startedAt).toLocaleDateString('he-IL') :'—'} />
 </div>

 {/* Session list preview */}
 {(snapshot.sessions || []).length > 0 && (
 <div style={{ marginBottom: t.space.md }}>
 <div style={{ fontSize: t.font.sm, color: t.color.gold, fontWeight: 700, marginBottom: 8 }}>
 אימונים בתכנית ({snapshot.sessions.length})
 </div>
 <div style={{ display:'grid', gap: 6 }}>
 {snapshot.sessions.slice(0, 6).map((s, i) => (
 <div key={i} style={{
 padding: 8, background: t.color.bgSoft, borderRadius: t.radius.sm,
 fontSize: t.font.sm, display:'flex', justifyContent:'space-between',
 }}>
 <span>{s.name || `אימון ${i + 1}`}</span>
 <span style={{ color: t.color.textDim, fontSize: t.font.xs }}>{s.exercises?.length || 0} תרגילים</span>
 </div>
 ))}
 {snapshot.sessions.length > 6 && (
 <div style={{ fontSize: t.font.xs, color: t.color.textMuted, textAlign:'center'}}>
 + {snapshot.sessions.length - 6} נוספים
 </div>
 )}
 </div>
 </div>
 )}

 {/* Warning + actions */}
 {activePlan && (
 <div style={{
 background: `${t.color.warning}22`, borderRadius: t.radius.sm,
 padding: 10, marginBottom: t.space.md, fontSize: t.font.xs, color: t.color.warning,
 }}>
 הפעלת התכנית תעביר את "{activePlan.name}"לארכיון
 </div>
 )}

 <div style={{ display:'flex', gap: 8 }}>
 <Button variant="ghost"onClick={onClose} style={{ flex: 1, justifyContent:'center'}}>ביטול</Button>
 <Button variant="primary"size="lg"onClick={onResume} style={{ flex: 2, justifyContent:'center'}}>
 הפעל את התכנית
 </Button>
 </div>
 </Modal>
 )
}

function PreviewRow({ label, value }) {
 return (
 <div style={{
 display:'flex', justifyContent:'space-between',
 padding:'8px 0', borderBottom: `1px solid ${t.color.border}`,
 }}>
 <span style={{ color: t.color.textDim, fontSize: t.font.sm }}>{label}</span>
 <span style={{ color: t.color.text, fontWeight: 600, fontSize: t.font.sm }}>{value}</span>
 </div>
 )
}

// ─── Week banner - shown at top of MyPlan tab ────────────────
function WeekBanner({ plan, currentWeek, completion, difficulty, style, profile, onSetDifficulty }) {
 const styleLabel = ({ bodybuilding:'בודיבילדינג', powerlifting:'כוח מירבי', crossfit:'METCONS', bodyweight:'משקל גוף'})[style] || style
 const needMore = Math.max(0, Math.ceil(0.75 * (plan.days || 3)) - completion.done)

 return (
 <Card style={{ padding: 20, background: `linear-gradient(135deg, ${t.color.bgCard} 0%, ${t.color.bgElevated} 100%)` }}>
 <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap', marginBottom: 12 }}>
 <Badge color={t.color.gold}> שבוע {currentWeek} מתוך {plan.weeks}</Badge>
 <Badge color={t.color.textDim}>{styleLabel}</Badge>
 {plan.cycle && plan.cycle > 1 && <Badge color={t.color.info}>מחזור {plan.cycle}</Badge>}
 </div>

 <div style={{ marginBottom: 14 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 6, flexWrap:'wrap', gap: 6 }}>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim }}>
 השלמת השבוע: <b style={{ color: completion.complete ? t.color.success : t.color.gold }}>
 {completion.done}/{completion.total} ({completion.pct}%)
 </b>
 </div>
 {completion.complete
 ? <Badge color={t.color.success}> שער 75% נפתח</Badge>
 : needMore > 0
 ? <Badge color={t.color.warning}>עוד {needMore} ותפתח שבוע {currentWeek + 1} </Badge>
 : null}
 </div>
 <ProgressBar value={completion.done} max={completion.total} />
 </div>

 <div style={{ marginTop: 14 }}>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 8, fontWeight: 600 }}>
 רמת הקושי לשבוע {currentWeek}:
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6 }} className="hfos-diff-grid">
 {DIFFICULTY_LEVELS.map(d => {
 const meta = DIFFICULTY_LABELS[d]
 const active = difficulty === d
 return (
 <button key={d} onClick={() => onSetDifficulty(d)} style={{
 padding:'10px 6px', border:`1px solid ${active ? t.color.gold : t.color.border}`,
 background: active ? t.color.goldGlow : t.color.bgSoft,
 color: active ? t.color.gold : t.color.text,
 borderRadius: t.radius.md, cursor:'pointer', fontFamily:'inherit',
 display:'flex', flexDirection:'column', gap: 2, alignItems:'center',
 }}>
 <span style={{ fontSize: 20 }}>{meta.icon}</span>
 <span style={{ fontSize: t.font.xs, fontWeight: 700 }}>{meta.label}</span>
 </button>
 )
 })}
 </div>
 <div style={{ marginTop: 10, padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm,
 fontSize: t.font.xs, color: t.color.textDim, lineHeight: 1.5 }}>
 {profile.note}
 </div>
 </div>
 <style>{`@media (max-width: 500px) { .hfos-diff-grid { grid-template-columns: 1fr 1fr !important; } }`}</style>
 </Card>
 )
}

// ─── Upcoming weeks preview - shows next 3 weeks with locked/unlocked state
function UpcomingWeeks({ plan, currentWeek, style, difficultyByWeek, onSetDifficulty }) {
 const totalWeeks = plan.weeks || 12
 const upcoming = []
 for (let w = currentWeek; w <= Math.min(currentWeek + 3, totalWeeks); w++) upcoming.push(w)
 if (upcoming.length < 2) return null

 const styleLabel = ({ bodybuilding:'בודיבילדינג', powerlifting:'כוח מירבי', crossfit:'METCONS', bodyweight:'משקל גוף'})[style] || style
 const suggestedDiff = (w) => {
 if (w === totalWeeks) return 'easy'
 if (w % 4 === 0) return 'easy'
 if (w >= totalWeeks - 2) return 'elite'
 if (w >= totalWeeks - 4) return 'hard'
 return 'medium'
 }

 return (
 <Card>
 <SectionHeader
 title="שבועות קדימה"
 subtitle="תצוגה מקדימה - הרמה נעולה מוצעת אוטומטית, ניתן לשנות"
 />
 <div style={{ display:'grid', gap: 8, marginTop: 12 }}>
 {upcoming.map((w, idx) => {
 const isCurrent = w === currentWeek
 const isLocked = idx > 0
 const diff = difficultyByWeek[w] || (isCurrent ? 'medium': suggestedDiff(w))
 const meta = DIFFICULTY_LABELS[diff]
 return (
 <div key={w} style={{
 display:'grid', gridTemplateColumns:'auto 1fr auto', gap: 12, alignItems:'center',
 padding: 12, borderRadius: t.radius.md,
 background: isCurrent ? t.color.goldGlow : t.color.bgSoft,
 border: `1px solid ${isCurrent ? t.color.gold : t.color.border}`,
 opacity: isLocked ? 0.75 : 1,
 }}>
 <div style={{
 width: 42, height: 42, borderRadius:'50%',
 background: isCurrent ? t.color.gold : t.color.bg,
 color: isCurrent ? '#0d0d14': t.color.text,
 display:'grid', placeItems:'center', fontWeight: 900, fontSize: 16,
 border: `1px solid ${isCurrent ? t.color.gold : t.color.border}`,
 }}>{w}</div>
 <div>
 <div style={{ fontSize: t.font.sm, fontWeight: 700 }}>
 שבוע {w}
 {isCurrent && <span style={{ color: t.color.gold, marginRight: 6 }}> נוכחי</span>}
 {isLocked && <span style={{ color: t.color.textDim, marginRight: 6, fontSize: t.font.xs }}> נעול</span>}
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 2 }}>
 {styleLabel} · <span style={{ color: meta.color }}>{meta.icon} {meta.label}</span>
 {isLocked && <span> · נפתח כשתסיים 75% משבוע {w - 1}</span>}
 {w % 4 === 0 && !isCurrent && <span style={{ color: t.color.info }}> · דלוד מומלץ</span>}
 </div>
 </div>
 {!isLocked && (
 <select
 value={diff}
 onChange={e => onSetDifficulty(w, e.target.value)}
 style={{
 padding:'6px 10px', borderRadius: t.radius.sm,
 background: t.color.bg, color: t.color.text,
 border: `1px solid ${t.color.border}`,
 fontFamily:'inherit', fontSize: t.font.xs,
 }}
 >
 {DIFFICULTY_LEVELS.map(d => (
 <option key={d} value={d}>{DIFFICULTY_LABELS[d].icon} {DIFFICULTY_LABELS[d].label}</option>
 ))}
 </select>
 )}
 </div>
 )
 })}
 {currentWeek + 3 < totalWeeks && (
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, textAlign:'center', padding: 8 }}>
 + עוד {totalWeeks - currentWeek - 3} שבועות בהמשך המחזור
 </div>
 )}
 </div>
 </Card>
 )
}
