import type {
  EjercicioDto,
  EjercicioInsertDto,
  EjercicioUpdateDto,
  GrupoMuscularDto,
  TipoEjercicioDto,
} from '../types/ejercicio'
import type { EquipamientoDto } from '../types/equipamiento'
import type { MaquinaDto } from '../types/maquina'
import { apiClient } from './apiClient'

export const ejerciciosService = {
  async getAll() {
    const response = await apiClient.get<EjercicioDto[]>('/Ejercicio')
    return response.data
  },

  async create(dto: EjercicioInsertDto) {
    const response = await apiClient.post<EjercicioDto>('/Ejercicio', dto)
    return response.data
  },

  async update(idEjercicio: number, dto: EjercicioUpdateDto) {
    const response = await apiClient.put<EjercicioDto>(`/Ejercicio/${idEjercicio}`, dto)
    return response.data
  },

  async delete(idEjercicio: number) {
    const response = await apiClient.delete<EjercicioDto>(`/Ejercicio/${idEjercicio}`)
    return response.data
  },

  async getGruposMusculares() {
    const response = await apiClient.get<GrupoMuscularDto[]>('/GrupoMuscular')
    return response.data
  },

  async getTiposEjercicio() {
    const response = await apiClient.get<TipoEjercicioDto[]>('/TipoEjercicio')
    return response.data
  },

  async getMaquinas() {
    const response = await apiClient.get<MaquinaDto[]>('/Maquina')
    return response.data
  },

  async getEquipamientos() {
    const response = await apiClient.get<EquipamientoDto[]>('/Equipamiento')
    return response.data
  },
}
