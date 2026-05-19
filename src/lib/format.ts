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

/** Liste des tags uniques présents dans la collection, triés alpha */
export function listTags(sneakers: Sneaker[]): string[] {
  const set = new Set<string>()
  for (const s of sneakers) {
    for (const t of s.tags) set.add(t)
  }
  return Array.from(set).sort()
}

export interface TimePoint {
  date: string
  value: number
}

/**
 * Build a per-sneaker timeline from its price_history. Sorted ascending.
 * Returns empty if there are no entries.
 */
export function sneakerTimeline(s: Sneaker): TimePoint[] {
  return [...(s.price_history ?? [])]
    .filter((p) => Number.isFinite(p.price))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({ date: p.date, value: p.price }))
}

/**
 * Build the aggregate portfolio value timeline across all sneakers.
 *
 * Approach: walk all price_history events chronologically. After each event,
 * the contributing sneaker's "current cote" is updated. The portfolio total
 * at that moment = sum of every sneaker's known cote (or release_price as a
 * baseline if no event has been seen yet for that sneaker). Sneakers with
 * no history at all still anchor a single point at "now" with their current
 * market_price (or release_price as fallback).
 */
export function portfolioTimeline(sneakers: Sneaker[]): TimePoint[] {
  // Baseline per-sneaker value before any event: release_price, or 0.
  const baseline = new Map<string, number>()
  for (const s of sneakers) {
    baseline.set(s.id, s.release_price ?? 0)
  }

  // Collect events.
  type Event = { date: string; sneakerId: string; price: number }
  const events: Event[] = []
  for (const s of sneakers) {
    for (const p of s.price_history ?? []) {
      if (!Number.isFinite(p.price)) continue
      events.push({ date: p.date, sneakerId: s.id, price: p.price })
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date))

  // No events: single flat point at "now" with current totals.
  if (events.length === 0) {
    const total = sneakers.reduce(
      (acc, s) => acc + (s.market_price ?? s.release_price ?? 0),
      0,
    )
    return [{ date: new Date().toISOString(), value: total }]
  }

  // Walk events, recomputing total after each one.
  const latest = new Map<string, number>(baseline)
  const points: TimePoint[] = []
  for (const e of events) {
    latest.set(e.sneakerId, e.price)
    const total = sneakers.reduce(
      (acc, s) => acc + (latest.get(s.id) ?? 0),
      0,
    )
    points.push({ date: e.date, value: Math.round(total) })
  }
  return points
}
