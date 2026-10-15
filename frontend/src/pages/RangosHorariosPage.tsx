import { useCallback, useEffect, useMemo, useState } from 'react'
import { BackToGymLink } from '../components/BackToHomeLink'
import { FormAlertModal } from '../components/FormAlertModal'
import { useAuth } from '../hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'
import { rangosHorariosService } from '../services/rangosHorariosService'
import type {
  EntrenadorDto,
  GrillaDiaRangoHorarioDto,
  GrillaDiaRangoHorarioResponsableDto,
} from '../types/rangoHorario'
import { getApiErrorMessage } from '../utils/apiError'

const ACTION_PERMISSIONS = {
  modificar: 'MODIFICAR_DIA_RH',
  quitar: 'QUITAR_ENTRENADOR_DIA_RH',
} as const

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] as const

const DISPLAY_DAYS: Record<(typeof DAYS)[number], string> = {
  Lunes: 'Lunes',
  Martes: 'Martes',
  Miercoles: 'Miercoles',
  Jueves: 'Jueves',
  Viernes: 'Viernes',
  Sabado: 'Sabado',
  Domingo: 'Domingo',
}

const EMPTY_FORM = {
  activo: false,
  cupoMaximo: '',
  idUsuarioResponsable: '',
}

type DayName = (typeof DAYS)[number]
type RangoHorarioFormState = typeof EMPTY_FORM

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
}

function normalizeDayName(value: string): DayName | null {
  const normalizedValue = normalizeText(value)
  return DAYS.find((day) => normalizeText(day) === normalizedValue) ?? null
}

function getTodayDayName(): DayName {
  const today = new Date().getDay()
  const jsDayToName: Record<number, DayName> = {
    0: 'Domingo',
    1: 'Lunes',
    2: 'Martes',
    3: 'Miercoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sabado',
  }

  return jsDayToName[today]
}

function createFormStateFromRango(rango: GrillaDiaRangoHorarioDto): RangoHorarioFormState {
  return {
    activo: rango.activo,
    cupoMaximo: String(rango.cupoMaximo),
    idUsuarioResponsable: '',
  }
}

function formatTime(value: string) {
  if (!value) {
    return '-'
  }

  return value.slice(0, 5)
}

function formatRangoTime(rango: GrillaDiaRangoHorarioDto) {
  return `${formatTime(rango.horaDesde)} - ${formatTime(rango.horaHasta)}`
}

function getEntrenadorName(entrenador: EntrenadorDto | GrillaDiaRangoHorarioResponsableDto) {
  return `${entrenador.nombre} ${entrenador.apellido}`.trim()
}

function parseRequiredInteger(value: string) {
  const parsedValue = Number(value)
  return Number.isInteger(parsedValue) ? parsedValue : null
}

function getValidationErrors(formState: RangoHorarioFormState) {
  const errors: string[] = []
  const cupoMaximo = parseRequiredInteger(formState.cupoMaximo)

  if (cupoMaximo === null || cupoMaximo < 1) {
    errors.push('El cupo maximo debe ser un numero entero mayor o igual a 1.')
  }

  return errors
}

function getErrorMessages(error: unknown, fallbackMessage: string) {
  const message = getApiErrorMessage(error, fallbackMessage)

  return message
    .split(/[.\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function getRangosByDay(
  rangos: GrillaDiaRangoHorarioDto[],
  day: DayName,
  hideInactive: boolean,
) {
  return rangos
    .filter((rango) => normalizeDayName(rango.nombreDia) === day)
    .filter((rango) => !hideInactive || rango.activo)
    .sort((first, second) => first.horaDesde.localeCompare(second.horaDesde))
}

export function RangosHorariosPage() {
  const { session } = useAuth()
  const userPermissions = session?.permisos ?? []
  const [rangos, setRangos] = useState<GrillaDiaRangoHorarioDto[]>([])
  const [entrenadores, setEntrenadores] = useState<EntrenadorDto[]>([])
  const [selectedDay, setSelectedDay] = useState<DayName>(getTodayDayName)
  const [selectedRangoId, setSelectedRangoId] = useState<number | null>(null)
  const [formState, setFormState] = useState<RangoHorarioFormState>(EMPTY_FORM)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteTarget, setDeleteTarget] =
    useState<GrillaDiaRangoHorarioResponsableDto | null>(null)
  const [errorModalMessages, setErrorModalMessages] = useState<string[]>([])
  const [hideInactiveRangos, setHideInactiveRangos] = useState(true)
  const [isBulkDayModalOpen, setIsBulkDayModalOpen] = useState(false)
  const [isUpdatingDay, setIsUpdatingDay] = useState(false)
  const [bulkDayError, setBulkDayError] = useState('')

  const canModify = userPermissions.includes(ACTION_PERMISSIONS.modificar)
  const canDelete = userPermissions.includes(ACTION_PERMISSIONS.quitar)

  const rangosBySelectedDay = useMemo(
    () => getRangosByDay(rangos, selectedDay, false),
    [rangos, selectedDay],
  )

  const visibleRangosBySelectedDay = useMemo(
    () => getRangosByDay(rangos, selectedDay, hideInactiveRangos),
    [hideInactiveRangos, rangos, selectedDay],
  )

  const activeRangosBySelectedDay = useMemo(
    () => rangosBySelectedDay.filter((rango) => rango.activo),
    [rangosBySelectedDay],
  )

  const inactiveRangosBySelectedDay = useMemo(
    () => rangosBySelectedDay.filter((rango) => !rango.activo),
    [rangosBySelectedDay],
  )

  const isBulkDayActivation = activeRangosBySelectedDay.length === 0
  const bulkDayTargetRangos = isBulkDayActivation
    ? inactiveRangosBySelectedDay
    : activeRangosBySelectedDay
  const bulkDayActionLabel = isBulkDayActivation ? 'Activar dia' : 'Desactivar'
  const bulkDayProgressLabel = isBulkDayActivation ? 'Activando...' : 'Desactivando...'
  const bulkDayStatusLabel = isBulkDayActivation ? 'inactivos para activar' : 'activos para desactivar'

  const selectedRango = useMemo(
    () =>
      visibleRangosBySelectedDay.find((rango) => rango.idDiaRangoHorario === selectedRangoId) ??
      null,
    [selectedRangoId, visibleRangosBySelectedDay],
  )

  const assignedResponsables = useMemo(
    () => selectedRango?.responsables ?? [],
    [selectedRango],
  )

  const availableEntrenadores = useMemo(() => {
    const assignedIds = new Set(
      assignedResponsables.map((responsable) => responsable.idUsuarioResponsable),
    )

    return entrenadores.filter((entrenador) => !assignedIds.has(entrenador.idUsuario))
  }, [assignedResponsables, entrenadores])

  const hasRangoChanges = useMemo(() => {
    if (!selectedRango) {
      return false
    }

    const cupoMaximo = parseRequiredInteger(formState.cupoMaximo)

    return formState.activo !== selectedRango.activo || cupoMaximo !== selectedRango.cupoMaximo
  }, [formState.activo, formState.cupoMaximo, selectedRango])

  const loadData = useCallback(
    async (options?: {
      keepLoadingState?: boolean
      targetDay?: DayName
      preferredRangoId?: number | null
      hideInactive?: boolean
      fallbackToFirst?: boolean
    }) => {
      if (!options?.keepLoadingState) {
        setIsInitialLoading(true)
      }

      setLoadError('')

      try {
        const [rangosResponse, entrenadoresResponse] = await Promise.all([
          rangosHorariosService.getGrilla(),
          rangosHorariosService.getEntrenadores(),
        ])
        const dayToSelect = options?.targetDay ?? getTodayDayName()
        const preferredRangoId = options?.preferredRangoId ?? null
        const shouldHideInactive = options?.hideInactive ?? false
        const shouldFallbackToFirst = options?.fallbackToFirst ?? true
        const visibleRangos = getRangosByDay(rangosResponse, dayToSelect, shouldHideInactive)
        const nextRango =
          visibleRangos.find((rango) => rango.idDiaRangoHorario === preferredRangoId) ??
          (shouldFallbackToFirst ? visibleRangos[0] : null) ??
          null

        setRangos(rangosResponse)
        setEntrenadores(entrenadoresResponse)
        setSelectedDay(dayToSelect)
        setSelectedRangoId(nextRango?.idDiaRangoHorario ?? null)
        setFormState(nextRango ? createFormStateFromRango(nextRango) : EMPTY_FORM)

        return rangosResponse
      } catch (requestError) {
        setLoadError(
          getApiErrorMessage(
            requestError,
            'No pudimos cargar los rangos horarios. Intenta nuevamente.',
          ),
        )

        return []
      } finally {
        setIsInitialLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    let isActive = true

    async function loadInitialData() {
      if (isActive) {
        await loadData({
          targetDay: getTodayDayName(),
          preferredRangoId: null,
          hideInactive: true,
        })
      }
    }

    void loadInitialData()

    return () => {
      isActive = false
    }
  }, [loadData])

  function selectDay(day: DayName) {
    const nextRango = getRangosByDay(rangos, day, hideInactiveRangos)[0] ?? null

    setSelectedDay(day)
    setSelectedRangoId(nextRango?.idDiaRangoHorario ?? null)
    setFormState(nextRango ? createFormStateFromRango(nextRango) : EMPTY_FORM)
    setFormError('')
    setSuccess('')
    setDeleteError('')
    setIsDeleteModalOpen(false)
    setIsBulkDayModalOpen(false)
  }

  function selectRango(rango: GrillaDiaRangoHorarioDto) {
    setSelectedRangoId(rango.idDiaRangoHorario)
    setFormState(createFormStateFromRango(rango))
    setFormError('')
    setSuccess('')
    setDeleteError('')
    setIsDeleteModalOpen(false)
    setIsBulkDayModalOpen(false)
  }

  function updateFormField(field: keyof RangoHorarioFormState, value: string | boolean) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function toggleInactiveVisibility() {
    const shouldHideInactive = !hideInactiveRangos

    setHideInactiveRangos(shouldHideInactive)
    setFormError('')
    setSuccess('')

    if (shouldHideInactive && selectedRango && !selectedRango.activo) {
      setSelectedRangoId(null)
      setFormState(EMPTY_FORM)
    }
  }

  async function handleConfirmBulkDayAction() {
    if (isUpdatingDay || !canModify || bulkDayTargetRangos.length === 0) {
      return
    }

    setIsUpdatingDay(true)
    setBulkDayError('')
    setFormError('')
    setSuccess('')

    try {
      await Promise.all(
        bulkDayTargetRangos.map((rango) =>
          rangosHorariosService.actualizarRango(rango.idDiaRangoHorario, {
            activo: isBulkDayActivation,
            cupoMaximo: rango.cupoMaximo,
          }),
        ),
      )

      const preferredRangoId = isBulkDayActivation
        ? (bulkDayTargetRangos[0]?.idDiaRangoHorario ?? null)
        : hideInactiveRangos
          ? null
          : selectedRangoId

      await loadData({
        keepLoadingState: true,
        targetDay: selectedDay,
        preferredRangoId,
        hideInactive: hideInactiveRangos,
        fallbackToFirst: false,
      })

      if (hideInactiveRangos && !isBulkDayActivation) {
        setSelectedRangoId(null)
        setFormState(EMPTY_FORM)
      }

      setIsBulkDayModalOpen(false)
      setSuccess(
        isBulkDayActivation
          ? 'Rangos horarios del dia activados correctamente.'
          : 'Rangos horarios del dia desactivados correctamente.',
      )
    } catch (requestError) {
      setBulkDayError(
        getApiErrorMessage(
          requestError,
          isBulkDayActivation
            ? 'No pudimos activar todos los rangos horarios del dia.'
            : 'No pudimos desactivar todos los rangos horarios del dia.',
        ),
      )

      await loadData({
        keepLoadingState: true,
        targetDay: selectedDay,
        preferredRangoId: hideInactiveRangos ? null : selectedRangoId,
        hideInactive: hideInactiveRangos,
        fallbackToFirst: false,
      })
    } finally {
      setIsUpdatingDay(false)
    }
  }

  async function handleSubmit() {
    if (isSaving || !canModify || !selectedRango) {
      return
    }

    const validationErrors = getValidationErrors(formState)

    if (validationErrors.length > 0) {
      setFormError(validationErrors.join(' '))
      setSuccess('')
      return
    }

    const cupoMaximo = parseRequiredInteger(formState.cupoMaximo) ?? selectedRango.cupoMaximo
    const selectedEntrenadorId = formState.idUsuarioResponsable
      ? Number(formState.idUsuarioResponsable)
      : null
    const shouldAssignEntrenador = selectedEntrenadorId !== null

    if (!hasRangoChanges && !shouldAssignEntrenador) {
      setFormError('No hay cambios para guardar.')
      setSuccess('')
      return
    }

    setIsSaving(true)
    setFormError('')
    setSuccess('')
    setErrorModalMessages([])

    try {
      const requests: Promise<void>[] = []

      if (hasRangoChanges) {
        requests.push(
          rangosHorariosService.actualizarRango(selectedRango.idDiaRangoHorario, {
            activo: formState.activo,
            cupoMaximo,
          }),
        )
      }

      if (shouldAssignEntrenador) {
        requests.push(
          rangosHorariosService.asignarResponsable({
            idDiaRangoHorario: selectedRango.idDiaRangoHorario,
            idUsuarioResponsable: selectedEntrenadorId,
            observaciones: null,
          }),
        )
      }

      await Promise.all(requests)
      await loadData({
        keepLoadingState: true,
        targetDay: selectedDay,
        preferredRangoId: selectedRango.idDiaRangoHorario,
        hideInactive: hideInactiveRangos,
        fallbackToFirst: false,
      })
      setSuccess('Rango horario actualizado correctamente.')
    } catch (requestError) {
      setErrorModalMessages(
        getErrorMessages(
          requestError,
          'No pudimos guardar los cambios del rango horario. Revisa los datos e intenta nuevamente.',
        ),
      )
      await loadData({
        keepLoadingState: true,
        targetDay: selectedDay,
        preferredRangoId: selectedRango.idDiaRangoHorario,
        hideInactive: hideInactiveRangos,
        fallbackToFirst: false,
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!selectedRango || !deleteTarget || isDeleting || !canDelete) {
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      await rangosHorariosService.quitarResponsable({
        idDiaRangoHorario: selectedRango.idDiaRangoHorario,
        idUsuarioResponsable: deleteTarget.idUsuarioResponsable,
      })
      await loadData({
        keepLoadingState: true,
        targetDay: selectedDay,
        preferredRangoId: selectedRango.idDiaRangoHorario,
        hideInactive: hideInactiveRangos,
        fallbackToFirst: false,
      })
      setIsDeleteModalOpen(false)
      setDeleteTarget(null)
      setSuccess('Entrenador quitado correctamente.')
    } catch (requestError) {
      setDeleteError(
        getApiErrorMessage(
          requestError,
          'No pudimos quitar el entrenador seleccionado.',
        ),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const selectedEntrenadorName = deleteTarget ? getEntrenadorName(deleteTarget) : ''

  return (
    <AppLayout>
      <main className="equipamientos-page rangos-horarios-page">
        <section className="equipamientos-intro rangos-horarios-intro">
          <div>
            <span className="section-kicker">Gestionar gimnasio / Rangos horarios</span>
            <h1 className="dashboard-title">Rangos horarios</h1>
            <p className="dashboard-copy">
              Administra disponibilidad semanal, cupos y entrenadores asignados.
            </p>
          </div>
          <BackToGymLink />
        </section>

        {isInitialLoading ? <p className="inicio-status">Cargando rangos horarios...</p> : null}
        {!isInitialLoading && loadError ? (
          <p className="inicio-status inicio-status--error">{loadError}</p>
        ) : null}

        {!isInitialLoading && !loadError ? (
          <section className="rangos-horarios-workspace">
            <div className="equipamientos-panel equipamientos-panel--form rangos-horarios-panel rangos-horarios-panel--form">
              <div className="equipamientos-panel__header rangos-horarios-panel__header">
                <div>
                  <span className="section-kicker">Formulario</span>
                  <h2>Editar rango</h2>
                </div>
                {selectedRango ? (
                  <span className="equipamientos-id">ID {selectedRango.idDiaRangoHorario}</span>
                ) : null}
              </div>

              {formError ? <FormAlertModal type="error" message={formError} /> : null}
              {success ? <FormAlertModal type="success" message={success} /> : null}

              {selectedRango ? (
                <div className="equipamientos-form-grid rangos-horarios-form-grid">
                  <div className="rangos-horarios-selected">
                    <span>{DISPLAY_DAYS[selectedDay]}</span>
                    <strong>{formatRangoTime(selectedRango)}</strong>
                  </div>

                  <label className="maquinas-switch rangos-horarios-switch">
                    <input
                      type="checkbox"
                      checked={formState.activo}
                      onChange={(event) => updateFormField('activo', event.target.checked)}
                      disabled={isSaving || isDeleting || !canModify}
                    />
                    <span>
                      <strong>Activo</strong>
                      <small>{formState.activo ? 'Si' : 'No'}</small>
                    </span>
                  </label>

                  <label className="field-group">
                    <span className="field-label">Cupo maximo</span>
                    <input
                      className="field-input"
                      type="number"
                      min="1"
                      step="1"
                      value={formState.cupoMaximo}
                      onChange={(event) => updateFormField('cupoMaximo', event.target.value)}
                      disabled={isSaving || isDeleting || !canModify}
                    />
                  </label>

                  <label className="field-group">
                    <span className="field-label">Entrenador</span>
                    <select
                      className="field-input"
                      value={formState.idUsuarioResponsable}
                      onChange={(event) =>
                        updateFormField('idUsuarioResponsable', event.target.value)
                      }
                      disabled={isSaving || isDeleting || !canModify}
                    >
                      <option value="">Sin nueva asignacion</option>
                      {availableEntrenadores.map((entrenador) => (
                        <option key={entrenador.idUsuario} value={entrenador.idUsuario}>
                          {getEntrenadorName(entrenador)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <div
                  className="equipamientos-form-grid rangos-horarios-form-grid"
                  aria-hidden="true"
                >
                  <div className="rangos-horarios-selected rangos-horarios-selected--empty">
                    <span>{DISPLAY_DAYS[selectedDay]}</span>
                    <strong>-</strong>
                  </div>

                  <label className="maquinas-switch rangos-horarios-switch">
                    <input type="checkbox" disabled />
                    <span>
                      <strong>Activo</strong>
                      <small>No</small>
                    </span>
                  </label>

                  <label className="field-group">
                    <span className="field-label">Cupo maximo</span>
                    <input className="field-input" type="number" value="0" disabled readOnly />
                  </label>

                  <label className="field-group">
                    <span className="field-label">Entrenador</span>
                    <select className="field-input" disabled>
                      <option value="">Sin nueva asignacion</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="equipamientos-form-actions">
                {canModify ? (
                  <button
                    className="submit-button equipamientos-submit"
                    type="button"
                    disabled={isSaving || isDeleting || isUpdatingDay || !selectedRango}
                    onClick={() => void handleSubmit()}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rangos-horarios-grid-stack">
              <aside className="equipamientos-panel equipamientos-panel--grid rangos-horarios-panel rangos-horarios-panel--rangos">
                <div className="equipamientos-panel__header rangos-horarios-panel__header">
                  <div>
                    <span className="section-kicker">Disponibilidad semanal</span>
                    <h2>Rangos del dia</h2>
                  </div>
                  <span className="usuarios-count">{visibleRangosBySelectedDay.length}</span>
                </div>

                <div className="rangos-horarios-days" aria-label="Dias de la semana">
                  {DAYS.map((day) => (
                    <button
                      className={
                        day === selectedDay
                          ? 'rangos-horarios-day rangos-horarios-day--active'
                          : 'rangos-horarios-day'
                      }
                      type="button"
                      key={day}
                      onClick={() => selectDay(day)}
                    >
                      {DISPLAY_DAYS[day]}
                    </button>
                  ))}
                </div>

                <div className="equipamientos-table-wrap rangos-horarios-table-wrap">
                  <table className="socios-table equipamientos-table rangos-horarios-table">
                    <thead>
                      <tr>
                        <th aria-label="Seleccion" />
                        <th>Horario</th>
                        <th>Cupo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRangosBySelectedDay.length === 0 ? (
                        <tr>
                          <td className="socios-empty" colSpan={4}>
                            {hideInactiveRangos
                              ? 'No hay rangos horarios activos para este dia.'
                              : 'No hay rangos horarios cargados para este dia.'}
                          </td>
                        </tr>
                      ) : (
                        visibleRangosBySelectedDay.map((rango) => {
                          const isSelected = rango.idDiaRangoHorario === selectedRangoId

                          return (
                            <tr
                              key={rango.idDiaRangoHorario}
                              className={
                                isSelected ? 'socios-row socios-row--selected' : 'socios-row'
                              }
                              onClick={() => selectRango(rango)}
                            >
                              <td data-label="Seleccion">
                                <span
                                  className={
                                    isSelected
                                      ? 'socios-radio socios-radio--selected'
                                      : 'socios-radio'
                                  }
                                  aria-hidden="true"
                                />
                              </td>
                              <td data-label="Horario" className="socios-cell">
                                <strong>{formatRangoTime(rango)}</strong>
                              </td>
                              <td data-label="Cupo" className="socios-cell">
                                {rango.cupoActual} / {rango.cupoMaximo}
                              </td>
                              <td data-label="Estado" className="socios-cell">
                                <span
                                  className={
                                    rango.activo
                                      ? 'rangos-horarios-status rangos-horarios-status--active'
                                      : 'rangos-horarios-status'
                                  }
                                >
                                  {rango.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="rangos-horarios-grid-actions">
                  <label className="rangos-horarios-filter-check">
                    <input
                      type="checkbox"
                      checked={hideInactiveRangos}
                      onChange={toggleInactiveVisibility}
                    />
                    <span>Ocultar horarios inactivos</span>
                  </label>
                  <span>
                    {hideInactiveRangos
                      ? `${visibleRangosBySelectedDay.length} activos`
                      : `${rangosBySelectedDay.length} horarios`}
                  </span>
                </div>

                {canModify ? (
                  <div className="rangos-horarios-bulk-actions">
                    <button
                      className={
                        isBulkDayActivation
                          ? 'ghost-button rangos-horarios-bulk-success'
                          : 'ghost-button rangos-horarios-bulk-danger'
                      }
                      type="button"
                      disabled={
                        isSaving ||
                        isDeleting ||
                        isUpdatingDay ||
                        bulkDayTargetRangos.length === 0
                      }
                      onClick={() => {
                        setBulkDayError('')
                        setIsBulkDayModalOpen(true)
                      }}
                    >
                      {bulkDayActionLabel}
                    </button>
                    <span>
                      {bulkDayTargetRangos.length} {bulkDayStatusLabel}
                    </span>
                  </div>
                ) : null}
              </aside>

              <aside className="equipamientos-panel equipamientos-panel--grid rangos-horarios-panel rangos-horarios-panel--responsables">
                <div className="equipamientos-panel__header rangos-horarios-panel__header">
                  <div>
                    <span className="section-kicker">Asignaciones</span>
                    <h2>Entrenadores</h2>
                  </div>
                  <span className="usuarios-count">{assignedResponsables.length}</span>
                </div>

                <div className="equipamientos-table-wrap rangos-horarios-table-wrap">
                  <table className="socios-table equipamientos-table rangos-horarios-responsables-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        {canDelete ? <th>Accion</th> : null}
                      </tr>
                    </thead>
                    <tbody>
                      {!selectedRango ? (
                        <tr>
                          <td className="socios-empty" colSpan={canDelete ? 2 : 1}>
                            Selecciona un rango horario.
                          </td>
                        </tr>
                      ) : assignedResponsables.length === 0 ? (
                        <tr>
                          <td className="socios-empty" colSpan={canDelete ? 2 : 1}>
                            No hay entrenadores asignados.
                          </td>
                        </tr>
                      ) : (
                        assignedResponsables.map((responsable) => (
                          <tr key={responsable.idUsuarioResponsable}>
                            <td data-label="Nombre" className="socios-cell">
                              <strong>{getEntrenadorName(responsable)}</strong>
                            </td>
                            {canDelete ? (
                              <td data-label="Accion" className="socios-cell">
                                <button
                                  className="ghost-button rangos-horarios-remove"
                                  type="button"
                                  disabled={isSaving || isDeleting || isUpdatingDay}
                                  onClick={() => {
                                    setDeleteTarget(responsable)
                                    setDeleteError('')
                                    setIsDeleteModalOpen(true)
                                  }}
                                >
                                  Eliminar
                                </button>
                              </td>
                            ) : null}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        {isDeleteModalOpen && selectedRango && deleteTarget ? (
          <div className="consultar-backdrop" role="presentation">
            <section
              className="consultar-modal eliminar-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="quitar-entrenador-title"
            >
              <header className="consultar-header eliminar-modal__header">
                <div>
                  <h2 id="quitar-entrenador-title">Quitar entrenador</h2>
                  <div className="consultar-meta">
                    <span className="consultar-status consultar-status--danger">Asignacion</span>
                    <span>{formatRangoTime(selectedRango)}</span>
                  </div>
                </div>
                <button
                  className="consultar-close"
                  type="button"
                  aria-label="Cerrar"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  x
                </button>
              </header>
              <div className="consultar-body eliminar-modal__body">
                <div className="eliminar-modal__content">
                  <p className="eliminar-modal__label">Entrenador seleccionado</p>
                  <h3>{selectedEntrenadorName}</h3>
                  <p className="eliminar-modal__copy">
                    Esta accion quitara al entrenador del rango horario seleccionado.
                  </p>
                  {deleteError ? <FormAlertModal type="error" message={deleteError} /> : null}
                </div>
              </div>
              <footer className="consultar-footer eliminar-modal__footer">
                <button
                  className="ghost-button consultar-footer__close"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="submit-button consultar-button--danger eliminar-modal__confirm"
                  type="button"
                  disabled={isDeleting}
                  onClick={() => void handleConfirmDelete()}
                >
                  {isDeleting ? 'Quitando...' : 'Quitar entrenador'}
                </button>
              </footer>
            </section>
          </div>
        ) : null}

        {isBulkDayModalOpen ? (
          <div className="consultar-backdrop" role="presentation">
            <section
              className="consultar-modal eliminar-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="desactivar-dia-title"
            >
              <header className="consultar-header eliminar-modal__header">
                <div>
                  <h2 id="desactivar-dia-title">{bulkDayActionLabel}</h2>
                  <div className="consultar-meta">
                    <span className="consultar-status consultar-status--danger">Masiva</span>
                    <span>{DISPLAY_DAYS[selectedDay]}</span>
                  </div>
                </div>
                <button
                  className="consultar-close"
                  type="button"
                  aria-label="Cerrar"
                  disabled={isUpdatingDay}
                  onClick={() => setIsBulkDayModalOpen(false)}
                >
                  x
                </button>
              </header>
              <div className="consultar-body eliminar-modal__body">
                <div className="eliminar-modal__content">
                  <p className="eliminar-modal__label">
                    {isBulkDayActivation ? 'Rangos inactivos' : 'Rangos activos'}
                  </p>
                  <h3>{bulkDayTargetRangos.length}</h3>
                  <p className="eliminar-modal__copy">
                    Esta accion {isBulkDayActivation ? 'activara' : 'desactivara'} todos
                    los rangos horarios {isBulkDayActivation ? 'inactivos' : 'activos'} del
                    dia seleccionado usando el endpoint de cambio de estado.
                  </p>
                  {bulkDayError ? <FormAlertModal type="error" message={bulkDayError} /> : null}
                </div>
              </div>
              <footer className="consultar-footer eliminar-modal__footer">
                <button
                  className="ghost-button consultar-footer__close"
                  type="button"
                  disabled={isUpdatingDay}
                  onClick={() => setIsBulkDayModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="submit-button consultar-button--danger eliminar-modal__confirm"
                  type="button"
                  disabled={isUpdatingDay || bulkDayTargetRangos.length === 0}
                  onClick={() => void handleConfirmBulkDayAction()}
                >
                  {isUpdatingDay ? bulkDayProgressLabel : bulkDayActionLabel}
                </button>
              </footer>
            </section>
          </div>
        ) : null}

        {errorModalMessages.length > 0 ? (
          <div className="consultar-backdrop" role="presentation">
            <section
              className="consultar-modal rangos-horarios-error-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="rangos-horarios-error-title"
            >
              <header className="consultar-header eliminar-modal__header">
                <div>
                  <h2 id="rangos-horarios-error-title">No se pudo guardar</h2>
                  <div className="consultar-meta">
                    <span className="consultar-status consultar-status--danger">Errores</span>
                  </div>
                </div>
                <button
                  className="consultar-close"
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setErrorModalMessages([])}
                >
                  x
                </button>
              </header>
              <div className="consultar-body rangos-horarios-error-modal__body">
                <ul className="rangos-horarios-error-list">
                  {errorModalMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
              <footer className="consultar-footer eliminar-modal__footer">
                <button
                  className="submit-button eliminar-modal__confirm"
                  type="button"
                  onClick={() => setErrorModalMessages([])}
                >
                  Entendido
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </main>
    </AppLayout>
  )
}
