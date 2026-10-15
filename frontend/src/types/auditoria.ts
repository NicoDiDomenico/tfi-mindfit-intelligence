export interface AuditoriaEventoFiltro {
  fechaDesde?: string
  fechaHasta?: string
  idUsuario?: number
  entidad?: string
  idEntidad?: number
  accion?: string
  resultado?: string
  pagina?: number
  tamanoPagina?: number
}

export interface AuditoriaSesionFiltro {
  fechaDesde?: string
  fechaHasta?: string
  idUsuario?: number
  usernameIntentado?: string
  tipoEvento?: string
  resultado?: string
  pagina?: number
  tamanoPagina?: number
}

export interface AuditoriaEventoDto {
  idAuditoriaEvento: number
  fechaHoraUtc: string
  idUsuario: number | null
  username: string | null
  idGimnasio: number | null
  entidad: string
  idEntidad: number | null
  accion: string
  endpoint: string | null
  metodoHttp: string | null
  ipAddress: string | null
  userAgent: string | null
  valoresOriginalesJson: string | null
  valoresNuevosJson: string | null
  cambiosJson: string | null
  resultado: string
  mensaje: string | null
}

export interface AuditoriaSesionDto {
  idAuditoriaSesion: number
  fechaHoraUtc: string
  idUsuario: number | null
  usernameIntentado: string | null
  idGimnasio: number | null
  tipoEvento: string
  resultado: string
  ipAddress: string | null
  userAgent: string | null
  motivoFallo: string | null
}

export interface AuditoriaResultadoDto<T> {
  items: T[]
  total: number
  pagina: number
  tamanoPagina: number
}

export interface AuditoriaResumenItemDto {
  clave: string
  total: number
}

export interface AuditoriaReporteResumenDto {
  totalEventos: number
  totalSesiones: number
  eventosPorAccion: AuditoriaResumenItemDto[]
  sesionesPorTipo: AuditoriaResumenItemDto[]
}
