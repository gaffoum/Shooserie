import { useT } from '@/i18n/I18nContext'
import type { DictKey } from '@/i18n/dictionaries'

/**
 * Section « Raretés » de la page Guide. Les 5 paliers avec couleur + étoiles +
 * une phrase, et un encadré « comment le score est calculé » (langage simple).
 *
 * TODO : quand `@/lib/rarity` existera (TIER_META / TIER_ORDER), remplacer
 * `TIER_GUIDE` par cet import. Pour l'instant, constante locale.
 */

interface TierGuide {
  tier: string
  color: string
  stars: number
  labelKey: DictKey
  descKey: DictKey
}

const TIER_GUIDE: TierGuide[] = [
  { tier: 'commune', color: '#8a8a8a', stars: 1, labelKey: 'guide.rarity.commune.label', descKey: 'guide.rarity.commune.desc' },
  { tier: 'peu_commune', color: '#2f9e44', stars: 2, labelKey: 'guide.rarity.peu_commune.label', descKey: 'guide.rarity.peu_commune.desc' },
  { tier: 'rare', color: '#c9824c', stars: 3, labelKey: 'guide.rarity.rare.label', descKey: 'guide.rarity.rare.desc' },
  { tier: 'ultra_rare', color: '#c2c9d1', stars: 4, labelKey: 'guide.rarity.ultra_rare.label', descKey: 'guide.rarity.ultra_rare.desc' },
  { tier: 'grail', color: '#e7c257', stars: 5, labelKey: 'guide.rarity.grail.label', descKey: 'guide.rarity.grail.desc' },
]

// Texte contrasté sur la pastille selon le métal (mêmes règles que la carte TCG).
function badgeText(tier: string): string {
  return tier === 'grail' || tier === 'rare'
    ? '#1a1206'
    : tier === 'ultra_rare'
      ? '#1a1d22'
      : '#ffffff'
}

export function GuideRarities() {
  const { t } = useT()
  return (
    <section className="guide-section">
      <h2 className="guide-section-title">{t('guide.rarity.title')}</h2>
      <p className="guide-section-sub">{t('guide.rarity.sub')}</p>

      <div className="guide-list">
        {TIER_GUIDE.map((g) => (
          <div key={g.tier} className="guide-card">
            <span
              className="guide-tier-badge"
              style={{ background: g.color, color: badgeText(g.tier) }}
              aria-hidden
            >
              {'★'.repeat(g.stars)}
            </span>
            <div className="guide-card-body">
              <div className="guide-card-headrow">
                <span className="guide-card-label">{t(g.labelKey)}</span>
              </div>
              <p className="guide-card-desc">{t(g.descKey)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="guide-score-box">
        <h3>{t('guide.rarity.score.title')}</h3>
        <p>{t('guide.rarity.score.p1')}</p>
        <p>{t('guide.rarity.score.p2')}</p>
        <p>{t('guide.rarity.score.p3')}</p>
      </div>
    </section>
  )
}
