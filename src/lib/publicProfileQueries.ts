import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Profil public MINIMAL (règles de confidentialité Vague 2). On n'expose QUE :
 * username, display_name, avatar_url, rank, stars_total et le NOMBRE de paires.
 * JAMAIS : prix, email, referral_code, referred_by, ni le détail des paires.
 */
export type PublicProfile = {
  id: string
  username: string | null
  display_name: string
  avatar_url: string | null
  rank: string
  stars_total: number
  /** Nombre total de paires (COUNT seulement — pas la liste). */
  pairs_count: number
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
  wear_count: number
  last_worn_at: string | null
}

/**
 * Récupère un profil public MINIMAL par pseudo (username en priorité, sinon
 * display_name), case-insensitive. Retourne null si introuvable OU si
 * `pseudo_configured` est false (profil non publiable → 404 côté page).
 *
 * 🔒 On ne sélectionne QUE les colonnes autorisées + le COUNT de paires. Aucune
 * donnée sensible (prix, email, referral_code…) n'est requêtée, et on ne charge
 * jamais le détail des paires ici.
 */
export function useUserProfileByPseudo(pseudo: string | undefined) {
  return useQuery({
    queryKey: ['public-profile', pseudo?.toLowerCase()],
    enabled: !!pseudo,
    queryFn: async (): Promise<PublicProfile | null> => {
      const COLS = 'id, username, display_name, avatar_url, rank, stars_total, pseudo_configured'
      // On tente d'abord par username, puis par display_name (2 appels séparés
      // pour ne pas injecter l'input brut dans un filtre .or()).
      let profile: Record<string, unknown> | null = null
      const byUsername = await supabase.from('profiles').select(COLS).ilike('username', pseudo!).limit(1).maybeSingle()
      if (byUsername.error) throw byUsername.error
      profile = byUsername.data
      if (!profile) {
        const byName = await supabase.from('profiles').select(COLS).ilike('display_name', pseudo!).limit(1).maybeSingle()
        if (byName.error) throw byName.error
        profile = byName.data
      }

      // Introuvable OU pseudo non configuré → non publiable (404 page).
      if (!profile || (profile as { pseudo_configured?: boolean }).pseudo_configured !== true) return null

      const p = profile as {
        id: string
        username: string | null
        display_name: string
        avatar_url: string | null
        rank: string | null
        stars_total: number | null
      }

      const { count } = await supabase
        .from('sneakers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', p.id)

      return {
        id: p.id,
        username: p.username ?? null,
        display_name: p.display_name,
        avatar_url: p.avatar_url ?? null,
        rank: p.rank ?? 'rookie',
        stars_total: p.stars_total ?? 0,
        pairs_count: count ?? 0,
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
          'id, user_id, name, brand, photo_url, stockx_image_url, size_eu, size_us, is_for_sale, listing_price, target_sale_price, created_at, wear_count, last_worn_at',
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
 * Entrée du leaderboard — SOURCE = vue SQL `public.leaderboard`, qui n'expose
 * QUE les colonnes minimales autorisées (id, username, display_name, avatar_url,
 * stars_total, rank, pairs_count) et ne liste QUE les profils
 * `leaderboard_visible = true`, triés par stars_total desc. Aucune donnée
 * sensible ne transite (règles de confidentialité Vague 2).
 */
export type LeaderboardEntry = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  stars_total: number
  rank: string
  pairs_count: number
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      // On sélectionne explicitement les colonnes minimales (jamais '*').
      const { data, error } = await supabase
        .from('leaderboard')
        .select('id, username, display_name, avatar_url, stars_total, rank, pairs_count')
      if (error) throw error
      return (data ?? []) as LeaderboardEntry[]
    },
    staleTime: 60_000,
  })
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

/**
 * Retourne true si la collection de l'utilisateur connecte est publique.
 * Utilise pour conditionner l'affichage du lien /community dans la nav.
 *
 * Cache-key indexee sur user.id => invalide a la connexion/deconnexion.
 * Apres un toggle de visibilite, penser a :
 *   queryClient.invalidateQueries({ queryKey: ['my-collection-public'] })
 */
export function useMyCollectionPublic() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-collection-public', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('collection_public')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data?.collection_public === true
    },
    staleTime: 60_000,
  })
}
