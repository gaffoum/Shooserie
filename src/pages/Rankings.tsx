/**
 * Rankings — page /rankings (ROCK OR STOCK).
 * Deep dive sur les wears : repartition par statut, top portees,
 * recemment portees, DS still standing.
 */
import type { CSSProperties } from 'react'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { StatusDistribution } from '../components/StatusDistribution'
import { RankingsList } from '../components/RankingsList'
import {
  useMyWearStatusDistribution,
  useMyTopWornSneakers,
  useMyRecentlyWornSneakers,
  useMyDsStillStanding,
  wearStatus,
  WEAR_STATUS_COLORS,
} from '../lib/wears'

export default function Rankings() {
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
          <h1 style={pageTitleStyle}>
            ROCK <span style={accentStyle}>OR</span> STOCK
          </h1>
          <p style={pageSubtitleStyle}>
            Rock with confidence — Porte-les avec assurance.
          </p>
        </header>

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
const accentStyle: CSSProperties = {
  color: 'var(--color-bred, #CE1141)',
}
const pageSubtitleStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  color: 'var(--color-text-muted, #6B7280)',
  fontWeight: 500,
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