/**
 * Page « Nouveautés » (/nouveautes).
 * Liste les annonces communauté (info · nouveauté · correctif) publiées, la
 * plus récente d'abord. À l'ouverture, marque toutes les annonces comme lues
 * (announcements_seen_at = now() sur son profil) — ce qui fait disparaître la
 * pastille non-lue affichée dans le Profil.
 *
 * Lecture seule : la table est alimentée en service_role, pas d'écriture ici.
 */
import { useEffect, useRef, type CSSProperties } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { BackButton } from '@/components/BackButton'
import {
  useAnnouncements,
  useMarkAnnouncementsSeen,
  type Announcement,
  type AnnouncementCategory,
} from '@/lib/queries'
import { useT, localeFor } from '@/i18n/I18nContext'
import type { DictKey } from '@/i18n/dictionaries'

/** Métadonnées d'affichage par catégorie (couleur token + clé i18n du label). */
const CATEGORY_META: Record<
  AnnouncementCategory,
  { color: string; labelKey: DictKey }
> = {
  info: { color: 'var(--color-royal)', labelKey: 'news.category.info' },
  feature: { color: 'var(--color-bred)', labelKey: 'news.category.feature' },
  fix: { color: 'var(--color-up)', labelKey: 'news.category.fix' },
}

export default function Announcements() {
  const { t, lang } = useT()
  const { data: announcements, isLoading } = useAnnouncements()
  const markSeen = useMarkAnnouncementsSeen()

  // Marquer « lu » une seule fois à l'ouverture de la page.
  const markedRef = useRef(false)
  useEffect(() => {
    if (markedRef.current) return
    markedRef.current = true
    markSeen.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const locale = localeFor(lang)
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const list = announcements ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackButton />} />

      <main style={mainStyle}>
        <h1 style={pageTitleStyle}>{t('news.title')}</h1>
        <p style={subtitleStyle}>{t('news.subtitle')}</p>

        {isLoading ? (
          <div style={loadingStyle}>{t('common.loading')}</div>
        ) : list.length === 0 ? (
          <section style={emptyStyle}>
            <div style={{ fontSize: 40 }} aria-hidden>
              📣
            </div>
            <h2 style={emptyTitleStyle}>{t('news.empty.title')}</h2>
            <p style={emptyDescStyle}>{t('news.empty.desc')}</p>
          </section>
        ) : (
          <ul style={listStyle}>
            {list.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} date={fmtDate(a.published_at)} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function AnnouncementCard({
  announcement,
  date,
}: {
  announcement: Announcement
  date: string
}) {
  const { t } = useT()
  const meta = CATEGORY_META[announcement.category] ?? CATEGORY_META.info

  return (
    <li style={cardStyle}>
      <div style={cardHeaderStyle}>
        <span
          style={{
            ...categoryChipStyle,
            color: meta.color,
            borderColor: meta.color,
            background: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
          }}
        >
          {t(meta.labelKey)}
        </span>
        <time style={dateStyle} dateTime={announcement.published_at}>
          {date}
        </time>
      </div>
      <h2 style={cardTitleStyle}>{announcement.title}</h2>
      <p style={cardBodyStyle}>{announcement.body}</p>
    </li>
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
  margin: '0 0 6px',
}
const subtitleStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--color-text-muted)',
  margin: '0 0 24px',
  lineHeight: 1.5,
}
const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}
const cardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  padding: '18px 18px 20px',
}
const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 10,
}
const categoryChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  border: '1px solid',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-display)',
  whiteSpace: 'nowrap',
}
const dateStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-faint)',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
}
const cardTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: 'var(--color-text)',
  margin: '0 0 8px',
}
const cardBodyStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.6,
  color: 'var(--color-text-muted)',
  margin: 0,
  whiteSpace: 'pre-wrap',
}
const loadingStyle: CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: 14,
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
  margin: 0,
  maxWidth: 360,
  lineHeight: 1.5,
}
