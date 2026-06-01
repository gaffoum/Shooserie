/**
 * CGV — Conditions Generales de Vente.
 * Modele FR vente a distance (BtoC), edite par auto-entreprise Skriners.
 */
import type { CSSProperties } from 'react'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'

export default function CGV() {
  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={pageStyle}>
        <h1 style={titleStyle}>Conditions Générales de Vente</h1>
        <p style={updateStyle}>Dernière mise à jour : 01/06/2026</p>

        <Section title="1. Vendeur">
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits proposées par <strong>Skriners</strong>,
            auto-entreprise exploitée par Gill Affoum, domiciliée en France.
            <br/>SIRET disponible sur demande à <a href="mailto:contact@shooserie.tech" style={linkStyle}>contact@shooserie.tech</a>.
            <br/>Shooserie est une marque éditée par Skriners.
          </p>
        </Section>

        <Section title="2. Produits proposés">
          <p>
            Le présent service propose à la vente des <strong>planches de stickers personnalisés</strong> imprimées
            au format Avery L7165 (99 × 67 mm, 8 stickers par planche A4),
            représentant les sneakers enregistrées par l'utilisateur dans son profil Shooserie.
            Chaque sticker comporte une photo, le modèle, la taille et un QR code unique.
          </p>
          <p>
            Les stickers sont confectionnés sur mesure à partir de la collection personnelle de l'utilisateur.
            Ce sont des biens <strong>personnalisés</strong> au sens de l'article L221-28 du Code de la consommation.
          </p>
        </Section>

        <Section title="3. Prix">
          <p>Les prix sont indiqués en euros toutes taxes comprises (TTC), livraison incluse :</p>
          <ul style={listStyle}>
            <li><strong>1 planche</strong> : 5,00 €</li>
            <li><strong>2 à 3 planches</strong> : 4,00 € par planche</li>
            <li><strong>4 planches et plus</strong> : 3,00 € par planche</li>
          </ul>
          <p>
            Skriners se réserve le droit de modifier ses prix à tout moment. Les commandes en cours seront facturées
            au prix en vigueur au moment de leur validation.
          </p>
        </Section>

        <Section title="4. Commande et paiement">
          <p>
            La commande est validée après acceptation des présentes CGV et paiement par carte bancaire via Stripe.
            Un email de confirmation est envoyé à l'adresse renseignée lors de l'inscription.
          </p>
          <p>
            Les paiements sont sécurisés via Stripe (PCI-DSS). Aucune donnée bancaire n'est stockée par Skriners.
          </p>
        </Section>

        <Section title="5. Livraison">
          <p>
            La livraison est assurée par La Poste en lettre suivie ou colis suivi selon le volume,
            <strong> à destination de la France métropolitaine uniquement</strong>.
          </p>
          <p>
            Délai d'expédition : <strong>3 à 5 jours ouvrés</strong> à compter de la confirmation du paiement.
            Délai de livraison : 2 à 4 jours ouvrés après expédition.
            Soit un délai total estimé de 5 à 9 jours ouvrés.
          </p>
          <p>
            Un numéro de suivi est communiqué par email dès l'expédition.
          </p>
        </Section>

        <Section title="6. Droit de rétractation — Exclusion">
          <p>
            <strong>Important</strong> : conformément à l'article L221-28, 3° du Code de la consommation,
            le droit de rétractation de 14 jours <strong>ne s'applique pas</strong> aux biens confectionnés selon
            les spécifications du consommateur ou nettement personnalisés.
          </p>
          <p>
            Les planches de stickers étant intégralement personnalisées à partir de la collection du client
            (photos, modèles, tailles, QR uniques), elles entrent dans cette exclusion. La validation de
            la commande vaut renonciation expresse au droit de rétractation.
          </p>
        </Section>

        <Section title="7. Garanties et réclamations">
          <p>
            Conformément à la législation française, l'acheteur bénéficie de la garantie légale de conformité
            (art. L217-3 et suivants du Code de la consommation) et de la garantie contre les vices cachés
            (art. 1641 et suivants du Code civil).
          </p>
          <p>
            En cas de défaut d'impression, dégradation lors du transport ou non-conformité à la commande,
            l'acheteur dispose de <strong>14 jours</strong> à compter de la réception pour signaler le problème
            par email à <a href="mailto:contact@shooserie.tech" style={linkStyle}>contact@shooserie.tech</a>.
            Une planche de remplacement sera envoyée sans frais après vérification.
          </p>
        </Section>

        <Section title="8. Données personnelles">
          <p>
            Les données personnelles collectées (adresse de livraison, email) sont utilisées exclusivement
            pour le traitement de la commande et la communication relative à celle-ci.
            Elles ne sont pas revendues à des tiers.
          </p>
          <p>
            Conformément au RGPD, l'utilisateur dispose d'un droit d'accès, de rectification, d'effacement
            et de portabilité de ses données. Ces droits s'exercent par email à
            <a href="mailto:contact@shooserie.tech" style={linkStyle}> contact@shooserie.tech</a>.
          </p>
        </Section>

        <Section title="9. Médiation et litiges">
          <p>
            En cas de litige, l'acheteur peut recourir gratuitement au médiateur de la consommation
            avant toute action judiciaire. Les tribunaux français sont seuls compétents.
          </p>
        </Section>

        <Section title="10. Acceptation">
          <p>
            La validation d'une commande implique l'acceptation pleine et entière des présentes CGV.
            Les CGV en vigueur sont celles applicables au moment de la commande.
          </p>
        </Section>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      {children}
    </section>
  )
}

const pageStyle: CSSProperties = {
  maxWidth: 720, margin: '0 auto',
  padding: '24px 16px 80px',
  fontFamily: "'Outfit', sans-serif",
  color: '#0A0A0A',
  fontSize: 14,
  lineHeight: 1.7,
}
const titleStyle: CSSProperties = {
  fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em',
  margin: '0 0 4px',
}
const updateStyle: CSSProperties = {
  fontSize: 12, color: '#6B7280', marginBottom: 32,
}
const sectionStyle: CSSProperties = { marginBottom: 28 }
const sectionTitleStyle: CSSProperties = {
  fontSize: 16, fontWeight: 700, color: '#0A0A0A',
  margin: '0 0 12px',
}
const listStyle: CSSProperties = {
  paddingLeft: 24, margin: '8px 0',
}
const linkStyle: CSSProperties = {
  color: '#CE1141', textDecoration: 'underline',
}