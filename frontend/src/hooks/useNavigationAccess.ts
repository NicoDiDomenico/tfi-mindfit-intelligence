import { useEffect, useState } from 'react'
import { formulariosService } from '../services/formulariosService'
import type { Formulario } from '../types/formulario'
import { isSocioRole } from '../utils/authRoles'
import { getInicioErrorMessage } from '../utils/apiError'
import { getVisibleNavigationItems } from '../utils/navigationPermissions'
import { useAuth } from './useAuth'

interface UseNavigationAccessOptions {
  enabled?: boolean
}

export function useNavigationAccess(options: UseNavigationAccessOptions = {}) {
  const { enabled = true } = options
  const { session } = useAuth()
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const canLoadNavigation =
    enabled && Boolean(session) && !isSocioRole(session?.datosPersonales?.rol)

  useEffect(() => {
    if (!canLoadNavigation) {
      return
    }

    let isActive = true

    async function loadFormularios() {
      setIsLoading(true)
      setError('')

      try {
        const response = await formulariosService.getAll()
        if (isActive) setFormularios(response)
      } catch (loadError) {
        if (isActive) setError(getInicioErrorMessage(loadError, 'formularios'))
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadFormularios()

    return () => {
      isActive = false
    }
  }, [canLoadNavigation, session?.idGym])

  return {
    items: canLoadNavigation ? getVisibleNavigationItems(session?.permisos ?? [], formularios) : [],
    isLoading: canLoadNavigation ? isLoading : false,
    error: canLoadNavigation ? error : '',
  }
}
