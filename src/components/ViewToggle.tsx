import { useT } from '@/i18n/I18nContext'
import type { CSSProperties } from 'react'

export type ViewMode = 'grid' | 'table'

interface ViewToggleProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const { t } = useT()
  return (
    <div style={wrapStyle} role="tablist">
      <button
        type="button"
        onClick={() => onChange('grid')}
        aria-label={t('view.grid')}
        aria-pressed={value === 'grid'}
        style={btnStyle(value === 'grid')}
      >
        <GridIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange('table')}
        aria-label={t('view.table')}
        aria-pressed={value === 'table'}
        style={btnStyle(value === 'table')}
      >
        <ListIcon />
      </button>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  display: 'inline-flex',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  background: 'var(--color-surface)',
}

const btnStyle = (active: boolean): CSSProperties => ({
  padding: '7px 10px',
  background: active ? 'var(--color-text)' : 'transparent',
  color: active ? '#FFFFFF' : 'var(--color-text-muted)',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background var(--transition-fast), color var(--transition-fast)',
})

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
