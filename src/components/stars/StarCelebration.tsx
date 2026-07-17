import { useEffect, useRef, useState, type CSSProperties } from 'react'

/** Teintes dorées cohérentes avec le rendu grail holographique. */
const GOLD_COLORS = ['#f7e392', '#e7c257', '#d8b24a', '#fff3c4', '#f0c948']
const PARTICLE_COUNT = 24

interface Particle {
  tx: number
  ty: number
  color: string
  dur: number
  delay: number
}

/** Génère un burst radial doré (positions figées au montage). */
function makeParticles(): Particle[] {
  const parts: Particle[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Angle réparti sur le cercle + léger jitter pour un rendu organique.
    const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
    const dist = 90 + Math.random() * 120
    parts.push({
      tx: Math.round(Math.cos(angle) * dist),
      ty: Math.round(Math.sin(angle) * dist),
      color: GOLD_COLORS[i % GOLD_COLORS.length],
      dur: 800 + Math.round(Math.random() * 500),
      delay: Math.round(Math.random() * 120),
    })
  }
  return parts
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Carte de célébration (Niveau 3) prête à afficher. */
export interface CelebrationItem {
  id: number
  /** 'rank' met en avant l'écusson ; 'prestige' = gros jalon / prestige haut. */
  variant: 'rank' | 'prestige'
  /** Sur-titre discret (« Nouveau rang », « Exploit ») */
  eyebrow: string
  /** Titre principal en grand (« PREMIER GRAIL ! », nom du nouveau rang) */
  title: string
  /** Points « +N ⭐ » (optionnel — absent pour un changement de rang) */
  pointsText?: string
  /** Écusson du nouveau rang (variant 'rank') */
  iconSrc?: string
}

interface StarCelebrationProps {
  item: CelebrationItem
  /** Durée avant auto-fermeture (ms). */
  duration: number
  onClose: (id: number) => void
}

/**
 * Overlay plein premier plan + carte holographique (esthétique grail du mode
 * Collection). Auto-dismiss + tap-to-close. Présentationnel : la file est gérée
 * par le provider (une célébration à la fois, jamais superposées).
 */
export function StarCelebration({ item, duration, onClose }: StarCelebrationProps) {
  const [leaving, setLeaving] = useState(false)
  const [iconFailed, setIconFailed] = useState(false)
  const closedRef = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  // Burst figé au montage ; vide sous reduced-motion (pas de feu d'artifice).
  const particlesRef = useRef<Particle[]>(prefersReducedMotion() ? [] : makeParticles())

  // Ferme une seule fois (auto-dismiss ou tap), avec l'anim de sortie.
  const close = useRef(() => {
    if (closedRef.current) return
    closedRef.current = true
    setLeaving(true)
    window.setTimeout(() => onCloseRef.current(item.id), 300)
  }).current

  useEffect(() => {
    const t = window.setTimeout(close, duration)
    return () => window.clearTimeout(t)
    // Montage uniquement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isRank = item.variant === 'rank'

  return (
    <div
      className={'star-cel-overlay' + (leaving ? ' leaving' : '')}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.eyebrow} — ${item.title}`}
      onClick={close}
    >
      {particlesRef.current.length > 0 && (
        <div className="star-cel-burst" aria-hidden>
          {particlesRef.current.map((p, i) => (
            <span
              key={i}
              className="star-cel-particle"
              style={
                {
                  '--p-tx': `${p.tx}px`,
                  '--p-ty': `${p.ty}px`,
                  '--p-color': p.color,
                  '--p-dur': `${p.dur}ms`,
                  '--p-delay': `${p.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div
        className={
          'star-cel-card' +
          (isRank ? ' star-cel-card--rank' : ' star-cel-card--prestige') +
          (leaving ? ' leaving' : '')
        }
      >
        <div className="star-cel-holo" aria-hidden />
        <div className="star-cel-sheen" aria-hidden />
        <div className="star-cel-content">
          {isRank &&
            (iconFailed || !item.iconSrc ? (
              <div className="star-cel-icon" aria-hidden>
                🏅
              </div>
            ) : (
              <img
                className="star-cel-icon-img"
                src={item.iconSrc}
                alt=""
                aria-hidden
                onError={() => setIconFailed(true)}
              />
            ))}
          <div className="star-cel-eyebrow">{item.eyebrow}</div>
          <div className="star-cel-title">{item.title}</div>
          {item.pointsText && <div className="star-cel-points">{item.pointsText}</div>}
        </div>
      </div>
    </div>
  )
}
