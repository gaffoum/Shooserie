import { Link } from 'react-router-dom'
import type { Sneaker } from '@/lib/types'
import { calcDelta, deltaBgColor, deltaColor, effectiveCost, formatEur, formatPct } from '@/lib/format'
import { SneakerPhoto } from './SneakerPhoto'
import type { CSSProperties } from 'react'

interface SneakerCardProps {
  sneaker: Sneaker
}

export function SneakerCard({ sneaker }: SneakerCardProps) {
  const delta = calcDelta(effectiveCost(sneaker), sneaker.market_price)
  const sizeLabel = formatSize(sneaker.size_eu, sneaker.size_us)
  const priceShown = sneaker.market_price ?? effectiveCost(sneaker)

  return (
    <Link to={`/sneakers/${sneaker.id}`} style={linkStyle}>
      <div style={cardStyle}>
        <div style={imageStyle}>
          <SneakerPhoto
            stockxUrl={sneaker.stockx_image_url}
            storagePath={sneaker.photo_url}
            alt={sneaker.name}
          />
          {sneaker.is_for_sale && (
            <span style={forSaleRibbonStyle}>À VENDRE</span>
          )}
        </div>
        <div style={bodyStyle}>
          {sneaker.brand && <div style={brandStyle}>{sneaker.brand}</div>}
          <div style={nameStyle}>{sneaker.name}</div>
          {sizeLabel && <div style={sizeStyle}>{sizeLabel}</div>}
          <div style={rowStyle}>
            <div style={priceStyle}>{formatEur(priceShown)}</div>
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
