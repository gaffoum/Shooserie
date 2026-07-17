import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { awardWear } from './engagement'

// =============================================================
// Statuts dérivés du compteur de wears.
// Paliers : DS (0) -> VNDS (1-2) -> 9/10 (3-10) -> 8/10 (11-30) -> Beater (31+)
// =============================================================

export type WearStatus = 'DS' | 'VNDS' | '9/10' | '8/10' | 'Beater'

/** Tous les statuts de wear, dans l'ordre croissant d'usure. */
export const WEAR_STATUSES: WearStatus[] = ['DS', 'VNDS', '9/10', '8/10', 'Beater']

export function wearStatus(count: number | null | undefined): WearStatus {
  const c = count ?? 0
  if (c <= 0) return 'DS'
  if (c <= 2) return 'VNDS'
  if (c <= 10) return '9/10'
  if (c <= 30) return '8/10'
  return 'Beater'
}

/** Couleurs de badge par statut. */
export const WEAR_STATUS_COLORS: Record<
  WearStatus,
  { bg: string; fg: string; border: string }
> = {
  DS:       { bg: '#10B981', fg: '#FFFFFF', border: '#059669' },
  VNDS:     { bg: '#0EA5E9', fg: '#FFFFFF', border: '#0284C7' },
  '9/10':   { bg: '#F59E0B', fg: '#1F1300', border: '#D97706' },
  '8/10':   { bg: '#F97316', fg: '#FFFFFF', border: '#EA580C' },
  Beater:   { bg: '#7C2D12', fg: '#FFFFFF', border: '#5C1810' },
}

/** Libellé long (utile en tooltip ou en sous-titre). */
export function wearStatusLabel(status: WearStatus): string {
  switch (status) {
    case 'DS': return 'Deadstock — jamais portée'
    case 'VNDS': return 'Very Near Deadstock — état quasi-neuf'
    case '9/10': return 'Très bon état — portée quelques fois'
    case '8/10': return 'Bon état — portée régulièrement'
    case 'Beater': return 'Beater — paire portée à fond'
  }
}

// =============================================================
// Hooks d'incrémentation / décrémentation / reset
// Atomiques via RPC Postgres (pas de race condition).
// =============================================================

function invalidateAll(qc: ReturnType<typeof useQueryClient>, sneakerId: string) {
  qc.invalidateQueries({ queryKey: ['sneaker', sneakerId] })
  qc.invalidateQueries({ queryKey: ['sneakers'] })
  qc.invalidateQueries({ queryKey: ['user-sneakers'] })
  qc.invalidateQueries({ queryKey: ['top-worn'] })
  qc.invalidateQueries({ queryKey: ['most-collected'] })
}

export function useIncrementWear() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sneakerId: string) => {
      const { data, error } = await supabase.rpc('increment_wear', {
        p_sneaker_id: sneakerId,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, sneakerId) => {
      invalidateAll(qc, sneakerId)
      // Gain d'engagement « paire portée » (+2, plafond 10/jour côté SQL).
      awardWear(sneakerId)
    },
  })
}

export function useDecrementWear() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sneakerId: string) => {
      const { data, error } = await supabase.rpc('decrement_wear', {
        p_sneaker_id: sneakerId,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, sneakerId) => invalidateAll(qc, sneakerId),
  })
}

export function useResetWears() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sneakerId: string) => {
      const { data, error } = await supabase.rpc('reset_wears', {
        p_sneaker_id: sneakerId,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, sneakerId) => invalidateAll(qc, sneakerId),
  })
}

// =============================================================
// Top N paires portees pour un utilisateur donne.
// Exclut les DS (wear_count = 0) — un top des paires effectivement portees.
// Hit l'index (user_id, wear_count DESC) pour rester rapide.
// =============================================================

export interface TopWornSneaker {
  id: string
  name: string
  brand: string | null
  photo_url: string | null
  stockx_image_url: string | null
  wear_count: number
  last_worn_at: string | null
}

export function useTopWornSneakers(userId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ['top-worn', userId, limit],
    queryFn: async (): Promise<TopWornSneaker[]> => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('sneakers')
        .select(
          'id, name, brand, photo_url, stockx_image_url, wear_count, last_worn_at',
        )
        .eq('user_id', userId)
        .gt('wear_count', 0)
        .order('wear_count', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as TopWornSneaker[]
    },
    enabled: !!userId,
  })
}

// =============================================================
// Top N portees de l'utilisateur courant.
// Wrapper qui resoud l'auth user via supabase.auth puis delegue
// a useTopWornSneakers. Utilise par <TopWornSneakers /> sur le dashboard.
// =============================================================

export function useMyTopWornSneakers(limit = 10) {
  const { data: userId } = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    },
    staleTime: 5 * 60 * 1000, // 5 min : l'identite ne change pas souvent
  })
  return useTopWornSneakers(userId ?? undefined, limit)
}

// =============================================================
// Page /rankings — distribution + recently worn + DS still standing
// =============================================================

export interface WearStatusCount {
  status: WearStatus
  count: number
}

/**
 * Repartition par statut pour la collec de l'utilisateur courant.
 * Fetch tous les wear_count (1 colonne), groupe cote JS via wearStatus().
 * Pour 1000+ paires c'est encore largement OK.
 */
export function useMyWearStatusDistribution() {
  const { data: userId } = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    },
    staleTime: 5 * 60 * 1000,
  })

  return useQuery({
    queryKey: ['wear-status-distribution', userId],
    enabled: !!userId,
    queryFn: async (): Promise<WearStatusCount[]> => {
      const { data, error } = await supabase
        .from('sneakers')
        .select('wear_count')
        .eq('user_id', userId!)
      if (error) throw error

      const counts: Record<WearStatus, number> = {
        DS: 0,
        VNDS: 0,
        '9/10': 0,
        '8/10': 0,
        Beater: 0,
      }
      for (const row of data ?? []) {
        counts[wearStatus(row.wear_count as number)]++
      }
      return WEAR_STATUSES.map((s) => ({ status: s, count: counts[s] }))
    },
  })
}

/**
 * Top N paires recemment portees (par last_worn_at desc).
 * Hit l'index (user_id, last_worn_at DESC) WHERE last_worn_at IS NOT NULL.
 */
export interface RecentlyWornSneaker {
  id: string
  name: string
  brand: string | null
  photo_url: string | null
  stockx_image_url: string | null
  wear_count: number
  last_worn_at: string
}

export function useMyRecentlyWornSneakers(limit = 10) {
  const { data: userId } = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    },
    staleTime: 5 * 60 * 1000,
  })

  return useQuery({
    queryKey: ['recently-worn', userId, limit],
    enabled: !!userId,
    queryFn: async (): Promise<RecentlyWornSneaker[]> => {
      const { data, error } = await supabase
        .from('sneakers')
        .select(
          'id, name, brand, photo_url, stockx_image_url, wear_count, last_worn_at',
        )
        .eq('user_id', userId!)
        .gt('wear_count', 0)
        .not('last_worn_at', 'is', null)
        .order('last_worn_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as RecentlyWornSneaker[]
    },
  })
}

/**
 * DS still standing : paires jamais portees, triees par date d'acquisition desc.
 * COALESCE(purchase_date, created_at) — tri cote client (Postgres ne permet
 * pas COALESCE direct dans .order() de PostgREST). Fetch toutes les DS puis
 * tri + slice cote client.
 */
export interface DsStillStandingSneaker {
  id: string
  name: string
  brand: string | null
  photo_url: string | null
  stockx_image_url: string | null
  wear_count: number
  purchase_date: string | null
  created_at: string
  /** Resolu par le hook : purchase_date si dispo, sinon created_at. */
  acquired_at: string
  /** True si acquired_at provient de purchase_date (sinon = created_at fallback). */
  has_real_purchase_date: boolean
}

export function useMyDsStillStanding(limit = 20) {
  const { data: userId } = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    },
    staleTime: 5 * 60 * 1000,
  })

  return useQuery({
    queryKey: ['ds-still-standing', userId, limit],
    enabled: !!userId,
    queryFn: async (): Promise<DsStillStandingSneaker[]> => {
      const { data, error } = await supabase
        .from('sneakers')
        .select(
          'id, name, brand, photo_url, stockx_image_url, wear_count, purchase_date, created_at',
        )
        .eq('user_id', userId!)
        .eq('wear_count', 0)
      if (error) throw error

      // Tri cote client : COALESCE(purchase_date, created_at) desc
      const enriched = (data ?? []).map((s) => {
        const acquired = (s.purchase_date as string | null) ?? (s.created_at as string)
        return {
          ...s,
          acquired_at: acquired,
          has_real_purchase_date: s.purchase_date !== null,
        } as DsStillStandingSneaker
      })
      enriched.sort((a, b) => b.acquired_at.localeCompare(a.acquired_at))
      return enriched.slice(0, limit)
    },
  })
}
