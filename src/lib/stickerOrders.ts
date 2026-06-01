/**
 * Hooks queries pour les commandes de stickers.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

export interface StickerOrder {
  id: string
  user_id: string
  sneaker_ids: string[]
  nb_stickers: number
  nb_planches: number
  price_per_plate_cents: number
  amount_total_cents: number
  currency: string
  shipping_name: string
  shipping_address_line1: string
  shipping_address_line2: string | null
  shipping_postal_code: string
  shipping_city: string
  shipping_country: string
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
  shipping: {
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

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-sticker-order`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error ?? `HTTP ${response.status}`)
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
    // Refetch souvent si la commande est en cours (paiement en train de se confirmer)
    refetchInterval: (query) => {
      const d = query.state.data as StickerOrder | null | undefined
      if (d && d.status === 'pending') return 2000 // poll pendant que le webhook tarde
      return false
    },
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