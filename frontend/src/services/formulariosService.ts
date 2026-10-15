import type { Formulario } from '../types/formulario'
import { apiClient } from './apiClient'

export const formulariosService = {
  async getAll() {
    const response = await apiClient.get<Formulario[]>('/Formulario')
    return response.data
  },
}
