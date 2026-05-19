/**
 * Sparkline filigrane statique (placeholder Phase 2).
 * Phase 3 : sera alimentée par price_history réel + données StockX.
 * Segments verts (montée) / rouges (descente) selon convention bourse.
 */
export function Sparkline() {
  return (
    <svg
      viewBox="0 0 150 50"
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-hidden
    >
      <line x1="0" y1="42" x2="15" y2="40" stroke="var(--color-up)" strokeWidth="1.8" />
      <line x1="15" y1="40" x2="30" y2="45" stroke="var(--color-down)" strokeWidth="1.8" />
      <line x1="30" y1="45" x2="45" y2="32" stroke="var(--color-up)" strokeWidth="1.8" />
      <line x1="45" y1="32" x2="60" y2="36" stroke="var(--color-down)" strokeWidth="1.8" />
      <line x1="60" y1="36" x2="75" y2="25" stroke="var(--color-up)" strokeWidth="1.8" />
      <line x1="75" y1="25" x2="90" y2="22" stroke="var(--color-up)" strokeWidth="1.8" />
      <line x1="90" y1="22" x2="105" y2="18" stroke="var(--color-up)" strokeWidth="1.8" />
      <line x1="105" y1="18" x2="120" y2="26" stroke="var(--color-down)" strokeWidth="1.8" />
      <line x1="120" y1="26" x2="135" y2="12" stroke="var(--color-up)" strokeWidth="1.8" />
      <line x1="135" y1="12" x2="150" y2="8" stroke="var(--color-up)" strokeWidth="1.8" />
    </svg>
  )
}
