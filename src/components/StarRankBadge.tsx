import { useState, type CSSProperties } from 'react'
import { getRankDisplay } from '@/lib/ranks'
import { useTheme } from '@/contexts/ThemeContext'
import { useT } from '@/i18n/I18nContext'
import { RankProgressBar } from './RankProgressBar'

interface StarRankBadgeProps {
  /** profiles.stars_total — null/undefined toléré (fallback 0) */
  starsTotal: number | null | undefined
  /** profiles.rank (clé technique) — null/undefined toléré (fallback rookie) */
  rank: string | null | undefined
}

/**
 * Bloc compact « rang + étoiles » : écusson, nom du rang, total d'étoiles.
 * Autonome et réutilisable (Portfolio aujourd'hui, profil/leaderboard demain) :
 * toute la logique d'affichage vit ici et dans lib/ranks.ts, rien chez le parent.
 */
export function StarRankBadge({ starsTotal, rank }: StarRankBadgeProps) {
  const { t, lang } = useT()
  const { resolved } = useTheme()
  const [iconFailed, setIconFailed] = useState(false)

  const display = getRankDisplay(rank)
  const total = starsTotal ?? 0
  const iconSrc = resolved === 'dark' ? display.iconDark : display.iconLight
  const formattedTotal = total.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US')

  return (
    <div style={cardStyle}>
      <div
        style={rowStyle}
        aria-label={t('stars.badge.aria', { rank: display.label, n: total })}
      >
        {iconFailed ? (
          <span style={iconFallbackStyle} aria-hidden>
            ⭐
          </span>
        ) : (
          <img
            src={iconSrc}
            alt=""
            aria-hidden
            style={iconStyle}
            onError={() => setIconFailed(true)}
          />
        )}
        <div style={textColStyle}>
          <div style={rankLabelStyle}>{display.label}</div>
          <div style={starsStyle}>
            <span aria-hidden>⭐</span> {formattedTotal}
          </div>
        </div>
      </div>
      <RankProgressBar starsTotal={total} />
    </div>
  )
}

const cardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 14,
  minWidth: 0,
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
}

const iconStyle: CSSProperties = {
  width: 40,
  height: 40,
  objectFit: 'contain',
  flexShrink: 0,
}

const iconFallbackStyle: CSSProperties = {
  fontSize: 28,
  lineHeight: 1,
  width: 40,
  textAlign: 'center',
  flexShrink: 0,
}

const textColStyle: CSSProperties = {
  minWidth: 0,
}

const rankLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  color: 'var(--color-text)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const starsStyle: CSSProperties = {
  marginTop: 4,
  fontFamily: 'var(--font-display)',
  fontSize: 15,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-bred)',
}
