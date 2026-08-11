import React, { useMemo, useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Card, Button, Badge, Modal, SectionHeader } from '../../../../components/ui/UI'
import { useApp } from '../../../../store/AppStore'
import { PROGRAMS, LEVELS, GOALS, EQUIPMENT_TYPES, FEATURED_PROGRAM_IDS, PROGRAM_BY_ID, filterPrograms, ROUTINE_CATEGORIES } from '../../../../data/bodybuilding/programs'
import { ROUTINE_BY_ID, estimateDurationMin } from '../../../../data/bodybuilding/routines'
import { ProgramDetail } from './ProgramDetail'

export function ExplorePrograms() {
 const [levelFilter, setLevelFilter] = useState(null)
 const [goalFilter, setGoalFilter] = useState(null)
 const [equipFilter, setEquipFilter] = useState(null)
 const [levelOpen, setLevelOpen] = useState(false)
 const [goalOpen, setGoalOpen] = useState(false)
 const [equipOpen, setEquipOpen] = useState(false)
 const [selectedProgram, setSelectedProgram] = useState(null)
 const [showAll, setShowAll] = useState(false)

 const filtered = useMemo(() => {
 return filterPrograms({ level: levelFilter, goal: goalFilter, equipment: equipFilter })
 }, [levelFilter, goalFilter, equipFilter])

 const featured = FEATURED_PROGRAM_IDS.map(id => PROGRAM_BY_ID[id]).filter(Boolean)
 const anyFilter = levelFilter || goalFilter || equipFilter

 return (
 <div>
 {/* Filter chips */}
 <div style={{ display:'flex', gap: 8, marginBottom: t.space.lg, flexWrap:'wrap'}}>
 <FilterChip
 label={levelFilter ? LEVELS[levelFilter].he :'Level'}
 active={!!levelFilter}
 onClick={() => setLevelOpen(true)}
 />
 <FilterChip
 label={goalFilter ? GOALS[goalFilter].he :'Goal'}
 active={!!goalFilter}
 onClick={() => setGoalOpen(true)}
 />
 <FilterChip
 label={equipFilter ? EQUIPMENT_TYPES[equipFilter].he :'Equipment'}
 active={!!equipFilter}
 onClick={() => setEquipOpen(true)}
 />
 {anyFilter && (
 <button
 onClick={() => { setLevelFilter(null); setGoalFilter(null); setEquipFilter(null); setShowAll(false) }}
 style={{ ...filterChip(false), background: t.color.danger, color:'#fff'}}
 >
 נקה
 </button>
 )}
 </div>

 {/* Show all button (when no filters) */}
 {!anyFilter && !showAll && (
 <>
 <Button variant="outline"onClick={() => setShowAll(true)} style={{ width:'100%', marginBottom: t.space.md, justifyContent:'center'}}>
 Show all {PROGRAMS.length} programs
 </Button>

 <SectionHeader title="מומלץ עבורך"/>
 <div style={{ display:'grid', gap: 10, marginBottom: t.space.lg }}>
 {featured.map(p => (
 <ProgramCard key={p.id} program={p} onClick={() => setSelectedProgram(p)} />
 ))}
 </div>

 <SectionHeader title=" קטגוריות"/>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
 {ROUTINE_CATEGORIES.map(cat => (
 <CategoryCard
 key={cat.key}
 category={cat}
 count={PROGRAMS.filter(cat.filter).length}
 onClick={() => {
 // Apply category filter as best-effort
 if (cat.key === 'gym') setEquipFilter('gym')
 else if (cat.key === 'dumbbells') setEquipFilter('dumbbells')
 else if (cat.key === 'bodyweight'|| cat.key === 'at_home') setEquipFilter('none')
 else if (cat.key === 'strength') setGoalFilter('strength')
 else if (cat.key === 'weight_loss') setGoalFilter('lose_weight')
 setShowAll(true)
 }}
 />
 ))}
 </div>
 </>
 )}

 {/* Full list */}
 {(showAll || anyFilter) && (
 <>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: t.space.md }}>
 {filtered.length} תוכניות
 </div>
 <div style={{ display:'grid', gap: 10 }}>
 {filtered.map(p => (
 <ProgramCard key={p.id} program={p} onClick={() => setSelectedProgram(p)} />
 ))}
 </div>
 </>
 )}

 {/* Filter modals */}
 <Modal open={levelOpen} onClose={() => setLevelOpen(false)} title="בחר רמה">
 <div style={{ display:'grid', gap: 8 }}>
 {Object.entries(LEVELS).map(([key, l]) => (
 <button key={key} onClick={() => { setLevelFilter(key); setLevelOpen(false); setShowAll(true) }}
 style={filterOptBtn(levelFilter === key)}>
 <span style={{ fontSize: 20, marginLeft: 8 }}>{key === 'beginner'? ' ': key === 'intermediate'? ' ':' '}</span>
 <b>{l.he}</b>
 </button>
 ))}
 </div>
 </Modal>

 <Modal open={goalOpen} onClose={() => setGoalOpen(false)} title="בחר מטרה">
 <div style={{ display:'grid', gap: 8 }}>
 {Object.entries(GOALS).map(([key, g]) => (
 <button key={key} onClick={() => { setGoalFilter(key); setGoalOpen(false); setShowAll(true) }}
 style={filterOptBtn(goalFilter === key)}>
 <span style={{ fontSize: 20, marginLeft: 8 }}>{g.icon}</span>
 <b>{g.he}</b>
 </button>
 ))}
 </div>
 </Modal>

 <Modal open={equipOpen} onClose={() => setEquipOpen(false)} title="בחר ציוד">
 <div style={{ display:'grid', gap: 8 }}>
 {Object.entries(EQUIPMENT_TYPES).map(([key, eq]) => (
 <button key={key} onClick={() => { setEquipFilter(key); setEquipOpen(false); setShowAll(true) }}
 style={filterOptBtn(equipFilter === key)}>
 <span style={{ fontSize: 20, marginLeft: 8 }}>{eq.icon}</span>
 <b>{eq.he}</b>
 </button>
 ))}
 </div>
 </Modal>

 {/* Program detail */}
 {selectedProgram && (
 <ProgramDetail
 program={selectedProgram}
 open={!!selectedProgram}
 onClose={() => setSelectedProgram(null)}
 />
 )}
 </div>
 )
}

function ProgramCard({ program, onClick }) {
 const { state } = useApp()
 const saved = state.bbSavedPrograms?.includes(program.id)
 return (
 <Card hover onClick={onClick} style={{ cursor:'pointer'}}>
 <div style={{ display:'flex', gap: 12, alignItems:'flex-start'}}>
 <div style={{
 width: 60, height: 60, borderRadius: t.radius.md, background: t.color.bgSoft,
 display:'flex', alignItems:'center', justifyContent:'center', fontSize: 28, flexShrink: 0,
 }}>{program.emoji}</div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
 <b style={{ color: t.color.text, fontSize: t.font.md }}>{program.name}</b>
 {saved && <span title="נשמר"> </span>}
 </div>
 <div style={{ display:'flex', gap: 6, marginBottom: 6, flexWrap:'wrap'}}>
 <Badge color={LEVELS[program.level] && (program.level === 'beginner'? t.color.info : program.level === 'intermediate'? t.color.success : t.color.gold)}>
 {LEVELS[program.level]?.he}
 </Badge>
 <Badge color={t.color.purple}>{GOALS[program.goal]?.he}</Badge>
 <Badge color={t.color.textDim}>{EQUIPMENT_TYPES[program.equipment]?.he}</Badge>
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
 {program.daysPerWeek} ימים · {program.weeksRecommended} שבועות · {program.routines.length} routines
 </div>
 </div>
 </div>
 </Card>
 )
}

function CategoryCard({ category, count, onClick }) {
 return (
 <button onClick={onClick} style={{
 padding: t.space.md, background: t.color.bgCard,
 border: `1px solid ${t.color.border}`, borderRadius: t.radius.md,
 cursor:'pointer', fontFamily:'inherit', color: t.color.text,
 display:'flex', flexDirection:'column', alignItems:'flex-start', gap: 6,
 }}>
 <div style={{ fontSize: 32 }}>{category.icon}</div>
 <b>{category.he}</b>
 <span style={{ fontSize: t.font.xs, color: t.color.textDim }}>{count} תוכניות</span>
 </button>
 )
}

function FilterChip({ label, active, onClick }) {
 return (
 <button onClick={onClick} style={filterChip(active)}>
 {label} ▾
 </button>
 )
}

function filterChip(active) {
 return {
 padding:'8px 14px', borderRadius: t.radius.pill,
 border: `1px solid ${active ? t.color.gold : t.color.border}`,
 background: active ? `${t.color.gold}22` : t.color.bgSoft,
 color: active ? t.color.gold : t.color.text,
 fontFamily:'inherit', fontSize: t.font.sm, fontWeight: 600,
 cursor:'pointer',
 }
}

function filterOptBtn(active) {
 return {
 padding:'14px 16px', textAlign:'right',
 background: active ? `${t.color.gold}22` : t.color.bgSoft,
 border: `1.5px solid ${active ? t.color.gold : t.color.border}`,
 borderRadius: t.radius.sm,
 color: t.color.text, fontFamily:'inherit', fontSize: t.font.md,
 cursor:'pointer', display:'flex', alignItems:'center',
 }
}
