import React, { useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Card, Button, Badge, SectionHeader } from '../../../../components/ui/UI'
import { useApp } from '../../../../store/AppStore'
import { WIZARD_STEPS, generatePersonalisedProgram } from '../../../../data/bodybuilding/programGenerator'
import { LEVELS, GOALS, EQUIPMENT_TYPES } from '../../../../data/bodybuilding/programs'
import { ROUTINE_BY_ID } from '../../../../data/bodybuilding/routines'
import { ProgramDetail } from './ProgramDetail'
import { activeGoal, modeFromState, TRAINING_MODES } from '../../../../data/trainingMode'
import {
  parseProgramRequest, MUSCLE_HE, GOAL_HE, EQUIPMENT_HE, LEVEL_HE,
} from '../../../../utils/nlWorkoutParser'
import { RoutineBuilder } from './RoutineBuilder'

// Wizard that generates a personalised program. If the user already
// has an active goal from onboarding we skip the goal question and
// inherit the mode — no more asking "what's your goal?" 3 times.
export function TrainerGenerator() {
 const { state, bbSetActiveProgram } = useApp()
 const goal = activeGoal(state)
 const inheritedMode = modeFromState(state)
 const bbGoalKey = TRAINING_MODES[inheritedMode].bbGoalKey

 // If we can infer the goal, drop it from the wizard flow. Answers
 // seeds with the inferred goal so downstream code stays unchanged.
 const steps = goal
   ? WIZARD_STEPS.filter(s => s.key !== 'goal')
   : WIZARD_STEPS
 const initialAnswers = goal ? { goal: bbGoalKey } : {}

 const [answers, setAnswers] = useState(initialAnswers)
 const [step, setStep] = useState(0)
 const [result, setResult] = useState(null)
 const [detailOpen, setDetailOpen] = useState(false)
 const [overrideGoal, setOverrideGoal] = useState(false)
 // null = show the 3-method picker · 'wizard' | 'freeform' | 'manual' when chosen
 const [inputMode, setInputMode] = useState(null)
 const [freeformText, setFreeformText] = useState('')

 const current = (overrideGoal ? WIZARD_STEPS : steps)[step]
 const activeSteps = overrideGoal ? WIZARD_STEPS : steps
 const isLast = step === activeSteps.length - 1

 const pick = (value) => {
 const newAnswers = { ...answers, [current.key]: value }
 setAnswers(newAnswers)
 if (step < activeSteps.length - 1) {
 setTimeout(() => setStep(step + 1), 200)
 } else {
 // Generate immediately when last step is answered
 const gen = generatePersonalisedProgram(newAnswers)
 setResult(gen)
 }
 }

 const restart = () => { setAnswers(initialAnswers); setStep(0); setResult(null); setOverrideGoal(false); setFreeformText(''); setInputMode('wizard') }

 const freeformParsed = parseProgramRequest(freeformText)
 const canGenerateFromFreeform = freeformParsed.muscles.length > 0 || freeformParsed.goal
 const generateFromFreeform = () => {
   const goalMode = freeformParsed.goal || inheritedMode || 'hypertrophy'
   const params = {
     goal: TRAINING_MODES[goalMode].bbGoalKey,
     equipment: freeformParsed.equipment === 'gym' ? 'gym'
              : freeformParsed.equipment === 'bodyweight' ? 'home_bodyweight'
              : freeformParsed.equipment ? 'home_dumbbells' : 'gym',
     daysPerWeek: freeformParsed.daysPerWeek || 4,
     experience: freeformParsed.level || 'intermediate',
   }
   const gen = generatePersonalisedProgram(params)
   setResult(gen)
 }

 const activate = () => {
 if (!result?.program) return
 bbSetActiveProgram(result.program)
 alert(`התוכנית "${result.program.name}"הופעלה! עבור לטאב Routines כדי להתחיל.`)
 }

 // Result view
 if (result) {
 const p = result.program
 return (
 <div>
 <SectionHeader title=" התוכנית שלך"subtitle={result.reason} />
 <Card glow style={{ borderColor: t.color.gold, marginBottom: t.space.md }}>
 <div style={{ display:'flex', gap: 12, alignItems:'flex-start', marginBottom: t.space.md }}>
 <div style={{ fontSize: 60 }}>{p.emoji}</div>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color: t.color.gold, marginBottom: 4 }}>
 {p.name}
 </div>
 <div style={{ display:'flex', gap: 6, flexWrap:'wrap'}}>
 <Badge color={t.color.gold}>{LEVELS[p.level]?.he}</Badge>
 <Badge color={t.color.purple}>{GOALS[p.goal]?.he}</Badge>
 <Badge color={t.color.info}>{EQUIPMENT_TYPES[p.equipment]?.he}</Badge>
 <Badge color={t.color.success}>{p.daysPerWeek} ימים</Badge>
 <Badge color={t.color.textDim}>{p.weeksRecommended} שבועות</Badge>
 </div>
 </div>
 </div>
 {p.description && (
 <div style={{ color: t.color.text, fontSize: t.font.md, lineHeight: 1.6, marginBottom: t.space.md }}>
 {p.description}
 </div>
 )}
 {p.inspiration && (
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginBottom: t.space.md }}>
 בהשראת: {p.inspiration}
 </div>
 )}

 <div style={{ display:'flex', gap: 8 }}>
 <Button variant="primary"size="lg"onClick={activate} style={{ flex: 2, justifyContent:'center'}}>
 הפעל את התוכנית
 </Button>
 <Button variant="ghost"onClick={() => setDetailOpen(true)}> פרטים</Button>
 <Button variant="outline"onClick={restart}> שוב</Button>
 </div>
 </Card>

 {detailOpen && (
 <ProgramDetail program={p} open={detailOpen} onClose={() => setDetailOpen(false)} />
 )}
 </div>
 )
 }

 // Method picker — first thing the user sees. Three big cards, plain
 // language, no jargon. Pick one and its flow renders below.
 if (!inputMode) {
   return <MethodPicker onPick={setInputMode} />
 }

 // Manual builder — opens RoutineBuilder inline. Saves to "האימונים שלי"
 // via bbSaveRoutine, same behavior as opening the builder from that tab.
 if (inputMode === 'manual') {
   return <RoutineBuilder routine={null} open={true} onClose={() => setInputMode(null)} />
 }

 // Wizard / Freeform view
 return (
 <div>
 {/* Header — shows chosen method + back-to-picker link */}
 <div style={{
   display:'flex', alignItems:'center', justifyContent:'space-between',
   marginBottom: t.space.md, gap: 10,
 }}>
   <div style={{
     display:'flex', gap: 4, background: t.color.bgSoft, padding: 4,
     borderRadius: t.radius.md, flex: 1,
   }}>
     <button onClick={() => setInputMode('wizard')} style={inputModeBtnStyle(inputMode === 'wizard')}>שאלון מודרך</button>
     <button onClick={() => setInputMode('freeform')} style={inputModeBtnStyle(inputMode === 'freeform')}>תיאור בטקסט חופשי</button>
   </div>
   <button onClick={() => { setInputMode(null); restart() }} style={{
     background:'transparent', border:`1px solid ${t.color.border}`,
     color: t.color.silver1, padding:'8px 14px', borderRadius: t.radius.sm,
     cursor:'pointer', fontFamily:'inherit', fontSize: 12,
     whiteSpace:'nowrap',
   }}>החלף שיטה</button>
 </div>

 {inputMode === 'freeform' && (
   <div style={{ display:'grid', gap: 14 }}>
     <textarea
       value={freeformText}
       onChange={e => setFreeformText(e.target.value)}
       placeholder={'למשל: ״תכנית של 4 ימים לבניית מסה, חדר כושר, מתקדם״'}
       rows={4}
       autoFocus
       style={{
         width:'100%', padding: 14,
         background: t.color.bgSoft,
         border:`1px solid ${freeformText ? t.color.gold : t.color.border}`,
         borderRadius: t.radius.md,
         color: t.color.text, fontFamily:'inherit', fontSize: 14,
         lineHeight: 1.55, resize:'vertical', outline:'none',
         direction:'rtl',
       }}
     />
     <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
       {[
         'תכנית של 4 ימים לבניית מסה, חדר כושר, מתקדם',
         '3 פעמים בשבוע בבית, סיבולת',
         'תכנית כוח מירבי, 5 ימים, מוט וכבלים',
       ].map(ex => (
         <button key={ex} onClick={() => setFreeformText(ex)} style={{
           padding:'5px 10px', background: t.color.bgSoft,
           border:`1px solid ${t.color.border}`, borderRadius: t.radius.pill,
           cursor:'pointer', fontFamily:'inherit', fontSize: 11,
           color: t.color.silver1, textAlign:'right',
         }}>{ex}</button>
       ))}
     </div>
     {freeformText && (
       <Card style={{
         padding: 14,
         background:`linear-gradient(160deg, rgba(199,143,58,0.06) 0%, ${t.color.bgElevated} 60%)`,
         border:`1px solid rgba(199,143,58,0.35)`,
       }}>
         <div style={{
           fontFamily:'Space Mono, monospace', fontSize: 10, letterSpacing:'0.24em',
           textTransform:'uppercase', color: t.color.gold, fontWeight: 700, marginBottom: 8,
         }}>מה זיהיתי · {freeformParsed.confidence}%</div>
         <div style={{ display:'grid', gap: 6, fontSize: 12.5, color: t.color.bone }}>
           {freeformParsed.muscles.length > 0 && (
             <div>שרירים: <b>{freeformParsed.muscles.map(m => MUSCLE_HE[m] || m).join(' · ')}</b></div>
           )}
           <div>מטרה: <b>{GOAL_HE[freeformParsed.goal] || GOAL_HE[inheritedMode]}</b>{!freeformParsed.goal && <em style={{ color: t.color.silver2, fontSize: 11 }}> · מהמטרה שלך</em>}</div>
           <div>ציוד: <b>{EQUIPMENT_HE[freeformParsed.equipment] || 'לא צוין (ברירת מחדל)'}</b></div>
           <div>ימים בשבוע: <b>{freeformParsed.daysPerWeek || 4}</b>{!freeformParsed.daysPerWeek && <em style={{ color: t.color.silver2, fontSize: 11 }}> · ברירת מחדל</em>}</div>
           <div>רמה: <b>{LEVEL_HE[freeformParsed.level] || 'בינוני'}</b>{!freeformParsed.level && <em style={{ color: t.color.silver2, fontSize: 11 }}> · ברירת מחדל</em>}</div>
         </div>
       </Card>
     )}
     <Button
       variant="primary" size="lg"
       onClick={generateFromFreeform}
       disabled={!canGenerateFromFreeform}
     >{canGenerateFromFreeform ? 'צור תכנית ←' : 'הזן תיאור כדי להמשיך'}</Button>
   </div>
 )}

 {inputMode === 'wizard' && <>
 {/* Progress indicator */}
 <div style={{ display:'flex', gap: 4, marginBottom: t.space.lg }}>
 {activeSteps.map((_, i) => (
 <div key={i} style={{
 flex: 1, height: 4, borderRadius: 2,
 background: i <= step ? t.color.gold : t.color.bgSoft,
 }} />
 ))}
 </div>

 {/* Intro + inherited-mode banner (only shown before first answer) */}
 {step === 0 && Object.keys(answers).length <= 1 && (
 <>
 <Card style={{ marginBottom: t.space.md, background: `${t.color.gold}11`, borderColor: t.color.gold }}>
 <div style={{ display:'flex', gap: 12, alignItems:'center'}}>
 <div style={{ fontSize: 40 }}></div>
 <div>
 <div style={{ fontWeight: 700, color: t.color.text, marginBottom: 4 }}>מחולל תוכנית אישית</div>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim }}>
 {activeSteps.length} שאלות → תוכנית מותאמת אישית מוכנה לפעולה
 </div>
 </div>
 </div>
 </Card>
 {goal && !overrideGoal && (
 <div style={{
 marginBottom: t.space.md, padding: '10px 14px',
 background: 'rgba(74,156,106,0.08)',
 border: '1px solid rgba(74,156,106,0.3)',
 borderRadius: t.radius.sm,
 fontSize: 12, color: t.color.text,
 display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
 }}>
 <span style={{
 fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.24em',
 color: '#4a9c6a', fontWeight: 700, textTransform: 'uppercase',
 }}>מטרה שלך:</span>
 <span style={{ fontWeight: 600 }}>{TRAINING_MODES[inheritedMode].he}</span>
 {goal.title && <span style={{ color: t.color.textDim, fontSize: 11 }}>· {goal.title}</span>}
 <button
 onClick={() => { setOverrideGoal(true); setAnswers({}); setStep(0) }}
 style={{
 marginInlineStart: 'auto',
 background: 'transparent', border: 'none',
 color: t.color.gold, fontFamily: 'inherit',
 fontSize: 11, fontWeight: 600, cursor: 'pointer',
 textDecoration: 'underline', padding: 0,
 }}
 >שנה מטרה לתכנית הזאת</button>
 </div>
 )}
 </>
 )}

 {/* Question */}
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color: t.color.text, marginBottom: t.space.md, textAlign:'center'}}>
 {current.question}
 </div>

 {/* Options */}
 <div style={{ display:'grid', gap: 10 }}>
 {current.options.map(opt => (
 <button key={opt.value} onClick={() => pick(opt.value)} style={{
 padding: t.space.lg, background: t.color.bgCard,
 border: `1.5px solid ${t.color.border}`, borderRadius: t.radius.md,
 cursor:'pointer', fontFamily:'inherit', textAlign:'right',
 display:'flex', alignItems:'center', gap: 12,
 transition: t.transition,
 }}
 onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.gold; e.currentTarget.style.background = `${t.color.gold}11` }}
 onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border; e.currentTarget.style.background = t.color.bgCard }}
 >
 <div style={{ fontSize: 32 }}>{opt.icon}</div>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 700, color: t.color.text, fontSize: t.font.md }}>{opt.label}</div>
 {opt.description && <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginTop: 2 }}>{opt.description}</div>}
 </div>
 <span style={{ color: t.color.textMuted, fontSize: 24 }}>›</span>
 </button>
 ))}
 </div>

 {/* Back button */}
 {step > 0 && (
 <Button variant="ghost" onClick={() => setStep(step - 1)} style={{ marginTop: t.space.md }}>
 → חזור
 </Button>
 )}
 </>}
 </div>
 )
}

const inputModeBtnStyle = (on) => ({
  flex: 1, padding:'10px 14px', border:'none', fontFamily:'inherit',
  cursor:'pointer', fontSize: 13, fontWeight: 600,
  background: on ? t.color.bgCard :'transparent',
  color: on ? t.color.gold : t.color.textDim,
  borderRadius: t.radius.sm,
})

// Method picker — 3 large cards. First screen the user sees on "בנה אימון משלך".
function MethodPicker({ onPick }) {
  const methods = [
    {
      key: 'wizard',
      title: 'מחולל חכם',
      sub: '3 שאלות והתכנית שלך מוכנה',
      body: 'המערכת שואלת אותך על המטרה, ימי אימון וציוד — ובונה תכנית מותאמת אישית.',
    },
    {
      key: 'freeform',
      title: 'מחולל חופשי',
      sub: 'תתאר במילים, המערכת תבין',
      body: 'למשל: "אימון של 4 ימים לבניית מסה בחדר כושר" — והמערכת מפרשת ובונה.',
    },
    {
      key: 'manual',
      title: 'בניה עצמאית',
      sub: 'תבנה מאפס · שליטה מלאה',
      body: 'בחר תרגילים בעצמך, קבע סטים, חזרות ומשקלים. הכל שמור אוטומטית ב"האימונים שלי".',
    },
  ]
  return (
    <div style={{ display:'grid', gap: 12 }}>
      <div style={{ padding:'4px 0 8px' }}>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.28em',
          textTransform:'uppercase', color: t.color.wineLight, fontWeight: 700,
          marginBottom: 6,
        }}>בנה אימון משלך · Choose method</div>
        <div style={{
          fontFamily: t.font.family.display, fontSize: 22, fontWeight: 700,
          color: t.color.white, letterSpacing:'-0.02em',
        }}>איך תרצה להתחיל?</div>
      </div>

      <div style={{
        display:'grid', gap: 12,
        gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',
      }}>
        {methods.map(m => (
          <button
            key={m.key}
            onClick={() => onPick(m.key)}
            style={{
              display:'block', textAlign:'right', direction:'rtl',
              padding: 20,
              background: `linear-gradient(160deg, ${t.color.bgCard} 0%, ${t.color.bgElevated} 100%)`,
              border: `1px solid ${t.color.border}`,
              borderRadius: t.radius.lg,
              cursor:'pointer', fontFamily:'inherit',
              color: t.color.text,
              transition: t.transition,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = t.color.gold
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = t.color.border
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              fontFamily: t.font.family.display, fontSize: 18, fontWeight: 700,
              color: t.color.gold, letterSpacing:'-0.01em', marginBottom: 4,
            }}>{m.title}</div>
            <div style={{
              fontSize: 12, color: t.color.silver1, fontWeight: 600, marginBottom: 10,
            }}>{m.sub}</div>
            <div style={{
              fontSize: 12, color: t.color.textDim, lineHeight: 1.55,
            }}>{m.body}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
