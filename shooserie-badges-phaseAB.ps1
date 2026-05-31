# ============================================================
#  Shooserie - Phase A+B : Badges + Facettes
#  1. Cree 7 SVG dans public/badges/
#  2. Cree src/lib/badges.ts (helper, hooks, constantes)
#  3. Cree src/components/BadgeDisplay.tsx
#  4. Cree src/components/FacetsList.tsx
#  5. Cree src/components/BadgeProgressBar.tsx
#  6. Patches : WelcomeHeader, UserProfile, AppHeader (defensifs)
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
Write-Host "=== Phase A+B : Badges + Facettes ===" -ForegroundColor Cyan
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
# 1. SVG badges dans public/badges/
# ============================================================
$lurkerSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bg-lurker" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4A148C" />
      <stop offset="100%" stop-color="#1A237E" />
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="90" height="90" rx="25" fill="url(#bg-lurker)" />
  <path d="M 15 50 C 30 25, 70 25, 85 50 C 70 75, 30 75, 15 50 Z" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="50" cy="50" r="11" fill="#FFFFFF" />
  <circle cx="54" cy="46" r="3" fill="#1A237E" />
</svg>
'@

$casualBeaterSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bg-casual-new" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#37474F" />
      <stop offset="100%" stop-color="#212121" />
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="90" height="90" rx="25" fill="url(#bg-casual-new)" />
  <path d="M20 62 C 20 62, 18 48, 28 46 C 32 45, 36 50, 42 42 C 48 34, 58 32, 66 32 C 74 32, 78 38, 80 50 L 80 62 Z" fill="#FFFFFF" />
  <path d="M20 56 L80 56 L80 62 L20 62 Z" fill="#CFD8DC" />
  <path d="M42 42 L55 50 L70 50" fill="none" stroke="#212121" stroke-width="3" stroke-linecap="round" />
</svg>
'@

$initiatedSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bg-initiated" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF9800" />
      <stop offset="100%" stop-color="#E65100" />
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="90" height="90" rx="25" fill="url(#bg-initiated)" />
  <path d="M50 20 C65 35 70 55 55 75 C45 65 40 55 45 40 C35 55 30 70 45 78 C30 70 30 45 50 20 Z" fill="#FFFFFF" />
</svg>
'@

$rotationSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bg-rotation-high-vis" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00E5FF" />
      <stop offset="100%" stop-color="#006064" />
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="90" height="90" rx="25" fill="url(#bg-rotation-high-vis)" />
  <g fill="#FFFFFF">
    <path d="M 24 44 A 26 26 0 0 1 68 30" fill="none" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" />
    <polygon points="64 16 86 32 60 46" />
  </g>
  <g fill="#FFFFFF">
    <path d="M 76 56 A 26 26 0 0 1 32 70" fill="none" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" />
    <polygon points="36 84 14 68 40 54" />
  </g>
</svg>
'@

$rockOrStockSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bg-balance" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8E24AA" />
      <stop offset="100%" stop-color="#3F51B5" />
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="90" height="90" rx="25" fill="url(#bg-balance)" />
  <line x1="50" y1="30" x2="50" y2="70" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
  <line x1="40" y1="70" x2="60" y2="70" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
  <line x1="25" y1="40" x2="75" y2="40" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" />
  <polygon points="25 40 20 55 30 55" fill="#FFFFFF" opacity="0.9" />
  <polygon points="75 40 70 55 80 55" fill="#FFFFFF" opacity="0.9" />
</svg>
'@

$grailHunterSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bg-grail" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFD700" />
      <stop offset="100%" stop-color="#FF8C00" />
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="90" height="90" rx="25" fill="url(#bg-grail)" />
  <polygon points="50 25 75 45 50 75 25 45" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round" />
  <line x1="25" y1="45" x2="75" y2="45" stroke="#FFFFFF" stroke-width="3" />
  <line x1="50" y1="25" x2="50" y2="75" stroke="#FFFFFF" stroke-width="2" />
</svg>
'@

$soleProviderSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="bg-ultimate" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#424242" />
      <stop offset="100%" stop-color="#212121" />
    </linearGradient>
  </defs>
  <rect x="5" y="5" width="90" height="90" rx="25" fill="url(#bg-ultimate)" />
  <path d="M25 65 L20 35 L37 48 L50 30 L63 48 L80 35 L75 65 Z" fill="#FFFFFF" />
  <rect x="25" y="68" width="50" height="4" rx="2" fill="#FFD700" />
</svg>
'@

Write-FileUtf8NoBom -Path "public/badges/lurker.svg" -Content $lurkerSvg
Write-FileUtf8NoBom -Path "public/badges/casual_beater.svg" -Content $casualBeaterSvg
Write-FileUtf8NoBom -Path "public/badges/initiated_on_feet.svg" -Content $initiatedSvg
Write-FileUtf8NoBom -Path "public/badges/rotation_specialist.svg" -Content $rotationSvg
Write-FileUtf8NoBom -Path "public/badges/rock_or_stock.svg" -Content $rockOrStockSvg
Write-FileUtf8NoBom -Path "public/badges/grail_hunter.svg" -Content $grailHunterSvg
Write-FileUtf8NoBom -Path "public/badges/sole_provider.svg" -Content $soleProviderSvg
Write-Host "  +  7 badges SVG ecrits dans public/badges/" -ForegroundColor Green

# ============================================================
# 2. src/lib/badges.ts : constantes + hooks
# ============================================================
$badgesTs = @'
/**
 * Système de gamification — grade sneakerhead + facettes.
 *
 * Phase A : grade calculé sur le nombre de paires (LURKER..SOLE_PROVIDER).
 * Phase B : facettes dérivées des données (diversite marques, value moy, etc.).
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

// =================================================================
// Types
// =================================================================

export type Grade = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type BadgeCode =
  | 'LURKER'
  | 'BEATER_CASUAL'
  | 'INITIATED_ON_FEET'
  | 'ROTATION_SPECIALIST'
  | 'ROCK_OR_STOCK'
  | 'GRAIL_HUNTER'
  | 'SOLE_PROVIDER'

export interface BadgeDefinition {
  code: BadgeCode
  grade: Grade
  label: string
  shortLabel: string
  emoji: string
  svgPath: string
  minPairs: number
  maxPairs: number | null
  description: string
  longDescription: string
  cta?: string
}

export const BADGES: Record<BadgeCode, BadgeDefinition> = {
  LURKER: {
    code: 'LURKER',
    grade: 0,
    label: 'Curieux',
    shortLabel: 'Lurker',
    emoji: '👀',
    svgPath: '/badges/lurker.svg',
    minPairs: 0,
    maxPairs: 0,
    description: 'Tu observes la commu mais t\'as pas encore franchi le pas.',
    longDescription:
      'Bienvenue chez les sneakerheads. Ta collec t\'attend. Ajoute ta première paire pour démarrer ton parcours.',
    cta: 'Ajoute ta première paire',
  },
  BEATER_CASUAL: {
    code: 'BEATER_CASUAL',
    grade: 1,
    label: 'Casual Beater',
    shortLabel: 'Beater',
    emoji: '👟',
    svgPath: '/badges/casual_beater.svg',
    minPairs: 1,
    maxPairs: 5,
    description: 'Les baskets sont utilitaires. Zéro stress, pas de boîtes empilées.',
    longDescription:
      'Tu possèdes les classiques de la rue (AF1, Dunk, Stan Smith). Portées au quotidien sans distinction.',
  },
  INITIATED_ON_FEET: {
    code: 'INITIATED_ON_FEET',
    grade: 2,
    label: 'Initié On-Feet',
    shortLabel: 'Initié',
    emoji: '🔥',
    svgPath: '/badges/initiated_on_feet.svg',
    minPairs: 6,
    maxPairs: 15,
    description: 'L\'engrenage a commencé. Tout ce qui est acheté finit aux pieds.',
    longDescription:
      'Tu maîtrises les apps de tirages au sort (SNKRS, Confirmed). Les premières boîtes s\'empilent.',
  },
  ROTATION_SPECIALIST: {
    code: 'ROTATION_SPECIALIST',
    grade: 3,
    label: 'Spécialiste Rotation',
    shortLabel: 'Rotation',
    emoji: '🔄',
    svgPath: '/badges/rotation_specialist.svg',
    minPairs: 16,
    maxPairs: 40,
    description: 'Tu peux tenir un mois sans porter deux fois la même paire.',
    longDescription:
      'Collection équilibrée (Air Max, Jordan, NB rétro). Le choix dépend de la météo et de l\'outfit.',
  },
  ROCK_OR_STOCK: {
    code: 'ROCK_OR_STOCK',
    grade: 4,
    label: 'Chasseur Rock or Stock',
    shortLabel: 'Rock or Stock',
    emoji: '⚖️',
    svgPath: '/badges/rock_or_stock.svg',
    minPairs: 41,
    maxPairs: 80,
    description: '"One to rock, one to stock". Le manque de place devient un sujet.',
    longDescription:
      'Suivi rigoureux de la valeur marchande. Stockage sur étagères dédiées. Des DS en attente, des paires portées en rotation.',
  },
  GRAIL_HUNTER: {
    code: 'GRAIL_HUNTER',
    grade: 5,
    label: 'Grail Hunter',
    shortLabel: 'Grail',
    emoji: '🏆',
    svgPath: '/badges/grail_hunter.svg',
    minPairs: 81,
    maxPairs: 150,
    description: 'La quantité importe moins que la rareté.',
    longDescription:
      'Tu abrites de vrais Grails (paires mythiques, collabs introuvables, OG d\'époque). Tu fais ton Legit Check toi-même.',
  },
  SOLE_PROVIDER: {
    code: 'SOLE_PROVIDER',
    grade: 6,
    label: 'Sole Provider',
    shortLabel: 'King',
    emoji: '👑',
    svgPath: '/badges/sole_provider.svg',
    minPairs: 151,
    maxPairs: null,
    description: 'Niveau ultime. Une pièce entière dédiée à la passion.',
    longDescription:
      'Sneaker Room, archiviste, flux constant. Gestion d\'inventaire ultra-méthodique.',
  },
}

// Liste ordonnee pour le calcul du grade suivant
const ORDERED_BADGES: BadgeDefinition[] = [
  BADGES.LURKER,
  BADGES.BEATER_CASUAL,
  BADGES.INITIATED_ON_FEET,
  BADGES.ROTATION_SPECIALIST,
  BADGES.ROCK_OR_STOCK,
  BADGES.GRAIL_HUNTER,
  BADGES.SOLE_PROVIDER,
]

export function computeGrade(pairCount: number): BadgeDefinition {
  if (pairCount <= 0) return BADGES.LURKER
  if (pairCount <= 5) return BADGES.BEATER_CASUAL
  if (pairCount <= 15) return BADGES.INITIATED_ON_FEET
  if (pairCount <= 40) return BADGES.ROTATION_SPECIALIST
  if (pairCount <= 80) return BADGES.ROCK_OR_STOCK
  if (pairCount <= 150) return BADGES.GRAIL_HUNTER
  return BADGES.SOLE_PROVIDER
}

export interface GradeProgress {
  current: BadgeDefinition
  next: BadgeDefinition | null
  pairsToGo: number
  progressPct: number
}

export function gradeProgress(pairCount: number): GradeProgress {
  const current = computeGrade(pairCount)
  const idx = ORDERED_BADGES.findIndex((b) => b.code === current.code)
  const next = idx + 1 < ORDERED_BADGES.length ? ORDERED_BADGES[idx + 1] : null

  if (!next) {
    return { current, next: null, pairsToGo: 0, progressPct: 100 }
  }

  const pairsToGo = Math.max(0, next.minPairs - pairCount)
  // Progress dans la tranche actuelle : 0% au minPairs, 100% au maxPairs
  const rangeStart = current.minPairs
  const rangeEnd = current.maxPairs ?? next.minPairs - 1
  const rangeSize = Math.max(1, rangeEnd - rangeStart + 1)
  const pos = pairCount - rangeStart
  const progressPct = Math.min(100, Math.max(0, Math.round((pos / rangeSize) * 100)))

  return { current, next, pairsToGo, progressPct }
}

// =================================================================
// Facettes (Phase B)
// =================================================================

export type FacetCode =
  | 'BRAND_DIVERSITY'
  | 'VALUE_CONNOISSEUR'
  | 'ACTIVE_WEARER'
  | 'PURE_COLLECTOR'
  | 'RESELL_GAME'

export interface FacetDefinition {
  code: FacetCode
  label: string
  emoji: string
  description: string
}

export const FACETS: Record<FacetCode, FacetDefinition> = {
  BRAND_DIVERSITY: {
    code: 'BRAND_DIVERSITY',
    label: 'Brand Diversity Master',
    emoji: '🌍',
    description: '4+ marques différentes dans la collec',
  },
  VALUE_CONNOISSEUR: {
    code: 'VALUE_CONNOISSEUR',
    label: 'Value Connoisseur',
    emoji: '💎',
    description: 'Cote moyenne supérieure à 250€',
  },
  ACTIVE_WEARER: {
    code: 'ACTIVE_WEARER',
    label: 'Active Wearer',
    emoji: '👟',
    description: 'Plus de 50% de tes paires ont été portées',
  },
  PURE_COLLECTOR: {
    code: 'PURE_COLLECTOR',
    label: 'Pure Collector',
    emoji: '🏛️',
    description: '90%+ de paires en DS — collection pure',
  },
  RESELL_GAME: {
    code: 'RESELL_GAME',
    label: 'Resell Game',
    emoji: '💰',
    description: '10%+ de paires en vente — resell game on point',
  },
}

interface FacetInput {
  total: number
  distinctBrands: number
  avgMarketValue: number
  pairsWithWears: number
  pairsForSale: number
}

export function computeFacets(input: FacetInput): FacetCode[] {
  if (input.total === 0) return []
  const facets: FacetCode[] = []

  if (input.distinctBrands >= 4) facets.push('BRAND_DIVERSITY')

  if (input.total >= 5 && input.avgMarketValue >= 250) {
    facets.push('VALUE_CONNOISSEUR')
  }

  const wearRatio = input.pairsWithWears / input.total
  if (input.total >= 5 && wearRatio > 0.5) facets.push('ACTIVE_WEARER')
  else if (input.total >= 30 && wearRatio < 0.1) facets.push('PURE_COLLECTOR')

  if (input.total >= 5 && input.pairsForSale / input.total > 0.1) {
    facets.push('RESELL_GAME')
  }

  return facets
}

// =================================================================
// Hooks
// =================================================================

export interface BadgeData {
  total: number
  badge: BadgeDefinition
  facets: FacetCode[]
  progress: GradeProgress
}

async function fetchBadgeData(userId: string): Promise<BadgeData> {
  const { data, error } = await supabase
    .from('sneakers')
    .select('brand, market_price, wear_count, is_for_sale')
    .eq('user_id', userId)

  if (error) throw error

  const sneakers = data ?? []
  const total = sneakers.length

  const brands = new Set<string>()
  let marketValueSum = 0
  let marketValueCount = 0
  let pairsWithWears = 0
  let pairsForSale = 0

  for (const s of sneakers) {
    if (s.brand) brands.add(s.brand as string)
    if (s.market_price != null) {
      marketValueSum += s.market_price as number
      marketValueCount++
    }
    if ((s.wear_count ?? 0) > 0) pairsWithWears++
    if (s.is_for_sale) pairsForSale++
  }

  const avgMarketValue = marketValueCount > 0 ? marketValueSum / marketValueCount : 0
  const badge = computeGrade(total)
  const facets = computeFacets({
    total,
    distinctBrands: brands.size,
    avgMarketValue,
    pairsWithWears,
    pairsForSale,
  })
  const progress = gradeProgress(total)

  return { total, badge, facets, progress }
}

/** Badge de l'utilisateur courant. */
export function useMyBadge() {
  const { data: userId } = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    },
    staleTime: 5 * 60 * 1000,
  })

  return useQuery({
    queryKey: ['my-badge', userId],
    enabled: !!userId,
    queryFn: () => fetchBadgeData(userId!),
    staleTime: 60 * 1000,
  })
}

/** Badge d'un user donne (pour les profils publics).
 *  Passe userId=undefined si la collection est privee — la query reste disabled.
 */
export function useUserBadge(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-badge', userId],
    enabled: !!userId,
    queryFn: () => fetchBadgeData(userId!),
    staleTime: 60 * 1000,
  })
}
'@
Write-FileUtf8NoBom -Path "src/lib/badges.ts" -Content $badgesTs
Write-Host "  +  src/lib/badges.ts" -ForegroundColor Green

# ============================================================
# 3. BadgeDisplay.tsx
# ============================================================
$badgeDisplayTsx = @'
/**
 * BadgeDisplay — affiche un badge (SVG + label optionnel).
 * 3 tailles : sm (24x24, inline), md (48x48, standard), lg (80x80, hero).
 */
import type { CSSProperties } from 'react'
import { BADGES, type BadgeCode } from '@/lib/badges'

interface BadgeDisplayProps {
  code: BadgeCode
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  /** Si true, affiche le label complet ('Chasseur Rock or Stock').
   *  Sinon le shortLabel ('Rock or Stock'). */
  longLabel?: boolean
}

const SIZE_PX: Record<NonNullable<BadgeDisplayProps['size']>, number> = {
  sm: 24,
  md: 48,
  lg: 80,
}

export function BadgeDisplay({
  code,
  size = 'md',
  showLabel = false,
  longLabel = false,
}: BadgeDisplayProps) {
  const badge = BADGES[code]
  const px = SIZE_PX[size]
  const label = longLabel ? badge.label : badge.shortLabel

  return (
    <span style={wrapperStyle} title={badge.description}>
      <img
        src={badge.svgPath}
        alt={badge.label}
        width={px}
        height={px}
        style={{ display: 'block', flexShrink: 0 }}
      />
      {showLabel && (
        <span style={size === 'lg' ? labelStyleLg : labelStyle}>{label}</span>
      )}
    </span>
  )
}

const wrapperStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: "'Outfit', sans-serif",
}

const labelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text, #0A0A0A)',
  letterSpacing: '0.01em',
}

const labelStyleLg: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--color-text, #0A0A0A)',
  letterSpacing: '-0.01em',
}
'@
Write-FileUtf8NoBom -Path "src/components/BadgeDisplay.tsx" -Content $badgeDisplayTsx
Write-Host "  +  src/components/BadgeDisplay.tsx" -ForegroundColor Green

# ============================================================
# 4. FacetsList.tsx
# ============================================================
$facetsListTsx = @'
/**
 * FacetsList — affiche les facettes (tags secondaires) sous le badge.
 * Petits chips avec emoji + label court.
 */
import type { CSSProperties } from 'react'
import { FACETS, type FacetCode } from '@/lib/badges'

interface FacetsListProps {
  facets: FacetCode[]
}

export function FacetsList({ facets }: FacetsListProps) {
  if (facets.length === 0) return null
  return (
    <div style={wrapStyle}>
      {facets.map((code) => {
        const f = FACETS[code]
        return (
          <span key={code} style={chipStyle} title={f.description}>
            <span style={emojiStyle}>{f.emoji}</span>
            <span>{f.label}</span>
          </span>
        )
      })}
    </div>
  )
}

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  fontFamily: "'Outfit', sans-serif",
}

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 8px',
  background: 'var(--color-bg, #F9FAFB)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--color-text, #0A0A0A)',
  whiteSpace: 'nowrap',
}

const emojiStyle: CSSProperties = {
  fontSize: 12,
  lineHeight: 1,
}
'@
Write-FileUtf8NoBom -Path "src/components/FacetsList.tsx" -Content $facetsListTsx
Write-Host "  +  src/components/FacetsList.tsx" -ForegroundColor Green

# ============================================================
# 5. BadgeProgressBar.tsx
# ============================================================
$badgeProgressTsx = @'
/**
 * BadgeProgressBar — montre la progression vers le grade suivant.
 * "Tu es a X paires du grade Y" + barre.
 */
import type { CSSProperties } from 'react'
import { type GradeProgress } from '@/lib/badges'

interface BadgeProgressBarProps {
  progress: GradeProgress
}

export function BadgeProgressBar({ progress }: BadgeProgressBarProps) {
  if (!progress.next) {
    return (
      <div style={maxedStyle}>
        👑 Tu es au sommet — grade maximum atteint
      </div>
    )
  }

  return (
    <div style={wrapStyle}>
      <div style={textRowStyle}>
        <span style={textStyle}>
          Plus que <strong>{progress.pairsToGo}</strong>{' '}
          {progress.pairsToGo === 1 ? 'paire' : 'paires'} avant{' '}
          <strong>{progress.next.label}</strong>
        </span>
        <span style={pctStyle}>{progress.progressPct}%</span>
      </div>
      <div style={trackStyle}>
        <div style={{ ...fillStyle, width: `${progress.progressPct}%` }} />
      </div>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  margin: '8px 0',
}

const textRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 6,
}

const textStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted, #6B7280)',
}

const pctStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-muted, #6B7280)',
  fontVariantNumeric: 'tabular-nums',
}

const trackStyle: CSSProperties = {
  height: 6,
  background: 'var(--color-bg, #F3F4F6)',
  borderRadius: 999,
  overflow: 'hidden',
}

const fillStyle: CSSProperties = {
  height: '100%',
  background: 'var(--color-bred, #CE1141)',
  borderRadius: 999,
  transition: 'width 300ms ease',
}

const maxedStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text, #0A0A0A)',
  textAlign: 'center',
  padding: '8px 12px',
  background: 'var(--color-bg, #F9FAFB)',
  borderRadius: 8,
}
'@
Write-FileUtf8NoBom -Path "src/components/BadgeProgressBar.tsx" -Content $badgeProgressTsx
Write-Host "  +  src/components/BadgeProgressBar.tsx" -ForegroundColor Green

# ============================================================
# 6. Patch WelcomeHeader.tsx (defensif)
# ============================================================
$wlPath = "src/components/WelcomeHeader.tsx"
if (-not (Test-Path $wlPath)) {
    Write-Host "WARN  $wlPath introuvable, skip" -ForegroundColor Yellow
} else {
    $wl = Read-FileUtf8 $wlPath

    if ($wl -match "useMyBadge|BadgeDisplay") {
        Write-Host "  =  Badge deja integre dans WelcomeHeader" -ForegroundColor DarkGray
    } else {
        # 6a. Imports : ajoute apres la derniere ligne d'import
        $lines = $wl -split "`r?`n"
        $lastImpIdx = -1
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^import\s") { $lastImpIdx = $i }
        }
        if ($lastImpIdx -ge 0) {
            # Verifier que l'import au-dessus est complet (pas un import multiligne)
            # Strategie : avancer jusqu'a la prochaine ligne non-import
            while ($lastImpIdx + 1 -lt $lines.Count -and $lines[$lastImpIdx + 1] -notmatch "^import\s" -and ($lines[$lastImpIdx] -match "^import\s*\{?\s*$" -or $lines[$lastImpIdx + 1] -match "^\s+[a-zA-Z]" -or $lines[$lastImpIdx + 1] -match "^\}")) {
                $lastImpIdx++
                if ($lines[$lastImpIdx] -match "^\}\s+from") { break }
            }
            $before = $lines[0..$lastImpIdx]
            $after = if ($lastImpIdx + 1 -lt $lines.Count) { $lines[($lastImpIdx + 1)..($lines.Count - 1)] } else { @() }
            $newLines = @($before) +
                "import { useMyBadge } from '@/lib/badges'" +
                "import { BadgeDisplay } from './BadgeDisplay'" +
                "import { FacetsList } from './FacetsList'" +
                "import { BadgeProgressBar } from './BadgeProgressBar'" +
                @($after)
            $wl = $newLines -join "`r`n"
            Write-Host "  +  Imports badges ajoutes a WelcomeHeader" -ForegroundColor Green
        }

        # 6b. Hook + JSX : besoin de voir le code pour patcher. On affiche un guide.
        Write-FileUtf8NoBom -Path $wlPath -Content $wl
        Write-Host ""
        Write-Host "  IMPORTANT : Ajoute MANUELLEMENT dans WelcomeHeader.tsx :" -ForegroundColor Yellow
        Write-Host "    1. Au top de la fonction :  const badgeQ = useMyBadge()" -ForegroundColor White
        Write-Host "    2. Apres ton h1 'Salut Layon !' :" -ForegroundColor White
        Write-Host "       {badgeQ.data && (" -ForegroundColor White
        Write-Host "         <div style={{ marginTop: 12 }}>" -ForegroundColor White
        Write-Host "           <BadgeDisplay code={badgeQ.data.badge.code} size=`"lg`" showLabel longLabel />" -ForegroundColor White
        Write-Host "           <div style={{ marginTop: 8 }}>" -ForegroundColor White
        Write-Host "             <FacetsList facets={badgeQ.data.facets} />" -ForegroundColor White
        Write-Host "           </div>" -ForegroundColor White
        Write-Host "           <BadgeProgressBar progress={badgeQ.data.progress} />" -ForegroundColor White
        Write-Host "         </div>" -ForegroundColor White
        Write-Host "       )}" -ForegroundColor White
        Write-Host ""
    }
}

# ============================================================
# 7. Patch UserProfile.tsx : badge sur profil public
# ============================================================
$upPath = "src/pages/UserProfile.tsx"
if (-not (Test-Path $upPath)) {
    Write-Host "WARN  $upPath introuvable, skip" -ForegroundColor Yellow
} else {
    $up = Read-FileUtf8 $upPath

    if ($up -match "useUserBadge") {
        Write-Host "  =  useUserBadge deja integre dans UserProfile" -ForegroundColor DarkGray
    } else {
        # Import : apres l'import publicProfileQueries (multiligne, on anchor sur le } from)
        $importAnchor = "} from '../lib/publicProfileQueries'"
        if ($up.Contains($importAnchor)) {
            $up = $up.Replace(
                $importAnchor,
                "$importAnchor`r`nimport { useUserBadge } from '../lib/badges'`r`nimport { BadgeDisplay } from '../components/BadgeDisplay'`r`nimport { FacetsList } from '../components/FacetsList'"
            )
            Write-Host "  +  Imports badge ajoutes a UserProfile" -ForegroundColor Green
        }

        Write-FileUtf8NoBom -Path $upPath -Content $up
        Write-Host ""
        Write-Host "  IMPORTANT : Ajoute MANUELLEMENT dans UserProfile.tsx :" -ForegroundColor Yellow
        Write-Host "    1. Pres des autres hooks (apres useUserSneakers) :" -ForegroundColor White
        Write-Host "       const badgeQ = useUserBadge(" -ForegroundColor White
        Write-Host "         profile?.collection_public ? profile.id : undefined" -ForegroundColor White
        Write-Host "       )" -ForegroundColor White
        Write-Host ""
        Write-Host "    2. Dans le header du profil (pres du pseudo) :" -ForegroundColor White
        Write-Host "       {badgeQ.data && (" -ForegroundColor White
        Write-Host "         <div style={{ marginTop: 8 }}>" -ForegroundColor White
        Write-Host "           <BadgeDisplay code={badgeQ.data.badge.code} size=`"md`" showLabel />" -ForegroundColor White
        Write-Host "           <div style={{ marginTop: 6 }}>" -ForegroundColor White
        Write-Host "             <FacetsList facets={badgeQ.data.facets} />" -ForegroundColor White
        Write-Host "           </div>" -ForegroundColor White
        Write-Host "         </div>" -ForegroundColor White
        Write-Host "       )}" -ForegroundColor White
        Write-Host ""
    }
}

# ============================================================
# 8. Patch AppHeader.tsx : petite version icone-seule
# ============================================================
$ahPath = "src/components/AppHeader.tsx"
if (-not (Test-Path $ahPath)) {
    Write-Host "WARN  $ahPath introuvable, skip" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "  IMPORTANT : Pour AppHeader.tsx, ajoute manuellement :" -ForegroundColor Yellow
    Write-Host "    Import : import { useMyBadge } from '@/lib/badges'" -ForegroundColor White
    Write-Host "             import { BadgeDisplay } from './BadgeDisplay'" -ForegroundColor White
    Write-Host "    Hook : const badgeQ = useMyBadge()" -ForegroundColor White
    Write-Host "    JSX (a cote du Logo, masque sous 640px) :" -ForegroundColor White
    Write-Host "      {badgeQ.data && (" -ForegroundColor White
    Write-Host "        <span className=`"app-header-action-text`" style={{ marginLeft: 8 }}>" -ForegroundColor White
    Write-Host "          <BadgeDisplay code={badgeQ.data.badge.code} size=`"sm`" />" -ForegroundColor White
    Write-Host "        </span>" -ForegroundColor White
    Write-Host "      )}" -ForegroundColor White
    Write-Host ""
}

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Get-ChildItem public/badges/*.svg | ForEach-Object { "  + $($_.Name)" }
Get-ChildItem src/lib/badges.ts, src/components/BadgeDisplay.tsx, src/components/FacetsList.tsx, src/components/BadgeProgressBar.tsx -ErrorAction SilentlyContinue |
    ForEach-Object { "  + $($_.FullName.Replace((Get-Location).Path, '.').Replace('\','/'))" }

# Anti double-encodage
$bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path "src/lib/badges.ts"))
$u = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($u -match "Ã©|Ã¨|Ã |Ã€") {
    Write-Host "  ERREUR : double-encodage badges.ts" -ForegroundColor Red
} else {
    Write-Host "  OK : badges.ts UTF-8 propre" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Phase A+B fondations livrees ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Reste les 3 insertions JSX manuelles (WelcomeHeader, UserProfile, AppHeader)." -ForegroundColor Yellow
Write-Host "Envoie-moi le contenu de WelcomeHeader.tsx et la zone header de UserProfile.tsx" -ForegroundColor Yellow
Write-Host "et je te livre les patches surgicaux dans le prochain message." -ForegroundColor Yellow
Write-Host ""
Write-Host "En attendant tu peux deja faire :" -ForegroundColor Yellow
Write-Host "  npm run build  # doit passer (fichiers crees, pas encore utilises)" -ForegroundColor White
Write-Host ""
