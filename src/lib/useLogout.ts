import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Déconnexion VOLONTAIRE : ferme la session, purge tout le cache TanStack Query
 * (aucune donnée de l'ancien compte ne reste visible), puis renvoie vers la
 * landing publique `/`.
 *
 * NB : le cas (b) — session expirée / accès à une route protégée sans être
 * connecté — n'est PAS géré ici : c'est ProtectedRoute qui redirige alors vers
 * `/login` (on garde l'utilisateur dans le flux d'auth pour qu'il retrouve la
 * page voulue). Seule la déconnexion explicite mène à `/`.
 */
export function useLogout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  return async () => {
    await signOut()
    qc.clear()
    navigate('/', { replace: true })
  }
}
