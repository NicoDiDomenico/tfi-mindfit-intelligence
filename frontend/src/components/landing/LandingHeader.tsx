import { Link, NavLink } from 'react-router-dom'
import brandIcon from '../../assets/landing-brand.svg'

const navigationItems = [
  { label: 'Inicio', to: '/', end: true },
  { label: 'Funcionalidades', to: '/funcionalidades' },
  { label: 'Precios', to: '/precios' },
  { label: 'Testimonios', to: '/testimonios' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contacto', to: '/contacto' },
]

export function LandingHeader() {
  return (
    <header className="landing-header">
      <Link className="landing-brand" to="/" aria-label="MindFit Intelligence, inicio">
        <img src={brandIcon} alt="" aria-hidden="true" />
        <strong>MindFit Intelligence</strong>
      </Link>

      <div className="landing-header__actions">
        <nav className="landing-navigation" aria-label="Navegación principal">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `landing-navigation__link${isActive ? ' landing-navigation__link--active' : ''}`
              }
              end={item.end}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Link className="landing-button landing-button--compact" to="/login">
          Acceso Clientes
        </Link>
      </div>
    </header>
  )
}
