/**
 * OrderSuccess — page de retour apres paiement Stripe.
 * On poll la commande jusqu'a ce que le webhook ait marque "paid".
 */
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { useOrder, formatEur, statusLabel } from '../lib/stickerOrders'

import { formatEur as _formatEur } from '../lib/stickerPricing'

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>()
  const orderQ = useOrder(id)

  if (orderQ.isLoading) {
    return (
      <>
        <AppHeader />
        <div style={pageStyle}>
          <p style={mutedStyle}>Chargement…</p>
        </div>
      </>
    )
  }

  const order = orderQ.data
  if (!order) {
    return (
      <>
        <AppHeader />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Commande introuvable</h1>
          <Link to="/orders" style={linkStyle}>← Mes commandes</Link>
        </div>
      </>
    )
  }

  const isPending = order.status === 'pending'

  return (
    <>
      <AppHeader />
      <div style={pageStyle}>
        {isPending ? (
          <div style={pendingBoxStyle}>
            <div style={spinnerStyle}>⏳</div>
            <h1 style={titleStyle}>Paiement en cours de confirmation…</h1>
            <p style={mutedStyle}>
              Stripe est en train de confirmer ton paiement. Cette page se met à jour automatiquement (max 30 sec).
            </p>
          </div>
        ) : (
          <div style={successBoxStyle}>
            <div style={emojiStyle}>🎉</div>
            <h1 style={titleStyle}>Commande confirmée !</h1>
            <p style={subtitleStyle}>
              Merci pour ta confiance. Un email de confirmation t'a été envoyé.
            </p>

            <div style={cardStyle}>
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <td style={tdLabelStyle}>Numéro de commande</td>
                    <td style={tdValueStyle}>#{order.id.slice(0, 8).toUpperCase()}</td>
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
                    <td style={tdLabelStyle}>Total payé</td>
                    <td style={tdValueStyle}>{formatEur(order.amount_total_cents / 100)}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Statut</td>
                    <td style={tdValueStyle}>{statusLabel(order.status)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p style={nextStepStyle}>
              📦 Tes planches sont en cours de préparation. Tu recevras un mail avec le numéro de suivi sous 3-5 jours ouvrés.
            </p>

            <div style={ctaWrapStyle}>
              <Link to="/orders" style={primaryCtaStyle}>Voir mes commandes</Link>
              <Link to="/labels" style={secondaryCtaStyle}>Retour aux étiquettes</Link>
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