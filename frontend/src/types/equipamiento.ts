export interface EquipamientoDto {
  idEquipamiento: number
  nombreEquipo: string
  costoAdquisicion: number
  pesoFijoKg: number | null
}

export interface EquipamientoInsertDto {
  nombreEquipo: string
  costoAdquisicion: number
  pesoFijoKg: number | null
}

export interface EquipamientoUpdateDto {
  nombreEquipo: string
  costoAdquisicion: number
  pesoFijoKg: number | null
}
