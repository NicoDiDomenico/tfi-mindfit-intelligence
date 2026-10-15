import type { CuotaSocio, ReporteFiltro, ReportesGimnasio } from '../types/reporte'
import { apiClient } from './apiClient'

function cleanParams<T extends object>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  )
}

export const reportesService = {
  async getReportesGimnasio(filtros: ReporteFiltro) {
    const response = await apiClient.get<ReportesGimnasio>('/Reporte/gimnasio', {
      params: cleanParams(filtros),
    })
    return response.data
  },

  async getCuotasSocio(idUsuario: number) {
    const response = await apiClient.get<CuotaSocio[]>(`/Cuota/socio/${idUsuario}`)
    return response.data
  },
}
