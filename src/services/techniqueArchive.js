// Local archive for technique clips.
//
// Clips live in IndexedDB on the device — not on our servers. That keeps the
// original privacy and cost properties of the feature (a video of the user
// never leaves their phone, and we pay nothing to store it) while still
// surviving a refresh, which localStorage could not do: a Blob of tens of
// megabytes has no business in a string store.
//
// Video is heavy, so retention is deliberate rather than unlimited:
//   • anything older than RETENTION_DAYS is purged on open
//   • at most MAX_CLIPS are kept, oldest dropped first
//   • the user can delete any clip, or all of them, by hand
//
// Every function degrades to a no-op rather than throwing when IndexedDB is
// unavailable (private browsing, storage disabled), because a failure to
// archive must never break the analysis itself.

const DB_NAME = 'selano-technique'
const DB_VERSION = 1
const STORE = 'clips'

export const RETENTION_DAYS = 7
export const MAX_CLIPS = 20

let dbPromise = null

// Set by the most recent failed save so the UI can explain a missing clip
// rather than leaving the user to notice it never appeared.
let lastSaveError = null
export function takeSaveError() {
  const e = lastSaveError
  lastSaveError = null
  return e
}

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'))
  }).catch(err => {
    // Let a later call retry instead of caching the failure forever.
    dbPromise = null
    throw err
  })
  return dbPromise
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

function asPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function newId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch { /* fall through */ }
  return `clip_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Write ────────────────────────────────────────────────────────

// Stores the clip plus everything needed to re-render its report without
// re-running pose detection: the annotated fault frames, the key-moment
// stills, and the measured summary.
export async function saveClip({
  videoBlob, movement, summary, findings, stills,
  duration, coverage, confidence, coaching,
}) {
  try {
    const db = await openDb()
    const record = {
      id: newId(),
      createdAt: Date.now(),
      movementId: movement?.id || null,
      movementHe: movement?.he || '',
      movementEn: movement?.en || '',
      discipline: movement?.discipline || null,
      videoBlob: videoBlob || null,
      videoType: videoBlob?.type || '',
      videoSize: videoBlob?.size || 0,
      duration, coverage, confidence,
      summary,
      // Frames are data URLs; they are what makes a reopened report useful.
      findings: (findings || []).map(f => ({
        id: f.id, he: f.he, ok: f.ok, message: f.message, tip: f.tip,
        measured: f.measured || null,
        atTime: f.atTime ?? null,
        frame: f.frame || null,
      })),
      stills: stills || [],
      coaching: coaching || null,
    }
    await asPromise(tx(db, 'readwrite').put(record))
    await enforceLimits()
    return record.id
  } catch (err) {
    console.warn('[techniqueArchive] save failed:', err?.message || err)
    // A full device is the common cause and it is fixable by the user, so the
    // caller gets something worth showing rather than a bare null.
    const quota = err?.name === 'QuotaExceededError'
      || /quota/i.test(err?.message || '')
    lastSaveError = quota
      ? 'אין מספיק מקום פנוי במכשיר לשמור את הסרטון. מחק סרטונים ישנים ונסה שוב.'
      : 'לא הצלחנו לשמור את הסרטון על המכשיר. הדוח עצמו תקין.'
    return null
  }
}

// Coaching text arrives after the clip is already stored, so it lands as an
// update rather than delaying the save.
export async function attachCoaching(id, coaching) {
  if (!id) return
  try {
    const db = await openDb()
    const store = tx(db, 'readwrite')
    const existing = await asPromise(store.get(id))
    if (!existing) return
    existing.coaching = coaching
    await asPromise(tx(db, 'readwrite').put(existing))
  } catch (err) {
    console.warn('[techniqueArchive] coaching update failed:', err?.message || err)
  }
}

// ─── Read ─────────────────────────────────────────────────────────

// Metadata only — the video blobs are left behind so a list of twenty clips
// doesn't pull hundreds of megabytes into memory to render some cards.
export async function listClips() {
  try {
    const db = await openDb()
    const all = await asPromise(tx(db, 'readonly').getAll())
    return all
      .map(({ videoBlob, ...meta }) => meta)
      .sort((a, b) => b.createdAt - a.createdAt)
  } catch (err) {
    console.warn('[techniqueArchive] list failed:', err?.message || err)
    return []
  }
}

export async function getClip(id) {
  try {
    const db = await openDb()
    return (await asPromise(tx(db, 'readonly').get(id))) || null
  } catch (err) {
    console.warn('[techniqueArchive] get failed:', err?.message || err)
    return null
  }
}

// ─── Delete ───────────────────────────────────────────────────────

export async function deleteClip(id) {
  try {
    const db = await openDb()
    await asPromise(tx(db, 'readwrite').delete(id))
    return true
  } catch (err) {
    console.warn('[techniqueArchive] delete failed:', err?.message || err)
    return false
  }
}

export async function deleteAllClips() {
  try {
    const db = await openDb()
    await asPromise(tx(db, 'readwrite').clear())
    return true
  } catch (err) {
    console.warn('[techniqueArchive] clear failed:', err?.message || err)
    return false
  }
}

// Drops anything past the retention window. Returns how many went, so the UI
// can tell the user rather than having clips vanish unexplained.
export async function purgeExpired(retentionDays = RETENTION_DAYS) {
  try {
    const db = await openDb()
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000
    const all = await asPromise(tx(db, 'readonly').getAll())
    const stale = all.filter(c => c.createdAt < cutoff)
    for (const clip of stale) {
      await asPromise(tx(db, 'readwrite').delete(clip.id))
    }
    return stale.length
  } catch (err) {
    console.warn('[techniqueArchive] purge failed:', err?.message || err)
    return 0
  }
}

// Hard cap on count, oldest first. Guards against filling the device between
// two weekly purges.
async function enforceLimits() {
  try {
    const db = await openDb()
    const all = await asPromise(tx(db, 'readonly').getAll())
    if (all.length <= MAX_CLIPS) return 0
    const excess = all
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, all.length - MAX_CLIPS)
    for (const clip of excess) {
      await asPromise(tx(db, 'readwrite').delete(clip.id))
    }
    return excess.length
  } catch {
    return 0
  }
}

// ─── Housekeeping info ────────────────────────────────────────────

export async function archiveStats() {
  try {
    const db = await openDb()
    const all = await asPromise(tx(db, 'readonly').getAll())
    const bytes = all.reduce((s, c) => s + (c.videoSize || 0), 0)
    const oldest = all.length ? Math.min(...all.map(c => c.createdAt)) : null
    return { count: all.length, bytes, oldest }
  } catch {
    return { count: 0, bytes: 0, oldest: null }
  }
}

export function formatBytes(bytes) {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

// Days until a clip is auto-removed, floored at 0.
export function daysLeft(createdAt, retentionDays = RETENTION_DAYS) {
  const elapsed = (Date.now() - createdAt) / (24 * 60 * 60 * 1000)
  return Math.max(0, Math.ceil(retentionDays - elapsed))
}
