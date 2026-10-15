import { useEffect, useState } from 'react'
import type { TurnoDetalle } from '../../types/turno'

interface TurnosGridProps {
  turnos: readonly TurnoDetalle[]
  isLoading: boolean
  error: string
}

type TurnosView = 'day' | 'hour'

function getHourBlock(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:00`
}

function normalizeHourBlock(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?/)

  if (!match) return value.trim()

  return `${match[1].padStart(2, '0')}:00`
}

function getStateClassName(estadoTurno: string) {
  const normalized = estadoTurno.trim().toLocaleLowerCase('es-AR')

  if (normalized === 'encurso') return 'turno-state turno-state--active'
  if (normalized === 'cancelado') return 'turno-state turno-state--cancelled'
  if (normalized === 'finalizado') return 'turno-state turno-state--finished'
  if (normalized === 'vencido') return 'turno-state turno-state--expired'

  return 'turno-state turno-state--neutral'
}

function formatTurnoState(estadoTurno: string) {
  return estadoTurno === 'EnCurso' ? 'En Curso' : estadoTurno
}

function getCuposProgress(cupos: string) {
  const match = cupos.trim().match(/^(\d+)\s*\/\s*(\d+)$/)

  if (!match) return null

  const current = Number(match[1])
  const total = Number(match[2])

  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) return null

  return Math.min(100, Math.max(0, (current / total) * 100))
}

function CuposCell({ cupos }: { cupos: string }) {
  const progress = getCuposProgress(cupos)

  return (
    <div className="turnos-cupos">
      <span>{cupos}</span>
      {progress !== null ? (
        <span className="turnos-cupos__track" aria-hidden="true">
          <span className="turnos-cupos__bar" style={{ width: `${progress}%` }} />
        </span>
      ) : null}
    </div>
  )
}

export function TurnosGrid({ turnos, isLoading, error }: TurnosGridProps) {
  const [activeView, setActiveView] = useState<TurnosView>('day')
  const [currentHourBlock, setCurrentHourBlock] = useState(() => getHourBlock(new Date()))
  const turnosByCurrentHour = turnos.filter(
    (turno) => normalizeHourBlock(turno.hora) === currentHourBlock,
  )
  const currentHourCupos = turnosByCurrentHour[0]?.cupos ?? '-'

  useEffect(() => {
    const updateCurrentHourBlock = () => setCurrentHourBlock(getHourBlock(new Date()))
    const intervalId = window.setInterval(updateCurrentHourBlock, 60000)

    return () => window.clearInterval(intervalId)
  }, [])

  function toggleView() {
    setActiveView((currentView) => (currentView === 'day' ? 'hour' : 'day'))
  }

  return (
    <section className="turnos-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">Agenda</span>
          <h2>Turnos del día</h2>
        </div>
        <button
          className="turnos-view-toggle"
          type="button"
          aria-label={`Cambiar a vista ${activeView === 'day' ? 'Hora' : 'Día'}`}
          onClick={toggleView}
        >
          <span
            className={
              activeView === 'day'
                ? 'turnos-view-toggle__option turnos-view-toggle__option--active'
                : 'turnos-view-toggle__option'
            }
            aria-current={activeView === 'day' ? 'true' : undefined}
          >
            Día
          </span>
          <span
            className={
              activeView === 'hour'
                ? 'turnos-view-toggle__option turnos-view-toggle__option--active'
                : 'turnos-view-toggle__option'
            }
            aria-current={activeView === 'hour' ? 'true' : undefined}
          >
            Hora
          </span>
        </button>
      </div>

      {isLoading ? <p className="inicio-status">Cargando turnos del día...</p> : null}
      {error ? <p className="inicio-status inicio-status--error">{error}</p> : null}
      {!isLoading && !error && activeView === 'day' && turnos.length === 0 ? (
        <p className="inicio-status">No hay turnos registrados para hoy.</p>
      ) : null}
      {!isLoading && !error && activeView === 'hour' ? (
        <div className="turnos-hour-summary" aria-label="Resumen de hora actual">
          <span>
            Hora: <strong>{currentHourBlock}</strong>
          </span>
          <span>
            Cupos: <strong>{currentHourCupos}</strong>
          </span>
        </div>
      ) : null}
      {!isLoading && !error && activeView === 'hour' && turnosByCurrentHour.length === 0 ? (
        <p className="inicio-status">No hay turnos registrados para la hora actual.</p>
      ) : null}

      <div className="turnos-content">
        {activeView === 'day' && turnos.length > 0 ? (
          <div className="turnos-table-wrap">
            <table className="turnos-table">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Socio</th>
                  <th>Entrenador</th>
                  <th>Cupos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((turno) => (
                  <tr key={turno.idTurno}>
                    <td data-label="Hora">
                      <strong>{turno.hora}</strong>
                    </td>
                    <td data-label="Socio">{turno.socio}</td>
                    <td data-label="Entrenador">{turno.entrenador}</td>
                    <td data-label="Cupos">
                      <CuposCell cupos={turno.cupos} />
                    </td>
                    <td data-label="Estado">
                      <span className={getStateClassName(turno.estadoTurno)}>
                        {formatTurnoState(turno.estadoTurno)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {activeView === 'hour' && turnosByCurrentHour.length > 0 ? (
          <div className="turnos-table-wrap">
            <table className="turnos-table turnos-table--compact">
              <thead>
                <tr>
                  <th>Socio</th>
                  <th>Entrenador</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {turnosByCurrentHour.map((turno) => (
                  <tr key={turno.idTurno}>
                    <td data-label="Socio">{turno.socio}</td>
                    <td data-label="Entrenador">{turno.entrenador}</td>
                    <td data-label="Estado">
                      <span className={getStateClassName(turno.estadoTurno)}>
                        {formatTurnoState(turno.estadoTurno)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  )
}
