import React, { useState, useEffect, useMemo } from 'react'
import { t } from '../../../theme/tokens'
import { Card, Badge, SectionHeader, ProgressBar, Modal } from '../../../components/ui/UI'
import { BarChart, DonutSegments } from '../../../components/charts/Charts'
import { supabaseEnabled } from '../../../lib/supabase'
import { listAllMembers, memberEngagementSummary } from '../../../services/supabaseSync'
import { useI18n } from '../../../i18n/i18n'
import { Kicker, SectionHead, Label } from '../../../design/components/primitives'
import { VersionAnnouncement } from '../../../components/admin/VersionAnnouncement'

// Real admin overview — every KPI is honest, sourced from Supabase (or clearly
// labeled as "not tracked yet"). Every KPI is clickable to open a breakdown
// modal explaining exactly what makes it up.

export function Overview() {
  const { isRTL } = useI18n()
  const [members, setMembers] = useState([])
  const [engagement, setEngagement] = useState({ photos: {}, requests: {} })
  const [loading, setLoading] = useState(supabaseEnabled)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null) // which KPI is being drilled into

  useEffect(() => {
    if (!supabaseEnabled) { setLoading(false); return }
    let mounted = true
    ;(async () => {
      try {
        const [m, e] = await Promise.all([listAllMembers(), memberEngagementSummary()])
        if (!mounted) return
        setMembers(m); setEngagement(e)
      } catch (err) {
        if (mounted) setError(err.message || 'load failed')
      } finally { if (mounted) setLoading(false) }
    })()
    return () => { mounted = false }
  }, [])

  // ── Honest derivations from real data ──
  const now = Date.now()
  const stats = useMemo(() => {
    if (!members.length) {
      return {
        total: 0, active: 0, onboarding: 0, idle: 0,
        newThisWeek: 0, newThisMonth: 0,
        coaches: 0, admins: 0,
        photosTotal: 0, membersWithPhotos: 0,
        requestsTotal: 0, requestsNew: 0,
      }
    }
    const isActive = (m) => m.onboarded && !isIdle(m)
    const isIdle = (m) => {
      const last = engagement.photos?.[m.id]?.last || m.updated_at || m.created_at
      if (!last) return true
      return (now - new Date(last).getTime()) / 86400000 > 21
    }
    const isOnboarding = (m) => !m.onboarded
    const daysAgo = (iso) => iso ? (now - new Date(iso).getTime()) / 86400000 : 999
    return {
      total: members.length,
      active: members.filter(isActive).length,
      onboarding: members.filter(isOnboarding).length,
      idle: members.filter(m => m.onboarded && isIdle(m)).length,
      newThisWeek: members.filter(m => daysAgo(m.created_at) <= 7).length,
      newThisMonth: members.filter(m => daysAgo(m.created_at) <= 30).length,
      coaches: members.filter(m => m.role === 'coach').length,
      admins: members.filter(m => m.role === 'admin').length,
      photosTotal: Object.values(engagement.photos || {}).reduce((s, x) => s + x.count, 0),
      membersWithPhotos: Object.keys(engagement.photos || {}).length,
      requestsTotal: Object.values(engagement.requests || {}).reduce((s, x) => s + x.count, 0),
      requestsNew: Object.values(engagement.requests || {}).filter(r => r.latestStatus === 'new').length,
    }
  }, [members, engagement])

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <VersionAnnouncement />
      {/* Header hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        borderRadius: t.radius.xl,
        border: `1px solid ${t.color.hairline}`,
        background: `linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.65) 100%), linear-gradient(160deg, ${t.color.panel2} 0%, ${t.color.charcoal} 100%)`,
        padding: '24px 24px 26px',
      }}>
        <div style={{
          position: 'absolute', top: '-30%', insetInlineEnd: '-20%',
          width: 340, height: 340,
          background: `radial-gradient(circle, ${t.color.wineGlow} 0%, transparent 55%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 2, marginBottom: 12 }}>
          <Kicker>{isRTL ? 'סקירה חיה' : 'Live overview'}</Kicker>
        </div>
        <SectionHead size="h2" style={{ position: 'relative', zIndex: 2 }} emphasis={loading
          ? (isRTL ? 'טוען…' : 'Loading…')
          : `${stats.total} ${isRTL ? 'רשומים' : 'members'}`}>
          {isRTL ? 'הסקירה שלך' : 'Your overview'}
        </SectionHead>
      </div>

      {/* Supabase warning */}
      {!supabaseEnabled && (
        <Notice tone="warn">
          {isRTL
            ? 'Supabase לא מוגדר — הנתונים במסך הזה יופיעו רק כשה־backend יחובר.'
            : 'Supabase is not configured — this dashboard populates once the backend is wired.'}
        </Notice>
      )}
      {error && <Notice tone="danger">{error}</Notice>}

      {/* KPI grid — all clickable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <KpiCard
          label={isRTL ? 'מתאמנים פעילים' : 'Active members'}
          value={stats.active}
          delta={stats.newThisWeek > 0
            ? (isRTL ? `+${stats.newThisWeek} השבוע` : `+${stats.newThisWeek} this week`)
            : (isRTL ? 'ללא חדשים השבוע' : 'No new this week')}
          color={t.color.wineLight}
          onClick={() => setDetail('active')}
        />
        <KpiCard
          label="MRR"
          value={isRTL ? '₪—' : '$—'}
          delta={isRTL ? 'לחץ להסבר' : 'Tap for details'}
          color={t.color.silver1}
          onClick={() => setDetail('mrr')}
          muted
        />
        <KpiCard
          label={isRTL ? 'דבקות ממוצעת' : 'Average adherence'}
          value="—"
          delta={isRTL ? 'לחץ להסבר' : 'Tap for details'}
          color={t.color.silver1}
          onClick={() => setDetail('adherence')}
          muted
        />
        <KpiCard
          label={isRTL ? 'שביעות רצון' : 'Satisfaction'}
          value="—"
          delta={isRTL ? 'לחץ להסבר' : 'Tap for details'}
          color={t.color.silver1}
          onClick={() => setDetail('satisfaction')}
          muted
        />
        <KpiCard
          label={isRTL ? 'בקשות פתוחות' : 'Open requests'}
          value={stats.requestsNew}
          delta={isRTL ? `${stats.requestsTotal} סה״כ` : `${stats.requestsTotal} total`}
          color={stats.requestsNew > 0 ? t.color.wineLight : t.color.silver1}
          onClick={() => setDetail('requests')}
        />
      </div>

      {/* Signup timeline + role split */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }} className="hfos-grid-2">
        <Card>
          <SectionHeader
            title={isRTL ? 'הרשמות ב-30 הימים האחרונים' : 'Signups · last 30 days'}
            subtitle={loading
              ? (isRTL ? 'טוען מ-Supabase…' : 'Loading from Supabase…')
              : stats.total === 0
                ? (isRTL ? 'אין עדיין רשומות — שלח את קישור ההזמנה' : 'No records yet — share the invite link')
                : (isRTL ? `${stats.newThisMonth} מתאמנים חדשים החודש` : `${stats.newThisMonth} new members this month`)}
          />
          <SignupTimeline members={members} isRTL={isRTL} />
        </Card>

        <Card>
          <SectionHeader title={isRTL ? 'פילוח לפי תפקיד' : 'Role breakdown'} />
          {stats.total === 0 ? (
            <EmptyMini isRTL={isRTL} />
          ) : (
            <>
              <DonutSegments size={160} segments={[
                { value: stats.total - stats.coaches - stats.admins, color: t.color.wineLight },
                { value: stats.coaches, color: t.color.silver1 },
                { value: stats.admins, color: t.color.silver2 },
              ]} />
              <div style={{ marginTop: 14, display: 'grid', gap: 6 }}>
                <LegendRow color={t.color.wineLight} label={isRTL ? 'מתאמנים' : 'Members'} count={stats.total - stats.coaches - stats.admins} isRTL={isRTL} />
                <LegendRow color={t.color.silver1} label={isRTL ? 'מאמנים' : 'Coaches'} count={stats.coaches} isRTL={isRTL} />
                <LegendRow color={t.color.silver2} label={isRTL ? 'מנהלים' : 'Admins'} count={stats.admins} isRTL={isRTL} />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Engagement + status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="hfos-grid-2">
        <Card>
          <SectionHeader
            title={isRTL ? 'סטטוס מתאמנים' : 'Member status'}
            subtitle={isRTL ? 'לפי פעילות ואונבורדינג' : 'By activity and onboarding'}
          />
          {stats.total === 0 ? <EmptyMini isRTL={isRTL} /> : (
            <div style={{ display: 'grid', gap: 12 }}>
              <StatusBar
                label={isRTL ? 'פעילים' : 'Active'}
                count={stats.active} total={stats.total}
                color={t.color.success} isRTL={isRTL}
              />
              <StatusBar
                label={isRTL ? 'בתהליך רישום' : 'Onboarding'}
                count={stats.onboarding} total={stats.total}
                color={t.color.wineLight} isRTL={isRTL}
              />
              <StatusBar
                label={isRTL ? 'לא פעילים 21+ ימים' : 'Idle 21+ days'}
                count={stats.idle} total={stats.total}
                color={t.color.warning} isRTL={isRTL}
              />
            </div>
          )}
        </Card>

        <Card>
          <SectionHeader
            title={isRTL ? 'תמונות התקדמות' : 'Progress photos'}
            subtitle={isRTL ? 'מתוך כלל המתאמנים' : 'Across all members'}
          />
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'center',
          }}>
            <div>
              <div style={{ fontFamily: t.font.family.display, fontSize: 34, fontWeight: 600, color: t.color.white, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {stats.photosTotal}
              </div>
              <Label color={t.color.silver3}>{isRTL ? 'תמונות סה״כ' : 'Total photos'}</Label>
            </div>
            <div>
              <div style={{ fontFamily: t.font.family.display, fontSize: 34, fontWeight: 600, color: t.color.white, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {stats.membersWithPhotos}
              </div>
              <Label color={t.color.silver3}>{isRTL ? 'מתאמנים שהעלו' : 'Members uploaded'}</Label>
            </div>
          </div>
        </Card>
      </div>

      <style>{`@media (max-width: 900px) { .hfos-grid-2 { grid-template-columns: 1fr !important; } }`}</style>

      {/* Drill-down modal */}
      {detail && <DetailModal detail={detail} stats={stats} members={members} onClose={() => setDetail(null)} isRTL={isRTL} />}
    </div>
  )
}

// ─── Signup timeline: 30 daily buckets ─────────────────────
function SignupTimeline({ members, isRTL }) {
  const bars = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0)
    const buckets = Array.from({ length: 30 }, () => 0)
    members.forEach(m => {
      if (!m.created_at) return
      const d = new Date(m.created_at); d.setHours(0, 0, 0, 0)
      const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000)
      if (daysAgo >= 0 && daysAgo < 30) buckets[29 - daysAgo] += 1
    })
    return buckets
  }, [members])

  return (
    <BarChart
      labels={bars.map((_, i) => i % 5 === 0 ? `${30 - i}` : '')}
      data={bars}
      formatValue={v => `${v}`}
      color={t.color.wineLight}
    />
  )
}

// ─── KPI card, clickable ─────────────────────
function KpiCard({ label, value, delta, color, onClick, muted }) {
  return (
    <div onClick={onClick} style={{
      padding: 20,
      background: t.color.panel,
      border: `1px solid ${t.color.border}`,
      borderRadius: t.radius.lg,
      cursor: onClick ? 'pointer' : 'default',
      transition: t.transition,
      opacity: muted ? 0.75 : 1,
    }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = t.color.wineLight }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = t.color.border }}
    >
      <div style={{ marginBottom: 12 }}>
        <Label color={t.color.silver2}>{label}</Label>
      </div>
      <div style={{
        fontFamily: t.font.family.display, fontSize: 34, fontWeight: 600,
        letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
        color, lineHeight: 1, marginBottom: 8,
      }}>{value}</div>
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 10,
        letterSpacing: '0.16em', color: t.color.silver3,
        textTransform: 'uppercase',
      }}>{delta}</div>
    </div>
  )
}

function StatusBar({ label, count, total, color, isRTL }) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: t.color.silver1, letterSpacing: '-0.005em' }}>{label}</span>
        <span style={{
          fontFamily: t.font.family.mono, fontSize: 11,
          color: t.color.silver1, letterSpacing: '0.12em',
          fontVariantNumeric: 'tabular-nums',
        }}>{count} · {pct}%</span>
      </div>
      <ProgressBar value={count} max={total || 1} color={color} />
    </div>
  )
}

function LegendRow({ color, label, count, isRTL }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
        <span>{label}</span>
      </div>
      <span style={{ color: t.color.silver2 }}>{count}</span>
    </div>
  )
}

function EmptyMini({ isRTL }) {
  return (
    <div style={{ padding: '32px 16px', textAlign: 'center', color: t.color.silver2 }}>
      <Label color={t.color.silver3}>{isRTL ? 'אין נתונים עדיין' : 'No data yet'}</Label>
    </div>
  )
}

function Notice({ tone, children }) {
  const border = tone === 'danger' ? t.color.danger : tone === 'warn' ? t.color.warning : t.color.wineLight
  return (
    <div style={{
      padding: '12px 14px',
      background: t.color.panel,
      border: `1px solid ${border}`,
      borderRadius: t.radius.md,
      color: t.color.silver1, fontSize: 13, lineHeight: 1.5,
      letterSpacing: '-0.005em',
    }}>{children}</div>
  )
}

// ─── Detail drill-down ─────────────────────
function DetailModal({ detail, stats, members, onClose, isRTL }) {
  const details = {
    active: {
      title: isRTL ? 'מתאמנים פעילים' : 'Active members',
      value: `${stats.active} ${isRTL ? 'מתוך' : 'of'} ${stats.total}`,
      body: isRTL
        ? `מתאמן נחשב "פעיל" אם: (1) השלים את תהליך הרישום (Onboarded), ו־(2) יש לו פעילות בטווח 21 הימים האחרונים (עדכון פרופיל או העלאת תמונת התקדמות).\n\nמי שלא הועלה שום דבר 21 ימים — מסווג "לא פעיל".\nמי שטרם השלים אונבורדינג — מסווג "בתהליך".\n\nהמונה הזה יתעדכן אוטומטית ככל שמתאמנים מסיימים אונבורדינג ומעלים תוכן.`
        : `A member is "Active" if: (1) they finished onboarding, AND (2) they have activity in the last 21 days (profile update or progress photo upload).\n\nSilent 21+ days → "Idle". Never finished onboarding → "Onboarding".\n\nThis counter updates automatically as members complete onboarding and upload content.`,
      rows: [
        [isRTL ? 'פעילים' : 'Active', stats.active],
        [isRTL ? 'בתהליך' : 'Onboarding', stats.onboarding],
        [isRTL ? 'לא פעילים' : 'Idle', stats.idle],
        [isRTL ? 'סה״כ' : 'Total', stats.total],
      ],
    },
    mrr: {
      title: 'MRR — Monthly Recurring Revenue',
      value: '—',
      body: isRTL
        ? `הנתון הזה עדיין לא זמין כי מודול התשלומים והמנויים עוד לא נבנה במערכת (משימה עתידית #69).\n\nכשמסלולי המנוי (Basic / Standard / Premium) יופעלו ויחוברו ל־Stripe, ה־MRR ייחושב אוטומטית כסכום המנויים החוזרים החודשי הפעיל, וההצגה כאן תשתנה לנתון אמיתי.\n\nעד אז — לא מוצגים נתונים שקריים.`
        : `This number is not available yet because the payments/subscriptions module hasn't been built (pending task #69).\n\nWhen Basic/Standard/Premium subscription tiers are activated and wired to Stripe, MRR will be automatically calculated as the sum of active recurring monthly subscriptions.\n\nUntil then — no fake data is shown.`,
      rows: [
        [isRTL ? 'מסלולים פעילים' : 'Active subscriptions', 0],
        [isRTL ? 'סטטוס מודול תשלומים' : 'Payments module status', isRTL ? 'בהמתנה' : 'Pending'],
      ],
    },
    adherence: {
      title: isRTL ? 'דבקות ממוצעת' : 'Average adherence',
      value: '—',
      body: isRTL
        ? `דבקות מחושבת מיחס בין אימונים שהתבצעו לאימונים שהיו מתוכננים בתכנית — ברמת המתאמן, ואז ממוצע על כלל המתאמנים.\n\nכרגע רישום האימונים (workout logs) שמור מקומית בכל מכשיר של כל מתאמן ולא מסונכרן עם Supabase, לכן אי אפשר לחשב כאן את הממוצע.\n\nהנתון יופעל אחרי שנחבר את workout_logs ל-Supabase (משימה בפיתוח).`
        : `Adherence is the ratio of workouts completed vs planned — computed per member, then averaged across the team.\n\nWorkout logs currently live on each member's device (localStorage) and aren't synced to Supabase, so this average can't be computed here.\n\nThis KPI will populate once workout_logs are wired to Supabase (in progress).`,
      rows: [
        [isRTL ? 'סטטוס סנכרון אימונים' : 'Workout log sync', isRTL ? 'מקומי בלבד' : 'Local only'],
      ],
    },
    satisfaction: {
      title: isRTL ? 'שביעות רצון' : 'Satisfaction',
      value: '—',
      body: isRTL
        ? `שביעות רצון מחושבת מציוני מצב־הרוח (mood check-ins) שהמתאמנים מזינים במסך "מנטלי" — ממוצע שקלול של 30 הימים האחרונים.\n\nגם כאן — הצ׳ק־אינים שמורים מקומית ועדיין לא מסונכרנים ל-Supabase. אחרי הסנכרון (בקרוב) המספר יופיע.`
        : `Satisfaction is derived from mood check-ins that members submit under "Mind" — weighted 30-day average.\n\nAlso stored locally today, not synced to Supabase yet. Will populate after sync.`,
      rows: [
        [isRTL ? 'צ׳ק־אינים כרגע' : 'Check-ins today', isRTL ? 'מקומי בלבד' : 'Local only'],
      ],
    },
    requests: {
      title: isRTL ? 'בקשות אימון אישי' : 'Personal training requests',
      value: `${stats.requestsNew} ${isRTL ? 'פתוחות' : 'open'}`,
      body: isRTL
        ? `זו רשימת הבקשות שהתקבלו דרך טופס האימון האישי (מסך "אישי" בצד המתאמן).\n\nהנתון הזה הוא אמיתי לחלוטין — מגיע ישירות מ־Supabase table personal_training_requests. כל בקשה חדשה מופיעה כאן מיד.\n\nלחץ על "בקשות אימון אישי" בתפריט המנהל לניהול מלא (קבל / דחה / הקצה למאמן).`
        : `Live list of requests received through the personal-training form (member-side "Personal" screen).\n\nThis number is 100% real — pulled from Supabase table personal_training_requests. Every new request appears here immediately.\n\nOpen "Personal requests" in the admin nav to manage them (accept / reject / assign to coach).`,
      rows: [
        [isRTL ? 'בקשות חדשות' : 'New requests', stats.requestsNew],
        [isRTL ? 'בקשות בכל הסטטוסים' : 'Requests across all statuses', stats.requestsTotal],
      ],
    },
  }
  const d = details[detail]
  if (!d) return null

  return (
    <Modal open onClose={onClose} title={d.title} width={560}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{
          fontFamily: t.font.family.display,
          fontSize: 44, fontWeight: 600,
          letterSpacing: '-0.03em', color: t.color.white,
          lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>{d.value}</div>

        <div style={{
          fontSize: 14, lineHeight: 1.65, color: t.color.silver1,
          letterSpacing: '-0.005em', whiteSpace: 'pre-line',
        }}>{d.body}</div>

        <div style={{
          background: t.color.panel, border: `1px solid ${t.color.border}`,
          borderRadius: t.radius.md, padding: 4,
        }}>
          {d.rows.map(([k, v], i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 14px',
              borderBottom: i === d.rows.length - 1 ? 'none' : `1px solid ${t.color.hairline}`,
            }}>
              <Label color={t.color.silver2}>{k}</Label>
              <span style={{
                fontFamily: t.font.family.mono, fontSize: 12,
                color: t.color.white, fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.08em',
              }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
