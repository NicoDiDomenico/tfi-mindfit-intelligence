import type { PermissionNavigationItem } from '../../utils/navigationPermissions'
import type { GimnasioMenuIconName } from './GimnasioMenuIcon'

export interface GimnasioMenuItemConfig extends PermissionNavigationItem {
  description: string
  icon: GimnasioMenuIconName
}

export const gimnasioMenuItems: readonly GimnasioMenuItemConfig[] = [
  {
    key: 'usuarios',
    label: 'Usuarios',
    description: 'Alta, edición y baja de responsables.',
    path: '/gimnasio/usuarios',
    icon: 'usuarios',
    permissionCodes: [
      'CREAR_USUARIO_RESPONSABLE',
      'EDITAR_USUARIO_RESPONSABLE',
      'ELIMINAR_USUARIO_RESPONSABLE_DEFINITIVAMENTE',
    ],
  },
  {
    key: 'permisos',
    label: 'Permisos',
    description: 'Gestión de grupos y accesos.',
    path: '/gimnasio/permisos',
    icon: 'permisos',
    permissionCodes: ['CREAR_GRUPO', 'EDITAR_GRUPO', 'ELIMINAR_GRUPO'],
  },
  {
    key: 'equipamientos',
    label: 'Equipamientos',
    description: 'Elementos disponibles del gimnasio.',
    path: '/gimnasio/equipamientos',
    icon: 'equipamientos',
    permissionCodes: ['CREAR_EQUIPAMIENTO', 'EDITAR_EQUIPAMIENTO', 'ELIMINAR_EQUIPAMIENTO'],
  },
  {
    key: 'maquinas',
    label: 'Máquinas',
    description: 'Inventario operativo de máquinas.',
    path: '/gimnasio/maquinas',
    icon: 'maquinas',
    permissionCodes: ['CREAR_MAQUINA', 'EDITAR_MAQUINA', 'ELIMINAR_MAQUINA'],
  },
  {
    key: 'ejercicios',
    label: 'Ejercicios',
    description: 'Base de ejercicios para rutinas.',
    path: '/gimnasio/ejercicios',
    icon: 'ejercicios',
    permissionCodes: ['CREAR_EJERCICIO', 'EDITAR_EJERCICIO', 'ELIMINAR_EJERCICIO'],
  },
  {
    key: 'rangos-horarios',
    label: 'Rangos Horarios',
    description: 'Días, horarios y entrenadores.',
    path: '/gimnasio/rangos-horarios',
    icon: 'rangos-horarios',
    permissionCodes: ['MODIFICAR_DIA_RH', 'QUITAR_ENTRENADOR_DIA_RH'],
  },
  {
    key: 'auditoria',
    label: 'Auditoría',
    description: 'Trazabilidad, sesiones y reportes del sistema.',
    path: '/gimnasio/auditoria',
    icon: 'auditoria',
    permissionCodes: ['VER_AUDITORIA'],
  },
  {
    key: 'reportes',
    label: 'Reportes',
    description: 'Indicadores para tomar decisiones del gimnasio.',
    path: '/gimnasio/reportes',
    icon: 'reportes',
    permissionCodes: ['VER_REPORTES_GIMNASIO'],
  },
  {
    key: 'mi-suscripcion',
    label: 'Mi suscripcion',
    description: 'Estado y proximo cobro de PayPal.',
    path: '/gimnasio/mi-suscripcion',
    icon: 'suscripcion',
    permissionCodes: ['VER_MI_SUSCRIPCION'],
  },
] as const
