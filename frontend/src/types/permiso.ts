export interface PermisoDto {
  idPermiso: number
  codigo: string
  descripcion: string | null
}

export interface GrupoDto {
  idGrupo: number
  nombre: string
  descripcion: string
  permisos: PermisoDto[]
}

export interface GrupoPayloadDto {
  nombre: string
  descripcion: string
  idPermisos: number[]
}
