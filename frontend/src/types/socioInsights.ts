export type SocioRecomendacionTipo =
  | 'frecuencia'
  | 'continuidad'
  | 'estancamiento'
  | 'rutina'
  | 'variante'
  | 'turno'

export type SocioRecomendacionPrioridad = 'info' | 'warning'

export interface SocioRecomendacion {
  id: string
  tipo: SocioRecomendacionTipo
  prioridad: SocioRecomendacionPrioridad
  titulo: string
  mensaje: string
  accionTexto: string | null
  accionUrl: string | null
}
