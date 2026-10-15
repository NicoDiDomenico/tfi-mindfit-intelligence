import { useEffect, useMemo, useState } from 'react'
import { BackToHomeLink } from '../components/BackToHomeLink'
import { FormAlertModal } from '../components/FormAlertModal'
import { useAuth } from '../hooks/useAuth'
import { AppLayout } from '../layouts/AppLayout'
import { usuariosService } from '../services/usuariosService'
import type { UsuarioResponsableDto } from '../types/usuario'
import { getApiErrorMessage } from '../utils/apiError'
import { formatDateCell } from '../utils/date'

function getResponsableName(usuario: UsuarioResponsableDto | null) {
  const persona = usuario?.personaResponsable
  const nombreCompleto = [persona?.nombre, persona?.apellido].filter(Boolean).join(' ').trim()

  return nombreCompleto || usuario?.username || 'Responsable'
}

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <label className="field-group responsable-profile-field">
      <span className="field-label">{label}</span>
      <input className="field-input" type="text" value={value?.trim() || '-'} readOnly />
    </label>
  )
}

export function ResponsableProfilePage() {
  const { session } = useAuth()
  const [usuario, setUsuario] = useState<UsuarioResponsableDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const responsableId = session?.datosPersonales?.id ?? null
  const responsableName = getResponsableName(usuario)
  const grupos = useMemo(() => usuario?.grupos ?? [], [usuario?.grupos])
  const permisos = useMemo(
    () =>
      Array.from(
        new Map(
          grupos.flatMap((grupo) =>
            grupo.permisos.map((permiso) => [permiso.codigo, permiso] as const),
          ),
        ).values(),
      ).sort((first, second) => first.codigo.localeCompare(second.codigo, 'es-AR')),
    [grupos],
  )

  useEffect(() => {
    let isActive = true

    async function loadProfile() {
      if (!responsableId) {
        setError('No pudimos identificar el usuario actual.')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const response = await usuariosService.getUsuarioById(responsableId)

        if (isActive) {
          setUsuario(response)
        }
      } catch (requestError) {
        if (isActive) {
          setError(
            getApiErrorMessage(
              requestError,
              'No pudimos cargar los datos del perfil. Intenta nuevamente.',
            ),
          )
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isActive = false
    }
  }, [responsableId])

  const persona = usuario?.personaResponsable

  return (
    <AppLayout>
      <main className="dashboard-page responsable-profile-page">
        <section className="responsable-profile-hero">
          <div>
            <span className="section-kicker">Cuenta</span>
            <h1 className="dashboard-title">Mi perfil</h1>
            <p className="dashboard-copy">
              Consulta los datos registrados para tu usuario responsable.
            </p>
          </div>
          <BackToHomeLink />
        </section>

        <section className="dashboard-card responsable-profile-card">
          {isLoading ? <p className="inicio-status">Cargando perfil...</p> : null}
          {error ? <FormAlertModal type="error" message={error} /> : null}

          {!isLoading && !error && usuario ? (
            <>
              <header className="responsable-profile-card__header">
                <div>
                  <span className="section-kicker">Responsable</span>
                  <h2>{responsableName}</h2>
                  <p>{usuario.username}</p>
                </div>
              </header>

              <div className="responsable-profile-grid">
                <ReadOnlyField label="Nombre" value={persona?.nombre} />
                <ReadOnlyField label="Apellido" value={persona?.apellido} />
                <ReadOnlyField label="Email" value={persona?.email} />
                <ReadOnlyField label="Telefono" value={persona?.telefono} />
                <ReadOnlyField label="Tipo documento" value={persona?.tipoDocumento} />
                <ReadOnlyField label="Nro documento" value={persona?.nroDocumento} />
                <ReadOnlyField label="Genero" value={persona?.genero} />
                <ReadOnlyField
                  label="Fecha nacimiento"
                  value={formatDateCell(persona?.fechaNacimiento ?? null)}
                />
                <ReadOnlyField label="Ciudad" value={persona?.ciudad} />
                <ReadOnlyField label="Direccion" value={persona?.direccion} />
                <ReadOnlyField
                  label="Fecha registro"
                  value={formatDateCell(usuario.fechaRegistro)}
                />
                <ReadOnlyField label="Tipo persona" value={usuario.tipoPersona} />
              </div>

              <section className="responsable-profile-section">
                <h3>Grupos asignados</h3>
                <div className="responsable-profile-chip-list">
                  {grupos.length > 0 ? (
                    grupos.map((grupo) => (
                      <span className="responsable-profile-chip" key={grupo.idGrupo}>
                        {grupo.nombre}
                      </span>
                    ))
                  ) : (
                    <p className="inicio-status">No hay grupos asignados.</p>
                  )}
                </div>
              </section>

              <section className="responsable-profile-section">
                <h3>Permisos activos</h3>
                <div className="responsable-profile-permissions">
                  {permisos.length > 0 ? (
                    permisos.map((permiso) => (
                      <span key={permiso.idPermiso}>{permiso.codigo}</span>
                    ))
                  ) : (
                    <p className="inicio-status">No hay permisos asociados.</p>
                  )}
                </div>
              </section>
            </>
          ) : null}
        </section>
      </main>
    </AppLayout>
  )
}
