import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import heroImage from '../assets/blog-hero.png'
import { LandingHeader } from '../components/landing/LandingHeader'
import { PublicFooter } from '../components/landing/PublicFooter'

type ContactField = 'name' | 'email' | 'message'

interface ContactErrors {
  name?: string
  email?: string
  message?: string
}

interface ContactMethod {
  label: string
  value: string
  icon: ReactNode
  href?: string
}

function IconFrame({ children }: { children: ReactNode }) {
  return (
    <span className="contact-method__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        {children}
      </svg>
    </span>
  )
}

const contactMethods: ContactMethod[] = [
  {
    label: 'Email',
    value: 'mindfitintelligence@gmail.com',
    href: 'mailto:mindfitintelligence@gmail.com',
    icon: (
      <IconFrame>
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="m4 7 8 6 8-6" />
      </IconFrame>
    ),
  },
  {
    label: 'Dirección',
    value: 'Rosario, Argentina',
    icon: (
      <IconFrame>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </IconFrame>
    ),
  },
  {
    label: 'WhatsApp',
    value: 'WhatsApp Business',
    icon: (
      <IconFrame>
        <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z" />
        <path d="M9 8.5c.5 2.8 2.2 4.5 5 5" />
        <path d="m9 8.5 1-1.2M14 13.5l1.3-1" />
      </IconFrame>
    ),
  },
  {
    label: 'Chat',
    value: 'Chat en vivo',
    icon: (
      <IconFrame>
        <path d="M21 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20l1.4-4.4A8.5 8.5 0 1 1 21 11.5Z" />
        <circle cx="8.5" cy="11.5" r=".75" fill="currentColor" stroke="none" />
        <circle cx="12" cy="11.5" r=".75" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="11.5" r=".75" fill="currentColor" stroke="none" />
      </IconFrame>
    ),
  },
]

export function ContactoPage() {
  const [errors, setErrors] = useState<ContactErrors>({})
  const [notice, setNotice] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const values = {
      name: String(formData.get('name') ?? '').trim(),
      email: String(formData.get('email') ?? '').trim(),
      message: String(formData.get('message') ?? '').trim(),
    }
    const nextErrors: ContactErrors = {}

    if (!values.name) nextErrors.name = 'Ingresá tu nombre.'
    if (!values.email) {
      nextErrors.email = 'Ingresá tu email.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Ingresá un email válido.'
    }
    if (!values.message) nextErrors.message = 'Escribí tu consulta.'

    setErrors(nextErrors)
    setNotice('')

    if (Object.keys(nextErrors).length === 0) {
      setNotice('El envío de consultas estará disponible próximamente.')
    }
  }

  function clearFieldError(field: ContactField) {
    setErrors((current) => ({ ...current, [field]: undefined }))
    setNotice('')
  }

  return (
    <main className="landing-page contact-page">
      <LandingHeader />

      <div className="contact-content">
        <section className="contact-hero" aria-label="Contacto MindFit">
          <img
            src={heroImage}
            alt="Ilustración editorial de un equipo colaborando entre plantas"
          />
        </section>

        <aside className="contact-details" aria-labelledby="contact-details-title">
          <h1 id="contact-details-title">Contáctanos</h1>
          <div className="contact-methods">
            {contactMethods.map((method) => (
              <article className="contact-method" key={method.label}>
                {method.icon}
                <div>
                  <h2>{method.label}</h2>
                  {method.href ? <a href={method.href}>{method.value}</a> : <p>{method.value}</p>}
                </div>
              </article>
            ))}
          </div>
        </aside>

        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <div className="contact-field">
            <label htmlFor="contact-name">Nombre</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              placeholder="Juan"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
              onChange={() => clearFieldError('name')}
            />
            {errors.name ? <p id="contact-name-error" className="contact-field__error">{errors.name}</p> : null}
          </div>

          <div className="contact-field">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              placeholder="JuanEjemplo@gmail.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
              onChange={() => clearFieldError('email')}
            />
            {errors.email ? <p id="contact-email-error" className="contact-field__error">{errors.email}</p> : null}
          </div>

          <div className="contact-field">
            <label htmlFor="contact-message">Mensaje</label>
            <textarea
              id="contact-message"
              name="message"
              placeholder="¿Cuenta con módulo de seguridad el sistema?"
              rows={5}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? 'contact-message-error' : undefined}
              onChange={() => clearFieldError('message')}
            />
            {errors.message ? <p id="contact-message-error" className="contact-field__error">{errors.message}</p> : null}
          </div>

          {notice ? <p className="contact-form__notice" role="status">{notice}</p> : null}

          <button className="contact-submit" type="submit">
            Enviar
          </button>
        </form>
      </div>
      <PublicFooter />
    </main>
  )
}
