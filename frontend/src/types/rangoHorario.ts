export interface GrillaDiaRangoHorarioResponsableDto {
  idUsuarioResponsable: number
  nombre: string
  apellido: string
  observaciones: string | null
}

export interface GrillaDiaRangoHorarioDto {
  idDiaRangoHorario: number
  cupoActual: number
  cupoMaximo: number
  activo: boolean
  horaDesde: string
  horaHasta: string
  nombreDia: string
  responsables: GrillaDiaRangoHorarioResponsableDto[]
}

export interface EntrenadorDto {
  idUsuario: number
  nombre: string
  apellido: string
}

export interface DiaRangoHorarioResponsableInsertDto {
  idDiaRangoHorario: number
  idUsuarioResponsable: number
  observaciones: string | null
}

export interface DiaRangoHorarioUpdateDto {
  activo: boolean
  cupoMaximo: number
}

export interface DiaRangoHorarioResponsableDeleteDto {
  idDiaRangoHorario: number
  idUsuarioResponsable: number
}
