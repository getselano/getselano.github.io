import React, { useState } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Card, Button, Input, Select, Badge, SectionHeader, Tabs } from '../../../components/ui/UI'
import { activityFactors, goalAdjustments, dietTemplates } from '../../../utils/calc'
import { KEY_LIFTS } from '../../../data/programs'
import { useI18n } from '../../../i18n/i18n'
import { ProgressPhotosCard } from './ProgressPhotosCard'
import { LegalCenter } from '../../../components/legal/LegalCenter'
import { useAuth as useAuthLite } from '../../../auth/AuthContext'

export function Profile({ go }) {
 const { state, updateProfile, setWearable, set1RM, reset } = useApp()
 const { isRTL } = useI18n()
 const [tab, setTab] = useState('info')
 const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | ok | err
 const p = state.profile
 const set = (patch) => updateProfile(patch)
 // Explicit save button — the app already persists live on every field
 // change (updateProfile writes to local state + Supabase upsert), but
 // trainees want a clear "saved" confirmation so they know the data is
 // committed. Button forces a re-upsert of the current profile snapshot.
 const handleSave = async () => {
   setSaveStatus('saving')
   try {
     await updateProfile({
       name: p.name, age: p.age, sex: p.sex,
       heightCm: p.heightCm, weightKg: p.weightKg,
       activity: p.activity, goalKey: p.goalKey, dietKey: p.dietKey,
       experience: p.experience, constraints: p.constraints,
     })
     setSaveStatus('ok')
   } catch {
     setSaveStatus('err')
   }
   setTimeout(() => setSaveStatus('idle'), 2500)
 }

 return (
 <>
 <Tabs tabs={[
 { key:'info', label: isRTL ? 'פרטים' : 'Details'},
 { key:'photos', label: isRTL ? 'תמונות התקדמות' : 'Progress photos'},
 { key:'strength', label: isRTL ? 'יכולת מירבית (1RM)' : 'Max strength (1RM)'},
 { key:'integrations', label: isRTL ? 'אינטגרציות' : 'Integrations'},
 { key:'settings', label: isRTL ? 'הגדרות' : 'Settings'},
 ]} active={tab} onChange={setTab} />

 {tab === 'photos' && <ProgressPhotosCard go={go} />}

 {tab === 'strength'&& <StrengthTab oneRMs={p.oneRMs || {}} set1RM={set1RM} personalRecords={state.personalRecords} />}

 {tab === 'info'&& (
 <div style={{ display:'grid', gap: 16 }}>
 <InviteFriendsCard />
 <Card>
 <SectionHeader title={isRTL ? 'פרטים אישיים' : 'Personal details'} />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
 <Input label={isRTL ? 'שם' : 'Name'} value={p.name} onChange={e => set({ name: e.target.value })} />
 <Input type="number" label={isRTL ? 'גיל' : 'Age'} value={p.age} onChange={e => set({ age: +e.target.value })} />
 <Select label={isRTL ? 'מין' : 'Sex'} value={p.sex} onChange={e => set({ sex: e.target.value })}>
 <option value="male">{isRTL ? 'גבר' : 'Male'}</option><option value="female">{isRTL ? 'אישה' : 'Female'}</option>
 </Select>
 <Input type="number" label={isRTL ? 'גובה (ס״מ)' : 'Height (cm)'} value={p.heightCm} onChange={e => set({ heightCm: +e.target.value })} />
 <Input type="number" label={isRTL ? 'משקל (ק״ג)' : 'Weight (kg)'} value={p.weightKg} onChange={e => set({ weightKg: +e.target.value })} />
 <Select label={isRTL ? 'רמת פעילות' : 'Activity level'} value={p.activity} onChange={e => set({ activity: e.target.value })}>
 {Object.entries(activityFactors).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
 </Select>
 <Select label={isRTL ? 'מטרה' : 'Goal'} value={p.goalKey} onChange={e => set({ goalKey: e.target.value })}>
 {Object.entries(goalAdjustments).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
 </Select>
 <Select label={isRTL ? 'תזונה' : 'Diet'} value={p.dietKey} onChange={e => set({ dietKey: e.target.value })}>
 {Object.entries(dietTemplates).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
 </Select>
 <Select label={isRTL ? 'ניסיון' : 'Experience'} value={p.experience} onChange={e => set({ experience: e.target.value })}>
 <option value="מתחיל">{isRTL ? 'מתחיל' : 'Beginner'}</option><option value="בינוני">{isRTL ? 'בינוני' : 'Intermediate'}</option><option value="מתקדם">{isRTL ? 'מתקדם' : 'Advanced'}</option>
 </Select>
 </div>
 <div style={{ marginTop: 14 }}>
 <Input label={isRTL ? 'הגבלות/פציעות' : 'Restrictions/injuries'} value={p.constraints} onChange={e => set({ constraints: e.target.value })} />
 </div>

 {/* Explicit save — reassurance for users who don't trust auto-save. */}
 <div style={{
   marginTop: 18, paddingTop: 14,
   borderTop: `1px solid ${t.color.hairline}`,
   display:'flex', gap: 10, alignItems:'center', flexWrap:'wrap',
 }}>
   <Button
     variant="primary" size="lg"
     onClick={handleSave}
     disabled={saveStatus === 'saving'}
     style={{ minWidth: 180, justifyContent:'center' }}
   >
     {saveStatus === 'saving'
       ? (isRTL ? 'שומר…' : 'Saving…')
       : (isRTL ? 'שמור פרטים' : 'Save details')}
   </Button>
   {saveStatus === 'ok' && (
     <span style={{
       padding:'8px 14px', borderRadius: t.radius.sm,
       background: `${t.color.success}18`, color: t.color.success,
       border: `1px solid ${t.color.success}44`,
       fontSize: 13, fontWeight: 700,
     }}>{isRTL ? 'נשמר בהצלחה' : 'Saved successfully'}</span>
   )}
   {saveStatus === 'err' && (
     <span style={{
       padding:'8px 14px', borderRadius: t.radius.sm,
       background: `${t.color.danger}18`, color: t.color.danger,
       border: `1px solid ${t.color.danger}44`,
       fontSize: 13,
     }}>{isRTL ? 'שמירה נכשלה, נסה שוב' : 'Save failed, try again'}</span>
   )}
   <span style={{
     fontSize: 11, color: t.color.textMuted,
     marginInlineStart:'auto', maxWidth: 260, textAlign:'end',
   }}>
     {isRTL
       ? 'שינויים נשמרים גם אוטומטית עם כל עדכון שדה.'
       : 'Changes are auto-saved as you edit each field too.'}
   </span>
 </div>
 </Card>
 </div>
 )}

 {tab === 'integrations'&& (
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
 {[
 { name:'Apple Health', icon:'', desc: isRTL ? 'סנכרון צעדים, שינה, HR' : 'Sync steps, sleep, HR'},
 { name:'Google Fit', icon:'', desc: isRTL ? 'סנכרון פעילות ושינה' : 'Sync activity and sleep'},
 { name:'Garmin', icon:'⌚', desc: isRTL ? 'HRV, שינה, אימונים' : 'HRV, sleep, workouts'},
 { name:'Whoop', icon:'', desc:'Recovery, Strain'},
 { name:'Oura Ring', icon:'', desc: isRTL ? 'שינה, HRV, טמפרטורה' : 'Sleep, HRV, temperature'},
 { name:'MyFitnessPal',icon:'', desc: isRTL ? 'ייבוא יומן אכילה' : 'Import food log'},
 ].map(g => (
 <Card key={g.name} hover style={{ padding: 18 }}>
 <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 10 }}>
 <span style={{ fontSize: 24 }}>{g.icon}</span>
 <div style={{ fontWeight: 700 }}>{g.name}</div>
 </div>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 14, minHeight: 40 }}>{g.desc}</div>
 <Button variant="outline"size="sm"onClick={() => setWearable({ source: g.name, sleepHours: 7.2, hrv: 62, steps: 8420, restingHR: 58, syncedAt: new Date().toISOString() })}>
 {isRTL ? 'חבר (Mock)' : 'Connect (Mock)'}
 </Button>
 </Card>
 ))}
 </div>
 )}

 {tab === 'settings'&& (
 <div style={{ display:'grid', gap: 16 }}>
 <Card>
 <SectionHeader title={isRTL ? 'נתונים' : 'Data'} />
 <div style={{ display:'flex', gap: 10, flexWrap:'wrap'}}>
 <Button variant="ghost"onClick={() => { const s = JSON.stringify(state, null, 2); navigator.clipboard?.writeText(s); alert(isRTL ? 'הועתק ללוח (JSON)' : 'Copied to clipboard (JSON)') }}>{isRTL ? 'ייצא נתונים' : 'Export data'}</Button>
 <Button variant="danger"onClick={() => { if (confirm(isRTL ? 'לאפס את כל הנתונים?' : 'Reset all data?')) reset() }}>{isRTL ? 'אפס הכל' : 'Reset all'}</Button>
 </div>
 </Card>
 <Card>
 <LegalCenter />
 </Card>
 <Card>
 <SectionHeader title={isRTL ? 'גרסה' : 'Version'} />
 <div style={{ color: t.color.textDim, fontSize: t.font.sm }}>Selano · v0.1</div>
 </Card>
 </div>
 )}
 </>
 )
}

function StrengthTab({ oneRMs, set1RM, personalRecords }) {
 const { isRTL } = useI18n()
 // Auto-estimate from PRs (Epley: 1RM = w * (1 + r/30))
 const estimateFrom = (liftName) => {
 const prs = personalRecords.filter(pr => pr.exercise?.includes(liftName))
 if (!prs.length) return null
 return Math.round(Math.max(...prs.map(pr => pr.weight * (1 + pr.reps/30))))
 }
 const suggestions = {
 squat: estimateFrom('סקוואט'),
 bench: estimateFrom('לחיצת חזה'),
 deadlift: estimateFrom('דדליפט'),
 ohp: estimateFrom('כתפ'),
 }

 return (
 <div style={{ display:'grid', gap: 16 }}>
 <Card>
 <SectionHeader
 title={isRTL ? 'יכולת מירבית (1RM)' : 'Max strength (1RM)'}
 subtitle={isRTL ? 'חשוב לחישוב אחוזים אמיתיים בתכניות אימון. הזן ערכים ידניים או השתמש בהערכה מ-PRs שלך.' : 'Needed for accurate % calculations in training plans. Enter values manually or use the estimate from your PRs.'}
 />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
 {Object.values(KEY_LIFTS).map(lift => {
 const val = oneRMs[lift.key] || ''
 const suggested = suggestions[lift.key]
 return (
 <Card key={lift.key} style={{ padding: 16, background: t.color.bgSoft }}>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 8 }}>{lift.label}</div>
 <div style={{ display:'flex', gap: 8, alignItems:'end'}}>
 <Input type="number" placeholder={isRTL ? 'ק״ג' : 'kg'} value={val} onChange={e => set1RM(lift.key, e.target.value)} />
 <span style={{ color: t.color.textMuted, fontSize: t.font.xs, alignSelf:'center'}}>{isRTL ? 'ק״ג' : 'kg'}</span>
 </div>
 {suggested && (
 <div style={{ marginTop: 8, display:'flex', gap: 8, alignItems:'center'}}>
 <span style={{ fontSize: t.font.xs, color: t.color.textDim }}>{isRTL ? 'הערכה מ-PRs' : 'Estimate from PRs'}: {suggested} {isRTL ? 'ק״ג' : 'kg'}</span>
 {suggested !== +val && <button onClick={() => set1RM(lift.key, suggested)} style={{
 background:'none', border:'none', color: t.color.gold, cursor:'pointer', fontSize: t.font.xs, textDecoration:'underline', fontFamily:'inherit',
 }}>{isRTL ? 'קבל' : 'Accept'}</button>}
 </div>
 )}
 </Card>
 )
 })}
 </div>
 <div style={{ marginTop: 16, padding: 14, background: t.color.bgSoft, borderRadius: t.radius.md, fontSize: t.font.sm, color: t.color.textDim, lineHeight: 1.6 }}>
 <b style={{ color: t.color.gold }}>{isRTL ? 'איך לקבוע 1RM?' : 'How to set your 1RM?'}</b> {isRTL ? 'עלייה הדרגתית לניסיון אמת, או שימוש בחישוב Epley:' : 'Ramp up gradually to a real attempt, or use the Epley formula:'} <code style={{ background: t.color.bg, padding:'2px 6px', borderRadius: 4 }}>{isRTL ? '1RM = משקל × (1 + חזרות/30)' : '1RM = weight × (1 + reps/30)'}</code>. {isRTL ? 'לדוגמה, אם עשית 100 ק״ג × 5, ה-1RM המוערך שלך: 117 ק״ג.' : 'Example: 100 kg × 5 → estimated 1RM: 117 kg.'}
 </div>
 </Card>

 {Object.keys(oneRMs).length > 0 && (
 <Card>
 <SectionHeader title={isRTL ? 'פירוט אחוזים (למידה מהירה)' : 'Percentage breakdown (quick lookup)'} subtitle={isRTL ? 'המשקלים שתראה בתכניות אימון' : 'The weights you\'ll see in training plans'} />
 <div style={{ overflowX:'auto'}}>
 <table style={{ width:'100%', borderCollapse:'collapse', minWidth: 600 }}>
 <thead>
 <tr style={{ borderBottom:`1px solid ${t.color.border}` }}>
 <th style={{ textAlign:'right', padding:'10px 12px', fontSize: t.font.xs, color: t.color.textDim }}>{isRTL ? 'תרגיל' : 'Exercise'}</th>
 {[60, 70, 75, 80, 85, 90, 95].map(pct => (
 <th key={pct} style={{ textAlign:'right', padding:'10px 12px', fontSize: t.font.xs, color: t.color.textDim }}>{pct}%</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {Object.values(KEY_LIFTS).filter(l => oneRMs[l.key]).map(lift => (
 <tr key={lift.key} style={{ borderBottom:`1px solid ${t.color.border}` }}>
 <td style={{ padding: 12, fontWeight: 600 }}>{lift.label}</td>
 {[60, 70, 75, 80, 85, 90, 95].map(pct => (
 <td key={pct} style={{ padding: 12, color: t.color.gold, fontWeight: 700 }}>
 {Math.round((oneRMs[lift.key] * pct/100) / 2.5) * 2.5}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>
 )}
 </div>
 )
}

// ─── Invite Friends card ───────────────────────────────────
// Prominent share block: copy link + WhatsApp share + native share.
// Link is the app root — anyone who opens it lands on signup.
function InviteFriendsCard() {
  const { isRTL } = useI18n()
  const { state } = useApp()
  const [copied, setCopied] = useState(false)

  // We need the current user's id to attach ?ref=... to the invite link.
  // useAuth is imported at the bottom of the file to avoid circular imports.
  const { user: authUser } = useAuthLite()

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin + window.location.pathname
    : 'https://avivgvili6-pixel.github.io/businessos/'
  const shareUrl = authUser?.id ? `${baseUrl}?ref=${authUser.id}` : baseUrl

  const senderName = state.profile?.name || ''
  const shareText = isRTL
    ? `${senderName ? senderName + ' ' : ''}הזמין/ה אותך ל־Selano — מערכת אימונים ותזונה מותאמת אישית. הצטרפ/י כאן: ${shareUrl}`
    : `You've been invited to Selano — a personal training + nutrition platform. Join: ${shareUrl}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    } catch {
      // Fallback: create a temp input
      const el = document.createElement('input')
      el.value = shareUrl
      document.body.appendChild(el)
      el.select()
      try { document.execCommand('copy') } catch {}
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Selano',
          text: shareText,
          url: shareUrl,
        })
      } catch { /* user cancelled */ }
    } else {
      copyLink()
    }
  }

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <Card style={{
      padding: 20,
      background: `linear-gradient(160deg, rgba(199,64,80,0.10), ${t.color.bgElevated} 60%)`,
      border: `1px solid rgba(199,64,80,0.4)`,
    }}>
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.28em',
        textTransform: 'uppercase', color: t.color.wineLight, fontWeight: 700,
        marginBottom: 8,
      }}>{isRTL ? 'הזמנה' : 'Invite'}</div>

      <div style={{
        fontFamily: t.font.family.display, fontSize: 22, fontWeight: 700,
        color: t.color.white, letterSpacing: '-0.02em', marginBottom: 6,
      }}>{isRTL ? 'הזמן חברים ל־Selano' : 'Invite friends to Selano'}</div>

      <div style={{ fontSize: 13, color: t.color.silver1, lineHeight: 1.6, marginBottom: 16 }}>
        {isRTL
          ? 'שתפו את הקישור עם חברים שיצטרפו למערכת. כשיהיה מקום פנוי בפיילוט — הם ייכנסו.'
          : 'Share the link with friends. When a pilot slot opens up — they get in.'}
      </div>

      {/* URL preview */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', background: t.color.bgSoft,
        border: `1px solid ${t.color.border}`, borderRadius: t.radius.md,
        marginBottom: 12, direction: 'ltr',
      }}>
        <div style={{
          flex: 1, minWidth: 0,
          fontFamily: t.font.family.mono, fontSize: 11,
          color: t.color.silver1, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{shareUrl}</div>
        <button
          onClick={copyLink}
          style={{
            padding: '6px 12px',
            background: copied ? 'rgba(74,156,106,0.15)' : t.color.wineLight,
            color: copied ? '#7fce9a' : t.color.white,
            border: `1px solid ${copied ? '#4a9c6a' : t.color.wineLight}`,
            borderRadius: t.radius.sm, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
            flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >{copied ? (isRTL ? 'הועתק' : 'Copied') : (isRTL ? 'העתק' : 'Copy')}</button>
      </div>

      {/* Share buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, minWidth: 140,
            padding: '12px 16px', textDecoration: 'none',
            background: '#25D366', color: '#0d1a12',
            borderRadius: t.radius.md,
            fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
            textAlign: 'center', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(37, 211, 102, 0.18)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.5 3.4A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6a12 12 0 0 0 5.8 1.5c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.5z"/>
          </svg>
          {isRTL ? 'שתף בוואטסאפ' : 'Share on WhatsApp'}
        </a>

        {canNativeShare && (
          <button
            onClick={nativeShare}
            style={{
              flex: 1, minWidth: 140,
              padding: '12px 16px',
              background: 'transparent', color: t.color.wineLight,
              border: `1px solid ${t.color.wineLight}`,
              borderRadius: t.radius.md, cursor: 'pointer',
              fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
            }}
          >{isRTL ? 'שתף...' : 'Share...'}</button>
        )}
      </div>
    </Card>
  )
}
