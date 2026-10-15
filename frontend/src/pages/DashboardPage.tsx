import { useAuth } from '../hooks/useAuth'

export function DashboardPage() {
  const { logout, session } = useAuth()

  return (
    <main className="dashboard-page">
      <section className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-copy">
              Placeholder temporal para validar autenticación, persistencia de sesión y navegación protegida.
            </p>
          </div>
          <button className="ghost-button" type="button" onClick={logout}>
            Cerrar sesión
          </button>
        </div>

        <div className="session-grid">
          <article className="session-block">
            <span className="session-label">Gym activo</span>
            <p className="session-value">{session?.idGym ?? '-'}</p>
          </article>
          <article className="session-block">
            <span className="session-label">Access token</span>
            <p className="session-value">{session?.accessToken ?? '-'}</p>
          </article>
          <article className="session-block">
            <span className="session-label">Refresh token</span>
            <p className="session-value">{session?.refreshToken ?? '-'}</p>
          </article>
          <article className="session-block">
            <span className="session-label">Permisos</span>
            <p className="session-value">
              {session?.permisos.length ? session.permisos.join(', ') : 'Sin permisos'}
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}
