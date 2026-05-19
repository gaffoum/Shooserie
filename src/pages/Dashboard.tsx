import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSneakers, useRefreshAllMarketPrices } from '@/lib/queries'
import { aggregateKpis, deltaColor, formatEur, formatPct, listBrands, listTags, portfolioTimeline } from '@/lib/format'
import { AppHeader } from '@/components/AppHeader'
import { KpiCard } from '@/components/KpiCard'
import { Sparkline } from '@/components/Sparkline'
import { BrandFilter } from '@/components/BrandFilter'
import { TagFilter } from '@/components/TagFilter'
import { ViewToggle, type ViewMode } from '@/components/ViewToggle'
import { SneakerCard } from '@/components/SneakerCard'
import { SneakerTable } from '@/components/SneakerTable'
import { ScanButton } from '@/components/ScanButton'
import type { ScanResult } from '@/components/BarcodeScanner'
import type { Sneaker } from '@/lib/types'
import type { CSSProperties } from 'react'

/* =====================================================
 * Sort keys — labels shown in the dropdown, comparators below.
 * ===================================================== */

type SortKey =
  | 'delta_desc'
  | 'delta_asc'
  | 'cote_desc'
  | 'cote_asc'
  | 'recent'
  | 'oldest'
  | 'name_asc'

const SORT_LABELS: Record<SortKey, string> = {
  delta_desc: '↓ Plus-value',
  delta_asc: '↑ Moins-value',
  cote_desc: '↓ Cote',
  cote_asc: '↑ Cote',
  recent: '↓ Récents',
  oldest: '↑ Anciens',
  name_asc: 'A → Z',
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
  const [view, setView] = useState<ViewMode>('grid')

  // Filters
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [forSaleOnly, setForSaleOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('delta_desc')

  const allSneakers = sneakers ?? []
  const brands = useMemo(() => listBrands(allSneakers), [allSneakers])
  const tags = useMemo(() => listTags(allSneakers), [allSneakers])

  // Bulk refresh of every linked sneaker.
  const bulkRefresh = useRefreshAllMarketPrices()
  const refreshableCount = useMemo(
    () =>
      allSneakers.filter(
        (s) => s.stockx_product_id && (s.stockx_variant_id || s.size_us),
      ).length,
    [allSneakers],
  )

  // Scan depuis le dashboard → vers SneakerNew avec les valeurs pré-remplies
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
  }, [allSneakers, search, brandFilter, tagFilter, forSaleOnly, sortKey])

  const kpis = useMemo(() => aggregateKpis(allSneakers), [allSneakers])
  const timeline = useMemo(() => portfolioTimeline(allSneakers), [allSneakers])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader
        rightActions={
          allSneakers.length > 0 ? (
            <>
              <ScanButton onScan={handleDashboardScan} variant="secondary" />
              <Link to="/sneakers/new" style={addBtnStyle}>
                + Ajouter
              </Link>
            </>
          ) : null
        }
      />

      <main style={mainStyle}>
        {error && (
          <div style={errorBoxStyle}>
            Erreur de chargement : {(error as Error).message}
          </div>
        )}

        {/* KPIs — toujours visibles, même collection vide */}
        <section style={kpiGridStyle}>
          <KpiCard label="Paires" value={kpis.count} />
          <KpiCard label="Investissement" value={formatEur(kpis.totalCost)} />
          <KpiCard label="Cote actuelle" value={formatEur(kpis.totalMarket)} />
          <KpiCard
            label="Plus-value"
            value={kpis.count > 0 ? formatEur(kpis.deltaEur, true) : '—'}
            valueColor={kpis.count > 0 ? deltaColor(kpis.deltaEur) : undefined}
            sub={kpis.count > 0 ? formatPct(kpis.deltaPct, true) : null}
            sparkline={kpis.count > 0 ? <Sparkline points={timeline} /> : null}
          />
        </section>

        {/* Loading */}
        {isLoading && (
          <div style={loadingStyle}>Chargement de la collection…</div>
        )}

        {/* Empty */}
        {!isLoading && allSneakers.length === 0 && (
          <section style={emptyStateStyle}>
            <div style={emptyIconStyle} aria-hidden>👟</div>
            <h2 style={emptyTitleStyle}>Aucune sneaker dans ta collection</h2>
            <p style={emptyDescStyle}>
              Ajoute ta première paire manuellement, ou scanne le code-barre
              d'une boîte pour pré-remplir SKU et code.
            </p>
            <div style={emptyActionsStyle}>
              <Link to="/sneakers/new" style={addBtnLargeStyle}>
                + Ajouter une paire
              </Link>
              <ScanButton onScan={handleDashboardScan} variant="secondary" />
            </div>
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
                placeholder="Chercher dans la collection (nom, marque, SKU, tag…)"
                style={searchInputStyle}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={searchClearStyle}
                  aria-label="Effacer la recherche"
                >
                  ×
                </button>
              )}
            </div>

            {/* Bulk refresh row (only if there's at least one linked sneaker) */}
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
                    ? `↻ Maj… ${bulkRefresh.progress.done}/${bulkRefresh.progress.total}`
                    : `↻ Tout actualiser (${refreshableCount})`}
                </button>
                {!bulkRefresh.running && bulkRefresh.errors.length > 0 && (
                  <span style={bulkErrorStyle}>
                    {bulkRefresh.errors.length} échec{bulkRefresh.errors.length > 1 ? 's' : ''} — vérifie la taille / le lien catalogue
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
                {forSaleOnly ? '✓ ' : ''}À vendre uniquement
              </button>
            </div>

            <div style={toolbarStyle}>
              <div style={countLabelStyle}>
                Collection · {sorted.length} paire{sorted.length > 1 ? 's' : ''}
                {(brandFilter || tagFilter.length > 0 || forSaleOnly || search) && (
                  <span style={{ marginLeft: 8, color: 'var(--color-text-faint)' }}>
                    · filtré
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  style={sortSelectStyle}
                  aria-label="Trier"
                >
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                    <option key={k} value={k}>
                      {SORT_LABELS[k]}
                    </option>
                  ))}
                </select>
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>

            {sorted.length === 0 ? (
              <div style={noMatchStyle}>
                Aucune paire ne correspond à ces filtres.
              </div>
            ) : view === 'grid' ? (
              <div style={gridStyle}>
                {sorted.map((s) => (
                  <SneakerCard key={s.id} sneaker={s} />
                ))}
              </div>
            ) : (
              <SneakerTable sneakers={sorted} />
            )}
          </>
        )}
      </main>
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

const mainStyle: CSSProperties = {
  padding: '20px',
  maxWidth: 1200,
  margin: '0 auto',
}
const kpiGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 24,
}
const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 14,
  flexWrap: 'wrap',
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
  padding: '8px 14px',
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
