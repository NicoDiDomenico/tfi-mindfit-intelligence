import { useEffect, useMemo, useState } from 'react'
import { FormAlertModal } from '../FormAlertModal'
import { turnosService } from '../../services/turnosService'
import type {
  GrillaDiaRangoHorario,
  GrillaDiaRangoHorarioResponsable,
} from '../../types/turno'
import { getDisponibilidadTurnoErrorMessage, getRegistrarTurnoErrorMessage } from '../../utils/apiError'
import { formatLocalDateForApi } from '../../utils/date'
import type { SocioGridItem } from '../../types/socio'

interface NuevoTurnoModalProps {
  socio: SocioGridItem
  onClose: () => void
  onRegistered: () => Promise<void>
}

function getSocioDisplayName(socio: SocioGridItem) {
  return socio.nombreCompleto?.trim() || socio.username
}

function formatTimeOption(timeValue: string) {
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

function formatCupoValue(value: number) {
  return String(value).padStart(2, '0')
}

function getResponsableName(responsable: GrillaDiaRangoHorarioResponsable) {
  return `${responsable.nombre} ${responsable.apellido}`.trim()
}

function getTimeInMinutes(timeValue: string) {
  const [hours, minutes] = timeValue.split(':')

  if (!hours || !minutes) {
    return null
  }

  const normalizedHours = Number(hours)
  const normalizedMinutes = Number(minutes)

  if (Number.isNaN(normalizedHours) || Number.isNaN(normalizedMinutes)) {
    return null
  }

  return normalizedHours * 60 + normalizedMinutes
}

function isCurrentOrFutureRangoForDate(rango: GrillaDiaRangoHorario, fecha: string) {
  const today = formatLocalDateForApi(new Date())

  if (fecha > today) {
    return true
  }

  if (fecha < today) {
    return false
  }

  const desde = getTimeInMinutes(rango.horaDesde)
  const hasta = getTimeInMinutes(rango.horaHasta)

  if (desde === null || hasta === null) {
    return false
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const isCurrentRango =
    hasta <= desde
      ? currentMinutes >= desde || currentMinutes < hasta
      : currentMinutes >= desde && currentMinutes < hasta

  return isCurrentRango || currentMinutes < desde
}

function getDefaultRangoId(rangos: GrillaDiaRangoHorario[]) {
  if (rangos.length === 0) {
    return null
  }

  return rangos[0]?.idDiaRangoHorario ?? null
}

export function NuevoTurnoModal({ socio, onClose, onRegistered }: NuevoTurnoModalProps) {
  const [fecha, setFecha] = useState(() => formatLocalDateForApi(new Date()))
  const [rangos, setRangos] = useState<GrillaDiaRangoHorario[]>([])
  const [selectedRangoId, setSelectedRangoId] = useState<number | null>(null)
  const [selectedResponsableId, setSelectedResponsableId] = useState<number | null>(null)
  const [isLoadingDisponibilidad, setIsLoadingDisponibilidad] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')

  async function loadDisponibilidad(nextFecha: string, options?: { preserveRangoId?: number | null }) {
    setIsLoadingDisponibilidad(true)
    setLoadError('')

    try {
      const response = await turnosService.getDisponibilidadPorDia(nextFecha)
      const activeRangos = response.filter(
        (rango) => rango.activo && isCurrentOrFutureRangoForDate(rango, nextFecha),
      )

      setRangos(activeRangos)

      const preservedRangoId = options?.preserveRangoId ?? null
      setSelectedRangoId(
        preservedRangoId && activeRangos.some((rango) => rango.idDiaRangoHorario === preservedRangoId)
          ? preservedRangoId
          : getDefaultRangoId(activeRangos),
      )
      setSelectedResponsableId(null)
    } catch (requestError) {
      setRangos([])
      setSelectedRangoId(null)
      setSelectedResponsableId(null)
      setLoadError(getDisponibilidadTurnoErrorMessage(requestError))
    } finally {
      setIsLoadingDisponibilidad(false)
    }
  }

  useEffect(() => {
    async function loadForDate() {
      setSubmitError('')
      await loadDisponibilidad(fecha)
    }

    void loadForDate()
  }, [fecha])

  const selectedRango = useMemo(
    () => rangos.find((rango) => rango.idDiaRangoHorario === selectedRangoId) ?? null,
    [rangos, selectedRangoId],
  )

  const responsables = selectedRango?.responsables ?? []
  const hasCupoDisponible = selectedRango
    ? selectedRango.cupoActual < selectedRango.cupoMaximo
    : false

  function validateBeforeSubmit() {
    if (!socio.idUsuario) {
      return 'No hay un socio seleccionado para registrar el turno.'
    }

    if (!fecha) {
      return 'Selecciona una fecha para el turno.'
    }

    if (!selectedRango) {
      return 'Selecciona un rango horario disponible.'
    }

    if (!selectedResponsableId) {
      return 'Selecciona un entrenador para el turno.'
    }

    if (!hasCupoDisponible) {
      return 'El rango horario seleccionado no tiene cupo disponible.'
    }

    return ''
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return
    }

    const validationError = validateBeforeSubmit()

    if (validationError) {
      setSubmitError(validationError)
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      await turnosService.registrarTurnoAsistente({
        idUsuarioSocio: socio.idUsuario,
        idUsuarioResponsable: selectedResponsableId as number,
        fecha,
        idDiaRangoHorario: selectedRangoId as number,
      })
      await onRegistered()
      onClose()
    } catch (requestError) {
      setSubmitError(getRegistrarTurnoErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="consultar-backdrop consultar-backdrop--nested" role="presentation">
      <section
        className="consultar-modal nuevo-turno-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nuevo-turno-title"
      >
        <header className="consultar-header nuevo-turno-modal__header">
          <div>
            <span className="section-kicker">Turnos / Nuevo</span>
            <h2 id="nuevo-turno-title">Registrar turno</h2>
            <div className="consultar-meta">
              <span className="consultar-status consultar-status--info">Socio seleccionado</span>
              <span>{getSocioDisplayName(socio)}</span>
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

        <div className="consultar-body nuevo-turno-modal__body">
          <div className="nuevo-turno-modal__controls">
            <label className="consultar-field">
              <span>Fecha Turno</span>
              <input
                className="consultar-input"
                type="date"
                value={fecha}
                disabled={isSubmitting}
                onChange={(event) => {
                  setFecha(event.target.value)
                  setSelectedRangoId(null)
                  setSelectedResponsableId(null)
                }}
              />
            </label>

            <label className="consultar-field">
              <span>Rango Horario</span>
              <select
                className="consultar-input"
                value={selectedRangoId ?? ''}
                disabled={isLoadingDisponibilidad || isSubmitting || rangos.length === 0}
                onChange={(event) => {
                  const nextValue = Number(event.target.value)
                  setSelectedRangoId(Number.isNaN(nextValue) ? null : nextValue)
                  setSelectedResponsableId(null)
                  setSubmitError('')
                }}
              >
                <option value="">Seleccionar rango horario</option>
                {rangos.map((rango) => (
                  <option key={rango.idDiaRangoHorario} value={rango.idDiaRangoHorario}>
                    {formatTimeOption(rango.horaDesde)} - {formatTimeOption(rango.horaHasta)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoadingDisponibilidad ? (
            <p className="inicio-status">Cargando disponibilidad de turnos...</p>
          ) : null}
          {loadError ? <p className="inicio-status inicio-status--error">{loadError}</p> : null}
          {!isLoadingDisponibilidad && !loadError && rangos.length === 0 ? (
            <p className="inicio-status">No hay rangos horarios disponibles para este dia.</p>
          ) : null}

          {selectedRango ? (
            <div className="nuevo-turno-modal__summary">
              <div>
                <span>Horario</span>
                <strong>
                  {formatTimeOption(selectedRango.horaDesde)} - {formatTimeOption(selectedRango.horaHasta)}
                </strong>
              </div>
              <div>
                <span>Disponibilidad</span>
                <strong>
                  {formatCupoValue(selectedRango.cupoActual)}/{formatCupoValue(selectedRango.cupoMaximo)}
                </strong>
              </div>
              <div>
                <span>Dia</span>
                <strong>{selectedRango.nombreDia}</strong>
              </div>
            </div>
          ) : null}

          {selectedRango && !hasCupoDisponible ? (
            <FormAlertModal
              type="error"
              message="El rango horario seleccionado no tiene cupo disponible."
            />
          ) : null}

          {selectedRango ? (
            responsables.length > 0 ? (
              <div className="gestionar-turnos-modal__table-wrap nuevo-turno-modal__table-wrap">
                <table className="turnos-table nuevo-turno-table">
                  <thead>
                    <tr>
                      <th aria-label="Seleccion" />
                      <th>Entrenador</th>
                      <th>Disponibilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responsables.map((responsable) => {
                      const isSelected =
                        responsable.idUsuarioResponsable === selectedResponsableId

                      return (
                        <tr
                          key={responsable.idUsuarioResponsable}
                          className={
                            isSelected
                              ? 'socios-row gestionar-turnos-row gestionar-turnos-row--selected'
                              : 'socios-row gestionar-turnos-row'
                          }
                          onClick={() => {
                            setSelectedResponsableId(responsable.idUsuarioResponsable)
                            setSubmitError('')
                          }}
                        >
                          <td data-label="Seleccion">
                            <span
                              className={
                                isSelected
                                  ? 'socios-radio socios-radio--selected'
                                  : 'socios-radio'
                              }
                              aria-hidden="true"
                            />
                          </td>
                          <td data-label="Entrenador">
                            <strong>{getResponsableName(responsable)}</strong>
                          </td>
                          <td data-label="Disponibilidad">
                            {formatCupoValue(selectedRango.cupoActual)}/
                            {formatCupoValue(selectedRango.cupoMaximo)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="inicio-status">
                No hay entrenadores disponibles para este dia y horario.
              </p>
            )
          ) : null}

          {submitError ? <FormAlertModal type="error" message={submitError} /> : null}
        </div>

        <footer className="consultar-footer nuevo-turno-modal__footer">
          <button
            className="ghost-button consultar-footer__close"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cerrar
          </button>
          <button
            className="submit-button consultar-footer__save"
            type="button"
            disabled={isSubmitting || isLoadingDisponibilidad}
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? 'Registrando turno...' : 'Registrar Turno'}
          </button>
        </footer>
      </section>
    </div>
  )
}
