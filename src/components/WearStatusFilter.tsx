/**
 * WearStatusFilter — chips de filtre par statut de wear.
 * Jumeau visuel de BrandFilter, avec la couleur du statut sur la chip active.
 */
import type { CSSProperties } from 'react'
import { WEAR_STATUSES, type WearStatus, WEAR_STATUS_COLORS } from '@/lib/wears'

interface WearStatusFilterProps {
  selected: WearStatus | null
  onChange: (status: WearStatus | null) => void
}

export function WearStatusFilter({ selected, onChange }: WearStatusFilterProps) {
  return (
    <div style={wrapStyle} role="group" aria-label="Filtre par état">
      <Chip
        label="TOUS"
        active={selected === null}
        onClick={() => onChange(null)}
      />
      {WEAR_STATUSES.map((status) => (
        <Chip
          key={status}
          label={status}
          active={selected === status}
          onClick={() => onChange(status)}
          accentBg={WEAR_STATUS_COLORS[status].bg}
          accentFg={WEAR_STATUS_COLORS[status].fg}
        />
      ))}
    </div>
  )
}

interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
  accentBg?: string
  accentFg?: string
}

function Chip({ label, active, onClick, accentBg, accentFg }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={chipStyle(active, accentBg, accentFg)}
    >
      {label}
    </button>
  )
}

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const chipStyle = (
  active: boolean,
  accentBg?: string,
  accentFg?: string,
): CSSProperties => {
  // Active + accent (statut coloré) → bg = couleur statut
  // Active sans accent (chip "TOUS") → bg = rouge brand
  // Inactive → chip neutre
  const bg = active ? (accentBg ?? '#CE1141') : 'var(--color-surface)'
  const fg = active ? (accentFg ?? '#FFFFFF') : 'var(--color-text)'
  const border = active ? bg : 'var(--color-border)'
  return {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.02em',
    fontFamily: "'Outfit', sans-serif",
    background: bg,
    color: fg,
    border: `1px solid ${border}`,
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'all 120ms ease',
    whiteSpace: 'nowrap',
  }
}