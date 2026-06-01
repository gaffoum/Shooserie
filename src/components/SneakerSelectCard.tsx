/**
 * SneakerSelectCard — carte avec checkbox dans le coin haut-droit.
 * Utilisee dans /labels pour multi-select des paires a imprimer.
 */
import type { CSSProperties } from 'react'

interface SneakerSelectCardProps {
  id: string
  name: string
  brand: string | null
  photoUrl: string | null
  selected: boolean
  onToggle: (id: string) => void
}

export function SneakerSelectCard({
  id, name, brand, photoUrl, selected, onToggle,
}: SneakerSelectCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      style={selected ? cardSelectedStyle : cardStyle}
      aria-pressed={selected}
    >
      <div style={imageWrapStyle}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} style={imgStyle} />
        ) : (
          <div style={imgPlaceholderStyle} />
        )}
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
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  padding: 12,
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
  textAlign: 'center',
  transition: 'border-color 120ms, transform 120ms',
}
const cardSelectedStyle: CSSProperties = {
  ...cardStyle,
  border: '2px solid #CE1141',
  background: '#FFF5F7',
}
const imageWrapStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '4 / 3',
  background: '#F9FAFB',
  borderRadius: 6,
  overflow: 'hidden',
  marginBottom: 8,
}
const imgStyle: CSSProperties = {
  width: '100%', height: '100%', objectFit: 'contain',
}
const imgPlaceholderStyle: CSSProperties = {
  width: '100%', height: '100%', background: '#F3F4F6',
}
const infoStyle: CSSProperties = { width: '100%' }
const brandStyle: CSSProperties = {
  fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
  color: '#6B7280', marginBottom: 2,
}
const nameStyle: CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#0A0A0A',
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
  border: '2px solid #E5E7EB',
  background: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const checkSelectedStyle: CSSProperties = {
  ...checkStyle,
  background: '#CE1141',
  border: '2px solid #CE1141',
}