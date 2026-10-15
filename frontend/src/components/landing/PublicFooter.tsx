import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const footerNavigation = [
  { label: 'Inicio', to: '/' },
  { label: 'Funcionalidades', to: '/funcionalidades' },
  { label: 'Precios', to: '/precios' },
  { label: 'Testimonios', to: '/testimonios' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contacto', to: '/contacto' },
]

interface SocialIconProps {
  label: string
  children: ReactNode
}

function SocialIcon({ label, children }: SocialIconProps) {
  return (
    <span className="public-footer__social" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {children}
      </svg>
    </span>
  )
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-footer__content">
        <h2>MindFit Intelligence</h2>
        <p>
          MindFit Intelligence es una plataforma para gimnasios que integra gestión, turnos,
          socios y herramientas inteligentes para mejorar la experiencia de entrenamiento como
          nunca antes se ha visto.
        </p>

        <div className="public-footer__socials" aria-label="Redes sociales de MindFit">
          <SocialIcon label="Facebook">
            <path d="M13.5 21v-8h2.8l.5-3h-3.3V8.3c0-.9.3-1.5 1.6-1.5H17V4.1c-.5-.1-1.6-.2-2.7-.2-2.7 0-4.4 1.6-4.4 4.6V10H7v3h2.9v8h3.6Z" />
          </SocialIcon>
          <SocialIcon label="Instagram">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" className="public-footer__social-dot" />
          </SocialIcon>
          <SocialIcon label="YouTube">
            <rect x="3" y="5" width="18" height="14" rx="4" className="public-footer__social-youtube-bg" />
            <path d="M10 9.5v5l4.5-2.5L10 9.5Z" className="public-footer__social-youtube-play" />
          </SocialIcon>
          <SocialIcon label="LinkedIn">
            <rect
              x="2.5"
              y="2.5"
              width="19"
              height="19"
              rx="4.5"
              className="public-footer__social-linkedin-bg"
            />
            <circle cx="7.2" cy="7.1" r="1.65" className="public-footer__social-linkedin-mark" />
            <path
              d="M5.75 10h2.9v8.25h-2.9V10Zm4.65 0h2.78v1.13h.04c.39-.73 1.34-1.5 2.76-1.5 2.95 0 3.5 1.94 3.5 4.47v4.15h-2.9v-3.68c0-.88-.02-2.01-1.23-2.01-1.23 0-1.42.96-1.42 1.95v3.74H10.4V10Z"
              className="public-footer__social-linkedin-mark"
            />
          </SocialIcon>
        </div>

        <nav className="public-footer__navigation" aria-label="Navegación del pie de página">
          {footerNavigation.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="public-footer__legal">
        © 2026 MindFit Intelligence. Todos los derechos reservados.
      </div>
    </footer>
  )
}
