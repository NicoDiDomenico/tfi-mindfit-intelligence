import axios from 'axios'

const DEFAULT_LOGIN_ERROR = 'Verifica tus credenciales e intenta nuevamente.'
const DEFAULT_GYMS_ERROR =
  'No pudimos cargar los gimnasios activos. Revisa la conexion con el backend.'
const DEFAULT_FORGOT_PASSWORD_ERROR =
  'No pudimos procesar la recuperacion en este momento. Intenta nuevamente en unos minutos.'
const DEFAULT_RESET_PASSWORD_ERROR =
  'No pudimos restablecer tu contrasena. Revisa el enlace o intenta solicitar uno nuevo.'
const DEFAULT_FORMULARIOS_ERROR =
  'No pudimos cargar los accesos habilitados. Intenta nuevamente en unos minutos.'
const DEFAULT_TURNOS_ERROR =
  'No pudimos cargar los turnos del dia. Intenta nuevamente en unos minutos.'
const DEFAULT_SOCIOS_ERROR =
  'No pudimos cargar la lista de socios. Revisa la conexion con el backend e intenta nuevamente.'
const DEFAULT_SOCIO_DELETE_ERROR =
  'No pudimos completar la baja del socio. Intenta nuevamente en unos minutos.'
const DEFAULT_SOCIO_TURNOS_ERROR =
  'No pudimos cargar el historial de turnos del socio. Intenta nuevamente en unos minutos.'
const DEFAULT_CANCELAR_TURNO_ERROR =
  'No pudimos cancelar el turno seleccionado. Intenta nuevamente en unos minutos.'
const DEFAULT_DISPONIBILIDAD_TURNO_ERROR =
  'No pudimos cargar la disponibilidad de turnos. Intenta nuevamente en unos minutos.'
const DEFAULT_REGISTRAR_TURNO_ERROR =
  'No pudimos registrar el turno. Revisa los datos seleccionados e intenta nuevamente.'

function getMessageFromObject(data: Record<string, unknown>) {
  const message = data.message

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (Array.isArray(message)) {
    const normalizedMessage = message.filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    )

    if (normalizedMessage.length > 0) {
      return normalizedMessage.join(' ')
    }
  }

  const errors = data.errors

  if (Array.isArray(errors)) {
    const normalizedErrors = errors.filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    )

    if (normalizedErrors.length > 0) {
      return normalizedErrors.join(' ')
    }
  }

  const title = data.title

  if (typeof title === 'string' && title.trim()) {
    return title
  }

  return null
}

export function getApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (!axios.isAxiosError(error)) {
    return fallbackMessage
  }

  const responseData = error.response?.data

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData
  }

  if (Array.isArray(responseData)) {
    const normalizedErrors = responseData.filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    )

    if (normalizedErrors.length > 0) {
      return normalizedErrors.join(' ')
    }
  }

  if (responseData && typeof responseData === 'object') {
    const objectMessage = getMessageFromObject(responseData as Record<string, unknown>)

    if (objectMessage) {
      return objectMessage
    }
  }

  return fallbackMessage
}

export function getLoginErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return DEFAULT_LOGIN_ERROR
    }

    if (error.response.status >= 400) {
      return DEFAULT_LOGIN_ERROR
    }
  }

  return DEFAULT_LOGIN_ERROR
}

export function getGymsErrorMessage(error: unknown) {
  return getApiErrorMessage(error, DEFAULT_GYMS_ERROR)
}

export function getForgotPasswordErrorMessage(error: unknown) {
  return getApiErrorMessage(error, DEFAULT_FORGOT_PASSWORD_ERROR)
}

export function getResetPasswordErrorMessage(error: unknown) {
  return getApiErrorMessage(error, DEFAULT_RESET_PASSWORD_ERROR)
}

export function getInicioErrorMessage(error: unknown, resource: 'formularios' | 'turnos') {
  return getApiErrorMessage(
    error,
    resource === 'formularios' ? DEFAULT_FORMULARIOS_ERROR : DEFAULT_TURNOS_ERROR,
  )
}

export function getSociosErrorMessage(error: unknown) {
  return getApiErrorMessage(error, DEFAULT_SOCIOS_ERROR)
}

export function getSocioDeleteErrorMessage(error: unknown) {
  return getApiErrorMessage(error, DEFAULT_SOCIO_DELETE_ERROR)
}

export function getSocioTurnosErrorMessage(error: unknown) {
  return getApiErrorMessage(error, DEFAULT_SOCIO_TURNOS_ERROR)
}

export function getCancelarTurnoErrorMessage(error: unknown) {
  return getApiErrorMessage(error, DEFAULT_CANCELAR_TURNO_ERROR)
}

export function getDisponibilidadTurnoErrorMessage(error: unknown) {
  return getApiErrorMessage(error, DEFAULT_DISPONIBILIDAD_TURNO_ERROR)
}

export function getRegistrarTurnoErrorMessage(error: unknown) {
  return getApiErrorMessage(error, DEFAULT_REGISTRAR_TURNO_ERROR)
}
