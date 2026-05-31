# ============================================================
#  Fix-up Phase 3 (suite du crash)
#  1. TopWornSneakersProps : interface fix (regex tolerant)
#  2. Cree Rankings.tsx, StatusDistribution.tsx, RankingsList.tsx
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $Path), $Content, (New-Object System.Text.UTF8Encoding $false))
}
function Read-FileUtf8 {
    param([string]$Path)
    [System.IO.File]::ReadAllText((Join-Path (Get-Location).Path $Path), [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "=== Fix-up Phase 3 ===" -ForegroundColor Cyan

# ============================================================
# 1. TopWornSneakers : patch interface avec regex tolerant
# ============================================================
$twsPath = "src/components/TopWornSneakers.tsx"
$tws = Read-FileUtf8 $twsPath

# Verif preliminaire : on regarde ou en est l'interface
$interfaceMatch = [regex]::Match($tws, '(?s)interface TopWornSneakersProps \{[^}]*?\}')
if ($interfaceMatch.Success) {
    $current = $interfaceMatch.Value
    Write-Host "Interface actuelle :" -ForegroundColor DarkGray
    Write-Host $current -ForegroundColor DarkGray
    Write-Host ""
}

if ($tws -match 'viewAllUrl\?\s*:\s*string') {
    Write-Host "  =  viewAllUrl deja dans l'interface" -ForegroundColor DarkGray
} else {
    # Pattern lenient : matche l'interface complete et inserte avant }
    $pattern = '(?s)(interface TopWornSneakersProps \{[^}]*?)(\})'
    $evaluator = {
        param($m)
        $body = $m.Groups[1].Value
        $closing = $m.Groups[2].Value
        # Ajoute viewAllUrl avant le } fermant
        return $body + "  /** Si fourni, affiche un lien 'Voir tout' a cote du titre. */`r`n  viewAllUrl?: string`r`n" + $closing
    }
    $newTws = [regex]::Replace($tws, $pattern, $evaluator)
    if ($newTws -ne $tws) {
        $tws = $newTws
        Write-FileUtf8NoBom -Path $twsPath -Content $tws
        Write-Host "  +  Interface TopWornSneakersProps mise a jour" -ForegroundColor Green
    } else {
        Write-Host "ERREUR  Interface TopWornSneakersProps non trouvee" -ForegroundColor Red
        Write-Host "        Ajoute manuellement 'viewAllUrl?: string' dans l'interface" -ForegroundColor Yellow
    }
}

# ============================================================
# 2. StatusDistribution.tsx
# ============================================================
if (Test-Path "src/components/StatusDistribution.tsx") {
    Write-Host "  =  StatusDistribution.tsx existe deja" -ForegroundColor DarkGray
} else {
    $statusDistFile = @'
/**
 * StatusDistribution — repartition des paires par statut (page /rankings).
 * Barres colorees horizontales par statut + nombre + pourcentage.
 */
import type { CSSProperties } from 'react'
import { WEAR_STATUS_COLORS, type WearStatusCount } from '@/lib/wears'

interface StatusDistributionProps {
  data: WearStatusCount[]
}

export function StatusDistribution({ data }: StatusDistributionProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  if (total === 0) return null

  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>TA COLLEC PAR ÉTAT</h2>
      <div style={listStyle}>
        {data.map((d) => {
          const pct = (d.count / total) * 100
          const colors = WEAR_STATUS_COLORS[d.status]
          return (
            <div key={d.status} style={rowStyle}>
              <div style={labelStyle}>{d.status}</div>
              <div style={countStyle}>{d.count}</div>
              <div style={barTrackStyle}>
                <div
                  style={{
                    ...barFillStyle,
                    width: pct > 0 ? `${Math.max(pct, 1.5)}%` : '0',
                    background: colors.bg,
                  }}
                />
              </div>
              <div style={pctStyle}>{Math.round(pct)}%</div>
            </div>
          )
        })}
      </div>
      <p style={totalStyle}>
        {total} {total > 1 ? 'paires au total' : 'paire au total'}
      </p>
    </section>
  )
}

const sectionStyle: CSSProperties = { marginBottom: 32 }
const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display, \'Outfit\', sans-serif)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text, #0A0A0A)',
  margin: '0 0 16px',
}
const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  background: 'var(--color-surface, #FFFFFF)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: 12,
  padding: 16,
}
const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '70px 50px 1fr 45px',
  alignItems: 'center',
  gap: 12,
}
const labelStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text, #0A0A0A)',
  letterSpacing: '0.02em',
}
const countStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text, #0A0A0A)',
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
}
const barTrackStyle: CSSProperties = {
  height: 10,
  background: 'var(--color-bg, #F3F4F6)',
  borderRadius: 999,
  overflow: 'hidden',
}
const barFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
  transition: 'width 300ms ease',
}
const pctStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--color-text-muted, #6B7280)',
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
}
const totalStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  color: 'var(--color-text-muted, #6B7280)',
  textAlign: 'right',
  fontFamily: "'Outfit', sans-serif",
}
'@
    Write-FileUtf8NoBom -Path "src/components/StatusDistribution.tsx" -Content $statusDistFile
    Write-Host "  +  src/components/StatusDistribution.tsx" -ForegroundColor Green
}

# ============================================================
# 3. RankingsList.tsx
# ============================================================
if (Test-Path "src/components/RankingsList.tsx") {
    Write-Host "  =  RankingsList.tsx existe deja" -ForegroundColor DarkGray
} else {
    $rankingsListFile = @'
/**
 * RankingsList — composant generique pour les sections de /rankings.
 * Affiche une liste verticale de paires avec rang, photo, brand, nom,
 * meta (textuel, dynamique selon le type) + badge optionnel.
 */
import { Link } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'

interface BaseRankingItem {
  id: string
  name: string
  brand: string | null
  photo_url: string | null
  stockx_image_url: string | null
}

interface RankingsListProps<T extends BaseRankingItem> {
  title: string
  items: T[]
  renderMeta: (item: T, rank: number) => ReactNode
  renderBadge?: (item: T, rank: number) => ReactNode
  emptyMessage?: string
}

export function RankingsList<T extends BaseRankingItem>({
  title,
  items,
  renderMeta,
  renderBadge,
  emptyMessage,
}: RankingsListProps<T>) {
  if (items.length === 0) {
    if (!emptyMessage) return null
    return (
      <section style={sectionStyle}>
        <h2 style={titleStyle}>{title}</h2>
        <div style={emptyStyle}>{emptyMessage}</div>
      </section>
    )
  }

  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>{title}</h2>
      <div style={listStyle}>
        {items.map((item, i) => {
          const photo = item.stockx_image_url || item.photo_url || ''
          return (
            <Link
              key={item.id}
              to={`/sneakers/${item.id}`}
              style={rowLinkStyle}
            >
              <div style={rowStyle}>
                <span style={rankStyle}>#{i + 1}</span>
                <div style={imageWrapStyle}>
                  {photo ? (
                    <img src={photo} alt={item.name} style={imgStyle} />
                  ) : (
                    <div style={imgPlaceholderStyle} />
                  )}
                </div>
                <div style={infoStyle}>
                  {item.brand && <div style={brandStyle}>{item.brand}</div>}
                  <div style={nameStyle}>{item.name}</div>
                </div>
                <div style={metaWrapStyle}>
                  <div style={metaStyle}>{renderMeta(item, i + 1)}</div>
                  {renderBadge && (
                    <div style={badgeWrapStyle}>{renderBadge(item, i + 1)}</div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

const sectionStyle: CSSProperties = { marginBottom: 32 }
const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display, \'Outfit\', sans-serif)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text, #0A0A0A)',
  margin: '0 0 12px',
}
const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}
const rowLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
}
const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '32px 64px 1fr auto',
  alignItems: 'center',
  gap: 12,
  background: 'var(--color-surface, #FFFFFF)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: 10,
  padding: '10px 14px',
  transition: 'border-color var(--transition-fast, 120ms)',
}
const rankStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-muted, #6B7280)',
  fontVariantNumeric: 'tabular-nums',
}
const imageWrapStyle: CSSProperties = {
  width: 64,
  height: 56,
  background: 'var(--color-bg, #F9FAFB)',
  borderRadius: 6,
  overflow: 'hidden',
  flexShrink: 0,
}
const imgStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
}
const imgPlaceholderStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'var(--color-bg, #F9FAFB)',
}
const infoStyle: CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
}
const brandStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted, #6B7280)',
  marginBottom: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const nameStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.3,
  color: 'var(--color-text, #0A0A0A)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const metaWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 4,
  flexShrink: 0,
  textAlign: 'right',
}
const metaStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text, #0A0A0A)',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
}
const badgeWrapStyle: CSSProperties = {
  display: 'flex',
}
const emptyStyle: CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: 'var(--color-text-muted, #6B7280)',
  fontSize: 13,
  background: 'var(--color-surface, #FFFFFF)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: 10,
}
'@
    Write-FileUtf8NoBom -Path "src/components/RankingsList.tsx" -Content $rankingsListFile
    Write-Host "  +  src/components/RankingsList.tsx" -ForegroundColor Green
}

# ============================================================
# 4. Rankings.tsx (la page)
# ============================================================
if (Test-Path "src/pages/Rankings.tsx") {
    Write-Host "  =  Rankings.tsx existe deja" -ForegroundColor DarkGray
} else {
    $rankingsPageFile = @'
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
      <AppHeader leftActions={<BackButton to="/dashboard" />} />

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
'@
    Write-FileUtf8NoBom -Path "src/pages/Rankings.tsx" -Content $rankingsPageFile
    Write-Host "  +  src/pages/Rankings.tsx" -ForegroundColor Green
}

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Get-ChildItem src/pages/Rankings.tsx, src/components/StatusDistribution.tsx, src/components/RankingsList.tsx -ErrorAction SilentlyContinue |
    ForEach-Object { "  + $($_.FullName.Replace((Get-Location).Path, '.').Replace('\','/'))" }

Write-Host ""
Write-Host "Interface TopWornSneakersProps (apres patch) :" -ForegroundColor Cyan
$tws2 = Read-FileUtf8 $twsPath
$m = [regex]::Match($tws2, '(?s)interface TopWornSneakersProps \{[^}]*?\}')
if ($m.Success) { Write-Host $m.Value -ForegroundColor DarkGray }

Write-Host ""
Write-Host "Fix-up applique. Relance :" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor White
