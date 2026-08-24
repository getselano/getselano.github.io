import React, { useMemo, useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Card, Button, Select, Badge, SectionHeader, Tabs } from '../../../../components/ui/UI'
import { useApp } from '../../../../store/AppStore'
import { generateWOD } from '../../../../data/crossfit/generator'
import { MOVEMENT_BY_ID } from '../../../../data/crossfit/movements'
import { FORMATS } from '../../../../data/crossfit/formats'
import { MovementPicker } from './MovementPicker'
import { WodDisplay } from './WodDisplay'
import { WodTimer } from './WodTimer'
import { BenchmarkList } from './BenchmarkList'
import { useI18n } from '../../../../i18n/i18n'
import { movementName } from '../../../../data/movementName'

const INTENTS = [
 { key:'general',    he:'כללי',      icon:'', desc:'אימון מאוזן'},
 { key:'hybrid',     he:'היברידי',    icon:'', desc:'כוח + סיבולת בסשן אחד'},
 { key:'strength',   he:'כוח',        icon:'', desc:'בניית שריר ועוצמה'},
 { key:'endurance',  he:'סיבולת',     icon:'', desc:'קרדיו וסיבולת'},
 { key:'fat_loss',   he:'שריפת שומן', icon:'', desc:'HIIT + שריפת קלוריות'},
 { key:'skill',      he:'טכניקה',     icon:'', desc:'מיומנות ותיאום'},
 { key:'recovery',   he:'התאוששות',   icon:'', desc:'תנועה קלה ומוביליות'},
 { key:'competition',he:'תחרות',      icon:'', desc:'ספציפי למתחרים'},
]

const LENGTHS = [
 { key:'short', he:'קצר', desc:'5-12 דק׳', icon:'' },
 { key:'medium', he:'בינוני', desc:'15-25 דק׳', icon:'⏰'},
 { key:'long', he:'ארוך', desc:'30-45 דק׳', icon:'⏳'},
]

export function CrossFitWod() {
 const [tab, setTab] = useState('generator')
 const { t: tr } = useI18n()
 return (
 <div>
 <Tabs
 tabs={[
 { key:'generator', label: tr('wod.tab.generator') },
 { key:'benchmarks', label: tr('wod.tab.benchmarks') },
 { key:'history', label: tr('wod.tab.history') },
 ]}
 active={tab}
 onChange={setTab}
 />
 {tab === 'generator'&& <Generator />}
 {tab === 'benchmarks'&& <BenchmarksTab />}
 {tab === 'history'&& <HistoryTab />}
 </div>
 )
}

function Generator() {
 const { state, logWorkout } = useApp()
 const injuries = state.profile?.injuries || parseInjuries(state.profile?.constraints)
 const sex = state.profile?.sex || 'male'
 const age = state.profile?.age || 30

 const [selectionMode, setSelectionMode] = useState('random') // 'random'| 'custom'
 const [customIds, setCustomIds] = useState([])
 const [useAll, setUseAll] = useState(false)
 const [pickerOpen, setPickerOpen] = useState(false)
 const [format, setFormat] = useState('random')
 const [intent, setIntent] = useState('general')
 const [length, setLength] = useState('medium')
 const [wod, setWod] = useState(null)
 const [timerOpen, setTimerOpen] = useState(false)

 function handleGenerate() {
 // Feed the previous WOD's movements + format to the generator so
 // "מחולל חדש"produces a visibly different workout — not the same
 // movements reshuffled.
 const prevMovementIds = (wod?.movements || []).map(m => m.id)
 const prevFormat = wod?.format || null
 const result = generateWOD({
 selectionMode,
 customMovementIds: customIds,
 useAllSelected: useAll,
 format,
 intent,
 length,
 sex, age, injuries,
 avoidMovementIds: prevMovementIds,
 avoidFormat: prevFormat,
 })
 setWod(result)
 if (typeof window !== 'undefined') window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth'})
 }

 function handleComplete(result) {
 logWorkout({
 date: result.completedAt,
 sessionName: `WOD — ${result.wod.title}`,
 exercises: (result.wod.movements || []).map(m => ({
 id: m.id, name: movementName(m), sets: [{ w: 0, r: 0, rpe: 0 }],
 })),
 wodMeta: {
 format: result.wod.format,
 finalTime: result.finalTime,
 rounds: result.rounds,
 lines: result.wod.lines,
 },
 })
 setTimerOpen(false)
 alert(` נשמר בהיסטוריה! זמן: ${formatMS(result.finalTime)}${result.rounds ? ` · ${result.rounds} סבבים` :''}`)
 }

 return (
 <div>
 <SectionHeader
 title=" מחולל WOD"
 subtitle="בחר, לחץ Generate, וקבל אימון WOD מותאם אישית"
 />

 {/* Selection Mode */}
 <Card style={{ marginBottom: t.space.md }}>
 <SectionLabel> בחירת תנועות</SectionLabel>
 <div style={{ display:'flex', gap: 8 }}>
 <ModeButton active={selectionMode === 'random'} onClick={() => setSelectionMode('random')}
 label="אקראי" desc="המערכת תבחר"/>
 <ModeButton active={selectionMode === 'custom'} onClick={() => setSelectionMode('custom')}
 label=" מותאם"desc="אני בוחר תנועות"/>
 </div>

 {selectionMode === 'custom'&& (
 <div style={{ marginTop: t.space.md }}>
 <div style={{ display:'flex', flexWrap:'wrap', gap: 6, marginBottom: 8 }}>
 {customIds.map(id => {
 const m = MOVEMENT_BY_ID[id]
 if (!m) return null
 return (
 <span key={id} onClick={() => setCustomIds(customIds.filter(x => x !== id))}
 style={{
 padding:'6px 12px', background: t.color.bgSoft,
 border: `1px solid ${t.color.border}`, borderRadius: t.radius.pill,
 color: t.color.text, fontSize: t.font.sm, cursor:'pointer',
 display:'inline-flex', alignItems:'center', gap: 6,
 }}>
 {movementName(m)} <span style={{ color: t.color.textMuted }}>×</span>
 </span>
 )
 })}
 <Button variant="outline"size="sm"onClick={() => setPickerOpen(true)}>
 + הוסף תנועות
 </Button>
 </div>
 {customIds.length > 0 && (
 <div style={{ display:'flex', gap: 8 }}>
 <ModeButton active={!useAll} onClick={() => setUseAll(false)}
 label="השתמש בחלק"desc="המערכת תבחר תת-קבוצה"small />
 <ModeButton active={useAll} onClick={() => setUseAll(true)}
 label="השתמש בכולן"desc="כל התנועות ישולבו"small />
 </div>
 )}
 </div>
 )}
 </Card>

 {/* Format */}
 <Card style={{ marginBottom: t.space.md }}>
 <SectionLabel> פורמט</SectionLabel>
 <Select value={format} onChange={e => setFormat(e.target.value)}>
 {Object.values(FORMATS).map(f => (
 <option key={f.id} value={f.id}>{f.icon} {f.he} — {f.description}</option>
 ))}
 </Select>
 </Card>

 {/* Intent */}
 <Card style={{ marginBottom: t.space.md }}>
 <SectionLabel> מטרת האימון</SectionLabel>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
 {INTENTS.map(i => (
 <button key={i.key} onClick={() => setIntent(i.key)}
 style={{
 padding: 12, borderRadius: t.radius.sm,
 border: `1.5px solid ${intent === i.key ? t.color.gold : t.color.border}`,
 background: intent === i.key ? `${t.color.gold}22` : t.color.bgSoft,
 color: t.color.text, cursor:'pointer', fontFamily:'inherit',
 textAlign:'center', transition: t.transition,
 }}>
 <div style={{ fontSize: 20, marginBottom: 4 }}>{i.icon}</div>
 <div style={{ fontSize: t.font.sm, fontWeight: 700, color: intent === i.key ? t.color.gold : t.color.text }}>{i.he}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 2 }}>{i.desc}</div>
 </button>
 ))}
 </div>
 </Card>

 {/* Length */}
 <Card style={{ marginBottom: t.space.md }}>
 <SectionLabel>⏱️ אורך האימון</SectionLabel>
 <div style={{ display:'flex', gap: 8 }}>
 {LENGTHS.map(l => (
 <button key={l.key} onClick={() => setLength(l.key)}
 style={{
 flex: 1, padding: 14, borderRadius: t.radius.sm,
 border: `1.5px solid ${length === l.key ? t.color.gold : t.color.border}`,
 background: length === l.key ? `${t.color.gold}22` : t.color.bgSoft,
 color: t.color.text, cursor:'pointer', fontFamily:'inherit',
 textAlign:'center', transition: t.transition,
 }}>
 <div style={{ fontSize: 22, marginBottom: 4 }}>{l.icon}</div>
 <div style={{ fontSize: t.font.md, fontWeight: 700, color: length === l.key ? t.color.gold : t.color.text }}>{l.he}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 2 }}>{l.desc}</div>
 </button>
 ))}
 </div>
 </Card>

 {/* Injuries banner if any */}
 {injuries.length > 0 && (
 <Card style={{ background: `${t.color.info}11`, borderColor: t.color.info, marginBottom: t.space.md }}>
 <div style={{ fontSize: t.font.sm, color: t.color.text }}>
 המחולל יימנע מתנועות שאינן מתאימות למגבלות שלך: {injuries.join(',')}
 </div>
 </Card>
 )}

 {/* Generate */}
 <Button variant="primary"size="lg"onClick={handleGenerate}
 style={{ width:'100%', justifyContent:'center', fontSize: t.font.lg, padding:'16px', marginBottom: t.space.lg }}>
 Generate WOD
 </Button>

 {/* Result */}
 {wod && (
 <WodDisplay
 wod={wod}
 onStart={() => setTimerOpen(true)}
 onRegenerate={handleGenerate}
 />
 )}

 <MovementPicker
 open={pickerOpen}
 onClose={() => setPickerOpen(false)}
 selected={customIds}
 onChange={setCustomIds}
 injuries={injuries}
 />

 <WodTimer
 wod={wod}
 open={timerOpen}
 onClose={() => setTimerOpen(false)}
 onComplete={handleComplete}
 />
 </div>
 )
}

function BenchmarksTab() {
 const { state, saveBenchmarkPR, logWorkout } = useApp()
 const prs = state.benchmarkPRs || {}

 function handleSave(pr) {
 if (saveBenchmarkPR) saveBenchmarkPR(pr)
 // also log to workout history
 logWorkout({
 date: pr.completedAt,
 sessionName: `Benchmark — ${pr.benchmarkId}`,
 exercises: [],
 wodMeta: { benchmarkId: pr.benchmarkId, finalTime: pr.time, rounds: pr.rounds },
 })
 }

 return <BenchmarkList prs={prs} onSavePR={handleSave} />
}

function HistoryTab() {
 const { state } = useApp()
 const wodLogs = (state.workoutLogs || []).filter(l => l.sessionName?.startsWith('WOD') || l.sessionName?.startsWith('CrossFit') || l.sessionName?.startsWith('Benchmark'))

 if (wodLogs.length === 0) {
 return (
 <div style={{ padding: t.space.xxxl, textAlign:'center', color: t.color.textDim }}>
 <div style={{ fontSize: 48, marginBottom: 12 }}> </div>
 <div style={{ color: t.color.text, fontSize: t.font.lg, fontWeight: 600 }}>אין עדיין WODs בהיסטוריה</div>
 <div style={{ fontSize: t.font.sm, marginTop: 6 }}>סיים את ה-WOD הראשון שלך והוא ייכתב כאן</div>
 </div>
 )
 }

 return (
 <div style={{ display:'grid', gap: 10 }}>
 {wodLogs.map((log, i) => (
 <Card key={i}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 8 }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 700, color: t.color.text, marginBottom: 4 }}>{log.sessionName}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
 {new Date(log.date).toLocaleDateString('he-IL', { weekday:'short', day:'numeric', month:'long'})}
 </div>
 {log.wodMeta?.lines && (
 <pre style={{
 fontFamily:'Space Mono, monospace', fontSize: t.font.xs,
 color: t.color.textDim, marginTop: 8, whiteSpace:'pre-wrap',
 direction:'rtl', textAlign:'right', margin:'8px 0 0',
 }}>{log.wodMeta.lines.slice(0, 3).join('\n')}</pre>
 )}
 </div>
 {log.wodMeta?.finalTime != null && (
 <Badge color={t.color.gold}>{formatMS(log.wodMeta.finalTime)}</Badge>
 )}
 {log.wodMeta?.rounds != null && log.wodMeta.rounds > 0 && (
 <Badge color={t.color.info}>{log.wodMeta.rounds} סב׳</Badge>
 )}
 </div>
 </Card>
 ))}
 </div>
 )
}

// ─── Helpers ─────────────────────────
function SectionLabel({ children }) {
 return <div style={{ fontSize: t.font.sm, color: t.color.textDim, fontWeight: 600, marginBottom: 10 }}>{children}</div>
}

function ModeButton({ active, onClick, label, desc, small }) {
 return (
 <button onClick={onClick} style={{
 flex: 1, padding: small ? '10px':'14px',
 borderRadius: t.radius.sm,
 border: `1.5px solid ${active ? t.color.gold : t.color.border}`,
 background: active ? `${t.color.gold}22` : t.color.bgSoft,
 color: t.color.text, cursor:'pointer', fontFamily:'inherit',
 textAlign:'center', transition: t.transition,
 }}>
 <div style={{ fontSize: small ? t.font.sm : t.font.md, fontWeight: 700, color: active ? t.color.gold : t.color.text }}>{label}</div>
 {desc && <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 4 }}>{desc}</div>}
 </button>
 )
}

function formatMS(sec) {
 if (sec == null) return '—'
 const m = Math.floor(sec / 60), s = sec % 60
 return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

// Parse constraints string like "כאב ברך, כתף רגישה" into keys the movement DB understands.
function parseInjuries(constraints) {
 if (!constraints) return []
 const s = constraints.toLowerCase()
 const map = {
 'ברך':'knee','כתף':'shoulder','גב תחתון':'lower_back','גב':'lower_back',
 'קרסול':'ankle','שורש כף היד':'wrist','מרפק':'elbow','צוואר':'neck',
 'אכילס':'achilles','שוק':'calf','חזה':'chest','כף יד':'hand',
 }
 const found = new Set()
 for (const [he, key] of Object.entries(map)) {
 if (s.includes(he)) found.add(key)
 }
 return [...found]
}
