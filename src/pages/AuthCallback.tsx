import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Reçoit la redirection après clic sur le lien magique.
 * Supabase détecte le token dans le hash de l'URL automatiquement
 * grâce à l'option `detectSessionInUrl: true`.
 */
export function AuthCallback() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (session) {
      navigate('/dashboard', { replace: true })
    } else {
      // Le token n'a pas pu être validé, on retourne sur login
      navigate('/login', { replace: true })
    }
  }, [session, loading, navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)',
        fontSize: 12,
        letterSpacing: 'var(--tracking-wider)',
        textTransform: 'uppercase',
      }}
    >
      Connexion en cours…
    </div>
  )
}
