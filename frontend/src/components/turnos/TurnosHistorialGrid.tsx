import { useMemo } from 'react'
import type { TurnoHistorialItem } from '../../types/turno'
import { formatDateCell } from '../../utils/date'

interface TurnosHistorialGridProps {
  turnos: TurnoHistorialItem[]
  selectedTurnoId: number | null
  onSelectTurno: (idTurno: number) => void
}

function formatTurnoState(estadoTurno: string) {
  return estadoTurno === 'EnCurso' ? 'En Curso' : estadoTurno
}

function getStateClassName(estadoTurno: string) {
  const normalized = estadoTurno.trim().toLocaleLowerCase('es-AR')

  if (normalized === 'encurso') return 'turno-state turno-state--active'
  if (normalized === 'cancelado') return 'turno-state turno-state--cancelled'
  if (normalized === 'finalizado') return 'turno-state turno-state--finished'
  if (normalized === 'vencido') return 'turno-state turno-state--expired'

  return 'turno-state turno-state--neutral'
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

function getTrainerName(turno: TurnoHistorialItem) {
  return `${turno.nombreResponsable} ${turno.apellidoResponsable}`.trim()
}

export function TurnosHistorialGrid({
  turnos,
  selectedTurnoId,
  onSelectTurno,
}: TurnosHistorialGridProps) {
  const sortedTurnos = useMemo(
    () =>
      [...turnos].sort((leftTurno, rightTurno) => {
        const leftDate = new Date(leftTurno.fechaAlta).getTime()
        const rightDate = new Date(rightTurno.fechaAlta).getTime()

        const normalizedLeftDate = Number.isNaN(leftDate) ? 0 : leftDate
        const normalizedRightDate = Number.isNaN(rightDate) ? 0 : rightDate

        return normalizedRightDate - normalizedLeftDate
      }),
    [turnos],
  )

  return (
    <div className="gestionar-turnos-modal__table-wrap">
      <table className="turnos-table gestionar-turnos-table">
        <thead>
          <tr>
            <th aria-label="Seleccion" />
            <th>Fecha Turno</th>
            <th>Hora Desde</th>
            <th>Hora Hasta</th>
            <th>Estado Turno</th>
            <th>Entrenador</th>
          </tr>
        </thead>
        <tbody>
          {sortedTurnos.map((turno) => {
            const isSelected = turno.idTurno === selectedTurnoId

            return (
              <tr
                key={turno.idTurno}
                className={
                  isSelected
                    ? 'socios-row gestionar-turnos-row gestionar-turnos-row--selected'
                    : 'socios-row gestionar-turnos-row'
                }
                onClick={() => onSelectTurno(turno.idTurno)}
              >
                <td data-label="Seleccion">
                  <span
                    className={isSelected ? 'socios-radio socios-radio--selected' : 'socios-radio'}
                    aria-hidden="true"
                  />
                </td>
                <td data-label="Fecha Turno">
                  <strong>{formatDateCell(turno.fechaAlta)}</strong>
                </td>
                <td data-label="Hora Desde">{formatTimeCell(turno.horaDesde)}</td>
                <td data-label="Hora Hasta">{formatTimeCell(turno.horaHasta)}</td>
                <td data-label="Estado Turno">
                  <span className={getStateClassName(turno.estadoTurno)}>
                    {formatTurnoState(turno.estadoTurno)}
                  </span>
                </td>
                <td data-label="Entrenador">{getTrainerName(turno)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
