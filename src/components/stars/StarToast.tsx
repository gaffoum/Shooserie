import { useEffect, useRef, useState } from 'react'

export type ToastKind = 'gain' | 'group' | 'rank'

/** Toast prêt à afficher (chaînes déjà résolues i18n + icône selon thème). */
export interface ToastItem {
  id: number
  kind: ToastKind
  /** Ligne principale (nom de règle, texte groupé, ou nom du nouveau rang) */
  label: string
  /** Points « +N ⭐ » (gain/group) */
  pointsText?: string
  /** Sur-titre du toast de rang (« Nouveau rang ») */
  rankTitle?: string
  /** Écusson du nouveau rang (toast de rang) */
  iconSrc?: string
}

interface StarToastProps {
  item: ToastItem
  duration: number
  onDone: (id: number) => void
}

/**
 * Toast unitaire présentationnel. Gère son cycle de vie (entrée CSS au montage,
 * classe `leaving` avant la sortie, puis onDone). Autonome : pilotable par
 * n'importe quel orchestrateur de file.
 */
export function StarToast({ item, duration, onDone }: StarToastProps) {
  const [leaving, setLeaving] = useState(false)
  const [iconFailed, setIconFailed] = useState(false)
  // onDone peut changer d'identité à chaque render du parent : on le fige
  // dans une ref pour que les timers ne soient posés qu'une fois (au montage).
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const outAt = Math.max(0, duration - 280)
    const t1 = setTimeout(() => setLeaving(true), outAt)
    const t2 = setTimeout(() => onDoneRef.current(item.id), duration)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    // Montage uniquement — durée/id stables pour un toast donné.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isRank = item.kind === 'rank'
  const cls =
    'star-toast' + (isRank ? ' star-toast--rank' : '') + (leaving ? ' leaving' : '')

  return (
    <div className={cls} role="status" aria-live="polite">
      {isRank &&
        (iconFailed || !item.iconSrc ? (
          <span className="star-toast__icon" aria-hidden style={{ fontSize: 32, textAlign: 'center' }}>
            🏅
          </span>
        ) : (
          <img
            className="star-toast__icon"
            src={item.iconSrc}
            alt=""
            aria-hidden
            onError={() => setIconFailed(true)}
          />
        ))}
      <div style={{ minWidth: 0 }}>
        {isRank && item.rankTitle && <div className="star-toast__rank-title">{item.rankTitle}</div>}
        <div className={isRank ? 'star-toast__rank-name' : 'star-toast__label'}>{item.label}</div>
        {item.pointsText && <div className="star-toast__points">{item.pointsText}</div>}
      </div>
    </div>
  )
}
