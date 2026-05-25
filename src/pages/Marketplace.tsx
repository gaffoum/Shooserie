import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplaceSneakers } from '../lib/queries'
import { useT } from '@/i18n/I18nContext'

type ViewMode = 'grid' | 'list'

export function Marketplace() {
  const { t } = useT()
  const { data: sneakers, isLoading } = useMarketplaceSneakers()
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState<string>('')
  const [view, setView] = useState<ViewMode>('grid')

  const brands = useMemo(() => {
    if (!sneakers) return []
    const set = new Set<string>()
    sneakers.forEach((s) => s.brand && set.add(s.brand))
    return Array.from(set).sort()
  }, [sneakers])

  const filtered = useMemo(() => {
    if (!sneakers) return []
    return sneakers.filter((s) => {
      if (brand && s.brand !== brand) return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [s.name, s.brand, s.colorway, s.sku]
          .filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [sneakers, brand, search])

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>{t('marketplace.title')}</h1>
          <p style={subtitleStyle}>{t('marketplace.subtitle')}</p>
        </div>
      </div>

      <div style={toolbarStyle}>
        <input
          type="text"
          placeholder={t('marketplace.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchStyle}
        />

        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          style={selectStyle}
        >
          <option value="">{t('marketplace.allBrands')}</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Toggle grille / liste */}
        <div style={viewToggleStyle}>
          <button
            onClick={() => setView('grid')}
            style={view === 'grid' ? viewBtnActiveStyle : viewBtnStyle}
            title={t('marketplace.viewGrid')}
            aria-label={t('marketplace.viewGrid')}
          >
            {/* icône grille */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                 strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setView('list')}
            style={view === 'list' ? viewBtnActiveStyle : viewBtnStyle}
            title={t('marketplace.viewList')}
            aria-label={t('marketplace.viewList')}
          >
            {/* icône liste */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                 strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {isLoading && <p style={emptyStyle}>{t('common.loading')}</p>}

      {!isLoading && filtered.length === 0 && (
        <p style={emptyStyle}>{t('marketplace.empty')}</p>
      )}

      {filtered.length > 0 && view === 'grid' && (
        <div style={gridStyle}>
          {filtered.map((s) => (
            <Link key={s.id} to={`/marketplace/${s.id}`} style={cardLinkStyle}>
              <div style={cardStyle}>
                <div style={cardImageWrapStyle}>
                  {s.photo_url ? (
                    <img src={s.photo_url} alt={s.name}
                         style={cardImageStyle} />
                  ) : s.stockx_image_url ? (
                    <img src={s.stockx_image_url} alt={s.name}
                         style={cardImageStyle} />
                  ) : (
                    <div style={cardImagePlaceholderStyle}>👟</div>
                  )}
                </div>
                <div style={cardBodyStyle}>
                  <div style={cardBrandStyle}>{s.brand}</div>
                  <div style={cardNameStyle}>{s.name}</div>
                  {s.size_eu && (
                    <div style={cardSizeStyle}>
                      EU {s.size_eu}
                      {s.size_us && ` · US ${s.size_us}`}
                    </div>
                  )}
                  {s.target_sale_price && (
                    <div style={cardPriceStyle}>{s.target_sale_price} €</div>
                  )}
                  <div style={cardSellerStyle}>
                    {t('marketplace.seller')}: {s.seller_name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length > 0 && view === 'list' && (
        <div style={listStyle}>
          {filtered.map((s) => (
            <Link key={s.id} to={`/marketplace/${s.id}`} style={listRowLinkStyle}>
              <div style={listRowStyle}>
                <div style={listImageWrapStyle}>
                  {s.photo_url ? (
                    <img src={s.photo_url} alt={s.name}
                         style={listImageStyle} />
                  ) : s.stockx_image_url ? (
                    <img src={s.stockx_image_url} alt={s.name}
                         style={listImageStyle} />
                  ) : (
                    <div style={listImagePlaceholderStyle}>👟</div>
                  )}
                </div>
                <div style={listInfoStyle}>
                  <div style={listBrandStyle}>{s.brand}</div>
                  <div style={listNameStyle}>{s.name}</div>
                  <div style={listMetaStyle}>
                    {s.size_eu && <span>EU {s.size_eu}</span>}
                    {s.size_us && <span> · US {s.size_us}</span>}
                    {s.colorway && <span> · {s.colorway}</span>}
                  </div>
                  <div style={listSellerStyle}>
                    {t('marketplace.seller')}: {s.seller_name}
                  </div>
                </div>
                {s.target_sale_price && (
                  <div style={listPriceStyle}>{s.target_sale_price} €</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Styles =====
const pageStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px 16px 80px',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 24,
}

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  margin: 0,
  fontFamily: "'Outfit', sans-serif",
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#6B7280',
  margin: '4px 0 0',
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 24,
  flexWrap: 'wrap',
  alignItems: 'center',
}

const searchStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 220,
  padding: '12px 16px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
}

const selectStyle: React.CSSProperties = {
  padding: '12px 16px',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  fontSize: 14,
  background: 'white',
  fontFamily: 'inherit',
}

const viewToggleStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: 4,
  background: 'white',
}

const viewBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  borderRadius: 6,
  padding: '8px 12px',
  cursor: 'pointer',
  color: '#6B7280',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const viewBtnActiveStyle: React.CSSProperties = {
  ...viewBtnStyle,
  background: '#0A0A0A',
  color: 'white',
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 0',
  color: '#6B7280',
}

// === Grille ===
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 16,
}

const cardLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  overflow: 'hidden',
  transition: 'transform 0.15s, box-shadow 0.15s',
}

const cardImageWrapStyle: React.CSSProperties = {
  aspectRatio: '1 / 1',
  background: '#F5F5F5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const cardImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
}

const cardImagePlaceholderStyle: React.CSSProperties = {
  fontSize: 48,
  opacity: 0.4,
}

const cardBodyStyle: React.CSSProperties = {
  padding: 12,
}

const cardBrandStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
  marginBottom: 4,
}

const cardNameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#0A0A0A',
  marginBottom: 4,
}

const cardSizeStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#6B7280',
  marginBottom: 8,
}

const cardPriceStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#CE1141',
  marginBottom: 6,
}

const cardSellerStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#9CA3AF',
}

// === Liste ===
const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const listRowLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
}

const listRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: 12,
  background: 'white',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  transition: 'background 0.15s',
}

const listImageWrapStyle: React.CSSProperties = {
  width: 80,
  height: 80,
  flexShrink: 0,
  background: '#F5F5F5',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}

const listImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
}

const listImagePlaceholderStyle: React.CSSProperties = {
  fontSize: 28,
  opacity: 0.4,
}

const listInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
}

const listBrandStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontWeight: 600,
  marginBottom: 2,
}

const listNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#0A0A0A',
  marginBottom: 4,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const listMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#6B7280',
  marginBottom: 4,
}

const listSellerStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#9CA3AF',
}

const listPriceStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#CE1141',
  whiteSpace: 'nowrap',
  paddingLeft: 12,
}
