import React, { useState } from 'react'
import { t } from '../../theme/tokens'
import { Card, Button, Input } from '../ui/UI'
import {
  FULL_HEALTH_DISCLAIMER_HE, FULL_HEALTH_DISCLAIMER_EN,
  TERMS_HE, TERMS_EN, PRIVACY_HE, PRIVACY_EN,
} from '../../legal/disclaimers'
import { useI18n } from '../../i18n/i18n'
import { SignaturePad } from './SignaturePad'

// Required health-acknowledgment gate — shown once during onboarding.
// The user reads the full disclaimer, types their name, signs on the
// canvas pad, and submits. The signed record (name + signature PNG +
// timestamp + user-agent + document version) is stored locally as
// proof of consent, and can be synced to Supabase for admin retrieval.

const STORAGE_KEY = 'hfos:health_ack'
const DOC_VERSION = 'v2.2026-08' // v2 bundles health + terms + privacy

export function readHealthAck() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // A record only counts as valid consent when it carries BOTH the
    // typed signer name and the signature-pad image. Bare/stale entries
    // (from old versions, aborted flows, or manual tampering) are treated
    // as "not signed" so the gate forces the user through the real form.
    if (!parsed?.signerName?.trim() || !parsed?.signatureDataUrl) return null
    return parsed
  } catch { return null }
}

export function HealthAcknowledgment({ onConfirm, initialName = '' }) {
  const { isRTL } = useI18n()
  const [checked, setChecked] = useState(false)
  const [name, setName] = useState(initialName)
  const [signatureDataUrl, setSignatureDataUrl] = useState(null)
  const [busy, setBusy] = useState(false)
  const [activeDoc, setActiveDoc] = useState('health')

  // The signed document bundles all three legal texts so the single
  // signature covers health disclaimer + liability terms + privacy.
  const docs = isRTL
    ? { health: FULL_HEALTH_DISCLAIMER_HE, terms: TERMS_HE, privacy: PRIVACY_HE }
    : { health: FULL_HEALTH_DISCLAIMER_EN, terms: TERMS_EN, privacy: PRIVACY_EN }
  const docLabels = isRTL
    ? { health: 'הצהרת בריאות', terms: 'תנאי שימוש · הגבלת אחריות', privacy: 'פרטיות' }
    : { health: 'Health declaration', terms: 'Terms of use · liability', privacy: 'Privacy' }
  const fullText = [
    `═══ ${docLabels.health} ═══\n${docs.health}`,
    `\n\n═══ ${docLabels.terms} ═══\n${docs.terms}`,
    `\n\n═══ ${docLabels.privacy} ═══\n${docs.privacy}`,
  ].join('')
  const signedDateLabel = new Date().toLocaleDateString(isRTL ? 'he-IL' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const canSubmit = checked && name.trim().length >= 2 && !!signatureDataUrl

  const confirm = async () => {
    if (!canSubmit || busy) return
    setBusy(true)
    const record = {
      confirmedAt: new Date().toISOString(),
      lang: isRTL ? 'he' : 'en',
      documentVersion: DOC_VERSION,
      signerName: name.trim(),
      signatureDataUrl,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : null,
      // Full text at time of signing — protects against future doc edits
      // making the signed record ambiguous
      signedDocumentText: fullText,
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)) } catch {}

    // Best-effort Supabase sync (silent fail if not configured / offline)
    try {
      const { syncHealthAck } = await import('../../services/supabaseSync')
      if (typeof syncHealthAck === 'function') await syncHealthAck(record)
    } catch {}

    setBusy(false)
    onConfirm?.(record)
  }

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 680, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: t.color.wineLight, fontWeight: 700,
          marginBottom: 10,
        }}>
          {isRTL ? 'הצהרת בריאות · חתימה דיגיטלית' : 'Health disclaimer · digital signature'}
        </div>
        <h2 style={{
          fontSize: 28, fontWeight: 800, marginBottom: 8, lineHeight: 1.15,
          fontFamily: t.font.family.display, letterSpacing: '-0.02em',
        }}>
          {isRTL ? 'לפני שמתחילים — הצהרה חתומה' : 'Before we start — signed declaration'}
        </h2>
        <div style={{ color: t.color.silver1, fontSize: 14, lineHeight: 1.55 }}>
          {isRTL
            ? 'חתימה אחת מכסה שלושה מסמכים: הצהרת בריאות, תנאי שימוש והגבלת אחריות, ומדיניות פרטיות. חובה לקרוא ולחתום כדי להיכנס למערכת.'
            : 'One signature covers three documents: health declaration, terms & liability, and privacy. Reading and signing is mandatory to enter the app.'}
        </div>
      </div>

      {/* Document with tabs */}
      <Card style={{ padding: 20 }}>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 9, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: t.color.silver2, fontWeight: 600,
          marginBottom: 12,
          display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6,
        }}>
          <span>{isRTL ? 'מסמך משפטי חתום' : 'Signed legal bundle'}</span>
          <span>{DOC_VERSION} · {signedDateLabel}</span>
        </div>

        {/* Doc tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
          {['health', 'terms', 'privacy'].map(key => {
            const active = activeDoc === key
            return (
              <button
                key={key}
                onClick={() => setActiveDoc(key)}
                type="button"
                style={{
                  padding: '7px 14px', borderRadius: 999,
                  background: active ? t.color.wineLight : t.color.bgSoft,
                  color: active ? t.color.white : t.color.silver1,
                  border: `1px solid ${active ? t.color.wineLight : t.color.border}`,
                  fontFamily: 'inherit', cursor: 'pointer', fontSize: 12,
                  fontWeight: active ? 700 : 500,
                }}
              >{docLabels[key]}</button>
            )
          })}
        </div>

        <div style={{
          maxHeight: 260, overflowY: 'auto',
          padding: '4px 4px 4px 12px',
          borderInlineStart: `2px solid ${t.color.wineLight}`,
          fontSize: 13, color: t.color.bone, lineHeight: 1.7,
          whiteSpace: 'pre-line',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
          {docs[activeDoc]}
        </div>

        <div style={{
          marginTop: 10, fontSize: 11, color: t.color.silver2,
          padding: '8px 10px', background: t.color.bgSoft,
          borderRadius: t.radius.sm, lineHeight: 1.5,
        }}>
          {isRTL
            ? 'שלושת המסמכים נחתמים יחד. בגלילה למטה תראה את שלושתם — עבור בין הלשוניות ותקרא כל אחד.'
            : 'All three documents are signed together. Use the tabs above to review each one.'}
        </div>
      </Card>

      {/* Consent checkbox */}
      <label style={{
        display: 'flex', gap: 12, alignItems: 'flex-start',
        padding: 14, background: checked ? 'rgba(74,156,106,0.06)' : t.color.bgSoft,
        border: `1px solid ${checked ? 'rgba(74,156,106,0.4)' : t.color.border}`,
        borderRadius: t.radius.md, cursor: 'pointer',
        transition: t.transition,
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={e => setChecked(e.target.checked)}
          style={{
            width: 20, height: 20, accentColor: t.color.wineLight,
            flexShrink: 0, marginTop: 1, cursor: 'pointer',
          }}
        />
        <span style={{ fontSize: 14, color: t.color.text, lineHeight: 1.55, fontWeight: 500 }}>
          {isRTL
            ? 'קראתי את המסמך במלואו, הבנתי, ואני מסכים/ה לכל תנאיו. אני מודע/ת שחתימתי הדיגיטלית מהווה הסכמה משפטית מחייבת.'
            : 'I have read the full document, understood it, and I agree to all its terms. I acknowledge my digital signature constitutes a legally binding consent.'}
        </span>
      </label>

      {/* Name field */}
      <div>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: t.color.silver1, fontWeight: 600,
          marginBottom: 6,
        }}>
          {isRTL ? 'שם מלא (כפי שיופיע במסמך)' : 'Full name (as it appears on the document)'}
        </div>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={isRTL ? 'לדוגמה: אביב גולן' : 'e.g. Aviv Golan'}
          autoComplete="name"
        />
      </div>

      {/* Signature */}
      <div>
        <div style={{
          fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: t.color.silver1, fontWeight: 600,
          marginBottom: 6, display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{isRTL ? 'חתימה דיגיטלית · חובה' : 'Digital signature · required'}</span>
          <span style={{ color: t.color.wineLight, fontWeight: 700 }}>{signedDateLabel}</span>
        </div>
        <SignaturePad onChange={setSignatureDataUrl} height={180} />
        <div style={{
          marginTop: 8, fontSize: 11, color: t.color.silver2,
          textAlign: isRTL ? 'right' : 'left',
        }}>
          {isRTL
            ? `חתימתך תישמר עם התאריך ${signedDateLabel}, שם המשתמש, וטקסט המסמך המלא כפי שאישרת.`
            : `Your signature will be stored with the date ${signedDateLabel}, the signer name, and the full document text you approved.`}
        </div>
      </div>

      {/* Submit */}
      <Button
        size="lg"
        disabled={!canSubmit || busy}
        onClick={confirm}
        style={{ opacity: canSubmit && !busy ? 1 : 0.5 }}
      >
        {busy
          ? (isRTL ? 'שומר…' : 'Saving…')
          : (isRTL ? 'אני מאשר/ת וחותם/ת — כניסה למערכת' : 'I agree and sign — enter the app')}
      </Button>

      {/* Legal footnote */}
      <div style={{
        fontSize: 11, color: t.color.silver2, lineHeight: 1.55,
        padding: '10px 12px', background: 'rgba(199,64,80,0.05)',
        borderInlineStart: `2px solid ${t.color.wineLight}`,
        borderRadius: t.radius.sm,
      }}>
        {isRTL
          ? 'המסמך החתום נשמר עם חותמת זמן, גרסת הטקסט המלאה כפי שנחתמה, פרטי דפדפן ופרטי חתימה. אתה יכול לצפות בו בכל עת דרך פרופיל אישי → הגדרות → מרכז משפטי.'
          : 'The signed document is stored with a timestamp, the full text as signed, browser details, and signature data. View it any time via Profile → Settings → Legal center.'}
      </div>
    </div>
  )
}
