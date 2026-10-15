export type GymOnboardingGender = 'Masculino' | 'Femenino' | 'Otro' | 'NoEspecifica'

export interface GymOnboardingRequest {
  nombreGym: string
  paypalSubscriptionId: string
  usuarioMaster: {
    username: string
    password: string
    personaResponsable: {
      nombre: string
      apellido: string
      email: string
      telefono: string
      direccion: string
      ciudad: string
      tipoDocumento: string
      nroDocumento: string
      genero: GymOnboardingGender
      fechaNacimiento: string
    }
  }
}

export interface GymOnboardingResponse {
  mensaje: string
  idGym: number
}
