'use client'
// The one screen that breaks the visual language: black, confetti, big type.
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { Flame, Gift, Calendar } from '@/components/icons'
import { markWinSeen } from '../actions'

interface Props {
  name: string
  coachName: string | null
  value: number
  validUntil: string
  bookUrl: string | null
}

export function WinMoment(p: Props) {
  const router = useRouter()
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    navigator.vibrate?.([30, 60, 30])
    const c = canvas.current
    if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = c.getContext('2d')!
    const dpr = Math.min(2, devicePixelRatio || 1)
    const resize = () => {
      c.width = innerWidth * dpr
      c.height = innerHeight * dpr
    }
    resize()
    addEventListener('resize', resize)
    const colors = ['#E0912B', '#C2711A', '#FDF0E0', '#1D9E75', '#FFFFFF']
    const bits = Array.from({ length: 140 }, () => ({
      x: Math.random() * c.width,
      y: -Math.random() * c.height,
      w: (6 + Math.random() * 6) * dpr,
      h: (8 + Math.random() * 10) * dpr,
      vy: (1.6 + Math.random() * 2.6) * dpr,
      vx: (Math.random() - 0.5) * 1.4 * dpr,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.2,
      color: colors[(Math.random() * colors.length) | 0],
    }))
    let frame = 0
    let raf = 0
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      for (const b of bits) {
        b.y += b.vy
        b.x += b.vx + Math.sin((frame + b.r * 100) / 30) * 0.6
        b.r += b.vr
        if (b.y > c.height + 20 && frame < 240) b.y = -20
        ctx.save()
        ctx.translate(b.x, b.y)
        ctx.rotate(b.r)
        ctx.fillStyle = b.color
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h)
        ctx.restore()
      }
      frame++
      if (frame < 600) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
    }
  }, [])

  async function book() {
    await markWinSeen()
    if (p.bookUrl) window.location.href = p.bookUrl
    else router.replace('/my-team')
  }
  async function later() {
    await markWinSeen()
    router.replace('/')
  }

  return (
    <div className="win" role="dialog" aria-modal="true" aria-labelledby="win-title">
      <canvas ref={canvas} className="confetti" style={{ width: '100%', height: '100%' }} aria-hidden="true" />
      <div className="orb"><Flame size={68} strokeWidth={2.2} /></div>
      <div className="kicker"><span className="num">36</span> ימים</div>
      <h1 id="win-title">האימון האישי שלך מחכה</h1>
      <div className="prize">
        <div className="row">
          <Gift size={22} style={{ color: 'var(--streak)' }} />
          <div>
            <strong>אימון אישי אחד על אחד</strong>
            <div className="muted small">בשווי <span className="num">{p.value}</span> ₪{p.coachName ? ` · עם ${p.coachName} או מאמן לבחירתך` : ''}</div>
          </div>
        </div>
        <div className="row">
          <Calendar size={22} style={{ color: 'var(--streak)' }} />
          <div>
            <strong>בתוקף עד <span className="num">{p.validUntil}</span></strong>
            <div className="muted small">מתאמים מול הצוות בוואטסאפ</div>
          </div>
        </div>
      </div>
      <div className="actions">
        <button className="btn orange block" onClick={book}>אני רוצה לתאם</button>
        <button className="later" onClick={later}>אחר כך</button>
      </div>
    </div>
  )
}
