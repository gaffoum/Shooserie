import { useEffect, useRef, useState } from 'react'
import type { CollectionCard } from '@/lib/collectionGrouping'
import type { SneakerStory } from '@/lib/stories'
import type { RarityTier } from '@/lib/types'
import { CardFront, CardBack, tierClass } from './SneakerCard'
import { awardReadStory } from '@/lib/engagement'
import './CardOverlay.css'

/**
 * Ouverture d'une carte en overlay plein écran. La carte se détache de sa poche,
 * s'agrandit au centre (scale .6 → 1, léger rebond) PUIS se retourne
 * automatiquement (~430 ms) pour révéler le verso — l'histoire de la paire.
 * Fermeture : ✕, clic sur le fond, ou Échap. Reclic sur la carte = re-flip.
 * `prefers-reduced-motion` : verso agrandi affiché directement, sans animation.
 */

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

interface CardOverlayProps {
  card: CollectionCard
  story?: SneakerStory | null
  onClose: () => void
}

export function CardOverlay({ card, story, onClose }: CardOverlayProps) {
  const rm = prefersReducedMotion()
  const [entered, setEntered] = useState(rm) // agrandissement terminé
  const [flipped, setFlipped] = useState(rm) // verso affiché

  const rarity: RarityTier = card.rarity ?? 'unknown'
  const { cardClass, isMetal } = tierClass(rarity)

  // Séquence enchaînée : agrandit (frame suivante) → retourne à ~430 ms.
  useEffect(() => {
    if (rm) return
    const raf = requestAnimationFrame(() => setEntered(true))
    const t = window.setTimeout(() => setFlipped(true), 430)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
  }, [rm])

  // Lecture d'histoire : crédite +2 (plafond 20/jour, dédup par pattern côté
  // SQL) une seule fois par ouverture, quand le verso à récit est révélé.
  const storyAwardedRef = useRef(false)
  useEffect(() => {
    if (flipped && story?.match_pattern && !storyAwardedRef.current) {
      storyAwardedRef.current = true
      awardReadStory(story.match_pattern)
    }
  }, [flipped, story])

  // Échap ferme.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Fige le scroll de fond pendant l'ouverture.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div
      className="tcg-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={card.name}
      onClick={onClose}
    >
      <div
        className={`tcg-overlay-card${entered ? ' entered' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          setFlipped((f) => !f)
        }}
      >
        <button
          type="button"
          className="tcg-overlay-x"
          aria-label="Fermer"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
          ✕
        </button>
        <div className={`tcg-flip tcg-xl${flipped ? ' flipped' : ''}`}>
          <div className="tcg-flip-inner">
            <div className="tcg-face tcg-face-front">
              <CardFront card={card} rarity={rarity} isMetal={isMetal} cardClass={cardClass} />
            </div>
            <div className="tcg-face tcg-face-back">
              <CardBack card={card} rarity={rarity} story={story} />
            </div>
          </div>
        </div>
        {!story && (
          <div className="tcg-overlay-tapinfo">Pas d'histoire éditoriale pour cette paire</div>
        )}
      </div>
    </div>
  )
}
