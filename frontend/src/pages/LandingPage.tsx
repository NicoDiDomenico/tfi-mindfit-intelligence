import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import adminIcon from '../assets/landing-admin.svg'
import aiIcon from '../assets/landing-ai.svg'
import heroImage from '../assets/landing-hero.png'
import nutritionIcon from '../assets/landing-nutrition.svg'
import routinesIcon from '../assets/landing-routines.svg'
import { LandingHeader } from '../components/landing/LandingHeader'
import { PublicFooter } from '../components/landing/PublicFooter'

const modules = [
  { label: 'Gestión Administrativa', icon: adminIcon },
  { label: 'Rutinas', icon: routinesIcon },
  { label: 'Nutrición', icon: nutritionIcon },
  { label: 'Inteligencia Artificial', icon: aiIcon },
]

export function LandingPage() {
  return (
    <main className="landing-page">
      <LandingHeader />

      <div className="landing-content">
        <section className="landing-hero" aria-labelledby="landing-title">
          <img
            className="landing-hero__image"
            src={heroImage}
            alt="Sala de gimnasio equipada con bicicletas elípticas, mancuernas y cintas"
          />
          <div className="landing-hero__overlay" aria-hidden="true" />
          <h1 id="landing-title">Digitalizá tu gimnasio con inteligencia artificial</h1>
        </section>

        <section className="landing-modules" id="modulos" aria-labelledby="modules-title">
          <h2 id="modules-title">Nuestros Módulos</h2>
          <div className="landing-modules__grid">
            {modules.map((module, index) => (
              <article
                className="landing-module"
                key={module.label}
                style={{ '--module-order': index } as CSSProperties}
              >
                <img src={module.icon} alt="" aria-hidden="true" />
                <h3>{module.label}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta" id="demo" aria-labelledby="demo-title">
          <h2 id="demo-title">Transformá tu gimnasio ya</h2>
          <Link className="landing-button" to="/registro-gym">
            Solicitar Demo
          </Link>
        </section>
      </div>
      <PublicFooter />
    </main>
  )
}
