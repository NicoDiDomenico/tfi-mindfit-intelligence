import { useState } from 'react'
import { FormAlertModal } from '../FormAlertModal'
import { sociosService } from '../../services/sociosService'
import type { SocioGridItem, UsuarioDto } from '../../types/socio'
import { getSocioDeleteErrorMessage } from '../../utils/apiError'

interface EliminarSocioModalProps {
  socio: SocioGridItem
  onClose: () => void
  onDeleted: (usuario: UsuarioDto) => void
}

function getSocioDisplayName(socio: SocioGridItem) {
  return socio.nombreCompleto?.trim() || socio.username
}

export function EliminarSocioModal({
  socio,
  onClose,
  onDeleted,
}: EliminarSocioModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleConfirmDelete() {
    if (isDeleting || success) {
      return
    }

    setIsDeleting(true)
    setError('')
    setSuccess('')

    try {
      const updatedSocio = await sociosService.darDeBajaSocio(socio.idUsuario)
      setSuccess(`${getSocioDisplayName(socio)} fue dado de baja correctamente.`)
      onDeleted(updatedSocio)
    } catch (requestError) {
      setError(getSocioDeleteErrorMessage(requestError))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="consultar-backdrop" role="presentation">
      <section
        className="consultar-modal eliminar-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="eliminar-socio-title"
      >
        <header className="consultar-header eliminar-modal__header">
          <div>
            <h2 id="eliminar-socio-title">Confirmar eliminacion</h2>
            <div className="consultar-meta">
              <span className="consultar-status consultar-status--danger">Baja logica</span>
              <span>ID: {socio.idUsuario}</span>
            </div>
          </div>
          <button
            className="consultar-close"
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            disabled={isDeleting}
          >
            x
          </button>
        </header>

        <div className="consultar-body eliminar-modal__body">
          <div className="eliminar-modal__content">
            <p className="eliminar-modal__label">Socio seleccionado</p>
            <h3>{getSocioDisplayName(socio)}</h3>
            <p className="eliminar-modal__copy">
              Esta accion realizara una baja logica del socio seleccionado y actualizara su
              estado a <strong>Eliminado</strong>. La grilla se refrescara con el resultado real
              devuelto por el backend.
            </p>

            {error ? <FormAlertModal type="error" message={error} /> : null}
            {success ? <FormAlertModal type="success" message={success} /> : null}
          </div>
        </div>

        <footer className="consultar-footer eliminar-modal__footer">
          {success ? (
            <button className="ghost-button consultar-footer__close" type="button" onClick={onClose}>
              Cerrar
            </button>
          ) : (
            <>
              <button
                className="ghost-button consultar-footer__close"
                type="button"
                onClick={onClose}
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
                {isDeleting ? 'Confirmando eliminacion...' : 'Confirmar eliminacion'}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  )
}
