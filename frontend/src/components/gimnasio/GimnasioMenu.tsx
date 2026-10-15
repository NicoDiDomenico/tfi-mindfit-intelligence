import { Link } from 'react-router-dom'
import type { GimnasioMenuItemConfig } from './gimnasioMenuConfig'
import { GimnasioMenuItem } from './GimnasioMenuItem'

interface GimnasioMenuProps {
  items: readonly GimnasioMenuItemConfig[]
  isLoading: boolean
  error: string
}

export function GimnasioMenu({ items, isLoading, error }: GimnasioMenuProps) {
  return (
    <section className="gimnasio-menu-section" aria-labelledby="gimnasio-menu-title">
      <div className="section-heading gimnasio-menu-heading">
        <div>
          <span className="section-kicker">Opciones</span>
          <h2 id="gimnasio-menu-title">Menús</h2>
        </div>
        <span className="section-count">{items.length} opciones</span>
      </div>

      {isLoading ? <p className="inicio-status">Cargando opciones del módulo...</p> : null}
      {error ? <p className="inicio-status inicio-status--error">{error}</p> : null}

      {!isLoading && !error && items.length === 0 ? (
        <div className="gimnasio-empty">
          <p className="inicio-status">
            No tenés permisos disponibles para gestionar opciones del gimnasio.
          </p>
          <Link className="placeholder-link gimnasio-empty__link" to="/dashboard">
            Volver a Inicio
          </Link>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="gimnasio-menu-list">
          {items.map((item) => (
            <GimnasioMenuItem item={item} key={item.key} />
          ))}
        </div>
      ) : null}
    </section>
  )
}
