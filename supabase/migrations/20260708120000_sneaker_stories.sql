-- Histoires éditoriales des paires (dos de carte TCG), par MODÈLE.
-- Rattachement au nom de la sneaker via match_pattern (ILIKE %...%), côté client.
-- Appliquée en prod le 2026-07-08.
create table if not exists public.sneaker_stories (
  id uuid primary key default gen_random_uuid(),
  match_pattern text not null,      -- motif de rattachement au nom, ex. 'Travis Scott Mocha'
  title text not null,              -- titre éditorial
  story text not null,              -- 3-6 phrases, français, ton sobre
  year_context text,                -- ex. '1985' / '2017'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sneaker_stories enable row level security;

-- Lecture : tous les utilisateurs authentifiés. Écriture : réservée admin/service
-- (aucune policy insert/update pour les users).
create policy "stories readable by authenticated"
  on public.sneaker_stories for select to authenticated using (true);
