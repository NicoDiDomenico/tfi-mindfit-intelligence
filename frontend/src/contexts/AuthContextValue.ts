import { createContext } from 'react'
import type { AuthSession, LoginCredentials } from '../types/auth'

export interface AuthContextValue {
  session: AuthSession | null
  isAuthenticated: boolean
  isHydrated: boolean
  login: (credentials: LoginCredentials) => Promise<AuthSession>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
