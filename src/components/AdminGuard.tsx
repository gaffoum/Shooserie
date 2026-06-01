/**
 * AdminGuard — protege les routes /admin/*.
 * Si user non-admin, redirige vers /dashboard.
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isAdmin } from '@/lib/admin'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
        Chargement…
      </div>
    )
  }

  if (!user || !isAdmin(user.id)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}