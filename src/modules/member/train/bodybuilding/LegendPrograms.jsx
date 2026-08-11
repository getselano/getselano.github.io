import React, { useMemo, useState, useEffect } from 'react'
import { t } from '../../../../theme/tokens'
import { Card, Button, Badge, Modal } from '../../../../components/ui/UI'
import { useApp } from '../../../../store/AppStore'
import { useI18n } from '../../../../i18n/i18n'
import {
  LEGEND_PROGRAMS, LEGEND_TAGS, LEGEND_LEVELS, LEGEND_GENDERS, NEXT_UPDATE_TARGET,
} from '../../../../data/bodybuilding/legendPrograms'
import { ExerciseGuideButton } from '../../../../components/train/ExerciseGuidePopover'

// Browse curated bodybuilder programs, view detail, adopt one as a
// personal routine (materialized into the user's saved routines so
// they can run it from the RoutineRunner like any other routine).

const LEVEL_LABELS = {
  beginner:     'מתחיל',
  intermediate: 'בינוני',
  advanced:     'מתקדם',
  expert:       'אקספרט',
}

export function LegendPrograms() {
  const { isRTL } = useI18n()
  const { state } = useApp()
  // Default the gender tab from the user's profile so a woman opens
  // straight to the women's library, a man to the men's. Falls back
  // to 'male' when sex is missing (existing library default).
  const defaultGender = state?.profile?.sex === 'female' ? 'female' : 'male'
  const [genderFilter, setGenderFilter] = useState(defaultGender)
  const [levelFilter, setLevelFilter] = useState(null)
  const [tagFilter, setTagFilter] = useState(null)
  const [selected, setSelected] = useState(null)

  // Tags available to filter — narrow to tags that exist inside the
  // active gender's programs, so the woman's tag pills don't include
  // "HIT" (a men-only tag) etc.
  const genderPrograms = useMemo(
    () => LEGEND_PROGRAMS.filter(p => (p.gender || 'male') === genderFilter),
    [genderFilter],
  )
  const genderTags = useMemo(
    () => [...new Set(genderPrograms.flatMap(p => p.tags))].sort(),
    [genderPrograms],
  )

  // Reset the tag filter when gender changes if the chosen tag doesn't
  // exist on the other side (otherwise the grid would show nothing).
  useEffect(() => {
    if (tagFilter && !genderTags.includes(tagFilter)) setTagFilter(null)
  }, [genderTags, tagFilter])

  const filtered = useMemo(() => {
    let out = [...genderPrograms]
    if (levelFilter) out = out.filter(p => p.level === levelFilter)
    if (tagFilter) out = out.filter(p => p.tags.includes(tagFilter))
    // Newest first
    out.sort((a, b) => (b.addedOn || '').localeCompare(a.addedOn || ''))
    return out
  }, [genderPrograms, levelFilter, tagFilter])

  const nextDate = new Date(NEXT_UPDATE_TARGET)
  const daysUntilNext = Math.max(0, Math.ceil((nextDate - new Date()) / (24 * 3600 * 1000)))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Header */}
      <Card style={{
        padding: 20,
        background: `linear-gradient(160deg, rgba(199,64,80,0.09) 0%, ${t.color.bgElevated} 60%)`,
        border: `1px solid rgba(199,64,80,0.35)`,
      }}>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: t.color.wineLight, fontWeight: 700,
          marginBottom: 8,
        }}>
          {isRTL ? 'תכניות של אלופים' : 'Champion programs'}
        </div>
        <h2 style={{
          fontFamily: t.font.family.display,
          fontSize: 28, fontWeight: 800, letterSpacing: '-0.015em',
          lineHeight: 1.15, marginBottom: 8,
        }}>
          {isRTL ? 'האימונים של הבודיבילדרים הגדולים בהיסטוריה' : 'The training of history\'s greatest bodybuilders'}
        </h2>
        <div style={{ color: t.color.silver1, fontSize: 13, lineHeight: 1.55, maxWidth: 620 }}>
          {isRTL
            ? 'תכניות אמיתיות מ־Arnold, Dorian Yates, Ronnie Coleman, Cbum ועוד — משוחזרות ממקורות פומביים (ראיונות, ספרים, סרטים). לחץ על תכנית לצפייה ולאימוץ כ־Routine אישי.'
            : 'Real programs from Arnold, Dorian Yates, Ronnie Coleman, Cbum and more — reconstructed from public sources (interviews, books, films). Tap to view and adopt as a personal routine.'}
        </div>
        <div style={{
          marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
          fontSize: 11, color: t.color.silver2,
          fontFamily: t.font.family.mono, letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
          <span>{LEGEND_PROGRAMS.length} תכניות בסך הכל</span>
          <span>·</span>
          <span>עדכון הבא בעוד {daysUntilNext} ימים</span>
        </div>
      </Card>

      {/* Gender toggle — Men / Women with Mars / Venus symbols */}
      <GenderToggle
        value={genderFilter}
        onChange={setGenderFilter}
        counts={{
          male: LEGEND_PROGRAMS.filter(p => (p.gender || 'male') === 'male').length,
          female: LEGEND_PROGRAMS.filter(p => p.gender === 'female').length,
        }}
      />

      {/* Filters */}
      <Card style={{ padding: 14 }}>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: t.color.silver2, fontWeight: 600,
          marginBottom: 10,
        }}>סינון</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <FilterPill on={!levelFilter} onClick={() => setLevelFilter(null)}>כל הרמות</FilterPill>
          {LEGEND_LEVELS.map(l => (
            <FilterPill key={l} on={levelFilter === l} onClick={() => setLevelFilter(l)}>{LEVEL_LABELS[l]}</FilterPill>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <FilterPill on={!tagFilter} onClick={() => setTagFilter(null)}>כל התגים</FilterPill>
          {genderTags.map(tg => (
            <FilterPill key={tg} on={tagFilter === tg} onClick={() => setTagFilter(tg)}>{tg}</FilterPill>
          ))}
        </div>
      </Card>

      {/* Program cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12,
      }}>
        {filtered.map(p => (
          <ProgramCard key={p.id} program={p} onOpen={() => setSelected(p)} />
        ))}
        {filtered.length === 0 && (
          <div style={{
            gridColumn: '1/-1', padding: 30, textAlign: 'center',
            color: t.color.silver1, fontSize: 13,
          }}>
            לא נמצאו תכניות עם הסינון הזה. נסה סינון אחר.
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <ProgramDetail
          program={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function ProgramCard({ program: p, onOpen }) {
  const accent = p.accent || t.color.wineLight
  return (
    <button onClick={onOpen} style={{
      textAlign: 'right', padding: 0,
      background: `linear-gradient(160deg, ${accent}12 0%, ${t.color.bgElevated} 55%)`,
      border: `1px solid ${accent}55`,
      borderRadius: t.radius.lg, overflow: 'hidden',
      cursor: 'pointer', fontFamily: 'inherit', color: t.color.text,
      transition: t.transition,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = `${accent}55`}
    >
      <div style={{
        padding: 16, borderBottom: `1px solid ${t.color.hairline}`,
      }}>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 9, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: accent, fontWeight: 700, marginBottom: 6,
        }}>{p.athlete}</div>
        <div style={{
          fontFamily: t.font.family.display,
          fontSize: 22, fontWeight: 800, letterSpacing: '-0.015em',
          lineHeight: 1.15, color: t.color.ink,
        }}>{p.name}</div>
        <div style={{ fontSize: 11, color: t.color.silver2, marginTop: 4 }}>{p.era}</div>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{
          fontSize: 12.5, color: t.color.bone, lineHeight: 1.5,
          minHeight: 60,
        }}>{p.philosophy}</div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12,
        }}>
          <span style={pillTag(accent)}>{LEVEL_LABELS[p.level]}</span>
          <span style={pillTag()}>{p.split}</span>
          {p.tags.slice(0, 2).map(tg => (
            <span key={tg} style={pillTag()}>{tg}</span>
          ))}
        </div>
      </div>
    </button>
  )
}

const pillTag = (color) => ({
  fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.06em',
  padding: '3px 8px', borderRadius: 3,
  color: color || t.color.silver1,
  background: color ? `${color}18` : 'transparent',
  border: `1px solid ${color || t.color.border}`,
})

// Mars / Venus segmented toggle at the top of the legends browser.
// Two large tabs, each with an SVG glyph so the choice is unmistakable
// from any distance. Active tab picks up a distinct accent color per
// gender (wine for Men — matches the male legends palette, rose for
// Women — matches the female programs palette).
function GenderToggle({ value, onChange, counts }) {
  const TABS = [
    {
      key: 'male',
      label: 'Men',
      accent: '#a52a3a',
      count: counts.male,
      glyph: (
        // Mars — circle + arrow (♂)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="14" r="6"/>
          <line x1="14.5" y1="9.5" x2="20" y2="4"/>
          <polyline points="14,4 20,4 20,10"/>
        </svg>
      ),
    },
    {
      key: 'female',
      label: 'Women',
      accent: '#c4407c',
      count: counts.female,
      glyph: (
        // Venus — circle + cross (♀)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="9" r="6"/>
          <line x1="12" y1="15" x2="12" y2="22"/>
          <line x1="9" y1="19" x2="15" y2="19"/>
        </svg>
      ),
    },
  ]
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      padding: 6,
      background: t.color.bgSoft,
      border: `1px solid ${t.color.border}`,
      borderRadius: t.radius.lg,
    }}>
      {TABS.map(tab => {
        const on = value === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            aria-pressed={on}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '14px 12px',
              background: on ? `${tab.accent}22` : 'transparent',
              border: `1.5px solid ${on ? tab.accent : 'transparent'}`,
              color: on ? tab.accent : t.color.silver1,
              borderRadius: t.radius.md, cursor: 'pointer', fontFamily: 'inherit',
              fontWeight: 800, fontSize: 15, letterSpacing: '0.02em',
              boxShadow: on ? `0 0 12px ${tab.accent}44` : 'none',
              transition: t.transition,
            }}
          >
            {tab.glyph}
            <span>{tab.label}</span>
            <span style={{
              fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.16em',
              padding: '2px 8px', borderRadius: 999,
              background: on ? `${tab.accent}33` : 'rgba(255,255,255,0.06)',
              color: on ? tab.accent : t.color.silver2,
              fontWeight: 700,
            }}>{tab.count}</span>
          </button>
        )
      })}
    </div>
  )
}

function FilterPill({ on, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 11px',
      background: on ? t.color.wineLight : 'transparent',
      border: `1px solid ${on ? t.color.wineLight : t.color.border}`,
      color: on ? t.color.white : t.color.silver1,
      borderRadius: t.radius.pill, cursor: 'pointer', fontFamily: 'inherit',
      fontSize: 11, fontWeight: 600, transition: t.transition,
    }}>{children}</button>
  )
}

// ─── Detail modal — the whole plan + adopt button ─────────────
function ProgramDetail({ program: p, onClose }) {
  const { bbSaveRoutine } = useApp()
  const accent = p.accent || t.color.wineLight
  const [adopted, setAdopted] = useState(false)

  const adopt = () => {
    // Materialize each session as a separate saved Routine so the user
    // can run each one from the RoutineRunner independently.
    p.sessions.forEach((session, i) => {
      const routine = {
        id: `legend_${p.id}_${i}_${Date.now()}`,
        name: `${p.name} — ${session.name}`,
        emoji: '',
        createdBy: 'legend',
        legendId: p.id,
        exercises: session.exercises.map(ex => ({
          exerciseId: null, // free-text; RoutineRunner falls back to name
          exerciseName: ex.name,
          equipment: 'none',
          notes: ex.note || '',
          restSeconds: ex.rest || 90,
          supersetGroup: null,
          sets: buildSetsFor(ex),
        })),
      }
      bbSaveRoutine(routine)
    })
    setAdopted(true)
    setTimeout(() => { setAdopted(false); onClose() }, 1600)
  }

  return (
    <Modal open onClose={onClose} title={p.name} width={720}>
      <div style={{ display: 'grid', gap: 18 }}>
        {/* Header block */}
        <div style={{
          padding: 16,
          background: `linear-gradient(160deg, ${accent}14 0%, transparent 100%)`,
          border: `1px solid ${accent}44`,
          borderRadius: t.radius.md,
        }}>
          <div style={{
            fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: accent, fontWeight: 700,
          }}>{p.athlete} · {p.era}</div>
          <div style={{
            fontSize: 13, color: t.color.bone, lineHeight: 1.6, marginTop: 8,
          }}>{p.philosophy}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <MetaItem label="פיצול" value={p.split} />
            <MetaItem label="תדירות" value={`${p.frequency}× בשבוע`} />
            <MetaItem label="משך אימון" value={p.duration} />
            <MetaItem label="רמה" value={LEVEL_LABELS[p.level]} />
          </div>
        </div>

        {/* Weekly plan */}
        <div>
          <SectionLabel>שבוע לדוגמה</SectionLabel>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 8,
          }}>
            {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day, i) => {
              const item = p.weeklyPlan[i]
              const isRest = item === 'מנוחה'
              return (
                <div key={i} style={{
                  padding: '8px 6px', textAlign: 'center',
                  background: isRest ? t.color.bgSoft : `${accent}18`,
                  border: `1px solid ${isRest ? t.color.border : `${accent}55`}`,
                  borderRadius: t.radius.sm,
                }}>
                  <div style={{
                    fontFamily: t.font.family.mono, fontSize: 9, letterSpacing: '0.2em',
                    color: t.color.silver2, marginBottom: 4,
                  }}>{day}</div>
                  <div style={{
                    fontSize: 10, color: isRest ? t.color.silver2 : t.color.ink,
                    fontWeight: isRest ? 400 : 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{isRest ? '·' : item}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sessions */}
        <div>
          <SectionLabel>אימונים ({p.sessions.length})</SectionLabel>
          <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
            {p.sessions.map((s, i) => (
              <SessionCard key={i} session={s} accent={accent} />
            ))}
          </div>
        </div>

        {/* Attribution / sources */}
        <div style={{
          padding: 14, borderRadius: t.radius.sm,
          background: t.color.bgSoft, border: `1px solid ${t.color.border}`,
          fontSize: 12, color: t.color.silver1, lineHeight: 1.6,
        }}>
          <div style={{ color: t.color.wineLight, fontWeight: 700, marginBottom: 6 }}>מקור:</div>
          {p.attribution}
          {p.sources?.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: t.color.silver2 }}>
              מבוסס על: {p.sources.join(' · ')}
            </div>
          )}
        </div>

        {/* Adopt button */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={onClose}>סגור</Button>
          <Button
            variant="primary"
            onClick={adopt}
            disabled={adopted}
            style={{ background: adopted ? '#4a9c6a' : undefined }}
          >
            {adopted
              ? 'אומץ ל־Routines שלי'
              : `אמץ ל־${p.sessions.length} Routines חדשים`}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function SessionCard({ session, accent }) {
  return (
    <Card style={{ padding: 14 }}>
      <div style={{
        fontFamily: t.font.family.display,
        fontSize: 18, fontWeight: 700, color: accent,
        letterSpacing: '-0.005em', marginBottom: 10,
      }}>{session.name}</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {session.exercises.map((ex, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 8,
            padding: '10px 12px',
            background: t.color.bgSoft, borderRadius: t.radius.sm,
            alignItems: 'center',
          }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: t.color.ink, marginBottom: 4 }}>
                {ex.name}
              </div>
              {ex.note && (
                <div style={{ fontSize: 10, color: t.color.silver2, marginBottom: 6, fontStyle: 'italic' }}>
                  {ex.note}
                </div>
              )}
              <ExerciseGuideButton exerciseName={ex.name} compact />
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: 11, color: accent,
              whiteSpace: 'nowrap', fontWeight: 600, alignSelf: 'flex-start',
            }}>
              {ex.sets}×{ex.reps}
              {ex.rest && <span style={{ color: t.color.silver2, marginInlineStart: 6 }}>· {ex.rest}ש׳</span>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function MetaItem({ label, value }) {
  return (
    <div>
      <div style={{
        fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em',
        textTransform: 'uppercase', color: t.color.silver2,
      }}>{label}</div>
      <div style={{ fontSize: 13, color: t.color.ink, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.28em',
      textTransform: 'uppercase', color: t.color.wineLight, fontWeight: 700,
    }}>{children}</div>
  )
}

// Build a `sets` array for a legend exercise entry — the legend format
// is a compact one-line "{sets}×{reps}" rather than the routine format
// (array of {type, weight, reps}). Convert on adoption.
function buildSetsFor(ex) {
  const count = Number.isFinite(+ex.sets) ? +ex.sets : 3
  // Parse reps that may be "8-12" | "10" | "10,8,6" | "למקסימום"
  const reps = ex.reps
  const perSet = []
  if (typeof reps === 'string' && reps.includes(',')) {
    reps.split(',').forEach(r => perSet.push(parseRepsToNum(r.trim())))
  } else {
    for (let i = 0; i < count; i++) perSet.push(parseRepsToNum(reps))
  }
  // If provided reps schedule length is shorter than count, pad
  while (perSet.length < count) perSet.push(perSet[perSet.length - 1] || 0)
  return perSet.slice(0, Math.max(count, perSet.length)).map((r, i) => ({
    type: (ex.warmup && i < ex.warmup) ? 'warmup' : 'working',
    weight: 0,
    reps: r,
  }))
}

function parseRepsToNum(v) {
  if (typeof v === 'number') return v
  if (typeof v !== 'string') return 0
  // "8-12" → 10 (midpoint), "8-10" → 9
  const range = v.match(/(\d+)\s*-\s*(\d+)/)
  if (range) return Math.round((+range[1] + +range[2]) / 2)
  const num = v.match(/\d+/)
  if (num) return +num[0]
  return 0
}
