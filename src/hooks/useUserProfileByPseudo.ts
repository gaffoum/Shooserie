import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PublicProfile = {
  id: string;
  display_name: string;
  created_at: string;
  is_public: boolean | null;
  /** null si la collection est privee (compteur reel non accessible via RLS). */
  sneakers_count: number | null;
  for_sale_count: number;
};

/**
 * Recupere un profil public a partir du pseudo (display_name, case-insensitive).
 * Retourne null si aucun utilisateur ne porte ce pseudo.
 *
 * Note RLS :
 *   - Si is_public = true  -> count('sneakers') renvoie le total reel.
 *   - Si is_public = false -> count('sneakers') ne renverrait que les paires
 *     visibles (is_for_sale=true), ce qui serait trompeur => on force null.
 */
export function useUserProfileByPseudo(pseudo: string | undefined) {
  return useQuery({
    queryKey: ["public-profile", pseudo?.toLowerCase()],
    enabled: !!pseudo,
    queryFn: async (): Promise<PublicProfile | null> => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, display_name, created_at, is_public")
        .ilike("display_name", pseudo!)
        .maybeSingle();

      if (error) throw error;
      if (!profile) return null;

      const [totalRes, forSaleRes] = await Promise.all([
        supabase
          .from("sneakers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id),
        supabase
          .from("sneakers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.id)
          .eq("is_for_sale", true),
      ]);

      const isPrivate = profile.is_public === false;

      return {
        id: profile.id,
        display_name: profile.display_name,
        created_at: profile.created_at,
        is_public: profile.is_public ?? null,
        sneakers_count: isPrivate ? null : (totalRes.count ?? 0),
        for_sale_count: forSaleRes.count ?? 0,
      };
    },
    staleTime: 60_000,
  });
}