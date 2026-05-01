import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('sole_theme') ?? 'dark')

  const toggle = () =>
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      localStorage.setItem('sole_theme', next)
      return next
    })

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

export const chartColors = (isDark) => ({
  tick: isDark ? '#71717a' : '#a1a1aa',
  grid: isDark ? '#27272a' : '#f4f4f5',
  cursor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
  tooltip: {
    bg: isDark ? '#18181b' : '#ffffff',
    border: isDark ? '#3f3f46' : '#e4e4e7',
    text: isDark ? '#fafafa' : '#09090b',
    muted: isDark ? '#71717a' : '#a1a1aa',
  },
})
