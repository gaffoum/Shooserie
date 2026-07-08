/**
 * Histoires éditoriales des paires (dos de carte TCG). Contenu par MODÈLE,
 * rattaché au nom via `match_pattern` (matching ILIKE côté client).
 * Table `public.sneaker_stories` (migration 20260708120000).
 */

export interface SneakerStory {
  id: string
  match_pattern: string
  title: string
  story: string
  year_context: string | null
  created_at: string
  updated_at: string
}

// Le hook de chargement `useSneakerStories()` est ajouté au Lot 4.
