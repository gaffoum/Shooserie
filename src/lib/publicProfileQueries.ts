import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export type PublicProfile = {
  id: string
  display_name: string
  created_at: string
  collection_public: boolean | null
  /** null si la collection est privÃ©e (compteur rÃ©el non accessible via RLS). */
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
 * RÃ©cupÃ¨re un profil public Ã  partir du pseudo (display_name, case-insensitive).
 * Retourne null si aucun utilisateur ne porte ce pseudo.
 *
 * Note RLS :
 *   - collection_public = true  -> count('sneakers') renvoie le total rÃ©el
 *   - collection_public = false -> count ne renverrait que les paires visibles
 *     (is_for_sale=true), ce qui serait trompeur => on force null.
 *
 * PrÃ©-requis schema : la colonne `collection_public` doit exister sur `profiles`.
 * Si elle n'existe pas encore :
 *   ALTER TABLE profiles ADD COLUMN collection_public boolean NOT NULL DEFAULT true;
 */
export function useUserProfileByPseudo(pseudo: string | undefined) {
  return useQuery({
    queryKey: ['public-profile', pseudo?.toLowerCase()],
    enabled: !!pseudo,
    queryFn: async (): Promise<PublicProfile | null> => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, display_name, created_at, collection_public')
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

      const isPrivate = profile.collection_public === false

      return {
        id: profile.id,
        display_name: profile.display_name,
        created_at: profile.created_at,
        collection_public: profile.collection_public ?? null,
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
 *   - collection privÃ©e    -> uniquement is_for_sale = true
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