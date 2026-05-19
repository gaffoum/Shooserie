import { useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useT } from '@/i18n/I18nContext'
import { Logo } from '@/components/Logo'
import { LanguageToggle } from '@/components/LanguageToggle'
import type { DictKey } from '@/i18n/dictionaries'

/**
 * Landing page reached via the password-reset email link.
 *
 * Flow:
 *  1. User submits `forgot password` from Login → Supabase sends an email.
 *  2. The email link points to `${origin}/reset-password#access_token=…&type=recovery`.
 *  3. The Supabase client (with `detectSessionInUrl: true`) consumes the hash
 *     and silently creates a temporary recovery session, firing
 *     `onAuthStateChange('PASSWORD_RECOVERY', session)`.
 *  4. AuthContext picks up that session — but the user is *not* meant to be
 *     dropped into the app. We render this dedicated page on the matching URL
 *     so they can set a new password.
 *  5. On success → redirect to /dashboard (now signed in for real).
 *
 * If a logged-in user navigates here directly without coming from the email,
 * we still let them set a new password (it's an opportunistic UI) — but the
 * normal route to change a password remains the /account page.
 */
export function ResetPassword() {
  const { session, loading } = useAuth()
  const { t } = useT()
  const navigate = useNavigate()

  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorKey, setErrorKey] = useState<DictKey | null>(null)
  const [errorRaw, setErrorRaw] = useState<string>('')

  // The PASSWORD_RECOVERY event will fire on landing if the URL hash was valid.
  // We rely on the session being present afterwards; otherwise the link was
  // invalid / expired. Brief grace period to allow Supabase to consume the hash.
  const [graceElapsed, setGraceElapsed] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setGraceElapsed(true), 1200)
    return () => window.clearTimeout(id)
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (next.length < 6) {
      setStatus('error')
      setErrorKey('reset.tooShort')
      setErrorRaw('')
      return
    }
    if (next !== confirm) {
      setStatus('error')
      setErrorKey('reset.mismatch')
      setErrorRaw('')
      return
    }
    setStatus('submitting')
    setErrorKey(null)
    setErrorRaw('')

    const { error } = await supabase.auth.updateUser({ password: next })
    if (error) {
      setStatus('error')
      setErrorRaw(error.message)
      return
    }
    setStatus('success')
    // Brief pause so the user reads the confirmation, then send them home.
    window.setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
  }

  // On success, no need to keep this UI live — redirect handled in the timeout.
  // While loading auth, show nothing to avoid flashing the "invalid link" state.
  if (loading) return null

  // No session AND we've waited for the hash to be consumed → link was invalid.
  const linkInvalid = !session && graceElapsed

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--color-bg)',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <LanguageToggle />
      </div>

      <div style={cardStyle}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Logo size="lg" />
          <p style={subtitleStyle}>{t('reset.title')}</p>
        </div>

        {linkInvalid ? (
          <>
            <p style={errorStyle}>{t('reset.invalidLink')}</p>
            <Link to="/login" style={loginLinkStyle}>
              {t('reset.goLogin')}
            </Link>
          </>
        ) : !session ? (
          // We have neither a confirmed session nor have we elapsed the grace
          // period. Show a discreet loading state.
          <p style={loadingStyle}>{t('common.loading')}</p>
        ) : status === 'success' ? (
          <p style={successStyle}>✓ {t('reset.success')}</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <p style={descStyle}>{t('reset.desc')}</p>

            <label htmlFor="reset-new" style={labelStyle}>
              {t('reset.new')}
            </label>
            <input
              id="reset-new"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={next}
              onChange={(e) => {
                setNext(e.target.value)
                if (status === 'error') setStatus('idle')
              }}
              disabled={status === 'submitting'}
              style={inputStyle}
            />

            <label
              htmlFor="reset-confirm"
              style={{ ...labelStyle, marginTop: 16 }}
            >
              {t('reset.confirm')}
            </label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                if (status === 'error') setStatus('idle')
              }}
              disabled={status === 'submitting'}
              style={inputStyle}
            />
            <p style={helpStyle}>{t('reset.help')}</p>

            <button
              type="submit"
              disabled={status === 'submitting' || !next || !confirm}
              style={{
                ...submitBtnStyle,
                opacity: !next || !confirm ? 0.55 : 1,
                cursor: status === 'submitting' ? 'wait' : 'pointer',
              }}
            >
              {status === 'submitting'
                ? t('reset.submitting')
                : t('reset.submit')}
            </button>

            {status === 'error' && (
              <p style={errorStyle}>
                {errorKey ? t(errorKey) : errorRaw || t('auth.errors.generic')}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

/* =====================================================
 * Styles — match Login.tsx visually for continuity.
 * ===================================================== */

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  padding: '32px 28px',
}
const subtitleStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
}
const descStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  marginBottom: 18,
  textAlign: 'center',
}
const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  marginBottom: 8,
}
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 15,
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
const submitBtnStyle: CSSProperties = {
  marginTop: 22,
  width: '100%',
  padding: '13px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
}
const successStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-up)',
  lineHeight: 1.5,
  textAlign: 'center',
  padding: '8px 0',
}
const errorStyle: CSSProperties = {
  marginTop: 14,
  fontSize: 12,
  color: 'var(--color-bred)',
  textAlign: 'center',
  lineHeight: 1.4,
}
const loadingStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  textAlign: 'center',
  padding: '12px 0',
}
const loginLinkStyle: CSSProperties = {
  display: 'block',
  marginTop: 16,
  fontSize: 12,
  color: 'var(--color-royal)',
  fontWeight: 500,
  textDecoration: 'underline',
  textAlign: 'center',
}
