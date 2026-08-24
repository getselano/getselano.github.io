import React, { useMemo, useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Card, Button, Badge } from '../../../../components/ui/UI'
import { useApp } from '../../../../store/AppStore'
import { WodDisplay } from '../crossfit/WodDisplay'
import { WOD_LEVELS, levelFromProfile } from '../../../../data/disciplines/levels'
import {
  EQUIPMENT, DURATIONS, FORMATS, INTENSITIES, GOALS,
  buildCustomWod, availableMovements, unlockHints,
} from '../../../../data/disciplines/customBuilder'
import { movementName } from '../../../../data/movementName'

// Build-your-own session. Equipment first, because that is the constraint the
// user actually has — everything below it is a preference.
//
// The count of usable movements is shown live as equipment is toggled, so the
// effect of owning a pull-up bar is visible before generating anything.

export function CustomWodBuilder({ discipline }) {
  const { state, logWorkout } = useApp()
  const goals = GOALS[discipline] || []
  const catalog = EQUIPMENT[discipline] || []

  const [equipment, setEquipment] = useState(['none'])
  const [minutes, setMinutes] = useState(20)
  const [format, setFormat] = useState('amrap')
  const [intensity, setIntensity] = useState('medium')
  const [goal, setGoal] = useState('mixed')
  const [level, setLevel] = useState(() => levelFromProfile(state.profile?.experience))
  const [wod, setWod] = useState(null)

  const pool = useMemo(
    () => availableMovements(discipline, equipment),
    [discipline, equipment],
  )
  const hints = useMemo(
    () => unlockHints(discipline, equipment).slice(0, 3),
    [discipline, equipment],
  )

  // "None" is the floor, not a peer: bodyweight is always in play, so it stays
  // on and simply cannot be switched off.
  const toggleEquip = (key) => {
    if (key === 'none') return
    setEquipment(prev => prev.includes(key)
      ? prev.filter(k => k !== key)
      : [...prev, key])
  }

  const generate = () => {
    setWod(buildCustomWod({ discipline, equipment, minutes, format, intensity, goal, level }))
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }
  }

  const logCompleted = () => {
    if (!wod || wod.error) return
    logWorkout({
      date: new Date().toISOString(),
      sessionName: `${discipline === 'hyrox' ? 'HYROX' : 'Gymnastics'} — ${wod.title}`,
      exercises: [],
      wodMeta: { discipline, focus: wod.focus, lines: wod.lines, custom: true },
    })
    alert('נשמר בהיסטוריה!')
  }

  return (
    <div>
      {/* 1 — equipment */}
      <Card style={{ marginBottom: 10 }}>
        <FieldLabel>מה יש לך?</FieldLabel>
        <div style={{ fontSize: 12, color: t.color.textDim, marginBottom: 10, lineHeight: 1.6 }}>
          סמן הכל מה שזמין לך. בלי לסמן כלום — תקבל אימון משקל גוף מלא.
        </div>

        <div style={{ display:'flex', flexWrap:'wrap', gap: 7 }}>
          {catalog.map(e => {
            const on = e.key === 'none' || equipment.includes(e.key)
            const locked = e.key === 'none'
            return (
              <button
                key={e.key}
                onClick={() => toggleEquip(e.key)}
                disabled={locked}
                style={{
                  padding:'9px 13px', borderRadius: 999, cursor: locked ? 'default' : 'pointer',
                  fontFamily:'inherit', fontSize: 13,
                  fontWeight: on ? 700 : 500,
                  background: on ? `${t.color.wineLight}26` : t.color.bgSoft,
                  border:`1px solid ${on ? t.color.wineLight : t.color.border}`,
                  color: on ? t.color.white : t.color.textDim,
                  transition: t.transition,
                }}
              >
                {e.he}
                {e.note && (
                  <span style={{ fontSize: 10, color: t.color.textMuted, marginInlineStart: 6 }}>
                    {e.note}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div style={{
          marginTop: 12, paddingTop: 10, borderTop:`1px solid ${t.color.border}`,
          display:'flex', alignItems:'center', gap: 8, flexWrap:'wrap',
        }}>
          <Badge color={t.color.success}>{pool.length} תרגילים זמינים</Badge>
          {hints.length > 0 && (
            <span style={{ fontSize: 11, color: t.color.textMuted }}>
              {hints[0].he} יפתח עוד {hints[0].unlocks}
            </span>
          )}
        </div>
      </Card>

      {/* 2 — shape of the session */}
      <Card style={{ marginBottom: 10 }}>
        <FieldLabel>כמה זמן</FieldLabel>
        <ChipRow
          options={DURATIONS.map(d => ({ key: d.key, he: d.he }))}
          value={minutes}
          onChange={setMinutes}
          columns={5}
        />

        <div style={{ height: 14 }} />
        <FieldLabel>מבנה</FieldLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(96px, 1fr))', gap: 6 }}>
          {FORMATS.map(f => (
            <button key={f.key} onClick={() => setFormat(f.key)} style={{
              padding:'11px 6px', borderRadius: t.radius.sm, cursor:'pointer',
              fontFamily:'inherit', textAlign:'center',
              background: format === f.key ? `${t.color.wineLight}22` : t.color.bgSoft,
              border:`1px solid ${format === f.key ? t.color.wineLight : t.color.border}`,
              color: t.color.text,
            }}>
              <div style={{ fontSize: 13, fontWeight: format === f.key ? 700 : 500 }}>{f.he}</div>
              <div style={{ fontSize: 10, color: t.color.textMuted, marginTop: 2 }}>{f.note}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* 3 — what to train, and how hard */}
      <Card style={{ marginBottom: 14 }}>
        <FieldLabel>על מה לעבוד</FieldLabel>
        <ChipRow
          options={goals.map(g => ({ key: g.key, he: g.he }))}
          value={goal}
          onChange={setGoal}
          columns={3}
        />

        <div style={{ height: 14 }} />
        <FieldLabel>עצימות</FieldLabel>
        <ChipRow
          options={INTENSITIES.map(i => ({ key: i.key, he: i.he }))}
          value={intensity}
          onChange={setIntensity}
          columns={3}
        />

        <div style={{ height: 14 }} />
        <FieldLabel>רמה</FieldLabel>
        <ChipRow
          options={WOD_LEVELS.map(l => ({ key: l.key, he: l.short }))}
          value={level}
          onChange={setLevel}
          columns={4}
        />
      </Card>

      <Button
        variant="primary" size="lg" onClick={generate}
        style={{
          width:'100%', justifyContent:'center',
          background: t.color.wineLight, color: t.color.white,
          border:`1px solid ${t.color.wineLight}`,
          padding: 16, marginBottom: 16,
        }}
      >← בנה לי אימון</Button>

      {wod?.error && (
        <Card style={{ borderColor: t.color.danger, background:`${t.color.danger}10` }}>
          <div style={{ fontSize: 13, color: t.color.text, lineHeight: 1.7 }}>{wod.error}</div>
        </Card>
      )}

      {wod && !wod.error && (
        <>
          <WodDisplay wod={wod} onStart={null} onRegenerate={generate} />

          {wod.meta?.substitutions?.length > 0 && (
            <Card style={{ marginTop: 12, background: t.color.bgSoft }}>
              <FieldLabel>מה הוחלף ולמה</FieldLabel>
              <div style={{ display:'grid', gap: 6 }}>
                {wod.meta.substitutions.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, color: t.color.textDim, lineHeight: 1.6 }}>
                    <b style={{ color: t.color.text }}>{movementName(s)}</b> — מאמן את אותה יכולת כמו {s.standsFor}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div style={{ display:'flex', gap: 10, justifyContent:'flex-end', marginTop: 12 }}>
            <Button variant="ghost" onClick={generate}>אימון אחר</Button>
            <Button onClick={logCompleted}>סיימתי — שמור בהיסטוריה</Button>
          </div>
        </>
      )}
    </div>
  )
}

function FieldLabel({ children }) {
  return (
    <div style={{
      fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.22em',
      color: t.color.silver1, fontWeight: 700, textTransform:'uppercase', marginBottom: 10,
    }}>{children}</div>
  )
}

function ChipRow({ options, value, onChange, columns }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${columns}, 1fr)`, gap: 6 }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)} style={{
          padding:'11px 4px', borderRadius: t.radius.sm, cursor:'pointer',
          fontFamily:'inherit', textAlign:'center',
          background: value === o.key ? `${t.color.wineLight}22` : t.color.bgSoft,
          border:`1px solid ${value === o.key ? t.color.wineLight : t.color.border}`,
          color: t.color.text,
          fontSize: 13, fontWeight: value === o.key ? 700 : 500,
        }}>{o.he}</button>
      ))}
    </div>
  )
}
