import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import checkIcon from '../assets/pricing-check.svg'
import { LandingHeader } from '../components/landing/LandingHeader'
import { PublicFooter } from '../components/landing/PublicFooter'

const plans = [
  {
    name: 'Instalación y Capacitación',
    price: 'USD 320',
    cadence: 'Pago único',
    benefits: [
      'Configuración inicial',
      'Capacitación del personal',
      'Integración con sistemas existentes',
    ],
  },
  {
    name: 'Suscripción mensual',
    price: 'USD 160',
    cadence: 'Por mes',
    benefits: [
      'Acceso completo a la plataforma',
      'Soporte técnico prioritario',
      'Actualizaciones y mejoras continuas',
    ],
  },
]

export function PreciosPage() {
  return (
    <main className="landing-page pricing-page">
      <LandingHeader />

      <div className="pricing-content">
        <header className="pricing-intro">
          <h1>Planes y precios</h1>
          <p>
            Nuestros planes están diseñados para adaptarse a las necesidades de cada gimnasio,
            desde pequeños estudios hasta grandes cadenas. Ofrecemos transparencia total y sin
            costos ocultos.
          </p>
        </header>

        <section className="pricing-grid" aria-label="Planes disponibles">
          {plans.map((plan, index) => (
            <article
              className="pricing-plan"
              key={plan.name}
              style={{ '--pricing-order': index } as CSSProperties}
            >
              <div className="pricing-plan__heading">
                <h2>{plan.name}</h2>
                <p className="pricing-plan__price">
                  <strong>{plan.price}</strong>
                  <span>{plan.cadence}</span>
                </p>
              </div>

              <Link className="pricing-plan__details" to="/contacto">
                Más información
              </Link>

              <ul className="pricing-plan__benefits">
                {plan.benefits.map((benefit) => (
                  <li key={benefit}>
                    <img src={checkIcon} alt="" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <Link className="landing-button pricing-primary-action" to="/pago">
          ¡Lo quiero!
        </Link>
      </div>
      <PublicFooter />
    </main>
  )
}
