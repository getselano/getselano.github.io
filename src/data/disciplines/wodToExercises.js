// Turns a generated WOD into the exercise blocks a plan session needs.
//
// The discipline generators produce a workout as lines of text — a title, then
// A/B/C sections each with their own content. That is exactly right for
// displaying a WOD, and useless as a plan session: the runner iterates
// `session.exercises`, so a session built with `exercises: []` showed
// "0 exercises" on the card and opened to nothing, even though the workout
// text was sitting right there in `prescription`.
//
// So the sections become the exercises. Each block keeps its own heading and
// its own lines, which is the unit a trainee actually works through and ticks
// off — a warm-up, the piece, the cool-down.

// A section heading is a single letter followed by a separator: "A · Warm-up".
// Latin and Hebrew letters both appear depending on the generator.
const SECTION_RE = /^\s*([A-Za-zא-ת])\s*[·.\-)]\s*(.+)$/

// Cosmetic: the generators indent content lines under their heading.
const clean = (s) => String(s || '').replace(/^\s+/, '').trimEnd()

export function wodLinesToExercises(lines, { idPrefix = 'block' } = {}) {
  if (!Array.isArray(lines) || !lines.length) return []

  const sections = []
  let current = null

  // The first non-empty line is the workout title, not a section, and it is
  // already the session name — skip it so it does not become a block.
  let seenTitle = false

  for (const raw of lines) {
    const line = clean(raw)
    if (!line) continue

    if (!seenTitle) { seenTitle = true; continue }

    const m = line.match(SECTION_RE)
    if (m) {
      current = { title: line, body: [] }
      sections.push(current)
      continue
    }

    // Content before any heading still belongs to the workout, so it gets a
    // block of its own rather than being dropped.
    if (!current) {
      current = { title: 'Workout', body: [] }
      sections.push(current)
    }
    current.body.push(line)
  }

  const withContent = sections.filter(s => s.body.length || s.title !== 'Workout')
  return withContent.map((s, i) => ({
    id: `${idPrefix}_${i + 1}`,
    name: s.title,
    // The lines are the prescription — sets and reps live inside that text
    // rather than as numbers, because a metcon is not sets-and-reps shaped.
    prescription: s.body.join('\n'),
    sets: 1,
    reps: null,
    fromWod: true,
  }))
}

// Everything a plan session needs from a generated WOD, in one place so the
// four disciplines cannot drift apart.
export function wodToSession(wod, { name, wodType }) {
  const lines = wod?.lines || []
  return {
    name: name || wod?.title || 'Session',
    wodType,
    prescription: lines.join('\n'),
    exercises: wodLinesToExercises(lines, { idPrefix: wodType?.toLowerCase() || 'wod' }),
  }
}

// The exercises to show for a session, whatever era it was saved in.
//
// Plans adopted before sessions carried exercises are already sitting in
// people's storage with an empty list and the workout in `prescription`.
// Fixing only new plans would leave those permanently showing "0 exercises",
// so the blocks are rebuilt from the stored text on read. Legacy programs
// from data/programs.js use `blocks`, which is also accepted here.
export function sessionExercises(session) {
  if (!session) return []
  if (session.exercises?.length) return session.exercises
  if (session.blocks?.length) return session.blocks
  if (session.prescription) {
    return wodLinesToExercises(session.prescription.split('\n'), {
      idPrefix: session.wodType?.toLowerCase() || 'wod',
    })
  }
  return []
}
