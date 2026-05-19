import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { dictionaries, type DictKey, type Lang } from './dictionaries'

interface I18nContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: DictKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)
const STORAGE_KEY = 'shooserie:lang'

function detectInitialLang(): Lang {
  if (typeof window === 'undefined') return 'fr'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'fr' || stored === 'en') return stored
  // Browser preference: any English variant ('en-US', 'en-GB', etc.) maps to EN,
  // everything else defaults to FR.
  const browser = window.navigator.language?.toLowerCase() ?? ''
  return browser.startsWith('en') ? 'en' : 'fr'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang)

  // Keep the <html lang> attribute in sync (screen readers, browser hints).
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage may be unavailable (private mode); ignore.
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'fr' ? 'en' : 'fr')
  }, [lang, setLang])

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>): string => {
      let str: string = dictionaries[lang][key] ?? dictionaries.fr[key] ?? key
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.split(`{${k}}`).join(String(v))
        }
      }
      return str
    },
    [lang],
  )

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT must be used inside I18nProvider')
  return ctx
}

/* =====================================================
 * Locale-aware formatters
 * Use the current `lang` to pick BCP-47 locales for dates / numbers.
 * ===================================================== */

const LOCALES: Record<Lang, string> = { fr: 'fr-FR', en: 'en-US' }

export function localeFor(lang: Lang): string {
  return LOCALES[lang]
}

/**
 * Format a date for inline display (e.g. "19 mai à 14:00" in FR, or
 * "May 19, 2:00 PM" in EN). Returns "—" when input is invalid.
 */
export function formatDateTime(iso: string, lang: Lang): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const fmt = new Intl.DateTimeFormat(localeFor(lang), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
  // FR convention adds "à" between date and time; we mimic that for natural reading.
  if (lang === 'fr') {
    const parts = fmt.formatToParts(d)
    const date = parts
      .filter((p) => ['day', 'month', 'literal'].includes(p.type) && p.value.trim() !== ',')
      .map((p) => p.value)
      .join('')
      .trim()
    const time = parts
      .filter((p) => ['hour', 'minute', 'literal'].includes(p.type))
      .map((p) => p.value)
      .join('')
      .replace(/^,?\s*/, '')
      .trim()
    return `${date} à ${time}`
  }
  return fmt.format(d)
}
