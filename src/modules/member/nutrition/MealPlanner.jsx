import React, { useMemo, useState } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Card, Button, Badge, SectionHeader, EmptyState, Modal } from '../../../components/ui/UI'
import { ai } from '../../../ai/aiProvider'
import { nutritionTargets } from '../../../utils/calc'
import { DAYS_HE } from '../../../utils/date'
import { getRecipeByName, recipes } from '../../../data/recipes'

export function MealPlanner() {
 const { state } = useApp()
 const [plan, setPlan] = useState(null)
 const [loading, setLoading] = useState(false)
 const [recipeModal, setRecipeModal] = useState(null)

 const targets = useMemo(() => {
 const _t = nutritionTargets(state.profile)
 return { kcal: _t.kcal, protein: _t.protein, carbs: _t.carbs, fat: _t.fat, diet: _t.diet.label }
 }, [state.profile])

 const generate = async () => {
 setLoading(true)
 const p = await ai.suggestMealPlan({ profile: state.profile, targets, days: 7 })
 setPlan(p); setLoading(false)
 }

 const shopping = useMemo(() => plan ? buildShoppingList(plan) : [], [plan])

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card>
 <SectionHeader
 title="מתכנן תזונה שבועי"
 subtitle={`יעד: ${targets.kcal} קק״ל · ${targets.protein}/${targets.carbs}/${targets.fat} · ${targets.diet}`}
 action={<Button onClick={generate} disabled={loading}>{loading ? 'בונה...': plan ? '↻ בנה מחדש':' בנה תכנית שבועית'}</Button>}
 />
 {!plan && (
 <EmptyState
 icon=""
 title="עדיין אין תכנית"
 subtitle="לחץ 'בנה תכנית שבועית'- נבנה 4 ארוחות ליום מותאמות ליעדי מקרו + נחשב רשימת קניות אוטומטית"
 />
 )}
 </Card>

 {plan && (
 <>
 <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 8 }} className="hfos-week">
 {plan.days.map((d, i) => (
 <Card key={d.day} style={{ padding: 12 }}>
 <div style={{ fontWeight: 700, color: t.color.gold, marginBottom: 8, fontSize: t.font.sm, textAlign:'center', paddingBottom: 8, borderBottom:`1px solid ${t.color.border}` }}>
 {DAYS_HE[i]}
 </div>
 <div style={{ display:'grid', gap: 8 }}>
 {d.meals.map((m, j) => {
 const recipe = getRecipeByName(m.idea) || recipes.find(r => m.idea && m.idea.split(' ')[0] && r.name.startsWith(m.idea.split(' ')[0]))
 return (
 <div key={j} onClick={() => recipe && setRecipeModal(recipe)} style={{
 padding: 8, background: t.color.bgSoft, borderRadius: t.radius.sm,
 cursor: recipe ? 'pointer':'default',
 border: `1px solid ${recipe ? 'transparent':'transparent'}`,
 transition: t.transition,
 }}
 onMouseEnter={e => { if (recipe) e.currentTarget.style.borderColor = t.color.gold }}
 onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'}}
 >
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 4 }}>
 <div style={{ fontSize: t.font.xs, color: t.color.gold, fontWeight: 700 }}>{m.name}</div>
 <div style={{ fontSize: 10, color: t.color.textDim }}>{m.kcal}</div>
 </div>
 <div style={{ fontSize: t.font.xs, color: t.color.text, lineHeight: 1.5 }}>
 {m.idea} {recipe && <span style={{ color: t.color.gold }}> </span>}
 </div>
 </div>
 )
 })}
 </div>
 </Card>
 ))}
 </div>

 <Card>
 <SectionHeader title="רשימת קניות" subtitle={`${shopping.length} פריטים לשבוע`} action={
 <Button variant="outline"size="sm"onClick={() => copyList(shopping)}>העתק רשימה</Button>
 } />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
 {groupByCategory(shopping).map(([cat, items]) => (
 <div key={cat} style={{ padding: 14, background: t.color.bgSoft, borderRadius: t.radius.md }}>
 <div style={{ fontWeight: 700, color: t.color.gold, marginBottom: 10, fontSize: t.font.sm }}>{cat}</div>
 <div style={{ display:'grid', gap: 6 }}>
 {items.map((item, i) => (
 <label key={i} style={{ display:'flex', alignItems:'center', gap: 8, fontSize: t.font.sm, cursor:'pointer'}}>
 <input type="checkbox"style={{ accentColor: t.color.gold }} />
 <span>{item}</span>
 </label>
 ))}
 </div>
 </div>
 ))}
 </div>
 </Card>
 </>
 )}
 <RecipeModal open={!!recipeModal} onClose={() => setRecipeModal(null)} recipe={recipeModal} />
 <style>{`
 @media (max-width: 900px) { .hfos-week { grid-template-columns: 1fr 1fr !important; } }
 `}</style>
 </div>
 )
}

function RecipeModal({ open, onClose, recipe }) {
 if (!recipe) return null
 return (
 <Modal open={open} onClose={onClose} title={` ${recipe.name}`} width={640}>
 <div style={{ display:'flex', gap: 8, flexWrap:'wrap', marginBottom: 14 }}>
 {recipe.tags.map(tag => <Badge key={tag} color={t.color.textDim}>{tag}</Badge>)}
 <Badge color={t.color.gold}>⏱ {recipe.timeMin} דק׳</Badge>
 <Badge color={t.color.info}>{recipe.servings} מנה{recipe.servings > 1 ? 'ות':''}</Badge>
 </div>

 <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
 <MacroTile label="קק״ל"value={recipe.kcal} color={t.color.gold} />
 <MacroTile label="חלבון"value={`${recipe.p}ג׳`} color={t.color.info} />
 <MacroTile label="פחמ׳"value={`${recipe.c}ג׳`} color={t.color.text} />
 <MacroTile label="שומן" value={`${recipe.f}ג׳`} color={t.color.warning} />
 </div>

 <div style={{ marginBottom: 20 }}>
 <div style={{ fontWeight: 700, marginBottom: 10, fontSize: t.font.lg }}> מרכיבים</div>
 <div style={{ display:'grid', gap: 6 }}>
 {recipe.ingredients.map((ing, i) => (
 <div key={i} style={{ display:'flex', justifyContent:'space-between', padding: 8, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <span>{ing.name}</span>
 <span style={{ color: t.color.gold, fontWeight: 600 }}>{ing.grams} ג׳</span>
 </div>
 ))}
 </div>
 </div>

 <div style={{ marginBottom: 14 }}>
 <div style={{ fontWeight: 700, marginBottom: 10, fontSize: t.font.lg }}> שלבי הכנה</div>
 <div style={{ display:'grid', gap: 10 }}>
 {recipe.steps.map((step, i) => (
 <div key={i} style={{ display:'flex', gap: 12, padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div style={{
 width: 28, height: 28, borderRadius:'50%', background: t.color.gold, color:'#0d0d14',
 display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 800, flexShrink: 0,
 }}>{i + 1}</div>
 <div style={{ flex: 1, lineHeight: 1.6 }}>{step}</div>
 </div>
 ))}
 </div>
 </div>

 {recipe.tip && (
 <div style={{ padding: 12, background: t.color.goldGlow, borderRadius: t.radius.sm, border:`1px solid ${t.color.gold}` }}>
 <b style={{ color: t.color.gold }}> טיפ:</b> {recipe.tip}
 </div>
 )}
 </Modal>
 )
}

function MacroTile({ label, value, color }) {
 return (
 <div style={{ padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm, textAlign:'center'}}>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color }}>{value}</div>
 <div style={{ fontSize: 10, color: t.color.textMuted, marginTop: 2 }}>{label}</div>
 </div>
 )
}

function buildShoppingList(plan) {
 const items = new Set()
 const keywords = {
 'חלבון': ['חזה עוף','חזה הודו','סטייק','סלמון','טופו','ביצים','יוגורט יווני','קוטג׳','אבקת חלבון'],
 'פחמימות': ['אורז מלא','אורז','שיבולת שועל','בטטה','אטריות אורז','טוסט מלא','קינואה'],
 'ירקות': ['ירקות מוקפצים','סלט','ירקות בגריל','ירקות שורש','עגבניות שרי','אבוקדו'],
 'קטניות': ['קטניות','חומוס','עדשים'],
 'פירות': ['פירות יער','בננה','תפוח'],
 'שומנים': ['שמן זית','טחינה','חמאת בוטנים','אבוקדו'],
 }
 for (const day of plan.days) for (const m of day.meals) {
 for (const [cat, list] of Object.entries(keywords)) {
 for (const kw of list) if (m.idea.includes(kw)) items.add(`${cat}::${kw}`)
 }
 }
 return [...items].map(x => { const [cat, name] = x.split('::'); return { cat, name } })
}

function groupByCategory(items) {
 const map = {}
 for (const it of items) (map[it.cat] ||= []).push(it.name)
 return Object.entries(map)
}

function copyList(shopping) {
 const text = groupByCategory(shopping).map(([cat, items]) => `▸ ${cat}:\n${items.map(i => ` ○ ${i}`).join('\n')}`).join('\n\n')
 navigator.clipboard?.writeText(text)
 alert('הרשימה הועתקה ללוח')
}
