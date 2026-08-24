import React, { useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Card, Button, Badge } from '../../../../components/ui/UI'
import { useApp } from '../../../../store/AppStore'
import { WodDisplay } from '../crossfit/WodDisplay'
import { CrossFitWod } from '../crossfit/WodGenerator'
import {
  GYMN_FOCUSES, GYMN_PROGRAMS, generateGymnasticsWod, gymnasticsProgramToPlan,
} from '../../../../data/disciplines/gymnastics'
import {
  OLY_FOCUSES, OLY_PROGRAMS, generateWeightliftingWod, weightliftingProgramToPlan,
} from '../../../../data/disciplines/weightlifting'
import {
  HYROX_FOCUSES, HYROX_PROGRAMS, generateHyroxWod, hyroxProgramToPlan,
} from '../../../../data/disciplines/hyrox'
import { WOD_LEVELS, levelFromProfile } from '../../../../data/disciplines/levels'
import { TechniqueAnalyzer } from '../technique/TechniqueAnalyzer'
import { CustomWodBuilder } from './CustomWodBuilder'

// The WOD tab shell: 4 discipline chips at top, each routes to its own
// generator UI. CrossFit keeps the existing full-featured generator.
// Running was promoted to its own top-level Train tab.

const DISCIPLINES = [
  { key:'crossfit',      he:'METCONS'     },
  { key:'gymnastics',    he:'ג׳ימנסטיקס' },
  { key:'weightlifting', he:'הנפות'       },
  { key:'hyrox',         he:'HYROX'       },
]

export function WodHub() {
  const [discipline, setDiscipline] = useState('crossfit')
  // Technique review is available for the two disciplines whose faults are
  // actually measurable from a side-on clip.
  const [techniqueFor, setTechniqueFor] = useState(null)

  if (techniqueFor) {
    return <TechniqueAnalyzer discipline={techniqueFor} onClose={() => setTechniqueFor(null)} />
  }

  const supportsTechnique = discipline === 'gymnastics' || discipline === 'weightlifting'

  return (
    <div>
      <DisciplineStrip active={discipline} onChange={setDiscipline} />
      {supportsTechnique && (
        <TechniqueCta discipline={discipline} onOpen={() => setTechniqueFor(discipline)} />
      )}
      {discipline === 'crossfit' && <CrossFitWod />}
      {discipline === 'gymnastics' && (
        <SimpleDiscipline
          disciplineKey="gymnastics"
          focuses={GYMN_FOCUSES}
          programs={GYMN_PROGRAMS}
          generate={(focus, ctx) => generateGymnasticsWod({ focus, level: ctx.level })}
          programToPlan={gymnasticsProgramToPlan}
        />
      )}
      {discipline === 'weightlifting' && (
        <SimpleDisciplineWithRMs
          disciplineKey="weightlifting"
          focuses={OLY_FOCUSES}
          programs={OLY_PROGRAMS}
          generate={(focus, ctx) => generateWeightliftingWod({ focus, level: ctx.level, oneRMs: ctx.oneRMs })}
          programToPlan={(id, ctx) => weightliftingProgramToPlan(id, ctx.oneRMs)}
        />
      )}
      {discipline === 'hyrox' && (
        <SimpleDiscipline
          disciplineKey="hyrox"
          focuses={HYROX_FOCUSES}
          programs={HYROX_PROGRAMS}
          generate={(focus, ctx) => generateHyroxWod({ focus, level: ctx.level })}
          programToPlan={hyroxProgramToPlan}
        />
      )}
    </div>
  )
}

// Entry point into the on-device technique review.
function TechniqueCta({ discipline, onOpen }) {
  const label = discipline === 'weightlifting' ? 'הנפות' : 'ג׳ימנסטיקס'
  return (
    <button onClick={onOpen} style={{
      width:'100%', textAlign:'start', fontFamily:'inherit', cursor:'pointer',
      background: `linear-gradient(135deg, ${t.color.goldGlow} 0%, ${t.color.bgElevated} 65%)`,
      border: `1px solid ${t.color.gold}`, borderRadius: t.radius.md,
      padding:'14px 16px', marginBottom: 14, color: t.color.text,
      display:'flex', alignItems:'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: t.color.gold, color:'#0d0d14',
        display:'grid', placeItems:'center', fontWeight: 900, fontSize: 18,
      }}>°</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: t.color.gold }}>בדוק את הטכניקה שלך</div>
        <div style={{ fontSize: 12, color: t.color.textDim, marginTop: 2 }}>
          צלם סט של {label} — נמדוד זוויות מפרקים ונחזיר תיקונים
        </div>
      </div>
      <span style={{ fontSize: 22, color: t.color.gold }}>›</span>
    </button>
  )
}

function DisciplineStrip({ active, onChange }) {
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 6,
      marginBottom: 16,
    }}>
      {DISCIPLINES.map(d => {
        const isActive = active === d.key
        return (
          <button key={d.key} onClick={() => onChange(d.key)} style={{
            padding:'16px 8px',
            background: isActive
              ? `linear-gradient(160deg, rgba(199,64,80,0.14), ${t.color.bgElevated} 70%)`
              : t.color.bgSoft,
            border: `1px solid ${isActive ? 'rgba(199,64,80,0.55)' : t.color.border}`,
            borderRadius: t.radius.md, cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap: 6,
            fontFamily:'inherit', color: t.color.text,
            transition: t.transition,
          }}>
            <span style={{
              fontFamily: t.font.family.display, fontWeight: 700,
              fontSize: 14, letterSpacing:'-0.01em',
              color: isActive ? t.color.white : t.color.text,
            }}>{d.he}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Generic discipline UI (used by gymnastics) ─────────────
function SimpleDiscipline({ disciplineKey, focuses, programs, generate, programToPlan, context = {} }) {
  const { state, logWorkout, setPlan } = useApp()
  // 'custom' is offered where a build-your-own pool exists — the premade
  // sessions assume a full box, which is not what most people have.
  const [mode, setMode] = useState('single') // 'single' | 'program' | 'custom'
  const [focus, setFocus] = useState('random')
  const [level, setLevel] = useState(() => levelFromProfile(state.profile?.experience))
  const [wod, setWod] = useState(null)

  const handleGenerate = () => {
    const result = generate(focus, { ...context, level })
    setWod(result)
    if (typeof window !== 'undefined') window.scrollTo({ top: document.body.scrollHeight, behavior:'smooth' })
  }

  const adopt = (programId) => {
    const plan = programToPlan(programId, context)
    if (!plan) return
    setPlan(plan)
    alert(`התכנית "${plan.name}" אומצה. עבור ללשונית "התכנית שלי"`)
  }

  const logCompleted = () => {
    if (!wod) return
    logWorkout({
      date: new Date().toISOString(),
      sessionName: `${labelFor(disciplineKey)} — ${wod.title}`,
      exercises: [],
      wodMeta: { discipline: disciplineKey, focus: wod.focus, lines: wod.lines },
    })
    alert('נשמר בהיסטוריה!')
  }

  return (
    <div>
      {/* Mode toggle */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        <ModeCard active={mode === 'single'} onClick={() => setMode('single')}
          title="אימון בודד" sub="חד־פעמי · היום" />
        <ModeCard active={mode === 'custom'} onClick={() => setMode('custom')}
          title="בנייה עצמאית" sub="לפי הציוד שלך" />
        <ModeCard active={mode === 'program'} onClick={() => setMode('program')}
          title="תכנית" sub={`${programs[0]?.weeks || 8} שבועות`} />
      </div>

      {mode === 'custom' ? (
        <CustomWodBuilder discipline={disciplineKey} />
      ) : mode === 'single' ? (
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
              {focuses.map(f => (
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

          <Button
            variant="primary" size="lg" onClick={handleGenerate}
            style={{
              width:'100%', justifyContent:'center',
              background: t.color.wineLight, color: t.color.white,
              border:`1px solid ${t.color.wineLight}`,
              padding: 16, marginBottom: 16,
            }}
          >← צור אימון</Button>

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
            {programs.map(p => (
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

// Wrapper that injects the user's 1RMs from profile for weightlifting
function SimpleDisciplineWithRMs(props) {
  const { state } = useApp()
  const oneRMs = state.profile?.oneRMs || {}
  return <SimpleDiscipline {...props} context={{ oneRMs }} />
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

function labelFor(discipline) {
  return {
    gymnastics: 'Gymnastics',
    weightlifting: 'Weightlifting',
    running: 'Running',
    hyrox: 'HYROX',
  }[discipline] || 'WOD'
}
