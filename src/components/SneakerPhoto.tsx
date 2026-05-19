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
}

/**
 * Affiche la photo d'une sneaker.
 * - Priorité 1 : URL StockX directe (publique, pas de signed URL needed)
 * - Priorité 2 : photo uploadée dans Storage (signed URL générée à la volée)
 * - Fallback : silhouette SVG sur fond neutre
 */
export function SneakerPhoto({
  stockxUrl,
  storagePath,
  alt = 'Sneaker',
  placeholderBg,
}: SneakerPhotoProps) {
  // Si une URL StockX est dispo, on l'utilise direct
  const directUrl = stockxUrl || null

  // Sinon on génère une signed URL pour la photo uploadée
  const { data: signedUrl } = useSignedPhotoUrl(directUrl ? null : storagePath)
  const url = directUrl || signedUrl

  if (!url) {
    return <PhotoPlaceholder background={placeholderBg} />
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      }}
    />
  )
}
