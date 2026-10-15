import { useCallback, useEffect, useMemo, useState } from 'react'
import { BackToGymLink } from '../components/BackToHomeLink'
import { FormAlertModal } from '../components/FormAlertModal'
import { AppLayout } from '../layouts/AppLayout'
import { formulariosService } from '../services/formulariosService'
import { usuariosService } from '../services/usuariosService'
import type { Formulario } from '../types/formulario'
import type {
  GeneroResponsable,
  GrupoDto,
  ResponsableGridDto,
  UsuarioResponsableDto,
} from '../types/usuario'
import { getApiErrorMessage } from '../utils/apiError'
import { useAuth } from '../hooks/useAuth'

const ACTION_PERMISSIONS = {
  crear: 'CREAR_USUARIO_RESPONSABLE',
  editar: 'EDITAR_USUARIO_RESPONSABLE',
  cambiarContrasena: 'CAMBIAR_CONTRASENA_RESPONSABLE',
  eliminar: 'ELIMINAR_USUARIO_RESPONSABLE_DEFINITIVAMENTE',
} as const

const GENERO_OPTIONS: { value: GeneroResponsable; label: string }[] = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Femenino', label: 'Femenino' },
  { value: 'Otro', label: 'Otro' },
  { value: 'NoEspecifica', label: 'No especifica' },
]

const SEARCH_OPTIONS = [
  { value: 'username', label: 'Usuario' },
  { value: 'nombreCompleto', label: 'Nombre y apellido' },
  { value: 'email', label: 'Email' },
  { value: 'nombreGrupo', label: 'Roles' },
] as const

const EMPTY_FORM = {
  username: '',
  password: '',
  repeatPassword: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  tipoDocumento: '',
  nroDocumento: '',
  genero: '',
  fechaNacimiento: '',
}

const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  repeatNewPassword: '',
}

type UsuarioFormState = typeof EMPTY_FORM
type SearchField = (typeof SEARCH_OPTIONS)[number]['value']

function isSocioGroup(group: GrupoDto) {
  return group.nombre.trim().toLocaleUpperCase('es-AR') === 'SOCIO'
}

function normalizeOptional(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function getResponsableDisplayName(responsable: ResponsableGridDto | UsuarioResponsableDto | null) {
  if (!responsable) {
    return 'Responsable seleccionado'
  }

  if ('nombreCompleto' in responsable) {
    return responsable.nombreCompleto?.trim() || responsable.username
  }

  const persona = responsable.personaResponsable
  const nombreCompleto = [persona?.apellido, persona?.nombre].filter(Boolean).join(' ').trim()
  return nombreCompleto || responsable.username
}

function createFormStateFromUsuario(usuario: UsuarioResponsableDto): UsuarioFormState {
  const persona = usuario.personaResponsable

  return {
    ...EMPTY_FORM,
    username: usuario.username,
    nombre: persona?.nombre ?? '',
    apellido: persona?.apellido ?? '',
    email: persona?.email ?? '',
    telefono: persona?.telefono ?? '',
    direccion: persona?.direccion ?? '',
    ciudad: persona?.ciudad ?? '',
    tipoDocumento: persona?.tipoDocumento ?? '',
    nroDocumento: persona?.nroDocumento ?? '',
    genero: persona?.genero ?? '',
    fechaNacimiento: persona?.fechaNacimiento ? persona.fechaNacimiento.slice(0, 10) : '',
  }
}

function getValidationErrors(
  formState: UsuarioFormState,
  selectedGroupIds: number[],
  isEditing: boolean,
) {
  const errors: string[] = []
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!formState.username.trim()) errors.push('El nombre de usuario es obligatorio.')
  if (!isEditing && !formState.password) errors.push('La contrasena es obligatoria.')
  if (!isEditing && formState.password.length > 0 && formState.password.length < 8) {
    errors.push('La contrasena debe tener al menos 8 caracteres.')
  }
  if (!isEditing && formState.password !== formState.repeatPassword) {
    errors.push('La contrasena y su repeticion deben coincidir.')
  }
  if (!formState.nombre.trim()) errors.push('El nombre es obligatorio.')
  if (!formState.apellido.trim()) errors.push('El apellido es obligatorio.')
  if (!formState.email.trim()) errors.push('El email es obligatorio.')
  if (formState.email.trim() && !emailPattern.test(formState.email.trim())) {
    errors.push('El formato del email no es valido.')
  }
  if (!formState.tipoDocumento.trim()) errors.push('El tipo de documento es obligatorio.')
  if (!formState.nroDocumento.trim()) errors.push('El numero de documento es obligatorio.')
  if (selectedGroupIds.length === 0) errors.push('Debe seleccionarse al menos un grupo.')

  return errors
}

function buildPayload(formState: UsuarioFormState, selectedGroupIds: number[]) {
  return {
    username: formState.username.trim(),
    tipoPersona: 'Responsable' as const,
    personaResponsable: {
      nombre: formState.nombre.trim(),
      apellido: formState.apellido.trim(),
      email: formState.email.trim(),
      telefono: normalizeOptional(formState.telefono),
      direccion: normalizeOptional(formState.direccion),
      ciudad: normalizeOptional(formState.ciudad),
      tipoDocumento: formState.tipoDocumento.trim(),
      nroDocumento: formState.nroDocumento.trim(),
      genero: (formState.genero || null) as GeneroResponsable | null,
      fechaNacimiento: formState.fechaNacimiento || null,
    },
    personaSocio: null,
    idGrupos: selectedGroupIds,
  }
}

function getSearchableValue(responsable: ResponsableGridDto, searchField: SearchField) {
  if (searchField === 'nombreGrupo') {
    return responsable.nombreGrupo.join(' ').toLocaleLowerCase('es-AR')
  }

  return String(responsable[searchField] ?? '')
    .trim()
    .toLocaleLowerCase('es-AR')
}

export function UsuariosPage() {
  const { session } = useAuth()
  const userPermissions = session?.permisos ?? []
  const [responsables, setResponsables] = useState<ResponsableGridDto[]>([])
  const [grupos, setGrupos] = useState<GrupoDto[]>([])
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [selectedResponsableId, setSelectedResponsableId] = useState<number | null>(null)
  const [selectedResponsableDetail, setSelectedResponsableDetail] =
    useState<UsuarioResponsableDto | null>(null)
  const [formState, setFormState] = useState<UsuarioFormState>(EMPTY_FORM)
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM)
  const [searchField, setSearchField] = useState<SearchField>('username')
  const [searchValue, setSearchValue] = useState('')
  const [isSearchAutofillGuardEnabled, setIsSearchAutofillGuardEnabled] = useState(true)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [deleteError, setDeleteError] = useState('')

  const canCreate = userPermissions.includes(ACTION_PERMISSIONS.crear)
  const canEdit = userPermissions.includes(ACTION_PERMISSIONS.editar)
  const canChangePassword = userPermissions.includes(ACTION_PERMISSIONS.cambiarContrasena)
  const canDelete = userPermissions.includes(ACTION_PERMISSIONS.eliminar)
  const authenticatedUserId = session?.datosPersonales?.id ?? null
  const isEditing = selectedResponsableId !== null
  const canSubmitCurrentMode = isEditing ? canEdit : canCreate

  const availableGroups = useMemo(() => grupos.filter((grupo) => !isSocioGroup(grupo)), [grupos])

  const selectedGroups = useMemo(
    () => availableGroups.filter((grupo) => selectedGroupIds.includes(grupo.idGrupo)),
    [availableGroups, selectedGroupIds],
  )

  const selectedPermissionCodes = useMemo(
    () =>
      new Set(
        selectedGroups.flatMap((grupo) => grupo.permisos.map((permiso) => permiso.codigo)),
      ),
    [selectedGroups],
  )

  const selectableResponsables = useMemo(
    () =>
      responsables.filter((responsable) =>
        authenticatedUserId === null ? true : responsable.idUsuario !== authenticatedUserId,
      ),
    [authenticatedUserId, responsables],
  )

  const searchPlaceholder = useMemo(() => {
    const selectedOption = SEARCH_OPTIONS.find((option) => option.value === searchField)
    const selectedLabel = selectedOption?.label.toLocaleLowerCase('es-AR') ?? ''

    return `Filtrar por ${selectedLabel}`
  }, [searchField])

  const visibleResponsables = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLocaleLowerCase('es-AR')

    if (!normalizedSearch) {
      return selectableResponsables
    }

    return selectableResponsables.filter((responsable) =>
      getSearchableValue(responsable, searchField).includes(normalizedSearch),
    )
  }, [searchField, searchValue, selectableResponsables])

  const selectedGridResponsable = useMemo(
    () =>
      visibleResponsables.find((responsable) => responsable.idUsuario === selectedResponsableId) ??
      null,
    [selectedResponsableId, visibleResponsables],
  )

  useEffect(() => {
    if (
      selectedResponsableId !== null &&
      !visibleResponsables.some((responsable) => responsable.idUsuario === selectedResponsableId)
    ) {
      setSelectedResponsableId(null)
      setSelectedResponsableDetail(null)
      setFormState(EMPTY_FORM)
      setSelectedGroupIds([])
      setPasswordForm(EMPTY_PASSWORD_FORM)
      setError('')
      setSuccess('')
      setDeleteError('')
      setIsDeleteModalOpen(false)
    }
  }, [selectedResponsableId, visibleResponsables])

  const loadInitialData = useCallback(async () => {
    setIsInitialLoading(true)
    setError('')

    try {
      const [responsablesResponse, gruposResponse, formulariosResponse] = await Promise.all([
        usuariosService.getResponsablesGrid(),
        usuariosService.getGrupos(),
        formulariosService.getAll(),
      ])

      setResponsables(responsablesResponse)
      setGrupos(gruposResponse)
      setFormularios(formulariosResponse)
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'No pudimos cargar usuarios, grupos y permisos. Intenta nuevamente.',
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

  async function loadResponsableDetail(idUsuario: number) {
    setSelectedResponsableId(idUsuario)
    setSelectedResponsableDetail(null)
    setIsDetailLoading(true)
    setError('')
    setSuccess('')
    setPasswordForm(EMPTY_PASSWORD_FORM)

    try {
      const usuario = await usuariosService.getUsuarioById(idUsuario)
      const responsableGroupIds = usuario.grupos
        .filter((grupo) => !isSocioGroup(grupo))
        .map((grupo) => grupo.idGrupo)

      setSelectedResponsableDetail(usuario)
      setFormState(createFormStateFromUsuario(usuario))
      setSelectedGroupIds(responsableGroupIds)
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'No pudimos cargar el detalle del responsable seleccionado.',
        ),
      )
    } finally {
      setIsDetailLoading(false)
    }
  }

  function startCreateMode() {
    setSelectedResponsableId(null)
    setSelectedResponsableDetail(null)
    setFormState(EMPTY_FORM)
    setSelectedGroupIds([])
    setPasswordForm(EMPTY_PASSWORD_FORM)
    setError('')
    setSuccess('')
    setDeleteError('')
  }

  function updateFormField(field: keyof UsuarioFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function toggleGroup(idGrupo: number) {
    setSelectedGroupIds((current) =>
      current.includes(idGrupo)
        ? current.filter((currentId) => currentId !== idGrupo)
        : [...current, idGrupo],
    )
  }

  async function reloadResponsables() {
    const response = await usuariosService.getResponsablesGrid()
    setResponsables(response)
  }

  async function handleSubmit() {
    if (isSaving || !canSubmitCurrentMode) {
      return
    }

    const validationErrors = getValidationErrors(formState, selectedGroupIds, isEditing)

    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '))
      setSuccess('')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const basePayload = buildPayload(formState, selectedGroupIds)

      if (isEditing && selectedResponsableId) {
        const updatedResponsable = await usuariosService.updateResponsable(
          selectedResponsableId,
          basePayload,
        )
        await reloadResponsables()
        setSelectedResponsableDetail(updatedResponsable)
        setFormState(createFormStateFromUsuario(updatedResponsable))
        setSelectedGroupIds(
          updatedResponsable.grupos.filter((grupo) => !isSocioGroup(grupo)).map((grupo) => grupo.idGrupo),
        )
        setSuccess('Responsable actualizado correctamente.')
      } else {
        await usuariosService.registerResponsable({
          ...basePayload,
          password: formState.password,
        })
        await reloadResponsables()
        startCreateMode()
        setSuccess('Responsable creado correctamente.')
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isEditing
            ? 'No pudimos actualizar el responsable. Revisa los datos e intenta nuevamente.'
            : 'No pudimos crear el responsable. Revisa los datos e intenta nuevamente.',
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!selectedResponsableId || isChangingPassword || !canChangePassword) {
      return
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.repeatNewPassword) {
      setError('Completa la contrasena actual, la nueva contrasena y su repeticion.')
      setSuccess('')
      return
    }

    if (passwordForm.newPassword !== passwordForm.repeatNewPassword) {
      setError('La nueva contrasena y su repeticion deben coincidir.')
      setSuccess('')
      return
    }

    setIsChangingPassword(true)
    setError('')
    setSuccess('')

    try {
      const message = await usuariosService.changeResponsablePassword(selectedResponsableId, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm(EMPTY_PASSWORD_FORM)
      setSuccess(message || 'Contrasena cambiada correctamente.')
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'No pudimos cambiar la contrasena del responsable seleccionado.',
        ),
      )
    } finally {
      setIsChangingPassword(false)
    }
  }

  async function handleConfirmDelete() {
    if (!selectedResponsableId || isDeleting || !canDelete) {
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      await usuariosService.deleteResponsable(selectedResponsableId)
      await reloadResponsables()
      setIsDeleteModalOpen(false)
      startCreateMode()
      setSuccess('Responsable eliminado definitivamente.')
    } catch (requestError) {
      setDeleteError(
        getApiErrorMessage(
          requestError,
          'No pudimos eliminar el responsable seleccionado.',
        ),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  function getPermissionOwnerGroups(permissionCode: string) {
    return selectedGroups.filter((grupo) =>
      grupo.permisos.some((permiso) => permiso.codigo === permissionCode),
    )
  }

  return (
    <AppLayout>
      <main className="usuarios-page">
        <section className="usuarios-intro">
          <div>
            <span className="section-kicker">Gestionar gimnasio / Usuarios</span>
            <h1 className="dashboard-title">Usuarios responsables</h1>
            <p className="dashboard-copy">
              Administra responsables, sus grupos y la vista de permisos resultante para cada
              formulario.
            </p>
          </div>
          <BackToGymLink />
        </section>

        <section className="usuarios-workspace">
          <div className="usuarios-panel usuarios-panel--form">
            <div className="usuarios-panel__header">
              <div>
                <span className="section-kicker">{isEditing ? 'Edición' : 'Alta'}</span>
                <h2>{isEditing ? 'Consultar y editar responsable' : 'Crear responsable'}</h2>
              </div>
            </div>

            {isDetailLoading ? (
              <p className="inicio-status">Cargando detalle del responsable...</p>
            ) : null}
            {error ? <FormAlertModal type="error" message={error} /> : null}
            {success ? <FormAlertModal type="success" message={success} /> : null}

            <div className="usuarios-form-grid">
              <input
                type="text"
                name="usuarios-decoy-user"
                autoComplete="username"
                tabIndex={-1}
                aria-hidden="true"
                className="autofill-decoy"
              />
              <input
                type="password"
                name="usuarios-decoy-password"
                autoComplete="current-password"
                tabIndex={-1}
                aria-hidden="true"
                className="autofill-decoy"
              />
              <label className="field-group">
                <span className="field-label">Username</span>
                <input
                  className="field-input"
                  name="responsable-username"
                  autoComplete="new-password"
                  autoCorrect="off"
                  spellCheck={false}
                  value={formState.username}
                  onChange={(event) => updateFormField('username', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                />
              </label>

              {!isEditing ? (
                <>
                  <label className="field-group">
                    <span className="field-label">Password</span>
                    <input
                      className="field-input"
                      type="password"
                      name="responsable-password"
                      autoComplete="new-password"
                      value={formState.password}
                      onChange={(event) => updateFormField('password', event.target.value)}
                      disabled={isSaving}
                    />
                  </label>
                  <label className="field-group">
                    <span className="field-label">Repetir password</span>
                    <input
                      className="field-input"
                      type="password"
                      name="responsable-repeat-password"
                      autoComplete="new-password"
                      value={formState.repeatPassword}
                      onChange={(event) => updateFormField('repeatPassword', event.target.value)}
                      disabled={isSaving}
                    />
                  </label>
                </>
              ) : null}

              <label className="field-group">
                <span className="field-label">Nombre</span>
                <input
                  className="field-input"
                  value={formState.nombre}
                  onChange={(event) => updateFormField('nombre', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                />
              </label>
              <label className="field-group">
                <span className="field-label">Apellido</span>
                <input
                  className="field-input"
                  value={formState.apellido}
                  onChange={(event) => updateFormField('apellido', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                />
              </label>
              <label className="field-group">
                <span className="field-label">Email</span>
                <input
                  className="field-input"
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateFormField('email', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                />
              </label>
              <label className="field-group">
                <span className="field-label">Telefono</span>
                <input
                  className="field-input"
                  value={formState.telefono}
                  onChange={(event) => updateFormField('telefono', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                />
              </label>
              <label className="field-group">
                <span className="field-label">Direccion</span>
                <input
                  className="field-input"
                  value={formState.direccion}
                  onChange={(event) => updateFormField('direccion', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                />
              </label>
              <label className="field-group">
                <span className="field-label">Ciudad</span>
                <input
                  className="field-input"
                  value={formState.ciudad}
                  onChange={(event) => updateFormField('ciudad', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                />
              </label>
              <label className="field-group">
                <span className="field-label">Tipo documento</span>
                <input
                  className="field-input"
                  value={formState.tipoDocumento}
                  onChange={(event) => updateFormField('tipoDocumento', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                />
              </label>
              <label className="field-group">
                <span className="field-label">Nro documento</span>
                <input
                  className="field-input"
                  value={formState.nroDocumento}
                  onChange={(event) => updateFormField('nroDocumento', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                />
              </label>
              <label className="field-group">
                <span className="field-label">Genero</span>
                <select
                  className="field-input"
                  value={formState.genero}
                  onChange={(event) => updateFormField('genero', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                >
                  <option value="">Sin especificar</option>
                  {GENERO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span className="field-label">Fecha nacimiento</span>
                <input
                  className="field-input"
                  type="date"
                  value={formState.fechaNacimiento}
                  onChange={(event) => updateFormField('fechaNacimiento', event.target.value)}
                  disabled={isSaving || isDetailLoading}
                />
              </label>
            </div>

            <section className="usuarios-subsection">
              <div className="usuarios-subsection__heading">
                <h3>Grupos</h3>
                <span>{selectedGroupIds.length} seleccionados</span>
              </div>
              <div className="usuarios-chip-list">
                {availableGroups.length === 0 ? (
                  <p className="usuarios-empty-inline">No hay grupos responsables disponibles.</p>
                ) : (
                  availableGroups.map((grupo) => {
                    const isSelected = selectedGroupIds.includes(grupo.idGrupo)

                    return (
                      <button
                        key={grupo.idGrupo}
                        className={isSelected ? 'usuarios-chip usuarios-chip--selected' : 'usuarios-chip'}
                        type="button"
                        onClick={() => toggleGroup(grupo.idGrupo)}
                        disabled={isSaving || isDetailLoading}
                      >
                        {grupo.nombre}
                      </button>
                    )
                  })
                )}
              </div>
            </section>

            <section className="usuarios-subsection">
              <div className="usuarios-subsection__heading">
                <h3>Formularios y permisos</h3>
                <span>{formularios.length} formularios</span>
              </div>

              <div className="usuarios-accordion-list">
                {formularios.length === 0 ? (
                  <p className="usuarios-empty-inline">No hay formularios con permisos cargados.</p>
                ) : (
                  formularios.map((formulario) => {
                    const activeCount = formulario.permisos.filter((permiso) =>
                      selectedPermissionCodes.has(permiso),
                    ).length

                    return (
                      <details
                        key={formulario.idFormulario}
                        className="usuarios-accordion"
                        open={activeCount > 0}
                      >
                        <summary>
                          <span>{formulario.nombreFormulario}</span>
                          <strong>{activeCount} activos</strong>
                        </summary>
                        <div className="usuarios-permission-list">
                          {formulario.permisos.map((permissionCode) => {
                            const ownerGroups = getPermissionOwnerGroups(permissionCode)
                            const isActive = ownerGroups.length > 0
                            const title = isActive
                              ? `Este permiso pertenece a: ${ownerGroups
                                  .map((grupo) => grupo.nombre)
                                  .join(', ')}`
                              : 'Este permiso no esta incluido en los grupos seleccionados'

                            return (
                              <span
                                key={permissionCode}
                                className={
                                  isActive
                                    ? 'usuarios-permission usuarios-permission--active'
                                    : 'usuarios-permission'
                                }
                                title={title}
                              >
                                {permissionCode}
                              </span>
                            )
                          })}
                        </div>
                      </details>
                    )
                  })
                )}
              </div>
            </section>

            {isEditing && canChangePassword ? (
              <section className="usuarios-subsection usuarios-password-section">
                <div className="usuarios-subsection__heading">
                  <h3>Cambio de contrasena</h3>
                  <span>ID {selectedResponsableId}</span>
                </div>
                <div className="usuarios-password-grid">
                  <label className="field-group">
                    <span className="field-label">Contrasena actual</span>
                    <input
                      className="field-input"
                      type="password"
                      name="responsable-current-password"
                      autoComplete="new-password"
                      value={passwordForm.currentPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          currentPassword: event.target.value,
                        }))
                      }
                      disabled={isChangingPassword}
                    />
                  </label>
                  <label className="field-group">
                    <span className="field-label">Nueva contrasena</span>
                    <input
                      className="field-input"
                      type="password"
                      name="responsable-new-password"
                      autoComplete="new-password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      disabled={isChangingPassword}
                    />
                  </label>
                  <label className="field-group">
                    <span className="field-label">Repetir nueva contrasena</span>
                    <input
                      className="field-input"
                      type="password"
                      name="responsable-repeat-new-password"
                      autoComplete="new-password"
                      value={passwordForm.repeatNewPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          repeatNewPassword: event.target.value,
                        }))
                      }
                      disabled={isChangingPassword}
                    />
                  </label>
                </div>
                <button
                  className="ghost-button usuarios-password-button"
                  type="button"
                  disabled={isChangingPassword || !selectedResponsableId}
                  onClick={() => void handleChangePassword()}
                >
                  {isChangingPassword ? 'Cambiando...' : 'Cambiar contrasena'}
                </button>
              </section>
            ) : null}

            <div className="usuarios-form-actions">
              {canSubmitCurrentMode ? (
                <button
                  className="submit-button usuarios-submit"
                  type="button"
                  disabled={isSaving || isDetailLoading}
                  onClick={() => void handleSubmit()}
                >
                  {isSaving ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
                </button>
              ) : null}

              <button
                className="ghost-button usuarios-new-button"
                type="button"
                onClick={startCreateMode}
              >
                Nuevo
              </button>

              {isEditing && canDelete ? (
                <button
                  className="ghost-button usuarios-danger-action"
                  type="button"
                  disabled={!selectedResponsableId || isDeleting}
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

          <aside className="usuarios-panel usuarios-panel--grid">
            <div className="usuarios-panel__header">
              <div>
                <span className="section-kicker">LISTADO</span>
                <h2>Responsables</h2>
              </div>
              <span className="usuarios-count">{visibleResponsables.length}</span>
            </div>

            <div className="usuarios-grid-filters" aria-label="Filtros de responsables">
              <input
                type="text"
                name="usuarios-filter-decoy-user"
                autoComplete="username"
                tabIndex={-1}
                aria-hidden="true"
                className="autofill-decoy"
              />
              <input
                type="password"
                name="usuarios-filter-decoy-password"
                autoComplete="current-password"
                tabIndex={-1}
                aria-hidden="true"
                className="autofill-decoy"
              />
              <label className="field-group usuarios-filter-field">
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
              <label className="field-group usuarios-filter-field usuarios-filter-field--search">
                <input
                  className="field-input"
                  type="text"
                  name="usuarios-filter-query"
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

            {isInitialLoading ? <p className="inicio-status">Cargando responsables...</p> : null}

            {!isInitialLoading ? (
              <>
                <div className="usuarios-table-wrap">
                  <table className="socios-table usuarios-table">
                    <thead>
                      <tr>
                        <th aria-label="Seleccion" />
                        <th>Usuario</th>
                        <th>Nombre y apellido</th>
                        <th>Email</th>
                        <th>Roles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleResponsables.length === 0 ? (
                        <tr>
                          <td className="socios-empty" colSpan={5}>
                            {selectableResponsables.length === 0
                              ? 'No hay responsables disponibles para administrar.'
                              : 'No encontramos responsables para el filtro actual.'}
                          </td>
                        </tr>
                      ) : (
                        visibleResponsables.map((responsable) => {
                          const isSelected = responsable.idUsuario === selectedResponsableId

                          return (
                            <tr
                              key={responsable.idUsuario}
                              className={
                                isSelected ? 'socios-row socios-row--selected' : 'socios-row'
                              }
                              onClick={() => void loadResponsableDetail(responsable.idUsuario)}
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
                              <td data-label="Usuario" className="socios-cell">
                                <strong>{responsable.username}</strong>
                              </td>
                              <td data-label="Nombre y apellido" className="socios-cell">
                                {responsable.nombreCompleto || '-'}
                              </td>
                              <td data-label="Email" className="socios-cell">
                                {responsable.email || '-'}
                              </td>
                              <td data-label="Roles" className="socios-cell">
                                <div className="usuarios-role-list">
                                  {responsable.nombreGrupo.length === 0 ? (
                                    <span className="usuarios-role-chip usuarios-role-chip--empty">
                                      Sin grupo
                                    </span>
                                  ) : (
                                    responsable.nombreGrupo.map((nombreGrupo) => (
                                      <span key={nombreGrupo} className="usuarios-role-chip">
                                        {nombreGrupo}
                                      </span>
                                    ))
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </aside>
        </section>

        {isDeleteModalOpen ? (
          <div className="consultar-backdrop" role="presentation">
            <section
              className="consultar-modal eliminar-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="eliminar-responsable-title"
            >
              <header className="consultar-header eliminar-modal__header">
                <div>
                  <h2 id="eliminar-responsable-title">Confirmar eliminacion</h2>
                  <div className="consultar-meta">
                    <span className="consultar-status consultar-status--danger">
                      Definitiva
                    </span>
                    <span>ID: {selectedResponsableId}</span>
                  </div>
                </div>
                <button
                  className="consultar-close"
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  x
                </button>
              </header>
              <div className="consultar-body eliminar-modal__body">
                <div className="eliminar-modal__content">
                  <p className="eliminar-modal__label">Responsable seleccionado</p>
                  <h3>
                    {getResponsableDisplayName(selectedResponsableDetail ?? selectedGridResponsable)}
                  </h3>
                  <p className="eliminar-modal__copy">
                    Esta accion borrara definitivamente el responsable seleccionado. La grilla se
                    actualizara con el resultado devuelto por el backend.
                  </p>
                  {deleteError ? <FormAlertModal type="error" message={deleteError} /> : null}
                </div>
              </div>
              <footer className="consultar-footer eliminar-modal__footer">
                <button
                  className="ghost-button consultar-footer__close"
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
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
