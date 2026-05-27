import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserSneaker = {
  id: string;
  user_id: string;
  brand: string | null;
  model: string | null;
  image_url: string | null;
  is_for_sale: boolean | null;
  price: number | null;
  size: string | null;
  created_at: string;
};

/**
 * Liste les sneakers d'un utilisateur cible.
 * La RLS filtre automatiquement :
 *   - public collection -> toutes les paires
 *   - private collection -> uniquement is_for_sale = true
 *
 * Param onlyForSale : ajoute un filtre cote client (utile pour l'onglet "En vente").
 */
export function useUserSneakers(userId: string | undefined, onlyForSale = false) {
  return useQuery({
    queryKey: ["user-sneakers", userId, onlyForSale],
    enabled: !!userId,
    queryFn: async (): Promise<UserSneaker[]> => {
      let q = supabase
        .from("sneakers")
        .select("id, user_id, brand, model, image_url, is_for_sale, price, size, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });

      if (onlyForSale) q = q.eq("is_for_sale", true);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as UserSneaker[];
    },
    staleTime: 30_000,
  });
}