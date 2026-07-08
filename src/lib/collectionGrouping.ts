/**
 * Regroupement client-side de la collection en marque → modèle → cartes,
 * pour le mode « Collection » (classeur TCG). AUCUNE requête : on dérive tout
 * depuis les champs déjà chargés (`brand`, `name`, `rarity`, `rarity_score`…).
 *
 * Les heuristiques `deriveModel` sont calibrées contre les vrais noms de la
 * table `sneakers` (StockX). Elles restent volontairement simples : point de
 * départ à affiner, avec un fallback « 2-3 premiers tokens » quand rien ne matche.
 */
import type { Sneaker, RarityTier, SneakerCondition } from './types'

/* ------------------------------------------------------------------ */
/* Marque                                                              */
/* ------------------------------------------------------------------ */

const BRAND_CANON: Record<string, string> = {
  'air jordan': 'Air Jordan',
  jordan: 'Air Jordan',
  nike: 'Nike',
  adidas: 'adidas',
  yeezy: 'adidas',
  'new balance': 'New Balance',
  asics: 'ASICS',
  puma: 'Puma',
  reebok: 'Reebok',
  vans: 'Vans',
  converse: 'Converse',
  saucony: 'Saucony',
  salomon: 'Salomon',
  diadora: 'Diadora',
  mizuno: 'Mizuno',
}

/** Normalise la casse et regroupe les variantes ; vide/null → « Autre ». */
export function normalizeBrand(raw: string | null | undefined): string {
  const k = (raw ?? '').trim().toLowerCase()
  if (!k) return 'Autre'
  if (BRAND_CANON[k]) return BRAND_CANON[k]
  return (raw as string).trim()
}

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Dérive un « modèle » (silhouette) depuis marque normalisée + nom brut. */
export function deriveModel(brand: string, name: string): string {
  const n = (name ?? '').trim()
  if (!n) return 'Autre'
  switch (brand) {
    case 'Air Jordan':
      return modelJordan(n)
    case 'Nike':
      return modelNike(n)
    case 'adidas':
      return modelAdidas(n)
    case 'New Balance':
      return modelNewBalance(n)
    case 'ASICS':
      return modelAsics(n)
    default:
      return fallbackModel(brand, n)
  }
}

function modelJordan(n: string): string {
  const m = n.match(/Jordan\s+(\d+(?:\.\d+)?)/i)
  if (m) return 'Jordan ' + m[1]
  const named = n.match(
    /\b(Jumpman Jack|Spizike|Legacy 312|Point Lane|One Take|MA2|MVP|Delta|CJ1|Zion \d+|Luka \d+|Tatum \d+)\b/i,
  )
  if (named) return named[1].replace(/\b\w/g, (c) => c.toUpperCase())
  return fallbackModel('Air Jordan', n)
}

function modelNike(n: string): string {
  const s = n.replace(/^Nike\s+/i, '')
  const rules: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [/\bSB Dunk (Low|High)\b/i, (m) => 'SB Dunk ' + cap(m[1].toLowerCase())],
    [/\bDunk (Low|High)\b/i, (m) => 'Dunk ' + cap(m[1].toLowerCase())],
    [/\bAir Max (\d+(?:\/\d+)?)\b/i, (m) => 'Air Max ' + m[1]],
    [/\bAir Max (Plus|BW|Zero|Sunder|Waffle)\b/i, (m) => 'Air Max ' + cap(m[1].toLowerCase())],
    [/\bAir Force (1|180|3)\b/i, (m) => 'Air Force ' + m[1]],
    [/\bAir Huarache\b/i, () => 'Air Huarache'],
    [/\bAir Trainer (\d+)\b/i, (m) => 'Air Trainer ' + m[1]],
    [/\bAir Presto\b/i, () => 'Air Presto'],
    [/\bAir Zoom (\w+)\b/i, (m) => 'Air Zoom ' + cap(m[1].toLowerCase())],
    [/\bAir More Uptempo\b/i, () => 'Air More Uptempo'],
    [/\bFoamposite\b/i, () => 'Air Foamposite'],
    [/\bBlazer (Mid|Low|High)\b/i, (m) => 'Blazer ' + cap(m[1].toLowerCase())],
    [/\b(Classic )?Cortez\b/i, () => 'Cortez'],
    [/\bVapor ?Waffle\b/i, () => 'Vaporwaffle'],
    [/\bLD Waffle\b/i, () => 'LD Waffle'],
    [/\bKobe (\d+)\b/i, (m) => 'Kobe ' + m[1]],
    [/\bLeBron\b/i, () => 'LeBron'],
    [/\bKD (\d+)\b/i, (m) => 'KD ' + m[1]],
    [/\bSock Dart\b/i, () => 'Sock Dart'],
    [/\bAir Footscape Woven\b/i, () => 'Air Footscape Woven'],
  ]
  for (const [re, fn] of rules) {
    const m = s.match(re)
    if (m) return fn(m)
  }
  return fallbackModel('Nike', s)
}

function modelAdidas(n: string): string {
  const s = n.replace(/^adidas\s+/i, '')
  let m: RegExpMatchArray | null
  if ((m = s.match(/Yeezy\s+(?:Boost\s+)?(\d{3,4})(\s+V2)?/i)))
    return 'Yeezy ' + m[1] + (m[2] ? ' V2' : '')
  if ((m = s.match(/Yeezy\s+(Slide|Foam\s*RN+R?|Powerphase)/i)))
    return 'Yeezy ' + cap(m[1].replace(/\s+/g, ' '))
  if (/Yeezy/i.test(s)) return 'Yeezy'
  if ((m = s.match(/\bZX\s+([\d,]+)/i))) return 'ZX ' + m[1].replace(/,/g, '')
  if ((m = s.match(/\bNMD\s+(\w+)/i))) return 'NMD ' + cap(m[1].toLowerCase())
  if (/Ultra\s?Boost/i.test(s)) return 'Ultra Boost'
  if ((m = s.match(/\bForum\s+(\d+)/i))) return 'Forum ' + m[1]
  if (/Stan Smith/i.test(s)) return 'Stan Smith'
  if (/Superstar/i.test(s)) return 'Superstar'
  if (/Samba/i.test(s)) return 'Samba'
  if (/Gazelle/i.test(s)) return 'Gazelle'
  if (/Campus/i.test(s)) return 'Campus'
  return fallbackModel('adidas', s)
}

function modelNewBalance(n: string): string {
  const m = n.match(/\b(\d{3,4}[A-Za-z]*\d*)\b/)
  if (m) return m[1].toUpperCase()
  return fallbackModel('New Balance', n)
}

function modelAsics(n: string): string {
  const s = n.replace(/^ASICS\s+/i, '')
  const m = s.match(/Gel-[A-Za-z]+(?:\s+[IVX]+)?/i)
  if (m) return m[0].replace(/\s+/g, ' ')
  return fallbackModel('ASICS', s)
}

const GENERIC_TOKENS = new Set([
  'nike', 'adidas', 'jordan', 'air', 'the', 'retro', 'og', 'sp', 'wmns', 'x', 'new', 'balance',
])

function fallbackModel(brand: string, name: string): string {
  const brandWords = new Set(brand.toLowerCase().split(/\s+/))
  const tokens = name.trim().split(/\s+/).filter(Boolean)
  const out: string[] = []
  for (const t of tokens) {
    if (out.length >= 3) break
    const lower = t.toLowerCase()
    if (brandWords.has(lower)) continue
    if (out.length === 0 && GENERIC_TOKENS.has(lower)) continue
    out.push(t)
  }
  return out.length ? out.join(' ') : name.trim() || 'Autre'
}

/* ------------------------------------------------------------------ */
/* Regroupement                                                        */
/* ------------------------------------------------------------------ */

export interface CollectionCard {
  id: string
  name: string
  colorway: string | null
  rarity: RarityTier
  rarity_score: number | null
  stockx_image_url: string | null
  photo_url: string | null
  /* Données « perso » pour le verso (dos de carte). */
  condition: SneakerCondition | null
  wear_count: number
  size_eu: string | null
  size_us: string | null
  purchase_date: string | null
}

export interface ModelGroup {
  model: string
  cards: CollectionCard[]
}

export interface BrandGroup {
  brand: string
  count: number
  models: ModelGroup[]
}

const RARITY_RANK: Record<RarityTier, number> = {
  unknown: 0,
  commune: 1,
  peu_commune: 2,
  rare: 3,
  ultra_rare: 4,
  grail: 5,
}

function toCard(s: Sneaker): CollectionCard {
  return {
    id: s.id,
    name: s.name,
    colorway: s.colorway,
    rarity: (s.rarity ?? 'unknown') as RarityTier,
    rarity_score: s.rarity_score ?? null,
    stockx_image_url: s.stockx_image_url,
    photo_url: s.photo_url,
    condition: s.condition ?? null,
    wear_count: s.wear_count ?? 0,
    size_eu: s.size_eu,
    size_us: s.size_us,
    purchase_date: s.purchase_date,
  }
}

/**
 * Regroupe une liste de sneakers en `brand → model → cards[]`.
 * - Marques triées par volume décroissant (puis alpha).
 * - Modèles triés par nb de cartes décroissant (puis alpha).
 * - Cartes triées par `rarity_score` desc, puis palier de rareté, puis nom.
 */
export function groupByBrandModel(sneakers: Sneaker[]): BrandGroup[] {
  const byBrand = new Map<string, Map<string, CollectionCard[]>>()

  for (const s of sneakers) {
    const brand = normalizeBrand(s.brand)
    const model = deriveModel(brand, s.name)
    let models = byBrand.get(brand)
    if (!models) {
      models = new Map()
      byBrand.set(brand, models)
    }
    let cards = models.get(model)
    if (!cards) {
      cards = []
      models.set(model, cards)
    }
    cards.push(toCard(s))
  }

  const brands: BrandGroup[] = []
  for (const [brand, models] of byBrand) {
    let count = 0
    const modelGroups: ModelGroup[] = []
    for (const [model, cards] of models) {
      cards.sort(
        (a, b) =>
          (b.rarity_score ?? -1) - (a.rarity_score ?? -1) ||
          RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] ||
          a.name.localeCompare(b.name),
      )
      count += cards.length
      modelGroups.push({ model, cards })
    }
    modelGroups.sort(
      (a, b) => b.cards.length - a.cards.length || a.model.localeCompare(b.model),
    )
    brands.push({ brand, count, models: modelGroups })
  }

  brands.sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand))
  return brands
}
