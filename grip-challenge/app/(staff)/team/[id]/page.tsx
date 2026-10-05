import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm } from '@/components/ActionForm'
import { Message, Phone } from '@/components/icons'
import { WeekStrip, fmt, Frac } from '@/components/participant'
import { STATUS_LABEL, STATUS_SOFT } from '@/components/staff'
import { GOAL_TYPE_LABEL } from '@/components/GoalConfirm'
import { WeightChart } from '@/components/WeightChart'
import { attendanceIsSelfReported } from '@/lib/attendance'
import { loadParticipant, requireRole, userRepo } from '@/lib/data'
import { dateTimeIL, HEB_WEEKDAYS, HEB_WEEKDAYS_SHORT, shortDate, todayIL, weekday } from '@/lib/dates'
import { goalFormInvite, goalFormLink } from '@/lib/goal-form'
import { displayPhone, whatsappLink } from '@/lib/phone'
import { REWARD_DAYS, STATUS_COLORS } from '@/lib/program'
import { confirmWorkoutAction, logCallAction, saveGoalAction, setCallSlotAction } from '../../actions'

export default async function ParticipantDetail({ params }: { params: Promise<{ id: string }> }) {
  const v = await requireRole('coach', 'nutritionist', 'admin')
  const { id } = await params
  const row = await loadParticipant(id)
  if (!row) notFound()
  const repo = await userRepo()
  const [staff, history] = await Promise.all([repo.staff(), repo.goalHistory(id)])
  const { bundle, snap } = row
  const p = bundle.participant
  const color = STATUS_COLORS[snap.status.color]
  const staffName = (sid: string | null) => staff.find((s) => s.id === sid)?.full_name ?? '—'
  // Self-reported workouts count as soon as they are marked; staff only
  // remove a mistaken one. Boostapp attendance is not editable here.
  const attended = attendanceIsSelfReported()
    ? bundle.logs.filter((l) => l.workout_attended).sort((a, b) => (a.log_date < b.log_date ? 1 : -1))
    : []
  const calls = [...bundle.calls].sort((a, b) => (a.call_date < b.call_date ? 1 : -1))
  const canEditGoal = v.role === 'nutritionist' || v.role === 'admin'
  const canSetSlot = v.role === 'coach' || v.role === 'admin'
  const slotTime = p.call_time?.slice(0, 5) ?? ''
  const g = bundle.goal
  const previous = history.filter((x) => x.superseded_by)
  // The signed appendix is the main way in; offered until a signed one is on file.
  const signLink = canEditGoal && g?.source !== 'goal_form' ? goalFormLink(process.env.GOAL_FORM_URL, p) : null
  const first = p.full_name.split(' ')[0]

  return (
    <>
      <header className="greet">
        <div>
          <p className="hello"><Link href="/team" className="link">המשתתפים</Link> / יום <span className="num">{snap.dayNumber}</span></p>
          <h1>{p.full_name}</h1>
          <p className="muted small">מאמן/ת מנטלי/ת: {staffName(p.coach_id)} · תזונאי/ת: {staffName(p.nutritionist_id)}</p>
        </div>
        <div className="row">
          <a className="btn accent small" href={whatsappLink(p.phone, `היי ${first}`)} target="_blank" rel="noreferrer"><Message size={18} /> וואטסאפ</a>
          <a className="btn light small" href={`tel:+${p.phone}`} aria-label={displayPhone(p.phone)}><Phone size={18} /></a>
          {v.role === 'admin' && <Link className="btn light small" href={`/admin/participants/${p.id}`}>עריכה</Link>}
        </div>
      </header>

      <section className="card" style={{ background: STATUS_SOFT[snap.status.color], borderRight: `4px solid ${color}` }}>
        <div className="row between">
          <strong style={{ color }}>סטטוס {STATUS_LABEL[snap.status.color]}</strong>
          <span className="hint">מתעדכן אוטומטית</span>
        </div>
        {snap.status.reasons.length ? (
          <ul style={{ margin: '8px 0 0', paddingInlineStart: 18 }}>
            {snap.status.reasons.map((r) => (
              <li key={r.code} style={{ color: STATUS_COLORS[r.color] }}>{r.text} <span className="hint">· {r.owner === 'coach' ? 'מאמן/ת מנטלי/ת' : 'תזונאי/ת'}</span></li>
            ))}
          </ul>
        ) : (
          <p className="small" style={{ marginTop: 6 }}>על המסלול.</p>
        )}
      </section>

      <div className="grid4">
        <Stat label="רצף" value={snap.currentStreak} sub={`שיא ${snap.longestStreak}`} />
        <Stat label="ימים מסומנים" value={snap.rewardDays} sub={`מתוך ${REWARD_DAYS}`} />
        <Stat label="אימונים" value={snap.actualWorkouts} sub={`בקצב: ${snap.expectedWorkouts}`} />
        <Stat label="ימים מהדיווח" value={snap.daysSinceLog} sub={`שיחה לפני ${snap.daysSinceCall} ימים`} />
      </div>

      <div className="split">
        <div className="stack" style={{ gap: 14 }}>
          <section className="card">
            <div className="card-title"><h2>השבוע</h2></div>
            <WeekStrip dots={snap.dots} today={snap.today} />
          </section>

          <section className="card">
            <div className="card-title"><h2>ארבעת התנאים</h2></div>
            {snap.conditions.map((c) => (
              <div className="cond" key={c.key}>
                <div className="track-head">
                  <span>{c.label}</span>
                  <span><Frac value={c.value} of={c.target} /> <span className="hint">(בקצב: {c.expectedByNow})</span></span>
                </div>
                <div className="bar goal thin"><span style={{ width: `${Math.min(100, (100 * c.value) / c.target)}%` }} /></div>
              </div>
            ))}
          </section>

          <section className="card">
            <div className="card-title">
              <h2>משקל</h2>
              {snap.weight.current != null && <span><span className="num">{fmt(snap.weight.current)}</span> ק״ג {snap.weight.delta ? <span className="delta num">({snap.weight.delta > 0 ? '+' : '−'}{fmt(Math.abs(snap.weight.delta))})</span> : null}</span>}
            </div>
            <WeightChart w={snap.weight} today={snap.dayNumber} />
          </section>

          {attended.length > 0 && (
            <section className="card">
              <div className="card-title"><h2>אימונים שסומנו</h2><span className="hint">נספרים אוטומטית</span></div>
              <p className="hint" style={{ marginBottom: 10 }}>אין צורך לאשר. אם משהו סומן בטעות, אפשר להסיר.</p>
              <div className="stack">
                {attended.map((l) => (
                  <div key={l.log_date} className="row between">
                    <span>יום {HEB_WEEKDAYS_SHORT[weekday(l.log_date)]} · <span className="num">{shortDate(l.log_date)}</span></span>
                    <form action={confirmWorkoutAction}>
                      <input type="hidden" name="participant_id" value={p.id} />
                      <input type="hidden" name="date" value={l.log_date} />
                      <input type="hidden" name="confirm" value="0" />
                      <button className="btn ghost small">הסרה</button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="stack" style={{ gap: 14 }}>
          <section className="card" id="slot">
            <div className="card-title">
              <h2>שיחה שבועית קבועה</h2>
              {p.call_weekday != null && slotTime ? <span className="pill">יום {HEB_WEEKDAYS[p.call_weekday]} · <span className="num">{slotTime}</span></span> : <span className="pill orange">לא נקבע</span>}
            </div>
            {canSetSlot ? (
              <ActionForm action={setCallSlotAction} submit="שמירת מועד">
                <input type="hidden" name="participant_id" value={p.id} />
                <p className="hint" style={{ marginBottom: 10 }}>ביום השיחה ב-08:00 {first} מקבל/ת תזכורת בוואטסאפ, ואת/ה בסיכום הבוקר.</p>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="call_weekday">יום</label>
                    <select id="call_weekday" name="call_weekday" defaultValue={p.call_weekday ?? ''}>
                      <option value="">ללא מועד קבוע</option>
                      {HEB_WEEKDAYS.slice(0, 6).map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="call_time">שעה</label>
                    <input id="call_time" name="call_time" type="time" step={900} defaultValue={slotTime} />
                  </div>
                </div>
              </ActionForm>
            ) : (
              <p className="hint">המאמן/ת המנטלי/ת קובע/ת את המועד.</p>
            )}
          </section>

          <section className="card">
            <div className="card-title"><h2>תיעוד שיחה</h2></div>
            <ActionForm action={logCallAction} submit="שמירת שיחה" resetOnOk>
              <input type="hidden" name="participant_id" value={p.id} />
              <div className="field">
                <label htmlFor="call_date">תאריך</label>
                <input id="call_date" name="call_date" type="date" defaultValue={todayIL()} max={todayIL()} required />
              </div>
              <div className="field">
                <label htmlFor="summary">סיכום</label>
                <textarea id="summary" name="summary" placeholder="מה עלה בשיחה, על מה סיכמתם" />
              </div>
              <label className="check"><input type="checkbox" name="risk_flag" /> סימון סיכון נשירה</label>
            </ActionForm>
          </section>

          <section className="card">
            <div className="card-title"><h2>שיחות קודמות</h2><span className="hint"><span className="num">{calls.length}</span></span></div>
            <div className="stack">
              {calls.map((c) => (
                <div key={c.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <div className="row between">
                    <strong><span className="num">{shortDate(c.call_date)}</span> · {staffName(c.staff_id)}</strong>
                    {c.risk_flag && <span className="pill red">סיכון</span>}
                  </div>
                  {c.summary && <p className="small muted" style={{ marginTop: 4 }}>{c.summary}</p>}
                </div>
              ))}
              {!calls.length && <p className="hint">עוד לא תועדו שיחות.</p>}
            </div>
          </section>

          <section className="card" id="goal" style={g?.confirmed_at ? undefined : { border: '1.5px solid var(--streak)' }}>
            <div className="card-title">
              <h2>היעד</h2>
              {!g ? <span className="pill orange">חסר יעד</span> : g.confirmed_at ? <span className="pill green">אושר</span> : <span className="pill orange">ממתין לאישור יעד</span>}
            </div>
            {g?.recorded_at && (
              <div className="goal-record">
                <div>תועד <span className="num">{dateTimeIL(g.recorded_at)}</span> · {g.source === 'goal_form' ? 'מטופס החתימה' : `בפלטפורמה${g.recorded_by ? ` ע״י ${staffName(g.recorded_by)}` : ''}`}</div>
                {g.confirmed_at ? (
                  <div>אושר ע״י המשתתף <span className="num">{dateTimeIL(g.confirmed_at)}</span>{g.source === 'goal_form' ? ' (בחתימה)' : ''}</div>
                ) : (
                  <div style={{ color: 'var(--streak-deep)' }}>ממתין לאישור המשתתף. יוצג לו בכניסה הבאה לאפליקציה.</div>
                )}
                {g.external_pdf_url && <a className="link" href={g.external_pdf_url} target="_blank" rel="noreferrer">נספח היעד החתום (PDF)</a>}
              </div>
            )}
            {signLink && (
              <div className="goal-sign">
                <strong>נספח היעד לחתימה</strong>
                <p className="hint">בסוף שיחת הקליטה שולחים ל{first} את הקישור האישי. אחרי החתימה היעד נכנס לכאן לבד, מאושר ועם ה-PDF.</p>
                <div className="row" style={{ flexWrap: 'wrap' }}>
                  <a className="btn accent small" href={whatsappLink(p.phone, goalFormInvite(first, signLink))} target="_blank" rel="noreferrer"><Message size={18} /> שליחה ל{first} בוואטסאפ</a>
                  <a className="btn light small" href={signLink} target="_blank" rel="noreferrer">פתיחת הטופס</a>
                </div>
                <p className="hint">אם אי אפשר להחתים, אפשר להזין כאן למטה. {first} יתבקש/תתבקש לאשר באפליקציה.</p>
              </div>
            )}
            {canEditGoal ? (
              <ActionForm action={saveGoalAction} submit="שמירת יעד">
                <input type="hidden" name="participant_id" value={p.id} />
                {g?.confirmed_at && <p className="hint">היעד אושר ולכן לא נערך. שינוי ביעד או בנקודת הפתיחה יישמר כגרסה חדשה שהמשתתף יאשר מחדש, והגרסה הקודמת נשמרת. עדכון &quot;עמידה ביעד&quot; בלבד לא יוצר גרסה.</p>}
                <div className="field">
                  <label htmlFor="goal_text">היעד במילים</label>
                  <input id="goal_text" name="goal_text" type="text" defaultValue={g?.goal_text ?? ''} required />
                </div>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="goal_type">סוג</label>
                    <select id="goal_type" name="goal_type" defaultValue={g?.goal_type ?? 'weight'}>
                      <option value="weight">משקל</option>
                      <option value="body_fat">אחוז שומן</option>
                      <option value="measurements">היקפים</option>
                      <option value="attendance">נוכחות</option>
                      <option value="other">אחר</option>
                    </select>
                  </div>
                  <div className="field"><label htmlFor="goal_value">ערך יעד</label><input id="goal_value" name="goal_value" type="number" step="0.1" defaultValue={g?.goal_value ?? ''} /></div>
                  <div className="field"><label htmlFor="start_weight">משקל פתיחה</label><input id="start_weight" name="start_weight" type="number" step="0.1" defaultValue={g?.start_weight ?? ''} /></div>
                  <div className="field"><label htmlFor="start_body_fat">אחוז שומן בפתיחה</label><input id="start_body_fat" name="start_body_fat" type="number" step="0.1" defaultValue={g?.start_body_fat ?? ''} /></div>
                </div>
                <div className="field"><label htmlFor="start_measurements">היקפים בפתיחה</label><input id="start_measurements" name="start_measurements" type="text" defaultValue={g?.start_measurements ?? ''} /></div>
                <div className="field"><label htmlFor="goal_why">למה זה חשוב לו/ה</label><input id="goal_why" name="goal_why" type="text" defaultValue={g?.goal_why ?? ''} /></div>
                <div className="field">
                  <label htmlFor="achieved">עמידה ביעד (ממולא ביום 42)</label>
                  <select id="achieved" name="achieved" defaultValue={g?.achieved == null ? '' : g.achieved ? 'yes' : 'no'}>
                    <option value="">עוד לא נקבע</option>
                    <option value="yes">כן, עמד ביעד</option>
                    <option value="no">לא עמד ביעד</option>
                  </select>
                </div>
              </ActionForm>
            ) : (
              <p>{g?.goal_text ?? <span className="hint">עוד לא נקבע יעד</span>}</p>
            )}
            {previous.length > 0 && (
              <details className="goal-history">
                <summary>גרסאות קודמות (<span className="num">{previous.length}</span>)</summary>
                {previous.map((x) => (
                  <div key={x.id} className="goal-version">
                    <strong>{x.goal_text}</strong>
                    <div className="hint">
                      {GOAL_TYPE_LABEL[x.goal_type]}{x.start_weight != null ? ` · פתיחה ${x.start_weight} ק״ג` : ''} · תועד {x.recorded_at ? dateTimeIL(x.recorded_at) : '—'} ·{' '}
                      {x.confirmed_at ? `אושר ${dateTimeIL(x.confirmed_at)}` : 'לא אושר'}
                      {x.external_pdf_url && <> · <a className="link" href={x.external_pdf_url} target="_blank" rel="noreferrer">PDF</a></>}
                    </div>
                  </div>
                ))}
              </details>
            )}
          </section>
        </div>
      </div>
    </>
  )
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="card kpi" style={{ padding: 16 }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-val">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}
