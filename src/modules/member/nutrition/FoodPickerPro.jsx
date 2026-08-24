import React, { useEffect, useMemo, useRef, useState } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Card, Button, Input, Select, Badge, Modal, EmptyState } from '../../../components/ui/UI'
import { foods, portionSizes, lookupBarcode, searchFoodsOnline, scaleFood, MICRO_KEYS } from '../../../data/foods'
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
 // Strip the aggregation-only fields and re-log everything else, so
 // micronutrients captured on the original entry survive the quick-add.
 <div key={i} onClick={() => { const { count, lastDate, ...entry } = m; onAdd(entry) }}
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
 const [online, setOnline] = useState([])
 const [searching, setSearching] = useState(false)
 const [searched, setSearched] = useState(false)

 const local = foodList.filter(f => !q || f.name.includes(q) || f.barcode?.includes(q))

 // Debounced OpenFoodFacts lookup. The local library is 28 items — without
 // this, anything the user actually eats is unreachable unless it happens to
 // be a packaged good they can scan.
 useEffect(() => {
   const term = q.trim()
   if (term.length < 2) { setOnline([]); setSearched(false); setSearching(false); return }
   const ctrl = new AbortController()
   setSearching(true)
   const timer = setTimeout(async () => {
     const results = await searchFoodsOnline(term, { signal: ctrl.signal })
     if (ctrl.signal.aborted) return
     // Don't re-offer something already in the local library
     const known = new Set(foodList.map(f => f.barcode).filter(Boolean))
     setOnline(results.filter(r => !known.has(r.barcode)))
     setSearching(false)
     setSearched(true)
   }, 450)
   return () => { clearTimeout(timer); ctrl.abort() }
 }, [q, foodList])

 const applyPortion = (k) => {
 setPortionKey(k)
 if (portionSizes[k]) setGrams(portionSizes[k])
 }

 const commit = () => {
 if (!selected) return
 onAdd(scaleFood(selected, grams))
 setSelected(null); setQ(''); setGrams(100); setPortionKey('')
 }

 const noResults = !!q.trim() && !local.length && !online.length && !searching

 return (
 <div>
 <Input placeholder="חפש מזון או ברקוד..." value={q} onChange={e => setQ(e.target.value)} />

 <div style={{ maxHeight: 260, overflowY:'auto', marginTop: 12, display:'grid', gap: 6 }}>
 {!!local.length && (
 <ResultGroup label={`המאגר שלך (${local.length})`} />
 )}
 {local.map(f => (
 <FoodRow key={f.id} food={f} active={selected?.id === f.id} onPick={() => setSelected(f)} />
 ))}

 {searching && (
 <div style={{ padding: 12, textAlign:'center', color: t.color.textDim, fontSize: t.font.xs }}>
 מחפש ב-OpenFoodFacts…
 </div>
 )}
 {!!online.length && (
 <ResultGroup label={`OpenFoodFacts (${online.length})`} />
 )}
 {online.map(f => (
 <FoodRow key={f.id} food={f} active={selected?.id === f.id} onPick={() => setSelected(f)} />
 ))}

 {noResults && (
 <EmptyState
 title="לא נמצאו תוצאות"
 subtitle={searched ? 'נסה שם אחר, סרוק ברקוד, או הוסף דרך "מזון אישי"' : undefined}
 />
 )}
 </div>

 {selected && (
 <div style={{ marginTop: 14, padding: 12, background: t.color.bgSoft, borderRadius: t.radius.md }}>
 <div style={{ fontWeight: 700, marginBottom: 8 }}>{selected.name}</div>
 <NutrientPreview food={selected} grams={grams} />
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap: 10, alignItems:'end', marginTop: 12 }}>
 <Input type="number"label="גרם"value={grams} onChange={e => { setGrams(+e.target.value || 0); setPortionKey('') }} />
 <Select label="מנה מקובלת"value={portionKey} onChange={e => applyPortion(e.target.value)}>
 <option value="">בחר...</option>
 {Object.keys(portionSizes).map(k => <option key={k} value={k}>{k} ({portionSizes[k]}ג׳)</option>)}
 </Select>
 <Button onClick={commit}>הוסף ({Math.round((selected.kcal || 0) * grams/100)} קק״ל)</Button>
 </div>
 </div>
 )}
 </div>
 )
}

function ResultGroup({ label }) {
 return (
 <div style={{
 fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.2em',
 color: t.color.silver2, fontWeight: 700, textTransform:'uppercase',
 padding:'6px 2px 2px',
 }}>{label}</div>
 )
}

function FoodRow({ food: f, active, onPick }) {
 return (
 <div onClick={onPick} style={{
 display:'flex', justifyContent:'space-between', alignItems:'center', gap: 10, padding: 10,
 background: active ? t.color.goldGlow : t.color.bgSoft,
 border: `1px solid ${active ? t.color.gold : t.color.border}`,
 borderRadius: t.radius.sm, cursor:'pointer',
 }}>
 {f.image && (
 <img src={f.image} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit:'cover', flexShrink: 0 }} />
 )}
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ fontWeight: 600, display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap'}}>
 <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth: 220 }}>{f.name}</span>
 {f.source === 'openfoodfacts' && <Badge color={t.color.info}>OFF</Badge>}
 </div>
 {f.brand && <div style={{ fontSize: 10, color: t.color.textMuted }}>{f.brand}</div>}
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
 {f.kcal} קק״ל · {f.p}ח׳ · {f.c}פ׳ · {f.f}ש׳ / 100ג׳
 </div>
 </div>
 <Badge color={t.color.textDim}>{f.cat}</Badge>
 </div>
 )
}

// Shows what will actually be logged at the chosen amount, micros included.
function NutrientPreview({ food, grams }) {
 const scaled = scaleFood(food, grams)
 const micros = MICRO_KEYS.filter(k => scaled[k] != null)
 const cell = (label, value, unit, color) => (
 <div key={label} style={{ padding:'6px 8px', background: t.color.bgCard, borderRadius: t.radius.sm, textAlign:'center' }}>
 <div style={{ fontSize: t.font.sm, fontWeight: 800, color: color || t.color.text }}>{value}{unit}</div>
 <div style={{ fontSize: 9, color: t.color.textMuted }}>{label}</div>
 </div>
 )
 return (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6 }}>
 {cell('קק״ל', Math.round(scaled.kcal), '', t.color.gold)}
 {cell('חלבון', scaled.p, 'ג׳', t.color.info)}
 {cell('פחמ׳', scaled.c, 'ג׳')}
 {cell('שומן', scaled.f, 'ג׳', t.color.warning)}
 {micros.includes('fiber')  && cell('סיבים', scaled.fiber, 'ג׳', t.color.success)}
 {micros.includes('sugar')  && cell('סוכר', scaled.sugar, 'ג׳')}
 {micros.includes('satFat') && cell('רווי', scaled.satFat, 'ג׳')}
 {micros.includes('sodium') && cell('נתרן', Math.round(scaled.sodium), 'מ״ג')}
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
 onAdd(scaleFood(result, grams))
 if (alsoSave && result.source !== 'local') {
 // Keep the micros on the saved copy too, so re-adding it later from the
 // personal library carries the same detail as the original scan.
 const saved = {
 id: result.id, name: result.name, cat: result.cat,
 kcal: result.kcal, p: result.p, c: result.c, f: result.f,
 barcode: result.barcode,
 }
 for (const k of MICRO_KEYS) if (result[k] != null) saved[k] = result[k]
 onSave(saved)
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

 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 8, marginBottom: 10 }}>
 <MacroTile label={isRTL ? 'קק״ל' : 'kcal'} value={result.kcal} color={t.color.gold} />
 <MacroTile label={isRTL ? 'חלבון' : 'Protein'} value={result.p} color={t.color.info} />
 <MacroTile label={isRTL ? 'פחמ׳' : 'Carbs'} value={result.c} color={t.color.text} />
 <MacroTile label={isRTL ? 'שומן' : 'Fat'} value={result.f} color={t.color.warning} />
 </div>

 {MICRO_KEYS.some(k => result[k]) && (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
 <MacroTile label={isRTL ? 'סיבים' : 'Fiber'} value={result.fiber ?? 0} color={t.color.success} />
 <MacroTile label={isRTL ? 'סוכר' : 'Sugar'} value={result.sugar ?? 0} color={t.color.text} />
 <MacroTile label={isRTL ? 'רווי' : 'Sat fat'} value={result.satFat ?? 0} color={t.color.text} />
 <MacroTile label={isRTL ? 'נתרן מ״ג' : 'Sodium mg'} value={Math.round(result.sodium ?? 0)} color={t.color.text} />
 </div>
 )}

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

const EMPTY_CUSTOM = { name:'', cat:'חלבון', kcal:'', p:'', c:'', f:'', fiber:'', sugar:'', satFat:'', sodium:'' }

function CustomTab({ onAdd, onSave, customFoods }) {
 const [form, setForm] = useState(EMPTY_CUSTOM)
 const [grams, setGrams] = useState(100)
 const [showMicros, setShowMicros] = useState(false)
 const set = (patch) => setForm(f => ({ ...f, ...patch }))

 const create = () => {
 if (!form.name) return
 const food = {
 id:'custom_'+ Date.now(),
 name: form.name, cat: form.cat,
 kcal: +form.kcal || 0, p: +form.p || 0, c: +form.c || 0, f: +form.f || 0,
 }
 // Micros are optional — only attach the ones actually filled in, so an
 // untouched field stays absent rather than logging a fake zero.
 for (const k of MICRO_KEYS) {
 if (String(form[k] ?? '').trim() !== '') food[k] = +form[k] || 0
 }
 onSave(food)
 onAdd(scaleFood(food, grams))
 setForm(EMPTY_CUSTOM); setGrams(100); setShowMicros(false)
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

 <button type="button" onClick={() => setShowMicros(v => !v)} style={{
 background:'transparent', border:'none', color: t.color.gold, cursor:'pointer',
 fontFamily:'inherit', fontSize: t.font.xs, textAlign:'start', padding:'2px 0',
 }}>
 {showMicros ? '− הסתר ערכים נוספים' : '+ ערכים נוספים (סיבים · סוכר · רווי · נתרן) — לא חובה'}
 </button>

 {showMicros && (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 10 }}>
 <Input type="number"label="סיבים (ג׳)"value={form.fiber} onChange={e => set({ fiber: e.target.value })} />
 <Input type="number"label="סוכר (ג׳)"value={form.sugar} onChange={e => set({ sugar: e.target.value })} />
 <Input type="number"label="רווי (ג׳)"value={form.satFat} onChange={e => set({ satFat: e.target.value })} />
 <Input type="number"label="נתרן (מ״ג)"value={form.sodium} onChange={e => set({ sodium: e.target.value })} />
 </div>
 )}

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
