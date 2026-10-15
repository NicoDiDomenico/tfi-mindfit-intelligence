import type { ChangeEvent, FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { FormAlertModal } from '../FormAlertModal'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/authService'
import { getApiErrorMessage } from '../../utils/apiError'
import { isSocioRole } from '../../utils/authRoles'

interface ChangePasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface ChangePasswordModalProps {
  onClose: () => void
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

export function ChangePasswordModal({ onClose }: ChangePasswordModalProps) {
  const { session } = useAuth()
  const [form, setForm] = useState<ChangePasswordForm>(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSocioSession = useMemo(() => isSocioRole(session?.datosPersonales?.rol), [session])

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
    <div className="consultar-backdrop" role="presentation">
      <section
        className="consultar-modal change-password-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-modal-title"
      >
        <header className="consultar-header">
          <div>
            <h2 id="change-password-modal-title">Cambiar contrasena</h2>
            <div className="consultar-meta">
              <span className="consultar-status consultar-status--info">Seguridad</span>
              <span>Usuario actual</span>
            </div>
          </div>
          <button
            className="consultar-close"
            type="button"
            aria-label="Cerrar"
            disabled={isSubmitting}
            onClick={onClose}
          >
            x
          </button>
        </header>

        <form className="change-password-form" onSubmit={handleSubmit} noValidate>
          <div className="consultar-body change-password-modal__body">
            <label className="field-group" htmlFor="modal-currentPassword">
              <span className="field-label">Contrasena actual</span>
              <input
                id="modal-currentPassword"
                className="field-input"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                disabled={isSubmitting}
                onChange={handleInputChange}
              />
            </label>

            <label className="field-group" htmlFor="modal-newPassword">
              <span className="field-label">Nueva contrasena</span>
              <input
                id="modal-newPassword"
                className="field-input"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                disabled={isSubmitting}
                onChange={handleInputChange}
              />
            </label>

            <label className="field-group" htmlFor="modal-confirmPassword">
              <span className="field-label">Confirmar nueva contrasena</span>
              <input
                id="modal-confirmPassword"
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
          </div>

          <footer className="consultar-footer">
            <button
              className="ghost-button consultar-footer__close"
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
            >
              Cerrar
            </button>
            <button
              className="submit-button consultar-footer__save"
              type="submit"
              disabled={isSubmitting || !isFormReady(form)}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar contrasena'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
