import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { socioInsightsService } from '../../services/socioInsightsService'
import type { SocioRecomendacion } from '../../types/socioInsights'

interface SocioInsightsNotificationProps {
  idUsuarioSocio: number
  refreshKey?: number
  onOpenNuevoTurno?: () => void
}

const DISMISSED_KEY_PREFIX = 'mindfit:socio-recommendation-dismissed'

function getTodayKey(now = new Date()) {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDismissedKey(idUsuarioSocio: number, recommendationId: string) {
  return `${DISMISSED_KEY_PREFIX}:${idUsuarioSocio}:${recommendationId}:${getTodayKey()}`
}

function isDismissed(idUsuarioSocio: number, recommendationId: string) {
  try {
    return window.localStorage.getItem(getDismissedKey(idUsuarioSocio, recommendationId)) === 'true'
  } catch {
    return false
  }
}

function dismissRecommendation(idUsuarioSocio: number, recommendationId: string) {
  try {
    window.localStorage.setItem(getDismissedKey(idUsuarioSocio, recommendationId), 'true')
  } catch {
    // El descarte es local. Si el navegador lo bloquea, la campana sigue funcionando.
  }
}

function shouldOpenNuevoTurno(recommendation: SocioRecomendacion) {
  return (
    recommendation.accionUrl === '/socio/inicio?accion=nuevo-turno'
    || recommendation.accionTexto?.toLocaleLowerCase('es-AR').includes('reservar') === true
  )
}

export function SocioInsightsNotification({
  idUsuarioSocio,
  refreshKey = 0,
  onOpenNuevoTurno,
}: SocioInsightsNotificationProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [recommendations, setRecommendations] = useState<SocioRecomendacion[]>([])
  const [loadError, setLoadError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dismissedVersion, setDismissedVersion] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const loadRecommendations = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const response = await socioInsightsService.getRecomendaciones()
      setRecommendations(response)
    } catch {
      setRecommendations([])
      setLoadError('No pudimos cargar tus recomendaciones.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRecommendations()
  }, [loadRecommendations, refreshKey])

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

  const visibleRecommendations = useMemo(() => {
    void dismissedVersion
    return recommendations.filter(
        (recommendation) => !isDismissed(idUsuarioSocio, recommendation.id),
      )
  }, [dismissedVersion, idUsuarioSocio, recommendations])

  function handleDismiss(recommendationId: string) {
    dismissRecommendation(idUsuarioSocio, recommendationId)
    setDismissedVersion((current) => current + 1)
  }

  function handleAction(recommendation: SocioRecomendacion) {
    if (shouldOpenNuevoTurno(recommendation) && onOpenNuevoTurno) {
      setIsOpen(false)
      onOpenNuevoTurno()
      return
    }

    if (recommendation.accionUrl) {
      setIsOpen(false)
      navigate(recommendation.accionUrl)
    }
  }

  const badgeCount = visibleRecommendations.length

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
        {badgeCount > 0 ? (
          <span className="workspace-notifications__badge" aria-label={`${badgeCount} recomendaciones nuevas`}>
            {badgeCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className="workspace-profile__menu workspace-notifications__menu workspace-notifications__menu--insights"
          role="dialog"
          aria-busy={isLoading}
          aria-label="Recomendaciones"
        >
          {isLoading ? (
            <p className="workspace-notifications__empty">Cargando recomendaciones...</p>
          ) : null}

          {!isLoading && loadError ? (
            <p className="workspace-notifications__empty">{loadError}</p>
          ) : null}

          {!isLoading && !loadError && visibleRecommendations.length === 0 ? (
            <p className="workspace-notifications__empty">No tenes recomendaciones nuevas.</p>
          ) : null}

          {!isLoading && !loadError
            ? visibleRecommendations.map((recommendation) => (
                <article
                  className={`workspace-notifications__item workspace-notifications__item--${recommendation.prioridad}`}
                  key={recommendation.id}
                >
                  <button
                    className="workspace-notifications__dismiss"
                    type="button"
                    aria-label={`Descartar ${recommendation.titulo}`}
                    onClick={() => handleDismiss(recommendation.id)}
                  >
                    <span aria-hidden="true">X</span>
                  </button>
                  <div>
                    <span className="workspace-notifications__title">{recommendation.titulo}</span>
                    <small>{recommendation.mensaje}</small>
                  </div>
                  {recommendation.accionTexto ? (
                    <div className="workspace-notifications__actions">
                      <button
                        className="workspace-notifications__action"
                        type="button"
                        onClick={() => handleAction(recommendation)}
                      >
                        {recommendation.accionTexto}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            : null}
        </div>
      ) : null}
    </div>
  )
}
