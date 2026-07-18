import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSneakers, useMyProfile, useUpdateMyProfile } from '@/lib/queries'
import { normalizeBrand } from '@/lib/collectionGrouping'
import { useT } from '@/i18n/I18nContext'
import { WelcomeCelebration } from './WelcomeCelebration'

/**
 * Date de lancement du système d'étoiles (go-live). Garde-fou : SEULS les
 * comptes créés AVANT cette date voient l'écran de bienvenue rétroactif. Un
 * nouvel inscrit après le lancement gagne ses étoiles organiquement et ne doit
 * jamais voir cet écran (même après avoir dépassé stars_total > 0).
 * ⚠️ À caler sur le moment réel de mise en production.
 */
const WELCOME_LAUNCH_CUTOFF_MS = Date.parse('2026-07-18T00:00:00Z')

/**
 * Décide de l'affichage de l'écran de bienvenue post-lancement, une seule fois
 * et pour toujours (marqueur base `profiles.welcome_seen_at`, jamais localStorage
 * → cohérent multi-appareils).
 *
 * Conditions : connecté ET welcome_seen_at IS NULL ET stars_total > 0 ET compte
 * créé avant le lancement. À l'affichage, on écrit welcome_seen_at = now() sur
 * son propre profil (autorisé, auth.uid() = id).
 */
export function WelcomeGate() {
  const { t } = useT()
  const { user } = useAuth()
  const { data: profile } = useMyProfile()
  const { data: sneakers } = useSneakers()
  const update = useUpdateMyProfile()

  const [show, setShow] = useState(false)
  const decidedFor = useRef<string | null>(null)

  useEffect(() => {
    const uid = user?.id ?? null
    if (!uid) {
      decidedFor.current = null
      setShow(false)
      return
    }
    if (decidedFor.current === uid) return
    if (!profile || !sneakers) return // on attend les données

    decidedFor.current = uid
    const eligible =
      profile.welcome_seen_at == null &&
      (profile.stars_total ?? 0) > 0 &&
      Number.isFinite(WELCOME_LAUNCH_CUTOFF_MS) &&
      new Date(profile.created_at).getTime() < WELCOME_LAUNCH_CUTOFF_MS

    if (eligible) {
      setShow(true)
      // Marque « vu » immédiatement (persiste même si l'onglet est fermé).
      update.mutate({ welcome_seen_at: new Date().toISOString() })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile, sneakers])

  const stats = useMemo(() => {
    const list = sneakers ?? []
    const pairs = list.length
    const grails = list.filter((s) => s.rarity === 'grail').length
    const brands = new Set(list.map((s) => normalizeBrand(s.brand))).size
    const tiers = new Set(
      list.map((s) => s.rarity).filter((r) => r && r !== 'unknown'),
    ).size
    const milestones: string[] = []
    if (grails >= 5) milestones.push(t('stars.rule.grail_5'))
    else if (grails >= 1) milestones.push(t('stars.rule.first_grail'))
    if (tiers === 5) milestones.push(t('stars.rule.full_metal'))
    if (brands >= 5) milestones.push(t('stars.rule.brand_5'))
    else if (brands >= 3) milestones.push(t('stars.rule.brand_3'))
    if (pairs >= 250) milestones.push(t('stars.rule.m_250'))
    else if (pairs >= 100) milestones.push(t('stars.rule.m_100'))
    else if (pairs >= 50) milestones.push(t('stars.rule.m_50'))
    else if (pairs >= 25) milestones.push(t('stars.rule.m_25'))
    else if (pairs >= 10) milestones.push(t('stars.rule.m_10'))
    else if (pairs >= 5) milestones.push(t('stars.rule.m_5'))
    return { pairs, grails, brands, milestones }
  }, [sneakers, t])

  if (!show || !profile) return null

  return (
    <WelcomeCelebration
      starsTotal={profile.stars_total ?? 0}
      rank={profile.rank ?? 'rookie'}
      pairs={stats.pairs}
      grails={stats.grails}
      brands={stats.brands}
      milestones={stats.milestones}
      onClose={() => setShow(false)}
    />
  )
}
