/**
 * Histoires éditoriales des paires (dos de carte TCG). Contenu par MODÈLE,
 * rattaché au nom via `match_pattern` (matching ILIKE côté client).
 * Table `public.sneaker_stories` (migration 20260708120000).
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export interface SneakerStory {
  id: string
  match_pattern: string
  title: string
  story: string
  year_context: string | null
  created_at: string
  updated_at: string
}

/**
 * Charge toutes les histoires (~22 lignes) en une requête, cache 1h.
 * Le rattachement au nom se fait côté client (`matchStory`), pas en SQL.
 */
export function useSneakerStories() {
  return useQuery({
    queryKey: ['sneaker_stories'],
    queryFn: async (): Promise<SneakerStory[]> => {
      const { data, error } = await supabase.from('sneaker_stories').select('*')
      if (error) throw error
      return (data as SneakerStory[]) ?? []
    },
    staleTime: 60 * 60 * 1000, // 1h
  })
}

/**
 * Rattache une histoire à un nom de paire par inclusion insensible à la casse
 * (équivalent client de `name ILIKE '%match_pattern%'`). En cas de motifs
 * multiples qui matchent, le plus long (le plus spécifique) l'emporte.
 */
export function matchStory(
  name: string | null | undefined,
  stories: SneakerStory[] | undefined,
): SneakerStory | null {
  if (!name || !stories?.length) return null
  const hay = name.toLowerCase()
  let best: SneakerStory | null = null
  for (const s of stories) {
    const pat = s.match_pattern.trim().toLowerCase()
    if (pat && hay.includes(pat)) {
      if (!best || pat.length > best.match_pattern.trim().length) best = s
    }
  }
  return best
}
