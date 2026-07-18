-- Colonne welcome_seen_at : NULL = écran de bienvenue post-lancement jamais vu.
-- Appliquée en prod dans le lot « star_system_etape1_additif » (20260718092000)
-- et sur la dev ; versionnée ici pour que le repo reflète l'historique réel.
-- Idempotente.
alter table public.profiles
  add column if not exists welcome_seen_at timestamptz;
