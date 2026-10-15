import type { EquipamientoDto } from './equipamiento'
import type { MaquinaDto } from './maquina'

export type Musculo =
  | 'Pecho'
  | 'Espalda'
  | 'Cuadriceps'
  | 'Biceps'
  | 'Triceps'
  | 'Gluteos'
  | 'Abdomen'
  | 'Hombros'
  | 'Gemelos'
  | 'Antebrazos'
  | 'Lumbares'
  | 'Isquiotibiales'

export type TipoDeEjercicio = 'Calentamiento' | 'Entrenamiento' | 'Estiramiento'

export interface GrupoMuscularDto {
  idGrupoMuscular: number
  nombreMusculo: Musculo
  idMapaAnatomico: string | null
}

export interface TipoEjercicioDto {
  idTipoEjercicio: number
  nombreTipo: TipoDeEjercicio
}

export interface EjercicioDto {
  idEjercicio: number
  descEjercicio: string
  grupoMuscular: GrupoMuscularDto
  tipoEjercicio: TipoEjercicioDto
  maquina: MaquinaDto | null
  equipamiento: EquipamientoDto | null
}

export interface EjercicioInsertDto {
  descEjercicio: string
  idGrupoMuscular: number
  idTipoEjercicio: number
  idMaquina: number | null
  idEquipamiento: number | null
}

export interface EjercicioUpdateDto {
  descEjercicio: string
  idGrupoMuscular: number
  idTipoEjercicio: number
  idMaquina: number | null
  idEquipamiento: number | null
}
