-- Ajoute has_public_profile à la vue leaderboard : true ssi le profil a un
-- profil public consultable (pseudo_configured=true). Le front rend la ligne
-- cliquable uniquement si has_public_profile, sinon 404 (public_profiles filtre
-- pseudo_configured). Appliqué prod + dev.
create or replace view public.leaderboard as
  select p.id, p.username, p.display_name, p.avatar_url, p.stars_total, p."rank",
         (select count(*) from public.sneakers s where s.user_id = p.id) as pairs_count,
         coalesce(p.pseudo_configured, false) as has_public_profile
  from public.profiles p
  where p.leaderboard_visible = true
  order by p.stars_total desc;
grant select on public.leaderboard to anon, authenticated;
