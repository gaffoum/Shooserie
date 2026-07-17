import { type CSSProperties } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useT } from '@/i18n/I18nContext'
import { useAuth } from '@/contexts/AuthContext'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
import { useMarketplaceSneaker, useCreateOrGetConversation } from '@/lib/queries'
import { formatEur } from '@/lib/format'
import { SneakerPhoto } from '@/components/SneakerPhoto'
import { wearStatus } from '@/lib/wears'

/**
 * Marketplace detail page — single sneaker for sale.
 * Includes a "Contact seller" button that creates or finds an existing
 * conversation, then redirects to /messages?c=<conversationId>.
 */
export function MarketplaceDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useT()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: sneaker, isLoading } = useMarketplaceSneaker(id)
  const createConvo = useCreateOrGetConversation()

  const isOwnSneaker = sneaker && user && (sneaker as any).user_id === user.id

  const handleContact = async () => {
    if (!sneaker || !user) return
    try {
      const convo = await createConvo.mutateAsync({
        otherUserId: (sneaker as any).user_id,
        sneakerId: sneaker.id,
      })
      navigate(`/messages?c=${convo.id}`)
    } catch (err) {
      console.error('Failed to create conversation', err)
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <AppHeader leftActions={<BackLink to="/marketplace" />} />
        <main style={mainStyle}>
          <p style={mutedStyle}>{t('common.loading')}</p>
        </main>
      </div>
    )
  }

  if (!sneaker) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <AppHeader leftActions={<BackLink to="/marketplace" />} />
        <main style={mainStyle}>
          <p style={mutedStyle}>{t('marketplace.notFound')}</p>
          <Link to="/marketplace" style={backLinkStyle}>
            {t('common.back')}
          </Link>
        </main>
      </div>
    )
  }

  const price = (sneaker as any).target_sale_price ?? (sneaker as any).market_price

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackLink to="/marketplace" />} />
      <main style={mainStyle}>
        <div style={layoutStyle}>
          {/* Photo */}
          <div style={photoWrapStyle}>
            <SneakerPhoto
              stockxUrl={(sneaker as any).stockx_image_url}
              storagePath={(sneaker as any).photo_url}
              alt={sneaker.name}
            />
          </div>

          {/* Details */}
          <div style={detailsStyle}>
            <div style={brandStyle}>{(sneaker as any).brand ?? '—'}</div>
            <h1 style={titleStyle}>{sneaker.name}</h1>

            {(sneaker as any).colorway && (
              <div style={metaStyle}>{(sneaker as any).colorway}</div>
            )}

            <div style={priceBlockStyle}>
              <div style={priceLabelStyle}>{t('marketplace.askingPrice')}</div>
              <div style={priceValueStyle}>
                {price ? formatEur(price) : '—'}
              </div>
            </div>

            {/* Meta grid */}
            <div style={metaGridStyle}>
              {(sneaker as any).size_eu && (
                <MetaRow label={t('marketplace.meta.size')}>
                  EU {(sneaker as any).size_eu}
                  {(sneaker as any).size_us ? ` / US ${(sneaker as any).size_us}` : ''}
                </MetaRow>
              )}
              {(sneaker as any).sku && (
                <MetaRow label={t('marketplace.meta.sku')}>
                  {(sneaker as any).sku}
                </MetaRow>
              )}
              {(sneaker as any).wear_count !== undefined && (
                <MetaRow label={t('marketplace.meta.condition')}>
                  {wearStatus((sneaker as any).wear_count ?? 0)}
                </MetaRow>
              )}
              {(sneaker as any).market_price && (
                <MetaRow label={t('marketplace.meta.marketValue')}>
                  {formatEur((sneaker as any).market_price)}
                </MetaRow>
              )}
            </div>

            {(sneaker as any).notes && (
              <div style={notesBlockStyle}>
                <div style={notesLabelStyle}>{t('marketplace.notes')}</div>
                <div style={notesContentStyle}>{(sneaker as any).notes}</div>
              </div>
            )}

            {/* Seller */}
            <div style={sellerBlockStyle}>
              <div style={notesLabelStyle}>{t('marketplace.seller')}</div>
              <div style={sellerNameStyle}>
                {(sneaker as any).seller_name ?? '—'}
              </div>
            </div>

            {/* CTA */}
            {isOwnSneaker ? (
              <div style={ownPairStyle}>{t('marketplace.ownPair')}</div>
            ) : (
              <button
                type="button"
                onClick={handleContact}
                disabled={createConvo.isPending}
                style={ctaBtnStyle(createConvo.isPending)}
              >
                {createConvo.isPending
                  ? t('marketplace.contactingSeller')
                  : t('marketplace.contactSeller')}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={metaRowStyle}>
      <span style={metaRowLabelStyle}>{label}</span>
      <span style={metaRowValueStyle}>{children}</span>
    </div>
  )
}

/* ===== Styles ===== */

const mainStyle: CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '24px 20px 80px',
}

const layoutStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: 32,
}

const photoWrapStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '1 / 1',
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
}

const detailsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const brandStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 600,
}

const titleStyle: CSSProperties = {
  fontSize: 26,
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  margin: 0,
  color: 'var(--color-text)',
}

const metaStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--color-text-muted)',
}

const priceBlockStyle: CSSProperties = {
  marginTop: 12,
  padding: '14px 16px',
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
}

const priceLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 600,
}

const priceValueStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: 'var(--color-bred)',
  marginTop: 4,
}

const metaGridStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 8,
}

const metaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid var(--color-border)',
}

const metaRowLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 600,
}

const metaRowValueStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text)',
}

const notesBlockStyle: CSSProperties = {
  marginTop: 12,
}

const notesLabelStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 600,
  marginBottom: 6,
}

const notesContentStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text)',
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: 12,
  whiteSpace: 'pre-wrap',
}

const sellerBlockStyle: CSSProperties = {
  marginTop: 12,
}

const sellerNameStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--color-text)',
}

const ctaBtnStyle = (disabled: boolean): CSSProperties => ({
  marginTop: 16,
  padding: '14px 20px',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: disabled ? 'var(--color-text-muted)' : 'var(--color-bred)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.65 : 1,
  width: '100%',
})

const ownPairStyle: CSSProperties = {
  marginTop: 16,
  padding: 12,
  background: 'var(--color-card)',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-muted)',
  fontSize: 13,
  textAlign: 'center',
}

const mutedStyle: CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 14,
}

const backLinkStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 12,
  color: 'var(--color-bred)',
  textDecoration: 'none',
  fontSize: 14,
}
