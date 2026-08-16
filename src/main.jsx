import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { captureReferralFromUrl } from './utils/referral'
import { ErrorBoundary } from './components/error/ErrorBoundary'

captureReferralFromUrl()

// PWA — register service worker and auto-reload when a new version activates,
// so users on old cached bundles never get stuck on a blank screen.
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js', { scope: import.meta.env.BASE_URL })
      .then((reg) => {
        // If a new SW is waiting on load, tell it to activate right away
        if (reg.waiting) reg.waiting.postMessage({ type: 'HFOS_SKIP_WAITING' })
        reg.addEventListener('updatefound', () => {
          const inst = reg.installing
          if (!inst) return
          inst.addEventListener('statechange', () => {
            if (inst.state === 'installed' && navigator.serviceWorker.controller) {
              inst.postMessage({ type: 'HFOS_SKIP_WAITING' })
            }
          })
        })
      })
      .catch(() => {})

    // When the SW notifies of an update, reload the page ONCE — grabs new HTML
    // + JS and prevents the "black screen from stale cached bundle" bug.
    let reloaded = false
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'HFOS_SW_UPDATED' && !reloaded) {
        reloaded = true
        window.location.reload()
      }
    })
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!reloaded) { reloaded = true; window.location.reload() }
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
