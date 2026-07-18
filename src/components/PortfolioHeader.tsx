import type { CSSProperties } from 'react'
import { formatEur, formatPct } from '@/lib/format'
import { useT } from '@/i18n/I18nContext'
import './PortfolioHeader.css'

interface PortfolioHeaderProps {
  count: number
  /** Valeur de marché estimée (€) de la collection. */
  totalMarket: number
  /** Variation de cote en % (null si pas de coût de référence). */
  deltaPct: number | null
}

/**
 * En-tête Portfolio (handoff Niveau 2) : label « MA COLLECTION », nombre de
 * paires en gros, puis bannière « valeur estimée » (dégradé Bred→Royal) avec
 * la variation en vert/rouge. Restyle l'ancien bloc KPI en gardant les chiffres
 * déjà calculés (aggregateKpis).
 */
export function PortfolioHeader({ count, totalMarket, deltaPct }: PortfolioHeaderProps) {
  const { t } = useT()
  const up = (deltaPct ?? 0) >= 0

  return (
    <div className="pf-header">
      <div className="pf-header__top">
        <div>
          <div className="lab pf-header__eyebrow">{t('dashboard.portfolio.label')}</div>
          <div className="pf-header__count">
            {t(count === 1 ? 'dashboard.portfolio.pair' : 'dashboard.portfolio.pairs', { n: count })}
          </div>
        </div>
      </div>

      <div className="pf-header__banner">
        <div>
          <div className="lab pf-header__banner-label">{t('dashboard.portfolio.estValue')}</div>
          <div className="pf-header__value">{formatEur(totalMarket)}</div>
        </div>
        {deltaPct !== null && count > 0 && (
          <div
            className="pf-header__delta"
            style={{ color: up ? 'var(--color-success)' : 'var(--color-down)' } as CSSProperties}
          >
            {up ? '▲' : '▼'} {formatPct(deltaPct, true)}
          </div>
        )}
      </div>
    </div>
  )
}
