import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react'
import { useRefreshMarketPrice } from '@/lib/queries'
import { useT } from '@/i18n/I18nContext'
import type { Sneaker } from '@/lib/types'

interface RefreshCoteButtonProps {
  sneaker: Sneaker
  /**
   * Visual size. `card` = small inline button (used inside SneakerCard's price
   * row). `table` = compact icon-only button for the dense table view.
   */
  variant?: 'card' | 'table'
}

/**
 * Individual "refresh this sneaker's market value" button. Wraps the existing
 * `useRefreshMarketPrice` mutation but creates a NEW instance per button —
 * which gives each card/row its own `isPending` state, so multiple cards can
 * spin in parallel without bleeding state into each other.
 *
 * Disabled when the sneaker can't be refreshed:
 *  - no `stockx_product_id` (not linked to the catalog)
 *  - no `stockx_variant_id` AND no `size_us` (we don't know which size to fetch)
 * In both cases, the title attribute explains why.
 *
 * Click handling stops event propagation so the parent `<Link>` (in
 * SneakerCard) isn't triggered — clicking the refresh button must not
 * navigate to the detail page.
 */
export function RefreshCoteButton({ sneaker, variant = 'card' }: RefreshCoteButtonProps) {
  const { t } = useT()
  const mutation = useRefreshMarketPrice()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Reasons the button is disabled — we use these for the tooltip too.
  const notLinked = !sneaker.stockx_product_id
  const noSize = !sneaker.stockx_variant_id && !sneaker.size_us
  const disabled = notLinked || noSize || mutation.isPending

  // Tooltip explains *why* the button is disabled.
  const title = notLinked
    ? t('card.refresh.notLinked')
    : noSize
      ? t('card.refresh.noSize')
      : errorMsg
        ? t('card.refresh.error', { msg: errorMsg })
        : t('card.refresh.aria')

  // Clear the error after 3s so the user sees default state again.
  useEffect(() => {
    if (!errorMsg) return
    const id = window.setTimeout(() => setErrorMsg(null), 3000)
    return () => window.clearTimeout(id)
  }, [errorMsg])

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Stop the click from bubbling up to the parent <Link>.
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return
    setErrorMsg(null)
    mutation.mutate(sneaker, {
      onError: (err) => setErrorMsg((err as Error).message),
    })
  }

  const isError = !!errorMsg

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={t('card.refresh.aria')}
      style={{
        ...(variant === 'table' ? tableBtnStyle : cardBtnStyle),
        opacity: disabled && !mutation.isPending ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: isError ? 'var(--color-bred)' : undefined,
      }}
    >
      <RefreshIcon spinning={mutation.isPending} />
    </button>
  )
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        display: 'block',
        animation: spinning ? 'shooserie-spin 0.9s linear infinite' : 'none',
        transformOrigin: 'center',
      }}
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-3.4-7" />
      <polyline points="21 4 21 9 16 9" />
    </svg>
  )
}

const baseBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--color-text-muted)',
  padding: 0,
  flexShrink: 0,
  transition: 'border-color var(--transition-fast), color var(--transition-fast)',
}

const cardBtnStyle: CSSProperties = {
  ...baseBtnStyle,
  width: 26,
  height: 26,
}

const tableBtnStyle: CSSProperties = {
  ...baseBtnStyle,
  width: 24,
  height: 24,
}
