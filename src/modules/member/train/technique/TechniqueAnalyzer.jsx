import React, { useRef, useState } from 'react'
import { t } from '../../../../theme/tokens'
import { useApp } from '../../../../store/AppStore'
import { Card, Button, Badge, SectionHeader } from '../../../../components/ui/UI'
import { DisclaimerNote } from '../../../../components/legal/DisclaimerNote'
import { groupedMovements, evaluateMovement } from '../../../../data/liftCriteria'
import { analyzeVideo, POSE_LIMITS } from '../../../../services/poseAnalysis'
import { coachTechnique, aiEnabled } from '../../../../services/aiCoach'

// Technique review. Three taps to the analysis: pick the movement, hand over
// a clip, read the report.
//
// The video is processed entirely on-device and is never uploaded — only a
// few stills and the measured angles reach Gemini for the coaching wording,
// and nothing about the clip is persisted.

const MAX_FILE_MB = 120

export function TechniqueAnalyzer({ discipline, onClose }) {
  const { state } = useApp()
  const groups = groupedMovements(discipline)

  const [movement, setMovement] = useState(null)
  const [phase, setPhase] = useState('idle')   // idle | working | done | error
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [result, setResult] = useState(null)
  const [coaching, setCoaching] = useState(null)
  const [error, setError] = useState('')
  // Two separate inputs: `capture` forces the camera on mobile and skips the
  // gallery entirely, so picking an existing clip needs its own input without it.
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const abortRef = useRef(null)

  const reset = () => {
    abortRef.current?.abort()
    setPhase('idle'); setProgress(0); setStage(''); setResult(null)
    setCoaching(null); setError('')
    // Clearing the value lets the same file be re-picked and re-analyzed.
    if (cameraRef.current) cameraRef.current.value = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  const handleFile = async (file) => {
    if (!file || !movement) return
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`הקובץ גדול מדי (מעל ${MAX_FILE_MB}MB). צלם קליפ קצר יותר או באיכות נמוכה יותר.`)
      setPhase('error')
      return
    }

    const ctrl = new AbortController()
    abortRef.current = ctrl
    setPhase('working'); setError(''); setResult(null); setCoaching(null)

    try {
      const analysis = await analyzeVideo(file, {
        signal: ctrl.signal,
        onProgress: (s, p) => {
          setStage(s)
          if (typeof p === 'number') setProgress(p)
        },
      })
      if (ctrl.signal.aborted) return

      const findings = evaluateMovement(movement, analysis.summary)
      setResult({ ...analysis, findings })
      setPhase('done')

      // Coaching text is a bonus layer — the measured report already stands
      // on its own, so a failure here must not fail the analysis.
      if (aiEnabled) {
        setStage('coaching')
        const text = await coachTechnique({
          movement,
          summary: analysis.summary,
          findings,
          stills: analysis.stills,
          userContext: { experience: state.profile?.experience },
        })
        if (!ctrl.signal.aborted) setCoaching(text)
        setStage('')
      }
    } catch (err) {
      if (ctrl.signal.aborted || err?.message === 'aborted') return
      setError(err?.message || 'הניתוח נכשל. נסה שוב עם קליפ אחר.')
      setPhase('error')
    }
  }

  // ── Step 1: pick the movement ──
  if (!movement) {
    return (
      <div>
        <BackRow onClose={onClose} />
        <DisclaimerNote kind="training" />
        <SectionHeader
          title="בדיקת טכניקה"
          subtitle="בחר תרגיל, צלם או העלה קליפ, וקבל מדידת זוויות ותיקונים"
        />
        {/* Grouped so a 15-movement discipline doesn't render as one long wall */}
        <div style={{ display:'grid', gap: 20 }}>
          {groups.map(g => (
            <div key={g.key}>
              <div style={{
                fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.2em',
                color: t.color.silver2, fontWeight: 700, textTransform:'uppercase',
                marginBottom: 8,
              }}>{g.he} · {g.movements.length}</div>
              <div style={{ display:'grid', gap: 8 }}>
                {g.movements.map(m => (
                  <button key={m.id} onClick={() => setMovement(m)} style={{
                    width:'100%', textAlign:'start', fontFamily:'inherit', cursor:'pointer',
                    background: t.color.bgSoft, border: `1px solid ${t.color.border}`,
                    borderRadius: t.radius.md, padding:'13px 16px', color: t.color.text,
                    display:'flex', alignItems:'center', gap: 12, transition: t.transition,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.gold }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: t.color.gold }}>{m.he}</div>
                      <div style={{ fontSize: 11, color: t.color.textDim, marginTop: 2 }}>{m.en}</div>
                    </div>
                    <span style={{ fontSize: 20, color: t.color.gold }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Step 2/3: capture and report ──
  return (
    <div>
      <BackRow onClose={() => (phase === 'idle' ? setMovement(null) : reset())}
        label={phase === 'idle' ? '← בחר תרגיל אחר' : '← התחל מחדש'} />

      <SectionHeader title={movement.he} subtitle={movement.en} />

      {phase === 'idle' && (
        <>
          <Card style={{ marginBottom: 12, background: `${t.color.info}10`, borderColor: t.color.info }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.color.info, marginBottom: 6 }}>
              איך לצלם כדי שהמדידה תהיה נכונה
            </div>
            <div style={{ fontSize: 12, color: t.color.textDim, lineHeight: 1.7 }}>
              {movement.cameraHint}<br />
              עד {POSE_LIMITS.MAX_DURATION_SEC} שניות · 1–3 חזרות מספיקות · הטלפון יציב, לא ביד רועדת
            </div>
          </Card>

          <input
            ref={cameraRef} type="file" accept="video/*" capture="environment"
            style={{ display:'none' }}
            onChange={e => handleFile(e.target.files?.[0])}
          />
          <input
            ref={galleryRef} type="file" accept="video/*"
            style={{ display:'none' }}
            onChange={e => handleFile(e.target.files?.[0])}
          />

          <div style={{ display:'grid', gap: 10 }}>
            <Button
              variant="primary" size="lg"
              onClick={() => cameraRef.current?.click()}
              style={{ width:'100%', justifyContent:'center', padding: 16 }}
            >צלם עכשיו</Button>

            <button
              onClick={() => galleryRef.current?.click()}
              style={{
                width:'100%', padding: 16, cursor:'pointer', fontFamily:'inherit',
                background: t.color.bgSoft, color: t.color.text,
                border:`1px solid ${t.color.border}`, borderRadius: t.radius.md,
                fontSize: 15, fontWeight: 700, transition: t.transition,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.gold }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border }}
            >בחר סרטון מהגלריה</button>
          </div>

          <div style={{ fontSize: 11, color: t.color.textMuted, marginTop: 10, lineHeight: 1.6, textAlign:'center' }}>
            הסרטון מנותח על המכשיר שלך ולא נשמר בשום מקום.
            {aiEnabled ? ' רק תמונות בודדות והזוויות שנמדדו נשלחות לניסוח ההמלצות.' : ''}
          </div>
        </>
      )}

      {phase === 'working' && <Working stage={stage} progress={progress} onCancel={reset} />}

      {phase === 'error' && (
        <Card style={{ borderColor: t.color.danger, background: `${t.color.danger}10` }}>
          <div style={{ color: t.color.danger, fontWeight: 700, marginBottom: 6 }}>הניתוח נכשל</div>
          <div style={{ fontSize: 13, color: t.color.text, lineHeight: 1.6 }}>{error}</div>
          <Button variant="ghost" onClick={reset} style={{ marginTop: 12 }}>נסה שוב</Button>
        </Card>
      )}

      {phase === 'done' && result && (
        <Report result={result} movement={movement} coaching={coaching} stage={stage} onRetry={reset} />
      )}
    </div>
  )
}

function BackRow({ onClose, label = '← חזרה' }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={onClose} style={{
        background:'transparent', border:`1px solid ${t.color.border}`, color: t.color.text,
        padding:'8px 14px', borderRadius: t.radius.sm, cursor:'pointer',
        fontFamily:'inherit', fontSize: 13,
      }}>{label}</button>
    </div>
  )
}

const STAGE_LABEL = {
  'loading-model': 'טוען את מנוע הזיהוי (פעם ראשונה בלבד)…',
  decoding: 'קורא את הסרטון…',
  analyzing: 'מזהה נקודות גוף ומודד זוויות…',
  coaching: 'מנסח המלצות…',
}

function Working({ stage, progress, onCancel }) {
  const pct = Math.round((progress || 0) * 100)
  return (
    <Card>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>{STAGE_LABEL[stage] || 'מעבד…'}</div>
      <div style={{ height: 8, background: t.color.bgSoft, borderRadius: 999, overflow:'hidden' }}>
        <div style={{
          height:'100%', width: stage === 'analyzing' ? `${pct}%` : '100%',
          background: t.color.gold, borderRadius: 999,
          transition:'width .3s ease',
          opacity: stage === 'analyzing' ? 1 : 0.35,
        }} />
      </div>
      {stage === 'analyzing' && (
        <div style={{ fontSize: 11, color: t.color.textMuted, marginTop: 6 }}>{pct}%</div>
      )}
      <Button variant="ghost" size="sm" onClick={onCancel} style={{ marginTop: 12 }}>בטל</Button>
    </Card>
  )
}

function Report({ result, movement, coaching, stage, onRetry }) {
  const { findings, summary, stills, confidence, coverage, duration } = result
  const problems = findings.filter(f => !f.ok)
  const good = findings.filter(f => f.ok)
  // Below this the keypoints were too unreliable to draw conclusions from.
  const lowConfidence = confidence < 0.6 || coverage < 0.5

  return (
    <div style={{ display:'grid', gap: 14 }}>
      {lowConfidence && (
        <Card style={{ borderColor: t.color.warning, background: `${t.color.warning}12` }}>
          <div style={{ fontWeight: 700, color: t.color.warning, marginBottom: 6 }}>
            איכות הזיהוי נמוכה
          </div>
          <div style={{ fontSize: 12, color: t.color.textDim, lineHeight: 1.7 }}>
            זוהתה דמות רק ב-{Math.round(coverage * 100)}% מהפריימים, ברמת ביטחון {Math.round(confidence * 100)}%.
            המספרים למטה עלולים להיות לא מדויקים. צלם שוב מהצד, עם כל הגוף בפריים ותאורה טובה.
          </div>
        </Card>
      )}

      {/* Rule-based findings — these come from the measurements, not the AI */}
      <Card>
        <SectionHeader
          title="מה נמדד"
          subtitle={`${duration} שניות · ${Math.round(coverage * 100)}% מהפריימים זוהו`}
          action={<Badge color={problems.length ? t.color.warning : t.color.success}>
            {problems.length ? `${problems.length} לתיקון` : 'תקין'}
          </Badge>}
        />
        <div style={{ display:'grid', gap: 8 }}>
          {[...problems, ...good].map(f => (
            <div key={f.id} style={{
              padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm,
              borderInlineStart: `3px solid ${f.ok ? t.color.success : t.color.warning}`,
            }}>
              <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{f.he}</span>
                <Badge color={f.ok ? t.color.success : t.color.warning}>
                  {f.ok ? 'תקין' : 'לתיקון'}
                </Badge>
                {f.measured && (
                  <span style={{ fontSize: 11, color: t.color.textMuted, fontFamily: t.font.family.mono }}>
                    {f.measured.value}° / סף {f.measured.limit}°
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: t.color.textDim, marginTop: 4, lineHeight: 1.6 }}>{f.message}</div>
              {f.tip && (
                <div style={{ fontSize: 12, color: t.color.gold, marginTop: 6, lineHeight: 1.6 }}>{f.tip}</div>
              )}
            </div>
          ))}
          {!findings.length && (
            <div style={{ fontSize: 13, color: t.color.textDim }}>
              לא הצלחנו למדוד אף אחד מהקריטריונים של התרגיל הזה בקליפ. נסה לצלם שוב מהצד.
            </div>
          )}
        </div>
      </Card>

      {/* Key moments */}
      {stills?.length > 0 && (
        <Card>
          <SectionHeader title="נקודות מפתח" subtitle="הפריימים שזוהו אוטומטית מגובה האגן" />
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(3, stills.length)}, 1fr)`, gap: 8 }}>
            {stills.map(s => (
              <div key={s.t}>
                <img src={s.dataUrl} alt={s.label} style={{ width:'100%', borderRadius: t.radius.sm, display:'block' }} />
                <div style={{ fontSize: 11, color: t.color.textDim, marginTop: 4, textAlign:'center' }}>{s.label}</div>
                {s.measures?.knee != null && (
                  <div style={{ fontSize: 10, color: t.color.textMuted, textAlign:'center', fontFamily: t.font.family.mono }}>
                    ברך {Math.round(s.measures.knee)}° · ירך {Math.round(s.measures.hip ?? 0)}°
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI coaching wording */}
      {stage === 'coaching' && (
        <Card><div style={{ fontSize: 13, color: t.color.textDim }}>מנסח המלצות…</div></Card>
      )}
      {coaching && (
        <Card style={{ borderColor: t.color.gold }}>
          <SectionHeader title="הערות מאמן" />
          <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace:'pre-wrap' }}>{coaching}</div>
          <div style={{ fontSize: 10, color: t.color.textMuted, marginTop: 10 }}>
            נוסח על ידי AI מתוך הזוויות שנמדדו. לא ייעוץ רפואי.
          </div>
        </Card>
      )}

      {/* What this cannot see — stated rather than implied */}
      {movement.notVisible?.length > 0 && (
        <Card style={{ background: t.color.bgSoft }}>
          <div style={{
            fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.2em',
            color: t.color.silver2, fontWeight: 700, textTransform:'uppercase', marginBottom: 8,
          }}>מה הבדיקה הזו לא רואה</div>
          <ul style={{ margin: 0, paddingInlineStart: 18, fontSize: 12, color: t.color.textDim, lineHeight: 1.8 }}>
            {movement.notVisible.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </Card>
      )}

      <Button variant="ghost" onClick={onRetry} style={{ width:'100%', justifyContent:'center' }}>
        בדוק קליפ נוסף
      </Button>
    </div>
  )
}
