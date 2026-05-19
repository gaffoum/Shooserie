interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ size = 'md' }: LogoProps) {
  const sizes = {
    sm: { fontSize: 13, letterSpacing: '0.22em' },
    md: { fontSize: 16, letterSpacing: '0.22em' },
    lg: { fontSize: 28, letterSpacing: '0.18em' },
  }
  const s = sizes[size]

  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: s.fontSize,
        letterSpacing: s.letterSpacing,
        textTransform: 'uppercase',
        color: 'var(--color-text)',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      SHOOSERIE
      <span style={{ color: 'var(--color-bred)', fontSize: s.fontSize * 1.1, lineHeight: 1 }}>
        .
      </span>
    </span>
  )
}
