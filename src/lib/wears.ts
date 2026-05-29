import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

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
    onSuccess: (_data, sneakerId) => invalidateAll(qc, sneakerId),
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
