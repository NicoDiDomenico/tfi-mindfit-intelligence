import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { BackToGymLink } from '../components/BackToHomeLink'
import { FormAlertModal } from '../components/FormAlertModal'
import { useAuth } from '../hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'
import { auditoriaService } from '../services/auditoriaService'
import type {
  AuditoriaEventoDto,
  AuditoriaReporteResumenDto,
  AuditoriaSesionDto,
} from '../types/auditoria'
import { getApiErrorMessage } from '../utils/apiError'

const VER_AUDITORIA = 'VER_AUDITORIA'
const PAGE_SIZE = 25

type AuditoriaTab = 'rutinas' | 'sesiones'

interface FilterState {
  fechaDesde: string
  fechaHasta: string
  idUsuario: string
  accion: string
  resultado: string
  idRutina: string
}

interface TabConfig {
  id: AuditoriaTab
  label: string
  eyebrow: string
  description: string
}

const EMPTY_FILTERS: FilterState = {
  fechaDesde: '',
  fechaHasta: '',
  idUsuario: '',
  accion: '',
  resultado: '',
  idRutina: '',
}

const TAB_CONFIG: TabConfig[] = [
  {
    id: 'rutinas',
    label: 'Rutinas',
    eyebrow: 'Trazabilidad',
    description: 'Consulta cambios sobre rutinas, restauraciones y estados registrados.',
  },
  {
    id: 'sesiones',
    label: 'Sesiones',
    eyebrow: 'Seguridad de acceso',
    description: 'Revisa inicios, cierres y eventos de autenticacion del gimnasio.',
  },
]

const SESSION_EVENT_OPTIONS = ['LoginExitoso', 'LoginFallido', 'Logout', 'RefreshToken']
const RESULT_OPTIONS = ['Exitoso', 'Fallido']

type JsonRecord = Record<string, unknown>

interface RutinaBloqueSnapshot {
  idEjercicio?: number | null
  ejercicio?: string | null
  duracion?: number | null
  series?: number | null
  repeticiones?: number | null
  pesoAsignado?: number | null
  tiempoDescansoSegundos?: number | null
  orden?: number | null
  observaciones?: string | null
}

interface RutinaSnapshot {
  idRutina?: number | null
  idPersonaSocio?: number | null
  idDia?: number | null
  fechaModificacion?: string | null
  activo?: boolean | null
  calentamientos?: RutinaBloqueSnapshot[]
  entrenamientos?: RutinaBloqueSnapshot[]
  estiramientos?: RutinaBloqueSnapshot[]
}

interface RutinaCambiosMovimiento {
  orden?: number | null
  anterior?: number | string | null
  nuevo?: number | string | null
}

interface RutinaCambiosSeccion {
  agregados?: RutinaCambiosMovimiento[]
  eliminados?: RutinaCambiosMovimiento[]
  modificados?: RutinaCambiosMovimiento[]
}

interface RutinaCambios {
  estado?: {
    activoAnterior?: boolean | null
    activoNuevo?: boolean | null
    modificado?: boolean | null
  }
  calentamientos?: RutinaCambiosSeccion
  entrenamientos?: RutinaCambiosSeccion
  estiramientos?: RutinaCambiosSeccion
}

function formatDateTime(value: string) {
  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(parsed)
}

function parseOptionalNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function prettyJson(value: string | null) {
  if (!value) {
    return 'Sin datos'
  }

  try {
    return JSON.stringify(normalizeUnknownValue(JSON.parse(value)), null, 2)
  } catch {
    return normalizePotentialMojibake(value)
  }
}

function getTotalPages(total: number) {
  return Math.max(Math.ceil(total / PAGE_SIZE), 1)
}

function getPaginationPages(totalPages: number) {
  return Array.from({ length: totalPages }, (_, index) => index + 1)
}

function getResultBadgeClass(result: string) {
  return result.toLocaleLowerCase('es-AR') === 'fallido'
    ? 'auditoria-badge auditoria-badge--danger'
    : 'auditoria-badge auditoria-badge--success'
}

function getSessionEventBadgeClass(eventType: string) {
  return eventType.toLocaleLowerCase('es-AR').includes('fallido')
    ? 'auditoria-pill auditoria-pill--danger'
    : 'auditoria-pill'
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 3.5h8l4 4V20a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V5A1.5 1.5 0 0 1 8 3.5Z" />
      <path d="M16 3.5V8h4" />
      <path d="M9.5 11h7" />
      <path d="M9.5 14.5h7" />
      <path d="M9.5 18h5" />
      <path d="M4 6.5H3A1.5 1.5 0 0 0 1.5 8v11A1.5 1.5 0 0 0 3 20.5h10" />
    </svg>
  )
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizePotentialMojibake(value: string) {
  if (!value.includes('Ã') && !value.includes('â')) {
    return value
  }

  try {
    return decodeURIComponent(escape(value))
  } catch {
    return value
  }
}

function normalizeUnknownValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return normalizePotentialMojibake(value)
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeUnknownValue(item))
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeUnknownValue(nestedValue)]),
    )
  }

  return value
}

function parseJsonRecord(value: string | null) {
  if (!value) {
    return null
  }

  try {
    const parsed = normalizeUnknownValue(JSON.parse(value))
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

function getRutinaSnapshot(value: string | null) {
  return parseJsonRecord(value) as RutinaSnapshot | null
}

function getRutinaCambios(value: string | null) {
  return parseJsonRecord(value) as RutinaCambios | null
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === null || value === undefined) {
    return '-'
  }

  return value ? 'Activo' : 'Inactivo'
}

function formatPrimitive(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'boolean') {
    return value ? 'Si' : 'No'
  }

  if (typeof value === 'string') {
    return normalizePotentialMojibake(value)
  }

  return String(value)
}

function getBlocksBySection(
  snapshot: RutinaSnapshot | null,
  section: 'calentamientos' | 'entrenamientos' | 'estiramientos',
) {
  return Array.isArray(snapshot?.[section]) ? snapshot?.[section] ?? [] : []
}

function getExerciseName(
  snapshot: RutinaSnapshot | null,
  section: 'calentamientos' | 'entrenamientos' | 'estiramientos',
  order: number | null | undefined,
  exerciseId: number | string | null | undefined,
) {
  const numericId =
    typeof exerciseId === 'number'
      ? exerciseId
      : typeof exerciseId === 'string'
        ? Number(exerciseId)
        : undefined

  const match = getBlocksBySection(snapshot, section).find((block) => {
    const matchesOrder = order === undefined || order === null ? true : block.orden === order
    const matchesId =
      numericId === undefined || Number.isNaN(numericId) ? true : block.idEjercicio === numericId

    return matchesOrder && matchesId
  })

  return match?.ejercicio || (numericId !== undefined && !Number.isNaN(numericId) ? `Ejercicio ${numericId}` : 'Ejercicio')
}

function buildChangeLines(
  sectionLabel: string,
  sectionKey: 'calentamientos' | 'entrenamientos' | 'estiramientos',
  section: RutinaCambiosSeccion | undefined,
  originalSnapshot: RutinaSnapshot | null,
  newSnapshot: RutinaSnapshot | null,
) {
  if (!section) {
    return []
  }

  const lines: string[] = []

  ;(section.agregados ?? []).forEach((item) => {
    lines.push(
      `${sectionLabel}: se agrego ${getExerciseName(newSnapshot, sectionKey, item.orden, item.nuevo)} en orden ${formatPrimitive(item.orden)}.`,
    )
  })

  ;(section.eliminados ?? []).forEach((item) => {
    lines.push(
      `${sectionLabel}: se elimino ${getExerciseName(originalSnapshot, sectionKey, item.orden, item.anterior)} del orden ${formatPrimitive(item.orden)}.`,
    )
  })

  ;(section.modificados ?? []).forEach((item) => {
    const previousName = getExerciseName(originalSnapshot, sectionKey, item.orden, item.anterior)
    const nextName = getExerciseName(newSnapshot, sectionKey, item.orden, item.nuevo)

    lines.push(
      `${sectionLabel}: en orden ${formatPrimitive(item.orden)} cambio ${previousName} por ${nextName}.`,
    )
  })

  return lines
}

function DetailField({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="auditoria-detail-field">
      <span>{label}</span>
      <strong>{formatPrimitive(value)}</strong>
    </div>
  )
}

function RoutineBlockCard({ block }: { block: RutinaBloqueSnapshot }) {
  const metrics = [
    block.series ? `${block.series} series` : null,
    block.repeticiones ? `${block.repeticiones} repeticiones` : null,
    block.duracion ? `${block.duracion} min` : null,
    block.pesoAsignado !== null && block.pesoAsignado !== undefined ? `${block.pesoAsignado} kg` : null,
    block.tiempoDescansoSegundos ? `${block.tiempoDescansoSegundos}s descanso` : null,
  ].filter(Boolean)

  return (
    <article className="auditoria-block-card">
      <header>
        <div>
          <span>Orden {formatPrimitive(block.orden)}</span>
          <h4>{formatPrimitive(block.ejercicio || `Ejercicio ${block.idEjercicio ?? '-'}`)}</h4>
        </div>
        <em>ID {formatPrimitive(block.idEjercicio)}</em>
      </header>
      {metrics.length > 0 ? (
        <ul className="auditoria-block-card__metrics">
          {metrics.map((metric) => (
            <li key={metric}>{metric}</li>
          ))}
        </ul>
      ) : null}
      <p>{formatPrimitive(block.observaciones)}</p>
    </article>
  )
}

function RoutineSnapshotSection({
  title,
  blocks,
  emptyMessage,
}: {
  title: string
  blocks: RutinaBloqueSnapshot[]
  emptyMessage: string
}) {
  return (
    <section className="auditoria-snapshot-section">
      <header>
        <h4>{title}</h4>
        <span>{blocks.length} registro(s)</span>
      </header>
      {blocks.length > 0 ? (
        <div className="auditoria-block-list">
          {blocks.map((block, index) => (
            <RoutineBlockCard
              key={`${title}-${block.orden ?? index}-${block.idEjercicio ?? 'sin-id'}`}
              block={block}
            />
          ))}
        </div>
      ) : (
        <p className="inicio-status">{emptyMessage}</p>
      )}
    </section>
  )
}

function RoutineCompareHeaderPanel({
  kicker,
  title,
  snapshot,
}: {
  kicker: string
  title: string
  snapshot: RutinaSnapshot | null
}) {
  return (
    <article className="auditoria-compare-panel auditoria-compare-panel--summary">
      <header>
        <span className="section-kicker">{kicker}</span>
        <h4>{title}</h4>
      </header>
      <div className="auditoria-compare-panel__summary">
        <DetailField
          label="Fecha de modificacion"
          value={snapshot?.fechaModificacion ? formatDateTime(snapshot.fechaModificacion) : '-'}
        />
        <DetailField label="Estado" value={formatBoolean(snapshot?.activo)} />
      </div>
    </article>
  )
}

function RoutineCompareSectionRow({
  title,
  originalBlocks,
  newBlocks,
  originalEmptyMessage,
  newEmptyMessage,
}: {
  title: string
  originalBlocks: RutinaBloqueSnapshot[]
  newBlocks: RutinaBloqueSnapshot[]
  originalEmptyMessage: string
  newEmptyMessage: string
}) {
  return (
    <div className="auditoria-compare-row">
      <article className="auditoria-compare-panel">
        <RoutineSnapshotSection
          title={title}
          blocks={originalBlocks}
          emptyMessage={originalEmptyMessage}
        />
      </article>
      <article className="auditoria-compare-panel">
        <RoutineSnapshotSection
          title={title}
          blocks={newBlocks}
          emptyMessage={newEmptyMessage}
        />
      </article>
    </div>
  )
}

export function AuditoriaPage() {
  const { session } = useAuth()
  const userPermissions = session?.permisos ?? []
  const canViewAuditoria = userPermissions.includes(VER_AUDITORIA)
  const [activeTab, setActiveTab] = useState<AuditoriaTab>('rutinas')
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [eventos, setEventos] = useState<AuditoriaEventoDto[]>([])
  const [sesiones, setSesiones] = useState<AuditoriaSesionDto[]>([])
  const [resumen, setResumen] = useState<AuditoriaReporteResumenDto | null>(null)
  const [eventosTotal, setEventosTotal] = useState(0)
  const [sesionesTotal, setSesionesTotal] = useState(0)
  const [eventosPage, setEventosPage] = useState(1)
  const [sesionesPage, setSesionesPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEvento, setSelectedEvento] = useState<AuditoriaEventoDto | null>(null)
  const [detailError, setDetailError] = useState('')
  const [copiedJsonKey, setCopiedJsonKey] = useState<string | null>(null)

  const currentTab = TAB_CONFIG.find((tab) => tab.id === activeTab) ?? TAB_CONFIG[0]
  const currentPage = activeTab === 'rutinas' ? eventosPage : sesionesPage
  const totalPages = activeTab === 'rutinas' ? getTotalPages(eventosTotal) : getTotalPages(sesionesTotal)
  const paginationPages = useMemo(() => getPaginationPages(totalPages), [totalPages])

  const eventoActions = useMemo(
    () => Array.from(new Set(eventos.map((evento) => evento.accion))).sort(),
    [eventos],
  )

  const resumenRutinas = useMemo(() => resumen?.eventosPorAccion ?? [], [resumen?.eventosPorAccion])
  const resumenSesiones = useMemo(() => resumen?.sesionesPorTipo ?? [], [resumen?.sesionesPorTipo])

  const actionOptions = useMemo(() => {
    if (activeTab === 'rutinas') {
      return Array.from(
        new Set([...eventoActions, ...resumenRutinas.map((item) => item.clave)]),
      ).sort((first, second) => first.localeCompare(second, 'es-AR'))
    }

    return Array.from(new Set([...SESSION_EVENT_OPTIONS, ...resumenSesiones.map((item) => item.clave)]))
  }, [activeTab, eventoActions, resumenRutinas, resumenSesiones])

  const summaryCards = useMemo(
    () => [
      {
        label: 'Eventos de rutinas',
        value: resumen?.totalEventos ?? 0,
        note: 'Cambios sobre bloques, estado y restauraciones.',
      },
      {
        label: 'Eventos de sesiones',
        value: resumen?.totalSesiones ?? 0,
        note: 'Login, logout y actividad de autenticacion.',
      },
      {
        label: 'Tipos registrados',
        value:
          activeTab === 'rutinas'
            ? resumenRutinas.length
            : resumenSesiones.length,
        note:
          activeTab === 'rutinas'
            ? 'Acciones distintas detectadas en rutinas.'
            : 'Eventos distintos detectados en sesiones.',
      },
    ],
    [activeTab, resumen, resumenRutinas.length, resumenSesiones.length],
  )

  function setCurrentPage(page: number) {
    const boundedPage = Math.min(Math.max(page, 1), totalPages)

    if (activeTab === 'rutinas') {
      setEventosPage(boundedPage)
      return
    }

    setSesionesPage(boundedPage)
  }

  const spotlightItems = activeTab === 'rutinas' ? resumenRutinas : resumenSesiones

  const loadData = useCallback(async () => {
    if (!canViewAuditoria) {
      return
    }

    setIsLoading(true)
    setError('')

    const idUsuario = parseOptionalNumber(filters.idUsuario)
    const idRutina = parseOptionalNumber(filters.idRutina)

    try {
      const [eventosResponse, sesionesResponse, resumenResponse] = await Promise.all([
        auditoriaService.getEventos({
          fechaDesde: filters.fechaDesde || undefined,
          fechaHasta: filters.fechaHasta || undefined,
          idUsuario,
          entidad: 'Rutina',
          idEntidad: idRutina,
          accion: filters.accion || undefined,
          resultado: filters.resultado || undefined,
          pagina: eventosPage,
          tamanoPagina: PAGE_SIZE,
        }),
        auditoriaService.getSesiones({
          fechaDesde: filters.fechaDesde || undefined,
          fechaHasta: filters.fechaHasta || undefined,
          idUsuario,
          tipoEvento: filters.accion || undefined,
          resultado: filters.resultado || undefined,
          pagina: sesionesPage,
          tamanoPagina: PAGE_SIZE,
        }),
        auditoriaService.getResumen(
          filters.fechaDesde || undefined,
          filters.fechaHasta || undefined,
        ),
      ])

      setEventos(eventosResponse.items)
      setEventosTotal(eventosResponse.total)
      setSesiones(sesionesResponse.items)
      setSesionesTotal(sesionesResponse.total)
      setResumen(resumenResponse)
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'No pudimos cargar los reportes de auditoria. Intenta nuevamente.',
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [canViewAuditoria, eventosPage, filters, sesionesPage])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadData])

  if (!canViewAuditoria) {
    return <Navigate to="/gimnasio" replace />
  }

  function updateFilter(field: keyof FilterState, value: string) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))
    setEventosPage(1)
    setSesionesPage(1)
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
    setEventosPage(1)
    setSesionesPage(1)
  }

  async function openEventoDetail(idAuditoriaEvento: number) {
    setDetailError('')

    try {
      const detail = await auditoriaService.getEventoDetalle(idAuditoriaEvento)
      setSelectedEvento(detail)
    } catch (requestError) {
      setDetailError(
        getApiErrorMessage(requestError, 'No pudimos abrir el detalle del evento.'),
      )
    }
  }

  async function copyJson(
    summaryKey: string,
    value: string | null,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault()
    event.stopPropagation()

    try {
      await navigator.clipboard.writeText(prettyJson(value))
      setCopiedJsonKey(summaryKey)
      window.setTimeout(() => {
        setCopiedJsonKey((current) => (current === summaryKey ? null : current))
      }, 1400)
    } catch {
      setDetailError('No pudimos copiar el JSON al portapapeles.')
    }
  }

  return (
    <AppLayout>
      <main className="auditoria-page">
        <section className="auditoria-intro">
          <div>
            <span className="inicio-eyebrow">Gestionar gimnasio / Auditoria</span>
            <h1 className="dashboard-title">Auditoría</h1>
            <p className="dashboard-copy">
              Supervisa trazabilidad de las rutinas y las actividades de acceso de los usuarios.
            </p>
          </div>
          <BackToGymLink />
        </section>

        <section className="auditoria-summary" aria-label="Resumen de auditoria">
          {summaryCards.map((card) => (
            <article key={card.label} className="auditoria-summary-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small>{card.note}</small>
            </article>
          ))}
        </section>

        <section className="auditoria-workspace">
          <aside className="auditoria-sidebar">
            <section className="auditoria-panel auditoria-panel--filters">
              <header className="auditoria-panel__header">
                <div>
                  <span className="section-kicker">Filtros</span>
                  <h2>Opciones de filtrado</h2>
                </div>
                <button className="ghost-button auditoria-ghost-action" type="button" onClick={clearFilters}>
                  Limpiar
                </button>
              </header>

              <div className="auditoria-filters">
                <label className="field-group">
                  <span className="field-label">Desde</span>
                  <input
                    className="field-input"
                    type="datetime-local"
                    value={filters.fechaDesde}
                    onChange={(event) => updateFilter('fechaDesde', event.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Hasta</span>
                  <input
                    className="field-input"
                    type="datetime-local"
                    value={filters.fechaHasta}
                    onChange={(event) => updateFilter('fechaHasta', event.target.value)}
                  />
                </label>
                <label className="field-group">
                  <span className="field-label">Id usuario</span>
                  <input
                    className="field-input"
                    inputMode="numeric"
                    placeholder="Todos"
                    value={filters.idUsuario}
                    onChange={(event) => updateFilter('idUsuario', event.target.value)}
                  />
                </label>
                {activeTab === 'rutinas' ? (
                  <label className="field-group">
                    <span className="field-label">Id rutina</span>
                    <input
                      className="field-input"
                      inputMode="numeric"
                      placeholder="Todas"
                      value={filters.idRutina}
                      onChange={(event) => updateFilter('idRutina', event.target.value)}
                    />
                  </label>
                ) : null}
                <label className="field-group">
                  <span className="field-label">{activeTab === 'rutinas' ? 'Accion' : 'Evento'}</span>
                  <select
                    className="field-input"
                    value={filters.accion}
                    onChange={(event) => updateFilter('accion', event.target.value)}
                  >
                    <option value="">Todos</option>
                    {actionOptions.map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-group">
                  <span className="field-label">Resultado</span>
                  <select
                    className="field-input"
                    value={filters.resultado}
                    onChange={(event) => updateFilter('resultado', event.target.value)}
                  >
                    <option value="">Todos</option>
                    {RESULT_OPTIONS.map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="auditoria-panel auditoria-panel--spotlight">
              <header className="auditoria-panel__header">
                <div>
                  <span className="section-kicker">{currentTab.eyebrow}</span>
                  <h2>{currentTab.label}</h2>
                </div>
              </header>

              <p className="auditoria-panel__copy">{currentTab.description}</p>

              <div className="auditoria-spotlight-list">
                {spotlightItems.length > 0 ? (
                  spotlightItems.slice(0, 5).map((item) => (
                    <article className="auditoria-spotlight-item" key={item.clave}>
                      <div>
                        <strong>{item.clave}</strong>
                        <span>Eventos registrados</span>
                      </div>
                      <em>{item.total}</em>
                    </article>
                  ))
                ) : (
                  <p className="inicio-status">Todavia no hay datos agrupados para este rango.</p>
                )}
              </div>
            </section>
          </aside>

          <section className="auditoria-panel auditoria-panel--results">
            <header className="auditoria-panel__header auditoria-panel__header--results">
              <div>
                <span className="section-kicker">{currentTab.eyebrow}</span>
                <h2>{activeTab === 'rutinas' ? 'Eventos de rutinas' : 'Eventos de sesiones'}</h2>
                <p className="auditoria-panel__copy">
                  {activeTab === 'rutinas'
                    ? 'Cada fila refleja una accion sobre rutinas auditadas y permite abrir su detalle completo.'
                    : 'Cada fila resume un evento de acceso con su resultado, origen y motivo asociado.'}
                </p>
              </div>
              <div className="auditoria-tabs" role="tablist" aria-label="Reportes de auditoria">
                {TAB_CONFIG.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={activeTab === tab.id ? 'is-active' : ''}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </header>

            {isLoading ? <p className="inicio-status">Cargando auditoria...</p> : null}
            {error ? <p className="inicio-status inicio-status--error">{error}</p> : null}
            {detailError ? <FormAlertModal type="error" message={detailError} /> : null}

            {!isLoading && !error && activeTab === 'rutinas' ? (
              <div className="auditoria-table-wrap">
                <table className="auditoria-table">
                  <thead>
                    <tr>
                      <th>Fecha y Hora</th>
                      <th>Usuario</th>
                      <th>Rutina</th>
                      <th>Accion</th>
                      <th>Resultado</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventos.map((evento) => (
                      <tr key={evento.idAuditoriaEvento}>
                        <td data-label="Fecha">{formatDateTime(evento.fechaHoraUtc)}</td>
                        <td data-label="Usuario">{evento.username ?? evento.idUsuario ?? '-'}</td>
                        <td data-label="Rutina">
                          <span className="auditoria-id-chip">#{evento.idEntidad ?? '-'}</span>
                        </td>
                        <td data-label="Accion">
                          <span className="auditoria-pill">{evento.accion}</span>
                        </td>
                        <td data-label="Resultado">
                          <span className={getResultBadgeClass(evento.resultado)}>{evento.resultado}</span>
                        </td>
                        <td data-label="Detalle">
                          <button
                            className="ghost-button auditoria-detail-button"
                            type="button"
                            onClick={() => void openEventoDetail(evento.idAuditoriaEvento)}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {eventos.length === 0 ? (
                  <p className="inicio-status">No hay eventos de rutina para mostrar.</p>
                ) : null}
              </div>
            ) : null}

            {!isLoading && !error && activeTab === 'sesiones' ? (
              <div className="auditoria-table-wrap">
                <table className="auditoria-table auditoria-table--sesiones">
                  <thead>
                    <tr>
                      <th>Fecha y Hora</th>
                      <th>Usuario</th>
                      <th>Evento</th>
                      <th>Resultado</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sesiones.map((sesion) => (
                      <tr key={sesion.idAuditoriaSesion}>
                        <td data-label="Fecha">{formatDateTime(sesion.fechaHoraUtc)}</td>
                        <td data-label="Usuario">{sesion.usernameIntentado ?? sesion.idUsuario ?? '-'}</td>
                        <td data-label="Evento">
                          <span className={getSessionEventBadgeClass(sesion.tipoEvento)}>
                            {sesion.tipoEvento}
                          </span>
                        </td>
                        <td data-label="Resultado">
                          <span className={getResultBadgeClass(sesion.resultado)}>{sesion.resultado}</span>
                        </td>
                        <td data-label="Motivo">{sesion.motivoFallo ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sesiones.length === 0 ? (
                  <p className="inicio-status">No hay eventos de sesion para mostrar.</p>
                ) : null}
              </div>
            ) : null}

            <div className="auditoria-pagination">
              <nav className="auditoria-pagination__control" aria-label="Paginacion de auditoria">
                <button
                  className="auditoria-pagination__arrow"
                  type="button"
                  aria-label="Pagina anterior"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <span aria-hidden="true">{'<'}</span>
                </button>
                <div className="auditoria-pagination__pages">
                  {paginationPages.map((page) => (
                    <button
                      key={page}
                      className={
                        page === currentPage
                          ? 'auditoria-pagination__page auditoria-pagination__page--active'
                          : 'auditoria-pagination__page'
                      }
                      type="button"
                      aria-current={page === currentPage ? 'page' : undefined}
                      aria-label={`Pagina ${page}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  className="auditoria-pagination__arrow"
                  type="button"
                  aria-label="Pagina siguiente"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <span aria-hidden="true">{'>'}</span>
                </button>
              </nav>
            </div>
          </section>
        </section>

        {selectedEvento ? (
          <div className="rutinas-modal-backdrop" role="presentation">
            <section className="auditoria-detail-modal" role="dialog" aria-modal="true">
              <header className="auditoria-detail-modal__header">
                <div>
                  <span className="section-kicker">Evento {selectedEvento.idAuditoriaEvento}</span>
                  <h2>{selectedEvento.accion}</h2>
                </div>
                <button
                  className="rutinas-ia-modal__close"
                  type="button"
                  onClick={() => setSelectedEvento(null)}
                  aria-label="Cerrar detalle"
                >
                  x
                </button>
              </header>
              {(() => {
                const originalSnapshot = getRutinaSnapshot(selectedEvento.valoresOriginalesJson)
                const newSnapshot = getRutinaSnapshot(selectedEvento.valoresNuevosJson)
                const cambios = getRutinaCambios(selectedEvento.cambiosJson)
                const changeLines = [
                  ...(cambios?.estado?.modificado
                    ? [
                        `Estado general: cambio de ${formatBoolean(cambios.estado.activoAnterior)} a ${formatBoolean(cambios.estado.activoNuevo)}.`,
                      ]
                    : ['Estado general: sin cambio de estado.']),
                  ...buildChangeLines('Calentamientos', 'calentamientos', cambios?.calentamientos, originalSnapshot, newSnapshot),
                  ...buildChangeLines('Entrenamientos', 'entrenamientos', cambios?.entrenamientos, originalSnapshot, newSnapshot),
                  ...buildChangeLines('Estiramientos', 'estiramientos', cambios?.estiramientos, originalSnapshot, newSnapshot),
                ]

                return (
                  <div className="auditoria-detail-modal__body">
                    <section className="auditoria-detail-section">
                      <header className="auditoria-detail-section__header">
                        <div>
                          <span className="section-kicker">Resumen del evento</span>
                          <h3>Contexto de la modificacion</h3>
                        </div>
                      </header>
                      <div className="auditoria-detail-meta-grid">
                        <DetailField label="Fecha y hora" value={formatDateTime(selectedEvento.fechaHoraUtc)} />
                        <DetailField label="Usuario" value={selectedEvento.username ?? 'Usuario no disponible'} />
                        <DetailField label="Accion" value={selectedEvento.accion} />
                        <DetailField label="Resultado" value={selectedEvento.resultado} />
                        <DetailField label="Metodo" value={selectedEvento.metodoHttp ?? '-'} />
                        <DetailField label="Endpoint" value={selectedEvento.endpoint ?? '-'} />
                        <DetailField label="Rutina" value={newSnapshot?.idRutina ?? originalSnapshot?.idRutina ?? selectedEvento.idEntidad} />
                        <DetailField label="Socio" value={newSnapshot?.idPersonaSocio ?? originalSnapshot?.idPersonaSocio} />
                        <DetailField label="Dia" value={newSnapshot?.idDia ?? originalSnapshot?.idDia} />
                      </div>
                      {selectedEvento.mensaje ? (
                        <p className="auditoria-detail-note">{normalizePotentialMojibake(selectedEvento.mensaje)}</p>
                      ) : null}
                    </section>

                    <section className="auditoria-detail-section">
                      <header className="auditoria-detail-section__header">
                        <div>
                          <span className="section-kicker">Antes y despues</span>
                          <h3>Comparacion de la rutina</h3>
                        </div>
                      </header>
                      <div className="auditoria-compare-layout">
                        <div className="auditoria-compare-row auditoria-compare-row--summary">
                          <RoutineCompareHeaderPanel
                            kicker="Valores originales"
                            title="Estado previo"
                            snapshot={originalSnapshot}
                          />
                          <RoutineCompareHeaderPanel
                            kicker="Valores nuevos"
                            title="Estado posterior"
                            snapshot={newSnapshot}
                          />
                        </div>

                        <RoutineCompareSectionRow
                          title="Calentamientos"
                          originalBlocks={getBlocksBySection(originalSnapshot, 'calentamientos')}
                          newBlocks={getBlocksBySection(newSnapshot, 'calentamientos')}
                          originalEmptyMessage="No habia calentamientos registrados."
                          newEmptyMessage="No hay calentamientos en la version nueva."
                        />

                        <RoutineCompareSectionRow
                          title="Entrenamientos"
                          originalBlocks={getBlocksBySection(originalSnapshot, 'entrenamientos')}
                          newBlocks={getBlocksBySection(newSnapshot, 'entrenamientos')}
                          originalEmptyMessage="No habia entrenamientos registrados."
                          newEmptyMessage="No hay entrenamientos en la version nueva."
                        />

                        <RoutineCompareSectionRow
                          title="Estiramientos"
                          originalBlocks={getBlocksBySection(originalSnapshot, 'estiramientos')}
                          newBlocks={getBlocksBySection(newSnapshot, 'estiramientos')}
                          originalEmptyMessage="No habia estiramientos registrados."
                          newEmptyMessage="No hay estiramientos en la version nueva."
                        />
                      </div>
                    </section>

                    <section className="auditoria-detail-section">
                      <header className="auditoria-detail-section__header">
                        <div>
                          <span className="section-kicker">Cambios detectados</span>
                          <h3>Resumen</h3>
                        </div>
                      </header>
                      <div className="auditoria-change-list">
                        {changeLines.map((line, index) => (
                          <article className="auditoria-change-item" key={`${line}-${index}`}>
                            <span>{index + 1}</span>
                            <p>{line}</p>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="auditoria-detail-section">
                      <header className="auditoria-detail-section__header">
                        <div>
                          <span className="section-kicker">Soporte tecnico</span>
                          <h3>JSON original</h3>
                        </div>
                      </header>
                      <div className="auditoria-raw-json">
                        <details>
                          <summary>
                            <span>Ver JSON de valores originales</span>
                            <span className="auditoria-raw-json__actions">
                              <button
                                type="button"
                                className="auditoria-copy-button"
                                onClick={(event) =>
                                  void copyJson('original', selectedEvento.valoresOriginalesJson, event)
                                }
                                aria-label="Copiar JSON de valores originales"
                                title="Copiar JSON"
                              >
                                <CopyIcon />
                              </button>
                              {copiedJsonKey === 'original' ? (
                                <small className="auditoria-copy-feedback">Copiado</small>
                              ) : null}
                            </span>
                          </summary>
                          <pre>{prettyJson(selectedEvento.valoresOriginalesJson)}</pre>
                        </details>
                        <details>
                          <summary>
                            <span>Ver JSON de valores nuevos</span>
                            <span className="auditoria-raw-json__actions">
                              <button
                                type="button"
                                className="auditoria-copy-button"
                                onClick={(event) =>
                                  void copyJson('nuevo', selectedEvento.valoresNuevosJson, event)
                                }
                                aria-label="Copiar JSON de valores nuevos"
                                title="Copiar JSON"
                              >
                                <CopyIcon />
                              </button>
                              {copiedJsonKey === 'nuevo' ? (
                                <small className="auditoria-copy-feedback">Copiado</small>
                              ) : null}
                            </span>
                          </summary>
                          <pre>{prettyJson(selectedEvento.valoresNuevosJson)}</pre>
                        </details>
                        <details>
                          <summary>
                            <span>Ver JSON de cambios detectados</span>
                            <span className="auditoria-raw-json__actions">
                              <button
                                type="button"
                                className="auditoria-copy-button"
                                onClick={(event) =>
                                  void copyJson('cambios', selectedEvento.cambiosJson, event)
                                }
                                aria-label="Copiar JSON de cambios detectados"
                                title="Copiar JSON"
                              >
                                <CopyIcon />
                              </button>
                              {copiedJsonKey === 'cambios' ? (
                                <small className="auditoria-copy-feedback">Copiado</small>
                              ) : null}
                            </span>
                          </summary>
                          <pre>{prettyJson(selectedEvento.cambiosJson)}</pre>
                        </details>
                      </div>
                    </section>
                  </div>
                )
              })()}
            </section>
          </div>
        ) : null}
      </main>
    </AppLayout>
  )
}
