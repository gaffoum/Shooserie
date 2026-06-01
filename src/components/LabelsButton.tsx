/**
 * LabelsButton — icone imprimante qui mene a /labels.
 * Conçue pour s'inserer dans une rangee de tabs / etiquettes (paire a vendre, marche, messages...)
 *
 * Usage :
 *   <LabelsButton />                          // version icone seule (compact)
 *   <LabelsButton showLabel />                // avec libelle "Étiquettes"
 *   <LabelsButton variant="chip" showLabel /> // matche le style chip/etiquette
 */
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'

interface LabelsButtonProps {
  /** Affiche le libelle "Étiquettes" a cote de l'icone. */
  showLabel?: boolean
  /** Style : 'icon' (cercle simple) ou 'chip' (pilule pour matcher des tabs). */
  variant?: 'icon' | 'chip'
  /** Titre custom au survol. */
  title?: string
}

export function LabelsButton({
  showLabel = false,
  variant = 'icon',
  title = 'Imprimer mes étiquettes',
}: LabelsButtonProps) {
  if (variant === 'chip') {
    return (
      <Link to="/labels" style={chipStyle} title={title} aria-label={title}>
        <PrinterIcon />
        {showLabel && <span style={chipLabelStyle}>Étiquettes</span>}
      </Link>
    )
  }
  return (
    <Link to="/labels" style={iconStyle} title={title} aria-label={title}>
      <PrinterIcon />
      {showLabel && <span style={iconLabelStyle}>Étiquettes</span>}
    </Link>
  )
}

function PrinterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  )
}

const iconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  width: 36,
  minWidth: 36,
  height: 36,
  borderRadius: '50%',
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  color: '#0A0A0A',
  textDecoration: 'none',
  justifyContent: 'center',
  transition: 'border-color 120ms, background 120ms',
}

const iconLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'Outfit', sans-serif",
}

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 999,
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  color: '#0A0A0A',
  textDecoration: 'none',
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  transition: 'border-color 120ms, background 120ms',
}

const chipLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
}