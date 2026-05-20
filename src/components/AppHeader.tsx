import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ADMIN_EMAIL, useUserCount } from '@/lib/queries'
import { useT } from '@/i18n/I18nContext'
import { Logo } from './Logo'
import { LanguageToggle } from './LanguageToggle'
import type { CSSProperties, ReactNode } from 'react'

interface AppHeaderProps {
  /** Slot pour des actions à droite avant l'avatar (ex: bouton retour) */
  leftActions?: ReactNode
  /** Slot pour des actions custom à droite */
  rightActions?: ReactNode
}

export function AppHeader({ leftActions, rightActions }: AppHeaderProps) {
  const { user } = useAuth()
  const { t } = useT()
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

      <div className="app-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {rightActions}
        {isAdmin && (
          <Link
            to="/admin"
            className="app-header-badge"
            style={userCountBadgeStyle}
            title="Monitoring · cliquer pour ouvrir"
          >
            👥 {userCount ?? '—'}
          </Link>
        )}
        {/* Email = lien vers la page compte sur desktop ; icône user en mobile */}
        <Link
          to="/account"
          className="app-header-email"
          style={emailStyle}
          title={user?.email ?? ''}
          aria-label={t('account.aria')}
        >
          {user?.email}
        </Link>
        <Link
          to="/account"
          className="app-header-account-icon"
          aria-label={t('account.aria')}
          title={t('account.aria')}
          style={accountIconStyle}
        >
          <UserIcon />
        </Link>
        <LanguageToggle />
      </div>
    </header>
  )
}

function UserIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
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
  textDecoration: 'none',
  cursor: 'pointer',
  padding: '6px 10px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface)',
}

// Mobile-only icon button to access the account page when the email is hidden.
// CSS rule in index.css flips visibility based on viewport width.
const accountIconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  flexShrink: 0,
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
  textDecoration: 'none',
  cursor: 'pointer',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-display)',
  whiteSpace: 'nowrap',
}
