import type { GrupoDto, GrupoPayloadDto, PermisoDto } from '../types/permiso'
import { apiClient } from './apiClient'

export const permisosService = {
  async getPermisos() {
    const response = await apiClient.get<PermisoDto[]>('/Permiso')
    return response.data
  },

  async getGrupos() {
    const response = await apiClient.get<GrupoDto[]>('/Grupo')
    return response.data
  },

  async createGrupo(dto: GrupoPayloadDto) {
    const response = await apiClient.post<GrupoDto>('/Grupo', dto)
    return response.data
  },

  async updateGrupo(idGrupo: number, dto: GrupoPayloadDto) {
    const response = await apiClient.put<GrupoDto>(`/Grupo/${idGrupo}`, dto)
    return response.data
  },

  async deleteGrupo(idGrupo: number) {
    const response = await apiClient.delete<GrupoDto>(`/Grupo/${idGrupo}`)
    return response.data
  },
}
