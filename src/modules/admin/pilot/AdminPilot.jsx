import React, { useEffect, useState } from 'react'
import { t } from '../../../theme/tokens'
import { Card, Button, Badge, EmptyState } from '../../../components/ui/UI'
import { SLoader } from '../../../components/ui/SLoader'
import {
  fetchPilotStats, listWaitlist, releaseWaitlistedUser,
  updatePilotCap, buildReleaseEmail, sendAccessLink,
} from '../../../services/pilot'
import { supabaseEnabled } from '../../../lib/supabase'

// Admin view: pilot cap + waitlist management.

export function AdminPilot() {
  const [stats, setStats] = useState(null)
  const [waitlist, setWaitlist] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingCap, setEditingCap] = useState(false)
  const [newCap, setNewCap] = useState('')
  const [busy, setBusy] = useState(null)

  const load = async () => {
    setLoading(true)
    const [s, w] = await Promise.all([fetchPilotStats(), listWaitlist()])
    setStats(s); setWaitlist(w); setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleRelease = async (row) => {
    if (!stats || stats.active_count >= stats.active_cap) {
      alert(`אין מקום פנוי (${stats?.active_count}/${stats?.active_cap}). הגדל את הקפ לפני שחרור.`)
      return
    }
    if (!confirm(`לשחרר את ${row.name || row.email} לתוך המערכת ולשלוח לו מייל עם קישור כניסה?`)) return
    setBusy(row.id)
    const res = await releaseWaitlistedUser(row.id)
    setBusy(null)
    if (res.ok) {
      if (res.emailSent) {
        alert(`${res.name || 'המשתמש'} שוחרר.\nמייל עם קישור כניסה נשלח ל־${res.email}.`)
      } else {
        alert(`${res.name || 'המשתמש'} שוחרר.\n\nהערה: שליחת המייל האוטומטי נכשלה${res.emailError ? ` (${res.emailError})` : ''}.\nניתן לשלוח מייל ידני דרך כפתור "מייל" ברשימת המתאמנים.`)
      }
      await load()
    } else {
      alert('שגיאה בשחרור: ' + (res.error || 'לא ידוע'))
    }
  }

  const handleMail = (row) => {
    const url = buildReleaseEmail(row.email, row.name)
    if (url) window.open(url, '_blank')
  }

  const handleSendLink = async (row) => {
    if (!row.email) return
    if (!confirm(`לשלוח ל־${row.name || row.email} מייל עם קישור כניסה?\n(לא משנה סטטוס — רק שולח קישור נוסף)`)) return
    setBusy(row.id + ':link')
    const res = await sendAccessLink(row.email)
    setBusy(null)
    if (res.ok) {
      alert(`קישור כניסה נשלח ל־${row.email}`)
    } else {
      alert('שגיאה בשליחה: ' + (res.error || 'לא ידוע'))
    }
  }

  const handleSaveCap = async () => {
    const n = parseInt(newCap, 10)
    if (!Number.isFinite(n) || n < 1 || n > 10000) {
      alert('הכנס מספר בין 1 ל־10,000')
      return
    }
    const res = await updatePilotCap(n)
    if (res.ok) {
      setEditingCap(false)
      await load()
    } else {
      alert('שגיאה בעדכון: ' + (res.error || 'לא ידוע'))
    }
  }

  if (loading) return (
    <Card style={{ padding: 40 }}>
      <SLoader size={96} label="טוען סטטוס פיילוט" />
    </Card>
  )

  if (!supabaseEnabled) return (
    <Card style={{ padding: 30 }}>
      <EmptyState
        icon=""
        title="Supabase לא מחובר"
        subtitle="מערכת הפיילוט דורשת חיבור לסופאבייס"
      />
    </Card>
  )

  const pct = stats.active_cap > 0
    ? Math.min(100, Math.round((stats.active_count / stats.active_cap) * 100))
    : 0
  const isFull = stats.active_count >= stats.active_cap

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* Hero card */}
      <Card style={{
        padding: 24,
        background: `linear-gradient(160deg, rgba(199,64,80,0.10), ${t.color.bgElevated} 60%)`,
        border: `1px solid ${isFull ? t.color.wineLight : t.color.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{
              fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.28em',
              color: t.color.wineLight, fontWeight: 700, textTransform: 'uppercase',
              marginBottom: 8,
            }}>Pilot Status</div>
            <div style={{
              fontFamily: t.font.family.display, fontSize: 44, fontWeight: 800,
              color: t.color.white, letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {stats.active_count} <span style={{ color: t.color.silver2, fontSize: 28, fontWeight: 500 }}>/ {stats.active_cap}</span>
            </div>
            <div style={{ fontSize: 13, color: t.color.silver1, marginTop: 6 }}>
              מקומות תפוסים · {stats.waitlist_count} ברשימת המתנה
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {editingCap ? (
              <>
                <input
                  type="number"
                  value={newCap}
                  onChange={e => setNewCap(e.target.value)}
                  autoFocus
                  min={1} max={10000}
                  style={{
                    width: 80, padding: '8px 10px',
                    background: t.color.bgSoft, border: `1px solid ${t.color.border}`,
                    borderRadius: t.radius.sm, color: t.color.text,
                    fontFamily: 'inherit', fontSize: 14, textAlign: 'center',
                  }}
                />
                <Button size="sm" onClick={handleSaveCap}>שמור</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingCap(false)}>בטל</Button>
              </>
            ) : (
              <Button
                size="sm" variant="ghost"
                onClick={() => { setEditingCap(true); setNewCap(String(stats.active_cap)) }}
              >שנה קפ</Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: 20, height: 12,
          background: t.color.bgSoft, borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: isFull
              ? `linear-gradient(90deg, ${t.color.wineLight}, #c74050)`
              : `linear-gradient(90deg, ${t.color.wineLight}88, ${t.color.wineLight})`,
            transition: 'width 0.5s ease',
          }} />
        </div>

        <div style={{
          marginTop: 14, fontSize: 12, color: t.color.silver2,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{pct}% תפוסה</span>
          <span>{isFull ? 'הפיילוט מלא — הרשמות חדשות נכנסות להמתנה' : `${stats.active_cap - stats.active_count} מקומות פנויים`}</span>
        </div>
      </Card>

      {/* When full + waitlist non-empty, prompt to raise cap */}
      {isFull && waitlist.length > 0 && (
        <Card style={{
          padding: 14,
          background: `${t.color.wineLight}18`,
          border: `1px solid ${t.color.wineLight}`,
        }}>
          <div style={{ fontSize: 13, color: t.color.text, lineHeight: 1.6 }}>
            <b style={{ color: t.color.wineLight }}>הקפ מלא ויש {waitlist.length} ממתינים.</b>
            {' '}כדי לשחרר — הגדל את הקפ למעלה, ואז לחץ "שחרר" על מי שאתה רוצה להכניס.
            הגדלה בלבד לא מכניסה אנשים אוטומטית — השחרור נשאר בשליטתך.
          </div>
        </Card>
      )}

      {/* Waitlist */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${t.color.hairline}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
        }}>
          <div>
            <div style={{
              fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.24em',
              color: t.color.wineLight, fontWeight: 700, textTransform: 'uppercase',
              marginBottom: 4,
            }}>Waitlist</div>
            <div style={{
              fontFamily: t.font.family.display, fontSize: 22, fontWeight: 700,
              color: t.color.white,
            }}>רשימת המתנה · {waitlist.length}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={load}>רענן</Button>
        </div>

        {waitlist.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: t.color.silver2 }}>
            אין אנשים ברשימת ההמתנה כרגע
          </div>
        ) : waitlist.map(row => (
          <div key={row.id} style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${t.color.hairline}`,
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `${t.color.wineLight}22`, color: t.color.wineLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: t.font.family.display, fontWeight: 800, fontSize: 15,
              flexShrink: 0,
            }}>#{row.waitlist_position}</div>

            <div>
              <div style={{ fontWeight: 700, color: t.color.white, marginBottom: 2 }}>
                {row.name || '—'}
              </div>
              <div style={{ fontSize: 12, color: t.color.silver1 }}>
                {row.email} {row.phone ? `· ${row.phone}` : ''}
              </div>
              <div style={{ fontSize: 11, color: t.color.silver3, marginTop: 2, fontFamily: t.font.family.mono }}>
                נרשם: {row.waitlisted_at ? new Date(row.waitlisted_at).toLocaleDateString('he-IL') : '—'}
              </div>
            </div>

            <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
              {row.email && (
                <button
                  onClick={() => handleMail(row)}
                  title="שלח לו מייל (לא חובה)"
                  style={{
                    padding:'6px 10px',
                    background:'transparent',
                    border:`1px solid ${t.color.border}`,
                    borderRadius: t.radius.sm,
                    color: t.color.silver1, cursor:'pointer',
                    fontFamily:'inherit', fontSize: 11, fontWeight: 600,
                  }}
                >מייל</button>
              )}
              <Button
                size="sm"
                onClick={() => handleRelease(row)}
                disabled={busy === row.id || isFull}
                title={isFull ? 'הקפ מלא — הגדל את הקפ קודם' : 'שחרר משתמש זה'}
                style={{
                  background: isFull ? t.color.bgSoft : t.color.wineLight,
                  color: isFull ? t.color.silver3 : t.color.white,
                  border: `1px solid ${isFull ? t.color.border : t.color.wineLight}`,
                  cursor: isFull ? 'not-allowed' : 'pointer',
                  opacity: isFull ? 0.6 : 1,
                }}
              >{busy === row.id ? 'משחרר...' : isFull ? 'הקפ מלא' : 'שחרר ←'}</Button>
            </div>
          </div>
        ))}
      </Card>

      <div style={{
        padding: 14, background: t.color.bgSoft, borderRadius: t.radius.md,
        fontSize: 12, color: t.color.silver2, lineHeight: 1.6,
      }}>
        <b style={{ color: t.color.silver1 }}>איך זה עובד:</b> משתמש חדש שנרשם כשהקפ מלא — נכנס אוטומטית להמתנה. שחרור אפשרי <b>רק כשיש מקום פנוי</b>. כדי לפתוח מקום — הגדל את הקפ (כפתור "שנה קפ" למעלה), אז השחרור נפתח. לחיצה על "שחרר" מעדכנת את הסטטוס <b>ושולחת אוטומטית מייל עם Magic Link</b> — קישור שמכניס אותו ישר לאפליקציה בלי צורך בסיסמה. אם רוצים לשלוח טיוטה ידנית בנוסף — יש כפתור "מייל" ליד השורה.
      </div>
    </div>
  )
}
