import axios from 'axios'
import { getStoredSession } from '../utils/authStorage'

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipGymId?: boolean
  }

  export interface InternalAxiosRequestConfig {
    skipGymId?: boolean
  }
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
})

apiClient.interceptors.request.use((config) => {
  const session = getStoredSession()

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }

  if (session?.idGym && !config.skipGymId) {
    config.headers['X-Gym-Id'] = String(session.idGym)
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const code = error?.response?.data?.code

    if (
      code === 'SUBSCRIPTION_ACCESS_BLOCKED' &&
      window.location.pathname !== '/gimnasio/mi-suscripcion'
    ) {
      window.location.assign('/gimnasio/mi-suscripcion')
    }

    return Promise.reject(error)
  },
)
