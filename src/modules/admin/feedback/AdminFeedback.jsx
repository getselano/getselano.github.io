import React, { useEffect, useState, useMemo } from 'react'
import { t } from '../../../theme/tokens'
import { Card, Button, Badge, EmptyState } from '../../../components/ui/UI'
import { SLoader } from '../../../components/ui/SLoader'
import { listFeedback, markFeedbackRead, deleteFeedback } from '../../../services/supabaseSync'
import { supabaseEnabled } from '../../../lib/supabase'

// Admin viewer for the "דברו איתנו" feedback stream.
// Reads from Supabase `member_feedback` (falls back to any locally-queued
// items so nothing is lost). Marks-as-read on click, delete with confirm.

export function AdminFeedback() {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'unread'
  const [expanded, setExpanded] = useState(null)
  const [tableMissing, setTableMissing] = useState(false)

  const load = async () => {
    setLoading(true)
    const data = await listFeedback()
    setRows(data)
    setTableMissing(!!data?.tableMissing)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!rows) return []
    if (filter === 'unread') return rows.filter(r => !r.read_at && !r._local)
    return rows
  }, [rows, filter])

  const unreadCount = (rows || []).filter(r => !r.read_at && !r._local).length
  const totalCount = (rows || []).length

  const openRow = async (row) => {
    setExpanded(expanded?.id === row.id ? null : row)
    if (!row.read_at && !row._local) {
      await markFeedbackRead(row.id, true)
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, read_at: new Date().toISOString() } : r))
    }
  }

  const handleDelete = async (row) => {
    if (!confirm('למחוק את הפידבק לצמיתות?')) return
    await deleteFeedback(row.id)
    setRows(prev => prev.filter(r => r.id !== row.id))
    if (expanded?.id === row.id) setExpanded(null)
  }

  if (loading) {
    return (
      <Card style={{ padding: 40 }}>
        <SLoader size={96} label="טוען פידבקים" />
      </Card>
    )
  }

  if (!totalCount) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        {(tableMissing || !supabaseEnabled) && <SetupHint />}
        <EmptyState
          icon="💬"
          title="אין עדיין פידבקים"
          subtitle='כאשר מתאמנים ישלחו טקסט דרך "דברו איתנו" זה יופיע כאן'
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{
            fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.28em',
            color: t.color.wineLight, fontWeight: 700, textTransform: 'uppercase',
            marginBottom: 6,
          }}>Member feedback · דברו איתנו</div>
          <h2 style={{
            fontFamily: t.font.family.display, fontSize: 28, fontWeight: 700,
            letterSpacing: '-0.02em', color: t.color.white, margin: 0,
          }}>
            {totalCount} פידבקים
            {unreadCount > 0 && (
              <span style={{
                marginInlineStart: 12,
                fontFamily: t.font.family.mono, fontSize: 12,
                background: t.color.wineLight, color: t.color.white,
                padding: '3px 10px', borderRadius: 999,
                letterSpacing: '0.08em', fontWeight: 700,
              }}>{unreadCount} חדשים</span>
            )}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <FilterChip label="הכל" count={totalCount} active={filter === 'all'} onClick={() => setFilter('all')} />
          <FilterChip label="לא נקראו" count={unreadCount} active={filter === 'unread'} onClick={() => setFilter('unread')} />
          <Button variant="ghost" size="sm" onClick={load}>רענן ↻</Button>
        </div>
      </div>

      {(tableMissing || !supabaseEnabled) && <SetupHint />}

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: t.color.textDim }}>
            אין פידבקים בקטגוריה הזאת
          </div>
        ) : filtered.map((row) => (
          <FeedbackRow
            key={row.id}
            row={row}
            expanded={expanded?.id === row.id}
            onToggle={() => openRow(row)}
            onDelete={() => handleDelete(row)}
          />
        ))}
      </Card>
    </div>
  )
}

function FilterChip({ label, count, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: t.radius.pill,
      background: active ? t.color.wineLight : t.color.bgSoft,
      color: active ? t.color.white : t.color.silver1,
      border: `1px solid ${active ? t.color.wineLight : t.color.border}`,
      fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600, fontSize: 12,
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }}>
      {label}
      <span style={{ opacity: 0.7, fontFamily: t.font.family.mono, fontSize: 10 }}>{count}</span>
    </button>
  )
}

function FeedbackRow({ row, expanded, onToggle, onDelete }) {
  const unread = !row.read_at && !row._local
  const when = new Date(row.created_at)
  const dateLabel = when.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
  const timeLabel = when.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const senderName = row.user_name || row.user_email || 'אנונימי'
  const preview = (row.body || '').slice(0, 120)
  const needsMore = (row.body || '').length > 120

  return (
    <div style={{
      borderBottom: `1px solid ${t.color.hairline}`,
      background: unread ? 'rgba(199,64,80,0.04)' : 'transparent',
      transition: t.transition,
    }}>
      {/* Row header */}
      <button onClick={onToggle} style={{
        width: '100%', padding: '14px 18px', border: 'none',
        background: 'transparent', cursor: 'pointer', color: 'inherit',
        fontFamily: 'inherit', textAlign: 'right', direction: 'rtl',
        display: 'grid', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {unread && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: t.color.wineLight, flexShrink: 0,
            }} />
          )}
          <span style={{
            fontWeight: unread ? 700 : 500,
            fontSize: 14, color: unread ? t.color.white : t.color.text,
          }}>{senderName}</span>
          {row.user_email && row.user_name && (
            <span style={{ fontSize: 11, color: t.color.silver2 }}>· {row.user_email}</span>
          )}
          {row._local && <Badge color={t.color.warning}>לוקאלי</Badge>}
          <div style={{ marginInlineStart: 'auto', fontFamily: t.font.family.mono, fontSize: 10, color: t.color.silver3 }}>
            {dateLabel} · {timeLabel}
          </div>
        </div>
        <div style={{
          fontSize: 13, color: t.color.silver1, lineHeight: 1.6,
          paddingInlineStart: unread ? 18 : 0,
        }}>
          {expanded ? row.body : preview}{!expanded && needsMore ? '…' : ''}
        </div>
      </button>

      {expanded && (
        <div style={{
          padding: '4px 18px 16px', display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          {row.user_email && (
            <a
              href={`mailto:${row.user_email}?subject=${encodeURIComponent('תגובה על הפידבק שלך ב-Selano')}`}
              style={{
                padding: '6px 12px', background: t.color.bgSoft,
                border: `1px solid ${t.color.border}`, borderRadius: t.radius.sm,
                color: t.color.text, fontSize: 12, textDecoration: 'none',
                fontFamily: 'inherit',
              }}
            >שלח מייל</a>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete} style={{ color: t.color.danger, borderColor: t.color.danger }}>
            מחק
          </Button>
        </div>
      )}
    </div>
  )
}

function SetupHint() {
  return (
    <Card style={{
      padding: 16,
      background: `${t.color.warning}10`,
      border: `1px solid ${t.color.warning}`,
    }}>
      <div style={{ fontSize: 13, color: t.color.warning, fontWeight: 700, marginBottom: 6 }}>
        טבלת <code>member_feedback</code> בסופאבייס עדיין לא קיימת
      </div>
      <div style={{ fontSize: 12, color: t.color.silver1, lineHeight: 1.6 }}>
        עד שנוסיף אותה, פידבקים נשמרים לוקאלית בכל דפדפן ומופיעים כאן עם התג "לוקאלי".
        להפעלה הריצו ב-SQL Editor של Supabase:
      </div>
      <pre style={{
        marginTop: 10, padding: 12,
        background: t.color.bg, borderRadius: t.radius.sm,
        fontFamily: 'JetBrains Mono, Space Mono, monospace',
        fontSize: 11, color: t.color.silver1, direction: 'ltr',
        overflow: 'auto', lineHeight: 1.5,
      }}>{`create table member_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  user_name text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table member_feedback enable row level security;
create policy "members insert own"
  on member_feedback for insert
  with check (auth.uid() = user_id or user_id is null);
create policy "admins full access"
  on member_feedback for all
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin'));`}</pre>
    </Card>
  )
}
