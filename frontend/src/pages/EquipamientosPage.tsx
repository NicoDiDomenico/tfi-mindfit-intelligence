import { useCallback, useEffect, useMemo, useState } from 'react'
import { BackToGymLink } from '../components/BackToHomeLink'
import { FormAlertModal } from '../components/FormAlertModal'
import { useAuth } from '../hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'
import { equipamientosService } from '../services/equipamientosService'
import type {
  EquipamientoDto,
  EquipamientoInsertDto,
  EquipamientoUpdateDto,
} from '../types/equipamiento'
import { getApiErrorMessage } from '../utils/apiError'

const ACTION_PERMISSIONS = {
  crear: 'CREAR_EQUIPAMIENTO',
  editar: 'EDITAR_EQUIPAMIENTO',
  eliminar: 'ELIMINAR_EQUIPAMIENTO',
} as const

const SEARCH_OPTIONS = [
  { value: 'nombreEquipo', label: 'Nombre' },
  { value: 'costoAdquisicion', label: 'Costo' },
  { value: 'pesoFijoKg', label: 'Peso fijo' },
] as const

const EMPTY_FORM = {
  nombreEquipo: '',
  costoAdquisicion: '',
  pesoFijoKg: '',
}

type EquipamientoFormState = typeof EMPTY_FORM
type SearchField = (typeof SEARCH_OPTIONS)[number]['value']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatWeight(value: number) {
  return `${value.toLocaleString('es-AR')} kg`
}

function createFormStateFromEquipamiento(
  equipamiento: EquipamientoDto,
): EquipamientoFormState {
  return {
    nombreEquipo: equipamiento.nombreEquipo,
    costoAdquisicion: String(equipamiento.costoAdquisicion),
    pesoFijoKg: equipamiento.pesoFijoKg === null ? '' : String(equipamiento.pesoFijoKg),
  }
}

function parsePositiveDecimal(value: string) {
  const normalizedValue = value.trim().replace(',', '.')
  const parsedValue = Number(normalizedValue)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

function getValidationErrors(formState: EquipamientoFormState) {
  const errors: string[] = []
  const nombreEquipo = formState.nombreEquipo.trim()
  const costoAdquisicion = parsePositiveDecimal(formState.costoAdquisicion)
  const pesoFijoKg = formState.pesoFijoKg.trim()
    ? parsePositiveDecimal(formState.pesoFijoKg)
    : null

  if (!nombreEquipo) {
    errors.push('El nombre del equipamiento es obligatorio.')
  }

  if (nombreEquipo.length > 100) {
    errors.push('El nombre del equipamiento no puede superar los 100 caracteres.')
  }

  if (costoAdquisicion === null || costoAdquisicion <= 0) {
    errors.push('El costo de adquisicion debe ser mayor a 0.')
  }

  if (formState.pesoFijoKg.trim() && (pesoFijoKg === null || pesoFijoKg <= 0)) {
    errors.push('El peso fijo debe ser mayor a 0.')
  }

  return errors
}

function buildPayload(
  formState: EquipamientoFormState,
): EquipamientoInsertDto | EquipamientoUpdateDto {
  const costoAdquisicion = parsePositiveDecimal(formState.costoAdquisicion) ?? 0
  const pesoFijoKg = formState.pesoFijoKg.trim()
    ? parsePositiveDecimal(formState.pesoFijoKg)
    : null

  return {
    nombreEquipo: formState.nombreEquipo.trim(),
    costoAdquisicion,
    pesoFijoKg,
  }
}

function getSearchableValue(equipamiento: EquipamientoDto, field: SearchField) {
  if (field === 'pesoFijoKg') {
    return equipamiento.pesoFijoKg === null ? '' : String(equipamiento.pesoFijoKg)
  }

  return String(equipamiento[field] ?? '')
    .trim()
    .toLocaleLowerCase('es-AR')
}

export function EquipamientosPage() {
  const { session } = useAuth()
  const userPermissions = session?.permisos ?? []
  const [equipamientos, setEquipamientos] = useState<EquipamientoDto[]>([])
  const [selectedEquipamientoId, setSelectedEquipamientoId] = useState<number | null>(null)
  const [formState, setFormState] = useState<EquipamientoFormState>(EMPTY_FORM)
  const [searchField, setSearchField] = useState<SearchField>('nombreEquipo')
  const [searchValue, setSearchValue] = useState('')
  const [isSearchAutofillGuardEnabled, setIsSearchAutofillGuardEnabled] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const canCreate = userPermissions.includes(ACTION_PERMISSIONS.crear)
  const canEdit = userPermissions.includes(ACTION_PERMISSIONS.editar)
  const canDelete = userPermissions.includes(ACTION_PERMISSIONS.eliminar)
  const isEditing = selectedEquipamientoId !== null
  const canSubmitCurrentMode = isEditing ? canEdit : canCreate

  const selectedEquipamiento = useMemo(
    () =>
      equipamientos.find(
        (equipamiento) => equipamiento.idEquipamiento === selectedEquipamientoId,
      ) ?? null,
    [equipamientos, selectedEquipamientoId],
  )

  const searchPlaceholder = useMemo(() => {
    const selectedOption = SEARCH_OPTIONS.find((option) => option.value === searchField)
    const selectedLabel = selectedOption?.label.toLocaleLowerCase('es-AR') ?? ''

    return `Filtrar por ${selectedLabel}`
  }, [searchField])

  const visibleEquipamientos = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLocaleLowerCase('es-AR')

    if (!normalizedSearch) {
      return equipamientos
    }

    return equipamientos.filter((equipamiento) =>
      getSearchableValue(equipamiento, searchField).includes(normalizedSearch),
    )
  }, [equipamientos, searchField, searchValue])

  const loadEquipamientos = useCallback(async () => {
    setIsInitialLoading(true)
    setLoadError('')

    try {
      const response = await equipamientosService.getAll()
      setEquipamientos(response)
    } catch (requestError) {
      setLoadError(
        getApiErrorMessage(
          requestError,
          'No pudimos cargar los equipamientos. Intenta nuevamente.',
        ),
      )
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadData() {
      if (isActive) {
        await loadEquipamientos()
      }
    }

    void loadData()

    return () => {
      isActive = false
    }
  }, [loadEquipamientos])

  function startCreateMode() {
    setSelectedEquipamientoId(null)
    setFormState(EMPTY_FORM)
    setError('')
    setSuccess('')
    setDeleteError('')
    setIsDeleteModalOpen(false)
  }

  function selectEquipamiento(equipamiento: EquipamientoDto) {
    setSelectedEquipamientoId(equipamiento.idEquipamiento)
    setFormState(createFormStateFromEquipamiento(equipamiento))
    setError('')
    setSuccess('')
    setDeleteError('')
    setIsDeleteModalOpen(false)
  }

  function updateFormField(field: keyof EquipamientoFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit() {
    if (isSaving || !canSubmitCurrentMode) {
      return
    }

    const validationErrors = getValidationErrors(formState)

    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '))
      setSuccess('')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = buildPayload(formState)

      if (isEditing && selectedEquipamientoId) {
        const updatedEquipamiento = await equipamientosService.update(
          selectedEquipamientoId,
          payload,
        )

        setEquipamientos((current) =>
          current.map((equipamiento) =>
            equipamiento.idEquipamiento === updatedEquipamiento.idEquipamiento
              ? updatedEquipamiento
              : equipamiento,
          ),
        )
        setSelectedEquipamientoId(updatedEquipamiento.idEquipamiento)
        setFormState(createFormStateFromEquipamiento(updatedEquipamiento))
        setSuccess('Equipamiento actualizado correctamente.')
      } else {
        const createdEquipamiento = await equipamientosService.create(payload)

        setEquipamientos((current) => {
          const withoutDuplicate = current.filter(
            (equipamiento) =>
              equipamiento.idEquipamiento !== createdEquipamiento.idEquipamiento,
          )

          return [...withoutDuplicate, createdEquipamiento]
        })
        setSelectedEquipamientoId(createdEquipamiento.idEquipamiento)
        setFormState(createFormStateFromEquipamiento(createdEquipamiento))
        setSuccess('Equipamiento creado correctamente.')
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isEditing
            ? 'No pudimos actualizar el equipamiento. Revisa los datos e intenta nuevamente.'
            : 'No pudimos crear el equipamiento. Revisa los datos e intenta nuevamente.',
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!selectedEquipamientoId || isDeleting || !canDelete) {
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      await equipamientosService.delete(selectedEquipamientoId)
      setEquipamientos((current) =>
        current.filter(
          (equipamiento) => equipamiento.idEquipamiento !== selectedEquipamientoId,
        ),
      )
      setIsDeleteModalOpen(false)
      startCreateMode()
      setSuccess('Equipamiento eliminado correctamente.')
    } catch (requestError) {
      setDeleteError(
        getApiErrorMessage(
          requestError,
          'No pudimos eliminar el equipamiento seleccionado.',
        ),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AppLayout>
      <main className="equipamientos-page">
        <section className="equipamientos-intro">
          <div>
            <span className="section-kicker">Gestionar gimnasio / Equipamientos</span>
            <h1 className="dashboard-title">Equipamientos</h1>
            <p className="dashboard-copy">
              Administra el inventario de equipamientos del gimnasio y sus datos operativos.
            </p>
          </div>
          <BackToGymLink />
        </section>

        {isInitialLoading ? <p className="inicio-status">Cargando equipamientos...</p> : null}
        {!isInitialLoading && loadError ? (
          <p className="inicio-status inicio-status--error">{loadError}</p>
        ) : null}

        {!isInitialLoading && !loadError ? (
          <section className="equipamientos-workspace">
            <div className="equipamientos-panel equipamientos-panel--form">
              <div className="equipamientos-panel__header">
                <div>
                  <span className="section-kicker">{isEditing ? 'Edición' : 'Alta'}</span>
                  <h2>{isEditing ? 'Editar equipamiento' : 'Crear equipamiento'}</h2>
                </div>
                {isEditing ? (
                  <span className="equipamientos-id">ID {selectedEquipamientoId}</span>
                ) : null}
              </div>

              {error ? <FormAlertModal type="error" message={error} /> : null}
              {success ? <FormAlertModal type="success" message={success} /> : null}

              <div className="equipamientos-form-grid">
                <label className="field-group">
                  <span className="field-label">Nombre del equipo</span>
                  <input
                    className="field-input"
                    value={formState.nombreEquipo}
                    maxLength={100}
                    onChange={(event) => updateFormField('nombreEquipo', event.target.value)}
                    disabled={isSaving || isDeleting}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Costo de adquisicion</span>
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.costoAdquisicion}
                    onChange={(event) =>
                      updateFormField('costoAdquisicion', event.target.value)
                    }
                    disabled={isSaving || isDeleting}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Peso fijo kg</span>
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.pesoFijoKg}
                    onChange={(event) => updateFormField('pesoFijoKg', event.target.value)}
                    disabled={isSaving || isDeleting}
                    placeholder="Opcional"
                  />
                </label>
              </div>

              <div className="equipamientos-form-actions">
                {canSubmitCurrentMode ? (
                  <button
                    className="submit-button equipamientos-submit"
                    type="button"
                    disabled={isSaving || isDeleting}
                    onClick={() => void handleSubmit()}
                  >
                    {isSaving ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
                  </button>
                ) : null}

                {canCreate ? (
                  <button
                    className="ghost-button equipamientos-secondary-action"
                    type="button"
                    disabled={isSaving || isDeleting}
                    onClick={startCreateMode}
                  >
                    Nuevo
                  </button>
                ) : null}

                {isEditing && canDelete ? (
                  <button
                    className="ghost-button equipamientos-danger-action"
                    type="button"
                    disabled={!selectedEquipamientoId || isDeleting}
                    onClick={() => {
                      setDeleteError('')
                      setIsDeleteModalOpen(true)
                    }}
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>
            </div>

            <aside className="equipamientos-panel equipamientos-panel--grid">
              <div className="equipamientos-panel__header">
                <div>
                  <span className="section-kicker">LISTADO</span>
                  <h2>Inventario</h2>
                </div>
                <span className="usuarios-count">{visibleEquipamientos.length}</span>
              </div>

              <div
                className="equipamientos-grid-filters"
                aria-label="Filtros de equipamientos"
              >
                <input
                  type="text"
                  name="equipamientos-filter-decoy-user"
                  autoComplete="username"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="autofill-decoy"
                />
                <input
                  type="password"
                  name="equipamientos-filter-decoy-password"
                  autoComplete="current-password"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="autofill-decoy"
                />
                <label className="field-group equipamientos-filter-field">
                  <select
                    className="field-input"
                    value={searchField}
                    onChange={(event) => setSearchField(event.target.value as SearchField)}
                  >
                    {SEARCH_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-group equipamientos-filter-field equipamientos-filter-field--search">
                  <input
                    className="field-input"
                    type="text"
                    name="equipamientos-filter-query"
                    autoComplete="one-time-code"
                    readOnly={isSearchAutofillGuardEnabled}
                    value={searchValue}
                    onMouseDown={() => setIsSearchAutofillGuardEnabled(false)}
                    onFocus={() => setIsSearchAutofillGuardEnabled(false)}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder={searchPlaceholder}
                  />
                </label>
              </div>

              <div className="equipamientos-table-wrap">
                <table className="socios-table equipamientos-table">
                  <thead>
                    <tr>
                      <th aria-label="Seleccion" />
                      <th>Equipo</th>
                      <th>Costo</th>
                      <th>Peso fijo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEquipamientos.length === 0 ? (
                      <tr>
                        <td className="socios-empty" colSpan={4}>
                          {equipamientos.length === 0
                            ? 'No hay equipamientos cargados para administrar.'
                            : 'No encontramos equipamientos para el filtro actual.'}
                        </td>
                      </tr>
                    ) : (
                      visibleEquipamientos.map((equipamiento) => {
                        const isSelected =
                          equipamiento.idEquipamiento === selectedEquipamientoId

                        return (
                          <tr
                            key={equipamiento.idEquipamiento}
                            className={
                              isSelected ? 'socios-row socios-row--selected' : 'socios-row'
                            }
                            onClick={() => selectEquipamiento(equipamiento)}
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
                            <td data-label="Equipo" className="socios-cell">
                              <strong>{equipamiento.nombreEquipo}</strong>
                            </td>
                            <td data-label="Costo" className="socios-cell">
                              {formatCurrency(equipamiento.costoAdquisicion)}
                            </td>
                            <td data-label="Peso fijo" className="socios-cell">
                              {equipamiento.pesoFijoKg === null ? (
                                '-'
                              ) : (
                                <span className="equipamientos-weight">
                                  {formatWeight(equipamiento.pesoFijoKg)}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </aside>
          </section>
        ) : null}

        {isDeleteModalOpen && selectedEquipamiento ? (
          <div className="consultar-backdrop" role="presentation">
            <section
              className="consultar-modal eliminar-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="eliminar-equipamiento-title"
            >
              <header className="consultar-header eliminar-modal__header">
                <div>
                  <h2 id="eliminar-equipamiento-title">Confirmar eliminacion</h2>
                  <div className="consultar-meta">
                    <span className="consultar-status consultar-status--danger">Definitiva</span>
                    <span>ID: {selectedEquipamiento.idEquipamiento}</span>
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
                  <p className="eliminar-modal__label">Equipamiento seleccionado</p>
                  <h3>{selectedEquipamiento.nombreEquipo}</h3>
                  <p className="eliminar-modal__copy">
                    Esta accion eliminara el equipamiento seleccionado. La grilla se
                    actualizara cuando el backend confirme la operacion.
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
                  {isDeleting ? 'Eliminando...' : 'Confirmar eliminacion'}
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </main>
    </AppLayout>
  )
}
