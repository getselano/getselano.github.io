import React, { useEffect, useRef, useState } from 'react'
import { t } from '../../../../theme/tokens'
import { useApp } from '../../../../store/AppStore'
import { Card, Button, Badge, SectionHeader } from '../../../../components/ui/UI'
import { DisclaimerNote } from '../../../../components/legal/DisclaimerNote'
import { useLongPress, HoldIndicator, ConfirmDeleteSheet } from '../../../../components/ui/LongPressDelete'
import { groupedMovements, searchMovements } from '../../../../data/liftCriteria'
import { analyzeVideo, POSE_LIMITS, runDiagnostics } from '../../../../services/poseAnalysis'
import { coachTechnique, aiEnabled } from '../../../../services/aiCoach'
import {
  saveClip, attachCoaching, listClips, getClip, deleteClip, deleteAllClips,
  purgeExpired, archiveStats, formatBytes, daysLeft, takeSaveError, RETENTION_DAYS,
} from '../../../../services/techniqueArchive'
import { movementName } from '../../../../data/movementName'

// Technique review. Three taps to the analysis: pick the movement, hand over
// a clip, read the report.
//
// The video is processed entirely on-device — it is never uploaded. Only a
// few stills and the measured angles reach Gemini for the coaching wording.
// The clip is kept in IndexedDB on this device so the report survives a
// refresh; see techniqueArchive for the retention policy.

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
  const [query, setQuery] = useState('')
  const [view, setView] = useState('new')      // new | archive
  const [clips, setClips] = useState([])
  const [stats, setStats] = useState({ count: 0, bytes: 0 })
  const [purged, setPurged] = useState(0)
  const [openClip, setOpenClip] = useState(null)
  const [saveWarning, setSaveWarning] = useState('')
  const [diag, setDiag] = useState(null)      // null | 'running' | {steps, ok}
  const savedIdRef = useRef(null)
  // Two separate inputs: `capture` forces the camera on mobile and skips the
  // gallery entirely, so picking an existing clip needs its own input without it.
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const abortRef = useRef(null)

  // Expired clips go on open, so storage never grows unattended and the user
  // is told what was removed rather than finding clips silently gone.
  const refreshArchive = async () => {
    const [list, st] = await Promise.all([listClips(), archiveStats()])
    setClips(list)
    setStats(st)
  }

  useEffect(() => {
    let alive = true
    ;(async () => {
      const removed = await purgeExpired()
      if (!alive) return
      if (removed) setPurged(removed)
      await refreshArchive()
    })()
    return () => { alive = false }
  }, [])

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
      // The movement goes in so the analyzer can annotate faulted frames while
      // the video element is still alive — it is disposed when this returns.
      const analysis = await analyzeVideo(file, {
        movement,
        signal: ctrl.signal,
        onProgress: (s, p) => {
          setStage(s)
          if (typeof p === 'number') setProgress(p)
        },
      })
      if (ctrl.signal.aborted) return

      const findings = analysis.findings
      setResult(analysis)
      setPhase('done')

      // Archive locally so the report survives a refresh. Failure here is
      // logged inside the service and must not affect the visible result.
      savedIdRef.current = await saveClip({
        videoBlob: file,
        movement,
        summary: analysis.summary,
        findings,
        stills: analysis.stills,
        duration: analysis.duration,
        coverage: analysis.coverage,
        confidence: analysis.confidence,
      })
      // A clip that silently failed to save would just never show up in the
      // archive, which reads as the feature being broken.
      setSaveWarning(savedIdRef.current ? '' : (takeSaveError() || ''))
      refreshArchive()

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
        if (text && savedIdRef.current) {
          attachCoaching(savedIdRef.current, text).then(refreshArchive)
        }
        setStage('')
      }
    } catch (err) {
      if (ctrl.signal.aborted || err?.message === 'aborted') return
      setError(err?.message || 'הניתוח נכשל. נסה שוב עם קליפ אחר.')
      setPhase('error')
    }
  }

  // ── A saved clip, reopened ──
  if (openClip) {
    return (
      <SavedClipView
        clip={openClip}
        onBack={() => setOpenClip(null)}
        onDeleted={async (id) => {
          await deleteClip(id)
          setOpenClip(null)
          refreshArchive()
        }}
      />
    )
  }

  // ── The archive ──
  if (view === 'archive' && !movement) {
    return (
      <ArchiveView
        clips={clips}
        stats={stats}
        onBack={() => setView('new')}
        onOpen={async (id) => setOpenClip(await getClip(id))}
        onDelete={async (id) => { await deleteClip(id); refreshArchive() }}
        onClearAll={async () => { await deleteAllClips(); refreshArchive() }}
      />
    )
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

        {purged > 0 && (
          <Card style={{ marginBottom: 12, background: `${t.color.info}0d`, borderColor: t.color.info }}>
            <div style={{ fontSize: 12, color: t.color.textDim, lineHeight: 1.7 }}>
              {purged} סרטונים ישנים נמחקו אוטומטית (מעל {RETENTION_DAYS} ימים).
            </div>
          </Card>
        )}

        <DiagnosticsPanel
          diag={diag}
          onRun={async () => { setDiag('running'); setDiag(await runDiagnostics()) }}
          onDismiss={() => setDiag(null)}
        />

        {/* Always shown, including at zero. Hiding it until the first clip
            saved meant the archive was invisible to anyone whose analyses had
            been failing — exactly the people looking for where clips went. */}
        <button onClick={() => setView('archive')} style={{
          width:'100%', textAlign:'start', fontFamily:'inherit', cursor:'pointer',
          background: t.color.bgSoft,
          border:`1px solid ${clips.length ? t.color.gold : t.color.border}`,
          borderRadius: t.radius.md, padding:'13px 16px', color: t.color.text,
          display:'flex', alignItems:'center', gap: 12, marginBottom: 16,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>הסרטונים המתוקנים שלי</div>
            <div style={{ fontSize: 11, color: t.color.textDim, marginTop: 2 }}>
              {clips.length
                ? `${stats.count} שמורים · ${formatBytes(stats.bytes)}`
                : 'עדיין ריק — כל בדיקה שתריץ תישמר כאן'}
            </div>
          </div>
          {clips.length > 0 && <Badge color={t.color.gold}>{stats.count}</Badge>}
          <span style={{ fontSize: 20, color: t.color.gold }}>›</span>
        </button>
        <MovementSearch value={query} onChange={setQuery} />

        {/* A query flattens the list — groups only help when browsing */}
        {query.trim() ? (
          <SearchResults
            discipline={discipline}
            query={query}
            onPick={setMovement}
            onClear={() => setQuery('')}
          />
        ) : (
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
                    <MovementRow key={m.id} movement={m} onPick={() => setMovement(m)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Step 2/3: capture and report ──
  return (
    <div>
      <BackRow onClose={() => (phase === 'idle' ? setMovement(null) : reset())}
        label={phase === 'idle' ? '← בחר תרגיל אחר' : '← התחל מחדש'} />

      <SectionHeader title={movementName(movement)} />

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
            הסרטון מנותח ונשמר על המכשיר שלך בלבד — הוא לא מועלה לשום שרת,
            ונמחק אוטומטית אחרי {RETENTION_DAYS} ימים.
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
        <>
          {saveWarning && (
            <Card style={{ marginBottom: 14, borderColor: t.color.warning, background: `${t.color.warning}10` }}>
              <div style={{ fontWeight: 700, color: t.color.warning, marginBottom: 4, fontSize: 13 }}>
                הסרטון לא נשמר
              </div>
              <div style={{ fontSize: 12, color: t.color.textDim, lineHeight: 1.7 }}>{saveWarning}</div>
            </Card>
          )}
          <Report result={result} movement={movement} coaching={coaching} stage={stage} onRetry={reset} />
        </>
      )}
    </div>
  )
}

// Typing beats scrolling once the list passes ~20 entries. Matches Hebrew and
// English names plus the internal id, so "power clean", "פאוור" and
// "power_clean" all land on the same movement.
// A four-way check of the things that can independently break this feature.
// Without it a failure is just "it doesn't work", which is not something
// either the user or we can act on.
function DiagnosticsPanel({ diag, onRun, onDismiss }) {
  if (!diag) {
    return (
      <button onClick={onRun} style={{
        background:'transparent', border:`1px solid ${t.color.border}`,
        color: t.color.textDim, padding:'7px 12px', borderRadius: t.radius.sm,
        cursor:'pointer', fontFamily:'inherit', fontSize: 12, marginBottom: 14,
      }}>הבדיקה לא עובדת? הרץ בדיקת תקינות</button>
    )
  }

  if (diag === 'running') {
    return (
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: t.color.textDim }}>בודק…</div>
      </Card>
    )
  }

  const failed = diag.steps.filter(s => !s.ok)
  return (
    <Card style={{
      marginBottom: 14,
      borderColor: diag.ok ? t.color.success : t.color.danger,
      background: diag.ok ? `${t.color.success}0d` : `${t.color.danger}0d`,
    }}>
      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 10, color: diag.ok ? t.color.success : t.color.danger }}>
        {diag.ok ? 'הכל תקין' : `נמצאה תקלה ב-${failed.length} שלבים`}
      </div>

      <div style={{ display:'grid', gap: 8 }}>
        {diag.steps.map(s => (
          <div key={s.label} style={{
            display:'flex', gap: 10, alignItems:'flex-start',
            padding: 8, background: t.color.bgSoft, borderRadius: t.radius.sm,
            borderInlineStart: `3px solid ${s.ok ? t.color.success : t.color.danger}`,
          }}>
            <span style={{
              color: s.ok ? t.color.success : t.color.danger,
              fontWeight: 900, fontSize: 13, flexShrink: 0, lineHeight: 1.5,
            }}>{s.ok ? '✓' : '✕'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: t.color.textDim, marginTop: 2, lineHeight: 1.6 }}>
                {s.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!diag.ok && (
        <div style={{ fontSize: 11, color: t.color.textMuted, marginTop: 10, lineHeight: 1.7 }}>
          צלם מסך של הרשימה הזו ושלח אותה — היא מראה בדיוק איזה שלב נכשל.
        </div>
      )}

      <div style={{ display:'flex', gap: 8, marginTop: 12 }}>
        <Button variant="ghost" size="sm" onClick={onRun}>בדוק שוב</Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>סגור</Button>
      </div>
    </Card>
  )
}

// ─── Archive ──────────────────────────────────────────────────────

function ArchiveView({ clips, stats, onBack, onOpen, onDelete, onClearAll }) {
  const [clearing, setClearing] = useState(false)
  return (
    <div>
      <BackRow onClose={onBack} label="← חזרה לבדיקה חדשה" />
      <SectionHeader
        title="הסרטונים המתוקנים שלי"
        subtitle={`${stats.count} סרטונים · ${formatBytes(stats.bytes)} על המכשיר`}
      />

      <Card style={{ marginBottom: 14, background: `${t.color.info}0d`, borderColor: t.color.info }}>
        <div style={{ fontSize: 12, color: t.color.textDim, lineHeight: 1.7 }}>
          הסרטונים נשמרים על המכשיר שלך בלבד — לא מועלים לשום שרת.
          כל סרטון נמחק אוטומטית אחרי {RETENTION_DAYS} ימים כדי לא לתפוס מקום.
          <br />
          <b style={{ color: t.color.text }}>לחיצה ארוכה על סרטון</b> פותחת מחיקה.
        </div>
      </Card>

      {!clips.length ? (
        <Card>
          <div style={{ fontSize: 13, color: t.color.textDim, lineHeight: 1.7 }}>
            אין סרטונים שמורים. כל בדיקה שתריץ תישמר כאן אוטומטית.
          </div>
        </Card>
      ) : (
        <>
          <div style={{ display:'grid', gap: 10 }}>
            {clips.map(c => <ClipRow key={c.id} clip={c} onOpen={onOpen} onDelete={onDelete} />)}
          </div>

          <ConfirmDeleteSheet
            open={clearing}
            title={`למחוק את כל ${clips.length} הסרטונים?`}
            body="כל הסרטונים והדוחות יימחקו מהמכשיר. אי אפשר לשחזר."
            confirmLabel="מחק הכל"
            onCancel={() => setClearing(false)}
            onConfirm={() => { setClearing(false); onClearAll() }}
          />

          <button
            onClick={() => setClearing(true)}
            style={{
              width:'100%', marginTop: 16, padding: 12, cursor:'pointer', fontFamily:'inherit',
              background:'transparent', border:`1px solid ${t.color.danger}`,
              color: t.color.danger, borderRadius: t.radius.sm, fontSize: 13, fontWeight: 700,
            }}
          >מחק את כל הסרטונים</button>
        </>
      )}
    </div>
  )
}

function ClipRow({ clip: c, onOpen, onDelete }) {
  const left = daysLeft(c.createdAt)
  const problems = (c.findings || []).filter(f => !f.ok).length
  const thumb = c.findings?.find(f => f.frame?.dataUrl)?.frame?.dataUrl
    || c.stills?.[0]?.dataUrl

  const [confirming, setConfirming] = useState(false)
  const hold = useLongPress({ onTrigger: () => setConfirming(true) })

  return (
    <div
      {...hold.handlers}
      style={{
        position:'relative',
        display:'flex', gap: 12, alignItems:'center', padding: 10,
        background: t.color.bgSoft, border:`1px solid ${t.color.border}`,
        borderRadius: t.radius.md,
        // Without this the browser claims the gesture for text selection or
        // its own callout before the hold completes.
        userSelect:'none', WebkitUserSelect:'none', WebkitTouchCallout:'none',
      }}
    >
      <HoldIndicator progress={hold.progress} />

      <ConfirmDeleteSheet
        open={confirming}
        title={`למחוק את ${c.movementHe}?`}
        body={`הסרטון והדוח יימחקו מהמכשיר. אי אפשר לשחזר.`}
        onCancel={() => setConfirming(false)}
        onConfirm={() => { setConfirming(false); onDelete(c.id) }}
      />

      <button
        onClick={() => { if (!hold.consumedClick()) onOpen(c.id) }}
        style={{
          flex: 1, minWidth: 0, display:'flex', gap: 12, alignItems:'center',
          background:'transparent', border:'none', color: t.color.text,
          cursor:'pointer', fontFamily:'inherit', textAlign:'start', padding: 0,
        }}>
        {thumb && (
          <img src={thumb} alt="" style={{
            width: 64, height: 64, objectFit:'cover', borderRadius: t.radius.sm, flexShrink: 0,
          }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: t.color.gold }}>{c.movementHe}</div>
          <div style={{ fontSize: 11, color: t.color.textDim, marginTop: 2 }}>
            {new Date(c.createdAt).toLocaleDateString('he-IL')} ·{' '}
            {new Date(c.createdAt).toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit' })}
            {c.videoSize ? ` · ${formatBytes(c.videoSize)}` : ''}
          </div>
          <div style={{ display:'flex', gap: 6, marginTop: 5, flexWrap:'wrap' }}>
            <Badge color={problems ? t.color.warning : t.color.success}>
              {problems ? `${problems} לתיקון` : 'תקין'}
            </Badge>
            <Badge color={left <= 2 ? t.color.danger : t.color.textDim}>
              {left === 0 ? 'נמחק היום' : `עוד ${left} ימים`}
            </Badge>
          </div>
        </div>
      </button>

    </div>
  )
}

// A reopened clip: the video itself plus the report exactly as it was, rebuilt
// from what was stored rather than by re-running pose detection.
function SavedClipView({ clip: c, onBack, onDeleted }) {
  const [videoUrl, setVideoUrl] = useState(null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!c.videoBlob) return
    const url = URL.createObjectURL(c.videoBlob)
    setVideoUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [c.videoBlob])

  const problems = (c.findings || []).filter(f => !f.ok)
  const good = (c.findings || []).filter(f => f.ok)
  const left = daysLeft(c.createdAt)

  return (
    <div>
      <BackRow onClose={onBack} label="← חזרה לסרטונים" />
      <SectionHeader
        title={c.movementHe}
        subtitle={`${new Date(c.createdAt).toLocaleDateString('he-IL')} · ${c.duration}ש׳ · נמחק בעוד ${left} ימים`}
      />

      <div style={{ display:'grid', gap: 14 }}>
        {videoUrl && (
          <Card style={{ padding: 0, overflow:'hidden' }}>
            <video
              src={videoUrl}
              controls
              playsInline
              style={{ width:'100%', display:'block', background:'#000' }}
            />
          </Card>
        )}

        <CorrectionsNavigator problems={problems} />

        <KeyMoments stills={c.stills} />

        {good.length > 0 && (
          <Card>
            <SectionHeader title="מה היה תקין" action={<Badge color={t.color.success}>{good.length}</Badge>} />
            <div style={{ display:'grid', gap: 8 }}>
              {good.map(f => (
                <div key={f.id} style={{
                  padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm,
                  borderInlineStart:`3px solid ${t.color.success}`,
                }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{f.he}</div>
                  <div style={{ fontSize: 12, color: t.color.textDim, marginTop: 3 }}>{f.message}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {c.coaching && (
          <Card style={{ borderColor: t.color.gold }}>
            <SectionHeader title="הערות מאמן" />
            <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace:'pre-wrap' }}>{c.coaching}</div>
          </Card>
        )}

        <ConfirmDeleteSheet
          open={confirming}
          title={`למחוק את ${c.movementHe}?`}
          body="הסרטון והדוח יימחקו מהמכשיר. אי אפשר לשחזר."
          onCancel={() => setConfirming(false)}
          onConfirm={() => { setConfirming(false); onDeleted(c.id) }}
        />

        <button
          onClick={() => setConfirming(true)}
          style={{
            width:'100%', padding: 12, cursor:'pointer', fontFamily:'inherit',
            background:'transparent', border:`1px solid ${t.color.danger}`,
            color: t.color.danger, borderRadius: t.radius.sm, fontSize: 13, fontWeight: 700,
          }}
        >מחק סרטון</button>
      </div>
    </div>
  )
}

// The three positions a coach actually stops the video on — the start, the
// bottom, the lockout — each judged against the movement's own criteria.
//
// This used to print "knee 172° · hip 158°" under each still, which is a
// measurement, not a verdict: nothing in it tells the user whether that
// position was right. Every moment now says whether it held up, and names
// what did or did not.
function KeyMoments({ stills }) {
  if (!stills?.length) return null

  return (
    <Card>
      <SectionHeader
        title="הפוזיציות שנבדקו"
        subtitle="שלושת הרגעים שקובעים בהרמה — ומה היה נכון בכל אחד"
      />
      <div style={{ display:'grid', gap: 12 }}>
        {stills.map(s => <KeyMomentRow key={s.t} still={s} />)}
      </div>
    </Card>
  )
}

function KeyMomentRow({ still: s }) {
  const v = s.verdict
  const state = v?.verdict || 'unknown'
  const color = state === 'ok' ? t.color.success
    : state === 'fix' ? t.color.warning
    : t.color.silver2

  const badgeText = state === 'ok' ? 'תקין'
    : state === 'fix' ? 'לתיקון'
    : state === 'reference' ? 'נקודת ייחוס'
    : 'לא נמדד'

  return (
    <div style={{
      display:'flex', gap: 12, alignItems:'flex-start',
      padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm,
      borderInlineStart: `3px solid ${color}`,
    }}>
      <img
        src={s.dataUrl}
        alt={s.label}
        style={{ width: 92, borderRadius: t.radius.sm, display:'block', flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 800 }}>{s.label}</span>
          <Badge color={color}>{badgeText}</Badge>
        </div>

        {/* What held up, and what did not — by name, not by number alone */}
        {v?.failed?.length > 0 && (
          <div style={{ marginTop: 6, display:'grid', gap: 3 }}>
            {v.failed.map(f => (
              <div key={f.id} style={{ fontSize: 12, color: t.color.textDim, lineHeight: 1.6 }}>
                <span style={{ color: t.color.warning, fontWeight: 700 }}>✕</span>{' '}
                {f.he}
                {f.value != null && (
                  <span style={{ fontFamily: t.font.family.mono, color: t.color.textMuted }}>
                    {' '}— {f.value}° מול {f.targetHe}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {v?.passed?.length > 0 && (
          <div style={{ marginTop: 6, display:'grid', gap: 3 }}>
            {v.passed.map(f => (
              <div key={f.id} style={{ fontSize: 12, color: t.color.textDim, lineHeight: 1.6 }}>
                <span style={{ color: t.color.success, fontWeight: 700 }}>✓</span>{' '}
                {f.he}
                {f.value != null && (
                  <span style={{ fontFamily: t.font.family.mono, color: t.color.textMuted }}>
                    {' '}— {f.value}°
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {state === 'reference' && (
          <div style={{ fontSize: 12, color: t.color.textMuted, marginTop: 6, lineHeight: 1.6 }}>
            תנוחת הפתיחה — נקודת ההשוואה לשתי הפוזיציות הבאות, לא נבדקת בפני עצמה.
          </div>
        )}

        {state === 'unknown' && (
          <div style={{ fontSize: 12, color: t.color.textMuted, marginTop: 6, lineHeight: 1.6 }}>
            לא ניתן היה למדוד את הקריטריונים של התרגיל בפוזיציה הזו.
          </div>
        )}
      </div>
    </div>
  )
}

// Corrections one at a time, with a way to step between them.
//
// Stacking several annotated frames vertically means scrolling past a
// screenshot-sized image to reach each next fault, and losing track of how
// many there were. Stepping keeps one fault in view with its position stated;
// the full list stays one tap away for anyone who wants to scan it.
function CorrectionsNavigator({ problems, subtitle }) {
  const [index, setIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)

  if (!problems.length) return null

  // Guard the cursor: a re-analysis can return fewer faults than before.
  const i = Math.min(index, problems.length - 1)
  const single = problems.length === 1

  return (
    <div>
      <SectionHeader
        title={`${problems.length} תיקונים`}
        subtitle={subtitle}
        action={!single && (
          <button
            onClick={() => setShowAll(v => !v)}
            style={{
              background:'transparent', border:`1px solid ${t.color.border}`,
              color: t.color.textDim, padding:'6px 10px', borderRadius: t.radius.sm,
              cursor:'pointer', fontFamily:'inherit', fontSize: 11, fontWeight: 700,
            }}
          >{showAll ? 'אחד-אחד' : 'הצג הכל'}</button>
        )}
      />

      {showAll || single ? (
        <div style={{ display:'grid', gap: 14 }}>
          {problems.map(f => <CorrectionCard key={f.id} finding={f} />)}
        </div>
      ) : (
        <Filmstrip
          count={problems.length}
          index={i}
          onIndexChange={setIndex}
          label={n => `תיקון ${n + 1} מתוך ${problems.length}`}
          dotColor={t.color.warning}
        >
          {problems.map(f => <CorrectionCard key={f.id} finding={f} />)}
        </Filmstrip>
      )}
    </div>
  )
}

// A horizontally swipeable strip, one item per screen.
//
// Swiping is how you move through images on a phone; arrows are a desktop
// habit. Scroll-snap does the paging natively, which keeps the gesture at the
// speed of the finger instead of animating from React state.
function Filmstrip({ children, count, index, onIndexChange, label, dotColor }) {
  const scroller = useRef(null)
  const items = React.Children.toArray(children)

  // Scroll position is the source of truth while the finger is down; this only
  // reads it back so the counter and dots stay in step.
  const onScroll = () => {
    const el = scroller.current
    if (!el) return
    const width = el.clientWidth || 1
    // RTL scrollLeft is negative in most engines and positive in some, so the
    // magnitude is what can be relied on.
    const next = Math.round(Math.abs(el.scrollLeft) / width)
    if (next !== index && next >= 0 && next < count) onIndexChange(next)
  }

  const jumpTo = (n) => {
    const el = scroller.current
    if (!el) return onIndexChange(n)
    const width = el.clientWidth || 1
    const sign = el.scrollLeft <= 0 ? -1 : 1
    el.scrollTo({ left: sign * n * width, behavior: 'smooth' })
    onIndexChange(n)
  }

  return (
    <div>
      <div
        ref={scroller}
        onScroll={onScroll}
        style={{
          display:'flex', overflowX:'auto', overflowY:'hidden',
          scrollSnapType:'x mandatory', scrollbarWidth:'none',
          WebkitOverflowScrolling:'touch', gap: 0,
        }}
      >
        {items.map((child, n) => (
          <div key={n} style={{
            flex:'0 0 100%', minWidth:'100%', scrollSnapAlign:'center',
            // Keeps neighbours from bleeding into the active card's edges.
            paddingInline: 1, boxSizing:'border-box',
          }}>{child}</div>
        ))}
      </div>

      <div style={{ marginTop: 12, textAlign:'center' }}>
        <div style={{ fontSize: 12, fontWeight: 800 }}>{label(index)}</div>
        <div style={{ display:'flex', gap: 5, justifyContent:'center', marginTop: 6 }}>
          {Array.from({ length: count }, (_, n) => (
            <button
              key={n}
              onClick={() => jumpTo(n)}
              aria-label={`${n + 1}`}
              style={{
                width: n === index ? 18 : 7, height: 7, borderRadius: 999,
                border:'none', padding: 0, cursor:'pointer',
                background: n === index ? dotColor : t.color.border,
                transition: t.transition,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 10, color: t.color.textMuted, marginTop: 6 }}>
          החלק הצידה למעבר
        </div>
      </div>
    </div>
  )
}

// One fault, shown on the frame where it actually happened. The overlay marks
// the joint and prints measured against required; the text below spells out
// the gap in words and what to do about it.
function CorrectionCard({ finding: f }) {
  const m = f.measured
  return (
    <Card style={{ borderColor: t.color.warning, padding: 0, overflow:'hidden' }}>
      {f.frame?.dataUrl && (
        <img
          src={f.frame.dataUrl}
          alt={f.he}
          style={{ width:'100%', display:'block', background: t.color.bg }}
        />
      )}

      <div style={{ padding: 14 }}>
        <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap', marginBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>{f.he}</span>
          <Badge color={t.color.warning}>לתיקון</Badge>
          {f.frame?.t != null && (
            <span style={{ fontSize: 11, color: t.color.textMuted, fontFamily: t.font.family.mono }}>
              שנייה {f.frame.t}
            </span>
          )}
        </div>

        {/* measured vs required, side by side */}
        {m && (
          <div style={{
            display:'grid', gridTemplateColumns:'1fr auto 1fr', gap: 10,
            alignItems:'center', marginBottom: 12,
            padding: 12, background: t.color.bgSoft, borderRadius: t.radius.sm,
          }}>
            <div style={{ textAlign:'center' }}>
              <div style={{
                fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.16em',
                color: t.color.silver2, fontWeight: 700, marginBottom: 4,
              }}>בוצע בפועל</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: t.color.warning, lineHeight: 1 }}>
                {Math.round(m.value)}°
              </div>
            </div>

            <div style={{ fontSize: 20, color: t.color.textMuted }}>←</div>

            <div style={{ textAlign:'center' }}>
              <div style={{
                fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.16em',
                color: t.color.silver2, fontWeight: 700, marginBottom: 4,
              }}>נדרש</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: t.color.success, lineHeight: 1 }}>
                {m.type === 'atLeast' ? '≥' : '≤'}{m.limit}°
              </div>
            </div>
          </div>
        )}

        {m && (
          <div style={{ fontSize: 12, color: t.color.textDim, marginBottom: 10, lineHeight: 1.7 }}>
            {m.jointHe} הגיעה ל-<b style={{ color: t.color.warning }}>{Math.round(m.value)}°</b>,
            והתרגיל דורש {m.targetHe} — פער של{' '}
            <b style={{ color: t.color.text }}>{Math.abs(Math.round(m.delta))}°</b>.
          </div>
        )}

        <div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>{f.message}</div>

        {f.tip && (
          <div style={{
            padding: 10, background: t.color.goldGlow, borderRadius: t.radius.sm,
            borderInlineStart: `3px solid ${t.color.gold}`,
          }}>
            <div style={{
              fontFamily: t.font.family.mono, fontSize: 9, letterSpacing:'0.16em',
              color: t.color.gold, fontWeight: 700, textTransform:'uppercase', marginBottom: 4,
            }}>איך מתקנים</div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>{f.tip}</div>
          </div>
        )}
      </div>
    </Card>
  )
}

function MovementSearch({ value, onChange }) {
  return (
    <div style={{ position:'relative', marginBottom: 16 }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="חפש תרגיל — בעברית או באנגלית"
        dir="auto"
        style={{
          width:'100%', padding:'13px 44px 13px 16px',
          background: t.color.bgSoft, border:`1px solid ${t.color.border}`,
          borderRadius: t.radius.md, color: t.color.text,
          fontFamily:'inherit', fontSize: 15, outline:'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = t.color.gold }}
        onBlur={e => { e.currentTarget.style.borderColor = t.color.border }}
      />
      {value ? (
        <button
          onClick={() => onChange('')}
          aria-label="נקה חיפוש"
          style={{
            position:'absolute', insetInlineEnd: 8, top:'50%', transform:'translateY(-50%)',
            width: 28, height: 28, borderRadius:'50%',
            background: t.color.bgCard, border:`1px solid ${t.color.border}`,
            color: t.color.text, cursor:'pointer', fontFamily:'inherit',
            fontSize: 14, lineHeight: 1, padding: 0,
          }}
        >×</button>
      ) : (
        <span style={{
          position:'absolute', insetInlineEnd: 14, top:'50%', transform:'translateY(-50%)',
          color: t.color.silver3, fontSize: 15, pointerEvents:'none',
        }}>⌕</span>
      )}
    </div>
  )
}

function SearchResults({ discipline, query, onPick, onClear }) {
  const results = searchMovements(discipline, query)
  if (!results.length) {
    return (
      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          לא נמצא תרגיל בשם "{query}"
        </div>
        <div style={{ fontSize: 12, color: t.color.textDim, lineHeight: 1.7 }}>
          נסה שם באנגלית (למשל "front squat" או "muscle up"), או נקה את החיפוש
          כדי לעיין ברשימה המלאה.
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} style={{ marginTop: 12 }}>
          נקה חיפוש
        </Button>
      </Card>
    )
  }
  return (
    <div>
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 10, letterSpacing:'0.2em',
        color: t.color.silver2, fontWeight: 700, textTransform:'uppercase', marginBottom: 8,
      }}>{results.length} תוצאות</div>
      <div style={{ display:'grid', gap: 8 }}>
        {results.map(m => (
          <MovementRow key={m.id} movement={m} onPick={() => onPick(m)} showGroup />
        ))}
      </div>
    </div>
  )
}

function MovementRow({ movement: m, onPick, showGroup }) {
  return (
    <button onClick={onPick} style={{
      width:'100%', textAlign:'start', fontFamily:'inherit', cursor:'pointer',
      background: t.color.bgSoft, border: `1px solid ${t.color.border}`,
      borderRadius: t.radius.md, padding:'13px 16px', color: t.color.text,
      display:'flex', alignItems:'center', gap: 12, transition: t.transition,
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = t.color.gold }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = t.color.border }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: t.color.gold }}>{movementName(m)}</div>
        <div style={{ fontSize: 11, color: t.color.textDim, marginTop: 2 }}>
          {m.en}{showGroup && m.groupLabel ? ` · ${m.groupLabel}` : ''}
        </div>
      </div>
      <span style={{ fontSize: 20, color: t.color.gold }}>›</span>
    </button>
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
  const [elapsed, setElapsed] = useState(0)

  // Analysis is genuinely slow on a phone — tens of seconds for a long clip.
  // Without a moving number a working app is indistinguishable from a stuck
  // one, and the user reasonably concludes it failed.
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Extrapolate from how far it has actually come, once there is enough
  // progress for the estimate to mean anything.
  const remaining = progress > 0.08 && elapsed > 2
    ? Math.max(0, Math.round(elapsed / progress - elapsed))
    : null

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
      <div style={{
        display:'flex', justifyContent:'space-between', gap: 8,
        fontSize: 11, color: t.color.textMuted, marginTop: 6,
      }}>
        <span>{stage === 'analyzing' ? `${pct}%` : ''}</span>
        <span>
          {remaining != null
            ? `נותרו כ-${remaining} שניות`
            : `${elapsed} שניות`}
        </span>
      </div>

      <div style={{ fontSize: 11, color: t.color.textMuted, marginTop: 8, lineHeight: 1.6 }}>
        הניתוח רץ על המכשיר שלך — אל תסגור את המסך. סרטון ארוך לוקח יותר זמן.
      </div>

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

      {/* Each fault, on the frame it happened, with the required angle */}
      <CorrectionsNavigator
        problems={problems}
        subtitle={`${duration} שניות · ${Math.round(coverage * 100)}% מהפריימים זוהו`}
      />

      {good.length > 0 && (
        <Card>
          <SectionHeader
            title="מה היה תקין"
            action={<Badge color={t.color.success}>{good.length}</Badge>}
          />
          <div style={{ display:'grid', gap: 8 }}>
            {good.map(f => (
              <div key={f.id} style={{
                padding: 10, background: t.color.bgSoft, borderRadius: t.radius.sm,
                borderInlineStart: `3px solid ${t.color.success}`,
              }}>
                <div style={{ display:'flex', gap: 8, alignItems:'center', flexWrap:'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{f.he}</span>
                  {f.measured && (
                    <span style={{ fontSize: 11, color: t.color.textMuted, fontFamily: t.font.family.mono }}>
                      {f.measured.value}°
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: t.color.textDim, marginTop: 3 }}>{f.message}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!findings.length && (
        <Card>
          <div style={{ fontSize: 13, color: t.color.textDim, lineHeight: 1.7 }}>
            לא הצלחנו למדוד אף אחד מהקריטריונים של התרגיל הזה בקליפ. נסה לצלם שוב מהצד,
            עם כל הגוף בפריים.
          </div>
        </Card>
      )}

      <KeyMoments stills={stills} />

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
