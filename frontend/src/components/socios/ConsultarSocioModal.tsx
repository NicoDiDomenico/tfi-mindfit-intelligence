import { useEffect, useId, useMemo, useState } from 'react'
import { FormAlertModal } from '../FormAlertModal'
import { PlanAlimenticioUploadButton } from '../PlanAlimenticioUploadButton'
import { authService } from '../../services/authService'
import { sociosService } from '../../services/sociosService'
import {
  getPerfilIAOtherDetail,
  getPerfilIAOptionsWithCurrent,
  hasPerfilIAToken,
  PERFIL_IA_CONDICIONES_OPTIONS,
  PERFIL_IA_DISPONIBILIDAD_OPTIONS,
  PERFIL_IA_DURACION_OPTIONS,
  PERFIL_IA_INTENSIDAD_OPTIONS,
  PERFIL_IA_LESIONES_OPTIONS,
  PERFIL_IA_MOTIVACION_OPTIONS,
  PERFIL_IA_NIVEL_OPTIONS,
  PERFIL_IA_OBJETIVO_OPTIONS,
  setPerfilIAOtherDetail,
  togglePerfilIAToken,
} from '../../constants/perfilIAOptions'
import type {
  ChangePasswordRequestDto,
  DiaDto,
  EstadoSocio,
  GeneroSocio,
  PerfilIAUpdateDto,
  PlanSocio,
  UsuarioDto,
  UsuarioUpdateDto,
} from '../../types/socio'
import { getSociosErrorMessage } from '../../utils/apiError'
import { formatDateCell } from '../../utils/date'
import { extractPdfText } from '../../utils/pdfText'

const EDIT_PERMISSION = 'EDITAR_USUARIO_SOCIO'
const CHANGE_PASSWORD_PERMISSION = 'CAMBIAR_CONTRASENA_SOCIO'
const DELETE_PERMISSION = 'ELIMINAR_USUARIO_SOCIO_DEFINITIVAMENTE'

function EditPencilIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

const TABS = [
  { id: 'personal', label: 'Info. Personal', icon: 'P' },
  { id: 'facturacion', label: 'Facturacion', icon: '$' },
  { id: 'perfilIA', label: 'Perfil IA', icon: 'IA' },
  { id: 'seguridad', label: 'Seguridad', icon: 'K' },
] as const

type TabId = (typeof TABS)[number]['id']
export type ConsultarSocioTabId = TabId

interface SocioFormState {
  nombre: string
  apellido: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  tipoDocumento: string
  nroDocumento: string
  genero: GeneroSocio | ''
  fechaNacimiento: string
  obraSocial: string
  fechaNotificacion: string
  respuestaNotificacion: boolean | null
  pregunta: string
  respuesta: string
  perfilIA: {
    objetivoPrincipal: string
    nivelExperiencia: string
    ejerciciosPreferidos: string
    ejerciciosAEvitar: string
    disponibilidadHoraria: string
    motivacionPersonal: string
    lesionesLimitaciones: string
    condicionesMedicasRelevantes: string
    intensidadPreferida: string
    duracionSesionMinutos: string
    notasEntrenador: string
    planAlimenticio: string
  }
}

interface RenovacionState {
  active: boolean
  plan: PlanSocio
  monto: string
}

interface PasswordState extends ChangePasswordRequestDto {
  visible: boolean
}

interface ConsultarSocioModalProps {
  idUsuario: number
  userPermissions: readonly string[]
  initialTab?: ConsultarSocioTabId
  readOnly?: boolean
  onClose: () => void
  onDeleted: () => void
  onUpdated: () => void
}

function hasPermission(userPermissions: readonly string[], permission: string) {
  return userPermissions.includes(permission)
}

function toText(value: string | null | undefined) {
  return value ?? ''
}

function toNullable(value: string) {
  const cleanValue = value.trim()
  return cleanValue ? cleanValue : null
}

function toNullablePositiveNumber(value: string) {
  const cleanValue = value.trim()

  if (!cleanValue) {
    return null
  }

  const numberValue = Number(cleanValue)
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null
}

function toDateInput(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  return value.split('T')[0] ?? ''
}

function getSocioName(usuario: UsuarioDto | null) {
  const socio = usuario?.personaSocio

  if (!socio) {
    return 'Socio'
  }

  return `${socio.nombre} ${socio.apellido}`.trim() || usuario.username
}

function getLatestCuota(usuario: UsuarioDto | null) {
  const cuotas = usuario?.personaSocio?.cuotas ?? []

  return [...cuotas].sort((a, b) => {
    const first = new Date(a.fechaFinPeriodo).getTime()
    const second = new Date(b.fechaFinPeriodo).getTime()
    return second - first
  })[0]
}

function getInitialFormState(usuario: UsuarioDto): SocioFormState {
  const socio = usuario.personaSocio

  return {
    nombre: toText(socio?.nombre),
    apellido: toText(socio?.apellido),
    email: toText(socio?.email),
    telefono: toText(socio?.telefono),
    direccion: toText(socio?.direccion),
    ciudad: toText(socio?.ciudad),
    tipoDocumento: toText(socio?.tipoDocumento),
    nroDocumento: toText(socio?.nroDocumento),
    genero: socio?.genero ?? '',
    fechaNacimiento: toDateInput(socio?.fechaNacimiento),
    obraSocial: toText(socio?.obraSocial),
    fechaNotificacion: toDateInput(socio?.fechaNotificacion),
    respuestaNotificacion: socio?.respuestaNotificacion ?? null,
    pregunta: toText(socio?.pregunta),
    respuesta: toText(socio?.respuesta),
    perfilIA: {
      objetivoPrincipal: toText(socio?.perfilIA?.objetivoPrincipal),
      nivelExperiencia: toText(socio?.perfilIA?.nivelExperiencia),
      ejerciciosPreferidos: toText(socio?.perfilIA?.ejerciciosPreferidos),
      ejerciciosAEvitar: toText(socio?.perfilIA?.ejerciciosAEvitar),
      disponibilidadHoraria: toText(socio?.perfilIA?.disponibilidadHoraria),
      motivacionPersonal: toText(socio?.perfilIA?.motivacionPersonal),
      lesionesLimitaciones: toText(socio?.perfilIA?.lesionesLimitaciones),
      condicionesMedicasRelevantes: toText(socio?.perfilIA?.condicionesMedicasRelevantes),
      intensidadPreferida: toText(socio?.perfilIA?.intensidadPreferida),
      duracionSesionMinutos:
        socio?.perfilIA?.duracionSesionMinutos == null ? '' : String(socio.perfilIA.duracionSesionMinutos),
      notasEntrenador: toText(socio?.perfilIA?.notasEntrenador),
      planAlimenticio: toText(socio?.perfilIA?.planAlimenticio),
    },
  }
}

function getInitialDias(usuario: UsuarioDto) {
  return (
    usuario.personaSocio?.rutinas
      ?.filter((rutina) => rutina.activo)
      .map((rutina) => rutina.idDia) ?? []
  )
}

function getPerfilPayload(perfilIA: SocioFormState['perfilIA']): PerfilIAUpdateDto {
  return {
    objetivoPrincipal: toNullable(perfilIA.objetivoPrincipal),
    nivelExperiencia: toNullable(perfilIA.nivelExperiencia),
    ejerciciosPreferidos: toNullable(perfilIA.ejerciciosPreferidos),
    ejerciciosAEvitar: toNullable(perfilIA.ejerciciosAEvitar),
    disponibilidadHoraria: toNullable(perfilIA.disponibilidadHoraria),
    motivacionPersonal: toNullable(perfilIA.motivacionPersonal),
    lesionesLimitaciones: toNullable(perfilIA.lesionesLimitaciones),
    condicionesMedicasRelevantes: toNullable(perfilIA.condicionesMedicasRelevantes),
    intensidadPreferida: toNullable(perfilIA.intensidadPreferida),
    duracionSesionMinutos: toNullablePositiveNumber(perfilIA.duracionSesionMinutos),
    notasEntrenador: toNullable(perfilIA.notasEntrenador),
    planAlimenticio: toNullable(perfilIA.planAlimenticio),
  }
}

function areSameNumberLists(first: number[], second: number[]) {
  if (first.length !== second.length) {
    return false
  }

  const normalizedFirst = [...first].sort((a, b) => a - b)
  const normalizedSecond = [...second].sort((a, b) => a - b)

  return normalizedFirst.every((value, index) => value === normalizedSecond[index])
}

function buildUpdatePayload(
  usuario: UsuarioDto,
  formState: SocioFormState,
  selectedDias: number[],
  renovacion: RenovacionState,
): UsuarioUpdateDto {
  return {
    username: usuario.username,
    tipoPersona: 'Socio',
    personaResponsable: null,
    personaSocio: {
      nombre: formState.nombre.trim(),
      apellido: formState.apellido.trim(),
      email: formState.email.trim(),
      telefono: toNullable(formState.telefono),
      direccion: toNullable(formState.direccion),
      ciudad: toNullable(formState.ciudad),
      tipoDocumento: formState.tipoDocumento.trim(),
      nroDocumento: formState.nroDocumento.trim(),
      genero: formState.genero || null,
      fechaNacimiento: formState.fechaNacimiento || null,
      obraSocial: toNullable(formState.obraSocial),
      fechaNotificacion: formState.fechaNotificacion || null,
      respuestaNotificacion: formState.respuestaNotificacion,
      pregunta: toNullable(formState.pregunta),
      respuesta: toNullable(formState.respuesta),
      diasActivosIds: selectedDias,
      perfilIA: getPerfilPayload(formState.perfilIA),
      cuota: {
        renueva: renovacion.active,
        plan: renovacion.active ? renovacion.plan : null,
        monto: renovacion.active ? Number(renovacion.monto) : null,
      },
    },
    idGrupos: usuario.grupos.map((grupo) => grupo.idGrupo),
  }
}

function getStatusClass(estadoSocio: EstadoSocio | undefined) {
  const normalized = estadoSocio?.toLocaleLowerCase('es-AR')

  if (normalized === 'eliminado') {
    return 'consultar-status consultar-status--danger'
  }

  if (normalized === 'suspendido') {
    return 'consultar-status consultar-status--warning'
  }

  if (normalized === 'actualizado') {
    return 'consultar-status consultar-status--info'
  }

  return 'consultar-status consultar-status--success'
}

export function ConsultarSocioModal({
  idUsuario,
  userPermissions,
  initialTab = 'personal',
  readOnly = false,
  onClose,
  onDeleted,
  onUpdated,
}: ConsultarSocioModalProps) {
  const [usuario, setUsuario] = useState<UsuarioDto | null>(null)
  const [dias, setDias] = useState<DiaDto[]>([])
  const [formState, setFormState] = useState<SocioFormState | null>(null)
  const [selectedDias, setSelectedDias] = useState<number[]>([])
  const [initialFormState, setInitialFormState] = useState<SocioFormState | null>(null)
  const [initialSelectedDias, setInitialSelectedDias] = useState<number[]>([])
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [renovacion, setRenovacion] = useState<RenovacionState>({
    active: false,
    plan: 'Mensual',
    monto: '',
  })
  const [passwordState, setPasswordState] = useState<PasswordState>({
    visible: false,
    currentPassword: '',
    newPassword: '',
  })
  const [isPasswordAutofillGuardEnabled, setIsPasswordAutofillGuardEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExtractingPlanFile, setIsExtractingPlanFile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canEdit = !readOnly && hasPermission(userPermissions, EDIT_PERMISSION)
  const canChangePassword = readOnly || hasPermission(userPermissions, CHANGE_PASSWORD_PERMISSION)
  const canDelete = !readOnly && hasPermission(userPermissions, DELETE_PERMISSION)
  const socio = usuario?.personaSocio ?? null
  const passwordFormKey = useId()
  const latestCuota = useMemo(() => getLatestCuota(usuario), [usuario])
  const socioName = getSocioName(usuario)
  const modalTitle = readOnly ? `Mi perfil: ${socioName}` : `Consultar Socio: ${socioName}`
  const visibleTabs = readOnly
    ? TABS.map((tab) =>
        tab.id === 'seguridad' ? { ...tab, label: 'Cambiar contrasena' } : tab,
      )
    : TABS
  const isDirty = useMemo(() => {
    if (readOnly) {
      return false
    }

    if (!formState || !initialFormState) {
      return false
    }

    const formChanged = JSON.stringify(formState) !== JSON.stringify(initialFormState)
    const diasChanged = !areSameNumberLists(selectedDias, initialSelectedDias)
    const renovacionChanged = renovacion.active || renovacion.monto.trim() !== ''

    return formChanged || diasChanged || renovacionChanged
  }, [formState, initialFormState, selectedDias, initialSelectedDias, renovacion, readOnly])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [idUsuario, initialTab])

  useEffect(() => {
    let isActive = true

    async function loadSocio() {
      setIsLoading(true)
      setError('')
      setSuccess('')

      try {
        const [diasResponse, usuarioResponse] = await Promise.all([
          sociosService.getDias(),
          sociosService.getSocioById(idUsuario),
        ])

        if (!isActive) {
          return
        }

        const nextFormState = getInitialFormState(usuarioResponse)
        const nextSelectedDias = getInitialDias(usuarioResponse)

        setDias(diasResponse)
        setUsuario(usuarioResponse)
        setFormState(nextFormState)
        setInitialFormState(nextFormState)
        setSelectedDias(nextSelectedDias)
        setInitialSelectedDias(nextSelectedDias)
        setEditingFields({})
        setRenovacion({ active: false, plan: 'Mensual', monto: '' })
      } catch (requestError) {
        if (isActive) {
          setError(getSociosErrorMessage(requestError))
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadSocio()

    return () => {
      isActive = false
    }
  }, [idUsuario])

  function requestClose() {
    if (isDirty) {
      setIsCloseConfirmOpen(true)
      return
    }

    onClose()
  }

  function confirmClose() {
    setIsCloseConfirmOpen(false)
    onClose()
  }

  function setField<K extends keyof SocioFormState>(field: K, value: SocioFormState[K]) {
    if (!formState) {
      return
    }

    setFormState({ ...formState, [field]: value })
  }

  function setPerfilField<K extends keyof SocioFormState['perfilIA']>(
    field: K,
    value: SocioFormState['perfilIA'][K],
  ) {
    if (!formState) {
      return
    }

    setFormState({
      ...formState,
      perfilIA: {
        ...formState.perfilIA,
        [field]: value,
      },
    })
  }

  function toggleEditing(field: string) {
    setEditingFields((current) => ({ ...current, [field]: !current[field] }))
  }

  async function handlePlanFileSelected(file: File) {
    if (!canEdit) {
      return
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

    if (!isPdf) {
      setError('Selecciona un archivo PDF para cargar el plan alimenticio.')
      setSuccess('')
      return
    }

    setIsExtractingPlanFile(true)
    setError('')
    setSuccess('')

    try {
      const text = await extractPdfText(file)

      setPerfilField('planAlimenticio', text)
      setEditingFields((current) => ({ ...current, 'perfilIA.planAlimenticio': true }))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo leer el PDF seleccionado.')
    } finally {
      setIsExtractingPlanFile(false)
    }
  }

  function toggleDia(idDia: number) {
    setSelectedDias((current) =>
      current.includes(idDia) ? current.filter((dia) => dia !== idDia) : [...current, idDia],
    )
  }

  function resetRenovacion() {
    setRenovacion({ active: false, plan: 'Mensual', monto: '' })
  }

  function validateBeforeSave() {
    if (!formState) {
      return 'No se cargaron los datos del socio.'
    }

    if (
      !formState.nombre.trim() ||
      !formState.apellido.trim() ||
      !formState.email.trim() ||
      !formState.tipoDocumento.trim() ||
      !formState.nroDocumento.trim()
    ) {
      return 'Completa nombre, apellido, email, tipo y numero de documento.'
    }

    if (selectedDias.length === 0) {
      return 'Selecciona al menos un dia de asistencia.'
    }

    if (renovacion.active && (!renovacion.plan || Number(renovacion.monto) <= 0)) {
      return 'Para renovar la cuota indica plan y monto mayor a cero.'
    }

    return ''
  }

  async function handleSave() {
    if (!usuario || !formState || !canEdit) {
      return
    }

    const validationError = validateBeforeSave()

    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const updatedSocio = await sociosService.updateSocio(
        idUsuario,
        buildUpdatePayload(usuario, formState, selectedDias, renovacion),
      )
      const nextFormState = getInitialFormState(updatedSocio)
      const nextSelectedDias = getInitialDias(updatedSocio)

      setUsuario(updatedSocio)
      setFormState(nextFormState)
      setInitialFormState(nextFormState)
      setSelectedDias(nextSelectedDias)
      setInitialSelectedDias(nextSelectedDias)
      setEditingFields({})
      resetRenovacion()
      setSuccess('Cambios confirmados correctamente.')
      onUpdated()
    } catch (requestError) {
      setError(getSociosErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!canDelete || socio?.estadoSocio !== 'Eliminado') {
      return
    }

    setIsDeleteConfirmOpen(true)
  }

  async function confirmPermanentDelete() {
    if (!canDelete || socio?.estadoSocio !== 'Eliminado' || isDeleting) {
      return
    }

    setIsDeleteConfirmOpen(false)
    setIsDeleting(true)
    setError('')
    setSuccess('')

    try {
      await sociosService.deleteSocioDefinitivamente(idUsuario)
      setSuccess('Socio borrado definitivamente.')
      onDeleted()
    } catch (requestError) {
      setError(getSociosErrorMessage(requestError))
    } finally {
      setIsDeleting(false)
    }
  }

  async function handlePasswordChange() {
    if (!canChangePassword) {
      return
    }

    if (!passwordState.currentPassword || passwordState.newPassword.length < 8) {
      setError('Completa la contrasena actual y una nueva contrasena de al menos 8 caracteres.')
      setSuccess('')
      return
    }

    setIsChangingPassword(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
      }
      const response = readOnly
        ? await authService.changePasswordSocio(payload)
        : await sociosService.changeSocioPassword(idUsuario, payload)

      setIsPasswordAutofillGuardEnabled(true)
      setPasswordState({ visible: false, currentPassword: '', newPassword: '' })
      setSuccess(response || 'Contrasena cambiada correctamente.')
    } catch (requestError) {
      setError(getSociosErrorMessage(requestError))
    } finally {
      setIsChangingPassword(false)
    }
  }

  function renderField(
    field: keyof SocioFormState,
    label: string,
    options?: { type?: string; choices?: string[] },
  ) {
    if (!formState) {
      return null
    }

    const isEditing = Boolean(editingFields[field])
    const value = String(formState[field] ?? '')
    const inputType = options?.type ?? 'text'

    return (
      <label className="consultar-field">
        <span className="perfil-ia-label-row">
          <span>{label}</span>
          {canEdit ? (
            <button
              className="consultar-edit"
              type="button"
              aria-label={`Editar ${label}`}
              title={`Editar ${label}`}
              onClick={() => toggleEditing(String(field))}
            >
              <EditPencilIcon />
            </button>
          ) : null}
        </span>
        <span className="consultar-field__control">
          {options?.choices ? (
            <select
              className="consultar-input"
              value={value}
              disabled={!isEditing}
              onChange={(event) => setField(field, event.target.value as SocioFormState[typeof field])}
            >
              <option value="">Sin especificar</option>
              {options.choices.map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="consultar-input"
              type={inputType}
              value={value}
              disabled={!isEditing}
              onChange={(event) => setField(field, event.target.value as SocioFormState[typeof field])}
            />
          )}
        </span>
      </label>
    )
  }

  function renderPerfilField(
    field: keyof SocioFormState['perfilIA'],
    label: string,
    options?: {
      type?: 'text' | 'number' | 'textarea'
      choices?: readonly string[]
      structuredChoices?: readonly string[]
      placeholder?: string
    },
  ) {
    if (!formState) {
      return null
    }

    const isEditing = Boolean(editingFields[`perfilIA.${field}`])
    const inputType = options?.type ?? 'text'
    const value = formState.perfilIA[field]
    const isPlanAlimenticio = field === 'planAlimenticio'

    return (
      <label className={inputType === 'textarea' || options?.structuredChoices ? 'consultar-field consultar-field--wide' : 'consultar-field'}>
        {isPlanAlimenticio ? (
          <span className="perfil-ia-label-row">
            <span>{label}</span>
            {canEdit ? (
              <button
                className="consultar-edit"
                type="button"
                aria-label={`Editar ${label}`}
                title={`Editar ${label}`}
                onClick={() => toggleEditing(`perfilIA.${field}`)}
              >
                <EditPencilIcon />
              </button>
            ) : null}
            {canEdit ? (
              <PlanAlimenticioUploadButton
                disabled={isSaving || isLoading}
                isLoading={isExtractingPlanFile}
                onFileSelected={handlePlanFileSelected}
              />
            ) : null}
          </span>
        ) : (
          <span className="perfil-ia-label-row">
            <span>{label}</span>
            {canEdit ? (
              <button
                className="consultar-edit"
                type="button"
                aria-label={`Editar ${label}`}
                title={`Editar ${label}`}
                onClick={() => toggleEditing(`perfilIA.${field}`)}
              >
                <EditPencilIcon />
              </button>
            ) : null}
          </span>
        )}
        <span className="consultar-field__control">
          {options?.choices ? (
            <select
              className="consultar-input"
              value={value}
              disabled={!isEditing}
              onChange={(event) => setPerfilField(field, event.target.value)}
            >
              <option value="">Sin especificar</option>
              {getPerfilIAOptionsWithCurrent(options.choices, value).map((choice) => (
                <option key={choice} value={choice}>
                  {choice}
                </option>
              ))}
            </select>
          ) : inputType === 'textarea' || options?.structuredChoices ? (
            <span className="perfil-ia-composite-field">
              {options?.structuredChoices ? (
                <span className="perfil-ia-chip-list">
                  {options.structuredChoices.map((choice) => (
                    <label
                      key={choice}
                      className={
                        hasPerfilIAToken(value, choice, options.structuredChoices)
                          ? 'perfil-ia-chip perfil-ia-chip--selected'
                          : 'perfil-ia-chip'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={hasPerfilIAToken(value, choice, options.structuredChoices)}
                        disabled={!isEditing}
                        onChange={() => setPerfilField(field, togglePerfilIAToken(value, choice, options.structuredChoices))}
                      />
                      <span>{choice}</span>
                    </label>
                  ))}
                </span>
              ) : null}
              <textarea
                className={
                  isPlanAlimenticio
                    ? 'consultar-input perfil-ia-textarea perfil-ia-textarea--plan-alimenticio'
                    : 'consultar-input perfil-ia-textarea'
                }
                value={options?.structuredChoices ? getPerfilIAOtherDetail(value, options.structuredChoices) : value}
                disabled={
                  !isEditing ||
                  (options?.structuredChoices ? !hasPerfilIAToken(value, 'Otra', options.structuredChoices) : false)
                }
                placeholder={options?.structuredChoices ? 'Detalle para Otra' : options?.placeholder}
                rows={options?.structuredChoices ? 3 : isPlanAlimenticio ? 12 : 4}
                onChange={(event) =>
                  setPerfilField(
                    field,
                    options?.structuredChoices
                      ? setPerfilIAOtherDetail(value, event.target.value, options.structuredChoices)
                      : event.target.value,
                  )
                }
              />
            </span>
          ) : (
            <input
              className="consultar-input"
              type={inputType}
              min={inputType === 'number' ? '1' : undefined}
              value={value}
              disabled={!isEditing}
              onChange={(event) => setPerfilField(field, event.target.value)}
            />
          )}
        </span>
      </label>
    )
  }

  return (
    <div className="consultar-backdrop" role="presentation">
      <section
        className="consultar-modal consultar-socio-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consultar-socio-title"
      >
        <header className="consultar-header">
          <div>
            <h2 id="consultar-socio-title">{modalTitle}</h2>
            <div className="consultar-meta">
              <span className={getStatusClass(socio?.estadoSocio)}>{socio?.estadoSocio ?? '-'}</span>
              <span>ID: {idUsuario}</span>
            </div>
          </div>
          <button className="consultar-close" type="button" aria-label="Cerrar" onClick={requestClose}>
            x
          </button>
        </header>

        <nav className="consultar-tabs" aria-label="Secciones de consulta">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'consultar-tab consultar-tab--active' : 'consultar-tab'}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="consultar-body">
          {isLoading ? <p className="inicio-status">Cargando datos del socio...</p> : null}
          {error ? <FormAlertModal type="error" message={error} /> : null}

          {!isLoading && formState && usuario ? (
            <>
              {activeTab === 'personal' ? (
                <div className="consultar-section">
                  <h3>Datos Personales</h3>
                  <div className="consultar-grid">
                    {renderField('nombre', 'Nombre')}
                    {renderField('apellido', 'Apellido')}
                    {renderField('email', 'Email', { type: 'email' })}
                    {renderField('telefono', 'Telefono')}
                    {renderField('fechaNacimiento', 'Fecha de Nacimiento', { type: 'date' })}
                    {renderField('genero', 'Genero', {
                      choices: ['Masculino', 'Femenino', 'Otro'],
                    })}
                    {renderField('tipoDocumento', 'Tipo Documento')}
                    {renderField('nroDocumento', 'Nro Documento')}
                    {renderField('ciudad', 'Ciudad')}
                    {renderField('direccion', 'Direccion')}
                    {renderField('obraSocial', 'Obra Social')}
                  </div>

                  <div className="consultar-days">
                    <h3>Dias de Asistencia</h3>
                    <div className="consultar-day-list">
                      {dias.map((dia) => (
                        <label
                          key={dia.idDia}
                          className={
                            selectedDias.includes(dia.idDia)
                              ? 'consultar-day consultar-day--active'
                              : 'consultar-day'
                          }
                        >
                          <input
                            type="checkbox"
                            checked={selectedDias.includes(dia.idDia)}
                            disabled={!canEdit}
                            onChange={() => toggleDia(dia.idDia)}
                          />
                          <span>{dia.nombreDia}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'facturacion' ? (
                <div className="consultar-section consultar-section--billing">
                  <h3>Facturacion</h3>
                  <div className="consultar-billing-card">
                    <h3>Informacion de Cuota Vigente</h3>
                    <div className="consultar-billing-grid">
                      <div>
                        <span>Plan Actual</span>
                        <strong>{latestCuota?.plan ?? '-'}</strong>
                      </div>
                      <div>
                        <span>Estado</span>
                        <strong>{socio?.estadoSocio ?? '-'}</strong>
                      </div>
                      <div>
                        <span>Vencimiento</span>
                        <strong
                          className={
                            socio?.estadoSocio === 'Suspendido' || socio?.estadoSocio === 'Eliminado'
                              ? 'consultar-danger-text'
                              : ''
                          }
                        >
                          {formatDateCell(latestCuota?.fechaFinPeriodo ?? null)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {renovacion.active ? (
                    <div className="consultar-renewal">
                      <label className="field-group">
                        <span className="field-label">Plan</span>
                        <select
                          className="field-input"
                          value={renovacion.plan}
                          onChange={(event) => {
                            setRenovacion({ ...renovacion, plan: event.target.value })
                          }}
                        >
                          <option value="Mensual">Mensual</option>
                          <option value="Anual">Anual</option>
                        </select>
                      </label>
                      <label className="field-group">
                        <span className="field-label">Monto</span>
                        <input
                          className="field-input"
                          type="number"
                          min="0"
                          value={renovacion.monto}
                          onChange={(event) => {
                            setRenovacion({ ...renovacion, monto: event.target.value })
                          }}
                        />
                      </label>
                      <button
                        className="ghost-button consultar-renewal__cancel"
                        type="button"
                        onClick={resetRenovacion}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : null}

                  <div className="consultar-billing-actions">
                    {canEdit && !renovacion.active ? (
                      <button
                        className="submit-button consultar-button--green"
                        type="button"
                        onClick={() => {
                          setRenovacion({ active: true, plan: 'Mensual', monto: '' })
                        }}
                      >
                        Renovar Cuota
                      </button>
                    ) : null}

                    {socio?.estadoSocio === 'Eliminado' && canDelete ? (
                      <button
                        className="submit-button consultar-button--danger"
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDelete}
                      >
                        {isDeleting ? 'Borrando...' : 'Borrar Definitivamente'}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {activeTab === 'perfilIA' ? (
                <div className="consultar-section">
                  <h3>Configuracion Perfil IA</h3>
                  <div className="consultar-grid">
                    {renderPerfilField('objetivoPrincipal', 'Objetivo Principal', {
                      choices: PERFIL_IA_OBJETIVO_OPTIONS,
                    })}
                    {renderPerfilField('nivelExperiencia', 'Nivel de Experiencia', {
                      choices: PERFIL_IA_NIVEL_OPTIONS,
                    })}
                    {renderPerfilField('ejerciciosPreferidos', 'Ejercicios Preferidos', { type: 'textarea' })}
                    {renderPerfilField('ejerciciosAEvitar', 'Ejercicios a Evitar', { type: 'textarea' })}
                    {renderPerfilField('disponibilidadHoraria', 'Disponibilidad Horaria', {
                      choices: PERFIL_IA_DISPONIBILIDAD_OPTIONS,
                    })}
                    {renderPerfilField('motivacionPersonal', 'Motivacion Personal', {
                      choices: PERFIL_IA_MOTIVACION_OPTIONS,
                    })}
                    {renderPerfilField('lesionesLimitaciones', 'Lesiones / Limitaciones', {
                      structuredChoices: PERFIL_IA_LESIONES_OPTIONS,
                    })}
                    {renderPerfilField('condicionesMedicasRelevantes', 'Condiciones Medicas Relevantes', {
                      structuredChoices: PERFIL_IA_CONDICIONES_OPTIONS,
                    })}
                    {renderPerfilField('intensidadPreferida', 'Intensidad Preferida', {
                      choices: PERFIL_IA_INTENSIDAD_OPTIONS,
                    })}
                    {renderPerfilField('duracionSesionMinutos', 'Duracion Sesion Minutos', {
                      choices: PERFIL_IA_DURACION_OPTIONS,
                    })}
                    {renderPerfilField('notasEntrenador', 'Notas Entrenador', { type: 'textarea' })}
                    {renderPerfilField('planAlimenticio', 'Plan Alimenticio', {
                      type: 'textarea',
                      placeholder: '(opcional)',
                    })}
                  </div>
                </div>
              ) : null}

              {activeTab === 'seguridad' ? (
                <div className="consultar-section consultar-section--security">
                  <h3>Seguridad de la Cuenta</h3>
                  {!readOnly && !passwordState.visible ? (
                    canChangePassword ? (
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() => {
                          setIsPasswordAutofillGuardEnabled(true)
                          setPasswordState({ ...passwordState, visible: true })
                        }}
                      >
                        Cambiar Contraseña
                      </button>
                    ) : (
                      <p className="inicio-status">No tienes permiso para cambiar la contrasena.</p>
                    )
                  ) : (
                    <div className="consultar-password-box">
                      <div aria-hidden="true">
                        <input
                          type="text"
                          name={`${passwordFormKey}-decoy-user`}
                          autoComplete="username"
                          tabIndex={-1}
                          aria-hidden="true"
                          className="autofill-decoy"
                        />
                        <input
                          type="password"
                          name={`${passwordFormKey}-decoy-password`}
                          autoComplete="current-password"
                          tabIndex={-1}
                          aria-hidden="true"
                          className="autofill-decoy"
                        />
                      </div>
                      <label className="field-group">
                        <span className="field-label">Contrasena Actual</span>
                        <input
                          className="field-input"
                          type="password"
                          name={`${passwordFormKey}-current-password`}
                          autoComplete="new-password"
                          readOnly={isPasswordAutofillGuardEnabled}
                          value={passwordState.currentPassword}
                          onMouseDown={() => setIsPasswordAutofillGuardEnabled(false)}
                          onFocus={() => setIsPasswordAutofillGuardEnabled(false)}
                          onChange={(event) =>
                            setPasswordState({
                              ...passwordState,
                              currentPassword: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label className="field-group">
                        <span className="field-label">Nueva Contrasena</span>
                        <input
                          className="field-input"
                          type="password"
                          name={`${passwordFormKey}-next-password`}
                          autoComplete="new-password"
                          readOnly={isPasswordAutofillGuardEnabled}
                          value={passwordState.newPassword}
                          onMouseDown={() => setIsPasswordAutofillGuardEnabled(false)}
                          onFocus={() => setIsPasswordAutofillGuardEnabled(false)}
                          onChange={(event) =>
                            setPasswordState({
                              ...passwordState,
                              newPassword: event.target.value,
                            })
                          }
                        />
                      </label>
                      <div className="consultar-password-actions">
                        <button
                          className="submit-button"
                          type="button"
                          disabled={isChangingPassword}
                          onClick={handlePasswordChange}
                        >
                          {isChangingPassword ? 'Confirmando...' : 'Confirmar Cambio'}
                        </button>
                        <button
                          className="ghost-button"
                          type="button"
                          onClick={() =>
                            {
                              setIsPasswordAutofillGuardEnabled(true)
                              setPasswordState({
                                visible: false,
                                currentPassword: '',
                                newPassword: '',
                              })
                            }
                          }
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <footer className="consultar-footer">
          <button className="ghost-button consultar-footer__close" type="button" onClick={requestClose}>
            Cerrar
          </button>
          {canEdit ? (
            <button
              className="submit-button consultar-footer__save"
              type="button"
              disabled={isSaving || isLoading || !isDirty}
              onClick={handleSave}
            >
              {isSaving ? 'Confirmando...' : 'Confirmar Cambios'}
            </button>
          ) : null}
        </footer>
      </section>

      {success ? (
        <div className="consultar-backdrop consultar-backdrop--nested" role="presentation">
          <section
            className="consultar-modal eliminar-modal consultar-confirm-modal consultar-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consultar-success-title"
          >
            <header className="consultar-header eliminar-modal__header">
              <div>
                <h2 id="consultar-success-title">Operacion confirmada</h2>
                <div className="consultar-meta">
                  <span className="consultar-status consultar-status--success">Confirmado</span>
                </div>
              </div>
              <button
                className="consultar-close"
                type="button"
                aria-label="Cerrar"
                onClick={() => setSuccess('')}
              >
                x
              </button>
            </header>

            <div className="consultar-body eliminar-modal__body">
              <div className="eliminar-modal__content">
                <p className="eliminar-modal__label">Resultado</p>
                <h3>{success}</h3>
                <p className="eliminar-modal__copy">
                  La consulta quedo actualizada con la informacion confirmada.
                </p>
              </div>
            </div>

            <footer className="consultar-footer eliminar-modal__footer">
              <button
                className="submit-button consultar-button--green eliminar-modal__confirm"
                type="button"
                onClick={() => setSuccess('')}
              >
                Aceptar
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {isCloseConfirmOpen ? (
        <div className="consultar-backdrop consultar-backdrop--nested" role="presentation">
          <section
            className="consultar-modal eliminar-modal consultar-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consultar-close-confirm-title"
          >
            <header className="consultar-header eliminar-modal__header">
              <div>
                <h2 id="consultar-close-confirm-title">Cerrar consulta</h2>
                <div className="consultar-meta">
                  <span className="consultar-status consultar-status--warning">Cambios sin confirmar</span>
                </div>
              </div>
              <button
                className="consultar-close"
                type="button"
                aria-label="Cerrar"
                onClick={() => setIsCloseConfirmOpen(false)}
              >
                x
              </button>
            </header>

            <div className="consultar-body eliminar-modal__body">
              <div className="eliminar-modal__content">
                <p className="eliminar-modal__label">Confirma la accion</p>
                <h3>Hay cambios sin confirmar</h3>
                <p className="eliminar-modal__copy">
                  Si cerras la consulta ahora, se descartaran los cambios que todavia no confirmaste.
                </p>
              </div>
            </div>

            <footer className="consultar-footer eliminar-modal__footer">
              <button
                className="ghost-button consultar-footer__close"
                type="button"
                onClick={() => setIsCloseConfirmOpen(false)}
              >
                Volver
              </button>
              <button
                className="submit-button consultar-button--danger eliminar-modal__confirm"
                type="button"
                onClick={confirmClose}
              >
                Descartar cambios
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {isDeleteConfirmOpen ? (
        <div className="consultar-backdrop consultar-backdrop--nested" role="presentation">
          <section
            className="consultar-modal eliminar-modal consultar-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consultar-delete-confirm-title"
          >
            <header className="consultar-header eliminar-modal__header">
              <div>
                <h2 id="consultar-delete-confirm-title">Borrar definitivamente</h2>
                <div className="consultar-meta">
                  <span className="consultar-status consultar-status--danger">Accion irreversible</span>
                </div>
              </div>
              <button
                className="consultar-close"
                type="button"
                aria-label="Cerrar"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                x
              </button>
            </header>

            <div className="consultar-body eliminar-modal__body">
              <div className="eliminar-modal__content">
                <p className="eliminar-modal__label">Socio seleccionado</p>
                <h3>{socioName}</h3>
                <p className="eliminar-modal__copy">
                  Esta accion borrara definitivamente al socio y no se puede deshacer.
                </p>
              </div>
            </div>

            <footer className="consultar-footer eliminar-modal__footer">
              <button
                className="ghost-button consultar-footer__close"
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className="submit-button consultar-button--danger eliminar-modal__confirm"
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmPermanentDelete()}
              >
                {isDeleting ? 'Borrando...' : 'Borrar definitivamente'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}
