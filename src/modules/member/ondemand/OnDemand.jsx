import React, { useMemo, useState } from 'react'
import { t } from '../../../theme/tokens'
import { Card, Button, Badge, SectionHeader, Input, Select } from '../../../components/ui/UI'
import { CATEGORIES, VIDEOS } from '../../../data/onDemand'
import { useI18n } from '../../../i18n/i18n'

// On-Demand video library. Categories are shown as filter chips; a search
// box narrows further. Clicking a card opens the YouTube video in a modal
// via nocookie embed.

export function OnDemand() {
 const { isRTL } = useI18n()
 const [cat, setCat] = useState('all')
 const [level, setLevel] = useState('')
 const [maxDur, setMaxDur] = useState('')
 const [q, setQ] = useState('')
 const [playing, setPlaying] = useState(null)

 const filtered = useMemo(() => VIDEOS.filter(v => {
 if (cat !== 'all'&& v.cat !== cat) return false
 if (level && v.level !== level) return false
 if (maxDur && v.duration > +maxDur) return false
 if (q && !v.title.includes(q) && !v.by?.toLowerCase().includes(q.toLowerCase())) return false
 return true
 }), [cat, level, maxDur, q])

 const catCounts = useMemo(() => {
 const c = { all: VIDEOS.length }
 CATEGORIES.forEach(x => { c[x.id] = VIDEOS.filter(v => v.cat === x.id).length })
 return c
 }, [])

 return (
 <div style={{ display:'grid', gap: 16 }}>
 {/* Hero */}
 <Card style={{ padding: 24, background: `linear-gradient(135deg, ${t.color.bgCard} 0%, ${t.color.bgElevated} 100%)`, position:'relative', overflow:'hidden'}}>
 <div style={{ position:'absolute', top: -30, left: -30, width: 180, height: 180, background: t.color.goldGlow, borderRadius:'50%', filter:'blur(40px)'}} />
 <div style={{ position:'relative', zIndex: 1 }}>
 <Badge color={t.color.gold}> ON-DEMAND</Badge>
 <h1 style={{ fontSize: t.font.hero, fontWeight: 900, marginTop: 10, marginBottom: 6 }}>{isRTL ? 'אימונים בבית — בקליק' : 'Home workouts — one click away'}</h1>
 <p style={{ color: t.color.textDim, fontSize: t.font.md, maxWidth: 520, lineHeight: 1.5 }}>
 {VIDEOS.length} {isRTL ? 'סרטוני אימון בבית: פונקציונאלי, יוגה, פילאטיס, כוח משקל גוף, קרוספיט, ו־MOBILITY.' : 'home workout videos: functional, yoga, pilates, bodyweight strength, CrossFit, and MOBILITY.'}
 {isRTL ? ' בחר קטגוריה, אורך, ורמה — ותצא לדרך.' : ' Pick a category, length, and level — and go.'}
 </p>
 </div>
 </Card>

 {/* Category chips */}
 <div style={{ display:'flex', gap: 6, overflowX:'auto', paddingBottom: 4 }}>
 <button onClick={() => setCat('all')} style={{
 padding:'10px 16px', borderRadius: 999,
 background: cat === 'all'? t.color.gold : t.color.bgSoft,
 color: cat === 'all'? '#0d0d14': t.color.text,
 border: `1px solid ${cat === 'all'? t.color.gold : t.color.border}`,
 cursor:'pointer', fontFamily:'inherit', fontWeight: 700, fontSize: t.font.sm,
 whiteSpace:'nowrap',
 }}>{isRTL ? 'הכל' : 'All'} ({catCounts.all})</button>
 {CATEGORIES.map(c => (
 <button key={c.id} onClick={() => setCat(c.id)} style={{
 padding:'10px 16px', borderRadius: 999,
 background: cat === c.id ? c.color : t.color.bgSoft,
 color: cat === c.id ? '#0d0d14': t.color.text,
 border: `1px solid ${cat === c.id ? c.color : t.color.border}`,
 cursor:'pointer', fontFamily:'inherit', fontWeight: 700, fontSize: t.font.sm,
 whiteSpace:'nowrap',
 }}>{c.icon} {c.label} ({catCounts[c.id]})</button>
 ))}
 </div>

 {/* Filters */}
 <Card style={{ padding: 12 }}>
 <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap: 10 }} className="hfos-od-filters">
 <Input value={q} onChange={e => setQ(e.target.value)} placeholder={isRTL ? 'חיפוש...' : 'Search...'} />
 <Select value={level} onChange={e => setLevel(e.target.value)}>
 <option value="">{isRTL ? 'כל הרמות' : 'All levels'}</option>
 <option value="קל">{isRTL ? 'קל' : 'Easy'}</option>
 <option value="בינוני">{isRTL ? 'בינוני' : 'Medium'}</option>
 <option value="מתקדם">{isRTL ? 'מתקדם' : 'Advanced'}</option>
 </Select>
 <Select value={maxDur} onChange={e => setMaxDur(e.target.value)}>
 <option value="">{isRTL ? 'כל אורך' : 'Any length'}</option>
 <option value="15">{isRTL ? 'עד 15 דק׳' : 'Up to 15 min'}</option>
 <option value="25">{isRTL ? 'עד 25 דק׳' : 'Up to 25 min'}</option>
 <option value="40">{isRTL ? 'עד 40 דק׳' : 'Up to 40 min'}</option>
 </Select>
 </div>
 </Card>

 {/* Creator spotlight — BOHO BEAUTIFUL (yoga only) */}
 {cat === 'yoga'&& (
 <Card style={{
 padding: 18, background: `linear-gradient(135deg, ${t.color.bgCard} 0%, #2a1a1e 100%)`,
 border: `1px solid ${t.color.gold}55`,
 display:'flex', justifyContent:'space-between', alignItems:'center', gap: 14, flexWrap:'wrap',
 }}>
 <div style={{ flex:'1 1 260px', minWidth: 240 }}>
 <div style={{
 fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.28em',
 color: t.color.gold, fontWeight: 700, textTransform:'uppercase', marginBottom: 6,
 }}>Creator Spotlight</div>
 <div style={{
 fontFamily: t.font.family.display, fontSize: 20, fontWeight: 700,
 color: t.color.white, marginBottom: 4,
 }}>BOHO BEAUTIFUL</div>
 <div style={{ color: t.color.textDim, fontSize: t.font.sm, lineHeight: 1.5 }}>
 {isRTL
 ? 'מאגר יוגה עשיר של יוליאנה ומארק ספיצ׳ק — Vinyasa, Yin, HIIT Yoga ועוד מאות סרטונים חינם ביוטיוב.'
 : 'A rich yoga catalogue by Juliana & Mark Spicoluk — Vinyasa, Yin, HIIT Yoga and hundreds more free on YouTube.'}
 </div>
 </div>
 <a href="https://www.youtube.com/@bohobeautiful/videos"target="_blank" rel="noopener noreferrer"style={{
 padding:'12px 22px', background: t.color.gold, color:'#0d0d14',
 borderRadius: t.radius.md, textDecoration:'none', fontWeight: 700, fontSize: t.font.sm,
 whiteSpace:'nowrap',
 }}>{isRTL ? 'פתח את הערוץ המלא' : 'Open full channel'}</a>
 </Card>
 )}

 {/* Grid */}
 {filtered.length === 0 && (
 <Card style={{ padding: 40, textAlign:'center'}}>
 <div style={{ fontSize: 48, marginBottom: 12 }}> </div>
 <div style={{ color: t.color.textDim }}>{isRTL ? 'לא נמצאו סרטונים עם הפילטרים האלה' : 'No videos found with these filters'}</div>
 </Card>
 )}

 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
 {filtered.map(v => {
 const catMeta = CATEGORIES.find(c => c.id === v.cat)
 const thumb = `https://i.ytimg.com/vi/${v.ytId}/hqdefault.jpg`
 return (
 <Card key={v.id} hover style={{ padding: 0, overflow:'hidden', cursor:'pointer'}} onClick={() => setPlaying(v)}>
 <div style={{ position:'relative', paddingTop:'56.25%', background: t.color.bgSoft }}>
 <img src={thumb} alt=""style={{ position:'absolute', inset: 0, width:'100%', height:'100%', objectFit:'cover'}} onError={e => { e.currentTarget.style.display = 'none'}} />
 <div style={{
 position:'absolute', inset: 0, display:'grid', placeItems:'center',
 background:'linear-gradient(180deg, transparent 40%, rgba(0,0,0,.6))',
 }}>
 <div style={{
 width: 54, height: 54, borderRadius:'50%',
 background: t.color.gold, color:'#0d0d14',
 display:'grid', placeItems:'center', fontSize: 22,
 boxShadow:'0 8px 20px rgba(0,0,0,.4)',
 }}>▶</div>
 </div>
 <div style={{ position:'absolute', top: 8, right: 8, display:'flex', gap: 4 }}>
 <Badge color={catMeta?.color}>{catMeta?.icon} {catMeta?.label}</Badge>
 </div>
 <div style={{ position:'absolute', bottom: 8, left: 8, display:'flex', gap: 4 }}>
 <Badge>{v.duration} {isRTL ? 'דק׳' : 'min'}</Badge>
 <Badge>{v.level}</Badge>
 </div>
 </div>
 <div style={{ padding: 14 }}>
 <div style={{ fontWeight: 700, fontSize: t.font.md, marginBottom: 4, lineHeight: 1.3 }}>{v.title}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{v.by}</div>
 </div>
 </Card>
 )
 })}
 </div>

 {/* Player modal */}
 {playing && (
 <div onClick={() => setPlaying(null)} style={{
 position:'fixed', inset: 0, background:'rgba(0,0,0,.9)', zIndex: 1000,
 display:'grid', placeItems:'center', padding: 20,
 }}>
 <div onClick={e => e.stopPropagation()} style={{
 maxWidth: 900, width:'100%', direction:'rtl',
 }}>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
 <div>
 <div style={{ color:'#fff', fontWeight: 700, fontSize: t.font.md }}>{playing.title}</div>
 <div style={{ color:'#aaa', fontSize: t.font.xs }}>{playing.by} · {playing.duration} {isRTL ? 'דק׳' : 'min'} · {playing.level}</div>
 </div>
 <button onClick={() => setPlaying(null)} style={{
 background:'#fff', border:'none', color:'#000', width: 36, height: 36,
 borderRadius:'50%', cursor:'pointer', fontSize: 18, fontWeight: 700,
 }}> </button>
 </div>
 <div style={{ position:'relative', paddingTop:'56.25%', background:'#000', borderRadius: t.radius.md, overflow:'hidden'}}>
 <iframe
 src={`https://www.youtube-nocookie.com/embed/${playing.ytId}?autoplay=1&rel=0`}
 title={playing.title}
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen
 style={{ position:'absolute', inset: 0, width:'100%', height:'100%', border: 0 }}
 />
 </div>
 </div>
 </div>
 )}

 <style>{`
 @media (max-width: 640px) {
 .hfos-od-filters { grid-template-columns: 1fr !important; }
 }
 `}</style>
 </div>
 )
}
