/**
 * Tests rapides pour collectionGrouping — exécutables via `npx tsx
 * src/lib/collectionGrouping.test.ts`. Pas de framework : assertions maison +
 * un dump du regroupement sur un échantillon de VRAIS noms de la table.
 */
import { normalizeBrand, deriveModel, groupByBrandModel } from './collectionGrouping'
import type { Sneaker } from './types'

let failures = 0
function eq(actual: unknown, expected: unknown, label: string) {
  const ok = actual === expected
  if (!ok) {
    failures++
    console.error(`✗ ${label}\n    attendu: ${JSON.stringify(expected)}\n    obtenu : ${JSON.stringify(actual)}`)
  } else {
    console.log(`✓ ${label}`)
  }
}

/* --- normalizeBrand --- */
eq(normalizeBrand('Adidas'), 'adidas', 'normalizeBrand Adidas → adidas')
eq(normalizeBrand('  air jordan '), 'Air Jordan', 'normalizeBrand casse/espaces')
eq(normalizeBrand(null), 'Autre', 'normalizeBrand null → Autre')
eq(normalizeBrand(''), 'Autre', 'normalizeBrand vide → Autre')
eq(normalizeBrand('KangaROOS'), 'KangaROOS', 'normalizeBrand inconnu préservé')

/* --- deriveModel : cas réels --- */
const AJ = 'Air Jordan'
eq(deriveModel(AJ, 'Jordan 1 Retro High OG Chicago Lost and Found'), 'Jordan 1', 'AJ Jordan 1')
eq(deriveModel(AJ, 'Air jordan 4 retro bred 2019'), 'Jordan 4', 'AJ casse basse + Air prefix')
eq(deriveModel(AJ, 'Jordan 11 Retro 72-10'), 'Jordan 11', 'AJ Jordan 11')
eq(deriveModel(AJ, 'Jumpman jack dark mocha'), 'Jumpman Jack', 'AJ Jumpman Jack')

eq(deriveModel('Nike', 'Nike Air Max 1 atmos Elephant (2017)'), 'Air Max 1', 'Nike Air Max 1')
eq(deriveModel('Nike', 'Nike Air Max 1/97 Sean Wotherspoon (Extra Lace Set Only)'), 'Air Max 1/97', 'Nike Air Max 1/97')
eq(deriveModel('Nike', 'Nike SB Dunk Low Travis Scott'), 'SB Dunk Low', 'Nike SB Dunk Low')
eq(deriveModel('Nike', 'Nike Dunk High Retro Chlorophyll'), 'Dunk High', 'Nike Dunk High')
eq(deriveModel('Nike', "Nike Air Force 1 Low '07 Premium Popcorn"), 'Air Force 1', 'Nike Air Force 1')
eq(deriveModel('Nike', 'Nike Air Huarache Aquatone'), 'Air Huarache', 'Nike Air Huarache')

eq(deriveModel('adidas', 'adidas Yeezy Boost 350 V2 Beluga'), 'Yeezy 350 V2', 'adidas Yeezy 350 V2')
eq(deriveModel('adidas', 'adidas Yeezy Boost 750 Triple Black'), 'Yeezy 750', 'adidas Yeezy 750')
eq(deriveModel('adidas', 'adidas Yeezy Slide Azure'), 'Yeezy Slide', 'adidas Yeezy Slide')
eq(deriveModel('adidas', 'adidas ZX 8000 OG Aqua'), 'ZX 8000', 'adidas ZX 8000')
eq(deriveModel('adidas', 'adidas NMD Hu Pharrell Black'), 'NMD Hu', 'adidas NMD Hu')

eq(deriveModel('New Balance', 'New Balance 1906R Aime Leon Dore Jade'), '1906R', 'NB 1906R')
eq(deriveModel('New Balance', 'New Balance 2002R Protection Pack Pink'), '2002R', 'NB 2002R')
eq(deriveModel('New Balance', 'New Balance 992 Grey'), '992', 'NB 992')
eq(deriveModel('New Balance', 'New Balance 990v2 MiUSA Brown Purple'), '990V2', 'NB 990V2')

eq(deriveModel('ASICS', 'ASICS Gel-Lyte III atmos Duck Camo'), 'Gel-Lyte III', 'ASICS Gel-Lyte III')
eq(deriveModel('ASICS', 'ASICS Gel-NYC Cream Cloud Grey'), 'Gel-NYC', 'ASICS Gel-NYC')

/* --- groupByBrandModel : dump sur échantillon réel --- */
const REAL: Array<[string | null, string]> = [
  ['Air Jordan', 'Jordan 1 Retro High OG Chicago Lost and Found'],
  ['Air Jordan', 'Jordan 1 Low Travis Scott Mocha'],
  ['Air Jordan', 'Jordan 4 Retro Bred (2019)'],
  ['Air Jordan', 'Jordan 11 Retro 72-10'],
  ['Air Jordan', 'Jumpman jack dark mocha'],
  ['Nike', 'Nike Air Max 1 atmos Elephant (2017)'],
  ['Nike', 'Nike Air Force 1 Low Travis Scott Cactus Jack'],
  ['Nike', 'Nike SB Dunk Low Travis Scott'],
  ['Nike', 'Nike Dunk Low Retro White Black Panda'],
  ['Adidas', 'adidas Yeezy Boost 350 V2 Zebra'],
  ['Adidas', 'adidas Yeezy Boost 750 Triple Black'],
  ['Adidas', 'adidas ZX 8000 OG Aqua'],
  ['New Balance', 'New Balance 2002R Protection Pack Pink'],
  ['New Balance', 'New Balance 992 Grey'],
  ['ASICS', 'ASICS Gel-Lyte III atmos Duck Camo'],
  [null, 'Vans Old Skool Triple Black'],
]
const sneakers = REAL.map((r, i) => ({
  id: 'id' + i,
  name: r[1],
  brand: r[0],
  colorway: null,
  rarity: 'unknown',
  rarity_score: null,
  stockx_image_url: null,
  photo_url: null,
}) as unknown as Sneaker)

console.log('\n=== Regroupement (échantillon réel) ===')
for (const b of groupByBrandModel(sneakers)) {
  console.log(`${b.brand} (${b.count})`)
  for (const m of b.models) console.log(`   • ${m.model} [${m.cards.length}]`)
}

console.log(failures === 0 ? '\n✅ Tous les tests passent' : `\n❌ ${failures} échec(s)`)
if (failures > 0) process.exit(1)
