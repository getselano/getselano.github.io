import React, { useState, useEffect, useMemo } from 'react'
import { t } from '../../../theme/tokens'
import { Card, Button, Input, Select, Modal, ProgressBar } from '../../../components/ui/UI'
import { Sparkline } from '../../../components/charts/Charts'
import { Kicker, SectionHead, Label, Button as SButton } from '../../../design/components/primitives'
import { useAuth } from '../../../auth/AuthContext'
import { supabaseEnabled } from '../../../lib/supabase'
import { listAllMembers, memberEngagementSummary, adminSendPasswordRecovery, fetchHealthAck } from '../../../services/supabaseSync'
import { sendAccessLink } from '../../../services/pilot'
import { useI18n } from '../../../i18n/i18n'

// Real admin roster — reads live from Supabase profiles table.
// The old mockMembers demo is available behind a toggle for UI preview.

export function Members() {
  const { user } = useAuth()
  const { isRTL } = useI18n()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selected, setSelected] = useState(null)
  const [showDemo, setShowDemo] = useState(false)
  const [demoMembers, setDemoMembers] = useState([])

  // Real data from Supabase
  const [live, setLive] = useState([])
  const [engagement, setEngagement] = useState({ photos: {}, requests: {} })
  const [loading, setLoading] = useState(supabaseEnabled)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabaseEnabled) { setLoading(false); return }
    let mounted = true
    ;(async () => {
      try {
        const [members, eng] = await Promise.all([
          listAllMembers(),
          memberEngagementSummary(),
        ])
        if (!mounted) return
        setLive(members)
        setEngagement(eng)
      } catch (err) {
        console.error('[Members] load failed:', err)
        if (mounted) setError(err.message || (isRTL ? 'שגיאה בטעינת מתאמנים' : 'Failed to load members'))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (showDemo && !demoMembers.length) {
      import('../../../data/mockUsers').then(m => setDemoMembers(m.mockMembers))
    }
  }, [showDemo])

  const normalized = useMemo(() => {
    if (showDemo) return demoMembers
    return live.map(m => normalizeMember(m, engagement))
  }, [live, engagement, showDemo, demoMembers])

  const filtered = normalized.filter(m =>
    (!q || (m.name || '').toLowerCase().includes(q.toLowerCase()) || (m.email || '').toLowerCase().includes(q.toLowerCase())) &&
    (!statusFilter || m.status === statusFilter) &&
    (!roleFilter || m.role === roleFilter)
  )

  const counts = useMemo(() => ({
    total: normalized.length,
    active: normalized.filter(m => m.status === 'active').length,
    coaches: normalized.filter(m => m.role === 'coach').length,
    admins: normalized.filter(m => m.role === 'admin').length,
  }), [normalized])

  // Top referrers — who brought the most people
  const topReferrers = useMemo(() => {
    const counts = new Map()
    normalized.forEach(m => {
      if (!m.referredBy) return
      const cur = counts.get(m.referredBy) || { id: m.referredBy, name: m.referrerName || '—', count: 0 }
      cur.count += 1
      counts.set(m.referredBy, cur)
    })
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  }, [normalized])

  // Copy the trainee signup link — the admin can share it with new members
  const inviteLink = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
  const [copied, setCopied] = useState(false)
  const copyInvite = () => {
    navigator.clipboard?.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>

      {/* ─── Sport-Refined header card: real-time counters + invite link ─── */}
      <div style={{
        position: 'relative',
        borderRadius: t.radius.xl,
        overflow: 'hidden',
        border: `1px solid ${t.color.hairline}`,
        background: `linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.7) 100%), linear-gradient(160deg, ${t.color.panel2} 0%, ${t.color.charcoal} 100%)`,
        padding: '24px 24px 24px',
      }}>
        <div style={{
          position: 'absolute', top: '-30%', insetInlineEnd: '-20%',
          width: 340, height: 340,
          background: `radial-gradient(circle, ${t.color.wineGlow} 0%, transparent 55%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 2, marginBottom: 16 }}>
          <Kicker>{isRTL ? 'קונסולת מנהל' : 'Admin console'}</Kicker>
        </div>

        <div style={{ position: 'relative', zIndex: 2, marginBottom: 20 }}>
          <SectionHead size="h2" emphasis={counts.total
            ? `${counts.total} ${isRTL ? 'רשומים' : 'registered'}`
            : (isRTL ? 'עדיין ריק' : 'Empty so far')}>
            {isRTL ? 'המתאמנים שלך' : 'Your members'}
          </SectionHead>
        </div>

        {/* Live counters */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, background: t.color.border, borderRadius: t.radius.md, overflow: 'hidden',
          marginBottom: 20,
        }}>
          <CountCell label={isRTL ? 'סה״כ' : 'Total'} value={counts.total} />
          <CountCell label={isRTL ? 'פעילים' : 'Active'} value={counts.active} tone="wine" />
          <CountCell label={isRTL ? 'מאמנים' : 'Coaches'} value={counts.coaches} />
          <CountCell label={isRTL ? 'מנהלים' : 'Admins'} value={counts.admins} />
        </div>

        {/* Invite link */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
          padding: '12px 14px',
          background: t.color.charcoal,
          border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.md,
        }}>
          <Label color={t.color.silver3}>{isRTL ? 'קישור הזמנה' : 'Invite link'}</Label>
          <div style={{
            flex: 1, minWidth: 200,
            fontFamily: t.font.family.mono, fontSize: 12,
            color: t.color.silver1, letterSpacing: '-0.005em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            direction: 'ltr',
          }}>{inviteLink}</div>
          <SButton variant={copied ? 'quiet' : 'light'} size="sm" onClick={copyInvite}>
            {copied ? (isRTL ? 'הועתק' : 'Copied') : (isRTL ? 'העתק' : 'Copy')}
          </SButton>
        </div>
      </div>

      {/* Setup notice / demo toggle */}
      {!supabaseEnabled && (
        <NoticeBanner tone="warn">
          {isRTL
            ? 'Supabase לא מוגדר במערכת (VITE_SUPABASE_URL חסר). המתאמנים לא יסונכרנו בין מכשירים. הפעל "תצוגת דמו" כדי לראות את המבנה עם נתונים לדוגמה.'
            : 'Supabase is not configured (VITE_SUPABASE_URL missing). Members won\'t sync across devices. Turn on "Demo view" to preview the layout with sample data.'}
        </NoticeBanner>
      )}
      {supabaseEnabled && error && (
        <NoticeBanner tone="danger">
          {isRTL ? 'שגיאה בטעינה מ-Supabase: ' : 'Supabase load error: '}{error}
        </NoticeBanner>
      )}
      {supabaseEnabled && !loading && !error && normalized.length === 0 && !showDemo && (
        <NoticeBanner tone="info">
          {isRTL
            ? 'אין עדיין רשומות של מתאמנים. שלח את קישור ההזמנה, ומיד שהמתאמנים נרשמים הם יופיעו כאן.'
            : 'No members registered yet. Share the invite link — as soon as they sign up they\'ll appear here.'}
        </NoticeBanner>
      )}

      {/* Filters + demo toggle */}
      <div style={{
        background: t.color.panel, border: `1px solid ${t.color.border}`,
        borderRadius: t.radius.lg, padding: 14,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 10,
        }} className="hfos-grid-members">
          <Input placeholder={isRTL ? 'חפש לפי שם או מייל…' : 'Search by name or email…'} value={q} onChange={e => setQ(e.target.value)} />
          <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">{isRTL ? 'כל התפקידים' : 'All roles'}</option>
            <option value="member">{isRTL ? 'מתאמן' : 'Member'}</option>
            <option value="coach">{isRTL ? 'מאמן' : 'Coach'}</option>
            <option value="admin">{isRTL ? 'מנהל' : 'Admin'}</option>
          </Select>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{isRTL ? 'כל הסטטוסים' : 'All statuses'}</option>
            <option value="active">{isRTL ? 'פעיל' : 'Active'}</option>
            <option value="onboarding">{isRTL ? 'בתהליך' : 'Onboarding'}</option>
            <option value="idle">{isRTL ? 'לא פעיל' : 'Idle'}</option>
          </Select>
          <SButton
            variant={showDemo ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowDemo(v => !v)}
          >
            {showDemo ? (isRTL ? 'כבה דמו' : 'Hide demo') : (isRTL ? 'תצוגת דמו' : 'Demo view')}
          </SButton>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          padding: 40, textAlign: 'center',
          background: t.color.panel, border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.lg,
        }}>
          <Label color={t.color.silver2}>{isRTL ? 'טוען מתאמנים מ-Supabase…' : 'Loading members from Supabase…'}</Label>
        </div>
      )}

      {/* Top referrers — always visible so the admin sees the feature
          exists even when no one has referred anyone yet */}
      {!loading && (
        <div style={{
          background: `linear-gradient(160deg, rgba(199,64,80,0.08), ${t.color.panel} 70%)`,
          border: `1px solid rgba(199,64,80,0.35)`,
          borderRadius: t.radius.lg, padding: 16,
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 12, flexWrap:'wrap', gap: 8 }}>
            <Kicker color="wine">מובילי הפניות · Top Referrers</Kicker>
            <Label color={t.color.silver3}>מי הביא הכי הרבה חברים</Label>
          </div>
          {topReferrers.length > 0 ? (
            <div style={{ display:'flex', gap: 10, flexWrap:'wrap' }}>
              {topReferrers.map((r, i) => (
                <div key={r.id} style={{
                  display:'flex', alignItems:'center', gap: 8,
                  padding:'8px 14px',
                  background: t.color.bgSoft,
                  border: `1px solid ${i === 0 ? t.color.wineLight : t.color.border}`,
                  borderRadius: t.radius.pill,
                }}>
                  <span style={{
                    fontFamily: t.font.family.mono, fontSize: 10,
                    color: i === 0 ? t.color.wineLight : t.color.silver3, fontWeight: 700,
                  }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: t.color.white }}>{r.name}</span>
                  <span style={{
                    padding:'2px 8px', background: t.color.wineLight, color: t.color.white,
                    borderRadius: 999, fontFamily: t.font.family.mono, fontSize: 11, fontWeight: 700,
                  }}>{r.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '12px 4px',
              color: t.color.silver2, fontSize: t.font.sm, lineHeight: 1.55,
            }}>
              עדיין אף מתאמן לא הזמין חבר.
              <br />
              <span style={{ color: t.color.silver3, fontSize: 12 }}>
                כל מתאמן יכול לשתף קישור מהפרופיל שלו (כפתור "שתף חבר"). כשמישהו נכנס דרך הקישור ונרשם — הוא מסומן כמופנה, ומי שהזמין יופיע כאן.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Members table */}
      {!loading && filtered.length > 0 && (
        <div style={{
          background: t.color.panel, border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.lg, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${t.color.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          }}>
            <Kicker color="silver" dash={false}>{showDemo
              ? (isRTL ? 'תצוגת דמו' : 'Demo view')
              : (isRTL ? 'נתונים חיים' : 'Live data')}</Kicker>
            <Label color={t.color.silver3}>{filtered.length} {isRTL ? 'מתוך' : 'of'} {normalized.length}</Label>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
              <thead>
                <tr>
                  {(isRTL
                    ? ['מתאמן', 'תפקיד', 'מטרה', 'סטטוס', 'תמונות', 'הצטרף', 'פעולה']
                    : ['Member', 'Role', 'Goal', 'Status', 'Photos', 'Joined', 'Action']
                  ).map(h => (
                    <th key={h} style={{
                      textAlign: 'right', padding: '12px 16px',
                      fontFamily: t.font.family.mono, fontSize: 10,
                      letterSpacing: '0.24em', textTransform: 'uppercase',
                      color: t.color.silver3, fontWeight: 400,
                      borderBottom: `1px solid ${t.color.hairline}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <MemberRow key={m.id} member={m} onOpen={() => setSelected(m)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <MemberDrawer member={selected} onClose={() => setSelected(null)} />
      <style>{`@media (max-width: 900px) { .hfos-grid-members { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────

// Turn a raw Supabase profile row into the shape the UI expects.
function normalizeMember(row, engagement) {
  const photos = engagement.photos?.[row.id]?.count || 0
  const lastActivity = engagement.photos?.[row.id]?.last || row.updated_at || row.created_at
  const daysSinceActive = lastActivity ? daysBetween(new Date(lastActivity), new Date()) : null
  const daysSinceJoin = row.created_at ? daysBetween(new Date(row.created_at), new Date()) : 0

  // Simple status heuristic based on activity
  let status = 'onboarding'
  if (row.onboarded) status = 'active'
  if (daysSinceActive !== null && daysSinceActive > 21) status = 'idle'

  return {
    id: row.id,
    name: row.name || (row.email ? row.email.split('@')[0] : 'ללא שם'),
    email: row.email || '',
    phone: row.phone || '',
    role: row.role || 'member',
    status,
    onboarded: !!row.onboarded,
    age: row.age,
    sex: row.sex,
    weightKg: row.weight_kg,
    goal: goalLabel(row.goal_key),
    joinedDays: daysSinceJoin,
    lastActivityDays: daysSinceActive,
    photosCount: photos,
    createdAt: row.created_at,
    referredBy: row.referred_by || null,
    referrerName: row.referrer?.name || null,
  }
}

// Normalize an Israeli/intl phone to WhatsApp's format (972 country code, no + or spaces)
function normalizePhoneForWA(raw) {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return ''
  // Local Israeli (starts with 0) → strip leading 0, prefix 972
  if (/^0\d{8,9}$/.test(digits)) return '972' + digits.slice(1)
  // Already intl (starts with 972 or 1 or any other country) — return as-is
  if (digits.length >= 10) return digits
  return digits
}

const MEMBER_PHONE_KEY = (id) => `hfos:member_phone:${id}`

function daysBetween(a, b) {
  return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 86400000))
}

function goalLabel(key) {
  const map = {
    build_muscle: 'בניית שריר',
    lose_weight: 'ירידה במשקל',
    get_stronger: 'להתחזק',
    endurance: 'סיבולת',
    health: 'בריאות כללית',
    performance: 'ביצועים',
  }
  return map[key] || (key ? key : '—')
}

// ─── Row component ─────────────────────────────────────────
function MemberRow({ member, onOpen }) {
  const initials = (member.name || '?').trim().slice(0, 1).toUpperCase()
  const [sendState, setSendState] = useState('idle') // idle | sending | sent | error

  const quickSendLink = async (e) => {
    e.stopPropagation() // don't open the modal
    if (!member.email || sendState === 'sending') return
    setSendState('sending')
    const res = await sendAccessLink(member.email)
    setSendState(res.ok ? 'sent' : 'error')
    if (res.ok) {
      setTimeout(() => setSendState('idle'), 3500)
    } else {
      alert('שגיאה בשליחה: ' + (res.error || 'לא ידוע'))
      setSendState('idle')
    }
  }

  return (
    <tr
      onClick={onOpen}
      style={{
        cursor: 'pointer',
        borderBottom: `1px solid ${t.color.hairline}`,
        transition: 'background .12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = t.color.panel2}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: `linear-gradient(135deg, ${t.color.wineLight}, ${t.color.wine})`,
            color: t.color.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: t.font.family.display,
            fontWeight: 600, fontSize: 13,
            border: `1px solid rgba(255,255,255,0.08)`,
            flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: t.font.family.display, fontSize: 14,
              fontWeight: 600, color: t.color.white,
              letterSpacing: '-0.01em', marginBottom: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{member.name}</div>
            {member.email && (
              <div style={{
                fontFamily: t.font.family.mono, fontSize: 10,
                letterSpacing: '0.05em', color: t.color.silver3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                direction: 'ltr', textAlign: 'left',
              }}>{member.email}</div>
            )}
            {member.referrerName && (
              <div style={{
                fontSize: 10, color: t.color.wineLight,
                marginTop: 2, letterSpacing: '0.02em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>← הוזמן ע"י {member.referrerName}</div>
            )}
          </div>
        </div>
      </td>
      <td style={{ padding: '14px 16px' }}>
        <RoleTag role={member.role} />
      </td>
      <td style={{
        padding: '14px 16px', fontSize: 13, color: t.color.silver1,
        letterSpacing: '-0.005em',
      }}>{member.goal}</td>
      <td style={{ padding: '14px 16px' }}>
        <StatusTag status={member.status} />
      </td>
      <td style={{
        padding: '14px 16px',
        fontFamily: t.font.family.mono, fontSize: 11,
        color: t.color.silver1, fontVariantNumeric: 'tabular-nums',
      }}>{member.photosCount || '—'}</td>
      <td style={{ padding: '14px 16px' }}>
        <Label color={t.color.silver2}>
          {member.joinedDays === 0 ? 'היום'
            : member.joinedDays === 1 ? 'אתמול'
            : `${member.joinedDays} ימים`}
        </Label>
      </td>
      <td style={{ padding: '14px 16px', textAlign: 'left' }} onClick={e => e.stopPropagation()}>
        <button
          onClick={quickSendLink}
          disabled={!member.email || sendState === 'sending'}
          title={member.email ? 'שלח קישור כניסה למייל' : 'אין מייל רשום'}
          style={{
            padding: '6px 12px',
            background: sendState === 'sent' ? 'rgba(74,156,106,0.15)'
              : sendState === 'sending' ? t.color.bgSoft
              : 'transparent',
            border: `1px solid ${sendState === 'sent' ? '#4a9c6a'
              : sendState === 'sending' ? t.color.border
              : t.color.wineLight}`,
            color: sendState === 'sent' ? '#7fce9a'
              : sendState === 'sending' ? t.color.silver2
              : t.color.wineLight,
            borderRadius: t.radius.sm,
            cursor: member.email && sendState !== 'sending' ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
            whiteSpace: 'nowrap',
            opacity: !member.email ? 0.4 : 1,
          }}
        >{sendState === 'sending' ? 'שולח...'
          : sendState === 'sent' ? 'נשלח'
          : 'שלח קישור'}</button>
      </td>
    </tr>
  )
}

function RoleTag({ role }) {
  const map = {
    admin: { label: 'מנהל', color: t.color.wineLight },
    coach: { label: 'מאמן', color: t.color.silver1 },
    member: { label: 'מתאמן', color: t.color.silver2 },
  }
  const cfg = map[role] || map.member
  return (
    <span style={{
      display: 'inline-block',
      padding: '4px 10px',
      background: 'transparent',
      border: `1px solid ${cfg.color}`,
      color: cfg.color,
      borderRadius: t.radius.pill,
      fontFamily: t.font.family.mono, fontSize: 9,
      letterSpacing: '0.22em', textTransform: 'uppercase',
    }}>{cfg.label}</span>
  )
}

function StatusTag({ status }) {
  const map = {
    active: { label: 'פעיל', color: t.color.success },
    onboarding: { label: 'בתהליך', color: t.color.silver1 },
    idle: { label: 'לא פעיל', color: t.color.warning },
    paused: { label: 'מושהה', color: t.color.warning },
  }
  const cfg = map[status] || map.onboarding
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: t.font.family.mono, fontSize: 10,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: cfg.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

function CountCell({ label, value, tone }) {
  return (
    <div style={{
      padding: '14px 12px',
      background: t.color.panel,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 9,
        letterSpacing: '0.24em', color: t.color.silver3,
        textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontFamily: t.font.family.display,
        fontSize: 26, fontWeight: 600,
        letterSpacing: '-0.03em', lineHeight: 1,
        color: tone === 'wine' ? t.color.wineLight : t.color.white,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
    </div>
  )
}

function NoticeBanner({ tone, children }) {
  const border = tone === 'danger' ? t.color.danger
                : tone === 'warn'  ? t.color.warning
                : tone === 'info'  ? t.color.wineLight
                : t.color.border
  return (
    <div style={{
      padding: '14px 16px',
      background: t.color.panel,
      border: `1px solid ${border}`,
      borderRadius: t.radius.md,
      color: t.color.silver1,
      fontSize: 13, lineHeight: 1.5,
      letterSpacing: '-0.005em',
    }}>{children}</div>
  )
}

// ─── Drawer for member detail ─────────────────────────────
function MemberDrawer({ member, onClose }) {
  const { setViewAs } = useAuth()
  if (!member) return null

  // Password recovery action state
  const [resetState, setResetState] = useState({ status: 'idle', message: '' })

  // Health-acknowledgment record — resolves once the drawer opens
  const [ackState, setAckState] = useState({ loading: true, record: null })
  const [ackModal, setAckModal] = useState(false)
  useEffect(() => {
    let alive = true
    setAckState({ loading: true, record: null })
    fetchHealthAck(member.id).then(r => {
      if (alive) setAckState({ loading: false, record: r })
    })
    return () => { alive = false }
  }, [member.id])

  // ── Contact actions ──
  // Try stored phone → localStorage fallback → prompt admin once (and remember)
  const getPhoneForMember = () => {
    if (member.phone) return member.phone
    try {
      const stored = localStorage.getItem(MEMBER_PHONE_KEY(member.id))
      if (stored) return stored
    } catch {}
    const entered = prompt(`אין מספר טלפון שמור ל־${member.name}. הזן/י מספר (למשל 0501234567):`)
    if (entered && entered.trim()) {
      try { localStorage.setItem(MEMBER_PHONE_KEY(member.id), entered.trim()) } catch {}
      return entered.trim()
    }
    return null
  }

  const sendWhatsApp = () => {
    const raw = getPhoneForMember()
    if (!raw) return
    const phone = normalizePhoneForWA(raw)
    if (!phone) { alert('מספר טלפון לא תקין.'); return }
    const greeting = `היי ${member.name?.split(' ')[0] || ''}, מה נשמע?`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(greeting)}`
    window.open(url, '_blank', 'noopener')
  }

  const sendEmail = () => {
    if (!member.email) { alert('אין מייל רשום למתאמן/ת.'); return }
    const subject = 'מ־Selano'
    const body = `היי ${member.name?.split(' ')[0] || ''},\n\n`
    window.location.href = `mailto:${member.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const scheduleMeeting = () => {
    // Google Calendar deep-link with pre-filled event
    const title = `פגישה עם ${member.name}`
    const details = member.email
      ? `אימון/סקירת התקדמות עם ${member.name} (${member.email})`
      : `אימון/סקירת התקדמות עם ${member.name}`
    // Default to tomorrow 10:00–11:00 local time — coach adjusts in Calendar
    const now = new Date()
    now.setDate(now.getDate() + 1)
    now.setHours(10, 0, 0, 0)
    const end = new Date(now.getTime() + 60 * 60 * 1000)
    const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')
    const url = new URL('https://calendar.google.com/calendar/render')
    url.searchParams.set('action', 'TEMPLATE')
    url.searchParams.set('text', title)
    url.searchParams.set('details', details)
    url.searchParams.set('dates', `${fmt(now)}/${fmt(end)}`)
    if (member.email) url.searchParams.set('add', member.email)
    window.open(url.toString(), '_blank', 'noopener')
  }

  const viewAsMember = () => {
    // Uses existing view-as switcher — closes drawer and switches the app
    // into member view so the admin sees the trainee's screens.
    setViewAs('member')
    onClose()
  }
  const sendMagicLink = async () => {
    if (!member.email) {
      setResetState({ status: 'error', message: 'למתאמן/ת אין מייל רשום — אי אפשר לשלוח קישור.' })
      return
    }
    setResetState({ status: 'sending', message: '' })
    const res = await sendAccessLink(member.email)
    setResetState({
      status: res.ok ? 'ok' : 'error',
      message: res.ok
        ? `קישור כניסה נשלח ל־${member.email}. תוקף שעה — לחיצה מכניסה ישר לאפליקציה בלי סיסמה.`
        : `שגיאה בשליחה: ${res.error || 'לא ידוע'}`,
    })
  }

  const sendReset = async () => {
    if (!member.email) {
      setResetState({ status: 'error', message: 'למתאמן/ת אין מייל רשום — אי אפשר לשלוח איפוס.' })
      return
    }
    setResetState({ status: 'sending', message: '' })
    const res = await adminSendPasswordRecovery(member.email)
    setResetState({ status: res.ok ? 'ok' : 'error', message: res.message || 'לא התקבלה תגובה מהשרת.' })
  }
  const copyInvite = async () => {
    const link = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : ''
    await navigator.clipboard?.writeText(link)
    setResetState({ status: 'copied', message: 'קישור ההזמנה הועתק — הדבק בהודעה למתאמן.' })
    setTimeout(() => setResetState({ status: 'idle', message: '' }), 2500)
  }

  // Seed-based synthetic charts for demo members (no real workout log yet)
  const seed = String(member.id).charCodeAt(1) || 3
  const rand = (i) => Math.abs(Math.sin(seed * 12.9898 + i * 78.233)) % 1
  const weight = member.weightKg || 75
  const adherence = member.adherence || (member.status === 'active' ? 78 : 42)
  const mood = member.mood || 7
  const weightSeries = Array.from({ length: 12 }, (_, i) => +(weight + (rand(i)-0.5)*3).toFixed(1))
  const adherenceSeries = Array.from({ length: 8 }, (_, i) => Math.min(100, Math.max(30, adherence + Math.round((rand(i+5)-0.5)*20))))
  const moodSeries = Array.from({ length: 14 }, (_, i) => Math.min(10, Math.max(2, Math.round(mood + (rand(i+10)-0.5)*3))))

  return (
    <Modal open={!!member} onClose={onClose} title={member.name} width={800}>
      <div style={{ display: 'grid', gap: 20 }}>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', paddingBottom: 12,
          borderBottom: `1px solid ${t.color.border}`,
        }}>
          <Kicker>{member.role === 'admin' ? 'מנהל' : member.role === 'coach' ? 'מאמן' : 'מתאמן'}</Kicker>
          <Label color={t.color.silver2}>
            {member.email || `נרשם לפני ${member.joinedDays} ימים`}
          </Label>
        </div>

        {/* Meta stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, background: t.color.border, borderRadius: t.radius.md, overflow: 'hidden',
        }} className="hfos-member-stats">
          <MiniStat label="גיל" value={member.age || '—'} />
          <MiniStat label="משקל" value={member.weightKg ? `${member.weightKg}` : '—'} unit={member.weightKg ? 'ק״ג' : ''} />
          <MiniStat label="הצטרף" value={member.joinedDays} unit="יום" />
          <MiniStat label="תמונות" value={member.photosCount || 0} />
        </div>

        {/* Trends (mock for now — real data once workout logs sync) */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
        }} className="hfos-member-charts">
          <TrendCard title="משקל" data={weightSeries} unit="ק״ג" sub="12 שבועות" />
          <TrendCard title="דבקות" data={adherenceSeries} unit="%" sub="8 שבועות" />
          <TrendCard title="מצב רוח" data={moodSeries} unit="/10" sub="14 ימים" />
        </div>

        {/* Summary rows */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          <SummaryRow label="מטרה" value={member.goal} />
          <SummaryRow label="סטטוס" value={
            <StatusTag status={member.status} />
          } />
          <SummaryRow label="מייל" value={member.email || '—'} mono />
          <SummaryRow label="פעילות אחרונה" value={
            member.lastActivityDays === null ? '—'
            : member.lastActivityDays === 0 ? 'היום'
            : `לפני ${member.lastActivityDays} ימים`
          } />
        </div>

        {/* Recommendations */}
        <div style={{
          padding: 16, background: t.color.panel,
          border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.lg,
        }}>
          <div style={{ marginBottom: 8 }}>
            <Kicker color="wine">המלצת המנוע</Kicker>
          </div>
          <div style={{
            fontSize: 14, color: t.color.silver1, lineHeight: 1.6,
            letterSpacing: '-0.005em',
          }}>
            {coachRecommendation(member)}
          </div>
        </div>

        {/* Health-acknowledgment status — signed? when? name? signature? */}
        <div style={{
          padding: 16,
          background: ackState.record
            ? `linear-gradient(160deg, rgba(127,206,154,0.06), ${t.color.panel} 70%)`
            : `linear-gradient(160deg, rgba(255,120,80,0.08), ${t.color.panel} 70%)`,
          border: `1px solid ${ackState.record ? 'rgba(127,206,154,0.35)' : 'rgba(255,120,80,0.4)'}`,
          borderRadius: t.radius.lg,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8,
          }}>
            <Kicker color={ackState.record ? 'silver' : 'wine'}>הצהרת בריאות + תקנון</Kicker>
            <Label color={t.color.silver3}>Signed declaration</Label>
          </div>

          {ackState.loading ? (
            <div style={{ color: t.color.silver3, fontSize: 12 }}>טוען…</div>
          ) : ackState.record ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', background: 'rgba(127,206,154,0.15)',
                  border: '1px solid rgba(127,206,154,0.55)',
                  borderRadius: 999, color: '#7fce9a',
                  fontFamily: t.font.family.mono, fontSize: 11,
                  letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
                }}>חתום/ה</span>
                <span style={{ color: t.color.silver1, fontSize: 13 }}>
                  <b style={{ color: t.color.white }}>{ackState.record.signerName || member.name}</b>
                </span>
                <span style={{ color: t.color.silver2, fontSize: 12 }}>
                  · {new Date(ackState.record.confirmedAt).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <SButton
                variant="ghost"
                onClick={() => setAckModal(true)}
              >צפה בחתימה ובמסמך המלא</SButton>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{
                display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 6,
                padding: '5px 12px', background: 'rgba(255,120,80,0.15)',
                border: '1px solid rgba(255,120,80,0.55)',
                borderRadius: 999, color: '#ff8858',
                fontFamily: t.font.family.mono, fontSize: 11,
                letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700,
              }}>לא חתום/ה</span>
              <div style={{ color: t.color.silver2, fontSize: 12, lineHeight: 1.55 }}>
                המתאמן/ת עוד לא חתם/ה על הצהרת הבריאות והתקנון. הכניסה הבאה תחייב חתימה — לא ניתן לגשת לשום מסך בלי חתימה.
              </div>
            </div>
          )}
        </div>

        {ackModal && ackState.record && (
          <Modal open={ackModal} onClose={() => setAckModal(false)} title={`חתימה — ${ackState.record.signerName || member.name}`} width={720}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <SummaryRow label="שם החותם" value={ackState.record.signerName || '—'} />
                <SummaryRow label="תאריך" value={new Date(ackState.record.confirmedAt).toLocaleString('he-IL')} />
                <SummaryRow label="גרסת מסמך" value={ackState.record.documentVersion || '—'} mono />
                <SummaryRow label="שפה" value={ackState.record.lang || '—'} mono />
              </div>
              {ackState.record.signatureDataUrl && (
                <div style={{
                  background: '#fff', border: `1px solid ${t.color.border}`,
                  borderRadius: t.radius.md, padding: 16, textAlign: 'center',
                }}>
                  <div style={{
                    fontFamily: t.font.family.mono, fontSize: 9,
                    letterSpacing: '0.24em', color: '#666', textTransform: 'uppercase',
                    fontWeight: 700, marginBottom: 8,
                  }}>Signature · חתימה</div>
                  <img src={ackState.record.signatureDataUrl} alt="signature" style={{ maxWidth: '100%', maxHeight: 220 }} />
                </div>
              )}
              {ackState.record.userAgent && (
                <div style={{
                  fontFamily: t.font.family.mono, fontSize: 10,
                  color: t.color.silver3, letterSpacing: '0.04em',
                  padding: '8px 12px', background: t.color.bgSoft, borderRadius: t.radius.sm,
                  wordBreak: 'break-all',
                }}>UA: {ackState.record.userAgent}</div>
              )}
              {ackState.record.signedDocumentText && (
                <details style={{
                  background: t.color.panel, border: `1px solid ${t.color.border}`,
                  borderRadius: t.radius.md, padding: 12,
                }}>
                  <summary style={{
                    cursor: 'pointer', color: t.color.silver1, fontSize: 13, fontWeight: 700,
                  }}>המסמך המלא שנחתם ({ackState.record.signedDocumentText.length.toLocaleString()} תווים)</summary>
                  <pre style={{
                    marginTop: 10, whiteSpace: 'pre-wrap', direction: 'rtl',
                    fontFamily: t.font.family.body, fontSize: 12, color: t.color.silver1,
                    lineHeight: 1.55, maxHeight: 400, overflowY: 'auto',
                  }}>{ackState.record.signedDocumentText}</pre>
                </details>
              )}
            </div>
          </Modal>
        )}

        {/* Account actions — send recovery / copy invite */}
        <div style={{
          padding: 16, background: t.color.panel,
          border: `1px solid ${t.color.border}`, borderRadius: t.radius.lg,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', marginBottom: 12,
          }}>
            <Kicker color="wine">גישה לחשבון</Kicker>
            <Label color={t.color.silver3}>שליחה למייל של המתאמן/ת</Label>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <SButton
              variant="primary"
              onClick={sendMagicLink}
              disabled={resetState.status === 'sending' || !member.email}
            >
              {resetState.status === 'sending' ? 'שולח…' : 'שלח קישור כניסה למייל'}
            </SButton>
            <SButton
              variant="ghost"
              onClick={sendReset}
              disabled={resetState.status === 'sending' || !member.email}
            >
              איפוס סיסמה
            </SButton>
            <SButton variant="ghost" onClick={copyInvite}>
              העתק קישור הזמנה
            </SButton>
          </div>

          {resetState.message && (
            <div style={{
              marginTop: 12, padding: '10px 12px',
              borderRadius: t.radius.sm,
              background: resetState.status === 'error' ? `${t.color.danger}18` : `${t.color.wineGlow}`,
              border: `1px solid ${resetState.status === 'error' ? t.color.danger : t.color.wineLight}`,
              color: resetState.status === 'error' ? t.color.danger : t.color.silver1,
              fontSize: 13, lineHeight: 1.5, letterSpacing: '-0.005em',
            }}>{resetState.message}</div>
          )}

          {!member.email && (
            <div style={{
              marginTop: 10,
              fontFamily: t.font.family.mono, fontSize: 10,
              letterSpacing: '0.14em', color: t.color.silver3,
              textTransform: 'uppercase',
            }}>אין מייל רשום — לא ניתן לשלוח איפוס</div>
          )}
        </div>

        {/* Contact + admin actions */}
        <div style={{
          paddingTop: 16, borderTop: `1px solid ${t.color.border}`,
          display: 'grid', gap: 10,
        }}>
          <div>
            <Kicker color="silver" dash={false}>שלח הודעה</Kicker>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <SButton variant="ghost" onClick={sendWhatsApp}>
              WhatsApp
            </SButton>
            <SButton variant="ghost" onClick={sendEmail} disabled={!member.email}>
              מייל
            </SButton>
            <SButton variant="ghost" onClick={scheduleMeeting}>
              קבע פגישה (Google Calendar)
            </SButton>
            <div style={{ flex: 1 }} />
            <SButton variant="light" onClick={viewAsMember}>
              צפה כמתאמן
            </SButton>
          </div>
          <div style={{
            fontFamily: t.font.family.mono, fontSize: 10,
            letterSpacing: '0.16em', color: t.color.silver3,
            textTransform: 'uppercase',
          }}>
            WhatsApp פותח שיחה חדשה · מייל דרך אפליקציית מייל ברירת המחדל · פגישה — טיוטה ב־Google Calendar
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .hfos-member-stats { grid-template-columns: 1fr 1fr !important; }
          .hfos-member-charts { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Modal>
  )
}

function TrendCard({ title, data, unit, sub }) {
  const last = data[data.length - 1]
  const first = data[0]
  const delta = last - first
  const pct = first ? Math.round((delta / first) * 100) : 0
  const positive = delta >= 0
  return (
    <div style={{
      padding: 16, background: t.color.panel,
      border: `1px solid ${t.color.border}`,
      borderRadius: t.radius.lg,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline', marginBottom: 10,
      }}>
        <Label color={t.color.silver2}>{title}</Label>
        <span style={{
          fontFamily: t.font.family.mono, fontSize: 10,
          color: positive ? t.color.success : t.color.warning,
          letterSpacing: '0.14em', fontVariantNumeric: 'tabular-nums',
        }}>{positive ? '↑' : '↓'} {Math.abs(pct)}%</span>
      </div>
      <div style={{
        fontFamily: t.font.family.display,
        fontSize: 26, fontWeight: 500,
        letterSpacing: '-0.03em', color: t.color.white,
        fontVariantNumeric: 'tabular-nums',
        marginBottom: 8, lineHeight: 1,
      }}>
        {last}
        <span style={{
          fontFamily: t.font.family.body, fontSize: 12,
          color: t.color.silver2, marginInlineStart: 4, fontWeight: 500,
          letterSpacing: '-0.01em',
        }}>{unit}</span>
      </div>
      <Sparkline data={data} height={36} color={t.color.wineLight} />
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 9,
        color: t.color.silver3, marginTop: 6,
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>{sub}</div>
    </div>
  )
}

function coachRecommendation(m) {
  if (m.status === 'idle') return `${m.name} לא פעיל ${m.lastActivityDays} ימים. שלח הודעה אישית — לפעמים מספיק "מה נשמע" כדי להחזיר. אם אין תגובה תוך שבוע, קבע פגישת ריענון.`
  if (!m.onboarded) return `${m.name} טרם השלים את תהליך הרישום. שלח לו את הקישור שוב או עזור לו בשלבים הראשונים.`
  if (m.photosCount === 0) return `${m.name} עדיין לא העלה תמונות התקדמות. הזכר לו — תמונות קדם/אחרי הן הכלי החזק ביותר לשמור מוטיבציה.`
  return `${m.name} על מסלול טוב. המשך במה שעובד. פגישה חודשית להערכת התקדמות תספיק.`
}

function MiniStat({ label, value, unit }) {
  return (
    <div style={{
      padding: 14, background: t.color.panel, textAlign: 'center',
    }}>
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 9,
        letterSpacing: '0.24em', color: t.color.silver3,
        textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</div>
      <div style={{
        fontFamily: t.font.family.display,
        fontSize: 20, fontWeight: 600,
        letterSpacing: '-0.025em', color: t.color.white,
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>
        {value}
        {unit && <span style={{
          fontFamily: t.font.family.body, fontSize: 11,
          color: t.color.silver2, marginInlineStart: 3,
          fontWeight: 500, letterSpacing: '-0.01em',
        }}>{unit}</span>}
      </div>
    </div>
  )
}

function SummaryRow({ label, value, mono }) {
  return (
    <div style={{
      padding: '12px 14px',
      background: t.color.panel,
      border: `1px solid ${t.color.border}`,
      borderRadius: t.radius.md,
    }}>
      <div style={{ marginBottom: 4 }}>
        <Label color={t.color.silver3}>{label}</Label>
      </div>
      <div style={{
        fontFamily: mono ? t.font.family.mono : t.font.family.body,
        fontSize: mono ? 12 : 14,
        color: t.color.white,
        fontWeight: mono ? 400 : 500,
        letterSpacing: mono ? '0.02em' : '-0.005em',
        direction: mono ? 'ltr' : 'inherit',
        textAlign: mono ? 'left' : 'inherit',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{value}</div>
    </div>
  )
}
