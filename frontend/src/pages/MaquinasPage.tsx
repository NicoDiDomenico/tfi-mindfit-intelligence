import { useCallback, useEffect, useMemo, useState } from 'react'
import { BackToGymLink } from '../components/BackToHomeLink'
import { FormAlertModal } from '../components/FormAlertModal'
import { useAuth } from '../hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'
import { maquinasService } from '../services/maquinasService'
import type { MaquinaDto, MaquinaInsertDto, MaquinaUpdateDto } from '../types/maquina'
import { getApiErrorMessage } from '../utils/apiError'

const ACTION_PERMISSIONS = {
  crear: 'CREAR_MAQUINA',
  editar: 'EDITAR_MAQUINA',
  eliminar: 'ELIMINAR_MAQUINA',
} as const

const SEARCH_OPTIONS = [
  { value: 'nombreMaquina', label: 'Nombre' },
  { value: 'fechaFabricacion', label: 'Fabricacion' },
  { value: 'fechaCompra', label: 'Compra' },
  { value: 'costoAdquisicion', label: 'Costo' },
  { value: 'pesoMaximoLingotera', label: 'Peso maximo' },
  { value: 'esElectrica', label: 'Tipo' },
] as const

const EMPTY_FORM = {
  nombreMaquina: '',
  fechaFabricacion: '',
  fechaCompra: '',
  costoAdquisicion: '',
  pesoMaximoLingotera: '',
  esElectrica: false,
}

type MaquinaFormState = typeof EMPTY_FORM
type SearchField = (typeof SEARCH_OPTIONS)[number]['value']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatWeight(value: number) {
  return `${value.toLocaleString('es-AR')} kg`
}

function toDateInputValue(value: string) {
  return value.split('T')[0] ?? value
}

function createFormStateFromMaquina(maquina: MaquinaDto): MaquinaFormState {
  return {
    nombreMaquina: maquina.nombreMaquina,
    fechaFabricacion: toDateInputValue(maquina.fechaFabricacion),
    fechaCompra: toDateInputValue(maquina.fechaCompra),
    costoAdquisicion: String(maquina.costoAdquisicion),
    pesoMaximoLingotera:
      maquina.pesoMaximoLingotera === null ? '' : String(maquina.pesoMaximoLingotera),
    esElectrica: maquina.esElectrica,
  }
}

function parsePositiveDecimal(value: string) {
  const normalizedValue = value.trim().replace(',', '.')
  const parsedValue = Number(normalizedValue)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

function isFutureDate(value: string) {
  const today = new Date()
  const selectedDate = new Date(`${value}T00:00:00`)

  today.setHours(0, 0, 0, 0)

  return selectedDate.getTime() > today.getTime()
}

function getValidationErrors(formState: MaquinaFormState) {
  const errors: string[] = []
  const nombreMaquina = formState.nombreMaquina.trim()
  const costoAdquisicion = parsePositiveDecimal(formState.costoAdquisicion)
  const pesoMaximoLingotera = formState.pesoMaximoLingotera.trim()
    ? parsePositiveDecimal(formState.pesoMaximoLingotera)
    : null

  if (!nombreMaquina) {
    errors.push('El nombre de la maquina es obligatorio.')
  }

  if (nombreMaquina.length > 100) {
    errors.push('El nombre de la maquina no puede superar los 100 caracteres.')
  }

  if (!formState.fechaFabricacion) {
    errors.push('La fecha de fabricacion es obligatoria.')
  } else if (isFutureDate(formState.fechaFabricacion)) {
    errors.push('La fecha de fabricacion no puede ser futura.')
  }

  if (!formState.fechaCompra) {
    errors.push('La fecha de compra es obligatoria.')
  } else if (isFutureDate(formState.fechaCompra)) {
    errors.push('La fecha de compra no puede ser futura.')
  }

  if (
    formState.fechaFabricacion &&
    formState.fechaCompra &&
    formState.fechaCompra < formState.fechaFabricacion
  ) {
    errors.push('La fecha de compra no puede ser anterior a la fecha de fabricacion.')
  }

  if (costoAdquisicion === null || costoAdquisicion <= 0) {
    errors.push('El costo de adquisicion debe ser mayor a 0.')
  }

  if (
    formState.pesoMaximoLingotera.trim() &&
    (pesoMaximoLingotera === null || pesoMaximoLingotera <= 0)
  ) {
    errors.push('El peso maximo de la lingotera debe ser mayor a 0.')
  }

  return errors
}

function buildPayload(formState: MaquinaFormState): MaquinaInsertDto | MaquinaUpdateDto {
  const costoAdquisicion = parsePositiveDecimal(formState.costoAdquisicion) ?? 0
  const pesoMaximoLingotera = formState.pesoMaximoLingotera.trim()
    ? parsePositiveDecimal(formState.pesoMaximoLingotera)
    : null

  return {
    nombreMaquina: formState.nombreMaquina.trim(),
    fechaFabricacion: formState.fechaFabricacion,
    fechaCompra: formState.fechaCompra,
    costoAdquisicion,
    pesoMaximoLingotera,
    esElectrica: formState.esElectrica,
  }
}

function getSearchableValue(maquina: MaquinaDto, field: SearchField) {
  if (field === 'pesoMaximoLingotera') {
    return maquina.pesoMaximoLingotera === null ? '' : String(maquina.pesoMaximoLingotera)
  }

  if (field === 'esElectrica') {
    return maquina.esElectrica ? 'electrica si' : 'mecanica no'
  }

  return String(maquina[field] ?? '')
    .trim()
    .toLocaleLowerCase('es-AR')
}

export function MaquinasPage() {
  const { session } = useAuth()
  const userPermissions = session?.permisos ?? []
  const [maquinas, setMaquinas] = useState<MaquinaDto[]>([])
  const [selectedMaquinaId, setSelectedMaquinaId] = useState<number | null>(null)
  const [formState, setFormState] = useState<MaquinaFormState>(EMPTY_FORM)
  const [searchField, setSearchField] = useState<SearchField>('nombreMaquina')
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
  const isEditing = selectedMaquinaId !== null
  const canSubmitCurrentMode = isEditing ? canEdit : canCreate

  const selectedMaquina = useMemo(
    () => maquinas.find((maquina) => maquina.idMaquina === selectedMaquinaId) ?? null,
    [maquinas, selectedMaquinaId],
  )

  const searchPlaceholder = useMemo(() => {
    const selectedOption = SEARCH_OPTIONS.find((option) => option.value === searchField)
    const selectedLabel = selectedOption?.label.toLocaleLowerCase('es-AR') ?? ''

    return `Filtrar por ${selectedLabel}`
  }, [searchField])

  const visibleMaquinas = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLocaleLowerCase('es-AR')

    if (!normalizedSearch) {
      return maquinas
    }

    return maquinas.filter((maquina) =>
      getSearchableValue(maquina, searchField).includes(normalizedSearch),
    )
  }, [maquinas, searchField, searchValue])

  const loadMaquinas = useCallback(async () => {
    setIsInitialLoading(true)
    setLoadError('')

    try {
      const response = await maquinasService.getAll()
      setMaquinas(response)
    } catch (requestError) {
      setLoadError(
        getApiErrorMessage(requestError, 'No pudimos cargar las maquinas. Intenta nuevamente.'),
      )
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function loadData() {
      if (isActive) {
        await loadMaquinas()
      }
    }

    void loadData()

    return () => {
      isActive = false
    }
  }, [loadMaquinas])

  function startCreateMode() {
    setSelectedMaquinaId(null)
    setFormState(EMPTY_FORM)
    setError('')
    setSuccess('')
    setDeleteError('')
    setIsDeleteModalOpen(false)
  }

  function selectMaquina(maquina: MaquinaDto) {
    setSelectedMaquinaId(maquina.idMaquina)
    setFormState(createFormStateFromMaquina(maquina))
    setError('')
    setSuccess('')
    setDeleteError('')
    setIsDeleteModalOpen(false)
  }

  function updateFormField(field: keyof MaquinaFormState, value: string | boolean) {
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

      if (isEditing && selectedMaquinaId) {
        const updatedMaquina = await maquinasService.update(selectedMaquinaId, payload)

        setMaquinas((current) =>
          current.map((maquina) =>
            maquina.idMaquina === updatedMaquina.idMaquina ? updatedMaquina : maquina,
          ),
        )
        setSelectedMaquinaId(updatedMaquina.idMaquina)
        setFormState(createFormStateFromMaquina(updatedMaquina))
        setSuccess('Maquina actualizada correctamente.')
      } else {
        const createdMaquina = await maquinasService.create(payload)

        setMaquinas((current) => {
          const withoutDuplicate = current.filter(
            (maquina) => maquina.idMaquina !== createdMaquina.idMaquina,
          )

          return [...withoutDuplicate, createdMaquina]
        })
        setSelectedMaquinaId(createdMaquina.idMaquina)
        setFormState(createFormStateFromMaquina(createdMaquina))
        setSuccess('Maquina creada correctamente.')
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isEditing
            ? 'No pudimos actualizar la maquina. Revisa los datos e intenta nuevamente.'
            : 'No pudimos crear la maquina. Revisa los datos e intenta nuevamente.',
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!selectedMaquinaId || isDeleting || !canDelete) {
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      await maquinasService.delete(selectedMaquinaId)
      setMaquinas((current) => current.filter((maquina) => maquina.idMaquina !== selectedMaquinaId))
      setIsDeleteModalOpen(false)
      startCreateMode()
      setSuccess('Maquina eliminada correctamente.')
    } catch (requestError) {
      setDeleteError(
        getApiErrorMessage(requestError, 'No pudimos eliminar la maquina seleccionada.'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AppLayout>
      <main className="equipamientos-page maquinas-page">
        <section className="equipamientos-intro maquinas-intro">
          <div>
            <span className="section-kicker">Gestionar gimnasio / Maquinas</span>
            <h1 className="dashboard-title">Maquinas</h1>
            <p className="dashboard-copy">
              Administra el inventario de maquinas del gimnasio y sus datos operativos.
            </p>
          </div>
          <BackToGymLink />
        </section>

        {isInitialLoading ? <p className="inicio-status">Cargando maquinas...</p> : null}
        {!isInitialLoading && loadError ? (
          <p className="inicio-status inicio-status--error">{loadError}</p>
        ) : null}

        {!isInitialLoading && !loadError ? (
          <section className="equipamientos-workspace maquinas-workspace">
            <div className="equipamientos-panel equipamientos-panel--form maquinas-panel maquinas-panel--form">
              <div className="equipamientos-panel__header maquinas-panel__header">
                <div>
                  <span className="section-kicker">{isEditing ? 'Edición' : 'Alta'}</span>
                  <h2>{isEditing ? 'Editar maquina' : 'Crear maquina'}</h2>
                </div>
                {isEditing ? <span className="equipamientos-id">ID {selectedMaquinaId}</span> : null}
              </div>

              {error ? <FormAlertModal type="error" message={error} /> : null}
              {success ? <FormAlertModal type="success" message={success} /> : null}

              <div className="equipamientos-form-grid maquinas-form-grid">
                <label className="field-group">
                  <span className="field-label">Nombre de la maquina</span>
                  <input
                    className="field-input"
                    value={formState.nombreMaquina}
                    maxLength={100}
                    onChange={(event) => updateFormField('nombreMaquina', event.target.value)}
                    disabled={isSaving || isDeleting}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Fecha de fabricacion</span>
                  <input
                    className="field-input"
                    type="date"
                    value={formState.fechaFabricacion}
                    onChange={(event) => updateFormField('fechaFabricacion', event.target.value)}
                    disabled={isSaving || isDeleting}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Fecha de compra</span>
                  <input
                    className="field-input"
                    type="date"
                    value={formState.fechaCompra}
                    onChange={(event) => updateFormField('fechaCompra', event.target.value)}
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
                    onChange={(event) => updateFormField('costoAdquisicion', event.target.value)}
                    disabled={isSaving || isDeleting}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Peso maximo lingotera</span>
                  <input
                    className="field-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formState.pesoMaximoLingotera}
                    onChange={(event) =>
                      updateFormField('pesoMaximoLingotera', event.target.value)
                    }
                    disabled={isSaving || isDeleting}
                    placeholder="Opcional"
                  />
                </label>
                <label className="maquinas-switch">
                  <input
                    type="checkbox"
                    checked={formState.esElectrica}
                    onChange={(event) => updateFormField('esElectrica', event.target.checked)}
                    disabled={isSaving || isDeleting}
                  />
                  <span>
                    <strong>Electrica</strong>
                    <small>{formState.esElectrica ? 'Si' : 'No'}</small>
                  </span>
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
                    disabled={!selectedMaquinaId || isDeleting}
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

            <aside className="equipamientos-panel equipamientos-panel--grid maquinas-panel maquinas-panel--grid">
              <div className="equipamientos-panel__header maquinas-panel__header">
                <div>
                  <span className="section-kicker">LISTADO</span>
                  <h2>Inventario</h2>
                </div>
                <span className="usuarios-count">{visibleMaquinas.length}</span>
              </div>

              <div className="equipamientos-grid-filters" aria-label="Filtros de maquinas">
                <input
                  type="text"
                  name="maquinas-filter-decoy-user"
                  autoComplete="username"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="autofill-decoy"
                />
                <input
                  type="password"
                  name="maquinas-filter-decoy-password"
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
                    name="maquinas-filter-query"
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

              <div className="equipamientos-table-wrap maquinas-table-wrap">
                <table className="socios-table equipamientos-table maquinas-table">
                  <thead>
                    <tr>
                      <th aria-label="Seleccion" />
                      <th>Maquina</th>
                      <th>Fabricacion</th>
                      <th>Compra</th>
                      <th>Costo</th>
                      <th>Peso max.</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMaquinas.length === 0 ? (
                      <tr>
                        <td className="socios-empty" colSpan={7}>
                          {maquinas.length === 0
                            ? 'No hay maquinas cargadas para administrar.'
                            : 'No encontramos maquinas para el filtro actual.'}
                        </td>
                      </tr>
                    ) : (
                      visibleMaquinas.map((maquina) => {
                        const isSelected = maquina.idMaquina === selectedMaquinaId

                        return (
                          <tr
                            key={maquina.idMaquina}
                            className={
                              isSelected ? 'socios-row socios-row--selected' : 'socios-row'
                            }
                            onClick={() => selectMaquina(maquina)}
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
                            <td data-label="Maquina" className="socios-cell">
                              <strong>{maquina.nombreMaquina}</strong>
                            </td>
                            <td data-label="Fabricacion" className="socios-cell">
                              {formatDate(maquina.fechaFabricacion)}
                            </td>
                            <td data-label="Compra" className="socios-cell">
                              {formatDate(maquina.fechaCompra)}
                            </td>
                            <td data-label="Costo" className="socios-cell">
                              {formatCurrency(maquina.costoAdquisicion)}
                            </td>
                            <td data-label="Peso max." className="socios-cell">
                              {maquina.pesoMaximoLingotera === null ? (
                                '-'
                              ) : (
                                <span className="equipamientos-weight">
                                  {formatWeight(maquina.pesoMaximoLingotera)}
                                </span>
                              )}
                            </td>
                            <td data-label="Tipo" className="socios-cell">
                              <span
                                className={
                                  maquina.esElectrica
                                    ? 'maquinas-status maquinas-status--electric'
                                    : 'maquinas-status'
                                }
                              >
                                {maquina.esElectrica ? 'Electrica' : 'Mecanica'}
                              </span>
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

        {isDeleteModalOpen && selectedMaquina ? (
          <div className="consultar-backdrop" role="presentation">
            <section
              className="consultar-modal eliminar-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="eliminar-maquina-title"
            >
              <header className="consultar-header eliminar-modal__header">
                <div>
                  <h2 id="eliminar-maquina-title">Confirmar eliminacion</h2>
                  <div className="consultar-meta">
                    <span className="consultar-status consultar-status--danger">Definitiva</span>
                    <span>ID: {selectedMaquina.idMaquina}</span>
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
                  <p className="eliminar-modal__label">Maquina seleccionada</p>
                  <h3>{selectedMaquina.nombreMaquina}</h3>
                  <p className="eliminar-modal__copy">
                    Esta accion eliminara la maquina seleccionada. La grilla se actualizara
                    cuando el backend confirme la operacion.
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
