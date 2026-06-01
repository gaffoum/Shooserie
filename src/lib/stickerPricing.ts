/**
 * Pricing degressif pour les commandes de stickers physiques.
 *  - 1 planche : 5.00 EUR/u
 *  - 2-3 planches : 4.00 EUR/u
 *  - 4+ planches : 3.00 EUR/u
 * Livraison incluse (France metropolitaine).
 */

export const STICKERS_PER_PLATE = 8

export function calculateNbPlanches(nbStickers: number): number {
  if (nbStickers <= 0) return 0
  return Math.ceil(nbStickers / STICKERS_PER_PLATE)
}

export function pricePerPlate(nbPlanches: number): number {
  if (nbPlanches <= 1) return 5
  if (nbPlanches <= 3) return 4
  return 3
}

export interface PricingResult {
  nbStickers: number
  nbPlanches: number
  pricePerPlate: number
  totalAmount: number
  /** Le tier "atteint" : 1, 2, ou 3 */
  tier: 1 | 2 | 3
  /** Si applicable : nb de planches a ajouter pour passer au tier suivant + nouveau prix unitaire */
  nextTier?: {
    nbPlanchesNeeded: number
    newPricePerPlate: number
  }
}

export function calculatePricing(nbStickers: number): PricingResult {
  const nbPlanches = calculateNbPlanches(nbStickers)
  const price = pricePerPlate(nbPlanches)
  const total = nbPlanches * price

  let tier: 1 | 2 | 3
  if (nbPlanches <= 1) tier = 1
  else if (nbPlanches <= 3) tier = 2
  else tier = 3

  let nextTier: PricingResult['nextTier']
  if (tier === 1) {
    nextTier = { nbPlanchesNeeded: 2 - nbPlanches, newPricePerPlate: 4 }
  } else if (tier === 2) {
    nextTier = { nbPlanchesNeeded: 4 - nbPlanches, newPricePerPlate: 3 }
  }

  return {
    nbStickers,
    nbPlanches,
    pricePerPlate: price,
    totalAmount: total,
    tier,
    nextTier,
  }
}

/** Formatte un montant EUR avec 2 decimales et symbole. */
export function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}