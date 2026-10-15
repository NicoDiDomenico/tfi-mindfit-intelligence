import type {
  AuditoriaEventoDto,
  AuditoriaEventoFiltro,
  AuditoriaReporteResumenDto,
  AuditoriaResultadoDto,
  AuditoriaSesionDto,
  AuditoriaSesionFiltro,
} from '../types/auditoria'
import { apiClient } from './apiClient'

function cleanParams<T extends object>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  )
}

export const auditoriaService = {
  async getEventos(filtro: AuditoriaEventoFiltro) {
    const response = await apiClient.get<AuditoriaResultadoDto<AuditoriaEventoDto>>(
      '/Auditoria/eventos',
      {
        params: cleanParams(filtro),
      },
    )
    return response.data
  },

  async getEventoDetalle(idAuditoriaEvento: number) {
    const response = await apiClient.get<AuditoriaEventoDto>(
      `/Auditoria/eventos/${idAuditoriaEvento}`,
    )
    return response.data
  },

  async getSesiones(filtro: AuditoriaSesionFiltro) {
    const response = await apiClient.get<AuditoriaResultadoDto<AuditoriaSesionDto>>(
      '/Auditoria/sesiones',
      {
        params: cleanParams(filtro),
      },
    )
    return response.data
  },

  async getResumen(fechaDesde?: string, fechaHasta?: string) {
    const response = await apiClient.get<AuditoriaReporteResumenDto>('/Auditoria/resumen', {
      params: cleanParams({ fechaDesde, fechaHasta }),
    })
    return response.data
  },
}
