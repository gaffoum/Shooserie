import { SneakerPhoto } from '../SneakerPhoto'
import type { RarityTier } from '@/lib/types'
import type { CollectionCard } from '@/lib/collectionGrouping'
import './SneakerCard.css'

/**
 * Carte TCG (mode « Collection »/classeur), à deux faces avec flip 3D.
 * Recto : badge/étoiles + photo + nameplate. Verso : l'histoire de la paire
 * (voir GuideRarities/BinderView pour l'alimentation). Gabarit fixe → toutes
 * les cartes ont la même hauteur, recto comme verso.
 */

type ClassedTier = Exclude<RarityTier, 'unknown'>

const TIER: Record<ClassedTier, { stars: number; label: string }> = {
  commune: { stars: 1, label: 'Commune' },
  peu_commune: { stars: 2, label: 'Peu commune' },
  rare: { stars: 3, label: 'Rare' },
  ultra_rare: { stars: 4, label: 'Ultra rare' },
  grail: { stars: 5, label: 'Grail' },
}

const METAL_TIERS: RarityTier[] = ['rare', 'ultra_rare', 'grail']

function starColor(r: RarityTier): string {
  return r === 'grail'
    ? '#e7c257'
    : r === 'ultra_rare'
      ? '#c2c9d1'
      : r === 'rare'
        ? '#c9824c'
        : r === 'peu_commune'
          ? '#2f9e44'
          : '#8a8a8a'
}

function badgeText(r: RarityTier): string {
  return r === 'grail' || r === 'rare' ? '#1a1206' : r === 'ultra_rare' ? '#1a1d22' : '#fff'
}

interface SneakerCardProps {
  card: CollectionCard
  /** Verso affiché ? Piloté par le classeur (un seul verso ouvert par page). */
  flipped?: boolean
  /** Toggle recto/verso au tap/clic. */
  onToggle?: () => void
}

export function SneakerCard({ card, flipped = false, onToggle }: SneakerCardProps) {
  const rarity: RarityTier = card.rarity ?? 'unknown'
  const isMetal = METAL_TIERS.includes(rarity)
  const cardClass = `tcg-card tcg-${rarity}${isMetal ? ' tcg-metal' : ''}`

  return (
    <div
      className={`tcg-flip${flipped ? ' flipped' : ''}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle?.()
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={card.name}
    >
      <div className="tcg-flip-inner">
        <div className="tcg-face tcg-face-front">
          <CardFront card={card} rarity={rarity} isMetal={isMetal} cardClass={cardClass} />
        </div>
        <div className="tcg-face tcg-face-back">
          <div className={`${cardClass} tcg-cardback`}>
            {/* Verso enrichi au Lot 3 ; pour l'instant : nom + colorway. */}
            <div className="tcg-back-head">
              <div className="tcg-back-name">{card.name}</div>
              {card.colorway && <div className="tcg-cw">{card.colorway}</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardFront({
  card,
  rarity,
  isMetal,
  cardClass,
}: {
  card: CollectionCard
  rarity: RarityTier
  isMetal: boolean
  cardClass: string
}) {
  const tier = rarity !== 'unknown' ? TIER[rarity] : null
  return (
    <div className={cardClass}>
      {isMetal && <div className="tcg-m-frame" />}
      {rarity === 'grail' && <div className="tcg-holo" />}
      {isMetal && <div className="tcg-m-sheen" />}

      <div className="tcg-c-top">
        {tier ? (
          <>
            <span
              className="tcg-badge"
              style={{ background: starColor(rarity), color: badgeText(rarity) }}
            >
              ★ {tier.label.toUpperCase()}
            </span>
            <span className="tcg-stars" style={{ color: starColor(rarity) }}>
              {'★'.repeat(tier.stars)}
            </span>
          </>
        ) : (
          <span className="tcg-badge tcg-badge-unknown">—</span>
        )}
      </div>

      <div className="tcg-win">
        <SneakerPhoto stockxUrl={card.stockx_image_url} storagePath={card.photo_url} alt={card.name} />
      </div>

      <div className="tcg-plate">
        <div className="tcg-name">{card.name}</div>
        <div className="tcg-cw">{card.colorway ?? ''}</div>
      </div>
    </div>
  )
}
