export const PERFIL_IA_OBJETIVO_OPTIONS = [
  'Ganar fuerza',
  'Ganar masa muscular',
  'Perder grasa',
  'Recomposicion corporal',
  'Mejorar resistencia',
  'Mejorar movilidad/flexibilidad',
  'Mejorar rendimiento deportivo',
  'Mantenimiento general',
  'Salud y bienestar',
] as const

export const PERFIL_IA_NIVEL_OPTIONS = ['Principiante', 'Intermedio', 'Avanzado'] as const

export const PERFIL_IA_DISPONIBILIDAD_OPTIONS = ['Manana', 'Mediodia', 'Tarde', 'Noche', 'Variable'] as const

export const PERFIL_IA_INTENSIDAD_OPTIONS = [
  'Baja',
  'Moderada',
  'Alta',
  'Progresiva',
  'Adaptada por lesion/limitacion',
] as const

export const PERFIL_IA_DURACION_OPTIONS = ['30', '45', '60', '75', '90', '120'] as const

export const PERFIL_IA_MOTIVACION_OPTIONS = [
  'Mejorar salud',
  'Estetica',
  'Rendimiento deportivo',
  'Bajar de peso',
  'Ganar confianza',
  'Reducir estres',
  'Crear habito',
  'Rehabilitacion o vuelta progresiva',
  'Otro',
] as const

export const PERFIL_IA_LESIONES_OPTIONS = [
  'Ninguna',
  'Dolor lumbar',
  'Rodilla',
  'Hombro',
  'Cuello/cervical',
  'Cadera',
  'Tobillo/pie',
  'Muneca/codo',
  'Post-operatorio',
  'Otra',
] as const

export const PERFIL_IA_CONDICIONES_OPTIONS = [
  'Ninguna',
  'Hipertension',
  'Diabetes',
  'Asma',
  'Problemas cardiacos',
  'Alergias',
  'Medicacion relevante',
  'Embarazo/postparto',
  'Otra',
] as const

export function getPerfilIAOptionsWithCurrent(options: readonly string[], currentValue: string) {
  const cleanValue = currentValue.trim()

  if (!cleanValue || options.includes(cleanValue)) {
    return options
  }

  return [...options, cleanValue]
}

export function getPerfilIATokens(value: string) {
  return value
    .split(';')
    .map((token) => token.trim())
    .filter(Boolean)
}

function isOtherToken(token: string) {
  return token === 'Otra' || token.startsWith('Otra:')
}

function getKnownStructuredTokens(value: string, options: readonly string[]) {
  return getPerfilIATokens(value).filter((token) => options.includes(token) && token !== 'Otra')
}

export function getPerfilIAOtherDetail(value: string, options: readonly string[]) {
  const tokens = getPerfilIATokens(value)
  const explicitOther = tokens.find((token) => token.startsWith('Otra:'))

  if (explicitOther) {
    return explicitOther.replace(/^Otra:\s*/, '')
  }

  return tokens.filter((token) => token !== 'Otra' && !options.includes(token)).join('; ')
}

export function hasPerfilIAToken(value: string, token: string, options?: readonly string[]) {
  if (token === 'Otra') {
    return getPerfilIATokens(value).some(isOtherToken) || (options ? getPerfilIAOtherDetail(value, options) !== '' : false)
  }

  return getPerfilIATokens(value).includes(token)
}

export function setPerfilIAOtherDetail(value: string, detail: string, options: readonly string[]) {
  const cleanDetail = detail.trim()
  const knownTokens = getKnownStructuredTokens(value, options).filter((token) => token !== 'Ninguna')

  if (!cleanDetail) {
    return knownTokens.length > 0 ? [...knownTokens, 'Otra:'].join('; ') : 'Otra:'
  }

  return [...knownTokens, `Otra: ${cleanDetail}`].join('; ')
}

export function togglePerfilIAToken(value: string, token: string, options?: readonly string[]) {
  const tokens = getPerfilIATokens(value)

  if (token === 'Ninguna') {
    return tokens.includes(token) ? '' : token
  }

  if (token === 'Otra' && options) {
    const knownTokens = getKnownStructuredTokens(value, options).filter((currentToken) => currentToken !== 'Ninguna')

    if (hasPerfilIAToken(value, token, options)) {
      return knownTokens.join('; ')
    }

    return [...knownTokens, 'Otra:'].join('; ')
  }

  const withoutNone = tokens.filter((currentToken) => currentToken !== 'Ninguna' && !isOtherToken(currentToken))
  const otherToken = tokens.find(isOtherToken)
  const nextTokens = withoutNone.includes(token)
    ? withoutNone.filter((currentToken) => currentToken !== token)
    : [...withoutNone, token]

  return otherToken ? [...nextTokens, otherToken].join('; ') : nextTokens.join('; ')
}
