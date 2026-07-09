-- ============================================================
-- Shooserie — Migration : système d'étoiles ⭐ (moteur)
-- Additif, non destructif. À committer dans supabase/migrations/
-- et appliquer par Claude Code sur `dev` (PAS en prod direct).
-- Enum rareté réel : unknown, commune, peu_commune, rare, ultra_rare, grail
-- ============================================================

-- ---------- 1. Ajouts à profiles ----------
alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.profiles(id),
  add column if not exists stars_total int not null default 0,
  add column if not exists rank text not null default 'rookie',
  add column if not exists leaderboard_visible boolean not null default true;

-- ---------- 2. Ledger star_events (source de vérité) ----------
create table if not exists public.star_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  rule_key text not null,
  points int not null,
  dedupe_key text not null,          -- 'account' | entity id | date | pattern | random
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, rule_key, dedupe_key)   -- garantit l'anti-farm au niveau base
);
create index if not exists star_events_user_idx on public.star_events(user_id);
create index if not exists star_events_user_day_idx on public.star_events(user_id, rule_key, created_at);

alter table public.star_events enable row level security;
create policy "star_events lisibles par le propriétaire"
  on public.star_events for select to authenticated using (user_id = auth.uid());
-- Pas de policy insert/update/delete : seules les fonctions SECURITY DEFINER écrivent.

-- ---------- 3. Table referrals ----------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  code_used text,
  status text not null default 'signed_up' check (status in ('signed_up','activated')),
  signed_up_at timestamptz default now(),
  activated_at timestamptz
);
alter table public.referrals enable row level security;
create policy "referrals visibles par le parrain"
  on public.referrals for select to authenticated using (referrer_id = auth.uid());

-- ---------- 4. Rang à partir du total ----------
create or replace function public.fn_rank(p_total int)
returns text language sql immutable as $$
  select case
    when p_total >= 12000 then 'legend'
    when p_total >=  6000 then 'plug'
    when p_total >=  3000 then 'connoisseur'
    when p_total >=  1200 then 'curator'
    when p_total >=   500 then 'collector'
    when p_total >=   150 then 'sneakerhead'
    else 'rookie'
  end;
$$;

-- ---------- 5. Maj incrémentale du total + rang à chaque event ----------
create or replace function public._bump_total()
returns trigger language plpgsql as $$
begin
  update public.profiles
     set stars_total = stars_total + NEW.points,
         rank = public.fn_rank(stars_total + NEW.points),
         updated_at = now()
   where id = NEW.user_id;
  return NEW;
end $$;

drop trigger if exists trg_star_events_bump on public.star_events;
create trigger trg_star_events_bump
  after insert on public.star_events
  for each row execute function public._bump_total();

-- ---------- 6. Fonction d'attribution centrale ----------
-- one-shot : dedupe='account' (par compte) ou entity id (par objet) → unicité bloque le doublon.
-- répétable plafonnée : p_daily_cap = nb max d'events/jour pour cette règle.
create or replace function public._award(
  p_uid uuid, p_rule text, p_points int, p_dedupe text,
  p_entity uuid default null, p_daily_cap int default null
) returns boolean language plpgsql security definer as $$
declare v_today int; v_rows int;
begin
  if p_uid is null then return false; end if;
  if p_daily_cap is not null then
    select count(*) into v_today from public.star_events
      where user_id = p_uid and rule_key = p_rule
        and created_at >= date_trunc('day', now());
    if v_today >= p_daily_cap then return false; end if;
  end if;
  insert into public.star_events(user_id, rule_key, points, dedupe_key, entity_id)
    values (p_uid, p_rule, p_points, p_dedupe, p_entity)
    on conflict (user_id, rule_key, dedupe_key) do nothing;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end $$;

-- ---------- 7. Évaluation des jalons (idempotente : safe en insert ET update ET backfill) ----------
create or replace function public._eval_milestones(p_uid uuid)
returns void language plpgsql security definer as $$
declare c int; g int; b int; tiers int;
begin
  select count(*) into c from public.sneakers where user_id = p_uid;
  if c >= 5   then perform public._award(p_uid,'m_5',   50 ,'account'); end if;
  if c >= 10  then perform public._award(p_uid,'m_10',  100,'account'); end if;
  if c >= 25  then perform public._award(p_uid,'m_25',  200,'account'); end if;
  if c >= 50  then perform public._award(p_uid,'m_50',  400,'account'); end if;
  if c >= 100 then perform public._award(p_uid,'m_100', 800,'account'); end if;
  if c >= 250 then perform public._award(p_uid,'m_250',2000,'account'); end if;

  -- prestige / rareté
  if exists(select 1 from public.sneakers where user_id=p_uid and rarity='rare')       then perform public._award(p_uid,'first_rare', 50 ,'account'); end if;
  if exists(select 1 from public.sneakers where user_id=p_uid and rarity='ultra_rare') then perform public._award(p_uid,'first_ultra',150,'account'); end if;
  if exists(select 1 from public.sneakers where user_id=p_uid and rarity='grail')      then perform public._award(p_uid,'first_grail',400,'account'); end if;
  select count(*) into g from public.sneakers where user_id=p_uid and rarity='grail';
  if g >= 5 then perform public._award(p_uid,'grail_5',1000,'account'); end if;
  select count(distinct rarity) into tiers from public.sneakers
    where user_id=p_uid and rarity in ('commune','peu_commune','rare','ultra_rare','grail');
  if tiers = 5 then perform public._award(p_uid,'full_metal',300,'account'); end if;

  -- diversité (marques ; le jalon "modèles" se fera côté app via RPC car deriveModel est client-side)
  select count(distinct brand) into b from public.sneakers
    where user_id=p_uid and brand is not null and brand <> '';
  if b >= 3 then perform public._award(p_uid,'brand_3', 50 ,'account'); end if;
  if b >= 5 then perform public._award(p_uid,'brand_5',100 ,'account'); end if;
end $$;

-- ---------- 8. Complétude d'une fiche (idempotent, par paire) ----------
create or replace function public._eval_pair(p_row public.sneakers)
returns void language plpgsql security definer as $$
begin
  -- fiche complète : taille + état + une image
  if (p_row.size_eu is not null or p_row.size_us is not null)
     and p_row.condition is not null
     and (p_row.photo_url is not null or p_row.stockx_image_url is not null) then
    perform public._award(p_row.user_id,'complete_pair',15,p_row.id::text,p_row.id);
  end if;
  -- prix d'achat renseigné
  if p_row.purchase_price is not null then
    perform public._award(p_row.user_id,'price_pair',5,p_row.id::text,p_row.id);
  end if;
end $$;

-- ---------- 9. Jalons de parrainage ----------
create or replace function public._eval_referral_milestones(p_ref uuid)
returns void language plpgsql security definer as $$
declare n int;
begin
  select count(*) into n from public.referrals where referrer_id=p_ref and status='activated';
  if n >= 3  then perform public._award(p_ref,'ref_3', 300 ,'account'); end if;
  if n >= 10 then perform public._award(p_ref,'ref_10',1000,'account'); end if;
end $$;

-- ---------- 10. Triggers sur sneakers ----------
create or replace function public._sneaker_after_insert()
returns trigger language plpgsql security definer as $$
declare v_ref uuid; v_cnt int;
begin
  perform public._award(NEW.user_id,'add_pair',10, NEW.id::text, NEW.id, 5); -- répétable, 5/jour max
  perform public._award(NEW.user_id,'first_pair',100,'account');             -- one-shot activation
  perform public._eval_pair(NEW);
  perform public._eval_milestones(NEW.user_id);

  -- activation du parrainage : la 1re paire du filleul active le parrain
  select referred_by into v_ref from public.profiles where id = NEW.user_id;
  if v_ref is not null then
    select count(*) into v_cnt from public.sneakers where user_id = NEW.user_id;
    if v_cnt = 1 then
      update public.referrals set status='activated', activated_at=now()
        where referred_id = NEW.user_id and status='signed_up';
      if found then
        perform public._award(v_ref,'referral_activated',150, NEW.user_id::text, NEW.user_id);
        perform public._eval_referral_milestones(v_ref);
      end if;
    end if;
  end if;
  return NEW;
end $$;

create or replace function public._sneaker_after_update()
returns trigger language plpgsql security definer as $$
begin
  perform public._eval_pair(NEW);
  perform public._eval_milestones(NEW.user_id);      -- la rareté a pu changer
  -- mise en vente : one-shot par paire quand is_for_sale passe à true
  if coalesce(NEW.is_for_sale,false) and not coalesce(OLD.is_for_sale,false) then
    perform public._award(NEW.user_id,'list_pair',15, NEW.id::text, NEW.id);
  end if;
  return NEW;
end $$;

drop trigger if exists trg_sneaker_ins on public.sneakers;
create trigger trg_sneaker_ins after insert on public.sneakers
  for each row execute function public._sneaker_after_insert();

drop trigger if exists trg_sneaker_upd on public.sneakers;
create trigger trg_sneaker_upd after update on public.sneakers
  for each row execute function public._sneaker_after_update();

-- ---------- 11. Triggers sur profiles (onboarding one-shots) ----------
create or replace function public._profile_after_update()
returns trigger language plpgsql security definer as $$
begin
  if coalesce(NEW.pseudo_configured,false) and not coalesce(OLD.pseudo_configured,false) then
    perform public._award(NEW.id,'set_pseudo',50,'account');
  end if;
  if NEW.avatar_url is not null and OLD.avatar_url is null then
    perform public._award(NEW.id,'set_avatar',30,'account');
  end if;
  if coalesce(NEW.collection_public,false) and not coalesce(OLD.collection_public,false) then
    perform public._award(NEW.id,'make_public',50,'account');
  end if;
  -- profil complet : pseudo + avatar + public
  if coalesce(NEW.pseudo_configured,false) and NEW.avatar_url is not null
     and coalesce(NEW.collection_public,false) then
    perform public._award(NEW.id,'profile_complete',50,'account');
  end if;
  return NEW;
end $$;

drop trigger if exists trg_profile_upd on public.profiles;
create trigger trg_profile_upd after update on public.profiles
  for each row execute function public._profile_after_update();

-- ---------- 12. Code de parrainage (génération) ----------
-- Backfill des codes existants (déterministe et unique : basé sur l'id).
update public.profiles
   set referral_code = upper(substr(md5(id::text),1,8))
 where referral_code is null;

-- Nouveaux profils : code auto si absent.
create or replace function public._profile_set_code()
returns trigger language plpgsql as $$
begin
  if NEW.referral_code is null then
    NEW.referral_code := upper(substr(md5(NEW.id::text || random()::text),1,8));
  end if;
  return NEW;
end $$;

drop trigger if exists trg_profile_code on public.profiles;
create trigger trg_profile_code before insert on public.profiles
  for each row execute function public._profile_set_code();

-- ---------- 13. RPC appelées par l'app ----------
-- Parrainage à l'inscription : l'app appelle apply_referral(code) après création du compte.
create or replace function public.apply_referral(p_code text)
returns void language plpgsql security definer as $$
declare v_ref uuid; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'non authentifié'; end if;
  select id into v_ref from public.profiles where referral_code = upper(p_code);
  if v_ref is null or v_ref = v_uid then return; end if;                 -- code invalide ou auto-parrainage
  if exists(select 1 from public.profiles where id=v_uid and referred_by is not null) then return; end if; -- déjà parrainé
  update public.profiles set referred_by = v_ref where id = v_uid;
  insert into public.referrals(referrer_id, referred_id, code_used, status, signed_up_at)
    values (v_ref, v_uid, upper(p_code), 'signed_up', now())
    on conflict (referred_id) do nothing;
  perform public._award(v_ref,'referral_signup',50, v_uid::text, v_uid);  -- étage 1 : +50
end $$;

-- Engagement (l'app appelle ces RPC ; plafonds appliqués serveur) :
create or replace function public.award_daily_login()
returns void language plpgsql security definer as $$
begin
  perform public._award(auth.uid(),'daily_login',5, to_char(now(),'YYYY-MM-DD')); -- 1/jour via dedupe
end $$;

create or replace function public.award_read_story(p_pattern text)
returns void language plpgsql security definer as $$
begin
  perform public._award(auth.uid(),'read_story',2, p_pattern, null, 20); -- 1x/histoire, 20/jour
end $$;

create or replace function public.award_wear(p_sneaker uuid)
returns void language plpgsql security definer as $$
begin
  if not exists(select 1 from public.sneakers where id=p_sneaker and user_id=auth.uid()) then return; end if;
  perform public._award(auth.uid(),'wear',2, gen_random_uuid()::text, p_sneaker, 10); -- 10/jour
end $$;

create or replace function public.award_share_app()
returns void language plpgsql security definer as $$
begin
  perform public._award(auth.uid(),'share_app',10,'account');
end $$;

-- Jalon "modèles distincts" (deriveModel côté client → l'app passe le compte)
create or replace function public.award_models_milestone(p_distinct int)
returns void language plpgsql security definer as $$
begin
  if p_distinct >= 10 then perform public._award(auth.uid(),'models_10',150,'account'); end if;
end $$;

-- ---------- 14. Leaderboard (vue publique, opt-in) ----------
create or replace view public.leaderboard as
  select p.id, p.username, p.display_name, p.avatar_url, p.stars_total, p.rank,
         (select count(*) from public.sneakers s where s.user_id = p.id) as pairs_count
  from public.profiles p
  where p.leaderboard_visible = true
  order by p.stars_total desc;
-- La vue hérite du RLS des tables sous-jacentes ; expose uniquement les profils opt-in.

-- ============================================================
-- 15. BACKFILL des comptes existants (jalons collec / prestige / diversité + complétude)
--     N'attribue PAS le "+10 par paire" rétroactif (choix : on crédite les jalons mérités,
--     pas la masse). Idempotent : réexécutable sans double-compte.
-- ============================================================
do $$
declare r record;
begin
  -- jalons par utilisateur ayant des paires
  for r in select distinct user_id from public.sneakers loop
    perform public._eval_milestones(r.user_id);
  end loop;
  -- complétude + prix par paire existante
  for r in select * from public.sneakers loop
    perform public._eval_pair(r);
  end loop;
  -- onboarding déjà acquis : pseudo / avatar / public / first_pair pour les comptes existants
  for r in select * from public.profiles loop
    if coalesce(r.pseudo_configured,false) then perform public._award(r.id,'set_pseudo',50,'account'); end if;
    if r.avatar_url is not null then perform public._award(r.id,'set_avatar',30,'account'); end if;
    if coalesce(r.collection_public,false) then perform public._award(r.id,'make_public',50,'account'); end if;
    if coalesce(r.pseudo_configured,false) and r.avatar_url is not null and coalesce(r.collection_public,false)
      then perform public._award(r.id,'profile_complete',50,'account'); end if;
    if exists(select 1 from public.sneakers where user_id=r.id)
      then perform public._award(r.id,'first_pair',100,'account'); end if;
  end loop;
end $$;

-- Recalcule rank final (sécurité, au cas où)
update public.profiles set rank = public.fn_rank(stars_total);
