/**
 * SneakerSelectCard — carte avec checkbox dans le coin haut-droit.
 * Utilisee dans /labels pour multi-select des paires a imprimer.
 */
import type { CSSProperties } from 'react'
import { SneakerPhoto } from './SneakerPhoto'

interface SneakerSelectCardProps {
  id: string
  name: string
  brand: string | null
  /** URL StockX directe (publique) */
  stockxUrl?: string | null
  /** Path Storage privé (signed URL générée à la volée) */
  storagePath?: string | null
  selected: boolean
  onToggle: (id: string) => void
}

export function SneakerSelectCard({
  id, name, brand, stockxUrl, storagePath, selected, onToggle,
}: SneakerSelectCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      style={selected ? cardSelectedStyle : cardStyle}
      aria-pressed={selected}
    >
      <div style={imageWrapStyle}>
        <SneakerPhoto stockxUrl={stockxUrl} storagePath={storagePath} alt={name} />
      </div>
      <div style={infoStyle}>
        {brand && <div style={brandStyle}>{brand.toUpperCase()}</div>}
        <div style={nameStyle}>{name}</div>
      </div>
      <div style={selected ? checkSelectedStyle : checkStyle}>
        {selected && <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700 }}>✓</span>}
      </div>
    </button>
  )
}

const cardStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  padding: 12,
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
  textAlign: 'center',
  transition: 'border-color 120ms, transform 120ms',
}
const cardSelectedStyle: CSSProperties = {
  ...cardStyle,
  border: '2px solid var(--color-bred)',
  background: '#FFF5F7',
}
const imageWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '4 / 3',
  background: 'var(--color-surface-alt)',
  borderRadius: 6,
  overflow: 'hidden',
  marginBottom: 8,
}
const infoStyle: CSSProperties = { width: '100%' }
const brandStyle: CSSProperties = {
  fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
  color: 'var(--color-text-muted)', marginBottom: 2,
}
const nameStyle: CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--color-text)',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}
const checkStyle: CSSProperties = {
  position: 'absolute',
  top: 8, right: 8,
  width: 22, height: 22,
  borderRadius: '50%',
  border: '2px solid var(--color-border)',
  background: 'var(--color-surface)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const checkSelectedStyle: CSSProperties = {
  ...checkStyle,
  background: 'var(--color-bred)',
  border: '2px solid var(--color-bred)',
}