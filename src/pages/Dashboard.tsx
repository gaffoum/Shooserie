import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSneakers, useRefreshAllMarketPrices, useModelOwnerCounts, useMyConversations, useHasUnreadAnnouncements } from '@/lib/queries'
import { aggregateKpis, deltaColor, formatEur, formatPct, listBrands, listTags, portfolioTimeline } from '@/lib/format'
import { useT } from '@/i18n/I18nContext'
import { AppHeader } from '@/components/AppHeader'
import { KpiCard } from '@/components/KpiCard'
import { Sparkline } from '@/components/Sparkline'
import { BrandFilter } from '@/components/BrandFilter'
import { WearStatusFilter } from '@/components/WearStatusFilter'
import { wearStatus, type WearStatus } from '@/lib/wears'
import { TagFilter } from '@/components/TagFilter'
import { ViewToggle, type ViewMode } from '@/components/ViewToggle'
import { SneakerCard } from '@/components/SneakerCard'
import { SneakerTable } from '@/components/SneakerTable'
import { ScanButton } from '@/components/ScanButton'
import { TopOwnedModels } from '@/components/TopOwnedModels'
import { TopWornSneakers } from '@/components/TopWornSneakers'
import { ShareDialog } from '@/components/ShareDialog'
import type { ScanResult } from '@/components/BarcodeScanner'
import type { Sneaker } from '@/lib/types'
import type { CSSProperties } from 'react'
import type { DictKey } from '@/i18n/dictionaries'
import { WelcomeHeader } from '../components/WelcomeHeader'
import { LabelsButton } from '@/components/LabelsButton'
import { BinderView } from '@/components/collection/BinderView'
import { PortfolioHeader } from '@/components/PortfolioHeader'

/* =====================================================
 * Sort keys — labels are dictionary keys, comparators below.
 * ===================================================== */

type SortKey =
  | 'delta_desc'
  | 'delta_asc'
  | 'cote_desc'
  | 'cote_asc'
  | 'recent'
  | 'oldest'
  | 'name_asc'

const SORT_LABEL_KEYS: Record<SortKey, DictKey> = {
  delta_desc: 'dashboard.sort.deltaDesc',
  delta_asc: 'dashboard.sort.deltaAsc',
  cote_desc: 'dashboard.sort.coteDesc',
  cote_asc: 'dashboard.sort.coteAsc',
  recent: 'dashboard.sort.recent',
  oldest: 'dashboard.sort.oldest',
  name_asc: 'dashboard.sort.nameAsc',
}

function deltaPct(s: Sneaker): number {
  const cost =
    s.purchase_price !== null && s.purchase_price !== undefined
      ? s.purchase_price
      : s.release_price
  if (s.market_price === null || cost === null || cost === 0) {
    return -Infinity
  }
  return (s.market_price - cost) / cost
}

function comparator(key: SortKey): (a: Sneaker, b: Sneaker) => number {
  switch (key) {
    case 'delta_desc':
      return (a, b) => deltaPct(b) - deltaPct(a)
    case 'delta_asc':
      return (a, b) => deltaPct(a) - deltaPct(b)
    case 'cote_desc':
      return (a, b) => (b.market_price ?? -Infinity) - (a.market_price ?? -Infinity)
    case 'cote_asc':
      return (a, b) => (a.market_price ?? Infinity) - (b.market_price ?? Infinity)
    case 'recent':
      return (a, b) => b.created_at.localeCompare(a.created_at)
    case 'oldest':
      return (a, b) => a.created_at.localeCompare(b.created_at)
    case 'name_asc':
      return (a, b) => a.name.localeCompare(b.name, 'fr')
  }
}

export function Dashboard() {
  const { data: sneakers, isLoading, error } = useSneakers()
  const navigate = useNavigate()
  const { data: conversations } = useMyConversations()
  const unreadTotal = (conversations ?? []).reduce(
  (sum, c) => sum + (c.unread_count ?? 0),
  0,
)

  const { t } = useT()
  // Bannière « nouveautés » — réutilise le hook (aucune requête en plus).
  const hasUnreadNews = useHasUnreadAnnouncements()
  const [view, setView] = useState<ViewMode>('grid')
  // Mode de page niveau 1 : Portfolio (financier) vs Collection (classeur TCG),
  // persisté en localStorage et relu à l'init.
  const [pageMode, setPageMode] = useState<'portfolio' | 'collection'>(() => {
    try {
      return localStorage.getItem('shooserie:collectionMode') === 'collection'
        ? 'collection'
        : 'portfolio'
    } catch {
      return 'portfolio'
    }
  })
  const selectPageMode = (m: 'portfolio' | 'collection') => {
    setPageMode(m)
    try {
      localStorage.setItem('shooserie:collectionMode', m)
    } catch {
      // localStorage indisponible (mode privé) : on ignore.
    }
  }

  // Filters
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<string | null>(null)
  const [wearStatusFilter, setWearStatusFilter] = useState<WearStatus | null>(null)
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [forSaleOnly, setForSaleOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('delta_desc')

  const allSneakers = sneakers ?? []
  const brands = useMemo(() => listBrands(allSneakers), [allSneakers])
  const tags = useMemo(() => listTags(allSneakers), [allSneakers])

  // Community: batch-fetch how many distinct users across the whole app own
  // each model the current user has. One round-trip for the whole grid.
  // Cards without a stockx_product_id (manually-added pairs) silently get
  // no badge — the hook ignores them.
  const productIds = useMemo(
    () => allSneakers.map((s) => s.stockx_product_id),
    [allSneakers],
  )
  const { data: ownerCounts } = useModelOwnerCounts(productIds)

  // Share-link management dialog (public URL sharing).
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  // Bulk refresh of every linked sneaker.
  const bulkRefresh = useRefreshAllMarketPrices()
  const refreshableCount = useMemo(
    () =>
      allSneakers.filter(
        (s) => s.stockx_product_id && (s.stockx_variant_id || s.size_us),
      ).length,
    [allSneakers],
  )

  // Count of paires currently flagged as for-sale — displayed as a small
  // badge next to the "Mes ventes" toolbar button so the user knows at a
  // glance how many listings they have without leaving the dashboard.
  const forSaleCount = useMemo(
    () => allSneakers.filter((s) => s.is_for_sale).length,
    [allSneakers],
  )

  // Scan depuis le dashboard → vers SneakerNew avec les valeurs pré-remplies.
  // Si la paire existe déjà dans la collec (via stockx_product_id, sku ou
  // barcode), on demande confirmation au user avec un window.confirm() natif.
  // Pourquoi confirm() plutôt qu'un dialog custom : sur mobile c'est la
  // popup système OS (iOS/Android), zéro photo, zéro friction, zéro chance
  // que l'user reste bloqué sur une image.
  const handleDashboardScan = (result: ScanResult) => {
    const looksLikeSku = /[a-zA-Z]/.test(result.code) && result.code.length < 20
    const defaults: Record<string, unknown> = looksLikeSku
      ? { sku: result.code }
      : { sku: result.code, barcode: result.code }

    if (result.suggestion) {
      const sug = result.suggestion
      if (sug.name) defaults.name = sug.name
      if (sug.brand) defaults.brand = normalizeBrandFromScan(sug.brand)
      if (sug.colorway) defaults.colorway = sug.colorway
      if (sug.imageUrl) defaults.stockx_image_url = sug.imageUrl
    }

    // Si le scan a matché un produit dans le catalogue StockX, on lie directement
    // la paire au catalogue + on pré-remplit la taille (un code-barre = une taille).
    if (result.stockxLink) {
      const link = result.stockxLink
      defaults.stockx_product_id = link.productId
      defaults.stockx_variant_id = link.variantId
      defaults.stockx_url = link.stockxUrl
      if (link.styleId) defaults.sku = link.styleId
      if (link.sizeUS) defaults.size_us = link.sizeUS
      if (link.sizeEU) defaults.size_eu = link.sizeEU
      if (link.releaseDate) defaults.release_date = link.releaseDate
      if (link.retailPrice !== null) defaults.release_price = link.retailPrice
    }

    // Détection de doublons — match par stockx_product_id, sku ou barcode.
    // Si au moins 1 match, on demande au user de confirmer avant de naviguer.
    const matches = findDuplicates(allSneakers, result, defaults)
    if (matches.length > 0) {
      const message =
        matches.length === 1
          ? t('dashboard.scan.duplicate.confirmOne')
          : t('dashboard.scan.duplicate.confirmMany', {
              count: String(matches.length),
            })
      if (!window.confirm(message)) {
        // User cancelled → reste sur le dashboard, scan est ignoré.
        return
      }
    }

    navigate('/sneakers/new', {
      state: {
        defaults,
        scannedFrom: 'dashboard',
        lookupSource: result.source ?? null,
      },
    })
  }

  // Full filtering + sort pipeline.
  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = allSneakers.filter((s) => {
      if (brandFilter && s.brand !== brandFilter) return false
      if (wearStatusFilter && wearStatus(s.wear_count) !== wearStatusFilter) return false
      if (forSaleOnly && !s.is_for_sale) return false
      if (tagFilter.length > 0 && !tagFilter.some((t) => s.tags.includes(t))) return false
      if (q) {
        const haystack = [
          s.name,
          s.brand ?? '',
          s.colorway ?? '',
          s.sku ?? '',
          ...s.tags,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
    return [...filtered].sort(comparator(sortKey))
  }, [allSneakers, search, brandFilter, wearStatusFilter, tagFilter, forSaleOnly, sortKey])

  const kpis = useMemo(() => aggregateKpis(allSneakers), [allSneakers])
  const timeline = useMemo(() => portfolioTimeline(allSneakers), [allSneakers])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <WelcomeHeader />
      <AppHeader
        rightActions={
          allSneakers.length > 0 ? (
            <>
              <ScanButton onScan={handleDashboardScan} variant="compact" />
              <Link to="/sneakers/new" style={addBtnStyle} aria-label={t('common.add')}>
                <span>+</span>
                <span className="app-header-add-text">{t('common.add')}</span>
              </Link>
            </>
          ) : null
        }
      />

      <main style={mainStyle}>
        {error && (
          <div style={errorBoxStyle}>
            {t('dashboard.errorLoad', { msg: (error as Error).message })}
          </div>
        )}

        {/* Bannière compacte « du nouveau » — visible tant qu'il reste des
            annonces non lues, disparaît dès l'ouverture de /nouveautes. */}
        {hasUnreadNews && (
          <Link to="/nouveautes" style={newsBannerStyle}>
            <span style={newsBannerTextStyle}>
              <span aria-hidden>⭐</span>
              {t('dashboard.news.banner')}
            </span>
            <span aria-hidden style={newsBannerChevronStyle}>›</span>
          </Link>
        )}

        {pageMode === 'portfolio' ? (
          <>
            {/* En-tête handoff : Ma collection + bannière valeur estimée. */}
            <PortfolioHeader
              count={kpis.count}
              totalMarket={kpis.totalMarket}
              deltaPct={kpis.count > 0 ? kpis.deltaPct : null}
            />

            {/* Le rang d'étoiles (héros + progression) vit désormais dans
                l'en-tête « Salut… » (WelcomeHeader) — plus de doublon ici. */}

            {/* KPIs secondaires (la valeur estimée est déjà dans la bannière). */}
            <section style={kpiGridStyle}>
              <KpiCard label={t('dashboard.kpi.investment')} value={formatEur(kpis.totalCost)} />
              <KpiCard
                label={t('dashboard.kpi.plusValue')}
                value={kpis.count > 0 ? formatEur(kpis.deltaEur, true) : '—'}
                valueColor={kpis.count > 0 ? deltaColor(kpis.deltaEur) : undefined}
                sub={kpis.count > 0 ? formatPct(kpis.deltaPct, true) : null}
                sparkline={kpis.count > 0 ? <Sparkline points={timeline} /> : null}
              />
            </section>
          </>
        ) : (
          /* Mode Collection (classeur) — KPIs complets inchangés. */
          <section style={kpiGridStyle}>
            <KpiCard label={t('dashboard.kpi.pairs')} value={kpis.count} />
            <KpiCard label={t('dashboard.kpi.investment')} value={formatEur(kpis.totalCost)} />
            <KpiCard label={t('dashboard.kpi.currentValue')} value={formatEur(kpis.totalMarket)} />
            <KpiCard
              label={t('dashboard.kpi.plusValue')}
              value={kpis.count > 0 ? formatEur(kpis.deltaEur, true) : '—'}
              valueColor={kpis.count > 0 ? deltaColor(kpis.deltaEur) : undefined}
              sub={kpis.count > 0 ? formatPct(kpis.deltaPct, true) : null}
              sparkline={kpis.count > 0 ? <Sparkline points={timeline} /> : null}
            />
          </section>
        )}

        {/* Community: top-owned models across all users. The component
            auto-hides if there's nothing in the leaderboard, so this slot
            stays clean on a fresh app. */}
        <TopOwnedModels limit={5} />

        {/* User's most-worn paires — hides if no paires have been worn */}
        <TopWornSneakers limit={10} viewAllUrl="/rankings" />

        {/* Loading */}
        {isLoading && (
          <div style={loadingStyle}>{t('dashboard.loading')}</div>
        )}

        {/* Empty */}
        {!isLoading && allSneakers.length === 0 && (
          <section style={emptyStateStyle}>
            <div style={emptyIconStyle} aria-hidden>👟</div>
            <h2 style={emptyTitleStyle}>{t('dashboard.empty.title')}</h2>
            <p style={emptyDescStyle}>{t('dashboard.empty.desc')}</p>
            <div style={emptyActionsStyle}>
              <Link to="/sneakers/new" style={addBtnLargeStyle}>
                + {t('dashboard.empty.action')}
              </Link>
              <ScanButton onScan={handleDashboardScan} variant="secondary" />
            </div>
            <Link
              to="/guide"
              style={{
                display: 'inline-block',
                marginTop: 16,
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--color-royal)',
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
              }}
            >
              {t('guide.link')} →
            </Link>
          </section>
        )}

        {/* Collection */}
        {!isLoading && allSneakers.length > 0 && (
          <>
            {/* Search bar */}
            <div style={searchWrapStyle}>
              <span style={searchIconStyle} aria-hidden>🔍</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('dashboard.searchPlaceholder')}
                style={searchInputStyle}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={searchClearStyle}
                  aria-label={t('dashboard.clearSearch')}
                >
                  ×
                </button>
              )}
            </div>

            {/* Bulk refresh row */}
            {refreshableCount > 0 && (
              <div style={bulkRowStyle}>
                <button
                  type="button"
                  onClick={() => bulkRefresh.start(allSneakers)}
                  disabled={bulkRefresh.running}
                  style={{
                    ...bulkBtnStyle,
                    opacity: bulkRefresh.running ? 0.7 : 1,
                    cursor: bulkRefresh.running ? 'wait' : 'pointer',
                  }}
                >
                  {bulkRefresh.running
                    ? t('dashboard.refreshing', {
                        done: bulkRefresh.progress.done,
                        total: bulkRefresh.progress.total,
                      })
                    : t('dashboard.refreshAll', { count: refreshableCount })}
                </button>
                {!bulkRefresh.running && bulkRefresh.errors.length > 0 && (
                  <span style={bulkErrorStyle}>
                    {t(
                      bulkRefresh.errors.length > 1
                        ? 'dashboard.refreshFailuresPlural'
                        : 'dashboard.refreshFailures',
                      { n: bulkRefresh.errors.length },
                    )}
                  </span>
                )}
              </div>
            )}

            {/* Filter rows */}
            <div style={filtersWrapStyle}>
              {brands.length > 1 && (
                <BrandFilter
                  brands={brands}
                  selected={brandFilter}
                  onChange={setBrandFilter}
                />
              )}
              <WearStatusFilter selected={wearStatusFilter} onChange={setWearStatusFilter} />
              {tags.length > 0 && (
                <TagFilter
                  tags={tags}
                  selected={tagFilter}
                  onChange={setTagFilter}
                />
              )}
              <button
                type="button"
                onClick={() => setForSaleOnly((v) => !v)}
                aria-pressed={forSaleOnly}
                style={forSaleTogglePillStyle(forSaleOnly)}
              >
                {forSaleOnly ? t('dashboard.forSaleActive') : t('dashboard.forSaleOnly')}
              </button>
            </div>

            <div className="dash-toolbar">
              {pageMode === 'portfolio' && (
                <div style={countLabelStyle}>
                  {t(
                    sorted.length > 1
                      ? 'dashboard.collectionCountPlural'
                      : 'dashboard.collectionCount',
                    { n: sorted.length },
                  )}
                  {(brandFilter || tagFilter.length > 0 || forSaleOnly || search) && (
                    <span style={{ marginLeft: 8, color: 'var(--color-text-faint)' }}>
                      {' '}{t('dashboard.filtered')}
                    </span>
                  )}
                </div>
              )}
              <div className="dash-controls">
                <div className="dash-actions">
                <Link
                  to="/ventes"
                  style={listingsBtnStyle}
                  title={t('dashboard.listings.tooltip')}
                  aria-label={t('dashboard.listings.tooltip')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span className="app-header-action-text">
                    {t('dashboard.listings.button')}
                  </span>
                  {forSaleCount > 0 && (
                    <span style={listingsCountBadgeStyle}>{forSaleCount}</span>
                  )}
                </Link>
				<Link
				  to="/marketplace"
				  style={listingsBtnStyle}
				  aria-label={t('dashboard.marketplace.tooltip')}
				  title={t('dashboard.marketplace.tooltip')}
				>
				  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<circle cx="9" cy="21" r="1" />
					<circle cx="20" cy="21" r="1" />
					<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
				  </svg>
				  <span className="app-header-action-text">
					{t('dashboard.marketplace.button')}
				  </span>
				</Link>

				<Link
				  to="/messages"
				  style={listingsBtnStyle}
				  aria-label={t('dashboard.messages.tooltip')}
				  title={t('dashboard.messages.tooltip')}
				>
				  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
				  </svg>
				  <span className="app-header-action-text">
					{t('dashboard.messages.button')}
				  </span>
				  {unreadTotal > 0 && (
					<span style={listingsCountBadgeStyle}>{unreadTotal}</span>
				  )}
				</Link>
				  <LabelsButton variant="chip" showLabel />
                <button
                  type="button"
                  onClick={() => setShareDialogOpen(true)}
                  style={shareBtnStyle}
                  title={t('dashboard.share.tooltip')}
                  aria-label={t('dashboard.share.tooltip')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span className="app-header-action-text">
                    {t('dashboard.share.button')}
                  </span>
                </button>
                </div>
                <div className="dash-views">
                {/* Toggle niveau 1 : Portfolio / Collection (persisté) */}
                <div
                  style={{
                    display: 'inline-flex',
                    gap: 2,
                    background: 'var(--color-surface-alt)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 2,
                  }}
                  role="group"
                  aria-label={t('dashboard.mode.aria')}
                >
                  {(['portfolio', 'collection'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectPageMode(m)}
                      aria-pressed={pageMode === m}
                      style={{
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-display)',
                        whiteSpace: 'nowrap',
                        background: pageMode === m ? 'var(--color-bred)' : 'transparent',
                        color: pageMode === m ? '#FFFFFF' : 'var(--color-text-muted)',
                      }}
                    >
                      {t(m === 'portfolio' ? 'dashboard.mode.portfolio' : 'dashboard.mode.collection')}
                    </button>
                  ))}
                </div>
                {pageMode === 'portfolio' && (
                  <>
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      style={sortSelectStyle}
                      aria-label={t('dashboard.sort.aria')}
                    >
                      {(Object.keys(SORT_LABEL_KEYS) as SortKey[]).map((k) => (
                        <option key={k} value={k}>
                          {t(SORT_LABEL_KEYS[k])}
                        </option>
                      ))}
                    </select>
                    <ViewToggle value={view} onChange={setView} />
                  </>
                )}
                </div>
              </div>
            </div>

            {pageMode === 'collection' ? (
              <BinderView sneakers={sorted} />
            ) : sorted.length === 0 ? (
              <div style={noMatchStyle}>
                {t('dashboard.noMatch')}
              </div>
            ) : view === 'grid' ? (
              <div style={gridStyle}>
                {sorted.map((s) => (
                  <SneakerCard
                    key={s.id}
                    sneaker={s}
                    ownerCount={
                      s.stockx_product_id
                        ? ownerCounts?.[s.stockx_product_id]
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <SneakerTable sneakers={sorted} />
            )}
          </>
        )}
      </main>

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
      />
    </div>
  )
}

/** Maps brand strings from scan sources (StockX / UPCitemdb) to the select options. */
function normalizeBrandFromScan(raw: string): string {
  const b = raw.trim().toLowerCase()
  if (b === 'jordan' || b === 'air jordan') return 'Air Jordan'
  if (b === 'nike') return 'Nike'
  if (b === 'adidas') return 'Adidas'
  if (b === 'new balance') return 'New Balance'
  if (b === 'puma') return 'Puma'
  if (b === 'asics') return 'ASICS'
  if (b === 'yeezy') return 'Yeezy'
  return raw
}

/**
 * Find existing sneakers in the user's collection that match a scan result.
 * Three-tier matching, most reliable first:
 *
 *   1. `stockx_product_id` — same model (catches different sizes too)
 *   2. `sku`              — case-insensitive, trimmed
 *   3. `barcode`          — exact match of the scanned code
 *
 * Returns all matches (deduped by sneaker id). Used to surface a native
 * window.confirm() before adding a paire the user might already own. Kept
 * simple on purpose — no fancy UI dialog because the previous one blocked
 * mobile users on a photo overlay.
 */
function findDuplicates(
  all: Sneaker[],
  scan: ScanResult,
  defaults: Record<string, unknown>,
): Sneaker[] {
  const productId = scan.stockxLink?.productId ?? null
  const code = scan.code?.trim().toUpperCase() ?? null
  // The SKU we deduced into `defaults` is sometimes different from the raw
  // scan code (UPC → SKU lookup adds it as defaults.sku), so we check both.
  const sku =
    typeof defaults.sku === 'string' ? defaults.sku.trim().toUpperCase() : null

  const seen = new Set<string>()
  const out: Sneaker[] = []
  for (const s of all) {
    let matched = false
    if (productId && s.stockx_product_id === productId) matched = true
    if (!matched && code) {
      if (s.sku?.trim().toUpperCase() === code) matched = true
      else if (s.barcode?.trim().toUpperCase() === code) matched = true
    }
    if (!matched && sku && s.sku?.trim().toUpperCase() === sku) matched = true
    if (matched && !seen.has(s.id)) {
      seen.add(s.id)
      out.push(s)
    }
  }
  return out
}

const mainStyle: CSSProperties = {
  padding: 'var(--dashboard-gutter)',
  maxWidth: 'var(--dashboard-max)',
  margin: '0 auto',
}
const newsBannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '10px 14px',
  marginBottom: 16,
  background: 'var(--color-bred-bg)',
  border: '1px solid var(--color-bred)',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  color: 'var(--color-bred)',
}
const newsBannerTextStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-display)',
  fontSize: 13,
  fontWeight: 600,
}
const newsBannerChevronStyle: CSSProperties = {
  fontSize: 20,
  lineHeight: 1,
  flexShrink: 0,
}
const kpiGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 24,
}
const countLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
}
const searchWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  marginBottom: 12,
}
const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: 12,
  fontSize: 14,
  opacity: 0.7,
  pointerEvents: 'none',
}
const searchInputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 36px',
  fontSize: 14,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  outline: 'none',
  fontFamily: 'inherit',
}
const searchClearStyle: CSSProperties = {
  position: 'absolute',
  right: 8,
  width: 26,
  height: 26,
  borderRadius: '50%',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  fontSize: 18,
  lineHeight: 1,
  cursor: 'pointer',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const filtersWrapStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  marginBottom: 14,
}
const bulkRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 14,
  flexWrap: 'wrap',
}
const bulkBtnStyle: CSSProperties = {
  padding: '8px 14px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'var(--color-royal)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
}
const bulkErrorStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-bred)',
}
const forSaleTogglePillStyle = (active: boolean): CSSProperties => ({
  alignSelf: 'flex-start',
  background: active ? 'var(--color-bred)' : 'var(--color-surface)',
  border: `1px solid ${active ? 'var(--color-bred)' : 'var(--color-border)'}`,
  color: active ? '#FFFFFF' : 'var(--color-text-muted)',
  padding: '6px 14px',
  borderRadius: 'var(--radius-pill)',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  whiteSpace: 'nowrap',
})
const sortSelectStyle: CSSProperties = {
  padding: '6px 8px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-display)',
  textTransform: 'uppercase',
  fontWeight: 500,
  cursor: 'pointer',
}
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 12,
}
const noMatchStyle: CSSProperties = {
  padding: '32px 20px',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: 13,
  background: 'var(--color-surface)',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-lg)',
}
const loadingStyle: CSSProperties = {
  padding: '48px 20px',
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: 12,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
}
const errorBoxStyle: CSSProperties = {
  background: 'var(--color-bred-bg)',
  border: '1px solid var(--color-bred)',
  color: 'var(--color-bred)',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  fontSize: 13,
  marginBottom: 16,
}
const addBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '8px 12px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  border: '1px solid var(--color-bred)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}
const emptyStateStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px dashed var(--color-border-strong)',
  borderRadius: 'var(--radius-xl)',
  padding: '48px 20px',
  textAlign: 'center',
}
const emptyIconStyle: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 28,
  margin: '0 auto 18px',
}
const emptyTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 17,
  fontWeight: 600,
  marginBottom: 8,
}
const emptyDescStyle: CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 13,
  maxWidth: 380,
  margin: '0 auto 22px',
  lineHeight: 1.5,
}
const emptyActionsStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  flexWrap: 'wrap',
}
const addBtnLargeStyle: CSSProperties = {
  padding: '10px 18px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  textDecoration: 'none',
  display: 'inline-block',
}

// === Share / HTML export button (toolbar) ===
const shareBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  whiteSpace: 'nowrap',
}

// === Mes ventes (toolbar) ===
const listingsBtnStyle: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}
const listingsCountBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: -6,
  right: -6,
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  fontSize: 10,
  fontWeight: 700,
  borderRadius: 9,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontVariantNumeric: 'tabular-nums',
  border: '2px solid var(--color-surface)',
}
