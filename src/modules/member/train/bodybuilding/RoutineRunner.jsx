import React, { useEffect, useRef, useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Modal, Card, Button, Badge } from '../../../../components/ui/UI'
import { useApp } from '../../../../store/AppStore'
import { EXERCISE_BY_ID, EQUIPMENT } from '../../../../data/bodybuilding/exercises'
import { calculatePlates, platesNotation } from '../../../../data/bodybuilding/calculators'
import { Kicker, SectionHead, Label, Button as SButton } from '../../../../design/components/primitives'
import { ExerciseGuideButton } from '../../../../components/train/ExerciseGuidePopover'
import { movementName } from '../../../../data/movementName'

// Progress persists across close/reopen — user asked for
// "לא להתאפס אחרי אימון אלא אם לחצי על לאפס".
const storageKey = (routineId) => `hfos:runner_state:${routineId}`

const buildInitialLive = (routine) => (routine.exercises || []).map(ex => ({
  ...ex,
  collapsed: false,
  sets: (ex.sets || []).map(s => ({ ...s, completed: false, actualWeight: s.weight, actualReps: s.reps })),
}))

const loadPersistedLive = (routine) => {
  if (typeof window === 'undefined') return buildInitialLive(routine)
  try {
    const raw = localStorage.getItem(storageKey(routine.id))
    if (!raw) return buildInitialLive(routine)
    const stored = JSON.parse(raw)
    // Merge stored state onto the fresh routine template so schema changes
    // in the routine (added/removed exercises) don't crash the runner.
    const fresh = buildInitialLive(routine)
    fresh.forEach((ex, i) => {
      const storedEx = stored[i]
      if (!storedEx) return
      ex.collapsed = !!storedEx.collapsed
      ex.sets.forEach((s, j) => {
        const storedSet = storedEx.sets?.[j]
        if (!storedSet) return
        s.completed = !!storedSet.completed
        if (Number.isFinite(storedSet.actualWeight)) s.actualWeight = storedSet.actualWeight
        if (Number.isFinite(storedSet.actualReps)) s.actualReps = storedSet.actualReps
      })
    })
    return fresh
  } catch {
    return buildInitialLive(routine)
  }
}

// Live routine runner — user goes through exercises, logs sets, uses rest timer.
export function RoutineRunner({ routine, open, onClose }) {
 const { logWorkout, bbUpdateExercisePR, state } = useApp()
 const settings = state.workoutSettings || {}

 // Working state: array parallel to routine.exercises, each with
 // completed[si]=true/false + actual weight/reps + a per-exercise
 // collapsed flag. Persisted to localStorage per-routine.
 const [live, setLive] = useState(() => loadPersistedLive(routine))
 const [restEnd, setRestEnd] = useState(null) // Date.now() when rest ends, or null
 const [now, setNow] = useState(Date.now())
 const [plateOpen, setPlateOpen] = useState(null) // { weight } to calculate plates for
 const startedAt = useRef(Date.now())

 // Persist on every change
 useEffect(() => {
   if (typeof window === 'undefined') return
   try {
     localStorage.setItem(storageKey(routine.id), JSON.stringify(live))
   } catch {}
 }, [live, routine.id])

 useEffect(() => {
 if (!restEnd) return
 const id = setInterval(() => setNow(Date.now()), 250)
 return () => clearInterval(id)
 }, [restEnd])

 const restRemaining = restEnd ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0
 useEffect(() => {
 if (restEnd && now >= restEnd) {
 setRestEnd(null)
 try {
 if (typeof window !== 'undefined'&& 'vibrate'in navigator) navigator.vibrate([200, 50, 200])
 } catch {}
 }
 }, [now, restEnd])

 const toggleSet = (exIdx, setIdx) => {
 const exInRoutine = live[exIdx]
 const s = exInRoutine.sets[setIdx]
 const newCompleted = !s.completed
 setLive(prev => prev.map((ex, i) => i !== exIdx ? ex : {
 ...ex,
 sets: ex.sets.map((ss, j) => j !== setIdx ? ss : { ...ss, completed: newCompleted }),
 }))
 // Rest timer rule: a dropset is executed IMMEDIATELY after the previous
 // set — no rest between them. So skip the timer when the NEXT set in the
 // chain is a dropset, whether the current set is a working set or another
 // dropset in the chain. The last dropset (or a standalone working set)
 // is the only one that triggers rest.
 const nextSet = exInRoutine.sets[setIdx + 1]
 const nextIsDropset = nextSet && nextSet.type === 'dropset'
 if (newCompleted && exInRoutine.restSeconds > 0 && !nextIsDropset) {
 setRestEnd(Date.now() + exInRoutine.restSeconds * 1000)
 }
 // Update PR only for cataloged exercises (free-text legend
 // exercises have no id and can't be tracked in the PR system)
 if (newCompleted && s.type !== 'warmup' && s.actualWeight > 0 && s.actualReps > 0 && exInRoutine.exerciseId) {
 bbUpdateExercisePR({
 exerciseId: exInRoutine.exerciseId,
 weight: s.actualWeight,
 reps: s.actualReps,
 date: new Date().toISOString(),
 })
 }
 }

 const updateActual = (exIdx, setIdx, field, value) => {
 setLive(prev => prev.map((ex, i) => i !== exIdx ? ex : {
 ...ex,
 sets: ex.sets.map((s, j) => j !== setIdx ? s : { ...s, [field]: +value }),
 }))
 }

 const adjustRest = (delta) => {
 if (!restEnd) return
 setRestEnd(prev => prev + delta * 1000)
 }
 const skipRest = () => setRestEnd(null)

 const toggleCollapse = (exIdx) => {
   setLive(prev => prev.map((ex, i) => i !== exIdx ? ex : { ...ex, collapsed: !ex.collapsed }))
 }

 const resetProgress = () => {
   const anyChecked = live.some(ex => ex.sets.some(s => s.completed))
   const msg = anyChecked
     ? 'לאפס את כל הסימונים והמשקלים בשגרה הזאת? הפעולה לא הפיכה.'
     : 'לאפס את השגרה למצב ההתחלתי?'
   if (!confirm(msg)) return
   const fresh = buildInitialLive(routine)
   setLive(fresh)
   try { localStorage.removeItem(storageKey(routine.id)) } catch {}
 }

 const finish = () => {
 // Total session volume
 const totalVolume = live.reduce((total, ex) => total + (ex.sets || []).filter(s => s.completed && s.type !== 'warmup').reduce((sum, s) => sum + (s.actualWeight * s.actualReps), 0), 0)
 const durationMin = Math.round((Date.now() - startedAt.current) / 60000)

 logWorkout({
 date: new Date().toISOString(),
 sessionName: `BB — ${routine.name}`,
 exercises: live.map(ex => {
 const exercise = EXERCISE_BY_ID[ex.exerciseId]
 return {
 id: ex.exerciseId || null,
 name: movementName(exercise) || ex.exerciseName || ex.name || 'תרגיל',
 sets: (ex.sets || []).filter(s => s.completed).map(s => ({
 w: s.actualWeight, r: s.actualReps, type: s.type,
 })),
 }
 }),
 bbMeta: {
 routineId: routine.id,
 durationMin,
 totalVolume,
 },
 })

 // Update session volume PRs — cataloged exercises only
 for (const ex of live) {
 if (!ex.exerciseId) continue
 const exVolume = (ex.sets || []).filter(s => s.completed && s.type !== 'warmup').reduce((sum, s) => sum + (s.actualWeight * s.actualReps), 0)
 if (exVolume > 0) {
 bbUpdateExercisePR({
 exerciseId: ex.exerciseId,
 weight: 0, reps: 0, sessionVolume: exVolume,
 date: new Date().toISOString(),
 })
 }
 }

 alert(`סיימת!\n${durationMin} דקות · ${totalVolume.toFixed(0)}kg נפח כולל`)
 onClose()
 }

 return (
 <Modal open={open} onClose={onClose} title={routine.name} width={640}>
 {/* Rest timer banner (when active) — Sport-Refined */}
 {restEnd && restRemaining > 0 && (
 <div style={{
 position:'relative',
 background: `linear-gradient(160deg, ${t.color.wineGlow}, transparent 60%), linear-gradient(160deg, ${t.color.panel}, ${t.color.charcoal})`,
 border: `1px solid ${t.color.wineLight}`,
 borderRadius: t.radius.xl,
 padding:'20px 22px 18px',
 marginBottom: t.space.md,
 textAlign:'center',
 overflow:'hidden',
 }}>
 <div style={{ marginBottom: 6 }}>
 <Kicker>מנוחה · Rest</Kicker>
 </div>
 <div style={{
 fontFamily: t.font.family.display,
 fontSize: 56, fontWeight: t.font.weight.med,
 color: t.color.white,
 letterSpacing:'-0.05em',
 fontVariantNumeric:'tabular-nums',
 lineHeight: 1,
 marginBottom: 12,
 }}>
 {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2,'0')}
 </div>
 <div style={{ display:'flex', gap: 8, justifyContent:'center'}}>
 <SButton variant="ghost"size="sm"onClick={() => adjustRest(-15)}>−15s</SButton>
 <SButton variant="ghost"size="sm"onClick={() => adjustRest(15)}>+15s</SButton>
 <SButton variant="primary"size="sm"onClick={skipRest}>דלג</SButton>
 </div>
 </div>
 )}

 {/* Empty state — usually means a legacy routine adopted before the
     name-fallback fix, or a corrupt entry. Give the user an actionable
     out instead of an empty modal. */}
 {live.length === 0 && (
 <div style={{
   padding: '32px 20px', textAlign: 'center',
   background: t.color.bgSoft, borderRadius: t.radius.md,
   border: `1px dashed ${t.color.border}`,
 }}>
   <div style={{
     fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.22em',
     textTransform: 'uppercase', color: t.color.wineLight, fontWeight: 700,
     marginBottom: 10,
   }}>אין תרגילים ברוטינה</div>
   <div style={{ fontSize: 14, color: t.color.text, marginBottom: 6, fontWeight: 600 }}>
     הרוטינה הזאת נשמרה בגרסה מוקדמת ואין בה תרגילים לרוץ.
   </div>
   <div style={{ fontSize: 12, color: t.color.silver1, marginBottom: 16, lineHeight: 1.5 }}>
     לך ל־Legends, אמץ את התכנית מחדש — ותקבל רוטינה חדשה שעובדת.
     <br/>מומלץ לפני זה למחוק את הרוטינה הזאת מ־Routines כדי לא להתבלבל.
   </div>
 </div>
 )}
 {/* Exercises */}
 {(() => {
   // Superset badges: walk the exercises once, assign a letter + neon color
   // per unique supersetGroup, and warn if any group's members are NOT
   // consecutive in the routine (a saved-file corruption case that would
   // otherwise make the workout impossible to run in the intended order).
   const NEON = ['#00E5FF','#FF2CB4','#39FF14','#FF6E00','#B026FF','#FFEA00']
   const ssBadges = {}
   const ssMembers = {}
   let ssIdx = 0
   live.forEach((ex, i) => {
     const g = ex.supersetGroup
     if (!g) return
     if (!ssBadges[g]) {
       ssBadges[g] = { letter: String.fromCharCode(65 + (ssIdx % 26)), color: NEON[ssIdx % NEON.length] }
       ssIdx++
       ssMembers[g] = []
     }
     ssMembers[g].push(i)
   })
   // Adjacency check: for each group, indices must be an unbroken sequence
   const ssBroken = {}
   Object.entries(ssMembers).forEach(([g, arr]) => {
     const contiguous = arr.every((v, i) => i === 0 || v === arr[i - 1] + 1)
     if (!contiguous) ssBroken[g] = true
   })
   return live.map((ex, idx) => {
 // Free-text exercises (from Legend routines etc.) don't have an id
 // in the BB catalog — fall back to the stored exerciseName.
 const cataloged = EXERCISE_BY_ID[ex.exerciseId]
 const exercise = cataloged || { he: ex.exerciseName || ex.name || 'תרגיל', en: '' }
 if (!ex.sets) return null
 const ssBadge = ex.supersetGroup ? ssBadges[ex.supersetGroup] : null
 const ssBrokenHere = ex.supersetGroup ? !!ssBroken[ex.supersetGroup] : false
 const ssGroupSize = ex.supersetGroup ? (ssMembers[ex.supersetGroup]?.length || 0) : 0
 const ssPos = ex.supersetGroup ? (ssMembers[ex.supersetGroup].indexOf(idx) + 1) : 0
 const ssIsTop = ssGroupSize > 0 && ssPos === 1
 const ssIsBottom = ssGroupSize > 0 && ssPos === ssGroupSize
 const ssIsMiddle = ssGroupSize >= 3 && !ssIsTop && !ssIsBottom
 const workingSetsCount = ex.sets.filter(s => s.type === 'working').length
 const dropsetsCount = ex.sets.filter(s => s.type === 'dropset').length
 // "Completed" means completed working sets — dropsets ride on their parent
 const completedWorking = ex.sets.filter(s => s.type === 'working' && s.completed).length
 const totalRequired = ex.sets.filter(s => s.type !== 'warmup').length
 const completedRequired = ex.sets.filter(s => s.type !== 'warmup' && s.completed).length
 const allDone = totalRequired > 0 && completedRequired >= totalRequired
 const collapsed = !!ex.collapsed
 return (
 <React.Fragment key={idx}>
 {/* Superset link banner — shown above every non-first member of a group */}
 {ssBadge && !ssIsTop && (
   <div style={{
     padding:'6px 0', textAlign:'center',
     fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.24em',
     color: ssBadge.color, fontWeight: 800,
     marginTop: -4, marginBottom: 2,
     textShadow: `0 0 8px ${ssBadge.color}80`,
   }}>↕ {ssGroupSize >= 3 ? 'TRIPLE-SET' : 'SUPERSET'} · {ssBadge.letter} · בלי מנוחה</div>
 )}
 {/* Broken-superset warning — shows only if group members aren't contiguous */}
 {ssBrokenHere && ssIsTop && (
   <div style={{
     padding:'8px 10px', marginBottom: 6,
     background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.5)',
     borderRadius: t.radius.sm, color: '#ff8080', fontSize: 11,
     fontFamily: t.font.family.mono, letterSpacing: '0.06em',
   }}>שים לב · סופרסט {ssBadge.letter}: התרגילים לא ברצף. תקן ב־Builder כדי להריץ נכון.</div>
 )}
 <Card style={{
 marginBottom: t.space.md,
 border: ssBadge ? `1px solid ${ssBadge.color}` : (allDone ? `1px solid ${t.color.wineLight}55` : undefined),
 boxShadow: ssBadge ? `0 0 0 1px ${ssBadge.color}22, 0 0 12px ${ssBadge.color}20` : undefined,
 borderTopLeftRadius: !ssIsTop && ssBadge ? 0 : undefined,
 borderTopRightRadius: !ssIsTop && ssBadge ? 0 : undefined,
 borderBottomLeftRadius: !ssIsBottom && ssBadge ? 0 : undefined,
 borderBottomRightRadius: !ssIsBottom && ssBadge ? 0 : undefined,
 }}>
 {/* Header — the whole row is a clickable collapse target */}
 <button
   type="button"
   onClick={() => toggleCollapse(idx)}
   style={{
     display:'flex', alignItems:'flex-start', justifyContent:'space-between',
     gap: 8, width:'100%', textAlign:'right',
     background:'transparent', border:'none', cursor:'pointer',
     padding: 0, marginBottom: collapsed ? 0 : 14,
     paddingBottom: collapsed ? 0 : 12,
     borderBottom: collapsed ? 'none' : `1px solid ${t.color.hairline}`,
     fontFamily:'inherit', color: t.color.text,
   }}
   aria-expanded={!collapsed}
 >
 <div style={{ flex: 1 }}>
 <div style={{ marginBottom: 6, display:'flex', alignItems:'center', gap: 8 }}>
 <Kicker color="wine">תרגיל {idx + 1}</Kicker>
 {allDone && (
 <span style={{
   fontFamily: t.font.family.mono, fontSize: 9, letterSpacing: '0.24em',
   color: '#4a9c6a', fontWeight: 700, textTransform: 'uppercase',
 }}>· בוצע</span>
 )}
 </div>
 <div style={{
 fontFamily: t.font.family.display,
 fontSize: 22, fontWeight: t.font.weight.semi,
 color: t.color.white,
 letterSpacing:'-0.025em',
 lineHeight: 1.05,
 }}>{movementName(exercise)}</div>
 <div style={{ marginTop: 6, display:'flex', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
 <Label>
 {completedWorking}/{workingSetsCount} סטים · מנוחה {ex.restSeconds}s
 </Label>
 {dropsetsCount > 0 && (
 <span style={{
   fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.2em',
   textTransform:'uppercase', fontWeight: 800,
   color: '#FF2CB4', textShadow: '0 0 6px #FF2CB460',
   padding: '2px 8px', borderRadius: 999,
   border: '1px solid #FF2CB4',
   background: '#FF2CB412',
 }}>+{dropsetsCount} דרופסט{dropsetsCount > 1 ? 'ים' : ''}</span>
 )}
 </div>
 </div>
 <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap: 6 }}>
   <div style={{
     fontFamily: t.font.family.display,
     fontSize: 34, fontWeight: t.font.weight.med,
     color: t.color.silver3,
     letterSpacing:'-0.03em',
     fontVariantNumeric:'tabular-nums',
     lineHeight: 1,
   }}>{String(idx + 1).padStart(2,'0')}</div>
   <span style={{
     fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.16em',
     color: t.color.silver2, textTransform:'uppercase',
   }}>
     {collapsed ? '▾ הרחב' : '▴ סגור'}
   </span>
 </div>
 </button>

 {!collapsed && (
 <div onClick={e => e.stopPropagation()} style={{ marginBottom: 4 }}>
   <div style={{ marginBottom: 10 }}>
     <ExerciseGuideButton exerciseName={movementName(exercise)} compact />
   </div>
 </div>
 )}

 {!collapsed && ex.notes && (
 <div style={{
 background: t.color.panel, padding: 10, borderRadius: t.radius.sm,
 fontSize: t.font.body, color: t.color.silver1, marginBottom: 10,
 border: `1px solid ${t.color.hairline}`,
 letterSpacing:'-0.005em',
 }}>
 {ex.notes}
 </div>
 )}

 {!collapsed && (
 <div style={{
 display:'grid', gridTemplateColumns:'50px 1fr 1fr 40px 40px', gap: 6,
 fontFamily: t.font.family.mono, fontSize: 9, letterSpacing: t.font.track.label,
 color: t.color.silver3, textTransform:'uppercase',
 padding:'4px 6px',
 }}>
 <span>Set</span>
 <span>Kg</span>
 <span style={{ color: t.color.gold, fontWeight: 800, letterSpacing:'0.16em' }}>Reps</span>
 <span>Plate</span>
 <span>·</span>
 </div>
 )}
 {!collapsed && ex.sets.map((s, si) => {
 // Numbering rule:
 //  warmup    → 'W'
 //  working   → sequential index among working sets only (1, 2, 3…)
 //  dropset   → 'D1', 'D2' — position within the current dropset chain
 //              (a chain resets after any non-dropset set)
 let setNumber
 if (s.type === 'warmup') setNumber = 'W'
 else if (s.type === 'dropset') {
   let d = 1
   for (let i = si - 1; i >= 0; i--) {
     if (ex.sets[i].type === 'dropset') d++
     else break
   }
   setNumber = `D${d}`
 } else {
   setNumber = ex.sets.slice(0, si + 1).filter(x => x.type === 'working').length
 }
 const isDropset = s.type === 'dropset'
 // Show the connector row above the FIRST dropset in each chain so
 // "this set has dropsets" is visible at a glance, matching what you built.
 const isFirstOfDropChain = isDropset && ex.sets[si - 1]?.type !== 'dropset'
 const dropsetTint = '#FF2CB4'
 return (
 <React.Fragment key={si}>
 {isFirstOfDropChain && (
   <div style={{
     display:'flex', alignItems:'center', gap: 8,
     marginTop: -2, marginBottom: 2, paddingInlineStart: 12,
     fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.22em',
     textTransform:'uppercase', fontWeight: 800,
     color: dropsetTint, textShadow: `0 0 6px ${dropsetTint}55`,
   }}>
     <span style={{ width: 20, height: 1, background: dropsetTint, opacity: 0.6 }} />
     דרופסט · בלי מנוחה · הורד משקל והמשך
   </div>
 )}
 <div style={{
 display:'grid', gridTemplateColumns:'50px 1fr 1fr 40px 40px', gap: 6,
 padding:'10px 6px',
 marginInlineStart: isDropset ? 24 : 0,
 background: s.completed
   ? (isDropset ? `${dropsetTint}22` : `${t.color.wineGlow}`)
   : s.type === 'warmup' ? `${t.color.panel}`
   : isDropset ? `${dropsetTint}0d`
   : t.color.charcoal,
 border: `1px solid ${
   s.completed
     ? (isDropset ? dropsetTint : t.color.wineLight)
     : isDropset ? `${dropsetTint}66`
     : t.color.hairline
 }`,
 borderInlineStart: isDropset ? `3px solid ${dropsetTint}` : undefined,
 borderRadius: t.radius.sm, alignItems:'center', marginBottom: 4,
 boxShadow: isDropset && s.completed ? `0 0 8px ${dropsetTint}40` : undefined,
 }}>
 <span style={{
 textAlign:'center',
 fontFamily: t.font.family.display,
 fontSize: isDropset ? 14 : 16, fontWeight: t.font.weight.semi,
 color: s.type === 'warmup' ? t.color.silver2
   : isDropset ? dropsetTint
   : s.completed ? t.color.wineLight : t.color.white,
 letterSpacing:'-0.02em',
 fontVariantNumeric:'tabular-nums',
 }}>{setNumber}</span>
 <input type="number"value={s.actualWeight || ''}
 onChange={e => updateActual(idx, si,'actualWeight', e.target.value)}
 placeholder={String(s.weight || '—')} style={setInput}
 />
 <input type="number"value={s.actualReps || ''}
 onChange={e => updateActual(idx, si,'actualReps', e.target.value)}
 placeholder={String(s.reps || '—')} style={repsInput}
 />
 <button
 onClick={() => setPlateOpen({ weight: s.actualWeight || s.weight })}
 disabled={!settings.plateCalculatorEnabled || !s.actualWeight}
 title="חישוב פלטות"
 style={{
 background:'none', border: `1px solid ${s.actualWeight ? t.color.border :'transparent'}`,
 borderRadius: t.radius.sm,
 cursor: s.actualWeight ? 'pointer':'default',
 color: s.actualWeight ? t.color.silver1 : t.color.silver3,
 width: 32, height: 32,
 fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.14em',
 textTransform:'uppercase',
 }}
 >P</button>
 <button
 onClick={() => toggleSet(idx, si)}
 style={{
 background: s.completed ? t.color.wineLight :'transparent',
 border: `1.5px solid ${s.completed ? t.color.wineLight : t.color.border}`,
 borderRadius:'50%', cursor:'pointer',
 color: s.completed ? t.color.white : t.color.silver3,
 width: 32, height: 32, display:'flex',
 alignItems:'center', justifyContent:'center',
 fontSize: 14, fontWeight: 700,
 }}
 >{s.completed ? '' :''}</button>
 </div>
 </React.Fragment>
 )
 })}
 </Card>
 </React.Fragment>
 )
 })
 })()}

 {/* Sticky footer — reset + finish */}
 <div style={{
   position:'sticky', bottom: -24, background: t.color.bgElevated,
   padding:'16px 0', borderTop: `1px solid ${t.color.border}`,
   display:'flex', gap: 10,
 }}>
 <SButton variant="ghost" size="lg" onClick={resetProgress}>לאפס</SButton>
 <div style={{ flex: 1 }}>
   <SButton variant="primary" size="lg" onClick={finish} full>
     סיים אימון
   </SButton>
 </div>
 </div>
 <div style={{
   textAlign:'center', fontSize: 11, color: t.color.silver2,
   fontFamily: t.font.family.mono, letterSpacing: '0.14em',
   textTransform: 'uppercase', marginTop: 8,
 }}>
   הסימונים נשמרים בין ביקורים · "לאפס" מוחק הכל
 </div>

 {/* Plate calculator modal */}
 {plateOpen && (
 <Modal open={!!plateOpen} onClose={() => setPlateOpen(null)} title="Plate Calculator" width={400}>
 <PlateCalcDisplay weight={plateOpen.weight} />
 </Modal>
 )}
 </Modal>
 )
}

function PlateCalcDisplay({ weight }) {
 const result = calculatePlates(weight)
 return (
 <div style={{ textAlign:'center'}}>
 <div style={{ fontSize: 40, fontWeight: 900, color: t.color.gold, marginBottom: 12 }}>
 {weight}kg
 </div>
 {result.error && (
 <div style={{ color: t.color.warning, fontSize: t.font.sm, marginBottom: 12 }}>
 {result.error}
 </div>
 )}
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 16 }}>
 {platesNotation(result.plates, result.barbell)}
 </div>
 {/* Visual: bar + plates each side */}
 <div style={{
 display:'flex', alignItems:'center', justifyContent:'center',
 background: t.color.bgSoft, borderRadius: t.radius.md, padding: t.space.md, marginBottom: 12,
 }}>
 {/* left plates */}
 <PlatesGraph plates={result.plates} />
 {/* bar */}
 <div style={{ width: 60, height: 8, background:'#4a4a5a', margin:'0 8px'}} />
 {/* right plates (mirror) */}
 <PlatesGraph plates={result.plates} reverse />
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
 לכל צד: {result.perSide.toFixed(1)}kg (מוט: {result.barbell}kg)
 </div>
 </div>
 )
}

function PlatesGraph({ plates, reverse }) {
 const list = reverse ? [...plates].reverse() : plates
 return (
 <div style={{ display:'flex', alignItems:'center'}}>
 {list.map((p, i) => (
 <div key={i} title={`${p.weight}kg`} style={{
 width: 8 + (p.weight / 25) * 8, // scale by weight
 height: 30 + (p.weight / 25) * 40,
 background: p.color, border: `1px solid ${t.color.border}`,
 marginRight: reverse ? 0 : 2,
 marginLeft: reverse ? 2 : 0,
 borderRadius: 2,
 }} />
 ))}
 </div>
 )
}

const setInput = {
 padding: 8, background: t.color.charcoal,
 border: `1px solid ${t.color.border}`, borderRadius: t.radius.sm,
 color: t.color.white,
 fontFamily: t.font.family.display,
 fontSize: 15, fontWeight: t.font.weight.semi,
 letterSpacing:'-0.02em',
 fontVariantNumeric:'tabular-nums',
 textAlign:'center', width:'100%', outline:'none',
}

// Reps get their own style — the primary target the user is chasing per set,
// so it stands out visually: bigger, bolder, gold-tinted.
const repsInput = {
 ...setInput,
 fontSize: 20,
 fontWeight: 900,
 color: t.color.gold,
 borderColor: `${t.color.gold}55`,
 background: `${t.color.gold}0d`,
 letterSpacing: '-0.03em',
}
