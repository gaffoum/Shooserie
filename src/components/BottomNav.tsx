import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useT } from '@/i18n/I18nContext'
import './BottomNav.css'

/**
 * Barre de navigation basse — 5 destinations + FAB central (handoff Niveau 2).
 * Collection · Communauté · [＋ FAB] · Marketplace · Profil.
 * Persistante sur les écrans authentifiés ; masquée sur auth / partage public /
 * flux Ajouter (scan). Les pages non encore restylées gardent leur rendu.
 */

// Préfixes où la nav est MASQUÉE (auth, public, flux Ajouter/scan, messagerie
// — le champ de saisie collant y récupère tout l'espace bas).
const HIDDEN_PREFIXES = ['/login', '/reset-password', '/share', '/sneakers/new', '/messages']

interface Dest {
  key: string
  to: string
  labelKey: Parameters<ReturnType<typeof useT>['t']>[0]
  /** Préfixes de chemin qui activent cet onglet. */
  match: string[]
  icon: ReactNode
}

const DESTS: Dest[] = [
  {
    key: 'collection',
    to: '/dashboard',
    labelKey: 'nav.collection',
    match: ['/dashboard', '/sneakers'],
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    key: 'community',
    to: '/community',
    labelKey: 'nav.community',
    match: ['/community', '/u/'],
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: 'marketplace',
    to: '/marketplace',
    labelKey: 'nav.marketplace',
    match: ['/marketplace'],
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
  },
  {
    key: 'profile',
    to: '/account',
    labelKey: 'nav.profile',
    match: ['/account', '/progression', '/ventes', '/orders'],
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
      </svg>
    ),
  },
]

function isActive(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p))
}

export function BottomNav() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const { t } = useT()

  const hidden =
    !user || HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p))

  // Réserve l'espace de scroll (padding-bottom) quand la nav est visible.
  useEffect(() => {
    document.body.classList.toggle('has-bottom-nav', !hidden)
    return () => document.body.classList.remove('has-bottom-nav')
  }, [hidden])

  if (hidden) return null

  // Insère le FAB au centre (index 2) des 4 destinations.
  const left = DESTS.slice(0, 2)
  const right = DESTS.slice(2)

  return (
    <nav className="bottom-nav" aria-label={t('nav.aria')}>
      {left.map((d) => (
        <NavItem key={d.key} dest={d} active={isActive(pathname, d.match)} t={t} />
      ))}

      <Link to="/sneakers/new" className="bottom-nav__fab" aria-label={t('nav.add')}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>

      {right.map((d) => (
        <NavItem key={d.key} dest={d} active={isActive(pathname, d.match)} t={t} />
      ))}
    </nav>
  )
}

function NavItem({
  dest,
  active,
  t,
}: {
  dest: Dest
  active: boolean
  t: ReturnType<typeof useT>['t']
}) {
  return (
    <Link
      to={dest.to}
      className={'bottom-nav__item' + (active ? ' is-active' : '')}
      aria-current={active ? 'page' : undefined}
    >
      {dest.icon}
      <span className="lab bottom-nav__label">{t(dest.labelKey)}</span>
    </Link>
  )
}
