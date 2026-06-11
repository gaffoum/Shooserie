/**
 * Hooks queries pour les commandes de stickers.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { OrderType } from './stickerPricing'
import type { StickerSneaker } from './stickerPdf'
export { formatEur } from './stickerPricing'

export interface StickerOrder {
  id: string
  user_id: string
  type: OrderType
  sneaker_ids: string[]
  items: StickerSneaker[] | null
  nb_stickers: number
  nb_planches: number
  price_per_plate_cents: number
  amount_total_cents: number
  currency: string
  shipping_name: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_postal_code: string | null
  shipping_city: string | null
  shipping_country: string | null
  shipping_phone: string | null
  stripe_session_id: string | null
  status: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
}

export interface CreateOrderInput {
  sneaker_ids: string[]
  type: OrderType
  shipping?: {
    name: string
    address_line1: string
    address_line2?: string
    postal_code: string
    city: string
    country?: string
    phone?: string
  }
}

interface CreateOrderResponse {
  order_id: string
  checkout_url: string
  amount_total_cents: number
  nb_planches: number
}

/** Lance la creation d'une commande + redirige vers Stripe Checkout. */
export function useCreateOrder() {
  return useMutation({
    mutationFn: async (input: CreateOrderInput): Promise<CreateOrderResponse> => {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Non authentifie')

      const url = 'https://eykhnpnmpcrvcpajirst.supabase.co/functions/v1/create-sticker-order'
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      const text = await response.text()
      let body: CreateOrderResponse | { error?: string }
      try {
        body = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(`Reponse invalide (HTTP ${response.status})`)
      }
      if (!response.ok) {
        throw new Error((body as { error?: string })?.error ?? `HTTP ${response.status}`)
      }
      return body as CreateOrderResponse
    },
  })
}

/** Liste les commandes de l'utilisateur courant. */
export function useMyOrders() {
  return useQuery({
    queryKey: ['my-sticker-orders'],
    queryFn: async (): Promise<StickerOrder[]> => {
      const { data, error } = await supabase
        .from('sticker_orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as StickerOrder[]
    },
    staleTime: 30 * 1000,
  })
}

/** Fetch une commande specifique (par id). */
export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['sticker-order', orderId],
    queryFn: async (): Promise<StickerOrder | null> => {
      if (!orderId) return null
      const { data, error } = await supabase
        .from('sticker_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle()
      if (error) throw error
      return data as StickerOrder | null
    },
    enabled: !!orderId,
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const d = query.state.data as StickerOrder | null | undefined
      if (d && d.status === 'pending') return 2000
      return false
    },
  })
}

/** Recupere les paires (champs sticker) par ids, en preservant l'ordre demande. */
export function useSneakersByIds(ids: string[] | undefined) {
  return useQuery({
    queryKey: ['sneakers-by-ids', (ids ?? []).slice().sort().join(',')],
    queryFn: async (): Promise<StickerSneaker[]> => {
      if (!ids || ids.length === 0) return []
      const { data, error } = await supabase
        .from('sneakers')
        .select('id, name, brand, colorway, size_eu, size_us, stockx_image_url, photo_url')
        .in('id', ids)
      if (error) throw error
      const rows = (data ?? []) as StickerSneaker[]
      const byId = new Map(rows.map((r) => [r.id, r]))
      return ids
        .map((id) => byId.get(id))
        .filter((x): x is StickerSneaker => Boolean(x))
    },
    enabled: !!ids && ids.length > 0,
    staleTime: 60 * 1000,
  })
}

/** Helper pour le label d'un statut. */
export function statusLabel(status: StickerOrder['status']): string {
  const map: Record<StickerOrder['status'], string> = {
    pending: 'En attente de paiement',
    paid: 'Payée',
    preparing: 'En préparation',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    refunded: 'Remboursée',
  }
  return map[status] ?? status
}

/** Helper couleur statut. */
export function statusColor(status: StickerOrder['status']): { bg: string; fg: string } {
  switch (status) {
    case 'pending':    return { bg: '#FEF3C7', fg: '#92400E' }
    case 'paid':       return { bg: '#DBEAFE', fg: '#1E40AF' }
    case 'preparing':  return { bg: '#E0E7FF', fg: '#3730A3' }
    case 'shipped':    return { bg: '#D1FAE5', fg: '#065F46' }
    case 'delivered':  return { bg: '#D1FAE5', fg: '#065F46' }
    case 'cancelled':  return { bg: '#FEE2E2', fg: '#991B1B' }
    case 'refunded':   return { bg: '#FCE7F3', fg: '#9F1239' }
  }
}

// ============================================================================
// ADMIN — file d'impression (commandes physiques)
// ============================================================================

/** [admin] Liste les commandes physiques actives (payees / en prepa / expediees). */
export function useAdminStickerOrders() {
  return useQuery({
    queryKey: ['admin-sticker-orders'],
    queryFn: async (): Promise<StickerOrder[]> => {
      const { data, error } = await supabase
        .from('sticker_orders')
        .select('*')
        .eq('type', 'physical')
        .in('status', ['paid', 'preparing', 'shipped'])
        .order('paid_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as StickerOrder[]
    },
    staleTime: 15 * 1000,
  })
}

export interface UpdateOrderStatusInput {
  id: string
  status: StickerOrder['status']
  carrier?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
}

/** [admin] Met a jour le statut d'une commande (+ timestamps/suivi). */
export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateOrderStatusInput): Promise<void> => {
      const patch: Record<string, unknown> = { status: input.status }
      if (input.status === 'shipped') {
        patch.shipped_at = new Date().toISOString()
        if (input.carrier !== undefined) patch.carrier = input.carrier
        if (input.tracking_number !== undefined) patch.tracking_number = input.tracking_number
        if (input.tracking_url !== undefined) patch.tracking_url = input.tracking_url
      }
      if (input.status === 'delivered') {
        patch.delivered_at = new Date().toISOString()
      }
      const { error } = await supabase
        .from('sticker_orders')
        .update(patch)
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sticker-orders'] })
    },
  })
}
