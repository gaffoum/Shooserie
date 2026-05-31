/**
 * BadgeDisplay — affiche un badge (SVG + label optionnel).
 * 3 tailles : sm (24x24, inline), md (48x48, standard), lg (80x80, hero).
 */
import type { CSSProperties } from 'react'
import { BADGES, type BadgeCode } from '@/lib/badges'

interface BadgeDisplayProps {
  code: BadgeCode
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  /** Si true, affiche le label complet ('Chasseur Rock or Stock').
   *  Sinon le shortLabel ('Rock or Stock'). */
  longLabel?: boolean
}

const SIZE_PX: Record<NonNullable<BadgeDisplayProps['size']>, number> = {
  sm: 24,
  md: 48,
  lg: 80,
}

export function BadgeDisplay({
  code,
  size = 'md',
  showLabel = false,
  longLabel = false,
}: BadgeDisplayProps) {
  const badge = BADGES[code]
  const px = SIZE_PX[size]
  const label = longLabel ? badge.label : badge.shortLabel

  return (
    <span style={wrapperStyle} title={badge.description}>
      <img
        src={badge.svgPath}
        alt={badge.label}
        width={px}
        height={px}
        style={{ display: 'block', flexShrink: 0 }}
      />
      {showLabel && (
        <span style={size === 'lg' ? labelStyleLg : labelStyle}>{label}</span>
      )}
    </span>
  )
}

const wrapperStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: "'Outfit', sans-serif",
}

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text, #0A0A0A)',
  letterSpacing: '0.01em',
}

const labelStyleLg: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--color-text, #0A0A0A)',
  letterSpacing: '-0.01em',
}