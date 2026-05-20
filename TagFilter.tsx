import { useT } from '@/i18n/I18nContext'
import type { CSSProperties } from 'react'

/**
 * Ultra-compact FR/EN toggle. Shows the currently active language as a tappable
 * pill; clicking switches to the other. Designed to stay narrow even on small
 * mobile headers, where every pixel of horizontal space matters.
 */
export function LanguageToggle() {
  const { lang, toggleLang, t } = useT()

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t('lang.toggle.label')}
      title={t('lang.toggle.label')}
      style={btnStyle}
    >
      <GlobeIcon />
      <span style={labelStyle}>{lang.toUpperCase()}</span>
    </button>
  )
}

function GlobeIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

const btnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 9px',
  fontSize: 10,
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}
const labelStyle: CSSProperties = {
  color: 'var(--color-text)',
}
