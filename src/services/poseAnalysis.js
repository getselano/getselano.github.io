// On-device pose analysis for lift technique review.
//
// Everything here runs in the browser: the video is decoded to a canvas,
// MediaPipe's Pose Landmarker returns 33 body keypoints per sampled frame,
// and we compute real joint angles from those points. The clip itself never
// leaves the phone — only the derived angles and a handful of stills are sent
// anywhere, which keeps this cheap and keeps a video of the user off our
// servers entirely.
//
// The WASM runtime is pulled from the pinned jsDelivr copy of the exact npm
// version we depend on (immutable per-version), while the model is served
// from our own origin so the feature does not depend on Google's bucket
// staying put.

import { evaluateMovement } from '../data/liftCriteria'

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL = `${import.meta.env.BASE_URL || '/'}mediapipe/pose_landmarker_lite.task`

// Frames per second to sample. A lift is over in a couple of seconds and the
// positions that matter are held for a fraction of one, so 10 fps is enough
// resolution while keeping a 15s clip to ~150 inferences.
const SAMPLE_FPS = 10
const MAX_DURATION_SEC = 20

// MediaPipe landmark indices we care about (BlazePose 33-point topology).
export const LM = {
  nose: 0,
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13,    rightElbow: 14,
  leftWrist: 15,    rightWrist: 16,
  leftHip: 23,      rightHip: 24,
  leftKnee: 25,     rightKnee: 26,
  leftAnkle: 27,    rightAnkle: 28,
  leftHeel: 29,     rightHeel: 30,
  leftFootIndex: 31, rightFootIndex: 32,
}

let landmarkerPromise = null

// Load once per page. The model is ~5.8 MB, so the first analysis pays a
// download and every later one is instant from HTTP cache.
async function getLandmarker(onProgress) {
  if (landmarkerPromise) return landmarkerPromise
  landmarkerPromise = (async () => {
    onProgress?.('loading-model')
    const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')

    // The runtime and the model fail for different reasons and need different
    // advice, so they're loaded in separate steps with distinct messages.
    let fileset
    try {
      fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
    } catch {
      throw new Error(
        'לא הצלחנו לטעון את מנוע הזיהוי. ייתכן שהרשת שלך חוסמת את cdn.jsdelivr.net — ' +
        'נסה רשת אחרת או כבה חוסם פרסומות.'
      )
    }

    try {
      return await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      })
    } catch {
      // GPU delegate is unavailable on some older mobile browsers; CPU is
      // slower but works everywhere, so it's worth one retry before failing.
      try {
        return await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false,
        })
      } catch {
        throw new Error('לא הצלחנו לטעון את מודל זיהוי התנועה. בדוק את חיבור האינטרנט ונסה שוב.')
      }
    }
  })().catch(err => {
    // Let the next attempt retry rather than caching a failure forever.
    landmarkerPromise = null
    throw err
  })
  return landmarkerPromise
}

// ─── Geometry ─────────────────────────────────────────────────────
// Interior angle at point b, formed by a-b-c, in degrees.
export function angleAt(a, b, c) {
  if (!a || !b || !c) return null
  const abx = a.x - b.x, aby = a.y - b.y
  const cbx = c.x - b.x, cby = c.y - b.y
  const dot = abx * cbx + aby * cby
  const magA = Math.hypot(abx, aby)
  const magC = Math.hypot(cbx, cby)
  if (!magA || !magC) return null
  const cos = Math.min(1, Math.max(-1, dot / (magA * magC)))
  return +(Math.acos(cos) * 180 / Math.PI).toFixed(1)
}

// Angle of the segment a→b measured from vertical, in degrees.
// 0 = perfectly upright, 90 = horizontal. Used for torso lean.
export function angleFromVertical(a, b) {
  if (!a || !b) return null
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (!dx && !dy) return null
  return +(Math.abs(Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI).toFixed(1))
}

const mid = (p, q) => (p && q ? { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, visibility: Math.min(p.visibility ?? 1, q.visibility ?? 1) } : null)

// Which side of the body faces the camera — measured by how far apart the
// shoulders are horizontally. A true side-on view collapses them together.
function facingSide(lm) {
  const l = lm[LM.leftShoulder], r = lm[LM.rightShoulder]
  if (!l || !r) return 'left'
  return (l.visibility ?? 0) >= (r.visibility ?? 0) ? 'left' : 'right'
}

// Per-frame joint angles. Sides are resolved to whichever is more visible so
// a clip shot from either side yields the same measurement set.
export function measureFrame(lm) {
  if (!lm || lm.length < 33) return null
  const side = facingSide(lm)
  const P = (name) => lm[LM[`${side}${name}`]]

  const shoulder = P('Shoulder'), elbow = P('Elbow'), wrist = P('Wrist')
  const hip = P('Hip'), knee = P('Knee'), ankle = P('Ankle'), foot = P('FootIndex')
  const shoulderMid = mid(lm[LM.leftShoulder], lm[LM.rightShoulder])
  const hipMid = mid(lm[LM.leftHip], lm[LM.rightHip])

  return {
    side,
    knee: angleAt(hip, knee, ankle),          // 180 = straight leg
    hip: angleAt(shoulder, hip, knee),        // 180 = fully extended
    elbow: angleAt(shoulder, elbow, wrist),
    torsoLean: angleFromVertical(hipMid, shoulderMid),   // 0 = upright
    shinAngle: angleFromVertical(ankle, knee),
    ankleDorsi: angleAt(knee, ankle, foot),
    // Depth proxy: hip height relative to knee height. Normalised coords put
    // y=0 at the top of the frame, so hip.y > knee.y means hip is BELOW knee.
    hipBelowKnee: hip && knee ? +(hip.y - knee.y).toFixed(4) : null,
    wristY: wrist?.y ?? null,
    hipY: hipMid?.y ?? null,
    // Mean visibility over the joints we actually used — our confidence signal.
    confidence: meanVisibility([shoulder, elbow, wrist, hip, knee, ankle]),
  }
}

function meanVisibility(points) {
  const vals = points.map(p => p?.visibility).filter(v => typeof v === 'number')
  if (!vals.length) return 0
  return +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(3)
}

// ─── Drawing the correction onto the frame ────────────────────────
// A number in a table is abstract; the same number drawn on the joint it came
// from is not. Each faulted frame gets the skeleton, an arc on the offending
// joint, and a label reading measured → required.

const SKELETON_COLOR = 'rgba(255,255,255,0.55)'
const JOINT_COLOR    = 'rgba(255,255,255,0.85)'
const FAULT_COLOR    = '#e0a05a'
const TARGET_COLOR   = '#6fbf85'

// Which three landmarks form each measured angle. torsoLean and shinAngle are
// segment-vs-vertical rather than three-point, and carry `vertical: true`.
function jointPoints(metric, lm) {
  const side = facingSide(lm)
  const P = (name) => lm[LM[`${side}${name}`]]
  switch (metric) {
    case 'knee':  return { a: P('Hip'),      b: P('Knee'),  c: P('Ankle') }
    case 'hip':   return { a: P('Shoulder'), b: P('Hip'),   c: P('Knee') }
    case 'elbow': return { a: P('Shoulder'), b: P('Elbow'), c: P('Wrist') }
    case 'torsoLean': return {
      a: mid(lm[LM.leftHip], lm[LM.rightHip]),
      b: mid(lm[LM.leftShoulder], lm[LM.rightShoulder]),
      vertical: true,
    }
    case 'shinAngle': return { a: P('Ankle'), b: P('Knee'), vertical: true }
    default: return null
  }
}

function drawSkeleton(ctx, lm, w, h) {
  const side = facingSide(lm)
  const P = (name) => lm[LM[`${side}${name}`]]
  const chain = [
    [P('Shoulder'), P('Elbow')], [P('Elbow'), P('Wrist')],
    [P('Shoulder'), P('Hip')],
    [P('Hip'), P('Knee')], [P('Knee'), P('Ankle')], [P('Ankle'), P('FootIndex')],
  ]
  ctx.lineWidth = Math.max(2, w / 240)
  ctx.strokeStyle = SKELETON_COLOR
  ctx.lineCap = 'round'
  for (const [p, q] of chain) {
    if (!p || !q) continue
    ctx.beginPath()
    ctx.moveTo(p.x * w, p.y * h)
    ctx.lineTo(q.x * w, q.y * h)
    ctx.stroke()
  }
  ctx.fillStyle = JOINT_COLOR
  const r = Math.max(3, w / 190)
  for (const [p] of chain) {
    if (!p) continue
    ctx.beginPath()
    ctx.arc(p.x * w, p.y * h, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Rounded label with a dark plate so it stays readable over any footage.
function drawLabel(ctx, x, y, lines, w) {
  const fs = Math.max(12, Math.round(w / 34))
  ctx.font = `700 ${fs}px system-ui, -apple-system, sans-serif`
  const widths = lines.map(l => ctx.measureText(l.text).width)
  const boxW = Math.max(...widths) + fs
  const boxH = lines.length * fs * 1.45 + fs * 0.6
  // Keep the plate inside the frame
  const bx = Math.min(Math.max(4, x), w - boxW - 4)
  const by = Math.max(4, y)

  ctx.fillStyle = 'rgba(12,10,8,0.82)'
  ctx.beginPath()
  const rad = fs * 0.4
  ctx.moveTo(bx + rad, by)
  ctx.arcTo(bx + boxW, by, bx + boxW, by + boxH, rad)
  ctx.arcTo(bx + boxW, by + boxH, bx, by + boxH, rad)
  ctx.arcTo(bx, by + boxH, bx, by, rad)
  ctx.arcTo(bx, by, bx + boxW, by, rad)
  ctx.fill()

  lines.forEach((l, i) => {
    ctx.fillStyle = l.color || '#ffffff'
    ctx.fillText(l.text, bx + fs / 2, by + fs * 1.1 + i * fs * 1.45)
  })
  return { boxW, boxH }
}

// Marks the offending joint: highlighted segments, an arc across the angle,
// and the measured value against what the movement requires.
function drawAngleFault(ctx, lm, w, h, { metric, measured, limit, type }) {
  const pts = jointPoints(metric, lm)
  if (!pts?.a || !pts?.b) return

  const A = { x: pts.a.x * w, y: pts.a.y * h }
  const B = { x: pts.b.x * w, y: pts.b.y * h }
  const C = pts.c ? { x: pts.c.x * w, y: pts.c.y * h } : null

  ctx.lineWidth = Math.max(3, w / 160)
  ctx.strokeStyle = FAULT_COLOR
  ctx.lineCap = 'round'

  if (pts.vertical) {
    // Segment against a vertical reference dropped from the upper point.
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke()
    const refLen = Math.abs(B.y - A.y) || h * 0.2
    ctx.setLineDash([6, 6])
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(A.x, A.y - refLen); ctx.stroke()
    ctx.setLineDash([])
    drawArc(ctx, A, { x: A.x, y: A.y - refLen }, B, w)
  } else {
    ctx.beginPath()
    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y)
    if (C) ctx.lineTo(C.x, C.y)
    ctx.stroke()
    if (C) drawArc(ctx, B, A, C, w)
  }

  const vertex = pts.vertical ? A : B
  const rel = type === 'atLeast' ? '≥' : '≤'
  drawLabel(ctx, vertex.x + w * 0.03, vertex.y - h * 0.06, [
    { text: `${Math.round(measured)}°`, color: FAULT_COLOR },
    { text: `${rel} ${limit}°`, color: TARGET_COLOR },
  ], w)
}

function drawArc(ctx, vertex, p1, p2, w) {
  const r = Math.max(18, w / 12)
  const a1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x)
  const a2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x)
  // Sweep the short way round so the arc traces the interior angle
  let diff = a2 - a1
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI
  ctx.strokeStyle = FAULT_COLOR
  ctx.lineWidth = Math.max(2, w / 260)
  ctx.beginPath()
  ctx.arc(vertex.x, vertex.y, r, a1, a1 + diff, diff < 0)
  ctx.stroke()
}

// ─── Video → frames → measurements ────────────────────────────────

// Decode the clip, run pose detection at SAMPLE_FPS, and return one
// measurement per sampled frame plus the canvas stills for key moments.
export async function analyzeVideo(file, { movement, onProgress, signal } = {}) {
  const landmarker = await getLandmarker(onProgress)
  onProgress?.('decoding')

  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.src = url
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'

  try {
    await once(video, 'loadedmetadata')
    const duration = Math.min(video.duration || 0, MAX_DURATION_SEC)
    if (!duration || !Number.isFinite(duration)) {
      throw new Error('לא הצלחנו לקרוא את אורך הסרטון')
    }

    // Cap the working resolution — pose accuracy saturates well below 4K and
    // a phone recording is often much larger than the model's input.
    const scale = Math.min(1, 640 / Math.max(video.videoWidth || 640, 1))
    const w = Math.round((video.videoWidth || 640) * scale)
    const h = Math.round((video.videoHeight || 480) * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const step = 1 / SAMPLE_FPS
    const frames = []
    onProgress?.('analyzing')

    for (let tSec = 0; tSec < duration; tSec += step) {
      if (signal?.aborted) throw new Error('aborted')
      await seek(video, tSec)
      ctx.drawImage(video, 0, 0, w, h)
      // Timestamps must increase monotonically in VIDEO mode.
      const result = landmarker.detectForVideo(canvas, Math.round(tSec * 1000))
      const lm = result?.landmarks?.[0]
      const m = lm ? measureFrame(lm) : null
      // Landmarks are retained so a failing frame can be re-drawn with the
      // skeleton and the offending angle marked on it.
      frames.push({ t: +tSec.toFixed(2), measures: m, landmarks: lm || null })
      onProgress?.('analyzing', Math.min(1, tSec / duration))
    }

    const detected = frames.filter(f => f.measures)
    if (!detected.length) {
      throw new Error('לא זוהתה דמות בסרטון. ודא שכל הגוף בפריים והתאורה מספקת.')
    }

    const summary = summarize(detected)

    const keyFrames = pickKeyFrames(frames)
    // Re-seek to each key moment and capture a still for the coaching prompt.
    const stills = []
    for (const kf of keyFrames) {
      await seek(video, kf.t)
      ctx.drawImage(video, 0, 0, w, h)
      if (kf.landmarks) drawSkeleton(ctx, kf.landmarks, w, h)
      stills.push({
        label: kf.label,
        t: kf.t,
        measures: kf.measures,
        dataUrl: canvas.toDataURL('image/jpeg', 0.72),
      })
    }

    // Evaluate here rather than in the caller: annotating a fault means
    // re-seeking the video, and the element is disposed when this returns.
    const findings = movement ? evaluateMovement(movement, summary) : []
    const byTime = new Map(frames.map(f => [f.t, f]))

    for (const finding of findings) {
      if (finding.ok) continue
      const at = finding.atTime
      if (at == null) continue
      const frame = byTime.get(at)
      if (!frame?.landmarks) continue

      await seek(video, at)
      ctx.drawImage(video, 0, 0, w, h)
      drawSkeleton(ctx, frame.landmarks, w, h)
      if (finding.measured) {
        drawAngleFault(ctx, frame.landmarks, w, h, {
          metric: finding.measured.metric,
          measured: finding.measured.value,
          limit: finding.measured.limit,
          type: finding.measured.type,
        })
      }
      finding.frame = {
        t: at,
        dataUrl: canvas.toDataURL('image/jpeg', 0.75),
      }
    }

    return {
      frames,
      stills,
      findings,
      duration: +duration.toFixed(2),
      coverage: +(detected.length / frames.length).toFixed(2),
      confidence: +(detected.reduce((s, f) => s + f.measures.confidence, 0) / detected.length).toFixed(3),
      summary,
    }
  } finally {
    URL.revokeObjectURL(url)
    video.src = ''
  }
}

// Pick the moments a coach would actually look at: the deepest position, the
// most extended position, and the start. These are found from the measured
// hip height rather than guessed from timing.
function pickKeyFrames(frames) {
  const withData = frames.filter(f => f.measures?.hipY != null)
  if (!withData.length) return []

  let deepest = withData[0], tallest = withData[0]
  for (const f of withData) {
    if (f.measures.hipY > deepest.measures.hipY) deepest = f   // larger y = lower
    if (f.measures.hipY < tallest.measures.hipY) tallest = f
  }
  const start = withData[0]

  const picks = [
    { ...start,    label: 'התחלה' },
    { ...deepest,  label: 'הנקודה הנמוכה' },
    { ...tallest,  label: 'הנעילה' },
  ]
  // Drop duplicates when the same frame wins two roles (a short clip, or a
  // movement with little vertical travel).
  const seen = new Set()
  return picks.filter(p => {
    if (seen.has(p.t)) return false
    seen.add(p.t)
    return true
  })
}

// Reduce the whole clip to the numbers worth reporting.
//
// Each stat also records the timestamp where its extreme occurred, which is
// what lets the report show the exact frame a fault happened on rather than a
// generic still.
function summarize(detected) {
  const pick = (key) => detected.map(f => f.measures[key]).filter(v => v != null)
  const stat = (key) => {
    const withVal = detected.filter(f => f.measures[key] != null)
    if (!withVal.length) return null
    let lo = withVal[0], hi = withVal[0]
    for (const f of withVal) {
      if (f.measures[key] < lo.measures[key]) lo = f
      if (f.measures[key] > hi.measures[key]) hi = f
    }
    const vals = withVal.map(f => f.measures[key])
    return {
      min: +lo.measures[key].toFixed(1),
      max: +hi.measures[key].toFixed(1),
      avg: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
      minAt: lo.t,
      maxAt: hi.t,
    }
  }
  const depthStat = stat('hipBelowKnee')
  return {
    knee: stat('knee'),
    hip: stat('hip'),
    elbow: stat('elbow'),
    torsoLean: stat('torsoLean'),
    shinAngle: stat('shinAngle'),
    // Positive max means the hip got below the knee at some point. maxAt is
    // the deepest moment — the frame worth showing for a depth fault.
    reachedDepth: depthStat ? depthStat.max > 0 : null,
    depthMargin: depthStat ? depthStat.max : null,
    depthAt: depthStat ? depthStat.maxAt : null,
  }
}

// ─── DOM helpers ──────────────────────────────────────────────────
function once(el, event) {
  return new Promise((resolve, reject) => {
    const ok = () => { cleanup(); resolve() }
    const fail = () => { cleanup(); reject(new Error('לא ניתן לקרוא את הסרטון')) }
    const cleanup = () => {
      el.removeEventListener(event, ok)
      el.removeEventListener('error', fail)
    }
    el.addEventListener(event, ok, { once: true })
    el.addEventListener('error', fail, { once: true })
  })
}

function seek(video, tSec) {
  return new Promise((resolve, reject) => {
    const ok = () => { cleanup(); resolve() }
    const fail = () => { cleanup(); reject(new Error('שגיאה בקריאת פריים')) }
    const cleanup = () => {
      video.removeEventListener('seeked', ok)
      video.removeEventListener('error', fail)
    }
    video.addEventListener('seeked', ok, { once: true })
    video.addEventListener('error', fail, { once: true })
    video.currentTime = Math.min(tSec, Math.max(0, (video.duration || 0) - 0.01))
  })
}

export const POSE_LIMITS = { SAMPLE_FPS, MAX_DURATION_SEC }
