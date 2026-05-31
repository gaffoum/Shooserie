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