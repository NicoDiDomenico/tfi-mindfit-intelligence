import type { AuthSession, DatosPersonales } from '../types/auth'

const STORAGE_KEYS = {
  idGym: 'mindfit.idGym',
  nombreGym: 'mindfit.nombreGym',
  accessToken: 'mindfit.accessToken',
  refreshToken: 'mindfit.refreshToken',
  permisos: 'mindfit.permisos',
  datosPersonales: 'mindfit.datosPersonales',
} as const

function isBrowser() {
  return typeof window !== 'undefined'
}

function parseDatosPersonales(value: string): DatosPersonales | null {
  const parsed = JSON.parse(value)

  if (!parsed || typeof parsed !== 'object') {
    return null
  }

  const candidate = parsed as Partial<DatosPersonales>

  if (typeof candidate.id !== 'number') {
    return null
  }

  const rol = Array.isArray(candidate.rol)
    ? candidate.rol.filter((value): value is string => typeof value === 'string')
    : null

  return {
    id: candidate.id,
    nombre: typeof candidate.nombre === 'string' ? candidate.nombre : null,
    apellido: typeof candidate.apellido === 'string' ? candidate.apellido : null,
    rol,
  }
}

export function getStoredSession(): AuthSession | null {
  if (!isBrowser()) {
    return null
  }

  const idGymValue = window.localStorage.getItem(STORAGE_KEYS.idGym)
  const nombreGym = window.localStorage.getItem(STORAGE_KEYS.nombreGym)
  const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken)
  const refreshToken = window.localStorage.getItem(STORAGE_KEYS.refreshToken)
  const permisosValue = window.localStorage.getItem(STORAGE_KEYS.permisos)
  const datosPersonalesValue = window.localStorage.getItem(STORAGE_KEYS.datosPersonales)

  if (!idGymValue || !accessToken || !refreshToken) {
    return null
  }

  const idGym = Number(idGymValue)

  if (Number.isNaN(idGym)) {
    clearStoredSession()
    return null
  }

  let permisos: string[] = []
  let datosPersonales: DatosPersonales | null = null

  if (permisosValue) {
    try {
      const parsed = JSON.parse(permisosValue)
      if (Array.isArray(parsed)) {
        permisos = parsed.filter((value): value is string => typeof value === 'string')
      }
    } catch {
      clearStoredSession()
      return null
    }
  }

  if (datosPersonalesValue) {
    try {
      datosPersonales = parseDatosPersonales(datosPersonalesValue)
    } catch {
      clearStoredSession()
      return null
    }
  }

  return {
    idGym,
    nombreGym,
    accessToken,
    refreshToken,
    permisos,
    datosPersonales,
  }
}

export function setStoredSession(session: AuthSession) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEYS.idGym, String(session.idGym))
  if (session.nombreGym) {
    window.localStorage.setItem(STORAGE_KEYS.nombreGym, session.nombreGym)
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.nombreGym)
  }
  window.localStorage.setItem(STORAGE_KEYS.accessToken, session.accessToken)
  window.localStorage.setItem(STORAGE_KEYS.refreshToken, session.refreshToken)
  window.localStorage.setItem(STORAGE_KEYS.permisos, JSON.stringify(session.permisos))
  window.localStorage.setItem(
    STORAGE_KEYS.datosPersonales,
    JSON.stringify(session.datosPersonales),
  )
}

export function clearStoredSession() {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(STORAGE_KEYS.idGym)
  window.localStorage.removeItem(STORAGE_KEYS.nombreGym)
  window.localStorage.removeItem(STORAGE_KEYS.accessToken)
  window.localStorage.removeItem(STORAGE_KEYS.refreshToken)
  window.localStorage.removeItem(STORAGE_KEYS.permisos)
  window.localStorage.removeItem(STORAGE_KEYS.datosPersonales)
}
