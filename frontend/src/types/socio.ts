export type EstadoSocio = 'Nuevo' | 'Actualizado' | 'Suspendido' | 'Eliminado' | string
export type PlanSocio = 'Mensual' | 'Anual' | string
export type GeneroSocio = 'Masculino' | 'Femenino' | 'Otro' | string

export interface SocioGridItem {
  idUsuario: number
  username: string
  fechaRegistro: string
  nombreCompleto: string | null
  email: string | null
  estadoSocio: EstadoSocio
  plan: string | null
  fechaFinPeriodo: string | null
  nroDocumento: string | null
}

export interface ProcesarEliminacionesResponse {
  sociosElimidados: number
  idsProcesados: number[]
  mensaje: string
  fechaEjecucion: string
}

export interface DiaDto {
  idDia: number
  nombreDia: string
}

export interface PerfilIADto {
  objetivoPrincipal: string | null
  nivelExperiencia: string | null
  ejerciciosPreferidos: string | null
  ejerciciosAEvitar: string | null
  disponibilidadHoraria: string | null
  motivacionPersonal: string | null
  lesionesLimitaciones: string | null
  condicionesMedicasRelevantes: string | null
  intensidadPreferida: string | null
  duracionSesionMinutos: number | null
  notasEntrenador: string | null
  planAlimenticio?: string | null
  fechaActualizacion: string | null
}

export interface RutinaDto {
  idRutina: number
  idPersonaSocio: number
  idDia: number
  fechaModificacion: string
  activo: boolean
}

export interface CuotaDto {
  idCuota: number
  idUsuario: number
  plan: PlanSocio
  fechaInicioPeriodo: string
  fechaFinPeriodo: string
  monto: number
  estadoCuota: string
  fechaPago: string | null
}

export interface GrupoDto {
  idGrupo: number
  nombre: string
  descripcion: string | null
}

export interface PersonaSocioDto {
  idUsuario: number
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  tipoDocumento: string
  nroDocumento: string
  genero: GeneroSocio | null
  fechaNacimiento: string | null
  obraSocial: string | null
  estadoSocio: EstadoSocio
  fechaInicioActividades: string | null
  fechaNotificacion: string | null
  respuestaNotificacion: boolean | null
  pregunta: string | null
  respuesta: string | null
  rutinas: RutinaDto[]
  cuotas: CuotaDto[] | null
  perfilIA: PerfilIADto | null
}

export interface UsuarioDto {
  idUsuario: number
  username: string
  fechaRegistro: string
  tipoPersona: string
  personaResponsable: unknown | null
  personaSocio: PersonaSocioDto | null
  grupos: GrupoDto[]
}

export interface PerfilIAUpdateDto {
  objetivoPrincipal: string | null
  nivelExperiencia: string | null
  ejerciciosPreferidos: string | null
  ejerciciosAEvitar: string | null
  disponibilidadHoraria: string | null
  motivacionPersonal: string | null
  lesionesLimitaciones: string | null
  condicionesMedicasRelevantes: string | null
  intensidadPreferida: string | null
  duracionSesionMinutos: number | null
  notasEntrenador: string | null
  planAlimenticio?: string | null
}

export type PerfilIAInsertDto = PerfilIAUpdateDto

export interface CuotaInsertDto {
  plan: PlanSocio
  monto: number
}

export interface CuotaUpdateDto {
  renueva: boolean
  plan: PlanSocio | null
  monto: number | null
}

export interface PersonaSocioUpdateDto {
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  tipoDocumento: string
  nroDocumento: string
  genero: GeneroSocio | null
  fechaNacimiento: string | null
  obraSocial: string | null
  fechaNotificacion: string | null
  respuestaNotificacion: boolean | null
  pregunta: string | null
  respuesta: string | null
  diasActivosIds: number[]
  perfilIA: PerfilIAUpdateDto | null
  cuota: CuotaUpdateDto
}

export interface UsuarioUpdateDto {
  username: string
  tipoPersona: string
  personaResponsable: null
  personaSocio: PersonaSocioUpdateDto
  idGrupos: number[]
}

export interface PersonaSocioInsertDto {
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  tipoDocumento: string
  nroDocumento: string
  genero: GeneroSocio | null
  fechaNacimiento: string | null
  obraSocial: string | null
  fechaNotificacion: string | null
  respuestaNotificacion: boolean | null
  pregunta: string | null
  respuesta: string | null
  diasActivosIds: number[]
  cuota: CuotaInsertDto
  perfilIA: PerfilIAInsertDto | null
}

export interface UsuarioInsertDto {
  username: string
  password: string
  tipoPersona: 'Socio'
  personaResponsable: null
  personaSocio: PersonaSocioInsertDto
  idGrupos: number[]
}

export interface ChangePasswordRequestDto {
  currentPassword: string
  newPassword: string
}
