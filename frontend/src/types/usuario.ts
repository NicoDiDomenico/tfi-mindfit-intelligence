export type GeneroResponsable = 'Masculino' | 'Femenino' | 'Otro' | 'NoEspecifica'

export interface PermisoDto {
  idPermiso: number
  codigo: string
  descripcion: string | null
}

export interface GrupoDto {
  idGrupo: number
  nombre: string
  descripcion: string | null
  permisos: PermisoDto[]
}

export interface ResponsableGridDto {
  idUsuario: number
  username: string
  nombreCompleto: string | null
  email: string | null
  nombreGrupo: string[]
}

export interface PersonaResponsableDto {
  idUsuario: number
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  tipoDocumento: string
  nroDocumento: string
  genero: GeneroResponsable | null
  fechaNacimiento: string | null
}

export interface UsuarioResponsableDto {
  idUsuario: number
  username: string
  fechaRegistro: string
  tipoPersona: 'Responsable' | string
  personaResponsable: PersonaResponsableDto | null
  personaSocio: null
  grupos: GrupoDto[]
}

export interface PersonaResponsablePayload {
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  tipoDocumento: string
  nroDocumento: string
  genero: GeneroResponsable | null
  fechaNacimiento: string | null
}

export interface UsuarioResponsableInsertDto {
  username: string
  password: string
  tipoPersona: 'Responsable'
  personaResponsable: PersonaResponsablePayload
  personaSocio: null
  idGrupos: number[]
}

export interface UsuarioResponsableUpdateDto {
  username: string
  tipoPersona: 'Responsable'
  personaResponsable: PersonaResponsablePayload
  personaSocio: null
  idGrupos: number[]
}

export interface ChangePasswordRequestDto {
  currentPassword: string
  newPassword: string
}
