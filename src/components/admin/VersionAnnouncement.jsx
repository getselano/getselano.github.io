import React, { useEffect, useState } from 'react'
import { t } from '../../theme/tokens'
import { Card, Button, Modal } from '../ui/UI'
import { APP_VERSION, entryForVersion } from '../../data/appVersion'
import { sendAdminMessage } from '../../services/adminMessages'
import { useAuth } from '../../auth/AuthContext'

// When admin opens the dashboard and the app version has bumped since the
// last time they broadcast release notes, this asks whether to notify all
// members — pre-fills the release notes from CHANGELOG, admin taps
// "Broadcast" and it goes out as an admin_messages row (broadcast).

const LS_KEY = 'hfos:last_broadcast_version'

function getLast() { try { return localStorage.getItem(LS_KEY) } catch { return null } }
function setLast(v) { try { localStorage.setItem(LS_KEY, v) } catch {} }

// Simple semver-lite compare: '1.2.10' > '1.2.9'
function isNewer(a, b) {
  if (!b) return true
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0)
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0, y = pb[i] || 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

export function VersionAnnouncement() {
  const { user } = useAuth()
  const [entry, setEntry] = useState(null)
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [title, setTitle] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState(null) // 'ok' | 'err' | null

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    const last = getLast()
    if (!isNewer(APP_VERSION, last)) return
    const e = entryForVersion(APP_VERSION)
    if (!e) return
    setEntry(e)
    setTitle(e.title || '')
    setBody(e.body || '')
    setOpen(true)
  }, [user?.id])

  if (!entry) return null

  const handleBroadcast = async () => {
    setSending(true); setStatus(null)
    const result = await sendAdminMessage({
      title,
      body,
      category: entry.category || 'important',
      targetUserId: null,
      senderName: user?.name || 'סלאנו',
    })
    setSending(false)
    if (!result.ok) {
      setStatus('err')
      return
    }
    setLast(APP_VERSION)
    setStatus('ok')
    setTimeout(() => setOpen(false), 1200)
  }

  const handleSkip = () => {
    setLast(APP_VERSION) // don't ask again for this version
    setOpen(false)
  }

  return (
    <Modal open={open} onClose={handleSkip} title={`עדכון גרסה ${APP_VERSION}`} width={560}>
      <div style={{
        padding:'10px 14px', marginBottom: 14, borderRadius: t.radius.sm,
        background: `${t.color.gold}0f`, border: `1px solid ${t.color.gold}55`,
        fontSize: t.font.sm, color: t.color.silver1, lineHeight: 1.5,
      }}>
        זוהתה גרסה חדשה של האפליקציה שהמתאמנים עוד לא יודעים עליה.
        <br />
        <strong style={{ color: t.color.text }}>שדר להם מה חדש?</strong> ההודעה תוצג כטוסט
        בראש המסך שלהם ותישמר בפעמון להיסטוריה.
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 6 }}>כותרת</div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value.slice(0, 60))}
          style={{
            width:'100%', padding:'10px 12px', background: t.color.bgSoft,
            border:`1px solid ${t.color.border}`, borderRadius: t.radius.sm,
            color: t.color.text, fontFamily:'inherit', fontSize: t.font.md,
            direction:'rtl', outline:'none',
          }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: t.font.sm, color: t.color.textDim, marginBottom: 6 }}>גוף ההודעה</div>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value.slice(0, 500))}
          rows={8}
          style={{
            width:'100%', padding:'12px 14px', background: t.color.bgSoft,
            border:`1px solid ${t.color.border}`, borderRadius: t.radius.sm,
            color: t.color.text, fontFamily:'inherit', fontSize: t.font.md,
            outline:'none', resize:'vertical', direction:'rtl',
          }}
        />
        <div style={{ fontSize: 10, color: t.color.textMuted, marginTop: 4, fontFamily: t.font.family.mono }}>
          {500 - body.length} / 500
        </div>
      </div>

      {status === 'err' && (
        <div style={{
          padding:'10px 12px', marginBottom: 12, borderRadius: t.radius.sm,
          background: `${t.color.danger}18`, border: `1px solid ${t.color.danger}44`,
          color: t.color.danger, fontSize: t.font.sm,
        }}>שליחה נכשלה — ייתכן שהטבלה admin_messages עוד לא נוצרה ב־Supabase. פתח את מרכז בקרה → "שלח הודעה" וראה את ה־SQL.</div>
      )}
      {status === 'ok' && (
        <div style={{
          padding:'10px 12px', marginBottom: 12, borderRadius: t.radius.sm,
          background: `${t.color.success}18`, border: `1px solid ${t.color.success}44`,
          color: t.color.success, fontSize: t.font.sm, fontWeight: 700,
        }}>ההודעה נשלחה לכל המתאמנים.</div>
      )}

      <div style={{ display:'flex', gap: 10, justifyContent:'flex-end' }}>
        <Button variant="ghost" onClick={handleSkip}>דלג — אל תשאל שוב על גרסה זו</Button>
        <Button onClick={handleBroadcast} disabled={sending || !body.trim()}>
          {sending ? 'שולח…' : 'שדר לכל המתאמנים'}
        </Button>
      </div>
    </Modal>
  )
}
