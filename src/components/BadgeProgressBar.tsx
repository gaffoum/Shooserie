/**
 * BadgeProgressBar — montre la progression vers le grade suivant.
 * "Tu es a X paires du grade Y" + barre.
 */
import type { CSSProperties } from 'react'
import { type GradeProgress } from '@/lib/badges'

interface BadgeProgressBarProps {
  progress: GradeProgress
}

export function BadgeProgressBar({ progress }: BadgeProgressBarProps) {
  if (!progress.next) {
    return (
      <div style={maxedStyle}>
        👑 Tu es au sommet — grade maximum atteint
      </div>
    )
  }

  return (
    <div style={wrapStyle}>
      <div style={textRowStyle}>
        <span style={textStyle}>
          Plus que <strong>{progress.pairsToGo}</strong>{' '}
          {progress.pairsToGo === 1 ? 'paire' : 'paires'} avant{' '}
          <strong>{progress.next.label}</strong>
        </span>
        <span style={pctStyle}>{progress.progressPct}%</span>
      </div>
      <div style={trackStyle}>
        <div style={{ ...fillStyle, width: `${progress.progressPct}%` }} />
      </div>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  margin: '8px 0',
}

const textRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 6,
}

const textStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted, #6B7280)',
}

const pctStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-muted, #6B7280)',
  fontVariantNumeric: 'tabular-nums',
}

const trackStyle: CSSProperties = {
  height: 6,
  background: 'var(--color-bg, #F3F4F6)',
  borderRadius: 999,
  overflow: 'hidden',
}

const fillStyle: CSSProperties = {
  height: '100%',
  background: 'var(--color-bred, #CE1141)',
  borderRadius: 999,
  transition: 'width 300ms ease',
}

const maxedStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text, #0A0A0A)',
  textAlign: 'center',
  padding: '8px 12px',
  background: 'var(--color-bg, #F9FAFB)',
  borderRadius: 8,
}