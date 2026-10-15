import { Link } from 'react-router-dom'

interface BackLinkProps {
  to: string
  children: string
}

function BackLink({ to, children }: BackLinkProps) {
  return (
    <Link className="back-link" to={to}>
      <span className="back-link__arrow" aria-hidden="true">
        &larr;
      </span>
      {children}
    </Link>
  )
}

export function BackToHomeLink() {
  return <BackLink to="/dashboard">Volver al inicio</BackLink>
}

export function BackToGymLink() {
  return <BackLink to="/gimnasio">Volver a gimnasio</BackLink>
}
