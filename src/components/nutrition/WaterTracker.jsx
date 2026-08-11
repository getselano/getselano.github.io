import React from 'react'
import { t } from '../../theme/tokens'
import { useApp } from '../../store/AppStore'
import { todayKey } from '../../utils/date'
import { waterLiters } from '../../utils/calc'
import { useI18n } from '../../i18n/i18n'

// Tap-to-log water tracker — 250ml per cup. Target derived from
// the user's weight + activity via the existing waterLiters() util.

const CUP_ML = 250

export function WaterTracker({ compact = false }) {
  const { state, addWaterCup, resetWaterDay } = useApp()
  const { isRTL } = useI18n()
  const day = todayKey()
  const cups = (state.waterLog || {})[day] || 0

  const targetLiters = waterLiters(state.profile.weightKg, state.profile.activity)
  const targetCups = Math.max(1, Math.round((targetLiters * 1000) / CUP_ML))
  const drunkLiters = (cups * CUP_ML) / 1000
  const pct = Math.min(100, Math.round((cups / targetCups) * 100))
  const done = cups >= targetCups

  const inc = () => addWaterCup(day, 1)
  const dec = () => addWaterCup(day, -1)
  const reset = () => {
    if (cups > 0 && confirm(isRTL ? 'לאפס את מונה המים של היום?' : "Reset today's water counter?")) {
      resetWaterDay(day)
    }
  }

  return (
    <div style={{
      padding: compact ? 14 : 18,
      background: `linear-gradient(160deg, rgba(74,127,199,0.10) 0%, ${t.color.bgElevated} 60%)`,
      border: `1px solid ${done ? 'rgba(74,156,106,0.4)' : 'rgba(74,127,199,0.35)'}`,
      borderRadius: t.radius.md,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: compact ? 10 : 12,
      }}>
        <div>
          <div style={{
            fontFamily: t.font.family.mono, fontSize: 10, letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: done ? '#4a9c6a' : '#4a7fc7', fontWeight: 700,
          }}>
            {done
              ? (isRTL ? 'יעד הושג' : 'Goal reached')
              : (isRTL ? 'מים היום' : 'Water today')}
          </div>
          <div style={{ fontSize: compact ? 20 : 24, fontWeight: 800, color: t.color.ink, marginTop: 2, letterSpacing: '-0.01em' }}>
            {drunkLiters.toFixed(2)}<span style={{ color: t.color.silver1, fontSize: 14, fontWeight: 500 }}> / {targetLiters}L</span>
          </div>
        </div>
        <button
          onClick={reset}
          disabled={cups === 0}
          title={isRTL ? 'אפס' : 'Reset'}
          aria-label={isRTL ? 'אפס' : 'Reset'}
          style={{
            background: 'transparent', border: `1px solid ${t.color.border}`,
            color: t.color.silver1, cursor: cups > 0 ? 'pointer' : 'default',
            padding: '6px 10px', borderRadius: t.radius.sm, fontFamily: 'inherit',
            fontSize: 11, opacity: cups > 0 ? 1 : 0.4,
          }}
        >
          {isRTL ? 'אפס' : 'Reset'}
        </button>
      </div>

      {/* Cup grid — visual glasses */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(targetCups, 8)}, 1fr)`,
        gap: 6, marginBottom: compact ? 12 : 14,
      }}>
        {Array.from({ length: Math.max(targetCups, cups) }).map((_, i) => {
          const filled = i < cups
          return (
            <button
              key={i}
              onClick={() => addWaterCup(day, filled && i === cups - 1 ? -1 : (i < cups ? 0 : 1))}
              title={filled ? (isRTL ? 'לחיצה תסיר את הכוס האחרונה' : 'Tap to remove the last cup') : (isRTL ? 'הוסף כוס' : 'Add cup')}
              aria-label={`${i + 1}/${targetCups}`}
              style={{
                aspectRatio: '1 / 1.3',
                background: filled
                  ? 'linear-gradient(180deg, rgba(74,127,199,0.15) 0%, rgba(74,127,199,0.55) 100%)'
                  : 'transparent',
                border: `1.5px solid ${filled ? '#4a7fc7' : t.color.border}`,
                borderRadius: '3px 3px 8px 8px',
                cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                paddingBottom: 4, fontSize: 9, color: filled ? t.color.bone : t.color.silver2,
                fontFamily: t.font.family.mono, letterSpacing: '0.1em',
                transition: t.transition,
              }}
            >
              {filled ? '250' : ''}
            </button>
          )
        })}
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={inc}
          style={{
            flex: 1, padding: '10px 14px',
            background: '#4a7fc7', border: 'none',
            color: t.color.white, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 14, fontWeight: 700, borderRadius: t.radius.md,
            transition: t.transition,
          }}
        >
          + {isRTL ? 'כוס' : 'Cup'} (250ml)
        </button>
        {cups > 0 && (
          <button
            onClick={dec}
            title={isRTL ? 'הסר כוס' : 'Remove a cup'}
            style={{
              padding: '10px 16px',
              background: 'transparent', border: `1px solid ${t.color.border}`,
              color: t.color.silver1, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 16, fontWeight: 700, borderRadius: t.radius.md,
            }}
          >
            −
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        marginTop: 12, height: 4, background: t.color.bgSoft, borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: done ? '#4a9c6a' : '#4a7fc7',
          transition: 'width 300ms ease',
        }} />
      </div>
    </div>
  )
}
