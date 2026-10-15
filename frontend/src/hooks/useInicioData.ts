import { useCallback, useEffect, useRef, useState } from 'react'
import { formulariosService } from '../services/formulariosService'
import { turnosService } from '../services/turnosService'
import type { Formulario } from '../types/formulario'
import type { TurnoDetalle } from '../types/turno'
import { formatLocalDateForApi } from '../utils/date'
import { getInicioErrorMessage } from '../utils/apiError'

export function useInicioData() {
  const isMountedRef = useRef(true)
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [turnos, setTurnos] = useState<TurnoDetalle[]>([])
  const [isLoadingFormularios, setIsLoadingFormularios] = useState(true)
  const [isLoadingTurnos, setIsLoadingTurnos] = useState(true)
  const [formulariosError, setFormulariosError] = useState('')
  const [turnosError, setTurnosError] = useState('')
  const today = new Date()
  const fecha = formatLocalDateForApi(today)

  const refreshTurnos = useCallback(async () => {
    setIsLoadingTurnos(true)
    setTurnosError('')

    try {
      const response = await turnosService.getInicioGridByDate(fecha)
      if (isMountedRef.current) setTurnos(response)
    } catch (error) {
      if (isMountedRef.current) setTurnosError(getInicioErrorMessage(error, 'turnos'))
    } finally {
      if (isMountedRef.current) setIsLoadingTurnos(false)
    }
  }, [fecha])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadFormularios() {
      try {
        const response = await formulariosService.getAll()
        if (isActive) setFormularios(response)
      } catch (error) {
        if (isActive) setFormulariosError(getInicioErrorMessage(error, 'formularios'))
      } finally {
        if (isActive) setIsLoadingFormularios(false)
      }
    }

    void loadFormularios()
    void refreshTurnos()

    return () => {
      isActive = false
    }
  }, [refreshTurnos])

  return {
    formularios,
    turnos,
    today,
    isLoadingFormularios,
    isLoadingTurnos,
    formulariosError,
    turnosError,
    refreshTurnos,
  }
}
