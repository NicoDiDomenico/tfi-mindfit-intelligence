import type { SocioRecomendacion } from '../types/socioInsights'
import { apiClient } from './apiClient'

export const socioInsightsService = {
  async getRecomendaciones() {
    const response = await apiClient.get<SocioRecomendacion[]>('/SocioInsights/recomendaciones')

    return response.data
  },
}
