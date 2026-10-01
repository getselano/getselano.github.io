'use client'
import { useFormStatus } from 'react-dom'

export function ConfirmButton() {
  const { pending } = useFormStatus()
  return (
    <button className="btn accent block" disabled={pending} aria-busy={pending}>
      {pending ? 'שומר…' : 'זה היעד שלי'}
    </button>
  )
}
