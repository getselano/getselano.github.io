import React, { useEffect, useMemo, useState } from 'react'
import { t } from '../../../theme/tokens'
import { Card, Button, Input, Select, Badge } from '../../../components/ui/UI'
import { useAuth } from '../../../auth/AuthContext'
import { listAllMembers } from '../../../services/supabaseSync'
import {
  sendAdminMessage, listSentMessages, deleteAdminMessage,
  MESSAGE_CATEGORIES,
} from '../../../services/adminMessages'

// Admin-only. Compose panel + history of recently-sent messages.
// Broadcast (all members) or personal (specific member from picker).

export function SendMessageTab() {
  const { user } = useAuth()
  const [mode, setMode] = useState('broadcast')          // 'broadcast' | 'personal'
  const [category, setCategory] = useState('general')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [memberQuery, setMemberQuery] = useState('')
  const [targetMember, setTargetMember] = useState(null)  // {id, name, email}
  const [members, setMembers] = useState([])
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null)              // {type:'ok'|'err', message}
  const [history, setHistory] = useState([])

  // Load members + history on mount
  useEffect(() => {
    listAllMembers().then(rows => setMembers((rows || []).filter(r => r.role !== 'admin')))
    listSentMessages().then(setHistory)
  }, [])

  const filteredMembers = useMemo(() => {
    if (!memberQuery.trim()) return members.slice(0, 8)
    const q = memberQuery.trim().toLowerCase()
    return members.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    ).slice(0, 20)
  }, [members, memberQuery])

  const bodyLeft = 500 - body.length
  const canSend = !sending && body.trim().length > 0 && (mode === 'broadcast' || targetMember)

  const handleSend = async () => {
    setSending(true); setStatus(null)
    const result = await sendAdminMessage({
      title,
      body,
      category,
      targetUserId: mode === 'personal' ? targetMember?.id : null,
      senderName: user?.name || 'האדמין',
    })
    setSending(false)
    if (!result.ok) {
      const isMissing = /does not exist/i.test(result.error || '') || result.code === '42P01'
      setStatus({
        type: 'err',
        message: isMissing
          ? 'הטבלה admin_messages עדיין לא קיימת ב־Supabase. הרץ את ה־SQL שלמטה.'
          : (result.error || 'שליחה נכשלה'),
      })
      return
    }
    setStatus({
      type: 'ok',
      message: mode === 'broadcast'
        ? `נשלח לכל המתאמנים`
        : `נשלח ל־${targetMember.name || targetMember.email}`,
    })
    // Reset form (keep category so admin can send another quickly)
    setTitle(''); setBody(''); setTargetMember(null); setMemberQuery('')
    // Refresh history
    listSentMessages().then(setHistory)
    setTimeout(() => setStatus(null), 4000)
  }

  const handleDelete = async (id) => {
    if (!confirm('למחוק את ההודעה לצמיתות?')) return
    await deleteAdminMessage(id)
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  return (
    <div style={{ display:'grid', gap: 16 }}>
      {/* Composer */}
      <Card>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.28em',
          color: t.color.wineLight, fontWeight: 700, textTransform:'uppercase',
          marginBottom: 4,
        }}>שליחת הודעה · Send message</div>
        <div style={{
          fontFamily: t.font.family.display, fontSize: 22, fontWeight: 700,
          color: t.color.white, letterSpacing:'-0.02em', marginBottom: 20,
        }}>הודעה למתאמנים</div>

        {/* Target mode */}
        <div style={{ display:'flex', gap: 8, marginBottom: 14 }}>
          {[
            { key:'broadcast', label:'לכולם' },
            { key:'personal', label:'למתאמן ספציפי' },
          ].map(opt => {
            const active = mode === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => { setMode(opt.key); setStatus(null) }}
                style={{
                  flex: 1, padding:'12px 14px',
                  border: `1px solid ${active ? t.color.wineLight : t.color.border}`,
                  background: active ? `${t.color.wineLight}18` : t.color.bgSoft,
                  color: active ? t.color.white : t.color.silver1,
                  borderRadius: t.radius.md, cursor:'pointer',
                  fontFamily:'inherit', fontWeight: active ? 700 : 500, fontSize: 13,
                }}
              >{opt.label}</button>
            )
          })}
        </div>

        {/* Personal → member picker */}
        {mode === 'personal' && (
          <div style={{ marginBottom: 14 }}>
            {targetMember ? (
              <div style={{
                display:'flex', alignItems:'center', gap: 10,
                padding:'10px 14px', background: `${t.color.wineLight}18`,
                border:`1px solid ${t.color.wineLight}`, borderRadius: t.radius.sm,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: t.color.white, fontSize: 14 }}>
                    {targetMember.name || 'ללא שם'}
                  </div>
                  <div style={{ fontSize: 11, color: t.color.silver2 }}>
                    {targetMember.email}
                  </div>
                </div>
                <button onClick={() => setTargetMember(null)} style={{
                  background:'transparent', border:'none', color: t.color.textDim,
                  cursor:'pointer', fontSize: 20, padding: 4,
                }}>×</button>
              </div>
            ) : (
              <>
                <Input
                  label="חפש מתאמן (שם או מייל)"
                  value={memberQuery}
                  onChange={e => setMemberQuery(e.target.value)}
                  placeholder="הקלד לחיפוש…"
                />
                <div style={{
                  marginTop: 8, maxHeight: 200, overflowY:'auto',
                  border:`1px solid ${t.color.border}`, borderRadius: t.radius.sm,
                }}>
                  {filteredMembers.length === 0 ? (
                    <div style={{ padding: 20, textAlign:'center', color: t.color.textDim, fontSize: 12 }}>
                      לא נמצאו מתאמנים
                    </div>
                  ) : filteredMembers.map(m => (
                    <button key={m.id}
                      onClick={() => { setTargetMember(m); setMemberQuery('') }}
                      style={{
                        display:'block', width:'100%', textAlign:'right', direction:'rtl',
                        padding:'10px 14px', background:'transparent',
                        border:'none', borderBottom:`1px solid ${t.color.hairline}`,
                        color: t.color.text, cursor:'pointer', fontFamily:'inherit',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name || 'ללא שם'}</div>
                      <div style={{ fontSize: 11, color: t.color.silver2 }}>{m.email}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 6 }}>סיווג</div>
          <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
            {MESSAGE_CATEGORIES.map(c => {
              const active = category === c.key
              return (
                <button key={c.key}
                  onClick={() => setCategory(c.key)}
                  style={{
                    padding:'8px 14px', borderRadius: t.radius.pill,
                    border: `1px solid ${active ? c.color : t.color.border}`,
                    background: active ? `${c.color}22` : t.color.bgSoft,
                    color: active ? c.color : t.color.silver1,
                    cursor:'pointer', fontFamily:'inherit', fontSize: 12,
                    fontWeight: active ? 700 : 500,
                  }}>
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 12 }}>
          <Input
            label="כותרת (אופציונלי, עד 60 תווים)"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 60))}
            placeholder="למשל: אימון חדש שוחרר"
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: t.font.sm, color: t.color.textDim }}>גוף ההודעה *</div>
            <div style={{
              fontSize: 10, color: bodyLeft < 50 ? t.color.warning : t.color.textMuted,
              fontFamily: t.font.family.mono,
            }}>{bodyLeft} / 500</div>
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value.slice(0, 500))}
            rows={5}
            placeholder="תכתוב כאן את ההודעה שלך…"
            style={{
              width:'100%', padding:'12px 14px', background: t.color.bgSoft,
              border:`1px solid ${t.color.border}`, borderRadius: t.radius.sm,
              color: t.color.text, fontFamily:'inherit', fontSize: t.font.md,
              outline:'none', resize:'vertical', direction:'rtl',
              minHeight: 100,
            }}
          />
        </div>

        {/* Status */}
        {status && (
          <div style={{
            padding:'10px 12px', marginBottom: 12, borderRadius: t.radius.sm,
            background: status.type === 'ok' ? `${t.color.success}18` : `${t.color.danger}18`,
            border: `1px solid ${status.type === 'ok' ? t.color.success : t.color.danger}44`,
            color: status.type === 'ok' ? t.color.success : t.color.danger,
            fontSize: t.font.sm,
          }}>{status.message}</div>
        )}

        {/* Send */}
        <div style={{ display:'flex', gap: 10, justifyContent:'flex-end' }}>
          <Button onClick={handleSend} disabled={!canSend}>
            {sending ? 'שולח…' : 'שלח הודעה'}
          </Button>
        </div>
      </Card>

      {/* Sent history */}
      {history.length > 0 && (
        <Card>
          <div style={{
            fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.28em',
            color: t.color.wineLight, fontWeight: 700, textTransform:'uppercase',
            marginBottom: 12,
          }}>Sent · היסטוריה</div>
          <div style={{ display:'grid', gap: 8 }}>
            {history.slice(0, 20).map(msg => {
              const c = MESSAGE_CATEGORIES.find(x => x.key === msg.category) || MESSAGE_CATEGORIES[0]
              return (
                <div key={msg.id} style={{
                  padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm,
                  border:`1px solid ${t.color.hairline}`,
                  display:'flex', gap: 10, alignItems:'flex-start',
                }}>
                  <div style={{ fontSize: 18 }}>{c.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display:'flex', gap: 8, alignItems:'center', marginBottom: 4, flexWrap:'wrap' }}>
                      <Badge color={c.color}>{c.label}</Badge>
                      <Badge color={msg.target_user_id ? t.color.gold : t.color.success}>
                        {msg.target_user_id ? 'אישית' : 'לכולם'}
                      </Badge>
                      <div style={{ fontSize: 10, color: t.color.textMuted, marginInlineStart:'auto', fontFamily: t.font.family.mono }}>
                        {new Date(msg.created_at).toLocaleString('he-IL', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                    {msg.title && <div style={{ fontWeight: 700, color: t.color.text, fontSize: 13 }}>{msg.title}</div>}
                    <div style={{ color: t.color.silver1, fontSize: 12, lineHeight: 1.5, whiteSpace:'pre-wrap' }}>{msg.body}</div>
                  </div>
                  <button onClick={() => handleDelete(msg.id)} style={{
                    background:'transparent', border:'none', color: t.color.danger,
                    cursor:'pointer', fontSize: 12, padding: 4,
                  }}>מחק</button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* SQL setup hint (visible always so admin can copy easily) */}
      <Card style={{
        background: `${t.color.warning}0a`,
        border: `1px dashed ${t.color.warning}66`,
        fontSize: 12,
      }}>
        <div style={{ color: t.color.warning, fontWeight: 700, marginBottom: 8 }}>
          הגדרה חד־פעמית ב־Supabase
        </div>
        <div style={{ color: t.color.silver1, lineHeight: 1.6, marginBottom: 10 }}>
          לפני שההודעות עובדות, יש להריץ את ה־SQL הבא פעם אחת ב־SQL Editor של Supabase.
          זה יוצר את הטבלאות ומגדיר הרשאות (רק אדמין שולח, המתאמן קורא רק שלו + broadcast).
        </div>
        <pre style={{
          padding: 12, background: t.color.bg, borderRadius: t.radius.sm,
          fontFamily:'JetBrains Mono, Space Mono, monospace',
          fontSize: 10, color: t.color.silver2, direction:'ltr',
          overflow:'auto', lineHeight: 1.5, maxHeight: 240,
        }}>{`create table admin_messages (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text not null,
  category text default 'general',
  target_user_id uuid references auth.users(id) on delete cascade,
  sender_name text,
  created_at timestamptz not null default now()
);
create index on admin_messages (target_user_id, created_at desc);
alter table admin_messages enable row level security;
create policy "read own or broadcast" on admin_messages for select
  using (target_user_id = auth.uid() or target_user_id is null);
create policy "admin insert" on admin_messages for insert
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "admin update" on admin_messages for update
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
create policy "admin delete" on admin_messages for delete
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

create table admin_message_reads (
  message_id uuid references admin_messages(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);
alter table admin_message_reads enable row level security;
create policy "own reads" on admin_message_reads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());`}</pre>
      </Card>
    </div>
  )
}
