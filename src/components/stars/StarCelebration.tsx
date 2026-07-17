import { useEffect, useRef, useState } from 'react'

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
