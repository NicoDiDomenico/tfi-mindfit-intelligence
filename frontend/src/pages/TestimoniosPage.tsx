import type { CSSProperties } from 'react'
import carlosImage from '../assets/testimonials-carlos.png'
import heroImage from '../assets/testimonials-hero.png'
import luciaImage from '../assets/testimonials-lucia.png'
import sofiaImage from '../assets/testimonials-sofia.png'
import { LandingHeader } from '../components/landing/LandingHeader'
import { PublicFooter } from '../components/landing/PublicFooter'

const testimonials = [
  {
    quote:
      'MindFit Intelligence ha revolucionado la gestión de nuestros socios. Hemos visto un aumento significativo en la retención y la satisfacción.',
    name: 'Sofía Rodríguez',
    role: 'Propietaria de Fitness Fusion',
    image: sofiaImage,
  },
  {
    quote:
      'Los reportes y análisis son invaluables. Ahora podemos tomar decisiones basadas en datos para optimizar nuestras operaciones.',
    name: 'Carlos Martínez',
    role: 'Propietario de Strength Zone',
    image: carlosImage,
  },
  {
    quote:
      'El equipo de soporte es fantástico. Siempre responden con rapidez y ayudan a que la transición sea fluida.',
    name: 'Lucía Gómez',
    role: 'Propietaria de Wellness Hub',
    image: luciaImage,
  },
]

export function TestimoniosPage() {
  return (
    <main className="landing-page testimonials-page">
      <LandingHeader />

      <div className="testimonials-content">
        <section className="testimonials-hero" aria-label="Gimnasio MindFit">
          <img
            src={heroImage}
            alt="Interior desenfocado de un gimnasio con equipamiento de entrenamiento"
          />
        </section>

        <section className="testimonials-section" aria-labelledby="testimonials-title">
          <h1 id="testimonials-title">Lo que dicen nuestros clientes</h1>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <figure
                className="testimonial"
                key={testimonial.name}
                style={{ '--testimonial-order': index } as CSSProperties}
              >
                <div className="testimonial__portrait">
                  <img src={testimonial.image} alt={`Retrato de ${testimonial.name}`} />
                </div>
                <blockquote>“{testimonial.quote}”</blockquote>
                <figcaption>
                  {testimonial.name}, {testimonial.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
      <PublicFooter />
    </main>
  )
}
