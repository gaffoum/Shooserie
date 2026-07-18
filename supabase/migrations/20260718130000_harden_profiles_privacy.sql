-- Durcissement confidentialité de public.profiles (vue + policy).
-- Reflète l'état réel de la base (prod + dev). En prod, la vue a été appliquée
-- dans « star_system_etape1_additif » (20260718092000) et la policy dans
-- « harden_profiles_select_policy » (20260718095944) ; regroupées ici pour que
-- le repo documente le durcissement. Idempotent.

-- 1. Vue public_profiles : consultation des profils d'AUTRUI, colonnes MINIMALES
--    uniquement (aucune donnée sensible : ni prix, ni email, ni referral_code),
--    filtrée sur pseudo_configured=true. Lecture ouverte à anon + authenticated.
create or replace view public.public_profiles as
  select p.id,
         p.username,
         p.display_name,
         p.avatar_url,
         p."rank",
         p.stars_total,
         (select count(*) from public.sneakers s where s.user_id = p.id) as pairs_count
  from public.profiles p
  where p.pseudo_configured = true;

grant select on public.public_profiles to anon, authenticated;

-- 2. Policy SELECT durcie : la lecture DIRECTE de profiles est limitée à son
--    propre profil (auth.uid() = id). Les infos publiques d'autrui passent par
--    les vues public_profiles / leaderboard. (Remplace l'ancienne policy
--    « Profiles are viewable by everyone » qual: true.)
drop policy if exists "Profiles are viewable by everyone" on public.profiles;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  to public
  using (auth.uid() = id);
