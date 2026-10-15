export type GimnasioMenuIconName =
  | 'usuarios'
  | 'permisos'
  | 'equipamientos'
  | 'maquinas'
  | 'ejercicios'
  | 'rangos-horarios'
  | 'auditoria'
  | 'reportes'
  | 'suscripcion'

interface GimnasioMenuIconProps {
  name: GimnasioMenuIconName
}

export function GimnasioMenuIcon({ name }: GimnasioMenuIconProps) {
  if (name === 'usuarios') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="10.5" cy="19" r="4.5" />
        <path d="M3 35v-2.5c0-4.8 3.4-8.5 7.5-8.5 2 0 3.8.8 5.2 2.2" />
        <path d="M3 35h7" />

        <circle cx="37.5" cy="19" r="4.5" />
        <path d="M45 35v-2.5c0-4.8-3.4-8.5-7.5-8.5-2 0-3.8.8-5.2 2.2" />
        <path d="M45 35h-7" />

        <circle cx="24" cy="15" r="6" />
        <path d="M12.5 39v-4.2c0-6.1 5.1-10.3 11.5-10.3s11.5 4.2 11.5 10.3V39h-23Z" />
      </svg>
    )
  }

  if (name === 'permisos') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 20v-6a9 9 0 0 1 18 0v6" />
        <path d="M14 20v-6a5 5 0 0 1 10 0v6" />
        <rect x="6" y="19" width="27" height="24" rx="3" />

        <circle cx="17.5" cy="29" r="2.5" />
        <path d="M17.5 31.5V36" />

        <circle cx="38.5" cy="31" r="5.5" />
        <circle cx="38.5" cy="31" r="1.5" />
        <path d="M33 31h-9v5h3v-3h3v-2" />
      </svg>
    )
  }

  if (name === 'equipamientos') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="10" y="7" width="6" height="4" rx="1.5" />
        <rect x="7" y="11" width="12" height="5" rx="1.5" />
        <path d="M13 16v16" />
        <rect x="7" y="32" width="12" height="5" rx="1.5" />
        <rect x="10" y="37" width="6" height="4" rx="1.5" />

        <path d="M29 21v-5c0-4.4 3.1-7 7.5-7h2c4.4 0 7.5 2.6 7.5 7v5" />
        <path d="M33 20v-4c0-1.7 1.3-2.5 3-2.5h3c1.7 0 3 .8 3 2.5v4" />
        <path d="M29 21h14c2.7 3.8 4 8.1 4 12.5C47 40 43 43 36 43s-11-3-11-9.5c0-4.4 1.3-8.7 4-12.5Z" />
        <path d="M30 29h1" />
      </svg>
    )
  }

  if (name === 'maquinas') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="m6 30.5 28-1.5 2 6H10a4 4 0 0 1-4-4v-.5Z" />
        <path d="M11 35v3h5M33 35v3h6" />

        <path d="M36 35h7" />
        <path d="M40.5 35c-.7-6.8-2-12.8-4.5-18" />
        <path d="M36.5 35c0-5.8-.8-11-2.8-15.5" />
        <path d="M35 17H22a1.5 1.5 0 0 1 0-3h13" />
        <path d="m35 14 5.5-7 2.5 1.5-5 7.5-3-2Z" />
      </svg>
    )
  }

  if (name === 'ejercicios') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="8" r="4" />

        <path d="M19 14c-2-1-4-1-6 1l-3-2 1-4 3 2 1-4 3 1-1 4 3 2" />
        <path d="M29 14c2-1 4-1 6 1l3-2-1-4-3 2-1-4-3 1 1 4-3 2" />

        <path d="M19 14c1 3 1 5 0 8l-2 6c2 1.5 4.3 2 7 2s5-.5 7-2l-2-6c-1-3-1-5 0-8" />
        <path d="M24 16v11M20.5 19.5h7M21 24h6" />

        <path d="M19 29c-4 1-7 3-9 6l3 5-1 4H7c0-1.3 1-2.3 3-2.5L8 35c2-4 5-7 9-8" />
        <path d="M29 29c4 1 7 3 9 6l-3 5 1 4h5c0-1.3-1-2.3-3-2.5l2-6.5c-2-4-5-7-9-8" />

        <path d="M6 31c-1.5-4.5-.7-9 2-12M5.5 21 8 19l1 3" />
        <path d="M42 31c1.5-4.5.7-9-2-12M42.5 21 40 19l-1 3" />
      </svg>
    )
  }

  if (name === 'auditoria') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M12 6h18l6 6v30H12V6Z" />
        <path d="M30 6v8h8" />
        <path d="M18 19h12M18 25h14M18 31h8" />
        <circle cx="34" cy="33" r="6" />
        <path d="m38 37 5 5" />
      </svg>
    )
  }

  if (name === 'reportes') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M7 40h34" />
        <path d="M11 36V22h7v14" />
        <path d="M21 36V12h7v24" />
        <path d="M31 36V18h7v18" />
        <path d="M9 10h9" />
        <path d="M9 15h5" />
        <circle cx="37" cy="10" r="4" />
        <path d="m34 13-4 4" />
      </svg>
    )
  }

  if (name === 'suscripcion') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="7" y="10" width="34" height="28" rx="4" />
        <path d="M7 18h34" />
        <path d="M14 29h9" />
        <path d="M14 33h5" />
        <circle cx="32" cy="31" r="7" />
        <path d="M32 26v10" />
        <path d="M29 28.5c.6-1 1.7-1.5 3-1.5 1.7 0 3 1 3 2.4 0 3-6 1.5-6 4.2 0 1.4 1.3 2.4 3 2.4 1.4 0 2.5-.5 3.1-1.6" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <rect x="6" y="9" width="36" height="32" rx="3" />
      <path d="M6 18h36M14 6v7M34 6v7" />
      <path d="M13 24h4M22 24h4M31 24h4M13 30h4M22 30h4M13 36h4M22 36h4" />
      <circle cx="36" cy="35" r="7" />
      <path d="M36 31v4l3 2" />
    </svg>
  )
}
