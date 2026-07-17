/**
 * Branchement des RPC d'engagement du moteur d'étoiles (déjà déployées en base).
 *
 * Ces gains sont SILENCIEUX (niveau 1 des toasts) : ils créditent des étoiles
 * sans toast, apparaissent dans l'historique « Ma progression », et peuvent
 * faire franchir un palier de rang (→ toast de rang, voulu).
 *
 * Tous les plafonds / dédup (par jour, par pattern, one-shot) sont gérés côté
 * SQL : appeler la RPC à chaque occurrence est sans risque (les appels au-delà
 * du plafond sont ignorés). Erreurs volontairement silencieuses : l'engagement
 * est un bonus, jamais un flux critique — on ne bloque ni ne bruite l'UI.
 */
import { supabase } from './supabase'

async function fireAndForget(
  fn: string,
  params?: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await supabase.rpc(fn, params)
    if (error && import.meta.env.DEV) {
      console.debug(`[engagement] ${fn} ignoré:`, error.message)
    }
  } catch (e) {
    if (import.meta.env.DEV) console.debug(`[engagement] ${fn} exception:`, e)
  }
}

/** Connexion du jour (+5, 1×/jour via dédup SQL). */
export function awardDailyLogin(): void {
  void fireAndForget('award_daily_login')
}

/** Lecture d'une histoire (+2, plafond 20/jour, dédup par pattern). */
export function awardReadStory(pattern: string | null | undefined): void {
  if (!pattern) return
  void fireAndForget('award_read_story', { p_pattern: pattern })
}

/** Port d'une paire (+2, plafond 10/jour). */
export function awardWear(sneakerId: string | null | undefined): void {
  if (!sneakerId) return
  void fireAndForget('award_wear', { p_sneaker: sneakerId })
}

/** Partage de l'app (+10, one-shot). */
export function awardShareApp(): void {
  void fireAndForget('award_share_app')
}

/** Jalon « 10 modèles distincts » (+150). No-op sous le seuil. */
export function awardModelsMilestone(distinct: number): void {
  if (distinct < 10) return
  void fireAndForget('award_models_milestone', { p_distinct: distinct })
}
