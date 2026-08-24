import React, { useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Modal, Tabs, Badge, Card } from '../../../../components/ui/UI'
import { useApp } from '../../../../store/AppStore'
import { MUSCLE_GROUPS, EQUIPMENT } from '../../../../data/bodybuilding/exercises'
import { strengthLevelFor } from '../../../../data/bodybuilding/strengthStandards'
import { movementName } from '../../../../data/movementName'

// Exercise detail modal — the reference's 4-tab structure: Summary / History / How to / Leaderboard.
export function ExerciseDetail({ exercise, open, onClose }) {
 const [tab, setTab] = useState('summary')
 const { state } = useApp()
 const prs = state.exercisePRs?.[exercise.id]
 const opt = state.workoutSettings?.leaderboardOptIn

 return (
 <Modal open={open} onClose={onClose} title={movementName(exercise)} width={640}>
 {/* Illustration placeholder + primary muscle */}
 <div style={{
 background: t.color.bgSoft, borderRadius: t.radius.md,
 padding: t.space.xl, textAlign:'center', marginBottom: t.space.md,
 }}>
 <div style={{ fontSize: 60, marginBottom: 8 }}>
 {EQUIPMENT[exercise.equipment]?.icon || ''}
 </div>
 <div style={{ color: t.color.text, fontSize: t.font.md, fontWeight: 700 }}>{exercise.en}</div>
 </div>

 {/* Muscles */}
 <div style={{ marginBottom: t.space.md, fontSize: t.font.sm }}>
 <div style={{ color: t.color.textDim }}>
 Primary: <b style={{ color: t.color.gold }}>{findMuscle(exercise.primaryMuscle)}</b>
 </div>
 {exercise.secondaryMuscles?.length > 0 && (
 <div style={{ color: t.color.textDim, marginTop: 4 }}>
 Secondary: {exercise.secondaryMuscles.map(findMuscle).join(',')}
 </div>
 )}
 </div>

 <Tabs
 tabs={[
 { key:'summary', label:'סיכום' },
 { key:'history', label:'היסטוריה' },
 { key:'howto', label:'איך' },
 { key:'leaderboard', label:'דירוג' },
 ]}
 active={tab}
 onChange={setTab}
 />

 {tab === 'summary'&& <SummaryTab exercise={exercise} prs={prs} state={state} />}
 {tab === 'history'&& <HistoryTab prs={prs} />}
 {tab === 'howto'&& <HowToTab exercise={exercise} />}
 {tab === 'leaderboard'&& <LeaderboardTab exercise={exercise} optedIn={opt} />}
 </Modal>
 )
}

function SummaryTab({ exercise, prs, state }) {
 const bw = state.profile?.weightKg
 const sex = state.profile?.sex
 const age = state.profile?.age
 const oneRM = prs?.best1RM?.kg
 const strengthLevel = oneRM && bw ? strengthLevelFor({ exerciseId: exercise.id, oneRM, bodyweight: bw, sex, age }) : null

 return (
 <div>
 {/* Personal Records */}
 <Card style={{ marginBottom: t.space.md }}>
 <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: t.space.md }}>
 <span style={{ fontSize: 20 }}> </span>
 <b style={{ color: t.color.gold, fontSize: t.font.md }}>Personal Records</b>
 </div>
 {!prs && (
 <div style={{ color: t.color.textDim, fontSize: t.font.sm, textAlign:'center', padding: 20 }}>
 עדיין אין נתונים. סיים אימון ונשמור לך שיאים.
 </div>
 )}
 {prs && (
 <div style={{ display:'grid', gap: 10 }}>
 <PRRow label="Heaviest Weight"value={prs.heaviestWeight && `${prs.heaviestWeight.weight}kg × ${prs.heaviestWeight.reps}`} />
 <PRRow label="Best 1RM (est.)"value={prs.best1RM && `${prs.best1RM.kg}kg`} />
 <PRRow label="Best Set Volume"value={prs.bestSetVolume && `${prs.bestSetVolume.total.toFixed(0)}kg (${prs.bestSetVolume.weight}×${prs.bestSetVolume.reps})`} />
 <PRRow label="Best Session Volume"value={prs.bestSessionVolume && `${prs.bestSessionVolume.total.toFixed(0)}kg`} />
 </div>
 )}
 </Card>

 {/* Strength Level */}
 {strengthLevel && (
 <Card style={{ marginBottom: t.space.md, borderColor: strengthLevel.levelInfo.color }}>
 <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: t.space.md }}>
 <span style={{ fontSize: 20 }}> </span>
 <b style={{ color: strengthLevel.levelInfo.color, fontSize: t.font.md }}>
 רמת כוח: {strengthLevel.levelInfo.he}
 </b>
 </div>
 <div style={{ fontSize: t.font.sm, color: t.color.text, marginBottom: 8 }}>
 יחס למשקל גוף: <b>{strengthLevel.ratio.toFixed(2)}x</b>
 </div>
 {strengthLevel.nextLevelInfo && (
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
 לרמת {strengthLevel.nextLevelInfo.he}: עוד <b style={{ color: strengthLevel.levelInfo.color }}>
 {strengthLevel.kgToNextLevel.toFixed(1)}kg
 </b>
 </div>
 )}
 </Card>
 )}

 {!strengthLevel && (
 <Card style={{ background: `${t.color.info}11`, borderColor: t.color.info }}>
 <div style={{ fontSize: t.font.sm, color: t.color.text, textAlign:'center'}}>
 הוסף/י מין, גיל ומשקל בפרופיל כדי לראות את רמת הכוח שלך
 </div>
 </Card>
 )}
 </div>
 )
}

function PRRow({ label, value }) {
 return (
 <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom: `1px solid ${t.color.border}` }}>
 <span style={{ color: t.color.textDim, fontSize: t.font.sm }}>{label}</span>
 <span style={{ color: value ? t.color.gold : t.color.textMuted, fontWeight: 700, fontSize: t.font.sm }}>
 {value || '—'}
 </span>
 </div>
 )
}

function HistoryTab({ prs }) {
 const history = prs?.history || []
 if (!history.length) {
 return <div style={{ padding: t.space.xxxl, textAlign:'center', color: t.color.textDim }}>אין היסטוריה עדיין.</div>
 }
 return (
 <div style={{ display:'grid', gap: 6 }}>
 {history.slice(0, 20).map((h, i) => (
 <div key={i} style={{
 display:'flex', justifyContent:'space-between',
 padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm,
 }}>
 <span style={{ fontSize: t.font.sm, color: t.color.text }}>
 {h.weight}kg × {h.reps}
 </span>
 <span style={{ fontSize: t.font.xs, color: t.color.textDim }}>
 {new Date(h.date).toLocaleDateString('he-IL')}
 </span>
 </div>
 ))}
 </div>
 )
}

function HowToTab({ exercise }) {
 const cues = exercise.cues || []
 if (!cues.length) {
 return <div style={{ padding: t.space.xxxl, textAlign:'center', color: t.color.textDim }}>אין הוראות מפורטות עדיין.</div>
 }
 return (
 <div style={{ display:'grid', gap: 12 }}>
 {exercise.ytId && (
 <div style={{ position:'relative', paddingBottom:'56.25%', height: 0, overflow:'hidden', borderRadius: t.radius.md, marginBottom: t.space.md }}>
 <iframe
 src={`https://www.youtube.com/embed/${exercise.ytId}`}
 style={{ position:'absolute', top: 0, left: 0, width:'100%', height:'100%', border: 0 }}
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen
 title={movementName(exercise)}
 />
 </div>
 )}
 <ol style={{ paddingRight: 20, color: t.color.text, lineHeight: 1.7 }}>
 {cues.map((step, i) => (
 <li key={i} style={{ marginBottom: 10, fontSize: t.font.sm }}>{step}</li>
 ))}
 </ol>
 </div>
 )
}

function LeaderboardTab({ exercise, optedIn }) {
 if (!optedIn) {
 return (
 <Card style={{ textAlign:'center'}}>
 <div style={{ fontSize: 40, marginBottom: 12 }}> </div>
 <div style={{ color: t.color.text, fontWeight: 700, marginBottom: 8 }}>Leaderboard</div>
 <div style={{ color: t.color.textDim, fontSize: t.font.sm, marginBottom: 16 }}>
 כדי להשתתף בדירוג הקהילתי, הפעל את האופציה בהגדרות האימון (Profile → Settings)
 </div>
 </Card>
 )
 }
 return (
 <div style={{ padding: t.space.xxxl, textAlign:'center', color: t.color.textDim }}>
 הדירוג יהיה זמין בקרוב (דורש backend leaderboard).
 </div>
 )
}

function findMuscle(key) {
 for (const body of Object.values(MUSCLE_GROUPS)) {
 if (body.muscles[key]) return body.muscles[key].he
 }
 return key
}
