import React, { useMemo, useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Card, Input, Badge, Modal, Button, Tabs } from '../../../../components/ui/UI'
import { EXERCISES, MUSCLE_GROUPS, EQUIPMENT, POPULAR_EXERCISES } from '../../../../data/bodybuilding/exercises'
import { ExerciseDetail } from './ExerciseDetail'

// Standard exercise library — A-Z alphabetical + muscle-group + equipment filters.
export function ExerciseLibrary() {
 const [query, setQuery] = useState('')
 const [muscleFilter, setMuscleFilter] = useState(null)
 const [equipmentFilter, setEquipmentFilter] = useState(null)
 const [muscleModalOpen, setMuscleModalOpen] = useState(false)
 const [equipModalOpen, setEquipModalOpen] = useState(false)
 const [selectedExercise, setSelectedExercise] = useState(null)

 const filtered = useMemo(() => {
 let list = EXERCISES
 if (muscleFilter) list = list.filter(e => e.primaryMuscle === muscleFilter || e.secondaryMuscles?.includes(muscleFilter))
 if (equipmentFilter) list = list.filter(e => e.equipment === equipmentFilter)
 if (query.trim()) {
 const q = query.trim().toLowerCase()
 list = list.filter(e =>
 e.he.toLowerCase().includes(q) || e.en.toLowerCase().includes(q)
 )
 }
 // Sort A-Z by English name (like the reference)
 return [...list].sort((a, b) => a.en.localeCompare(b.en))
 }, [query, muscleFilter, equipmentFilter])

 const muscleLabel = muscleFilter ? findMuscleLabel(muscleFilter) :'All Muscles'
 const equipLabel = equipmentFilter ? EQUIPMENT[equipmentFilter]?.he :'All Equipment'

 return (
 <div>
 {/* Search bar */}
 <Input
 placeholder="חיפוש תרגיל…"
 value={query}
 onChange={e => setQuery(e.target.value)}
 style={{ marginBottom: t.space.md }}
 />

 {/* Filter chips */}
 <div style={{ display:'flex', gap: 8, marginBottom: t.space.md, flexWrap:'wrap'}}>
 <button
 onClick={() => setEquipModalOpen(true)}
 style={filterChip(equipmentFilter)}
 >
 {equipLabel} ▾
 </button>
 <button
 onClick={() => setMuscleModalOpen(true)}
 style={filterChip(muscleFilter)}
 >
 {muscleLabel} ▾
 </button>
 {(muscleFilter || equipmentFilter) && (
 <button
 onClick={() => { setMuscleFilter(null); setEquipmentFilter(null) }}
 style={{ ...filterChip(false), background: t.color.danger, color:'#fff'}}
 >
 נקה
 </button>
 )}
 </div>

 {/* Popular Exercises section (only when no filters) */}
 {!query && !muscleFilter && !equipmentFilter && (
 <>
 <SectionTitle>פופולריים</SectionTitle>
 <div style={{ display:'grid', gap: 8, marginBottom: t.space.lg }}>
 {POPULAR_EXERCISES.map(ex => (
 <ExerciseRow key={ex.id} exercise={ex} onClick={() => setSelectedExercise(ex)} />
 ))}
 </div>
 <SectionTitle>כל התרגילים ({filtered.length})</SectionTitle>
 </>
 )}

 {/* Results (or filtered list) */}
 {filtered.length === 0 && (
 <div style={{ padding: t.space.xxxl, textAlign:'center', color: t.color.textDim }}>
 לא נמצאו תרגילים.
 </div>
 )}

 <div style={{ display:'grid', gap: 8 }}>
 {filtered.map(ex => (
 <ExerciseRow key={ex.id} exercise={ex} onClick={() => setSelectedExercise(ex)} />
 ))}
 </div>

 {/* Muscle group picker */}
 <Modal open={muscleModalOpen} onClose={() => setMuscleModalOpen(false)} title="בחר קבוצת שרירים">
 {Object.entries(MUSCLE_GROUPS).map(([bodyKey, body]) => (
 <div key={bodyKey} style={{ marginBottom: t.space.lg }}>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 8, fontWeight: 700 }}>
 {body.he}
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
 {Object.entries(body.muscles).map(([key, m]) => (
 <button
 key={key}
 onClick={() => { setMuscleFilter(key); setMuscleModalOpen(false) }}
 style={muscleBtn(muscleFilter === key)}
 >
 {m.he}
 </button>
 ))}
 </div>
 </div>
 ))}
 </Modal>

 {/* Equipment picker */}
 <Modal open={equipModalOpen} onClose={() => setEquipModalOpen(false)} title="בחר ציוד">
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
 {Object.entries(EQUIPMENT).map(([key, eq]) => (
 <button
 key={key}
 onClick={() => { setEquipmentFilter(key); setEquipModalOpen(false) }}
 style={muscleBtn(equipmentFilter === key)}
 >
 <span style={{ fontSize: 20, marginLeft: 6 }}>{eq.icon}</span> {eq.he}
 </button>
 ))}
 </div>
 </Modal>

 {/* Exercise detail modal */}
 {selectedExercise && (
 <ExerciseDetail
 exercise={selectedExercise}
 open={!!selectedExercise}
 onClose={() => setSelectedExercise(null)}
 />
 )}
 </div>
 )
}

function ExerciseRow({ exercise, onClick }) {
 const primary = findMuscleLabel(exercise.primaryMuscle)
 return (
 <button onClick={onClick} style={{
 display:'flex', alignItems:'center', gap: 12, padding: 12,
 background: t.color.bgCard, border: `1px solid ${t.color.border}`,
 borderRadius: t.radius.sm, cursor:'pointer', textAlign:'right',
 fontFamily:'inherit', width:'100%',
 }}>
 <div style={{
 width: 40, height: 40, borderRadius: 8, background: t.color.bgSoft,
 display:'flex', alignItems:'center', justifyContent:'center',
 fontSize: 20, flexShrink: 0,
 }}>{EQUIPMENT[exercise.equipment]?.icon || ''}</div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ color: t.color.info, fontWeight: 700, fontSize: t.font.md, marginBottom: 2 }}>
 {exercise.he}
 </div>
 <div style={{ color: t.color.textDim, fontSize: t.font.xs }}>
 {exercise.en} · {primary}
 </div>
 </div>
 <span style={{ color: t.color.textMuted, fontSize: 20 }}>ⓘ</span>
 </button>
 )
}

function SectionTitle({ children }) {
 return (
 <div style={{
 fontSize: t.font.sm, color: t.color.textDim, marginBottom: 8, fontWeight: 700,
 letterSpacing: 0.5, textTransform:'uppercase',
 }}>{children}</div>
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

function muscleBtn(active) {
 return {
 padding:'14px 10px', textAlign:'center',
 background: active ? `${t.color.gold}22` : t.color.bgSoft,
 border: `1.5px solid ${active ? t.color.gold : t.color.border}`,
 borderRadius: t.radius.sm,
 color: active ? t.color.gold : t.color.text,
 fontFamily:'inherit', fontSize: t.font.sm, fontWeight: 600,
 cursor:'pointer',
 }
}

function findMuscleLabel(key) {
 for (const body of Object.values(MUSCLE_GROUPS)) {
 if (body.muscles[key]) return body.muscles[key].he
 }
 return key
}
