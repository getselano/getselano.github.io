import React, { useMemo, useState } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Card, Button, Badge, SectionHeader } from '../../../components/ui/UI'
import { DisclaimerNote } from '../../../components/legal/DisclaimerNote'
import { useI18n } from '../../../i18n/i18n'
import {
  SUPPLEMENTS, SUPP_CATEGORIES, BUNDLES, EVIDENCE,
  findSupplement, supplementsByCategory, suggestFromBlood,
} from '../../../data/supplements'
import { bloodMarkers, statusForValue } from '../../../data/bloodMarkers'

// Supplements section of the store.
//
// Two things distinguish this from a product grid: every entry states its
// evidence grade honestly (including the ones graded weak), and the panel the
// trainee already uploaded to the blood-test reader is used to surface the
// entries their own results give a reason to consider.

export function SupplementsStore({ onOrder }) {
  const { state } = useApp()
  const { isRTL } = useI18n()
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState(null)
  const [bundle, setBundle] = useState(null)

  const latestBlood = state.bloodTests?.[0] || null
  const bloodSuggestions = useMemo(
    () => suggestFromBlood(latestBlood, (id, v) => {
      const marker = bloodMarkers.find(m => m.id === id)
      return marker ? statusForValue(marker, v, state.profile?.sex) : 'unknown'
    }),
    [latestBlood, state.profile?.sex]
  )

  const shown = category === 'all' ? SUPPLEMENTS : supplementsByCategory(category)

  if (selected) {
    return <SupplementDetail
      supplement={selected}
      onBack={() => setSelected(null)}
      onOrder={onOrder}
      bloodSuggestions={bloodSuggestions}
    />
  }

  if (bundle) {
    return <BundleDetail
      bundle={bundle}
      onBack={() => setBundle(null)}
      onOrder={onOrder}
      onOpenSupplement={(s) => { setBundle(null); setSelected(s) }}
    />
  }

  return (
    <div style={{ display:'grid', gap: 16 }}>
      <DisclaimerNote kind="supplements" />

      {/* Personalised from the trainee's own panel */}
      {bloodSuggestions.length > 0 && (
        <Card style={{ borderColor: t.color.info, background: `${t.color.info}0d` }}>
          <SectionHeader
            title="לפי בדיקת הדם שלך"
            subtitle={`מהבדיקה מ-${new Date(latestBlood.date).toLocaleDateString('he-IL')}`}
          />
          <div style={{ display:'grid', gap: 8 }}>
            {bloodSuggestions.map(({ supplement, markerId, value, status }) => {
              const marker = bloodMarkers.find(m => m.id === markerId)
              return (
                <button key={supplement.id} onClick={() => setSelected(supplement)} style={{
                  width:'100%', textAlign:'start', fontFamily:'inherit', cursor:'pointer',
                  background: t.color.bgSoft, border:`1px solid ${t.color.border}`,
                  borderRadius: t.radius.sm, padding: 12, color: t.color.text,
                  display:'flex', alignItems:'center', gap: 10,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{supplement.name}</div>
                    <div style={{ fontSize: 12, color: t.color.textDim, marginTop: 2 }}>
                      {marker?.name}: {value} {marker?.unit} — {status === 'low' ? 'מתחת לטווח' : 'מעל הטווח'}
                    </div>
                  </div>
                  <span style={{ fontSize: 20, color: t.color.info }}>›</span>
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 11, color: t.color.textMuted, marginTop: 10, lineHeight: 1.6 }}>
            אלה הצעות למידע בלבד על סמך ערכים חריגים בבדיקה. החלטה על נטילת תוסף היא של רופא או דיאטן.
          </div>
        </Card>
      )}

      {/* Bundles */}
      <div>
        <SectionHeader title="חבילות מומלצות" subtitle="שילובים שעובדים יחד, לא רק הנחה" />
        <div style={{ display:'grid', gap: 10 }}>
          {BUNDLES.map(b => {
            const full = b.items.reduce((s, id) => s + (findSupplement(id)?.price || 0), 0)
            return (
              <button key={b.id} onClick={() => setBundle(b)} style={{
                width:'100%', textAlign:'start', fontFamily:'inherit', cursor:'pointer',
                background:`linear-gradient(135deg, ${t.color.bgCard} 0%, ${t.color.bgElevated} 100%)`,
                border:`1px solid ${t.color.border}`, borderRadius: t.radius.md,
                padding: 16, color: t.color.text, transition: t.transition,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.gold }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border }}
              >
                <div style={{ display:'flex', alignItems:'baseline', gap: 8, flexWrap:'wrap' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: t.color.gold }}>{b.name}</span>
                  <span style={{ fontSize: 12, color: t.color.textDim }}>{b.goal}</span>
                </div>
                <div style={{ fontSize: 12, color: t.color.textDim, marginTop: 6 }}>
                  {b.items.map(id => findSupplement(id)?.name).filter(Boolean).join(' · ')}
                </div>
                <div style={{ display:'flex', alignItems:'baseline', gap: 8, marginTop: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: t.color.gold }}>₪{b.price}</span>
                  {full > b.price && (
                    <>
                      <span style={{ fontSize: 13, color: t.color.textMuted, textDecoration:'line-through' }}>₪{full}</span>
                      <Badge color={t.color.success}>חיסכון ₪{full - b.price}</Badge>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category filter */}
      <div>
        <SectionHeader title="כל התוספים" subtitle="לחיצה על תוסף פותחת את ההשפעה המלאה על הגוף" />
        <div className="hfos-hscroll" style={{ display:'flex', gap: 6, overflowX:'auto', paddingBottom: 6, marginBottom: 12 }}>
          <CatChip label="הכל" active={category === 'all'} onClick={() => setCategory('all')} />
          {SUPP_CATEGORIES.map(c => (
            <CatChip key={c.key} label={c.he} active={category === c.key} onClick={() => setCategory(c.key)} />
          ))}
        </div>

        {category !== 'all' && (
          <div style={{ fontSize: 12, color: t.color.textDim, marginBottom: 10 }}>
            {SUPP_CATEGORIES.find(c => c.key === category)?.sub}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
          {shown.map(s => (
            <SupplementCard key={s.id} supplement={s} onClick={() => setSelected(s)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function CatChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:'8px 16px', borderRadius: 999, whiteSpace:'nowrap',
      background: active ? t.color.gold : t.color.bgSoft,
      color: active ? '#0d0d14' : t.color.text,
      border:`1px solid ${active ? t.color.gold : t.color.border}`,
      cursor:'pointer', fontFamily:'inherit', fontWeight: 700, fontSize: t.font.sm,
    }}>{label}</button>
  )
}

function EvidenceBadge({ level, full }) {
  const e = EVIDENCE[level]
  if (!e) return null
  return (
    <span title={e.note} style={{
      display:'inline-flex', alignItems:'center', gap: 5,
      padding:'2px 9px', borderRadius: 999,
      border:`1px solid ${e.color}`, color: e.color,
      fontSize: 10, fontWeight: 700, whiteSpace:'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius:'50%', background: e.color }} />
      {full ? e.he : e.short}
    </span>
  )
}

function SupplementCard({ supplement: s, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', textAlign:'start', fontFamily:'inherit', cursor:'pointer',
      background: t.color.bgCard, border:`1px solid ${t.color.border}`,
      borderRadius: t.radius.md, padding: 16, color: t.color.text,
      display:'flex', flexDirection:'column', gap: 6, transition: t.transition,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.gold }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{s.name}</span>
        <EvidenceBadge level={s.evidence} />
      </div>
      <div style={{ fontSize: 12, color: t.color.textDim, lineHeight: 1.5, flex: 1 }}>{s.tagline}</div>
      <div style={{ fontSize: 11, color: t.color.textMuted }}>{s.size}</div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop: 4 }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: t.color.gold }}>₪{s.price}</span>
        <span style={{ fontSize: 12, color: t.color.textDim }}>מה זה עושה ›</span>
      </div>
    </button>
  )
}

function BackRow({ onBack }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={onBack} style={{
        background:'transparent', border:`1px solid ${t.color.border}`, color: t.color.text,
        padding:'8px 14px', borderRadius: t.radius.sm, cursor:'pointer',
        fontFamily:'inherit', fontSize: 13,
      }}>← חזרה לתוספים</button>
    </div>
  )
}

function SupplementDetail({ supplement: s, onBack, onOrder, bloodSuggestions }) {
  const e = EVIDENCE[s.evidence]
  const relevant = bloodSuggestions.find(b => b.supplement.id === s.id)

  return (
    <div>
      <BackRow onBack={onBack} />
      <div style={{ display:'grid', gap: 14 }}>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap: 10, flexWrap:'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 2 }}>{s.name}</h2>
              <div style={{ fontSize: 12, color: t.color.textMuted }}>{s.name_en} · {s.size}</div>
            </div>
            <EvidenceBadge level={s.evidence} full />
          </div>
          <div style={{ fontSize: 14, color: t.color.textDim, marginTop: 10, lineHeight: 1.6 }}>{s.tagline}</div>
          <div style={{ fontSize: 11, color: t.color.textMuted, marginTop: 8, lineHeight: 1.6 }}>
            רמת ראיות: {e?.note}
          </div>
        </Card>

        {relevant && (
          <Card style={{ borderColor: t.color.info, background: `${t.color.info}0d` }}>
            <div style={{ fontWeight: 700, color: t.color.info, marginBottom: 4 }}>רלוונטי לבדיקה שלך</div>
            <div style={{ fontSize: 13, color: t.color.text, lineHeight: 1.7 }}>
              {bloodMarkers.find(m => m.id === relevant.markerId)?.name} שלך הוא {relevant.value} — {relevant.status === 'low' ? 'מתחת לטווח התקין' : 'מעל הטווח התקין'}.
              {s.bloodNote ? ` ${s.bloodNote}` : ''}
            </div>
          </Card>
        )}

        {/* The core of the request: what it does to the body */}
        <Card>
          <SectionHeader title="ההשפעה על הגוף" />
          <div style={{ fontSize: 13, color: t.color.textDim, lineHeight: 1.7, marginBottom: 14 }}>
            {s.howItWorks}
          </div>
          <div style={{ display:'grid', gap: 8 }}>
            {s.effects.map((eff, i) => (
              <div key={i} style={{
                padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm,
                borderInlineStart: `3px solid ${t.color.gold}`,
              }}>
                <div style={{
                  fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.18em',
                  color: t.color.gold, fontWeight: 700, textTransform:'uppercase', marginBottom: 4,
                }}>{eff.system}</div>
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>{eff.text}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <InfoBlock label="מינון" value={s.dosage} />
            <InfoBlock label="תזמון" value={s.timing} />
          </div>
        </Card>

        {s.cautions && (
          <Card style={{ borderColor: t.color.warning, background:`${t.color.warning}0d` }}>
            <div style={{
              fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.18em',
              color: t.color.warning, fontWeight: 700, textTransform:'uppercase', marginBottom: 6,
            }}>לשים לב</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>{s.cautions}</div>
          </Card>
        )}

        <Card>
          <div style={{ display:'flex', alignItems:'center', gap: 12, flexWrap:'wrap' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: t.color.gold }}>₪{s.price}</div>
            <div style={{ fontSize: 12, color: t.color.textDim, flex: 1, minWidth: 120 }}>{s.size}</div>
            <Button onClick={() => onOrder?.({ name: s.name, price: s.price })}>הזמן עכשיו</Button>
          </div>
        </Card>

        <DisclaimerNote kind="supplements" />
      </div>
    </div>
  )
}

function BundleDetail({ bundle: b, onBack, onOrder, onOpenSupplement }) {
  const items = b.items.map(findSupplement).filter(Boolean)
  const full = items.reduce((s, x) => s + x.price, 0)

  return (
    <div>
      <BackRow onBack={onBack} />
      <div style={{ display:'grid', gap: 14 }}>
        <Card>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{b.name}</h2>
          <div style={{ fontSize: 13, color: t.color.textDim }}>{b.goal}</div>
          <div style={{ display:'flex', alignItems:'baseline', gap: 10, marginTop: 12, flexWrap:'wrap' }}>
            <span style={{ fontSize: 30, fontWeight: 900, color: t.color.gold }}>₪{b.price}</span>
            {full > b.price && (
              <>
                <span style={{ fontSize: 15, color: t.color.textMuted, textDecoration:'line-through' }}>₪{full}</span>
                <Badge color={t.color.success}>חיסכון ₪{full - b.price}</Badge>
              </>
            )}
          </div>
        </Card>

        <Card>
          <SectionHeader title="למה דווקא השילוב הזה" />
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>{b.synergy}</div>
        </Card>

        <Card>
          <SectionHeader title="למי זה מתאים" />
          <div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>{b.forWhom}</div>
          <div style={{
            padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm,
            borderInlineStart:`3px solid ${t.color.info}`,
          }}>
            <div style={{
              fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.18em',
              color: t.color.info, fontWeight: 700, textTransform:'uppercase', marginBottom: 4,
            }}>למה לצפות</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>{b.expect}</div>
          </div>
        </Card>

        <Card>
          <SectionHeader title={`מה בפנים (${items.length})`} subtitle="לחיצה פותחת את ההשפעה המלאה" />
          <div style={{ display:'grid', gap: 8 }}>
            {items.map(s => (
              <button key={s.id} onClick={() => onOpenSupplement(s)} style={{
                width:'100%', textAlign:'start', fontFamily:'inherit', cursor:'pointer',
                background: t.color.bgSoft, border:`1px solid ${t.color.border}`,
                borderRadius: t.radius.sm, padding: 12, color: t.color.text,
                display:'flex', alignItems:'center', gap: 10,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                    <EvidenceBadge level={s.evidence} />
                  </div>
                  <div style={{ fontSize: 12, color: t.color.textDim, marginTop: 2 }}>{s.tagline}</div>
                </div>
                <span style={{ fontSize: 13, color: t.color.textMuted }}>₪{s.price}</span>
                <span style={{ fontSize: 18, color: t.color.gold }}>›</span>
              </button>
            ))}
          </div>
        </Card>

        {b.cautions && (
          <Card style={{ borderColor: t.color.warning, background:`${t.color.warning}0d` }}>
            <div style={{
              fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.18em',
              color: t.color.warning, fontWeight: 700, textTransform:'uppercase', marginBottom: 6,
            }}>לשים לב</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>{b.cautions}</div>
          </Card>
        )}

        <Button
          onClick={() => onOrder?.({ name: b.name, price: b.price, items: items.map(i => i.name) })}
          style={{ width:'100%', justifyContent:'center', padding: 14 }}
        >הזמן את החבילה — ₪{b.price}</Button>

        <DisclaimerNote kind="supplements" />
      </div>
    </div>
  )
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.18em',
        color: t.color.silver2, fontWeight: 700, textTransform:'uppercase', marginBottom: 5,
      }}>{label}</div>
      <div style={{ fontSize: 13, lineHeight: 1.7 }}>{value}</div>
    </div>
  )
}
