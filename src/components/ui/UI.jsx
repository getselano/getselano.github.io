import React from 'react'
import { t } from '../../theme/tokens'

export function Card({ children, style, hover, glow, ...rest }) {
 return (
 <div
 style={{
 background: t.color.bgCard,
 border: `1px solid ${t.color.border}`,
 borderRadius: t.radius.lg,
 padding: t.space.xl,
 transition: t.transition,
 boxShadow: glow ? t.shadow.glow : t.shadow.sm,
 ...style,
 }}
 onMouseEnter={hover ? e => e.currentTarget.style.borderColor = t.color.gold : undefined}
 onMouseLeave={hover ? e => e.currentTarget.style.borderColor = t.color.border : undefined}
 {...rest}
 >{children}</div>
 )
}

export function Button({ children, variant='primary', size='md', icon, style, ...rest }) {
 const variants = {
 primary: { background: t.color.gold, color:'#0d0d14', border: `1px solid ${t.color.gold}` },
 ghost: { background:'transparent', color: t.color.text, border: `1px solid ${t.color.border}` },
 outline: { background:'transparent', color: t.color.gold, border: `1px solid ${t.color.gold}` },
 danger: { background:'transparent', color: t.color.danger, border: `1px solid ${t.color.danger}` },
 solid: { background: t.color.bgSoft, color: t.color.text, border: `1px solid ${t.color.border}` },
 }
 const sizes = {
 sm: { padding:'6px 12px', fontSize: t.font.sm, borderRadius: t.radius.sm },
 md: { padding:'10px 18px', fontSize: t.font.md, borderRadius: t.radius.md },
 lg: { padding:'14px 26px', fontSize: t.font.lg, borderRadius: t.radius.md, fontWeight: 700 },
 }
 return (
 <button
 style={{
 ...variants[variant], ...sizes[size],
 cursor:'pointer', fontFamily:'inherit', fontWeight: 600,
 display:'inline-flex', alignItems:'center', gap: 8,
 transition: t.transition, whiteSpace:'nowrap',
 ...style,
 }}
 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
 onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
 {...rest}
 >
 {icon && <span>{icon}</span>}
 {children}
 </button>
 )
}

export function Input({ label, hint, error, ...rest }) {
 return (
 <label style={{ display:'block', width:'100%'}}>
 {label && <div style={{ fontSize:t.font.sm, color:t.color.textDim, marginBottom:6 }}>{label}</div>}
 <input
 style={{
 width:'100%', padding:'12px 14px', background: t.color.bgSoft,
 border:`1px solid ${error ? t.color.danger : t.color.border}`, borderRadius: t.radius.sm,
 color: t.color.text, fontFamily:'inherit', fontSize: t.font.md, outline:'none',
 transition: t.transition, direction:'rtl',
 }}
 onFocus={e => e.currentTarget.style.borderColor = t.color.gold}
 onBlur={e => e.currentTarget.style.borderColor = error ? t.color.danger : t.color.border}
 {...rest}
 />
 {hint && <div style={{ fontSize:t.font.xs, color: t.color.textMuted, marginTop:4 }}>{hint}</div>}
 {error && typeof error === 'string'&& !/^[\{\[\]\}]+$/.test(error.trim()) && (
 <div style={{ fontSize:t.font.xs, color: t.color.danger, marginTop:4 }}>{error}</div>
 )}
 </label>
 )
}

export function Select({ label, children, ...rest }) {
 return (
 <label style={{ display:'block', width:'100%'}}>
 {label && <div style={{ fontSize:t.font.sm, color:t.color.textDim, marginBottom:6 }}>{label}</div>}
 <div style={{ position:'relative'}}>
 <select
 style={{
 width:'100%', padding:'12px 14px', background: t.color.bgSoft,
 border:`1px solid ${t.color.border}`, borderRadius: t.radius.sm,
 color: t.color.text, fontFamily:'inherit', fontSize: t.font.md, outline:'none',
 paddingLeft: 34, cursor:'pointer',
 }}
 {...rest}
 >{children}</select>
 <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:t.color.textDim, pointerEvents:'none'}}>▾</span>
 </div>
 </label>
 )
}

export function Badge({ children, color, style }) {
 const c = color || t.color.gold
 return (
 <span style={{
 display:'inline-block', padding:'3px 10px', borderRadius: t.radius.pill,
 fontSize: t.font.xs, fontWeight: 600, color: c,
 background: `${c}22`, border: `1px solid ${c}44`,
 ...style,
 }}>{children}</span>
 )
}

export function SectionHeader({ title, subtitle, action }) {
 return (
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom: t.space.lg }}>
 <div>
 <h2 style={{ fontSize: t.font.xxl, color: t.color.text, fontWeight: 700, marginBottom: 4 }}>{title}</h2>
 {subtitle && <div style={{ color: t.color.textDim, fontSize: t.font.md }}>{subtitle}</div>}
 </div>
 {action}
 </div>
 )
}

export function Divider({ style }) {
 return <div style={{ height:1, background: t.color.border, margin:'16px 0', ...style }} />
}

export function Stat({ label, value, delta, deltaColor, icon }) {
 return (
 <div>
 <div style={{ display:'flex', alignItems:'center', gap:6, color: t.color.textDim, fontSize: t.font.sm, marginBottom: 6 }}>
 {icon && <span>{icon}</span>}{label}
 </div>
 <div style={{ fontSize: t.font.xxl, fontWeight: 800, color: t.color.text, lineHeight: 1 }}>{value}</div>
 {delta != null && (
 <div style={{ color: deltaColor || t.color.success, fontSize: t.font.sm, marginTop: 4 }}>{delta}</div>
 )}
 </div>
 )
}

export function EmptyState({ icon='', title, subtitle, action }) {
 return (
 <div style={{ padding: t.space.xxxl, textAlign:'center', color: t.color.textDim }}>
 <div style={{ fontSize: 48, marginBottom: 12, opacity: .5 }}>{icon}</div>
 <div style={{ color: t.color.text, fontSize: t.font.lg, fontWeight: 600, marginBottom: 6 }}>{title}</div>
 {subtitle && <div style={{ fontSize: t.font.sm, maxWidth: 380, margin:'0 auto 20px'}}>{subtitle}</div>}
 {action}
 </div>
 )
}

export function Tabs({ tabs, active, onChange }) {
 return (
 <div className="hfos-tabs"style={{
 display:'flex', gap: 4, background: t.color.bgSoft, padding: 4, borderRadius: t.radius.md,
 marginBottom: t.space.lg, overflowX:'auto', scrollbarWidth:'none',
 }}>
 {tabs.map(tab => (
 <button key={tab.key}
 onClick={() => onChange(tab.key)}
 style={{
 flex: 1, minWidth:'max-content', padding:'10px 16px', border:'none',
 background: active === tab.key ? t.color.bgCard :'transparent',
 color: active === tab.key ? t.color.gold : t.color.textDim,
 fontWeight: 600, fontFamily:'inherit', fontSize: t.font.sm, cursor:'pointer',
 borderRadius: t.radius.sm, transition: t.transition, whiteSpace:'nowrap',
 }}
 >{tab.label}</button>
 ))}
 <style>{`.hfos-tabs::-webkit-scrollbar { display: none; }`}</style>
 </div>
 )
}

export function ProgressBar({ value, max = 100, color, style }) {
 const pct = Math.min(100, Math.max(0, (value/max)*100))
 const c = color || t.color.gold
 return (
 <div style={{ background: t.color.bgSoft, height: 8, borderRadius: 4, overflow:'hidden', ...style }}>
 <div style={{ background: c, width: `${pct}%`, height:'100%', transition:'width .4s ease', borderRadius: 4 }} />
 </div>
 )
}

export function Ring({ value, max = 100, size = 90, stroke = 8, color, label, sublabel }) {
 const pct = Math.min(100, Math.max(0, (value/max)*100))
 const r = (size - stroke) / 2
 const circ = 2 * Math.PI * r
 const c = color || t.color.gold
 return (
 <div style={{ position:'relative', width:size, height:size }}>
 <svg width={size} height={size} style={{ transform:'rotate(-90deg)'}}>
 <circle cx={size/2} cy={size/2} r={r} stroke={t.color.bgSoft} strokeWidth={stroke} fill="none"/>
 <circle cx={size/2} cy={size/2} r={r} stroke={c} strokeWidth={stroke} fill="none"
 strokeDasharray={circ} strokeDashoffset={circ - (circ*pct/100)} strokeLinecap="round"
 style={{ transition:'stroke-dashoffset .6s ease'}} />
 </svg>
 <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
 <div style={{ fontWeight:800, fontSize: t.font.lg, color: t.color.text }}>{label}</div>
 {sublabel && <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{sublabel}</div>}
 </div>
 </div>
 )
}

export function Modal({ open, onClose, title, children, width = 520 }) {
 if (!open) return null
 return (
 <div onClick={onClose} style={{
 position:'fixed', inset:0, background:'rgba(0,0,0,.88)', backdropFilter:'blur(14px)',
 WebkitBackdropFilter:'blur(14px)',
 display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000, padding: 16,
 }}>
 <div onClick={e=>e.stopPropagation()} style={{
 background: t.color.bgElevated, border:`1px solid ${t.color.border}`, borderRadius: t.radius.lg,
 padding: t.space.xl, width:'100%', maxWidth: width, maxHeight:'90vh', overflowY:'auto', boxShadow: t.shadow.lg,
 }}>
 {title && (
 <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: t.space.lg }}>
 <h3 style={{ fontSize: t.font.xl, fontWeight:700, color: t.color.text }}>{title}</h3>
 <button onClick={onClose} style={{ background:'none', border:'none', color:t.color.textDim, fontSize:24, cursor:'pointer' }}>×</button>
 </div>
 )}
 {children}
 </div>
 </div>
 )
}
