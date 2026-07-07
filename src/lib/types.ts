/**
 * Types pour la collection de sneakers.
 * Reflète la table `public.sneakers` (DB Supabase).
 */

export type SneakerCondition = 'DS' | 'VNDS' | 'Porté' | 'Très porté'

/**
 * Palier de rareté — reflète l'enum `rarity_tier` en base (migration
 * 20260707120000_rarity_system). `unknown` = non encore classée.
 */
export type RarityTier =
  | 'unknown'
  | 'commune'
  | 'peu_commune'
  | 'rare'
  | 'ultra_rare'
  | 'grail'

export interface PriceHistoryEntry {
  date: string // ISO date
  price: number
  source: 'stockx' | 'manual'
}

export interface Sneaker {
  id: string
  user_id: string
  name: string
  brand: string | null
  colorway: string | null
  sku: string | null
  stockx_url: string | null
  stockx_image_url: string | null
  stockx_product_id: string | null
  stockx_variant_id: string | null
  size_eu: string | null
  size_us: string | null
  release_date: string | null
  release_price: number | null
  market_price: number | null
  market_price_usd: number | null
  purchase_date: string | null
  purchase_price: number | null
  condition: SneakerCondition | null
  wear_count?: number
  last_worn_at?: string | null
  photo_url: string | null
  barcode: string | null
  notes: string | null
  currency: string
  price_history: PriceHistoryEntry[]
  tags: string[]
  is_for_sale: boolean
  target_sale_price: number | null
  last_price_check: string | null
  // Système de rareté (migration additive, colonnes déjà en prod).
  // Optionnelles côté TS : `select('*')` les renvoie, mais les formulaires
  // de création n'ont pas à les fournir (défaut 'unknown' géré en base).
  rarity?: RarityTier
  rarity_source?: string
  rarity_score?: number | null
  release_type?: string | null
  sold_out?: boolean | null
  collection_number?: string | null
  created_at: string
  updated_at: string
}
