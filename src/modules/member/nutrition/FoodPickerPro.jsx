import React, { useMemo, useState } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Card, Button, Input, Select, Badge, Modal, EmptyState } from '../../../components/ui/UI'
import { foods, portionSizes, lookupBarcode } from '../../../data/foods'
import { useI18n } from '../../../i18n/i18n'

// Enhanced picker with search, barcode, custom-food entry, and portion-size hints.
// Aggregates the user's recent/frequent meals so they can 1-tap add favorites.
export function FoodPickerPro({ open, onClose, onAdd }) {
 const { state, addCustomFood } = useApp()
 const { isRTL } = useI18n()
 const [tab, setTab] = useState('recent')
 const allFoods = useMemo(() => [...state.customFoods, ...foods], [state.customFoods])
 const recent = useMemo(() => computeRecentMeals(state.mealLogs), [state.mealLogs])

 if (!open) return null
 return (
 <Modal open={open} onClose={onClose} title={isRTL ? 'הוסף מזון' : 'Add food'} width={680}>
 <div style={{ display:'flex', gap: 4, background: t.color.bgSoft, padding: 4, borderRadius: t.radius.md, marginBottom: 16 }}>
 {[
 { key:'recent', label: `${isRTL ? 'המרשמים שלי' : 'My recipes'}${recent.length ? ` (${recent.length})` : ''}` },
 { key:'search', label: isRTL ? 'חיפוש' : 'Search' },
 { key:'barcode', label: isRTL ? 'ברקוד' : 'Barcode' },
 { key:'custom', label: isRTL ? 'מזון אישי' : 'Custom food' },
 ].map(x => (
 <button key={x.key} onClick={() => setTab(x.key)} style={{
 flex: 1, padding:'8px 8px', border:'none',
 background: tab === x.key ? t.color.bgCard :'transparent',
 color: tab === x.key ? t.color.gold : t.color.textDim,
 fontWeight: 600, fontFamily:'inherit', cursor:'pointer', borderRadius: t.radius.sm,
 fontSize: t.font.xs, whiteSpace:'nowrap',
 }}>{x.label}</button>
 ))}
 </div>

 {tab === 'recent'&& <RecentTab recent={recent} onAdd={onAdd} />}
 {tab === 'search'&& <SearchTab foods={allFoods} onAdd={onAdd} />}
 {tab === 'barcode'&& <BarcodeTab onAdd={onAdd} onSave={addCustomFood} />}
 {tab === 'custom'&& <CustomTab onAdd={onAdd} onSave={addCustomFood} customFoods={state.customFoods} />}
 </Modal>
 )
}

// Aggregate all meal logs into unique dishes with count + last-eaten date
function computeRecentMeals(mealLogs) {
 const map = new Map()
 const dateKeys = Object.keys(mealLogs || {}).sort().reverse() // newest first
 for (const date of dateKeys) {
 for (const m of (mealLogs[date] || [])) {
 const key = `${m.name}|${m.grams}` // dedup by name + grams
 if (map.has(key)) {
 map.get(key).count++
 } else {
 map.set(key, { ...m, count: 1, lastDate: date })
 }
 }
 }
 // Sort by count desc, then recent
 return Array.from(map.values())
 .sort((a, b) => (b.count - a.count) || (b.lastDate.localeCompare(a.lastDate)))
 .slice(0, 20) // top 20 most useful
}

function RecentTab({ recent, onAdd }) {
 if (!recent.length) {
 return (
 <EmptyState
 icon=""
 title="עדיין לא רשמת מרשמים"
 subtitle="לאחר שתוסיף כמה ארוחות, הן יופיעו כאן להוספה מהירה בקליק אחד"
 />
 )
 }
 return (
 <div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginBottom: 10, textAlign:'center'}}>
 לחץ על ארוחה כדי להוסיף אותה שוב באותה כמות
 </div>
 <div style={{ maxHeight: 380, overflowY:'auto', display:'grid', gap: 6 }}>
 {recent.map((m, i) => (
 <div key={i} onClick={() => onAdd({ foodId: m.foodId, name: m.name, grams: m.grams, kcal: m.kcal, p: m.p, c: m.c, f: m.f })}
 style={{
 display:'flex', justifyContent:'space-between', alignItems:'center',
 padding: 12, background: t.color.bgSoft, borderRadius: t.radius.md,
 cursor:'pointer', border: `1px solid ${t.color.border}`,
 transition: t.transition,
 }}
 onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.gold; e.currentTarget.style.background = t.color.goldGlow }}
 onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border; e.currentTarget.style.background = t.color.bgSoft }}
 >
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 600, display:'flex', gap: 8, alignItems:'center'}}>
 {m.name}
 <Badge color={t.color.textDim}>{m.grams}ג׳</Badge>
 {m.count > 2 && <Badge color={t.color.gold}>נאכל {m.count}x</Badge>}
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 2 }}>
 {Math.round(m.kcal)} קק״ל · חלבון {Math.round(m.p)}ג׳ · פחמימות {Math.round(m.c)}ג׳ · שומן {Math.round(m.f)}ג׳
 </div>
 </div>
 <div style={{ fontSize: 20, color: t.color.gold, fontWeight: 700 }}>+</div>
 </div>
 ))}
 </div>
 </div>
 )
}

function SearchTab({ foods: foodList, onAdd }) {
 const [q, setQ] = useState('')
 const [selected, setSelected] = useState(null)
 const [grams, setGrams] = useState(100)
 const [portionKey, setPortionKey] = useState('')

 const list = foodList.filter(f => !q || f.name.includes(q) || f.barcode?.includes(q))

 const applyPortion = (k) => {
 setPortionKey(k)
 if (portionSizes[k]) setGrams(portionSizes[k])
 }

 const commit = () => {
 if (!selected) return
 const factor = grams / 100
 onAdd({
 foodId: selected.id, name: selected.name, grams,
 kcal: selected.kcal * factor, p: selected.p * factor, c: selected.c * factor, f: selected.f * factor,
 })
 setSelected(null); setQ(''); setGrams(100); setPortionKey('')
 }

 return (
 <div>
 <Input placeholder="חפש מזון או ברקוד..." value={q} onChange={e => setQ(e.target.value)} />
 <div style={{ maxHeight: 240, overflowY:'auto', marginTop: 12, display:'grid', gap: 6 }}>
 {list.map(f => (
 <div key={f.id} onClick={() => setSelected(f)} style={{
 display:'flex', justifyContent:'space-between', alignItems:'center', padding: 10,
 background: selected?.id === f.id ? t.color.goldGlow : t.color.bgSoft,
 border: `1px solid ${selected?.id === f.id ? t.color.gold : t.color.border}`,
 borderRadius: t.radius.sm, cursor:'pointer',
 }}>
 <div>
 <div style={{ fontWeight: 600, display:'flex', gap: 8, alignItems:'center'}}>
 {f.name}
 {f.barcode && <Badge color={t.color.textDim}>{f.barcode.slice(-4)}</Badge>}
 {f.source === 'openfoodfacts'&& <Badge color={t.color.info}>OFF</Badge>}
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{f.kcal} קק״ל · {f.p}ח׳ · {f.c}פ׳ · {f.f}ש׳ / 100ג׳</div>
 </div>
 <Badge color={t.color.textDim}>{f.cat}</Badge>
 </div>
 ))}
 {!list.length && <EmptyState icon="" title="לא נמצאו תוצאות"/>}
 </div>
 {selected && (
 <div style={{ marginTop: 14, padding: 12, background: t.color.bgSoft, borderRadius: t.radius.md }}>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap: 10, alignItems:'end'}}>
 <Input type="number"label="גרם"value={grams} onChange={e => { setGrams(+e.target.value || 0); setPortionKey('') }} />
 <Select label="מנה מקובלת"value={portionKey} onChange={e => applyPortion(e.target.value)}>
 <option value="">בחר...</option>
 {Object.keys(portionSizes).map(k => <option key={k} value={k}>{k} ({portionSizes[k]}ג׳)</option>)}
 </Select>
 <Button onClick={commit}>הוסף ({Math.round(selected.kcal * grams/100)} קק״ל)</Button>
 </div>
 </div>
 )}
 </div>
 )
}

function BarcodeTab({ onAdd, onSave }) {
 const { isRTL } = useI18n()
 const [barcode, setBarcode] = useState('')
 const [status, setStatus] = useState(null) // null | 'loading'| 'found'| 'not-found'
 const [result, setResult] = useState(null)
 const [grams, setGrams] = useState(100)
 const [scanning, setScanning] = useState(false)

 const scanCode = async (code) => {
 setStatus('loading'); setResult(null)
 const r = await lookupBarcode(code.trim())
 if (r) { setResult(r); setStatus('found') }
 else setStatus('not-found')
 }

 const scan = () => barcode.trim() && scanCode(barcode.trim())

 const onDetected = (code) => {
 setBarcode(code)
 setScanning(false)
 scanCode(code)
 }

 const commit = (alsoSave) => {
 if (!result) return
 const factor = grams / 100
 onAdd({
 foodId: result.id, name: result.name, grams,
 kcal: result.kcal * factor, p: result.p * factor, c: result.c * factor, f: result.f * factor,
 })
 if (alsoSave && result.source !== 'local') {
 onSave({ id: result.id, name: result.name, cat: result.cat, kcal: result.kcal, p: result.p, c: result.c, f: result.f, barcode: result.barcode })
 }
 setResult(null); setBarcode(''); setStatus(null); setGrams(100)
 }

 const tryDemo = () => setBarcode('7290000000101')

 return (
 <div>
 {scanning && (
 <LazyBarcodeScanner
   onDetected={onDetected}
   onClose={() => setScanning(false)}
 />
 )}

 <div style={{
 background: t.color.bgSoft, borderRadius: t.radius.lg, padding: 20, textAlign:'center',
 border: `2px dashed ${t.color.border}`, marginBottom: 14,
 }}>
 <div style={{ marginBottom: 14 }}>
   <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={t.color.silver2} strokeWidth="1.6" strokeLinecap="round" style={{ opacity: 0.7 }}>
     <rect x="6" y="12" width="28" height="16" rx="2"/>
     <line x1="10" y1="16" x2="10" y2="24"/>
     <line x1="14" y1="16" x2="14" y2="24"/>
     <line x1="17" y1="16" x2="17" y2="24"/>
     <line x1="21" y1="16" x2="21" y2="24"/>
     <line x1="25" y1="16" x2="25" y2="24"/>
     <line x1="30" y1="16" x2="30" y2="24"/>
   </svg>
 </div>
 <div style={{ color: t.color.textDim, fontSize: t.font.sm, marginBottom: 14 }}>
 {isRTL ? 'סרוק עם המצלמה או הקלד ידנית' : 'Scan with the camera or type it in'}
 </div>

 <Button
   variant="primary"
   onClick={() => setScanning(true)}
   style={{ marginBottom: 12, minWidth: 200 }}
 >
   {isRTL ? 'פתח מצלמה לסריקה' : 'Open camera to scan'}
 </Button>

 <div style={{ display:'flex', gap: 8, maxWidth: 380, margin:'0 auto'}}>
 <Input
   placeholder={isRTL ? 'ברקוד (EAN-13)…' : 'Barcode (EAN-13)…'}
   value={barcode}
   onChange={e => setBarcode(e.target.value)}
 />
 <Button onClick={scan} disabled={status === 'loading'}>
   {status === 'loading' ? '…' : (isRTL ? 'חפש' : 'Look up')}
 </Button>
 </div>
 <button onClick={tryDemo} style={{
 marginTop: 10, background:'none', border:'none', color: t.color.gold,
 fontSize: t.font.xs, cursor:'pointer', textDecoration:'underline', fontFamily:'inherit',
 }}>{isRTL ? 'נסה עם ברקוד לדוגמה' : 'Try with a sample barcode'}</button>
 </div>

 {status === 'not-found'&& (
 <Card style={{ padding: 14, background:`${t.color.warning}15`, borderColor: t.color.warning }}>
 <div style={{ fontSize: t.font.sm, color: t.color.warning }}>
   {isRTL
     ? 'לא נמצא במאגר. תוכל להוסיף אותו ידנית דרך "מזון אישי".'
     : 'Not found in the database. Add it manually via "Custom food".'}
 </div>
 </Card>
 )}

 {result && (
 <Card style={{ padding: 16 }}>
 <div style={{ display:'flex', gap: 12, alignItems:'flex-start', marginBottom: 12 }}>
 {result.image && <img src={result.image} alt=""style={{ width: 60, height: 60, borderRadius: 10, objectFit:'cover'}} />}
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 700, fontSize: t.font.lg }}>{result.name}</div>
 {result.brand && <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{result.brand}</div>}
 <Badge color={result.source === 'openfoodfacts'? t.color.info : t.color.gold} style={{ marginTop: 6 }}>
 {result.source === 'openfoodfacts' ? 'OpenFoodFacts' : (isRTL ? 'מאגר מקומי' : 'Local database')}
 </Badge>
 </div>
 </div>

 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
 <MacroTile label={isRTL ? 'קק״ל' : 'kcal'} value={result.kcal} color={t.color.gold} />
 <MacroTile label={isRTL ? 'חלבון' : 'Protein'} value={result.p} color={t.color.info} />
 <MacroTile label={isRTL ? 'פחמ׳' : 'Carbs'} value={result.c} color={t.color.text} />
 <MacroTile label={isRTL ? 'שומן' : 'Fat'} value={result.f} color={t.color.warning} />
 </div>

 <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap: 10, alignItems:'end'}}>
 <Input type="number" label={isRTL ? 'גרם' : 'Grams'} value={grams} onChange={e => setGrams(+e.target.value || 0)} />
 <Button variant="ghost" onClick={() => commit(true)}>{isRTL ? 'הוסף + שמור למאגר' : 'Add + save to library'}</Button>
 <Button onClick={() => commit(false)}>
   {isRTL ? `הוסף (${Math.round(result.kcal * grams/100)} קק״ל)` : `Add (${Math.round(result.kcal * grams/100)} kcal)`}
 </Button>
 </div>
 </Card>
 )}
 </div>
 )
}

// Lazy-import the scanner only when the user actually opens the camera —
// keeps the BarcodeDetector code out of the initial bundle.
const LazyScanner = React.lazy(() =>
 import('../../../components/nutrition/BarcodeScanner').then(m => ({ default: m.BarcodeScanner }))
)
function LazyBarcodeScanner(props) {
 return (
   <React.Suspense fallback={null}>
     <LazyScanner {...props} />
   </React.Suspense>
 )
}

function CustomTab({ onAdd, onSave, customFoods }) {
 const [form, setForm] = useState({ name:'', cat:'חלבון', kcal:'', p:'', c:'', f:''})
 const [grams, setGrams] = useState(100)
 const set = (patch) => setForm(f => ({ ...f, ...patch }))

 const create = () => {
 if (!form.name) return
 const food = {
 id:'custom_'+ Date.now(),
 name: form.name, cat: form.cat,
 kcal: +form.kcal || 0, p: +form.p || 0, c: +form.c || 0, f: +form.f || 0,
 }
 onSave(food)
 const factor = grams / 100
 onAdd({ foodId: food.id, name: food.name, grams, kcal: food.kcal * factor, p: food.p * factor, c: food.c * factor, f: food.f * factor })
 setForm({ name:'', cat:'חלבון', kcal:'', p:'', c:'', f:''}); setGrams(100)
 }

 return (
 <div>
 <div style={{ display:'grid', gap: 10 }}>
 <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap: 10 }}>
 <Input label="שם המזון"placeholder="לדוגמה: פילה סלמון של הבית"value={form.name} onChange={e => set({ name: e.target.value })} />
 <Select label="קטגוריה"value={form.cat} onChange={e => set({ cat: e.target.value })}>
 {['חלבון','פחמימה','שומן','ירק','פרי','קטניה','מוצרי חלב','משקה','קינוח'].map(c => <option key={c} value={c}>{c}</option>)}
 </Select>
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 4 }}>ערכי מזון ל-100 גרם:</div>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 10 }}>
 <Input type="number"label="קלוריות"value={form.kcal} onChange={e => set({ kcal: e.target.value })} />
 <Input type="number"label="חלבון (ג׳)"value={form.p} onChange={e => set({ p: e.target.value })} />
 <Input type="number"label="פחמ׳ (ג׳)"value={form.c} onChange={e => set({ c: e.target.value })} />
 <Input type="number"label="שומן (ג׳)"value={form.f} onChange={e => set({ f: e.target.value })} />
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap: 10, alignItems:'end'}}>
 <Input type="number"label="כמות שאכלת עכשיו (גרם)" value={grams} onChange={e => setGrams(+e.target.value || 0)} />
 <Button onClick={create} disabled={!form.name}>הוסף למאגר + היום</Button>
 </div>
 </div>

 {customFoods.length > 0 && (
 <div style={{ marginTop: 20 }}>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 8 }}>המאגר האישי שלך ({customFoods.length}):</div>
 <div style={{ display:'grid', gap: 6, maxHeight: 200, overflowY:'auto'}}>
 {customFoods.map(f => (
 <div key={f.id} style={{ display:'flex', justifyContent:'space-between', padding: 8, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <span style={{ fontSize: t.font.sm }}>{f.name}</span>
 <span style={{ fontSize: t.font.xs, color: t.color.textDim }}>{f.kcal} קק״ל · {f.p}/{f.c}/{f.f}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )
}

function MacroTile({ label, value, color }) {
 return (
 <div style={{ padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm, textAlign:'center' }}>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color }}>{value}</div>
 <div style={{ fontSize: 10, color: t.color.textMuted }}>{label}</div>
 </div>
 )
}
