/**
 * Système d'étoiles — côté toasts (feedback de gain).
 *
 * Le moteur crédite les étoiles côté serveur (triggers → ledger `star_events`).
 * Ici on centralise UNIQUEMENT la partie front : quels `rule_key` méritent un
 * toast (on notifie l'exploit, pas la routine) et leur libellé lisible, plus
 * l'accès en lecture au ledger. Réutilisable (toasts, futur historique).
 */
import { supabase } from './supabase'
import type { DictKey } from '@/i18n/dictionaries'

/** Ligne du ledger star_events (sous-ensemble lu par le front). */
export interface StarEvent {
  id: string
  rule_key: string
  points: number
  created_at: string
}

interface RuleMeta {
  /** true → affiche un toast ; false → gain silencieux (trop fréquent). */
  toastable: boolean
  /** Clé i18n du libellé lisible (présente seulement si toastable). */
  labelKey?: DictKey
}

/**
 * Mapping central rule_key → { toastable, labelKey }.
 * 🔔 toastable : jalons, prestige, diversité, activation, parrainage.
 * 🔕 silencieux : actions de routine (add_pair, wear, daily_login…).
 * Une clé absente est traitée comme silencieuse (fail-safe).
 */
export const STAR_RULES: Record<string, RuleMeta> = {
  // Jalons collection
  m_5: { toastable: true, labelKey: 'stars.rule.m_5' },
  m_10: { toastable: true, labelKey: 'stars.rule.m_10' },
  m_25: { toastable: true, labelKey: 'stars.rule.m_25' },
  m_50: { toastable: true, labelKey: 'stars.rule.m_50' },
  m_100: { toastable: true, labelKey: 'stars.rule.m_100' },
  m_250: { toastable: true, labelKey: 'stars.rule.m_250' },
  // Prestige / rareté
  first_rare: { toastable: true, labelKey: 'stars.rule.first_rare' },
  first_ultra: { toastable: true, labelKey: 'stars.rule.first_ultra' },
  first_grail: { toastable: true, labelKey: 'stars.rule.first_grail' },
  grail_5: { toastable: true, labelKey: 'stars.rule.grail_5' },
  full_metal: { toastable: true, labelKey: 'stars.rule.full_metal' },
  // Diversité
  brand_3: { toastable: true, labelKey: 'stars.rule.brand_3' },
  brand_5: { toastable: true, labelKey: 'stars.rule.brand_5' },
  models_10: { toastable: true, labelKey: 'stars.rule.models_10' },
  // Activation
  first_pair: { toastable: true, labelKey: 'stars.rule.first_pair' },
  // Parrainage
  referral_signup: { toastable: true, labelKey: 'stars.rule.referral_signup' },
  referral_activated: { toastable: true, labelKey: 'stars.rule.referral_activated' },
  ref_3: { toastable: true, labelKey: 'stars.rule.ref_3' },
  ref_10: { toastable: true, labelKey: 'stars.rule.ref_10' },
  // Silencieux (routine)
  add_pair: { toastable: false },
  complete_pair: { toastable: false },
  price_pair: { toastable: false },
  daily_login: { toastable: false },
  wear: { toastable: false },
  read_story: { toastable: false },
  list_pair: { toastable: false },
  set_pseudo: { toastable: false },
  set_avatar: { toastable: false },
  make_public: { toastable: false },
  profile_complete: { toastable: false },
  share_app: { toastable: false },
}

/** Un gain sur cette règle doit-il déclencher un toast ? */
export function isToastable(ruleKey: string): boolean {
  return STAR_RULES[ruleKey]?.toastable ?? false
}

/** Clé i18n du libellé lisible d'une règle (fallback générique si absente). */
export function getRuleLabelKey(ruleKey: string): DictKey {
  return STAR_RULES[ruleKey]?.labelKey ?? 'stars.rule.generic'
}

/**
 * Événements du ledger de l'utilisateur créés STRICTEMENT après `sinceIso`,
 * ordre chronologique. Sert de curseur anti-re-notification.
 */
export async function fetchStarEventsSince(
  userId: string,
  sinceIso: string,
): Promise<StarEvent[]> {
  const { data, error } = await supabase
    .from('star_events')
    .select('id, rule_key, points, created_at')
    .eq('user_id', userId)
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as StarEvent[]
}

/** created_at du dernier événement de l'utilisateur (null si aucun). */
export async function fetchLatestStarEventAt(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('star_events')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as { created_at: string } | null)?.created_at ?? null
}

/** Total + rang courants de l'utilisateur, lus à la volée (fraîcheur garantie). */
export async function fetchProfileStars(
  userId: string,
): Promise<{ stars_total: number; rank: string } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('stars_total, rank')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return null
  const row = data as { stars_total: number | null; rank: string | null }
  return { stars_total: row.stars_total ?? 0, rank: row.rank ?? 'rookie' }
}
