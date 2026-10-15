import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { BackToHomeLink } from '../components/BackToHomeLink'
import { ConsultarSocioModal } from '../components/socios/ConsultarSocioModal'
import { EliminarSocioModal } from '../components/socios/EliminarSocioModal'
import { GestionTurnosModal } from '../components/socios/GestionTurnosModal'
import { useAuth } from '../hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'
import { AgregarSocioModal } from './AgregarSocioPage'
import { sociosService } from '../services/sociosService'
import type { SocioGridItem, UsuarioDto } from '../types/socio'
import { formatDateCell, normalizeDateForSearch } from '../utils/date'
import { getSociosErrorMessage } from '../utils/apiError'

const SEARCH_OPTIONS = [
  { value: 'nombreCompleto', label: 'Socio' },
  { value: 'estadoSocio', label: 'Estado' },
  { value: 'fechaFinPeriodo', label: 'Fecha vencimiento cuota' },
] as const

const CONSULTAR_PERMISSIONS = [
  'EDITAR_USUARIO_SOCIO',
  'CAMBIAR_CONTRASENA_SOCIO',
  'ELIMINAR_USUARIO_SOCIO_DEFINITIVAMENTE',
] as const

const TURNOS_PERMISSIONS = ['AGREGAR_TURNO', 'CANCELAR_TURNO'] as const

const ACTION_PERMISSIONS = {
  agregar: 'CREAR_USUARIO_SOCIO',
  eliminar: 'ELIMINAR_USUARIO_SOCIO',
} as const

type SearchField = (typeof SEARCH_OPTIONS)[number]['value']

function matchesPermission(userPermissions: readonly string[], requiredPermissions: readonly string[]) {
  return requiredPermissions.some((permission) => userPermissions.includes(permission))
}

function getSearchableValue(socio: SocioGridItem, searchField: SearchField) {
  if (searchField === 'fechaFinPeriodo') {
    return normalizeDateForSearch(socio.fechaFinPeriodo)
  }

  return String(socio[searchField] ?? '')
    .trim()
    .toLocaleLowerCase('es-AR')
}

function getSocioDisplayName(socio: SocioGridItem) {
  return socio.nombreCompleto?.trim() || socio.username
}

function getEstadoSocioClass(estadoSocio: string) {
  const normalizedEstado = estadoSocio
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-AR')
    .trim()

  if (normalizedEstado === 'nuevo') {
    return 'socios-status--nuevo'
  }

  if (normalizedEstado === 'actualizado') {
    return 'socios-status--actualizado'
  }

  if (normalizedEstado === 'suspendido') {
    return 'socios-status--suspendido'
  }

  if (normalizedEstado === 'eliminado') {
    return 'socios-status--eliminado'
  }

  return 'socios-status--default'
}

export function SociosPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { idUsuario } = useParams()
  const { session } = useAuth()
  const userPermissions = session?.permisos ?? []
  const [socios, setSocios] = useState<SocioGridItem[]>([])
  const [selectedSocioId, setSelectedSocioId] = useState<number | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [searchField, setSearchField] = useState<SearchField>('nombreCompleto')
  const [searchValue, setSearchValue] = useState('')
  const [isSearchAutofillGuardEnabled, setIsSearchAutofillGuardEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteTargetSocio, setDeleteTargetSocio] = useState<SocioGridItem | null>(null)

  const canAgregar = userPermissions.includes(ACTION_PERMISSIONS.agregar)
  const canConsultar = matchesPermission(userPermissions, CONSULTAR_PERMISSIONS)
  const canEliminar = userPermissions.includes(ACTION_PERMISSIONS.eliminar)
  const canTurnos = matchesPermission(userPermissions, TURNOS_PERMISSIONS)
  const isAgregarRoute = location.pathname === '/socios/agregar'
  const isConsultarRoute = location.pathname.endsWith('/consultar')
  const consultarSocioId = idUsuario ? Number(idUsuario) : null
  const routeSocioId =
    consultarSocioId && !Number.isNaN(consultarSocioId) ? consultarSocioId : null
  const isTurnosRoute = location.pathname.endsWith('/turnos')
  const effectiveSelectedSocioId = routeSocioId ?? selectedSocioId

  const loadSocios = useCallback(
    async (options?: { keepLoading?: boolean }) => {
      if (options?.keepLoading !== false) {
        setIsLoading(true)
      }
      setError('')

      try {
        await sociosService.actualizarCuotasVencidas()
        await sociosService.procesarEliminacionesPendientes()
        const response = await sociosService.getSociosGrid()
        setSocios(response)
      } catch (requestError) {
        setError(getSociosErrorMessage(requestError))
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    let isActive = true

    async function loadInitialSocios() {
      if (isActive) {
        await loadSocios()
      }
    }

    void loadInitialSocios()

    return () => {
      isActive = false
    }
  }, [loadSocios])

  const searchPlaceholder = useMemo(() => {
    const selectedOption = SEARCH_OPTIONS.find((option) => option.value === searchField)
    const selectedLabel = selectedOption?.label.toLocaleLowerCase('es-AR') ?? ''

    return `Filtrar por ${selectedLabel}`
  }, [searchField])

  const visibleSocios = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLocaleLowerCase('es-AR')

    return socios
      .filter((socio) => showDeleted || socio.estadoSocio !== 'Eliminado')
      .filter((socio) => {
        if (!normalizedSearch) {
          return true
        }

        return getSearchableValue(socio, searchField).includes(normalizedSearch)
      })
  }, [searchField, searchValue, showDeleted, socios])

  const selectedSocio = useMemo(
    () => visibleSocios.find((socio) => socio.idUsuario === effectiveSelectedSocioId) ?? null,
    [effectiveSelectedSocioId, visibleSocios],
  )
  const routeSocio = useMemo(
    () => socios.find((socio) => socio.idUsuario === routeSocioId) ?? null,
    [routeSocioId, socios],
  )

  function goToSelected(pathBuilder: (idUsuario: number) => string) {
    if (!selectedSocio) {
      return
    }

    navigate(pathBuilder(selectedSocio.idUsuario))
  }

  function handleSocioDeleted(updatedSocio: UsuarioDto) {
    const nextEstado = updatedSocio.personaSocio?.estadoSocio ?? 'Eliminado'

    setSocios((currentSocios) =>
      currentSocios.map((socio) =>
        socio.idUsuario === updatedSocio.idUsuario
          ? {
              ...socio,
              estadoSocio: nextEstado,
            }
          : socio,
      ),
    )
  }

  function closeDeleteModal() {
    setIsDeleteModalOpen(false)
    setDeleteTargetSocio(null)
  }

  return (
    <AppLayout>
      <main className="socios-page">
        <section className="socios-intro">
          <div>
            <span className="section-kicker">Gestionar Socios</span>
            <h1 className="dashboard-title">Socios</h1>
            <p className="dashboard-copy">
              Consulta el estado de cada socio, filtra la grilla y entra a las acciones que
              tienes habilitadas.
            </p>
          </div>
          <BackToHomeLink />
        </section>

        <section className="socios-workspace" aria-labelledby="socios-grid-title">
          <div className="socios-toolbar">
            <div>
              <span className="section-kicker">Listado</span>
              <h2 id="socios-grid-title">Lista de socios</h2>
            </div>

            <div className="socios-filters" aria-label="Filtros de bÃºsqueda">
              <input
                type="text"
                name="socios-filter-decoy-user"
                autoComplete="username"
                tabIndex={-1}
                aria-hidden="true"
                className="autofill-decoy"
              />
              <input
                type="password"
                name="socios-filter-decoy-password"
                autoComplete="current-password"
                tabIndex={-1}
                aria-hidden="true"
                className="autofill-decoy"
              />
              <label className="field-group socios-filter-field">
                <select
                  className="field-input"
                  value={searchField}
                  onChange={(event) => setSearchField(event.target.value as SearchField)}
                >
                  {SEARCH_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-group socios-filter-field socios-filter-field--search">
                <input
                  className="field-input"
                  type="text"
                  name="socios-filter-query"
                  autoComplete="one-time-code"
                  readOnly={isSearchAutofillGuardEnabled}
                  value={searchValue}
                  onMouseDown={() => setIsSearchAutofillGuardEnabled(false)}
                  onFocus={() => setIsSearchAutofillGuardEnabled(false)}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder={searchPlaceholder}
                />
              </label>
            </div>
          </div>

          <label className="socios-toggle">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(event) => setShowDeleted(event.target.checked)}
            />
            <span>Mostrar socios eliminados</span>
          </label>

          {isLoading ? <p className="inicio-status">Actualizando estados y cargando socios...</p> : null}
          {error ? <p className="inicio-status inicio-status--error">{error}</p> : null}

          {!isLoading && !error ? (
            <div className="socios-table-wrap">
              <table className="socios-table">
                <thead>
                  <tr>
                    <th aria-label="Selección" />
                    <th>Socio</th>
                    <th>Estado</th>
                    <th>Fecha vencimiento cuota</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSocios.length === 0 ? (
                    <tr>
                      <td className="socios-empty" colSpan={4}>
                        No encontramos socios para los filtros actuales.
                      </td>
                    </tr>
                  ) : (
                    visibleSocios.map((socio) => {
                      const isSelected = socio.idUsuario === effectiveSelectedSocioId
                      const isAlertState =
                        socio.estadoSocio === 'Eliminado' || socio.estadoSocio === 'Suspendido'

                      return (
                        <tr
                          key={socio.idUsuario}
                          className={isSelected ? 'socios-row socios-row--selected' : 'socios-row'}
                          onClick={() => setSelectedSocioId(socio.idUsuario)}
                        >
                          <td data-label="Selección">
                            <span
                              className={
                                isSelected
                                  ? 'socios-radio socios-radio--selected'
                                  : 'socios-radio'
                              }
                              aria-hidden="true"
                            />
                          </td>
                          <td
                            data-label="Socio"
                            className={isAlertState ? 'socios-cell socios-cell--alert' : 'socios-cell'}
                          >
                            <strong>{getSocioDisplayName(socio)}</strong>
                          </td>
                          <td
                            data-label="Estado"
                            className="socios-cell"
                          >
                            <span className={`socios-status ${getEstadoSocioClass(socio.estadoSocio)}`}>
                              {socio.estadoSocio}
                            </span>
                          </td>
                          <td
                            data-label="Fecha vencimiento cuota"
                            className={isAlertState ? 'socios-cell socios-cell--alert' : 'socios-cell'}
                          >
                            {formatDateCell(socio.fechaFinPeriodo)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="socios-actions">
            {canAgregar ? (
              <button className="submit-button socios-action socios-action--primary" type="button" onClick={() => navigate('/socios/agregar')}>
                Agregar
              </button>
            ) : null}

            {canConsultar ? (
              <button
                className="ghost-button socios-action"
                type="button"
                disabled={!selectedSocio}
                onClick={() => goToSelected((idUsuario) => `/socios/${idUsuario}/consultar`)}
              >
                Consultar
              </button>
            ) : null}

            {canEliminar ? (
              <button
                className="ghost-button socios-action socios-action--danger"
                type="button"
                disabled={!selectedSocio || isLoading}
                onClick={() => {
                  if (!selectedSocio) {
                    return
                  }

                  setDeleteTargetSocio(selectedSocio)
                  setIsDeleteModalOpen(true)
                }}
              >
                Eliminar
              </button>
            ) : null}

            {canTurnos ? (
              <button
                className="ghost-button socios-action socios-action--turnos"
                type="button"
                disabled={!selectedSocio}
                onClick={() => goToSelected((idUsuario) => `/socios/${idUsuario}/turnos`)}
              >
                Turnos
              </button>
            ) : null}
          </div>
        </section>

        {isConsultarRoute && consultarSocioId && !Number.isNaN(consultarSocioId) && canConsultar ? (
          <ConsultarSocioModal
            idUsuario={consultarSocioId}
            userPermissions={userPermissions}
            onClose={() => navigate('/socios')}
            onDeleted={() => {
              navigate('/socios')
              void loadSocios({ keepLoading: false })
            }}
            onUpdated={() => void loadSocios({ keepLoading: false })}
          />
        ) : null}

        {isTurnosRoute && routeSocio && canTurnos ? (
          <GestionTurnosModal
            socio={routeSocio}
            userPermissions={userPermissions}
            onClose={() => navigate('/socios')}
          />
        ) : null}

        {isAgregarRoute && canAgregar ? (
          <AgregarSocioModal
            onClose={() => navigate('/socios')}
            onCreated={() => {
              navigate('/socios')
              void loadSocios({ keepLoading: false })
            }}
          />
        ) : null}

        {isDeleteModalOpen && deleteTargetSocio ? (
          <EliminarSocioModal
            key={deleteTargetSocio.idUsuario}
            socio={deleteTargetSocio}
            onClose={closeDeleteModal}
            onDeleted={handleSocioDeleted}
          />
        ) : null}
      </main>
    </AppLayout>
  )
}
