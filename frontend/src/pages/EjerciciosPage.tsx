import { useCallback, useEffect, useMemo, useState } from 'react'
import { BackToGymLink } from '../components/BackToHomeLink'
import { FormAlertModal } from '../components/FormAlertModal'
import { useAuth } from '../hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'
import { ejerciciosService } from '../services/ejerciciosService'
import type {
  EjercicioDto,
  EjercicioInsertDto,
  EjercicioUpdateDto,
  GrupoMuscularDto,
  TipoEjercicioDto,
} from '../types/ejercicio'
import type { EquipamientoDto } from '../types/equipamiento'
import type { MaquinaDto } from '../types/maquina'
import { getApiErrorMessage } from '../utils/apiError'

const ACTION_PERMISSIONS = {
  crear: 'CREAR_EJERCICIO',
  editar: 'EDITAR_EJERCICIO',
  eliminar: 'ELIMINAR_EJERCICIO',
} as const

const SEARCH_OPTIONS = [
  { value: 'descEjercicio', label: 'Descripcion' },
  { value: 'grupoMuscular', label: 'Grupo muscular' },
  { value: 'tipoEjercicio', label: 'Tipo' },
  { value: 'maquina', label: 'Maquina' },
  { value: 'equipamiento', label: 'Equipamiento' },
] as const

const EMPTY_FORM = {
  descEjercicio: '',
  idGrupoMuscular: '',
  idTipoEjercicio: '',
  idMaquina: '',
  idEquipamiento: '',
}

type EjercicioFormState = typeof EMPTY_FORM
type SearchField = (typeof SEARCH_OPTIONS)[number]['value']

function createFormStateFromEjercicio(ejercicio: EjercicioDto): EjercicioFormState {
  return {
    descEjercicio: ejercicio.descEjercicio,
    idGrupoMuscular: String(ejercicio.grupoMuscular.idGrupoMuscular),
    idTipoEjercicio: String(ejercicio.tipoEjercicio.idTipoEjercicio),
    idMaquina: ejercicio.maquina ? String(ejercicio.maquina.idMaquina) : '',
    idEquipamiento: ejercicio.equipamiento
      ? String(ejercicio.equipamiento.idEquipamiento)
      : '',
  }
}

function parseOptionalId(value: string) {
  return value ? Number(value) : null
}

function parseRequiredId(value: string) {
  return value ? Number(value) : 0
}

function getValidationErrors(formState: EjercicioFormState) {
  const errors: string[] = []
  const descEjercicio = formState.descEjercicio.trim()

  if (!descEjercicio) {
    errors.push('La descripcion del ejercicio es obligatoria.')
  }

  if (descEjercicio.length > 200) {
    errors.push('La descripcion del ejercicio no puede superar los 200 caracteres.')
  }

  if (!parseRequiredId(formState.idGrupoMuscular)) {
    errors.push('El grupo muscular es obligatorio.')
  }

  if (!parseRequiredId(formState.idTipoEjercicio)) {
    errors.push('El tipo de ejercicio es obligatorio.')
  }

  return errors
}

function buildPayload(formState: EjercicioFormState): EjercicioInsertDto | EjercicioUpdateDto {
  return {
    descEjercicio: formState.descEjercicio.trim(),
    idGrupoMuscular: parseRequiredId(formState.idGrupoMuscular),
    idTipoEjercicio: parseRequiredId(formState.idTipoEjercicio),
    idMaquina: parseOptionalId(formState.idMaquina),
    idEquipamiento: parseOptionalId(formState.idEquipamiento),
  }
}

function getSearchableValue(ejercicio: EjercicioDto, field: SearchField) {
  if (field === 'grupoMuscular') {
    return ejercicio.grupoMuscular.nombreMusculo.toLocaleLowerCase('es-AR')
  }

  if (field === 'tipoEjercicio') {
    return ejercicio.tipoEjercicio.nombreTipo.toLocaleLowerCase('es-AR')
  }

  if (field === 'maquina') {
    return ejercicio.maquina?.nombreMaquina.toLocaleLowerCase('es-AR') ?? ''
  }

  if (field === 'equipamiento') {
    return ejercicio.equipamiento?.nombreEquipo.toLocaleLowerCase('es-AR') ?? ''
  }

  return ejercicio.descEjercicio.trim().toLocaleLowerCase('es-AR')
}

function getResourceLabel(value: string | null | undefined, emptyLabel: string) {
  return value?.trim() ? value : emptyLabel
}

export function EjerciciosPage() {
  const { session } = useAuth()
  const userPermissions = session?.permisos ?? []
  const [ejercicios, setEjercicios] = useState<EjercicioDto[]>([])
  const [gruposMusculares, setGruposMusculares] = useState<GrupoMuscularDto[]>([])
  const [tiposEjercicio, setTiposEjercicio] = useState<TipoEjercicioDto[]>([])
  const [maquinas, setMaquinas] = useState<MaquinaDto[]>([])
  const [equipamientos, setEquipamientos] = useState<EquipamientoDto[]>([])
  const [selectedEjercicioId, setSelectedEjercicioId] = useState<number | null>(null)
  const [formState, setFormState] = useState<EjercicioFormState>(EMPTY_FORM)
  const [searchField, setSearchField] = useState<SearchField>('descEjercicio')
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
  const isEditing = selectedEjercicioId !== null
  const canSubmitCurrentMode = isEditing ? canEdit : canCreate

  const selectedEjercicio = useMemo(
    () => ejercicios.find((ejercicio) => ejercicio.idEjercicio === selectedEjercicioId) ?? null,
    [ejercicios, selectedEjercicioId],
  )

  const searchPlaceholder = useMemo(() => {
    const selectedOption = SEARCH_OPTIONS.find((option) => option.value === searchField)
    const selectedLabel = selectedOption?.label.toLocaleLowerCase('es-AR') ?? ''

    return `Filtrar por ${selectedLabel}`
  }, [searchField])

  const visibleEjercicios = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLocaleLowerCase('es-AR')

    if (!normalizedSearch) {
      return ejercicios
    }

    return ejercicios.filter((ejercicio) =>
      getSearchableValue(ejercicio, searchField).includes(normalizedSearch),
    )
  }, [ejercicios, searchField, searchValue])

  const loadEjerciciosData = useCallback(async () => {
    setIsInitialLoading(true)
    setLoadError('')

    try {
      const [
        ejerciciosResponse,
        gruposResponse,
        tiposResponse,
        maquinasResponse,
        equipamientosResponse,
      ] = await Promise.all([
        ejerciciosService.getAll(),
        ejerciciosService.getGruposMusculares(),
        ejerciciosService.getTiposEjercicio(),
        ejerciciosService.getMaquinas(),
        ejerciciosService.getEquipamientos(),
      ])

      setEjercicios(ejerciciosResponse)
      setGruposMusculares(gruposResponse)
      setTiposEjercicio(tiposResponse)
      setMaquinas(maquinasResponse)
      setEquipamientos(equipamientosResponse)
    } catch (requestError) {
      setLoadError(
        getApiErrorMessage(
          requestError,
          'No pudimos cargar los ejercicios. Intenta nuevamente.',
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
        await loadEjerciciosData()
      }
    }

    void loadData()

    return () => {
      isActive = false
    }
  }, [loadEjerciciosData])

  function startCreateMode() {
    setSelectedEjercicioId(null)
    setFormState(EMPTY_FORM)
    setError('')
    setSuccess('')
    setDeleteError('')
    setIsDeleteModalOpen(false)
  }

  function selectEjercicio(ejercicio: EjercicioDto) {
    setSelectedEjercicioId(ejercicio.idEjercicio)
    setFormState(createFormStateFromEjercicio(ejercicio))
    setError('')
    setSuccess('')
    setDeleteError('')
    setIsDeleteModalOpen(false)
  }

  function updateFormField(field: keyof EjercicioFormState, value: string) {
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

      if (isEditing && selectedEjercicioId) {
        const updatedEjercicio = await ejerciciosService.update(selectedEjercicioId, payload)

        setEjercicios((current) =>
          current.map((ejercicio) =>
            ejercicio.idEjercicio === updatedEjercicio.idEjercicio
              ? updatedEjercicio
              : ejercicio,
          ),
        )
        setSelectedEjercicioId(updatedEjercicio.idEjercicio)
        setFormState(createFormStateFromEjercicio(updatedEjercicio))
        setSuccess('Ejercicio actualizado correctamente.')
      } else {
        const createdEjercicio = await ejerciciosService.create(payload)

        setEjercicios((current) => {
          const withoutDuplicate = current.filter(
            (ejercicio) => ejercicio.idEjercicio !== createdEjercicio.idEjercicio,
          )

          return [...withoutDuplicate, createdEjercicio]
        })
        setSelectedEjercicioId(createdEjercicio.idEjercicio)
        setFormState(createFormStateFromEjercicio(createdEjercicio))
        setSuccess('Ejercicio creado correctamente.')
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isEditing
            ? 'No pudimos actualizar el ejercicio. Revisa los datos e intenta nuevamente.'
            : 'No pudimos crear el ejercicio. Revisa los datos e intenta nuevamente.',
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!selectedEjercicioId || isDeleting || !canDelete) {
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      await ejerciciosService.delete(selectedEjercicioId)
      setEjercicios((current) =>
        current.filter((ejercicio) => ejercicio.idEjercicio !== selectedEjercicioId),
      )
      setIsDeleteModalOpen(false)
      startCreateMode()
      setSuccess('Ejercicio eliminado correctamente.')
    } catch (requestError) {
      setDeleteError(
        getApiErrorMessage(requestError, 'No pudimos eliminar el ejercicio seleccionado.'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AppLayout>
      <main className="equipamientos-page ejercicios-page">
        <section className="equipamientos-intro ejercicios-intro">
          <div>
            <span className="section-kicker">Gestionar gimnasio / Ejercicios</span>
            <h1 className="dashboard-title">Ejercicios</h1>
            <p className="dashboard-copy">
              Administra la base de ejercicios disponible para armar rutinas y sesiones.
            </p>
          </div>
          <BackToGymLink />
        </section>

        {isInitialLoading ? <p className="inicio-status">Cargando ejercicios...</p> : null}
        {!isInitialLoading && loadError ? (
          <p className="inicio-status inicio-status--error">{loadError}</p>
        ) : null}

        {!isInitialLoading && !loadError ? (
          <section className="equipamientos-workspace ejercicios-workspace">
            <div className="equipamientos-panel equipamientos-panel--form ejercicios-panel ejercicios-panel--form">
              <div className="equipamientos-panel__header ejercicios-panel__header">
                <div>
                  <span className="section-kicker">{isEditing ? 'Edición' : 'Alta'}</span>
                  <h2>{isEditing ? 'Editar ejercicio' : 'Crear ejercicio'}</h2>
                </div>
                {isEditing ? (
                  <span className="equipamientos-id">ID {selectedEjercicioId}</span>
                ) : null}
              </div>

              {error ? <FormAlertModal type="error" message={error} /> : null}
              {success ? <FormAlertModal type="success" message={success} /> : null}

              <div className="equipamientos-form-grid ejercicios-form-grid">
                <label className="field-group">
                  <span className="field-label">Descripcion</span>
                  <input
                    className="field-input"
                    value={formState.descEjercicio}
                    maxLength={200}
                    onChange={(event) => updateFormField('descEjercicio', event.target.value)}
                    disabled={isSaving || isDeleting}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Grupo muscular</span>
                  <select
                    className="field-input"
                    value={formState.idGrupoMuscular}
                    onChange={(event) => updateFormField('idGrupoMuscular', event.target.value)}
                    disabled={isSaving || isDeleting}
                  >
                    <option value="">Seleccionar grupo</option>
                    {gruposMusculares.map((grupo) => (
                      <option key={grupo.idGrupoMuscular} value={grupo.idGrupoMuscular}>
                        {grupo.nombreMusculo}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-group">
                  <span className="field-label">Tipo de ejercicio</span>
                  <select
                    className="field-input"
                    value={formState.idTipoEjercicio}
                    onChange={(event) => updateFormField('idTipoEjercicio', event.target.value)}
                    disabled={isSaving || isDeleting}
                  >
                    <option value="">Seleccionar tipo</option>
                    {tiposEjercicio.map((tipo) => (
                      <option key={tipo.idTipoEjercicio} value={tipo.idTipoEjercicio}>
                        {tipo.nombreTipo}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-group">
                  <span className="field-label">Maquina</span>
                  <select
                    className="field-input"
                    value={formState.idMaquina}
                    onChange={(event) => updateFormField('idMaquina', event.target.value)}
                    disabled={isSaving || isDeleting}
                  >
                    <option value="">Sin maquina</option>
                    {maquinas.map((maquina) => (
                      <option key={maquina.idMaquina} value={maquina.idMaquina}>
                        {maquina.nombreMaquina}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-group">
                  <span className="field-label">Equipamiento</span>
                  <select
                    className="field-input"
                    value={formState.idEquipamiento}
                    onChange={(event) => updateFormField('idEquipamiento', event.target.value)}
                    disabled={isSaving || isDeleting}
                  >
                    <option value="">Sin equipamiento</option>
                    {equipamientos.map((equipamiento) => (
                      <option key={equipamiento.idEquipamiento} value={equipamiento.idEquipamiento}>
                        {equipamiento.nombreEquipo}
                      </option>
                    ))}
                  </select>
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
                    disabled={!selectedEjercicioId || isDeleting}
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

            <aside className="equipamientos-panel equipamientos-panel--grid ejercicios-panel ejercicios-panel--grid">
              <div className="equipamientos-panel__header ejercicios-panel__header">
                <div>
                  <span className="section-kicker">LISTADO</span>
                  <h2>Base de ejercicios</h2>
                </div>
                <span className="usuarios-count">{visibleEjercicios.length}</span>
              </div>

              <div className="equipamientos-grid-filters" aria-label="Filtros de ejercicios">
                <input
                  type="text"
                  name="ejercicios-filter-decoy-user"
                  autoComplete="username"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="autofill-decoy"
                />
                <input
                  type="password"
                  name="ejercicios-filter-decoy-password"
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
                    name="ejercicios-filter-query"
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

              <div className="equipamientos-table-wrap ejercicios-table-wrap">
                <table className="socios-table equipamientos-table ejercicios-table">
                  <thead>
                    <tr>
                      <th aria-label="Seleccion" />
                      <th>Ejercicio</th>
                      <th>Grupo</th>
                      <th>Tipo</th>
                      <th>Maquina</th>
                      <th>Equipamiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEjercicios.length === 0 ? (
                      <tr>
                        <td className="socios-empty" colSpan={6}>
                          {ejercicios.length === 0
                            ? 'No hay ejercicios cargados para administrar.'
                            : 'No encontramos ejercicios para el filtro actual.'}
                        </td>
                      </tr>
                    ) : (
                      visibleEjercicios.map((ejercicio) => {
                        const isSelected = ejercicio.idEjercicio === selectedEjercicioId

                        return (
                          <tr
                            key={ejercicio.idEjercicio}
                            className={
                              isSelected ? 'socios-row socios-row--selected' : 'socios-row'
                            }
                            onClick={() => selectEjercicio(ejercicio)}
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
                            <td data-label="Ejercicio" className="socios-cell">
                              <strong>{ejercicio.descEjercicio}</strong>
                            </td>
                            <td data-label="Grupo" className="socios-cell">
                              <span className="ejercicios-chip">
                                {ejercicio.grupoMuscular.nombreMusculo}
                              </span>
                            </td>
                            <td data-label="Tipo" className="socios-cell">
                              <span className="ejercicios-chip ejercicios-chip--type">
                                {ejercicio.tipoEjercicio.nombreTipo}
                              </span>
                            </td>
                            <td data-label="Maquina" className="socios-cell">
                              {getResourceLabel(
                                ejercicio.maquina?.nombreMaquina,
                                '-',
                              )}
                            </td>
                            <td data-label="Equipamiento" className="socios-cell">
                              {getResourceLabel(
                                ejercicio.equipamiento?.nombreEquipo,
                                '-',
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

        {isDeleteModalOpen && selectedEjercicio ? (
          <div className="consultar-backdrop" role="presentation">
            <section
              className="consultar-modal eliminar-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="eliminar-ejercicio-title"
            >
              <header className="consultar-header eliminar-modal__header">
                <div>
                  <h2 id="eliminar-ejercicio-title">Confirmar eliminacion</h2>
                  <div className="consultar-meta">
                    <span className="consultar-status consultar-status--danger">
                      Definitiva
                    </span>
                    <span>ID: {selectedEjercicio.idEjercicio}</span>
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
                  <p className="eliminar-modal__label">Ejercicio seleccionado</p>
                  <h3>{selectedEjercicio.descEjercicio}</h3>
                  <p className="eliminar-modal__copy">
                    Esta accion eliminara el ejercicio seleccionado. La grilla se
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
