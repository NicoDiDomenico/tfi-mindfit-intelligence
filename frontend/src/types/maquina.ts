export interface MaquinaDto {
  idMaquina: number
  nombreMaquina: string
  fechaFabricacion: string
  fechaCompra: string
  costoAdquisicion: number
  pesoMaximoLingotera: number | null
  esElectrica: boolean
}

export interface MaquinaInsertDto {
  nombreMaquina: string
  fechaFabricacion: string
  fechaCompra: string
  costoAdquisicion: number
  pesoMaximoLingotera: number | null
  esElectrica: boolean
}

export interface MaquinaUpdateDto {
  nombreMaquina: string
  fechaFabricacion: string
  fechaCompra: string
  costoAdquisicion: number
  pesoMaximoLingotera: number | null
  esElectrica: boolean
}
