import { useState } from 'react'
import { Link } from 'react-router-dom'
import heroImage from '../../assets/auth/auth-gym-background.jpg'
import { GymSelect } from '../../components/auth/GymSelect'
import { useActiveGyms } from '../../hooks/useActiveGyms'
import { authService } from '../../services/authService'
import { getForgotPasswordErrorMessage } from '../../utils/apiError'

interface ForgotPasswordFormState {
  idGym: number | null
  email: string
}

interface ForgotPasswordFormErrors {
  idGym?: string
  email?: string
}

const initialFormState: ForgotPasswordFormState = {
  idGym: null,
  email: '',
}

const successMessage =
  'Si el email ingresado está registrado, recibirás instrucciones para recuperar tu contraseña.'

export function ForgotPasswordPage() {
  const { gyms, gymsError, isLoadingGyms } = useActiveGyms()
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({})
  const [requestError, setRequestError] = useState('')
  const [requestSuccess, setRequestSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField<K extends keyof ForgotPasswordFormState>(
    field: K,
    value: ForgotPasswordFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setRequestError('')
    setRequestSuccess('')
  }

  function validateForm() {
    const nextErrors: ForgotPasswordFormErrors = {}
    const email = form.email.trim()

    if (!form.idGym) {
      nextErrors.idGym = 'Selecciona un gimnasio.'
    }

    if (!email) {
      nextErrors.email = 'Ingresa tu email.'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = 'Ingresa un email válido.'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateForm() || form.idGym === null) {
      return
    }

    setIsSubmitting(true)
    setRequestError('')
    setRequestSuccess('')

    try {
      await authService.forgotPassword({ email: form.email.trim() }, form.idGym)
      setRequestSuccess(successMessage)
    } catch (error) {
      setRequestError(getForgotPasswordErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-reference-page">
      <section className="login-reference-card" aria-label="Recuperación de acceso">
        <div className="login-reference-form-panel">
          <Link
            className="login-reference-back"
            to="/login"
            aria-label="Volver al login"
          >
            <span aria-hidden="true">&larr;</span>
            Volver al login
          </Link>
          <div className="login-reference-back-spacer" aria-hidden="true" />

          <div className="login-reference-copy">
            <span className="login-reference-kicker">MindFit Intelligence</span>
            <h1>Recuperar Contraseña</h1>
          </div>

          <form className="login-reference-form" onSubmit={handleSubmit} noValidate>
            <div className="login-reference-field">
              <div className="login-reference-field-header">
                <label htmlFor="gym-select">Gimnasio</label>
                {errors.idGym ? <p className="login-reference-error">{errors.idGym}</p> : null}
                {!errors.idGym && gymsError ? (
                  <p className="login-reference-error">{gymsError}</p>
                ) : null}
              </div>
              <GymSelect
                gyms={gyms}
                selectedGymId={form.idGym}
                onChange={(gymId) => updateField('idGym', gymId)}
                isDisabled={isLoadingGyms || gyms.length === 0 || isSubmitting}
              />
            </div>

            <div className="login-reference-field">
              <div className="login-reference-field-header">
                <label htmlFor="email">Email</label>
                {errors.email ? <p className="login-reference-error">{errors.email}</p> : null}
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <button className="login-reference-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </form>

          <div className="login-reference-alert-slot login-reference-alert-slot--forgot" aria-live="polite">
            {requestError ? <div className="login-reference-alert">{requestError}</div> : null}
            {requestSuccess ? (
              <div className="login-reference-alert login-reference-alert--success">
                {requestSuccess}
              </div>
            ) : null}
          </div>

          <p className="login-reference-note">
            Seleccioná tu gimnasio y te enviaremos instrucciones para definir una nueva clave.
          </p>
          <p className="auth-copyright">
            © 2026 MindFit Intelligence. Todos los derechos reservados.
          </p>
        </div>

        <div className="login-reference-image-panel" aria-hidden="true">
          <img src={heroImage} alt="" />
        </div>
      </section>
    </main>
  )
}
