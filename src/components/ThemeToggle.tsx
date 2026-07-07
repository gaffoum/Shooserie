import type { CSSProperties } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useT } from '@/i18n/I18nContext'

/**
 * Bouton compact de thème. Cycle clair → sombre → système → clair.
 * L'icône reflète la préférence courante (soleil / lune / écran « auto »).
 * Style basé sur les tokens pour suivre le thème actif.
 */
export function ThemeToggle() {
  const { pref, setPref } = useTheme()
  const { t } = useT()

  const order = ['light', 'dark', 'system'] as const
  const next = order[(order.indexOf(pref) + 1) % order.length]

  const label =
    pref === 'light' ? t('theme.light') : pref === 'dark' ? t('theme.dark') : t('theme.system')

  return (
    <button
      type="button"
      onClick={() => setPref(next)}
      className="app-header-theme"
      style={buttonStyle}
      aria-label={t('theme.toggle.aria')}
      title={`${t('theme.toggle.aria')} — ${label}`}
    >
      {pref === 'light' ? <SunIcon /> : pref === 'dark' ? <MoonIcon /> : <SystemIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

const buttonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
}
