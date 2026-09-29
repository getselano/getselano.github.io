'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { browserClient } from '@/lib/supabase/browser'
import { checkPhone } from './actions'

export function PhoneLogin() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [raw, setRaw] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const r = await checkPhone(raw)
    if (!r.phone) {
      setError(r.error || 'שגיאה')
      setBusy(false)
      return
    }
    const { error } = await browserClient().auth.signInWithOtp({ phone: '+' + r.phone })
    setBusy(false)
    if (error) return setError('לא הצלחנו לשלוח קוד. נסו שוב בעוד רגע.')
    setPhone(r.phone)
    setStep('code')
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await browserClient().auth.verifyOtp({ phone: '+' + phone, token: code.trim(), type: 'sms' })
    if (error) {
      setBusy(false)
      return setError('הקוד לא נכון או שפג תוקפו')
    }
    router.replace('/')
    router.refresh()
  }

  if (step === 'phone')
    return (
      <form className="card stack" onSubmit={sendCode}>
        <div className="field">
          <label htmlFor="phone">מספר הטלפון שלך</label>
          <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="050-000-0000" value={raw} onChange={(e) => setRaw(e.target.value)} required />
        </div>
        <p className="hint">נשלח אליך קוד ב-SMS. בלי סיסמה.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn block" disabled={busy || !raw}>{busy ? 'שולחים…' : 'שלחו לי קוד'}</button>
      </form>
    )

  return (
    <form className="card stack" onSubmit={verify}>
      <div className="field">
        <label htmlFor="code">הקוד שקיבלת ב-SMS</label>
        <input id="code" className="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoFocus required />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn block" disabled={busy || code.length < 6}>{busy ? 'בודקים…' : 'כניסה'}</button>
      <button type="button" className="link" onClick={() => { setStep('phone'); setCode(''); setError('') }}>שינוי מספר</button>
    </form>
  )
}
