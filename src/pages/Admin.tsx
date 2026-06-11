import { useMemo, type CSSProperties } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_EMAIL, useAdminDashboardStats } from '@/lib/queries'
import { AppHeader } from '@/components/AppHeader'
import { KpiCard } from '@/components/KpiCard'
import { Sparkline } from '@/components/Sparkline'
import { formatEur } from '@/lib/format'
import { AdminStickerOrders } from '@/components/AdminStickerOrders'

/**
 * Internal monitoring dashboard. Shows app growth (users, sneakers, signups
 * over time) + lists (recent signups, top brands, top collectors).
 *
 * Access: only ADMIN_EMAIL. Anyone else is redirected to /dashboard. The
 * underlying RPC `admin_dashboard_stats()` ALSO checks the caller's email
 * server-side, so the gate is defence-in-depth.
 *
 * Layout is single-column mobile-first — the admin will mostly read this on
 * their phone. KPIs come first (the "scroll-stop" numbers), then time-series
 * sparklines, then lists.
 */
export function Admin() {
  const { session } = useAuth()
  const email = session?.user.email
  const isAdmin = email === ADMIN_EMAIL

  // Hard gate. Non-admins never see the page.
  if (!isAdmin) return <Navigate to="/dashboard" replace />

  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } =
    useAdminDashboardStats(email)

  return (
    <div style={pageStyle}>
      <AppHeader />
      <main style={mainStyle}>
        <AdminStickerOrders />
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Monitoring</h1>
            <p style={subTitleStyle}>
              {dataUpdatedAt
                ? `Mis à jour ${formatTimeAgo(dataUpdatedAt)}`
                : 'Chargement…'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            style={refreshBtnStyle(isFetching)}
            aria-label="Actualiser"
          >
            ↻
          </button>
        </header>

        {error && (
          <div style={errorStyle}>{(error as Error).message}</div>
        )}

        {isLoading && !data ? (
          <div style={loadingStyle}>Chargement des stats…</div>
        ) : data ? (
          <>
            {/* === Primary KPIs === */}
            <section style={kpiGridStyle}>
              <KpiCard
                label="Utilisateurs"
                value={data.totalUsers}
                sub={`+${data.newUsers24h} en 24h · +${data.newUsers7d} en 7j`}
              />
              <KpiCard
                label="Actifs 7j"
                value={data.activeUsers7d}
                sub={`${pct(data.activeUsers7d, data.totalUsers)} du total`}
              />
              <KpiCard
                label="Paires"
                value={data.totalSneakers}
                sub={`+${data.newSneakers24h} en 24h · +${data.newSneakers7d} en 7j`}
              />
              <KpiCard
                label="À vendre"
                value={data.forSaleCount}
                sub={`${pct(data.forSaleCount, data.totalSneakers)} du total`}
              />
            </section>

            {/* === Time-series sparklines === */}
            <section style={trendsGridStyle}>
              <TrendCard
                title="Inscriptions · 14 jours"
                series={data.signupsByDay}
                totalLabel={`${sumSeries(data.signupsByDay)} signups`}
              />
              <TrendCard
                title="Paires ajoutées · 14 jours"
                series={data.pairsByDay}
                totalLabel={`${sumSeries(data.pairsByDay)} paires`}
              />
            </section>

            {/* === Vanity portfolio total === */}
            <section style={vanityStyle}>
              <div style={vanityCardStyle}>
                <div style={vanityLabelStyle}>VALEUR CUMULÉE (tous users)</div>
                <div style={vanityValueStyle}>
                  {formatEur(data.totalMarketValue)}
                </div>
                <div style={vanitySubStyle}>
                  investi {formatEur(data.totalInvested)} ·{' '}
                  <span style={{ color: 'var(--color-up)' }}>
                    {data.totalInvested > 0
                      ? formatPctSigned(
                          ((data.totalMarketValue - data.totalInvested) /
                            data.totalInvested) *
                            100,
                        )
                      : '—'}
                  </span>
                </div>
              </div>
            </section>

            {/* === Recent signups === */}
            <Section title="Inscriptions récentes">
              {data.recentUsers.length === 0 ? (
                <p style={emptyStyle}>Aucun utilisateur encore.</p>
              ) : (
                <ul style={listStyle}>
                  {data.recentUsers.map((u) => (
                    <li key={u.email} style={listRowStyle}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={listEmailStyle}>{u.email}</div>
                        <div style={listMetaStyle}>
                          {formatDateShort(u.created_at)}
                          {u.last_sign_in_at &&
                            ` · vu ${formatTimeAgo(
                              new Date(u.last_sign_in_at).getTime(),
                            )}`}
                        </div>
                      </div>
                      <div style={listCountStyle}>
                        {u.pair_count} {u.pair_count <= 1 ? 'paire' : 'paires'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* === Top brands === */}
            <Section title="Top marques">
              {data.topBrands.length === 0 ? (
                <p style={emptyStyle}>Aucune paire encore.</p>
              ) : (
                <ul style={listStyle}>
                  {data.topBrands.map((b) => (
                    <li key={b.brand} style={listRowStyle}>
                      <div style={listEmailStyle}>{b.brand}</div>
                      <div style={listCountStyle}>{b.count}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* === Top collectors === */}
            <Section title="Top collectionneurs">
              {data.topCollectors.length === 0 ? (
                <p style={emptyStyle}>Personne encore.</p>
              ) : (
                <ul style={listStyle}>
                  {data.topCollectors.map((c) => (
                    <li key={c.email} style={listRowStyle}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={listEmailStyle}>{c.email}</div>
                        <div style={listMetaStyle}>
                          {formatEur(c.collec_value)}
                        </div>
                      </div>
                      <div style={listCountStyle}>{c.pair_count}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
        ) : null}
      </main>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      {children}
    </section>
  )
}

/** Time-series card: title + total + sparkline + last 2-day diff. */
function TrendCard({
  title,
  series,
  totalLabel,
}: {
  title: string
  series: Array<{ d: string; c: number }>
  totalLabel: string
}) {
  const points = useMemo(
    () => series.map((s) => ({ date: s.d, value: s.c })),
    [series],
  )
  const lastTwo = useMemo(() => {
    if (series.length < 2) return null
    const a = series[series.length - 2].c
    const b = series[series.length - 1].c
    return { yesterday: a, today: b, diff: b - a }
  }, [series])

  return (
    <div style={trendCardStyle}>
      <div style={trendTopStyle}>
        <div style={trendTitleStyle}>{title}</div>
        <div style={trendTotalStyle}>{totalLabel}</div>
      </div>
      <div style={{ width: '100%', height: 50 }}>
        <Sparkline points={points} width={300} height={50} />
      </div>
      {lastTwo && (
        <div style={trendBottomStyle}>
          <span>Hier · {lastTwo.yesterday}</span>
          <span>Aujourd'hui · {lastTwo.today}</span>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function pct(n: number, total: number): string {
  if (total === 0) return '—'
  return `${Math.round((n / total) * 100)} %`
}

function formatPctSigned(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(1).replace('.', ',')} %`
}

function sumSeries(series: Array<{ c: number }>): number {
  return series.reduce((s, p) => s + p.c, 0)
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Human-friendly relative time, French. */
function formatTimeAgo(ts: number): string {
  const diffMs = Date.now() - ts
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return `il y a ${sec}s`
  const min = Math.floor(sec / 60)
  if (min < 60) return `il y a ${min}min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

// ============================================================================
// Styles
// ============================================================================

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg)',
}
const mainStyle: CSSProperties = {
  padding: 20,
  maxWidth: 900,
  margin: '0 auto',
}
const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  marginBottom: 24,
}
const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: 'var(--color-text)',
}
const subTitleStyle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 12,
  color: 'var(--color-text-muted)',
}
const refreshBtnStyle = (busy: boolean): CSSProperties => ({
  width: 40,
  height: 40,
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: 20,
  cursor: busy ? 'wait' : 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: busy ? 'shooserie-spin 0.9s linear infinite' : 'none',
})
const kpiGridStyle: CSSProperties = {
  display: 'grid',
  // auto-fit + minmax keeps 2x2 on phones (each ≥140px) and grows to 4-up
  // on wider screens. No media queries needed.
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
  marginBottom: 16,
}
const trendsGridStyle: CSSProperties = {
  display: 'grid',
  // 1 column under ~440px (typical phone portrait), 2 columns above. The
  // sparkline + title + footer need room to breathe; stacking them on
  // narrow viewports is the right call.
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 10,
  marginBottom: 16,
}
const trendCardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 14,
}
const trendTopStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: 8,
}
const trendTitleStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
}
const trendTotalStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text)',
}
const trendBottomStyle: CSSProperties = {
  marginTop: 8,
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 11,
  color: 'var(--color-text-muted)',
}
const vanityStyle: CSSProperties = { marginBottom: 24 }
const vanityCardStyle: CSSProperties = {
  background: 'var(--color-text)',
  color: '#FFFFFF',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 18px 16px',
  textAlign: 'center',
}
const vanityLabelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  opacity: 0.6,
  fontWeight: 500,
  marginBottom: 8,
}
const vanityValueStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 36,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  marginBottom: 6,
}
const vanitySubStyle: CSSProperties = {
  fontSize: 12,
  opacity: 0.75,
}
const sectionStyle: CSSProperties = { marginBottom: 24 }
const sectionTitleStyle: CSSProperties = {
  margin: '0 0 10px',
  fontFamily: 'var(--font-display)',
  fontSize: 12,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
}
const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
}
const listRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '11px 14px',
  borderBottom: '1px solid var(--color-border)',
}
const listEmailStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const listMetaStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  marginTop: 2,
}
const listCountStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  fontVariantNumeric: 'tabular-nums',
  flexShrink: 0,
}
const emptyStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: 'var(--color-text-faint)',
  padding: '14px 0',
}
const loadingStyle: CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: 13,
}
const errorStyle: CSSProperties = {
  marginBottom: 16,
  padding: '12px 14px',
  background: 'var(--color-down-bg, rgba(220, 38, 38, 0.08))',
  color: 'var(--color-down)',
  borderRadius: 'var(--radius-md)',
  fontSize: 13,
}
