import React, { useState } from 'react'
import { t } from '../../../theme/tokens'
import { Card, Button, Badge, SectionHeader } from '../../../components/ui/UI'
import { useI18n } from '../../../i18n/i18n'
import { SupplementsStore } from './SupplementsStore'

const CONTACT_EMAIL = 'israelgrip@gmail.com'
const CONTACT_WHATSAPP = ''// add international format when available, e.g. '972501234567'

const PRODUCTS = [
 {
 id:'shirt-black', emoji:'', category:'ביגוד',
 name:'חולצת סלנו שחורה', name_en:'Selano Black Shirt', price: 89,
 subtitle:'נושמת · Dri-Fit · לוגו זהב מוטבע', subtitle_en:'Breathable · Dri-Fit · embossed gold logo',
 sizes: ['S','M','L','XL','XXL'],
 },
 {
 id:'shirt-white', emoji:'', category:'ביגוד',
 name:'חולצת סלנו לבנה', name_en:'Selano White Shirt', price: 89,
 subtitle:'נושמת · Dri-Fit · לוגו שחור מוטבע', subtitle_en:'Breathable · Dri-Fit · embossed black logo',
 sizes: ['S','M','L','XL','XXL'],
 },
 {
 id:'hoodie', emoji:'', category:'ביגוד',
 name:'קפוצ׳ון סלנו', name_en:'Selano Hoodie', price: 189,
 subtitle:'כותנה איכותית · חורף · יוניסקס', subtitle_en:'Premium cotton · winter · unisex',
 sizes: ['S','M','L','XL','XXL'],
 },
 {
 id:'shaker', emoji:'', category:'אביזרים',
 name:'שייקר סלנו 700 מ״ל', name_en:'Selano Shaker 700 ml', price: 39,
 subtitle:'BPA-Free · כדור מיקסר · לוגו', subtitle_en:'BPA-Free · mixer ball · logo',
 },
 {
 id:'straps', emoji:'', category:'אביזרים',
 name:'רצועות דדליפט', name_en:'Deadlift straps', price: 59,
 subtitle:'עור מלא · תפירה כפולה · אחיזה חזקה', subtitle_en:'Full leather · double stitched · strong grip',
 },
 {
 id:'belt', emoji:'', category:'אביזרים',
 name:'חגורת כוח מקצועית', name_en:'Pro power belt', price: 249,
 subtitle:'10mm · IPF Approved · עור פרה', subtitle_en:'10mm · IPF Approved · cowhide',
 sizes: ['S','M','L','XL'],
 },
 {
 id:'wraps', emoji:'', category:'אביזרים',
 name:'רצועות ברכיים', name_en:'Knee wraps', price: 79,
 subtitle:'זוג · יציבות בסקוואטים כבדים', subtitle_en:'Pair · stability in heavy squats',
 },
 {
 id:'bag', emoji:'', category:'אביזרים',
 name:'תיק אימון סלנו', name_en:'Selano gym bag', price: 149,
 subtitle:'תא לנעליים · 45 ליטר · מותג', subtitle_en:'Shoe compartment · 45 L · branded',
 },
]

const CATEGORIES_HE = ['הכל','ביגוד','אביזרים']
const CATEGORIES_EN = { 'הכל':'All','ביגוד':'Apparel','אביזרים':'Accessories'}

export function Store() {
 const { isRTL } = useI18n()
 const [section, setSection] = useState('gear')   // gear | supplements
 const [cat, setCat] = useState('הכל')
 const [selected, setSelected] = useState(null)
 const [size, setSize] = useState(null)

 const catLabel = (c) => (isRTL ? c : (CATEGORIES_EN[c] || c))
 const pname = (p) => (isRTL ? p.name : (p.name_en || p.name))
 const psub = (p) => (isRTL ? p.subtitle : (p.subtitle_en || p.subtitle))

 const filtered = cat === 'הכל'? PRODUCTS : PRODUCTS.filter(p => p.category === cat)

 // Supplements reuse the same mailto ordering path as the gear catalogue —
 // there is no payment processing on either side.
 const orderSupplement = ({ name, price, items }) => {
 const lines = items?.length ? `\n כולל: ${items.join(' · ')}` : ''
 const body = isRTL
 ? `שלום, אשמח להזמין:\n\n מוצר: ${name}${lines}\n מחיר: ₪${price}\n\nשם:\nכתובת למשלוח:\nטלפון:\n`
 : `Hi, I'd like to order:\n\n Product: ${name}${lines}\n Price: ₪${price}\n\nName:\nShipping address:\nPhone:\n`
 const subject = isRTL ? `הזמנת תוסף: ${name}` : `Supplement order: ${name}`
 window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
 }

 const order = (product, chosenSize) => {
 const productName = pname(product)
 const body = isRTL
 ? `שלום, אשמח להזמין:\n\n מוצר: ${productName}${chosenSize ? `\n מידה: ${chosenSize}` :''}\n מחיר: ₪${product.price}\n\nשם:\nכתובת למשלוח:\nטלפון:\n`
 : `Hi, I'd like to order:\n\n Product: ${productName}${chosenSize ? `\n Size: ${chosenSize}` :''}\n Price: ₪${product.price}\n\nName:\nShipping address:\nPhone:\n`
 const subject = isRTL ? `הזמנת מוצר: ${productName}` : `Product order: ${productName}`
 const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
 window.location.href = mailto
 }

 return (
 <div style={{ display:'grid', gap: 16 }}>
 {/* Hero */}
 <Card style={{ padding: 24, background: `linear-gradient(135deg, ${t.color.bgCard} 0%, ${t.color.bgElevated} 100%)`, position:'relative', overflow:'hidden'}}>
 <div style={{ position:'absolute', top: -30, left: -30, width: 180, height: 180, background: t.color.goldGlow, borderRadius:'50%', filter:'blur(40px)'}} />
 <div style={{ position:'relative', zIndex: 1 }}>
 <Badge color={t.color.gold}> {isRTL ? 'חנות סלנו' : 'Selano store'}</Badge>
 <h1 style={{ fontSize: t.font.hero, fontWeight: 900, marginTop: 10, marginBottom: 6 }}>{isRTL ? 'הציוד המקורי שלנו' : 'Our original gear'}</h1>
 <p style={{ color: t.color.textDim, fontSize: t.font.md, maxWidth: 500, lineHeight: 1.5 }}>
 {isRTL ? 'חולצות, ביגוד ואביזרי אימון עם המותג של סלנו. איכות מקצועית, לוגו מוטבע.' : 'Shirts, apparel, and training accessories branded by Selano. Pro-grade quality, embossed logo.'}
 </p>
 </div>
 </Card>

 {/* Section switch — gear vs supplements */}
 <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 8 }}>
 {[
 { key:'gear', he:'ציוד ומיתוג', en:'Gear' },
 { key:'supplements', he:'תוספי תזונה', en:'Supplements' },
 ].map(x => {
 const active = section === x.key
 return (
 <button key={x.key} onClick={() => setSection(x.key)} style={{
 padding:'14px 10px', borderRadius: t.radius.md, cursor:'pointer',
 background: active
 ? `linear-gradient(160deg, ${t.color.goldGlow}, ${t.color.bgElevated} 70%)`
 : t.color.bgSoft,
 border:`1px solid ${active ? t.color.gold : t.color.border}`,
 color: active ? t.color.gold : t.color.text,
 fontFamily:'inherit', fontWeight: 800, fontSize: 15,
 transition: t.transition,
 }}>{isRTL ? x.he : x.en}</button>
 )
 })}
 </div>

 {section === 'supplements' && <SupplementsStore onOrder={orderSupplement} />}

 {section === 'gear' && <>
 {/* Category tabs */}
 <div style={{ display:'flex', gap: 8, overflowX:'auto', paddingBottom: 4 }}>
 {CATEGORIES_HE.map(c => (
 <button key={c} onClick={() => setCat(c)} style={{
 padding:'8px 16px', borderRadius: 999,
 background: cat === c ? t.color.gold : t.color.bgSoft,
 color: cat === c ? '#0d0d14': t.color.text,
 border: `1px solid ${cat === c ? t.color.gold : t.color.border}`,
 cursor:'pointer', fontFamily:'inherit', fontWeight: 700, fontSize: t.font.sm,
 whiteSpace:'nowrap',
 }}>{catLabel(c)}</button>
 ))}
 </div>

 {/* Product grid */}
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
 {filtered.map(p => (
 <Card key={p.id} hover style={{ padding: 20, cursor:'pointer', display:'flex', flexDirection:'column'}} onClick={() => { setSelected(p); setSize(null) }}>
 <div style={{ fontSize: 56, textAlign:'center', padding:'10px 0'}}>{p.emoji}</div>
 <div style={{ fontWeight: 800, fontSize: t.font.lg, marginBottom: 4 }}>{pname(p)}</div>
 <div style={{ color: t.color.textDim, fontSize: t.font.sm, lineHeight: 1.4, marginBottom: 12, flex: 1 }}>{psub(p)}</div>
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center'}}>
 <div style={{ fontSize: t.font.xxl, fontWeight: 900, color: t.color.gold }}>₪{p.price}</div>
 <Badge>{catLabel(p.category)}</Badge>
 </div>
 </Card>
 ))}
 </div>
 </>}

 {/* Order modal */}
 {selected && (
 <div onClick={() => setSelected(null)} style={{
 position:'fixed', inset: 0, background:'rgba(0,0,0,.7)', zIndex: 1000,
 display:'grid', placeItems:'center', padding: 20,
 }}>
 <div onClick={e => e.stopPropagation()} style={{
 background: t.color.bgElevated, borderRadius: t.radius.lg, padding: 24,
 maxWidth: 400, width:'100%', border: `1px solid ${t.color.gold}`,
 direction: isRTL ? 'rtl' : 'ltr',
 }}>
 <div style={{ fontSize: 64, textAlign:'center', marginBottom: 12 }}>{selected.emoji}</div>
 <div style={{ fontWeight: 800, fontSize: t.font.xl, textAlign:'center', marginBottom: 4 }}>{pname(selected)}</div>
 <div style={{ color: t.color.textDim, fontSize: t.font.sm, textAlign:'center', marginBottom: 16 }}>{psub(selected)}</div>
 <div style={{ fontSize: 32, fontWeight: 900, color: t.color.gold, textAlign:'center', marginBottom: 20 }}>₪{selected.price}</div>

 {selected.sizes && (
 <div style={{ marginBottom: 16 }}>
 <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 8 }}>{isRTL ? 'בחר מידה:' : 'Choose size:'}</div>
 <div style={{ display:'flex', gap: 6, flexWrap:'wrap'}}>
 {selected.sizes.map(sz => (
 <button key={sz} onClick={() => setSize(sz)} style={{
 padding:'10px 14px', minWidth: 50,
 background: size === sz ? t.color.gold : t.color.bgSoft,
 color: size === sz ? '#0d0d14': t.color.text,
 border: `1px solid ${size === sz ? t.color.gold : t.color.border}`,
 borderRadius: t.radius.md, cursor:'pointer', fontFamily:'inherit',
 fontWeight: 700,
 }}>{sz}</button>
 ))}
 </div>
 </div>
 )}

 <div style={{ padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm, fontSize: t.font.xs, color: t.color.textDim, marginBottom: 16, lineHeight: 1.6 }}>
 {isRTL ? `בלחיצה על "הזמן עכשיו"יפתח מייל מוכן ל-${CONTACT_EMAIL}. השלם את הפרטים ושלח - נחזור אליך תוך יום עסקים.` : `Clicking "Order now" opens a pre-filled email to ${CONTACT_EMAIL}. Fill in the details and send — we'll reply within one business day.`}
 </div>

 <div style={{ display:'flex', gap: 10 }}>
 <Button variant="ghost"onClick={() => setSelected(null)}>{isRTL ? 'סגור' : 'Close'}</Button>
 <Button
 onClick={() => order(selected, size)}
 icon=" "
 style={{ flex: 1 }}
 disabled={selected.sizes && !size}
 >
 {selected.sizes && !size ? (isRTL ? 'בחר מידה' : 'Choose size') : (isRTL ? 'הזמן עכשיו' : 'Order now')}
 </Button>
 </div>
 </div>
 </div>
 )}

 {/* Contact card */}
 <Card style={{ padding: 20 }}>
 <SectionHeader title={isRTL ? 'שאלות על המוצרים?' : 'Questions about our products?'} subtitle={isRTL ? 'פנה אלינו ישירות ונחזור אליך' : 'Reach out directly and we\'ll get back to you'} />
 <div style={{ display:'flex', gap: 10, flexWrap:'wrap', marginTop: 10 }}>
 <Button
 variant="outline"
 icon=""
 onClick={() => { window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(isRTL ? 'שאלה על מוצר בחנות סלנו' : 'Question about Selano store product')}` }}
 >{isRTL ? 'שלח מייל' : 'Send email'}</Button>
 {CONTACT_WHATSAPP && (
 <Button
 variant="outline"
 icon=""
 onClick={() => window.open(`https://wa.me/${CONTACT_WHATSAPP}`,'_blank')}
 >WhatsApp</Button>
 )}
 </div>
 </Card>
 </div>
 )
}
