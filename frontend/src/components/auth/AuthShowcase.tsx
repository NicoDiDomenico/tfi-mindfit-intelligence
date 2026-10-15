import heroImage from '../../assets/auth/auth-gym-background.jpg'

interface AuthShowcaseProps {
  eyebrow: string
  title: string
  copy: string
  points: string[]
}

export function AuthShowcase({ eyebrow, title, copy, points }: AuthShowcaseProps) {
  return (
    <section className="auth-visual" aria-hidden="true">
      <img className="auth-visual__image" src={heroImage} alt="" />
      <div className="auth-visual__content">
        <p className="auth-visual__eyebrow">{eyebrow}</p>
        <h2 className="auth-visual__title">{title}</h2>
        <p className="auth-visual__copy">{copy}</p>
        <ul className="auth-points">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
