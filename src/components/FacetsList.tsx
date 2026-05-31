/**
 * FacetsList — affiche les facettes (tags secondaires) sous le badge.
 * Petits chips avec emoji + label court.
 */
import type { CSSProperties } from 'react'
import { FACETS, type FacetCode } from '@/lib/badges'

interface FacetsListProps {
  facets: FacetCode[]
}

export function FacetsList({ facets }: FacetsListProps) {
  if (facets.length === 0) return null
  return (
    <div style={wrapStyle}>
      {facets.map((code) => {
        const f = FACETS[code]
        return (
          <span key={code} style={chipStyle} title={f.description}>
            <span style={emojiStyle}>{f.emoji}</span>
            <span>{f.label}</span>
          </span>
        )
      })}
    </div>
  )
}

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  fontFamily: "'Outfit', sans-serif",
}

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 8px',
  background: 'var(--color-bg, #F9FAFB)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--color-text, #0A0A0A)',
  whiteSpace: 'nowrap',
}

const emojiStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1,
}