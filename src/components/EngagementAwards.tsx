import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSneakers } from '@/lib/queries'
import { groupByBrandModel } from '@/lib/collectionGrouping'
import { awardDailyLogin, awardModelsMilestone } from '@/lib/engagement'

/**
 * Composant headless (rend null) qui déclenche les gains d'engagement non liés
 * à un handler UI précis :
 *  - `award_daily_login` : une fois par session dès qu'un utilisateur est connecté.
 *  - `award_models_milestone` : quand le nombre de modèles distincts atteint 10.
 *
 * Les gains liés à une action UI (wear, lecture d'histoire, partage) sont
 * branchés directement dans leurs handlers respectifs.
 */
export function EngagementAwards() {
  const { user } = useAuth()
  const { data: sneakers } = useSneakers()
  const loginUserRef = useRef<string | null>(null)
  const modelsFiredRef = useRef(false)

  // Connexion du jour — une seule fois par (session, utilisateur). Le SQL
  // dédupe par jour, donc les rechargements ne re-créditent pas.
  useEffect(() => {
    const uid = user?.id
    if (!uid || loginUserRef.current === uid) return
    loginUserRef.current = uid
    awardDailyLogin()
  }, [user?.id])

  // Jalon « 10 modèles distincts » — compté via le même regroupement que le
  // classeur (brand → model). One-shot côté SQL ; on n'appelle qu'une fois par
  // session au franchissement pour éviter les appels inutiles.
  useEffect(() => {
    if (!sneakers || sneakers.length === 0 || modelsFiredRef.current) return
    const distinct = groupByBrandModel(sneakers).reduce((n, b) => n + b.models.length, 0)
    if (distinct >= 10) {
      modelsFiredRef.current = true
      awardModelsMilestone(distinct)
    }
  }, [sneakers])

  return null
}
