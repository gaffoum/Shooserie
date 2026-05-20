import { Link } from 'react-router-dom'
import { useT } from '@/i18n/I18nContext'
import type { CSSProperties } from 'react'

interface BackLinkProps {
  to: string
  label?: string
}

export function BackLink({ to, label }: BackLinkProps) {
  const { t } = useT()
  return (
    <Link to={to} aria-label={label ?? t('common.back')} style={style}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </Link>
  )
}

const style: CSSProperties = {
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  textDecoration: 'none',
}
