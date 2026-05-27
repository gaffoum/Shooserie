/**
 * BackButton — bouton retour discret à afficher à gauche du logo
 * via le slot leftActions de AppHeader. Cible : /dashboard.
 */
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'

export function BackButton() {
  return (
    <Link
      to="/dashboard"
      style={backButtonStyle}
      aria-label="Retour au dashboard"
      title="Retour au dashboard"
    >
      <ArrowLeftIcon />
    </Link>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

const backButtonStyle: CSSProperties = {
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