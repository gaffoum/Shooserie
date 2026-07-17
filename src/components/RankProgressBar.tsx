import type { CSSProperties } from 'react'
import { getRankProgress } from '@/lib/ranks'
import { useT } from '@/i18n/I18nContext'

interface RankProgressBarProps {
  /** profiles.stars_total — null/undefined toléré (fallback 0) */
  starsTotal: number | null | undefined
}

/**
 * Barre fine de progression vers le rang suivant + libellé « encore X ⭐ pour … ».
 * Autonome et réutilisable (Portfolio aujourd'hui, profil/leaderboard demain) :
 * toute la logique de calcul vit dans lib/ranks.ts (getRankProgress).
 * Cas rang maximal (General OG) : barre pleine + « Rang maximal atteint ».
 */
export function RankProgressBar({ starsTotal }: RankProgressBarProps) {
  const { t, lang } = useT()
  const { next, reste, pct, isMax } = getRankProgress(starsTotal)

  const fmt = (n: number) => n.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')

  const label = isMax
    ? t('stars.progress.max')
    : t('stars.progress.remaining', { n: fmt(reste), rank: next?.label ?? '' })

  return (
    <div style={wrapStyle}>
      <div
        style={trackStyle}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label={label}
      >
        <div style={{ ...fillStyle, width: `${pct}%` }} />
      </div>
      <div style={labelStyle}>{label}</div>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
}

const trackStyle: CSSProperties = {
  height: 6,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-surface-alt)',
  border: '1px solid var(--color-border)',
  overflow: 'hidden',
}

const fillStyle: CSSProperties = {
  height: '100%',
  background: 'var(--color-bred)',
  borderRadius: 'var(--radius-pill)',
  transition: 'width var(--transition-slow)',
}

const labelStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  color: 'var(--color-text-muted)',
  fontVariantNumeric: 'tabular-nums',
}
