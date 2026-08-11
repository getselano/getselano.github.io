import React from 'react'
import { t } from '../../../theme/tokens'
import { Card, Badge, SectionHeader, Button, ProgressBar } from '../../../components/ui/UI'
import { mockTeam } from '../../../data/mockUsers'

export function Team() {
 return (
 <div style={{ display:'grid', gap: 16 }}>
 <SectionHeader title="צוות"subtitle={`${mockTeam.length} אנשי צוות פעילים`} action={<Button icon="+">הוסף איש צוות</Button>} />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
 {mockTeam.map(m => (
 <Card key={m.id} hover style={{ padding: 20 }}>
 <div style={{ display:'flex', alignItems:'center', gap: 12, marginBottom: 14 }}>
 <div style={{ width: 48, height: 48, borderRadius:'50%', background: t.color.gold, color:'#0d0d14', display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 800, fontSize: 18 }}>{m.name[0]}</div>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 700, fontSize: t.font.lg }}>{m.name}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>{m.role} · {m.specialty}</div>
 </div>
 <Badge color={m.status === 'available'? t.color.success : t.color.warning}>
 {m.status === 'available'? 'פנוי':'בשיעור'}
 </Badge>
 </div>

 <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 8, marginBottom: 14, textAlign:'center'}}>
 <div style={{ padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color: t.color.gold }}>{m.activeMembers}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>מתאמנים</div>
 </div>
 <div style={{ padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color: t.color.success }}>{m.retention}%</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>שימור</div>
 </div>
 <div style={{ padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm }}>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color: t.color.info }}>{m.rating}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim }}>דירוג</div>
 </div>
 </div>

 <div style={{ marginBottom: 4, display:'flex', justifyContent:'space-between', fontSize: t.font.xs, color: t.color.textDim }}>
 <span>עומס השבוע</span><span>{m.hoursThisWeek}/40 שעות</span>
 </div>
 <ProgressBar value={m.hoursThisWeek} max={40} color={m.hoursThisWeek > 35 ? t.color.warning : t.color.gold} />
 </Card>
 ))}
 </div>
 </div>
 )
}
