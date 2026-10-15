import { useCallback, useEffect, useMemo, useState } from 'react'
import { BackToGymLink } from '../components/BackToHomeLink'
import { FormAlertModal } from '../components/FormAlertModal'
import { useAuth } from '../hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'
import { formulariosService } from '../services/formulariosService'
import { permisosService } from '../services/permisosService'
import type { Formulario } from '../types/formulario'
import type { GrupoDto } from '../types/permiso'
import { getApiErrorMessage } from '../utils/apiError'

const ACTION_PERMISSIONS = {
  crear: 'CREAR_GRUPO',
  editar: 'EDITAR_GRUPO',
  eliminar: 'ELIMINAR_GRUPO',
} as const

const GROUP_FILTER_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'descripcion', label: 'Descripcion' },
  { value: 'permisos', label: 'Permisos' },
] as const

const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
}

type GrupoFormState = typeof EMPTY_FORM
type GroupFilterField = (typeof GROUP_FILTER_OPTIONS)[number]['value']
type PermissionGroup = {
  id: string
  title: string
  permissions: GrupoDto['permisos']
}

function createFormStateFromGrupo(grupo: GrupoDto): GrupoFormState {
  return {
    nombre: grupo.nombre,
    descripcion: grupo.descripcion,
  }
}

function getValidationErrors(formState: GrupoFormState, selectedPermissionIds: number[]) {
  const errors: string[] = []

  if (!formState.nombre.trim()) {
    errors.push('El nombre es obligatorio.')
  }

  if (!formState.descripcion.trim()) {
    errors.push('La descripcion es obligatoria.')
  }

  if (selectedPermissionIds.length === 0) {
    errors.push('Selecciona al menos un permiso para el grupo.')
  }

  return errors
}

function buildPayload(formState: GrupoFormState, selectedPermissionIds: number[]) {
  return {
    nombre: formState.nombre.trim(),
    descripcion: formState.descripcion.trim(),
    idPermisos: selectedPermissionIds,
  }
}

function buildHydratedGrupo(
  idGrupo: number,
  formState: GrupoFormState,
  selectedPermissionIds: number[],
  availablePermisos: GrupoDto['permisos'],
): GrupoDto {
  const selectedPermisos = availablePermisos.filter((permiso) =>
    selectedPermissionIds.includes(permiso.idPermiso),
  )

  return {
    idGrupo,
    nombre: formState.nombre.trim(),
    descripcion: formState.descripcion.trim(),
    permisos: selectedPermisos,
  }
}

export function PermisosPage() {
  const { session } = useAuth()
  const userPermissions = session?.permisos ?? []
  const [grupos, setGrupos] = useState<GrupoDto[]>([])
  const [permisos, setPermisos] = useState<GrupoDto['permisos']>([])
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null)
  const [formState, setFormState] = useState<GrupoFormState>(EMPTY_FORM)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([])
  const [groupFilterField, setGroupFilterField] = useState<GroupFilterField>('nombre')
  const [groupFilterValue, setGroupFilterValue] = useState('')
  const [isGroupFilterAutofillGuardEnabled, setIsGroupFilterAutofillGuardEnabled] = useState(true)
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
  const isEditing = selectedGrupoId !== null
  const canSubmitCurrentMode = isEditing ? canEdit : canCreate

  const selectedGrupo = useMemo(
    () => grupos.find((grupo) => grupo.idGrupo === selectedGrupoId) ?? null,
    [grupos, selectedGrupoId],
  )

  const sortedPermisos = useMemo(
    () =>
      [...permisos].sort((first, second) =>
        first.codigo.localeCompare(second.codigo, 'es-AR', { sensitivity: 'base' }),
      ),
    [permisos],
  )

  const permissionGroups = useMemo(() => {
    const permissionByCode = new Map(sortedPermisos.map((permiso) => [permiso.codigo, permiso]))
    const assignedCodes = new Set<string>()
    const groups: PermissionGroup[] = []

    formularios.forEach((formulario) => {
      const groupedPermissions = formulario.permisos
        .map((permissionCode) => permissionByCode.get(permissionCode))
        .filter((permiso): permiso is GrupoDto['permisos'][number] => Boolean(permiso))

      groupedPermissions.forEach((permiso) => assignedCodes.add(permiso.codigo))

      if (groupedPermissions.length > 0) {
        groups.push({
          id: `formulario-${formulario.idFormulario}`,
          title: formulario.nombreFormulario,
          permissions: groupedPermissions,
        })
      }
    })

    const ungroupedPermissions = sortedPermisos.filter((permiso) => !assignedCodes.has(permiso.codigo))

    if (ungroupedPermissions.length > 0) {
      groups.push({
        id: 'sin-formulario',
        title: 'Sin formulario',
        permissions: ungroupedPermissions,
      })
    }

    return groups
  }, [formularios, sortedPermisos])

  const groupFilterPlaceholder = useMemo(() => {
    const selectedOption = GROUP_FILTER_OPTIONS.find(
      (option) => option.value === groupFilterField,
    )
    const selectedLabel = selectedOption?.label.toLocaleLowerCase('es-AR') ?? ''

    return `Filtrar por ${selectedLabel}`
  }, [groupFilterField])

  const visibleGrupos = useMemo(() => {
    const normalizedFilter = groupFilterValue.trim().toLocaleLowerCase('es-AR')

    if (!normalizedFilter) {
      return grupos
    }

    return grupos.filter((grupo) => {
      if (groupFilterField === 'nombre') {
        return grupo.nombre.toLocaleLowerCase('es-AR').includes(normalizedFilter)
      }

      if (groupFilterField === 'descripcion') {
        return grupo.descripcion.toLocaleLowerCase('es-AR').includes(normalizedFilter)
      }

      return String(grupo.permisos.length).includes(normalizedFilter)
    })
  }, [groupFilterField, groupFilterValue, grupos])

  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true)
    setLoadError('')

    try {
      const [gruposResponse, permisosResponse, formulariosResponse] = await Promise.all([
        permisosService.getGrupos(),
        permisosService.getPermisos(),
        formulariosService.getAll(),
      ])

      setGrupos(gruposResponse)
      setPermisos(permisosResponse)
      setFormularios(formulariosResponse)
    } catch (requestError) {
      setLoadError(
        getApiErrorMessage(
          requestError,
          'No pudimos cargar grupos, permisos y formularios. Intenta nuevamente.',
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
        await loadInitialData()
      }
    }

    void loadData()

    return () => {
      isActive = false
    }
  }, [loadInitialData])

  function startCreateMode() {
    setSelectedGrupoId(null)
    setFormState(EMPTY_FORM)
    setSelectedPermissionIds([])
    setError('')
    setSuccess('')
    setDeleteError('')
    setIsDeleteModalOpen(false)
  }

  function selectGrupo(grupo: GrupoDto) {
    setSelectedGrupoId(grupo.idGrupo)
    setFormState(createFormStateFromGrupo(grupo))
    setSelectedPermissionIds(grupo.permisos.map((permiso) => permiso.idPermiso))
    setError('')
    setSuccess('')
    setDeleteError('')
    setIsDeleteModalOpen(false)
  }

  function updateFormField(field: keyof GrupoFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function togglePermission(idPermiso: number) {
    setSelectedPermissionIds((current) =>
      current.includes(idPermiso)
        ? current.filter((currentId) => currentId !== idPermiso)
        : [...current, idPermiso],
    )
  }

  async function handleSubmit() {
    if (isSaving || !canSubmitCurrentMode) {
      return
    }

    const validationErrors = getValidationErrors(formState, selectedPermissionIds)

    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '))
      setSuccess('')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = buildPayload(formState, selectedPermissionIds)

      if (isEditing && selectedGrupoId) {
        const updatedGrupo = await permisosService.updateGrupo(selectedGrupoId, payload)
        const hydratedGrupo = buildHydratedGrupo(
          updatedGrupo.idGrupo,
          formState,
          selectedPermissionIds,
          permisos,
        )

        setGrupos((current) =>
          current.map((grupo) => (grupo.idGrupo === hydratedGrupo.idGrupo ? hydratedGrupo : grupo)),
        )
        setFormState(createFormStateFromGrupo(hydratedGrupo))
        setSelectedPermissionIds(selectedPermissionIds)
        setSelectedGrupoId(hydratedGrupo.idGrupo)
        setSuccess('Grupo actualizado correctamente.')
      } else {
        const createdGrupo = await permisosService.createGrupo(payload)
        setGrupos((current) => {
          const withoutDuplicate = current.filter((grupo) => grupo.idGrupo !== createdGrupo.idGrupo)
          return [...withoutDuplicate, createdGrupo]
        })
        setFormState(createFormStateFromGrupo(createdGrupo))
        setSelectedPermissionIds(createdGrupo.permisos.map((permiso) => permiso.idPermiso))
        setSelectedGrupoId(createdGrupo.idGrupo)
        setSuccess('Grupo creado correctamente.')
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isEditing
            ? 'No pudimos actualizar el grupo. Revisa los datos e intenta nuevamente.'
            : 'No pudimos crear el grupo. Revisa los datos e intenta nuevamente.',
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!selectedGrupoId || isDeleting || !canDelete) {
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      await permisosService.deleteGrupo(selectedGrupoId)
      setGrupos((current) => current.filter((grupo) => grupo.idGrupo !== selectedGrupoId))
      setIsDeleteModalOpen(false)
      startCreateMode()
      setSuccess('Grupo eliminado correctamente.')
    } catch (requestError) {
      setDeleteError(
        getApiErrorMessage(requestError, 'No pudimos eliminar el grupo seleccionado.'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AppLayout>
      <main className="permisos-page">
        <section className="permisos-intro">
          <div>
            <span className="section-kicker">Gestionar gimnasio / Permisos</span>
            <h1 className="dashboard-title">Roles y permisos</h1>
            <p className="dashboard-copy">
              Administra los grupos internos del gimnasio y los permisos asociados a cada rol.
            </p>
          </div>
          <div className="permisos-intro__actions">
            <BackToGymLink />
          </div>
        </section>

        {isInitialLoading ? <p className="inicio-status">Cargando grupos y permisos...</p> : null}
        {!isInitialLoading && loadError ? (
          <p className="inicio-status inicio-status--error">{loadError}</p>
        ) : null}

        {!isInitialLoading && !loadError ? (
          <section className="permisos-workspace">
            <div className="permisos-panel permisos-panel--form">
              <div className="permisos-panel__header">
                <div>
                  <span className="section-kicker">{isEditing ? 'Edición' : 'Alta'}</span>
                  <h2>{isEditing ? 'Editar grupo' : 'Crear grupo'}</h2>
                </div>
                {isEditing ? <span className="permisos-id">ID {selectedGrupoId}</span> : null}
              </div>

              {error ? <FormAlertModal type="error" message={error} /> : null}
              {success ? <FormAlertModal type="success" message={success} /> : null}

              <div className="permisos-form-grid">
                <label className="field-group">
                  <span className="field-label">Nombre</span>
                  <input
                    className="field-input"
                    value={formState.nombre}
                    onChange={(event) => updateFormField('nombre', event.target.value)}
                    disabled={isSaving || isDeleting}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Descripcion</span>
                  <input
                    className="field-input"
                    value={formState.descripcion}
                    onChange={(event) => updateFormField('descripcion', event.target.value)}
                    disabled={isSaving || isDeleting}
                  />
                </label>
              </div>

              <section className="permisos-subsection">
                <div className="usuarios-subsection__heading">
                  <h3>Permisos asociados</h3>
                  <span>{selectedPermissionIds.length} seleccionados</span>
                </div>

                <div className="permisos-checkbox-list">
                  {permissionGroups.length === 0 ? (
                    <p className="usuarios-empty-inline">No hay permisos disponibles.</p>
                  ) : (
                    permissionGroups.map((group) => (
                      <section className="permisos-group" key={group.id}>
                        <header className="permisos-group__header">
                          <h4>{group.title}</h4>
                          <span>{group.permissions.length} permisos</span>
                        </header>

                        <div className="permisos-group__items">
                          {group.permissions.map((permiso) => {
                            const checkboxId = `permiso-${permiso.idPermiso}`

                            return (
                              <label
                                className="permisos-checkbox"
                                htmlFor={checkboxId}
                                key={permiso.idPermiso}
                              >
                                <input
                                  id={checkboxId}
                                  type="checkbox"
                                  checked={selectedPermissionIds.includes(permiso.idPermiso)}
                                  disabled={isSaving || isDeleting}
                                  onChange={() => togglePermission(permiso.idPermiso)}
                                />
                                <span>
                                  <strong>{permiso.codigo}</strong>
                                  {permiso.descripcion ? <small>{permiso.descripcion}</small> : null}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      </section>
                    ))
                  )}
                </div>
              </section>

              <div className="permisos-form-actions">
                {canSubmitCurrentMode ? (
                  <button
                    className="submit-button permisos-submit"
                    type="button"
                    disabled={isSaving || isDeleting}
                    onClick={() => void handleSubmit()}
                  >
                    {isSaving ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
                  </button>
                ) : null}

                {canCreate ? (
                  <button
                    className="ghost-button permisos-new-action"
                    type="button"
                    onClick={startCreateMode}
                  >
                    Nuevo
                  </button>
                ) : null}

                {isEditing && canDelete ? (
                  <button
                    className="ghost-button permisos-danger-action"
                    type="button"
                    disabled={!selectedGrupoId || isDeleting}
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

            <div className="permisos-grid-stack">
              <aside className="permisos-panel permisos-panel--grid">
                <div className="permisos-panel__header">
                  <div>
                    <span className="section-kicker">LISTADO</span>
                    <h2>Grupos</h2>
                  </div>
                  <span className="usuarios-count">{visibleGrupos.length}</span>
                </div>

                <div className="usuarios-grid-filters permisos-grid-filters" aria-label="Filtros de grupos">
                  <input
                    type="text"
                    name="grupos-filter-decoy-user"
                    autoComplete="username"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="autofill-decoy"
                  />
                  <input
                    type="password"
                    name="grupos-filter-decoy-password"
                    autoComplete="current-password"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="autofill-decoy"
                  />
                  <label className="field-group usuarios-filter-field">
                    <select
                      className="field-input"
                      value={groupFilterField}
                      onChange={(event) => setGroupFilterField(event.target.value as GroupFilterField)}
                    >
                      {GROUP_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-group usuarios-filter-field usuarios-filter-field--search">
                    <input
                      className="field-input"
                      type="text"
                      name="grupos-filter-query"
                      autoComplete="one-time-code"
                      readOnly={isGroupFilterAutofillGuardEnabled}
                      value={groupFilterValue}
                      onMouseDown={() => setIsGroupFilterAutofillGuardEnabled(false)}
                      onFocus={() => setIsGroupFilterAutofillGuardEnabled(false)}
                      onChange={(event) => setGroupFilterValue(event.target.value)}
                      placeholder={groupFilterPlaceholder}
                    />
                  </label>
                </div>

                <div className="permisos-table-wrap">
                  <table className="socios-table permisos-table">
                    <thead>
                      <tr>
                        <th aria-label="Seleccion" />
                        <th>Nombre</th>
                        <th>Descripcion</th>
                        <th>Permisos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleGrupos.length === 0 ? (
                        <tr>
                          <td className="socios-empty" colSpan={4}>
                            {grupos.length === 0
                              ? 'No hay grupos cargados para administrar.'
                              : 'No encontramos grupos para el filtro actual.'}
                          </td>
                        </tr>
                      ) : (
                        visibleGrupos.map((grupo) => {
                          const isSelected = grupo.idGrupo === selectedGrupoId

                          return (
                            <tr
                              key={grupo.idGrupo}
                              className={
                                isSelected ? 'socios-row socios-row--selected' : 'socios-row'
                              }
                              onClick={() => selectGrupo(grupo)}
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
                              <td data-label="Nombre" className="socios-cell">
                                <strong>{grupo.nombre}</strong>
                              </td>
                              <td data-label="Descripcion" className="socios-cell">
                                {grupo.descripcion || '-'}
                              </td>
                              <td data-label="Permisos" className="socios-cell">
                                <span className="permisos-count-chip">
                                  {grupo.permisos.length} permisos
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

            </div>
          </section>
        ) : null}

        {isDeleteModalOpen && selectedGrupo ? (
          <div className="consultar-backdrop" role="presentation">
            <section
              className="consultar-modal eliminar-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="eliminar-grupo-title"
            >
              <header className="consultar-header eliminar-modal__header">
                <div>
                  <h2 id="eliminar-grupo-title">Confirmar eliminacion</h2>
                  <div className="consultar-meta">
                    <span className="consultar-status consultar-status--danger">Definitiva</span>
                    <span>ID: {selectedGrupo.idGrupo}</span>
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
                  <p className="eliminar-modal__label">Grupo seleccionado</p>
                  <h3>{selectedGrupo.nombre}</h3>
                  <p className="eliminar-modal__copy">
                    Esta accion eliminara el grupo y sus asociaciones de permisos. La grilla se
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
