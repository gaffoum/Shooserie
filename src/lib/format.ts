import type { Sneaker } from './types'

export function formatEur(value: number | null | undefined, withSign = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.abs(value))
  if (withSign) {
    if (value > 0) return `+${formatted}`
    if (value < 0) return `−${formatted}`
  }
  return value < 0 ? `−${formatted}` : formatted
}

export function formatPct(value: number | null | undefined, withSign = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const rounded = Math.round(value * 10) / 10
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(Math.abs(rounded))
  if (withSign) {
    if (rounded > 0) return `+${formatted} %`
    if (rounded < 0) return `−${formatted} %`
  }
  return `${formatted} %`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export interface Delta {
  eur: number | null
  pct: number | null
}

export function calcDelta(release: number | null, market: number | null): Delta {
  if (release === null || market === null || release === 0) {
    return { eur: null, pct: null }
  }
  return {
    eur: market - release,
    pct: ((market - release) / release) * 100,
  }
}

export interface KpiSummary {
  count: number
  totalRelease: number
  totalMarket: number
  deltaEur: number
  deltaPct: number
}

export function aggregateKpis(sneakers: Sneaker[]): KpiSummary {
  const count = sneakers.length
  const totalRelease = sneakers.reduce((acc, s) => acc + (s.release_price ?? 0), 0)
  // Fallback : si market_price absent, on prend release_price comme proxy
  // (la paire vaut au moins son prix d'origine)
  const totalMarket = sneakers.reduce(
    (acc, s) => acc + (s.market_price ?? s.release_price ?? 0),
    0,
  )
  const deltaEur = totalMarket - totalRelease
  const deltaPct = totalRelease > 0 ? (deltaEur / totalRelease) * 100 : 0
  return { count, totalRelease, totalMarket, deltaEur, deltaPct }
}

/** Liste des marques uniques présentes dans la collection, triées alpha */
export function listBrands(sneakers: Sneaker[]): string[] {
  const set = new Set<string>()
  for (const s of sneakers) {
    if (s.brand) set.add(s.brand)
  }
  return Array.from(set).sort()
}
