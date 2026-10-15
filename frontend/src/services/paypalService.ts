import { apiClient } from './apiClient'

export interface PayPalConfig {
  clientId: string
  planId: string
  currency: string
}

export interface PayPalSubscriptionStatus {
  subscriptionId: string
  status: string
  isApproved: boolean
  isActive: boolean
  nextBillingTimeUtc?: string | null
  statusUpdateTimeUtc?: string | null
  lastVerificationPayPalUtc: string
}

export const paypalService = {
  async getConfig() {
    const response = await apiClient.get<PayPalConfig>('/PayPal/config', {
      skipGymId: true,
    })

    return response.data
  },

  async getSubscriptionStatus(subscriptionId: string) {
    const response = await apiClient.get<PayPalSubscriptionStatus>(
      `/PayPal/subscriptions/${encodeURIComponent(subscriptionId)}`,
      {
        skipGymId: true,
      },
    )

    return response.data
  },
}
