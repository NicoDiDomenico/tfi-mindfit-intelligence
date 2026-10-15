import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import aiIcon from '../assets/features-ai.svg'
import gymIcon from '../assets/features-gym.svg'
import heroImage from '../assets/features-hero.png'
import membersIcon from '../assets/features-members.svg'
import nutritionIcon from '../assets/features-nutrition.svg'
import routinesIcon from '../assets/features-routines.svg'
import scheduleIcon from '../assets/features-schedule.svg'
import { LandingHeader } from '../components/landing/LandingHeader'
import { PublicFooter } from '../components/landing/PublicFooter'

const features = [
  {
    title: 'Gestión del Gimnasio',
    description:
      'Administra máquinas, horarios, empleados y planes. Control de cupos por franja horaria y asignación de entrenadores.',
    icon: gymIcon,
  },
  {
    title: 'Gestión de Socios',
    description:
      'Registro, edición y seguimiento de socios. Control de cuota y validación automática de acceso.',
    icon: membersIcon,
  },
  {
    title: 'Gestión de Turnos',
    description: 'Reserva y cancelación online, cupos automáticos, notificaciones por correo.',
    icon: scheduleIcon,
  },
  {
    title: 'Gestión de Rutinas',
    description:
      'Entrenadores asignan rutinas diarias por tipo (calentamiento, entrenamiento, estiramiento) con historial de progreso.',
    icon: routinesIcon,
  },
  {
    title: 'Asistencia con Inteligencia Artificial',
    description:
      'Recomendaciones personalizadas de entrenamiento y nutrición basadas en datos y objetivos.',
    icon: aiIcon,
  },
  {
    title: 'Seguimiento Nutricional',
    description:
      'Carga de planes alimentarios por profesionales, visibles para socios y entrenadores, integrados al módulo de IA.',
    icon: nutritionIcon,
  },
]

export function FuncionalidadesPage() {
  return (
    <main className="landing-page features-page">
      <LandingHeader />

      <div className="features-content">
        <section className="features-hero" aria-labelledby="features-hero-title">
          <img
            className="features-hero__image"
            src={heroImage}
            alt="Sala de entrenamiento con equipamiento funcional y pelotas medicinales"
          />
          <div className="features-hero__overlay" aria-hidden="true" />
          <h1 id="features-hero-title">
            Todo lo que tu gimnasio necesita, en un solo sistema inteligente.
          </h1>
        </section>

        <section className="features-list-section" aria-labelledby="features-title">
          <h2 id="features-title">Funcionalidades</h2>
          <div className="features-list">
            {features.map((feature, index) => (
              <article
                className="features-item"
                key={feature.title}
                style={{ '--feature-order': index } as CSSProperties}
              >
                <div className="features-item__icon" aria-hidden="true">
                  <img src={feature.icon} alt="" />
                </div>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="features-cta" aria-labelledby="features-cta-title">
          <h2 id="features-cta-title">Descubrí cómo MindFit puede potenciar tu gimnasio</h2>
          <Link className="landing-button" to="/registro-gym">
            Solicitar Demo
          </Link>
        </section>
      </div>
      <PublicFooter />
    </main>
  )
}
