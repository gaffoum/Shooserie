import { useT } from '@/i18n/I18nContext'
import type { CSSProperties } from 'react'

interface TagFilterProps {
  tags: string[]
  /** Currently selected tags. A sneaker matches if it has ANY of these tags. */
  selected: string[]
  onChange: (selected: string[]) => void
}

/**
 * Multi-select chip filter for tags. Click a chip to toggle. "Tous" clears.
 * Mirrors the visual language of BrandFilter.
 */
export function TagFilter({ tags, selected, onChange }: TagFilterProps) {
  const { t } = useT()
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div style={wrapStyle} role="group" aria-label={t('form.field.tags')}>
      <Chip
        label={t('common.all')}
        active={selected.length === 0}
        onClick={() => onChange([])}
      />
      {tags.map((tg) => (
        <Chip key={tg} label={tg} active={selected.includes(tg)} onClick={() => toggle(tg)} />
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
    <button type="button" onClick={onClick} aria-pressed={active} style={chipStyle(active)}>
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
  background: active ? 'var(--color-royal)' : 'var(--color-surface)',
  border: `1px solid ${active ? 'var(--color-royal)' : 'var(--color-border)'}`,
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
