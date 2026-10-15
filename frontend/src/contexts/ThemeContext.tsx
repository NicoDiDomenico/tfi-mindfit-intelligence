import type { PropsWithChildren } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { ThemeContext, type ThemeMode } from './ThemeContextValue'

const THEME_STORAGE_KEY = 'mindfit.theme'

function isBrowser() {
  return typeof window !== 'undefined'
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function getStoredTheme(): ThemeMode {
  if (!isBrowser()) {
    return 'light'
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  return isThemeMode(storedTheme) ? storedTheme : 'light'
}

function persistTheme(theme: ThemeMode) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme())

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    persistTheme(nextTheme)
    setThemeState(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
      persistTheme(nextTheme)
      return nextTheme
    })
  }, [])

  const value = useMemo(
    () => ({
      theme,
      isDarkTheme: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
