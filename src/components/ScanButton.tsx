import { lazy, Suspense, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '@/i18n/I18nContext'
import type { ScanResult } from './BarcodeScanner'

// Lazy-load le scanner pour ne pas plomber le first-load
// (la lib html5-qrcode pèse ~50KB gzippé)
const BarcodeScanner = lazy(() => import('./BarcodeScanner'))

interface ScanButtonProps {
  onScan: (result: ScanResult) => void
  /** Apparence du bouton */
  variant?: 'primary' | 'secondary' | 'compact'
  /** Texte custom (défaut : "Scanner") */
  children?: ReactNode
  disabled?: boolean
}

export function ScanButton({
  onScan,
  variant = 'secondary',
  children,
  disabled,
}: ScanButtonProps) {
  const { t } = useT()
  const [open, setOpen] = useState(false)

  const handleScan = (result: ScanResult) => {
    setOpen(false)
    onScan(result)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        style={getButtonStyle(variant, disabled)}
        aria-label={t('scan.openAria')}
      >
        <ScanIcon variant={variant} />
        {children ?? (variant === 'compact' ? null : t('common.scanner'))}
      </button>

      {/* Portal vers <body> : le scanner doit échapper aux ancêtres en
        * `position: sticky` / `backdrop-filter` / `transform` qui cassent
        * `position: fixed` des descendants (iOS Safari notamment). */}
      {open &&
        createPortal(
          <Suspense fallback={null}>
            <BarcodeScanner
              open={open}
              onClose={() => setOpen(false)}
              onScan={handleScan}
            />
          </Suspense>,
          document.body,
        )}
    </>
  )
}

function ScanIcon({ variant }: { variant: ScanButtonProps['variant'] }) {
  const size = variant === 'compact' ? 16 : 14
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  )
}

function getButtonStyle(
  variant: ScanButtonProps['variant'],
  disabled: boolean | undefined,
): CSSProperties {
  const base: CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    letterSpacing: 'var(--tracking-wide)',
    textTransform: 'uppercase',
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    textDecoration: 'none',
    transition: 'background var(--transition-fast)',
  }
  switch (variant) {
    case 'primary':
      return {
        ...base,
        padding: '10px 18px',
        fontSize: 11,
        background: 'var(--color-bred)',
        color: '#FFFFFF',
        border: 'none',
      }
    case 'compact':
      return {
        ...base,
        padding: '0 12px',
        height: 38,
        fontSize: 11,
        background: 'var(--color-bg)',
        color: 'var(--color-text-muted)',
        border: '1px solid var(--color-border)',
        flexShrink: 0,
      }
    case 'secondary':
    default:
      // Bouton à contour clair, posé sur une carte `--color-surface` (état vide
      // du Dashboard). En sombre, un fond `--color-surface` se fondait dans la
      // carte : on prend `--color-surface-alt` + `--color-border-strong` pour
      // détacher le bouton dans les deux thèmes tout en restant secondaire.
      return {
        ...base,
        padding: '8px 14px',
        fontSize: 11,
        background: 'var(--color-surface-alt)',
        color: 'var(--color-text)',
        border: '1px solid var(--color-border-strong)',
      }
  }
}
