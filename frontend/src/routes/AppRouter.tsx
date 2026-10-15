import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { AuditoriaPage } from '../pages/AuditoriaPage'
import { BlogPage } from '../pages/BlogPage'
import { ContactoPage } from '../pages/ContactoPage'
import { EjerciciosPage } from '../pages/EjerciciosPage'
import { EquipamientosPage } from '../pages/EquipamientosPage'
import { FuncionalidadesPage } from '../pages/FuncionalidadesPage'
import { GimnasioPage } from '../pages/GimnasioPage'
import { GestionRutinasPage } from '../pages/GestionRutinasPage'
import { GymOnboardingPage } from '../pages/GymOnboardingPage'
import { InicioPage } from '../pages/InicioPage'
import { LandingPage } from '../pages/LandingPage'
import { MaquinasPage } from '../pages/MaquinasPage'
import { MiSuscripcionPage } from '../pages/MiSuscripcionPage'
import { PagoPage } from '../pages/PagoPage'
import { PermisosPage } from '../pages/PermisosPage'
import { PreciosPage } from '../pages/PreciosPage'
import { RangosHorariosPage } from '../pages/RangosHorariosPage'
import { ReportesPage } from '../pages/ReportesPage'
import { ResponsableProfilePage } from '../pages/ResponsableProfilePage'
import { ResponsableSupportPage } from '../pages/ResponsableSupportPage'
import { SociosPage } from '../pages/SociosPage'
import { TestimoniosPage } from '../pages/TestimoniosPage'
import { UsuariosPage } from '../pages/UsuariosPage'
import { ChangePasswordPage } from '../pages/auth/ChangePasswordPage'
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage'
import { LoginPage } from '../pages/auth/LoginPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { SocioInicioPage } from '../pages/socio/SocioInicioPage'
import { SocioRutinasPage } from '../pages/socio/SocioRutinasPage'
import { getAuthenticatedHomePath } from '../utils/authRoles'
import { ProtectedRoute } from './ProtectedRoute'

function FallbackRoute() {
  const { isAuthenticated, isHydrated, session } = useAuth()

  if (!isHydrated) {
    return null
  }

  return <Navigate to={isAuthenticated ? getAuthenticatedHomePath(session) : '/login'} replace />
}

export function AppRouter() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/funcionalidades" element={<FuncionalidadesPage />} />
        <Route path="/precios" element={<PreciosPage />} />
        <Route path="/pago" element={<PagoPage />} />
        <Route path="/testimonios" element={<TestimoniosPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/contacto" element={<ContactoPage />} />
        <Route path="/registro-gym" element={<GymOnboardingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<InicioPage />} />
          <Route path="/dashboard/mi-perfil" element={<ResponsableProfilePage />} />
          <Route path="/dashboard/soporte" element={<ResponsableSupportPage />} />
          <Route path="/dashboard/cambiar-contrasena" element={<ChangePasswordPage />} />
          <Route path="/socio/inicio" element={<SocioInicioPage />} />
          <Route path="/socio/inicio/info-personal" element={<SocioInicioPage />} />
          <Route path="/socio/inicio/facturacion" element={<SocioInicioPage />} />
          <Route path="/socio/inicio/perfil-ia" element={<SocioInicioPage />} />
          <Route path="/socio/inicio/cambiar-contrasena" element={<SocioInicioPage />} />
          <Route path="/socio/rutinas" element={<SocioRutinasPage />} />
          <Route path="/rutinas" element={<GestionRutinasPage />} />
          <Route path="/socios" element={<SociosPage />} />
          <Route path="/socios/agregar" element={<SociosPage />} />
          <Route path="/socios/:idUsuario/consultar" element={<SociosPage />} />
          <Route path="/socios/:idUsuario/turnos" element={<SociosPage />} />
          <Route path="/gimnasio" element={<GimnasioPage />} />
          <Route path="/gimnasio/usuarios" element={<UsuariosPage />} />
          <Route path="/gimnasio/permisos" element={<PermisosPage />} />
          <Route path="/gimnasio/equipamientos" element={<EquipamientosPage />} />
          <Route path="/gimnasio/maquinas" element={<MaquinasPage />} />
          <Route path="/gimnasio/ejercicios" element={<EjerciciosPage />} />
          <Route path="/gimnasio/rangos-horarios" element={<RangosHorariosPage />} />
          <Route path="/gimnasio/auditoria" element={<AuditoriaPage />} />
          <Route path="/gimnasio/reportes" element={<ReportesPage />} />
          <Route path="/gimnasio/mi-suscripcion" element={<MiSuscripcionPage />} />
        </Route>
        <Route path="*" element={<FallbackRoute />} />
      </Routes>
    </div>
  )
}
