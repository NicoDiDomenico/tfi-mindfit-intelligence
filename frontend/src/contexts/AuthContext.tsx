import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { authService } from '../services/authService'
import type { AuthSession, LoginCredentials } from '../types/auth'
import { clearStoredSession, getStoredSession, setStoredSession } from '../utils/authStorage'
import { AuthContext } from './AuthContextValue'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())

  async function login(credentials: LoginCredentials) {
    const { idGym, nombreGym, username, password } = credentials
    const response = await authService.login({ username, password }, idGym)
    const nextSession: AuthSession = {
      idGym,
      nombreGym,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      permisos: response.permisos,
      datosPersonales: response.datosPersonales,
    }

    setStoredSession(nextSession)
    setSession(nextSession)

    return nextSession
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // La sesion local se limpia igual para no bloquear la salida del usuario.
    } finally {
      clearStoredSession()
      setSession(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: session !== null,
        isHydrated: true,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
