import { Link } from 'react-router-dom'
import type { NavigationItem } from '../../utils/navigationPermissions'

interface NavigationPanelProps {
  items: readonly NavigationItem[]
  isLoading: boolean
  error: string
}

export function NavigationPanel({ items, isLoading, error }: NavigationPanelProps) {
  return (
    <nav className="inicio-navigation" aria-label="Secciones principales">
      <div className="section-heading">
        <div>
          <span className="section-kicker">Accesos</span>
          <h2>Menús</h2>
        </div>
      </div>

      {isLoading ? <p className="inicio-status">Cargando accesos...</p> : null}
      {error ? <p className="inicio-status inicio-status--error">{error}</p> : null}
      {!isLoading && !error && items.length === 0 ? (
        <p className="inicio-status">No hay secciones habilitadas para tus permisos actuales.</p>
      ) : null}

      {items.length > 0 ? (
        <div className="navigation-list">
          {items.map((item, index) => (
            <Link className="navigation-link" to={item.path} key={item.key}>
              <span className="navigation-link__number">{String(index + 1).padStart(2, '0')}</span>
              <span className="navigation-link__content">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              <span className="navigation-link__arrow" aria-hidden="true">
                &gt;
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </nav>
  )
}
