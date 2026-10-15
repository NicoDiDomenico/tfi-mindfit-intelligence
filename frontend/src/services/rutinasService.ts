import type {
  DiaDto,
  EntrenadorRutinaDto,
  EjercicioDto,
  GrupoMuscularDto,
  RangoHorarioDto,
  RutinaBloquesUpdateDto,
  RutinaDto,
  RutinaEstadoUpdateDto,
  RutinaEstadoUpdateResponse,
  RutinaHistorialDetalleDto,
  RutinaHistorialResumenDto,
  RutinaIaRecomendacionDto,
  RutinaIaRecomendacionRequestDto,
  SocioTurnoDto,
} from '../types/rutina'
import { apiClient } from './apiClient'

export const rutinasService = {
  async getRangosHorarios() {
    const response = await apiClient.get<RangoHorarioDto[]>('/RangoHorario')
    return response.data
  },

  async getEntrenadoresPorHorario(idRangoHorario: number) {
    const response = await apiClient.get<EntrenadorRutinaDto[]>(
      `/Rutina/entrenadores/${idRangoHorario}`,
    )
    return response.data
  },

  async getSociosPorEntrenadorYHorario(
    idUsuarioResponsable: number,
    idRangoHorario: number,
  ) {
    const response = await apiClient.get<SocioTurnoDto[]>(
      `/Rutina/entrenadores/${idUsuarioResponsable}/socios/${idRangoHorario}`,
    )
    return response.data
  },

  async getDias() {
    const response = await apiClient.get<DiaDto[]>('/Dia/dias')
    return response.data
  },

  async getRutinaPorSocioYDia(idUsuarioSocio: number, idDia: number) {
    const response = await apiClient.get<RutinaDto>(
      `/Rutina/socios/${idUsuarioSocio}/rutinas`,
      {
        params: { idDia },
      },
    )
    return response.data
  },

  async getGruposMusculares() {
    const response = await apiClient.get<GrupoMuscularDto[]>('/GrupoMuscular')
    return response.data
  },

  async getEjerciciosPorGrupoMuscular(idGrupoMuscular: number) {
    const response = await apiClient.get<EjercicioDto[]>('/Ejercicio', {
      params: { idGrupoMuscular },
    })
    return response.data
  },

  async getEjercicios() {
    const response = await apiClient.get<EjercicioDto[]>('/Ejercicio')
    return response.data
  },

  async guardarBloquesRutina(idRutina: number, payload: RutinaBloquesUpdateDto) {
    const response = await apiClient.put<RutinaDto>(`/Rutina/${idRutina}/bloques`, payload)
    return response.data
  },

  async sugerirRutinaConIa(
    idRutina: number,
    payload: RutinaIaRecomendacionRequestDto,
  ) {
    const response = await apiClient.post<RutinaIaRecomendacionDto>(
      `/Rutina/${idRutina}/ia/recomendacion`,
      payload,
    )
    return response.data
  },

  async cambiarEstadoRutina(idRutina: number, payload: RutinaEstadoUpdateDto) {
    const response = await apiClient.patch<RutinaEstadoUpdateResponse>(
      `/Rutina/${idRutina}/estado`,
      payload,
    )
    return response.data
  },

  async getHistorialRutina(idRutina: number) {
    const response = await apiClient.get<RutinaHistorialResumenDto[]>(
      `/Rutina/${idRutina}/historial`,
    )
    return response.data
  },

  async getDetalleHistorial(idRutina: number, idRutinaHistorial: number) {
    const response = await apiClient.get<RutinaHistorialDetalleDto>(
      `/Rutina/${idRutina}/historial/${idRutinaHistorial}`,
    )
    return response.data
  },

  async restaurarRutinaDesdeHistorial(idRutina: number, idRutinaHistorial: number) {
    const response = await apiClient.post<RutinaDto>(
      `/Rutina/${idRutina}/historial/${idRutinaHistorial}/restaurar`,
    )
    return response.data
  },
}
