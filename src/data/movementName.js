// Exercise names are English throughout the app.
//
// A product decision, not a translation gap: the gym floor, the coaching
// literature and every competition standard call these movements by their
// English names. A trainee who learns "Push Jerk" here can read a programme
// from anywhere; one who learns only "דחיקת פיצול" cannot. Explanatory text —
// cues, corrections, coaching — stays Hebrew, because that is where the
// language actually helps.
//
// The Hebrew string is not thrown away. It stays on the record so search still
// matches Hebrew typing: someone who types "סקוואט" should still find Back
// Squat, even though the app will never display that spelling back to them.

// Reads the display name off any catalog record, whichever shape it uses.
// Falls back through the alternatives rather than rendering "undefined" if a
// record is missing its English name.
export function movementName(entry) {
  if (!entry) return ''
  if (typeof entry === 'string') return entry
  return entry.name || entry.en || entry.he || entry.id || ''
}

// Everything a record can be searched by, including the Hebrew that is no
// longer displayed. Lowercased so callers can compare directly.
export function searchText(entry) {
  if (!entry) return ''
  return [entry.name, entry.en, entry.he, entry.nameHe, entry.id]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

// True when `query` matches the record by any of its names. Empty query
// matches everything, which is what a cleared search box should do.
export function matchesQuery(entry, query) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return true
  return searchText(entry).includes(q)
}
