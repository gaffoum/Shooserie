import { useQueryClient } from '@tanstack/react-query'
import { useState, type CSSProperties, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useT } from '@/i18n/I18nContext'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
import {
  ADMIN_EMAIL,
  useHasUnreadAnnouncements,
  useMyProfile,
  useUpdateMyProfile,
} from '@/lib/queries'
import { StarRankBadge } from '@/components/StarRankBadge'
import { useLogout } from '@/lib/useLogout'
import { useTheme, THEME_ORDER, type Theme } from '@/contexts/ThemeContext'
import { THEME_LABEL_KEY } from '@/components/ThemeToggle'
import type { DictKey } from '@/i18n/dictionaries'

/**
 * Account management page.
 *
 * Two independent sections — email change and password change — each with
 * its own state and submit. Email change goes through Supabase's confirmation
 * flow (a verification link is sent to the new address; the change only
 * applies once the user clicks it). Password change re-verifies the current
 * password by calling `signInWithPassword` before issuing `updateUser`, so a
 * stolen session can't silently change the password.
 */
export function Account() {
  const { t } = useT()
  const { user } = useAuth()
  const logout = useLogout()
  const { data: profile } = useMyProfile()
  const currentEmail = user?.email ?? ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackLink to="/dashboard" />} />
      <main style={mainStyle}>
        <h1 style={titleStyle}>{t('account.title')}</h1>

        {/* Ma carte profil (avatar + pseudo, puis rang + étoiles). Cliquable → progression. */}
        <Link to="/progression" style={profileCardLinkStyle} aria-label={t('progression.title')}>
          <div style={profileHeaderStyle}>
            <div style={profileAvatarStyle} aria-hidden>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={profileAvatarImgStyle} />
              ) : (
                (profile?.display_name || currentEmail || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={profileNameStyle}>{profile?.display_name || currentEmail}</div>
              {profile?.username && (
                <div className="lab" style={profileHandleStyle}>@{profile.username}</div>
              )}
            </div>
          </div>
          <StarRankBadge starsTotal={profile?.stars_total} rank={profile?.rank} />
        </Link>

        <NewsSection />
        <InviteSection />
        <section style={sectionStyle}>
          <Link to="/parrainage" style={{ ...navLinkRowStyle }}>
            <span>{t('referral.title')}</span>
            <span aria-hidden style={{ color: 'var(--color-text-muted)' }}>›</span>
          </Link>
        </section>
		<CollectionVisibilitySection />
        <ThemeSection />
        <EmailSection currentEmail={currentEmail} />
        <PasswordSection email={currentEmail} />
        {currentEmail === ADMIN_EMAIL && <AdminSection />}
        <DangerSection onSignOut={logout} />
      </main>
    </div>
  )
}

/* =====================================================
 * Theme section — sélecteur de thème (4 options) dans les Paramètres.
 *
 * Remplace l'ancien simple toggle : les 4 thèmes (Sombre, Clair, South Beach
 * Dark, South Beach Light) sont présentés comme des options sélectionnables,
 * chacune avec une pastille d'aperçu (fond + accent). La préférence est
 * persistée côté client par le ThemeProvider (fallback dark si inconnue).
 * ===================================================== */

const THEME_SWATCH: Record<Theme, { bg: string; accent: string }> = {
  dark: { bg: '#0A0A0A', accent: '#CE1141' },
  light: { bg: '#ECECEC', accent: '#CE1141' },
  'sb-dark': { bg: '#073763', accent: '#00BFFF' },
  'sb-light': { bg: '#E9F3FB', accent: '#00BFFF' },
}

function ThemeSection() {
  const { t } = useT()
  const { theme, setTheme } = useTheme()

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{t('theme.section')}</h2>
      <p style={themeDescStyle}>{t('theme.desc')}</p>
      <div style={themeGridStyle}>
        {THEME_ORDER.map((th) => {
          const active = th === theme
          const sw = THEME_SWATCH[th]
          return (
            <button
              key={th}
              type="button"
              onClick={() => setTheme(th)}
              aria-pressed={active}
              style={themeOptionStyle(active)}
            >
              <span
                aria-hidden
                style={{
                  ...themeSwatchStyle,
                  background: sw.bg,
                  boxShadow: `inset 0 0 0 2px ${sw.accent}`,
                }}
              />
              <span style={themeOptionLabelStyle}>{t(THEME_LABEL_KEY[th])}</span>
              {active && (
                <span aria-hidden style={themeCheckStyle}>
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

const themeDescStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  margin: '0 0 14px',
}
const themeGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 8,
}
const themeOptionStyle = (active: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 'var(--radius-md)',
  border: `1px solid ${active ? 'var(--color-bred)' : 'var(--color-border)'}`,
  background: active ? 'var(--color-bred-bg)' : 'var(--color-surface)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  textAlign: 'left',
  minWidth: 0,
})
const themeSwatchStyle: CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: '1px solid rgba(127,127,127,0.35)',
  flexShrink: 0,
}
const themeOptionLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
}
const themeCheckStyle: CSSProperties = {
  marginLeft: 'auto',
  color: 'var(--color-bred)',
  fontWeight: 700,
  fontSize: 14,
  flexShrink: 0,
}

/* =====================================================
 * News section — accès à la page « Nouveautés » avec pastille non-lue.
 *
 * La pastille rouge (#CE1141 via --color-bred) s'affiche tant qu'une annonce
 * plus récente que `announcements_seen_at` existe (ou si la page n'a jamais
 * été ouverte). Ouvrir /nouveautes marque « lu » et fait disparaître la
 * pastille au retour sur cette page.
 * ===================================================== */

function NewsSection() {
  const { t } = useT()
  const hasUnread = useHasUnreadAnnouncements()

  return (
    <section style={sectionStyle}>
      <Link to="/nouveautes" style={{ ...navLinkRowStyle }}>
        <span style={newsLabelStyle}>
          {t('news.title')}
          {hasUnread && <span style={unreadDotStyle} aria-label={t('news.unread')} />}
        </span>
        <span aria-hidden style={{ color: 'var(--color-text-muted)' }}>
          ›
        </span>
      </Link>
    </section>
  )
}

const newsLabelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
}
const unreadDotStyle: CSSProperties = {
  display: 'inline-block',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: 'var(--color-bred)',
  flexShrink: 0,
}

/* =====================================================
 * Invite section — share the app to grow the user base.
 *
 * Uses the Web Share API (navigator.share) on devices that support it —
 * which is most mobile browsers (iOS Safari, Android Chrome, etc.). That
 * triggers the OS-native share sheet so the user can pick iMessage,
 * WhatsApp, Insta DM, AirDrop, whatever they have installed. One tap.
 *
 * Fallback for desktop / unsupported browsers: copy the message + URL to
 * clipboard with visual "copié !" feedback. If even clipboard fails (some
 * non-HTTPS contexts, etc.), final fallback is window.prompt() so the user
 * can copy manually.
 *
 * Intentionally NOT a referral-tracked URL for v1. Just a plain link to
 * shooserie.tech. We can add ?ref=<userId> attribution later if the
 * invite feature gets enough usage to be worth measuring.
 * ===================================================== */

function InviteSection() {
  const { t } = useT()
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const shareUrl = 'https://shooserie.tech'
    const shareText = t('invite.message')
    const shareTitle = 'Shooserie'

    // Path 1 — native OS share sheet (mobile-first).
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err) {
        // AbortError = user dismissed the share sheet, that's not an error.
        // Other errors → fall through to clipboard fallback below.
        if ((err as Error).name === 'AbortError') return
      }
    }

    // Path 2 — clipboard fallback (desktop, or share API failed).
    const fullText = `${shareText}\n${shareUrl}`
    try {
      await navigator.clipboard.writeText(fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Path 3 — last resort: surface the text so user can copy manually.
      window.prompt(t('invite.copyManual'), fullText)
    }
  }

  return (
    <section style={inviteSectionStyle}>
      <h2 style={inviteTitleStyle}>{t('invite.title')}</h2>
      <p style={inviteDescStyle}>{t('invite.desc')}</p>
      <button
        type="button"
        onClick={handleShare}
        style={copied ? inviteBtnCopiedStyle : inviteBtnStyle}
      >
        {copied ? `✓ ${t('invite.copied')}` : t('invite.button')}
      </button>
    </section>
  )
}

const inviteSectionStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  padding: '20px 22px',
  marginBottom: 16,
}
const inviteTitleStyle: CSSProperties = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-display)',
  fontSize: 16,
  fontWeight: 700,
  color: 'var(--color-text)',
}
const inviteDescStyle: CSSProperties = {
  margin: '0 0 14px',
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
}
const inviteBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '11px 18px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  transition: 'background 0.15s ease',
}
const inviteBtnCopiedStyle: CSSProperties = {
  ...inviteBtnStyle,
  background: 'var(--color-up)',
}

/* =====================================================
 * Email section
 * ===================================================== */

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const { t } = useT()
  const [newEmail, setNewEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorText, setErrorText] = useState('')
  const [confirmTo, setConfirmTo] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const target = newEmail.trim().toLowerCase()
    if (!target) return
    if (target === currentEmail.toLowerCase()) {
      setStatus('error')
      setErrorText(t('account.email.sameError'))
      return
    }
    setStatus('submitting')
    setErrorText('')

    const { error } = await supabase.auth.updateUser({ email: target })

    if (error) {
      setStatus('error')
      setErrorText(error.message)
      return
    }
    setStatus('success')
    setConfirmTo(target)
    setNewEmail('')
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{t('account.email.section')}</h2>

      <div style={readonlyRowStyle}>
        <span style={readonlyLabelStyle}>{t('account.email.current')}</span>
        <span style={readonlyValueStyle}>{currentEmail || '—'}</span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="new-email" style={labelStyle}>
          {t('account.email.new')}
        </label>
        <input
          id="new-email"
          type="email"
          autoComplete="email"
          required
          placeholder={t('account.email.newPlaceholder')}
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value)
            if (status === 'success' || status === 'error') setStatus('idle')
          }}
          disabled={status === 'submitting'}
          style={inputStyle}
        />
        <p style={helpStyle}>{t('account.email.help')}</p>

        <button
          type="submit"
          disabled={status === 'submitting' || !newEmail.trim()}
          style={primaryBtnStyle(status === 'submitting' || !newEmail.trim())}
        >
          {status === 'submitting' ? t('account.email.submitting') : t('account.email.submit')}
        </button>

        {status === 'success' && (
          <p style={successStyle}>
            ✓ {t('account.email.success', { email: confirmTo })}
          </p>
        )}
        {status === 'error' && errorText && (
          <p style={errorStyle}>{errorText}</p>
        )}
      </form>
    </section>
  )
}

/* =====================================================
 * Password section
 * ===================================================== */

function PasswordSection({ email }: { email: string }) {
  const { t } = useT()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorKey, setErrorKey] = useState<DictKey | null>(null)
  const [errorRaw, setErrorRaw] = useState('')

  const reset = () => {
    setCurrent('')
    setNext('')
    setConfirm('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // Local validation
    if (next.length < 6) {
      setStatus('error')
      setErrorKey('account.password.tooShort')
      setErrorRaw('')
      return
    }
    if (next !== confirm) {
      setStatus('error')
      setErrorKey('account.password.mismatch')
      setErrorRaw('')
      return
    }
    if (next === current) {
      setStatus('error')
      setErrorKey('account.password.sameAsOld')
      setErrorRaw('')
      return
    }

    setStatus('submitting')
    setErrorKey(null)
    setErrorRaw('')

    // Re-verify identity: ensure the current password is correct before allowing
    // the change. Without this, a stolen session could rotate the password
    // silently. signInWithPassword refreshes the session on success — that's fine.
    const { error: signinError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    })
    if (signinError) {
      setStatus('error')
      setErrorKey('account.password.invalidCurrent')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next })
    if (updateError) {
      setStatus('error')
      setErrorRaw(updateError.message)
      return
    }

    setStatus('success')
    reset()
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{t('account.password.section')}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="pwd-current" style={labelStyle}>
          {t('account.password.current')}
        </label>
        <input
          id="pwd-current"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => {
            setCurrent(e.target.value)
            if (status === 'success' || status === 'error') setStatus('idle')
          }}
          disabled={status === 'submitting'}
          style={inputStyle}
        />

        <label htmlFor="pwd-new" style={{ ...labelStyle, marginTop: 16 }}>
          {t('account.password.new')}
        </label>
        <input
          id="pwd-new"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={next}
          onChange={(e) => {
            setNext(e.target.value)
            if (status === 'success' || status === 'error') setStatus('idle')
          }}
          disabled={status === 'submitting'}
          style={inputStyle}
        />

        <label htmlFor="pwd-confirm" style={{ ...labelStyle, marginTop: 16 }}>
          {t('account.password.confirm')}
        </label>
        <input
          id="pwd-confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value)
            if (status === 'success' || status === 'error') setStatus('idle')
          }}
          disabled={status === 'submitting'}
          style={inputStyle}
        />
        <p style={helpStyle}>{t('account.password.help')}</p>

        <button
          type="submit"
          disabled={status === 'submitting' || !current || !next || !confirm}
          style={primaryBtnStyle(
            status === 'submitting' || !current || !next || !confirm,
          )}
        >
          {status === 'submitting'
            ? t('account.password.submitting')
            : t('account.password.submit')}
        </button>

        {status === 'success' && (
          <p style={successStyle}>✓ {t('account.password.success')}</p>
        )}
        {status === 'error' && (
          <p style={errorStyle}>{errorKey ? t(errorKey) : errorRaw}</p>
        )}
      </form>
    </section>
  )
}

/* =====================================================
 * Admin section — visible only to the admin user. Provides a discoverable
 * entry to /admin from this page so mobile users (where the header badge
 * might be tight) always have a clear way in.
 * ===================================================== */

function AdminSection() {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>Admin</h2>
      <Link to="/admin" style={adminLinkStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={adminIconStyle} aria-hidden>
            📊
          </div>
          <div>
            <div style={adminTitleStyle}>Monitoring</div>
            <div style={adminDescStyle}>
              Inscriptions, paires, top marques, top collectionneurs.
            </div>
          </div>
        </div>
        <span style={adminChevronStyle}>›</span>
      </Link>
    </section>
  )
}

/* =====================================================
 * Danger / sign-out section
 * ===================================================== */

function DangerSection({ onSignOut }: { onSignOut: () => void }) {
  const { t } = useT()
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{t('account.danger.section')}</h2>
      <p style={dangerDescStyle}>{t('account.signOut.desc')}</p>
      <button type="button" onClick={onSignOut} style={signOutBtnStyle}>
        {t('common.logout')}
      </button>
    </section>
  )
}
function CollectionVisibilitySection() {
  const { t } = useT()
  const { data: profile, isLoading } = useMyProfile()
  const updateMutation = useUpdateMyProfile()
  const [isUpdating, setIsUpdating] = useState(false)

  const queryClient = useQueryClient()
  const isPublic = profile?.collection_public ?? false
  // Défaut true en base : on considère visible sauf si explicitement false.
  const inLeaderboard = profile?.leaderboard_visible !== false

  const handleToggle = async () => {
    setIsUpdating(true)
    try {
      await updateMutation.mutateAsync({ collection_public: !isPublic })
      await queryClient.invalidateQueries({ queryKey: ['my-collection-public'] })
    } catch (err) {
      console.error('Failed to update visibility', err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleToggleLeaderboard = async () => {
    setIsUpdating(true)
    try {
      await updateMutation.mutateAsync({ leaderboard_visible: !inLeaderboard })
      await queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    } catch (err) {
      console.error('Failed to update leaderboard visibility', err)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{t('account.visibility.section')}</h2>
      <p style={visibilityDescStyle}>
        {t('account.visibility.desc')}
      </p>

      <div style={visibilityRowStyle}>
        <div style={{ flex: 1 }}>
          <div style={visibilityLabelStyle}>
            {isPublic
              ? t('account.visibility.public')
              : t('account.visibility.private')}
          </div>
          <div style={visibilityHintStyle}>
            {isPublic
              ? t('account.visibility.publicHint')
              : t('account.visibility.privateHint')}
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isLoading || isUpdating}
          style={toggleBtnStyle(isPublic, isLoading || isUpdating)}
          aria-label={t('account.visibility.toggle')}
        >
          <span style={toggleKnobStyle(isPublic)} />
        </button>
      </div>

      {/* Visibilité leaderboard — pendant UX des règles de confidentialité. */}
      <div style={visibilityRowStyle}>
        <div style={{ flex: 1 }}>
          <div style={visibilityLabelStyle}>{t('account.leaderboard.label')}</div>
          <div style={visibilityHintStyle}>
            {inLeaderboard
              ? t('account.leaderboard.onHint')
              : t('account.leaderboard.offHint')}
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggleLeaderboard}
          disabled={isLoading || isUpdating}
          style={toggleBtnStyle(inLeaderboard, isLoading || isUpdating)}
          aria-label={t('account.leaderboard.label')}
        >
          <span style={toggleKnobStyle(inLeaderboard)} />
        </button>
      </div>
    </section>
  )
}

/* ====== STYLES À AJOUTER ======
 * Ajoute ces styles à la fin du fichier, à côté des autres styles
 * (sectionStyle, sectionTitleStyle, etc. existent déjà) :
 */

const profileCardLinkStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  textDecoration: 'none',
  color: 'inherit',
  marginBottom: 20,
}
const profileHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  minWidth: 0,
}
const profileAvatarStyle: CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  flexShrink: 0,
  background: 'var(--color-bred)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
  fontWeight: 800,
  fontFamily: 'var(--font-display)',
  overflow: 'hidden',
}
const profileAvatarImgStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}
const profileNameStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 20,
  fontWeight: 800,
  letterSpacing: '-0.4px',
  color: 'var(--color-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const profileHandleStyle: CSSProperties = {
  fontSize: 11,
  letterSpacing: '1px',
  color: 'var(--color-text-muted)',
  marginTop: 2,
}

const navLinkRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  textDecoration: 'none',
  color: 'var(--color-text)',
  fontSize: 15,
  fontWeight: 600,
}

const visibilityDescStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  marginTop: 6,
  marginBottom: 16,
}

const visibilityRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '12px 0',
}

const visibilityLabelStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text)',
}

const visibilityHintStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted)',
  marginTop: 4,
}

const toggleBtnStyle = (isOn: boolean, disabled: boolean): CSSProperties => ({
  width: 50,
  height: 28,
  borderRadius: 999,
  background: isOn ? 'var(--color-bred)' : 'var(--color-border)',
  border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  position: 'relative',
  transition: 'background var(--transition-fast)',
  opacity: disabled ? 0.6 : 1,
  flexShrink: 0,
})

const toggleKnobStyle = (isOn: boolean): CSSProperties => ({
  position: 'absolute',
  top: 2,
  left: isOn ? 24 : 2,
  width: 24,
  height: 24,
  borderRadius: '50%',
  background: '#fff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
  transition: 'left var(--transition-fast)',
})

/* =====================================================
 * Styles — match the rest of the app (Login + form pages).
 * ===================================================== */

const mainStyle: CSSProperties = {
  padding: '20px',
  maxWidth: 520,
  margin: '0 auto',
}
const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 22,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  marginBottom: 18,
}
const sectionStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  padding: '20px 18px',
  marginBottom: 16,
}
const sectionTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 14,
}
const readonlyRowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: '10px 12px',
  background: 'var(--color-bg)',
  border: '1px dashed var(--color-border)',
  borderRadius: 'var(--radius-md)',
  marginBottom: 16,
}
const readonlyLabelStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontFamily: 'var(--font-display)',
  fontWeight: 500,
}
const readonlyValueStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--color-text)',
  fontVariantNumeric: 'tabular-nums',
  wordBreak: 'break-all',
}
const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  marginBottom: 6,
}
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  fontSize: 14,
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  outline: 'none',
}
const helpStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  color: 'var(--color-text-faint)',
  lineHeight: 1.4,
}
const primaryBtnStyle = (disabled: boolean): CSSProperties => ({
  marginTop: 16,
  width: '100%',
  padding: '12px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: disabled ? 'var(--color-text-muted)' : 'var(--color-bred)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.65 : 1,
})
const successStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  color: 'var(--color-up)',
  lineHeight: 1.4,
}
const errorStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  color: 'var(--color-bred)',
  lineHeight: 1.4,
}
const dangerDescStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  marginBottom: 14,
}
const signOutBtnStyle: CSSProperties = {
  padding: '10px 16px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: 'transparent',
  color: 'var(--color-bred)',
  border: '1px solid var(--color-bred)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  cursor: 'pointer',
}

// === Admin section ===
const adminLinkStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 16px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'border-color var(--transition-fast)',
}
const adminIconStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  flexShrink: 0,
}
const adminTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text)',
  marginBottom: 2,
}
const adminDescStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted)',
  lineHeight: 1.4,
}
const adminChevronStyle: CSSProperties = {
  fontSize: 22,
  color: 'var(--color-text-faint)',
  fontWeight: 300,
}
