import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '@/i18n/I18nContext'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
import { useMarketplaceSneakers } from '@/lib/queries'
import { formatEur } from '@/lib/format'
import { PhotoPlaceholder } from '@/components/PhotoPlaceholder'

/**
 * Marketplace page — lists all sneakers marked `is_for_sale = true`
 * across all users. Each card links to MarketplaceDetail.
 */
export function Marketplace() {
  const { t } = useT()
  const { data: sneakers, isLoading, error } = useMarketplaceSneakers()
  const [brandFilter, setBrandFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const brands = useMemo(() => {
    if (!sneakers) return []
    const set = new Set<string>()
    sneakers.forEach((s) => {
      if (s.brand) set.add(s.brand)
    })
    return Array.from(set).sort()
  }, [sneakers])

  const filtered = useMemo(() => {
    if (!sneakers) return []
    return sneakers.filter((s) => {
      if (brandFilter && s.brand !== brandFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [s.name, s.brand, s.colorway, s.sku]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [sneakers, brandFilter, search])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackLink to="/dashboard" />} />
      <main style={mainStyle}>
        <h1 style={titleStyle}>{t('marketplace.title')}</h1>
        <p style={subtitleStyle}>{t('marketplace.subtitle')}</p>

        {/* Filters */}
        <div style={filtersStyle}>
          <input
            type="text"
            placeholder={t('marketplace.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInputStyle}
          />
          {brands.length > 0 && (
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="">{t('marketplace.allBrands')}</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Content */}
        {isLoading && <p style={mutedStyle}>{t('common.loading')}</p>}
        {error && (
          <p style={errorStyle}>
            {t('common.error')}: {(error as Error).message}
          </p>
        )}
        {!isLoading && filtered.length === 0 && (
          <div style={emptyStyle}>
            <p style={mutedStyle}>{t('marketplace.empty')}</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={gridStyle}>
            {filtered.map((s) => (
              <MarketplaceCard key={s.id} sneaker={s} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function MarketplaceCard({ sneaker }: { sneaker: any }) {
  const { t } = useT()
  const photo = sneaker.photo_url ?? sneaker.stockx_image_url
  const price = sneaker.target_sale_price ?? sneaker.market_price

  return (
    <Link to={`/marketplace/${sneaker.id}`} style={cardStyle}>
      <div style={photoWrapStyle}>
        {photo ? (
          <img src={photo} alt={sneaker.name} style={photoStyle} />
        ) : (
          <PhotoPlaceholder />
        )}
      </div>
      <div style={cardBodyStyle}>
        <div style={cardBrandStyle}>{sneaker.brand ?? '—'}</div>
        <div style={cardNameStyle}>{sneaker.name}</div>
        {sneaker.size_eu && (
          <div style={cardMetaStyle}>EU {sneaker.size_eu}</div>
        )}
        <div style={priceRowStyle}>
          <span style={priceStyle}>{price ? formatEur(price) : '—'}</span>
        </div>
        {sneaker.seller_name && (
          <div style={sellerStyle}>
            {t('marketplace.seller')}: {sneaker.seller_name}
          </div>
        )}
      </div>
    </Link>
  )
}

/* ===== Styles ===== */

const mainStyle: CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '24px 20px 80px',
}

const titleStyle: CSSProperties = {
  fontSize: 28,
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  letterSpacing: 'var(--tracking-tight)',
  color: 'var(--color-text)',
  margin: 0,
}

const subtitleStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--color-text-muted)',
  marginTop: 6,
  marginBottom: 24,
}

const filtersStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 24,
}

const searchInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 200,
  padding: '10px 13px',
  fontSize: 14,
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  outline: 'none',
}

const selectStyle: CSSProperties = {
  padding: '10px 13px',
  fontSize: 14,
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  outline: 'none',
  cursor: 'pointer',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 16,
}

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
}

const photoWrapStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '1 / 1',
  background: 'var(--color-bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}

const photoStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const cardBodyStyle: CSSProperties = {
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const cardBrandStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 600,
}

const cardNameStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text)',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const cardMetaStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted)',
}

const priceRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 6,
}

const priceStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--color-bred)',
}

const sellerStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-faint)',
  marginTop: 4,
}

const mutedStyle: CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 14,
}

const errorStyle: CSSProperties = {
  color: '#b00020',
  fontSize: 14,
}

const emptyStyle: CSSProperties = {
  padding: '48px 20px',
  textAlign: 'center',
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
}
