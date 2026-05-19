import { supabase } from './supabase'

/**
 * Wrapper for the StockX edge functions. All calls go through Supabase Edge
 * Functions (which proxy to api.stockx.com with our shared OAuth refresh
 * token, refreshed automatically server-side).
 */

/* =====================================================
 * TYPES — shapes returned by our edge functions
 * ===================================================== */

export interface StockXSearchHit {
  productId: string
  urlKey: string
  title: string
  brand: string | null
  productType: string | null
  styleId: string | null
  colorway: string | null
  color: string | null
  gender: string | null
  releaseDate: string | null
  retailPrice: number | null
}

export interface StockXVariant {
  variantId: string
  size: string | null
  /** Available size conversions (US M, EU, UK, CM, …) */
  sizes: Array<{ size?: string; type?: string }>
  /** UPC/EAN/GTIN codes for this size */
  gtins: string[]
}

export interface StockXProduct extends StockXSearchHit {
  imageUrl: string | null
  stockxUrl: string | null
  variants: StockXVariant[]
}

export interface StockXPricing {
  productId: string
  variantId: string
  size: string | null
  currency: string // "USD"
  lowestAsk: number | null
  highestBid: number | null
  midPrice: number | null
  fetchedAt: string
}

/* =====================================================
 * FX — StockX market-data is USD-locked, so we convert.
 * Update USD_TO_EUR_RATE if the rate drifts significantly.
 * ===================================================== */

export const USD_TO_EUR_RATE = 0.92

export function usdToEur(usd: number | null): number | null {
  if (usd === null || usd === undefined) return null
  return Math.round(usd * USD_TO_EUR_RATE)
}

/* =====================================================
 * CALLS
 * ===================================================== */

/**
 * Hits an edge function with GET + query params, attaching the user's auth
 * JWT (needed because verify_jwt=true on these functions).
 */
async function fnGet<T>(name: string, params: Record<string, string>): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Non authentifié')

  // Reach into the supabase client to get the base URL + anon key.
  const url = new URL(
    `${(supabase as unknown as { supabaseUrl: string }).supabaseUrl}/functions/v1/${name}`,
  )
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: (supabase as unknown as { supabaseKey: string }).supabaseKey,
    },
  })

  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Edge function ${name} returned non-JSON: ${text.slice(0, 200)}`)
  }
  if (!res.ok || (json as { error?: string }).error) {
    const msg = (json as { error?: string }).error ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  return json as T
}

/**
 * Free-text search of the StockX catalog. Returns up to 10 matching products.
 * Search hits do NOT include images — call getStockXProduct() to get one.
 */
export async function searchStockX(query: string): Promise<StockXSearchHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const data = await fnGet<{ products: StockXSearchHit[] }>('stockx-search', { q })
  return data.products ?? []
}

/**
 * Fetch full product detail by StockX productId. Returns variants (with GTINs)
 * and a derived image URL.
 */
export async function getStockXProduct(productId: string): Promise<StockXProduct> {
  return fnGet<StockXProduct>('stockx-product', { productId })
}

/**
 * Fetch current market data for one size of a StockX product.
 * Pass either { size } (US M as string like "10" or "10.5") OR { variantId }.
 */
export async function getStockXPricing(args: {
  productId: string
  size?: string
  variantId?: string
}): Promise<StockXPricing> {
  const params: Record<string, string> = { productId: args.productId }
  if (args.variantId) params.variantId = args.variantId
  else if (args.size) params.size = args.size
  else throw new Error('Provide either size or variantId')
  return fnGet<StockXPricing>('stockx-pricing', params)
}
