/**
 * Système de rangs (étoiles) — mapping central clé technique → affichage.
 *
 * La valeur en base (`profiles.rank`) est une clé technique ; le nom affiché
 * est un nom figé « militaire sneaker » (identique fr/en). Les fichiers
 * d'icônes ont été nommés différemment par le designer : NE PAS déduire le
 * rang du nom de fichier — seule cette table fait foi.
 */

export type RankKey =
  | 'rookie'
  | 'sneakerhead'
  | 'collector'
  | 'curator'
  | 'connoisseur'
  | 'plug'
  | 'legend'

export interface RankDisplay {
  /** Clé technique (valeur de profiles.rank) */
  key: RankKey
  /** Nom affiché (figé, identique dans toutes les langues) */
  label: string
  /** Seuil d'étoiles pour atteindre ce rang */
  threshold: number
  /** Écusson — thème clair */
  iconLight: string
  /** Écusson — thème sombre */
  iconDark: string
}

const ICON_BASE = '/app-icons/rangs'
const ICON_EXT = 'svg'

function icons(file: string): Pick<RankDisplay, 'iconLight' | 'iconDark'> {
  return {
    iconLight: `${ICON_BASE}/${file}.${ICON_EXT}`,
    iconDark: `${ICON_BASE}/${file}-dark.${ICON_EXT}`,
  }
}

export const RANKS: readonly RankDisplay[] = [
  { key: 'rookie', label: 'Rookie', threshold: 0, ...icons('rang-1-rookie') },
  { key: 'sneakerhead', label: 'Drop Scout', threshold: 150, ...icons('rang-2-soldier') },
  { key: 'collector', label: 'Corporal Cop', threshold: 500, ...icons('rang-3-sergeant') },
  { key: 'curator', label: 'Sole Sergeant', threshold: 1200, ...icons('rang-4-lieutenant') },
  { key: 'connoisseur', label: 'Kick Lieutenant', threshold: 3000, ...icons('rang-5-grail-captain') },
  { key: 'plug', label: 'Grail Captain', threshold: 6000, ...icons('rang-6-colonel') },
  { key: 'legend', label: 'General OG', threshold: 12000, ...icons('rang-7-general-og') },
] as const

/**
 * Résout une clé de rang (venant de la base) vers son affichage.
 * Fallback gracieux : clé inconnue / null / environnement sans moteur
 * d'étoiles → Rookie.
 */
export function getRankDisplay(rank: string | null | undefined): RankDisplay {
  return RANKS.find((r) => r.key === rank) ?? RANKS[0]
}

/**
 * Position d'un rang dans la hiérarchie (0 = Rookie … 6 = General OG).
 * Clé inconnue → 0. Sert à détecter une *montée* de rang (comparaison d'index).
 */
export function getRankIndex(rank: string | null | undefined): number {
  const i = RANKS.findIndex((r) => r.key === rank)
  return i < 0 ? 0 : i
}

export interface RankProgress {
  /** Rang courant dérivé du total d'étoiles */
  current: RankDisplay
  /** Rang suivant, ou null si rang maximal atteint */
  next: RankDisplay | null
  /** Étoiles restantes avant le rang suivant (0 si rang max) */
  reste: number
  /** Progression vers le rang suivant, borné 0–100 (100 si rang max) */
  pct: number
  /** true si l'utilisateur est au rang maximal (General OG) */
  isMax: boolean
}

/**
 * Calcule la progression vers le rang suivant à partir du total d'étoiles.
 * Dérive le rang courant des seuils (source de vérité = RANKS), indépendamment
 * de profiles.rank. Centralisé ici pour être réutilisé (badge, Guide, page
 * progression à venir).
 *
 * Fallback gracieux : total null/undefined → traité comme 0 (Rookie, barre à 0).
 * Cas rang max (legend / ≥ 12000) : next=null, reste=0, pct=100, isMax=true.
 */
export function getRankProgress(starsTotal: number | null | undefined): RankProgress {
  const total = Math.max(0, starsTotal ?? 0)

  // Rang courant = dernier palier dont le seuil est atteint.
  let currentIndex = 0
  for (let i = 0; i < RANKS.length; i++) {
    if (total >= RANKS[i].threshold) currentIndex = i
  }

  const current = RANKS[currentIndex]
  const next = RANKS[currentIndex + 1] ?? null

  if (!next) {
    return { current, next: null, reste: 0, pct: 100, isMax: true }
  }

  const span = next.threshold - current.threshold
  const rawPct = span > 0 ? ((total - current.threshold) / span) * 100 : 0
  const pct = Math.min(100, Math.max(0, rawPct))
  const reste = Math.max(0, next.threshold - total)

  return { current, next, reste, pct, isMax: false }
}
