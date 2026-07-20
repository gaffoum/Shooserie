import type { CSSProperties } from 'react'
import { useTheme, THEME_ORDER, type Theme } from '@/contexts/ThemeContext'
import { useT } from '@/i18n/I18nContext'
import type { DictKey } from '@/i18n/dictionaries'

/**
 * Bouton compact de thème (header). Cycle les 4 thèmes :
 * Sombre → Clair → South Beach Dark → South Beach Light → Sombre.
 * L'icône reflète la famille (lune = sombre, soleil = clair) ; une pastille
 * cyan signale les thèmes South Beach. Le sélecteur complet vit dans les
 * Paramètres (Account).
 */
export const THEME_LABEL_KEY: Record<Theme, DictKey> = {
  dark: 'theme.dark',
  light: 'theme.light',
  'sb-dark': 'theme.sbDark',
  'sb-light': 'theme.sbLight',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useT()

  const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]
  const isDarkFamily = theme === 'dark' || theme === 'sb-dark'
  const isSouthBeach = theme === 'sb-dark' || theme === 'sb-light'
  const label = t(THEME_LABEL_KEY[theme])

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="app-header-theme"
      style={buttonStyle}
      aria-label={t('theme.toggle.aria')}
      title={`${t('theme.toggle.aria')} — ${label}`}
    >
      {isDarkFamily ? <MoonIcon /> : <SunIcon />}
      {isSouthBeach && <span style={sbDotStyle} aria-hidden />}
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

const buttonStyle: CSSProperties = {
  position: 'relative',
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

const sbDotStyle: CSSProperties = {
  position: 'absolute',
  top: 4,
  right: 4,
  width: 6,
  height: 6,
  borderRadius: '50%',
  background: 'var(--color-bred)',
}
