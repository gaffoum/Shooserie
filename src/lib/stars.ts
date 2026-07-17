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

/**
 * Niveau d'intensité visuelle d'un gain :
 *  - 'silent'      : aucun toast (routine trop fréquente).
 *  - 'pop'         : toast coin bas-droit avec animation de pop (gains normaux).
 *  - 'celebration' : carte plein premier plan holographique (les sommets).
 */
export type StarTier = 'silent' | 'pop' | 'celebration'

interface RuleMeta {
  /** Niveau d'affichage ; 'silent' = pas de toast. */
  tier: StarTier
  /** Clé i18n du libellé lisible (présente sauf pour 'silent'). */
  labelKey?: DictKey
}

/**
 * Mapping central rule_key → { tier, labelKey }.
 * 🔕 silent : routine (add_pair, wear, daily_login…).
 * 🔔 pop : petits/moyens jalons, prestige bas, diversité, activation, parrainage.
 * 🎉 celebration : gros jalons (m_50+), prestige haut, full_metal. Le changement
 *    de rang est TOUJOURS celebration (géré à part, pas via un rule_key).
 * Une clé absente est traitée comme 'silent' (fail-safe).
 */
export const STAR_RULES: Record<string, RuleMeta> = {
  // Jalons collection — petits/moyens = pop, gros = celebration
  m_5: { tier: 'pop', labelKey: 'stars.rule.m_5' },
  m_10: { tier: 'pop', labelKey: 'stars.rule.m_10' },
  m_25: { tier: 'pop', labelKey: 'stars.rule.m_25' },
  m_50: { tier: 'celebration', labelKey: 'stars.rule.m_50' },
  m_100: { tier: 'celebration', labelKey: 'stars.rule.m_100' },
  m_250: { tier: 'celebration', labelKey: 'stars.rule.m_250' },
  // Prestige / rareté — première rare = pop, le reste = celebration
  first_rare: { tier: 'pop', labelKey: 'stars.rule.first_rare' },
  first_ultra: { tier: 'celebration', labelKey: 'stars.rule.first_ultra' },
  first_grail: { tier: 'celebration', labelKey: 'stars.rule.first_grail' },
  grail_5: { tier: 'celebration', labelKey: 'stars.rule.grail_5' },
  full_metal: { tier: 'celebration', labelKey: 'stars.rule.full_metal' },
  // Diversité
  brand_3: { tier: 'pop', labelKey: 'stars.rule.brand_3' },
  brand_5: { tier: 'pop', labelKey: 'stars.rule.brand_5' },
  models_10: { tier: 'pop', labelKey: 'stars.rule.models_10' },
  // Activation
  first_pair: { tier: 'pop', labelKey: 'stars.rule.first_pair' },
  // Parrainage
  referral_signup: { tier: 'pop', labelKey: 'stars.rule.referral_signup' },
  referral_activated: { tier: 'pop', labelKey: 'stars.rule.referral_activated' },
  ref_3: { tier: 'pop', labelKey: 'stars.rule.ref_3' },
  ref_10: { tier: 'pop', labelKey: 'stars.rule.ref_10' },
  // Silencieux (routine) — pas de toast, MAIS un libellé pour l'historique
  // (la page « Ma progression » montre TOUS les gains, contrairement aux toasts).
  add_pair: { tier: 'silent', labelKey: 'stars.rule.add_pair' },
  complete_pair: { tier: 'silent', labelKey: 'stars.rule.complete_pair' },
  price_pair: { tier: 'silent', labelKey: 'stars.rule.price_pair' },
  daily_login: { tier: 'silent', labelKey: 'stars.rule.daily_login' },
  wear: { tier: 'silent', labelKey: 'stars.rule.wear' },
  read_story: { tier: 'silent', labelKey: 'stars.rule.read_story' },
  list_pair: { tier: 'silent', labelKey: 'stars.rule.list_pair' },
  set_pseudo: { tier: 'silent', labelKey: 'stars.rule.set_pseudo' },
  set_avatar: { tier: 'silent', labelKey: 'stars.rule.set_avatar' },
  make_public: { tier: 'silent', labelKey: 'stars.rule.make_public' },
  profile_complete: { tier: 'silent', labelKey: 'stars.rule.profile_complete' },
  share_app: { tier: 'silent', labelKey: 'stars.rule.share_app' },
}

/** Niveau d'affichage d'une règle (fail-safe → 'silent'). */
export function getTier(ruleKey: string): StarTier {
  return STAR_RULES[ruleKey]?.tier ?? 'silent'
}

/** Un gain sur cette règle doit-il déclencher un toast ? */
export function isToastable(ruleKey: string): boolean {
  return getTier(ruleKey) !== 'silent'
}

/** Clé i18n du libellé lisible d'une règle (fallback générique si absente). */
export function getRuleLabelKey(ruleKey: string): DictKey {
  return STAR_RULES[ruleKey]?.labelKey ?? 'stars.rule.generic'
}

/**
 * Clé i18n du libellé d'une règle, ou null si la règle est inconnue.
 * Pour l'historique : le caller affiche le rule_key brut quand null (jamais de
 * plantage sur une future règle non mappée).
 */
export function ruleLabelKeyOf(ruleKey: string): DictKey | null {
  return STAR_RULES[ruleKey]?.labelKey ?? null
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
