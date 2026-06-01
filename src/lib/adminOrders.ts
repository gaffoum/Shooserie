/**
 * Hooks queries admin pour les commandes de stickers.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { StickerOrder } from './stickerOrders'

export function useAllOrdersAdmin() {
  return useQuery({
    queryKey: ['admin-sticker-orders'],
    queryFn: async (): Promise<StickerOrder[]> => {
      const { data, error } = await supabase.rpc('get_all_sticker_orders_admin')
      if (error) throw error
      return (data ?? []) as StickerOrder[]
    },
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useMarkOrderPreparing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string): Promise<StickerOrder> => {
      const { data, error } = await supabase.rpc('mark_order_preparing_admin', { p_order_id: orderId })
      if (error) throw error
      return data as StickerOrder
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sticker-orders'] })
    },
  })
}

interface MarkShippedInput {
  orderId: string
  carrier: string
  trackingNumber: string
  trackingUrl?: string
}

export function useMarkOrderShipped() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: MarkShippedInput): Promise<StickerOrder> => {
      const { data, error } = await supabase.rpc('mark_order_shipped_admin', {
        p_order_id: input.orderId,
        p_carrier: input.carrier,
        p_tracking_number: input.trackingNumber,
        p_tracking_url: input.trackingUrl ?? null,
      })
      if (error) throw error
      return data as StickerOrder
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sticker-orders'] })
    },
  })
}