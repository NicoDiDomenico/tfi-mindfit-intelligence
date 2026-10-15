export interface LoginRequest {
  username: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  tokenPlano: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface DatosPersonales {
  id: number
  nombre: string | null
  apellido: string | null
  rol: string[] | null
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  permisos: string[]
  datosPersonales: DatosPersonales
}

export interface AuthSession extends Omit<TokenResponse, 'datosPersonales'> {
  idGym: number
  nombreGym: string | null
  datosPersonales: DatosPersonales | null
}

export interface LoginCredentials extends LoginRequest {
  idGym: number
  nombreGym: string
}
