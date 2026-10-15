import type {
  DiaRangoHorarioResponsableDeleteDto,
  DiaRangoHorarioResponsableInsertDto,
  DiaRangoHorarioUpdateDto,
  EntrenadorDto,
  GrillaDiaRangoHorarioDto,
} from '../types/rangoHorario'
import { apiClient } from './apiClient'

export const rangosHorariosService = {
  async getGrilla() {
    const response = await apiClient.get<GrillaDiaRangoHorarioDto[]>('/DiaRangoHorario/grilla')
    return response.data
  },

  async getEntrenadores() {
    const response = await apiClient.get<EntrenadorDto[]>('/PersonaResponsable/entrenadores')
    return response.data
  },

  async asignarResponsable(dto: DiaRangoHorarioResponsableInsertDto) {
    await apiClient.post('/DiaRangoHorario/asignar-responsable', dto)
  },

  async actualizarRango(idDiaRangoHorario: number, dto: DiaRangoHorarioUpdateDto) {
    await apiClient.patch(`/DiaRangoHorario/cambiar-estado/${idDiaRangoHorario}`, dto)
  },

  async quitarResponsable(dto: DiaRangoHorarioResponsableDeleteDto) {
    await apiClient.delete('/DiaRangoHorario/quitar-responsable', {
      data: dto,
    })
  },
}
