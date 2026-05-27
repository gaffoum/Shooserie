import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export type PublicProfile = {
  id: string
  display_name: string
  created_at: string
  is_public: boolean | null
  /** null si la collection est privée (compteur réel non accessible via RLS). */
  sneakers_count: number | null
  for_sale_count: number
}

export type UserSneaker = {
  id: string
  user_id: string
  brand: string | null
  model: string | null
  image_url: string | null
  is_for_sale: boolean | null
  price: number | null
  size: string | null
  created_at: string
}

/**
 * Récupère un profil public à partir du pseudo (display_name, case-insensitive).
 * Retourne null si aucun utilisateur ne porte ce pseudo.
 *
 * Note RLS :
 *   - is_public = true  -> count('sneakers') renvoie le total réel
 *   - is_public = false -> count ne renverrait que les paires visibles
 *     (is_for_sale=true), ce qui serait trompeur => on force null.
 *
 * Pré-requis schema : la colonne `is_public` doit exister sur `profiles`.
 * Si elle n'existe pas encore :
 *   ALTER TABLE profiles ADD COLUMN is_public boolean NOT NULL DEFAULT true;
 */
export function useUserProfileByPseudo(pseudo: string | undefined) {
  return useQuery({
    queryKey: ['public-profile', pseudo?.toLowerCase()],
    enabled: !!pseudo,
    queryFn: async (): Promise<PublicProfile | null> => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, display_name, created_at, is_public')
        .ilike('display_name', pseudo!)
        .maybeSingle()

      if (error) throw error
      if (!profile) return null

      const [totalRes, forSaleRes] = await Promise.all([
        supabase
          .from('sneakers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id),
        supabase
          .from('sneakers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('is_for_sale', true),
      ])

      const isPrivate = profile.is_public === false

      return {
        id: profile.id,
        display_name: profile.display_name,
        created_at: profile.created_at,
        is_public: profile.is_public ?? null,
        sneakers_count: isPrivate ? null : (totalRes.count ?? 0),
        for_sale_count: forSaleRes.count ?? 0,
      }
    },
    staleTime: 60_000,
  })
}

/**
 * Liste les sneakers d'un utilisateur cible.
 * La RLS filtre automatiquement :
 *   - collection publique  -> toutes les paires
 *   - collection privée    -> uniquement is_for_sale = true
 */
export function useUserSneakers(
  userId: string | undefined,
  onlyForSale = false,
) {
  return useQuery({
    queryKey: ['user-sneakers', userId, onlyForSale],
    enabled: !!userId,
    queryFn: async (): Promise<UserSneaker[]> => {
      let q = supabase
        .from('sneakers')
        .select(
          'id, user_id, brand, model, image_url, is_for_sale, price, size, created_at',
        )
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })

      if (onlyForSale) q = q.eq('is_for_sale', true)

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as UserSneaker[]
    },
    staleTime: 30_000,
  })
}