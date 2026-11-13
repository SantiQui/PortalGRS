import { AccessLevel, ModuleId, RoleId, ScreenId } from '../types/srs';

export interface RoleOption {
  id: RoleId;
  label: string;
  shortLabel: string;
  defaultUserId: number;
  description: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'ADMIN',
    label: 'Admin',
    shortLabel: 'Admin',
    defaultUserId: 1,
    description: 'Control total de temporadas, cajas contables, usuarios y auditoría',
  },
  {
    id: 'TESORERO',
    label: 'Tesorero',
    shortLabel: 'Tesorero',
    defaultUserId: 2,
    description: 'Catálogo estacional, generación de cuotas, conciliación MP y ventanilla',
  },
  {
    id: 'COORDINADOR',
    label: 'Coordinador',
    shortLabel: 'Coordinador',
    defaultUserId: 3,
    description: 'Campañas de venta globales/locales y logística deportiva de temporada',
  },
  {
    id: 'MANAGER',
    label: 'Manager (M16)',
    shortLabel: 'Manager M16',
    defaultUserId: 4,
    description: 'Operación de M16 Juvenil: partidos, fichajes, efectivo y 3er Tiempo',
  },
  {
    id: 'COMISION',
    label: 'Comisión Directiva',
    shortLabel: 'Comisión',
    defaultUserId: 5,
    description: 'Asambleas semanales, noticias, ayuda al club y lectura de recaudación',
  },
  {
    id: 'JUGADOR',
    label: 'Jugador',
    shortLabel: 'Jugador',
    defaultUserId: 8, // Valentín Rossi (Plantel Superior, mayor de edad)
    description: 'Partidos, fichaje propio, ventas con Fondo Propio y Tercer Tiempo',
  },
  {
    id: 'SOCIO_TUTOR',
    label: 'Socio / Tutor (Padre)',
    shortLabel: 'Socio / Tutor',
    defaultUserId: 6, // Martín Quiroga (Padre de Mateo M16 y Benjamín M10)
    description: 'Grupo familiar (depende_de), carrito unificado MP y tareas de menores',
  },
  {
    id: 'PUBLICO_COMERCIO',
    label: 'Público / Comercio QR',
    shortLabel: 'Comercio QR',
    defaultUserId: 0,
    description: 'Acceso sin login para vista de voucher QR y redención única en comercio',
  },
];

// Matriz exacta de permisos según Sección 2.2 del SRS v2.1
export const RBAC_MATRIX: Record<ScreenId, Record<RoleId, AccessLevel>> = {
  home: {
    ADMIN: 'SI',
    TESORERO: 'SI',
    COORDINADOR: 'SI',
    MANAGER: 'SI',
    COMISION: 'SI',
    JUGADOR: 'SI',
    SOCIO_TUTOR: 'SI',
    PUBLICO_COMERCIO: 'NO',
  },
  cuotas_configurar: {
    ADMIN: 'SI',
    TESORERO: 'SI',
    COORDINADOR: 'NO',
    MANAGER: 'NO',
    COMISION: 'NO',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
  cuotas_generar: {
    ADMIN: 'SI',
    TESORERO: 'SI',
    COORDINADOR: 'NO',
    MANAGER: 'NO',
    COMISION: 'NO',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
  cuotas_pagos: {
    ADMIN: 'SI',
    TESORERO: 'SI',
    COORDINADOR: 'NO',
    MANAGER: 'NO',
    COMISION: 'LECTURA',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
  cuotas_pagar: {
    ADMIN: 'SI',
    TESORERO: 'SI',
    COORDINADOR: 'SI',
    MANAGER: 'SI',
    COMISION: 'SI',
    JUGADOR: 'SI',
    SOCIO_TUTOR: 'SI',
    PUBLICO_COMERCIO: 'NO',
  },
  ventas_configurar: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'SI',
    MANAGER: 'NO',
    COMISION: 'NO',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
  ventas_mis_ventas: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'LECTURA',
    MANAGER: 'LECTURA',
    COMISION: 'NO',
    JUGADOR: 'SI',
    SOCIO_TUTOR: 'SI_DEPENDE',
    PUBLICO_COMERCIO: 'NO',
  },
  ventas_vista_ticket: {
    ADMIN: 'SI',
    TESORERO: 'SI',
    COORDINADOR: 'SI',
    MANAGER: 'SI',
    COMISION: 'SI',
    JUGADOR: 'SI',
    SOCIO_TUTOR: 'SI',
    PUBLICO_COMERCIO: 'LINK_PUBLICO',
  },
  ventas_validar_ticket: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'SI',
    MANAGER: 'SI',
    COMISION: 'NO',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'COMERCIO',
  },
  dep_temporada: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'SI',
    MANAGER: 'LECTURA',
    COMISION: 'NO',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
  dep_config_partido: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'SI',
    MANAGER: 'SU_CAT',
    COMISION: 'NO',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
  dep_config_torneo: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'SI',
    MANAGER: 'SI',
    COMISION: 'NO',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
  dep_mis_partidos: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'NO',
    MANAGER: 'LECTURA',
    COMISION: 'NO',
    JUGADOR: 'SI',
    SOCIO_TUTOR: 'LECTURA',
    PUBLICO_COMERCIO: 'NO',
  },
  dep_fixture: {
    ADMIN: 'SI',
    TESORERO: 'SI',
    COORDINADOR: 'SI',
    MANAGER: 'SI',
    COMISION: 'SI',
    JUGADOR: 'SI',
    SOCIO_TUTOR: 'SI',
    PUBLICO_COMERCIO: 'NO',
  },
  dep_config_fichajes: {
    ADMIN: 'SI',
    TESORERO: 'SI',
    COORDINADOR: 'NO',
    MANAGER: 'SU_CAT',
    COMISION: 'NO',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
  dep_mis_fichajes: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'NO',
    MANAGER: 'LECTURA',
    COMISION: 'NO',
    JUGADOR: 'SI',
    SOCIO_TUTOR: 'SI_DEPENDE',
    PUBLICO_COMERCIO: 'NO',
  },
  tt_configurar: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'NO',
    MANAGER: 'SU_CAT',
    COMISION: 'NO',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
  tt_mis_tercer_tiempo: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'NO',
    MANAGER: 'SU_CAT',
    COMISION: 'NO',
    JUGADOR: 'SI',
    SOCIO_TUTOR: 'SI_ES_MENOR',
    PUBLICO_COMERCIO: 'NO',
  },
  club_institucional: {
    ADMIN: 'SI',
    TESORERO: 'SI',
    COORDINADOR: 'SI',
    MANAGER: 'SI',
    COMISION: 'SI',
    JUGADOR: 'SI',
    SOCIO_TUTOR: 'SI',
    PUBLICO_COMERCIO: 'NO',
  },
  club_abm: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'NO',
    MANAGER: 'NO',
    COMISION: 'SI',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
  admin_config: {
    ADMIN: 'SI',
    TESORERO: 'NO',
    COORDINADOR: 'NO',
    MANAGER: 'NO',
    COMISION: 'NO',
    JUGADOR: 'NO',
    SOCIO_TUTOR: 'NO',
    PUBLICO_COMERCIO: 'NO',
  },
};

export interface NavScreenItem {
  id: ScreenId;
  label: string;
}

export interface NavModuleConfig {
  id: ModuleId;
  label: string;
  screens: NavScreenItem[];
}

export const SIDEBAR_MODULES: NavModuleConfig[] = [
  {
    id: 'general',
    label: 'General',
    screens: [{ id: 'home', label: 'Home (Dashboard)' }],
  },
  {
    id: 'cuotas',
    label: 'Cuotas',
    screens: [
      { id: 'cuotas_configurar', label: 'Configurar Cuotas' },
      { id: 'cuotas_generar', label: 'Generar Cuotas' },
      { id: 'cuotas_pagos', label: 'Ver Pagos y Cobrar' },
      { id: 'cuotas_pagar', label: 'Ver Cuotas a Pagar' },
    ],
  },
  {
    id: 'ventas',
    label: 'Ventas',
    screens: [
      { id: 'ventas_configurar', label: 'Configurar Ventas' },
      { id: 'ventas_mis_ventas', label: 'Mis Ventas y Detalle' },
      { id: 'ventas_vista_ticket', label: 'Vista Ticket (QR)' },
      { id: 'ventas_validar_ticket', label: 'Validar Ticket (Comercio)' },
    ],
  },
  {
    id: 'deportivo',
    label: 'Deportivo',
    screens: [
      { id: 'dep_temporada', label: 'Gestión de Temporada' },
      { id: 'dep_config_partido', label: 'Configurar Partido' },
      { id: 'dep_config_torneo', label: 'Configurar Torneo' },
      { id: 'dep_mis_partidos', label: 'Mis Partidos' },
      { id: 'dep_fixture', label: 'Fixture General' },
      { id: 'dep_config_fichajes', label: 'Configurar Fichajes' },
      { id: 'dep_mis_fichajes', label: 'Mis Fichajes' },
    ],
  },
  {
    id: 'tercer_tiempo',
    label: 'Tercer Tiempo',
    screens: [
      { id: 'tt_configurar', label: 'Configurar Tercer Tiempo' },
      { id: 'tt_mis_tercer_tiempo', label: 'Mis Tercer Tiempo' },
    ],
  },
  {
    id: 'club',
    label: 'Club',
    screens: [
      { id: 'club_institucional', label: 'Ayuda, Asambleas y Noticias' },
      { id: 'club_abm', label: 'Configuración ABM Club' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    screens: [{ id: 'admin_config', label: 'Panel de Administración' }],
  },
];

export function hasScreenAccess(role: RoleId, screen: ScreenId): boolean {
  return RBAC_MATRIX[screen]?.[role] !== 'NO';
}

export function getScreenAccessLevel(role: RoleId, screen: ScreenId): AccessLevel {
  return RBAC_MATRIX[screen]?.[role] ?? 'NO';
}

export function getAccessLabel(level: AccessLevel): string {
  switch (level) {
    case 'SI':
      return 'Control Total';
    case 'LECTURA':
      return 'Solo Lectura';
    case 'SU_CAT':
      return 'Su Categoría';
    case 'SI_DEPENDE':
      return 'Por Dependencia';
    case 'SI_ES_MENOR':
      return 'Si Es Menor';
    case 'LINK_PUBLICO':
      return 'Link Público';
    case 'COMERCIO':
      return 'Comercio';
    default:
      return 'Sin Acceso';
  }
}
