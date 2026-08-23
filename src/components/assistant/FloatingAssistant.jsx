import React, { useState, useEffect, useRef } from 'react'
import { t } from '../../theme/tokens'
import { useApp } from '../../store/AppStore'
import { askAiCoach, aiEnabled, isMentalQuestion } from '../../services/aiCoach'
import { tryCalculator } from '../../services/coachingCalculators'
import { tryKnowledge } from '../../services/coachingKnowledge'

// Floating AI coach - powered by Gemini when configured, falls back to
// keyword answers when offline / not configured.

const QUICK_QUESTIONS = [
 { q:'כמה קלוריות בחיטוב?'},
 { q:'כמה חלבון ליום?'},
 { q:'מה זה סופרסט?'},
 { q:'כמה מנוחה בין סטים?'},
 { q:'איך בונים תכנית?'},
]

const MENTAL_KEYWORDS = ['מרגיש רע','לחוץ','עצוב','חרד','מפחד','כועס','מדוכא',
 'שחוק נפשית','לא רוצה יותר','מוותר','קשה לי נפשית','ריקנות','בודד',
 'רוצה לבכות','שנאה','תסכול נפשי']

// Navigation-only fallbacks — each ships with a nav action so the user can
// jump directly instead of scrolling to find the section.
const FALLBACK_ANSWERS = {
 add_workout: {
   text: 'עבור ל־**אימונים → התכנית שלי** ולחץ על כרטיס האימון. תוכל לרשום סטים, משקל, וחזרות בזמן אמת עם טיימר מנוחה אוטומטי.',
   nav: { page: 'train', label: 'עבור לאימונים' },
 },
 build_plan: {
   text: 'עבור ל־**מטרה** ולחץ על **"בנה לי תכנית"**. תעבור wizard של 3 שלבים.',
   nav: { page: 'goals', label: 'עבור למטרה' },
 },
 add_meal: {
   text: 'עבור ל־**תזונה → היום → + הוסף**. יש 3 אפשרויות: חיפוש, ברקוד, או הזנה ידנית.',
   nav: { page: 'nutrition', label: 'עבור לתזונה' },
 },
 what_1rm: {
   text: 'המשקל המקסימלי בחזרה אחת. עבור ל־**פרופיל → יכולת מירבית** להזין. כל האחוזים בתכניות מחושבים מזה.',
   nav: { page: 'profile', label: 'עדכן 1RM בפרופיל' },
 },
 calendar: {
   text: 'עבור ל־**יומן** בתפריט. אפשר להוריד קובץ ICS לשבוע שלם או להוסיף ל־Google Calendar.',
   nav: { page: 'calendar', label: 'עבור ליומן' },
 },
 progress: {
   text: 'עבור ל־**התקדמות** בתפריט. אפשר לרשום מדידות, להעלות תמונות, ולתעד שיאים אישיים.',
   nav: { page: 'progress', label: 'עבור להתקדמות' },
 },
 rehab: {
   text: 'עבור ל־**שיקום** בתפריט. בחר אזור, ענה על שאלון, וקבל פרוטוקול 4 שבועות.',
   nav: { page: 'rehab', label: 'עבור לשיקום' },
 },
 bloodtest: {
   text: 'עבור ל־**תזונה → בדיקות דם**. הזן ערכים ותקבל פרשנות תזונתית.',
   nav: { page: 'nutrition', label: 'תזונה — בדיקות דם' },
 },
 goal: {
   text: 'עבור ל־**מטרה**. אם עוד לא הגדרת, בחר "בואו נבנה מטרה" - 3 קליקים.',
   nav: { page: 'goals', label: 'עבור למטרה' },
 },
 install: {
   text: 'iPhone: שיתוף ⬆️ → הוסף למסך הבית. Android: יופיע banner "התקן את האפליקציה".',
 },
 default: {
   text: 'לא הבנתי בדיוק. נסה לנסח אחרת או בחר מהשאלות המוצעות. לשאלות אישיות/רגשיות - יש את המאמן המנטלי בתפריט.',
 },
}

function matchFallback(text) {
 const lower = text.toLowerCase().trim()
 if (!lower) return null
 for (const kw of MENTAL_KEYWORDS) {
 if (lower.includes(kw)) return { key:'MENTAL', text: null }
 }
 const pick = (key) => ({ key, ...FALLBACK_ANSWERS[key] })
 if (/אימון|תרגיל|לרשום/.test(lower)) return pick('add_workout')
 if (/תכנית|לבנות|תוכנית/.test(lower)) return pick('build_plan')
 if (/ארוחה|אוכל|קלוריות|מזון/.test(lower)) return pick('add_meal')
 if (/1rm|יכולת מירבית|מקסימום/.test(lower)) return pick('what_1rm')
 if (/יומן|calendar|לו״ז|לוז/.test(lower)) return pick('calendar')
 if (/משקל גוף|התקדמות|מדידה|תמונ|שיא|pr/i.test(lower)) return pick('progress')
 if (/שיקום|פציעה|כאב/.test(lower)) return pick('rehab')
 if (/דם|בדיקה|ויטמין/.test(lower)) return pick('bloodtest')
 if (/מטרה|goal|יעד/.test(lower)) return pick('goal')
 if (/להתקין|התקנה|install|מסך הבית/.test(lower)) return pick('install')
 return pick('default')
}

// ─── Draggable position ─────────────────────────────────────
// Persisted per user. Position is stored as the button's top-left
// corner relative to the viewport, clamped on load so a smaller
// window on this device doesn't leave the button off-screen.
const POS_KEY = 'hfos:assistant_pos'
// sessionStorage — X hides the bubble until the tab is re-opened.
const HIDDEN_KEY = 'hfos:assistant_hidden'
const BUTTON_SIZE = 58
const PANEL_W = 360
const PANEL_H = 520
const DRAG_THRESHOLD = 5 // px — below this a pointerup counts as a click

const loadPos = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    return clampPos(p, BUTTON_SIZE)
  } catch { return null }
}
const savePos = (p) => {
  try { localStorage.setItem(POS_KEY, JSON.stringify(p)) } catch {}
}
const clampPos = (p, size) => {
  if (typeof window === 'undefined') return p
  const vw = window.innerWidth
  const vh = window.innerHeight
  return {
    x: Math.max(8, Math.min(p.x, vw - size - 8)),
    y: Math.max(8, Math.min(p.y, vh - size - 8)),
  }
}

// Panel position derived from the button — if it fits below/right,
// grow that way; otherwise, mirror to the other side.
const panelPosFor = (buttonPos) => {
  if (typeof window === 'undefined') return { x: buttonPos.x, y: buttonPos.y }
  const vw = window.innerWidth
  const vh = window.innerHeight
  const gap = 12
  let x = buttonPos.x
  let y = buttonPos.y + BUTTON_SIZE + gap
  const panelW = Math.min(PANEL_W, vw - 24)
  const panelH = Math.min(PANEL_H, vh - 100)
  // If overflows right → align to right edge
  if (x + panelW > vw - 8) x = vw - panelW - 8
  // If overflows bottom → open above the button
  if (y + panelH > vh - 8) y = Math.max(8, buttonPos.y - panelH - gap)
  return { x, y }
}

export function FloatingAssistant({ onOpenMentalCoach, onNavigate }) {
 const { state } = useApp()
 const [open, setOpen] = useState(false)
 const [messages, setMessages] = useState([])
 const [input, setInput] = useState('')
 const [thinking, setThinking] = useState(false)
 // Hidden-for-session — X closes the bubble until the tab is re-opened.
 const [hidden, setHidden] = useState(() => {
   if (typeof window === 'undefined') return false
   try { return sessionStorage.getItem(HIDDEN_KEY) === '1' } catch { return false }
 })
 const hide = () => {
   try { sessionStorage.setItem(HIDDEN_KEY, '1') } catch {}
   setHidden(true)
 }
 const scrollRef = useRef(null)

 // Draggable position — default: bottom-left corner (matches old design)
 const [pos, setPos] = useState(() => {
   const saved = loadPos()
   if (saved) return saved
   if (typeof window === 'undefined') return { x: 20, y: 400 }
   return { x: 20, y: window.innerHeight - 90 - BUTTON_SIZE }
 })
 const dragState = useRef({ dragging: false, startX: 0, startY: 0, originX: 0, originY: 0, moved: false })

 // Re-clamp on window resize so a rotated / resized viewport
 // doesn't strand the button off-screen.
 useEffect(() => {
   if (typeof window === 'undefined') return
   const onResize = () => setPos(p => clampPos(p, BUTTON_SIZE))
   window.addEventListener('resize', onResize)
   return () => window.removeEventListener('resize', onResize)
 }, [])

 const onPointerDown = (e) => {
   const clientX = e.clientX
   const clientY = e.clientY
   dragState.current = {
     dragging: true, moved: false,
     startX: clientX, startY: clientY,
     originX: pos.x, originY: pos.y,
   }
   e.currentTarget.setPointerCapture?.(e.pointerId)
 }
 const onPointerMove = (e) => {
   const d = dragState.current
   if (!d.dragging) return
   const dx = e.clientX - d.startX
   const dy = e.clientY - d.startY
   if (!d.moved && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return
   d.moved = true
   const next = clampPos({ x: d.originX + dx, y: d.originY + dy }, BUTTON_SIZE)
   setPos(next)
 }
 const onPointerUp = (e) => {
   const d = dragState.current
   const didDrag = d.moved
   dragState.current = { ...d, dragging: false }
   e.currentTarget.releasePointerCapture?.(e.pointerId)
   if (didDrag) {
     savePos(pos)
   } else {
     // Treat as click — open the panel
     setOpen(true)
   }
 }

 const userContext = {
 name: state.profile?.name,
 sex: state.profile?.sex,
 age: state.profile?.age,
 goal: (state.goals || []).find(g => g.status === 'active')?.title,
 plan: state.plan?.name,
 }

 useEffect(() => {
 if (open && messages.length === 0) {
 const greeting = aiEnabled
 ? 'היי! אני המדריך שלך מבוסס AI. שאל אותי כל שאלה - אימונים, תזונה, שינה, הורמונים, ניווט באפליקציה. במה אוכל לעזור?'
 :'היי! אני המדריך שלך. אני עוזר לך למצוא דברים באפליקציה ולענות על שאלות מהירות. במה אוכל לעזור?'
 setMessages([{ role:'bot', text: greeting }])
 }
 }, [open])

 useEffect(() => {
 if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
 }, [messages, thinking])

 const send = async (text) => {
 const q = (text || '').trim()
 if (!q || thinking) return
 setMessages(m => [...m, { role:'user', text: q }])
 setInput('')

 // Mental question detection - always route to mental coach regardless of AI
 if (isMentalQuestion(q)) {
 setMessages(m => [...m, {
 role:'bot', mental: true,
 text:'זו שאלה שראויה למאמן המנטלי — שם תוכל לקבל שיחה עמוקה יותר. רוצה שאעביר אותך?',
 }])
 return
 }

 setThinking(true)

 // Layer A — personalised calculators (calories/protein/water/1RM/rest/BMI)
 const calcAns = tryCalculator(q, state)
 if (calcAns) {
   setTimeout(() => {
     setMessages(m => [...m, { role:'bot', text: calcAns.text, nav: calcAns.nav, source: 'calc' }])
     setThinking(false)
   }, 120)
   return
 }

 // Layer B — static professional knowledge base
 const kbAns = tryKnowledge(q)
 if (kbAns) {
   setTimeout(() => {
     setMessages(m => [...m, { role:'bot', text: kbAns.text, nav: kbAns.nav, source: 'kb' }])
     setThinking(false)
   }, 120)
   return
 }

 // Layer C — Gemini fallback (if configured)
 if (aiEnabled) {
   const aiReply = await askAiCoach({
     question: q,
     history: messages,
     userContext,
   })
   if (aiReply) {
     setMessages(m => [...m, { role:'bot', text: aiReply, ai: true }])
     setThinking(false)
     return
   }
 }

 // Layer D — keyword-matched navigation fallback
 setTimeout(() => {
   const match = matchFallback(q)
   if (match?.key === 'MENTAL') {
     setMessages(m => [...m, { role:'bot', mental: true, text: 'זו שאלה למאמן המנטלי. רוצה שאעביר אותך?' }])
   } else {
     setMessages(m => [...m, { role:'bot', text: match?.text || FALLBACK_ANSWERS.default.text, nav: match?.nav }])
   }
   setThinking(false)
 }, 200)
 }

 const goToMental = () => { setOpen(false); onOpenMentalCoach?.() }
 const goToPage = (page) => {
   if (!page || !onNavigate) return
   setOpen(false)
   onNavigate(page)
 }

 const panelPos = panelPosFor(pos)

 // Session-hidden — user dismissed the bubble; comes back on new session.
 if (hidden) return null

 return (
 <>
 {!open && (
 <div style={{
 position:'fixed', left: pos.x, top: pos.y, zIndex: 900,
 width: BUTTON_SIZE, height: BUTTON_SIZE,
 }}>
 <button
 onPointerDown={onPointerDown}
 onPointerMove={onPointerMove}
 onPointerUp={onPointerUp}
 aria-label="פתח את המדריך — לחץ ארוך לגרירה"
 title="גרור להזזה · לחיצה לפתיחה"
 style={{
 position:'absolute', inset: 0,
 width:'100%', height:'100%', borderRadius:'50%',
 background: t.color.gold, color:'#0d0d14',
 border:'none',
 cursor: dragState.current.moved ? 'grabbing' : 'grab',
 display:'flex', alignItems:'center', justifyContent:'center',
 fontSize: 26, boxShadow: `0 8px 32px rgba(0,0,0,.5), 0 0 24px ${t.color.gold}44`,
 touchAction:'none',
 userSelect:'none',
 fontFamily:'inherit', fontWeight: 900,
 transition: dragState.current.dragging ? 'none' : 'transform .2s ease',
 }}
 onMouseEnter={e => { if (!dragState.current.dragging) e.currentTarget.style.transform = 'scale(1.08)' }}
 onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
 > AI</button>
 {/* X — dismiss until re-entry */}
 <button
 onClick={hide}
 aria-label="סגור מדריך AI לסשן הזה"
 title="הסתר עד כניסה מחדש למערכת"
 style={{
 position:'absolute', top: -6, insetInlineEnd: -6,
 width: 22, height: 22, borderRadius:'50%',
 background: t.color.bgElevated, color: t.color.text,
 border: `1px solid ${t.color.border}`,
 cursor:'pointer', fontFamily:'inherit', fontWeight: 900,
 fontSize: 12, lineHeight: 1, padding: 0,
 display:'grid', placeItems:'center',
 boxShadow:'0 2px 6px rgba(0,0,0,.4)',
 }}
 >×</button>
 </div>
 )}

 {open && (
 <div style={{
 position:'fixed',
 left: panelPos.x, top: panelPos.y, zIndex: 900,
 width: Math.min(PANEL_W, typeof window !== 'undefined' ? window.innerWidth - 24 : PANEL_W),
 height: Math.min(PANEL_H, typeof window !== 'undefined' ? window.innerHeight - 100 : PANEL_H),
 background: t.color.bgElevated,
 border: `1px solid ${t.color.gold}`, borderRadius: t.radius.lg,
 boxShadow:'0 20px 60px rgba(0,0,0,.6)',
 display:'flex', flexDirection:'column', overflow:'hidden',
 direction:'rtl',
 }}>
 {/* Header */}
 <div style={{
 padding: 14, background: t.color.gold, color:'#0d0d14',
 display:'flex', alignItems:'center', justifyContent:'space-between',
 }}>
 <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
 <span style={{ fontSize: 20 }}>{aiEnabled ? '' :''}</span>
 <div>
 <div style={{ fontWeight: 800, fontSize: 14 }}>המדריך שלך{aiEnabled ? '· AI' :''}</div>
 <div style={{ fontSize: 10, opacity: 0.75 }}>
 {aiEnabled ? 'אימונים · תזונה · הורמונים · שינה · פציעות':'ניווט + שאלות מהירות'}
 </div>
 </div>
 </div>
 <button onClick={() => setOpen(false)} aria-label="סגור"style={{
 background:'rgba(0,0,0,.15)', border:'none', color:'#0d0d14',
 width: 26, height: 26, borderRadius:'50%', cursor:'pointer', fontSize: 14,
 display:'grid', placeItems:'center',
 }}> </button>
 </div>

 {/* Messages */}
 <div ref={scrollRef} style={{
 flex: 1, overflowY:'auto', padding: 14,
 display:'flex', flexDirection:'column', gap: 10,
 }}>
 {messages.map((m, i) => (
 <div key={i} style={{
 alignSelf: m.role === 'user'? 'flex-start':'flex-end',
 maxWidth:'88%',
 }}>
 <div style={{
 padding:'10px 14px', borderRadius: 14,
 background: m.role === 'user'? t.color.gold : t.color.bgSoft,
 color: m.role === 'user'? '#0d0d14': t.color.text,
 fontSize: 13, lineHeight: 1.6,
 }} dangerouslySetInnerHTML={{ __html: formatText(m.text) }} />
 {(m.source === 'calc' || m.source === 'kb') && (
 <div style={{ fontSize: 9, color: t.color.textDim, marginTop: 2, textAlign:'left', paddingLeft: 4 }}>
 {m.source === 'calc' ? 'מחשבון · לפי הנתונים שלך' : 'מקצועי · מבוסס־ראיות'}
 </div>
 )}
 {m.ai && (
 <div style={{ fontSize: 9, color: t.color.textDim, marginTop: 2, textAlign:'left', paddingLeft: 4 }}>
 AI · Gemini
 </div>
 )}
 {m.nav && (
 <button onClick={() => goToPage(m.nav.page)} style={{
 marginTop: 8, padding: '9px 16px',
 background: `linear-gradient(135deg, ${t.color.gold} 0%, #d4b45a 100%)`,
 color: '#0d0d14',
 border: 'none', borderRadius: 999, cursor: 'pointer',
 fontWeight: 800, fontSize: 12,
 display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
 boxShadow: `0 2px 12px ${t.color.gold}55`,
 }}>← {m.nav.label}</button>
 )}
 {m.mental && (
 <button onClick={goToMental} style={{
 marginTop: 6, padding:'8px 14px', background: t.color.gold, color:'#0d0d14',
 border:'none', borderRadius: 999, cursor:'pointer', fontWeight: 700, fontSize: 12,
 display:'flex', alignItems:'center', gap: 6, fontFamily:'inherit',
 }}>← עבור למאמן המנטלי</button>
 )}
 </div>
 ))}
 {thinking && (
 <div style={{ alignSelf:'flex-end', maxWidth:'85%'}}>
 <div style={{
 padding:'10px 14px', borderRadius: 14,
 background: t.color.bgSoft, color: t.color.textDim,
 fontSize: 13, lineHeight: 1.55, fontStyle:'italic',
 }}>
 <span style={{ display:'inline-flex', gap: 3 }}>
 <span style={{ animation:'hfos-blink 1.4s infinite'}}>•</span>
 <span style={{ animation:'hfos-blink 1.4s infinite 0.2s'}}>•</span>
 <span style={{ animation:'hfos-blink 1.4s infinite 0.4s'}}>•</span>
 </span>
 <span style={{ marginRight: 6 }}>{aiEnabled ? 'המדריך חושב...':''}</span>
 </div>
 </div>
 )}
 </div>

 {/* Quick chips */}
 {messages.length <= 1 && !thinking && (
 <div style={{ padding: 10, borderTop: `1px solid ${t.color.border}`, display:'flex', flexWrap:'wrap', gap: 5 }}>
 {QUICK_QUESTIONS.map((q, i) => (
 <button key={i} onClick={() => send(q.q)} style={{
 padding:'5px 10px', background: t.color.bgSoft, border: `1px solid ${t.color.border}`,
 color: t.color.text, borderRadius: 999, cursor:'pointer', fontSize: 11,
 fontFamily:'inherit',
 }}>{q.q}</button>
 ))}
 </div>
 )}

 {/* Input */}
 <form onSubmit={e => { e.preventDefault(); send(input) }} style={{
 display:'flex', gap: 6, padding: 10,
 borderTop: `1px solid ${t.color.border}`,
 }}>
 <input value={input} onChange={e => setInput(e.target.value)}
 placeholder={aiEnabled ? 'שאל אותי כל שאלה...':'כתוב שאלה...'}
 style={{
 flex: 1, padding:'9px 12px', background: t.color.bgSoft,
 border: `1px solid ${t.color.border}`, borderRadius: 10,
 color: t.color.text, fontFamily:'inherit', fontSize: 13,
 outline:'none', direction:'rtl',
 }} />
 <button type="submit"disabled={!input.trim() || thinking} style={{
 padding:'9px 16px', background: t.color.gold, color:'#0d0d14',
 border:'none', borderRadius: 10, cursor:'pointer', fontWeight: 700,
 fontFamily:'inherit', fontSize: 13, opacity: thinking ? 0.5 : 1,
 }}>שלח</button>
 </form>
 <style>{`@keyframes hfos-blink { 0%,80%,100% { opacity: .3 } 40% { opacity: 1 } }`}</style>
 </div>
 )}
 </>
 )
}

function formatText(txt) {
 if (!txt) return ''
 return String(txt)
 .replace(/\*\*(.+?)\*\*/g,'<b style="color:#c8a84b">$1</b>')
 .replace(/\n/g,'<br>')
}
