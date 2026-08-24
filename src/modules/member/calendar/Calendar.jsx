import React, { useState, useMemo } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Card, Button, Badge, SectionHeader, EmptyState, Tabs, Input } from '../../../components/ui/UI'
import {
 buildWeeklySchedule, downloadICS, googleCalendarUrl,
 workoutEvent, mealEvent, nextSunday,
} from '../../../utils/calendar'
import { DAYS_HE } from '../../../utils/date'
import { ai } from '../../../ai/aiProvider'
import { nutritionTargets } from '../../../utils/calc'
import { useI18n } from '../../../i18n/i18n'

const MEAL_KEY_LABEL = {
 'בוקר': { he:'בוקר', en:'Breakfast'},
 'צהריים': { he:'צהריים', en:'Lunch'},
 'ערב': { he:'ערב', en:'Dinner'},
 'נשנוש': { he:'נשנוש', en:'Snack'},
}
const mealLabel = (key, isRTL) => (MEAL_KEY_LABEL[key] ? (isRTL ? MEAL_KEY_LABEL[key].he : MEAL_KEY_LABEL[key].en) : key)
const DAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export function Calendar() {
 const { isRTL } = useI18n()
 const [tab, setTab] = useState('week')
 return (
 <>
 <Tabs tabs={[
 { key:'week', label: isRTL ? 'שבוע קדימה' : 'Week ahead'},
 { key:'settings', label: isRTL ? 'הגדרות סנכרון' : 'Sync settings'},
 { key:'help', label: isRTL ? 'איך זה עובד' : 'How it works'},
 ]} active={tab} onChange={setTab} />
 {tab === 'week'&& <WeekView />}
 {tab === 'settings'&& <Settings />}
 {tab === 'help'&& <Help />}
 </>
 )
}

function WeekView() {
 const { state } = useApp()
 const { isRTL } = useI18n()
 const [weekStart, setWeekStart] = useState(() => {
 const now = new Date()
 now.setHours(0, 0, 0, 0)
 now.setDate(now.getDate() - now.getDay()) // this Sunday
 return now
 })
 const [mealPlan, setMealPlan] = useState(null)
 const [genMeals, setGenMeals] = useState(false)

 const workoutTime = state.profile.calendarPrefs?.workoutHour ?? 18
 const mealTimes = state.profile.calendarPrefs?.mealTimes || {'בוקר': 8,'צהריים': 13,'ערב': 20,'נשנוש': 16 }
 const reminders = state.profile.calendarPrefs?.reminders ?? true

 const generateMeals = async () => {
 setGenMeals(true)
 const _t = nutritionTargets(state.profile)
 const targets = { kcal: _t.kcal, protein: _t.protein, carbs: _t.carbs, fat: _t.fat }
 const p = await ai.suggestMealPlan({ profile: state.profile, targets, days: 7 })
 setMealPlan(p); setGenMeals(false)
 }

 const events = useMemo(() => buildWeeklySchedule({
 plan: state.plan,
 mealPlan,
 weekStart,
 mealTimes,
 mealLogs: state.mealLogs,
 workoutLogs: state.workoutLogs,
 }).map(e => ({ ...e, reminderMinutes: reminders ? e.reminderMinutes : undefined })),
 [state.plan, mealPlan, weekStart, mealTimes, reminders, state.mealLogs, state.workoutLogs])

 const eventsByDay = useMemo(() => {
 const map = {}
 for (const ev of events) {
 const key = ev.start.toDateString()
 if (!map[key]) map[key] = []
 map[key].push(ev)
 }
 return map
 }, [events])

 const downloadWeek = () => {
 downloadICS(events, `holistic-fit-${weekStart.toISOString().slice(0,10)}.ics`)
 }

 const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
 const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card style={{ background:`linear-gradient(135deg, ${t.color.bgCard} 0%, ${t.color.bgElevated} 100%)`, padding: 24 }}>
 <Badge>{isRTL ? 'הלוז השבועי' : 'Weekly schedule'}</Badge>
 <h2 style={{ marginTop: 10, fontSize: t.font.xxl, fontWeight: 800 }}>{isRTL ? 'הלו״ז השבועי שלך' : 'Your weekly schedule'}</h2>
 <div style={{ color: t.color.textDim, marginTop: 6 }}>
 {events.length} {isRTL ? 'אירועים לשבוע' : 'events this week'} · {Object.keys(eventsByDay).length} {isRTL ? 'ימים' : 'days'}
 </div>
 <div style={{ marginTop: 16, display:'flex', gap: 10, flexWrap:'wrap'}}>
 <Button onClick={downloadWeek} disabled={!events.length}>
 {isRTL ? '↓ הוסף הכל ליומן שלי' : '↓ Add everything to my calendar'}
 </Button>
 {!mealPlan && <Button variant="outline"onClick={generateMeals} disabled={genMeals}>{genMeals ? (isRTL ? 'בונה...' : 'Building...') : (isRTL ? '+ הוסף גם ארוחות' : '+ Add meals too')}</Button>}
 {!state.plan && (
 <div style={{ padding:'8px 12px', background:`${t.color.warning}15`, borderRadius: t.radius.sm, fontSize: t.font.xs, color: t.color.warning }}>
 {isRTL ? 'אין תכנית אימון פעילה - עבור ל"אימונים" כדי לאמץ אחת' : 'No active training plan — go to "Workouts" to pick one'}
 </div>
 )}
 </div>
 <div style={{
   marginTop: 12, fontSize: t.font.xs, color: t.color.textMuted, lineHeight: 1.5,
 }}>
   {isRTL
     ? 'לחיצה מורידה קובץ אחד — פתח אותו ב-Google Calendar / Apple Calendar / Outlook והוא ייבא את השבוע כולו עם תזכורות.'
     : 'One click downloads a file — open it in Google Calendar / Apple Calendar / Outlook and it imports the whole week with reminders.'}
 </div>
 </Card>

 <Card style={{ padding: 16, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
 <Button variant="ghost"onClick={prevWeek}>→ {isRTL ? 'שבוע קודם' : 'Previous week'}</Button>
 <div style={{ fontWeight: 700 }}>{formatWeekRange(weekStart)}</div>
 <Button variant="ghost"onClick={nextWeek}>{isRTL ? 'שבוע הבא' : 'Next week'} ←</Button>
 </Card>

 {events.length === 0 ? (
 <EmptyState icon=" "title={isRTL ? 'אין אירועים לשבוע זה' : 'No events this week'} subtitle={isRTL ? 'אמץ תכנית אימון או צור תכנית ארוחות שבועית כדי לראות לו״ז' : 'Adopt a training plan or generate a weekly meal plan to see your schedule'} />
 ) : (
 <div style={{ display:'grid', gap: 10 }}>
 {[0,1,2,3,4,5,6].map(dayIdx => {
 const day = new Date(weekStart); day.setDate(weekStart.getDate() + dayIdx)
 const dayEvents = eventsByDay[day.toDateString()] || []
 if (!dayEvents.length) return null
 return (
 <Card key={dayIdx} style={{ padding: 18 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 12, paddingBottom: 10, borderBottom:`1px solid ${t.color.border}` }}>
 <div style={{ fontWeight: 700, color: t.color.gold, fontSize: t.font.lg }}>
 {(isRTL ? DAYS_HE : DAYS_EN)[dayIdx]} · {day.getDate()}/{day.getMonth() + 1}
 </div>
 <Badge>{dayEvents.length} {isRTL ? 'אירועים' : 'events'}</Badge>
 </div>
 <div style={{ display:'grid', gap: 8 }}>
 {dayEvents.sort((a, b) => a.start - b.start).map((ev, i) => (
 <EventCard key={i} event={ev} />
 ))}
 </div>
 </Card>
 )
 })}
 </div>
 )}
 </div>
 )
}

function EventCard({ event }) {
 const { isRTL } = useI18n()
 const time = `${String(event.start.getHours()).padStart(2,'0')}:${String(event.start.getMinutes()).padStart(2,'0')}`
 const isWorkout = event.category === 'Fitness'
 const isMeal = event.category === 'Nutrition'
 const color = isWorkout ? t.color.gold : isMeal ? t.color.info : t.color.success
 const logged = event.logged
 return (
 <div style={{
 display:'flex', gap: 12, padding: 12,
 background: logged ? 'rgba(74,156,106,0.06)' : t.color.bgSoft,
 borderRadius: t.radius.md, alignItems:'center',
 border: logged ? '1px solid rgba(74,156,106,0.3)' : '1px solid transparent',
 }}>
 <div style={{ width: 4, height: 40, background: color, borderRadius: 2 }} />
 <div style={{ minWidth: 50, textAlign:'center'}}>
 <div style={{ fontWeight: 700, fontFamily:'Space Mono, monospace', color }}>{time}</div>
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
 <div style={{ fontWeight: 600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{event.title}</div>
 {logged && <span style={{
 fontFamily:'Space Mono, monospace', fontSize: 9, letterSpacing:'0.16em', textTransform:'uppercase',
 color:'#4a9c6a', fontWeight: 700, flexShrink: 0,
 }}>· {isRTL ? 'בוצע' : 'done'}</span>}
 </div>
 {event.description && <div style={{ fontSize: t.font.xs, color: t.color.textDim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{event.description.split('\n')[0]}</div>}
 </div>
 </div>
 )
}

function formatWeekRange(start) {
 const end = new Date(start); end.setDate(end.getDate() + 6)
 return `${start.getDate()}/${start.getMonth()+1} - ${end.getDate()}/${end.getMonth()+1}/${end.getFullYear()}`
}

function Settings() {
 const { state, updateProfile } = useApp()
 const { isRTL } = useI18n()
 const prefs = state.profile.calendarPrefs || { workoutHour: 18, mealTimes: {'בוקר': 8,'צהריים': 13,'ערב': 20,'נשנוש': 16 }, reminders: true }
 const set = (patch) => updateProfile({ calendarPrefs: { ...prefs, ...patch } })

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card>
 <SectionHeader title={isRTL ? 'שעות ברירת מחדל' : 'Default times'} subtitle={isRTL ? 'השעות בהן ננקבע אירועים בלו״ז' : 'Hours we schedule events at'} />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
 <TimePicker label={isRTL ? 'אימון' : 'Workout'} value={prefs.workoutHour} onChange={v => set({ workoutHour: v })} />
 {Object.entries(prefs.mealTimes).map(([name, hour]) => (
 <TimePicker key={name} label={mealLabel(name, isRTL)} value={hour} onChange={v => set({ mealTimes: { ...prefs.mealTimes, [name]: v } })} />
 ))}
 </div>
 </Card>

 <Card>
 <SectionHeader title={isRTL ? 'תזכורות' : 'Reminders'} />
 <label style={{ display:'flex', alignItems:'center', gap: 10, cursor:'pointer', padding: 12, background: t.color.bgSoft, borderRadius: t.radius.md }}>
 <input type="checkbox"checked={prefs.reminders !== false} onChange={e => set({ reminders: e.target.checked })} style={{ width: 20, height: 20, accentColor: t.color.gold }} />
 <div>
 <div style={{ fontWeight: 600 }}>{isRTL ? 'הוסף תזכורות VALARM לאירועים' : 'Add VALARM reminders to events'}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{isRTL ? 'אימונים: 30 דק׳ לפני · ארוחות: 15 דק׳ לפני' : 'Workouts: 30 min before · Meals: 15 min before'}</div>
 </div>
 </label>
 </Card>

 <Card>
 <SectionHeader title={isRTL ? 'שילוב עתידי' : 'Future integration'} />
 <div style={{ padding: 14, background: t.color.bgSoft, borderRadius: t.radius.md, fontSize: t.font.sm, color: t.color.textDim, lineHeight: 1.7 }}>
 <b style={{ color: t.color.gold }}>{isRTL ? 'סנכרון דו-כיווני מלא' : 'Full two-way sync'}</b> {isRTL ? '(OAuth 2.0 עם Google Calendar API) יגיע בגרסה הבאה עם ה-Backend. בינתיים - ייצוא ICS + Deep Links זה כמעט אותו הדבר, וללא הרשאות מיוחדות.' : '(OAuth 2.0 with Google Calendar API) will arrive in the next version with the backend. Meanwhile — ICS export + deep links is almost the same, with no extra permissions needed.'}
 </div>
 </Card>
 </div>
 )
}

function TimePicker({ label, value, onChange }) {
 const { isRTL } = useI18n()
 return (
 <div>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 6 }}>{label}</div>
 <Input type="number"min={0} max={23} value={value} onChange={e => onChange(+e.target.value)} placeholder={isRTL ? 'שעה' : 'Hour'} />
 </div>
 )
}

function Help() {
 const { isRTL } = useI18n()
 return (
 <Card style={{ padding: 24 }}>
 <SectionHeader title={isRTL ? 'איך זה עובד' : 'How it works'} />
 <div style={{ display:'grid', gap: 16, fontSize: t.font.md, lineHeight: 1.7 }}>
 <div>
 <div style={{ fontWeight: 700, color: t.color.gold, marginBottom: 6 }}> {isRTL ? 'אופציה 1 - ייבוא של שבוע שלם' : 'Option 1 — import an entire week'}</div>
 <div style={{ color: t.color.textDim }}>
 {isRTL ? 'לחץ "הורד קובץ ICS לשבוע"ופתח אותו. Google Calendar / Apple Calendar / Outlook - כולם יזהו את הפורמט ויציעו לך לייבא הכל בבת אחת. אירועים חוזרים אוטומטית עם התזכורות והפרטים המלאים.' : 'Click "Download weekly ICS" and open it. Google Calendar / Apple Calendar / Outlook all recognize the format and offer to import everything at once. Recurring events with reminders and full details.'}
 </div>
 </div>
 <div>
 <div style={{ fontWeight: 700, color: t.color.gold, marginBottom: 6 }}> {isRTL ? 'אופציה 2 - הוספה בקליק' : 'Option 2 — one-click add'}</div>
 <div style={{ color: t.color.textDim }}>
 {isRTL ? 'כל אירוע מציג כפתור "+ Google Calendar"שפותח את היומן שלך עם כל השדות מולאים מראש. אתה רק לוחץ "שמור".' : 'Every event shows a "+ Google Calendar" button that opens your calendar with all fields pre-filled. Just hit Save.'}
 </div>
 </div>
 <div>
 <div style={{ fontWeight: 700, color: t.color.gold, marginBottom: 6 }}> {isRTL ? 'גישה מהמובייל' : 'Mobile access'}</div>
 <div style={{ color: t.color.textDim }}>
 {isRTL ? 'אם אתה במובייל, קובץ ICS יורד ל-Files ואפשר לפתוח אותו ישירות מהיומן. Google Calendar App מזהה את הפורמט אוטומטית.' : 'On mobile, the ICS file downloads to Files and can be opened directly from your calendar. Google Calendar App recognizes the format automatically.'}
 </div>
 </div>
 <div>
 <div style={{ fontWeight: 700, color: t.color.gold, marginBottom: 6 }}> {isRTL ? 'פרטיות' : 'Privacy'}</div>
 <div style={{ color: t.color.textDim }}>
 {isRTL ? 'הכל קורה במכשיר שלך. לא נשלחות שום נתונים לשרת. אין חיבור ל-Google או OAuth - רק פורמט קובץ סטנדרטי.' : 'Everything happens on your device. No data is sent to any server. No Google or OAuth connection — just a standard file format.'}
 </div>
 </div>
 <div>
 <div style={{ fontWeight: 700, color: t.color.gold, marginBottom: 6 }}> {isRTL ? 'בעתיד' : 'Coming later'}</div>
 <div style={{ color: t.color.textDim }}>
 {isRTL ? 'סנכרון דו-כיווני מלא (שינוי במקום אחד = עדכון בשני) יתאפשר עם חיבור Backend. בינתיים הפורמט הזה סוגר 95% מהצורך.' : 'Full two-way sync (change here = update there) will land with the backend integration. Meanwhile this format covers 95% of the need.'}
 </div>
 </div>
 </div>
 </Card>
 )
}
