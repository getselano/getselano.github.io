import React, { useMemo, useState } from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { Card, Badge, SectionHeader, EmptyState } from '../../../components/ui/UI'
import { BarChart } from '../../../components/charts/Charts'
import { nutritionTargets } from '../../../utils/calc'
import { MICRO_KEYS } from '../../../data/foods'
import { useI18n } from '../../../i18n/i18n'

// Nutrition history. Every meal and water entry was already being written to
// state and never read back beyond "today" — this is the screen that reads it.
//
// Three things a tracker needs and this module had none of: a trend you can
// see, an adherence number, and a logging streak.

const RANGES = [
  { key: 7,  he: '7 ימים',  en: '7 days'  },
  { key: 14, he: '14 יום',  en: '14 days' },
  { key: 30, he: '30 יום',  en: '30 days' },
]

// Within ±this fraction of the calorie target counts as "on target".
const ON_TARGET_BAND = 0.10

export function NutritionHistory() {
  const { state } = useApp()
  const { isRTL } = useI18n()
  const [days, setDays] = useState(7)

  const targets = nutritionTargets(state.profile)
  const locale = isRTL ? 'he-IL' : 'en-GB'
  const stats = useMemo(
    () => buildStats(state.mealLogs, state.waterLog, days, targets, locale),
    [state.mealLogs, state.waterLog, days, targets.kcal, targets.protein, locale]
  )

  if (!stats.daysLogged) {
    return (
      <EmptyState
        title={isRTL ? 'אין עדיין היסטוריה' : 'No history yet'}
        subtitle={isRTL
          ? 'ברגע שתתחיל לתעד ארוחות, כאן יופיעו הגרף השבועי, אחוז העמידה ביעד ורצף התיעוד שלך.'
          : 'Once you start logging meals, your weekly chart, target adherence, and logging streak appear here.'}
      />
    )
  }

  return (
    <div style={{ display:'grid', gap: 16 }}>
      {/* Range picker */}
      <div style={{ display:'flex', gap: 6 }}>
        {RANGES.map(r => (
          <button key={r.key} onClick={() => setDays(r.key)} style={{
            padding:'8px 16px', borderRadius: 999,
            background: days === r.key ? t.color.gold : t.color.bgSoft,
            color: days === r.key ? '#0d0d14' : t.color.text,
            border: `1px solid ${days === r.key ? t.color.gold : t.color.border}`,
            cursor:'pointer', fontFamily:'inherit', fontWeight: 700, fontSize: t.font.sm,
          }}>{isRTL ? r.he : r.en}</button>
        ))}
      </div>

      {/* Headline numbers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <StatCard
          label={isRTL ? 'רצף תיעוד' : 'Logging streak'}
          value={stats.streak}
          unit={isRTL ? 'ימים' : 'days'}
          hint={stats.streak >= 3
            ? (isRTL ? 'ממשיך חזק' : 'Going strong')
            : (isRTL ? 'תעד היום כדי להאריך' : 'Log today to extend')}
          color={stats.streak > 0 ? t.color.success : t.color.textDim}
          highlight={stats.streak >= 7}
        />
        <StatCard
          label={isRTL ? 'עמידה ביעד' : 'On target'}
          value={stats.adherencePct == null ? '—' : stats.adherencePct}
          unit={stats.adherencePct == null ? '' : '%'}
          hint={stats.adherencePct == null
            ? (isRTL ? 'צריך משקל, גובה וגיל בפרופיל' : 'Needs weight, height and age in profile')
            : (isRTL
              ? `${stats.onTargetDays} מתוך ${stats.daysLogged} ימים · ±10%`
              : `${stats.onTargetDays} of ${stats.daysLogged} days · ±10%`)}
          color={t.color.gold}
        />
        <StatCard
          label={isRTL ? 'ממוצע קלוריות' : 'Avg calories'}
          value={stats.avgKcal}
          unit={isRTL ? 'קק״ל' : 'kcal'}
          hint={targets.kcal
            ? (isRTL ? `יעד ${targets.kcal}` : `Target ${targets.kcal}`)
            : (isRTL ? 'השלם פרופיל ליעד' : 'Complete profile for a target')}
          color={t.color.text}
        />
        <StatCard
          label={isRTL ? 'ממוצע חלבון' : 'Avg protein'}
          value={stats.avgProtein}
          unit={isRTL ? 'ג׳' : 'g'}
          hint={targets.protein
            ? (isRTL ? `יעד ${targets.protein}ג׳` : `Target ${targets.protein}g`)
            : ''}
          color={t.color.info}
        />
      </div>

      {/* Calories over time */}
      <Card>
        <SectionHeader
          title={isRTL ? 'קלוריות לאורך זמן' : 'Calories over time'}
          subtitle={targets.kcal
            ? (isRTL ? `הקו המקווקו הוא היעד שלך — ${targets.kcal} קק״ל` : `The dashed line is your target — ${targets.kcal} kcal`)
            : undefined}
        />
        <TargetBandChart
          series={stats.series}
          target={targets.kcal}
          isRTL={isRTL}
        />
      </Card>

      {/* Protein over time */}
      <Card>
        <SectionHeader title={isRTL ? 'חלבון לאורך זמן' : 'Protein over time'} />
        <BarChart
          data={stats.series.map(d => Math.round(d.p))}
          labels={stats.series.map(d => d.label)}
          color={t.color.info}
          formatValue={v => v || ''}
        />
      </Card>

      {/* Micronutrient averages — only when some entries carried them */}
      {stats.hasMicros && (
        <Card>
          <SectionHeader
            title={isRTL ? 'ממוצעים נוספים' : 'Other averages'}
            subtitle={isRTL
              ? 'מחושב רק מימים שבהם נרשמו הערכים האלה'
              : 'Computed only from days where these values were recorded'}
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 8 }}>
            <MiniStat label={isRTL ? 'סיבים' : 'Fiber'} value={stats.avgFiber} unit={isRTL ? 'ג׳' : 'g'} color={t.color.success} />
            <MiniStat label={isRTL ? 'סוכר' : 'Sugar'} value={stats.avgSugar} unit={isRTL ? 'ג׳' : 'g'} />
            <MiniStat label={isRTL ? 'רווי' : 'Sat fat'} value={stats.avgSatFat} unit={isRTL ? 'ג׳' : 'g'} />
            <MiniStat label={isRTL ? 'נתרן' : 'Sodium'} value={stats.avgSodium} unit={isRTL ? 'מ״ג' : 'mg'} />
          </div>
        </Card>
      )}

      {/* Day-by-day */}
      <Card>
        <SectionHeader
          title={isRTL ? 'יום אחר יום' : 'Day by day'}
          action={<Badge color={t.color.textDim}>{stats.daysLogged}/{days}</Badge>}
        />
        <div style={{ display:'grid', gap: 6 }}>
          {stats.series.slice().reverse().map(d => (
            <DayRow key={d.date} day={d} target={targets.kcal} isRTL={isRTL} />
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Chart with a target line ───────────────────────────────────
// BarChart has no concept of a target, and the target is the whole point of
// this view, so the bars are drawn here with a band around the goal.
function TargetBandChart({ series, target, isRTL }) {
  const max = Math.max(target || 0, ...series.map(d => d.kcal)) * 1.1 || 1
  const height = 160
  return (
    <div style={{ position:'relative', height, marginTop: 12 }}>
      {/* Target line */}
      {target > 0 && (
        <div style={{
          position:'absolute', insetInline: 0,
          bottom: `${(target / max) * 100}%`,
          borderTop: `1px dashed ${t.color.gold}`,
          opacity: 0.7, pointerEvents:'none', zIndex: 1,
        }} />
      )}
      <div style={{ display:'flex', gap: 6, alignItems:'flex-end', height }}>
        {series.map(d => {
          const pct = Math.min(100, (d.kcal / max) * 100)
          const status = dayStatus(d, target)
          return (
            <div key={d.date} style={{ flex: 1, display:'flex', flexDirection:'column', alignItems:'center', gap: 4, height:'100%', justifyContent:'flex-end' }}>
              <div style={{ fontSize: 9, color: t.color.textDim }}>{d.logged ? Math.round(d.kcal) : ''}</div>
              <div
                title={`${d.date} · ${Math.round(d.kcal)} ${isRTL ? 'קק״ל' : 'kcal'}`}
                style={{
                  width:'100%', minHeight: 2,
                  height: `${Math.max(2, pct)}%`,
                  background: STATUS_COLOR[status],
                  borderRadius: 4, transition:'height .4s ease',
                }}
              />
              <div style={{ fontSize: 9, color: t.color.textMuted }}>{d.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const STATUS_COLOR = {
  none:  '#2d2925',
  under: '#7ab0d6',
  on:    '#6fbf85',
  over:  '#e0a05a',
}

function dayStatus(day, target) {
  if (!day.logged) return 'none'
  if (!target) return 'on'
  const ratio = day.kcal / target
  if (ratio < 1 - ON_TARGET_BAND) return 'under'
  if (ratio > 1 + ON_TARGET_BAND) return 'over'
  return 'on'
}

function DayRow({ day, target, isRTL }) {
  const status = dayStatus(day, target)
  const statusLabel = {
    none:  isRTL ? 'לא תועד'   : 'Not logged',
    under: isRTL ? 'מתחת ליעד' : 'Under',
    on:    isRTL ? 'ביעד'      : 'On target',
    over:  isRTL ? 'מעל היעד'  : 'Over',
  }[status]

  return (
    <div style={{
      display:'flex', alignItems:'center', gap: 12, padding: 10,
      background: t.color.bgSoft, borderRadius: t.radius.sm,
      opacity: day.logged ? 1 : 0.55,
    }}>
      <div style={{ width: 10, height: 10, borderRadius:'50%', background: STATUS_COLOR[status], flexShrink: 0 }} />
      <div style={{ minWidth: 92, fontSize: t.font.sm, fontWeight: 600 }}>{day.longLabel}</div>
      <div style={{ flex: 1, minWidth: 0, fontSize: t.font.xs, color: t.color.textDim }}>
        {day.logged
          ? `${Math.round(day.kcal)} ${isRTL ? 'קק״ל' : 'kcal'} · ${Math.round(day.p)}${isRTL ? 'ח׳' : 'P'} · ${Math.round(day.c)}${isRTL ? 'פ׳' : 'C'} · ${Math.round(day.f)}${isRTL ? 'ש׳' : 'F'}${day.water ? ` · ${day.water} ${isRTL ? 'כוסות' : 'cups'}` : ''}`
          : (isRTL ? 'לא נרשמו ארוחות' : 'No meals recorded')}
      </div>
      <div style={{ fontSize: 10, color: STATUS_COLOR[status], fontWeight: 700, flexShrink: 0 }}>{statusLabel}</div>
    </div>
  )
}

function StatCard({ label, value, unit, hint, color, highlight }) {
  return (
    <Card style={{
      padding: 16,
      border: `1px solid ${highlight ? t.color.gold : t.color.border}`,
      background: highlight ? t.color.goldGlow : undefined,
    }}>
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.2em',
        color: t.color.silver2, fontWeight: 700, textTransform:'uppercase',
      }}>{label}</div>
      <div style={{ display:'flex', alignItems:'baseline', gap: 4, marginTop: 6 }}>
        <span style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: t.font.xs, color: t.color.textDim }}>{unit}</span>
      </div>
      {hint && <div style={{ fontSize: 10, color: t.color.textMuted, marginTop: 6 }}>{hint}</div>}
    </Card>
  )
}

function MiniStat({ label, value, unit, color }) {
  return (
    <div style={{ padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm, textAlign:'center' }}>
      <div style={{ fontSize: t.font.lg, fontWeight: 800, color: color || t.color.text }}>
        {value}<span style={{ fontSize: 10, fontWeight: 500 }}>{unit}</span>
      </div>
      <div style={{ fontSize: 10, color: t.color.textMuted }}>{label}</div>
    </div>
  )
}

// ─── Aggregation ────────────────────────────────────────────────
function buildStats(mealLogs = {}, waterLog = {}, days, targets, locale = 'he-IL') {
  const series = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = toKey(d)
    const meals = mealLogs[key] || []
    const sum = meals.reduce((acc, m) => {
      acc.kcal += m.kcal || 0
      acc.p += m.p || 0
      acc.c += m.c || 0
      acc.f += m.f || 0
      for (const k of MICRO_KEYS) {
        if (m[k] != null) { acc[k] += m[k]; acc[`${k}Seen`] = true }
      }
      return acc
    }, { kcal:0, p:0, c:0, f:0, fiber:0, sugar:0, satFat:0, sodium:0 })

    series.push({
      date: key,
      label: d.toLocaleDateString(locale, { weekday:'narrow' }),
      longLabel: d.toLocaleDateString(locale, { weekday:'short', day:'numeric', month:'numeric' }),
      logged: meals.length > 0,
      water: waterLog[key] || 0,
      ...sum,
    })
  }

  const loggedDays = series.filter(d => d.logged)
  const daysLogged = loggedDays.length

  const avg = (pick, from = loggedDays) =>
    from.length ? Math.round(from.reduce((s, d) => s + pick(d), 0) / from.length) : 0

  const onTargetDays = targets.kcal
    ? loggedDays.filter(d => dayStatus(d, targets.kcal) === 'on').length
    : 0

  // Streak counts back from today; a missing today doesn't break a streak that
  // is still alive from yesterday, since the day isn't over yet.
  let streak = 0
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].logged) streak++
    else if (i === series.length - 1) continue  // today not logged yet
    else break
  }

  const microDays = (key) => loggedDays.filter(d => d[`${key}Seen`])

  return {
    series,
    daysLogged,
    streak,
    onTargetDays,
    hasTarget: !!targets.kcal,
    adherencePct: (targets.kcal && daysLogged) ? Math.round((onTargetDays / daysLogged) * 100) : null,
    avgKcal: avg(d => d.kcal),
    avgProtein: avg(d => d.p),
    hasMicros: MICRO_KEYS.some(k => microDays(k).length > 0),
    avgFiber:  avg(d => d.fiber,  microDays('fiber')),
    avgSugar:  avg(d => d.sugar,  microDays('sugar')),
    avgSatFat: avg(d => d.satFat, microDays('satFat')),
    avgSodium: avg(d => d.sodium, microDays('sodium')),
  }
}

function toKey(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
