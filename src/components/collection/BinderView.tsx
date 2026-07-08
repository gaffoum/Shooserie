import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { Sneaker, RarityTier } from '@/lib/types'
import {
  groupByBrandModel,
  type BrandGroup,
  type CollectionCard,
} from '@/lib/collectionGrouping'
import { SneakerPhoto } from '../SneakerPhoto'
import { SneakerCard } from './SneakerCard'
import './BinderView.css'

/**
 * Classeur TCG (mode « Collection »). Reçoit la liste déjà chargée (`sneakers`)
 * — AUCUNE requête — et la regroupe via `groupByBrandModel`. Porte la maquette :
 * onglets marques, tiroir/sidebar modèles, pages à poches avec page-flip
 * (rotateY) + swipe, pagination 9 (mobile) / 12 (desktop), toggle carte/tableau.
 */

const BRAND_COLOR: Record<string, string> = {
  'Air Jordan': '#CE1141',
  Nike: '#E8590C',
  adidas: '#1D428A',
  'New Balance': '#2f9e44',
  ASICS: '#0033A0',
  Puma: '#111111',
  Autre: '#7a5cff',
}
const FALLBACK_TABC = '#7a5cff'
function brandColor(b: string): string {
  return BRAND_COLOR[b] ?? FALLBACK_TABC
}

const RARITY_LABEL: Record<RarityTier, string> = {
  unknown: 'Non classée',
  commune: 'Commune',
  peu_commune: 'Peu commune',
  rare: 'Rare',
  ultra_rare: 'Ultra rare',
  grail: 'Grail',
}
function rarityColor(r: RarityTier): string {
  return r === 'grail'
    ? '#e7c257'
    : r === 'ultra_rare'
      ? '#c2c9d1'
      : r === 'rare'
        ? '#c9824c'
        : r === 'peu_commune'
          ? '#2f9e44'
          : r === 'commune'
            ? '#8a8a8a'
            : '#5a5a5a'
}

const FLIP_MS = 560

function buildPages(cards: CollectionCard[], per: number): Array<Array<CollectionCard | null>> {
  const pages: Array<Array<CollectionCard | null>> = []
  let p: Array<CollectionCard | null> = []
  for (const c of cards) {
    p.push(c)
    if (p.length === per) {
      pages.push(p)
      p = []
    }
  }
  if (p.length) {
    while (p.length < per) p.push(null)
    pages.push(p)
  }
  if (!pages.length) pages.push(new Array(per).fill(null))
  return pages
}

/** Poches par page selon la largeur : 6 (<640, 2×3), 9 (<820, 3×3), 12 (4×3). */
function computePerPage(): number {
  if (typeof window === 'undefined') return 9
  if (window.matchMedia('(min-width:820px)').matches) return 12
  if (window.matchMedia('(min-width:640px)').matches) return 9
  return 6
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function BinderView({ sneakers }: { sneakers: Sneaker[] }) {
  const groups = useMemo(() => groupByBrandModel(sneakers), [sneakers])

  const [curBrand, setCurBrand] = useState<string | null>(null)
  const [curModel, setCurModel] = useState<string | null>(null)
  const [cur, setCur] = useState(0)
  const [mode, setMode] = useState<'card' | 'table'>('card')
  // Verso ouvert (un seul par page) — id de la carte retournée, sinon null.
  const [flippedId, setFlippedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [perPage, setPerPage] = useState<number>(computePerPage)

  // Résolution robuste : si la sélection n'existe plus (données arrivées après
  // coup, marque vidée…), on retombe sur le premier élément disponible.
  const activeBrand: BrandGroup | undefined =
    groups.find((b) => b.brand === curBrand) ?? groups[0]
  const activeModel =
    activeBrand?.models.find((m) => m.model === curModel) ?? activeBrand?.models[0]

  const pages = useMemo(
    () => buildPages(activeModel?.cards ?? [], perPage),
    [activeModel, perPage],
  )

  const pageRefs = useRef<Array<HTMLDivElement | null>>([])
  const animatingRef = useRef(false)
  const swipeX = useRef<number | null>(null)

  // Pagination responsive (6 mobile 2×3 / 9 tablette 3×3 / 12 desktop 4×3) —
  // synchronisée avec les colonnes de la grille CSS (mêmes breakpoints 640/820).
  useEffect(() => {
    const q640 = window.matchMedia('(min-width:640px)')
    const q820 = window.matchMedia('(min-width:820px)')
    const onChange = () => setPerPage(computePerPage())
    q640.addEventListener('change', onChange)
    q820.addEventListener('change', onChange)
    return () => {
      q640.removeEventListener('change', onChange)
      q820.removeEventListener('change', onChange)
    }
  }, [])

  // Clamp la page courante quand le nombre de pages diminue (changement de
  // modèle, de pagination…).
  useEffect(() => {
    if (cur > pages.length - 1) setCur(0)
  }, [pages.length, cur])

  const layout = useCallback(() => {
    pageRefs.current.forEach((el, i) => {
      if (!el) return
      el.style.transition = 'none'
      el.style.transform = 'rotateY(0deg)'
      el.style.zIndex = i === cur ? '3' : '1'
      el.style.visibility = Math.abs(i - cur) <= 1 ? 'visible' : 'hidden'
      const fs = el.querySelector<HTMLElement>('.binder-fs')
      if (fs) fs.style.opacity = '0'
    })
  }, [cur])

  useLayoutEffect(() => {
    if (mode === 'card') layout()
  }, [layout, mode, pages])

  const go = useCallback(
    (dir: number) => {
      if (animatingRef.current) return
      const target = cur + dir
      if (target < 0 || target >= pages.length) return

      // Changer de page referme tout verso ouvert.
      setFlippedId(null)

      const els = pageRefs.current
      // Réduction du mouvement : bascule instantanée, sans rotation.
      if (prefersReducedMotion()) {
        setCur(target)
        return
      }
      animatingRef.current = true

      if (dir > 0) {
        const turning = els[cur]
        const beneath = els[target]
        if (!turning || !beneath) {
          animatingRef.current = false
          setCur(target)
          return
        }
        beneath.style.visibility = 'visible'
        beneath.style.zIndex = '1'
        beneath.style.transform = 'rotateY(0deg)'
        turning.style.zIndex = '4'
        void turning.getBoundingClientRect()
        turning.style.transition = 'transform .55s ease-in'
        const fs = turning.querySelector<HTMLElement>('.binder-fs')
        if (fs) {
          fs.style.transition = 'opacity .4s'
          fs.style.opacity = '1'
        }
        turning.style.transform = 'rotateY(-172deg)'
      } else {
        const incoming = els[target]
        if (!incoming) {
          animatingRef.current = false
          setCur(target)
          return
        }
        incoming.style.visibility = 'visible'
        incoming.style.zIndex = '4'
        incoming.style.transition = 'none'
        incoming.style.transform = 'rotateY(-172deg)'
        const fsIn = incoming.querySelector<HTMLElement>('.binder-fs')
        if (fsIn) fsIn.style.opacity = '1'
        void incoming.getBoundingClientRect()
        incoming.style.transition = 'transform .55s ease-out'
        incoming.style.transform = 'rotateY(0deg)'
        if (fsIn) {
          fsIn.style.transition = 'opacity .4s'
          fsIn.style.opacity = '0'
        }
      }

      window.setTimeout(() => {
        animatingRef.current = false
        setCur(target)
      }, FLIP_MS)
    },
    [cur, pages.length],
  )

  const selectBrand = (brand: string) => {
    const g = groups.find((b) => b.brand === brand)
    setFlippedId(null)
    setCurBrand(brand)
    setCurModel(g?.models[0]?.model ?? null)
    setCur(0)
  }
  const selectModel = (model: string) => {
    setFlippedId(null)
    setCurModel(model)
    setCur(0)
    setDrawerOpen(false)
  }

  if (!groups.length || !activeBrand || !activeModel) {
    return (
      <div className="binder">
        <div className="binder-empty">Aucune paire à afficher dans le classeur.</div>
      </div>
    )
  }

  const tabc = brandColor(activeBrand.brand)

  const modelsList = (onPick: (m: string) => void) => (
    <div className="binder-models">
      {activeBrand.models.map((m) => (
        <div
          key={m.model}
          className={`binder-mrow${m.model === activeModel.model ? ' active' : ''}`}
          onClick={() => onPick(m.model)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onPick(m.model)
          }}
        >
          <span className="binder-mn">{m.model}</span>
          <span className="binder-mc">{m.cards.length}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="binder" style={{ ['--tabc' as string]: tabc }}>
      {/* Onglets marques */}
      <div className="binder-tabs" role="tablist">
        {groups.map((b) => {
          const c = brandColor(b.brand)
          const active = b.brand === activeBrand.brand
          return (
            <button
              key={b.brand}
              type="button"
              role="tab"
              aria-selected={active}
              className={`binder-tab${active ? ' active' : ''}`}
              style={{ ['--tabc' as string]: c }}
              onClick={() => selectBrand(b.brand)}
            >
              <span className="binder-dot" style={{ background: c }} />
              {b.brand}
            </button>
          )
        })}
      </div>
      <div className="binder-tabline" />

      <div className="binder-body">
        {/* Sidebar modèles (desktop) */}
        <aside className="binder-sidebar">
          <h3 className="binder-models-title">
            Modèles · <span className="binder-brandname">{activeBrand.brand}</span>
          </h3>
          {modelsList(selectModel)}
        </aside>

        <div className="binder-main">
          {/* Barre contexte */}
          <div className="binder-ctx">
            <button
              type="button"
              className="binder-burger"
              aria-label="Modèles"
              onClick={() => setDrawerOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <span className="binder-cm">{activeModel.model}</span>
            <span className="binder-cc">
              {mode === 'card'
                ? `Page ${Math.min(cur + 1, pages.length)}/${pages.length}`
                : `${activeModel.cards.length} carte${activeModel.cards.length > 1 ? 's' : ''}`}
            </span>
            <div className="binder-viewtoggle" role="group" aria-label="Vue">
              <button
                type="button"
                className={mode === 'card' ? 'active' : ''}
                onClick={() => setMode('card')}
              >
                Cartes
              </button>
              <button
                type="button"
                className={mode === 'table' ? 'active' : ''}
                onClick={() => setMode('table')}
              >
                Tableau
              </button>
            </div>
          </div>

          {mode === 'card' ? (
            <>
              <div
                className="binder-stage"
                onTouchStart={(e) => {
                  swipeX.current = e.touches[0].clientX
                }}
                onTouchEnd={(e) => {
                  if (swipeX.current === null) return
                  const dx = e.changedTouches[0].clientX - swipeX.current
                  swipeX.current = null
                  if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1)
                }}
              >
                <div className="binder-book">
                  {pages.map((pg, i) => (
                    <div
                      key={i}
                      className="binder-page"
                      ref={(el) => {
                        pageRefs.current[i] = el
                      }}
                    >
                      <div className="binder-fs" />
                      <div className="binder-grid">
                        {pg.map((c, j) =>
                          c ? (
                            <div className="binder-pocket" key={c.id}>
                              <SneakerCard
                                card={c}
                                flipped={flippedId === c.id}
                                onToggle={() =>
                                  setFlippedId((prev) => (prev === c.id ? null : c.id))
                                }
                              />
                            </div>
                          ) : (
                            <div className="binder-pocket empty" key={`e${j}`} />
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="binder-nav">
                <button type="button" onClick={() => go(-1)} disabled={cur === 0} aria-label="Page précédente">
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  disabled={cur >= pages.length - 1}
                  aria-label="Page suivante"
                >
                  ›
                </button>
              </div>
            </>
          ) : (
            <div className="binder-tablewrap">
              <table className="binder-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }} />
                    <th>Nom</th>
                    <th>Rareté</th>
                    <th>Colorway</th>
                  </tr>
                </thead>
                <tbody>
                  {activeModel.cards.map((c) => {
                    const r = c.rarity ?? 'unknown'
                    return (
                      <tr key={c.id}>
                        <td>
                          <div className="binder-mini">
                            <SneakerPhoto
                              stockxUrl={c.stockx_image_url}
                              storagePath={c.photo_url}
                              alt={c.name}
                            />
                          </div>
                        </td>
                        <td className="binder-tname">{c.name}</td>
                        <td>
                          <span className="binder-rarity">
                            <span
                              className="binder-rarity-dot"
                              style={{ background: rarityColor(r) }}
                            />
                            {RARITY_LABEL[r]}
                          </span>
                        </td>
                        <td className="binder-tcw">{c.colorway ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Drawer modèles (mobile) */}
      <div
        className={`binder-scrim${drawerOpen ? ' open' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside className={`binder-drawer${drawerOpen ? ' open' : ''}`}>
        <h3 className="binder-models-title">
          Modèles · <span className="binder-brandname">{activeBrand.brand}</span>
        </h3>
        {modelsList(selectModel)}
      </aside>
    </div>
  )
}
