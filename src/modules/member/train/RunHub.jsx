import React, { useState } from 'react'
import { t } from '../../../theme/tokens'
import { Card, Button } from '../../../components/ui/UI'
import { useApp } from '../../../store/AppStore'
import { WodDisplay } from './crossfit/WodDisplay'
import {
  RUN_FOCUSES, RUN_PROGRAMS, generateRunningWod, runningProgramToPlan,
} from '../../../data/disciplines/running'
import { WOD_LEVELS, levelFromProfile } from '../../../data/disciplines/levels'

// Standalone Running tab — promoted out of WodHub so runners can jump
// straight in without the WOD chip step. Same shell as the discipline
// sub-tab: level → focus → generate, or pick a program to adopt.
export function RunHub() {
  const { state, logWorkout, setPlan } = useApp()
  const [mode, setMode] = useState('single')
  const [focus, setFocus] = useState('random')
  const [level, setLevel] = useState(() => levelFromProfile(state.profile?.experience))
  const [wod, setWod] = useState(null)
  const fiveKSec = state.profile?.fiveKSeconds || null

  const handleGenerate = () => {
    const result = generateRunningWod({ focus, level, fiveKSec })
    setWod(result)
    if (typeof window !== 'undefined') window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' })
  }

  const adopt = (programId) => {
    const plan = runningProgramToPlan(programId, fiveKSec)
    if (!plan) return
    setPlan(plan)
    alert(`התכנית "${plan.name}" אומצה. עבור ללשונית "התכנית שלי"`)
  }

  const logCompleted = () => {
    if (!wod) return
    logWorkout({
      date: new Date().toISOString(),
      sessionName: `Running — ${wod.title}`,
      exercises: [],
      wodMeta: { discipline:'running', focus: wod.focus, lines: wod.lines },
    })
    alert('נשמר בהיסטוריה!')
  }

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8, marginBottom: 14 }}>
        <ModeCard active={mode === 'single'} onClick={() => setMode('single')}
          title="אימון בודד" sub="חד־פעמי · היום" />
        <ModeCard active={mode === 'program'} onClick={() => setMode('program')}
          title="תכנית" sub={`${RUN_PROGRAMS[0]?.weeks || 8} שבועות · פרוגרסיה`} />
      </div>

      {mode === 'single' ? (
        <>
          <Card style={{ marginBottom: 10 }}>
            <div style={{
              fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.22em',
              color: t.color.silver1, fontWeight: 700, textTransform:'uppercase', marginBottom: 10,
            }}>רמה</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6 }}>
              {WOD_LEVELS.map(l => (
                <button key={l.key} onClick={() => setLevel(l.key)} style={{
                  padding:'10px 6px',
                  background: level === l.key ? `${t.color.wineLight}22` : t.color.bgSoft,
                  border:`1px solid ${level === l.key ? t.color.wineLight : t.color.border}`,
                  borderRadius: t.radius.sm, cursor:'pointer', fontFamily:'inherit',
                  color: t.color.text, textAlign:'center',
                  fontSize: 13, fontWeight: level === l.key ? 700 : 500,
                }}>{l.short}</button>
              ))}
            </div>
          </Card>

          <Card style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.22em',
              color: t.color.silver1, fontWeight: 700, textTransform:'uppercase', marginBottom: 10,
            }}>פוקוס</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(100px, 1fr))', gap: 6 }}>
              {RUN_FOCUSES.map(f => (
                <button key={f.key} onClick={() => setFocus(f.key)} style={{
                  padding:'12px 6px',
                  background: focus === f.key ? `${t.color.wineLight}22` : t.color.bgSoft,
                  border:`1px solid ${focus === f.key ? t.color.wineLight : t.color.border}`,
                  borderRadius: t.radius.sm, cursor:'pointer', fontFamily:'inherit',
                  color: t.color.text, textAlign:'center',
                }}>
                  <div style={{ fontSize: 13, fontWeight: focus === f.key ? 700 : 500 }}>{f.he}</div>
                </button>
              ))}
            </div>
          </Card>

          {!fiveKSec && (
            <Card style={{ marginBottom: 12, background: `${t.color.warning}12`, border: `1px solid ${t.color.warning}` }}>
              <div style={{ fontSize: 13, color: t.color.warning, fontWeight: 700, marginBottom: 4 }}>
                עדיין לא הגדרת שיא 5K
              </div>
              <div style={{ fontSize: 12, color: t.color.textDim }}>
                בלי שיא 5K נראה רק תיאור אימון בלי קצבים מומלצים. עבור לפרופיל כדי להזין.
              </div>
            </Card>
          )}

          <Button
            variant="primary" size="lg" onClick={handleGenerate}
            style={{
              width:'100%', justifyContent:'center',
              background: t.color.wineLight, color: t.color.white,
              border:`1px solid ${t.color.wineLight}`,
              padding: 16, marginBottom: 16,
            }}
          >← צור אימון ריצה</Button>

          {wod && (
            <>
              <WodDisplay wod={wod} onStart={null} onRegenerate={handleGenerate} />
              <div style={{ display:'flex', gap: 10, justifyContent:'flex-end', marginTop: 12 }}>
                <Button variant="ghost" onClick={handleGenerate}>אימון אחר</Button>
                <Button onClick={logCompleted}>סיימתי — שמור בהיסטוריה</Button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div style={{
            fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.22em',
            color: t.color.silver1, fontWeight: 700, textTransform:'uppercase', marginBottom: 10,
          }}>בחר תכנית · לחיצה מאמצת אותה כתכנית שלך</div>
          <div style={{ display:'grid', gap: 10 }}>
            {RUN_PROGRAMS.map(p => (
              <Card key={p.id} hover style={{ cursor:'pointer' }} onClick={() => {
                if (confirm(`לאמץ "${p.label}" כתכנית הפעילה שלך?`)) adopt(p.id)
              }}>
                <div style={{ display:'flex', gap: 14, alignItems:'center' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 10,
                    background:`${t.color.wineLight}22`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily: t.font.family.display, fontSize: 20, fontWeight: 800,
                    color: t.color.wineLight, flexShrink: 0,
                  }}>{p.weeks}w</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: t.color.white, marginBottom: 2 }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: 12, color: t.color.silver2, marginBottom: 4 }}>
                      {p.daysPerWeek}×/שב׳ · {p.level} · {p.schema}
                    </div>
                    <div style={{ fontSize: 13, color: t.color.silver1 }}>{p.goal}</div>
                  </div>
                  <span style={{ color: t.color.silver3, fontSize: 22 }}>›</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ModeCard({ active, onClick, title, sub }) {
  return (
    <button onClick={onClick} style={{
      padding: 14,
      background: active ? `${t.color.wineLight}18` : t.color.bgSoft,
      border:`1px solid ${active ? t.color.wineLight : t.color.border}`,
      borderRadius: t.radius.md, cursor:'pointer', fontFamily:'inherit',
      color: t.color.text, textAlign:'center',
    }}>
      <div style={{
        fontFamily: t.font.family.display, fontWeight: 700, fontSize: 15,
        color: active ? t.color.white : t.color.text,
      }}>{title}</div>
      <div style={{ fontSize: 11, color: t.color.silver2, marginTop: 3, letterSpacing:'0.04em' }}>{sub}</div>
    </button>
  )
}
