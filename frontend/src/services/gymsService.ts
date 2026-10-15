import { apiClient } from './apiClient'
import type { GymPublico } from '../types/gym'
import type { GymOnboardingRequest, GymOnboardingResponse } from '../types/gymOnboarding'

export interface GymSubscription {
  idGym: number
  payPalSubscriptionId: string | null
  estadoSuscripcionPayPal: string | null
  estadoSuscripcionTexto: string
  mensajeCliente: string
  importeMensual: number
  moneda: string
  fechaProximoPagoUtc: string | null
  fechaAccesoHastaUtc: string | null
  fechaEstadoSuscripcionUtc: string | null
  fechaUltimaVerificacionPayPalUtc: string | null
  accesoBloqueadoPorSuscripcion: boolean
  puedeCancelar: boolean
  puedeReactivar: boolean
  puedeVolverASuscribirse: boolean
  motivoAccionDeshabilitada: string | null
}

export interface PayPalConfig {
  clientId: string
  planId: string
  currency: string
}

export const gymsService = {
  async getActiveGyms() {
    const response = await apiClient.get<GymPublico[]>('/Gyms/activos')
    return response.data
  },

  async registrarGymOnboarding(payload: GymOnboardingRequest) {
    const response = await apiClient.post<GymOnboardingResponse>('/Gyms/onboarding', payload, {
      skipGymId: true,
    })

    return response.data
  },

  async getMiSuscripcion() {
    const response = await apiClient.get<GymSubscription>('/Gyms/mi-suscripcion')
    return response.data
  },

  async actualizarMiSuscripcion() {
    const response = await apiClient.post<GymSubscription>('/Gyms/mi-suscripcion/actualizar')
    return response.data
  },

  async cancelarMiSuscripcion() {
    const response = await apiClient.post<GymSubscription>('/Gyms/mi-suscripcion/cancelar')
    return response.data
  },

  async reactivarMiSuscripcion() {
    const response = await apiClient.post<GymSubscription>('/Gyms/mi-suscripcion/reactivar')
    return response.data
  },

  async getResuscripcionConfig() {
    const response = await apiClient.get<PayPalConfig>('/Gyms/mi-suscripcion/resuscripcion/config')
    return response.data
  },

  async confirmarResuscripcion(payPalSubscriptionId: string) {
    const response = await apiClient.post<GymSubscription>(
      '/Gyms/mi-suscripcion/resuscripcion/confirmar',
      { payPalSubscriptionId },
    )
    return response.data
  },
}
