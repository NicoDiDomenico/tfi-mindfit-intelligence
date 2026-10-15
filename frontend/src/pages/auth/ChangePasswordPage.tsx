import type { ChangeEvent, FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormAlertModal } from '../../components/FormAlertModal'
import { AppLayout } from '../../layouts/AppLayout'
import { authService } from '../../services/authService'
import { getApiErrorMessage } from '../../utils/apiError'
import { getAuthenticatedHomePath, isSocioRole } from '../../utils/authRoles'
import { useAuth } from '../../hooks/useAuth'

interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const initialForm: ChangePasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

function isFormReady(form: ChangePasswordForm) {
  return Boolean(
    form.currentPassword.trim() && form.newPassword.trim() && form.confirmPassword.trim(),
  )
}

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [form, setForm] = useState<ChangePasswordForm>(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSocioSession = useMemo(() => isSocioRole(session?.datosPersonales?.rol), [session])
  const homePath = getAuthenticatedHomePath(session)

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))

    if (error) {
      setError('')
    }

    if (success) {
      setSuccess('')
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const currentPassword = form.currentPassword.trim()
    const newPassword = form.newPassword.trim()
    const confirmPassword = form.confirmPassword.trim()

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Completa todos los campos para continuar.')
      setSuccess('')
      return
    }

    if (newPassword.length < 8) {
      setError('La nueva contrasena debe tener al menos 8 caracteres.')
      setSuccess('')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('La nueva contrasena y su confirmacion deben coincidir.')
      setSuccess('')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = { currentPassword, newPassword }
      const response = isSocioSession
        ? await authService.changePasswordSocio(payload)
        : await authService.changePasswordResponsable(payload)

      setForm(initialForm)
      setSuccess(response || 'La contrasena se actualizo correctamente.')
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'No pudimos cambiar la contrasena. Revisa los datos e intenta nuevamente.',
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <main className="dashboard-page change-password-page">
        <section className="dashboard-card change-password-card">
          <header className="change-password-header">
            <div>
              <span className="section-kicker">Seguridad</span>
              <h1 className="dashboard-title">Cambiar contrasena</h1>
              <p className="dashboard-copy">
                Actualiza la clave de acceso de tu usuario actual.
              </p>
            </div>
          </header>

          <form className="change-password-form" onSubmit={handleSubmit} noValidate>
            <label className="field-group" htmlFor="currentPassword">
              <span className="field-label">Contrasena actual</span>
              <input
                id="currentPassword"
                className="field-input"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                disabled={isSubmitting}
                onChange={handleInputChange}
              />
            </label>

            <label className="field-group" htmlFor="newPassword">
              <span className="field-label">Nueva contrasena</span>
              <input
                id="newPassword"
                className="field-input"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                disabled={isSubmitting}
                onChange={handleInputChange}
              />
            </label>

            <label className="field-group" htmlFor="confirmPassword">
              <span className="field-label">Confirmar nueva contrasena</span>
              <input
                id="confirmPassword"
                className="field-input"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                disabled={isSubmitting}
                onChange={handleInputChange}
              />
            </label>

            {error ? <FormAlertModal type="error" message={error} /> : null}
            {success ? <FormAlertModal type="success" message={success} /> : null}

            <div className="change-password-actions">
              <button
                className="ghost-button"
                type="button"
                disabled={isSubmitting}
                onClick={() => navigate(homePath)}
              >
                Volver
              </button>
              <button
                className="submit-button"
                type="submit"
                disabled={isSubmitting || !isFormReady(form)}
              >
                {isSubmitting ? 'Guardando...' : 'Guardar contrasena'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </AppLayout>
  )
}
