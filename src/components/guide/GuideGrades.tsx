import { BADGES, useMyBadge, type BadgeDefinition } from '@/lib/badges'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import { BadgeProgressBar } from '@/components/BadgeProgressBar'
import { useT } from '@/i18n/I18nContext'

/**
 * Section « Grades » de la page Guide. Lit `BADGES` (zéro duplication) et
 * surligne le grade courant via `useMyBadge()`, avec sa progression.
 */

const ORDERED_GRADES: BadgeDefinition[] = Object.values(BADGES).sort(
  (a, b) => a.grade - b.grade,
)

export function GuideGrades() {
  const { t } = useT()
  const { data } = useMyBadge()
  const currentCode = data?.badge.code ?? null
  const unit = t('guide.pairs')

  const rangeLabel = (b: BadgeDefinition) => {
    if (b.maxPairs === null) return `${b.minPairs}+ ${unit}`
    if (b.minPairs === b.maxPairs) return `${b.minPairs} ${unit}`
    return `${b.minPairs}–${b.maxPairs} ${unit}`
  }

  return (
    <section className="guide-section">
      <h2 className="guide-section-title">{t('guide.grades.title')}</h2>
      <p className="guide-section-sub">{t('guide.grades.sub')}</p>

      <div className="guide-list">
        {ORDERED_GRADES.map((b) => {
          const isCurrent = b.code === currentCode
          return (
            <div key={b.code} className={`guide-card${isCurrent ? ' current' : ''}`}>
              <BadgeDisplay code={b.code} size="md" />
              <div className="guide-card-body">
                <div className="guide-card-headrow">
                  <span className="guide-card-label">
                    {b.emoji} {b.label}
                  </span>
                  <span className="guide-card-range">{rangeLabel(b)}</span>
                  {isCurrent && (
                    <span className="guide-badge-chip current">
                      {t('guide.grades.current')}
                    </span>
                  )}
                </div>
                <p className="guide-card-desc">{b.description}</p>
                {isCurrent && data && <BadgeProgressBar progress={data.progress} />}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
