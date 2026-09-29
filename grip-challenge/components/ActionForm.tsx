'use client'
// A form bound to a server action that reports { ok } / { error } inline.
import { useActionState, useEffect, useRef } from 'react'

type State = { ok?: string; error?: string; at?: number } | null

export function ActionForm({
  action,
  children,
  submit,
  className = 'stack',
  resetOnOk = false,
}: {
  action: (s: State, f: FormData) => Promise<State>
  children: React.ReactNode
  submit: string
  className?: string
  resetOnOk?: boolean
}) {
  const ref = useRef<HTMLFormElement>(null)
  const [state, run, pending] = useActionState(async (s: State, f: FormData) => ({ ...(await action(s, f)), at: Date.now() }), null)
  useEffect(() => {
    if (resetOnOk && state?.ok) ref.current?.reset()
  }, [state, resetOnOk])
  return (
    <form ref={ref} action={run} className={className}>
      {children}
      <div className="row" style={{ flexWrap: 'wrap' }}>
        <button className="btn" disabled={pending}>{pending ? 'שומרים…' : submit}</button>
        {state?.ok && <span className="ok" role="status">{state.ok}</span>}
        {state?.error && <span className="error" role="alert">{state.error}</span>}
      </div>
    </form>
  )
}
