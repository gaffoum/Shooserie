-- Système de rareté (additif, non destructif). Déjà appliqué en prod le 2026-07-07.
do $$ begin
  create type rarity_tier as enum
    ('unknown','commune','peu_commune','rare','ultra_rare','grail');
exception when duplicate_object then null; end $$;

do $$ begin
  create type release_type as enum
    ('gr','gr_limitee','collab','hyperstrike','fnf','sample','numerotee','pe');
exception when duplicate_object then null; end $$;

alter table public.sneakers
  add column if not exists rarity        rarity_tier  not null default 'unknown',
  add column if not exists rarity_source text         not null default 'auto',
  add column if not exists rarity_score  integer,
  add column if not exists release_type  release_type,
  add column if not exists sold_out      boolean,
  add column if not exists collection_number text;

do $$ begin
  alter table public.sneakers
    add constraint sneakers_rarity_source_chk check (rarity_source in ('auto','manual'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.sneakers
    add constraint sneakers_rarity_score_chk check (rarity_score is null or (rarity_score between 0 and 100));
exception when duplicate_object then null; end $$;

create index if not exists sneakers_rarity_idx on public.sneakers (rarity);
