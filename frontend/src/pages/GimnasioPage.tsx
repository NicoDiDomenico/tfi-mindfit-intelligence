import { BackToHomeLink } from '../components/BackToHomeLink'
import { GimnasioMenu } from '../components/gimnasio/GimnasioMenu'
import { useGimnasioMenu } from '../hooks/useGimnasioMenu'
import { AppLayout } from '../layouts/AppLayout'

export function GimnasioPage() {
  const { items, isLoading, error } = useGimnasioMenu()

  return (
    <AppLayout>
      <main className="gimnasio-page">
        <section className="gimnasio-intro">
          <div>
            <span className="inicio-eyebrow">Gestionar gimnasio</span>
            <h1 className="dashboard-title">Gimnasio</h1>
            <p className="dashboard-copy">
              Accede a las opciones operativas disponibles para configurar equipo, personal y
              horarios.
            </p>
          </div>
          <BackToHomeLink />
        </section>

        <GimnasioMenu items={items} isLoading={isLoading} error={error} />
      </main>
    </AppLayout>
  )
}
