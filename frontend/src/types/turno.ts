export interface TurnoDetalle {
  idTurno: number
  nombreDia: string
  fecha: string
  cupos: string
  hora: string
  entrenador: string
  socio: string
  estadoTurno: string
}

export interface ValidarIngresoRequest {
  dniSocio: string
}

export interface ValidarIngresoResponse {
  message: string
}

export interface TurnoHistorialItem {
  idTurno: number
  fechaAlta: string
  estadoTurno: string
  horaDesde: string
  horaHasta: string
  nombreDia: string
  nombreResponsable: string
  apellidoResponsable: string
}

export interface GrillaDiaRangoHorarioResponsable {
  idUsuarioResponsable: number
  nombre: string
  apellido: string
  observaciones: string | null
}

export interface GrillaDiaRangoHorario {
  idDiaRangoHorario: number
  cupoActual: number
  cupoMaximo: number
  activo: boolean
  horaDesde: string
  horaHasta: string
  nombreDia: string
  responsables: GrillaDiaRangoHorarioResponsable[]
}

export interface TurnoInsertRequest {
  idUsuarioResponsable: number
  idUsuarioSocio: number
  fecha: string
  idDiaRangoHorario: number
}
