import { useT } from '@/i18n/I18nContext'
import type { CSSProperties } from 'react'

interface OwnerCountBadgeProps {
  count: number | undefined
  /** 'card' is the small pill overlaid on a sneaker photo (default).
   *  'inline' is a larger badge used standalone (e.g. on the detail page). */
  variant?: 'card' | 'inline'
}

/**
 * Small social proof badge: "👥 N collectionneurs ont ce modèle".
 *
 * Renders nothing when count is undefined (loading) or 0. Renders even for
 * count = 1 (just the current user) because the badge is a hint of the social
 * graph being there at all, and "1 collectionneur" is honest — it doesn't
 * pretend the user has company they don't have.
 *
 * The "card" variant is a pill positioned absolutely by the parent (it just
 * defines its own visual style; parent decides where to place it). The
 * "inline" variant is meant to sit alongside other text in a flex row.
 */
export function OwnerCountBadge({ count, variant = 'card' }: OwnerCountBadgeProps) {
  const { t } = useT()
  if (count === undefined || count <= 0) return null

  const labelKey =
    count === 1 ? 'community.badge.one' : 'community.badge.many'

  return (
    <span
      style={variant === 'card' ? cardStyle : inlineStyle}
      title={t(labelKey, { count: String(count) })}
      aria-label={t(labelKey, { count: String(count) })}
    >
      <span aria-hidden style={{ fontSize: variant === 'card' ? 11 : 13 }}>
        👥
      </span>
      {count}
    </span>
  )
}

const cardStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 8px',
  background: 'rgba(255, 255, 255, 0.92)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-display)',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 'var(--radius-sm)',
  // Subtle backdrop blur so the badge stays readable on any photo background.
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  fontVariantNumeric: 'tabular-nums',
}

const inlineStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 10px',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-display)',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border)',
  fontVariantNumeric: 'tabular-nums',
}
