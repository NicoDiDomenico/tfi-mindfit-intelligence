import { useCallback, useEffect, useMemo, useState } from 'react'
import { CancelarTurnoModal } from '../turnos/CancelarTurnoModal'
import { TurnosHistorialGrid } from '../turnos/TurnosHistorialGrid'
import { turnosService } from '../../services/turnosService'
import type { SocioGridItem } from '../../types/socio'
import type { TurnoHistorialItem } from '../../types/turno'
import { getSocioTurnosErrorMessage } from '../../utils/apiError'
import { formatDateCell } from '../../utils/date'
import { NuevoTurnoModal } from './NuevoTurnoModal'

interface GestionTurnosModalProps {
  socio: SocioGridItem
  userPermissions: readonly string[]
  onClose: () => void
}

function getSocioDisplayName(socio: SocioGridItem) {
  return socio.nombreCompleto?.trim() || socio.username
}

function formatTimeCell(timeValue: string) {
  const normalizedValue = timeValue.trim()

  if (!normalizedValue) {
    return '-'
  }

  const [hours, minutes] = normalizedValue.split(':')

  if (!hours || !minutes) {
    return normalizedValue
  }

  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function getTurnoSummary(turno: TurnoHistorialItem) {
  return `${formatDateCell(turno.fechaAlta)} - ${formatTimeCell(turno.horaDesde)} a ${formatTimeCell(
    turno.horaHasta,
  )}`
}

function getCancelBlockedMessage(estadoTurno: string) {
  if (estadoTurno === 'Cancelado') {
    return 'El turno ya fue cancelado.'
  }

  if (estadoTurno === 'Finalizado') {
    return 'No es posible cancelar un turno finalizado.'
  }

  if (estadoTurno === 'Vencido') {
    return 'No es posible cancelar un turno vencido.'
  }

  if (estadoTurno !== 'EnCurso') {
    return 'No es posible cancelar el turno seleccionado por su estado actual.'
  }

  return null
}

export function GestionTurnosModal({
  socio,
  userPermissions,
  onClose,
}: GestionTurnosModalProps) {
  const [turnos, setTurnos] = useState<TurnoHistorialItem[]>([])
  const [selectedTurnoId, setSelectedTurnoId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isNuevoTurnoOpen, setIsNuevoTurnoOpen] = useState(false)
  const [cancelTargetTurno, setCancelTargetTurno] = useState<TurnoHistorialItem | null>(null)

  const canAgregarTurno = userPermissions.includes('AGREGAR_TURNO')
  const canCancelarTurno = userPermissions.includes('CANCELAR_TURNO')

  const loadTurnos = useCallback(async (options?: { keepLoading?: boolean }) => {
    if (options?.keepLoading !== false) {
      setIsLoading(true)
    }

    setError('')

    try {
      await turnosService.procesarTurnosVencidos()
      const response = await turnosService.getSocioTurnos(socio.idUsuario)
      setTurnos(response)
      setSelectedTurnoId((currentSelectedTurnoId) =>
        response.some((turno) => turno.idTurno === currentSelectedTurnoId)
          ? currentSelectedTurnoId
          : null,
      )
    } catch (requestError) {
      setError(getSocioTurnosErrorMessage(requestError))
      throw requestError
    } finally {
      setIsLoading(false)
    }
  }, [socio.idUsuario])

  useEffect(() => {
    let isActive = true

    async function loadInitialTurnos() {
      try {
        await loadTurnos()
      } catch {
        if (!isActive) {
          return
        }
      }
    }

    if (isActive) {
      void loadInitialTurnos()
    }

    return () => {
      isActive = false
    }
  }, [loadTurnos])

  const selectedTurno = useMemo(
    () => turnos.find((turno) => turno.idTurno === selectedTurnoId) ?? null,
    [selectedTurnoId, turnos],
  )

  async function handleConfirmCancelTurno() {
    if (!cancelTargetTurno) {
      throw new Error('No hay turno seleccionado.')
    }

    const blockedMessage = getCancelBlockedMessage(cancelTargetTurno.estadoTurno)

    if (blockedMessage) {
      throw new Error(blockedMessage)
    }

    await turnosService.cancelarTurnoAsistente(cancelTargetTurno.idTurno)
    await loadTurnos({ keepLoading: false })
    setSelectedTurnoId(null)
  }

  async function handleRegisteredTurno() {
    await loadTurnos({ keepLoading: false })
    setSuccessMessage('Turno registrado correctamente.')
  }

  return (
    <div className="consultar-backdrop" role="presentation">
      <section
        className="consultar-modal gestionar-turnos-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gestionar-turnos-title"
      >
        <header className="consultar-header gestionar-turnos-modal__header">
          <div>
            <span className="section-kicker">Turnos / Socio</span>
            <h2 id="gestionar-turnos-title">Gestionar turnos</h2>
            <div className="consultar-meta">
              <span className="consultar-status consultar-status--info">Historial operativo</span>
              <span>ID socio: {socio.idUsuario}</span>
            </div>
          </div>
          <button className="consultar-close" type="button" aria-label="Cerrar" onClick={onClose}>
            x
          </button>
        </header>

        <div className="consultar-body gestionar-turnos-modal__body">
          <div className="gestionar-turnos-modal__intro">
            <div>
              <span className="section-kicker">Seguimiento</span>
              <h3>Historial de turnos</h3>
            </div>

            <div className="gestionar-turnos-modal__socio">
              <div>
                <span>Socio</span>
                <strong>{getSocioDisplayName(socio)}</strong>
              </div>
              <div>
                <span>Nro Documento</span>
                <strong>{socio.nroDocumento?.trim() || '-'}</strong>
              </div>
            </div>
          </div>

          {isLoading ? <p className="inicio-status">Cargando historial de turnos...</p> : null}
          {error ? <p className="inicio-status inicio-status--error">{error}</p> : null}
          {!isLoading && !error && turnos.length === 0 ? (
            <p className="inicio-status">El socio no tiene turnos registrados.</p>
          ) : null}

          {turnos.length > 0 ? (
            <TurnosHistorialGrid
              turnos={turnos}
              selectedTurnoId={selectedTurnoId}
              onSelectTurno={setSelectedTurnoId}
            />
          ) : null}
        </div>

        <footer className="consultar-footer gestionar-turnos-modal__footer">
          <button className="ghost-button consultar-footer__close" type="button" onClick={onClose}>
            Volver
          </button>

          <div className="gestionar-turnos-modal__actions">
            {canAgregarTurno ? (
              <button
                className="submit-button consultar-footer__save"
                type="button"
                onClick={() => setIsNuevoTurnoOpen(true)}
              >
                Nuevo Turno
              </button>
            ) : null}

            {canCancelarTurno ? (
              <button
                className="ghost-button consultar-footer__close gestionar-turnos-modal__cancel"
                type="button"
                disabled={!selectedTurno || isLoading}
                onClick={() => setCancelTargetTurno(selectedTurno)}
              >
                Cancelar Turno
              </button>
            ) : null}
          </div>
        </footer>
      </section>

      {isNuevoTurnoOpen ? (
        <NuevoTurnoModal
          socio={socio}
          onClose={() => setIsNuevoTurnoOpen(false)}
          onRegistered={handleRegisteredTurno}
        />
      ) : null}

      {successMessage ? (
        <div className="consultar-backdrop consultar-backdrop--nested" role="presentation">
          <section
            className="consultar-modal eliminar-modal consultar-confirm-modal consultar-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="turno-success-title"
          >
            <header className="consultar-header eliminar-modal__header">
              <div>
                <h2 id="turno-success-title">Operacion confirmada</h2>
                <div className="consultar-meta">
                  <span className="consultar-status consultar-status--success">Confirmado</span>
                </div>
              </div>
              <button
                className="consultar-close"
                type="button"
                aria-label="Cerrar"
                onClick={() => setSuccessMessage('')}
              >
                x
              </button>
            </header>

            <div className="consultar-body eliminar-modal__body">
              <div className="eliminar-modal__content">
                <p className="eliminar-modal__label">Resultado</p>
                <h3>{successMessage}</h3>
                <p className="eliminar-modal__copy">
                  El historial del socio ya fue actualizado con el nuevo turno.
                </p>
              </div>
            </div>

            <footer className="consultar-footer eliminar-modal__footer">
              <button
                className="submit-button consultar-button--green eliminar-modal__confirm"
                type="button"
                onClick={() => setSuccessMessage('')}
              >
                Aceptar
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {cancelTargetTurno ? (
        <CancelarTurnoModal
          turnoId={cancelTargetTurno.idTurno}
          turnoSummary={getTurnoSummary(cancelTargetTurno)}
          onClose={() => setCancelTargetTurno(null)}
          onConfirm={handleConfirmCancelTurno}
        />
      ) : null}
    </div>
  )
}
