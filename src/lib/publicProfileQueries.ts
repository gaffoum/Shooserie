import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export type PublicProfile = {
  id: string
  display_name: string
  created_at: string
  collection_public: boolean | null
  /** null si la collection est privée (compteur réel non accessible via RLS). */
  sneakers_count: number | null
  for_sale_count: number
}

export type UserSneaker = {
  id: string
  user_id: string
  name: string
  brand: string | null
  photo_url: string | null
  stockx_image_url: string | null
  size_eu: string | null
  size_us: string | null
  is_for_sale: boolean | null
  listing_price: number | null
  target_sale_price: number | null
  created_at: string
}

/**
 * Récupère un profil public à partir du pseudo (display_name, case-insensitive).
 * Retourne null si aucun utilisateur ne porte ce pseudo.
 *
 * RLS sneakers :
 *   - collection_public = true  -> count renvoie le total réel
 *   - collection_public = false -> count ne renvoie que is_for_sale=true,
 *     donc on force sneakers_count à null pour ne pas mentir dans le header.
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
 * RLS filtre automatiquement :
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
          'id, user_id, name, brand, photo_url, stockx_image_url, size_eu, size_us, is_for_sale, listing_price, target_sale_price, created_at',
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

export type CommunityMember = {
  id: string
  display_name: string
  created_at: string
  sneakers_count: number
  for_sale_count: number
}

/**
 * Liste les profils publics (collection_public = true).
 * Pour chaque profil, agrege les compteurs total + for_sale via Promise.all
 * (N+1 queries, OK pour < 100 users ; au-dela passer en vue SQL).
 *
 * Tri alphabetique case-insensitive cote client (Postgres .order ne gere
 * pas lower() via PostgREST sans RPC).
 */
export function usePublicProfiles() {
  return useQuery({
    queryKey: ['community-profiles'],
    queryFn: async (): Promise<CommunityMember[]> => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, created_at')
        .eq('collection_public', true)

      if (error) throw error
      if (!profiles || profiles.length === 0) return []

      const enriched = await Promise.all(
        profiles
          .filter((p): p is { id: string; display_name: string; created_at: string } => !!p.display_name)
          .map(async (p) => {
            const [totalRes, forSaleRes] = await Promise.all([
              supabase
                .from('sneakers')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', p.id),
              supabase
                .from('sneakers')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', p.id)
                .eq('is_for_sale', true),
            ])
            return {
              id: p.id,
              display_name: p.display_name,
              created_at: p.created_at,
              sneakers_count: totalRes.count ?? 0,
              for_sale_count: forSaleRes.count ?? 0,
            } as CommunityMember
          }),
      )

      return enriched.sort((a, b) =>
        a.display_name.localeCompare(b.display_name, 'fr', {
          sensitivity: 'base',
        }),
      )
    },
    staleTime: 60_000,
  })
}
