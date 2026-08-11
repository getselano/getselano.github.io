import React, { useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Card, Button, Badge } from '../../../../components/ui/UI'
import { FORMATS } from '../../../../data/crossfit/formats'
import { getSubs } from '../../../../data/crossfit/substitutions'

// WOD Display — the monospace "written prescription"panel, wod-gpt style.
// Includes copy-to-clipboard and video-tips expander.
export function WodDisplay({ wod, onStart, onRegenerate, onShowVideos }) {
 const [copied, setCopied] = useState(false)

 if (wod?.error) {
 return (
 <Card style={{ borderColor: t.color.danger, textAlign:'center'}}>
 <div style={{ fontSize: 40, marginBottom: 8 }}> </div>
 <div style={{ color: t.color.danger, fontWeight: 700 }}>{wod.error}</div>
 </Card>
 )
 }

 if (!wod?.lines?.length) return null

 const fmt = FORMATS[wod.format] || FORMATS.amrap

 async function copyText() {
 const text = wod.lines.join('\n')
 try {
 await navigator.clipboard.writeText(text)
 setCopied(true)
 setTimeout(() => setCopied(false), 2000)
 } catch {}
 }

 return (
 <Card glow style={{ borderColor: t.color.gold }}>
 <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: t.space.md }}>
 <span style={{ fontSize: 22 }}>{fmt.icon}</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color: t.color.gold }}>{wod.title}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{fmt.description}</div>
 </div>
 <Badge color={t.color.gold}>{fmt.he}</Badge>
 </div>

 <pre style={{
 background: t.color.bg, border: `1px solid ${t.color.border}`,
 borderRadius: t.radius.sm, padding: t.space.lg,
 fontFamily:'Space Mono, ui-monospace, monospace',
 fontSize: t.font.md, color: t.color.text, lineHeight: 1.7,
 // Prescription lines are English-first — render LTR so text stays aligned
 whiteSpace:'pre-wrap', direction:'ltr', textAlign:'left',
 margin: 0, overflowX:'auto',
 }}>
 {wod.lines.join('\n')}
 </pre>

 {/* Hebrew translations panel — English movement primary + Hebrew secondary.
     Applies whether the UI is in Hebrew or English so trainees always see
     the professional (English) term paired with the mother-tongue label.
     Now expandable per-row: shows scale/substitute suggestions on click. */}
 {wod.movements?.length > 0 && (
 <div style={{
   marginTop: t.space.md,
   background: t.color.bgSoft,
   border: `1px solid ${t.color.border}`,
   borderRadius: t.radius.sm,
   padding: t.space.md,
 }}>
   <div style={{
     fontFamily: t.font.family.mono, fontSize: 9, letterSpacing: '0.24em',
     textTransform: 'uppercase', color: t.color.silver3, fontWeight: 700,
     marginBottom: 8,
   }}>Movements · תרגילים · לחץ להחלפה / סקייל</div>
   <div style={{ display: 'grid', gap: 6 }}>
     {wod.movements.map(m => <MovementRow key={m.id} movement={m} />)}
   </div>
 </div>
 )}

 <div style={{ display:'flex', gap: 8, marginTop: t.space.lg, flexWrap:'wrap'}}>
 <Button variant="primary"size="lg"onClick={onStart} style={{ flex: 1, minWidth: 140, justifyContent:'center'}}>
 ▶ התחל את ה-WOD
 </Button>
 <Button variant="ghost"onClick={onRegenerate}> מחולל חדש</Button>
 <Button variant="ghost"onClick={copyText}>
 {copied ? ' הועתק':' העתק'}
 </Button>
 {onShowVideos && (
 <Button variant="ghost" onClick={onShowVideos}> דגשי ביצוע</Button>
 )}
 </div>
 </Card>
 )
}

// Per-movement row that expands to show scale/substitute options.
// Non-expandable when no subs exist for the movement.
function MovementRow({ movement }) {
  const [open, setOpen] = useState(false)
  const subs = getSubs(movement.id)
  const hasSubs = subs.length > 0

  return (
    <div style={{
      background: t.color.bg, borderRadius: 6,
      border: open ? `1px solid ${t.color.gold}55` : `1px solid transparent`,
      transition: t.transition,
    }}>
      <button
        onClick={() => hasSubs && setOpen(v => !v)}
        disabled={!hasSubs}
        style={{
          display:'flex', alignItems:'baseline', gap: 10,
          width:'100%', padding:'8px 10px',
          background:'transparent', border:'none',
          cursor: hasSubs ? 'pointer' : 'default',
          color:'inherit', fontFamily:'inherit', textAlign:'right',
        }}
      >
        <div style={{
          fontFamily:'Space Mono, ui-monospace, monospace',
          fontSize: 14, fontWeight: 700, color: t.color.gold,
          letterSpacing:'-0.005em',
        }}>{movement.en || movement.he}</div>
        <div style={{ fontSize: 11, color: t.color.silver2, direction:'rtl' }}>· {movement.he}</div>
        {hasSubs && (
          <div style={{
            marginInlineStart:'auto', fontSize: 10,
            color: t.color.silver3, fontFamily: t.font.family.mono,
            letterSpacing:'0.14em', textTransform:'uppercase',
          }}>{open ? 'סגור ↑' : `סקייל · ${subs.length}`}</div>
        )}
      </button>

      {open && hasSubs && (
        <div style={{
          padding:'10px 12px 12px',
          borderTop: `1px solid ${t.color.hairline}`,
          display:'grid', gap: 8,
        }}>
          {subs.map((sub, i) => (
            <div key={i} style={{
              display:'grid', gap: 4,
              padding:'8px 10px', borderRadius: 6,
              background: t.color.bgSoft,
              direction:'rtl',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8, flexWrap:'wrap' }}>
                <span style={{
                  fontFamily:'Space Mono, ui-monospace, monospace',
                  fontSize: 13, fontWeight: 700, color: t.color.text,
                  direction:'ltr',
                }}>{sub.movement.en || sub.movement.he}</span>
                <span style={{ fontSize: 11, color: t.color.silver2 }}>· {sub.movement.he}</span>
                <span style={{
                  marginInlineStart:'auto',
                  fontSize: 9, fontWeight: 700, letterSpacing:'0.1em',
                  textTransform:'uppercase', color: sub.reasonColor,
                  padding:'2px 8px', borderRadius: 999,
                  background: `${sub.reasonColor}18`,
                  border: `1px solid ${sub.reasonColor}44`,
                }}>{sub.reasonLabel}</span>
              </div>
              {sub.note && (
                <div style={{ fontSize: 11, color: t.color.silver1, lineHeight: 1.5 }}>
                  {sub.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
