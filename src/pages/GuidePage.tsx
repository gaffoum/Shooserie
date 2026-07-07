import { AppHeader } from '@/components/AppHeader'
import { useT } from '@/i18n/I18nContext'
import { GuideGrades } from '@/components/guide/GuideGrades'
import './GuidePage.css'

/**
 * Page Guide (/guide) — référence du système de progression : grades, facettes
 * et raretés. Zéro duplication : les sections lisent les définitions existantes
 * (`BADGES`, `FACETS` de `@/lib/badges`) — une modif de def s'y répercute seule.
 * Tokens only → rend correctement en clair ET en sombre.
 */
export function GuidePage() {
  const { t } = useT()
  return (
    <div className="guide-page">
      <AppHeader />
      <main className="guide-main">
        <header className="guide-header">
          <h1 className="guide-title">{t('guide.title')}</h1>
          <p className="guide-intro">{t('guide.intro')}</p>
        </header>
        <GuideGrades />
        {/* Sections suivantes : Facettes, Raretés */}
      </main>
    </div>
  )
}

export default GuidePage
