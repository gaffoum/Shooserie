import { useEffect, useState } from 'react'
import { useSignedPhotoUrl } from '@/lib/queries'
import { PhotoPlaceholder } from './PhotoPlaceholder'

interface SneakerPhotoProps {
  /** URL StockX directe (publique) — affichée en priorité si présente */
  stockxUrl?: string | null
  /** Path Storage privé Supabase (nécessite signed URL) */
  storagePath?: string | null
  alt?: string
  /** Couleur de fond du placeholder */
  placeholderBg?: string
  /** Couleur de la silhouette du placeholder */
  placeholderColor?: string
}

/**
 * Affiche la photo d'une sneaker.
 * - Priorité 1 : URL StockX directe (publique, pas de signed URL needed)
 * - Priorité 2 : photo uploadée dans Storage (signed URL générée à la volée)
 * - Fallback : silhouette Shooserie (PhotoPlaceholder), quand aucune URL n'est
 *   dispo OU quand l'image échoue à charger (URL morte / erronée, ex. « Jodan »).
 *   → plus jamais le carré « ? » natif du navigateur.
 */
export function SneakerPhoto({
  stockxUrl,
  storagePath,
  alt = 'Sneaker',
  placeholderBg,
  placeholderColor,
}: SneakerPhotoProps) {
  // Si une URL StockX est dispo, on l'utilise direct
  const directUrl = stockxUrl || null

  // Sinon on génère une signed URL pour la photo uploadée
  const { data: signedUrl } = useSignedPhotoUrl(directUrl ? null : storagePath)
  const url = directUrl || signedUrl

  // Erreur de chargement (URL morte/erronée) → bascule sur le placeholder.
  const [broken, setBroken] = useState(false)
  // Réinitialise si l'URL change (nouvelle carte, signed URL fraîche…).
  useEffect(() => setBroken(false), [url])

  if (!url || broken) {
    return <PhotoPlaceholder background={placeholderBg} color={placeholderColor} />
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        // `contain` (not `cover`) so the entire shoe stays visible.
        // StockX catalog images and user uploads can have varied aspect
        // ratios — cropping risks chopping off the sole or toe box.
        objectFit: 'contain',
        padding: 6,
      }}
    />
  )
}
