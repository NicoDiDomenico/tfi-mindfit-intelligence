import axios from 'axios'
import { useState } from 'react'
import { getCancelarTurnoErrorMessage } from '../../utils/apiError'

interface CancelarTurnoModalProps {
  turnoId: number
  turnoSummary: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

type CancelTurnoModalState = 'confirm' | 'success' | 'error'

export function CancelarTurnoModal({
  turnoId,
  turnoSummary,
  onClose,
  onConfirm,
}: CancelarTurnoModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [modalState, setModalState] = useState<CancelTurnoModalState>('confirm')

  async function handleConfirm() {
    if (isSubmitting || modalState !== 'confirm') {
      return
    }

    setIsSubmitting(true)
    setFeedbackMessage('')

    try {
      await onConfirm()
      setFeedbackMessage('El turno fue cancelado correctamente.')
      setModalState('success')
    } catch (requestError) {
      setFeedbackMessage(
        axios.isAxiosError(requestError)
          ? getCancelarTurnoErrorMessage(requestError)
          : requestError instanceof Error && requestError.message.trim()
          ? requestError.message
          : getCancelarTurnoErrorMessage(requestError),
      )
      setModalState('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  function getModalTitle() {
    if (modalState === 'success') {
      return 'Turno cancelado'
    }

    if (modalState === 'error') {
      return 'No se pudo cancelar el turno'
    }

    return 'Confirmar cancelacion'
  }

  function getModalCopy() {
    if (modalState === 'confirm') {
      return 'Confirma que desea cancelar este turno?'
    }

    return feedbackMessage
  }

  return (
    <div className="consultar-backdrop consultar-backdrop--nested" role="presentation">
      <section
        className="consultar-modal eliminar-modal turnos-cancel-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelar-turno-title"
      >
        <header className="consultar-header eliminar-modal__header">
          <div>
            <h2 id="cancelar-turno-title">{getModalTitle()}</h2>
            <div className="consultar-meta">
              <span className="consultar-status consultar-status--danger">Turno seleccionado</span>
              <span>ID: {turnoId}</span>
            </div>
          </div>
          <button
            className="consultar-close"
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            disabled={isSubmitting}
          >
            x
          </button>
        </header>

        <div className="consultar-body eliminar-modal__body">
          <div className="eliminar-modal__content">
            {modalState === 'confirm' ? (
              <p className="eliminar-modal__label">Confirma la accion</p>
            ) : null}
            <h3>{turnoSummary}</h3>
            <p className="eliminar-modal__copy">{getModalCopy()}</p>
          </div>
        </div>

        <footer className="consultar-footer eliminar-modal__footer">
          {modalState !== 'confirm' ? (
            <button className="ghost-button consultar-footer__close" type="button" onClick={onClose}>
              Cerrar
            </button>
          ) : (
            <>
              <button
                className="ghost-button consultar-footer__close"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Volver
              </button>
              <button
                className="submit-button consultar-button--danger eliminar-modal__confirm"
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleConfirm()}
              >
                {isSubmitting ? 'Cancelando turno...' : 'Confirmar cancelacion'}
              </button>
            </>
          )}
        </footer>
      </section>
    </div>
  )
}
