import { useEffect, useState } from 'react'
import { gymsService } from '../services/gymsService'
import type { GymPublico } from '../types/gym'
import { getGymsErrorMessage } from '../utils/apiError'

export function useActiveGyms() {
  const [gyms, setGyms] = useState<GymPublico[]>([])
  const [isLoadingGyms, setIsLoadingGyms] = useState(true)
  const [gymsError, setGymsError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadGyms() {
      try {
        const response = await gymsService.getActiveGyms()

        if (!isMounted) {
          return
        }

        setGyms(response)
        setGymsError('')
      } catch (error) {
        if (!isMounted) {
          return
        }

        setGyms([])
        setGymsError(getGymsErrorMessage(error))
      } finally {
        if (isMounted) {
          setIsLoadingGyms(false)
        }
      }
    }

    loadGyms()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    gyms,
    gymsError,
    isLoadingGyms,
  }
}
