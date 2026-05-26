import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { getStockXPricing, lookupBarcodeOnStockX, usdToEur } from './stockx'
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
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return []
      const { data, error } = await supabase
        .from('sneakers')
        .select('*')
        .eq('user_id', userData.user.id) // ← FIX : filtrer explicitement par owner
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
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('not authenticated')
      const { data, error } = await supabase
        .from('sneakers')
        .select('*')
        .eq('id', id)
        .eq('user_id', userData.user.id) // ← FIX : seulement MA sneaker
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

/**
 * Refresh the market price for every sneaker linked to the catalog and
 * with a known size. Runs sequentially to avoid rate-limiting. Tracks
 * progress so the UI can show "X/N en cours". Returns errors per failed
 * sneaker at the end.
 */
export function useRefreshAllMarketPrices() {
  const refresh = useRefreshMarketPrice()
  const qc = useQueryClient()
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [errors, setErrors] = useState<Array<{ id: string; name: string; error: string }>>([])
  const [running, setRunning] = useState(false)

  const start = async (sneakers: Sneaker[]) => {
    const eligible = sneakers.filter(
      (s) => s.stockx_product_id && (s.stockx_variant_id || s.size_us),
    )
    setRunning(true)
    setProgress({ done: 0, total: eligible.length })
    setErrors([])

    const failures: Array<{ id: string; name: string; error: string }> = []
    for (let i = 0; i < eligible.length; i++) {
      const s = eligible[i]
      try {
        await refresh.mutateAsync(s)
      } catch (e) {
        failures.push({ id: s.id, name: s.name, error: (e as Error).message })
      }
      setProgress({ done: i + 1, total: eligible.length })
    }

    setErrors(failures)
    setRunning(false)
    qc.invalidateQueries({ queryKey: KEY_ALL })
  }

  return { start, running, progress, errors }
}

/* =====================================================
 * ADMIN — user count visible only on the admin account
 * ===================================================== */

export const ADMIN_EMAIL = 'gaffoum@gmail.com'

/**
 * Returns the total auth users count. Only fires when the current session
 * belongs to ADMIN_EMAIL (the edge function ALSO enforces this server-side,
 * so it's safe even if the gate is bypassed client-side).
 */
export function useUserCount(currentEmail: string | null | undefined) {
  return useQuery({
    queryKey: ['stats', 'users'],
    queryFn: async (): Promise<number> => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Non authentifié')

      const url = `${(supabase as unknown as { supabaseUrl: string }).supabaseUrl}/functions/v1/stats-users`
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: (supabase as unknown as { supabaseKey: string }).supabaseKey,
        },
      })
      const text = await res.text()
      let body: unknown
      try {
        body = JSON.parse(text)
      } catch {
        throw new Error(`Non-JSON: ${text.slice(0, 200)}`)
      }
      if (!res.ok || (body as { error?: string }).error) {
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      return (body as { count: number }).count
    },
    enabled: currentEmail === ADMIN_EMAIL,
    staleTime: 5 * 60 * 1000, // 5 min
    refetchOnWindowFocus: false,
  })
}

/**
 * Rich admin dashboard stats — aggregate JSON of users, sneakers, time-series,
 * and top-N rankings. Calls the SQL function `admin_dashboard_stats()` which
 * is gated server-side by `auth.email() = ADMIN_EMAIL`. Safe to expose: a
 * non-admin caller gets a 'Forbidden' error from Postgres.
 */
export interface AdminStats {
  totalUsers: number
  newUsers24h: number
  newUsers7d: number
  activeUsers7d: number
  totalSneakers: number
  newSneakers24h: number
  newSneakers7d: number
  forSaleCount: number
  totalMarketValue: number
  totalInvested: number
  signupsByDay: Array<{ d: string; c: number }>
  pairsByDay: Array<{ d: string; c: number }>
  recentUsers: Array<{
    email: string
    created_at: string
    last_sign_in_at: string | null
    pair_count: number
  }>
  topBrands: Array<{ brand: string; count: number }>
  topCollectors: Array<{
    email: string
    pair_count: number
    collec_value: number
  }>
  generatedAt: string
}

export function useAdminDashboardStats(currentEmail: string | null | undefined) {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async (): Promise<AdminStats> => {
      const { data, error } = await supabase.rpc('admin_dashboard_stats')
      if (error) throw new Error(error.message)
      return data as AdminStats
    },
    enabled: currentEmail === ADMIN_EMAIL,
    // Auto-refresh every 60s so the admin dashboard feels live without manual
    // refresh. Reasonable for an internal-only page.
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })
}

/* =====================================================
 * COMMUNITY — how many users own each model.
 *
 * Two read-only RPCs that aggregate ownership counts across the whole user
 * base, exposing only counts (never identities). Both run as SECURITY DEFINER
 * server-side, so RLS on `sneakers` stays scoped to the current user.
 * ===================================================== */

/**
 * Batch lookup: for a given list of stockx_product_ids, returns a map of
 * `productId → ownerCount`. Used by the Dashboard to enrich every card in a
 * single round-trip instead of N+1 fetches.
 *
 * Empty / invalid IDs are filtered out and the query is short-circuited when
 * the list is empty, so cards without a StockX link cost nothing.
 */
export function useModelOwnerCounts(productIds: Array<string | null | undefined>) {
  // Deduplicate + sort for a stable cache key. The hook is called from the
  // Dashboard with an array that can change order on each render, so we
  // canonicalise before letting React Query see it.
  const uniqueIds = useMemo(
    () =>
      Array.from(
        new Set(productIds.filter((id): id is string => Boolean(id))),
      ).sort(),
    [productIds],
  )

  return useQuery({
    queryKey: ['model-owner-counts', uniqueIds.join(',')],
    queryFn: async (): Promise<Record<string, number>> => {
      if (uniqueIds.length === 0) return {}
      const { data, error } = await supabase.rpc('get_model_owner_counts', {
        product_ids: uniqueIds,
      })
      if (error) throw new Error(error.message)
      const out: Record<string, number> = {}
      for (const row of (data ?? []) as Array<{
        stockx_product_id: string
        owner_count: number
      }>) {
        out[row.stockx_product_id] = Number(row.owner_count)
      }
      return out
    },
    enabled: uniqueIds.length > 0,
    // Counts barely move minute-to-minute; 5 min keeps things fresh enough
    // without spamming the DB on every dashboard mount.
    staleTime: 5 * 60 * 1000,
  })
}

export interface TopOwnedModel {
  stockx_product_id: string
  owner_count: number
  name: string
  brand: string | null
  stockx_image_url: string | null
}

/**
 * Leaderboard of the N most-owned models across the user base. Returns an
 * array sorted by descending owner_count. Empty when no sneaker has been
 * linked to the catalog yet (a fresh app), so callers should hide the
 * section in that case.
 */
export function useTopOwnedModels(limit: number = 5) {
  return useQuery({
    queryKey: ['top-owned-models', limit],
    queryFn: async (): Promise<TopOwnedModel[]> => {
      const { data, error } = await supabase.rpc('get_top_owned_models', {
        limit_count: limit,
      })
      if (error) throw new Error(error.message)
      return (data ?? []).map((row: TopOwnedModel) => ({
        ...row,
        owner_count: Number(row.owner_count),
      }))
    },
    staleTime: 5 * 60 * 1000,
  })
}

/* =====================================================
 * SHARE LINKS — public read-only collection sharing.
 *
 * Users can mint an unguessable token, send the URL `/share/<token>` to a
 * friend, and revoke at any time. The recipient does NOT need an account.
 * Server-side, `get_shared_collection(token)` returns only the public fields
 * (no purchase price, notes, etc.) — see the SQL migration for the exact
 * field allowlist.
 * ===================================================== */

export interface ShareLink {
  token: string
  user_id: string
  created_at: string
  is_active: boolean
  label: string | null
}

export interface SharedSneaker {
  id: string
  name: string
  brand: string | null
  colorway: string | null
  sku: string | null
  size_eu: string | null
  size_us: string | null
  release_price: number | null
  market_price: number | null
  stockx_image_url: string | null
  is_for_sale: boolean
  created_at: string
}

export interface SharedCollectionResult {
  ok: boolean
  error?: 'NotFound' | 'Revoked'
  token?: string
  label?: string | null
  ownerEmail?: string
  createdAt?: string
  sneakers?: SharedSneaker[]
}

/** Lists the current user's share links (active + inactive). */
export function useMyShareLinks() {
  return useQuery({
    queryKey: ['share-links'],
    queryFn: async (): Promise<ShareLink[]> => {
      const { data, error } = await supabase
        .from('shared_collections')
        .select('token, user_id, created_at, is_active, label')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

/**
 * Mint a new share token. Returns the inserted row including the token.
 * Token is generated client-side using crypto.randomUUID() (128-bit entropy,
 * cryptographically random) — collisions are astronomically unlikely.
 */
export function useCreateShareLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ label }: { label?: string } = {}): Promise<ShareLink> => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Non authentifié')
      const token = crypto.randomUUID()
      const { data, error } = await supabase
        .from('shared_collections')
        .insert({
          token,
          user_id: session.user.id,
          label: label ?? null,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data as ShareLink
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['share-links'] })
    },
  })
}

/** Soft-revoke a share link (set is_active=false). Recipients get a friendly
 *  "lien désactivé" error on the public page after this. */
export function useRevokeShareLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase
        .from('shared_collections')
        .update({ is_active: false })
        .eq('token', token)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['share-links'] })
    },
  })
}

/** Hard-delete a share link (no recovery). Used when the user wants to clean
 *  up their list. The recipient gets the same NotFound error as for an
 *  unknown token — indistinguishable from "the token never existed". */
export function useDeleteShareLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase
        .from('shared_collections')
        .delete()
        .eq('token', token)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['share-links'] })
    },
  })
}

/** Public RPC — resolve a share token to the owner's sneakers. Anonymous
 *  callers are allowed (the token IS the access). Returns a structured
 *  result so the page can show clear NotFound / Revoked messages. */
export function useSharedCollection(token: string | undefined) {
  return useQuery({
    queryKey: ['shared-collection', token],
    queryFn: async (): Promise<SharedCollectionResult> => {
      if (!token) return { ok: false, error: 'NotFound' }
      const { data, error } = await supabase.rpc('get_shared_collection', {
        p_token: token,
      })
      if (error) throw new Error(error.message)
      return data as SharedCollectionResult
    },
    enabled: !!token,
    staleTime: 60 * 1000,
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
 * BARCODE LOOKUP (StockX d'abord, UPCitemdb en fallback)
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
  source: 'stockx' | 'upcitemdb' | null
  code: string
  suggestion: LookupSuggestion | null
  /** Filled when source === 'stockx': enables direct catalog linking. */
  stockxLink?: {
    productId: string
    variantId: string
    urlKey: string | null
    stockxUrl: string | null
    styleId: string | null
    sizeUS: string | null
    sizeEU: string | null
    releaseDate: string | null
    retailPrice: number | null
  }
  rawCount: number
  error?: string
}

/**
 * Try the StockX catalog first (richer data, exact variant for the scanned
 * size, productId we can link to). Fall back to the UPCitemdb edge function
 * when StockX has no match (typical for older or low-volume models).
 */
export async function lookupBarcode(code: string): Promise<BarcodeLookupResult> {
  // 1. StockX
  try {
    const sx = await lookupBarcodeOnStockX(code)
    if (sx.found && sx.product) {
      const p = sx.product
      return {
        found: true,
        source: 'stockx',
        code,
        suggestion: {
          name: p.title,
          brand: p.brand,
          colorway: p.colorway,
          model: p.styleId,
          size: p.sizeUS,
          imageUrl: p.imageUrl,
          category: null,
          description: null,
        },
        stockxLink: {
          productId: p.productId,
          variantId: p.variantId,
          urlKey: p.urlKey,
          stockxUrl: p.stockxUrl,
          styleId: p.styleId,
          sizeUS: p.sizeUS,
          sizeEU: p.sizeEU,
          releaseDate: p.releaseDate,
          retailPrice: p.retailPrice,
        },
        rawCount: 1,
      }
    }
  } catch {
    // ignore, fall through to UPCitemdb
  }

  // 2. UPCitemdb fallback
  try {
    const { data, error } = await supabase.functions.invoke<{
      found: boolean
      source: 'upcitemdb' | null
      code: string
      suggestion: LookupSuggestion | null
      rawCount: number
      error?: string
    }>('barcode-lookup', { body: { code } })

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
    return {
      found: data.found,
      source: data.source,
      code: data.code,
      suggestion: data.suggestion,
      rawCount: data.rawCount,
      error: data.error,
    }
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

/* =====================================================
 * AJOUTER CE CONTENU À LA FIN DE src/lib/queries.ts
 * (juste avant la dernière accolade fermante du fichier
 * si elle existe, sinon à la toute fin)
 * ===================================================== */

/* =====================================================
 * MARKETPLACE — Profile (visibilité collection)
 * ===================================================== */

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  collection_public: boolean
  pseudo_configured: boolean
  created_at: string
  updated_at: string
}

const PROFILE_KEY = ['profile'] as const

export function useMyProfile() {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: async (): Promise<Profile | null> => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.user.id)
        .maybeSingle()
      if (error) throw error
      return data as Profile | null
    },
  })
}

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('not authenticated')
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', userData.user.id)
        .select()
        .single()
      if (error) throw error
      return data as Profile
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY })
    },
  })
}

/* =====================================================
 * MARKETPLACE — Sneakers à vendre (tous users)
 * ===================================================== */

export interface MarketplaceSneaker extends Sneaker {
  seller_name: string | null
}

export function useMarketplaceSneakers() {
  return useQuery({
    queryKey: ['marketplace', 'sneakers'],
    queryFn: async (): Promise<MarketplaceSneaker[]> => {
      // 1) Récupérer les sneakers en vente
      const { data: sneakers, error } = await supabase
        .from('sneakers')
        .select('*')
        .eq('is_for_sale', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!sneakers || sneakers.length === 0) return []

      // 2) Récupérer les profiles des vendeurs
      const userIds = Array.from(new Set(sneakers.map((s: any) => s.user_id)))
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds)

      const profileMap = new Map<string, string | null>()
      ;(profiles ?? []).forEach((p: any) => profileMap.set(p.id, p.display_name))

      return sneakers.map((s: any) => ({
        ...s,
        seller_name: profileMap.get(s.user_id) ?? null,
      })) as MarketplaceSneaker[]
    },
  })
}

export function useMarketplaceSneaker(id: string | undefined) {
  return useQuery({
    queryKey: ['marketplace', 'sneaker', id],
    enabled: !!id,
    queryFn: async (): Promise<MarketplaceSneaker | null> => {
      if (!id) return null
      const { data: sneaker, error } = await supabase
        .from('sneakers')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      if (!sneaker) return null

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', (sneaker as any).user_id)
        .maybeSingle()

      return {
        ...(sneaker as any),
        seller_name: (profile as any)?.display_name ?? null,
      } as MarketplaceSneaker
    },
  })
}

/* =====================================================
 * MESSAGING — Conversations
 * ===================================================== */

export interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  sneaker_id: string | null
  last_message_at: string
  created_at: string
  // Enriched fields
  other_user_id: string
  other_user_name: string | null
  sneaker_name?: string | null
  sneaker_photo?: string | null
  last_message_preview?: string | null
  unread_count?: number
}

export function useMyConversations() {
  return useQuery({
    queryKey: ['conversations'],
    refetchInterval: 30_000, // refresh toutes les 30s
    queryFn: async (): Promise<Conversation[]> => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return []
      const myId = userData.user.id

      const { data: convos, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user1_id.eq.${myId},user2_id.eq.${myId}`)
        .order('last_message_at', { ascending: false })

      if (error) throw error
      if (!convos || convos.length === 0) return []

      // Récupérer les profiles des autres users
      const otherIds = convos.map((c: any) =>
        c.user1_id === myId ? c.user2_id : c.user1_id,
      )
      const sneakerIds = convos.map((c: any) => c.sneaker_id).filter(Boolean)

      const [profilesRes, sneakersRes, lastMsgsRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name').in('id', otherIds),
        sneakerIds.length > 0
          ? supabase
              .from('sneakers')
              .select('id, name, photo_url, stockx_image_url')
              .in('id', sneakerIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from('messages')
          .select('conversation_id, content, sender_id, read_at, created_at')
          .in('conversation_id', convos.map((c: any) => c.id))
          .order('created_at', { ascending: false }),
      ])

      const profileMap = new Map<string, string | null>()
      ;((profilesRes as any).data ?? []).forEach((p: any) =>
        profileMap.set(p.id, p.display_name),
      )

      const sneakerMap = new Map<string, any>()
      ;((sneakersRes as any).data ?? []).forEach((s: any) =>
        sneakerMap.set(s.id, s),
      )

      // last message + unread count par conversation
      const lastMsgMap = new Map<string, string>()
      const unreadMap = new Map<string, number>()
      ;((lastMsgsRes as any).data ?? []).forEach((m: any) => {
        if (!lastMsgMap.has(m.conversation_id)) {
          lastMsgMap.set(m.conversation_id, m.content)
        }
        if (m.sender_id !== myId && !m.read_at) {
          unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) ?? 0) + 1)
        }
      })

      return convos.map((c: any) => {
        const otherId = c.user1_id === myId ? c.user2_id : c.user1_id
        const sneaker = c.sneaker_id ? sneakerMap.get(c.sneaker_id) : null
        return {
          ...c,
          other_user_id: otherId,
          other_user_name: profileMap.get(otherId) ?? null,
          sneaker_name: sneaker?.name ?? null,
          sneaker_photo: sneaker?.photo_url ?? sneaker?.stockx_image_url ?? null,
          last_message_preview: lastMsgMap.get(c.id) ?? null,
          unread_count: unreadMap.get(c.id) ?? 0,
        } as Conversation
      })
    },
  })
}

export function useCreateOrGetConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      otherUserId: string
      sneakerId?: string | null
    }) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('not authenticated')
      const myId = userData.user.id

      // Normaliser : user1 = plus petit ID, user2 = plus grand
      const [user1_id, user2_id] = [myId, params.otherUserId].sort()

      // Chercher conversation existante
      const sneakerFilter = params.sneakerId
        ? `sneaker_id.eq.${params.sneakerId}`
        : 'sneaker_id.is.null'
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('user1_id', user1_id)
        .eq('user2_id', user2_id)
        .or(sneakerFilter)
        .maybeSingle()

      if (existing) return existing as Conversation

      // Créer nouvelle conversation
      const { data: created, error } = await supabase
        .from('conversations')
        .insert({
          user1_id,
          user2_id,
          sneaker_id: params.sneakerId ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return created as Conversation
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/* =====================================================
 * MESSAGING — Messages
 * ===================================================== */

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    enabled: !!conversationId,
    refetchInterval: 5_000, // refresh toutes les 5s
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return []
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data as Message[]) ?? []
    },
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: { conversationId: string; content: string }) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('not authenticated')
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: params.conversationId,
          sender_id: userData.user.id,
          content: params.content.trim(),
        })
        .select()
        .single()
      if (error) throw error
      return data as Message
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['messages', variables.conversationId] })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useMarkMessagesAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('not authenticated')
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userData.user.id)
        .is('read_at', null)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// =====================================================
// MESSAGES — Delete
// =====================================================
export function useDeleteMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ messageId }: {
      messageId: string
      conversationId: string
    }): Promise<void> => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
      if (error) throw error
    },
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages', conversationId],
      })
      queryClient.invalidateQueries({ queryKey: ['my-conversations'] })
    },
  })
}

// =====================================================
// CONVERSATIONS — Delete
// =====================================================
export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (conversationId: string): Promise<void> => {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-conversations'] })
    },
  })
  
  // =====================================================
// PSEUDO — Check disponibilité (RPC)
// =====================================================
export function useCheckPseudoAvailability(pseudo: string, enabled: boolean) {
  return useQuery({
    queryKey: ['pseudo-available', pseudo.toLowerCase().trim()],
    queryFn: async (): Promise<boolean> => {
      const trimmed = pseudo.trim()
      if (trimmed.length < 3) return false
      const { data, error } = await supabase.rpc('is_pseudo_available', {
        p_pseudo: trimmed,
      })
      if (error) throw error
      return data as boolean
    },
    enabled: enabled && pseudo.trim().length >= 3,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  })
}

// =====================================================
// PSEUDO — Sauvegarder + marquer configuré
// =====================================================
export function useSetMyPseudo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (pseudo: string): Promise<void> => {
      const trimmed = pseudo.trim()
      if (trimmed.length < 3 || trimmed.length > 20) {
        throw new Error('Le pseudo doit faire entre 3 et 20 caractères.')
      }
      // Re-check côté serveur juste avant d'écrire
      const { data: available, error: checkErr } = await supabase
        .rpc('is_pseudo_available', { p_pseudo: trimmed })
      if (checkErr) throw checkErr
      if (!available) throw new Error('Ce pseudo est déjà pris.')
 
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Pas authentifié.')
 
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: trimmed,
          pseudo_configured: true,
        })
        .eq('id', userData.user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-sneakers'] })
      queryClient.invalidateQueries({ queryKey: ['my-conversations'] })
    },
  })
}
}