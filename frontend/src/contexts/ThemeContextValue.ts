import { createContext } from 'react'

export type ThemeMode = 'light' | 'dark'

export interface ThemeContextValue {
  theme: ThemeMode
  isDarkTheme: boolean
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)
