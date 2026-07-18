import { SneakerPhoto } from '../SneakerPhoto'
import type { RarityTier } from '@/lib/types'
import type { CollectionCard } from '@/lib/collectionGrouping'
import { wearStatus } from '@/lib/wears'
import './SneakerCard.css'

/**
 * Carte TCG (mode « Collection »/classeur). Dans la grille, la carte affiche
 * le RECTO seul ; taper/cliquer l'ouvre en grand dans un overlay (CardOverlay)
 * qui gère l'agrandissement puis le flip vers le verso (l'histoire de la paire).
 * Les faces (CardFront/CardBack) sont exportées pour être réutilisées agrandies.
 */

type ClassedTier = Exclude<RarityTier, 'unknown'>

const TIER: Record<ClassedTier, { stars: number; label: string }> = {
  commune: { stars: 1, label: 'Commune' },
  peu_commune: { stars: 2, label: 'Peu commune' },
  rare: { stars: 3, label: 'Rare' },
  ultra_rare: { stars: 4, label: 'Ultra rare' },
  grail: { stars: 5, label: 'Grail' },
}

export const METAL_TIERS: RarityTier[] = ['rare', 'ultra_rare', 'grail']

/** Couleur du métal/accent du tier (titre, séparateur, étoiles).
 *  Métaux du handoff : commune=acier, peu_commune=bronze, rare=argent,
 *  ultra_rare=bleu roi, grail=or. */
export function starColor(r: RarityTier): string {
  return r === 'grail'
    ? '#e7c257' // or
    : r === 'ultra_rare'
      ? '#7ba0e0' // bleu roi (éclairci pour lisibilité sur fond sombre)
      : r === 'rare'
        ? '#c2c9d1' // argent
        : r === 'peu_commune'
          ? '#B87333' // bronze
          : '#6b7280' // acier (commune / unknown)
}

function badgeText(r: RarityTier): string {
  // Fond du badge = starColor : texte sombre sur métaux clairs, blanc sinon.
  return r === 'grail' || r === 'rare' || r === 'ultra_rare' ? '#141414' : '#fff'
}

/** Classe CSS + flag métal d'une carte selon son tier. */
export function tierClass(rarity: RarityTier): { cardClass: string; isMetal: boolean } {
  const isMetal = METAL_TIERS.includes(rarity)
  return { cardClass: `tcg-card tcg-${rarity}${isMetal ? ' tcg-metal' : ''}`, isMetal }
}

interface SneakerCardProps {
  card: CollectionCard
  /** La paire a-t-elle une histoire ? → badge « ★ HISTOIRE » en coin. */
  hasStory?: boolean
  /** Afficher le badge histoire (togglable depuis le classeur). */
  showStoryBadge?: boolean
  /** Ouverture en overlay au tap/clic. */
  onOpen?: () => void
}

export function SneakerCard({
  card,
  hasStory = false,
  showStoryBadge = true,
  onOpen,
}: SneakerCardProps) {
  const rarity: RarityTier = card.rarity ?? 'unknown'
  const { cardClass, isMetal } = tierClass(rarity)

  return (
    <div
      className="tcg-openable"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen?.()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${card.name} — ouvrir`}
    >
      <CardFront card={card} rarity={rarity} isMetal={isMetal} cardClass={cardClass} />
      {hasStory && showStoryBadge && <span className="tcg-story-badge">★ HISTOIRE</span>}
    </div>
  )
}

export function CardFront({
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
        <SneakerPhoto
          stockxUrl={card.stockx_image_url}
          storagePath={card.photo_url}
          alt={card.name}
          placeholderBg="transparent"
          placeholderColor="#3f3f46"
        />
      </div>

      <div className="tcg-plate">
        <div className="tcg-name">{card.name}</div>
        <div className="tcg-cw">{card.colorway ?? ''}</div>
      </div>
    </div>
  )
}

/** Cellules du bloc « perso », depuis les données existantes de la paire. */
export function buildPerso(card: CollectionCard): Array<{ label: string; value: string }> {
  const rows: Array<{ label: string; value: string }> = []
  // « État » = statut dérivé du wear_count (comme partout dans l'app, cf.
  // SneakerDetail). Le champ brut `condition` est legacy et reste figé à « DS ».
  rows.push({ label: 'État', value: wearStatus(card.wear_count) })
  const size = [
    card.size_eu ? `EU ${card.size_eu}` : null,
    card.size_us ? `US ${card.size_us}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  if (size) rows.push({ label: 'Taille', value: size })
  rows.push({
    label: 'Portées',
    value: card.wear_count > 0 ? `${card.wear_count} fois` : 'Jamais',
  })
  // « Sortie » = année de la date de sortie réelle (release_date). Masquée si
  // absente ou invalide (jamais de date vide, « 1970 » ou « Invalid Date »).
  if (card.release_date) {
    const year = card.release_date.slice(0, 4)
    if (/^\d{4}$/.test(year) && year !== '1970') {
      rows.push({ label: 'Sortie', value: year })
    }
  }
  if (card.rarity_score != null && card.rarity !== 'unknown') {
    rows.push({ label: 'Rareté', value: `Score ${card.rarity_score}` })
  }
  return rows
}

/**
 * Verso agrandi (rendu dans l'overlay). Fond radial sombre + liseré métallique
 * du tier + filigrane code-barres. Avec histoire → tier/étoiles, titre (métal),
 * année, récit (scroll interne). Sans histoire → nom + colorway, pas de texte
 * inventé. Suivi d'un séparateur métallique, du bloc perso (grille 2 colonnes)
 * et du filigrane « SHOOSERIE ». Porte docs/mockups/shooserie_carte_agrandie_v2.html.
 */
export function CardBack({
  card,
  rarity,
  story,
}: {
  card: CollectionCard
  rarity: RarityTier
  story?: { title: string; story: string; year_context: string | null } | null
}) {
  const metal = starColor(rarity)
  const tier = rarity !== 'unknown' ? TIER[rarity] : null
  const tierLabel = tier ? tier.label.toUpperCase() : '—'
  const starStr = tier ? '★'.repeat(tier.stars) : ''
  const perso = buildPerso(card)

  return (
    <div className="tcg-bb" style={{ borderColor: metal }}>
      <div className="tcg-bb-fili" aria-hidden="true" />
      <div className="tcg-bb-tier" style={{ color: metal }}>
        <span className="tcg-bb-tl">{tierLabel}</span>
        <span className="tcg-bb-st">{starStr}</span>
      </div>

      {story ? (
        <>
          <div className="tcg-bb-title" style={{ color: metal }}>
            {story.title}
          </div>
          {story.year_context && <div className="tcg-bb-year">{story.year_context}</div>}
          <div className="tcg-bb-story">{story.story}</div>
        </>
      ) : (
        <>
          <div className="tcg-bb-title tcg-bb-title--plain">{card.name}</div>
          {card.colorway && <div className="tcg-bb-year">{card.colorway}</div>}
          <div className="tcg-bb-spacer" />
        </>
      )}

      <div
        className="tcg-bb-sep"
        style={{ background: `linear-gradient(90deg, transparent, ${metal}, transparent)` }}
      />

      <div className="tcg-bb-perso">
        {perso.map((p) => (
          <div className="tcg-bb-cell" key={p.label}>
            <div className="tcg-bb-k">{p.label}</div>
            <div className="tcg-bb-v">{p.value}</div>
          </div>
        ))}
      </div>

      <div className="tcg-bb-mark">SHOOSERIE</div>
    </div>
  )
}
