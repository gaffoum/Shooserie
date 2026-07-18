/**
 * Rankings — page /rankings (ROCK OR STOCK).
 * Deep dive sur les wears : repartition par statut, top portees,
 * recemment portees, DS still standing.
 */
import { useMemo, type CSSProperties } from 'react'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { StatusDistribution } from '../components/StatusDistribution'
import { RankingsList } from '../components/RankingsList'
import { StarRankBadge } from '../components/StarRankBadge'
import { FacetsList } from '../components/FacetsList'
import { useSneakers, useMyProfile } from '../lib/queries'
import { normalizeBrand } from '../lib/collectionGrouping'
import { computeFacets } from '../lib/badges'
import { useT } from '@/i18n/I18nContext'
import {
  useMyWearStatusDistribution,
  useMyTopWornSneakers,
  useMyRecentlyWornSneakers,
  useMyDsStillStanding,
  wearStatus,
  WEAR_STATUS_COLORS,
} from '../lib/wears'

export default function Rankings() {
  const { t } = useT()
  const { data: sneakers = [] } = useSneakers()
  const { data: profile } = useMyProfile()

  const stats = useMemo(() => {
    const total = sneakers.length
    const grails = sneakers.filter((s) => s.rarity === 'grail').length
    const brands = new Set(sneakers.map((s) => normalizeBrand(s.brand))).size
    const worn = sneakers.filter((s) => (s.wear_count ?? 0) > 0).length
    const forSale = sneakers.filter((s) => s.is_for_sale).length
    const avgMarket = total
      ? sneakers.reduce((a, s) => a + (s.market_price ?? 0), 0) / total
      : 0
    const facets = computeFacets({
      total,
      distinctBrands: brands,
      avgMarketValue: avgMarket,
      pairsWithWears: worn,
      pairsForSale: forSale,
    })
    return { total, grails, brands, worn, facets }
  }, [sneakers])

  const distQ = useMyWearStatusDistribution()
  const topQ = useMyTopWornSneakers(10)
  const recentQ = useMyRecentlyWornSneakers(10)
  const dsQ = useMyDsStillStanding(20)

  const isAllLoading =
    distQ.isLoading && topQ.isLoading && recentQ.isLoading && dsQ.isLoading

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackButton />} />

      <main style={mainStyle}>
        <header style={pageHeaderStyle}>
          <h1 style={pageTitleStyle}>{t('mystats.title')}</h1>
        </header>

        {/* Carte rang (écusson + barre) */}
        <div style={{ marginBottom: 16 }}>
          <StarRankBadge starsTotal={profile?.stars_total} rank={profile?.rank} />
        </div>

        {/* Tuiles 2×2 */}
        <div style={tilesStyle}>
          <StatTile value={stats.total} label={t('mystats.tile.pairs')} />
          <StatTile value={stats.grails} label={t('mystats.tile.grails')} accent="var(--rarity-grail)" />
          <StatTile value={stats.brands} label={t('mystats.tile.brands')} />
          <StatTile value={stats.worn} label={t('mystats.tile.worn')} />
        </div>

        {/* Facettes débloquées */}
        {stats.facets.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={facetsTitleStyle}>{t('mystats.facets.title')}</h2>
            <FacetsList facets={stats.facets} />
          </div>
        )}

        {isAllLoading && <div style={loadingStyle}>Chargement…</div>}

        {distQ.data && distQ.data.some((d) => d.count > 0) && (
          <StatusDistribution data={distQ.data} />
        )}

        {topQ.data && (
          <RankingsList
            title="LES PLUS PORTÉES"
            items={topQ.data}
            renderMeta={(s) => `${s.wear_count} wears`}
            renderBadge={(s) => {
              const status = wearStatus(s.wear_count)
              const c = WEAR_STATUS_COLORS[status]
              return (
                <span
                  style={{
                    ...badgeStyle,
                    background: c.bg,
                    color: c.fg,
                  }}
                >
                  {status}
                </span>
              )
            }}
          />
        )}

        {recentQ.data && (
          <RankingsList
            title="RÉCEMMENT PORTÉES"
            items={recentQ.data}
            renderMeta={(s) => formatRelativeDate(s.last_worn_at)}
            renderBadge={(s) => {
              const status = wearStatus(s.wear_count)
              const c = WEAR_STATUS_COLORS[status]
              return (
                <span
                  style={{
                    ...badgeStyle,
                    background: c.bg,
                    color: c.fg,
                  }}
                >
                  {status}
                </span>
              )
            }}
            emptyMessage="Aucune paire portée pour l'instant. Clique '+1 wear' sur une fiche."
          />
        )}

        {dsQ.data && (
          <RankingsList
            title="DS STILL STANDING"
            items={dsQ.data}
            renderMeta={(s) =>
              s.has_real_purchase_date
                ? `Acquise ${formatRelativeDate(s.acquired_at)}`
                : `Ajoutée ${formatRelativeDate(s.acquired_at)}`
            }
            emptyMessage="Toutes tes paires ont été portées au moins une fois 👟"
          />
        )}
      </main>
    </div>
  )
}

function formatRelativeDate(iso: string): string {
  const now = new Date()
  const date = new Date(iso)
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return date.toLocaleDateString('fr-FR')
  if (diffDays === 0) return "aujourd'hui"
  if (diffDays === 1) return 'hier'
  if (diffDays < 7) return `il y a ${diffDays} jours`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `il y a ${weeks} ${weeks === 1 ? 'semaine' : 'semaines'}`
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `il y a ${months} mois`
  }
  const years = Math.floor(diffDays / 365)
  return `il y a ${years} ${years === 1 ? 'an' : 'ans'}`
}

function StatTile({ value, label, accent }: { value: number; label: string; accent?: string }) {
  return (
    <div style={tileStyle}>
      <div style={{ ...tileValueStyle, color: accent ?? 'var(--color-text)' }}>{value}</div>
      <div className="lab" style={tileLabelStyle}>{label}</div>
    </div>
  )
}

const tilesStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginBottom: 24,
}
const tileStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px 14px',
}
const tileValueStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 30,
  fontWeight: 900,
  letterSpacing: '-1px',
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
}
const tileLabelStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 10,
  letterSpacing: '1.5px',
  color: 'var(--color-text-muted)',
}
const facetsTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text)',
  margin: '0 0 12px',
}

const mainStyle: CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '24px 16px 80px',
  fontFamily: "'Outfit', sans-serif",
}
const pageHeaderStyle: CSSProperties = {
  marginBottom: 32,
}
const pageTitleStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 48,
  fontWeight: 900,
  letterSpacing: '-0.02em',
  color: 'var(--color-text, #0A0A0A)',
  margin: 0,
  lineHeight: 1.05,
}
const loadingStyle: CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: 'var(--color-text-muted, #6B7280)',
  fontSize: 14,
}
const badgeStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
  letterSpacing: '0.02em',
  fontFamily: "'Outfit', sans-serif",
}