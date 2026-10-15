import type {
  ChangePasswordRequestDto,
  DiaDto,
  ProcesarEliminacionesResponse,
  SocioGridItem,
  UsuarioDto,
  UsuarioInsertDto,
  UsuarioUpdateDto,
} from '../types/socio'
import { apiClient } from './apiClient'

export const sociosService = {
  async actualizarCuotasVencidas() {
    await apiClient.put('/Cuota/actualizar-vencidas')
  },

  async procesarEliminacionesPendientes() {
    const response = await apiClient.patch<ProcesarEliminacionesResponse>(
      '/Usuario/procesar-eliminaciones-pendientes',
    )

    return response.data
  },

  async getSociosGrid() {
    const response = await apiClient.get<SocioGridItem[]>('/Usuario/grilla-socio')
    return response.data
  },

  async getDias() {
    const response = await apiClient.get<DiaDto[]>('/Dia/dias')
    return response.data
  },

  async getSocioById(idUsuario: number) {
    const response = await apiClient.get<UsuarioDto>(`/Usuario/${idUsuario}`)
    return response.data
  },

  async registerSocio(dto: UsuarioInsertDto) {
    const response = await apiClient.post<UsuarioDto>('/Usuario/socio/register', dto)
    return response.data
  },

  async updateSocio(idUsuario: number, dto: UsuarioUpdateDto) {
    const response = await apiClient.put<UsuarioDto>(`/Usuario/socio/${idUsuario}`, dto)
    return response.data
  },

  async darDeBajaSocio(idUsuario: number) {
    const response = await apiClient.patch<UsuarioDto>(`/Usuario/socio/${idUsuario}/baja`)
    return response.data
  },

  async deleteSocioDefinitivamente(idUsuario: number) {
    const response = await apiClient.delete<UsuarioDto>(`/Usuario/socio/${idUsuario}`)
    return response.data
  },

  async changeSocioPassword(idUsuario: number, dto: ChangePasswordRequestDto) {
    const response = await apiClient.post<string>(
      `/Auth/socio/${idUsuario}/change-password`,
      dto,
    )
    return response.data
  },
}
