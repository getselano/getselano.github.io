import React from 'react'
import { t } from '../../../../theme/tokens'
import { Modal, Card, Button, Badge } from '../../../../components/ui/UI'
import { useApp } from '../../../../store/AppStore'
import { LEVELS, GOALS, EQUIPMENT_TYPES } from '../../../../data/bodybuilding/programs'
import { ROUTINE_BY_ID, estimateDurationMin } from '../../../../data/bodybuilding/routines'
import { EXERCISE_BY_ID } from '../../../../data/bodybuilding/exercises'
import { Kicker, SectionHead, Label, Button as SButton } from '../../../../design/components/primitives'
import { movementName } from '../../../../data/movementName'

// Program detail modal — shown when user taps a program card in Explore.
export function ProgramDetail({ program, open, onClose }) {
 const { state, bbSaveProgram, bbUnsaveProgram, bbSetActiveProgram } = useApp()
 const saved = state.bbSavedPrograms?.includes(program.id)

 const routines = (program.routines || []).map(rid => ROUTINE_BY_ID[rid]).filter(Boolean)
 const uniqueRoutines = Array.from(new Map(routines.map(r => [r.id, r])).values())

 const toggleSave = () => {
 if (saved) bbUnsaveProgram(program.id)
 else bbSaveProgram(program.id)
 }
 const startProgram = () => {
 bbSetActiveProgram(program)
 onClose()
 alert(`התוכנית "${program.name}"הופעלה! תוכל להריץ אימונים מה-Routines שלה.`)
 }

 return (
 <Modal open={open} onClose={onClose} title={program.name} width={640}>
 {/* Cover — Sport-Refined hero card */}
 <div style={{
 position:'relative',
 background: `linear-gradient(180deg, transparent 25%, rgba(0,0,0,0.75) 100%), linear-gradient(160deg, ${t.color.panel2}, ${t.color.charcoal})`,
 borderRadius: t.radius.xl,
 border: `1px solid ${t.color.hairline}`,
 padding:'28px 24px 30px',
 marginBottom: t.space.md,
 overflow:'hidden',
 minHeight: 180,
 display:'flex', flexDirection:'column', justifyContent:'space-between',
 }}>
 {/* wine radial */}
 <div style={{
 position:'absolute', top:'-30%', insetInlineEnd:'-20%',
 width: 320, height: 320,
 background: `radial-gradient(circle, ${t.color.wineGlow} 0%, transparent 55%)`,
 pointerEvents:'none',
 }} />

 <div style={{ position:'relative', zIndex: 2 }}>
 <Kicker>
 {LEVELS[program.level]?.he} · {program.daysPerWeek} ימים/שבוע
 </Kicker>
 </div>

 <div style={{ position:'relative', zIndex: 2, marginTop: 20 }}>
 <SectionHead size="h2"style={{ fontSize: 30, marginBottom: 10 }}>
 {program.name}
 </SectionHead>
 {program.inspiration && (
 <Label color={t.color.silver2}>בהשראת {program.inspiration}</Label>
 )}
 </div>
 </div>

 {/* Meta tags row */}
 <div style={{ display:'flex', gap: 6, flexWrap:'wrap', marginBottom: t.space.md }}>
 <MetaTag>{GOALS[program.goal]?.he}</MetaTag>
 <MetaTag>{EQUIPMENT_TYPES[program.equipment]?.he}</MetaTag>
 <MetaTag>{program.weeksRecommended} שבועות</MetaTag>
 </div>

 {/* Description */}
 <div style={{
 color: t.color.silver1, fontSize: t.font.body, lineHeight: 1.65,
 marginBottom: t.space.lg, letterSpacing:'-0.005em',
 }}>
 {program.description}
 </div>

 {/* Action buttons */}
 <div style={{ display:'flex', gap: 8, marginBottom: t.space.lg }}>
 <SButton variant="primary"size="lg"onClick={startProgram} style={{ flex: 2 }}>
 הפעל את התוכנית
 <svg width="10"height="10"viewBox="0 0 12 12"fill="currentColor"style={{ transform:'rotate(180deg)'}}>
 <path d="M2 1v10l8-5z"/>
 </svg>
 </SButton>
 <SButton variant={saved ? 'quiet':'ghost'} size="lg"onClick={toggleSave}>
 {saved ? 'שמור ':'שמור'}
 </SButton>
 </div>

 {/* Routines list */}
 <div style={{
 display:'flex', justifyContent:'space-between', alignItems:'baseline',
 paddingBottom: 10, marginBottom: 12, borderBottom: `1px solid ${t.color.border}`,
 }}>
 <Kicker color="silver" dash={false}>Routines בתוכנית</Kicker>
 <Label color={t.color.silver3}>{uniqueRoutines.length}</Label>
 </div>
 <div style={{ display:'grid', gap: 10 }}>
 {uniqueRoutines.map(r => (
 <RoutinePreview key={r.id} routine={r} />
 ))}
 </div>
 </Modal>
 )
}

function MetaTag({ children }) {
 return (
 <span style={{
 padding:'6px 12px',
 background: t.color.panel,
 border: `1px solid ${t.color.border}`,
 borderRadius: t.radius.pill,
 fontFamily: t.font.family.mono,
 fontSize: 10, letterSpacing:'0.22em',
 textTransform:'uppercase',
 color: t.color.silver1,
 }}>{children}</span>
 )
}

function RoutinePreview({ routine }) {
 const duration = estimateDurationMin(routine)
 return (
 <div style={{
 background: t.color.panel,
 border: `1px solid ${t.color.border}`,
 borderRadius: t.radius.lg,
 padding: 16,
 }}>
 <div style={{
 display:'flex', alignItems:'baseline', justifyContent:'space-between',
 gap: 12, marginBottom: 10, paddingBottom: 10,
 borderBottom: `1px solid ${t.color.hairline}`,
 }}>
 <div style={{
 fontFamily: t.font.family.display,
 fontSize: 18, fontWeight: t.font.weight.semi,
 color: t.color.white,
 letterSpacing:'-0.02em',
 flex: 1,
 }}>{routine.name}</div>
 <Label>~{duration} דק'</Label>
 </div>
 <div style={{ display:'grid', gap: 0 }}>
 {(routine.exercises || []).slice(0, 6).map((ex, i) => {
 const exercise = EXERCISE_BY_ID[ex.exerciseId]
 if (!exercise) return null
 const workingSets = (ex.sets || []).filter(s => s.type !== 'warmup').length
 const range = getRepRange(ex.sets)
 return (
 <div key={i} style={{
 display:'grid', gridTemplateColumns:'24px 1fr auto', gap: 10,
 padding:'8px 0', fontSize: t.font.body,
 borderTop: i === 0 ? 'none': `1px solid ${t.color.hairline}`,
 alignItems:'center',
 }}>
 <span style={{
 fontFamily: t.font.family.mono, fontSize: 10,
 color: t.color.silver3, letterSpacing:'0.12em',
 }}>{String(i + 1).padStart(2,'0')}</span>
 <span style={{
 color: t.color.white,
 letterSpacing:'-0.005em',
 }}>{movementName(exercise)}</span>
 <span style={{
 fontFamily: t.font.family.mono, fontSize: 10,
 color: t.color.silver2, letterSpacing:'0.14em',
 textTransform:'uppercase',
 }}>{workingSets} × {range}</span>
 </div>
 )
 })}
 {(routine.exercises || []).length > 6 && (
 <div style={{
 fontFamily: t.font.family.mono, fontSize: 10,
 color: t.color.silver3, letterSpacing:'0.2em',
 textAlign:'center', marginTop: 8, textTransform:'uppercase',
 }}>
 + {routine.exercises.length - 6} נוספים
 </div>
 )}
 </div>
 </div>
 )
}

function getRepRange(sets) {
 if (!sets?.length) return '—'
 const reps = sets.filter(s => s.type !== 'warmup').map(s => s.reps).filter(r => r > 0)
 if (!reps.length) return '—'
 const min = Math.min(...reps)
 const max = Math.max(...reps)
 return min === max ? `${min}` : `${min}-${max}`
}
