import { BackToHomeLink } from '../components/BackToHomeLink'
import { AppLayout } from '../layouts/AppLayout'

const SUPPORT_ITEMS = [
  {
    title: 'Centro de ayuda',
    description: 'Guias operativas, preguntas frecuentes y buenas practicas del gimnasio.',
    status: 'Proximamente',
  },
  {
    title: 'Reportar un problema',
    description: 'Registro visual para derivar incidencias tecnicas o dudas del equipo.',
    status: 'Sin habilitar',
  },
  {
    title: 'Contacto administrativo',
    description: 'Canales de referencia para consultas sobre cuenta, permisos o suscripcion.',
    status: 'Pendiente',
  },
] as const

export function ResponsableSupportPage() {
  return (
    <AppLayout>
      <main className="dashboard-page responsable-support-page">
        <section className="responsable-profile-hero">
          <div>
            <span className="section-kicker">Asistencia</span>
            <h1 className="dashboard-title">Soporte</h1>
            <p className="dashboard-copy">
              Espacio preparado para centralizar ayuda y contacto operativo.
            </p>
          </div>
          <BackToHomeLink />
        </section>

        <section className="dashboard-card responsable-support-card">
          <header className="responsable-support-card__header">
            <div>
              <span className="section-kicker">Vista previa</span>
              <h2>Modulo de soporte</h2>
              <p>
                Esta seccion queda visible para responsables, pero todavia no ejecuta acciones.
              </p>
            </div>
            <span className="responsable-profile-badge">Visual</span>
          </header>

          <div className="responsable-support-grid">
            {SUPPORT_ITEMS.map((item) => (
              <article className="responsable-support-item" key={item.title}>
                <span>{item.status}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>

          <div className="responsable-support-preview" aria-label="Panel visual de soporte">
            <div>
              <span className="section-kicker">Estado</span>
              <strong>No implementado</strong>
              <p>
                El diseno queda listo para conectar un formulario, mesa de ayuda o documentacion
                cuando se defina el flujo.
              </p>
            </div>
          </div>
        </section>
      </main>
    </AppLayout>
  )
}
