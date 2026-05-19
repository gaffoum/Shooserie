import type { CSSProperties } from 'react'

interface PhotoPlaceholderProps {
  /** Couleur de fond, défaut : un gris neutre */
  background?: string
  /** Couleur de la silhouette */
  color?: string
  size?: number
}

/**
 * Silhouette SVG simple d'une sneaker, utilisée quand pas de photo dispo.
 */
export function PhotoPlaceholder({
  background = '#EAEAEA',
  color = '#FFFFFF',
  size = 54,
}: PhotoPlaceholderProps) {
  return (
    <div style={{ ...wrapStyle, background }}>
      <svg
        width={size}
        height={size * 0.6}
        viewBox="0 0 100 60"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path
          d="M8,42 Q8,22 28,18 L48,16 Q58,16 64,20 L78,30 Q90,35 92,42 L92,48 Q92,52 88,52 L12,52 Q8,52 8,48 Z"
          fill={color}
          fillOpacity="0.85"
          stroke="none"
        />
        <path
          d="M30,30 Q42,24 56,26"
          stroke={background}
          strokeOpacity="0.6"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
