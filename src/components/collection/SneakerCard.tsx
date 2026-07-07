import { SneakerPhoto } from '../SneakerPhoto'
import type { RarityTier } from '@/lib/types'
import type { CollectionCard } from '@/lib/collectionGrouping'
import './SneakerCard.css'

/**
 * Carte TCG (mode « Collection »/classeur). Porte le design de la maquette :
 * 5 paliers avec métaux animés (or grail / argent ultra / bronze rare) et
 * paliers plats (peu commune vert, commune gris). Gabarit fixe → toutes les
 * cartes ont la même hauteur. La photo passe par `SneakerPhoto`
 * (StockX public + bucket privé signé + fallback silhouette).
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

export function SneakerCard({ card }: { card: CollectionCard }) {
  const rarity: RarityTier = card.rarity ?? 'unknown'
  const isMetal = METAL_TIERS.includes(rarity)
  const tier = rarity !== 'unknown' ? TIER[rarity] : null

  return (
    <div className={`tcg-card tcg-${rarity}${isMetal ? ' tcg-metal' : ''}`}>
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
        <SneakerPhoto
          stockxUrl={card.stockx_image_url}
          storagePath={card.photo_url}
          alt={card.name}
        />
      </div>

      <div className="tcg-plate">
        <div className="tcg-name">{card.name}</div>
        <div className="tcg-cw">{card.colorway ?? ''}</div>
      </div>
    </div>
  )
}
