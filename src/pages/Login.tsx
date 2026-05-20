import { useState, type FormEvent, type CSSProperties, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useT } from '@/i18n/I18nContext'
import { Logo } from '@/components/Logo'
import { LanguageToggle } from '@/components/LanguageToggle'
import type { DictKey } from '@/i18n/dictionaries'

type Mode = 'signin' | 'signup' | 'forgot'
type Status = 'idle' | 'submitting' | 'error' | 'success'

export function Login() {
  const { session, loading } = useAuth()
  const { t } = useT()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorKey, setErrorKey] = useState<DictKey | null>(null)
  const [errorRaw, setErrorRaw] = useState<string>('')

  if (!loading && session) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorKey(null)
    setErrorRaw('')

    if (mode === 'forgot') {
      if (!email) {
        setStatus('idle')
        return
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setStatus('error')
        const key = mapErrorToKey(error.message)
        if (key) setErrorKey(key)
        else setErrorRaw(error.message)
      } else {
        // For privacy, we always show success — Supabase intentionally returns
        // success even for unknown emails so we don't leak account existence.
        setStatus('success')
      }
      return
    }

    if (!email || !password) {
      setStatus('idle')
      return
    }
    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (error) {
      setStatus('error')
      const key = mapErrorToKey(error.message)
      if (key) setErrorKey(key)
      else setErrorRaw(error.message)
    } else {
      setStatus('idle')
    }
  }

  const setModeTo = (m: Mode) => {
    setMode(m)
    setStatus('idle')
    setErrorKey(null)
    setErrorRaw('')
    setPassword('')
  }

  const switchMode = () => {
    setModeTo(mode === 'signin' ? 'signup' : 'signin')
  }

  return (
    <div className="login-page">
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
        <LanguageToggle />
      </div>

      <div className="login-container">
        <LoginHero />

        <div className="login-card">
          <p
            style={{
              margin: 0,
              marginBottom: 22,
              fontSize: 11,
              letterSpacing: 'var(--tracking-wider)',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {mode === 'signin'
              ? t('auth.signin.title')
              : mode === 'signup'
                ? t('auth.signup.title')
                : t('auth.forgot.title')}
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Forgot mode — blurb at the top */}
            {mode === 'forgot' && status !== 'success' && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                  marginBottom: 16,
                  textAlign: 'center',
                  marginTop: 0,
                }}
              >
                {t('auth.forgot.desc')}
              </p>
            )}

            {/* Forgot success — full replacement of the form */}
            {mode === 'forgot' && status === 'success' ? (
              <>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--color-up)',
                    lineHeight: 1.5,
                    marginBottom: 20,
                    textAlign: 'center',
                  }}
                >
                  ✓ {t('auth.forgot.success', { email })}
                </p>
                <button
                  type="button"
                  onClick={() => setModeTo('signin')}
                  style={{
                    color: 'var(--color-royal)',
                    fontWeight: 500,
                    textDecoration: 'underline',
                    fontSize: 12,
                    display: 'block',
                    margin: '0 auto',
                  }}
                >
                  {t('auth.forgot.back')}
                </button>
              </>
            ) : (
              <>
                <label htmlFor="email" style={labelStyle}>{t('auth.email')}</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'submitting'}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-royal)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                />

                {mode !== 'forgot' && (
                  <>
                    <label htmlFor="password" style={{ ...labelStyle, marginTop: 16 }}>
                      {t('auth.password')}
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={status === 'submitting'}
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-royal)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                    />
                    {mode === 'signup' && (
                      <p
                        style={{
                          marginTop: 6,
                          fontSize: 11,
                          color: 'var(--color-text-faint)',
                          lineHeight: 1.4,
                        }}
                      >
                        {t('auth.passwordHint')}
                      </p>
                    )}
                    {mode === 'signin' && (
                      <div style={{ marginTop: 10, textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => setModeTo('forgot')}
                          style={{
                            color: 'var(--color-text-muted)',
                            fontSize: 11,
                            textDecoration: 'underline',
                          }}
                        >
                          {t('auth.forgot.link')}
                        </button>
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={
                    status === 'submitting' ||
                    !email ||
                    (mode !== 'forgot' && !password)
                  }
                  style={{
                    marginTop: 22,
                    width: '100%',
                    padding: '13px',
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 'var(--tracking-wide)',
                    textTransform: 'uppercase',
                    background:
                      status === 'submitting' ? 'var(--color-text-muted)' : 'var(--color-bred)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    opacity:
                      !email || (mode !== 'forgot' && !password) ? 0.55 : 1,
                    cursor: status === 'submitting' ? 'wait' : 'pointer',
                    transition: 'background var(--transition-fast)',
                  }}
                >
                  {status === 'submitting'
                    ? mode === 'signin'
                      ? t('auth.signin.submitting')
                      : mode === 'signup'
                        ? t('auth.signup.submitting')
                        : t('auth.forgot.submitting')
                    : mode === 'signin'
                      ? t('auth.signin.submit')
                      : mode === 'signup'
                        ? t('auth.signup.submit')
                        : t('auth.forgot.submit')}
                </button>

                {status === 'error' && (
                  <p
                    style={{
                      marginTop: 14,
                      fontSize: 12,
                      color: 'var(--color-bred)',
                      textAlign: 'center',
                      lineHeight: 1.4,
                    }}
                  >
                    {errorKey ? t(errorKey) : errorRaw || t('auth.errors.generic')}
                  </p>
                )}

                <div
                  style={{
                    marginTop: 22,
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {mode === 'forgot' ? (
                    <button
                      type="button"
                      onClick={() => setModeTo('signin')}
                      style={{
                        color: 'var(--color-royal)',
                        fontWeight: 500,
                        textDecoration: 'underline',
                        fontSize: 12,
                      }}
                    >
                      {t('auth.forgot.back')}
                    </button>
                  ) : (
                    <>
                      {mode === 'signin'
                        ? t('auth.signin.noAccount')
                        : t('auth.signup.haveAccount')}{' '}
                      <button
                        type="button"
                        onClick={switchMode}
                        style={{
                          color: 'var(--color-royal)',
                          fontWeight: 500,
                          textDecoration: 'underline',
                          fontSize: 12,
                        }}
                      >
                        {mode === 'signin'
                          ? t('auth.signin.switchToSignup')
                          : t('auth.signup.switchToSignin')}
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

/**
 * Hero panel — branding + value proposition. Sits to the left of the auth
 * card on desktop, stacks above it on mobile. Three features are surfaced
 * because that's what differentiates Shooserie from a generic notes app:
 * the scan, the live values, and the P&L tracking.
 */
function LoginHero() {
  const { t } = useT()
  return (
    <section className="login-hero" aria-label="Shooserie">
      <Logo size="lg" />
      <h1 className="login-hero-tagline">{t('landing.tagline')}</h1>
      <p className="login-hero-subtitle">{t('landing.subtitle')}</p>
      <ul className="login-hero-features">
        <Feature
          icon={<ScanIcon />}
          title={t('landing.feature.scan.title')}
          desc={t('landing.feature.scan.desc')}
        />
        <Feature
          icon={<TrendingUpIcon />}
          title={t('landing.feature.price.title')}
          desc={t('landing.feature.price.desc')}
        />
        <Feature
          icon={<WalletIcon />}
          title={t('landing.feature.track.title')}
          desc={t('landing.feature.track.desc')}
        />
      </ul>
    </section>
  )
}

function Feature({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <li style={featureStyle}>
      <div style={featureIconStyle} aria-hidden>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={featureTitleStyle}>{title}</div>
        <div style={featureDescStyle}>{desc}</div>
      </div>
    </li>
  )
}

// ----- SVG icons (inline, no external lib) ----- //

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="8" x2="7" y2="16" />
      <line x1="11" y1="8" x2="11" y2="16" />
      <line x1="15" y1="8" x2="15" y2="16" />
      <line x1="19" y1="8" x2="19" y2="16" />
    </svg>
  )
}

function TrendingUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8a2 2 0 0 0-2-2H5a1 1 0 0 1 0-2h13" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      <path d="M18 12a2 2 0 1 0 0 4h4v-4Z" />
    </svg>
  )
}

// ----- Inline styles (the layout-critical ones live in index.css) ----- //

const featureStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'flex-start',
}
const featureIconStyle: CSSProperties = {
  flexShrink: 0,
  width: 38,
  height: 38,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-text)',
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const featureTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-wide)',
  marginBottom: 2,
}
const featureDescStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
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
  transition: 'border-color var(--transition-fast)',
}

/** Maps Supabase auth error messages to our dictionary keys. */
function mapErrorToKey(msg: string): DictKey | null {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'auth.errors.invalidCredentials'
  if (m.includes('user already registered')) return 'auth.errors.userExists'
  if (m.includes('password should be at least')) return 'auth.errors.passwordShort'
  if (m.includes('email not confirmed')) return 'auth.errors.emailNotConfirmed'
  if (m.includes('signups not allowed')) return 'auth.errors.signupsDisabled'
  if (m.includes('rate limit')) return 'auth.errors.rateLimit'
  return null
}
