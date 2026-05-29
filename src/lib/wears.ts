import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

// =============================================================
// Statuts dérivés du compteur de wears.
// Paliers : DS (0) -> VNDS (1-2) -> 9/10 (3-10) -> 8/10 (11-30) -> Beater (31+)
// =============================================================

export type WearStatus = 'DS' | 'VNDS' | '9/10' | '8/10' | 'Beater'

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