import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  searchStockX,
  getStockXProduct,
  type StockXSearchHit,
  type StockXProduct,
} from '@/lib/stockx'

interface StockXSearchProps {
  /**
   * Called when the user picks a result. Receives the full product detail
   * (with image and variants) so the parent can pre-fill the form.
   */
  onPick: (product: StockXProduct) => void
}

/**
 * Search bar that queries the StockX catalog and shows a dropdown of matches.
 * On click, fetches full product detail and hands it to the parent.
 *
 * Sits at the top of the Add/Edit form. Users can ignore it and fill the
 * form manually.
 */
export function StockXSearch({ onPick }: StockXSearchProps) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<StockXSearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Debounced search — 300ms after last keystroke.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setHits([])
      setError(null)
      return
    }

    let cancelled = false
    const id = window.setTimeout(async () => {
      setSearching(true)
      setError(null)
      try {
        const results = await searchStockX(q)
        if (!cancelled) {
          setHits(results)
          setOpen(true)
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [query])

  // Close dropdown when clicking outside.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handlePick = async (hit: StockXSearchHit) => {
    setFetching(true)
    setError(null)
    try {
      const product = await getStockXProduct(hit.productId)
      onPick(product)
      setQuery('')
      setHits([])
      setOpen(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setFetching(false)
    }
  }

  return (
    <div style={wrapStyle} ref={wrapRef}>
      <div style={inputWrapStyle}>
        <span style={iconStyle} aria-hidden>🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => hits.length > 0 && setOpen(true)}
          placeholder="Chercher un modèle (ex: Jordan 1 Chicago)…"
          style={inputStyle}
          autoComplete="off"
          disabled={fetching}
        />
        {searching && <span style={spinnerStyle}>…</span>}
      </div>

      {open && (hits.length > 0 || error) && (
        <div style={dropdownStyle}>
          {error && <div style={errorRowStyle}>{error}</div>}
          {hits.map((hit) => (
            <button
              type="button"
              key={hit.productId}
              onClick={() => handlePick(hit)}
              disabled={fetching}
              style={rowStyle}
            >
              <div style={rowTitleStyle}>{hit.title}</div>
              <div style={rowMetaStyle}>
                {hit.brand && <span>{hit.brand}</span>}
                {hit.styleId && (
                  <span style={skuChipStyle}>{hit.styleId}</span>
                )}
                {hit.colorway && (
                  <span style={{ opacity: 0.7 }}>{hit.colorway}</span>
                )}
              </div>
            </button>
          ))}
          {fetching && <div style={fetchingRowStyle}>Récupération du détail…</div>}
        </div>
      )}
    </div>
  )
}

/* =====================================================
 * Styles — match the form's design language (Jordan OG).
 * ===================================================== */

const wrapStyle: CSSProperties = {
  position: 'relative',
  marginBottom: 14,
}
const inputWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
}
const iconStyle: CSSProperties = {
  position: 'absolute',
  left: 12,
  fontSize: 14,
  opacity: 0.7,
  pointerEvents: 'none',
}
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px 10px 36px',
  fontSize: 14,
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  outline: 'none',
  fontFamily: 'inherit',
}
const spinnerStyle: CSSProperties = {
  position: 'absolute',
  right: 14,
  color: 'var(--color-text-muted)',
  fontSize: 16,
}
const dropdownStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: 4,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
  maxHeight: 320,
  overflowY: 'auto',
  zIndex: 50,
}
const rowStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--color-border)',
  textAlign: 'left',
  cursor: 'pointer',
  color: 'var(--color-text)',
  fontFamily: 'inherit',
  display: 'block',
}
const rowTitleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 4,
  lineHeight: 1.3,
}
const rowMetaStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  flexWrap: 'wrap',
}
const skuChipStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: 10,
  background: 'var(--color-bg)',
  padding: '2px 6px',
  borderRadius: 4,
  fontVariantNumeric: 'tabular-nums',
}
const errorRowStyle: CSSProperties = {
  padding: '10px 12px',
  fontSize: 12,
  color: 'var(--color-bred)',
}
const fetchingRowStyle: CSSProperties = {
  padding: '10px 12px',
  fontSize: 12,
  color: 'var(--color-text-muted)',
  fontStyle: 'italic',
}
