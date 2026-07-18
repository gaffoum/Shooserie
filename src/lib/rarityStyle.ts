/**
 * Couleurs de rareté « métaux » (handoff Niveau 2) — helper partagé par les
 * écrans Collection (Portfolio, classeur, détail). Source de vérité = tokens
 * CSS (--rarity-*). Voir aussi la classe .holo-grail pour le rendu animé grail.
 */
import type { RarityTier } from './types'

/** Couleur métal (bord/accent) du tier ; bordure neutre si inconnu. */
export function rarityMetal(r: RarityTier | null | undefined): string {
  switch (r) {
    case 'commune':
      return 'var(--rarity-commune)'
    case 'peu_commune':
      return 'var(--rarity-peu-commune)'
    case 'rare':
      return 'var(--rarity-rare)'
    case 'ultra_rare':
      return 'var(--rarity-ultra-rare)'
    case 'grail':
      return 'var(--rarity-grail)'
    default:
      return 'var(--color-border)'
  }
}

export function isGrail(r: RarityTier | null | undefined): boolean {
  return r === 'grail'
}

/** Un tier « classé » (≠ unknown) a-t-il un accent métal à afficher ? */
export function hasRarity(r: RarityTier | null | undefined): boolean {
  return !!r && r !== 'unknown'
}
