import type { AuthSession } from '../types/auth'

export const DEFAULT_AUTHENTICATED_ROUTE = '/dashboard'
export const SOCIO_AUTHENTICATED_ROUTE = '/socio/inicio'

export function isSocioRole(roles?: readonly string[] | null) {
  return roles?.some((rol) => rol.trim().toLowerCase() === 'socio') ?? false
}

export function getAuthenticatedHomePath(session?: Pick<AuthSession, 'datosPersonales'> | null) {
  return isSocioRole(session?.datosPersonales?.rol)
    ? SOCIO_AUTHENTICATED_ROUTE
    : DEFAULT_AUTHENTICATED_ROUTE
}
