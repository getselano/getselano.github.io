import React, { useMemo, useState } from 'react'
import { t } from '../../../theme/tokens'
import { Card } from '../../../components/ui/UI'
import { Talk } from '../talk/Talk'
import { Reminders } from '../reminders/Reminders'
import { Profile } from '../profile/Profile'
import { APP_GUIDES } from '../../../data/guides/appGuides'
import { SendMessageTab } from './SendMessageTab'
import { useAuth } from '../../../auth/AuthContext'

// מרכז בקרה — a single hub combining Guide + Profile + Reminders + Talk.
// Cleans up the sidebar (one item instead of four) and gives new members
// a proper starting point with the guide sub-tab.

const BASE_TABS = [
  { key:'guide',     he:'הסבר על המערכת' },
  { key:'profile',   he:'פרופיל' },
  { key:'reminders', he:'תזכורות' },
  { key:'talk',      he:'דברו איתנו' },
]

export function ControlCenter({ go }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const TABS = useMemo(() => (
    isAdmin ? [...BASE_TABS, { key:'send', he:'שלח הודעה' }] : BASE_TABS
  ), [isAdmin])
  const [tab, setTab] = useState('guide')
  return (
    <div style={{ display:'grid', gap: 16 }}>
      {/* Header */}
      <div style={{ padding:'4px 0 8px' }}>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.28em',
          textTransform:'uppercase', color: t.color.wineLight, fontWeight: 700,
          marginBottom: 6,
        }}>עזרה · Help center</div>
        <div style={{
          fontFamily: t.font.family.display, fontSize: 26, fontWeight: 700,
          color: t.color.white, letterSpacing:'-0.02em',
        }}>הכל במקום אחד</div>
      </div>

      {/* Tabs */}
      <div className="hfos-hscroll" style={{
        display:'flex', gap: 4, overflowX:'auto',
        borderBottom:`1px solid ${t.color.hairline}`, paddingBottom: 2,
      }}>
        {TABS.map(x => {
          const active = tab === x.key
          return (
            <button
              key={x.key}
              onClick={() => setTab(x.key)}
              style={{
                padding:'10px 16px',
                background: active ? `${t.color.wineLight}18` : 'transparent',
                border:'none',
                borderBottom: `2px solid ${active ? t.color.wineLight : 'transparent'}`,
                color: active ? t.color.white : t.color.silver1,
                cursor:'pointer', fontFamily:'inherit', fontSize: 13,
                fontWeight: active ? 700 : 500,
                whiteSpace:'nowrap',
                transition: t.transition,
              }}
            >{x.he}</button>
          )
        })}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'guide'     && <GuideSubtab go={go} />}
        {tab === 'profile'   && <Profile go={go} />}
        {tab === 'reminders' && <Reminders />}
        {tab === 'talk'      && <Talk />}
        {tab === 'send' && isAdmin && <SendMessageTab />}
      </div>
    </div>
  )
}

// ─── Guide subtab ─────────────────────────────────────────────
// Renders a card per app module with expand-to-read details + a
// "עבור למודול" button that navigates via the go(pageKey) prop.

function GuideSubtab({ go }) {
  const [expanded, setExpanded] = useState('train') // train opens by default (most complex)
  const [query, setQuery] = useState('')

  const filtered = APP_GUIDES.filter(g => {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return g.title.toLowerCase().includes(q)
        || g.subtitle.toLowerCase().includes(q)
        || g.features.some(f => f.toLowerCase().includes(q))
  })

  return (
    <div style={{ display:'grid', gap: 14 }}>
      {/* Intro */}
      <Card style={{
        padding: 20,
        background: `linear-gradient(160deg, rgba(199,64,80,0.06), ${t.color.bgElevated} 60%)`,
      }}>
        <div style={{
          fontFamily: t.font.family.display, fontSize: 18, fontWeight: 700,
          color: t.color.white, marginBottom: 6,
        }}>איך המערכת עובדת</div>
        <div style={{ fontSize: 13, color: t.color.silver1, lineHeight: 1.6 }}>
          כל מודול בפלטפורמה קיבל כאן דף הסבר עם פירוט מלא של מה שיש בפנים.
          לחיצה על כל כרטיס פותחת פירוט, ובלחיצה על "עבור למודול" תגיע ישר לשם.
        </div>
      </Card>

      {/* Search */}
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="חיפוש בהסברים... (לדוגמה: WOD, מרשמים, 1RM)"
        style={{
          padding:'12px 16px',
          background: t.color.bgSoft,
          border:`1px solid ${t.color.border}`,
          borderRadius: t.radius.md,
          color: t.color.text, fontFamily:'inherit', fontSize: 14,
          outline:'none', direction:'rtl',
        }}
      />

      {/* Cards */}
      <div style={{ display:'grid', gap: 10 }}>
        {filtered.map(guide => {
          const isOpen = expanded === guide.id
          return (
            <Card
              key={guide.id}
              style={{
                padding: 0,
                border: `1px solid ${isOpen ? t.color.wineLight : t.color.border}`,
                background: isOpen
                  ? `linear-gradient(160deg, rgba(199,64,80,0.05), ${t.color.bgCard} 70%)`
                  : t.color.bgCard,
                overflow:'hidden',
              }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : guide.id)}
                style={{
                  width:'100%', padding:'16px 18px', border:'none',
                  background:'transparent', cursor:'pointer',
                  color:'inherit', fontFamily:'inherit', textAlign:'right', direction:'rtl',
                  display:'flex', alignItems:'center', gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: t.font.family.display, fontSize: 17, fontWeight: 700,
                    color: t.color.white, marginBottom: 3,
                  }}>{guide.title}</div>
                  <div style={{ fontSize: 12, color: t.color.silver1 }}>{guide.subtitle}</div>
                </div>
                <div style={{
                  fontSize: 20, color: isOpen ? t.color.wineLight : t.color.silver3,
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition:'transform 0.2s',
                }}>›</div>
              </button>

              {isOpen && (
                <div style={{ padding:'0 18px 18px' }}>
                  {/* Optional video */}
                  {guide.videoId && (
                    <div style={{
                      position:'relative', paddingBottom:'56.25%', height: 0,
                      marginBottom: 14, borderRadius: t.radius.md, overflow:'hidden',
                      background: t.color.bgSoft,
                    }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${guide.videoId}`}
                        title={`${guide.title} — הסבר`}
                        style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {/* Features list */}
                  <ul style={{
                    listStyle:'none', padding: 0, margin:'0 0 16px',
                    display:'grid', gap: 8,
                  }}>
                    {guide.features.map((f, i) => (
                      <li key={i} style={{
                        display:'flex', gap: 10, alignItems:'flex-start',
                        padding:'8px 12px', background: t.color.bgSoft,
                        borderRadius: t.radius.sm,
                        borderInlineStart: `2px solid ${t.color.wineLight}`,
                        fontSize: 13, color: t.color.text, lineHeight: 1.55,
                      }}>
                        <span style={{ color: t.color.wineLight, fontWeight: 700, marginTop: 1 }}>›</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Jump-to button */}
                  {guide.pageKey && go && (
                    <button
                      onClick={() => go(guide.pageKey)}
                      style={{
                        padding:'10px 18px',
                        background: t.color.wineLight, color: t.color.white,
                        border:`1px solid ${t.color.wineLight}`,
                        borderRadius: t.radius.md, cursor:'pointer',
                        fontFamily:'inherit', fontSize: 13, fontWeight: 700,
                      }}
                    >עבור למודול "{guide.title}" ←</button>
                  )}
                </div>
              )}
            </Card>
          )
        })}
        {filtered.length === 0 && (
          <div style={{
            padding: 30, textAlign:'center',
            color: t.color.silver2, fontSize: 13,
          }}>לא נמצא הסבר תואם — נסה חיפוש אחר</div>
        )}
      </div>
    </div>
  )
}
