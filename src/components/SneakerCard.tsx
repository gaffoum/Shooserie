import { Link } from 'react-router-dom'
import type { Sneaker } from '@/lib/types'
import { calcDelta, deltaBgColor, deltaColor, effectiveCost, formatEur, formatPct } from '@/lib/format'
import { useT } from '@/i18n/I18nContext'
import { SneakerPhoto } from './SneakerPhoto'
import { RefreshCoteButton } from './RefreshCoteButton'
import { OwnerCountBadge } from './OwnerCountBadge'
import { wearStatus, WEAR_STATUS_COLORS, useIncrementWear } from '@/lib/wears'
import { rarityMetal, isGrail, hasRarity } from '@/lib/rarityStyle'
import type { CSSProperties } from 'react'

interface SneakerCardProps {
  sneaker: Sneaker
  /** Number of distinct users (across the whole user base) who own this same
   *  model — keyed by stockx_product_id. Undefined when the card isn't
   *  linked to the catalog OR while the batch lookup is still loading. The
   *  badge auto-hides if undefined/0. */
  ownerCount?: number
}

export function SneakerCard({ sneaker, ownerCount }: SneakerCardProps) {
  const { t } = useT()
  const inc = useIncrementWear()
  const delta = calcDelta(effectiveCost(sneaker), sneaker.market_price)
  const sizeLabel = formatSize(sneaker.size_eu, sneaker.size_us)
  const priceShown = sneaker.market_price ?? effectiveCost(sneaker)

  // Accent « métal » de rareté (handoff) : bord teinté + glow doré pour le grail.
  const rarity = sneaker.rarity ?? 'unknown'
  const metal = rarityMetal(rarity)
  const grail = isGrail(rarity)
  const cardStyleRarity: CSSProperties = hasRarity(rarity)
    ? {
        ...cardStyle,
        borderColor: metal,
        borderWidth: 1.5,
        boxShadow: grail ? '0 0 0 1px rgba(231,169,60,0.5), 0 6px 18px rgba(231,169,60,0.22)' : undefined,
      }
    : cardStyle

  return (
    <Link to={`/sneakers/${sneaker.id}`} style={linkStyle}>
      <div style={cardStyleRarity}>
        <div style={imageStyle}>
          <SneakerPhoto
            stockxUrl={sneaker.stockx_image_url}
            storagePath={sneaker.photo_url}
            alt={sneaker.name}
          />
          {sneaker.is_for_sale && (
            <span style={forSaleRibbonStyle}>{t('card.forSale')}</span>
          )}
          {/* Owner count — top-right, opposite of the for-sale ribbon. */}
          <div style={ownerBadgeWrapStyle}>
            <OwnerCountBadge count={ownerCount} variant="card" />
          </div>
          {/* Wear status badge — bottom-left */}
          <span
            style={{
              ...statusBadgeOnCardStyle,
              background: WEAR_STATUS_COLORS[wearStatus(sneaker.wear_count)].bg,
              color: WEAR_STATUS_COLORS[wearStatus(sneaker.wear_count)].fg,
            }}
          >
            {wearStatus(sneaker.wear_count)}
          </span>
          {/* Inline +1 wear button — bottom-right (stops Link nav) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              inc.mutate(sneaker.id)
            }}
            disabled={inc.isPending}
            style={incrementBtnOnCardStyle}
            aria-label="Incrémenter le compteur de wears"
          >
            +1
          </button>
        </div>
        <div style={bodyStyle}>
          {sneaker.brand && <div style={brandStyle}>{sneaker.brand}</div>}
          <div style={nameStyle}>{sneaker.name}</div>
          {sizeLabel && <div style={sizeStyle}>{sizeLabel}</div>}
          <div style={rowStyle}>
            <div style={priceStyle}>{formatEur(priceShown)}</div>
            <div style={rightGroupStyle}>
              {delta.pct !== null && (
                <div
                  style={{
                    ...deltaStyle,
                    background:
                      deltaBgColor(delta.pct) ?? 'var(--color-neutral-chip-bg)',
                    color: deltaColor(delta.pct),
                  }}
                >
                  {formatPct(delta.pct, true)}
                </div>
              )}
              <RefreshCoteButton sneaker={sneaker} variant="card" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function formatSize(eu: string | null, us: string | null): string | null {
  const parts: string[] = []
  if (eu) parts.push(`EU ${eu}`)
  if (us) parts.push(`US ${us}`)
  return parts.length ? parts.join(' · ') : null
}

const linkStyle: CSSProperties = { color: 'inherit', textDecoration: 'none', display: 'block' }
const cardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
}
const imageStyle: CSSProperties = {
  aspectRatio: '1.15',
  position: 'relative',
  background: 'var(--color-bg)',
  overflow: 'hidden',
}
const bodyStyle: CSSProperties = { padding: 12, minWidth: 0 }
const brandStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 4,
  fontWeight: 500,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const nameStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1.35,
  color: 'var(--color-text)',
  margin: '0 0 6px',
  fontWeight: 500,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  minHeight: 32,
}
const sizeStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  fontVariantNumeric: 'tabular-nums',
  marginBottom: 10,
  letterSpacing: '0.04em',
}
const rowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: 10,
  borderTop: '1px solid var(--color-border)',
  gap: 8,
}
const rightGroupStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flexShrink: 0,
}
const priceStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text)',
  fontVariantNumeric: 'tabular-nums',
}
const deltaStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm)',
  whiteSpace: 'nowrap',
}
const forSaleRibbonStyle: CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  padding: '3px 8px',
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  fontFamily: 'var(--font-display)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-wider)',
  borderRadius: 'var(--radius-sm)',
  zIndex: 1,
}
// Wrapper to absolutely position the owner-count badge in the top-right
// corner of the photo, opposite the for-sale ribbon. The badge itself comes
// from <OwnerCountBadge> which auto-hides when count is undefined/0.
const ownerBadgeWrapStyle: CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  zIndex: 1,
}
// Wear status badge sur la carte (bottom-left de l'image).
// Position absolue, miroir de forSaleRibbon (top-left) sur l'axe vertical.
const statusBadgeOnCardStyle: CSSProperties = {
  position: 'absolute',
  bottom: 8,
  left: 8,
  zIndex: 1,
  padding: '3px 8px',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.04em',
  borderRadius: 'var(--radius-sm)',
  fontFamily: "'Outfit', sans-serif",
}

// Bouton +1 inline sur la carte (bottom-right de l'image).
// Position absolue, miroir de ownerBadgeWrap (top-right). z-index plus eleve
// pour passer au-dessus de la photo. preventDefault dans le onClick pour
// ne pas trigger le <Link> parent.
const incrementBtnOnCardStyle: CSSProperties = {
  position: 'absolute',
  bottom: 8,
  right: 8,
  zIndex: 2,
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: 'none',
  background: 'var(--color-bred, #CE1141)',
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
  transition: 'transform 120ms ease, opacity 120ms ease',
}
