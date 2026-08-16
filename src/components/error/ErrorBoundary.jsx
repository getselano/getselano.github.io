import React from 'react'

// App-wide error boundary. When React crashes on a device (usually because
// of a stale JS bundle from an old service-worker cache) users would see a
// blank/black screen with no way out. This component catches the crash and
// shows a friendly recovery UI: "reload" (re-fetches HTML/JS) + "reset"
// (unregisters SW, clears caches + localStorage, then reloads).

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log to console so if the user opens devtools we see the trace
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] captured:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = async () => {
    try {
      if ('caches' in window) {
        const names = await caches.keys()
        await Promise.all(names.map(n => caches.delete(n)))
      }
    } catch {}
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map(r => r.unregister()))
      }
    } catch {}
    try {
      // Wipe local state — keeps auth token in the Supabase cookie if present,
      // but drops all locally cached app state that might be corrupted.
      localStorage.clear()
      sessionStorage.clear()
    } catch {}
    window.location.href = window.location.pathname + '?_r=' + Date.now()
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{
        minHeight: '100vh',
        background: '#14120f',
        color: '#eeece5',
        direction: 'rtl',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        fontFamily: '"Heebo", "Segoe UI", sans-serif',
      }}>
        <div style={{
          maxWidth: 460, width: '100%',
          background: '#1c1917',
          border: '1px solid #3a3530',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            fontFamily: 'Barlow, sans-serif', fontWeight: 800,
            fontSize: 34, color: '#c74050', letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>SELANO</div>
          <div style={{
            fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
            color: '#a08e78', fontWeight: 700, marginBottom: 20,
          }}>שגיאה זמנית · Recovery</div>

          <div style={{
            fontSize: 18, fontWeight: 700, color: '#eeece5', marginBottom: 8,
            letterSpacing: '-0.01em',
          }}>משהו נתקע.</div>
          <div style={{
            fontSize: 14, color: '#a09889', lineHeight: 1.55, marginBottom: 24,
          }}>
            לרוב זה קרה כי הגרסה השמורה במכשיר לא מסונכרנת עם השרת.
            שני כפתורים למטה — תתחיל מ"רענן". אם עדיין תקוע, לחץ על "אפס הכל".
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReload}
              style={{
                flex: 1, minWidth: 140,
                background: '#c74050', color: '#fff',
                border: 'none', borderRadius: 10,
                padding: '14px 20px',
                fontFamily: 'inherit', fontWeight: 700, fontSize: 15,
                cursor: 'pointer',
              }}
            >רענן</button>
            <button
              onClick={this.handleReset}
              style={{
                flex: 1, minWidth: 140,
                background: 'transparent', color: '#eeece5',
                border: '1px solid #3a3530', borderRadius: 10,
                padding: '14px 20px',
                fontFamily: 'inherit', fontWeight: 600, fontSize: 15,
                cursor: 'pointer',
              }}
            >אפס הכל</button>
          </div>

          {this.state.error?.message && (
            <div style={{
              marginTop: 20, padding: 12,
              background: '#0f0d0b', borderRadius: 8,
              fontFamily: 'Space Mono, monospace', fontSize: 11,
              color: '#7a7167', lineHeight: 1.5,
              overflowX: 'auto', direction: 'ltr', textAlign: 'left',
              maxHeight: 140,
            }}>{String(this.state.error.message).slice(0, 400)}</div>
          )}
        </div>
      </div>
    )
  }
}
