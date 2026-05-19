import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { getStockXPricing, usdToEur } from './stockx'
import type { Sneaker, PriceHistoryEntry } from './types'

const KEY_ALL = ['sneakers'] as const
const keyOne = (id: string) => ['sneakers', id] as const

/* =====================================================
 * READS
 * ===================================================== */

export function useSneakers() {
  return useQuery({
    queryKey: KEY_ALL,
    queryFn: async (): Promise<Sneaker[]> => {
      const { data, error } = await supabase
        .from('sneakers')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as Sneaker[]) ?? []
    },
  })
}

export function useSneaker(id: string | undefined) {
  return useQuery({
    queryKey: keyOne(id ?? ''),
    queryFn: async (): Promise<Sneaker> => {
      if (!id) throw new Error('id required')
      const { data, error } = await supabase
        .from('sneakers')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Sneaker
    },
    enabled: !!id,
  })
}

/* =====================================================
 * WRITES
 * ===================================================== */

export type SneakerInput = Omit<
  Sneaker,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'last_price_check' | 'price_history'
>

export function useCreateSneaker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SneakerInput): Promise<Sneaker> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('sneakers')
        .insert({ ...input, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as Sneaker
    },
    onSuccess: (sneaker) => {
      qc.invalidateQueries({ queryKey: KEY_ALL })
      qc.setQueryData(keyOne(sneaker.id), sneaker)
    },
  })
}

export function useUpdateSneaker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<SneakerInput>
    }): Promise<Sneaker> => {
      const { data, error } = await supabase
        .from('sneakers')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Sneaker
    },
    onSuccess: (sneaker) => {
      qc.invalidateQueries({ queryKey: KEY_ALL })
      qc.setQueryData(keyOne(sneaker.id), sneaker)
    },
  })
}

export function useDeleteSneaker() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      photoPath,
    }: {
      id: string
      photoPath: string | null
    }): Promise<void> => {
      // 1. Supprimer la photo dans Storage si elle existe
      if (photoPath) {
        // On ignore les erreurs de delete photo : si la photo n'existe plus,
        // on continue quand même à supprimer la ligne DB.
        await supabase.storage.from('sneaker-photos').remove([photoPath])
      }
      // 2. Supprimer la ligne DB
      const { error } = await supabase.from('sneakers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: KEY_ALL })
      qc.removeQueries({ queryKey: keyOne(vars.id) })
    },
  })
}

/* =====================================================
 * STOCKX — refresh a sneaker's market price
 * ===================================================== */

/**
 * Calls the stockx-pricing edge function, converts USD → EUR, and updates
 * the sneaker row with the new market_price (EUR), market_price_usd (raw),
 * stockx_variant_id (if newly resolved), last_price_check, and appends a
 * price_history entry. Bypasses SneakerInput's omit list intentionally.
 */
export function useRefreshMarketPrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sneaker: Sneaker): Promise<Sneaker> => {
      if (!sneaker.stockx_product_id) {
        throw new Error(
          'Pas lié au catalogue. Modifie la paire et utilise la recherche pour la lier.',
        )
      }
      if (!sneaker.stockx_variant_id && !sneaker.size_us) {
        throw new Error('Renseigne la taille US d\'abord.')
      }

      const pricing = await getStockXPricing({
        productId: sneaker.stockx_product_id,
        variantId: sneaker.stockx_variant_id ?? undefined,
        size: sneaker.stockx_variant_id ? undefined : sneaker.size_us ?? undefined,
      })

      // Use midPrice as the canonical "cote", or fall back to lowestAsk.
      const usd = pricing.midPrice ?? pricing.lowestAsk
      const eur = usdToEur(usd)

      const newEntry: PriceHistoryEntry = {
        date: pricing.fetchedAt,
        price: eur ?? 0,
        source: 'stockx',
      }

      const { data, error } = await supabase
        .from('sneakers')
        .update({
          market_price: eur,
          market_price_usd: usd,
          stockx_variant_id: pricing.variantId,
          last_price_check: pricing.fetchedAt,
          price_history: [...(sneaker.price_history ?? []), newEntry],
        })
        .eq('id', sneaker.id)
        .select()
        .single()

      if (error) throw error
      return data as Sneaker
    },
    onSuccess: (sneaker) => {
      qc.invalidateQueries({ queryKey: KEY_ALL })
      qc.setQueryData(keyOne(sneaker.id), sneaker)
    },
  })
}

/* =====================================================
 * STORAGE
 * ===================================================== */

const BUCKET = 'sneaker-photos'
const SIGNED_URL_TTL = 3600 // 1h

export interface UploadResult {
  /** Path stocké dans la colonne photo_url, ex: "{user_id}/uuid.jpg" */
  path: string
}

/**
 * Upload une photo dans le bucket privé. Le path commence par le user_id
 * pour matcher les policies RLS Storage.
 */
export async function uploadSneakerPhoto(file: File): Promise<UploadResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw error
  return { path }
}

/**
 * Génère une URL signée pour afficher une photo du bucket privé.
 * Cache 50min (l'URL expire après 1h).
 */
export function useSignedPhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['signed-photo', path],
    queryFn: async (): Promise<string | null> => {
      if (!path) return null
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL)
      if (error) throw error
      return data.signedUrl
    },
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
  })
}

/* =====================================================
 * BARCODE LOOKUP (UPCitemdb via Edge Function)
 * ===================================================== */

export interface LookupSuggestion {
  name: string
  brand: string | null
  colorway: string | null
  model: string | null
  size: string | null
  imageUrl: string | null
  category: string | null
  description: string | null
}

export interface BarcodeLookupResult {
  found: boolean
  source: 'upcitemdb' | null
  code: string
  suggestion: LookupSuggestion | null
  rawCount: number
  error?: string
}

/**
 * Appelle l'Edge Function `barcode-lookup` qui interroge UPCitemdb.
 * Renvoie un objet structuré toujours, même en cas d'échec (found: false).
 */
export async function lookupBarcode(code: string): Promise<BarcodeLookupResult> {
  try {
    const { data, error } = await supabase.functions.invoke<BarcodeLookupResult>(
      'barcode-lookup',
      { body: { code } },
    )
    if (error) {
      return {
        found: false,
        source: null,
        code,
        suggestion: null,
        rawCount: 0,
        error: error.message,
      }
    }
    if (!data) {
      return {
        found: false,
        source: null,
        code,
        suggestion: null,
        rawCount: 0,
        error: 'Empty response from lookup',
      }
    }
    return data
  } catch (err) {
    return {
      found: false,
      source: null,
      code,
      suggestion: null,
      rawCount: 0,
      error: (err as Error).message,
    }
  }
}
