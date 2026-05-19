import { Link } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: ReactNode
  /** Bouton CTA principal */
  ctaLabel?: string
  ctaTo?: string
  /** Bouton secondaire */
  secondaryLabel?: string
  secondaryTo?: string
  secondaryDisabled?: boolean
}

export function EmptyState({
  icon = '👟',
  title,
  description,
  ctaLabel,
  ctaTo,
  secondaryLabel,
  secondaryTo,
  secondaryDisabled,
}: EmptyStateProps) {
  return (
    <section style={wrapStyle}>
      <div style={iconStyle} aria-hidden>
        {icon}
      </div>
      <h2 style={titleStyle}>{title}</h2>
      {description && <p style={descStyle}>{description}</p>}

      {(ctaLabel || secondaryLabel) && (
        <div style={actionsStyle}>
          {ctaLabel && ctaTo && (
            <Link to={ctaTo} style={primaryBtnStyle}>
              {ctaLabel}
            </Link>
          )}
          {secondaryLabel &&
            (secondaryDisabled ? (
              <button disabled style={secondaryBtnStyle(true)}>
                {secondaryLabel}
              </button>
            ) : secondaryTo ? (
              <Link to={secondaryTo} style={{ ...secondaryBtnStyle(false), textDecoration: 'none' }}>
                {secondaryLabel}
              </Link>
            ) : null)}
        </div>
      )}
    </section>
  )
}

const wrapStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px dashed var(--color-border-strong)',
  borderRadius: 'var(--radius-xl)',
  padding: '48px 20px',
  textAlign: 'center',
}
const iconStyle: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 28,
  margin: '0 auto 18px',
}
const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 17,
  fontWeight: 600,
  marginBottom: 8,
}
const descStyle: CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 13,
  maxWidth: 380,
  margin: '0 auto 22px',
  lineHeight: 1.5,
}
const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  flexWrap: 'wrap',
}
const primaryBtnStyle: CSSProperties = {
  padding: '10px 18px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  textDecoration: 'none',
  display: 'inline-block',
}
const secondaryBtnStyle = (disabled: boolean): CSSProperties => ({
  padding: '10px 18px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  opacity: disabled ? 0.5 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
})
