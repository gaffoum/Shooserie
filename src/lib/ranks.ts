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
