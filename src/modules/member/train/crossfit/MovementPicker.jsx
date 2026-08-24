import React, { useMemo, useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Modal, Button, Input, Badge } from '../../../../components/ui/UI'
import { MOVEMENTS, CATEGORIES, filterByInjuries } from '../../../../data/crossfit/movements'
import { movementName } from '../../../../data/movementName'

// Movement picker modal — modeled on wod-gpt's picker.
// Grouped by category, searchable, multi-select, with "select all"per category.
export function MovementPicker({ open, onClose, selected = [], onChange, injuries = [] }) {
 const [query, setQuery] = useState('')

 const filtered = useMemo(() => {
 const pool = filterByInjuries(MOVEMENTS, injuries)
 if (!query.trim()) return pool
 const q = query.toLowerCase()
 return pool.filter(m =>
 m.he.toLowerCase().includes(q) ||
 m.en.toLowerCase().includes(q) ||
 CATEGORIES[m.category]?.he.toLowerCase().includes(q)
 )
 }, [query, injuries])

 const grouped = useMemo(() => {
 const g = {}
 for (const m of filtered) {
 if (!g[m.category]) g[m.category] = []
 g[m.category].push(m)
 }
 return g
 }, [filtered])

 const selectedSet = new Set(selected)

 function toggle(id) {
 const next = selectedSet.has(id) ? selected.filter(x => x !== id) : [...selected, id]
 onChange(next)
 }

 function toggleCategory(cat) {
 const ids = grouped[cat].map(m => m.id)
 const allIn = ids.every(id => selectedSet.has(id))
 const next = allIn
 ? selected.filter(x => !ids.includes(x))
 : [...new Set([...selected, ...ids])]
 onChange(next)
 }

 return (
 <Modal open={open} onClose={onClose} title="בחר תנועות"width={640}>
 <div style={{ marginBottom: t.space.md }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12 }}>
 <div style={{ color: t.color.textDim, fontSize: t.font.sm }}>
 נבחרו: <span style={{ color: t.color.gold, fontWeight: 700 }}>{selected.length}</span>
 </div>
 {selected.length > 0 && (
 <Button variant="ghost"size="sm"onClick={() => onChange([])}>נקה הכל</Button>
 )}
 </div>
 <Input
 placeholder="חיפוש תנועה…"
 value={query}
 onChange={e => setQuery(e.target.value)}
 />
 </div>

 {Object.keys(grouped).length === 0 && (
 <div style={{ padding: t.space.xxl, textAlign:'center', color: t.color.textDim }}>
 לא נמצאו תנועות. נסה חיפוש אחר.
 </div>
 )}

 {Object.entries(grouped).map(([cat, movements]) => {
 const catInfo = CATEGORIES[cat]
 const ids = movements.map(m => m.id)
 const allIn = ids.every(id => selectedSet.has(id))
 return (
 <div key={cat} style={{ marginBottom: t.space.lg }}>
 <div
 onClick={() => toggleCategory(cat)}
 style={{
 display:'flex', alignItems:'center', gap: 10, cursor:'pointer',
 padding:'8px 4px', marginBottom: 8,
 }}
 >
 <span style={{ fontSize: t.font.md, fontWeight: 700, color: t.color.text }}>{catInfo.he}</span>
 <div style={{
 width: 18, height: 18, borderRadius: 4,
 border: `2px solid ${allIn ? catInfo.color : t.color.border}`,
 background: allIn ? catInfo.color :'transparent',
 display:'flex', alignItems:'center', justifyContent:'center',
 }}>
 {allIn && <span style={{ color:'#0d0d14', fontSize: 12, fontWeight: 900 }}> </span>}
 </div>
 <span style={{ fontSize: t.font.xs, color: t.color.textDim, marginRight:'auto'}}>
 (בחר הכל)
 </span>
 </div>

 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
 {movements.map(m => {
 const on = selectedSet.has(m.id)
 return (
 <button
 key={m.id}
 onClick={() => toggle(m.id)}
 style={{
 padding:'12px 10px',
 background: on ? `${catInfo.color}33` : t.color.bgSoft,
 border: `1.5px solid ${on ? catInfo.color : t.color.border}`,
 borderRadius: t.radius.sm,
 color: on ? catInfo.color : t.color.text,
 fontFamily:'inherit', fontSize: t.font.sm, fontWeight: 600,
 cursor:'pointer', transition: t.transition, textAlign:'center',
 }}
 >
 {movementName(m)}
 </button>
 )
 })}
 </div>
 </div>
 )
 })}

 <div style={{ position:'sticky', bottom: -24, background: t.color.bgElevated, padding:'16px 0', marginTop: 16, borderTop: `1px solid ${t.color.border}` }}>
 <Button variant="primary"size="lg" onClick={onClose} style={{ width:'100%', justifyContent:'center' }}>
 סיים ({selected.length} תנועות)
 </Button>
 </div>
 </Modal>
 )
}
