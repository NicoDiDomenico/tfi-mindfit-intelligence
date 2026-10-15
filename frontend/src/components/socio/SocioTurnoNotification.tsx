import { useEffect, useMemo, useRef, useState } from 'react'
import type { TurnoHistorialItem } from '../../types/turno'

interface SocioTurnoNotificationProps {
  turnos: TurnoHistorialItem[]
  idUsuarioSocio: number
}

const DISMISSED_KEY_PREFIX = 'mindfit:socio-notification-dismissed:proximo-turno'
const HIDDEN_STATES = new Set(['cancelado', 'cancelada', 'finalizado', 'finalizada', 'vencido', 'vencida'])

function normalizeState(value: string) {
  return value.trim().toLocaleLowerCase('es-AR')
}

function parseLocalDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (!match) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function parseTimeInMinutes(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/)

  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null
  }

  return hours * 60 + minutes
}

function getTurnoDateTime(turno: TurnoHistorialItem) {
  const date = parseLocalDate(turno.fechaAlta)
  const startMinutes = parseTimeInMinutes(turno.horaDesde)

  if (!date || startMinutes === null) {
    return null
  }

  date.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)

  return date
}

function formatTime(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/)

  if (!match) {
    return value.trim() || '-'
  }

  return `${match[1].padStart(2, '0')}:${match[2]}`
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  )
}

function isTomorrow(date: Date, now: Date) {
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  return isSameDay(date, tomorrow)
}

function formatNotificationDate(date: Date, now = new Date()) {
  if (isSameDay(date, now)) {
    return 'Hoy'
  }

  if (isTomorrow(date, now)) {
    return 'Manana'
  }

  const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(date)
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)

  return `${weekday.charAt(0).toLocaleUpperCase('es-AR') + weekday.slice(1)} ${formattedDate}`
}

function getDismissedKey(idUsuarioSocio: number, idTurno: number) {
  return `${DISMISSED_KEY_PREFIX}:${idUsuarioSocio}:${idTurno}`
}

function isDismissed(idUsuarioSocio: number, idTurno: number) {
  try {
    return window.localStorage.getItem(getDismissedKey(idUsuarioSocio, idTurno)) === 'true'
  } catch {
    return false
  }
}

function dismissNotification(idUsuarioSocio: number, idTurno: number) {
  try {
    window.localStorage.setItem(getDismissedKey(idUsuarioSocio, idTurno), 'true')
  } catch {
    // El descarte es una mejora local; si el navegador lo bloquea, la UI sigue funcionando.
  }
}

function getProximoTurno(turnos: TurnoHistorialItem[], idUsuarioSocio: number) {
  const now = new Date()

  return turnos
    .map((turno) => ({
      turno,
      dateTime: getTurnoDateTime(turno),
    }))
    .filter((item): item is { turno: TurnoHistorialItem; dateTime: Date } => item.dateTime !== null)
    .filter(({ turno }) => !HIDDEN_STATES.has(normalizeState(turno.estadoTurno)))
    .filter(({ turno }) => !isDismissed(idUsuarioSocio, turno.idTurno))
    .filter(({ dateTime }) => dateTime.getTime() >= now.getTime())
    .sort((left, right) => left.dateTime.getTime() - right.dateTime.getTime())[0] ?? null
}

export function SocioTurnoNotification({ turnos, idUsuarioSocio }: SocioTurnoNotificationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dismissedVersion, setDismissedVersion] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const proximoTurno = useMemo(() => {
    void dismissedVersion
    return getProximoTurno(turnos, idUsuarioSocio)
  }, [dismissedVersion, idUsuarioSocio, turnos])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  function handleDismiss() {
    if (!proximoTurno) {
      return
    }

    dismissNotification(idUsuarioSocio, proximoTurno.turno.idTurno)
    setDismissedVersion((current) => current + 1)
  }

  const notificationLabel = proximoTurno
    ? `${formatNotificationDate(proximoTurno.dateTime)}, ${formatTime(
        proximoTurno.turno.horaDesde,
      )} - ${formatTime(proximoTurno.turno.horaHasta)}`
    : ''

  return (
    <div className="workspace-notifications" ref={menuRef}>
      <button
        ref={triggerRef}
        className="workspace-notifications__trigger"
        type="button"
        aria-label="Abrir notificaciones"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 18h14l-1.55-1.82A4.75 4.75 0 0 1 16.32 13v-2.25A4.34 4.34 0 0 0 13 6.54V5a1 1 0 1 0-2 0v1.54a4.34 4.34 0 0 0-3.32 4.21V13c0 1.17-.4 2.3-1.13 3.18L5 18Z" />
          <path d="M9.75 19.25a2.25 2.25 0 0 0 4.5 0" />
        </svg>
        {proximoTurno ? (
          <span className="workspace-notifications__badge" aria-label="1 notificacion nueva">
            1
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className="workspace-profile__menu workspace-notifications__menu"
          role="dialog"
          aria-label="Notificaciones"
        >
          {proximoTurno ? (
            <article className="workspace-notifications__item">
              <div>
                <span className="workspace-notifications__title">Proximo turno</span>
                <strong>{notificationLabel}</strong>
                <small>
                  Entrenador: {proximoTurno.turno.nombreResponsable}{' '}
                  {proximoTurno.turno.apellidoResponsable}
                </small>
              </div>
              <button
                className="workspace-notifications__action"
                type="button"
                onClick={handleDismiss}
              >
                Descartar
              </button>
            </article>
          ) : (
            <p className="workspace-notifications__empty">No tenes turnos proximos.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
