/**
 * PseudoSetupGuard — modal bloquant si pseudo non configuré
 *
 * À monter UNE FOIS au top niveau de l'app (dans App.tsx).
 * Tant que `profile.pseudo_configured === false`, le user voit un modal
 * fullscreen qu'il ne peut pas fermer. Il doit choisir un pseudo unique
 * (validé en temps réel via le RPC `is_pseudo_available`) pour continuer.
 *
 * Drop-in : place dans src/components/PseudoSetupGuard.tsx
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  useMyProfile,
  useCheckPseudoAvailability,
  useSetMyPseudo,
} from '../lib/queries'

// Format autorisé : 3-20 caractères, alphanum + . _ -
const PSEUDO_REGEX = /^[a-zA-Z0-9._-]{3,20}$/

export function PseudoSetupGuard() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useMyProfile()
  const setPseudo = useSetMyPseudo()

  const [value, setValue] = useState('')
  const [debouncedValue, setDebouncedValue] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)

  // Debounce 500ms avant de check la dispo cote serveur
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), 500)
    return () => clearTimeout(t)
  }, [value])

  const trimmed = value.trim()
  const formatValid = PSEUDO_REGEX.test(trimmed)

  const { data: isAvailable, isFetching: isChecking } =
    useCheckPseudoAvailability(debouncedValue, formatValid)

  const shouldShow =
    !!user && !isLoading && !!profile && profile.pseudo_configured === false

  // Bloque le scroll de la page derriere le modal
  useEffect(() => {
    if (shouldShow) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [shouldShow])

  if (!shouldShow) return null

  const canSubmit =
    formatValid && isAvailable !== false && !setPseudo.isPending

  const handleSubmit = () => {
    alert('DEBUG 1: click detecte, canSubmit=' + canSubmit + ', trimmed=' + trimmed)
    if (!canSubmit) return
    alert('DEBUG 2: passage validation, lancement mutation')
    setServerError(null)
    setPseudo.mutate(trimmed, {
      onSuccess: () => alert('DEBUG 3: SUCCESS, pseudo enregistre'),
      onError: (err: any) => {
        alert('DEBUG 4: ERREUR: ' + (err?.message ?? 'inconnue'))
        setServerError(err?.message ?? 'Erreur inconnue')
      },
    })
  }

  // Determine l'etat visuel sous l'input
  let statusNode: React.ReactNode = null
  if (trimmed.length === 0) {
    statusNode = (
      <span style={hintStyle}>
        3 a 20 caracteres. Lettres, chiffres, point, tiret, underscore.
      </span>
    )
  } else if (!formatValid) {
    statusNode = (
      <span style={errorStyle}>
        Caracteres autorises : a-z, A-Z, 0-9, . _ - (3 a 20 caracteres)
      </span>
    )
  } else if (isChecking) {
    statusNode = <span style={hintStyle}>Verification...</span>
  } else if (isAvailable === false) {
    statusNode = <span style={errorStyle}>Ce pseudo est deja pris</span>
  } else if (isAvailable === true) {
    statusNode = <span style={successStyle}>Pseudo disponible</span>
  }

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pseudo-setup-title"
    >
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={badgeStyle}>BIENVENUE</div>
          <h2 id="pseudo-setup-title" style={titleStyle}>
            Choisis ton pseudo.
          </h2>
          <p style={subtitleStyle}>
            C'est le nom qui apparait dans le Marche, les messages et ta
            collection publique. Pas de doublon possible.
          </p>
        </div>

        <div style={inputWrapStyle}>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setServerError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit) handleSubmit()
            }}
            placeholder="Ex: sneakerhead_75"
            maxLength={20}
            autoFocus
            style={inputStyle}
          />
          <div style={statusRowStyle}>{statusNode}</div>
          {serverError && <div style={errorBoxStyle}>{serverError}</div>}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={canSubmit ? ctaActiveStyle : ctaDisabledStyle}
        >
          {setPseudo.isPending ? 'Sauvegarde...' : 'Continuer'}
        </button>

        <p style={footerNoteStyle}>
          Tu pourras le modifier plus tard depuis ton compte.
        </p>
      </div>
    </div>
  )
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(10, 10, 10, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: 16,
  backdropFilter: 'blur(4px)',
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: 16,
  maxWidth: 480,
  width: '100%',
  padding: '32px 28px',
  boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
}

const headerStyle: React.CSSProperties = { marginBottom: 24 }

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  background: '#CE1141',
  color: 'white',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  padding: '4px 10px',
  borderRadius: 4,
  marginBottom: 12,
}

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  margin: '0 0 8px',
  color: '#0A0A0A',
  fontFamily: "'Outfit', sans-serif",
  lineHeight: 1.15,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#6B7280',
  margin: 0,
  lineHeight: 1.5,
}

const inputWrapStyle: React.CSSProperties = { marginBottom: 20 }

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  border: '2px solid #E5E7EB',
  borderRadius: 10,
  fontSize: 16,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
}

const statusRowStyle: React.CSSProperties = {
  minHeight: 22,
  marginTop: 8,
  fontSize: 13,
}

const hintStyle: React.CSSProperties = { color: '#6B7280' }
const errorStyle: React.CSSProperties = { color: '#CE1141', fontWeight: 500 }
const successStyle: React.CSSProperties = { color: '#10B981', fontWeight: 600 }

const errorBoxStyle: React.CSSProperties = {
  marginTop: 10,
  padding: '10px 14px',
  background: '#FEF2F4',
  border: '1px solid #FCA5A5',
  borderRadius: 8,
  color: '#CE1141',
  fontSize: 13,
}

const ctaActiveStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  background: '#CE1141',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const ctaDisabledStyle: React.CSSProperties = {
  ...ctaActiveStyle,
  background: '#D1D5DB',
  cursor: 'not-allowed',
}

const footerNoteStyle: React.CSSProperties = {
  marginTop: 16,
  fontSize: 12,
  color: '#9CA3AF',
  textAlign: 'center',
}

