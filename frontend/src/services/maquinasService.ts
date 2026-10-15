import type { MaquinaDto, MaquinaInsertDto, MaquinaUpdateDto } from '../types/maquina'
import { apiClient } from './apiClient'

export const maquinasService = {
  async getAll() {
    const response = await apiClient.get<MaquinaDto[]>('/Maquina')
    return response.data
  },

  async create(dto: MaquinaInsertDto) {
    const response = await apiClient.post<MaquinaDto>('/Maquina', dto)
    return response.data
  },

  async update(idMaquina: number, dto: MaquinaUpdateDto) {
    const response = await apiClient.put<MaquinaDto>(`/Maquina/${idMaquina}`, dto)
    return response.data
  },

  async delete(idMaquina: number) {
    const response = await apiClient.delete<MaquinaDto>(`/Maquina/${idMaquina}`)
    return response.data
  },
}
