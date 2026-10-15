import { useEffect, useState } from 'react'
import { formulariosService } from '../services/formulariosService'
import type { Formulario } from '../types/formulario'
import { getApiErrorMessage } from '../utils/apiError'
import { getVisiblePermissionNavigationItems } from '../utils/navigationPermissions'
import { gimnasioMenuItems } from '../components/gimnasio/gimnasioMenuConfig'
import { useAuth } from './useAuth'

const GIMNASIO_MENU_ERROR = 'No pudimos cargar las opciones del modulo. Intenta nuevamente.'

export function useGimnasioMenu() {
  const { session } = useAuth()
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadFormularios() {
      try {
        const response = await formulariosService.getAll()
        if (isActive) setFormularios(response)
      } catch (loadError) {
        if (isActive) setError(getApiErrorMessage(loadError, GIMNASIO_MENU_ERROR))
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadFormularios()

    return () => {
      isActive = false
    }
  }, [])

  const visibleItems = getVisiblePermissionNavigationItems(
    gimnasioMenuItems,
    session?.permisos ?? [],
    formularios,
  )

  return {
    items: visibleItems,
    isLoading,
    error,
  }
}
