import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LandingHeader } from '../components/landing/LandingHeader'
import { gymsService } from '../services/gymsService'
import { paypalService } from '../services/paypalService'
import type { GymOnboardingGender, GymOnboardingRequest } from '../types/gymOnboarding'
import { getApiErrorMessage } from '../utils/apiError'
import {
  clearApprovedPayPalSubscription,
  getApprovedPayPalSubscriptionId,
} from '../utils/paypalPayment'

interface GymOnboardingFormState {
  nombreGym: string
  username: string
  password: string
  confirmarPassword: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  tipoDocumento: string
  nroDocumento: string
  genero: '' | GymOnboardingGender
  fechaNacimiento: string
}

type GymOnboardingFormErrors = Partial<Record<keyof GymOnboardingFormState, string>>
type PaymentGateStatus = 'checking' | 'approved' | 'missing' | 'invalid'

interface OnboardingFieldProps {
  id: string
  label: string
  error?: string
  children: ReactNode
}

const initialFormState: GymOnboardingFormState = {
  nombreGym: '',
  username: '',
  password: '',
  confirmarPassword: '',
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

const requiredMessages: Partial<Record<keyof GymOnboardingFormState, string>> = {
  nombreGym: 'Ingresá el nombre del gimnasio.',
  username: 'Ingresá un nombre de usuario.',
  password: 'Ingresá una contraseña.',
  confirmarPassword: 'Confirmá la contraseña.',
  nombre: 'Ingresá el nombre del responsable.',
  apellido: 'Ingresá el apellido del responsable.',
  email: 'Ingresá un email.',
  telefono: 'Ingresá un teléfono.',
  direccion: 'Ingresá una dirección.',
  ciudad: 'Ingresá una ciudad.',
  tipoDocumento: 'Ingresá el tipo de documento.',
  nroDocumento: 'Ingresá el número de documento.',
  genero: 'Seleccioná un género.',
  fechaNacimiento: 'Ingresá la fecha de nacimiento.',
}

function OnboardingField({ id, label, error, children }: OnboardingFieldProps) {
  return (
    <div className="gym-onboarding-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="gym-onboarding-field__error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function GymOnboardingPage() {
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState<GymOnboardingFormErrors>({})
  const [requestError, setRequestError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<PaymentGateStatus>('checking')
  const [paypalSubscriptionId, setPayPalSubscriptionId] = useState('')

  useEffect(() => {
    let isMounted = true

    async function validatePayment() {
      const subscriptionId = getApprovedPayPalSubscriptionId()

      if (!subscriptionId) {
        setPaymentStatus('missing')
        return
      }

      try {
        const subscription = await paypalService.getSubscriptionStatus(subscriptionId)

        if (!isMounted) {
          return
        }

        if (subscription.isApproved) {
          setPayPalSubscriptionId(subscriptionId)
          setPaymentStatus('approved')
          return
        }

        clearApprovedPayPalSubscription()
        setPaymentStatus('invalid')
      } catch {
        if (isMounted) {
          clearApprovedPayPalSubscription()
          setPaymentStatus('invalid')
        }
      }
    }

    validatePayment()

    return () => {
      isMounted = false
    }
  }, [])

  function updateField<K extends keyof GymOnboardingFormState>(
    field: K,
    value: GymOnboardingFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setRequestError('')
    setSuccessMessage('')
  }

  function validateForm() {
    const nextErrors: GymOnboardingFormErrors = {}

    for (const [field, message] of Object.entries(requiredMessages)) {
      const fieldName = field as keyof GymOnboardingFormState

      if (!form[fieldName].trim()) {
        nextErrors[fieldName] = message
      }
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Ingresá un email válido.'
    }

    if (form.password && form.confirmarPassword && form.password !== form.confirmarPassword) {
      nextErrors.confirmarPassword = 'Las contraseñas no coinciden.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateForm() || !form.genero) {
      return
    }

    const payload: GymOnboardingRequest = {
      nombreGym: form.nombreGym.trim(),
      paypalSubscriptionId,
      usuarioMaster: {
        username: form.username.trim(),
        password: form.password,
        personaResponsable: {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          direccion: form.direccion.trim(),
          ciudad: form.ciudad.trim(),
          tipoDocumento: form.tipoDocumento.trim(),
          nroDocumento: form.nroDocumento.trim(),
          genero: form.genero,
          fechaNacimiento: `${form.fechaNacimiento}T00:00:00`,
        },
      },
    }

    setIsSubmitting(true)
    setRequestError('')
    setSuccessMessage('')

    try {
      const response = await gymsService.registrarGymOnboarding(payload)
      setSuccessMessage(
        `${response.mensaje} El gimnasio ya está activo y el usuario administrador puede iniciar sesión inmediatamente.`,
      )
      setForm(initialFormState)
      setErrors({})
    } catch (error) {
      setRequestError(
        getApiErrorMessage(
          error,
          'No pudimos registrar el gimnasio. Revisá los datos e intentá nuevamente.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function inputErrorProps(field: keyof GymOnboardingFormState) {
    return {
      'aria-invalid': Boolean(errors[field]),
      'aria-describedby': errors[field] ? `${field}-error` : undefined,
    }
  }

  if (paymentStatus !== 'approved') {
    const isChecking = paymentStatus === 'checking'

    return (
      <main className="landing-page gym-onboarding-page">
        <LandingHeader />

        <div className="gym-onboarding-layout">
          <section className="gym-onboarding-payment-gate" aria-live="polite">
            <span>Pago requerido</span>
            <h1>{isChecking ? 'Validando tu pago' : 'Primero completá el pago'}</h1>
            <p>
              {isChecking
                ? 'Estamos confirmando la suscripción con PayPal antes de habilitar el registro.'
                : 'Para registrar tu gimnasio necesitás completar el pago inicial y activar la suscripción mensual.'}
            </p>

            {!isChecking ? (
              <div className="gym-onboarding-payment-gate__actions">
                <Link className="landing-button" to="/pago">
                  Ir a pagar
                </Link>
                <Link className="payment-secondary-link" to="/precios">
                  Ver precios
                </Link>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="landing-page gym-onboarding-page">
      <LandingHeader />

      <div className="gym-onboarding-layout">
        <header className="gym-onboarding-intro">
          <span>Plan de adquisición</span>
          <h1>Registrá tu gimnasio</h1>
          <p>
            Completá los datos del gimnasio y de la persona responsable. Revisaremos el alta
            antes de habilitar el acceso a MindFit Intelligence.
          </p>
          <div className="gym-onboarding-intro__steps" aria-label="Proceso de registro">
            <strong>1. Datos</strong>
            <span aria-hidden="true" />
            <strong>2. Revisión</strong>
            <span aria-hidden="true" />
            <strong>3. Activación</strong>
          </div>
        </header>

        <form className="gym-onboarding-form" onSubmit={handleSubmit} noValidate>
          <section className="gym-onboarding-section" aria-labelledby="gym-data-title">
            <div className="gym-onboarding-section__heading">
              <span>01</span>
              <div>
                <h2 id="gym-data-title">Datos del gimnasio</h2>
                <p>La identidad con la que aparecerá tu sede.</p>
              </div>
            </div>
            <div className="gym-onboarding-grid gym-onboarding-grid--single">
              <OnboardingField id="nombreGym" label="Nombre del gimnasio" error={errors.nombreGym}>
                <input
                  id="nombreGym"
                  type="text"
                  autoComplete="organization"
                  value={form.nombreGym}
                  onChange={(event) => updateField('nombreGym', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('nombreGym')}
                />
              </OnboardingField>
            </div>
          </section>

          <section className="gym-onboarding-section" aria-labelledby="access-data-title">
            <div className="gym-onboarding-section__heading">
              <span>02</span>
              <div>
                <h2 id="access-data-title">Acceso del usuario master</h2>
                <p>Estas credenciales serán utilizadas por la persona responsable.</p>
              </div>
            </div>
            <div className="gym-onboarding-grid">
              <OnboardingField id="username" label="Usuario" error={errors.username}>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={(event) => updateField('username', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('username')}
                />
              </OnboardingField>
              <div className="gym-onboarding-grid__spacer" aria-hidden="true" />
              <OnboardingField id="password" label="Contraseña" error={errors.password}>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('password')}
                />
              </OnboardingField>
              <OnboardingField
                id="confirmarPassword"
                label="Confirmar contraseña"
                error={errors.confirmarPassword}
              >
                <input
                  id="confirmarPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmarPassword}
                  onChange={(event) => updateField('confirmarPassword', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('confirmarPassword')}
                />
              </OnboardingField>
            </div>
          </section>

          <section className="gym-onboarding-section" aria-labelledby="owner-data-title">
            <div className="gym-onboarding-section__heading">
              <span>03</span>
              <div>
                <h2 id="owner-data-title">Datos de la persona responsable</h2>
                <p>Información de contacto y validación del titular.</p>
              </div>
            </div>
            <div className="gym-onboarding-grid">
              <OnboardingField id="nombre" label="Nombre" error={errors.nombre}>
                <input
                  id="nombre"
                  type="text"
                  autoComplete="given-name"
                  value={form.nombre}
                  onChange={(event) => updateField('nombre', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('nombre')}
                />
              </OnboardingField>
              <OnboardingField id="apellido" label="Apellido" error={errors.apellido}>
                <input
                  id="apellido"
                  type="text"
                  autoComplete="family-name"
                  value={form.apellido}
                  onChange={(event) => updateField('apellido', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('apellido')}
                />
              </OnboardingField>
              <OnboardingField id="email" label="Email" error={errors.email}>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('email')}
                />
              </OnboardingField>
              <OnboardingField id="telefono" label="Teléfono" error={errors.telefono}>
                <input
                  id="telefono"
                  type="tel"
                  autoComplete="tel"
                  value={form.telefono}
                  onChange={(event) => updateField('telefono', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('telefono')}
                />
              </OnboardingField>
              <OnboardingField id="direccion" label="Dirección" error={errors.direccion}>
                <input
                  id="direccion"
                  type="text"
                  autoComplete="street-address"
                  value={form.direccion}
                  onChange={(event) => updateField('direccion', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('direccion')}
                />
              </OnboardingField>
              <OnboardingField id="ciudad" label="Ciudad" error={errors.ciudad}>
                <input
                  id="ciudad"
                  type="text"
                  autoComplete="address-level2"
                  value={form.ciudad}
                  onChange={(event) => updateField('ciudad', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('ciudad')}
                />
              </OnboardingField>
              <OnboardingField
                id="tipoDocumento"
                label="Tipo de documento"
                error={errors.tipoDocumento}
              >
                <input
                  id="tipoDocumento"
                  type="text"
                  placeholder="Ej.: DNI"
                  value={form.tipoDocumento}
                  onChange={(event) => updateField('tipoDocumento', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('tipoDocumento')}
                />
              </OnboardingField>
              <OnboardingField
                id="nroDocumento"
                label="Número de documento"
                error={errors.nroDocumento}
              >
                <input
                  id="nroDocumento"
                  type="text"
                  inputMode="numeric"
                  value={form.nroDocumento}
                  onChange={(event) => updateField('nroDocumento', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('nroDocumento')}
                />
              </OnboardingField>
              <OnboardingField id="genero" label="Género" error={errors.genero}>
                <select
                  id="genero"
                  value={form.genero}
                  onChange={(event) =>
                    updateField('genero', event.target.value as GymOnboardingFormState['genero'])
                  }
                  disabled={isSubmitting}
                  {...inputErrorProps('genero')}
                >
                  <option value="">Seleccionar</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                  <option value="NoEspecifica">Prefiero no especificar</option>
                </select>
              </OnboardingField>
              <OnboardingField
                id="fechaNacimiento"
                label="Fecha de nacimiento"
                error={errors.fechaNacimiento}
              >
                <input
                  id="fechaNacimiento"
                  type="date"
                  autoComplete="bday"
                  value={form.fechaNacimiento}
                  onChange={(event) => updateField('fechaNacimiento', event.target.value)}
                  disabled={isSubmitting}
                  {...inputErrorProps('fechaNacimiento')}
                />
              </OnboardingField>
            </div>
          </section>

          <div className="gym-onboarding-feedback" aria-live="polite">
            {requestError ? (
              <div className="gym-onboarding-alert gym-onboarding-alert--error" role="alert">
                {requestError}
              </div>
            ) : null}
            {successMessage ? (
              <div className="gym-onboarding-alert gym-onboarding-alert--success">
                <strong>Registro recibido</strong>
                <p>{successMessage}</p>
                <Link to="/login">Ir al login</Link>
              </div>
            ) : null}
          </div>

          <div className="gym-onboarding-actions">
            <p>
              Al registrar el gimnasio confirmás que los datos ingresados son correctos.
            </p>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>

        <p className="gym-onboarding-login">
          ¿Tu gimnasio ya está activo? <Link to="/login">Accedé como cliente</Link>
        </p>
      </div>
    </main>
  )
}
