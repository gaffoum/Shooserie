/**
 * WelcomeHeader — bandeau "Salut [pseudo] !" en haut du Dashboard.
 */
import { useAuth } from '../contexts/AuthContext'
import { useMyProfile } from '../lib/queries'
import { useMyBadge } from '@/lib/badges'
import { BadgeDisplay } from './BadgeDisplay'
import { FacetsList } from './FacetsList'
import { BadgeProgressBar } from './BadgeProgressBar'

export function WelcomeHeader() {
  const { user } = useAuth()
  const { data: profile } = useMyProfile()
  const badgeQ = useMyBadge()

  const displayName =
    profile?.display_name && profile.display_name.trim().length > 0
      ? profile.display_name
      : user?.email?.split('@')[0] ?? null

  if (!displayName) return null

  return (
    <div style={wrapperStyle}>
      <h1 style={titleStyle}>
        Salut <span style={nameStyle}>{displayName}</span> !
      </h1>
      {badgeQ.data && (
        <div style={{ marginTop: 16 }}>
          <BadgeDisplay code={badgeQ.data.badge.code} size="lg" showLabel longLabel />
          {badgeQ.data.facets.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <FacetsList facets={badgeQ.data.facets} />
            </div>
          )}
          <BadgeProgressBar progress={badgeQ.data.progress} />
        </div>
      )}
    </div>
  )
}

const wrapperStyle: React.CSSProperties = {
  marginBottom: 24,
}

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  margin: 0,
  color: '#0A0A0A',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '-0.02em',
}

const nameStyle: React.CSSProperties = {
  color: '#CE1141',
}