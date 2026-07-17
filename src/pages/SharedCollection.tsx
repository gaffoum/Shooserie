import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSharedCollection, type SharedSneaker } from '@/lib/queries'
import { calcDelta, deltaBgColor, deltaColor, formatEur, formatPct } from '@/lib/format'
import { Logo } from '@/components/Logo'
import { SneakerPhoto } from '@/components/SneakerPhoto'

type ViewMode = 'grid' | 'list'

/**
 * Public, no-auth page that renders a shared collection given a token in the
 * URL (e.g. /share/abc-123). Anyone with the link can view; the SQL function
 * `get_shared_collection` enforces token validity server-side and returns
 * only public-safe fields (no purchase price, no notes — see migration).
 *
 * Layout is mobile-first because most share clicks come from messaging apps
 * (WhatsApp, Insta DM) on phones.
 */
export function SharedCollection() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, error } = useSharedCollection(token)
  const [view, setView] = useState<ViewMode>('grid')

  // Totals: market value + count. Computed client-side from the shared list.
  const totals = useMemo(() => {
    const sneakers = data?.sneakers ?? []
    const totalMarket = sneakers.reduce((s, x) => s + (x.market_price ?? 0), 0)
    return { count: sneakers.length, market: totalMarket }
  }, [data])

  // States: loading / error / revoked / not found / OK.
  if (isLoading) {
    return (
      <Shell>
        <div style={loadingStyle}>Chargement de la collection…</div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <ErrorBlock
          title="Erreur"
          message={(error as Error).message}
        />
      </Shell>
    )
  }

  if (!data || !data.ok) {
    const reason = data?.error
    if (reason === 'Revoked') {
      return (
        <Shell>
          <ErrorBlock
            title="Lien désactivé"
            message="Le propriétaire a désactivé ce lien de partage. Demande-lui un nouveau lien si tu en as besoin."
          />
        </Shell>
      )
    }
    return (
      <Shell>
        <ErrorBlock
          title="Lien introuvable"
          message="Ce lien n'existe pas ou a été supprimé. Vérifie l'URL ou demande à la personne de t'en renvoyer un."
        />
      </Shell>
    )
  }

  const sneakers = data.sneakers ?? []
  const ownerLabel = data.label || data.ownerEmail || 'Collection partagée'

  return (
    <Shell>
      <header style={headerStyle}>
        <div>
          <div style={breadcrumbStyle}>Collection partagée</div>
          <h1 style={titleStyle}>{ownerLabel}</h1>
          {data.ownerEmail && data.label && (
            <div style={subtitleStyle}>par {data.ownerEmail}</div>
          )}
        </div>
        <div style={kpisStyle}>
          <KPI label="Paires" value={String(totals.count)} />
          <KPI label="Cote totale" value={formatEur(totals.market)} />
        </div>
      </header>

      {sneakers.length > 0 && (
        <nav style={toggleStyle} role="tablist" aria-label="Changer la vue">
          <ToggleBtn
            active={view === 'grid'}
            onClick={() => setView('grid')}
            label="Grille"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </ToggleBtn>
          <ToggleBtn
            active={view === 'list'}
            onClick={() => setView('list')}
            label="Liste"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="4" cy="6" r="1" />
              <circle cx="4" cy="12" r="1" />
              <circle cx="4" cy="18" r="1" />
            </svg>
          </ToggleBtn>
        </nav>
      )}

      {sneakers.length === 0 ? (
        <div style={emptyStyle}>Cette collection ne contient aucune paire.</div>
      ) : view === 'grid' ? (
        <GridView sneakers={sneakers} />
      ) : (
        <ListView sneakers={sneakers} />
      )}
    </Shell>
  )
}

// ============================================================================
// Shell — branded wrapper with top logo + footer
// ============================================================================

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={pageStyle}>
      <nav style={topBarStyle}>
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
          <Logo size="md" />
        </Link>
        <Link to="/" style={topBarLinkStyle}>
          shooserie.tech
        </Link>
      </nav>
      <main style={mainStyle}>{children}</main>
      <footer style={footerStyle}>
        <span>Généré par Shooserie</span>
        <Link to="/" style={{ color: 'var(--color-bred)', textDecoration: 'none', fontWeight: 600 }}>
          Créer ta propre collection →
        </Link>
      </footer>
    </div>
  )
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiLabelStyle}>{label.toUpperCase()}</div>
      <div style={kpiValueStyle}>{value}</div>
    </div>
  )
}

function ToggleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      style={toggleBtnStyle(active)}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

function ErrorBlock({ title, message }: { title: string; message: string }) {
  return (
    <div style={errorBlockStyle}>
      <div style={errorIconStyle}>🔒</div>
      <h2 style={errorTitleStyle}>{title}</h2>
      <p style={errorMsgStyle}>{message}</p>
      <Link to="/" style={errorLinkStyle}>
        Aller sur Shooserie →
      </Link>
    </div>
  )
}

// ============================================================================
// Grid view
// ============================================================================

function GridView({ sneakers }: { sneakers: SharedSneaker[] }) {
  return (
    <section style={gridStyle}>
      {sneakers.map((s) => (
        <Card key={s.id} sneaker={s} />
      ))}
    </section>
  )
}

function Card({ sneaker }: { sneaker: SharedSneaker }) {
  const cost = sneaker.release_price ?? null
  const delta = calcDelta(cost, sneaker.market_price)
  const price = sneaker.market_price ?? sneaker.release_price ?? null
  const sizeLabel = formatSize(sneaker.size_eu, sneaker.size_us)

  return (
    <article style={cardStyle}>
      <div style={cardThumbStyle}>
        <SneakerPhoto stockxUrl={sneaker.stockx_image_url} alt={sneaker.name} />
        {sneaker.is_for_sale && <span style={ribbonStyle}>À VENDRE</span>}
      </div>
      <div style={cardMetaStyle}>
        {sneaker.brand && <div style={cardBrandStyle}>{sneaker.brand}</div>}
        <div style={cardNameStyle}>{sneaker.name}</div>
        {sizeLabel && <div style={cardSizeStyle}>{sizeLabel}</div>}
        <div style={cardBottomStyle}>
          <div style={cardPriceStyle}>{price !== null ? formatEur(price) : '—'}</div>
          {delta.pct !== null && (
            <div
              style={{
                ...cardDeltaStyle,
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
    </article>
  )
}

// ============================================================================
// List view
// ============================================================================

function ListView({ sneakers }: { sneakers: SharedSneaker[] }) {
  return (
    <div style={listWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}></th>
            <th style={thStyle}>Modèle</th>
            <th style={thStyle}>Taille</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Cote</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>+/-</th>
          </tr>
        </thead>
        <tbody>
          {sneakers.map((s) => (
            <Row key={s.id} sneaker={s} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Row({ sneaker }: { sneaker: SharedSneaker }) {
  const cost = sneaker.release_price ?? null
  const delta = calcDelta(cost, sneaker.market_price)
  const price = sneaker.market_price ?? sneaker.release_price ?? null
  const sizeLabel = formatSize(sneaker.size_eu, sneaker.size_us)

  return (
    <tr style={trStyle}>
      <td style={rowThumbStyle}>
        <div style={rowThumbInnerStyle}>
          <SneakerPhoto stockxUrl={sneaker.stockx_image_url} alt="" />
        </div>
      </td>
      <td style={tdStyle}>
        {sneaker.brand && <div style={rowBrandStyle}>{sneaker.brand}</div>}
        <div style={rowNameStyle}>
          {sneaker.name}
          {sneaker.is_for_sale && <span style={saleTagStyle}>À VENDRE</span>}
        </div>
      </td>
      <td style={{ ...tdStyle, fontSize: 12, color: 'var(--color-text-muted)' }}>
        {sizeLabel || '—'}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
        {price !== null ? formatEur(price) : '—'}
      </td>
      <td style={{ ...tdStyle, textAlign: 'right' }}>
        {delta.pct !== null ? (
          <span
            style={{
              ...rowDeltaStyle,
              background:
                deltaBgColor(delta.pct) ?? 'var(--color-neutral-chip-bg)',
              color: deltaColor(delta.pct),
            }}
          >
            {formatPct(delta.pct, true)}
          </span>
        ) : (
          '—'
        )}
      </td>
    </tr>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function formatSize(eu: string | null, us: string | null): string {
  const parts: string[] = []
  if (eu) parts.push(`EU ${eu}`)
  if (us) parts.push(`US ${us}`)
  return parts.join(' · ')
}

// ============================================================================
// Styles
// ============================================================================

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-bg)',
  display: 'flex',
  flexDirection: 'column',
}
const topBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
  borderBottom: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
}
const topBarLinkStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
}
const mainStyle: CSSProperties = {
  flex: 1,
  maxWidth: 1200,
  width: '100%',
  margin: '0 auto',
  padding: '20px',
}
const footerStyle: CSSProperties = {
  borderTop: '1px solid var(--color-border)',
  padding: '20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 10,
  fontSize: 11,
  color: 'var(--color-text-muted)',
  flexWrap: 'wrap',
}
const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 18,
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
  marginTop: 4,
  fontSize: 12,
  color: 'var(--color-text-muted)',
}
const kpisStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
}
const kpiCardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  minWidth: 100,
}
const kpiLabelStyle: CSSProperties = {
  fontSize: 9,
  letterSpacing: 'var(--tracking-wider)',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  marginBottom: 3,
}
const kpiValueStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 18,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
}
const toggleStyle: CSSProperties = {
  display: 'flex',
  gap: 6,
  marginBottom: 14,
}
const toggleBtnStyle = (active: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 12px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: active ? 'var(--color-text)' : 'var(--color-surface)',
  color: active ? '#FFFFFF' : 'var(--color-text-muted)',
  border: '1px solid ' + (active ? 'var(--color-text)' : 'var(--color-border)'),
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  transition: 'all 0.15s ease',
})
const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: 12,
}
const cardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}
const cardThumbStyle: CSSProperties = {
  position: 'relative',
  aspectRatio: '1 / 1',
  background: 'var(--color-bg)',
  borderBottom: '1px solid var(--color-border)',
  overflow: 'hidden',
}
const ribbonStyle: CSSProperties = {
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
}
const cardMetaStyle: CSSProperties = {
  padding: '10px 12px 12px',
}
const cardBrandStyle: CSSProperties = {
  fontSize: 9,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-faint)',
  fontWeight: 500,
  marginBottom: 3,
}
const cardNameStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  minHeight: 34,
}
const cardSizeStyle: CSSProperties = {
  marginTop: 5,
  fontSize: 11,
  color: 'var(--color-text-muted)',
  fontVariantNumeric: 'tabular-nums',
}
const cardBottomStyle: CSSProperties = {
  marginTop: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 6,
}
const cardPriceStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
}
const cardDeltaStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  padding: '3px 7px',
  borderRadius: 'var(--radius-sm)',
  whiteSpace: 'nowrap',
}

const listWrapStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
}
const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}
const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  background: 'var(--color-bg)',
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  borderBottom: '1px solid var(--color-border)',
}
const trStyle: CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
}
const tdStyle: CSSProperties = {
  padding: '10px 14px',
  fontSize: 13,
  verticalAlign: 'middle',
}
const rowThumbStyle: CSSProperties = {
  ...tdStyle,
  width: 56,
  paddingRight: 0,
}
const rowThumbInnerStyle: CSSProperties = {
  position: 'relative',
  width: 44,
  height: 44,
  background: 'var(--color-bg)',
  borderRadius: 'var(--radius-sm)',
  overflow: 'hidden',
}
const rowBrandStyle: CSSProperties = {
  fontSize: 9,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-faint)',
  fontWeight: 500,
}
const rowNameStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  marginTop: 1,
}
const saleTagStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-wider)',
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  padding: '2px 6px',
  borderRadius: 3,
  verticalAlign: 'middle',
  marginLeft: 6,
  fontFamily: 'var(--font-display)',
}
const rowDeltaStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  padding: '3px 7px',
  borderRadius: 'var(--radius-sm)',
  whiteSpace: 'nowrap',
}

const emptyStyle: CSSProperties = {
  textAlign: 'center',
  padding: 40,
  fontSize: 14,
  color: 'var(--color-text-muted)',
}
const loadingStyle: CSSProperties = {
  textAlign: 'center',
  padding: 60,
  fontSize: 13,
  color: 'var(--color-text-muted)',
}
const errorBlockStyle: CSSProperties = {
  maxWidth: 400,
  margin: '60px auto',
  textAlign: 'center',
  padding: '32px 24px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
}
const errorIconStyle: CSSProperties = {
  fontSize: 36,
  marginBottom: 12,
}
const errorTitleStyle: CSSProperties = {
  margin: '0 0 8px',
  fontFamily: 'var(--font-display)',
  fontSize: 18,
  fontWeight: 700,
}
const errorMsgStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  marginBottom: 18,
}
const errorLinkStyle: CSSProperties = {
  display: 'inline-block',
  padding: '10px 18px',
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
