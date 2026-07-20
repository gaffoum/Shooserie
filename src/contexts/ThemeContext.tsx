import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

/**
 * Thème de l'app — QUATRE valeurs pilotées par `data-theme` sur <html> :
 *   dark · light · sb-dark · sb-light   (sb = « South Beach / Miami »).
 *
 * `resolved` conserve la famille claire/sombre (light|dark) — les composants
 * qui choisissent un asset selon la luminosité (écussons de rang, logo…)
 * continuent de lire `resolved` sans changement.
 *
 * Persistance : la préférence est stockée en localStorage. Toute valeur inconnue
 * (ancien 'system', clé corrompue, thème retiré…) retombe sur `dark`.
 */
export type Theme = 'dark' | 'light' | 'sb-dark' | 'sb-light'
type Family = 'light' | 'dark'

const KEY = 'shooserie:theme'
const THEMES: readonly Theme[] = ['dark', 'light', 'sb-dark', 'sb-light']
const DEFAULT_THEME: Theme = 'dark'

/** Famille claire/sombre de chaque thème (choix des assets light/dark). */
const FAMILY: Record<Theme, Family> = {
  dark: 'dark',
  'sb-dark': 'dark',
  light: 'light',
  'sb-light': 'light',
}

/** Couleur de la barre d'état (meta theme-color) alignée sur le fond de page. */
const META_COLOR: Record<Theme, string> = {
  dark: '#0A0A0A',
  light: '#F5F5F5',
  'sb-dark': '#073763',
  'sb-light': '#E9F3FB',
}

/** Normalise une valeur stockée : inconnue → dark (fallback exigé). */
function normalize(v: string | null | undefined): Theme {
  return THEMES.includes(v as Theme) ? (v as Theme) : DEFAULT_THEME
}

const Ctx = createContext<{
  theme: Theme
  /** Famille claire/sombre du thème courant (compat consommateurs existants). */
  resolved: Family
  setTheme: (t: Theme) => void
}>({
  theme: DEFAULT_THEME,
  resolved: 'dark',
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => normalize(localStorage.getItem(KEY)))

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', META_COLOR[theme])
    localStorage.setItem(KEY, theme)
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(normalize(t))

  return (
    <Ctx.Provider value={{ theme, resolved: FAMILY[theme], setTheme }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTheme() {
  return useContext(Ctx)
}

/** Liste ordonnée des thèmes — pour le sélecteur des Paramètres et le cycle. */
export const THEME_ORDER: readonly Theme[] = THEMES
