import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { FormAlertModal } from '../components/FormAlertModal'
import { PlanAlimenticioUploadButton } from '../components/PlanAlimenticioUploadButton'
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
} from '../constants/perfilIAOptions'
import { sociosService } from '../services/sociosService'
import type { DiaDto, GeneroSocio, PlanSocio, UsuarioInsertDto } from '../types/socio'
import { getSociosErrorMessage } from '../utils/apiError'
import { extractPdfText } from '../utils/pdfText'

const SOCIO_GROUP_ID = 3

const TABS = [
  { id: 'personal', label: 'Datos personales' },
  { id: 'cuota', label: 'Cuota inicial' },
  { id: 'perfilIA', label: 'Perfil IA' },
] as const

type TabId = (typeof TABS)[number]['id']

interface AgregarSocioModalProps {
  onClose: () => void
  onCreated: () => void
}

interface AgregarSocioFormState {
  username: string
  password: string
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
  plan: PlanSocio
  monto: string
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

const initialFormState: AgregarSocioFormState = {
  username: '',
  password: '',
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
  obraSocial: '',
  fechaNotificacion: '',
  respuestaNotificacion: null,
  pregunta: '',
  respuesta: '',
  plan: 'Mensual',
  monto: '',
  perfilIA: {
    objetivoPrincipal: '',
    nivelExperiencia: '',
    ejerciciosPreferidos: '',
    ejerciciosAEvitar: '',
    disponibilidadHoraria: '',
    motivacionPersonal: '',
    lesionesLimitaciones: '',
    condicionesMedicasRelevantes: '',
    intensidadPreferida: '',
    duracionSesionMinutos: '',
    notasEntrenador: '',
    planAlimenticio: '',
  },
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

function buildRegisterPayload(
  formState: AgregarSocioFormState,
  selectedDias: number[],
): UsuarioInsertDto {
  return {
    username: formState.username.trim(),
    password: formState.password,
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
      cuota: {
        plan: formState.plan,
        monto: Number(formState.monto),
      },
      perfilIA: {
        objetivoPrincipal: toNullable(formState.perfilIA.objetivoPrincipal),
        nivelExperiencia: toNullable(formState.perfilIA.nivelExperiencia),
        ejerciciosPreferidos: toNullable(formState.perfilIA.ejerciciosPreferidos),
        ejerciciosAEvitar: toNullable(formState.perfilIA.ejerciciosAEvitar),
        disponibilidadHoraria: toNullable(formState.perfilIA.disponibilidadHoraria),
        motivacionPersonal: toNullable(formState.perfilIA.motivacionPersonal),
        lesionesLimitaciones: toNullable(formState.perfilIA.lesionesLimitaciones),
        condicionesMedicasRelevantes: toNullable(formState.perfilIA.condicionesMedicasRelevantes),
        intensidadPreferida: toNullable(formState.perfilIA.intensidadPreferida),
        duracionSesionMinutos: toNullablePositiveNumber(formState.perfilIA.duracionSesionMinutos),
        notasEntrenador: toNullable(formState.perfilIA.notasEntrenador),
        planAlimenticio: toNullable(formState.perfilIA.planAlimenticio),
      },
    },
    idGrupos: [SOCIO_GROUP_ID],
  }
}

export function AgregarSocioModal({ onClose, onCreated }: AgregarSocioModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('personal')
  const [dias, setDias] = useState<DiaDto[]>([])
  const [selectedDias, setSelectedDias] = useState<number[]>([])
  const [formState, setFormState] = useState<AgregarSocioFormState>(initialFormState)
  const [isCredentialAutofillGuardEnabled, setIsCredentialAutofillGuardEnabled] = useState(true)
  const [isLoadingDias, setIsLoadingDias] = useState(true)
  const [isExtractingPlanFile, setIsExtractingPlanFile] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const formKey = useId()

  useEffect(() => {
    let isActive = true

    async function loadDias() {
      setIsLoadingDias(true)
      setError('')

      try {
        const diasResponse = await sociosService.getDias()

        if (isActive) {
          setDias(diasResponse)
        }
      } catch (requestError) {
        if (isActive) {
          setError(getSociosErrorMessage(requestError))
        }
      } finally {
        if (isActive) {
          setIsLoadingDias(false)
        }
      }
    }

    void loadDias()

    return () => {
      isActive = false
    }
  }, [])

  function setField<K extends keyof AgregarSocioFormState>(
    field: K,
    value: AgregarSocioFormState[K],
  ) {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  function setPerfilField<K extends keyof AgregarSocioFormState['perfilIA']>(
    field: K,
    value: AgregarSocioFormState['perfilIA'][K],
  ) {
    setFormState((current) => ({
      ...current,
      perfilIA: {
        ...current.perfilIA,
        [field]: value,
      },
    }))
  }

  function toggleDia(idDia: number) {
    setSelectedDias((current) =>
      current.includes(idDia) ? current.filter((dia) => dia !== idDia) : [...current, idDia],
    )
  }

  async function handlePlanFileSelected(file: File) {
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
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo leer el PDF seleccionado.')
    } finally {
      setIsExtractingPlanFile(false)
    }
  }

  function requestBack() {
    onClose()
  }

  function validateBeforeSave() {
    if (
      !formState.username.trim() ||
      !formState.password ||
      !formState.nombre.trim() ||
      !formState.apellido.trim() ||
      !formState.email.trim() ||
      !formState.tipoDocumento.trim() ||
      !formState.nroDocumento.trim()
    ) {
      return 'Completa usuario, contraseña, nombre, apellido, email y documento.'
    }

    if (formState.password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres.'
    }

    if (selectedDias.length === 0) {
      return 'Selecciona al menos un dia de asistencia.'
    }

    if (!formState.plan || Number(formState.monto) <= 0) {
      return 'Indica el plan y un monto de cuota mayor a cero.'
    }

    return ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
      await sociosService.registerSocio(buildRegisterPayload(formState, selectedDias))
      setSuccess('Socio creado correctamente.')
      onCreated()
    } catch (requestError) {
      setError(getSociosErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  function renderPerfilSelect(
    field: keyof AgregarSocioFormState['perfilIA'],
    label: string,
    options: readonly string[],
  ) {
    const value = formState.perfilIA[field]

    return (
      <label className="consultar-field">
        <span>{label}</span>
        <select
          className="consultar-input"
          value={value}
          onChange={(event) => setPerfilField(field, event.target.value)}
        >
          <option value="">Sin especificar</option>
          {getPerfilIAOptionsWithCurrent(options, value).map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      </label>
    )
  }

  function renderPerfilTextarea(
    field: keyof AgregarSocioFormState['perfilIA'],
    label: string,
    placeholder?: string,
  ) {
    const isPlanAlimenticio = field === 'planAlimenticio'

    return (
      <label className="consultar-field consultar-field--wide">
        {isPlanAlimenticio ? (
          <span className="perfil-ia-label-row">
            <span>{label}</span>
            <PlanAlimenticioUploadButton
              disabled={isSaving || isLoadingDias}
              isLoading={isExtractingPlanFile}
              onFileSelected={handlePlanFileSelected}
            />
          </span>
        ) : (
          <span>{label}</span>
        )}
        <textarea
          className={
            isPlanAlimenticio
              ? 'consultar-input perfil-ia-textarea perfil-ia-textarea--plan-alimenticio'
              : 'consultar-input perfil-ia-textarea'
          }
          value={formState.perfilIA[field]}
          placeholder={placeholder}
          rows={isPlanAlimenticio ? 12 : 4}
          onChange={(event) => setPerfilField(field, event.target.value)}
        />
      </label>
    )
  }

  function renderPerfilStructuredField(
    field: keyof AgregarSocioFormState['perfilIA'],
    label: string,
    options: readonly string[],
  ) {
    const value = formState.perfilIA[field]

    return (
      <label className="consultar-field consultar-field--wide">
        <span>{label}</span>
        <span className="perfil-ia-composite-field">
          <span className="perfil-ia-chip-list">
            {options.map((choice) => (
              <label
                key={choice}
                className={
                  hasPerfilIAToken(value, choice, options)
                    ? 'perfil-ia-chip perfil-ia-chip--selected'
                    : 'perfil-ia-chip'
                }
              >
                <input
                  type="checkbox"
                  checked={hasPerfilIAToken(value, choice, options)}
                  onChange={() => setPerfilField(field, togglePerfilIAToken(value, choice, options))}
                />
                <span>{choice}</span>
              </label>
            ))}
          </span>
          <textarea
            className="consultar-input perfil-ia-textarea"
            value={getPerfilIAOtherDetail(value, options)}
            disabled={!hasPerfilIAToken(value, 'Otra', options)}
            placeholder="Detalle para Otra"
            rows={3}
            onChange={(event) => setPerfilField(field, setPerfilIAOtherDetail(value, event.target.value, options))}
          />
        </span>
      </label>
    )
  }

  return (
    <div className="consultar-backdrop" role="presentation">
      <section
        className="consultar-modal agregar-socio-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agregar-socio-title"
      >
        <header className="consultar-header">
          <div>
            <span className="section-kicker">Socios / Alta</span>
            <h2 id="agregar-socio-title">Agregar socio</h2>
            <div className="consultar-meta">
              <span className="consultar-status consultar-status--success">Nuevo socio</span>
              <span>Grupo Socio</span>
            </div>
          </div>
          <button
            className="consultar-close"
            type="button"
            aria-label="Cerrar"
            onClick={requestBack}
            disabled={isSaving}
          >
            x
          </button>
        </header>

        <form
          className="agregar-socio-workspace"
          autoComplete="off"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <input
            type="text"
            name={`${formKey}-decoy-user`}
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            className="autofill-decoy"
          />
          <input
            type="password"
            name={`${formKey}-decoy-password`}
            autoComplete="new-password"
            tabIndex={-1}
            aria-hidden="true"
            className="autofill-decoy"
          />
          <div className="consultar-tabs agregar-socio-tabs" aria-label="Secciones de alta">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={activeTab === tab.id ? 'consultar-tab consultar-tab--active' : 'consultar-tab'}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="agregar-socio-body">
            {error ? <FormAlertModal type="error" message={error} /> : null}
            {success ? <FormAlertModal type="success" message={success} /> : null}

            {activeTab === 'personal' ? (
              <section className="consultar-section">
                <h2>Datos personales y acceso</h2>
                <div className="consultar-grid">
                  <label className="consultar-field">
                    <span>Usuario</span>
                    <input
                      className="consultar-input"
                      type="text"
                      name={`${formKey}-member-user`}
                      autoComplete="new-password"
                      readOnly={isCredentialAutofillGuardEnabled}
                      value={formState.username}
                      onMouseDown={() => setIsCredentialAutofillGuardEnabled(false)}
                      onFocus={() => setIsCredentialAutofillGuardEnabled(false)}
                      onChange={(event) => setField('username', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Contraseña</span>
                    <input
                      className="consultar-input"
                      type="password"
                      name={`${formKey}-member-password`}
                      autoComplete="new-password"
                      readOnly={isCredentialAutofillGuardEnabled}
                      value={formState.password}
                      onMouseDown={() => setIsCredentialAutofillGuardEnabled(false)}
                      onFocus={() => setIsCredentialAutofillGuardEnabled(false)}
                      onChange={(event) => setField('password', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Nombre</span>
                    <input
                      className="consultar-input"
                      type="text"
                      autoComplete="off"
                      value={formState.nombre}
                      onChange={(event) => setField('nombre', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Apellido</span>
                    <input
                      className="consultar-input"
                      type="text"
                      autoComplete="off"
                      value={formState.apellido}
                      onChange={(event) => setField('apellido', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Email</span>
                    <input
                      className="consultar-input"
                      type="email"
                      autoComplete="off"
                      value={formState.email}
                      onChange={(event) => setField('email', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Telefono</span>
                    <input
                      className="consultar-input"
                      type="text"
                      value={formState.telefono}
                      onChange={(event) => setField('telefono', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Fecha de nacimiento</span>
                    <input
                      className="consultar-input"
                      type="date"
                      value={formState.fechaNacimiento}
                      onChange={(event) => setField('fechaNacimiento', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Genero</span>
                    <select
                      className="consultar-input"
                      value={formState.genero}
                      onChange={(event) =>
                        setField('genero', event.target.value as AgregarSocioFormState['genero'])
                      }
                    >
                      <option value="">Sin especificar</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                      <option value="NoEspecifica">No especifica</option>
                    </select>
                  </label>
                  <label className="consultar-field">
                    <span>Tipo Documento</span>
                    <input
                      className="consultar-input"
                      type="text"
                      value={formState.tipoDocumento}
                      onChange={(event) => setField('tipoDocumento', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Nro Documento</span>
                    <input
                      className="consultar-input"
                      type="text"
                      value={formState.nroDocumento}
                      onChange={(event) => setField('nroDocumento', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Ciudad</span>
                    <input
                      className="consultar-input"
                      type="text"
                      value={formState.ciudad}
                      onChange={(event) => setField('ciudad', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Direccion</span>
                    <input
                      className="consultar-input"
                      type="text"
                      value={formState.direccion}
                      onChange={(event) => setField('direccion', event.target.value)}
                    />
                  </label>
                  <label className="consultar-field">
                    <span>Obra Social</span>
                    <input
                      className="consultar-input"
                      type="text"
                      value={formState.obraSocial}
                      onChange={(event) => setField('obraSocial', event.target.value)}
                    />
                  </label>
                </div>

                <div className="consultar-days">
                  <h2>Dias de asistencia</h2>
                  {isLoadingDias ? <p className="inicio-status">Cargando dias disponibles...</p> : null}
                  {!isLoadingDias ? (
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
                            onChange={() => toggleDia(dia.idDia)}
                          />
                          <span>{dia.nombreDia}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {activeTab === 'cuota' ? (
              <section className="consultar-section agregar-socio-section--narrow">
                <h2>Cuota inicial</h2>
                <div className="agregar-socio-billing">
                  <label className="field-group">
                    <span className="field-label">Plan</span>
                    <select
                      className="field-input"
                      value={formState.plan}
                      onChange={(event) =>
                        setField('plan', event.target.value as AgregarSocioFormState['plan'])
                      }
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
                      step="0.01"
                      value={formState.monto}
                      onChange={(event) => setField('monto', event.target.value)}
                    />
                  </label>
                </div>
              </section>
            ) : null}

            {activeTab === 'perfilIA' ? (
              <section className="consultar-section">
                <h2>Perfil IA</h2>
                <div className="consultar-grid">
                  {renderPerfilSelect('objetivoPrincipal', 'Objetivo Principal', PERFIL_IA_OBJETIVO_OPTIONS)}
                  {renderPerfilSelect('nivelExperiencia', 'Nivel de Experiencia', PERFIL_IA_NIVEL_OPTIONS)}
                  {renderPerfilTextarea('ejerciciosPreferidos', 'Ejercicios Preferidos')}
                  {renderPerfilTextarea('ejerciciosAEvitar', 'Ejercicios a Evitar')}
                  {renderPerfilSelect('disponibilidadHoraria', 'Disponibilidad Horaria', PERFIL_IA_DISPONIBILIDAD_OPTIONS)}
                  {renderPerfilSelect('motivacionPersonal', 'Motivacion Personal', PERFIL_IA_MOTIVACION_OPTIONS)}
                  {renderPerfilStructuredField('lesionesLimitaciones', 'Lesiones / Limitaciones', PERFIL_IA_LESIONES_OPTIONS)}
                  {renderPerfilStructuredField(
                    'condicionesMedicasRelevantes',
                    'Condiciones Medicas Relevantes',
                    PERFIL_IA_CONDICIONES_OPTIONS,
                  )}
                  {renderPerfilSelect('intensidadPreferida', 'Intensidad Preferida', PERFIL_IA_INTENSIDAD_OPTIONS)}
                  {renderPerfilSelect('duracionSesionMinutos', 'Duracion Sesion Minutos', PERFIL_IA_DURACION_OPTIONS)}
                  {renderPerfilTextarea('notasEntrenador', 'Notas Entrenador')}
                  {renderPerfilTextarea('planAlimenticio', 'Plan Alimenticio', '(opcional)')}
                </div>
              </section>
            ) : null}
          </div>

          <footer className="consultar-footer agregar-socio-footer">
            <button className="ghost-button consultar-footer__close" type="button" onClick={requestBack}>
              Cancelar
            </button>
            <button
              className="submit-button consultar-footer__save"
              type="submit"
              disabled={isSaving || isLoadingDias}
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
