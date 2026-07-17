import { useEffect, useRef, useState } from 'react'

export type ToastKind = 'gain' | 'group'

/** Mini-carte N2 prête à afficher (chaînes déjà résolues i18n). */
export interface ToastItem {
  id: number
  kind: ToastKind
  /** Libellé de l'exploit (« Première Rare ! », « 3 marques ! ») */
  label: string
  /** Points « +N ⭐ » */
  pointsText?: string
}

interface StarToastProps {
  item: ToastItem
  /** Durée d'affichage (ms). */
  duration: number
  onDone: (id: number) => void
}

/**
 * Mini-carte de gain (Niveau 2). Version allégée de la carte célébration :
 * centrée, compacte, brève, SANS overlay (non bloquante) ni particules.
 * Gère son cycle de vie (pop à l'entrée, classe `leaving` avant sortie, onDone).
 */
export function StarToast({ item, duration, onDone }: StarToastProps) {
  const [leaving, setLeaving] = useState(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const outAt = Math.max(0, duration - 280)
    const t1 = window.setTimeout(() => setLeaving(true), outAt)
    const t2 = window.setTimeout(() => onDoneRef.current(item.id), duration)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
    // Montage uniquement — durée/id stables pour un toast donné.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={'star-mini' + (leaving ? ' leaving' : '')} role="status" aria-live="polite">
      <span className="star-mini__star" aria-hidden>
        ⭐
      </span>
      <div className="star-mini__text">
        <div className="star-mini__label">{item.label}</div>
        {item.pointsText && <div className="star-mini__points">{item.pointsText}</div>}
      </div>
    </div>
  )
}
