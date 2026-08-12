// Workout export utilities — PDF (via print) + deep-link share.
// PDF: opens a new tab with a print-friendly HTML doc and triggers print.
//   Any browser: user picks "Save as PDF" from the print dialog.
// Share link: builds an absolute URL that opens the app straight into the
//   community feed with the given workout expanded (?workout=<id>).

export function shareUrlForWorkout(workoutId) {
  const base = window.location.origin + window.location.pathname.replace(/index\.html$/, '')
  const url = new URL(base)
  url.searchParams.set('workout', workoutId)
  return url.toString()
}

// Try native share sheet (mobile), then WhatsApp fallback, then clipboard.
// Returns { method: 'native' | 'whatsapp' | 'clipboard', ok: boolean }
export async function shareWorkoutLink({ workoutId, title, prefix }) {
  const url = shareUrlForWorkout(workoutId)
  const shareText = `${prefix || 'אימון חדש בסלאנו'}${title ? `: ${title}` : ''}\n${url}`

  // Native share (Web Share API — iOS Safari, Android Chrome)
  if (navigator.share) {
    try {
      await navigator.share({ title: title || 'Selano', text: prefix || 'אימון חדש בסלאנו', url })
      return { method: 'native', ok: true }
    } catch (err) {
      if (err?.name === 'AbortError') return { method: 'native', ok: false, aborted: true }
      // Fall through to clipboard if share failed for another reason
    }
  }

  // Clipboard fallback (desktop)
  try {
    await navigator.clipboard.writeText(shareText)
    return { method: 'clipboard', ok: true }
  } catch {
    return { method: 'clipboard', ok: false }
  }
}

// Open WhatsApp share dialog directly
export function openWhatsApp({ workoutId, title, prefix }) {
  const url = shareUrlForWorkout(workoutId)
  const text = `${prefix || 'תראה איזה אימון'}${title ? ` — ${title}` : ''}\n${url}`
  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(wa, '_blank', 'noopener,noreferrer')
}

// Print/PDF export — opens a new window with a clean printable rendering.
// Caller passes { title, type, data, publisher, publishedAt }.
export function printWorkoutAsPdf(workout) {
  const html = buildPrintHtml(workout)
  const w = window.open('', '_blank', 'width=800,height=1000')
  if (!w) {
    alert('הדפדפן חסם את חלון ההדפסה. אפשר חלונות קופצים ונסה שוב.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  // Give the browser a beat to render fonts + layout, then trigger print.
  w.onload = () => {
    setTimeout(() => {
      w.focus()
      w.print()
    }, 300)
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function relativeDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('he-IL', { day:'numeric', month:'long', year:'numeric' }) }
  catch { return '' }
}

function buildPrintHtml({ title, type, data, publisher, publishedAt }) {
  const heading = escapeHtml(title || (type === 'wod' ? 'WOD' : 'Routine'))
  const sub = [
    publisher ? `מאת: ${escapeHtml(publisher)}` : '',
    publishedAt ? relativeDate(publishedAt) : '',
    'סלאנו · Selano',
  ].filter(Boolean).join(' · ')

  let body = ''
  if (type === 'wod' && data) {
    const lines = (data.lines || []).map(escapeHtml).join('<br/>')
    body += `<div class="wod-title">${escapeHtml(data.title || '')}</div>`
    if (data.format) body += `<div class="badge">Format: ${escapeHtml(data.format).toUpperCase()}</div>`
    body += `<pre class="wod-prescription">${lines}</pre>`
    if (data.movements?.length) {
      body += '<div class="section-title">Movements · תרגילים</div>'
      body += '<ul class="movements">'
      for (const m of data.movements) {
        body += `<li><span class="en">${escapeHtml(m.en || m.he)}</span> · <span class="he">${escapeHtml(m.he || '')}</span></li>`
      }
      body += '</ul>'
    }
  } else if (type === 'routine' && data) {
    body += `<div class="routine-title">${escapeHtml(data.name || 'Routine')}</div>`
    body += '<table class="ex-table"><thead><tr><th>#</th><th>תרגיל</th><th>סטים</th><th>חזרות</th><th>RIR</th></tr></thead><tbody>'
    for (const [i, ex] of (data.exercises || []).entries()) {
      const sets = ex.sets || []
      const first = sets[0] || {}
      body += `<tr>`
      body += `<td>${i + 1}</td>`
      body += `<td>${escapeHtml(ex.name || ex.exerciseId || '')}${ex.superset ? ` <span class="ss">· ${escapeHtml(ex.superset)}</span>` : ''}</td>`
      body += `<td>${sets.length}</td>`
      body += `<td>${escapeHtml(String(first.reps ?? '—'))}</td>`
      body += `<td>${first.rir ?? '—'}</td>`
      body += `</tr>`
    }
    body += '</tbody></table>'
  } else {
    body += `<div class="freeform">${escapeHtml(data?.text || '')}</div>`
  }

  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8"/>
<title>${heading} · Selano</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Heebo', 'Segoe UI', Arial, sans-serif;
    color: #14120f;
    background: #ffffff;
    padding: 40px 48px;
    line-height: 1.5;
  }
  .brand { font-family: 'Barlow', 'Oswald', sans-serif; font-weight: 800;
    font-size: 34px; letter-spacing: -0.02em; color: #a52a3a; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #6f6a60; letter-spacing: 0.06em; margin-bottom: 24px; }
  h1.heading {
    font-family: 'Barlow', sans-serif; font-weight: 800;
    font-size: 26px; margin: 0 0 4px; letter-spacing: -0.01em;
  }
  .badge {
    display: inline-block; padding: 3px 10px; margin-top: 6px;
    background: #f0ede4; color: #6f1622; border-radius: 999px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  }
  hr { border: none; border-top: 1px solid #d4d1c8; margin: 22px 0; }
  .wod-title { font-family: 'Barlow'; font-weight: 800; font-size: 22px; margin-top: 12px; }
  .wod-prescription {
    font-family: 'Space Mono', 'Menlo', monospace; font-size: 14px;
    background: #f6f4ee; border: 1px solid #d4d1c8; border-radius: 6px;
    padding: 16px; margin: 12px 0; direction: ltr; white-space: pre-wrap;
  }
  .section-title {
    font-size: 10px; font-weight: 700; letter-spacing: 0.24em;
    text-transform: uppercase; color: #6f6a60; margin: 20px 0 8px;
  }
  ul.movements { list-style: none; padding: 0; margin: 0; }
  ul.movements li { padding: 6px 0; border-bottom: 1px solid #eae7de; font-size: 14px; }
  ul.movements .en { font-family: 'Space Mono', monospace; font-weight: 700; color: #6f1622; }
  ul.movements .he { color: #6f6a60; font-size: 12px; }
  .routine-title { font-family: 'Barlow'; font-weight: 800; font-size: 22px; margin-top: 8px; margin-bottom: 12px; }
  table.ex-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  table.ex-table th {
    text-align: right; padding: 8px 10px; background: #f6f4ee;
    border-bottom: 2px solid #a52a3a; font-weight: 700; font-size: 10px;
    letter-spacing: 0.14em; text-transform: uppercase; color: #6f6a60;
  }
  table.ex-table td { padding: 10px; border-bottom: 1px solid #eae7de; }
  .ss { color: #a52a3a; font-weight: 600; font-size: 11px; }
  .freeform { white-space: pre-wrap; font-size: 14px; padding: 12px 0; }
  .footer {
    margin-top: 40px; padding-top: 16px; border-top: 1px solid #d4d1c8;
    font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
    color: #a08e78; text-align: center;
  }
  @media print {
    body { padding: 20mm 18mm; }
    @page { margin: 0; }
  }
</style>
</head>
<body>
  <h1 class="brand">SELANO</h1>
  <div class="sub">${sub}</div>
  <h1 class="heading">${heading}</h1>
  <hr/>
  ${body}
  <div class="footer">getselano.github.io</div>
</body>
</html>`
}
