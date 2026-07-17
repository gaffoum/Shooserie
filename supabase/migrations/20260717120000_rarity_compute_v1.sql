-- ============================================================
-- Shooserie — Calcul automatique de la rareté (V1 : ratio cote/retail)
-- Additif, non destructif. À tester sur la base DEV (aqjxkrbnopkvlebchnte)
-- UNIQUEMENT. PAS de prod dans ce brief.
--
-- Colonnes réelles : release_price = prix retail, market_price = cote (EUR).
-- Le trigger est BEFORE INSERT/UPDATE → il pose rarity AVANT les triggers
-- AFTER d'étoiles (trg_sneaker_ins/upd), donc _eval_milestones voit la bonne
-- rareté et crédite first_rare/first_ultra/first_grail dans la même transaction.
-- ============================================================

-- ---------- Barème V1 + score, dans un trigger BEFORE ----------
create or replace function public._sneaker_compute_rarity()
returns trigger language plpgsql as $$
declare
  v_retail numeric := NEW.release_price;
  v_cote   numeric := NEW.market_price;
  v_ratio  numeric;
  v_tier   rarity_tier;
  v_score  int;
  v_frac   numeric;
begin
  -- 1. Respecter les overrides manuels : ne jamais recalculer.
  if NEW.rarity_source = 'manual' then
    return NEW;
  end if;

  -- 2. Données insuffisantes (retail OU cote absent/0) → unknown (auto),
  --    pas de valeur trompeuse.
  if v_retail is null or v_retail <= 0 or v_cote is null or v_cote <= 0 then
    NEW.rarity := 'unknown';
    NEW.rarity_score := null;
    NEW.rarity_source := 'auto';
    return NEW;
  end if;

  v_ratio := v_cote / v_retail;

  -- 3. Barème V1 (ratio) + garde-fou grail par valeur absolue (cote > 3000 €).
  --    Score borné dans la bande du tier (0-20 / 20-40 / 40-65 / 65-85 / 90-100).
  if v_cote > 3000 or v_ratio >= 7 then
    v_tier  := 'grail';
    v_frac  := least(1, greatest(0, (v_ratio - 7) / 7));   -- 0 si garde-fou seul
    v_score := round(90 + v_frac * 10)::int;               -- 90..100
  elsif v_ratio >= 3 then
    v_tier  := 'ultra_rare';
    v_frac  := (v_ratio - 3) / 4;                          -- 0..1 sur [3,7)
    v_score := round(65 + v_frac * 20)::int;               -- 65..85
  elsif v_ratio >= 1.5 then
    v_tier  := 'rare';
    v_frac  := (v_ratio - 1.5) / 1.5;                      -- 0..1 sur [1.5,3)
    v_score := round(40 + v_frac * 25)::int;               -- 40..65
  elsif v_ratio >= 1 then
    v_tier  := 'peu_commune';
    v_frac  := (v_ratio - 1) / 0.5;                        -- 0..1 sur [1,1.5)
    v_score := round(20 + v_frac * 20)::int;               -- 20..40
  else
    v_tier  := 'commune';
    v_frac  := least(1, greatest(0, v_ratio));            -- 0..1 sur [0,1)
    v_score := round(v_frac * 20)::int;                    -- 0..20
  end if;

  NEW.rarity        := v_tier;
  NEW.rarity_score  := v_score;
  NEW.rarity_source := 'auto';
  return NEW;
end $$;

-- ---------- Trigger BEFORE INSERT/UPDATE ----------
-- Nommé pour passer avant trigger_sneakers_updated_at (ordre alpha des BEFORE),
-- sans conséquence fonctionnelle (les deux ne font que poser des champs NEW).
drop trigger if exists trg_sneaker_rarity on public.sneakers;
create trigger trg_sneaker_rarity
  before insert or update on public.sneakers
  for each row execute function public._sneaker_compute_rarity();
