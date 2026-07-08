import { SneakerPhoto } from '../SneakerPhoto'
import type { RarityTier } from '@/lib/types'
import type { CollectionCard } from '@/lib/collectionGrouping'
import type { SneakerStory } from '@/lib/stories'
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
  /** Histoire éditoriale du modèle (verso). Absente → bloc perso seul. */
  story?: SneakerStory | null
  /** Verso affiché ? Piloté par le classeur (un seul verso ouvert par page). */
  flipped?: boolean
  /** Toggle recto/verso au tap/clic. */
  onToggle?: () => void
}

export function SneakerCard({ card, story, flipped = false, onToggle }: SneakerCardProps) {
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
          <CardBack card={card} rarity={rarity} cardClass={cardClass} story={story} />
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

/** Lignes du bloc « perso », depuis les données existantes de la paire. */
function buildPerso(card: CollectionCard): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = []
  if (card.condition) rows.push({ label: 'État', value: card.condition })
  if (card.wear_count > 0)
    rows.push({ label: 'Portées', value: String(card.wear_count) })
  const size = [
    card.size_eu ? `EU ${card.size_eu}` : null,
    card.size_us ? `US ${card.size_us}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  if (size) rows.push({ label: 'Taille', value: size })
  if (card.purchase_date) {
    const year = card.purchase_date.slice(0, 4)
    if (/^\d{4}$/.test(year)) rows.push({ label: 'Depuis', value: year })
  }
  return rows
}

/**
 * Verso : fond sombre + liseré métallique du tier, filigrane code-barres discret.
 * Avec histoire → titre (couleur métal) + récit (scroll interne) + séparateur + perso.
 * Sans histoire → en-tête nom/colorway + séparateur + perso. Aucun texte inventé.
 */
function CardBack({
  card,
  rarity,
  cardClass,
  story,
}: {
  card: CollectionCard
  rarity: RarityTier
  cardClass: string
  story?: SneakerStory | null
}) {
  const metal = starColor(rarity)
  const perso = buildPerso(card)

  return (
    <div className={`${cardClass} tcg-cardback`}>
      <div className="tcg-filigree" aria-hidden="true" />
      <div className="tcg-back-content">
        {story ? (
          <>
            <div className="tcg-back-title" style={{ color: metal }}>
              {story.title}
            </div>
            <div className="tcg-back-story">{story.story}</div>
          </>
        ) : (
          <div className="tcg-back-head">
            <div className="tcg-back-name">{card.name}</div>
            {card.colorway && <div className="tcg-cw">{card.colorway}</div>}
          </div>
        )}

        <div className="tcg-back-sep" style={{ background: metal }} />

        <div className="tcg-back-perso">
          {perso.length > 0 ? (
            perso.map((p) => (
              <div className="tcg-perso-row" key={p.label}>
                <span className="tcg-perso-label">{p.label}</span>
                <span className="tcg-perso-val">{p.value}</span>
              </div>
            ))
          ) : (
            <div className="tcg-perso-empty">—</div>
          )}
        </div>
      </div>
    </div>
  )
}
