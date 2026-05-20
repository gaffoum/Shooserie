import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useSneakers } from '@/lib/queries'
import { deltaColor, effectiveCost, formatEur } from '@/lib/format'
import { useT } from '@/i18n/I18nContext'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
import { KpiCard } from '@/components/KpiCard'
import { ViewToggle, type ViewMode } from '@/components/ViewToggle'
import { SneakerCard } from '@/components/SneakerCard'
import { SneakerTable } from '@/components/SneakerTable'

/**
 * "Mes ventes" — dedicated page listing every paire the user has marked
 * `is_for_sale = true`. Acts as a focused "vendor mode" view, separate from
 * the main collection dashboard.
 *
 * No new data model needed: the flag and target_sale_price already exist on
 * sneakers. This page is purely a filtered view + sale-specific KPIs
 * (target value, potential profit) that aren't shown elsewhere.
 *
 * The trigger to put a paire here = the "À vendre" checkbox in the sneaker
 * form (already shipped). When ticked, the paire shows up here automatically
 * on the next render.
 */
export function MyListings() {
  const { t } = useT()
  const { data: sneakers, isLoading } = useSneakers()
  const [view, setView] = useState<ViewMode>('grid')

  // Filter once, derive everything from this list.
  const forSale = useMemo(
    () => (sneakers ?? []).filter((s) => s.is_for_sale),
    [sneakers],
  )

  // Sale-specific KPIs:
  //   - count: number of paires currently for sale
  //   - totalTarget: sum of target_sale_price (the price the user is asking)
  //   - totalCost: sum of what the user paid (purchase_price or retail fallback)
  //   - potentialProfit: target - cost — the upside if everything sells at ask
  //
  // Paires without target_sale_price are counted but excluded from totalTarget
  // (and a hint surfaces in the UI to prompt the user to set their asking
  // prices for a clean P&L view).
  const stats = useMemo(() => {
    let totalTarget = 0
    let totalCost = 0
    let missingTarget = 0
    for (const s of forSale) {
      const cost = effectiveCost(s)
      if (cost !== null) totalCost += cost
      if (s.target_sale_price !== null) {
        totalTarget += s.target_sale_price
      } else {
        missingTarget += 1
      }
    }
    return {
      count: forSale.length,
      totalTarget,
      totalCost,
      potentialProfit: totalTarget - totalCost,
      missingTarget,
    }
  }, [forSale])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackLink to="/dashboard" />} />
      <main style={mainStyle}>
        <header style={titleBlockStyle}>
          <div style={breadcrumbStyle}>{t('listings.breadcrumb')}</div>
          <h1 style={titleStyle}>{t('listings.title')}</h1>
          <p style={subtitleStyle}>{t('listings.subtitle')}</p>
        </header>

        {isLoading ? (
          <div style={loadingStyle}>{t('common.loading')}</div>
        ) : forSale.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <section style={kpiGridStyle}>
              <KpiCard
                label={t('listings.kpi.count')}
                value={stats.count}
              />
              <KpiCard
                label={t('listings.kpi.askValue')}
                value={
                  stats.totalTarget > 0 ? formatEur(stats.totalTarget) : '—'
                }
              />
              <KpiCard
                label={t('listings.kpi.cost')}
                value={formatEur(stats.totalCost)}
              />
              <KpiCard
                label={t('listings.kpi.potentialProfit')}
                value={
                  stats.totalTarget > 0
                    ? formatEur(stats.potentialProfit, true)
                    : '—'
                }
                valueColor={
                  stats.totalTarget > 0
                    ? deltaColor(stats.potentialProfit)
                    : undefined
                }
              />
            </section>

            {/* Hint when some paires don't have a target price set — without
                it the totals are incomplete, so we nudge the user to fill them
                in (but without blocking). */}
            {stats.missingTarget > 0 && (
              <div style={hintStyle}>
                {t('listings.hintMissingTarget', {
                  count: String(stats.missingTarget),
                })}
              </div>
            )}

            <div style={toolbarStyle}>
              <div style={countLabelStyle}>
                {t(
                  stats.count > 1
                    ? 'listings.collectionCountPlural'
                    : 'listings.collectionCount',
                  { n: stats.count },
                )}
              </div>
              <ViewToggle value={view} onChange={setView} />
            </div>

            {view === 'grid' ? (
              <div style={gridStyle}>
                {forSale.map((s) => (
                  <SneakerCard key={s.id} sneaker={s} />
                ))}
              </div>
            ) : (
              <SneakerTable sneakers={forSale} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

/* =====================================================
 * Empty state — shown when the user has zero for-sale paires.
 * Explains the "À vendre" mechanism instead of just being a sad empty page.
 * ===================================================== */

function EmptyState() {
  const { t } = useT()
  return (
    <div style={emptyWrapStyle}>
      <div style={emptyIconStyle}>🏷️</div>
      <h2 style={emptyTitleStyle}>{t('listings.empty.title')}</h2>
      <p style={emptyDescStyle}>{t('listings.empty.desc')}</p>
      <Link to="/dashboard" style={emptyCtaStyle}>
        {t('listings.empty.cta')}
      </Link>
    </div>
  )
}

/* =====================================================
 * Styles
 * ===================================================== */

const mainStyle: CSSProperties = {
  padding: '20px',
  maxWidth: 1200,
  margin: '0 auto',
}
const titleBlockStyle: CSSProperties = {
  marginBottom: 20,
}
const breadcrumbStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  marginBottom: 4,
}
const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--color-text)',
}
const subtitleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontSize: 13,
  color: 'var(--color-text-muted)',
}
const kpiGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
  marginBottom: 14,
}
const hintStyle: CSSProperties = {
  padding: '10px 14px',
  marginBottom: 14,
  fontSize: 12,
  color: 'var(--color-text-muted)',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  lineHeight: 1.5,
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
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 14,
}
const loadingStyle: CSSProperties = {
  textAlign: 'center',
  padding: 60,
  color: 'var(--color-text-muted)',
}
const emptyWrapStyle: CSSProperties = {
  textAlign: 'center',
  padding: '60px 24px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
}
const emptyIconStyle: CSSProperties = {
  fontSize: 48,
  marginBottom: 14,
}
const emptyTitleStyle: CSSProperties = {
  margin: '0 0 8px',
  fontFamily: 'var(--font-display)',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--color-text)',
}
const emptyDescStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  margin: '0 auto 22px',
  maxWidth: 380,
}
const emptyCtaStyle: CSSProperties = {
  display: 'inline-block',
  padding: '12px 22px',
  background: 'var(--color-text)',
  color: '#FFFFFF',
  textDecoration: 'none',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
}
