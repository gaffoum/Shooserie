import type { CSSProperties } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Brand logo — Option B lockup: sneaker icon in a dark rounded square +
 * "SHOOSERIE." wordmark with the signature Bred dot.
 *
 * The icon stays SVG (path-based silhouette), but the wordmark is rendered as
 * HTML text using the app's display font (Outfit). This keeps typography
 * consistent across the UI and avoids the rendering inconsistencies you get
 * when text lives inside SVG (font fallback varies by browser, and the SVG
 * font might not match what the rest of the app uses).
 */
export function Logo({ size = 'md' }: LogoProps) {
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
      <SneakerIcon size={s.icon} />
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

/**
 * Icon-only mark. Square with a low-poly sneaker silhouette (AJ1-ish), with
 * a Bred swoosh accent — the same silhouette as `branding/option-b-sneaker-wordmark.svg`.
 * Rendered as SVG so it stays crisp at any size and adapts to dark mode via
 * the CSS var `--color-text` for the square fill.
 */
function SneakerIcon({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect x="0" y="0" width="200" height="200" rx="36" ry="36" fill="var(--color-text)" />
      <g transform="translate(28, 70)" fill="#FFFFFF">
        <path d="M 0 50 C 0 35, 10 22, 28 18 L 60 8 C 72 4, 82 6, 90 14 L 102 26 C 110 32, 120 36, 132 38 L 148 40 C 156 41, 160 46, 160 52 L 158 64 C 156 70, 152 72, 146 72 L 8 72 C 3 72, 0 68, 0 62 Z" />
        <path d="M 38 38 C 42 30, 52 26, 64 30 L 72 36 L 68 42 L 60 38 C 54 36, 48 38, 44 44 Z" fill="var(--color-bred)" />
      </g>
    </svg>
  )
}
