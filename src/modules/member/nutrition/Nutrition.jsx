import React, { useMemo, useState } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Card, Button, Input, Select, Badge, SectionHeader, Tabs, Modal, EmptyState, ProgressBar } from '../../../components/ui/UI'
import { DonutSegments } from '../../../components/charts/Charts'
import { bmr, tdee, macros, activityFactors, goalAdjustments, dietTemplates, bmi, waterLiters } from '../../../utils/calc'
import { foods } from '../../../data/foods'
import { dietInfo } from '../../../data/dietTemplates'
import { bloodMarkers, statusForValue } from '../../../data/bloodMarkers'
import { extractBloodMarkersFromFile, aiEnabled } from '../../../services/aiCoach'
import { todayKey } from '../../../utils/date'
import { MealPlanner } from './MealPlanner'
import { FoodPickerPro } from './FoodPickerPro'
import { DishBuilder } from './DishBuilder'
import { DisclaimerNote } from '../../../components/legal/DisclaimerNote'
import { WaterTracker } from '../../../components/nutrition/WaterTracker'
import { RecipeThumb } from '../../../components/nutrition/RecipeThumb'
import { recipes } from '../../../data/recipes'
import { useI18n } from '../../../i18n/i18n'

export function Nutrition() {
 const { isRTL } = useI18n()
 const [tab, setTab] = useState('today')
 return (
 <>
 <DisclaimerNote kind={tab === 'blood' ? 'medical' : 'nutrition'} />
 <Tabs tabs={[
 { key:'today', label: isRTL ? 'היום' : 'Today'},
 { key:'planner', label: isRTL ? 'תכנון שבועי' : 'Weekly plan'},
 { key:'recipes', label: isRTL ? 'מרשמים' : 'Recipes'},
 { key:'calc', label: isRTL ? 'מחשבון' : 'Calculator'},
 { key:'diets', label: isRTL ? 'תבניות דיאטה' : 'Diet templates'},
 { key:'foods', label: isRTL ? 'מאגר מזון' : 'Food library'},
 { key:'blood', label: isRTL ? 'בדיקות דם' : 'Blood tests'},
 ]} active={tab} onChange={setTab} />
 {tab === 'today'&& <Today />}
 {tab === 'planner'&& <MealPlanner />}
 {tab === 'recipes'&& <Recipes />}
 {tab === 'calc'&& <Calculator />}
 {tab === 'diets'&& <Diets />}
 {tab === 'foods'&& <FoodsLib />}
 {tab === 'blood'&& <BloodTest />}
 </>
 )
}

function Today() {
 const { state, logMeal, removeMeal } = useApp()
 const { isRTL } = useI18n()
 const [pickerOpen, setPickerOpen] = useState(false)
 const [dishOpen, setDishOpen] = useState(false)
 const day = todayKey()
 const meals = state.mealLogs[day] || []

 // Build a "recent meals"quick-access list from all past meal logs
 const recentMeals = useMemo(() => {
 const map = new Map()
 const dates = Object.keys(state.mealLogs || {}).sort().reverse()
 for (const d of dates) {
 for (const m of (state.mealLogs[d] || [])) {
 const key = `${m.name}|${m.grams}`
 if (map.has(key)) map.get(key).count++
 else map.set(key, { ...m, count: 1 })
 }
 }
 return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 8)
 }, [state.mealLogs])

 const totals = meals.reduce((acc, m) => ({
 kcal: acc.kcal + (m.kcal||0),
 p: acc.p + (m.p||0),
 c: acc.c + (m.c||0),
 f: acc.f + (m.f||0),
 }), { kcal:0, p:0, c:0, f:0 })

 const _bmr = bmr(state.profile)
 const _tdee = tdee(_bmr, state.profile.activity)
 const kcalTarget = _tdee + (goalAdjustments[state.profile.goalKey]?.kcalDelta || 0)
 const diet = dietTemplates[state.profile.dietKey] || dietTemplates.balanced
 const target = macros(kcalTarget, diet.p, diet.c, diet.f)

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap: 16 }} className="hfos-grid-nut">
 <Card>
 <SectionHeader title={isRTL ? 'קלוריות היום' : 'Calories today'} />
 <DonutSegments size={160} segments={[
 { value: totals.kcal, color: t.color.gold },
 { value: Math.max(0, kcalTarget - totals.kcal), color: t.color.bgSoft },
 ]} />
 <div style={{ textAlign:'center', marginTop: 12, color: t.color.textDim, fontSize: t.font.sm }}>
 {isRTL ? 'נותרו' : 'Remaining'} <b style={{ color: t.color.gold }}>{Math.max(0, kcalTarget - Math.round(totals.kcal))}</b> {isRTL ? 'קלוריות' : 'calories'}
 </div>
 </Card>
 <Card>
 <SectionHeader title={isRTL ? 'מקרו-פילוח' : 'Macro breakdown'} />
 <MacroRow label={isRTL ? 'חלבון' : 'Protein'} value={Math.round(totals.p)} target={target.protein} unit={isRTL ? 'ג׳' : 'g'} color={t.color.info} />
 <MacroRow label={isRTL ? 'פחמימות' : 'Carbs'} value={Math.round(totals.c)} target={target.carbs} unit={isRTL ? 'ג׳' : 'g'} color={t.color.gold} />
 <MacroRow label={isRTL ? 'שומן' : 'Fat'} value={Math.round(totals.f)} target={target.fat} unit={isRTL ? 'ג׳' : 'g'} color={t.color.warning} />
 <div style={{ marginTop: 16, display:'flex', gap: 12, alignItems:'center', fontSize: t.font.sm, color: t.color.textDim }}>
 {isRTL ? 'מים מומלץ' : 'Recommended water'}: {waterLiters(state.profile.weightKg, state.profile.activity)} {isRTL ? 'ל׳' : 'L'} · {isRTL ? 'תזונה' : 'Diet'}: {diet.label}
 </div>
 </Card>
 </div>

 <WaterTracker />

 {recentMeals.length > 0 && (
 <Card style={{ background: `linear-gradient(135deg, ${t.color.bgCard} 0%, ${t.color.bgElevated} 100%)`, border: `1px solid ${t.color.gold}`, overflow: 'hidden' }}>
 <SectionHeader
 title={isRTL ? '⭐ המרשמים שלי' : '⭐ My favorites'}
 subtitle={isRTL ? 'קליק אחד כדי להוסיף שוב' : 'One click to add again'}
 action={<Badge color={t.color.gold}>{recentMeals.length}</Badge>}
 />
 <div style={{ display:'flex', gap: 8, overflowX:'auto', paddingBottom: 6, marginTop: 4 }}>
 {recentMeals.map((m, i) => (
 <button key={i}
 onClick={() => logMeal({ foodId: m.foodId, name: m.name, grams: m.grams, kcal: m.kcal, p: m.p, c: m.c, f: m.f })}
 style={{
 flexShrink: 0, minWidth: 160, padding: 12,
 background: t.color.bgSoft, border: `1px solid ${t.color.border}`,
 borderRadius: t.radius.md, cursor:'pointer',
 color: t.color.text, fontFamily:'inherit', textAlign:'right',
 transition: t.transition,
 }}
 onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.gold }}
 onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border }}
 >
 <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 4 }}>
 <div style={{ fontWeight: 700, fontSize: t.font.sm, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth: 130 }}>{m.name}</div>
 {m.count > 1 && <span style={{ fontSize: 10, color: t.color.gold, fontWeight: 700 }}>{m.count}×</span>}
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{m.grams}{isRTL ? 'ג׳' : 'g'} · {Math.round(m.kcal)} {isRTL ? 'קק״ל' : 'kcal'}</div>
 <div style={{ marginTop: 6, fontSize: t.font.xs, color: t.color.gold, fontWeight: 700 }}>+ {isRTL ? 'הוסף שוב' : 'Add again'}</div>
 </button>
 ))}
 </div>
 </Card>
 )}

 <Card>
 <SectionHeader
 title={isRTL ? 'ארוחות היום' : 'Meals today'}
 action={
 <div style={{ display:'flex', gap: 8 }}>
 <Button variant="ghost" size="sm" onClick={() => setDishOpen(true)}>{isRTL ? 'בנה מנה' : 'Build dish'}</Button>
 <Button size="sm" onClick={() => setPickerOpen(true)}>+ {isRTL ? 'הוסף' : 'Add'}</Button>
 </div>
 }
 />
 {!meals.length && <EmptyState title={isRTL ? 'עדיין לא רשמת ארוחות' : 'No meals logged yet'} subtitle={isRTL ? 'לחץ "הוסף" לפריט בודד, או "בנה מנה" למנה מרוכבת עם חישוב קלוריות' : 'Tap "Add" for a single item, or "Build dish" to compose one and see its calories'} />}
 <div style={{ display:'grid', gap: 8 }}>
 {meals.map((m, i) => (
 <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div style={{ minWidth: 0, flex: 1 }}>
 <div style={{ fontWeight: 600 }}>{m.name} <span style={{ color: t.color.textDim, fontWeight: 400 }}>· {m.grams}{isRTL ? 'ג׳' : 'g'}</span></div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>
 {Math.round(m.kcal)} {isRTL ? 'קק״ל' : 'kcal'} · {Math.round(m.p)}{isRTL ? 'ח׳' : 'P'} · {Math.round(m.c)}{isRTL ? 'פ׳' : 'C'} · {Math.round(m.f)}{isRTL ? 'ש׳' : 'F'}
 </div>
 {m.composedOf?.length > 0 && (
 <div style={{ fontSize: 10, color: t.color.textMuted, marginTop: 4 }}>
 {m.composedOf.map(c => `${c.name} ${c.grams}${isRTL ? 'ג׳' : 'g'}`).join(' · ')}
 </div>
 )}
 </div>
 <button
 onClick={() => { if (confirm(isRTL ? `להסיר את "${m.name}"?` : `Remove "${m.name}"?`)) removeMeal(i) }}
 title={isRTL ? 'הסר ארוחה' : 'Remove meal'}
 aria-label={isRTL ? 'הסר ארוחה' : 'Remove meal'}
 style={{
 background:'transparent', border:`1px solid ${t.color.border}`,
 color: t.color.silver1, cursor:'pointer', padding:'6px 10px',
 borderRadius: t.radius.sm, fontFamily:'inherit', fontSize: 16, lineHeight: 1,
 flexShrink: 0,
 }}
 onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.danger; e.currentTarget.style.color = t.color.danger }}
 onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border; e.currentTarget.style.color = t.color.silver1 }}
 >×</button>
 </div>
 ))}
 </div>
 </Card>

 <FoodPickerPro open={pickerOpen} onClose={() => setPickerOpen(false)} onAdd={(item) => { logMeal(item); setPickerOpen(false) }} />
 <DishBuilder open={dishOpen} onClose={() => setDishOpen(false)} onLog={(meal) => { logMeal(meal); setDishOpen(false) }} />
 <style>{`@media (max-width: 900px) { .hfos-grid-nut { grid-template-columns: 1fr !important; } }`}</style>
 </div>
 )
}

function MacroRow({ label, value, target, color, unit }) {
 return (
 <div style={{ marginBottom: 12 }}>
 <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
 <span style={{ color: t.color.textDim, fontSize: t.font.sm }}>{label}</span>
 <span style={{ fontSize: t.font.sm }}><b style={{ color }}>{value}</b><span style={{ color: t.color.textMuted }}>/{target}{unit}</span></span>
 </div>
 <ProgressBar value={value} max={target} color={color} />
 </div>
 )
}

function FoodPicker({ open, onClose, onAdd }) {
 const { isRTL } = useI18n()
 const [q, setQ] = useState('')
 const [grams, setGrams] = useState(100)
 const [selected, setSelected] = useState(null)
 const list = foods.filter(f => !q || f.name.includes(q))
 const add = () => {
 if (!selected) return
 const factor = grams / 100
 onAdd({
 foodId: selected.id, name: selected.name, grams,
 kcal: selected.kcal * factor, p: selected.p * factor, c: selected.c * factor, f: selected.f * factor,
 })
 setSelected(null); setQ(''); setGrams(100)
 }
 return (
 <Modal open={open} onClose={onClose} title={isRTL ? 'הוסף מזון' : 'Add food'} width={620}>
 <Input placeholder={isRTL ? ' חפש מזון...' : ' Search food...'} value={q} onChange={e => setQ(e.target.value)} />
 <div style={{ maxHeight: 260, overflowY:'auto', marginTop: 12, display:'grid', gap: 6 }}>
 {list.map(f => (
 <div key={f.id} onClick={() => setSelected(f)} style={{
 display:'flex', justifyContent:'space-between', alignItems:'center', padding: 10,
 background: selected?.id === f.id ? t.color.goldGlow : t.color.bgSoft,
 border: `1px solid ${selected?.id === f.id ? t.color.gold : t.color.border}`,
 borderRadius: t.radius.sm, cursor:'pointer',
 }}>
 <div>
 <div style={{ fontWeight: 600 }}>{f.name}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{f.kcal} {isRTL ? 'קק״ל' : 'kcal'} · {f.p}{isRTL ? 'ח׳' : 'P'} · {f.c}{isRTL ? 'פ׳' : 'C'} · {f.f}{isRTL ? 'ש׳' : 'F'} / 100{isRTL ? 'ג׳' : 'g'}</div>
 </div>
 <Badge color={t.color.textDim}>{f.cat}</Badge>
 </div>
 ))}
 </div>
 {selected && (
 <div style={{ display:'flex', gap: 10, alignItems:'end', marginTop: 12 }}>
 <Input type="number" label={isRTL ? 'גרם' : 'Grams'} value={grams} onChange={e => setGrams(+e.target.value || 0)} />
 <Button onClick={add}>{isRTL ? 'הוסף' : 'Add'} ({Math.round(selected.kcal * grams/100)} {isRTL ? 'קק״ל' : 'kcal'})</Button>
 </div>
 )}
 </Modal>
 )
}

function Calculator() {
 const { state, updateProfile } = useApp()
 const { isRTL } = useI18n()
 const p = state.profile
 const _bmr = bmr(p)
 const _tdee = tdee(_bmr, p.activity)
 const goal = goalAdjustments[p.goalKey]
 const kcalTarget = _tdee + goal.kcalDelta
 const diet = dietTemplates[p.dietKey]
 const m = macros(kcalTarget, diet.p, diet.c, diet.f)

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card>
 <SectionHeader title={isRTL ? 'מחשבון קלוריות ומקרו' : 'Calorie & macro calculator'} subtitle={isRTL ? 'Mifflin-St Jeor · מעודכן לפי הפרופיל שלך' : 'Mifflin-St Jeor · updated from your profile'} />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
 <Input type="number" label={isRTL ? 'משקל (ק״ג)' : 'Weight (kg)'} value={p.weightKg} onChange={e => updateProfile({ weightKg: +e.target.value })} />
 <Input type="number" label={isRTL ? 'גובה (ס״מ)' : 'Height (cm)'} value={p.heightCm} onChange={e => updateProfile({ heightCm: +e.target.value })} />
 <Input type="number" label={isRTL ? 'גיל' : 'Age'} value={p.age} onChange={e => updateProfile({ age: +e.target.value })} />
 <Select label={isRTL ? 'מין' : 'Sex'} value={p.sex} onChange={e => updateProfile({ sex: e.target.value })}>
 <option value="male">{isRTL ? 'גבר' : 'Male'}</option><option value="female">{isRTL ? 'אישה' : 'Female'}</option>
 </Select>
 <Select label={isRTL ? 'רמת פעילות' : 'Activity level'} value={p.activity} onChange={e => updateProfile({ activity: e.target.value })}>
 {Object.entries(activityFactors).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
 </Select>
 <Select label={isRTL ? 'מטרה' : 'Goal'} value={p.goalKey} onChange={e => updateProfile({ goalKey: e.target.value })}>
 {Object.entries(goalAdjustments).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
 </Select>
 <Select label={isRTL ? 'תבנית תזונה' : 'Diet template'} value={p.dietKey} onChange={e => updateProfile({ dietKey: e.target.value })}>
 {Object.entries(dietTemplates).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
 </Select>
 </div>
 </Card>

 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
 <ResultCard label="BMR" value={_bmr} unit={isRTL ? 'קק״ל' : 'kcal'} hint={isRTL ? 'שריפה במנוחה' : 'Resting burn'} />
 <ResultCard label="TDEE" value={_tdee} unit={isRTL ? 'קק״ל' : 'kcal'} hint={isRTL ? 'הוצאה יומית כוללת' : 'Total daily expenditure'} />
 <ResultCard label={isRTL ? 'יעד קלוריות' : 'Calorie target'} value={kcalTarget} unit={isRTL ? 'קק״ל' : 'kcal'} hint={goal.label} highlight />
 <ResultCard label="BMI" value={bmi(p.weightKg, p.heightCm)} unit="" hint={bmiCategory(bmi(p.weightKg, p.heightCm), isRTL)} />
 </div>

 <Card>
 <SectionHeader title={isRTL ? 'פילוח מקרו יומי' : 'Daily macro breakdown'} subtitle={`${diet.label} · ${diet.p}/${diet.c}/${diet.f}`} />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12 }}>
 <BigMacro label={isRTL ? 'חלבון' : 'Protein'} grams={m.protein} pct={diet.p} color={t.color.info} />
 <BigMacro label={isRTL ? 'פחמימות' : 'Carbs'} grams={m.carbs} pct={diet.c} color={t.color.gold} />
 <BigMacro label={isRTL ? 'שומן' : 'Fat'} grams={m.fat} pct={diet.f} color={t.color.warning} />
 </div>
 </Card>
 </div>
 )
}

function ResultCard({ label, value, unit, hint, highlight }) {
 return (
 <Card style={{ padding: 20, background: highlight ? t.color.goldGlow : t.color.bgCard, border:`1px solid ${highlight ? t.color.gold : t.color.border}` }}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginBottom: 6, letterSpacing: 1 }}>{label}</div>
 <div style={{ fontSize: t.font.xxl, fontWeight: 800, color: highlight ? t.color.gold : t.color.text }}>{value}<span style={{ fontSize: t.font.sm, color: t.color.textDim, marginRight: 4 }}> {unit}</span></div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 4 }}>{hint}</div>
 </Card>
 )
}

function BigMacro({ label, grams, pct, color }) {
 const { isRTL } = useI18n()
 return (
 <div style={{ textAlign:'center', padding: 20, background: t.color.bgSoft, borderRadius: t.radius.md }}>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 6 }}>{label}</div>
 <div style={{ fontSize: t.font.hero, fontWeight: 900, color, lineHeight: 1 }}>{grams}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textMuted, marginTop: 4 }}>{isRTL ? 'גרם' : 'grams'} · {pct}%</div>
 </div>
 )
}

function bmiCategory(v, isRTL = true) {
 if (v < 18.5) return isRTL ? 'תת-משקל' : 'Underweight'
 if (v < 25) return isRTL ? 'תקין' : 'Normal'
 if (v < 30) return isRTL ? 'עודף' : 'Overweight'
 return isRTL ? 'השמנה' : 'Obese'
}

function Diets() {
 const { state, updateProfile } = useApp()
 const { isRTL } = useI18n()
 return (
 <div style={{ display:'grid', gap: 16 }}>
 <SectionHeader title={isRTL ? 'תבניות דיאטה' : 'Diet templates'} subtitle={isRTL ? 'בחר את הסגנון שמתאים לך - נעדכן את יעדי המקרו אוטומטית' : 'Pick the style that fits you — macro targets update automatically'} />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
 {Object.entries(dietTemplates).map(([k, v]) => {
 const info = dietInfo[k] || {}
 const active = state.profile.dietKey === k
 return (
 <Card key={k} hover style={{ padding: 20, borderColor: active ? t.color.gold : t.color.border }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
 <div style={{ fontWeight: 700, fontSize: t.font.lg, color: active ? t.color.gold : t.color.text }}>{v.label}</div>
 {active && <Badge>{isRTL ? 'פעיל' : 'Active'}</Badge>}
 </div>
 <div style={{ display:'flex', gap: 6, marginBottom: 10 }}>
 <Badge color={t.color.info}>{v.p}% {isRTL ? 'ח׳' : 'P'}</Badge>
 <Badge color={t.color.gold}>{v.c}% {isRTL ? 'פ׳' : 'C'}</Badge>
 <Badge color={t.color.warning}>{v.f}% {isRTL ? 'ש׳' : 'F'}</Badge>
 </div>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 10, lineHeight: 1.5 }}>{info.desc}</div>
 {info.good && <div style={{ fontSize: t.font.xs, color: t.color.success, marginBottom: 4 }}> {info.good}</div>}
 {info.caution && <div style={{ fontSize: t.font.xs, color: t.color.warning, marginBottom: 10 }}> {info.caution}</div>}
 <Button variant={active ? 'ghost':'outline'} size="sm"onClick={() => updateProfile({ dietKey: k })}>
 {active ? (isRTL ? 'הוגדר כפעיל' : 'Set as active') : (isRTL ? 'בחר תבנית' : 'Pick template')}
 </Button>
 </Card>
 )
 })}
 </div>
 </div>
 )
}

function FoodsLib() {
 const { isRTL } = useI18n()
 const [q, setQ] = useState('')
 const [cat, setCat] = useState('')
 const cats = [...new Set(foods.map(f => f.cat))]
 const list = foods.filter(f => (!q || f.name.includes(q)) && (!cat || f.cat === cat))
 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card style={{ padding: 16 }}>
 <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap: 10 }}>
 <Input placeholder={isRTL ? ' חפש...' : ' Search...'} value={q} onChange={e => setQ(e.target.value)} />
 <Select value={cat} onChange={e => setCat(e.target.value)}>
 <option value="">{isRTL ? 'כל הקטגוריות' : 'All categories'}</option>{cats.map(c => <option key={c} value={c}>{c}</option>)}
 </Select>
 </div>
 </Card>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
 {list.map(f => (
 <Card key={f.id} style={{ padding: 14 }}>
 <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
 <div style={{ fontWeight: 600 }}>{f.name}</div>
 <Badge color={t.color.textDim}>{f.cat}</Badge>
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6, textAlign:'center'}}>
 <MiniMacro label={isRTL ? 'קק״ל' : 'kcal'} val={f.kcal} color={t.color.gold} />
 <MiniMacro label={isRTL ? 'חלבון' : 'Protein'} val={f.p} color={t.color.info} />
 <MiniMacro label={isRTL ? 'פחמ׳' : 'Carbs'} val={f.c} color={t.color.text} />
 <MiniMacro label={isRTL ? 'שומן' : 'Fat'} val={f.f} color={t.color.warning} />
 </div>
 <div style={{ fontSize: 10, color: t.color.textMuted, textAlign:'center', marginTop: 6 }}>{isRTL ? 'לכל 100 גרם' : 'per 100 g'}</div>
 </Card>
 ))}
 </div>
 </div>
 )
}

function MiniMacro({ label, val, color }) {
 return (
 <div>
 <div style={{ fontSize: t.font.sm, fontWeight: 700, color }}>{val}</div>
 <div style={{ fontSize: 9, color: t.color.textMuted }}>{label}</div>
 </div>
 )
}

function Recipes() {
 const { isRTL } = useI18n()
 const [q, setQ] = useState('')
 const [tag, setTag] = useState('')
 const [selected, setSelected] = useState(null)

 const allTags = [...new Set(recipes.flatMap(r => r.tags))]
 const filtered = recipes.filter(r =>
 (!q || r.name.includes(q)) &&
 (!tag || r.tags.includes(tag))
 )

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card style={{ padding: 16 }}>
 <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap: 10 }}>
 <Input placeholder={isRTL ? ' חפש מרשם...' : ' Search recipe...'} value={q} onChange={e => setQ(e.target.value)} />
 <Select value={tag} onChange={e => setTag(e.target.value)}>
 <option value="">{isRTL ? 'כל הקטגוריות' : 'All categories'}</option>
 {allTags.map(x => <option key={x} value={x}>{x}</option>)}
 </Select>
 </div>
 </Card>

 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
 {filtered.map(r => (
 <Card key={r.id} hover style={{ padding: 0, cursor:'pointer', overflow:'hidden'}} onClick={() => setSelected(r)}>
 <RecipeThumb recipe={r} aspectRatio="16 / 9" style={{ borderRadius: 0 }} />
 <div style={{ padding: 16 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 10 }}>
 <div style={{ fontWeight: 700, fontSize: t.font.lg, lineHeight: 1.3, flex: 1 }}>{r.name}</div>
 <Badge color={t.color.gold}>⏱ {r.timeMin}{isRTL ? '׳' : ' min'}</Badge>
 </div>
 <div style={{ display:'flex', gap: 4, flexWrap:'wrap', marginBottom: 12 }}>
 {r.tags.slice(0, 3).map(x => <Badge key={x} color={t.color.textDim}>{x}</Badge>)}
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6, textAlign:'center'}}>
 <div style={{ padding: 6, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div style={{ fontWeight: 700, color: t.color.gold, fontSize: t.font.sm }}>{r.kcal}</div>
 <div style={{ fontSize: 9, color: t.color.textMuted }}>{isRTL ? 'קק״ל' : 'kcal'}</div>
 </div>
 <div style={{ padding: 6, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div style={{ fontWeight: 700, color: t.color.info, fontSize: t.font.sm }}>{r.p}</div>
 <div style={{ fontSize: 9, color: t.color.textMuted }}>{isRTL ? 'חלבון' : 'Protein'}</div>
 </div>
 <div style={{ padding: 6, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div style={{ fontWeight: 700, fontSize: t.font.sm }}>{r.c}</div>
 <div style={{ fontSize: 9, color: t.color.textMuted }}>{isRTL ? 'פחמ׳' : 'Carbs'}</div>
 </div>
 <div style={{ padding: 6, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div style={{ fontWeight: 700, color: t.color.warning, fontSize: t.font.sm }}>{r.f}</div>
 <div style={{ fontSize: 9, color: t.color.textMuted }}>{isRTL ? 'שומן' : 'Fat'}</div>
 </div>
 </div>
 </div>
 </Card>
 ))}
 </div>

 <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? ` ${selected.name}` :''} width={640}>
 {selected && <RecipeContent recipe={selected} />}
 </Modal>
 </div>
 )
}

function RecipeContent({ recipe }) {
 const { isRTL } = useI18n()
 return (
 <>
 <RecipeThumb recipe={recipe} aspectRatio="16 / 9" style={{ marginBottom: 14 }} />
 <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginBottom: 14 }}>
 {recipe.tags.map(x => <Badge key={x} color={t.color.textDim}>{x}</Badge>)}
 <Badge color={t.color.gold}>⏱ {recipe.timeMin} {isRTL ? 'דק׳' : 'min'}</Badge>
 <Badge color={t.color.info}>{recipe.servings} {isRTL ? 'מנות' : 'servings'}</Badge>
 </div>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
 {[{l: isRTL ? 'קק״ל' : 'kcal',v:recipe.kcal,c:t.color.gold},{l: isRTL ? 'חלבון' : 'Protein',v:recipe.p,c:t.color.info},{l: isRTL ? 'פחמ׳' : 'Carbs',v:recipe.c,c:t.color.text},{l: isRTL ? 'שומן' : 'Fat',v:recipe.f,c:t.color.warning}].map((s, i) => (
 <div key={i} style={{ padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm, textAlign:'center'}}>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color: s.c }}>{s.v}</div>
 <div style={{ fontSize: 10, color: t.color.textMuted }}>{s.l}</div>
 </div>
 ))}
 </div>
 <div style={{ marginBottom: 20 }}>
 <div style={{ fontWeight: 700, marginBottom: 10 }}> {isRTL ? 'מרכיבים' : 'Ingredients'}</div>
 <div style={{ display:'grid', gap: 6 }}>
 {recipe.ingredients.map((ing, i) => (
 <div key={i} style={{ display:'flex', justifyContent:'space-between', padding: 8, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <span>{ing.name}</span><span style={{ color: t.color.gold, fontWeight: 600 }}>{ing.grams} {isRTL ? 'ג׳' : 'g'}</span>
 </div>
 ))}
 </div>
 </div>
 <div style={{ marginBottom: 14 }}>
 <div style={{ fontWeight: 700, marginBottom: 10 }}> {isRTL ? 'שלבי הכנה' : 'Steps'}</div>
 {recipe.steps.map((step, i) => (
 <div key={i} style={{ display:'flex', gap: 12, padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm, marginBottom: 6 }}>
 <div style={{ width: 24, height: 24, borderRadius:'50%', background: t.color.gold, color:'#0d0d14', display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 800, flexShrink: 0, fontSize: 12 }}>{i + 1}</div>
 <div style={{ flex: 1, fontSize: t.font.sm, lineHeight: 1.6 }}>{step}</div>
 </div>
 ))}
 </div>
 {recipe.tip && (
 <div style={{ padding: 12, background: t.color.goldGlow, borderRadius: t.radius.sm, border:`1px solid ${t.color.gold}` }}>
 <b style={{ color: t.color.gold }}> {isRTL ? 'טיפ:' : 'Tip:'}</b> {recipe.tip}
 </div>
 )}
 </>
 )
}

function BloodTest() {
 const { state, addBlood } = useApp()
 const { isRTL } = useI18n()
 const [values, setValues] = useState({})
 const [uploadState, setUploadState] = useState({ status: 'idle', message: '' })
 const last = state.bloodTests[0]

 const analysis = useMemo(() => (last ? bloodMarkers.map(m => ({
 marker: m, value: last.values[m.id], status: statusForValue(m, +last.values[m.id], state.profile.sex),
 })).filter(x => x.value != null && x.value !== '') : []), [last, state.profile.sex])

 const flags = analysis.filter(a => a.status === 'low'|| a.status === 'high')

 async function handleFile(e) {
   const file = e.target.files?.[0]
   e.target.value = '' // allow re-uploading the same file
   if (!file) return
   if (file.size > 8 * 1024 * 1024) {
     setUploadState({ status: 'err', message: isRTL ? 'הקובץ גדול מדי (מקסימום 8MB). צלם מחדש באיכות נמוכה יותר.' : 'File too large (max 8MB).' })
     return
   }
   setUploadState({ status: 'loading', message: isRTL ? 'קורא את הבדיקה, זה לוקח בין 5 ל־20 שניות…' : 'Reading blood test, may take 5–20 seconds…' })
   try {
     const dataUrl = await new Promise((resolve, reject) => {
       const r = new FileReader()
       r.onload = () => resolve(r.result)
       r.onerror = reject
       r.readAsDataURL(file)
     })
     const base64 = String(dataUrl).split(',')[1]
     const result = await extractBloodMarkersFromFile({ fileData: base64, mimeType: file.type })
     if (!result || !Object.keys(result.values || {}).length) {
       setUploadState({ status: 'err', message: isRTL ? 'לא הצלחתי לזהות ערכים במסמך. וודא שהתמונה חדה וכתובה בברור, או הזן ידנית.' : 'Could not detect values. Try a sharper photo or enter manually.' })
       return
     }
     const found = Object.entries(result.values)
     setValues(v => ({ ...v, ...Object.fromEntries(found.map(([k, val]) => [k, String(val)])) }))
     setUploadState({
       status: 'ok',
       message: isRTL
         ? `זוהו ${found.length} סמנים. בדוק את הערכים ולחץ "נתח בדיקה".`
         : `Detected ${found.length} markers. Review and click "Analyze".`,
     })
   } catch (err) {
     setUploadState({ status: 'err', message: isRTL ? 'שגיאה בקריאת הקובץ. נסה שוב או הזן ידנית.' : 'File read error. Try again or enter manually.' })
   }
 }

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card>
 <SectionHeader title={isRTL ? 'קורא בדיקות דם' : 'Blood test reader'} subtitle={isRTL ? 'העלה מסמך או צלם — נחלץ את הערכים אוטומטית' : 'Upload a document or photo — values are extracted automatically'} />

 {aiEnabled && (
   <div style={{
     padding: 14, marginBottom: 14,
     borderRadius: t.radius.md,
     background: `${t.color.gold}0d`,
     border: `1px dashed ${t.color.gold}66`,
   }}>
     <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 10, lineHeight: 1.5 }}>
       {isRTL
         ? '📎 העלה תמונה/PDF של בדיקת הדם ונמלא לך את הערכים אוטומטית. הקובץ נשלח למנוע קריאה חכם — לא נשמר אצלנו.'
         : '📎 Upload a photo/PDF of your blood test and we\'ll fill in the values automatically. The file is sent to our AI reader — not stored.'}
     </div>
     <label style={{ display:'inline-block', cursor: uploadState.status === 'loading' ? 'wait' : 'pointer' }}>
       <input
         type="file"
         accept="image/*,application/pdf"
         style={{ display:'none' }}
         disabled={uploadState.status === 'loading'}
         onChange={handleFile}
       />
       <span style={{
         display:'inline-flex', alignItems:'center', gap: 8,
         padding:'10px 18px',
         background: t.color.gold, color:'#0d0d14',
         border:`1px solid ${t.color.gold}`, borderRadius: t.radius.md,
         fontWeight: 700, fontSize: t.font.md,
         opacity: uploadState.status === 'loading' ? 0.7 : 1,
       }}>
         {uploadState.status === 'loading'
           ? (isRTL ? '⏳ קורא…' : '⏳ Reading…')
           : (isRTL ? '📷 העלה מסמך / צלם' : '📷 Upload / Photo')}
       </span>
     </label>
     {uploadState.message && (
       <div style={{
         marginTop: 10, padding: 10, borderRadius: t.radius.sm,
         fontSize: t.font.sm, lineHeight: 1.5,
         background: uploadState.status === 'err' ? `${t.color.danger}15` : uploadState.status === 'ok' ? `${t.color.success}15` : t.color.bgSoft,
         color: uploadState.status === 'err' ? t.color.danger : uploadState.status === 'ok' ? t.color.success : t.color.text,
         border: `1px solid ${uploadState.status === 'err' ? t.color.danger + '44' : uploadState.status === 'ok' ? t.color.success + '44' : t.color.border}`,
       }}>{uploadState.message}</div>
     )}
   </div>
 )}

 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
 {bloodMarkers.map(m => (
 <Input key={m.id} label={`${m.name} (${m.unit})`} type="number"placeholder="—"
 value={values[m.id] || ''} onChange={e => setValues(v => ({ ...v, [m.id]: e.target.value }))} />
 ))}
 </div>
 <div style={{ marginTop: 16, display:'flex', gap: 10, justifyContent:'flex-end'}}>
 <Button variant="ghost"onClick={() => { setValues({}); setUploadState({ status:'idle', message:'' }) }}>{isRTL ? 'נקה' : 'Clear'}</Button>
 <Button onClick={() => { addBlood({ date: new Date().toISOString(), values }); setValues({}); setUploadState({ status:'idle', message:'' }) }}>{isRTL ? 'נתח בדיקה' : 'Analyze'}</Button>
 </div>
 </Card>

 {last && (
 <>
 <Card>
 <SectionHeader title={isRTL ? 'פרשנות אחרונה' : 'Latest analysis'} subtitle={new Date(last.date).toLocaleDateString(isRTL ? 'he-IL' : 'en-US')} />
 {flags.length === 0
 ? <EmptyState icon=" "title={isRTL ? 'כל הערכים בטווח התקין' : 'All values in normal range'} subtitle={isRTL ? 'המשך כך!' : 'Keep it up!'} />
 : (
 <div style={{ display:'grid', gap: 10 }}>
 {flags.map((f, i) => (
 <div key={i} style={{
 padding: 14, borderRadius: t.radius.md,
 background: f.status === 'high'? '#e05a5a15':'#e0a05a15',
 border: `1px solid ${f.status === 'high'? t.color.danger + '44': t.color.warning + '44'}`,
 }}>
 <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
 <div style={{ fontWeight: 700 }}>{f.marker.name}</div>
 <Badge color={f.status === 'high'? t.color.danger : t.color.warning}>
 {f.value} {f.marker.unit} · {f.status === 'high' ? (isRTL ? 'גבוה' : 'High') : (isRTL ? 'נמוך' : 'Low')}
 </Badge>
 </div>
 <div style={{ fontSize: t.font.sm, color: t.color.text, lineHeight: 1.5 }}>
 {f.status === 'high'? f.marker.high : f.marker.low}
 </div>
 </div>
 ))}
 </div>
 )}
 </Card>
 <Card>
 <SectionHeader title={isRTL ? 'כל הערכים' : 'All values'} />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
 {analysis.map((a, i) => (
 <div key={i} style={{ padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{a.marker.name}</div>
 <div style={{ fontWeight: 700, color: a.status === 'normal'? t.color.success : a.status === 'high' ? t.color.danger : t.color.warning }}>
 {a.value} <span style={{ fontSize: 10, color: t.color.textMuted }}>{a.marker.unit}</span>
 </div>
 </div>
 ))}
 </div>
 </Card>
 </>
 )}
 </div>
 )
}
