import axios from 'axios'
import type {
  GrillaDiaRangoHorario,
  TurnoDetalle,
  TurnoHistorialItem,
  TurnoInsertRequest,
  ValidarIngresoRequest,
  ValidarIngresoResponse,
} from '../types/turno'
import { apiClient } from './apiClient'

export const turnosService = {
  async cancelarTurnoAsistente(idTurno: number) {
    await apiClient.patch(`/Turno/asistente/cancelar/${idTurno}`)
  },

  async cancelarTurnoSocio(idTurno: number) {
    await apiClient.patch(`/Turno/socio/cancelar/${idTurno}`)
  },

  async procesarTurnosVencidos() {
    await apiClient.patch('/Turno/procesar-turnos-vencidos')
  },

  async getSocioTurnos(idUsuarioSocio: number) {
    try {
      const response = await apiClient.get<TurnoHistorialItem[]>(`/Turno/asistente/${idUsuarioSocio}`)

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []
      }

      throw error
    }
  },

  async getTurnosSocioLogueado() {
    try {
      const response = await apiClient.get<TurnoHistorialItem[]>('/Turno/socio')

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []
      }

      throw error
    }
  },

  async getDisponibilidadPorDia(fecha: string) {
    const response = await apiClient.get<GrillaDiaRangoHorario[]>('/DiaRangoHorario/grilla-por-dia', {
      params: { fecha },
    })

    return response.data
  },

  async registrarTurnoAsistente(request: TurnoInsertRequest) {
    const response = await apiClient.post<TurnoHistorialItem>('/Turno/asistente/registrar', request)

    return response.data
  },

  async registrarTurnoSocio(request: TurnoInsertRequest) {
    const response = await apiClient.post<TurnoHistorialItem>('/Turno/socio/registrar', request)

    return response.data
  },

  async getInicioGridByDate(fecha: string) {
    try {
      const response = await apiClient.get<TurnoDetalle[]>('/Turno/inicio/grilla-fecha', {
        params: { fecha },
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []
      }

      throw error
    }
  },

  async validarIngreso(request: ValidarIngresoRequest) {
    const response = await apiClient.post<ValidarIngresoResponse>('/Turno/validar-ingreso', request)

    return response.data
  },
}
