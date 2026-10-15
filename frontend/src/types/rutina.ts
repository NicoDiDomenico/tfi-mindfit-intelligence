export interface RangoHorarioDto {
  idRangoHorario: number
  horaDesde: string
  horaHasta: string
}

export interface EntrenadorRutinaDto {
  idUsuario: number
  nombre: string
  apellido: string
}

export interface SocioTurnoDto {
  idUsuario: number
  nombre: string
  apellido: string
}

export interface DiaDto {
  idDia: number
  nombreDia: string
}

export interface GrupoMuscularDto {
  idGrupoMuscular: number
  nombreMusculo: string
  idMapaAnatomico: string | null
}

export interface TipoEjercicioDto {
  idTipoEjercicio: number
  nombreTipo: string
}

export interface MaquinaDto {
  idMaquina: number
  nombreMaquina: string
  fechaFabricacion: string
  fechaCompra: string
  costoAdquisicion: number
  pesoMaximoLingotera: number | null
  esElectrica: boolean
}

export interface EquipamientoDto {
  idEquipamiento: number
  nombreEquipo: string
  costoAdquisicion: number
  pesoFijoKg: number | null
}

export interface EjercicioDto {
  idEjercicio: number
  descEjercicio: string
  grupoMuscular: GrupoMuscularDto
  tipoEjercicio: TipoEjercicioDto
  maquina: MaquinaDto | null
  equipamiento: EquipamientoDto | null
}

export interface CalentamientoDto {
  idCalentamiento: number
  idRutina: number
  ejercicio: EjercicioDto
  duracion: number
  orden: number
  observaciones: string | null
}

export interface EntrenamientoDto {
  idEntrenamiento: number
  idRutina: number
  ejercicio: EjercicioDto
  series: number
  repeticiones: number
  pesoAsignado: number | null
  tiempoDescansoSegundos: number | null
  orden: number
  observaciones: string | null
}

export interface EstiramientoDto {
  idEstiramiento: number
  idRutina: number
  ejercicio: EjercicioDto
  duracion: number
  orden: number
  observaciones: string | null
}

export interface RutinaDto {
  idRutina: number
  idPersonaSocio: number
  idDia: number
  fechaModificacion: string
  activo: boolean
  calentamientos: CalentamientoDto[]
  entrenamientos: EntrenamientoDto[]
  estiramientos: EstiramientoDto[]
}

export interface CalentamientoInsertDto {
  idEjercicio: number
  duracion: number
  orden: number
  observaciones: string | null
}

export interface EntrenamientoInsertDto {
  idEjercicio: number
  series: number
  repeticiones: number
  pesoAsignado: number | null
  tiempoDescansoSegundos: number | null
  orden: number
  observaciones: string | null
}

export interface EstiramientoInsertDto {
  idEjercicio: number
  duracion: number
  orden: number
  observaciones: string | null
}

export interface RutinaBloquesUpdateDto {
  calentamientos: CalentamientoInsertDto[]
  entrenamientos: EntrenamientoInsertDto[]
  estiramientos: EstiramientoInsertDto[]
}

export interface RutinaIaRecomendacionRequestDto {
  instruccionesEntrenador: string | null
}

export interface RutinaIaRecomendacionDto {
  resumen: string
  criterios: string[]
  advertencias: string[]
  propuesta: RutinaBloquesUpdateDto
}

export interface RutinaEstadoUpdateDto {
  activo: boolean
}

export interface RutinaEstadoUpdateResponse {
  mensaje: string
  rutina: RutinaDto
}

export interface RutinaHistorialResumenDto {
  idRutinaHistorial: number
  idRutina: number
  version: number
  fechaSnapshot: string
  activoSnapshot: boolean
}

export interface RutinaHistorialCalentamientoDto {
  idEjercicio: number
  duracion: number
  orden: number
  observaciones: string | null
}

export interface RutinaHistorialEntrenamientoDto {
  idEjercicio: number
  series: number
  repeticiones: number
  pesoAsignado: number | null
  tiempoDescansoSegundos: number | null
  orden: number
  observaciones: string | null
}

export interface RutinaHistorialEstiramientoDto {
  idEjercicio: number
  duracion: number
  orden: number
  observaciones: string | null
}

export interface RutinaHistorialDetalleDto {
  idRutinaHistorial: number
  idRutina: number
  version: number
  fechaSnapshot: string
  activoSnapshot: boolean
  calentamientos: RutinaHistorialCalentamientoDto[]
  entrenamientos: RutinaHistorialEntrenamientoDto[]
  estiramientos: RutinaHistorialEstiramientoDto[]
}
