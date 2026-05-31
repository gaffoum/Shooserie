# ============================================================
#  Shooserie - Phase 3 : page /rankings (ROCK OR STOCK)
#  1. wears.ts          : 3 nouveaux hooks
#  2. TopWornSneakers   : prop optionnelle viewAllUrl
#  3. StatusDistribution (new component)
#  4. RankingsList      (new component)
#  5. Rankings          (new page)
#  6. App.tsx           : route protegee /rankings
#  7. Dashboard.tsx     : passe viewAllUrl au TopWornSneakers
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path (Get-Location).Path $Path }
    [System.IO.File]::WriteAllText($full, $Content, (New-Object System.Text.UTF8Encoding $false))
}
function Read-FileUtf8 {
    param([string]$Path)
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path (Get-Location).Path $Path }
    return [System.IO.File]::ReadAllText($full, [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "=== Phase 3 : Rock or Stock (/rankings) ===" -ForegroundColor Cyan
$currentBranch = ""
try { $currentBranch = (git branch --show-current 2>$null).Trim() } catch {}
Write-Host "Branche actuelle : $currentBranch"
if ($currentBranch -ne "dev") {
    Write-Host "WARN  Pas sur 'dev'" -ForegroundColor Red
    $c = Read-Host "Continuer ? (o/N)"
    if ($c -ne "o" -and $c -ne "O") { exit 0 }
}
Write-Host ""

# ============================================================
# 1. wears.ts : 3 nouveaux hooks
# ============================================================
$wearsPath = "src/lib/wears.ts"
$wears = Read-FileUtf8 $wearsPath

if ($wears -match "useMyWearStatusDistribution") {
    Write-Host "  =  Nouveaux hooks deja presents dans wears.ts" -ForegroundColor DarkGray
} else {
    $hooksAdd = @'


// =============================================================
// Page /rankings — distribution + recently worn + DS still standing
// =============================================================

export interface WearStatusCount {
  status: WearStatus
  count: number
}

/**
 * Repartition par statut pour la collec de l'utilisateur courant.
 * Fetch tous les wear_count (1 colonne), groupe cote JS via wearStatus().
 * Pour 1000+ paires c'est encore largement OK.
 */
export function useMyWearStatusDistribution() {
  const { data: userId } = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    },
    staleTime: 5 * 60 * 1000,
  })

  return useQuery({
    queryKey: ['wear-status-distribution', userId],
    enabled: !!userId,
    queryFn: async (): Promise<WearStatusCount[]> => {
      const { data, error } = await supabase
        .from('sneakers')
        .select('wear_count')
        .eq('user_id', userId!)
      if (error) throw error

      const counts: Record<WearStatus, number> = {
        DS: 0,
        VNDS: 0,
        '9/10': 0,
        '8/10': 0,
        Beater: 0,
      }
      for (const row of data ?? []) {
        counts[wearStatus(row.wear_count as number)]++
      }
      return WEAR_STATUSES.map((s) => ({ status: s, count: counts[s] }))
    },
  })
}

/**
 * Top N paires recemment portees (par last_worn_at desc).
 * Hit l'index (user_id, last_worn_at DESC) WHERE last_worn_at IS NOT NULL.
 */
export interface RecentlyWornSneaker {
  id: string
  name: string
  brand: string | null
  photo_url: string | null
  stockx_image_url: string | null
  wear_count: number
  last_worn_at: string
}

export function useMyRecentlyWornSneakers(limit = 10) {
  const { data: userId } = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    },
    staleTime: 5 * 60 * 1000,
  })

  return useQuery({
    queryKey: ['recently-worn', userId, limit],
    enabled: !!userId,
    queryFn: async (): Promise<RecentlyWornSneaker[]> => {
      const { data, error } = await supabase
        .from('sneakers')
        .select(
          'id, name, brand, photo_url, stockx_image_url, wear_count, last_worn_at',
        )
        .eq('user_id', userId!)
        .gt('wear_count', 0)
        .not('last_worn_at', 'is', null)
        .order('last_worn_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as RecentlyWornSneaker[]
    },
  })
}

/**
 * DS still standing : paires jamais portees, triees par date d'acquisition desc.
 * COALESCE(purchase_date, created_at) — tri cote client (Postgres ne permet
 * pas COALESCE direct dans .order() de PostgREST). Fetch toutes les DS puis
 * tri + slice cote client.
 */
export interface DsStillStandingSneaker {
  id: string
  name: string
  brand: string | null
  photo_url: string | null
  stockx_image_url: string | null
  wear_count: number
  purchase_date: string | null
  created_at: string
  /** Resolu par le hook : purchase_date si dispo, sinon created_at. */
  acquired_at: string
  /** True si acquired_at provient de purchase_date (sinon = created_at fallback). */
  has_real_purchase_date: boolean
}

export function useMyDsStillStanding(limit = 20) {
  const { data: userId } = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    },
    staleTime: 5 * 60 * 1000,
  })

  return useQuery({
    queryKey: ['ds-still-standing', userId, limit],
    enabled: !!userId,
    queryFn: async (): Promise<DsStillStandingSneaker[]> => {
      const { data, error } = await supabase
        .from('sneakers')
        .select(
          'id, name, brand, photo_url, stockx_image_url, wear_count, purchase_date, created_at',
        )
        .eq('user_id', userId!)
        .eq('wear_count', 0)
      if (error) throw error

      // Tri cote client : COALESCE(purchase_date, created_at) desc
      const enriched = (data ?? []).map((s) => {
        const acquired = (s.purchase_date as string | null) ?? (s.created_at as string)
        return {
          ...s,
          acquired_at: acquired,
          has_real_purchase_date: s.purchase_date !== null,
        } as DsStillStandingSneaker
      })
      enriched.sort((a, b) => b.acquired_at.localeCompare(a.acquired_at))
      return enriched.slice(0, limit)
    },
  })
}
'@
    $wears = $wears.TrimEnd() + $hooksAdd + "`r`n"
    Write-FileUtf8NoBom -Path $wearsPath -Content $wears
    Write-Host "  +  3 nouveaux hooks ajoutes dans wears.ts" -ForegroundColor Green
}

# ============================================================
# 2. TopWornSneakers.tsx : prop optionnelle viewAllUrl
# ============================================================
$twsPath = "src/components/TopWornSneakers.tsx"
$tws = Read-FileUtf8 $twsPath

if ($tws -match "viewAllUrl") {
    Write-Host "  =  viewAllUrl deja present dans TopWornSneakers" -ForegroundColor DarkGray
} else {
    # 2a. Type props : ajoute viewAllUrl?
    $oldPropsType = "interface TopWornSneakersProps {`r`n  limit?: number`r`n}"
    $newPropsType = "interface TopWornSneakersProps {`r`n  limit?: number`r`n  /** Si fourni, affiche un lien 'Voir tout' a cote du titre. */`r`n  viewAllUrl?: string`r`n}"
    if ($tws.Contains($oldPropsType)) {
        $tws = $tws.Replace($oldPropsType, $newPropsType)
    } else {
        # Fallback LF
        $oldPropsTypeLf = "interface TopWornSneakersProps {`n  limit?: number`n}"
        $newPropsTypeLf = "interface TopWornSneakersProps {`n  limit?: number`n  /** Si fourni, affiche un lien 'Voir tout' a cote du titre. */`n  viewAllUrl?: string`n}"
        if ($tws.Contains($oldPropsTypeLf)) {
            $tws = $tws.Replace($oldPropsTypeLf, $newPropsTypeLf)
        }
    }

    # 2b. Signature de fonction : destructure viewAllUrl
    $tws = $tws -replace 'export function TopWornSneakers\(\{ limit = 10 \}: TopWornSneakersProps\)', `
        'export function TopWornSneakers({ limit = 10, viewAllUrl }: TopWornSneakersProps)'

    # 2c. JSX : ajoute le lien dans le <header>, apres le span subtitle
    # On utilise <Link> directement (deja importe dans le fichier).
    $tws = $tws -replace '(<span style=\{subtitleStyle\}>[\s\S]*?</span>)', `
        '$1' + "`r`n        {viewAllUrl && (`r`n          <Link to={viewAllUrl} style={viewAllStyle}>Voir tout →</Link>`r`n        )}"

    # 2d. Style viewAllStyle : ajoute a la fin du fichier
    if ($tws -notmatch "viewAllStyle") {
        $tws = $tws.TrimEnd() + @'


// Lien "Voir tout →" dans le header de la section.
// Le headerStyle existant utilise justify-content: space-between, donc le
// 3e enfant (le Link) se pose naturellement a droite apres le subtitle.
const viewAllStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-bred, #CE1141)',
  textDecoration: 'none',
  fontFamily: "'Outfit', sans-serif",
  marginLeft: 'auto',
}
'@ + "`r`n"
    }

    Write-FileUtf8NoBom -Path $twsPath -Content $tws
    Write-Host "  ~  TopWornSneakers : prop viewAllUrl + lien 'Voir tout →'" -ForegroundColor Green
}

# ============================================================
# 3. src/components/StatusDistribution.tsx
# ============================================================
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

const sectionStyle: CSSProperties = {
  marginBottom: 32,
}
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

# ============================================================
# 4. src/components/RankingsList.tsx
# ============================================================
$rankingsListFile = @'
/**
 * RankingsList — composant generique pour les sections de /rankings.
 * Affiche une liste verticale de paires avec rang, photo, brand, nom,
 * meta (textuel, dynamique selon le type) + badge optionnel.
 *
 * Type generique <T> avec render-props pour la flexibilite : le parent
 * controle comment afficher la meta et le badge par item.
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
  /** Contenu affiche a droite de chaque ligne (count, date, etc.) */
  renderMeta: (item: T, rank: number) => ReactNode
  /** Badge optionnel sous la meta (status pill par exemple). */
  renderBadge?: (item: T, rank: number) => ReactNode
  /** Message si items.length === 0 (par defaut le composant s'auto-masque). */
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

// =================================================================
// Styles
// =================================================================
const sectionStyle: CSSProperties = {
  marginBottom: 32,
}
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

# ============================================================
# 5. src/pages/Rankings.tsx
# ============================================================
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

        {/* Section 1 : Repartition par statut */}
        {distQ.data && distQ.data.some((d) => d.count > 0) && (
          <StatusDistribution data={distQ.data} />
        )}

        {/* Section 2 : Top 10 portees */}
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

        {/* Section 3 : Recemment portees */}
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

        {/* Section 4 : DS still standing */}
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

/**
 * Formate une date en relatif court : "hier", "il y a 3 jours", "il y a 2 mois".
 * Fallback sur la date absolue au-dela d'un an.
 */
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

// =================================================================
// Styles
// =================================================================
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

# ============================================================
# 6. App.tsx : import Rankings + route /rankings
# ============================================================
$appPath = "src/App.tsx"
$app = Read-FileUtf8 $appPath

# 6a. Import
if ($app -match "import\s+Rankings\s+from") {
    Write-Host "  =  Import Rankings deja present dans App.tsx" -ForegroundColor DarkGray
} else {
    $anchor = "import Community from './pages/Community';"
    if ($app.Contains($anchor)) {
        $newImport = "$anchor`r`nimport Rankings from './pages/Rankings';"
        $app = $app.Replace($anchor, $newImport)
        Write-Host "  +  Import Rankings ajoute apres Community" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre import Community non trouvee dans App.tsx" -ForegroundColor Yellow
    }
}

# 6b. Route : insere juste avant </Routes>
if ($app -match 'path="/rankings"') {
    Write-Host "  =  Route /rankings deja presente" -ForegroundColor DarkGray
} else {
    if ($app.Contains("</Routes>")) {
        $newRouteBlock = @'
        <Route
          path="/rankings"
          element={
            <ProtectedRoute>
              <Rankings />
            </ProtectedRoute>
          }
        />
      </Routes>
'@
        $app = $app.Replace("</Routes>", $newRouteBlock.TrimStart())
        Write-FileUtf8NoBom -Path $appPath -Content $app
        Write-Host "  +  Route /rankings inseree avant </Routes>" -ForegroundColor Green
    } else {
        Write-Host "WARN  Balise </Routes> non trouvee dans App.tsx" -ForegroundColor Yellow
    }
}

# Re-relit pour les verifs en fin de script
$app = Read-FileUtf8 $appPath

# ============================================================
# 7. Dashboard.tsx : passe viewAllUrl au TopWornSneakers
# ============================================================
$dashPath = "src/pages/Dashboard.tsx"
$dash = Read-FileUtf8 $dashPath

if ($dash -match 'viewAllUrl="/rankings"') {
    Write-Host "  =  viewAllUrl deja passe au TopWornSneakers" -ForegroundColor DarkGray
} else {
    $old = "<TopWornSneakers limit={10} />"
    $new = '<TopWornSneakers limit={10} viewAllUrl="/rankings" />'
    if ($dash.Contains($old)) {
        $dash = $dash.Replace($old, $new)
        Write-FileUtf8NoBom -Path $dashPath -Content $dash
        Write-Host "  +  Dashboard : viewAllUrl='/rankings' passe au TopWornSneakers" -ForegroundColor Green
    } else {
        Write-Host "WARN  <TopWornSneakers limit={10} /> non trouve a l'identique" -ForegroundColor Yellow
    }
}

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Get-ChildItem src/pages/Rankings.tsx, src/components/StatusDistribution.tsx, src/components/RankingsList.tsx -ErrorAction SilentlyContinue |
    ForEach-Object { "  + $($_.FullName.Replace((Get-Location).Path, '.').Replace('\','/'))" }
Select-String -Path src/lib/wears.ts -Pattern "useMyWearStatusDistribution|useMyRecentlyWornSneakers|useMyDsStillStanding" |
    ForEach-Object { "  wears.ts:$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path src/App.tsx -Pattern "Rankings" |
    ForEach-Object { "  App.tsx:$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path src/pages/Dashboard.tsx -Pattern "viewAllUrl" |
    ForEach-Object { "  Dashboard:$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path src/components/TopWornSneakers.tsx -Pattern "viewAllUrl" |
    ForEach-Object { "  TopWornSneakers:$($_.LineNumber) : $($_.Line.Trim())" }

# Anti-double-encodage
$bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path "src/pages/Rankings.tsx"))
$u = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($u -match "Ã©|Ã¨|Ã |Ã€") {
    Write-Host "  ERREUR : double-encodage Rankings.tsx" -ForegroundColor Red
} else {
    Write-Host "  OK : Rankings.tsx UTF-8 propre" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Phase 3 appliquee ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Suite :" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  git add -A" -ForegroundColor White
Write-Host "  git commit -m `"feat(rankings): /rankings page with distribution + top worn + recent + DS still standing`"" -ForegroundColor White
Write-Host "  git push origin dev" -ForegroundColor White
Write-Host ""
Write-Host "Test :" -ForegroundColor Yellow
Write-Host "  1. Dashboard -> 'LES PLUS PORTEES' section : 'Voir tout ->' a droite du titre" -ForegroundColor White
Write-Host "  2. Clic sur 'Voir tout ->' -> /rankings" -ForegroundColor White
Write-Host "  3. Page Rankings : 4 sections (distribution, top portees, recemment, DS still standing)" -ForegroundColor White
Write-Host "  4. Back button -> retour au dashboard" -ForegroundColor White
Write-Host ""
