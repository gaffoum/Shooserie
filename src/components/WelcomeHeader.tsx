/**
 * WelcomeHeader — bandeau "Salut [pseudo] !" en haut du Dashboard.
 *
 * Hiérarchie (une seule progression principale = le rang d'étoiles) :
 *   1. Salutation
 *   2. Écusson de rang + total ⭐ + barre « encore X ⭐ pour <rang suivant> »
 *      → élément héros, cliquable vers /progression.
 *   3. En dessous, plus discret : badge de collectionneur + facettes (chips),
 *      SANS barre de progression (la progression du badge vit dans « Mes stats »).
 *   4. Lien « Comment ça marche ? » → Guide.
 *
 * Le fond du bloc reste pleine largeur ; le contenu est en retrait via le
 * conteneur partagé avec <main> du Dashboard (tokens --dashboard-*), pour que
 * la salutation s'aligne sur les cartes KPI.
 */
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useMyProfile } from '../lib/queries'
import { useMyBadge } from '@/lib/badges'
import { useT } from '@/i18n/I18nContext'
import { BadgeDisplay } from './BadgeDisplay'
import { FacetsList } from './FacetsList'
import { StarRankBadge } from './StarRankBadge'

export function WelcomeHeader() {
  const { user } = useAuth()
  const { data: profile } = useMyProfile()
  const badgeQ = useMyBadge()
  const { t } = useT()

  const displayName =
    profile?.display_name && profile.display_name.trim().length > 0
      ? profile.display_name
      : user?.email?.split('@')[0] ?? null

  if (!displayName) return null

  return (
    <div style={wrapperStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>
          Salut <span style={nameStyle}>{displayName}</span> !
        </h1>

        {/* Progression principale : rang d'étoiles (héros). Cliquable → progression. */}
        <Link
          to="/progression"
          style={rankLinkStyle}
          aria-label={t('progression.title')}
        >
          <StarRankBadge starsTotal={profile?.stars_total} rank={profile?.rank} />
        </Link>

        {/* Attributs débloqués (second niveau, sans jauge) : badge + facettes. */}
        {badgeQ.data && (
          <div style={attributesStyle}>
            <BadgeDisplay code={badgeQ.data.badge.code} size="md" showLabel />
            {badgeQ.data.facets.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <FacetsList facets={badgeQ.data.facets} />
              </div>
            )}
          </div>
        )}

        <Link to="/guide" style={guideLinkStyle}>
          {t('guide.link')} →
        </Link>
      </div>
    </div>
  )
}

/* Bloc pleine largeur ; le retrait du contenu vient de containerStyle. */
const wrapperStyle: CSSProperties = {
  marginBottom: 24,
}

/* Conteneur partagé avec le <main> du Dashboard (mêmes tokens) → alignement
 * horizontal identique aux cartes KPI. */
const containerStyle: CSSProperties = {
  maxWidth: 'var(--dashboard-max)',
  margin: '0 auto',
  padding: '0 var(--dashboard-gutter)',
}

const titleStyle: CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  margin: '0 0 16px',
  color: 'var(--color-text)',
  fontFamily: 'var(--font-display)',
  letterSpacing: '-0.02em',
}

const nameStyle: CSSProperties = {
  color: 'var(--color-bred)',
}

const rankLinkStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  textDecoration: 'none',
  color: 'inherit',
}

/* Second niveau : plus discret que le rang héros au-dessus. */
const attributesStyle: CSSProperties = {
  marginTop: 16,
}

const guideLinkStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 14,
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-royal)',
  textDecoration: 'none',
  fontFamily: 'var(--font-display)',
}
