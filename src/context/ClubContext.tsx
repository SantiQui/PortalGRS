import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasScreenAccess, ROLE_OPTIONS } from '../config/rbac';
import { ClubState, createInitialClubState } from '../data/seedData';
import {
  Categoria,
  CheckoutItemRequest,
  ClubAsamblea,
  ClubEventoAyuda,
  ClubNoticia,
  ConfigGlobalMP,
  CriticalAlertItem,
  CriticalAlertKind,
  CuotaConfigDetalle,
  CuotaEmitida,
  IncidenciaPartido,
  OrdenPagoMP,
  PagoTransaccion,
  Partido,
  RoleId,
  RolEnTemporada,
  ScreenId,
  Temporada,
  TemporadaReferee,
  TercerTiempo,
  Torneo,
  UserActivityLog,
  Usuario,
  VentaCampania,
} from '../types/srs';
import {
  formatARS,
  formatDateAR,
  formatDateTimeAR,
  generateTokenHash,
  generateUUID,
  MESES_NOMBRES,
} from '../utils/format';

const STORAGE_KEY = 'guaycurues_srs_v21_state_v1';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
  category?: string;
  actionLabel?: string;
  targetScreen?: ScreenId;
  timestamp?: string;
}

interface PendingCheckoutModal {
  pagadorUsuarioId: number;
  items: CheckoutItemRequest[];
  externalReference: string;
  mpPreferenceId: string;
}

interface ClubContextValue {
  state: ClubState;
  activeRole: RoleId;
  activeUser: Usuario;
  activeTemporadaId: number;
  activeTemporada: Temporada;
  activeScreen: ScreenId;
  sidebarPinned: boolean;
  mobileMenuOpen: boolean;
  selectedTicketToken: string | null;
  pendingCheckout: PendingCheckoutModal | null;
  toasts: ToastMessage[];

  // Simulation bar helpers
  simulatedWalletUserId: number;
  simulatedWalletBalance: number;
  isAnualidadSimActive: boolean;

  setActiveRole: (role: RoleId) => void;
  setActiveUserId: (userId: number) => void;
  setActiveTemporadaId: (temporadaId: number) => void;
  setActiveScreen: (screen: ScreenId) => void;
  setSidebarPinned: (pinned: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSelectedTicketToken: (token: string | null) => void;
  toggleFondoPropioSim: () => void;
  toggleAnualidadSim: () => void;
  resetDemo: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearToasts: () => void;

  // Notification Panel & Critical Alerts
  criticalAlerts: CriticalAlertItem[];
  readAlertIds: string[];
  unreadAlertCount: number;
  notificationPanelOpen: boolean;
  setNotificationPanelOpen: (open: boolean) => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  triggerAlertToast: (alert: CriticalAlertItem) => void;
  triggerAllCriticalAlerts: (kinds?: CriticalAlertKind[]) => void;
  simulateCriticalEvent: (kind: 'PARTIDO_PROXIMO' | 'CUOTA_VENCIDA' | 'CONFIRMACION_PAGO') => void;

  // Helpers
  isUserCoveredByAnualidad: (usuarioId: number, anio?: number) => boolean;
  getUserCategoriesInTemporada: (usuarioId: number, temporadaId?: number) => Categoria[];
  getManagersForCategoria: (categoriaId: number) => Usuario[];
  getDependantsOf: (titularDni: string) => Usuario[];

  // Checkout MP & Payments
  openMercadoPagoCheckout: (items: CheckoutItemRequest[], pagadorUsuarioId?: number) => void;
  closeMercadoPagoCheckout: () => void;
  confirmMercadoPagoPayment: () => void;
  cobrarCuotasEfectivoTesorero: (cuotaIds: number[]) => void;
  registrarPagoEfectivoManager: (params: {
    origenTipo: 'VENTA' | 'FICHAJE' | 'TERCER_TIEMPO';
    origenId: number;
    descripcion: string;
    usuarioId: number;
    monto: number;
    receptorEfectivoId: number;
    codigoCajaContable: string;
  }) => void;
  confirmarRecepcionEfectivo: (transaccionId: number) => void;
  pagarConFondoPropio: (params: {
    origenTipo: 'FICHAJE' | 'TERCER_TIEMPO';
    origenId: number;
    descripcion: string;
    usuarioId: number;
    monto: number;
    codigoCajaContable: string;
  }) => boolean;

  // Cuotas
  upsertCuotaDetalle: (detalle: Omit<CuotaConfigDetalle, 'id'> & { id?: number }) => void;
  deleteCuotaDetalle: (id: number) => void;
  updateCuotasCabecera: (descuentoFamiliar: number, descuentoAnual: number) => void;
  generarCuotasPeriodo: (mes: number, anio: number, enviarWhatsapp: boolean) => { generadas: number; exentas: number; omitidasPorCalendario: number };
  editarCuotaEmitida: (cuotaId: number, nuevoMonto: number, nuevoEstado: CuotaEmitida['estado']) => void;

  // Ventas
  crearCampaniaVenta: (campania: Omit<VentaCampania, 'id'>) => void;
  declararVentas: (ventaId: number, jugadorId: number, cantidadNueva: number, nombresCompradores?: string[]) => void;
  toggleSimularFechaVencida: (ventaId: number) => void;
  canjearTicketQR: (tokenHash: string) => { ok: boolean; status: 'SUCCESS' | 'ALREADY_REDEEMED' | 'NOT_FOUND'; message: string };

  // Deportivo BD.UAR
  crearTemporada: (temp: Omit<Temporada, 'id'>) => void;
  cambiarEstadoTemporada: (temporadaId: number, estado: Temporada['estado']) => void;
  asignarMiembroTemporada: (categoriaId: number, usuarioId: number, rol: RolEnTemporada) => void;
  agregarReferee: (ref: Omit<TemporadaReferee, 'id'>) => void;
  crearPartido: (partido: Omit<Partido, 'id' | 'incidencias' | 'estado' | 'resultado_local' | 'resultado_visitante'>) => void;
  cargarPlanillaPostPartido: (
    partidoId: number,
    data: {
      resultado_local: number;
      resultado_visitante: number;
      referee_id: number | null;
      citados_ids: number[];
      cuerpo_tecnico_ids: number[];
      incidencias: IncidenciaPartido[];
    }
  ) => void;
  crearTorneo: (torneo: Omit<Torneo, 'id'>) => void;
  actualizarAptoMedico: (fichajeId: number, archivo: string, fechaVencimiento: string) => void;
  actualizarValorFichajeCategoria: (categoriaId: number, montoAnual: number, cuotasTotales: number) => void;

  // Tercer Tiempo
  crearTercerTiempo: (tt: Omit<TercerTiempo, 'id' | 'pagos_jugadores_ids' | 'checklist'>, tareas: { tarea_descripcion: string; cupo_requerido: number }[]) => void;
  toggleInscripcionChecklistTT: (tercerTiempoId: number, checklistId: number, usuarioId: number) => void;
  liquidarTercerTiempo: (tercerTiempoId: number, nuevoMonto: number) => void;

  // Club
  toggleInscripcionAyuda: (eventoId: number, usuarioId: number) => void;
  crearEventoAyuda: (ev: Omit<ClubEventoAyuda, 'id' | 'inscriptos_ids'>) => void;
  eliminarEventoAyuda: (id: number) => void;
  crearAsamblea: (asamblea: Omit<ClubAsamblea, 'id'>) => void;
  eliminarAsamblea: (id: number) => void;
  crearNoticia: (noticia: Omit<ClubNoticia, 'id'>) => void;
  eliminarNoticia: (id: number) => void;

  // Admin
  toggleUsuarioRol: (usuarioId: number, role: RoleId) => void;
  upsertCategoria: (cat: Omit<Categoria, 'id'> & { id?: number }) => void;
  updateConfigGlobal: (cfg: ConfigGlobalMP) => void;
}

const ClubContext = createContext<ClubContextValue | null>(null);

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ClubState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved) as ClubState;
      }
    } catch {
      // Fallback to seed data
    }
    return createInitialClubState();
  });

  const [activeRole, setActiveRoleState] = useState<RoleId>('SOCIO_TUTOR');
  const [activeUserId, setActiveUserId] = useState<number>(6); // Martín Quiroga
  const [activeTemporadaId, setActiveTemporadaId] = useState<number>(2026);
  const [activeScreen, setActiveScreenState] = useState<ScreenId>('home');
  const [sidebarPinned, setSidebarPinned] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [selectedTicketToken, setSelectedTicketToken] = useState<string | null>('GQR-M16A94K2');
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckoutModal | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<string[]>([]);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const enriched: ToastMessage = {
      ...toast,
      id,
      timestamp:
        toast.timestamp ??
        new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    };
    setToasts((prev) => [...prev.slice(-4), enriched]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const activeUser = useMemo(() => {
    return (
      state.usuarios.find((u) => u.id === activeUserId) ??
      state.usuarios[0]
    );
  }, [state.usuarios, activeUserId]);

  const activeTemporada = useMemo(() => {
    return (
      state.temporadas.find((t) => t.id === activeTemporadaId) ??
      state.temporadas[0]
    );
  }, [state.temporadas, activeTemporadaId]);

  const setActiveRole = useCallback(
    (role: RoleId) => {
      setActiveRoleState(role);
      const roleInfo = ROLE_OPTIONS.find((r) => r.id === role);
      if (role === 'PUBLICO_COMERCIO') {
        setActiveScreenState((prev) =>
          prev === 'ventas_validar_ticket' ? 'ventas_validar_ticket' : 'ventas_vista_ticket'
        );
        return;
      }
      if (roleInfo && roleInfo.defaultUserId > 0) {
        setActiveUserId(roleInfo.defaultUserId);
      }
      setActiveScreenState((prev) => (hasScreenAccess(role, prev) ? prev : 'home'));
    },
    []
  );

  const setActiveScreen = useCallback(
    (screen: ScreenId) => {
      if (!hasScreenAccess(activeRole, screen)) {
        addToast({
          type: 'warning',
          title: 'Acceso restringido por RBAC',
          description: `El rol activo no posee permisos sobre esta pantalla.`,
        });
        return;
      }
      setActiveScreenState(screen);
      setMobileMenuOpen(false);
    },
    [activeRole, addToast]
  );

  // Simulation bar targets:
  // Wallet simulation targets Valentín Rossi (id: 8) if Jugador, or Mateo Quiroga (id: 7) if Socio/Tutor, else Valentín Rossi (8)
  const simulatedWalletUserId = useMemo(() => {
    if (activeRole === 'JUGADOR') return activeUser.id;
    if (activeRole === 'SOCIO_TUTOR') return 7; // Mateo Quiroga (M16)
    return 8; // Valentín Rossi
  }, [activeRole, activeUser.id]);

  const simulatedWalletBalance = useMemo(() => {
    return state.usuarios.find((u) => u.id === simulatedWalletUserId)?.saldo_fondo_propio ?? 0;
  }, [state.usuarios, simulatedWalletUserId]);

  const isUserCoveredByAnualidad = useCallback(
    (usuarioId: number, anio = 2026): boolean => {
      const user = state.usuarios.find((u) => u.id === usuarioId);
      if (!user) return false;
      const titularDni = user.depende_de_dni ?? user.dni;
      return state.coberturasAnuales.some(
        (c) =>
          c.activo &&
          c.anio === anio &&
          (c.usuario_beneficiario_id === usuarioId || c.titular_dni === titularDni)
      );
    },
    [state.usuarios, state.coberturasAnuales]
  );

  // Anualidad simulation targets active Socio/Tutor (Martín Quiroga 30456789) or active user's titular
  const targetAnualidadTitularDni = useMemo(() => {
    if (activeRole === 'SOCIO_TUTOR') return activeUser.dni;
    if (activeRole === 'JUGADOR') return activeUser.depende_de_dni ?? activeUser.dni;
    return '30456789'; // Familia Quiroga
  }, [activeRole, activeUser]);

  const isAnualidadSimActive = useMemo(() => {
    return state.coberturasAnuales.some(
      (c) => c.activo && c.anio === 2026 && c.titular_dni === targetAnualidadTitularDni
    );
  }, [state.coberturasAnuales, targetAnualidadTitularDni]);

  const toggleFondoPropioSim = useCallback(() => {
    const targetUser = state.usuarios.find((u) => u.id === simulatedWalletUserId);
    if (!targetUser) return;
    const nextBalance = targetUser.saldo_fondo_propio >= 10000 ? 1500 : 42000;
    setState((prev) => ({
      ...prev,
      usuarios: prev.usuarios.map((u) =>
        u.id === simulatedWalletUserId ? { ...u, saldo_fondo_propio: nextBalance } : u
      ),
      fondoPropioMovimientos: [
        {
          id: Date.now(),
          usuario_id: simulatedWalletUserId,
          tipo: 'AJUSTE_SIMULACION',
          descripcion: `Simulador Fondo Propio (${targetUser.nombre} ${targetUser.apellido})`,
          monto: nextBalance - targetUser.saldo_fondo_propio,
          saldo_resultante: nextBalance,
          fecha: new Date().toISOString(),
        },
        ...prev.fondoPropioMovimientos,
      ],
    }));
    addToast({
      type: nextBalance >= 10000 ? 'success' : 'warning',
      title: `Fondo Propio simulado: ${formatARS(nextBalance)}`,
      description: `${targetUser.nombre} ${targetUser.apellido} (${nextBalance >= 10000 ? 'Saldo Suficiente' : 'Saldo Insuficiente'})`,
    });
  }, [simulatedWalletUserId, state.usuarios, addToast]);

  const toggleAnualidadSim = useCallback(() => {
    const titular = state.usuarios.find((u) => u.dni === targetAnualidadTitularDni);
    if (!titular) return;
    const currentlyCovered = state.coberturasAnuales.some(
      (c) => c.activo && c.anio === 2026 && c.titular_dni === titular.dni
    );

    setState((prev) => {
      if (currentlyCovered) {
        // Desactivar anualidad y restaurar cuotas societarias mensuales que estaban EXENTA_POR_ANUAL
        const nextCoberturas = prev.coberturasAnuales.filter(
          (c) => !(c.anio === 2026 && c.titular_dni === titular.dni)
        );
        const nextCuotas = prev.cuotasEmitidas.map((ce) => {
          const det = prev.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id);
          if (
            ce.responsable_pago_dni === titular.dni &&
            ce.anio === 2026 &&
            det?.naturaleza === 'SOCIETARIA' &&
            det.periodicidad === 'MENSUAL' &&
            ce.estado === 'EXENTA_POR_ANUAL'
          ) {
            return { ...ce, estado: 'PENDIENTE' as const };
          }
          return ce;
        });
        return { ...prev, coberturasAnuales: nextCoberturas, cuotasEmitidas: nextCuotas };
      } else {
        // Activar cobertura anual para titular + dependientes y eximir cuotas societarias mensuales pendientes
        const familyUsers = prev.usuarios.filter(
          (u) => u.dni === titular.dni || u.depende_de_dni === titular.dni
        );
        const newCoberturas = familyUsers.map((fu, idx) => ({
          id: Date.now() + idx,
          anio: 2026,
          titular_dni: titular.dni,
          usuario_beneficiario_id: fu.id,
          cuota_anual_emitida_id: null,
          activo: true,
        }));
        const nextCuotas = prev.cuotasEmitidas.map((ce) => {
          const det = prev.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id);
          if (
            ce.responsable_pago_dni === titular.dni &&
            ce.anio === 2026 &&
            det?.naturaleza === 'SOCIETARIA' &&
            det.periodicidad === 'MENSUAL' &&
            ce.estado === 'PENDIENTE'
          ) {
            return { ...ce, estado: 'EXENTA_POR_ANUAL' as const };
          }
          return ce;
        });
        return {
          ...prev,
          coberturasAnuales: [...prev.coberturasAnuales, ...newCoberturas],
          cuotasEmitidas: nextCuotas,
        };
      }
    });

    addToast({
      type: currentlyCovered ? 'info' : 'success',
      title: currentlyCovered
        ? 'Anualidad Societaria 2026 desactivada'
        : 'Anualidad Societaria 2026 Cubierta',
      description: currentlyCovered
        ? `Se reactivaron las cuotas societarias mensuales pendientes de ${titular.nombre} ${titular.apellido}.`
        : `Grupo familiar DNI ${titular.dni} exento de cuotas societarias mensuales durante 2026.`,
    });
  }, [state.coberturasAnuales, state.usuarios, targetAnualidadTitularDni, addToast]);

  const resetDemo = useCallback(() => {
    const fresh = createInitialClubState();
    setState(fresh);
    localStorage.removeItem(STORAGE_KEY);
    setActiveTemporadaId(2026);
    setSelectedTicketToken('GQR-M16A94K2');
    setPendingCheckout(null);
    setReadAlertIds([]);
    setNotificationPanelOpen(false);
    addToast({
      type: 'info',
      title: 'Demo restablecida',
      description: 'Todos los datos de Guaycurues Rugby Sunchales volvieron al estado inicial.',
    });
  }, [addToast]);

  const getUserCategoriesInTemporada = useCallback(
    (usuarioId: number, temporadaId = activeTemporadaId): Categoria[] => {
      const catIds = state.miembrosTemporada
        .filter((m) => m.temporada_id === temporadaId && m.usuario_id === usuarioId && m.activo)
        .map((m) => m.categoria_id);
      return state.categorias.filter((c) => catIds.includes(c.id));
    },
    [state.miembrosTemporada, state.categorias, activeTemporadaId]
  );

  const getManagersForCategoria = useCallback(
    (categoriaId: number): Usuario[] => {
      const cat = state.categorias.find((c) => c.id === categoriaId);
      if (!cat) return [];
      return state.usuarios.filter((u) => cat.managers_habilitados_ids.includes(u.id));
    },
    [state.categorias, state.usuarios]
  );

  const getDependantsOf = useCallback(
    (titularDni: string): Usuario[] => {
      return state.usuarios.filter((u) => u.depende_de_dni === titularDni);
    },
    [state.usuarios]
  );

  const openMercadoPagoCheckout = useCallback(
    (items: CheckoutItemRequest[], pagadorUsuarioId?: number) => {
      if (items.length === 0) return;
      setPendingCheckout({
        pagadorUsuarioId: pagadorUsuarioId ?? activeUser.id,
        items,
        externalReference: generateUUID(),
        mpPreferenceId: `PREF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      });
    },
    [activeUser.id]
  );

  const closeMercadoPagoCheckout = useCallback(() => {
    setPendingCheckout(null);
  }, []);

  const confirmMercadoPagoPayment = useCallback(() => {
    if (!pendingCheckout) return;
    const nowIso = new Date().toISOString();
    const orderId = Date.now();
    const comisionPct = state.configGlobal.comision_mp_pct / 100;
    const total = pendingCheckout.items.reduce((acc, i) => acc + i.monto, 0);
    const totalComision = Math.round(total * comisionPct);
    const totalNeto = total - totalComision;

    const newOrder: OrdenPagoMP = {
      id: orderId,
      external_reference: pendingCheckout.externalReference,
      pagador_usuario_id: pendingCheckout.pagadorUsuarioId,
      monto_total: total,
      comision_mp: totalComision,
      monto_neto: totalNeto,
      mp_preference_id: pendingCheckout.mpPreferenceId,
      mp_payment_id: `MP-PAY-${Math.floor(10000000 + Math.random() * 89999999)}`,
      mp_status: 'APPROVED',
      fecha_creacion: nowIso,
      fecha_aprobacion: nowIso,
      items: pendingCheckout.items.map((it, idx) => ({
        id: orderId + idx + 1,
        orden_pago_mp_id: orderId,
        tipo_obligacion: it.tipo_obligacion,
        obligacion_id: it.obligacion_id,
        descripcion: it.descripcion,
        monto_aplicado: it.monto,
        codigo_caja_contable: it.codigo_caja_contable,
      })),
    };

    setState((prev) => {
      let nextCuotasEmitidas = [...prev.cuotasEmitidas];
      let nextCoberturas = [...prev.coberturasAnuales];
      let nextFichajes = [...prev.fichajes];
      let nextDeclaraciones = [...prev.declaracionesVenta];
      let nextTercerosTiempos = [...prev.tercerosTiempos];
      let nextUsuarios = [...prev.usuarios];
      let nextMovs = [...prev.fondoPropioMovimientos];
      const newTransacciones: PagoTransaccion[] = [];

      pendingCheckout.items.forEach((item, idx) => {
        const com = Math.round(item.monto * comisionPct);
        const neto = item.monto - com;

        newTransacciones.push({
          id: orderId + 100 + idx,
          origen_tipo: item.tipo_obligacion,
          origen_id: item.obligacion_id,
          descripcion: item.descripcion,
          orden_pago_mp_id: orderId,
          usuario_id: pendingCheckout.pagadorUsuarioId,
          monto: item.monto,
          comision_mp: com,
          monto_neto: neto,
          medio_pago: 'MERCADO_PAGO',
          receptor_efectivo_id: null,
          validado_por_admin_id: null,
          codigo_caja_contable: item.codigo_caja_contable,
          estado_validacion: 'APROBADO_AUTOMATICO',
          fecha: nowIso,
        });

        if (item.tipo_obligacion === 'CUOTA') {
          if (item.meta?.es_cuota_anual && item.meta.titular_dni) {
            const titularDni = item.meta.titular_dni;
            const anualEmitidaId = orderId + 500;
            nextCuotasEmitidas.push({
              id: anualEmitidaId,
              cuota_detalle_id: item.obligacion_id,
              usuario_id: pendingCheckout.pagadorUsuarioId,
              responsable_pago_dni: titularDni,
              anio: 2026,
              mes: null,
              monto_original: item.monto,
              descuento_aplicado: 0,
              monto_final: item.monto,
              estado: 'PAGADA',
              orden_pago_mp_id: orderId,
              fecha_pago: nowIso,
            });
            const family = nextUsuarios.filter(
              (u) => u.dni === titularDni || u.depende_de_dni === titularDni
            );
            family.forEach((fu, fIdx) => {
              nextCoberturas.push({
                id: orderId + 700 + fIdx,
                anio: 2026,
                titular_dni: titularDni,
                usuario_beneficiario_id: fu.id,
                cuota_anual_emitida_id: anualEmitidaId,
                activo: true,
              });
            });
            // Anular cuotas societarias mensuales pendientes de ese titular
            nextCuotasEmitidas = nextCuotasEmitidas.map((ce) => {
              const det = prev.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id);
              if (
                ce.responsable_pago_dni === titularDni &&
                ce.anio === 2026 &&
                det?.naturaleza === 'SOCIETARIA' &&
                det.periodicidad === 'MENSUAL' &&
                ce.estado === 'PENDIENTE'
              ) {
                return { ...ce, estado: 'EXENTA_POR_ANUAL' };
              }
              return ce;
            });
          } else {
            nextCuotasEmitidas = nextCuotasEmitidas.map((ce) =>
              ce.id === item.obligacion_id
                ? { ...ce, estado: 'PAGADA', orden_pago_mp_id: orderId, fecha_pago: nowIso }
                : ce
            );
          }
        }

        if (item.tipo_obligacion === 'FICHAJE') {
          nextFichajes = nextFichajes.map((f) => {
            if (f.id !== item.obligacion_id) return f;
            const nuevoPendiente = Math.max(0, f.monto_pendiente - item.monto);
            return {
              ...f,
              cuotas_pagas: Math.min(f.cuotas_totales, f.cuotas_pagas + 1),
              monto_pendiente: nuevoPendiente,
            };
          });
        }

        if (item.tipo_obligacion === 'VENTA') {
          nextDeclaraciones = nextDeclaraciones.map((d) =>
            d.id === item.obligacion_id ? { ...d, estado_pago: 'PAGADA' } : d
          );
          if (
            item.meta?.destino_ganancia === 'FONDO_JUGADOR' &&
            item.meta.jugador_id &&
            item.meta.ganancia_monto
          ) {
            const jId = item.meta.jugador_id;
            const gain = item.meta.ganancia_monto;
            nextUsuarios = nextUsuarios.map((u) => {
              if (u.id !== jId) return u;
              const nuevoSaldo = u.saldo_fondo_propio + gain;
              nextMovs = [
                {
                  id: orderId + 900 + idx,
                  usuario_id: jId,
                  tipo: 'ACREDITACION_VENTA',
                  descripcion: `Acreditación automática MP · ${item.descripcion}`,
                  monto: gain,
                  saldo_resultante: nuevoSaldo,
                  fecha: nowIso,
                },
                ...nextMovs,
              ];
              return { ...u, saldo_fondo_propio: nuevoSaldo };
            });
          }
        }

        if (item.tipo_obligacion === 'TERCER_TIEMPO' && item.meta?.jugador_id) {
          const jId = item.meta.jugador_id;
          nextTercerosTiempos = nextTercerosTiempos.map((tt) =>
            tt.id === item.obligacion_id && !tt.pagos_jugadores_ids.includes(jId)
              ? { ...tt, pagos_jugadores_ids: [...tt.pagos_jugadores_ids, jId] }
              : tt
          );
        }
      });

      return {
        ...prev,
        ordenesMP: [newOrder, ...prev.ordenesMP],
        transacciones: [...newTransacciones, ...prev.transacciones],
        cuotasEmitidas: nextCuotasEmitidas,
        coberturasAnuales: nextCoberturas,
        fichajes: nextFichajes,
        declaracionesVenta: nextDeclaraciones,
        tercerosTiempos: nextTercerosTiempos,
        usuarios: nextUsuarios,
        fondoPropioMovimientos: nextMovs,
      };
    });

    addToast({
      type: 'success',
      category: 'Confirmación de pago recibida',
      title: 'Confirmación de pago recibida · Mercado Pago IPN',
      description: `Se acreditaron ${pendingCheckout.items.length} ítems (${formatARS(total)}) distribuidos automáticamente por caja virtual.`,
      actionLabel: hasScreenAccess(activeRole, 'cuotas_pagos') ? 'Ver cajas' : 'Ver cuotas',
      targetScreen: hasScreenAccess(activeRole, 'cuotas_pagos') ? 'cuotas_pagos' : 'cuotas_pagar',
    });
    setPendingCheckout(null);
  }, [pendingCheckout, state.configGlobal.comision_mp_pct, activeRole, addToast]);

  const cobrarCuotasEfectivoTesorero = useCallback(
    (cuotaIds: number[]) => {
      if (cuotaIds.length === 0) return;
      const nowIso = new Date().toISOString();
      const baseId = Date.now();
      setState((prev) => {
        const newTxs: PagoTransaccion[] = [];
        const nextCuotas = prev.cuotasEmitidas.map((ce, idx) => {
          if (!cuotaIds.includes(ce.id) || ce.estado !== 'PENDIENTE') return ce;
          const det = prev.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id);
          const u = prev.usuarios.find((usr) => usr.id === ce.usuario_id);
          newTxs.push({
            id: baseId + idx,
            origen_tipo: 'CUOTA',
            origen_id: ce.id,
            descripcion: `${det?.codigo ?? 'CUOTA'} ${ce.mes ? MESES_NOMBRES[ce.mes - 1] : 'Anual'} ${ce.anio} (${u?.nombre ?? ''} ${u?.apellido ?? ''})`,
            orden_pago_mp_id: null,
            usuario_id: ce.usuario_id,
            monto: ce.monto_final,
            comision_mp: 0,
            monto_neto: ce.monto_final,
            medio_pago: 'EFECTIVO',
            receptor_efectivo_id: activeUser.id,
            validado_por_admin_id: activeUser.id,
            codigo_caja_contable: det?.codigo_caja_contable ?? 'CAJA_CLUB_SOCIETARIA',
            estado_validacion: 'EFECTIVO_RECIBIDO',
            fecha: nowIso,
          });
          return { ...ce, estado: 'PAGADA' as const, fecha_pago: nowIso };
        });
        return {
          ...prev,
          cuotasEmitidas: nextCuotas,
          transacciones: [...newTxs, ...prev.transacciones],
        };
      });
      addToast({
        type: 'success',
        category: 'Confirmación de pago recibida',
        title: 'Confirmación de pago recibida · Efectivo Tesorería',
        description: `${cuotaIds.length} cuota(s) marcada(s) como PAGADA por ventanilla de Tesorería.`,
        actionLabel: 'Ver cajas',
        targetScreen: 'cuotas_pagos',
      });
    },
    [activeUser.id, addToast]
  );

  const registrarPagoEfectivoManager: ClubContextValue['registrarPagoEfectivoManager'] = useCallback(
    ({ origenTipo, origenId, descripcion, usuarioId, monto, receptorEfectivoId, codigoCajaContable }) => {
      const nowIso = new Date().toISOString();
      const manager = state.usuarios.find((u) => u.id === receptorEfectivoId);
      setState((prev) => {
        const tx: PagoTransaccion = {
          id: Date.now(),
          origen_tipo: origenTipo,
          origen_id: origenId,
          descripcion,
          orden_pago_mp_id: null,
          usuario_id: usuarioId,
          monto,
          comision_mp: 0,
          monto_neto: monto,
          medio_pago: 'EFECTIVO',
          receptor_efectivo_id: receptorEfectivoId,
          validado_por_admin_id: null,
          codigo_caja_contable: codigoCajaContable,
          estado_validacion: 'PENDIENTE_RECEPCION_EFECTIVO',
          fecha: nowIso,
        };
        let nextDecl = prev.declaracionesVenta;
        if (origenTipo === 'VENTA') {
          nextDecl = prev.declaracionesVenta.map((d) =>
            d.id === origenId ? { ...d, estado_pago: 'PENDIENTE_RECEPCION_EFECTIVO' } : d
          );
        }
        return {
          ...prev,
          declaracionesVenta: nextDecl,
          transacciones: [tx, ...prev.transacciones],
        };
      });
      addToast({
        type: 'warning',
        title: 'Efectivo declarado · Pendiente de recepción',
        description: `Quedó en estado PENDIENTE_RECEPCION_EFECTIVO hasta que ${manager?.nombre ?? 'el Manager'} ${manager?.apellido ?? ''} confirme la recepción.`,
      });
    },
    [state.usuarios, addToast]
  );

  const confirmarRecepcionEfectivo = useCallback(
    (transaccionId: number) => {
      setState((prev) => {
        const tx = prev.transacciones.find((t) => t.id === transaccionId);
        if (!tx || tx.estado_validacion !== 'PENDIENTE_RECEPCION_EFECTIVO') return prev;
        let nextFichajes = prev.fichajes;
        let nextDecl = prev.declaracionesVenta;
        let nextTT = prev.tercerosTiempos;
        let nextUsuarios = prev.usuarios;
        let nextMovs = prev.fondoPropioMovimientos;

        if (tx.origen_tipo === 'FICHAJE') {
          nextFichajes = prev.fichajes.map((f) =>
            f.id === tx.origen_id
              ? {
                  ...f,
                  cuotas_pagas: Math.min(f.cuotas_totales, f.cuotas_pagas + 1),
                  monto_pendiente: Math.max(0, f.monto_pendiente - tx.monto),
                }
              : f
          );
        } else if (tx.origen_tipo === 'VENTA') {
          const decl = prev.declaracionesVenta.find((d) => d.id === tx.origen_id);
          const camp = decl ? prev.campaniasVenta.find((c) => c.id === decl.venta_id) : null;
          nextDecl = prev.declaracionesVenta.map((d) =>
            d.id === tx.origen_id ? { ...d, estado_pago: 'PAGADA' } : d
          );
          if (decl && camp && camp.destino_ganancia === 'FONDO_JUGADOR') {
            const gain = Math.round(tx.monto * (camp.porcentaje_ganancia / 100));
            nextUsuarios = prev.usuarios.map((u) => {
              if (u.id !== decl.jugador_id) return u;
              const ns = u.saldo_fondo_propio + gain;
              nextMovs = [
                {
                  id: Date.now(),
                  usuario_id: u.id,
                  tipo: 'ACREDITACION_VENTA',
                  descripcion: `Acreditación tras recepción de efectivo · ${camp.titulo}`,
                  monto: gain,
                  saldo_resultante: ns,
                  fecha: new Date().toISOString(),
                },
                ...nextMovs,
              ];
              return { ...u, saldo_fondo_propio: ns };
            });
          }
        } else if (tx.origen_tipo === 'TERCER_TIEMPO') {
          nextTT = prev.tercerosTiempos.map((tt) =>
            tt.id === tx.origen_id && !tt.pagos_jugadores_ids.includes(tx.usuario_id)
              ? { ...tt, pagos_jugadores_ids: [...tt.pagos_jugadores_ids, tx.usuario_id] }
              : tt
          );
        }

        return {
          ...prev,
          transacciones: prev.transacciones.map((t) =>
            t.id === transaccionId
              ? { ...t, estado_validacion: 'EFECTIVO_RECIBIDO', validado_por_admin_id: activeUser.id }
              : t
          ),
          fichajes: nextFichajes,
          declaracionesVenta: nextDecl,
          tercerosTiempos: nextTT,
          usuarios: nextUsuarios,
          fondoPropioMovimientos: nextMovs,
        };
      });
      addToast({
        type: 'success',
        category: 'Confirmación de pago recibida',
        title: 'Confirmación de pago recibida · Efectivo Manager',
        description: 'La transacción pasó a EFECTIVO_RECIBIDO y actualizó la caja contable.',
        actionLabel: hasScreenAccess(activeRole, 'cuotas_pagos') ? 'Ver pagos' : undefined,
        targetScreen: hasScreenAccess(activeRole, 'cuotas_pagos') ? 'cuotas_pagos' : undefined,
      });
    },
    [activeUser.id, activeRole, addToast]
  );

  const pagarConFondoPropio: ClubContextValue['pagarConFondoPropio'] = useCallback(
    ({ origenTipo, origenId, descripcion, usuarioId, monto, codigoCajaContable }) => {
      const user = state.usuarios.find((u) => u.id === usuarioId);
      if (!user || user.saldo_fondo_propio < monto) {
        addToast({
          type: 'error',
          title: 'Saldo insuficiente en Fondo Propio',
          description: `Disponible ${formatARS(user?.saldo_fondo_propio ?? 0)} vs requerido ${formatARS(monto)}.`,
        });
        return false;
      }
      const nowIso = new Date().toISOString();
      const nuevoSaldo = user.saldo_fondo_propio - monto;

      setState((prev) => {
        let nextFichajes = prev.fichajes;
        let nextTT = prev.tercerosTiempos;
        if (origenTipo === 'FICHAJE') {
          nextFichajes = prev.fichajes.map((f) =>
            f.id === origenId
              ? {
                  ...f,
                  cuotas_pagas: Math.min(f.cuotas_totales, f.cuotas_pagas + 1),
                  monto_pendiente: Math.max(0, f.monto_pendiente - monto),
                }
              : f
          );
        } else if (origenTipo === 'TERCER_TIEMPO') {
          nextTT = prev.tercerosTiempos.map((tt) =>
            tt.id === origenId && !tt.pagos_jugadores_ids.includes(usuarioId)
              ? { ...tt, pagos_jugadores_ids: [...tt.pagos_jugadores_ids, usuarioId] }
              : tt
          );
        }
        return {
          ...prev,
          usuarios: prev.usuarios.map((u) =>
            u.id === usuarioId ? { ...u, saldo_fondo_propio: nuevoSaldo } : u
          ),
          fondoPropioMovimientos: [
            {
              id: Date.now(),
              usuario_id: usuarioId,
              tipo: origenTipo === 'FICHAJE' ? 'DEBITO_FICHAJE' : 'DEBITO_TERCER_TIEMPO',
              descripcion,
              monto: -monto,
              saldo_resultante: nuevoSaldo,
              fecha: nowIso,
            },
            ...prev.fondoPropioMovimientos,
          ],
          transacciones: [
            {
              id: Date.now() + 1,
              origen_tipo: origenTipo,
              origen_id: origenId,
              descripcion,
              orden_pago_mp_id: null,
              usuario_id: usuarioId,
              monto,
              comision_mp: 0,
              monto_neto: monto,
              medio_pago: 'FONDO_PROPIO',
              receptor_efectivo_id: null,
              validado_por_admin_id: null,
              codigo_caja_contable: codigoCajaContable,
              estado_validacion: 'APROBADO_AUTOMATICO',
              fecha: nowIso,
            },
            ...prev.transacciones,
          ],
          fichajes: nextFichajes,
          tercerosTiempos: nextTT,
        };
      });

      addToast({
        type: 'success',
        title: 'Abonado con Fondo Propio',
        description: `Se debitaron ${formatARS(monto)}. Saldo restante: ${formatARS(nuevoSaldo)}.`,
      });
      return true;
    },
    [state.usuarios, addToast]
  );

  // Cuotas actions
  const upsertCuotaDetalle: ClubContextValue['upsertCuotaDetalle'] = useCallback(
    (detalle) => {
      setState((prev) => {
        if (detalle.id) {
          return {
            ...prev,
            cuotasDetalle: prev.cuotasDetalle.map((d) =>
              d.id === detalle.id ? { ...d, ...detalle, id: d.id } : d
            ),
          };
        }
        return {
          ...prev,
          cuotasDetalle: [...prev.cuotasDetalle, { ...detalle, id: Date.now() }],
        };
      });
      addToast({ type: 'success', title: 'Catálogo de cuotas actualizado' });
    },
    [addToast]
  );

  const deleteCuotaDetalle = useCallback(
    (id: number) => {
      setState((prev) => ({
        ...prev,
        cuotasDetalle: prev.cuotasDetalle.map((d) => (d.id === id ? { ...d, activa: false } : d)),
      }));
      addToast({ type: 'info', title: 'Subtipo dado de baja lógica' });
    },
    [addToast]
  );

  const updateCuotasCabecera = useCallback(
    (descuentoFamiliar: number, descuentoAnual: number) => {
      setState((prev) => ({
        ...prev,
        cuotasCabecera: prev.cuotasCabecera.map((c, idx) =>
          idx === 0
            ? {
                ...c,
                descuento_grupo_familiar_pct: descuentoFamiliar,
                descuento_anual_anticipado_pct: descuentoAnual,
              }
            : c
        ),
      }));
      addToast({ type: 'success', title: 'Reglas de cabecera guardadas' });
    },
    [addToast]
  );

  const generarCuotasPeriodo = useCallback(
    (mes: number, anio: number, enviarWhatsapp: boolean) => {
      let generadas = 0;
      let exentas = 0;
      let omitidasPorCalendario = 0;
      const nowIso = new Date().toISOString();

      setState((prev) => {
        const nuevasCuotas: CuotaEmitida[] = [];
        const nuevasNotifs: typeof prev.notificaciones = [];
        const notifiedTitulares = new Set<string>();

        prev.usuarios
          .filter((u) => u.activo)
          .forEach((usuario) => {
            const titularDni = usuario.depende_de_dni ?? usuario.dni;
            const tieneAnual = prev.coberturasAnuales.some(
              (c) =>
                c.activo &&
                c.anio === anio &&
                (c.usuario_beneficiario_id === usuario.id || c.titular_dni === titularDni)
            );

            usuario.cuotas_asignadas_ids.forEach((detalleId) => {
              const det = prev.cuotasDetalle.find((d) => d.id === detalleId && d.activa);
              if (!det || det.periodicidad !== 'MENSUAL') return;

              // Regla 1: Calendario Estacional
              if (!det.meses_activos.includes(mes)) {
                omitidasPorCalendario++;
                return;
              }

              // Regla 2: Exención por Anualidad
              if (det.naturaleza === 'SOCIETARIA' && tieneAnual) {
                exentas++;
                return;
              }

              // Evitar duplicado en mismo mes/año
              const yaExiste =
                prev.cuotasEmitidas.some(
                  (ce) =>
                    ce.usuario_id === usuario.id &&
                    ce.cuota_detalle_id === det.id &&
                    ce.anio === anio &&
                    ce.mes === mes &&
                    ce.estado !== 'ANULADA'
                ) ||
                nuevasCuotas.some(
                  (ce) =>
                    ce.usuario_id === usuario.id &&
                    ce.cuota_detalle_id === det.id &&
                    ce.anio === anio &&
                    ce.mes === mes
                );

              if (yaExiste) return;

              generadas++;
              nuevasCuotas.push({
                id: Date.now() + generadas * 7 + usuario.id,
                cuota_detalle_id: det.id,
                usuario_id: usuario.id,
                responsable_pago_dni: titularDni,
                anio,
                mes,
                monto_original: det.monto,
                descuento_aplicado: 0,
                monto_final: det.monto,
                estado: 'PENDIENTE',
                orden_pago_mp_id: null,
                fecha_pago: null,
              });

              if (!notifiedTitulares.has(titularDni)) {
                notifiedTitulares.add(titularDni);
                const titular = prev.usuarios.find((t) => t.dni === titularDni) ?? usuario;
                nuevasNotifs.push({
                  id: Date.now() + generadas * 13,
                  usuario_id: titular.id,
                  destinatario: titular.email,
                  canal: 'EMAIL',
                  asunto: `Guaycurues Sunchales · Cuotas ${MESES_NOMBRES[mes - 1]} ${anio} emitidas`,
                  fecha: nowIso,
                  estado: 'ENVIADO',
                });
                if (enviarWhatsapp) {
                  nuevasNotifs.push({
                    id: Date.now() + generadas * 17,
                    usuario_id: titular.id,
                    destinatario: titular.telefono_whatsapp ?? 'Sin teléfono registrado',
                    canal: 'WHATSAPP',
                    asunto: `Link de pago MP · ${MESES_NOMBRES[mes - 1]} ${anio}`,
                    fecha: nowIso,
                    estado:
                      titular.telefono_whatsapp && titular.notificar_whatsapp
                        ? 'ENVIADO'
                        : 'OMITIDO_SIN_OPTIN',
                  });
                }
              }
            });
          });

        const activityEntry: UserActivityLog = {
          id: `act-gen-${Date.now()}`,
          usuario_id: activeUser.id,
          categoria: 'Gestión',
          titulo: `Facturación ${MESES_NOMBRES[mes - 1]} ${anio} emitida`,
          descripcion: `${generadas} cuotas emitidas · ${exentas} exentas por anualidad · ${omitidasPorCalendario} por calendario estacional.`,
          fecha: nowIso,
          tone: 'emerald',
          estado_label: 'Ejecutado',
        };

        return {
          ...prev,
          cuotasEmitidas: [...nuevasCuotas, ...prev.cuotasEmitidas],
          notificaciones: [...nuevasNotifs, ...prev.notificaciones],
          userActivities: [activityEntry, ...(prev.userActivities ?? [])].slice(0, 40),
        };
      });

      addToast({
        type: 'success',
        title: `Facturación ${MESES_NOMBRES[mes - 1]} ${anio} ejecutada`,
        description: `${generadas} cuotas emitidas · ${exentas} omitidas por anualidad · ${omitidasPorCalendario} exentas por calendario estacional.`,
      });

      return { generadas, exentas, omitidasPorCalendario };
    },
    [activeUser.id, addToast]
  );

  const editarCuotaEmitida = useCallback(
    (cuotaId: number, nuevoMonto: number, nuevoEstado: CuotaEmitida['estado']) => {
      setState((prev) => ({
        ...prev,
        cuotasEmitidas: prev.cuotasEmitidas.map((ce) =>
          ce.id === cuotaId
            ? {
                ...ce,
                monto_final: nuevoMonto,
                descuento_aplicado: Math.max(0, ce.monto_original - nuevoMonto),
                estado: nuevoEstado,
              }
            : ce
        ),
      }));
      addToast({ type: 'success', title: 'Cuota emitida actualizada' });
    },
    [addToast]
  );

  // Ventas actions
  const crearCampaniaVenta = useCallback(
    (campania: Omit<VentaCampania, 'id'>) => {
      const nowIso = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        campaniasVenta: [{ ...campania, id: Date.now() }, ...prev.campaniasVenta],
        userActivities: [
          {
            id: `act-camp-${Date.now()}`,
            usuario_id: activeUser.id,
            categoria: 'Venta QR',
            titulo: 'Nueva campaña de venta publicada',
            descripcion: `${campania.titulo} · Mínimo ${campania.minimo_unidades} u. (${formatARS(campania.valor_unitario)})`,
            fecha: nowIso,
            tone: 'sky',
            estado_label: campania.tipo_alcance,
          } satisfies UserActivityLog,
          ...(prev.userActivities ?? []),
        ].slice(0, 40),
      }));
      addToast({ type: 'success', title: 'Campaña de venta creada', description: campania.titulo });
    },
    [activeUser.id, addToast]
  );

  const declararVentas = useCallback(
    (ventaId: number, jugadorId: number, cantidadNueva: number, nombresCompradores?: string[]) => {
      if (cantidadNueva <= 0) return;
      const nowIso = new Date().toISOString();
      setState((prev) => {
        const existingDecl = prev.declaracionesVenta.find(
          (d) => d.venta_id === ventaId && d.jugador_id === jugadorId
        );
        const declId = existingDecl ? existingDecl.id : Date.now();
        const nextDecl = existingDecl
          ? prev.declaracionesVenta.map((d) =>
              d.id === existingDecl.id
                ? { ...d, cantidad_declarada: d.cantidad_declarada + cantidadNueva, estado_pago: 'PENDIENTE' as const }
                : d
            )
          : [
              {
                id: declId,
                venta_id: ventaId,
                jugador_id: jugadorId,
                cantidad_declarada: cantidadNueva,
                multa_minimo_generada: false,
                monto_multa: 0,
                estado_pago: 'PENDIENTE' as const,
              },
              ...prev.declaracionesVenta,
            ];

        const newTickets = Array.from({ length: cantidadNueva }).map((_, idx) => ({
          id: Date.now() + idx + 1,
          declaracion_id: declId,
          venta_id: ventaId,
          token_hash: generateTokenHash('GQR'),
          nombre_comprador:
            nombresCompradores && nombresCompradores[idx]?.trim()
              ? nombresCompradores[idx].trim()
              : `Comprador Particular #${prev.ticketsQR.length + idx + 1}`,
          estado: 'PENDIENTE' as const,
          fecha_emision: nowIso,
          fecha_entrega: null,
        }));

        if (newTickets[0]) {
          setSelectedTicketToken(newTickets[0].token_hash);
        }

        return {
          ...prev,
          declaracionesVenta: nextDecl,
          ticketsQR: [...newTickets, ...prev.ticketsQR],
          userActivities: [
            {
              id: `act-vdecl-${Date.now()}`,
              usuario_id: activeUser.id,
              categoria: 'Venta QR',
              titulo: `${cantidadNueva} venta(s) declarada(s)`,
              descripcion: `Se emitieron ${cantidadNueva} ticket(s) QR (${newTickets[0]?.token_hash ?? 'GQR'}) listos para entrega.`,
              fecha: nowIso,
              tone: 'emerald',
              estado_label: 'QR Emitido',
            } satisfies UserActivityLog,
            ...(prev.userActivities ?? []),
          ].slice(0, 40),
        };
      });

      addToast({
        type: 'success',
        title: `${cantidadNueva} venta(s) declarada(s)`,
        description: `Se generaron ${cantidadNueva} ticket(s) con QR SVG único listos para compartir.`,
      });
    },
    [activeUser.id, addToast]
  );

  const toggleSimularFechaVencida = useCallback(
    (ventaId: number) => {
      setState((prev) => {
        const camp = prev.campaniasVenta.find((c) => c.id === ventaId);
        if (!camp) return prev;
        const nextSim = !camp.simular_vencida;
        const gananciaUnitaria = Math.round(camp.valor_unitario * (camp.porcentaje_ganancia / 100));
        return {
          ...prev,
          campaniasVenta: prev.campaniasVenta.map((c) =>
            c.id === ventaId ? { ...c, simular_vencida: nextSim } : c
          ),
          declaracionesVenta: prev.declaracionesVenta.map((d) => {
            if (d.venta_id !== ventaId) return d;
            if (nextSim && d.cantidad_declarada < camp.minimo_unidades) {
              const faltante = camp.minimo_unidades - d.cantidad_declarada;
              return {
                ...d,
                multa_minimo_generada: true,
                monto_multa: faltante * gananciaUnitaria,
              };
            }
            return { ...d, multa_minimo_generada: false, monto_multa: 0 };
          }),
        };
      });
    },
    []
  );

  const canjearTicketQR = useCallback(
    (tokenHash: string) => {
      const cleanToken = tokenHash.trim().toUpperCase();
      const ticket = state.ticketsQR.find((t) => t.token_hash.toUpperCase() === cleanToken);
      if (!ticket) {
        return {
          ok: false,
          status: 'NOT_FOUND' as const,
          message: `No existe ningún voucher registrado con el código ${cleanToken}.`,
        };
      }
      if (ticket.estado === 'ENTREGADO') {
        addToast({
          type: 'error',
          title: 'Ticket QR ya canjeado (Bloqueado)',
          description: `El voucher ${ticket.token_hash} fue entregado previamente y no admite segundo uso.`,
        });
        return {
          ok: false,
          status: 'ALREADY_REDEEMED' as const,
          message: `BLOQUEO DE IDEMPOTENCIA: El ticket ${ticket.token_hash} ya fue redimido el ${ticket.fecha_entrega ?? ''}.`,
        };
      }
      const nowIso = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        ticketsQR: prev.ticketsQR.map((t) =>
          t.id === ticket.id ? { ...t, estado: 'ENTREGADO', fecha_entrega: nowIso } : t
        ),
        userActivities: [
          {
            id: `act-qr-${Date.now()}`,
            usuario_id: activeUser.id,
            categoria: 'Venta QR',
            titulo: `Ticket QR canjeado (${ticket.token_hash})`,
            descripcion: `Entrega validada en comercio para ${ticket.nombre_comprador}.`,
            fecha: nowIso,
            tone: 'emerald',
            estado_label: 'ENTREGADO',
          } satisfies UserActivityLog,
          ...(prev.userActivities ?? []),
        ].slice(0, 40),
      }));
      addToast({
        type: 'success',
        title: 'Entrega confirmada (Un solo uso)',
        description: `Voucher ${ticket.token_hash} marcado como ENTREGADO para ${ticket.nombre_comprador}.`,
      });
      return {
        ok: true,
        status: 'SUCCESS' as const,
        message: `Entrega validada correctamente para ${ticket.nombre_comprador}. Ticket cerrado.`,
      };
    },
    [state.ticketsQR, activeUser.id, addToast]
  );

  // Deportivo BD.UAR
  const crearTemporada = useCallback(
    (temp: Omit<Temporada, 'id'>) => {
      const id = temp.anio;
      setState((prev) => ({
        ...prev,
        temporadas: [{ ...temp, id }, ...prev.temporadas],
      }));
      addToast({ type: 'success', title: `Temporada ${temp.nombre} creada` });
    },
    [addToast]
  );

  const cambiarEstadoTemporada = useCallback(
    (temporadaId: number, estado: Temporada['estado']) => {
      setState((prev) => ({
        ...prev,
        temporadas: prev.temporadas.map((t) => (t.id === temporadaId ? { ...t, estado } : t)),
      }));
      addToast({ type: 'info', title: 'Estado de temporada actualizado' });
    },
    [addToast]
  );

  const asignarMiembroTemporada = useCallback(
    (categoriaId: number, usuarioId: number, rol: RolEnTemporada) => {
      setState((prev) => {
        const exists = prev.miembrosTemporada.some(
          (m) =>
            m.temporada_id === activeTemporadaId &&
            m.categoria_id === categoriaId &&
            m.usuario_id === usuarioId &&
            m.rol_en_temporada === rol
        );
        if (exists) return prev;
        return {
          ...prev,
          miembrosTemporada: [
            {
              id: Date.now(),
              temporada_id: activeTemporadaId,
              categoria_id: categoriaId,
              usuario_id: usuarioId,
              rol_en_temporada: rol,
              fecha_alta: new Date().toISOString().slice(0, 10),
              activo: true,
            },
            ...prev.miembrosTemporada,
          ],
        };
      });
      addToast({ type: 'success', title: 'Miembro vinculado a la Temporada' });
    },
    [activeTemporadaId, addToast]
  );

  const agregarReferee = useCallback(
    (ref: Omit<TemporadaReferee, 'id'>) => {
      setState((prev) => ({
        ...prev,
        referees: [{ ...ref, id: Date.now() }, ...prev.referees],
      }));
      addToast({ type: 'success', title: 'Referee sumado al padrón de temporada' });
    },
    [addToast]
  );

  const crearPartido: ClubContextValue['crearPartido'] = useCallback(
    (partido) => {
      const nowIso = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        partidos: [
          {
            ...partido,
            id: Date.now(),
            resultado_local: null,
            resultado_visitante: null,
            estado: 'PROGRAMADO',
            incidencias: [],
          },
          ...prev.partidos,
        ],
        userActivities: [
          {
            id: `act-part-${Date.now()}`,
            usuario_id: activeUser.id,
            categoria: 'Deportivo',
            titulo: `Partido programado vs ${partido.rival}`,
            descripcion: `${partido.condicion} · ${formatDateTimeAR(partido.fecha_hora)} (${partido.cancha}).`,
            fecha: nowIso,
            tone: 'sky',
            estado_label: 'PROGRAMADO',
          } satisfies UserActivityLog,
          ...(prev.userActivities ?? []),
        ].slice(0, 40),
      }));
      addToast({
        type: 'info',
        category: 'Partido próximo',
        title: 'Partido próximo programado',
        description: `${partido.condicion} vs ${partido.rival} · ${formatDateTimeAR(partido.fecha_hora)} (${partido.cancha}).`,
        actionLabel: 'Ver Fixture',
        targetScreen: 'dep_fixture',
      });
    },
    [activeUser.id, addToast]
  );

  const cargarPlanillaPostPartido: ClubContextValue['cargarPlanillaPostPartido'] = useCallback(
    (partidoId, data) => {
      const nowIso = new Date().toISOString();
      setState((prev) => {
        const match = prev.partidos.find((p) => p.id === partidoId);
        return {
          ...prev,
          partidos: prev.partidos.map((p) =>
            p.id === partidoId
              ? {
                  ...p,
                  resultado_local: data.resultado_local,
                  resultado_visitante: data.resultado_visitante,
                  referee_id: data.referee_id,
                  citados_ids: data.citados_ids,
                  cuerpo_tecnico_ids: data.cuerpo_tecnico_ids,
                  incidencias: data.incidencias,
                  estado: 'FINALIZADO',
                }
              : p
          ),
          userActivities: [
            {
              id: `act-plan-${Date.now()}`,
              usuario_id: activeUser.id,
              categoria: 'Deportivo',
              titulo: `Planilla cargada vs ${match?.rival ?? 'Rival'}`,
              descripcion: `Resultado ${data.resultado_local}-${data.resultado_visitante} · ${data.incidencias.length} incidencia(s).`,
              fecha: nowIso,
              tone: 'emerald',
              estado_label: 'FINALIZADO',
            } satisfies UserActivityLog,
            ...(prev.userActivities ?? []),
          ].slice(0, 40),
        };
      });
      addToast({
        type: 'success',
        title: 'Planilla de Incidencias guardada',
        description: 'Partido finalizado con resultado oficial e incidencias registradas.',
      });
    },
    [activeUser.id, addToast]
  );

  const crearTorneo = useCallback(
    (torneo: Omit<Torneo, 'id'>) => {
      setState((prev) => ({
        ...prev,
        torneos: [{ ...torneo, id: Date.now() }, ...prev.torneos],
      }));
      addToast({ type: 'success', title: 'Torneo creado en Temporada' });
    },
    [addToast]
  );

  const actualizarAptoMedico = useCallback(
    (fichajeId: number, archivo: string, fechaVencimiento: string) => {
      const today = new Date('2026-11-13T00:00:00');
      const vto = new Date(fechaVencimiento);
      const nuevoEstado = vto >= today ? 'HABILITADO' : 'VENCIDO';
      const nowIso = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        fichajes: prev.fichajes.map((f) =>
          f.id === fichajeId
            ? {
                ...f,
                apto_medico_archivo: archivo,
                fecha_vencimiento_apto: fechaVencimiento,
                estado_habilitacion: nuevoEstado,
              }
            : f
        ),
        userActivities: [
          {
            id: `act-apto-${Date.now()}`,
            usuario_id: activeUser.id,
            categoria: 'Deportivo',
            titulo: 'Apto Médico actualizado',
            descripcion: `Certificado ${archivo} · Vto ${formatDateAR(fechaVencimiento)}.`,
            fecha: nowIso,
            tone: nuevoEstado === 'HABILITADO' ? 'emerald' : 'amber',
            estado_label: nuevoEstado,
          } satisfies UserActivityLog,
          ...(prev.userActivities ?? []),
        ].slice(0, 40),
      }));
      addToast({
        type: nuevoEstado === 'HABILITADO' ? 'success' : 'warning',
        title: 'Apto Médico actualizado',
        description: `Estado de habilitación: ${nuevoEstado}. Plan de cuotas de fichaje sincronizado.`,
      });
    },
    [activeUser.id, addToast]
  );

  const actualizarValorFichajeCategoria = useCallback(
    (categoriaId: number, montoAnual: number, cuotasTotales: number) => {
      setState((prev) => ({
        ...prev,
        fichajes: prev.fichajes.map((f) => {
          if (f.temporada_id !== activeTemporadaId || f.categoria_id !== categoriaId) return f;
          const cuotaValor = Math.round(montoAnual / cuotasTotales);
          const restanteCuotas = Math.max(0, cuotasTotales - f.cuotas_pagas);
          return {
            ...f,
            monto_anual: montoAnual,
            cuotas_totales: cuotasTotales,
            monto_pendiente: restanteCuotas * cuotaValor,
          };
        }),
      }));
      addToast({ type: 'success', title: 'Plan de cuotas de fichaje actualizado' });
    },
    [activeTemporadaId, addToast]
  );

  // Tercer Tiempo
  const crearTercerTiempo: ClubContextValue['crearTercerTiempo'] = useCallback(
    (tt, tareas) => {
      const ttId = Date.now();
      setState((prev) => ({
        ...prev,
        tercerosTiempos: [
          {
            ...tt,
            id: ttId,
            pagos_jugadores_ids: [],
            checklist: tareas.map((t, idx) => ({
              id: ttId + idx + 1,
              tercer_tiempo_id: ttId,
              tarea_descripcion: t.tarea_descripcion,
              cupo_requerido: t.cupo_requerido,
              usuarios_asignados_ids: [],
            })),
          },
          ...prev.tercerosTiempos,
        ],
      }));
      addToast({ type: 'success', title: 'Tercer Tiempo configurado' });
    },
    [addToast]
  );

  const toggleInscripcionChecklistTT = useCallback(
    (tercerTiempoId: number, checklistId: number, usuarioId: number) => {
      setState((prev) => ({
        ...prev,
        tercerosTiempos: prev.tercerosTiempos.map((tt) => {
          if (tt.id !== tercerTiempoId) return tt;
          return {
            ...tt,
            checklist: tt.checklist.map((item) => {
              if (item.id !== checklistId) return item;
              const yaEsta = item.usuarios_asignados_ids.includes(usuarioId);
              if (yaEsta) {
                return {
                  ...item,
                  usuarios_asignados_ids: item.usuarios_asignados_ids.filter((id) => id !== usuarioId),
                };
              }
              if (item.usuarios_asignados_ids.length >= item.cupo_requerido) {
                return item;
              }
              return {
                ...item,
                usuarios_asignados_ids: [...item.usuarios_asignados_ids, usuarioId],
              };
            }),
          };
        }),
      }));
    },
    []
  );

  const liquidarTercerTiempo = useCallback(
    (tercerTiempoId: number, nuevoMonto: number) => {
      setState((prev) => ({
        ...prev,
        tercerosTiempos: prev.tercerosTiempos.map((tt) =>
          tt.id === tercerTiempoId
            ? { ...tt, monto_por_jugador: nuevoMonto, estado: 'LIQUIDADO' }
            : tt
        ),
      }));
      addToast({
        type: 'success',
        title: 'Tercer Tiempo liquidado',
        description: `Se habilitó el cobro de ${formatARS(nuevoMonto)} por jugador/tutor.`,
      });
    },
    [addToast]
  );

  // Club
  const toggleInscripcionAyuda = useCallback((eventoId: number, usuarioId: number) => {
    setState((prev) => ({
      ...prev,
      eventosAyuda: prev.eventosAyuda.map((ev) => {
        if (ev.id !== eventoId) return ev;
        const exists = ev.inscriptos_ids.includes(usuarioId);
        return {
          ...ev,
          inscriptos_ids: exists
            ? ev.inscriptos_ids.filter((id) => id !== usuarioId)
            : ev.inscriptos_ids.length < ev.cupo
            ? [...ev.inscriptos_ids, usuarioId]
            : ev.inscriptos_ids,
        };
      }),
    }));
  }, []);

  const crearEventoAyuda = useCallback(
    (ev: Omit<ClubEventoAyuda, 'id' | 'inscriptos_ids'>) => {
      setState((prev) => ({
        ...prev,
        eventosAyuda: [{ ...ev, id: Date.now(), inscriptos_ids: [] }, ...prev.eventosAyuda],
      }));
      addToast({ type: 'success', title: 'Jornada de Ayuda al Club publicada' });
    },
    [addToast]
  );

  const eliminarEventoAyuda = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      eventosAyuda: prev.eventosAyuda.filter((e) => e.id !== id),
    }));
  }, []);

  const crearAsamblea = useCallback(
    (asamblea: Omit<ClubAsamblea, 'id'>) => {
      const nowIso = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        asambleas: [{ ...asamblea, id: Date.now() }, ...prev.asambleas],
        userActivities: [
          {
            id: `act-asam-${Date.now()}`,
            usuario_id: activeUser.id,
            categoria: 'Gestión',
            titulo: 'Minuta de asamblea registrada',
            descripcion: `${asamblea.titulo} (${asamblea.temas.length} temas tratados).`,
            fecha: nowIso,
            tone: 'sky',
            estado_label: 'Publicada',
          } satisfies UserActivityLog,
          ...(prev.userActivities ?? []),
        ].slice(0, 40),
      }));
      addToast({ type: 'success', title: 'Minuta de asamblea registrada' });
    },
    [activeUser.id, addToast]
  );

  const eliminarAsamblea = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      asambleas: prev.asambleas.filter((a) => a.id !== id),
    }));
  }, []);

  const crearNoticia = useCallback(
    (noticia: Omit<ClubNoticia, 'id'>) => {
      const nowIso = new Date().toISOString();
      setState((prev) => ({
        ...prev,
        noticias: [{ ...noticia, id: Date.now() }, ...prev.noticias],
        userActivities: [
          {
            id: `act-not-${Date.now()}`,
            usuario_id: activeUser.id,
            categoria: 'Gestión',
            titulo: 'Noticia institucional publicada',
            descripcion: `${noticia.titulo} · ${noticia.categoria}.`,
            fecha: nowIso,
            tone: 'emerald',
            estado_label: 'Cartelera',
          } satisfies UserActivityLog,
          ...(prev.userActivities ?? []),
        ].slice(0, 40),
      }));
      addToast({ type: 'success', title: 'Noticia institucional publicada' });
    },
    [activeUser.id, addToast]
  );

  const eliminarNoticia = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      noticias: prev.noticias.filter((n) => n.id !== id),
    }));
  }, []);

  // Admin
  const toggleUsuarioRol = useCallback(
    (usuarioId: number, role: RoleId) => {
      setState((prev) => ({
        ...prev,
        usuarios: prev.usuarios.map((u) => {
          if (u.id !== usuarioId) return u;
          const has = u.roles.includes(role);
          const nextRoles = has ? u.roles.filter((r) => r !== role) : [...u.roles, role];
          return { ...u, roles: nextRoles.length > 0 ? nextRoles : [role] };
        }),
      }));
      addToast({ type: 'success', title: 'Permisos RBAC actualizados' });
    },
    [addToast]
  );

  const upsertCategoria = useCallback(
    (cat: Omit<Categoria, 'id'> & { id?: number }) => {
      setState((prev) => {
        if (cat.id) {
          return {
            ...prev,
            categorias: prev.categorias.map((c) => (c.id === cat.id ? { ...cat, id: c.id } : c)),
          };
        }
        return {
          ...prev,
          categorias: [...prev.categorias, { ...cat, id: Date.now() }],
        };
      });
      addToast({ type: 'success', title: 'Categoría y Caja Contable guardadas' });
    },
    [addToast]
  );

  const updateConfigGlobal = useCallback(
    (cfg: ConfigGlobalMP) => {
      setState((prev) => ({ ...prev, configGlobal: cfg }));
      addToast({ type: 'success', title: 'Parámetros globales guardados' });
    },
    [addToast]
  );

  // Motor en vivo de alertas críticas para NotificationPanel + ToastStack
  const criticalAlerts = useMemo<CriticalAlertItem[]>(() => {
    if (activeRole === 'PUBLICO_COMERCIO') return [];

    const alerts: CriticalAlertItem[] = [];
    const dependants = getDependantsOf(activeUser.dni);
    const familyIds = [activeUser.id, ...dependants.map((d) => d.id)];
    const userCats = getUserCategoriesInTemporada(activeUser.id, activeTemporadaId);
    const familyCats = familyIds.flatMap((id) => getUserCategoriesInTemporada(id, activeTemporadaId));
    const relevantCatIds =
      activeRole === 'MANAGER' && userCats.length > 0
        ? userCats.map((c) => c.id)
        : (activeRole === 'JUGADOR' || activeRole === 'SOCIO_TUTOR') && familyCats.length > 0
        ? Array.from(new Set(familyCats.map((c) => c.id)))
        : state.categorias.map((c) => c.id);

    // 1. Partido próximo
    const upcomingMatches = state.partidos
      .filter(
        (p) =>
          p.temporada_id === activeTemporadaId &&
          p.estado === 'PROGRAMADO' &&
          relevantCatIds.includes(p.categoria_id)
      )
      .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));

    const matchPool =
      upcomingMatches.length > 0
        ? upcomingMatches
        : state.partidos
            .filter((p) => p.temporada_id === activeTemporadaId && p.estado === 'PROGRAMADO')
            .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));

    matchPool.slice(0, 2).forEach((p) => {
      const cat = state.categorias.find((c) => c.id === p.categoria_id);
      const ref = state.referees.find((r) => r.id === p.referee_id);
      const targetScreen: ScreenId =
        activeRole === 'JUGADOR' || activeRole === 'SOCIO_TUTOR'
          ? 'dep_mis_partidos'
          : activeRole === 'MANAGER'
          ? 'dep_config_partido'
          : 'dep_fixture';
      alerts.push({
        id: `partido-${p.id}`,
        kind: 'PARTIDO_PROXIMO',
        eventLabel: 'Partido próximo',
        title: `Partido próximo · ${cat?.nombre ?? 'División'} vs ${p.rival}`,
        description: `${formatDateTimeAR(p.fecha_hora)} · ${p.condicion} en ${p.cancha}${
          ref ? ` · Referee: ${ref.nombre_completo}` : ''
        }.`,
        severity: 'info',
        timestamp: formatDateTimeAR(p.fecha_hora),
        categoryTag: cat?.nombre ?? 'Deportivo',
        targetScreen,
        actionLabel: activeRole === 'MANAGER' ? 'Configurar partido' : 'Ver fixture',
      });
    });

    // 2. Cuota vencida / pendiente crítica
    const anualidadActive = isUserCoveredByAnualidad(activeUser.id, 2026);
    if (activeRole === 'SOCIO_TUTOR' || activeRole === 'JUGADOR') {
      const myPendingCuotas = state.cuotasEmitidas.filter(
        (ce) =>
          ce.responsable_pago_dni === activeUser.dni &&
          ce.estado === 'PENDIENTE' &&
          !(
            anualidadActive &&
            state.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id)?.naturaleza === 'SOCIETARIA'
          )
      );
      if (myPendingCuotas.length > 0) {
        const totalPend = myPendingCuotas.reduce((acc, c) => acc + c.monto_final, 0);
        const firstDet = state.cuotasDetalle.find((d) => d.id === myPendingCuotas[0].cuota_detalle_id);
        alerts.push({
          id: `cuota-fam-${activeUser.dni}-${myPendingCuotas.length}`,
          kind: 'CUOTA_VENCIDA',
          eventLabel: 'Cuota vencida',
          title: `Cuota vencida · ${formatARS(totalPend)} pendientes (${myPendingCuotas.length} ítem/s)`,
          description: `Titular DNI ${activeUser.dni} (${firstDet?.codigo ?? 'Cuota'} y grupo familiar). Regularizable vía Checkout Pro Mercado Pago.`,
          severity: 'error',
          timestamp: 'Vto 15/11/2026',
          categoryTag: 'Cuotas y Tesorería',
          targetScreen: 'cuotas_pagar',
          actionLabel: 'Pagar ahora',
        });
      }
    } else {
      const clubPendingCuotas = state.cuotasEmitidas.filter((ce) => ce.estado === 'PENDIENTE');
      if (clubPendingCuotas.length > 0) {
        const totalClubPend = clubPendingCuotas.reduce((acc, c) => acc + c.monto_final, 0);
        alerts.push({
          id: `cuota-club-${clubPendingCuotas.length}-${totalClubPend}`,
          kind: 'CUOTA_VENCIDA',
          eventLabel: 'Cuota vencida',
          title: `Cuota vencida · ${clubPendingCuotas.length} cuota(s) impagas (${formatARS(totalClubPend)})`,
          description:
            'Emisiones societarias y deportivas pendientes de cobro en cajas virtuales o ventanilla.',
          severity: 'error',
          timestamp: 'Período Nov 2026',
          categoryTag: 'Morosidad Club',
          targetScreen: hasScreenAccess(activeRole, 'cuotas_pagos') ? 'cuotas_pagos' : 'dep_fixture',
          actionLabel: hasScreenAccess(activeRole, 'cuotas_pagos') ? 'Ver cobranza' : 'Ver detalle',
        });
      }
    }

    // 3. Apto médico vencido o por vencer / Fichaje irregular
    const fichajesAlerta = state.fichajes.filter((f) => {
      if (f.temporada_id !== activeTemporadaId) return false;
      const inScope =
        activeRole === 'SOCIO_TUTOR' || activeRole === 'JUGADOR'
          ? familyIds.includes(f.jugador_id)
          : relevantCatIds.includes(f.categoria_id);
      return inScope && f.estado_habilitacion !== 'HABILITADO';
    });
    if (fichajesAlerta.length > 0) {
      const f0 = fichajesAlerta[0];
      const jug = state.usuarios.find((u) => u.id === f0.jugador_id);
      const cat = state.categorias.find((c) => c.id === f0.categoria_id);
      alerts.push({
        id: `apto-${f0.id}-${f0.estado_habilitacion}`,
        kind: 'APTO_MEDICO',
        eventLabel: f0.estado_habilitacion === 'VENCIDO' ? 'Apto médico vencido' : 'Apto médico pendiente',
        title: `${
          f0.estado_habilitacion === 'VENCIDO' ? 'Apto médico vencido' : 'Apto médico pendiente'
        } · ${jug?.nombre ?? ''} ${jug?.apellido ?? ''}`,
        description: `${cat?.nombre ?? ''} · ${
          fichajesAlerta.length > 1
            ? `${fichajesAlerta.length} jugadores requieren regularización médica.`
            : 'Cargar certificado médico vigente para habilitar en planilla.'
        }`,
        severity: 'warning',
        timestamp: f0.fecha_vencimiento_apto ? formatDateAR(f0.fecha_vencimiento_apto) : 'Sin fecha',
        categoryTag: 'Deportivo · Fichajes',
        targetScreen:
          activeRole === 'SOCIO_TUTOR' || activeRole === 'JUGADOR'
            ? 'dep_mis_fichajes'
            : 'dep_config_fichajes',
        actionLabel: 'Revisar fichajes',
      });
    }

    // 4. Confirmación de pago recibida (Mercado Pago IPN o Efectivo validado)
    const confirmedTxs = state.transacciones.filter((t) => {
      if (t.estado_validacion === 'PENDIENTE_RECEPCION_EFECTIVO') return false;
      if (activeRole === 'SOCIO_TUTOR' || activeRole === 'JUGADOR') {
        return familyIds.includes(t.usuario_id);
      }
      return true;
    });
    const latestConfirmed = confirmedTxs[0];
    if (latestConfirmed) {
      const payer = state.usuarios.find((u) => u.id === latestConfirmed.usuario_id);
      alerts.push({
        id: `pago-ok-${latestConfirmed.id}`,
        kind: 'CONFIRMACION_PAGO',
        eventLabel: 'Confirmación de pago recibida',
        title: `Confirmación de pago recibida · ${formatARS(latestConfirmed.monto)}`,
        description: `${latestConfirmed.descripcion} (${
          latestConfirmed.medio_pago === 'MERCADO_PAGO'
            ? 'Webhook IPN Mercado Pago'
            : latestConfirmed.medio_pago === 'FONDO_PROPIO'
            ? 'Fondo Propio'
            : 'Efectivo Verificado'
        }${payer ? ` · ${payer.nombre} ${payer.apellido}` : ''}) -> ${latestConfirmed.codigo_caja_contable}.`,
        severity: 'success',
        timestamp: formatDateTimeAR(latestConfirmed.fecha),
        categoryTag: latestConfirmed.codigo_caja_contable,
        targetScreen: hasScreenAccess(activeRole, 'cuotas_pagos') ? 'cuotas_pagos' : 'cuotas_pagar',
        actionLabel: hasScreenAccess(activeRole, 'cuotas_pagos') ? 'Ver conciliación' : 'Ver mis pagos',
      });
    }

    // 5. Efectivo pendiente de confirmación (Manager / Tesorero / Admin / Pagador)
    const pendingCash = state.transacciones.filter((t) => {
      if (t.estado_validacion !== 'PENDIENTE_RECEPCION_EFECTIVO') return false;
      if (activeRole === 'MANAGER') return t.receptor_efectivo_id === activeUser.id;
      if (activeRole === 'SOCIO_TUTOR' || activeRole === 'JUGADOR') {
        return familyIds.includes(t.usuario_id);
      }
      return true;
    });
    if (pendingCash.length > 0) {
      const txCash = pendingCash[0];
      const mgr = state.usuarios.find((u) => u.id === txCash.receptor_efectivo_id);
      alerts.push({
        id: `cash-pend-${txCash.id}`,
        kind: 'EFECTIVO_PENDIENTE',
        eventLabel: 'Efectivo pendiente',
        title: `Efectivo pendiente de recepción · ${formatARS(txCash.monto)}`,
        description: `${txCash.descripcion} · Declarado a ${mgr?.nombre ?? 'Manager'} ${
          mgr?.apellido ?? ''
        } (estado PENDIENTE_RECEPCION_EFECTIVO).`,
        severity: 'warning',
        timestamp: formatDateTimeAR(txCash.fecha),
        categoryTag: txCash.codigo_caja_contable,
        targetScreen:
          activeRole === 'ADMIN'
            ? 'admin_config'
            : activeRole === 'MANAGER'
            ? 'dep_config_fichajes'
            : hasScreenAccess(activeRole, 'cuotas_pagos')
            ? 'cuotas_pagos'
            : 'dep_mis_fichajes',
        actionLabel: 'Confirmar efectivo',
      });
    }

    return alerts;
  }, [
    state.partidos,
    state.categorias,
    state.referees,
    state.cuotasEmitidas,
    state.cuotasDetalle,
    state.fichajes,
    state.transacciones,
    state.usuarios,
    activeRole,
    activeUser,
    activeTemporadaId,
    getDependantsOf,
    getUserCategoriesInTemporada,
    isUserCoveredByAnualidad,
  ]);

  const unreadAlertCount = useMemo(
    () => criticalAlerts.filter((a) => !readAlertIds.includes(a.id)).length,
    [criticalAlerts, readAlertIds]
  );

  const markAlertRead = useCallback((id: string) => {
    setReadAlertIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setReadAlertIds(criticalAlerts.map((a) => a.id));
  }, [criticalAlerts]);

  const triggerAlertToast = useCallback(
    (alert: CriticalAlertItem) => {
      addToast({
        type: alert.severity,
        category: alert.eventLabel,
        title: alert.title,
        description: alert.description,
        actionLabel: hasScreenAccess(activeRole, alert.targetScreen) ? alert.actionLabel : undefined,
        targetScreen: hasScreenAccess(activeRole, alert.targetScreen) ? alert.targetScreen : undefined,
        timestamp: alert.timestamp,
      });
      setReadAlertIds((prev) => (prev.includes(alert.id) ? prev : [...prev, alert.id]));
    },
    [addToast, activeRole]
  );

  const triggerAllCriticalAlerts = useCallback(
    (kinds?: CriticalAlertKind[]) => {
      const selected = kinds
        ? criticalAlerts.filter((a) => kinds.includes(a.kind))
        : criticalAlerts.slice(0, 4);

      if (selected.length === 0) {
        addToast({
          type: 'info',
          category: 'Centro de Alertas',
          title: 'Sin alertas críticas pendientes',
          description: 'No hay eventos críticos activos para este rol en la temporada actual.',
        });
        return;
      }

      selected.forEach((alert, idx) => {
        setTimeout(() => {
          triggerAlertToast(alert);
        }, idx * 140);
      });
    },
    [criticalAlerts, triggerAlertToast, addToast]
  );

  const simulateCriticalEvent = useCallback(
    (kind: 'PARTIDO_PROXIMO' | 'CUOTA_VENCIDA' | 'CONFIRMACION_PAGO') => {
      const existing = criticalAlerts.find((a) => a.kind === kind);
      if (existing) {
        triggerAlertToast(existing);
        return;
      }

      if (kind === 'PARTIDO_PROXIMO') {
        addToast({
          type: 'info',
          category: 'Partido próximo',
          title: 'Partido próximo · Guaycurues vs CRAR Rafaela',
          description:
            'Sábado 21/11/2026 14:30 hs · Cancha Principal Predio Guaycurues (Referee asignado).',
          actionLabel: hasScreenAccess(activeRole, 'dep_fixture') ? 'Ver fixture' : undefined,
          targetScreen: hasScreenAccess(activeRole, 'dep_fixture') ? 'dep_fixture' : undefined,
        });
      } else if (kind === 'CUOTA_VENCIDA') {
        addToast({
          type: 'error',
          category: 'Cuota vencida',
          title: 'Cuota vencida · Período Noviembre 2026',
          description:
            'Se detectó una cuota societaria/deportiva vencida pendiente de pago vía Mercado Pago o Tesorería.',
          actionLabel: hasScreenAccess(activeRole, 'cuotas_pagar')
            ? 'Ir a pagar'
            : hasScreenAccess(activeRole, 'cuotas_pagos')
            ? 'Ver cobranza'
            : undefined,
          targetScreen: hasScreenAccess(activeRole, 'cuotas_pagar')
            ? 'cuotas_pagar'
            : hasScreenAccess(activeRole, 'cuotas_pagos')
            ? 'cuotas_pagos'
            : undefined,
        });
      } else {
        addToast({
          type: 'success',
          category: 'Confirmación de pago recibida',
          title: 'Confirmación de pago recibida · Mercado Pago IPN',
          description:
            'Acreditación verificada en CAJA_CLUB_SOCIETARIA. Comprobante digital registrado en el historial.',
          actionLabel: hasScreenAccess(activeRole, 'cuotas_pagos')
            ? 'Ver conciliación'
            : hasScreenAccess(activeRole, 'cuotas_pagar')
            ? 'Ver historial'
            : undefined,
          targetScreen: hasScreenAccess(activeRole, 'cuotas_pagos')
            ? 'cuotas_pagos'
            : hasScreenAccess(activeRole, 'cuotas_pagar')
            ? 'cuotas_pagar'
            : undefined,
        });
      }
    },
    [criticalAlerts, triggerAlertToast, addToast, activeRole]
  );

  return (
    <ClubContext.Provider
      value={{
        state,
        activeRole,
        activeUser,
        activeTemporadaId,
        activeTemporada,
        activeScreen,
        sidebarPinned,
        mobileMenuOpen,
        selectedTicketToken,
        pendingCheckout,
        toasts,
        simulatedWalletUserId,
        simulatedWalletBalance,
        isAnualidadSimActive,
        setActiveRole,
        setActiveUserId,
        setActiveTemporadaId,
        setActiveScreen,
        setSidebarPinned,
        setMobileMenuOpen,
        setSelectedTicketToken,
        toggleFondoPropioSim,
        toggleAnualidadSim,
        resetDemo,
        addToast,
        dismissToast,
        clearToasts,
        criticalAlerts,
        readAlertIds,
        unreadAlertCount,
        notificationPanelOpen,
        setNotificationPanelOpen,
        markAlertRead,
        markAllAlertsRead,
        triggerAlertToast,
        triggerAllCriticalAlerts,
        simulateCriticalEvent,
        isUserCoveredByAnualidad,
        getUserCategoriesInTemporada,
        getManagersForCategoria,
        getDependantsOf,
        openMercadoPagoCheckout,
        closeMercadoPagoCheckout,
        confirmMercadoPagoPayment,
        cobrarCuotasEfectivoTesorero,
        registrarPagoEfectivoManager,
        confirmarRecepcionEfectivo,
        pagarConFondoPropio,
        upsertCuotaDetalle,
        deleteCuotaDetalle,
        updateCuotasCabecera,
        generarCuotasPeriodo,
        editarCuotaEmitida,
        crearCampaniaVenta,
        declararVentas,
        toggleSimularFechaVencida,
        canjearTicketQR,
        crearTemporada,
        cambiarEstadoTemporada,
        asignarMiembroTemporada,
        agregarReferee,
        crearPartido,
        cargarPlanillaPostPartido,
        crearTorneo,
        actualizarAptoMedico,
        actualizarValorFichajeCategoria,
        crearTercerTiempo,
        toggleInscripcionChecklistTT,
        liquidarTercerTiempo,
        toggleInscripcionAyuda,
        crearEventoAyuda,
        eliminarEventoAyuda,
        crearAsamblea,
        eliminarAsamblea,
        crearNoticia,
        eliminarNoticia,
        toggleUsuarioRol,
        upsertCategoria,
        updateConfigGlobal,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
};

export function useClub(): ClubContextValue {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error('useClub must be used inside ClubProvider');
  return ctx;
}
