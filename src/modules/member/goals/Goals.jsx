import React, { useState, useMemo } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Card, Button, Badge, SectionHeader, EmptyState, ProgressBar, Modal, Input, Ring } from '../../../components/ui/UI'
import { Sparkline } from '../../../components/charts/Charts'
import { GoalBuilder } from './GoalBuilder'
import { PlanBuilder } from './PlanBuilder'
import { DIRECTIONS } from '../../../data/goals'
import { useI18n } from '../../../i18n/i18n'

export function Goals({ go }) {
 const { state, removeGoal, checkinGoal, updateProfile, addMeasurement } = useApp()
 const { isRTL } = useI18n()
 const [building, setBuilding] = useState(false)
 const [buildingPlan, setBuildingPlan] = useState(false)
 const [checkinFor, setCheckinFor] = useState(null)
 const [checkinValue, setCheckinValue] = useState('')
 const [checkinNote, setCheckinNote] = useState('')
 const [savedFlash, setSavedFlash] = useState(false)
 const [bootstrapWeight, setBootstrapWeight] = useState('')

 const active = (state.goals || []).find(g => g.status === 'active')

 if (building) {
 return <GoalBuilder onDone={(savedGoal) => {
   // Defensive: only close the builder if a goal was actually saved.
   // Prevents the "kicked back to home" bug where the wizard closed
   // without a goal on record, dropping user into the empty state.
   if (savedGoal && savedGoal.id) {
     setBuilding(false)
     setSavedFlash(true)
     setTimeout(() => setSavedFlash(false), 3500)
   } else {
     console.warn('[Goals] onDone fired with no saved goal — keeping builder open')
     alert('לא הצלחנו לשמור את המטרה. נסה שוב.')
   }
 }} />
 }
 if (buildingPlan) {
 return <PlanBuilder onDone={() => { setBuildingPlan(false); alert(isRTL ? 'התכנית ההוליסטית שלך נשמרה! עבור ל"אימונים"לראות את התכנית' : 'Your holistic plan is saved! Go to "Workouts" to see it') }} onCancel={() => setBuildingPlan(false)} />
 }

 if (!active) {
 return (
 <Card style={{ padding: 32, textAlign:'center'}}>
 <div style={{ fontSize: 56, marginBottom: 16 }}> </div>
 <h2 style={{ fontSize: t.font.xxl, fontWeight: 800, marginBottom: 8 }}>{isRTL ? 'עדיין אין לך מטרה פעילה' : 'No active goal yet'}</h2>
 <div style={{ color: t.color.textDim, marginBottom: 24, maxWidth: 480, margin:'0 auto 24px', lineHeight: 1.6 }}>
 {isRTL ? 'מטרה מדידה היא הדבר החשוב ביותר להתקדמות. גם אם אתה לא בטוח מה - נגלה יחד בעזרת שאלות מנחות.' : 'A measurable goal is the single most important thing for progress. Not sure what yours is? We\'ll find it together with a short guided flow.'}
 </div>
 <Button size="lg"onClick={() => setBuilding(true)} icon=" ">{isRTL ? 'בואו נבנה מטרה' : 'Let\'s build a goal'}</Button>
 </Card>
 )
 }

 const daysSince = Math.floor((Date.now() - new Date(active.startDate)) / (24 * 3600 * 1000))
 const dir = DIRECTIONS.find(d => d.id === active.direction)

 // Progress from actual data
 const progress = computeProgress(active, state, isRTL)

 const submitCheckin = () => {
 if (checkinValue === ''|| isNaN(+checkinValue)) return
 const v = +checkinValue
 checkinGoal(checkinFor.id, v, checkinNote)
 // Also log to the appropriate measurement source so Progress module
 // and the sparkline stay in sync with what the user just entered.
 if (checkinFor.kind === 'weight_change') {
   addMeasurement({ date: new Date().toISOString(), weight: v, note: checkinNote || undefined })
   updateProfile({ weightKg: v })
 } else if (checkinFor.kind === 'body_fat') {
   addMeasurement({ date: new Date().toISOString(), bodyFat: v, note: checkinNote || undefined })
 }
 setCheckinFor(null); setCheckinValue(''); setCheckinNote('')
 }

 return (
 <div style={{ display:'grid', gap: 20 }}>
 {savedFlash && (
 <div style={{
 padding: '14px 18px',
 background: 'rgba(74,156,106,0.14)',
 border: '1px solid rgba(74,156,106,0.5)',
 borderRadius: t.radius.md,
 color: '#7fce9a',
 fontWeight: 700,
 textAlign: 'center',
 fontSize: 14,
 }}>
 המטרה נשמרה: {active.title}
 </div>
 )}
 {/* Hero card */}
 <Card style={{ background:`linear-gradient(135deg, ${t.color.bgCard} 0%, ${t.color.bgElevated} 100%)`, padding: 28, position:'relative', overflow:'hidden'}}>
 <div style={{ position:'absolute', top:-30, left:-30, width:180, height:180, background:t.color.goldGlow, borderRadius:'50%', filter:'blur(40px)'}} />
 <div style={{ display:'flex', gap: 8, alignItems:'center', marginBottom: 12 }}>
 <Badge> {isRTL ? 'המטרה הפעילה שלך' : 'Your active goal'}</Badge>
 {dir && <Badge color={t.color.textDim}>{dir.icon} {dir.label}</Badge>}
 </div>
 <h1 style={{ fontSize: t.font.hero, fontWeight: 900, marginBottom: 12, lineHeight: 1.1 }}>{active.title}</h1>
 {active.why && (
 <div style={{ fontStyle:'italic', color: t.color.textDim, marginBottom: 20, fontSize: t.font.md, lineHeight: 1.5, position:'relative', zIndex: 1 }}>
 "{active.why}"
 </div>
 )}

 <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap: 24, alignItems:'center', position:'relative', zIndex: 1 }} className="hfos-goal-hero">
 <Ring
 value={progress.pct}
 max={100}
 size={110}
 stroke={10}
 color={progress.pct >= 80 ? t.color.success : progress.pct >= 50 ? t.color.gold : t.color.warning}
 label={`${progress.pct}%`}
 sublabel={isRTL ? 'למטרה' : 'to goal'}
 />
 <div style={{ display:'grid', gap: 10 }}>
 <div>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 4 }}>{isRTL ? 'מתחילת המטרה' : 'Since goal started'}</div>
 <div style={{ fontWeight: 700 }}>{daysSince === 0 ? (isRTL ? 'התחלת היום ' : 'Started today') : (isRTL ? `יום ${daysSince} בדרך` : `Day ${daysSince} on the way`)}</div>
 </div>
 {progress.currentValue != null && progress.targetValue != null && (
 <div>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 4 }}>{isRTL ? 'נותר להשיג' : 'Remaining'}</div>
 <div style={{ fontWeight: 700, color: t.color.gold }}>
 {Math.abs(progress.targetValue - progress.currentValue).toFixed(1)} {active.metric?.unit || ''}
 </div>
 </div>
 )}
 </div>
 </div>
 </Card>

 {/* Bootstrap: weight-loss/body-fat goal without any starting value.
     Happens when profile.weightKg is empty AND no measurements/checkins yet.
     Without this card, Ariel would be stuck at 0% forever with no way to enter data. */}
 {(active.kind === 'weight_change' || active.kind === 'body_fat') && progress.startValue == null && (
 <Card style={{ padding: 20, background: `${t.color.gold}15`, border: `1px solid ${t.color.gold}` }}>
   <div style={{ fontWeight: 800, fontSize: t.font.lg, marginBottom: 6, color: t.color.gold }}>
     {isRTL ? ' חסר לנו נקודת התחלה' : ' We need your starting point'}
   </div>
   <div style={{ color: t.color.textDim, fontSize: t.font.sm, marginBottom: 14, lineHeight: 1.5 }}>
     {active.kind === 'weight_change'
       ? (isRTL ? 'הזן את המשקל הנוכחי שלך כדי שנוכל להראות התקדמות ולחשב את היעד.' : 'Enter your current weight so we can show progress and compute the target.')
       : (isRTL ? 'הזן את אחוז השומן הנוכחי שלך כדי לחשב את היעד.' : 'Enter your current body-fat % to compute the target.')
     }
   </div>
   <div style={{ display:'flex', gap: 10, alignItems:'flex-end', flexWrap:'wrap' }}>
     <div style={{ flex:'1 1 200px' }}>
       <Input
         type="number"
         inputMode="decimal"
         label={active.kind === 'weight_change' ? (isRTL ? 'משקל נוכחי (ק״ג)' : 'Current weight (kg)') : (isRTL ? 'אחוז שומן (%)' : 'Body fat (%)')}
         placeholder={active.kind === 'weight_change' ? '75' : '20'}
         value={bootstrapWeight}
         onChange={e => setBootstrapWeight(e.target.value)}
       />
     </div>
     <Button size="lg" onClick={() => {
       const v = +bootstrapWeight
       if (!v || isNaN(v)) { alert(isRTL ? 'הזן ערך מספרי' : 'Enter a numeric value'); return }
       if (active.kind === 'weight_change') {
         updateProfile({ weightKg: v })
         addMeasurement({ date: new Date().toISOString(), weight: v })
       } else {
         addMeasurement({ date: new Date().toISOString(), bodyFat: v })
       }
       setBootstrapWeight('')
     }}>{isRTL ? 'שמור והתחל' : 'Save & start'}</Button>
   </div>
 </Card>
 )}

 {/* Metric card - shows current vs target */}
 {progress.currentValue != null && progress.targetValue != null && (
 <Card>
 <SectionHeader title={progress.metricLabel} action={
 <Button size="sm"onClick={() => { setCheckinFor(active); setCheckinValue(String(progress.currentValue || '')) }}>
 + {isRTL ? 'עדכן מדד' : 'Update metric'}
 </Button>
 } />
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 12, textAlign:'center'}} className="hfos-metric-grid">
 <div style={{ padding: 16, background: t.color.bgSoft, borderRadius: t.radius.md }}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{isRTL ? 'נקודת התחלה' : 'Start'}</div>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color: t.color.textDim }}>{progress.startValue ?? '—'}</div>
 </div>
 <div style={{ padding: 16, background: t.color.goldGlow, borderRadius: t.radius.md, border:`1px solid ${t.color.gold}` }}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{isRTL ? 'כרגע' : 'Now'}</div>
 <div style={{ fontSize: t.font.xxl, fontWeight: 800, color: t.color.gold }}>{progress.currentValue}</div>
 </div>
 <div style={{ padding: 16, background: t.color.bgSoft, borderRadius: t.radius.md }}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{isRTL ? 'יעד' : 'Target'}</div>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color: t.color.success }}>{progress.targetValue}</div>
 </div>
 </div>
 {progress.trend && progress.trend.length > 1 && (
 <div style={{ marginTop: 16 }}>
 <Sparkline data={progress.trend} height={50} color={t.color.gold} />
 </div>
 )}
 </Card>
 )}

 {/* Weekly actions */}
 {active.weeklyActions?.length > 0 && (
 <Card>
 <SectionHeader title={isRTL ? 'המיני-מטרות השבועיות שלך' : 'Your weekly mini-goals'} subtitle={isRTL ? 'הפעולות שיובילו אותך למטרה הגדולה' : 'The actions that will get you to the big goal'} />
 <div style={{ display:'grid', gap: 8 }}>
 {active.weeklyActions.map((a, i) => (
 <div key={i} style={{ padding: 14, background: t.color.bgSoft, borderRadius: t.radius.md, display:'flex', gap: 12, alignItems:'center'}}>
 <div style={{
 width: 28, height: 28, borderRadius: 8, background: t.color.gold, color:'#0d0d14',
 display:'flex', alignItems:'center', justifyContent:'center', fontSize: 12, fontWeight: 800, flexShrink: 0,
 }}>{i+1}</div>
 <div style={{ flex: 1, fontSize: t.font.sm }}>{a}</div>
 </div>
 ))}
 </div>
 </Card>
 )}

 {/* Barriers reminder */}
 {active.barriers?.length > 0 && (
 <Card style={{ background:`${t.color.warning}10`, borderColor: t.color.warning }}>
 <SectionHeader title={isRTL ? ' המכשולים שהזהרת מהם' : ' Barriers you flagged'} subtitle={isRTL ? 'שים לב אליהם בשבוע הקרוב' : 'Watch out for these in the coming week'} />
 <div style={{ display:'flex', gap: 6, flexWrap:'wrap'}}>
 {active.barriers.map(id => <Badge key={id} color={t.color.warning}>{id}</Badge>)}
 </div>
 </Card>
 )}

 {/* BIG bridge CTA - the "now what?"answer */}
 {!state.plan && (
 <Card style={{ padding: 24, background: `linear-gradient(135deg, ${t.color.goldGlow} 0%, ${t.color.bgElevated} 100%)`, border: `1px solid ${t.color.gold}` }}>
 <div style={{ display:'flex', gap: 16, alignItems:'center', flexWrap:'wrap'}}>
 <div style={{ fontSize: 48 }}> </div>
 <div style={{ flex: 1, minWidth: 240 }}>
 <div style={{ fontWeight: 800, fontSize: t.font.xl, color: t.color.gold, marginBottom: 6 }}>
 {isRTL ? 'יש לך מטרה - עכשיו איך משיגים אותה?' : 'You have a goal — now how do you get there?'}
 </div>
 <div style={{ color: t.color.textDim, fontSize: t.font.sm, lineHeight: 1.5 }}>
 {isRTL ? 'בואי נבנה יחד תכנית הוליסטית - אימונים + תזונה + מעטפת מנטלית - הכל מותאם אישית תוך 2 דקות' : 'Let\'s build a holistic plan together — workouts + nutrition + mental wrap — all tailored in under 2 minutes'}
 </div>
 </div>
 <Button size="lg"onClick={() => setBuildingPlan(true)}>{isRTL ? 'בנה לי תכנית ' : 'Build my plan'}</Button>
 </div>
 </Card>
 )}

 {state.plan && (
 <Card
 onClick={() => go?.('train')}
 style={{
 padding: 16, background: `${t.color.success}10`, border: `1px solid ${t.color.success}`,
 cursor:'pointer', transition: t.transition,
 }}
 onMouseEnter={e => { e.currentTarget.style.background = `${t.color.success}22` }}
 onMouseLeave={e => { e.currentTarget.style.background = `${t.color.success}10` }}
 >
 <div style={{ display:'flex', gap: 12, alignItems:'center', flexWrap:'wrap'}}>
 <div style={{ fontSize: 28 }}> </div>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 700 }}>{isRTL ? 'יש לך תכנית פעילה:' : 'Active plan:'} {state.plan.name}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 2 }}>{isRTL ? 'לחץ כאן → מעביר אותך ישירות לאימונים ' : 'Tap here → takes you straight to Workouts'}</div>
 </div>
 <div style={{ fontSize: 24, color: t.color.success }}>←</div>
 <Button variant="ghost"size="sm"onClick={(e) => { e.stopPropagation(); setBuildingPlan(true) }}>{isRTL ? 'בנה תכנית מחדש' : 'Rebuild plan'}</Button>
 </div>
 </Card>
 )}

 {/* Actions */}
 <div style={{ display:'flex', gap: 10, flexWrap:'wrap'}}>
 <Button variant="outline"onClick={() => setBuilding(true)}> {isRTL ? 'שנה מטרה' : 'Change goal'}</Button>
 <Button variant="ghost"onClick={() => { if (confirm(isRTL ? 'לבטל את המטרה?' : 'Cancel this goal?')) removeGoal(active.id) }}>{isRTL ? 'מחק מטרה' : 'Delete goal'}</Button>
 </div>

 {/* Checkin history */}
 {active.checkins?.length > 0 && (
 <Card>
 <SectionHeader title={isRTL ? 'עדכונים אחרונים' : 'Recent updates'} />
 <div style={{ display:'grid', gap: 8 }}>
 {active.checkins.slice(0, 6).map((c, i) => (
 <div key={i} style={{ display:'flex', justifyContent:'space-between', padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div>
 <div style={{ fontWeight: 700, color: t.color.gold }}>{c.value}</div>
 {c.note && <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{c.note}</div>}
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{new Date(c.date).toLocaleDateString(isRTL ? 'he-IL' : 'en-US')}</div>
 </div>
 ))}
 </div>
 </Card>
 )}

 <Modal open={!!checkinFor} onClose={() => setCheckinFor(null)} title={isRTL ? 'עדכון מדד' : 'Update metric'} width={420}>
 <div style={{ display:'grid', gap: 12 }}>
 <Input type="number"label={`${isRTL ? 'ערך נוכחי' : 'Current value'} (${checkinFor?.metric?.unit || ''})`} value={checkinValue} onChange={e => setCheckinValue(e.target.value)} />
 <Input label={isRTL ? 'הערה (אופציונלי)' : 'Note (optional)'} value={checkinNote} onChange={e => setCheckinNote(e.target.value)} placeholder={isRTL ? 'איך אתה מרגיש? מה עבד השבוע?' : 'How do you feel? What worked this week?'} />
 <div style={{ display:'flex', gap: 10, justifyContent:'flex-end'}}>
 <Button variant="ghost" onClick={() => setCheckinFor(null)}>{isRTL ? 'בטל' : 'Cancel'}</Button>
 <Button onClick={submitCheckin}>{isRTL ? 'שמור' : 'Save'}</Button>
 </div>
 </div>
 </Modal>

 <style>{`
 @media (max-width: 700px) {
 .hfos-goal-hero { grid-template-columns: 1fr !important; text-align: center; }
 .hfos-metric-grid { grid-template-columns: 1fr !important; }
 }
 `}</style>
 </div>
 )
}

// Compute progress from actual data
function computeProgress(goal, state, isRTL = true) {
 let currentValue = null, targetValue = null, startValue = null, metricLabel = '', trend = []

 // Null-safe accessors — a legacy localStorage snapshot from before we added
 // measurements/personalRecords/bloodTests would otherwise crash .filter()
 const measurements = state.measurements || []
 const personalRecords = state.personalRecords || []
 const moodCheckins = state.moodCheckins || []
 const bloodTests = state.bloodTests || []
 const profile = state.profile || {}
 const checkinsAsc = [...(goal.checkins || [])].reverse() // stored newest-first, want asc for trend

 switch (goal.kind) {
 case 'weight_change': {
 const meas = measurements.filter(m => m.weight != null).sort((a,b) => new Date(a.date) - new Date(b.date))
 metricLabel = isRTL ? 'משקל גוף (ק״ג)' : 'Body weight (kg)'
 // Precedence: measurements > check-ins > profile.weightKg.
 // Since submitCheckin now writes BOTH a measurement and a check-in,
 // measurements alone are authoritative — don't double-append check-ins.
 if (meas.length) {
 startValue = meas[0].weight
 currentValue = meas[meas.length - 1].weight
 trend = meas.map(m => m.weight)
 } else if (checkinsAsc.length) {
 startValue = +checkinsAsc[0].value
 currentValue = +checkinsAsc[checkinsAsc.length - 1].value
 trend = checkinsAsc.map(c => +c.value)
 } else if (profile.weightKg) {
 startValue = +profile.weightKg
 currentValue = +profile.weightKg
 trend = [+profile.weightKg]
 }
 if (startValue != null && goal.metric?.delta != null) {
 targetValue = +(startValue + goal.metric.delta).toFixed(1)
 }
 break
 }
 case 'body_fat': {
 const meas = measurements.filter(m => m.bodyFat != null).sort((a,b) => new Date(a.date) - new Date(b.date))
 metricLabel = isRTL ? 'אחוז שומן (%)' : 'Body fat (%)'
 if (meas.length) {
 startValue = meas[0].bodyFat
 currentValue = meas[meas.length - 1].bodyFat
 trend = meas.map(m => m.bodyFat)
 } else if (checkinsAsc.length) {
 startValue = +checkinsAsc[0].value
 currentValue = +checkinsAsc[checkinsAsc.length - 1].value
 trend = checkinsAsc.map(c => +c.value)
 }
 if (startValue != null && goal.metric?.delta != null) {
 targetValue = +(startValue + goal.metric.delta).toFixed(1)
 }
 break
 }
 case 'lift_pr': {
 const prs = personalRecords.filter(p => p.exercise?.includes(hebrewLift(goal.metric.lift))).sort((a,b) => new Date(a.date) - new Date(b.date))
 metricLabel = `${hebrewLift(goal.metric.lift)} - e1RM (${isRTL ? 'ק״ג' : 'kg'})`
 if (prs.length) {
 startValue = Math.round(prs[0].weight * (1 + prs[0].reps/30))
 currentValue = Math.round(prs[prs.length - 1].weight * (1 + prs[prs.length - 1].reps/30))
 trend = prs.map(p => Math.round(p.weight * (1 + p.reps/30)))
 } else if (profile.oneRMs?.[goal.metric.lift]) {
 startValue = +profile.oneRMs[goal.metric.lift]
 currentValue = startValue
 trend = [startValue]
 }
 if (checkinsAsc.length) {
 trend = trend.length ? [...trend, ...checkinsAsc.map(c => +c.value)] : checkinsAsc.map(c => +c.value)
 currentValue = +checkinsAsc[checkinsAsc.length - 1].value
 }
 targetValue = goal.metric?.target ?? null
 break
 }
 case 'sleep': {
 const cs = moodCheckins.filter(c => c.sleepHours != null).sort((a,b) => new Date(a.date) - new Date(b.date))
 metricLabel = isRTL ? 'שעות שינה (ממוצע 7 ימים)' : 'Sleep hours (7-day avg)'
 if (cs.length) {
 startValue = cs[0].sleepHours
 currentValue = +(cs.slice(-7).reduce((s,c) => s + c.sleepHours, 0) / Math.min(7, cs.length)).toFixed(1)
 trend = cs.map(c => c.sleepHours)
 }
 targetValue = goal.metric?.target ?? null
 break
 }
 case 'mood': {
 const cs = moodCheckins.filter(c => c.mood != null).sort((a,b) => new Date(a.date) - new Date(b.date))
 metricLabel = isRTL ? 'מצב-רוח (ממוצע 7 ימים)' : 'Mood (7-day avg)'
 if (cs.length) {
 startValue = cs[0].mood
 currentValue = +(cs.slice(-7).reduce((s,c) => s + c.mood, 0) / Math.min(7, cs.length)).toFixed(1)
 trend = cs.map(c => c.mood)
 }
 targetValue = goal.metric?.target ?? null
 break
 }
 case 'blood_marker': {
 const latest = bloodTests[0]
 metricLabel = `${isRTL ? 'סמן דם' : 'Blood marker'}: ${goal.metric.marker}`
 if (latest && latest.values?.[goal.metric.marker]) {
 currentValue = +latest.values[goal.metric.marker]
 }
 targetValue = goal.metric?.target ?? null
 break
 }
 default:
 break
 }

 // Overall % - based purely on metric progress, no time pressure
 let pct = 0
 if (currentValue != null && targetValue != null && startValue != null) {
 const total = Math.abs(targetValue - startValue)
 const done = Math.abs(currentValue - startValue)
 pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
 }

 return { pct, currentValue, targetValue, startValue, metricLabel, trend }
}

function hebrewLift(key) {
 return ({ squat:'סקוואט', bench:'לחיצת חזה', deadlift:'דדליפט', ohp:'לחיצת כתפיים', pullup:'מתח' })[key] || key
}
