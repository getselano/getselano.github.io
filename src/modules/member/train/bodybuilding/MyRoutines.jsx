import React, { useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Card, Button, Badge, EmptyState } from '../../../../components/ui/UI'
import { useApp } from '../../../../store/AppStore'
import { ROUTINES, ROUTINE_BY_ID, estimateDurationMin } from '../../../../data/bodybuilding/routines'
import { PROGRAM_BY_ID } from '../../../../data/bodybuilding/programs'
import { EXERCISE_BY_ID } from '../../../../data/bodybuilding/exercises'
import { RoutineBuilder } from './RoutineBuilder'
import { RoutineRunner } from './RoutineRunner'
import { PublishWorkoutButton } from '../../../../components/community/PublishWorkoutButton'
import { movementName } from '../../../../data/movementName'

// User's saved routines + system routines from active program.
export function MyRoutines() {
 const { state, bbDeleteRoutine } = useApp()
 const [editing, setEditing] = useState(null) // routine being edited
 const [running, setRunning] = useState(null) // routine being executed
 const [creatingNew, setCreatingNew] = useState(false)

 const userRoutines = state.bbRoutines || []
 const activeProgram = state.bbActiveProgram
 const activeRoutines = activeProgram?.routines
 ? Array.from(new Map(activeProgram.routines.map(id => [id, ROUTINE_BY_ID[id]])).values()).filter(Boolean)
 : []

 const empty = !userRoutines.length && !activeRoutines.length

 return (
 <div>
 {/* Active program section */}
 {activeProgram && (
 <>
 <div style={{ fontSize: t.font.sm, color: t.color.gold, marginBottom: 8, fontWeight: 700 }}>
 תוכנית פעילה: {activeProgram.name}
 </div>
 <div style={{ display:'grid', gap: 10, marginBottom: t.space.lg }}>
 {activeRoutines.map(r => (
 <RoutineCard key={r.id} routine={r} isSystem
 onRun={() => setRunning(r)}
 onEdit={() => setEditing({ ...r, id: `custom_${r.id}_${Date.now()}` })}
 />
 ))}
 </div>
 </>
 )}

 {/* User routines */}
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: t.space.md }}>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, fontWeight: 700 }}>
 Routines שלי
 </div>
 <Button variant="outline"size="sm"onClick={() => setCreatingNew(true)}>
 + חדש
 </Button>
 </div>

 {userRoutines.length === 0 && !empty && (
 <div style={{ color: t.color.textDim, fontSize: t.font.sm, padding: 16, textAlign:'center'}}>
 עוד לא יצרת routines משלך. תוכל להעתיק מהתוכנית או ליצור חדש.
 </div>
 )}

 {userRoutines.length > 0 && (
 <div style={{ display:'grid', gap: 10, marginBottom: t.space.lg }}>
 {userRoutines.map(r => (
 <RoutineCard key={r.id} routine={r}
 onRun={() => setRunning(r)}
 onEdit={() => setEditing(r)}
 onDelete={() => { if (confirm('למחוק את ה-routine?')) bbDeleteRoutine(r.id) }}
 />
 ))}
 </div>
 )}

 {empty && (
 <EmptyState
 icon=" "
 title="עוד אין לך Routines"
 subtitle="הפעל תוכנית מ-Explore, או בנה routine משלך"
 action={<Button variant="primary"size="lg"onClick={() => setCreatingNew(true)}>+ צור routine חדש</Button>}
 />
 )}

 {/* Modals */}
 {creatingNew && (
 <RoutineBuilder
 routine={null}
 open={creatingNew}
 onClose={() => setCreatingNew(false)}
 />
 )}
 {editing && (
 <RoutineBuilder
 routine={editing}
 open={!!editing}
 onClose={() => setEditing(null)}
 />
 )}
 {running && (
 <RoutineRunner
 routine={running}
 open={!!running}
 onClose={() => setRunning(null)}
 />
 )}
 </div>
 )
}

function RoutineCard({ routine, isSystem, onRun, onEdit, onDelete }) {
 const duration = estimateDurationMin(routine)
 return (
 <Card>
 <div style={{ display:'flex', alignItems:'flex-start', gap: 12 }}>
 <div style={{ fontSize: 28 }}>{routine.emoji || ''}</div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 4 }}>
 <b style={{ color: t.color.text, fontSize: t.font.md }}>{routine.name}</b>
 {isSystem && <Badge color={t.color.info}>מוכנה</Badge>}
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginBottom: 8 }}>
 {routine.exercises?.length || 0} תרגילים · ~{duration} דקות
 </div>
 <div style={{ display:'flex', gap: 4, flexWrap:'wrap'}}>
 {(routine.exercises || []).slice(0, 3).map((ex, i) => {
 const cataloged = EXERCISE_BY_ID[ex.exerciseId]
 const label = movementName(cataloged) || ex.exerciseName || ex.name
 return label ? (
 <span key={i} style={{
 fontSize: t.font.xs, color: t.color.textDim,
 background: t.color.bgSoft, padding:'2px 8px', borderRadius: t.radius.pill,
 }}>{label}</span>
 ) : null
 })}
 {(routine.exercises || []).length > 3 && (
 <span style={{ fontSize: t.font.xs, color: t.color.textMuted, padding:'2px 4px'}}>
 + {routine.exercises.length - 3}
 </span>
 )}
 </div>
 <div style={{ display:'flex', gap: 8, marginTop: 12, flexWrap:'wrap', alignItems:'center' }}>
 <Button variant="primary"size="sm"onClick={onRun}>התחל אימון</Button>
 <Button variant="ghost"size="sm"onClick={onEdit}>ערוך</Button>
 {onDelete && <Button variant="danger"size="sm" onClick={onDelete}>מחק</Button>}
 <PublishToCommunityChip routine={routine} />
 </div>
 </div>
 </div>
 </Card>
 )
}

// Compact publish chip — white background, wine-red text, matches the brand.
// Wraps the shared PublishWorkoutButton but styles it as a subtle chip so
// it sits comfortably next to the primary "Start workout" action.
function PublishToCommunityChip({ routine }) {
  const data = { name: routine.name, exercises: routine.exercises || [] }
  return (
    <span style={{ display:'inline-flex' }} className="hfos-publish-chip">
      <PublishWorkoutButton workoutType="routine" workoutData={data} buttonLabel="פרסם לקהילה" />
      <style>{`
        .hfos-publish-chip button {
          background: #fff !important;
          color: #6f1622 !important;
          border-color: #6f1622 !important;
          font-weight: 700 !important;
        }
        .hfos-publish-chip button:hover {
          background: #f6f4ee !important;
        }
        .hfos-publish-chip button[disabled] {
          opacity: 0.7;
        }
      `}</style>
    </span>
  )
}
