import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import heroImage from '../../assets/auth/auth-gym-background.jpg'
import { GymSelect } from '../../components/auth/GymSelect'
import { useAuth } from '../../hooks/useAuth'
import { useActiveGyms } from '../../hooks/useActiveGyms'
import { getLoginErrorMessage } from '../../utils/apiError'
import { getAuthenticatedHomePath } from '../../utils/authRoles'

interface LoginFormState {
  idGym: number | null
  nombreGym: string | null
  username: string
  password: string
}

interface LoginFormErrors {
  idGym?: string
  username?: string
  password?: string
}

const initialFormState: LoginFormState = {
  idGym: null,
  nombreGym: null,
  username: '',
  password: '',
}

export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isHydrated, login, session } = useAuth()
  const { gyms, gymsError, isLoadingGyms } = useActiveGyms()
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [loginError, setLoginError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isHydrated) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to={getAuthenticatedHomePath(session)} replace />
  }

  function updateField<K extends keyof LoginFormState>(field: K, value: LoginFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setLoginError('')
  }

  function validateForm() {
    const nextErrors: LoginFormErrors = {}

    if (!form.idGym) {
      nextErrors.idGym = 'Selecciona un gimnasio para continuar.'
    }

    if (!form.username.trim()) {
      nextErrors.username = 'Ingresa tu usuario.'
    }

    if (!form.password.trim()) {
      nextErrors.password = 'Ingresa tu contraseña.'
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
    setLoginError('')

    try {
      const nextSession = await login({
        idGym: form.idGym,
        nombreGym: form.nombreGym ?? `Gym ${form.idGym}`,
        username: form.username.trim(),
        password: form.password,
      })

      navigate(getAuthenticatedHomePath(nextSession), { replace: true })
    } catch (error) {
      setLoginError(getLoginErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-reference-page">
      <section className="login-reference-card" aria-label="Acceso a MindFit Intelligence">
        <div className="login-reference-form-panel">
          <Link
            className="login-reference-back"
            to="/"
            aria-label="Volver a la pagina de inicio"
          >
            <span aria-hidden="true">&larr;</span>
            Volver al inicio
          </Link>
          <div className="login-reference-back-spacer" aria-hidden="true" />

          <div className="login-reference-copy">
            <span className="login-reference-kicker">MindFit Intelligence</span>
            <h1>Iniciar Sesión</h1>
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
                onChange={(gymId, gymName) => {
                  updateField('idGym', gymId)
                  updateField('nombreGym', gymName)
                }}
                isDisabled={isLoadingGyms || gyms.length === 0 || isSubmitting}
              />
            </div>

            <div className="login-reference-field">
              <div className="login-reference-field-header">
                <label htmlFor="username">Usuario</label>
                {errors.username ? <p className="login-reference-error">{errors.username}</p> : null}
              </div>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="tu.usuario"
                value={form.username}
                onChange={(event) => updateField('username', event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="login-reference-field">
              <div className="login-reference-field-header">
                <label htmlFor="password">Contraseña</label>
                {errors.password ? <p className="login-reference-error">{errors.password}</p> : null}
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Al menos 8 caracteres"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <Link className="login-reference-forgot" to="/forgot-password">
              Olvidé mi contraseña
            </Link>

            <button className="login-reference-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>

          <div className="login-reference-alert-slot" aria-hidden="true" />

          {loginError ? (
            <div className="login-reference-modal-backdrop" role="presentation">
              <div
                className="login-reference-modal"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="login-error-title"
                aria-describedby="login-error-message"
              >
                <div className="login-reference-modal__icon" aria-hidden="true">
                  !
                </div>
                <div className="login-reference-modal__content">
                  <h2 id="login-error-title">No pudimos iniciar sesión</h2>
                  <p id="login-error-message">{loginError}</p>
                </div>
                <button
                  className="login-reference-modal__button"
                  type="button"
                  onClick={() => setLoginError('')}
                >
                  Entendido
                </button>
              </div>
            </div>
          ) : null}

          <p className="auth-register-link login-reference-register">
            ¿No tienes cuenta?{' '}
            <Link className="inline-link" to="/registro-gym">
              Registrate
            </Link>
          </p>
          <p className="auth-copyright">© 2026 MindFit Intelligence. Todos los derechos reservados.</p>
        </div>

        <div className="login-reference-image-panel" aria-hidden="true">
          <img src={heroImage} alt="" />
        </div>
      </section>
    </main>
  )
}
