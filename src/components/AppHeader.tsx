import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_EMAIL, useUserCount } from '@/lib/queries'
import { Logo } from './Logo'
import type { CSSProperties, ReactNode } from 'react'

interface AppHeaderProps {
  /** Slot pour des actions à droite avant l'avatar (ex: bouton retour) */
  leftActions?: ReactNode
  /** Slot pour des actions custom à droite */
  rightActions?: ReactNode
}

export function AppHeader({ leftActions, rightActions }: AppHeaderProps) {
  const { user, signOut } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL
  const { data: userCount } = useUserCount(user?.email)

  return (
    <header className="app-header" style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {leftActions}
        <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>
          <Logo size="md" />
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {rightActions}
        {isAdmin && userCount !== undefined && (
          <span
            style={userCountBadgeStyle}
            title={`${userCount} utilisateur${userCount > 1 ? 's' : ''} inscrit${userCount > 1 ? 's' : ''} au total`}
          >
            👥 {userCount}
          </span>
        )}
        <span className="app-header-email" style={emailStyle} title={user?.email ?? ''}>
          {user?.email}
        </span>
        <button onClick={signOut} aria-label="Déconnexion" style={signoutStyle}>
          Sortir
        </button>
      </div>
    </header>
  )
}

const headerStyle: CSSProperties = {
  background: 'var(--color-surface)',
  borderBottom: '1px solid var(--color-border)',
  padding: '14px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backdropFilter: 'saturate(180%) blur(8px)',
  WebkitBackdropFilter: 'saturate(180%) blur(8px)',
}

const emailStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  maxWidth: 160,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const signoutStyle: CSSProperties = {
  padding: '8px 12px',
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  fontWeight: 500,
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface)',
  fontFamily: 'var(--font-display)',
}

const userCountBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  fontSize: 11,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-royal)',
  background: 'rgba(29, 66, 138, 0.08)',
  border: '1px solid rgba(29, 66, 138, 0.2)',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-display)',
  whiteSpace: 'nowrap',
  cursor: 'default',
}
