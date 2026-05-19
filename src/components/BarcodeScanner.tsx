import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { lookupBarcode, type LookupSuggestion, type BarcodeLookupResult } from '@/lib/queries'
import { useT } from '@/i18n/I18nContext'
import type { DictKey } from '@/i18n/dictionaries'

export interface ScanResult {
  code: string
  format: string
  /** Données enrichies — depuis StockX (prioritaire) ou UPCitemdb */
  suggestion?: LookupSuggestion | null
  source?: 'stockx' | 'upcitemdb' | null
  /** Présent quand source === 'stockx' : permet de lier directement au catalogue */
  stockxLink?: BarcodeLookupResult['stockxLink']
}

interface BarcodeScannerProps {
  open: boolean
  onClose: () => void
  onScan: (result: ScanResult) => void
}

type Phase = 'starting' | 'scanning' | 'looking-up' | 'error' | 'manual'

const READER_ID = 'shooserie-qr-reader'

/**
 * Modal plein écran de scan code-barre.
 * Supporte EAN-13/8, UPC-A/E, Code128, Code39, QR.
 * Fallback "saisie manuelle" si caméra refusée/indispo.
 */
export default function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const { t } = useT()
  const [phase, setPhase] = useState<Phase>('starting')
  const [errorKey, setErrorKey] = useState<DictKey | null>(null)
  const [lastDetected, setLastDetected] = useState<string>('')
  const [manualCode, setManualCode] = useState<string>('')
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const mountedRef = useRef(false)

  // Lifecycle scanner
  useEffect(() => {
    if (!open) return

    mountedRef.current = true
    setPhase('starting')
    setErrorKey(null)
    setLastDetected('')

    const start = async () => {
      try {
        // Petite tempo pour laisser le DOM monter le div #reader
        await new Promise((r) => setTimeout(r, 50))
        if (!mountedRef.current) return

        const scanner = new Html5Qrcode(READER_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        })
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (vw, vh) => {
              const minEdge = Math.min(vw, vh)
              const size = Math.max(180, Math.min(320, Math.floor(minEdge * 0.75)))
              return { width: size, height: Math.floor(size * 0.55) }
            },
            aspectRatio: 1.0,
          },
          (decodedText, decodedResult) => {
            const format = decodedResult.result.format?.formatName ?? 'unknown'
            setLastDetected(decodedText)
            // Stop, lookup, puis callback
            stop()
              .then(async () => {
                if (!mountedRef.current) return
                setPhase('looking-up')
                const lookup = await lookupBarcode(decodedText)
                if (!mountedRef.current) return
                onScan({
                  code: decodedText,
                  format,
                  suggestion: lookup.suggestion,
                  source: lookup.source,
                  stockxLink: lookup.stockxLink,
                })
              })
          },
          () => {
            // erreurs de scan en continu ignorées (normal)
          },
        )

        if (mountedRef.current) setPhase('scanning')
      } catch (err) {
        if (!mountedRef.current) return
        const e = err as Error & { name?: string }
        setPhase('error')
        if (e.name === 'NotAllowedError' || /permission|denied/i.test(e.message)) {
          setErrorKey('scan.permissionDenied')
        } else {
          // No camera, generic error, etc. — same fallback message.
          setErrorKey('scan.cameraUnavailable')
        }
      }
    }

    start()

    return () => {
      mountedRef.current = false
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const stop = async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
      scanner.clear()
    } catch {
      // ignore
    }
  }

  const handleClose = async () => {
    await stop()
    onClose()
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = manualCode.trim()
    if (!code) return
    setPhase('looking-up')
    const lookup = await lookupBarcode(code)
    if (!mountedRef.current) return
    onScan({
      code,
      format: 'manual',
      suggestion: lookup.suggestion,
      source: lookup.source,
      stockxLink: lookup.stockxLink,
    })
  }

  if (!open) return null

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={t('scan.openAria')}>
      {/* Bouton fermer */}
      <button onClick={handleClose} aria-label={t('scan.closeAria')} style={closeBtnStyle}>
        <CloseIcon />
      </button>

      {/* Vue principale */}
      {phase !== 'manual' && (
        <>
          <div id={READER_ID} style={readerStyle} />

          {/* Overlay UI */}
          <div style={overlayUiStyle}>
            <h2 style={titleStyle}>
              {phase === 'starting' && t('scan.starting')}
              {phase === 'scanning' && t('scan.scanning')}
              {phase === 'looking-up' && t('scan.lookingUp')}
              {phase === 'error' && t('scan.error')}
            </h2>
            {phase === 'scanning' && (
              <p style={hintStyle}>{t('scan.hint')}</p>
            )}
            {(phase === 'scanning' || phase === 'looking-up') && lastDetected && (
              <p style={detectedStyle}>{t('scan.detected', { code: lastDetected })}</p>
            )}
          </div>

          {phase === 'looking-up' && (
            <div style={lookupOverlayStyle}>
              <div style={spinnerStyle} aria-hidden />
              <p style={lookupTextStyle}>{t('scan.lookingUpDb')}</p>
            </div>
          )}

          {phase === 'error' && (
            <div style={errorPanelStyle}>
              <p style={errorTextStyle}>{errorKey ? t(errorKey) : ''}</p>
              <button onClick={() => setPhase('manual')} style={fallbackBtnStyle}>
                {t('scan.fallback')}
              </button>
            </div>
          )}

          {phase === 'scanning' && (
            <button onClick={() => setPhase('manual')} style={manualLinkStyle}>
              {t('scan.manualLink')}
            </button>
          )}
        </>
      )}

      {/* Mode manuel */}
      {phase === 'manual' && (
        <form onSubmit={handleManualSubmit} style={manualFormStyle}>
          <h2 style={titleStyle}>{t('scan.manualTitle')}</h2>
          <p style={hintStyle}>{t('scan.manualHint')}</p>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="DZ5485-612"
            autoFocus
            style={manualInputStyle}
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            style={{
              ...submitBtnStyle,
              opacity: !manualCode.trim() ? 0.55 : 1,
            }}
          >
            {t('scan.manualSubmit')}
          </button>
        </form>
      )}
    </div>
  )
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/* =====================================================
 * Styles — plein écran sombre pour maximiser le viewport
 * ===================================================== */

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: '#0A0A0A',
  zIndex: 2000,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
}

const closeBtnStyle: CSSProperties = {
  position: 'absolute',
  top: 'max(16px, env(safe-area-inset-top))',
  right: 16,
  zIndex: 2,
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
}

const readerStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  inset: 0,
}

const overlayUiStyle: CSSProperties = {
  position: 'absolute',
  top: 'max(80px, calc(env(safe-area-inset-top) + 64px))',
  left: 20,
  right: 20,
  textAlign: 'center',
  zIndex: 1,
  pointerEvents: 'none',
}

const titleStyle: CSSProperties = {
  fontFamily: "'Outfit', system-ui, sans-serif",
  fontSize: 18,
  fontWeight: 600,
  color: '#FFFFFF',
  letterSpacing: 'var(--tracking-wide)',
  margin: 0,
  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
}

const hintStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  color: 'rgba(255,255,255,0.8)',
  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  lineHeight: 1.4,
}

const detectedStyle: CSSProperties = {
  marginTop: 16,
  fontSize: 12,
  color: 'var(--color-university)',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.04em',
  fontFamily: 'monospace',
  background: 'rgba(0,0,0,0.6)',
  padding: '4px 10px',
  borderRadius: 6,
  display: 'inline-block',
}

const errorPanelStyle: CSSProperties = {
  position: 'absolute',
  bottom: 'max(40px, calc(env(safe-area-inset-bottom) + 24px))',
  left: 20,
  right: 20,
  background: 'rgba(206, 17, 65, 0.95)',
  color: '#FFFFFF',
  padding: '14px 16px',
  borderRadius: 'var(--radius-lg)',
  textAlign: 'center',
}

const errorTextStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.4,
  marginBottom: 12,
}

const fallbackBtnStyle: CSSProperties = {
  padding: '10px 18px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: '#FFFFFF',
  color: 'var(--color-bred)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: "'Outfit', system-ui, sans-serif",
  cursor: 'pointer',
}

const manualLinkStyle: CSSProperties = {
  position: 'absolute',
  bottom: 'max(40px, calc(env(safe-area-inset-bottom) + 24px))',
  fontSize: 12,
  color: 'rgba(255,255,255,0.85)',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  padding: '10px 18px',
  borderRadius: 'var(--radius-pill)',
  fontWeight: 500,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
}

const manualFormStyle: CSSProperties = {
  width: '100%',
  maxWidth: 360,
  padding: 24,
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const manualInputStyle: CSSProperties = {
  width: '100%',
  padding: '14px',
  fontSize: 16,
  fontFamily: 'monospace',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 'var(--radius-md)',
  color: '#FFFFFF',
  outline: 'none',
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.05em',
}

const submitBtnStyle: CSSProperties = {
  padding: '13px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: "'Outfit', system-ui, sans-serif",
  cursor: 'pointer',
  marginTop: 6,
}

const lookupOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(10, 10, 10, 0.7)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  zIndex: 3,
}

const spinnerStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '3px solid rgba(255,255,255,0.2)',
  borderTopColor: '#FFFFFF',
  animation: 'shooserie-spin 0.8s linear infinite',
}

const lookupTextStyle: CSSProperties = {
  fontSize: 13,
  color: 'rgba(255,255,255,0.85)',
  letterSpacing: 'var(--tracking-wide)',
  fontFamily: "'Outfit', system-ui, sans-serif",
}
