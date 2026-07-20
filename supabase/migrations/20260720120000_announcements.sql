-- Migration : page « Nouveautés » (annonces communauté).
--
-- Additive et idempotente. Versionnée pour documentation : le schéma est DÉJÀ
-- appliqué en dev (aqjxkrbnopkvlebchnte) ET en prod (eykhnpnmpcrvcpajirst) —
-- ce fichier n'est pas rejoué, il fait foi de la structure en place.
--
-- Table alimentée en service_role (aucune écriture côté client). La pastille
-- non-lue et le marquage « vu » s'appuient sur profiles.announcements_seen_at,
-- couvert par la policy d'auto-update existante « Users can update own profile ».

-- Annonces communauté ------------------------------------------------------
create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  category     text not null default 'info',   -- info | feature | fix
  published_at timestamptz not null default now(),
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Lecture des annonces publiées, la plus récente d'abord.
create index if not exists announcements_published_idx
  on public.announcements (published_at desc)
  where is_published;

-- RLS : lecture réservée aux utilisateurs authentifiés, uniquement si publié.
-- Aucune policy d'écriture : la publication passe par service_role (bypass RLS).
alter table public.announcements enable row level security;

drop policy if exists "Authenticated read published announcements" on public.announcements;
create policy "Authenticated read published announcements"
  on public.announcements
  for select
  to authenticated
  using (is_published = true);

-- Profil : dernière consultation de la page Nouveautés (NULL = jamais ouverte).
alter table public.profiles
  add column if not exists announcements_seen_at timestamptz;
