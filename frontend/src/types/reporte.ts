export interface ReporteFiltro {
  fechaDesde?: string
  fechaHasta?: string
}

export interface ReportesResumen {
  totalReservas: number
  promedioOcupacion: number
  horarioMasDemandado: string | null
  horarioMenosUtilizado: string | null
  sociosRiesgoAlto: number
  sociosRiesgoMedio: number
  sociosSinRutinaActiva: number
  ingresoCuotasMesActual: number
}

export interface OcupacionHoraria {
  dia: string
  rangoHorario: string
  cupoMaximo: number
  reservas: number
  finalizados: number
  cancelados: number
  vencidos: number
  porcentajeOcupacion: number
  nivelDemanda: string
}

export interface SocioRiesgo {
  idUsuarioSocio: number
  nombreCompleto: string
  estadoSocio: string
  estadoUltimaCuota: string | null
  fechaFinUltimaCuota: string | null
  ultimoTurno: string | null
  diasSinAsistir: number | null
  turnosFinalizadosPeriodo: number
  turnosCanceladosOVencidosPeriodo: number
  rutinasActivas: number
  montoUltimaCuotaVencida: number
  nivelRiesgo: string
  recomendacion: string
}

export interface CuotaSocio {
  idCuota: number
  idUsuario: number
  plan: string
  fechaInicioPeriodo: string
  fechaFinPeriodo: string
  monto: number
  estadoCuota: string
  fechaPago: string | null
}

export type EstadoTurnoReporte = 'EnCurso' | 'Cancelado' | 'Finalizado' | 'Vencido'

export interface FlujoReservasProfesor {
  dia: string
  idUsuarioResponsable: number
  profesor: string
  estadoTurno: EstadoTurnoReporte
  cantidad: number
}

export interface ReportesGimnasio {
  resumen: ReportesResumen
  ocupacionHoraria: OcupacionHoraria[]
  sociosRiesgo: SocioRiesgo[]
  sociosSeguimiento: SocioRiesgo[]
  flujoReservasProfesor: FlujoReservasProfesor[]
}
