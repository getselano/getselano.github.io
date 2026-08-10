import React, { useState } from 'react'
import { t } from '../../../../theme/tokens'
import { Card, Button, Badge } from '../../../../components/ui/UI'
import { FORMATS } from '../../../../data/crossfit/formats'

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
     the professional (English) term paired with the mother-tongue label. */}
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
   }}>Movements · תרגילים</div>
   <div style={{ display: 'grid', gap: 6 }}>
     {wod.movements.map(m => (
       <div key={m.id} style={{
         display: 'flex', alignItems: 'baseline', gap: 10,
         padding: '6px 8px', borderRadius: 6,
         background: t.color.bg,
       }}>
         <div style={{
           fontFamily: 'Space Mono, ui-monospace, monospace',
           fontSize: 14, fontWeight: 700, color: t.color.gold,
           letterSpacing: '-0.005em',
         }}>{m.en || m.he}</div>
         <div style={{
           fontSize: 11, color: t.color.silver2,
           direction: 'rtl',
         }}>· {m.he}</div>
       </div>
     ))}
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
