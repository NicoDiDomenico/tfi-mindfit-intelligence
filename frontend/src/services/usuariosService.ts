import type {
  ChangePasswordRequestDto,
  GrupoDto,
  ResponsableGridDto,
  UsuarioResponsableDto,
  UsuarioResponsableInsertDto,
  UsuarioResponsableUpdateDto,
} from '../types/usuario'
import { apiClient } from './apiClient'

export const usuariosService = {
  async getResponsablesGrid() {
    const response = await apiClient.get<ResponsableGridDto[]>('/Usuario/grilla-responsable')
    return response.data
  },

  async getGrupos() {
    const response = await apiClient.get<GrupoDto[]>('/Grupo')
    return response.data
  },

  async getUsuarioById(idUsuario: number) {
    const response = await apiClient.get<UsuarioResponsableDto>(`/Usuario/${idUsuario}`)
    return response.data
  },

  async registerResponsable(dto: UsuarioResponsableInsertDto) {
    const response = await apiClient.post<UsuarioResponsableDto>(
      '/Usuario/responsable/register',
      dto,
    )
    return response.data
  },

  async updateResponsable(idUsuario: number, dto: UsuarioResponsableUpdateDto) {
    const response = await apiClient.put<UsuarioResponsableDto>(
      `/Usuario/responsable/${idUsuario}`,
      dto,
    )
    return response.data
  },

  async deleteResponsable(idUsuario: number) {
    const response = await apiClient.delete<UsuarioResponsableDto>(
      `/Usuario/responsable/${idUsuario}`,
    )
    return response.data
  },

  async changeResponsablePassword(idUsuario: number, dto: ChangePasswordRequestDto) {
    const response = await apiClient.post<string>(
      `/Auth/responsables/${idUsuario}/change-password`,
      dto,
    )
    return response.data
  },
}
