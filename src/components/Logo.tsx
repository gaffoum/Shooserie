import type { CSSProperties } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import iconLight from '@/assets/logos/shooserie-icon-light.svg'
import iconDark from '@/assets/logos/shooserie-icon-dark.svg'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Brand logo — direction « boîte étiquetée » (3c) : tuile + boîte code-barrée
 * (mark) + wordmark "SHOOSERIE." avec le point Bred.
 *
 * Le mark reste un SVG (fichier dans src/assets/logos), mais on affiche la
 * variante selon le thème résolu (icon-light en clair, icon-dark en sombre)
 * plutôt que de piloter le carré via --color-text : le fond de tuile ne doit
 * pas s'inverser, seule la variante change.
 *
 * Le wordmark reste du texte HTML dans la police d'affichage (Outfit) pour
 * garder une typo cohérente avec le reste de l'UI et éviter les incohérences
 * de rendu du texte embarqué dans un SVG.
 */
export function Logo({ size = 'md' }: LogoProps) {
  const { resolved } = useTheme()
  const sizes = {
    sm: { icon: 22, font: 13, gap: 8, dot: 1.05 },
    md: { icon: 30, font: 16, gap: 10, dot: 1.05 },
    lg: { icon: 52, font: 26, gap: 14, dot: 1.05 },
  } as const
  const s = sizes[size]

  return (
    <span
      role="img"
      aria-label="Shooserie"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        whiteSpace: 'nowrap',
        color: 'var(--color-text)',
        lineHeight: 1,
      }}
    >
      <img
        src={resolved === 'dark' ? iconDark : iconLight}
        width={s.icon}
        height={s.icon}
        alt=""
        aria-hidden
        style={{ display: 'block', flexShrink: 0 }}
      />
      <span style={wordmark(s.font)}>
        SHOOSERIE
        <span
          style={{
            color: 'var(--color-bred)',
            fontSize: s.font * s.dot,
            lineHeight: 1,
          }}
        >
          .
        </span>
      </span>
    </span>
  )
}

function wordmark(fontSize: number): CSSProperties {
  return {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize,
    letterSpacing: '-0.015em',
    color: 'var(--color-text)',
  }
}
