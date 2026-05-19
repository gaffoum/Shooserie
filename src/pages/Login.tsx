import { useState, type FormEvent, type CSSProperties } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Logo } from '@/components/Logo'

type Mode = 'signin' | 'signup'
type Status = 'idle' | 'submitting' | 'error'

export function Login() {
  const { session, loading } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (!loading && session) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setStatus('submitting')
    setErrorMsg('')

    const { error } =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (error) {
      setStatus('error')
      setErrorMsg(translateError(error.message))
    } else {
      // onAuthStateChange dans AuthContext déclenche la redirection vers /dashboard
      // (signUp connecte directement si "Confirm email" est OFF côté Supabase)
      setStatus('idle')
    }
  }

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setStatus('idle')
    setErrorMsg('')
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
      }}
    >
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
            {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="toi@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'submitting'}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--color-royal)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
          />

          <label htmlFor="password" style={{ ...labelStyle, marginTop: 16 }}>
            Mot de passe
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
              Minimum 6 caractères.
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
              ? mode === 'signin' ? 'Connexion…' : 'Création…'
              : mode === 'signin' ? 'Se connecter' : 'Créer le compte'}
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
              {errorMsg || 'Une erreur est survenue, réessaie.'}
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
            {mode === 'signin' ? "Pas encore de compte ?" : 'Déjà un compte ?'}{' '}
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
              {mode === 'signin' ? 'En créer un' : 'Se connecter'}
            </button>
          </div>
        </form>
      </div>

      <p
        style={{
          marginTop: 24,
          fontSize: 10,
          letterSpacing: 'var(--tracking-wider)',
          textTransform: 'uppercase',
          color: 'var(--color-text-faint)',
          fontWeight: 500,
        }}
      >
        Phase 1 · Build initial
      </p>
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

/** Traduit les principaux messages d'erreur Supabase en FR */
function translateError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (m.includes('user already registered')) return 'Un compte existe déjà avec cet email.'
  if (m.includes('password should be at least'))
    return 'Mot de passe trop court (minimum 6 caractères).'
  if (m.includes('email not confirmed'))
    return "Email non confirmé. Désactive la confirmation dans Supabase pour ce compte."
  if (m.includes('signups not allowed')) return "L'inscription est désactivée."
  if (m.includes('rate limit')) return 'Trop de tentatives, réessaie dans une minute.'
  return msg
}
