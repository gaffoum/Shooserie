import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import lockupLight from '@/assets/logos/shooserie-lockup-light.svg'
import lockupDark from '@/assets/logos/shooserie-lockup-dark.svg'
import iconLight from '@/assets/logos/shooserie-icon-light.svg'
import iconDark from '@/assets/logos/shooserie-icon-dark.svg'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Logo de marque — lockup complet (mark + wordmark) depuis src/assets/logos,
 * variante selon le thème résolu (light/dark).
 *
 * Sur mobile (< 640px), on affiche l'icône seule (tuile) à la place du lockup
 * complet, pour rester compact.
 *
 * Rendu via <img> : `height` fixé + `width:auto` (+ `maxWidth:none` pour
 * neutraliser un éventuel reset `img{max-width:100%}`) → net, non écrasé.
 * L'API `size` mappe une hauteur ; ne rien casser chez les appelants
 * (AppHeader, Login, ResetPassword, SharedCollection).
 */

const HEIGHT: Record<NonNullable<LogoProps['size']>, number> = {
  sm: 48,
  md: 88,
  lg: 120,
}
// Sur mobile on affiche l'icône seule, à 48px, pour ne pas écraser l'écran.
const ICON_PX = 48
const MOBILE_QUERY = '(max-width: 639px)'

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

export function Logo({ size = 'md' }: LogoProps) {
  const { resolved } = useTheme()
  const isMobile = useIsMobile()
  const dark = resolved === 'dark'

  if (isMobile) {
    return (
      <img
        src={dark ? iconDark : iconLight}
        alt="Shooserie"
        width={ICON_PX}
        height={ICON_PX}
        style={{ display: 'block', width: ICON_PX, height: ICON_PX, maxWidth: 'none', flexShrink: 0 }}
      />
    )
  }

  const h = HEIGHT[size]
  return (
    <img
      src={dark ? lockupDark : lockupLight}
      alt="Shooserie"
      height={h}
      style={{ display: 'block', height: h, width: 'auto', maxWidth: 'none', flexShrink: 0 }}
    />
  )
}
