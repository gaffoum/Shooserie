import { useT } from '@/i18n/I18nContext'
import type { CSSProperties } from 'react'

interface BrandFilterProps {
  brands: string[]
  selected: string | null
  onChange: (brand: string | null) => void
}

export function BrandFilter({ brands, selected, onChange }: BrandFilterProps) {
  const { t } = useT()
  return (
    <div style={wrapStyle} role="group" aria-label={t('common.all')}>
      <Chip
        label={t('common.all')}
        active={selected === null}
        onClick={() => onChange(null)}
      />
      {brands.map((b) => (
        <Chip
          key={b}
          label={b}
          active={selected === b}
          onClick={() => onChange(b)}
        />
      ))}
    </div>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={chipStyle(active)}
    >
      {label}
    </button>
  )
}

const wrapStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
}

const chipStyle = (active: boolean): CSSProperties => ({
  background: active ? 'var(--color-bred)' : 'var(--color-surface)',
  border: `1px solid ${active ? 'var(--color-bred)' : 'var(--color-border)'}`,
  color: active ? '#FFFFFF' : 'var(--color-text-muted)',
  padding: '6px 14px',
  borderRadius: 'var(--radius-pill)',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  transition: 'background var(--transition-fast), color var(--transition-fast)',
  whiteSpace: 'nowrap',
})
