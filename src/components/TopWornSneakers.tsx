/**
 * TopWornSneakers — section "Les plus portees" du Dashboard.
 * Liste horizontale (scroll) des paires les plus portees de l'utilisateur
 * courant, triees desc par wear_count, excluant les DS. S'auto-masque s'il
 * n'y a aucune paire portee.
 */
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import {
  useMyTopWornSneakers,
  wearStatus,
  WEAR_STATUS_COLORS,
} from '@/lib/wears'
import { SneakerPhoto } from './SneakerPhoto'

interface TopWornSneakersProps {
  limit?: number
  /** Si fourni, affiche un lien 'Voir tout' a cote du titre. */
  viewAllUrl?: string
}

export function TopWornSneakers({ limit = 10, viewAllUrl }: TopWornSneakersProps) {
  const { data: sneakers = [], isLoading } = useMyTopWornSneakers(limit)

  // Auto-hide : ni en chargement (UX clean), ni si rien a montrer
  if (isLoading || sneakers.length === 0) return null

  return (
    <section style={sectionStyle}>
      <header style={headerStyle}>
        <h2 style={titleStyle}>LES PLUS PORTÉES</h2>
        <span style={subtitleStyle}>
          {sneakers.length < limit
            ? `${sneakers.length} ${sneakers.length > 1 ? 'paires' : 'paire'}`
            : `Top ${limit}`}
        </span>
        {viewAllUrl && (
          <Link to={viewAllUrl} style={viewAllStyle}>Voir tout →</Link>
        )}
      </header>
      <div style={scrollStyle}>
        {sneakers.map((s, i) => {
          const status = wearStatus(s.wear_count)
          const colors = WEAR_STATUS_COLORS[status]
          return (
            <Link key={s.id} to={`/sneakers/${s.id}`} style={cardLinkStyle}>
              <div style={cardStyle}>
                <span style={rankStyle}>#{i + 1}</span>
                <div style={imageWrapStyle}>
                  <SneakerPhoto
                    stockxUrl={s.stockx_image_url}
                    storagePath={s.photo_url}
                    alt={s.name}
                  />
                </div>
                <div style={bodyStyle}>
                  {s.brand && <div style={brandStyle}>{s.brand}</div>}
                  <div style={nameStyle}>{s.name}</div>
                  <div style={metaRowStyle}>
                    <span style={countStyle}>
                      {s.wear_count} {s.wear_count > 1 ? 'wears' : 'wear'}
                    </span>
                    <span
                      style={{
                        ...badgeStyle,
                        background: colors.bg,
                        color: colors.fg,
                      }}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// =================================================================
// Styles
// =================================================================
const sectionStyle: CSSProperties = { marginBottom: 24 }

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginBottom: 12,
  gap: 12,
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display, \'Outfit\', sans-serif)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text, #0A0A0A)',
  margin: 0,
}

const subtitleStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted, #6B7280)',
  fontWeight: 500,
}

const scrollStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  paddingBottom: 8,
  WebkitOverflowScrolling: 'touch',
}

const cardLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  flex: '0 0 180px',
  scrollSnapAlign: 'start',
}

const cardStyle: CSSProperties = {
  position: 'relative',
  background: 'var(--color-surface, #FFFFFF)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: 8,
  overflow: 'hidden',
  transition: 'border-color var(--transition-fast, 120ms)',
}

const rankStyle: CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  zIndex: 1,
  padding: '3px 8px',
  background: 'var(--color-text, #0A0A0A)',
  color: '#FFFFFF',
  fontSize: 11,
  fontWeight: 700,
  borderRadius: 4,
  fontFamily: "'Outfit', sans-serif",
}

const imageWrapStyle: CSSProperties = {
  position: 'relative',
  aspectRatio: '1.15',
  background: 'var(--color-bg, #F9FAFB)',
  overflow: 'hidden',
}

const bodyStyle: CSSProperties = { padding: 10 }

const brandStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--color-text-muted, #6B7280)',
  fontWeight: 600,
  marginBottom: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const nameStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.3,
  color: 'var(--color-text, #0A0A0A)',
  marginBottom: 8,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  minHeight: 32,
}

const metaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 6,
}

const countStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text, #0A0A0A)',
  fontVariantNumeric: 'tabular-nums',
}

const badgeStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
  letterSpacing: '0.02em',
  fontFamily: "'Outfit', sans-serif",
}

// Lien "Voir tout →" dans le header de la section
const viewAllStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-bred, #CE1141)',
  textDecoration: 'none',
  fontFamily: "'Outfit', sans-serif",
  marginLeft: 'auto',
}
