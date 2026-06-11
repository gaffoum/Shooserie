/**
 * Pricing des commandes de stickers â€” deux types :
 *   - 'physical' (planche imprimee + expediee) : degressif
 *       1-4 planches : 6 EUR Â· 5-9 : 5 EUR Â· 10+ : 4 EUR (plancher)
 *   - 'digital' (PDF a telecharger) : degressif
 *       1-4 planches : 2 EUR Â· 5+ : 1.50 EUR
 * Prix PAR PLANCHE applique a toutes les planches selon le palier atteint.
 */

export type OrderType = 'digital' | 'physical'

export const STICKERS_PER_PLATE = 8

export function calculateNbPlanches(nbStickers: number): number {
  if (nbStickers <= 0) return 0
  return Math.ceil(nbStickers / STICKERS_PER_PLATE)
}

export function pricePerPlate(nbPlanches: number, type: OrderType): number {
  if (type === 'digital') return nbPlanches >= 5 ? 1.5 : 2
  if (nbPlanches >= 10) return 4
  if (nbPlanches >= 5) return 5
  return 6
}

export interface PricingResult {
  type: OrderType
  nbStickers: number
  nbPlanches: number
  pricePerPlate: number
  totalAmount: number
  /** nb de planches a ajouter pour baisser le prix unitaire + nouveau prix */
  nextTier?: {
    nbPlanchesNeeded: number
    newPricePerPlate: number
  }
}

export function calculatePricing(nbStickers: number, type: OrderType = 'physical'): PricingResult {
  const nbPlanches = calculateNbPlanches(nbStickers)
  const price = pricePerPlate(nbPlanches, type)
  const total = nbPlanches * price

  let nextTier: PricingResult['nextTier']
  for (let extra = 1; extra <= 50; extra++) {
    const np = nbPlanches + extra
    const newPrice = pricePerPlate(np, type)
    if (newPrice < price) {
      nextTier = { nbPlanchesNeeded: extra, newPricePerPlate: newPrice }
      break
    }
  }

  return {
    type,
    nbStickers,
    nbPlanches,
    pricePerPlate: price,
    totalAmount: total,
    nextTier,
  }
}

/** Formatte un montant EUR avec 2 decimales et symbole. */
export function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}