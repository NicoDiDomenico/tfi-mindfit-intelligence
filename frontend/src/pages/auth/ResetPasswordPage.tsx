import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import heroImage from '../../assets/auth/auth-gym-background.jpg'
import { authService } from '../../services/authService'
import { getResetPasswordErrorMessage } from '../../utils/apiError'

interface ResetPasswordFormState {
  newPassword: string
  confirmNewPassword: string
}

interface ResetPasswordFormErrors {
  newPassword?: string
  confirmNewPassword?: string
}

const initialFormState: ResetPasswordFormState = {
  newPassword: '',
  confirmNewPassword: '',
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const rawGymId = searchParams.get('gymId')?.trim() ?? ''
  const parsedGymId = Number(rawGymId)
  const hasGymId = rawGymId.length > 0
  const gymId = hasGymId && Number.isInteger(parsedGymId) && parsedGymId > 0 ? parsedGymId : null
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({})
  const [requestError, setRequestError] = useState('')
  const [requestSuccess, setRequestSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasToken = token.length > 0
  const isRecoveryLinkValid = hasToken && gymId !== null

  useEffect(() => {
    if (!requestSuccess) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/login')
    }, 1500)

    return () => window.clearTimeout(timeoutId)
  }, [navigate, requestSuccess])

  function updateField<K extends keyof ResetPasswordFormState>(
    field: K,
    value: ResetPasswordFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setRequestError('')
  }

  function validateForm() {
    const nextErrors: ResetPasswordFormErrors = {}

    if (!form.newPassword.trim()) {
      nextErrors.newPassword = 'Ingresa una nueva contraseña.'
    }

    if (!form.confirmNewPassword.trim()) {
      nextErrors.confirmNewPassword = 'Repite la nueva contraseña.'
    } else if (form.newPassword !== form.confirmNewPassword) {
      nextErrors.confirmNewPassword = 'Las contraseñas no coinciden.'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!hasToken) {
      setRequestError('El enlace de recuperación no incluye el token necesario para continuar.')
      return
    }

    if (gymId === null) {
      setRequestError('El enlace de recuperación no incluye un gymId válido.')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setRequestError('')
    setRequestSuccess('')

    try {
      const response = await authService.resetPassword(
        {
          tokenPlano: token,
          newPassword: form.newPassword,
        },
        gymId,
      )

      setRequestSuccess(response)
    } catch (error) {
      setRequestError(getResetPasswordErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-reference-page">
      <section className="login-reference-card" aria-label="Restablecimiento de contraseña">
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
            <h1>Nueva Contraseña</h1>
          </div>

          <form className="login-reference-form login-reference-form--reset" onSubmit={handleSubmit} noValidate>
            <div className="login-reference-field">
              <div className="login-reference-field-header">
                <label htmlFor="new-password">Nueva contraseña</label>
                {errors.newPassword ? (
                  <p className="login-reference-error">{errors.newPassword}</p>
                ) : null}
              </div>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Al menos 8 caracteres"
                value={form.newPassword}
                onChange={(event) => updateField('newPassword', event.target.value)}
                disabled={isSubmitting || !isRecoveryLinkValid}
              />
            </div>

            <div className="login-reference-field">
              <div className="login-reference-field-header">
                <label htmlFor="confirm-new-password">Repetir contraseña</label>
                {errors.confirmNewPassword ? (
                  <p className="login-reference-error">{errors.confirmNewPassword}</p>
                ) : null}
              </div>
              <input
                id="confirm-new-password"
                type="password"
                autoComplete="new-password"
                placeholder="Repetí tu contraseña"
                value={form.confirmNewPassword}
                onChange={(event) => updateField('confirmNewPassword', event.target.value)}
                disabled={isSubmitting || !isRecoveryLinkValid}
              />
            </div>

            <button
              className="login-reference-submit"
              type="submit"
              disabled={isSubmitting || !isRecoveryLinkValid}
            >
              {isSubmitting ? 'Actualizando...' : 'Restablecer contraseña'}
            </button>
          </form>

          <div className="login-reference-alert-slot login-reference-alert-slot--reset" aria-live="polite">
            {!hasToken ? (
              <div className="login-reference-alert">
                El enlace no incluye el token necesario.
              </div>
            ) : null}
            {hasToken && gymId === null ? (
              <div className="login-reference-alert">
                El enlace no incluye un gymId válido.
              </div>
            ) : null}
            {requestError ? <div className="login-reference-alert">{requestError}</div> : null}
            {requestSuccess ? (
              <div className="login-reference-alert login-reference-alert--success">
                {requestSuccess} Serás redirigido al login.
              </div>
            ) : null}
          </div>

          <p className="login-reference-note">
            Usá el enlace recibido por email para crear una nueva clave segura.
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
