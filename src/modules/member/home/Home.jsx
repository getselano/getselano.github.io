import React from 'react'
import { t } from '../../../theme/tokens'
import { useApp } from '../../../store/AppStore'
import { useAuth } from '../../../auth/AuthContext'
import { readHealthAck } from '../../../components/legal/HealthAcknowledgment'
import { Card, Button, Ring, Stat, Badge, SectionHeader, ProgressBar } from '../../../components/ui/UI'
import { BarChart } from '../../../components/charts/Charts'
import { greeting, DAYS_SHORT_HE, todayKey } from '../../../utils/date'
import { nutritionTargets, goalAdjustments, dietTemplates, waterLiters } from '../../../utils/calc'
import { DailyBoost } from '../../../components/notifications/DailyBoost'
import { Kicker, SectionHead } from '../../../design/components/primitives'
import { useI18n } from '../../../i18n/i18n'

// Pretty-print an email prefix as a first name: strips digits, splits on
// dots/underscores, and capitalizes. "avivgvili6" → "Avivgvili",
// "aviv.gvili" → "Aviv". Only used when no proper name exists.
function prettifyFromEmail(email) {
  if (!email) return ''
  const raw = String(email).split('@')[0]
  const stripped = raw.replace(/[0-9]+$/, '')
  const first = stripped.split(/[._-]/)[0]
  if (!first) return ''
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

export function Home({ go }) {
 const { state } = useApp()
 const { user } = useAuth()
 const { isRTL } = useI18n()
 const { profile, moodCheckins, mealLogs, workoutLogs } = state
 const isFemale = profile.sex === 'female'
 // Name-resolution chain: profile → auth user → health-ack signer →
 // email prefix → gender-tuned fallback ("אלוף/אלופה"). Whatever the
 // trainee typed on the signature pad is the most authoritative source
 // when profile.name and auth name are both empty.
 const ackName = readHealthAck()?.signerName
 const first =
   profile.name?.split(' ')[0] ||
   user?.name?.split(' ')[0] ||
   ackName?.split(' ')[0] ||
   prettifyFromEmail(user?.email) ||
   (isRTL ? (isFemale ? 'אלופה' : 'אלוף') : 'Champion')
 const readyWord = isRTL ? (isFemale ? 'מוכנה?' : 'מוכן?') : 'Ready?'
 const _targets = nutritionTargets(profile)
 const _bmr = _targets.bmr
 const _tdee = _targets.tdee
 const kcalTarget = _targets.kcal
 const diet = _targets.diet
 const target = { protein: _targets.protein, carbs: _targets.carbs, fat: _targets.fat }

 const todayMeals = mealLogs[todayKey()] || []
 const todayKcal = Math.round(todayMeals.reduce((s, m) => s + (m.kcal || 0), 0))
 const lastMood = moodCheckins[0]

 const readiness = calcReadiness({ mood: lastMood?.mood ?? 7, sleep: lastMood?.sleepHours ?? 7, stress: lastMood?.stress ?? 4 })

 return (
 <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
 <DailyBoost />

 {/* Hero — Sport-Refined */}
 <div className="hfos-hero"style={{
 position:'relative',
 borderRadius: t.radius.xl,
 overflow:'hidden',
 border: `1px solid ${t.color.hairline}`,
 background: `linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.7) 100%), linear-gradient(160deg, ${t.color.panel2} 0%, ${t.color.charcoal} 100%)`,
 padding:'24px 24px 26px',
 }}>
 {/* wine radial */}
 <div style={{
 position:'absolute', top:'-30%', insetInlineEnd:'-20%',
 width: 340, height: 340,
 background: `radial-gradient(circle, ${t.color.wineGlow} 0%, transparent 55%)`,
 pointerEvents:'none',
 }} />

 <div className="hfos-hero-row"style={{
 position:'relative', zIndex: 2,
 display:'flex', justifyContent:'space-between', alignItems:'center', gap: 16,
 }}>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ marginBottom: 10 }}>
 <Kicker>{greeting()}</Kicker>
 </div>
 <SectionHead size="h1" emphasis={readyWord} style={{ fontSize: 34, marginBottom: 10 }} className="hfos-hero-title">
 {first},
 </SectionHead>
 <div style={{
 color: t.color.silver1, fontSize: t.font.body, lineHeight: 1.5,
 letterSpacing:'-0.005em', maxWidth: 380,
 }}>{focusToday(state)}</div>
 </div>
 <Ring value={readiness} max={100} size={90} stroke={8}
 color={readiness >= 75 ? t.color.success : readiness >= 50 ? t.color.wineLight : t.color.warning}
 label={`${readiness}`} sublabel="READY"/>
 </div>
 </div>

 {/* Primary CTA — the single most important button in the whole app.
     Adapts label to whether a plan is active + whether today already has
     a logged workout. Two clicks → training. */}
 <PrimaryTrainCta state={state} go={go} isRTL={isRTL} />

 {/* Goal widget - most important thing in the app */}
 <GoalWidget state={state} go={go} />

 {/* Quick stats */}
 <div className="hfos-kpis"style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
 <Card style={{ padding: 16 }}>
 <Stat icon=" " label={isRTL ? 'קלוריות' : 'Calories'} value={`${todayKcal}/${kcalTarget}`} />
 <ProgressBar value={todayKcal} max={kcalTarget} style={{ marginTop: 8 }} />
 </Card>
 <Card style={{ padding: 16 }}>
 <Stat icon=" " label={isRTL ? 'אימונים השבוע' : 'Workouts this week'} value={weekWorkouts(workoutLogs)} delta={`${workoutLogs.length} ${isRTL ? 'סה״כ' : 'total'}`} deltaColor={t.color.textDim} />
 </Card>
 </div>

 {/* Focus row */}
 <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 20 }} className="hfos-grid-2">
 <Card>
 <SectionHeader title={isRTL ? 'השבוע במבט' : 'Week at a glance'} subtitle={isRTL ? 'פעילות + מקרו' : 'Activity + macros'} />
 <BarChart
 labels={DAYS_SHORT_HE}
 data={sampleWeekActivity(state)}
 formatValue={v => `${v}`}
 color={t.color.gold}
 />
 </Card>
 <Card>
 <SectionHeader title={isRTL ? 'פעולות מהירות' : 'Quick actions'} />
 <div style={{ display:'grid', gap: 10 }}>
 <QuickAction icon=" " text={isRTL ? 'התחל אימון היום' : "Start today's workout"} onClick={() => go('train')} />
 <QuickAction icon=" " text={isRTL ? 'הוסף ארוחה' : 'Log a meal'} onClick={() => go('nutrition')} />
 </div>
 </Card>
 </div>

 {/* Macros ring */}
 <Card>
 <SectionHeader title={isRTL ? 'יעדי מקרו יומיים' : 'Daily macro targets'} />
 <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
 <MacroTile label={isRTL ? 'חלבון' : 'Protein'} value={target.protein} unit={isRTL ? 'ג׳' : 'g'} color={t.color.info} />
 <MacroTile label={isRTL ? 'פחמימות' : 'Carbs'} value={target.carbs} unit={isRTL ? 'ג׳' : 'g'} color={t.color.gold} />
 <MacroTile label={isRTL ? 'שומן' : 'Fat'} value={target.fat} unit={isRTL ? 'ג׳' : 'g'} color={t.color.warning} />
 </div>
 <div style={{ marginTop: 14, padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm, fontSize: t.font.sm, color: t.color.textDim }}>
 {isRTL
   ? `מים מומלץ: ${waterLiters(profile.weightKg, profile.activity)} ליטר · תזונה: ${diet.label}`
   : `Water target: ${waterLiters(profile.weightKg, profile.activity)}L · Diet: ${diet.label}`}
 </div>
 </Card>
 <style>{`
 @media (max-width: 900px) { .hfos-grid-2 { grid-template-columns: 1fr !important; } }
 @media (max-width: 500px) {
 .hfos-kpis { grid-template-columns: 1fr 1fr !important; }
 }
 `}</style>
 </div>
 )
}

// Big prominent CTA at the top of Home — the single most important button.
// Label + subtitle adapt to plan/history so it always reads as the next action.
function PrimaryTrainCta({ state, go, isRTL }) {
  const plan = state.plan
  const hasPlan = !!plan
  const dayLabel = plan?.sessions?.[0]?.name || null
  const label = hasPlan
    ? (isRTL ? 'התחל את אימון היום' : "Start today's workout")
    : (isRTL ? 'בנה לי אימון' : 'Build me a workout')
  const sub = hasPlan
    ? (dayLabel ? (isRTL ? `היום: ${dayLabel}` : `Today: ${dayLabel}`) : '')
    : (isRTL ? 'המחולל יבנה תכנית בהתאמה אישית ב־3 שאלות' : 'Generator will build a personalized plan in 3 questions')

  return (
    <button
      onClick={() => go('train')}
      style={{
        display:'block', width:'100%',
        padding:'22px 24px',
        background: `linear-gradient(135deg, ${t.color.wineLight} 0%, ${t.color.wine} 100%)`,
        border:'none', borderRadius: t.radius.xl,
        color: t.color.white, fontFamily:'inherit',
        cursor:'pointer', textAlign:'right', direction: isRTL ? 'rtl' : 'ltr',
        boxShadow: `0 8px 24px ${t.color.wineGlow || 'rgba(199,64,80,0.3)'}`,
        transition: t.transition,
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.28em',
        color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform:'uppercase',
        marginBottom: 6,
      }}>{isRTL ? 'הפעולה הבאה' : 'Next action'}</div>
      <div style={{
        fontFamily: t.font.family.display, fontSize: 26, fontWeight: 700,
        letterSpacing:'-0.02em', marginBottom: 4,
      }}>{label}</div>
      {sub && (
        <div style={{
          color:'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.4,
        }}>{sub}</div>
      )}
    </button>
  )
}

function QuickAction({ icon, text, onClick }) {
 return (
 <button onClick={onClick} style={{
 display:'flex', alignItems:'center', gap: 12, padding: 14,
 background: t.color.bgSoft, border:`1px solid ${t.color.border}`,
 borderRadius: t.radius.md, cursor:'pointer', color: t.color.text,
 fontFamily:'inherit', fontSize: t.font.md, transition: t.transition, textAlign:'right',
 }}
 onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.gold; e.currentTarget.style.background = t.color.goldGlow }}
 onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border; e.currentTarget.style.background = t.color.bgSoft }}
 >
 <span style={{ fontSize: 22 }}>{icon}</span>
 <span style={{ flex: 1, fontWeight: 500 }}>{text}</span>
 <span style={{ color: t.color.gold }}>←</span>
 </button>
 )
}

function MacroTile({ label, value, unit, color }) {
 return (
 <div style={{ padding: 14, background: t.color.bgSoft, borderRadius: t.radius.md, textAlign:'center'}}>
 <div style={{ fontSize: t.font.xs, color: t.color.textDim, marginBottom: 4 }}>{label}</div>
 <div style={{ fontSize: t.font.xl, fontWeight: 800, color }}>{value}</div>
 <div style={{ fontSize: t.font.xs, color: t.color.textMuted }}>{unit}</div>
 </div>
 )
}

function GoalWidget({ state, go }) {
 const goal = (state.goals || []).find(g => g.status === 'active')
 if (!goal) {
 return (
 <Card style={{ padding: 20, background: t.color.goldGlow, border:`1px solid ${t.color.gold}`, cursor:'pointer'}} onClick={() => go('goals')}>
 <div style={{ display:'flex', gap: 14, alignItems:'center'}}>
 <div style={{ fontSize: 38 }}> </div>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 800, fontSize: t.font.lg, color: t.color.gold, marginBottom: 4 }}>
 עדיין אין לך מטרה מדידה
 </div>
 <div style={{ color: t.color.textDim, fontSize: t.font.sm }}>
 בואי נגדיר יחד תוך 3 דקות - נעזור אם לא בטוח.
 </div>
 </div>
 <Button size="sm">בואו נבנה ←</Button>
 </div>
 </Card>
 )
 }
 const daysSince = Math.floor((Date.now() - new Date(goal.startDate)) / (24*3600*1000))
 const totalDays = goal.deadlineWeeks * 7
 const pct = Math.min(100, Math.round((daysSince / totalDays) * 100))
 const daysLeft = Math.max(0, totalDays - daysSince)
 return (
 <Card style={{ padding: 20, cursor:'pointer'}} hover onClick={() => go('goals')}>
 <div style={{ display:'flex', gap: 14, alignItems:'center'}}>
 <div style={{ fontSize: 38 }}> </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display:'flex', gap: 8, alignItems:'center', marginBottom: 4 }}>
 <Badge>המטרה שלך</Badge>
 <span style={{ fontSize: t.font.xs, color: t.color.textDim }}>{daysLeft} ימים · {Math.ceil(daysLeft/7)} שב׳</span>
 </div>
 <div style={{ fontWeight: 700, fontSize: t.font.md, marginBottom: 8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{goal.title}</div>
 <ProgressBar value={pct} max={100} color={pct >= 66 ? t.color.success : t.color.gold} />
 </div>
 </div>
 </Card>
 )
}

function calcReadiness({ mood, sleep, stress }) {
 const sleepScore = Math.min(100, (sleep/8) * 100)
 const moodScore = mood * 10
 const stressScore = 100 - (stress * 10)
 return Math.round((sleepScore * 0.4) + (moodScore * 0.35) + (stressScore * 0.25))
}

function focusToday(state) {
 if (!state.plan) return 'צור תכנית אימון כדי להתחיל'
 const wk = weekWorkouts(state.workoutLogs)
 if (wk === 0) return 'התחל את השבוע - אימון קליל היום'
 if (wk < 3) return 'להמשיך במומנטום - עוד אימון היום'
 return 'שמור על עקביות + פוקוס על שינה איכותית'
}

function weekWorkouts(logs) {
 const d = new Date(); d.setDate(d.getDate() - 7)
 return logs.filter(l => new Date(l.date) >= d).length
}

function sampleWeekActivity() {
 return [45, 60, 30, 70, 55, 20, 65]
}

function aiInsight(state) {
 const wk = weekWorkouts(state.workoutLogs)
 if (wk >= 4) return 'עקביות מדהימה השבוע. המנוע מזהה שיפור עקבי בנפח - שקול להוסיף יום מנוחה פעילה.'
 if (state.moodCheckins[0]?.sleepHours < 6) return 'השינה שלך נמוכה. הביצועים באימון עלולים לרדת - תן עדיפות לשינה הלילה.'
 return 'התחל שבוע חדש עם check-in מנטלי - זה יעזור לנו להתאים את המערכת עבורך.'
}
