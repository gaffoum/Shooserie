import { FACETS, useMyBadge, type FacetDefinition } from '@/lib/badges'
import { useT } from '@/i18n/I18nContext'

/**
 * Section « Facettes » de la page Guide. Lit `FACETS` (zéro duplication) et
 * marque celles débloquées par l'utilisateur (`facets` de `useMyBadge()`).
 */

const ALL_FACETS: FacetDefinition[] = Object.values(FACETS)

export function GuideFacets() {
  const { t } = useT()
  const { data } = useMyBadge()
  const unlocked = new Set(data?.facets ?? [])

  return (
    <section className="guide-section">
      <h2 className="guide-section-title">{t('guide.facets.title')}</h2>
      <p className="guide-section-sub">{t('guide.facets.sub')}</p>

      <div className="guide-list">
        {ALL_FACETS.map((f) => {
          const isUnlocked = unlocked.has(f.code)
          return (
            <div key={f.code} className={`guide-card${isUnlocked ? '' : ' locked'}`}>
              <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>
                {f.emoji}
              </span>
              <div className="guide-card-body">
                <div className="guide-card-headrow">
                  <span className="guide-card-label">{f.label}</span>
                  {isUnlocked && (
                    <span className="guide-badge-chip unlocked">
                      {t('guide.facets.unlocked')}
                    </span>
                  )}
                </div>
                <p className="guide-card-desc">{f.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="guide-note">{t('guide.facets.note')}</div>
    </section>
  )
}
