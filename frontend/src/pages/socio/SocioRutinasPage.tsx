import axios from 'axios'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AppLayout } from '../../layouts/AppLayout'
import { rutinasService } from '../../services/rutinasService'
import type {
  CalentamientoDto,
  DiaDto,
  EntrenamientoDto,
  EstiramientoDto,
  RutinaDto,
} from '../../types/rutina'
import { getApiErrorMessage } from '../../utils/apiError'

type RutinaBlockType = 'calentamientos' | 'entrenamientos' | 'estiramientos'

const BLOCK_LABELS: Record<RutinaBlockType, string> = {
  calentamientos: 'Calentamiento',
  entrenamientos: 'Entrenamiento',
  estiramientos: 'Estiramiento',
}

function normalizeDayName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getCurrentDia(dias: DiaDto[], now = new Date()) {
  const dayNames = [
    'domingo',
    'lunes',
    'martes',
    'miercoles',
    'jueves',
    'viernes',
    'sabado',
  ]
  const currentDayName = dayNames[now.getDay()]

  return (
    dias.find((dia) => normalizeDayName(dia.nombreDia) === currentDayName) ??
    dias[0] ??
    null
  )
}

function formatDateTime(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

function getRutinaNotFoundMessage(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    const message = error.response.data

    if (typeof message === 'string' && message.trim()) {
      return message
    }

    return 'No tenes una rutina asignada para este dia.'
  }

  return null
}

export function SocioRutinasPage() {
  const { session } = useAuth()
  const idUsuarioSocio = session?.datosPersonales?.id ?? null
  const nombreSocio = useMemo(() => {
    const nombre = session?.datosPersonales?.nombre ?? ''
    const apellido = session?.datosPersonales?.apellido ?? ''
    return `${nombre} ${apellido}`.trim()
  }, [session])

  const [dias, setDias] = useState<DiaDto[]>([])
  const [selectedDiaId, setSelectedDiaId] = useState<number | null>(null)
  const [rutina, setRutina] = useState<RutinaDto | null>(null)
  const [isLoadingDias, setIsLoadingDias] = useState(true)
  const [isLoadingRutina, setIsLoadingRutina] = useState(false)
  const [diasError, setDiasError] = useState('')
  const [rutinaError, setRutinaError] = useState('')
  const [noRutinaMessage, setNoRutinaMessage] = useState('')

  const selectedDia = useMemo(
    () => dias.find((dia) => dia.idDia === selectedDiaId) ?? null,
    [dias, selectedDiaId],
  )

  const loadDias = useCallback(async () => {
    setIsLoadingDias(true)
    setDiasError('')

    try {
      const response = await rutinasService.getDias()
      setDias(response)
      setSelectedDiaId((currentSelectedDiaId) => {
        if (currentSelectedDiaId && response.some((dia) => dia.idDia === currentSelectedDiaId)) {
          return currentSelectedDiaId
        }

        return getCurrentDia(response)?.idDia ?? null
      })
    } catch (error) {
      setDiasError(getApiErrorMessage(error, 'No pudimos cargar los dias disponibles.'))
    } finally {
      setIsLoadingDias(false)
    }
  }, [])

  const loadRutina = useCallback(async () => {
    if (idUsuarioSocio === null || selectedDiaId === null) {
      setRutina(null)
      setNoRutinaMessage('')
      return
    }

    setIsLoadingRutina(true)
    setRutinaError('')
    setNoRutinaMessage('')

    try {
      const response = await rutinasService.getRutinaPorSocioYDia(
        idUsuarioSocio,
        selectedDiaId,
      )

      setRutina(response)
    } catch (error) {
      const notFoundMessage = getRutinaNotFoundMessage(error)

      setRutina(null)

      if (notFoundMessage) {
        setNoRutinaMessage(notFoundMessage)
      } else {
        setRutinaError(getApiErrorMessage(error, 'No pudimos cargar tu rutina.'))
      }
    } finally {
      setIsLoadingRutina(false)
    }
  }, [idUsuarioSocio, selectedDiaId])

  useEffect(() => {
    void Promise.resolve().then(loadDias)
  }, [loadDias])

  useEffect(() => {
    void Promise.resolve().then(loadRutina)
  }, [loadRutina])

  return (
    <AppLayout>
      <main className="socio-rutinas-page">
        <section className="socio-rutinas-hero">
          <div>
            <span className="section-kicker">Portal Socio</span>
            <h1 className="dashboard-title">Mis rutinas</h1>
            <p className="dashboard-copy">
              Consultar las rutinas que los entrenadores te armaron.
            </p>
          </div>
          <Link className="back-link" to="/socio/inicio">
            <span className="back-link__arrow" aria-hidden="true">
              ←
            </span>
            Volver al inicio
          </Link>
        </section>

        <section className="socio-rutinas-panel">
          <header className="socio-rutinas-panel__header">
            <div>
              <span className="section-kicker">Dia</span>
              <h2>{selectedDia?.nombreDia ?? 'Rutina del dia'}</h2>
              <p>
                {nombreSocio
                  ? `${nombreSocio}, aca podes revisar tus rutinas para el dia elegido.`
                  : 'Aca podes revisar tus rutinas para el dia elegido.'}
              </p>
            </div>
            {rutina ? (
              <span className="socio-rutinas-date">
                Ultima modificacion: {formatDateTime(rutina.fechaModificacion)}
              </span>
            ) : null}
          </header>

          <div className="socio-rutinas-tabs" aria-busy={isLoadingDias}>
            {isLoadingDias ? <p className="socio-rutinas-muted">Cargando dias...</p> : null}
            {!isLoadingDias && diasError ? (
              <div className="socio-rutinas-alert" role="alert">
                <span>{diasError}</span>
                <button type="button" onClick={loadDias}>
                  Reintentar
                </button>
              </div>
            ) : null}
            {!isLoadingDias && !diasError && dias.length === 0 ? (
              <p className="socio-rutinas-muted">No hay dias disponibles para rutinas.</p>
            ) : null}
            {!isLoadingDias && !diasError
              ? dias.map((dia) => (
                  <button
                    className={selectedDiaId === dia.idDia ? 'is-active' : ''}
                    key={dia.idDia}
                    type="button"
                    onClick={() => setSelectedDiaId(dia.idDia)}
                  >
                    {dia.nombreDia}
                  </button>
                ))
              : null}
          </div>

          <div className="socio-rutinas-body">
            {idUsuarioSocio === null ? (
              <div className="socio-rutinas-state socio-rutinas-state--error" role="alert">
                No pudimos identificar tu usuario para cargar rutinas.
              </div>
            ) : null}

            {isLoadingRutina ? (
              <div className="socio-rutinas-state">Cargando rutina del dia...</div>
            ) : null}

            {!isLoadingRutina && rutinaError ? (
              <div className="socio-rutinas-state socio-rutinas-state--error" role="alert">
                <p>{rutinaError}</p>
                <button type="button" onClick={loadRutina}>
                  Reintentar
                </button>
              </div>
            ) : null}

            {!isLoadingRutina && noRutinaMessage ? (
              <div className="socio-rutinas-state socio-rutinas-state--empty">
                {noRutinaMessage}
              </div>
            ) : null}

            {!isLoadingRutina && !rutinaError && !noRutinaMessage && rutina ? (
              <div className="socio-rutinas-blocks">
                {(['calentamientos', 'entrenamientos', 'estiramientos'] as RutinaBlockType[]).map(
                  (blockType) => (
                    <SocioRutinaBlock
                      blockType={blockType}
                      key={blockType}
                      rutina={rutina}
                    />
                  ),
                )}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </AppLayout>
  )
}

interface SocioRutinaBlockProps {
  blockType: RutinaBlockType
  rutina: RutinaDto
}

function SocioRutinaBlock({ blockType, rutina }: SocioRutinaBlockProps) {
  const label = BLOCK_LABELS[blockType]
  const rows = [...rutina[blockType]].sort((first, second) => first.orden - second.orden)

  return (
    <section className="socio-rutinas-block">
      <header className="socio-rutinas-block__header">
        <div>
          <span className="section-kicker">{label}</span>
          <h3>{label}</h3>
        </div>
        <span>{rows.length}</span>
      </header>

      {rows.length === 0 ? (
        <div className="socio-rutinas-block__empty">
          No hay {label.toLowerCase()} cargado.
        </div>
      ) : (
        <div className="socio-rutinas-list">
          {rows.map((row) => (
            <SocioRutinaRow blockType={blockType} key={`${blockType}-${row.orden}`} row={row} />
          ))}
        </div>
      )}
    </section>
  )
}

interface SocioRutinaRowProps {
  blockType: RutinaBlockType
  row: CalentamientoDto | EntrenamientoDto | EstiramientoDto
}

function SocioRutinaRow({ blockType, row }: SocioRutinaRowProps) {
  return (
    <article className="socio-rutinas-exercise">
      <div className="socio-rutinas-exercise__order">{row.orden}</div>
      <div className="socio-rutinas-exercise__content">
        <div className="socio-rutinas-exercise__summary">
          <div className="socio-rutinas-exercise__main">
            <span>{row.ejercicio.grupoMuscular.nombreMusculo}</span>
            <strong>{row.ejercicio.descEjercicio}</strong>
          </div>

          <div className="socio-rutinas-values">
            {blockType !== 'entrenamientos' ? (
              <ReadOnlyField
                label="Duracion"
                suffix="seg."
                value={String((row as CalentamientoDto | EstiramientoDto).duracion)}
              />
            ) : null}

            {blockType === 'entrenamientos' ? (
              <>
                <ReadOnlyField label="Series" value={String((row as EntrenamientoDto).series)} />
                <ReadOnlyField
                  label="Repeticiones"
                  value={String((row as EntrenamientoDto).repeticiones)}
                />
                <ReadOnlyField
                  label="Peso"
                  suffix="kg."
                  value={(row as EntrenamientoDto).pesoAsignado?.toFixed(2) ?? '-'}
                />
                <ReadOnlyField
                  label="Descanso"
                  suffix="seg."
                  value={
                    (row as EntrenamientoDto).tiempoDescansoSegundos === null
                      ? '-'
                      : String((row as EntrenamientoDto).tiempoDescansoSegundos)
                  }
                />
              </>
            ) : null}
          </div>
        </div>

        {row.observaciones ? (
          <p className="socio-rutinas-observations">{row.observaciones}</p>
        ) : null}
      </div>
    </article>
  )
}

interface ReadOnlyFieldProps {
  label: string
  value: string
  suffix?: string
}

function ReadOnlyField({ label, value, suffix }: ReadOnlyFieldProps) {
  return (
    <div className="socio-rutinas-value">
      <span>{label}</span>
      <strong>{suffix ? `${value} ${suffix}` : value}</strong>
    </div>
  )
}
