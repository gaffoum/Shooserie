import { useTheme } from '@/contexts/ThemeContext'
import lockupLight from '@/assets/logos/shooserie-lockup-light.svg'
import lockupDark from '@/assets/logos/shooserie-lockup-dark.svg'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Logo de marque — lockup complet (mark + wordmark) depuis src/assets/logos.
 * On affiche la variante selon le thème résolu : lockup-light en clair,
 * lockup-dark en sombre. Rendu via <img> ; l'API `size` mappe une hauteur
 * (le ratio du SVG fait le reste) pour ne rien casser chez les appelants
 * (AppHeader, Login, ResetPassword, SharedCollection).
 */

const HEIGHT: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 24,
  md: 32,
  lg: 44,
}

export function Logo({ size = 'md' }: LogoProps) {
  const { resolved } = useTheme()
  const src = resolved === 'dark' ? lockupDark : lockupLight
  const h = HEIGHT[size]

  return (
    <img
      src={src}
      alt="Shooserie"
      height={h}
      style={{ display: 'block', height: h, width: 'auto', flexShrink: 0 }}
    />
  )
}
