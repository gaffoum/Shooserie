/**
 * OrderSuccess â€” page de retour apres paiement Stripe.
 * On poll la commande jusqu'a ce que le webhook ait marque "paid".
 * Si la commande est numerique et payee, on permet le telechargement du PDF
 * (genere cote client a partir des paires de la commande).
 */
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { useOrder, useSneakersByIds, formatEur, statusLabel } from '../lib/stickerOrders'
import { generateStickerPdf, downloadBlob } from '../lib/stickerPdf'

const PDF_OPTIONS = {
  showPhoto: true,
  showSize: true,
  showQR: true,
  showBrandBar: true,
  qrBaseUrl: 'https://shooserie.tech/sneakers',
}

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>()
  const orderQ = useOrder(id)
  const order = orderQ.data ?? null

  const canDownload = !!order && order.type === 'digital' && order.status !== 'pending'
  const sneakersQ = useSneakersByIds(canDownload ? order!.sneaker_ids : undefined)
  const [isGen, setIsGen] = useState(false)

  async function handleDownload() {
    if (!order) return
    const sneakers = sneakersQ.data ?? []
    if (sneakers.length === 0) {
      alert('Impossible de retrouver les paires de cette commande.')
      return
    }
    setIsGen(true)
    try {
      const blob = await generateStickerPdf(sneakers, PDF_OPTIONS)
      downloadBlob(blob, `shooserie-stickers-${order.id.slice(0, 8)}.pdf`)
    } catch (e) {
      console.error('PDF generation failed', e)
      alert('La gÃ©nÃ©ration du PDF a Ã©chouÃ©. RÃ©essaie.')
    } finally {
      setIsGen(false)
    }
  }

  if (orderQ.isLoading) {
    return (
      <>
        <AppHeader />
        <div style={pageStyle}>
          <p style={mutedStyle}>Chargementâ€¦</p>
        </div>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <AppHeader />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Commande introuvable</h1>
          <Link to="/orders" style={linkStyle}>â† Mes commandes</Link>
        </div>
      </>
    )
  }

  const isPending = order.status === 'pending'
  const isDigital = order.type === 'digital'

  return (
    <>
      <AppHeader />
      <div style={pageStyle}>
        {isPending ? (
          <div style={pendingBoxStyle}>
            <div style={spinnerStyle}>â³</div>
            <h1 style={titleStyle}>Paiement en cours de confirmationâ€¦</h1>
            <p style={mutedStyle}>
              Stripe est en train de confirmer ton paiement. Cette page se met Ã  jour automatiquement (max 30 sec).
            </p>
          </div>
        ) : (
          <div style={successBoxStyle}>
            <div style={emojiStyle}>ðŸŽ‰</div>
            <h1 style={titleStyle}>{isDigital ? 'Paiement confirmÃ© !' : 'Commande confirmÃ©e !'}</h1>
            <p style={subtitleStyle}>
              Merci pour ta confiance. Un email de confirmation t'a Ã©tÃ© envoyÃ©.
            </p>

            <div style={cardStyle}>
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <td style={tdLabelStyle}>NumÃ©ro de commande</td>
                    <td style={tdValueStyle}>#{order.id.slice(0, 8).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Type</td>
                    <td style={tdValueStyle}>{isDigital ? 'PDF numÃ©rique' : 'Planche imprimÃ©e'}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Stickers</td>
                    <td style={tdValueStyle}>{order.nb_stickers}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Planches</td>
                    <td style={tdValueStyle}>{order.nb_planches}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Total payÃ©</td>
                    <td style={tdValueStyle}>{formatEur(order.amount_total_cents / 100)}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Statut</td>
                    <td style={tdValueStyle}>{statusLabel(order.status)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {isDigital ? (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isGen || sneakersQ.isLoading}
                  style={isGen || sneakersQ.isLoading ? downloadDisabledStyle : downloadStyle}
                >
                  {isGen
                    ? 'GÃ©nÃ©ration du PDFâ€¦'
                    : sneakersQ.isLoading
                      ? 'PrÃ©parationâ€¦'
                      : 'ðŸ“¥ TÃ©lÃ©charger mon PDF'}
                </button>
                <p style={nextStepStyle}>
                  Tu peux retÃ©lÃ©charger ton PDF Ã  tout moment depuis cette page ou Â« Mes commandes Â».
                </p>
              </>
            ) : (
              <p style={nextStepStyle}>
                ðŸ“¦ Tes planches sont en cours de prÃ©paration. Tu recevras un mail avec le numÃ©ro de suivi sous 3-5 jours ouvrÃ©s.
              </p>
            )}

            <div style={ctaWrapStyle}>
              <Link to="/orders" style={primaryCtaStyle}>Voir mes commandes</Link>
              <Link to="/labels" style={secondaryCtaStyle}>Retour aux Ã©tiquettes</Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const pageStyle: CSSProperties = {
  maxWidth: 600, margin: '0 auto',
  padding: '40px 16px 80px',
  fontFamily: "'Outfit', sans-serif",
  textAlign: 'center',
}
const successBoxStyle: CSSProperties = {}
const pendingBoxStyle: CSSProperties = { padding: '40px 0' }
const spinnerStyle: CSSProperties = {
  fontSize: 48, marginBottom: 16,
  animation: 'spin 2s linear infinite',
}
const emojiStyle: CSSProperties = { fontSize: 56, marginBottom: 16 }
const titleStyle: CSSProperties = {
  fontSize: 28, fontWeight: 800, color: '#0A0A0A',
  margin: '0 0 8px', lineHeight: 1.2,
}
const subtitleStyle: CSSProperties = {
  fontSize: 15, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.5,
}
const mutedStyle: CSSProperties = { color: '#6B7280', fontSize: 14 }

const cardStyle: CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 12, padding: 20, marginBottom: 16, textAlign: 'left',
}
const tableStyle: CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: 14,
}
const tdLabelStyle: CSSProperties = { padding: '6px 0', color: '#6B7280' }
const tdValueStyle: CSSProperties = {
  padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#0A0A0A',
  fontVariantNumeric: 'tabular-nums',
}

const downloadStyle: CSSProperties = {
  background: '#CE1141', color: '#FFFFFF', border: 'none',
  borderRadius: 999, padding: '14px 28px', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit', margin: '8px 0',
}
const downloadDisabledStyle: CSSProperties = {
  ...downloadStyle, background: '#E5E7EB', color: '#9CA3AF', cursor: 'not-allowed',
}

const nextStepStyle: CSSProperties = {
  fontSize: 14, color: '#374151', lineHeight: 1.5,
  background: '#F9FAFB', padding: 16, borderRadius: 10, margin: '16px 0',
}

const ctaWrapStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginTop: 24,
}
const primaryCtaStyle: CSSProperties = {
  display: 'inline-block', padding: '12px 24px',
  background: '#0A0A0A', color: '#FFFFFF',
  borderRadius: 999, textDecoration: 'none',
  fontWeight: 700, fontSize: 14,
}
const secondaryCtaStyle: CSSProperties = {
  display: 'inline-block', padding: '8px 16px',
  color: '#6B7280', textDecoration: 'none', fontSize: 13,
}
const linkStyle: CSSProperties = { color: '#CE1141', textDecoration: 'underline' }