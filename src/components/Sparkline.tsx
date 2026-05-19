import type { CSSProperties } from 'react'

export interface SparklinePoint {
  date: string // ISO
  value: number
}

interface SparklineProps {
  /** Sorted ascending by date. If empty or single point, a flat baseline shows. */
  points?: SparklinePoint[]
  /** Width / height of the SVG viewBox. */
  width?: number
  height?: number
  /** Stroke color override. Defaults to up/down based on overall trend. */
  color?: string
  className?: string
  style?: CSSProperties
}

/**
 * Lightweight inline sparkline. Renders a single polyline through the points,
 * scaled to fit the viewBox. Empty / 1-point data renders a faint flat line
 * so the layout doesn't collapse.
 *
 * If no `color` prop is given, the line is rendered in the "up" color when the
 * last value is ≥ the first, otherwise the "down" color.
 */
export function Sparkline({
  points = [],
  width = 150,
  height = 50,
  color,
  className,
  style,
}: SparklineProps) {
  const pad = 4
  const innerW = width - pad * 2
  const innerH = height - pad * 2

  // Empty state — flat faint line at mid-height.
  if (points.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={className}
        style={{ width: '100%', height: '100%', display: 'block', ...style }}
        aria-hidden
      >
        <line
          x1={pad}
          y1={height / 2}
          x2={width - pad}
          y2={height / 2}
          stroke="var(--color-border)"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
      </svg>
    )
  }

  // Normalize value → y.
  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const xs = points.map((_, i) =>
    pad + (i / (points.length - 1)) * innerW,
  )
  const ys = values.map((v) => pad + (1 - (v - min) / span) * innerH)

  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ')

  const trendUp = values[values.length - 1] >= values[0]
  const stroke = color ?? (trendUp ? 'var(--color-up)' : 'var(--color-down)')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', ...style }}
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
