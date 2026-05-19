import { useState, type FormEvent, type CSSProperties } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useT } from '@/i18n/I18nContext'
import { Logo } from '@/components/Logo'
import { LanguageToggle } from '@/components/LanguageToggle'
import type { DictKey } from '@/i18n/dictionaries'

type Mode = 'signin' | 'signup'
type Status = 'idle' | 'submitting' | 'error'

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
    if (!email || !password) return
    setStatus('submitting')
    setErrorKey(null)
    setErrorRaw('')

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

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setStatus('idle')
    setErrorKey(null)
    setErrorRaw('')
  }

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

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 28px',
        }}
      >
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <Logo size="lg" />
          <p
            style={{
              marginTop: 8,
              fontSize: 11,
              letterSpacing: 'var(--tracking-wider)',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
            }}
          >
            {mode === 'signin' ? t('auth.signin.title') : t('auth.signup.title')}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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

          <button
            type="submit"
            disabled={status === 'submitting' || !email || !password}
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
              opacity: !email || !password ? 0.55 : 1,
              cursor: status === 'submitting' ? 'wait' : 'pointer',
              transition: 'background var(--transition-fast)',
            }}
          >
            {status === 'submitting'
              ? mode === 'signin'
                ? t('auth.signin.submitting')
                : t('auth.signup.submitting')
              : mode === 'signin'
                ? t('auth.signin.submit')
                : t('auth.signup.submit')}
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
            {mode === 'signin' ? t('auth.signin.noAccount') : t('auth.signup.haveAccount')}{' '}
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
          </div>
        </form>
      </div>
    </div>
  )
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
