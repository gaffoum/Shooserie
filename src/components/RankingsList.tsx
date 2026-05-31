/**
 * RankingsList — composant generique pour les sections de /rankings.
 * Affiche une liste verticale de paires avec rang, photo, brand, nom,
 * meta (textuel, dynamique selon le type) + badge optionnel.
 */
import { Link } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'

interface BaseRankingItem {
  id: string
  name: string
  brand: string | null
  photo_url: string | null
  stockx_image_url: string | null
}

interface RankingsListProps<T extends BaseRankingItem> {
  title: string
  items: T[]
  renderMeta: (item: T, rank: number) => ReactNode
  renderBadge?: (item: T, rank: number) => ReactNode
  emptyMessage?: string
}

export function RankingsList<T extends BaseRankingItem>({
  title,
  items,
  renderMeta,
  renderBadge,
  emptyMessage,
}: RankingsListProps<T>) {
  if (items.length === 0) {
    if (!emptyMessage) return null
    return (
      <section style={sectionStyle}>
        <h2 style={titleStyle}>{title}</h2>
        <div style={emptyStyle}>{emptyMessage}</div>
      </section>
    )
  }

  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>{title}</h2>
      <div style={listStyle}>
        {items.map((item, i) => {
          const photo = item.stockx_image_url || item.photo_url || ''
          return (
            <Link
              key={item.id}
              to={`/sneakers/${item.id}`}
              style={rowLinkStyle}
            >
              <div style={rowStyle}>
                <span style={rankStyle}>#{i + 1}</span>
                <div style={imageWrapStyle}>
                  {photo ? (
                    <img src={photo} alt={item.name} style={imgStyle} />
                  ) : (
                    <div style={imgPlaceholderStyle} />
                  )}
                </div>
                <div style={infoStyle}>
                  {item.brand && <div style={brandStyle}>{item.brand}</div>}
                  <div style={nameStyle}>{item.name}</div>
                </div>
                <div style={metaWrapStyle}>
                  <div style={metaStyle}>{renderMeta(item, i + 1)}</div>
                  {renderBadge && (
                    <div style={badgeWrapStyle}>{renderBadge(item, i + 1)}</div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

const sectionStyle: CSSProperties = { marginBottom: 32 }
const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display, \'Outfit\', sans-serif)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text, #0A0A0A)',
  margin: '0 0 12px',
}
const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}
const rowLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
}
const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '32px 64px 1fr auto',
  alignItems: 'center',
  gap: 12,
  background: 'var(--color-surface, #FFFFFF)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: 10,
  padding: '10px 14px',
  transition: 'border-color var(--transition-fast, 120ms)',
}
const rankStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-muted, #6B7280)',
  fontVariantNumeric: 'tabular-nums',
}
const imageWrapStyle: CSSProperties = {
  width: 64,
  height: 56,
  background: 'var(--color-bg, #F9FAFB)',
  borderRadius: 6,
  overflow: 'hidden',
  flexShrink: 0,
}
const imgStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
}
const imgPlaceholderStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'var(--color-bg, #F9FAFB)',
}
const infoStyle: CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
}
const brandStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #6B7280)',
  marginBottom: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const nameStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.3,
  color: 'var(--color-text, #0A0A0A)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const metaWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 4,
  flexShrink: 0,
  textAlign: 'right',
}
const metaStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text, #0A0A0A)',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
}
const badgeWrapStyle: CSSProperties = {
  display: 'flex',
}
const emptyStyle: CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: 'var(--color-text-muted, #6B7280)',
  fontSize: 13,
  background: 'var(--color-surface, #FFFFFF)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: 10,
}