/**
 * Types pour la collection de sneakers.
 * Reflète la table `public.sneakers` (DB Supabase).
 */

export type SneakerCondition = 'DS' | 'VNDS' | 'Porté' | 'Très porté'

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
  photo_url: string | null
  barcode: string | null
  notes: string | null
  currency: string
  price_history: PriceHistoryEntry[]
  tags: string[]
  is_for_sale: boolean
  target_sale_price: number | null
  last_price_check: string | null
  created_at: string
  updated_at: string
}
