export type RoleId =
  | 'ADMIN'
  | 'TESORERO'
  | 'COORDINADOR'
  | 'MANAGER'
  | 'COMISION'
  | 'JUGADOR'
  | 'SOCIO_TUTOR'
  | 'PUBLICO_COMERCIO';

export type ModuleId =
  | 'general'
  | 'cuotas'
  | 'ventas'
  | 'deportivo'
  | 'tercer_tiempo'
  | 'club'
  | 'admin';

export type ScreenId =
  | 'home'
  | 'cuotas_configurar'
  | 'cuotas_generar'
  | 'cuotas_pagos'
  | 'cuotas_pagar'
  | 'ventas_configurar'
  | 'ventas_mis_ventas'
  | 'ventas_vista_ticket'
  | 'ventas_validar_ticket'
  | 'dep_temporada'
  | 'dep_config_partido'
  | 'dep_config_torneo'
  | 'dep_mis_partidos'
  | 'dep_fixture'
  | 'dep_config_fichajes'
  | 'dep_mis_fichajes'
  | 'tt_configurar'
  | 'tt_mis_tercer_tiempo'
  | 'club_institucional'
  | 'club_abm'
  | 'admin_config';

export type AccessLevel =
  | 'SI'
  | 'LECTURA'
  | 'SU_CAT'
  | 'SI_DEPENDE'
  | 'SI_ES_MENOR'
  | 'LINK_PUBLICO'
  | 'COMERCIO'
  | 'NO';

export interface Usuario {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  email: string; // NOT NULL - Obligatorio
  telefono_whatsapp: string | null; // Opcional
  notificar_whatsapp: boolean;
  fecha_nacimiento: string;
  depende_de_dni: string | null;
  saldo_fondo_propio: number;
  activo: boolean;
  roles: RoleId[];
  cuotas_asignadas_ids: number[];
}

export type EstadoTemporada = 'EN_CURSO' | 'CERRADA' | 'PLANIFICACION';

export interface Temporada {
  id: number;
  anio: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoTemporada;
}

export type BloqueDeportivo = 'INFANTIL' | 'JUVENIL' | 'MAYOR';

export interface Categoria {
  id: number;
  nombre: string; // M10 Infantil, M16 Juvenil, Plantel Superior
  bloque_deportivo: BloqueDeportivo;
  es_menor_edad: boolean;
  codigo_caja_contable: string;
  managers_habilitados_ids: number[];
}

export type RolEnTemporada = 'JUGADOR' | 'ENTRENADOR' | 'MANAGER' | 'PREPARADOR_FISICO';

export interface TemporadaMiembroCategoria {
  id: number;
  temporada_id: number;
  categoria_id: number;
  usuario_id: number;
  rol_en_temporada: RolEnTemporada;
  fecha_alta: string;
  activo: boolean;
}

export interface TemporadaReferee {
  id: number;
  temporada_id: number;
  nombre_completo: string;
  dni: string;
  telefono: string;
  union_origen: string;
  activo: boolean;
}

export interface Torneo {
  id: number;
  temporada_id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  clubes_participantes: string[];
  categorias_ids: number[];
  es_local: boolean;
}

export interface IncidenciaPartido {
  id: string;
  tipo: 'TRY' | 'CONVERSION' | 'PENAL' | 'AMARILLA' | 'ROJA' | 'CAMBIO' | 'LESION_CONMOCION';
  minuto: number;
  jugador_nombre: string;
  detalle: string;
}

export interface Partido {
  id: number;
  temporada_id: number;
  torneo_id: number | null;
  categoria_id: number;
  referee_id: number | null;
  rival: string;
  condicion: 'LOCAL' | 'VISITANTE';
  fecha_hora: string;
  cancha: string;
  resultado_local: number | null;
  resultado_visitante: number | null;
  estado: 'PROGRAMADO' | 'FINALIZADO';
  citados_ids: number[];
  cuerpo_tecnico_ids: number[];
  incidencias: IncidenciaPartido[];
}

export type EstadoHabilitacion = 'PENDIENTE_APTO' | 'HABILITADO' | 'VENCIDO';

export interface Fichaje {
  id: number;
  temporada_id: number;
  jugador_id: number;
  categoria_id: number;
  apto_medico_archivo: string | null;
  fecha_vencimiento_apto: string | null;
  estado_habilitacion: EstadoHabilitacion;
  monto_anual: number;
  cuotas_totales: number;
  cuotas_pagas: number;
  monto_pendiente: number;
}

export interface CuotaConfigCabecera {
  id: number;
  temporada_id: number;
  nombre_configuracion: string;
  descuento_grupo_familiar_pct: number;
  descuento_anual_anticipado_pct: number;
  vigente: boolean;
}

export type CodigoCuota = 'CS-M' | 'CSG-M' | 'CS-A' | 'CSG-A' | 'CD-MYJ' | 'CD-INF';

export interface CuotaConfigDetalle {
  id: number;
  cabecera_id: number;
  codigo: CodigoCuota;
  descripcion: string;
  codigo_caja_contable: string;
  naturaleza: 'SOCIETARIA' | 'DEPORTIVA';
  es_grupal: boolean;
  periodicidad: 'MENSUAL' | 'ANUAL';
  monto: number;
  meses_activos: number[]; // 1..12
  activa: boolean;
}

export interface CoberturaAnualSocio {
  id: number;
  anio: number;
  titular_dni: string;
  usuario_beneficiario_id: number;
  cuota_anual_emitida_id: number | null;
  activo: boolean;
}

export type EstadoCuotaEmitida = 'PENDIENTE' | 'PAGADA' | 'EXENTA_POR_ANUAL' | 'ANULADA';

export interface CuotaEmitida {
  id: number;
  cuota_detalle_id: number;
  usuario_id: number;
  responsable_pago_dni: string;
  anio: number;
  mes: number | null;
  monto_original: number;
  descuento_aplicado: number;
  monto_final: number;
  estado: EstadoCuotaEmitida;
  orden_pago_mp_id: number | null;
  fecha_pago: string | null;
}

export type TipoObligacion = 'CUOTA' | 'FICHAJE' | 'VENTA' | 'TERCER_TIEMPO';

export interface OrdenPagoMPItem {
  id: number;
  orden_pago_mp_id: number;
  tipo_obligacion: TipoObligacion;
  obligacion_id: number;
  descripcion: string;
  monto_aplicado: number;
  codigo_caja_contable: string;
}

export interface OrdenPagoMP {
  id: number;
  external_reference: string;
  pagador_usuario_id: number;
  monto_total: number;
  comision_mp: number;
  monto_neto: number;
  mp_preference_id: string;
  mp_payment_id: string | null;
  mp_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  fecha_creacion: string;
  fecha_aprobacion: string | null;
  items: OrdenPagoMPItem[];
}

export interface VentaCampania {
  id: number;
  temporada_id: number;
  titulo: string;
  descripcion: string;
  tipo_alcance: 'GLOBAL' | 'LOCAL';
  categorias_ids: number[];
  destino_ganancia: 'CLUB' | 'CATEGORIA' | 'FONDO_JUGADOR';
  valor_unitario: number;
  porcentaje_ganancia: number;
  minimo_unidades: number;
  fecha_limite: string;
  flyer_texto: string;
  simular_vencida: boolean;
}

export interface VentaDeclaracion {
  id: number;
  venta_id: number;
  jugador_id: number;
  cantidad_declarada: number;
  multa_minimo_generada: boolean;
  monto_multa: number;
  estado_pago: 'PENDIENTE' | 'PENDIENTE_RECEPCION_EFECTIVO' | 'PAGADA';
}

export interface VentaTicketQR {
  id: number;
  declaracion_id: number;
  venta_id: number;
  token_hash: string;
  nombre_comprador: string;
  estado: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';
  fecha_emision: string;
  fecha_entrega: string | null;
}

export interface TercerTiempoChecklist {
  id: number;
  tercer_tiempo_id: number;
  tarea_descripcion: string;
  cupo_requerido: number;
  usuarios_asignados_ids: number[];
}

export interface TercerTiempo {
  id: number;
  temporada_id: number;
  partido_id: number | null;
  torneo_id: number | null;
  categoria_id: number;
  titulo: string;
  fecha: string;
  monto_por_jugador: number;
  estado: 'ABIERTO' | 'LIQUIDADO';
  checklist: TercerTiempoChecklist[];
  pagos_jugadores_ids: number[]; // usuario_ids who already settled
}

export type MedioPago = 'MERCADO_PAGO' | 'EFECTIVO' | 'FONDO_PROPIO';
export type EstadoValidacionPago =
  | 'APROBADO_AUTOMATICO'
  | 'PENDIENTE_RECEPCION_EFECTIVO'
  | 'EFECTIVO_RECIBIDO';

export interface PagoTransaccion {
  id: number;
  origen_tipo: TipoObligacion;
  origen_id: number;
  descripcion: string;
  orden_pago_mp_id: number | null;
  usuario_id: number;
  monto: number;
  comision_mp: number;
  monto_neto: number;
  medio_pago: MedioPago;
  receptor_efectivo_id: number | null;
  validado_por_admin_id: number | null;
  codigo_caja_contable: string;
  estado_validacion: EstadoValidacionPago;
  fecha: string;
}

export interface FondoPropioMovimiento {
  id: number;
  usuario_id: number;
  tipo: 'ACREDITACION_VENTA' | 'DEBITO_FICHAJE' | 'DEBITO_TERCER_TIEMPO' | 'AJUSTE_SIMULACION';
  descripcion: string;
  monto: number;
  saldo_resultante: number;
  fecha: string;
}

export interface NotificacionLog {
  id: number;
  usuario_id: number;
  destinatario: string;
  canal: 'EMAIL' | 'WHATSAPP';
  asunto: string;
  fecha: string;
  estado: 'ENVIADO' | 'OMITIDO_SIN_OPTIN';
}

export interface ClubEventoAyuda {
  id: number;
  titulo: string;
  fecha: string;
  lugar: string;
  descripcion: string;
  cupo: number;
  inscriptos_ids: number[];
}

export interface ClubAsamblea {
  id: number;
  titulo: string;
  fecha: string;
  autor: string;
  temas: string[];
  minuta: string;
}

export interface ClubNoticia {
  id: number;
  titulo: string;
  fecha: string;
  categoria: string;
  resumen: string;
  contenido: string;
}

export interface ConfigGlobalMP {
  mp_public_key: string;
  mp_access_token_masked: string;
  webhook_ipn_url: string;
  comision_mp_pct: number;
  smtp_host: string;
  smtp_from: string;
  whatsapp_api_enabled: boolean;
  whatsapp_provider: string;
  club_nombre: string;
  club_cuit: string;
  club_ciudad: string;
}

export interface CheckoutItemRequest {
  tipo_obligacion: TipoObligacion;
  obligacion_id: number;
  descripcion: string;
  monto: number;
  codigo_caja_contable: string;
  meta?: {
    venta_declaracion_id?: number;
    destino_ganancia?: 'CLUB' | 'CATEGORIA' | 'FONDO_JUGADOR';
    jugador_id?: number;
    ganancia_monto?: number;
    fichaje_id?: number;
    tercer_tiempo_id?: number;
    es_cuota_anual?: boolean;
    titular_dni?: string;
  };
}

export type CriticalAlertKind =
  | 'PARTIDO_PROXIMO'
  | 'CUOTA_VENCIDA'
  | 'CONFIRMACION_PAGO'
  | 'APTO_MEDICO'
  | 'EFECTIVO_PENDIENTE';

export interface CriticalAlertItem {
  id: string;
  kind: CriticalAlertKind;
  eventLabel: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  categoryTag: string;
  targetScreen: ScreenId;
  actionLabel: string;
}

export interface UserActivityLog {
  id: string;
  usuario_id: number;
  categoria: 'Pago' | 'Fondo Propio' | 'Venta QR' | 'Deportivo' | 'Gestión';
  titulo: string;
  descripcion: string;
  fecha: string;
  monto?: number;
  tone: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
  estado_label: string;
}


