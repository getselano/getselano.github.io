import React, { useState } from 'react'
import { t } from '../../theme/tokens'
import { Card, Button, Modal } from '../ui/UI'
import {
  TERMS_HE, TERMS_EN,
  PRIVACY_HE, PRIVACY_EN,
  FULL_HEALTH_DISCLAIMER_HE, FULL_HEALTH_DISCLAIMER_EN,
} from '../../legal/disclaimers'
import { useI18n } from '../../i18n/i18n'
import { readHealthAck } from './HealthAcknowledgment'

// The full legal center — mounted in Profile → Settings. Three documents
// (terms, privacy, health) each openable in a modal. Also shows the
// signed health-acknowledgment record with the actual captured signature
// image and a download button so the user can keep a copy of what they
// signed.

const DOCS = [
  { key: 'terms',   he: 'תנאי שימוש',       en: 'Terms of Use' },
  { key: 'privacy', he: 'מדיניות פרטיות',   en: 'Privacy Policy' },
  { key: 'health',  he: 'הצהרת בריאות',     en: 'Health disclaimer' },
]

const TEXT = {
  terms:   { he: TERMS_HE,                   en: TERMS_EN },
  privacy: { he: PRIVACY_HE,                 en: PRIVACY_EN },
  health:  { he: FULL_HEALTH_DISCLAIMER_HE,  en: FULL_HEALTH_DISCLAIMER_EN },
}

export function LegalCenter() {
  const { isRTL } = useI18n()
  const [open, setOpen] = useState(null)
  const [showSigned, setShowSigned] = useState(false)
  const ack = readHealthAck()

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{
        fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.28em',
        textTransform: 'uppercase', color: t.color.wineLight, fontWeight: 700,
      }}>
        {isRTL ? 'מרכז משפטי' : 'Legal center'}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {DOCS.map(d => (
          <button
            key={d.key}
            onClick={() => setOpen(d.key)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 16px',
              background: t.color.bgSoft, border: `1px solid ${t.color.border}`,
              borderRadius: t.radius.md, cursor: 'pointer', fontFamily: 'inherit',
              color: t.color.text, textAlign: isRTL ? 'right' : 'left',
              transition: t.transition,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = t.color.wineLight}
            onMouseLeave={e => e.currentTarget.style.borderColor = t.color.border}
          >
            <span style={{ fontWeight: 600, fontSize: 14 }}>{isRTL ? d.he : d.en}</span>
            <span style={{ color: t.color.wineLight, fontSize: 18 }}>{isRTL ? '←' : '→'}</span>
          </button>
        ))}
      </div>

      {/* Signed doc block */}
      {ack && (
        <div style={{
          marginTop: 6, padding: '14px 16px',
          background: 'rgba(74,156,106,0.06)',
          border: '1px solid rgba(74,156,106,0.35)',
          borderRadius: t.radius.md,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 10, gap: 12,
          }}>
            <div>
              <div style={{
                fontFamily: t.font.family.mono, fontSize: 9, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: '#4a9c6a', fontWeight: 700, marginBottom: 4,
              }}>
                {isRTL ? 'הצהרה חתומה' : 'Signed declaration'}
              </div>
              <div style={{ fontSize: 13, color: t.color.text, fontWeight: 600 }}>
                {ack.signerName || (isRTL ? 'ללא שם' : 'Unnamed')}
              </div>
              <div style={{ fontSize: 11, color: t.color.silver1, marginTop: 2 }}>
                {new Date(ack.confirmedAt).toLocaleString(isRTL ? 'he-IL' : 'en-US')}
                {ack.documentVersion && <span style={{ color: t.color.silver2 }}> · {ack.documentVersion}</span>}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSigned(true)}
            >
              {isRTL ? 'צפה במסמך' : 'View document'}
            </Button>
          </div>
          {ack.signatureDataUrl && (
            <div style={{
              background: '#0a0806', border: `1px solid ${t.color.border}`,
              borderRadius: t.radius.sm, padding: 8,
              height: 90,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img
                src={ack.signatureDataUrl}
                alt="signature"
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 6, fontSize: 11, color: t.color.silver2, lineHeight: 1.5 }}>
        {isRTL
          ? 'המסמכים כאן הם טיוטה מקצועית ומחייבים בדיקה של עורך דין לפני מסחור.'
          : 'These documents are professional drafts and require attorney review before commercial launch.'}
      </div>

      {/* Document reader modal */}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? (isRTL ? DOCS.find(d => d.key === open).he : DOCS.find(d => d.key === open).en) : ''}
        width={640}
      >
        {open && (
          <div style={{
            padding: '10px 14px',
            fontSize: 13, color: t.color.bone, lineHeight: 1.75,
            whiteSpace: 'pre-line',
            borderInlineStart: `2px solid ${t.color.wineLight}`,
            maxHeight: 480, overflowY: 'auto',
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {TEXT[open][isRTL ? 'he' : 'en']}
          </div>
        )}
      </Modal>

      {/* Signed doc modal — full view of what was signed */}
      {showSigned && ack && (
        <Modal
          open
          onClose={() => setShowSigned(false)}
          title={isRTL ? 'המסמך שנחתם' : 'The signed document'}
          width={680}
        >
          <SignedDocumentView ack={ack} />
        </Modal>
      )}
    </div>
  )
}

// Read-only rendering of the signed document — the exact text that was
// signed + the signature image + all metadata + a download button.
function SignedDocumentView({ ack }) {
  const { isRTL } = useI18n()

  const download = () => {
    const html = buildStandaloneDocHtml(ack)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selano-health-signed-${(ack.signerName || 'anon').replace(/\s+/g, '-')}-${(ack.confirmedAt || '').slice(0, 10)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Header */}
      <div style={{
        padding: 14, background: t.color.bgSoft, border: `1px solid ${t.color.border}`,
        borderRadius: t.radius.md,
      }}>
        <Row label={isRTL ? 'חותם' : 'Signer'} value={ack.signerName || '—'} />
        <Row label={isRTL ? 'תאריך חתימה' : 'Signed at'} value={new Date(ack.confirmedAt).toLocaleString(isRTL ? 'he-IL' : 'en-US')} />
        <Row label={isRTL ? 'גרסת מסמך' : 'Document version'} value={ack.documentVersion || '—'} />
        <Row label={isRTL ? 'שפה' : 'Language'} value={ack.lang === 'he' ? 'עברית' : 'English'} />
        {ack.userAgent && (
          <Row label={isRTL ? 'דפדפן' : 'Browser'} value={ack.userAgent} clip />
        )}
      </div>

      {/* Full text as signed */}
      <div>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: t.color.wineLight, fontWeight: 700, marginBottom: 8,
        }}>
          {isRTL ? 'תוכן המסמך שנחתם' : 'The signed text'}
        </div>
        <div style={{
          padding: '12px 14px',
          fontSize: 13, color: t.color.bone, lineHeight: 1.75,
          whiteSpace: 'pre-line',
          borderInlineStart: `2px solid ${t.color.wineLight}`,
          maxHeight: 260, overflowY: 'auto',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
          {ack.signedDocumentText || (isRTL ? '(לא נשמר טקסט)' : '(text not stored)')}
        </div>
      </div>

      {/* Signature */}
      {ack.signatureDataUrl && (
        <div>
          <div style={{
            fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: t.color.wineLight, fontWeight: 700, marginBottom: 8,
          }}>
            {isRTL ? 'החתימה' : 'Signature'}
          </div>
          <div style={{
            background: '#0a0806', border: `1px solid ${t.color.wineLight}55`,
            borderRadius: t.radius.md, padding: 12,
            height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img
              src={ack.signatureDataUrl}
              alt="signature"
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={download}>
          {isRTL ? '↓ הורד עותק (HTML)' : '↓ Download copy (HTML)'}
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value, clip }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'baseline',
      padding: '5px 0', borderBottom: `1px dashed ${t.color.hairline}`,
    }}>
      <span style={{
        fontFamily: t.font.family.mono, fontSize: 9, letterSpacing: '0.2em',
        textTransform: 'uppercase', color: t.color.silver2, fontWeight: 600,
        minWidth: 90, flexShrink: 0,
      }}>{label}</span>
      <span style={{
        fontSize: 12, color: t.color.text, wordBreak: 'break-word',
        overflow: clip ? 'hidden' : 'visible',
        textOverflow: clip ? 'ellipsis' : 'clip',
        whiteSpace: clip ? 'nowrap' : 'normal',
      }}>{value}</span>
    </div>
  )
}

// Standalone HTML export — everything inline so it opens anywhere.
function buildStandaloneDocHtml(ack) {
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const isHe = ack.lang === 'he'
  return `<!doctype html>
<html lang="${isHe ? 'he' : 'en'}" dir="${isHe ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<title>Selano — Signed Health Declaration — ${esc(ack.signerName)}</title>
<style>
  body { font-family: system-ui, "Heebo", "Inter", sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #14120f; line-height: 1.6; }
  h1 { font-family: "Barlow Condensed", "Oswald", sans-serif; font-weight: 800; font-size: 32px; letter-spacing: -0.02em; margin-bottom: 8px; }
  .accent { color: #a52a3a; }
  .meta { background: #f6f2ea; border-left: 3px solid #a52a3a; padding: 14px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; }
  .meta div { margin-bottom: 4px; }
  .meta b { display: inline-block; min-width: 130px; color: #6c6659; text-transform: uppercase; font-size: 10px; letter-spacing: 0.2em; }
  .doc { white-space: pre-line; padding: 16px 18px; border-left: 2px solid #a52a3a; margin: 24px 0; background: #fafaf7; border-radius: 6px; font-size: 14px; }
  .sig { border: 1px solid #a52a3a; border-radius: 6px; padding: 20px; text-align: center; margin-top: 24px; background: #fafaf7; }
  .sig img { max-height: 120px; max-width: 100%; }
  .footer { margin-top: 40px; font-size: 11px; color: #8a8580; text-align: center; letter-spacing: 0.1em; text-transform: uppercase; }
</style>
</head>
<body>
  <h1><span class="accent">S</span>elano — ${isHe ? 'הצהרת בריאות חתומה' : 'Signed Health Declaration'}</h1>

  <div class="meta">
    <div><b>${isHe ? 'חותם' : 'Signer'}</b>${esc(ack.signerName)}</div>
    <div><b>${isHe ? 'תאריך' : 'Signed at'}</b>${esc(new Date(ack.confirmedAt).toLocaleString(isHe ? 'he-IL' : 'en-US'))}</div>
    <div><b>${isHe ? 'גרסת מסמך' : 'Version'}</b>${esc(ack.documentVersion)}</div>
    <div><b>${isHe ? 'שפה' : 'Language'}</b>${isHe ? 'עברית' : 'English'}</div>
    ${ack.userAgent ? `<div><b>${isHe ? 'דפדפן' : 'Browser'}</b>${esc(ack.userAgent)}</div>` : ''}
  </div>

  <div class="doc">${esc(ack.signedDocumentText)}</div>

  ${ack.signatureDataUrl ? `
    <div class="sig">
      <div style="font-size:10px;letter-spacing:0.24em;text-transform:uppercase;color:#a52a3a;font-weight:700;margin-bottom:12px">${isHe ? 'חתימה דיגיטלית' : 'Digital signature'}</div>
      <img src="${ack.signatureDataUrl}" alt="signature">
      <div style="margin-top:12px;font-size:13px;font-weight:600">${esc(ack.signerName)}</div>
    </div>
  ` : ''}

  <div class="footer">Selano · Performance System · ${new Date().getFullYear()}</div>
</body>
</html>`
}

// Compact single-line link — mount anywhere (login, footer).
export function LegalFooter() {
  const { isRTL } = useI18n()
  const [open, setOpen] = useState(null)
  return (
    <>
      <div style={{
        fontSize: 11, color: t.color.silver2, textAlign: 'center', padding: '6px 0',
      }}>
        <button onClick={() => setOpen('terms')} style={linkStyle}>{isRTL ? 'תנאי שימוש' : 'Terms'}</button>
        <span style={{ margin: '0 8px' }}>·</span>
        <button onClick={() => setOpen('privacy')} style={linkStyle}>{isRTL ? 'פרטיות' : 'Privacy'}</button>
        <span style={{ margin: '0 8px' }}>·</span>
        <button onClick={() => setOpen('health')} style={linkStyle}>{isRTL ? 'הצהרת בריאות' : 'Health'}</button>
      </div>
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? (isRTL ? DOCS.find(d => d.key === open).he : DOCS.find(d => d.key === open).en) : ''}
        width={640}
      >
        {open && (
          <div style={{
            padding: '10px 14px', fontSize: 13, color: t.color.bone, lineHeight: 1.75,
            whiteSpace: 'pre-line', borderInlineStart: `2px solid ${t.color.wineLight}`,
            maxHeight: 480, overflowY: 'auto',
            direction: isRTL ? 'rtl' : 'ltr',
          }}>
            {TEXT[open][isRTL ? 'he' : 'en']}
          </div>
        )}
      </Modal>
    </>
  )
}

const linkStyle = {
  background: 'none', border: 'none', color: '#948d7f',
  fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
  textDecoration: 'underline',
}
