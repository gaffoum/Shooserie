/**
 * Couleurs accent par marque, utilisees pour la bande verticale a gauche
 * du sticker. Permet d'identifier visuellement la marque d'un coup d'oeil
 * quand les boites sont stackees sur l'etagere.
 */

const BRAND_COLOR_MAP: Record<string, string> = {
  'NIKE':          '#FA5400',
  'AIR JORDAN':    '#CE1141',
  'JORDAN':        '#CE1141',
  'ADIDAS':        '#000000',
  'YEEZY':         '#A0826D',
  'NEW BALANCE':   '#666666',
  'ASICS':         '#0066CC',
  'OFF-WHITE':     '#FFA500',
  'CONVERSE':      '#1A1A1A',
  'VANS':          '#C8102E',
  'REEBOK':        '#E60028',
  'PUMA':          '#181818',
  'SAUCONY':       '#FFD700',
  'MIZUNO':        '#0067B1',
  'SALOMON':       '#00A4E0',
  'ON':            '#0E0E0E',
  'HOKA':          '#3FA9F5',
  'BALENCIAGA':    '#000000',
  'GOLDEN GOOSE':  '#C9A227',
  'COMMON PROJECTS': '#F5F5DC',
  'MAISON MARGIELA': '#FFFFFF',
}

/** Retourne la couleur de la marque, ou gris si inconnue. */
export function brandColor(brand: string | null | undefined): string {
  if (!brand) return '#9CA3AF'
  const normalized = brand.trim().toUpperCase()
  return BRAND_COLOR_MAP[normalized] ?? '#9CA3AF'
}