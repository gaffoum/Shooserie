/**
 * Page « Ma progression » (/progression).
 * Centralise la progression étoiles : en-tête (badge rang + barre), aperçu des
 * 7 paliers de rang, et historique complet des gains (star_events).
 * Réutilise ranks.ts / StarRankBadge / stars.ts plutôt que de dupliquer.
 */
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { BackButton } from '@/components/BackButton'
import { StarRankBadge } from '@/components/StarRankBadge'
import { useMyProfile, useStarHistory } from '@/lib/queries'
import { RANKS, getRankProgress } from '@/lib/ranks'
import { ruleLabelKeyOf } from '@/lib/stars'
import { useT, localeFor } from '@/i18n/I18nContext'
import { useTheme } from '@/contexts/ThemeContext'

export default function Progression() {
  const { t, lang } = useT()
  const { resolved } = useTheme()
  const { data: profile } = useMyProfile()
  const { data: history, isLoading } = useStarHistory(50)

  const total = profile?.stars_total ?? 0
  const { current } = getRankProgress(total)
  const locale = localeFor(lang)
  const fmtNum = (n: number) => n.toLocaleString(locale)
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  const isEmpty = total === 0 && (history?.length ?? 0) === 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackButton />} />

      <main style={mainStyle}>
        <h1 style={pageTitleStyle}>{t('progression.title')}</h1>

        {isEmpty ? (
          <section style={emptyStyle}>
            <div style={{ fontSize: 40 }} aria-hidden>⭐</div>
            <h2 style={emptyTitleStyle}>{t('progression.empty.title')}</h2>
            <p style={emptyDescStyle}>{t('progression.empty.desc')}</p>
            <Link to="/sneakers/new" style={ctaStyle}>
              {t('progression.empty.cta')}
            </Link>
          </section>
        ) : (
          <>
            {/* En-tête : badge rang + barre de progression (composant réutilisé) */}
            <div style={{ marginBottom: 24 }}>
              <StarRankBadge starsTotal={profile?.stars_total} rank={profile?.rank} />
            </div>

            {/* Aperçu des 7 paliers de rang */}
            <section style={{ marginBottom: 24 }}>
              <h2 style={sectionTitleStyle}>{t('progression.tiers.title')}</h2>
              <div style={tiersWrapStyle}>
                {RANKS.map((r) => {
                  const isCurrent = r.key === current.key
                  const reached = total >= r.threshold
                  return (
                    <div
                      key={r.key}
                      style={{
                        ...tierRowStyle,
                        borderColor: isCurrent ? 'var(--color-bred)' : 'var(--color-border)',
                        background: isCurrent ? 'var(--color-bred-bg)' : 'var(--color-surface)',
                        opacity: reached ? 1 : 0.55,
                      }}
                    >
                      <img
                        src={resolved === 'dark' ? r.iconDark : r.iconLight}
                        alt=""
                        aria-hidden
                        style={tierIconStyle}
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden'
                        }}
                      />
                      <span style={{ ...tierLabelStyle, fontWeight: isCurrent ? 700 : 600 }}>
                        {r.label}
                      </span>
                      <span style={tierThreshStyle}>⭐ {fmtNum(r.threshold)}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Historique des gains */}
            <section>
              <h2 style={sectionTitleStyle}>{t('progression.history.title')}</h2>
              {isLoading ? (
                <div style={loadingStyle}>{t('progression.loading')}</div>
              ) : (
                <ul style={historyListStyle}>
                  {(history ?? []).map((e) => {
                    const lk = ruleLabelKeyOf(e.rule_key)
                    const label = lk ? t(lk) : e.rule_key
                    return (
                      <li key={e.id} style={historyRowStyle}>
                        <div style={{ minWidth: 0 }}>
                          <div style={historyLabelStyle}>{label}</div>
                          <div style={historyDateStyle}>{fmtDate(e.created_at)}</div>
                        </div>
                        <span style={historyPointsStyle}>+{fmtNum(e.points)} ⭐</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

const mainStyle: CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '24px 16px 80px',
  fontFamily: 'var(--font-display)',
}
const pageTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: 'var(--color-text)',
  margin: '0 0 20px',
}
const sectionTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  margin: '0 0 10px',
}
const tiersWrapStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}
const tierRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
}
const tierIconStyle: CSSProperties = {
  width: 26,
  height: 26,
  objectFit: 'contain',
  flexShrink: 0,
}
const tierLabelStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontSize: 14,
  color: 'var(--color-text)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
const tierThreshStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  fontVariantNumeric: 'tabular-nums',
  flexShrink: 0,
}
const historyListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}
const historyRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '10px 12px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
}
const historyLabelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
const historyDateStyle: CSSProperties = {
  marginTop: 2,
  fontSize: 12,
  color: 'var(--color-text-faint)',
  fontVariantNumeric: 'tabular-nums',
}
const historyPointsStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-bred)',
  fontVariantNumeric: 'tabular-nums',
  flexShrink: 0,
}
const emptyStyle: CSSProperties = {
  textAlign: 'center',
  padding: '48px 16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
}
const emptyTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--color-text)',
  margin: 0,
}
const emptyDescStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--color-text-muted)',
  margin: '0 0 8px',
}
const ctaStyle: CSSProperties = {
  display: 'inline-block',
  padding: '10px 18px',
  background: 'var(--color-bred)',
  color: '#fff',
  borderRadius: 'var(--radius-md)',
  fontWeight: 700,
  fontSize: 14,
  textDecoration: 'none',
}
const loadingStyle: CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: 14,
}
