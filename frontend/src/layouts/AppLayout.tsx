import type { ChangeEvent, FormEvent, PropsWithChildren, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import logoSistema from '../assets/logo-sistema-v2.png'
import { FormAlertModal } from '../components/FormAlertModal'
import { ProfileMenu } from '../components/ProfileMenu'
import { useAuth } from '../hooks/useAuth'
import { useNavigationAccess } from '../hooks/useNavigationAccess'
import { useTheme } from '../hooks/useTheme'
import { turnosService } from '../services/turnosService'
import { getApiErrorMessage } from '../utils/apiError'
import { getAuthenticatedHomePath, isSocioRole } from '../utils/authRoles'
import type { NavigationItem } from '../utils/navigationPermissions'

const VALIDAR_INGRESO_PERMISSION = 'VALIDAR_INGRESO'
const HEADER_NAVIGATION_LABELS: Record<NavigationItem['key'], string> = {
  rutinas: 'Rutinas',
  socios: 'Socios',
  gimnasio: 'Gimnasio',
}

const SOCIO_PROFILE_LINKS = [
  { label: 'Info. Personal', path: '/socio/inicio/info-personal' },
  { label: 'Facturacion', path: '/socio/inicio/facturacion' },
  { label: 'Perfil IA', path: '/socio/inicio/perfil-ia' },
] as const

const RESPONSABLE_PROFILE_LINKS = [
  { label: 'Mi perfil', path: '/dashboard/mi-perfil' },
  { label: 'Soporte', path: '/dashboard/soporte' },
] as const

interface AppLayoutProps extends PropsWithChildren {
  onValidarIngresoSuccess?: () => void | Promise<void>
  headerNavigation?: {
    items: readonly NavigationItem[]
  }
  notificationsSlot?: ReactNode
}

function sanitizeDniInput(value: string) {
  return value.replace(/\D/g, '')
}

function isActiveHeaderNavigationItem(pathname: string, itemPath: string) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

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
      </button>

      {isOpen ? (
        <div
          className="workspace-profile__menu workspace-notifications__menu"
          role="dialog"
          aria-label="Notificaciones"
        >
          <p className="workspace-notifications__empty">No hay notificaciones actualmente</p>
        </div>
      ) : null}
    </div>
  )
}

export function AppLayout({
  children,
  onValidarIngresoSuccess,
  headerNavigation,
  notificationsSlot,
}: AppLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, session } = useAuth()
  const { isDarkTheme, theme, toggleTheme } = useTheme()
  const layoutNavigation = useNavigationAccess({ enabled: headerNavigation === undefined })
  const [isValidarIngresoOpen, setIsValidarIngresoOpen] = useState(false)
  const [dniSocio, setDniSocio] = useState('')
  const [isSubmittingIngreso, setIsSubmittingIngreso] = useState(false)
  const [validarIngresoError, setValidarIngresoError] = useState('')
  const [validarIngresoSuccess, setValidarIngresoSuccess] = useState('')

  const canValidarIngreso = session?.permisos.includes(VALIDAR_INGRESO_PERMISSION) ?? false
  const homePath = getAuthenticatedHomePath(session)
  const changePasswordPath = `${homePath}/cambiar-contrasena`
  const headerNavigationItems = headerNavigation?.items ?? layoutNavigation.items
  const isSocioSession = isSocioRole(session?.datosPersonales?.rol)
  const profileLinks = isSocioSession ? SOCIO_PROFILE_LINKS : RESPONSABLE_PROFILE_LINKS

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  function openValidarIngresoModal() {
    setIsValidarIngresoOpen(true)
    setValidarIngresoError('')
    setValidarIngresoSuccess('')
  }

  function closeValidarIngresoModal() {
    if (isSubmittingIngreso) {
      return
    }

    setIsValidarIngresoOpen(false)
    setDniSocio('')
    setValidarIngresoError('')
    setValidarIngresoSuccess('')
  }

  function handleDniChange(event: ChangeEvent<HTMLInputElement>) {
    setDniSocio(sanitizeDniInput(event.target.value))

    if (validarIngresoError) {
      setValidarIngresoError('')
    }
  }

  async function handleValidarIngresoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedDni = dniSocio.trim()

    if (!normalizedDni) {
      setValidarIngresoError('Ingresa el DNI del socio para continuar.')
      setValidarIngresoSuccess('')
      return
    }

    setIsSubmittingIngreso(true)
    setValidarIngresoError('')
    setValidarIngresoSuccess('')

    try {
      const response = await turnosService.validarIngreso({ dniSocio: normalizedDni })

      setDniSocio('')
      setValidarIngresoSuccess(response.message || 'Se valido el ingreso del socio.')

      try {
        await onValidarIngresoSuccess?.()
      } catch {
        // La validacion ya fue exitosa; la pantalla de la grilla mantiene su error de recarga.
      }
    } catch (error) {
      setValidarIngresoError(
        getApiErrorMessage(error, 'No pudimos validar el ingreso del socio. Intenta nuevamente.'),
      )
    } finally {
      setIsSubmittingIngreso(false)
    }
  }

  return (
    <div className="workspace-shell" data-theme={theme}>
      <header className="workspace-header">
        <Link className="workspace-brand" to={homePath} aria-label="Ir a Inicio">
          <span className="workspace-brand__mark-frame">
            <img className="workspace-brand__mark" src={logoSistema} alt="" />
          </span>
          <span>
            <strong>{session?.nombreGym ?? `Gym ${session?.idGym ?? '-'}`}</strong>
            <small>MindFit Intelligence</small>
          </span>
        </Link>

        <div className="workspace-actions">
          {headerNavigationItems.length > 0 ? (
            <nav className="workspace-navigation" aria-label="Accesos principales">
              {headerNavigationItems.map((item) => {
                const isActive = isActiveHeaderNavigationItem(location.pathname, item.path)

                return (
                  <Link
                    className={`workspace-navigation__link${
                      isActive ? ' workspace-navigation__link--active' : ''
                    }`}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    key={item.key}
                  >
                    {HEADER_NAVIGATION_LABELS[item.key]}
                  </Link>
                )
              })}
            </nav>
          ) : null}

          <button
            className="workspace-theme-toggle"
            type="button"
            aria-label="Alternar modo claro u oscuro"
            aria-pressed={isDarkTheme}
            onClick={toggleTheme}
          >
            <span className="workspace-theme-toggle__track" aria-hidden="true">
              <span className="workspace-theme-toggle__thumb">
                <span className="workspace-theme-toggle__sun" />
                <span className="workspace-theme-toggle__moon" />
              </span>
            </span>
          </button>

          {notificationsSlot ?? <NotificationsMenu />}

          <div
            className={`workspace-action-group${
              canValidarIngreso ? '' : ' workspace-action-group--profile-only'
            }`}
          >
            {canValidarIngreso ? (
              <button
                className="workspace-validate"
                type="button"
                onClick={openValidarIngresoModal}
              >
                Validar Ingreso
              </button>
            ) : null}
            <ProfileMenu
              changePasswordPath={changePasswordPath}
              links={profileLinks}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {children}

      {isValidarIngresoOpen ? (
        <div className="consultar-backdrop" role="presentation">
          <section
            className="consultar-modal validar-ingreso-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="validar-ingreso-title"
          >
            <header className="consultar-header validar-ingreso-modal__header">
              <div>
                <h2 id="validar-ingreso-title">Validar ingreso</h2>
                <div className="consultar-meta">
                  <span className="consultar-status consultar-status--info">Turnos</span>
                  <span>Ingreso de socio por DNI</span>
                </div>
              </div>
              <button
                className="consultar-close"
                type="button"
                aria-label="Cerrar"
                disabled={isSubmittingIngreso}
                onClick={closeValidarIngresoModal}
              >
                x
              </button>
            </header>

            <form className="validar-ingreso-form" onSubmit={handleValidarIngresoSubmit} noValidate>
              <div className="consultar-body validar-ingreso-modal__body">
                <div className="validar-ingreso-modal__intro">
                  <span className="section-kicker">Control de acceso</span>
                  <p className="validar-ingreso-modal__copy">
                    Ingresa el DNI del socio para validar su asistencia desde cualquier pantalla
                    privada.
                  </p>
                </div>

                <label className="field-group" htmlFor="validar-ingreso-dni">
                  <span className="field-label">DNI del socio</span>
                  <input
                    id="validar-ingreso-dni"
                    className="field-input validar-ingreso-modal__input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={dniSocio}
                    disabled={isSubmittingIngreso}
                    onChange={handleDniChange}
                  />
                </label>

                {validarIngresoError ? (
                  <FormAlertModal type="error" message={validarIngresoError} />
                ) : null}
                {validarIngresoSuccess ? (
                  <FormAlertModal type="success" message={validarIngresoSuccess} />
                ) : null}
              </div>

              <footer className="consultar-footer validar-ingreso-modal__footer">
                <button
                  className="ghost-button consultar-footer__close"
                  type="button"
                  disabled={isSubmittingIngreso}
                  onClick={closeValidarIngresoModal}
                >
                  Cancelar
                </button>
                <button
                  className="submit-button consultar-footer__save validar-ingreso-modal__confirm"
                  type="submit"
                  disabled={isSubmittingIngreso || !dniSocio.trim()}
                >
                  {isSubmittingIngreso ? 'Confirmando...' : 'Confirmar'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}
