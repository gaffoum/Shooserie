import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type ThemePref = 'light' | 'dark' | 'system'
type Resolved = 'light' | 'dark'
const KEY = 'shooserie:theme'

const Ctx = createContext<{ pref: ThemePref; resolved: Resolved; setPref: (p: ThemePref) => void }>({
  pref: 'system', resolved: 'light', setPref: () => {},
})

function systemDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPref] = useState<ThemePref>(() => {
    const s = localStorage.getItem(KEY) as ThemePref | null
    return s === 'light' || s === 'dark' || s === 'system' ? s : 'system'
  })
  const [resolved, setResolved] = useState<Resolved>('light')

  useEffect(() => {
    function apply() {
      const r: Resolved = pref === 'system' ? (systemDark() ? 'dark' : 'light') : pref
      setResolved(r)
      document.documentElement.setAttribute('data-theme', r)
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', r === 'dark' ? '#0A0A0A' : '#F5F5F5')
    }
    apply()
    localStorage.setItem(KEY, pref)
    if (pref === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', apply)
      return () => mq.removeEventListener('change', apply)
    }
  }, [pref])

  return <Ctx.Provider value={{ pref, resolved, setPref }}>{children}</Ctx.Provider>
}

export function useTheme() { return useContext(Ctx) }
