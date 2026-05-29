import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSneaker, useDeleteSneaker, useRefreshMarketPrice, useModelOwnerCounts } from '@/lib/queries'
import { calcDelta, deltaColor, effectiveCost, formatDate, formatEur, formatPct, sneakerTimeline } from '@/lib/format'
import { useT, formatDateTime } from '@/i18n/I18nContext'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
import { SneakerPhoto } from '@/components/SneakerPhoto'
import { Sparkline } from '@/components/Sparkline'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { OwnerCountBadge } from '@/components/OwnerCountBadge'
import type { Sneaker } from '@/lib/types'
import type { CSSProperties } from 'react'
import { wearStatus } from '@/lib/wears'
import { WearTracker } from '@/components/WearTracker'
export function SneakerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useT()
  const { data: sneaker, isLoading, error } = useSneaker(id)
  const deleteMutation = useDeleteSneaker()
  const refreshMutation = useRefreshMarketPrice()

  // Single-model lookup via the same batch hook (just with a 1-element array).
  // React Query dedupes across pages so if the user came from the Dashboard,
  // the lookup is a cache hit and renders instantly.
  const { data: ownerCounts } = useModelOwnerCounts(
    sneaker?.stockx_product_id ? [sneaker.stockx_product_id] : [],
  )
  const ownerCount = sneaker?.stockx_product_id
    ? ownerCounts?.[sneaker.stockx_product_id]
    : undefined
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!sneaker) return
    await deleteMutation.mutateAsync({ id: sneaker.id, photoPath: sneaker.photo_url })
    navigate('/dashboard', { replace: true })
  }

  const handleRefresh = async () => {
    if (!sneaker) return
    setRefreshError(null)
    try {
      await refreshMutation.mutateAsync(sneaker)
    } catch (e) {
      setRefreshError((e as Error).message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackLink to="/dashboard" />} />
      <main style={mainStyle}>
        {isLoading && <p style={loadingStyle}>{t('common.loading')}</p>}

        {error && (
          <div style={errorBoxStyle}>
            {t('common.error')} : {(error as Error).message}
          </div>
        )}

        {sneaker && (
          <>
            <div style={topStyle}>
              <div style={imageWrapStyle}>
                <SneakerPhoto
                  stockxUrl={sneaker.stockx_image_url}
                  storagePath={sneaker.photo_url}
                  alt={sneaker.name}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                {sneaker.brand && <div style={brandStyle}>{sneaker.brand}</div>}
                <h1 style={titleStyle}>{sneaker.name}</h1>
                {sneaker.colorway && <div style={colorwayStyle}>{sneaker.colorway}</div>}
                {ownerCount !== undefined && ownerCount > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <OwnerCountBadge count={ownerCount} variant="inline" />
                  </div>
                )}

                <div style={metaGridStyle}>
                  <Meta label={t('detail.meta.sku')} value={sneaker.sku || '—'} mono />
                  <Meta
                    label={t('detail.meta.size')}
                    value={formatSizeLabel(sneaker.size_eu, sneaker.size_us)}
                    mono
                  />
                  <Meta label={t('detail.meta.condition')} value={wearStatus(sneaker.wear_count)} />
                  <Meta
                    label={t('detail.meta.release')}
                    value={
                      [
                        formatDate(sneaker.release_date),
                        sneaker.release_price !== null
                          ? formatEur(sneaker.release_price)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'
                    }
                  />
                </div>
              </div>
            </div>

            {/* Prix grid */}
            <PriceGrid sneaker={sneaker} />

            {/* Historique des cotes — affiché seulement si au moins 2 points */}
            <CoteHistory sneaker={sneaker} />

            {/* Bloc cote du marché */}
            <StockXBlock
              sneaker={sneaker}
              onRefresh={handleRefresh}
              refreshing={refreshMutation.isPending}
              error={refreshError}
            />

            {/* Compteur de wears + statut derive */}
            <WearTracker
              sneakerId={sneaker.id}
              wearCount={sneaker.wear_count}
              lastWornAt={sneaker.last_worn_at}
            />

            {/* Achat info */}
            <div style={purchaseStyle}>
              <Meta
                label={t('detail.purchase.purchasedOn')}
                value={formatDate(sneaker.purchase_date)}
              />
              <Meta
                label={t('detail.purchase.price')}
                value={formatEur(sneaker.purchase_price)}
                mono
              />
            </div>

            {/* Tags + statut "à vendre" */}
            {(sneaker.tags.length > 0 || sneaker.is_for_sale) && (
              <div style={trackingBlockStyle}>
                {sneaker.is_for_sale && (
                  <div style={forSaleRowStyle}>
                    <span style={forSaleBadgeStyle}>{t('card.forSale')}</span>
                    {sneaker.target_sale_price !== null && (
                      <span style={forSalePriceStyle}>
                        {formatEur(sneaker.target_sale_price)}
                      </span>
                    )}
                  </div>
                )}
                {sneaker.tags.length > 0 && (
                  <div style={tagsRowStyle}>
                    {sneaker.tags.map((tag) => (
                      <span key={tag} style={tagPillStyle}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {sneaker.notes && (
              <div style={notesStyle}>
                <div style={notesLabelStyle}>{t('form.section.notes')}</div>
                <p style={notesTextStyle}>{sneaker.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div style={actionsStyle}>
              <Link to={`/sneakers/${sneaker.id}/edit`} style={editBtnStyle}>
                {t('common.edit')}
              </Link>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                style={deleteBtnStyle}
              >
                {t('common.delete')}
              </button>
            </div>

            <ConfirmDialog
              open={confirmOpen}
              title={t('detail.delete.title')}
              description={t('detail.delete.desc')}
              confirmLabel={t('common.delete')}
              destructive
              pending={deleteMutation.isPending}
              onConfirm={handleDelete}
              onCancel={() => setConfirmOpen(false)}
            />
          </>
        )}
      </main>
    </div>
  )
}

function PriceGrid({ sneaker }: { sneaker: Sneaker }) {
  const { t } = useT()
  const cost = effectiveCost(sneaker)
  const market = sneaker.market_price
  const delta = calcDelta(cost, market)

  const costFromRelease =
    (sneaker.purchase_price === null || sneaker.purchase_price === undefined) &&
    sneaker.release_price !== null

  return (
    <div style={priceGridStyle}>
      <Cell
        label={t('detail.price.purchase')}
        value={formatEur(cost)}
        sublabel={costFromRelease ? t('detail.price.fromRelease') : null}
      />
      <Cell label={t('detail.price.cote')} value={formatEur(market)} />
      <Cell
        label={t('detail.price.deltaEur')}
        value={delta.eur !== null ? formatEur(delta.eur, true) : '—'}
        color={delta.eur !== null ? deltaColor(delta.eur) : undefined}
      />
      <Cell
        label={t('detail.price.deltaPct')}
        value={delta.pct !== null ? formatPct(delta.pct, true) : '—'}
        color={delta.pct !== null ? deltaColor(delta.pct) : undefined}
      />
    </div>
  )
}

function CoteHistory({ sneaker }: { sneaker: Sneaker }) {
  const { t } = useT()
  const points = sneakerTimeline(sneaker)
  if (points.length < 2) return null

  const first = points[0].value
  const last = points[points.length - 1].value
  const delta = last - first
  const pct = first > 0 ? (delta / first) * 100 : null

  return (
    <div style={historyBlockStyle}>
      <div style={historyHeaderStyle}>
        <span style={historyLabelStyle}>{t('detail.history.label')}</span>
        <span style={historyDeltaStyle}>
          {formatEur(delta, true)}
          {pct !== null && (
            <span style={{ marginLeft: 6, color: 'var(--color-text-muted)' }}>
              {formatPct(pct, true)}
            </span>
          )}
          <span style={{ marginLeft: 8, color: 'var(--color-text-faint)', fontWeight: 400 }}>
            {' '}{t('detail.history.count', { n: points.length })}
          </span>
        </span>
      </div>
      <div style={historyChartStyle}>
        <Sparkline points={points} height={60} />
      </div>
    </div>
  )
}

function StockXBlock({
  sneaker,
  onRefresh,
  refreshing,
  error,
}: {
  sneaker: Sneaker
  onRefresh: () => void
  refreshing: boolean
  error: string | null
}) {
  const { t, lang } = useT()
  const linked = !!sneaker.stockx_product_id
  const canRefresh = linked && !!sneaker.size_us
  const lastCheck = sneaker.last_price_check

  return (
    <div style={stockxBlockStyle}>
      <div style={stockxHeaderRowStyle}>
        <span style={stockxLabelStyle}>{t('detail.market.label')}</span>
        {linked && lastCheck && (
          <span style={stockxMetaStyle}>
            {t('detail.market.lastUpdate', { date: formatDateTime(lastCheck, lang) })}
          </span>
        )}
      </div>

      {!linked && (
        <div style={stockxHintStyle}>{t('detail.market.notLinked')}</div>
      )}

      {linked && !sneaker.size_us && (
        <div style={stockxHintStyle}>{t('detail.market.noSize')}</div>
      )}

      {linked && lastCheck && sneaker.market_price_usd !== null && (
        <div style={stockxSubMetaStyle}>
          {t('detail.market.source', { value: sneaker.market_price_usd })}
        </div>
      )}

      {error && <div style={stockxErrorStyle}>{error}</div>}

      {(canRefresh || sneaker.stockx_url) && (
        <div style={stockxActionsStyle}>
          {canRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              style={{
                ...refreshBtnStyle,
                opacity: refreshing ? 0.55 : 1,
                cursor: refreshing ? 'wait' : 'pointer',
              }}
            >
              {refreshing ? t('detail.market.refreshing') : t('detail.market.refresh')}
            </button>
          )}
          {sneaker.stockx_url && (
            <a
              href={sneaker.stockx_url}
              target="_blank"
              rel="noopener noreferrer"
              style={stockxLinkStyle}
            >
              {t('detail.market.viewExternal')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function Cell({
  label,
  value,
  color,
  sublabel,
}: {
  label: string
  value: string
  color?: string
  /** Petite annotation sous la valeur, en gris (ex: "= release"). */
  sublabel?: string | null
}) {
  return (
    <div style={cellStyle}>
      <div style={cellLabelStyle}>{label}</div>
      <div style={{ ...cellValueStyle, color: color || 'var(--color-text)' }}>{value}</div>
      {sublabel && <div style={cellSublabelStyle}>{sublabel}</div>}
    </div>
  )
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <div style={metaLabelStyle}>{label}</div>
      <div
        style={{
          ...metaValueStyle,
          fontVariantNumeric: mono ? 'tabular-nums' : 'normal',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function formatSizeLabel(eu: string | null, us: string | null): string {
  const parts: string[] = []
  if (eu) parts.push(`EU ${eu}`)
  if (us) parts.push(`US ${us}`)
  return parts.length ? parts.join(' · ') : '—'
}

/* =====================================================
 * Styles
 * ===================================================== */

const mainStyle: CSSProperties = {
  padding: '20px',
  maxWidth: 640,
  margin: '0 auto',
}
const topStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(120px, 180px) 1fr',
  gap: 18,
  marginBottom: 22,
  alignItems: 'start',
}
const imageWrapStyle: CSSProperties = {
  aspectRatio: '1',
  borderRadius: 'var(--radius-lg)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  position: 'relative',
  overflow: 'hidden',
}
const brandStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
}
const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 1.25,
  color: 'var(--color-text)',
  margin: '4px 0',
  letterSpacing: '-0.01em',
}
const colorwayStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  marginBottom: 14,
  fontStyle: 'italic',
}
const metaGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '10px 14px',
}
const metaLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  marginBottom: 2,
}
const metaValueStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text)',
  fontWeight: 500,
}
const priceGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '14px 4px',
  marginBottom: 18,
}
const cellStyle: CSSProperties = {
  textAlign: 'center',
  padding: '0 8px',
  borderLeft: '1px solid var(--color-border)',
}
const cellLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 6,
  fontWeight: 500,
}
const cellValueStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 15,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
}
const cellSublabelStyle: CSSProperties = {
  fontSize: 9,
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--color-text-faint)',
  marginTop: 2,
  fontFamily: 'var(--font-display)',
  textTransform: 'uppercase',
  fontStyle: 'italic',
}
const purchaseStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 14,
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 14,
  marginBottom: 18,
}
const notesStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 14,
  marginBottom: 18,
}
const notesLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 6,
  fontWeight: 500,
}
const notesTextStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--color-text)',
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
}
const actionsStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
}
const editBtnStyle: CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'var(--color-text)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  textDecoration: 'none',
  textAlign: 'center',
}
const deleteBtnStyle: CSSProperties = {
  padding: '12px 16px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'transparent',
  color: 'var(--color-bred)',
  border: '1px solid var(--color-bred)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  cursor: 'pointer',
}
const loadingStyle: CSSProperties = {
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: 13,
  padding: '40px 20px',
}
const errorBoxStyle: CSSProperties = {
  background: 'var(--color-bred-bg)',
  border: '1px solid var(--color-bred)',
  color: 'var(--color-bred)',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  fontSize: 13,
}
const stockxBlockStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 14,
  marginBottom: 18,
  display: 'grid',
  gap: 8,
}
const stockxHeaderRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
}
const stockxLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 600,
}
const stockxMetaStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  fontVariantNumeric: 'tabular-nums',
}
const stockxSubMetaStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-faint)',
  fontVariantNumeric: 'tabular-nums',
}
const stockxHintStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted)',
  lineHeight: 1.4,
  fontStyle: 'italic',
}
const stockxErrorStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-bred)',
  lineHeight: 1.4,
}
const stockxActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginTop: 4,
}
const refreshBtnStyle: CSSProperties = {
  padding: '10px 16px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'var(--color-royal)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  whiteSpace: 'nowrap',
  flex: '1 1 auto',
  minWidth: 0,
}
const stockxLinkStyle: CSSProperties = {
  padding: '10px 14px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  fontFamily: 'var(--font-display)',
  textTransform: 'uppercase',
  fontWeight: 500,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  whiteSpace: 'nowrap',
}

const trackingBlockStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 14,
  marginBottom: 18,
  display: 'grid',
  gap: 10,
}
const historyBlockStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 14,
  marginBottom: 18,
  display: 'grid',
  gap: 10,
}
const historyHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}
const historyLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 600,
}
const historyDeltaStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 11,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-text)',
}
const historyChartStyle: CSSProperties = {
  height: 60,
  width: '100%',
}
const forSaleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}
const forSaleBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-wider)',
  borderRadius: 'var(--radius-sm)',
}
const forSalePriceStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 14,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-text)',
}
const tagsRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
}
const tagPillStyle: CSSProperties = {
  display: 'inline-flex',
  padding: '4px 10px',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 999,
  fontSize: 11,
  color: 'var(--color-text-muted)',
  fontWeight: 500,
}
