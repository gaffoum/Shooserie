import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSneakers } from '@/lib/queries'
import { aggregateKpis, formatEur, formatPct, listBrands } from '@/lib/format'
import { AppHeader } from '@/components/AppHeader'
import { KpiCard } from '@/components/KpiCard'
import { Sparkline } from '@/components/Sparkline'
import { BrandFilter } from '@/components/BrandFilter'
import { ViewToggle, type ViewMode } from '@/components/ViewToggle'
import { SneakerCard } from '@/components/SneakerCard'
import { SneakerTable } from '@/components/SneakerTable'
import { ScanButton } from '@/components/ScanButton'
import type { ScanResult } from '@/components/BarcodeScanner'
import type { CSSProperties } from 'react'

export function Dashboard() {
  const { data: sneakers, isLoading, error } = useSneakers()
  const navigate = useNavigate()
  const [view, setView] = useState<ViewMode>('grid')
  const [brandFilter, setBrandFilter] = useState<string | null>(null)

  const allSneakers = sneakers ?? []
  const brands = useMemo(() => listBrands(allSneakers), [allSneakers])

  // Scan depuis le dashboard → vers SneakerNew avec les valeurs pré-remplies
  const handleDashboardScan = (result: ScanResult) => {
    const looksLikeSku = /[a-zA-Z]/.test(result.code) && result.code.length < 20
    const defaults: Record<string, unknown> = looksLikeSku
      ? { sku: result.code }
      : { sku: result.code, barcode: result.code }

    if (result.suggestion) {
      const sug = result.suggestion
      if (sug.name) defaults.name = sug.name
      if (sug.brand) defaults.brand = sug.brand
      if (sug.colorway) defaults.colorway = sug.colorway
      if (sug.imageUrl) defaults.stockx_image_url = sug.imageUrl
    }

    navigate('/sneakers/new', {
      state: {
        defaults,
        scannedFrom: 'dashboard',
        lookupSource: result.source ?? null,
      },
    })
  }

  // Tri par +/- value décroissant (les pires sans data tombent en fin)
  const sorted = useMemo(() => {
    const filtered = brandFilter
      ? allSneakers.filter((s) => s.brand === brandFilter)
      : allSneakers
    return [...filtered].sort((a, b) => {
      const da =
        a.market_price !== null && a.release_price !== null && a.release_price > 0
          ? (a.market_price - a.release_price) / a.release_price
          : -Infinity
      const db =
        b.market_price !== null && b.release_price !== null && b.release_price > 0
          ? (b.market_price - b.release_price) / b.release_price
          : -Infinity
      return db - da
    })
  }, [allSneakers, brandFilter])

  const kpis = useMemo(() => aggregateKpis(allSneakers), [allSneakers])
  const isPositive = kpis.deltaEur >= 0

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
          <KpiCard label="Valeur release" value={formatEur(kpis.totalRelease)} />
          <KpiCard label="Cote actuelle" value={formatEur(kpis.totalMarket)} />
          <KpiCard
            label="Plus-value"
            value={kpis.count > 0 ? formatEur(kpis.deltaEur, true) : '—'}
            valueColor={
              kpis.count > 0
                ? isPositive
                  ? 'var(--color-bred)'
                  : 'var(--color-text-muted)'
                : undefined
            }
            sub={kpis.count > 0 ? formatPct(kpis.deltaPct, true) : null}
            sparkline={kpis.count > 0 ? <Sparkline /> : null}
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
            {brands.length > 1 && (
              <div style={{ marginBottom: 16 }}>
                <BrandFilter
                  brands={brands}
                  selected={brandFilter}
                  onChange={setBrandFilter}
                />
              </div>
            )}

            <div style={toolbarStyle}>
              <div style={countLabelStyle}>
                Collection · {sorted.length} paire{sorted.length > 1 ? 's' : ''}
                {brandFilter && (
                  <span style={{ marginLeft: 8, color: 'var(--color-text-faint)' }}>
                    · {brandFilter}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={sortPillStyle}>
                  ↓ Trié par plus-value
                </span>
                <ViewToggle value={view} onChange={setView} />
              </div>
            </div>

            {sorted.length === 0 ? (
              <div style={noMatchStyle}>
                Aucune paire ne correspond au filtre.
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
const sortPillStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--color-royal)',
  fontWeight: 500,
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
