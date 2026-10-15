import type {
  EquipamientoDto,
  EquipamientoInsertDto,
  EquipamientoUpdateDto,
} from '../types/equipamiento'
import { apiClient } from './apiClient'

export const equipamientosService = {
  async getAll() {
    const response = await apiClient.get<EquipamientoDto[]>('/Equipamiento')
    return response.data
  },

  async create(dto: EquipamientoInsertDto) {
    const response = await apiClient.post<EquipamientoDto>('/Equipamiento', dto)
    return response.data
  },

  async update(idEquipamiento: number, dto: EquipamientoUpdateDto) {
    const response = await apiClient.put<EquipamientoDto>(
      `/Equipamiento/${idEquipamiento}`,
      dto,
    )
    return response.data
  },

  async delete(idEquipamiento: number) {
    const response = await apiClient.delete<EquipamientoDto>(`/Equipamiento/${idEquipamiento}`)
    return response.data
  },
}
