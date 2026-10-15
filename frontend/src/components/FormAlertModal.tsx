import { useEffect, useId, useState } from 'react'

type FormAlertModalType = 'error' | 'success'

interface FormAlertModalProps {
  message: string
  type: FormAlertModalType
}

export function FormAlertModal({ message, type }: FormAlertModalProps) {
  const [isOpen, setIsOpen] = useState(Boolean(message))
  const titleId = useId()
  const descriptionId = useId()
  const title = type === 'error' ? 'Atencion' : 'Operacion completada'

  useEffect(() => {
    setIsOpen(Boolean(message))
  }, [message, type])

  if (!message || !isOpen) {
    return null
  }

  return (
    <div className="form-alert-modal-backdrop" role="presentation">
      <section
        className={`form-alert-modal form-alert-modal--${type}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="form-alert-modal__header">
          <p className="form-alert-modal__label">
            {type === 'error' ? 'Revisa la informacion' : 'Resultado'}
          </p>
          <h2 id={titleId}>{title}</h2>
        </header>
        <p className="form-alert-modal__message" id={descriptionId}>
          {message}
        </p>
        <footer className="form-alert-modal__footer">
          <button
            className="submit-button form-alert-modal__confirm"
            type="button"
            onClick={() => setIsOpen(false)}
          >
            Aceptar
          </button>
        </footer>
      </section>
    </div>
  )
}
