import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ConsultarSocioModal,
  type ConsultarSocioTabId,
} from '../../components/socios/ConsultarSocioModal'
import { SocioInsightsNotification } from '../../components/socio/SocioInsightsNotification'
import { NuevoTurnoSocioModal } from '../../components/socio/NuevoTurnoSocioModal'
import { CancelarTurnoModal } from '../../components/turnos/CancelarTurnoModal'
import { TurnosHistorialGrid } from '../../components/turnos/TurnosHistorialGrid'
import { useAuth } from '../../hooks/useAuth'
import { AppLayout } from '../../layouts/AppLayout'
import { turnosService } from '../../services/turnosService'
import type { TurnoHistorialItem } from '../../types/turno'
import { getSocioTurnosErrorMessage } from '../../utils/apiError'
import { formatDateCell } from '../../utils/date'

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

function getProfileTabFromPath(pathname: string): ConsultarSocioTabId | null {
  if (pathname === '/socio/inicio/info-personal') {
    return 'personal'
  }

  if (pathname === '/socio/inicio/facturacion') {
    return 'facturacion'
  }

  if (pathname === '/socio/inicio/perfil-ia') {
    return 'perfilIA'
  }

  if (pathname === '/socio/inicio/cambiar-contrasena') {
    return 'seguridad'
  }

  return null
}

export function SocioInicioPage() {
  const { session } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [turnos, setTurnos] = useState<TurnoHistorialItem[]>([])
  const [selectedTurnoId, setSelectedTurnoId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cancelTargetTurno, setCancelTargetTurno] = useState<TurnoHistorialItem | null>(null)
  const [isNuevoTurnoOpen, setIsNuevoTurnoOpen] = useState(false)
  const [recommendationsRefreshKey, setRecommendationsRefreshKey] = useState(0)

  const selectedTurno = useMemo(
    () => turnos.find((turno) => turno.idTurno === selectedTurnoId) ?? null,
    [selectedTurnoId, turnos],
  )
  const profileTab = getProfileTabFromPath(location.pathname)
  const socioId = session?.datosPersonales?.id ?? null

  const loadTurnos = useCallback(async (options?: { keepLoading?: boolean }) => {
    if (options?.keepLoading !== false) {
      setIsLoading(true)
    }

    setLoadError('')

    try {
      await turnosService.procesarTurnosVencidos()
      const response = await turnosService.getTurnosSocioLogueado()

      setTurnos(response)
      setRecommendationsRefreshKey((current) => current + 1)
      setSelectedTurnoId((currentSelectedTurnoId) =>
        response.some((turno) => turno.idTurno === currentSelectedTurnoId)
          ? currentSelectedTurnoId
          : null,
      )
    } catch (requestError) {
      setLoadError(getSocioTurnosErrorMessage(requestError))
      throw requestError
    } finally {
      setIsLoading(false)
    }
  }, [])

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

  async function refreshTurnosAfterChange() {
    try {
      await loadTurnos({ keepLoading: false })
    } catch {
      return
    }
  }

  function openNuevoTurnoModal() {
    setIsNuevoTurnoOpen(true)
  }

  function handleCancelTurnoClick() {
    if (!selectedTurno) {
      return
    }

    setCancelTargetTurno(selectedTurno)
  }

  function closeCancelModal() {
    setCancelTargetTurno(null)
  }

  async function handleConfirmCancelTurno() {
    if (!cancelTargetTurno) {
      throw new Error('No hay turno seleccionado.')
    }

    const blockedMessage = getCancelBlockedMessage(cancelTargetTurno.estadoTurno)

    if (blockedMessage) {
      throw new Error(blockedMessage)
    }

    try {
      await turnosService.cancelarTurnoSocio(cancelTargetTurno.idTurno)
      setSelectedTurnoId(null)
      await refreshTurnosAfterChange()
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 404) {
        setSelectedTurnoId(null)
        await refreshTurnosAfterChange()
      }

      throw requestError
    }
  }

  return (
    <AppLayout
      notificationsSlot={
        session?.datosPersonales?.id ? (
          <SocioInsightsNotification
            idUsuarioSocio={session.datosPersonales.id}
            refreshKey={recommendationsRefreshKey}
            onOpenNuevoTurno={openNuevoTurnoModal}
          />
        ) : undefined
      }
    >
      <main className="dashboard-page socio-inicio-page">
        <section className="dashboard-card socio-inicio-card">
          <header className="socio-inicio-header">
            <div>
              <span className="section-kicker">Portal Socio</span>
              <h1 className="dashboard-title">Mis turnos</h1>
              <div className="socio-inicio-copy-row">
                <p className="dashboard-copy">
                  Consulta tus turnos registrados y deja preparado el siguiente paso operativo.
                </p>
                <span className="section-count socio-inicio-count">
                  {turnos.length} {turnos.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
            </div>
          </header>

          <div className="socio-inicio-content">
            {isLoading ? <p className="inicio-status">Cargando historial de turnos...</p> : null}
            {loadError ? <p className="inicio-status inicio-status--error">{loadError}</p> : null}
            {!isLoading && !loadError && turnos.length === 0 ? (
              <p className="inicio-status">No tenes turnos registrados.</p>
            ) : null}

            {turnos.length > 0 ? (
              <TurnosHistorialGrid
                turnos={turnos}
                selectedTurnoId={selectedTurnoId}
                onSelectTurno={setSelectedTurnoId}
              />
            ) : null}
          </div>

          <div className="gestionar-turnos-modal__actions socio-inicio-actions">
            <Link
              className="submit-button consultar-footer__save"
              to="/socio/rutinas"
            >
              Ver Rutinas
            </Link>
            <button
              className="submit-button consultar-footer__save socio-inicio-primary-action"
              type="button"
              onClick={openNuevoTurnoModal}
            >
              Nuevo Turno
            </button>
            <button
              className="ghost-button consultar-footer__close gestionar-turnos-modal__cancel"
              type="button"
              disabled={selectedTurnoId === null || isLoading}
              onClick={handleCancelTurnoClick}
            >
              Cancelar Turno
            </button>
          </div>
        </section>
      </main>

      {cancelTargetTurno ? (
        <CancelarTurnoModal
          turnoId={cancelTargetTurno.idTurno}
          turnoSummary={getTurnoSummary(cancelTargetTurno)}
          onClose={closeCancelModal}
          onConfirm={handleConfirmCancelTurno}
        />
      ) : null}

      {isNuevoTurnoOpen ? (
        <NuevoTurnoSocioModal
          onClose={() => setIsNuevoTurnoOpen(false)}
          onRegistered={async () => {
            setSelectedTurnoId(null)
            await refreshTurnosAfterChange()
          }}
        />
      ) : null}

      {profileTab && socioId ? (
        <ConsultarSocioModal
          idUsuario={socioId}
          userPermissions={[]}
          initialTab={profileTab}
          readOnly
          onClose={() => navigate('/socio/inicio')}
          onDeleted={() => undefined}
          onUpdated={() => undefined}
        />
      ) : null}
    </AppLayout>
  )
}
