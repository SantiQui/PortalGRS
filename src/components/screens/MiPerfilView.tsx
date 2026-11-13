import React, { useMemo } from 'react';
import {
  ArrowRight,
  CreditCard,
  QrCode,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { hasScreenAccess, ROLE_OPTIONS } from '../../config/rbac';
import { useClub } from '../../context/ClubContext';
import { formatARS, formatDateAR, formatDateTimeAR, MESES_NOMBRES } from '../../utils/format';
import { StatusLabel } from '../shared/StatusIndicator';

export const MiPerfilView: React.FC = () => {
  const {
    state,
    activeRole,
    activeUser,
    activeTemporada,
    activeTemporadaId,
    setActiveScreen,
    isUserCoveredByAnualidad,
    getUserCategoriesInTemporada,
    getDependantsOf,
  } = useClub();

  const roleInfo = ROLE_OPTIONS.find((r) => r.id === activeRole);
  const dependants = getDependantsOf(activeUser.dni);
  const familyIds = useMemo(
    () => [activeUser.id, ...dependants.map((d) => d.id)],
    [activeUser.id, dependants]
  );
  const anualidadCubierta = isUserCoveredByAnualidad(activeUser.id, 2026);
  const myCategories = getUserCategoriesInTemporada(activeUser.id, activeTemporadaId);

  const initials = `${activeUser.nombre.charAt(0)}${activeUser.apellido.charAt(0)}`.toUpperCase();

  // Contexto operativo / deportivo específico según rol activo
  const myFichaje = state.fichajes.find(
    (f) => f.temporada_id === activeTemporadaId && f.jugador_id === activeUser.id
  );
  const managerPendingCash = state.transacciones.filter(
    (t) =>
      t.estado_validacion === 'PENDIENTE_RECEPCION_EFECTIVO' &&
      t.receptor_efectivo_id === activeUser.id
  );
  const allPendingCash = state.transacciones.filter(
    (t) => t.estado_validacion === 'PENDIENTE_RECEPCION_EFECTIVO'
  );

  // ---------------------------------------------------------------------------
  // 1. Historial de Cuotas Pagadas (adaptado al rol activo)
  // ---------------------------------------------------------------------------
  const isClubTreasuryView =
    activeRole === 'TESORERO' || activeRole === 'ADMIN' || activeRole === 'COMISION';

  const paidCuotasHistory = useMemo(() => {
    const base = state.cuotasEmitidas.filter(
      (ce) => ce.estado === 'PAGADA' || ce.estado === 'EXENTA_POR_ANUAL'
    );

    const scoped = base.filter((ce) => {
      if (activeRole === 'SOCIO_TUTOR') {
        return ce.responsable_pago_dni === activeUser.dni || familyIds.includes(ce.usuario_id);
      }
      if (activeRole === 'JUGADOR' || activeRole === 'COORDINADOR') {
        return ce.usuario_id === activeUser.id || ce.responsable_pago_dni === activeUser.dni;
      }
      if (activeRole === 'MANAGER') {
        // Cuotas propias del manager + cuotas deportivas pagas de jugadores de su división
        if (ce.usuario_id === activeUser.id || ce.responsable_pago_dni === activeUser.dni) {
          return true;
        }
        const memberCats = getUserCategoriesInTemporada(ce.usuario_id, activeTemporadaId);
        return memberCats.some((mc) => myCategories.some((c) => c.id === mc.id));
      }
      // TESORERO, ADMIN, COMISION -> auditoría / vista de cuotas pagadas del club
      return true;
    });

    return scoped
      .map((ce) => {
        const detalle = state.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id);
        const beneficiario = state.usuarios.find((u) => u.id === ce.usuario_id);
        const ordenMP = ce.orden_pago_mp_id
          ? state.ordenesMP.find((o) => o.id === ce.orden_pago_mp_id)
          : undefined;
        const periodoLabel =
          ce.mes !== null
            ? `${MESES_NOMBRES[ce.mes - 1]} ${ce.anio}`
            : `Anual ${ce.anio}`;

        return {
          id: ce.id,
          codigo: detalle?.codigo ?? 'CUOTA',
          descripcion: detalle?.descripcion ?? 'Cuota societaria / deportiva',
          caja: detalle?.codigo_caja_contable ?? 'CAJA_CLUB_SOCIETARIA',
          beneficiarioNombre: beneficiario
            ? `${beneficiario.nombre} ${beneficiario.apellido}`
            : `Usuario #${ce.usuario_id}`,
          esPropiaOFamiliar:
            ce.usuario_id === activeUser.id ||
            ce.responsable_pago_dni === activeUser.dni ||
            familyIds.includes(ce.usuario_id),
          periodoLabel,
          fechaPago: ce.fecha_pago,
          medioPago: ce.estado === 'EXENTA_POR_ANUAL'
            ? 'Exenta por Anualidad'
            : ordenMP
            ? `Mercado Pago (${ordenMP.mp_payment_id ?? ordenMP.external_reference})`
            : 'Efectivo / Ventanilla',
          montoFinal: ce.monto_final,
          estado: ce.estado,
        };
      })
      .sort((a, b) => (b.fechaPago ?? '').localeCompare(a.fechaPago ?? ''));
  }, [
    state.cuotasEmitidas,
    state.cuotasDetalle,
    state.usuarios,
    state.ordenesMP,
    activeRole,
    activeUser.id,
    activeUser.dni,
    familyIds,
    myCategories,
    activeTemporadaId,
    getUserCategoriesInTemporada,
  ]);

  const totalCuotasPagadasMonto = paidCuotasHistory.reduce((acc, c) => acc + c.montoFinal, 0);

  // ---------------------------------------------------------------------------
  // 2. Estado de Ventas Asociadas (adaptado al rol activo)
  // ---------------------------------------------------------------------------
  const associatedSales = useMemo(() => {
    const myCatIds = myCategories.map((c) => c.id);

    const scopedDeclarations = state.declaracionesVenta.filter((decl) => {
      const camp = state.campaniasVenta.find((c) => c.id === decl.venta_id);
      if (camp && camp.temporada_id !== activeTemporadaId) return false;

      if (activeRole === 'JUGADOR') {
        return decl.jugador_id === activeUser.id;
      }
      if (activeRole === 'SOCIO_TUTOR') {
        return familyIds.includes(decl.jugador_id);
      }
      if (activeRole === 'MANAGER') {
        const playerCats = getUserCategoriesInTemporada(decl.jugador_id, activeTemporadaId);
        return playerCats.some((pc) => myCatIds.includes(pc.id));
      }
      // COORDINADOR, ADMIN, TESORERO, COMISION -> visibilidad general de campañas de temporada
      return true;
    });

    return scopedDeclarations.map((decl) => {
      const camp = state.campaniasVenta.find((c) => c.id === decl.venta_id);
      const vendedor = state.usuarios.find((u) => u.id === decl.jugador_id);
      const tickets = state.ticketsQR.filter((t) => t.declaracion_id === decl.id);
      const ticketsCanjeados = tickets.filter((t) => t.estado === 'ENTREGADO').length;
      const ticketsPendientes = tickets.filter((t) => t.estado === 'PENDIENTE').length;
      const montoVenta = decl.cantidad_declarada * (camp?.valor_unitario ?? 0);
      const montoTotal = montoVenta + (decl.multa_minimo_generada ? decl.monto_multa : 0);
      const gananciaFondo =
        camp?.destino_ganancia === 'FONDO_JUGADOR'
          ? Math.round(montoVenta * (camp.porcentaje_ganancia / 100))
          : 0;
      const minimo = camp?.minimo_unidades ?? 0;
      const cumpleMinimo = decl.cantidad_declarada >= minimo;

      return {
        id: decl.id,
        campaniaTitulo: camp?.titulo ?? `Campaña #${decl.venta_id}`,
        fechaLimite: camp?.fecha_limite ?? '2026-11-30',
        destinoGanancia: camp?.destino_ganancia ?? 'CLUB',
        porcentajeGanancia: camp?.porcentaje_ganancia ?? 0,
        simularVencida: camp?.simular_vencida ?? false,
        vendedorNombre: vendedor
          ? `${vendedor.nombre} ${vendedor.apellido}`
          : `Jugador #${decl.jugador_id}`,
        cantidadDeclarada: decl.cantidad_declarada,
        minimoUnidades: minimo,
        cumpleMinimo,
        multaGenerada: decl.multa_minimo_generada,
        montoMulta: decl.monto_multa,
        montoTotal,
        gananciaFondo,
        estadoPago: decl.estado_pago,
        ticketsTotal: tickets.length,
        ticketsCanjeados,
        ticketsPendientes,
      };
    });
  }, [
    state.declaracionesVenta,
    state.campaniasVenta,
    state.usuarios,
    state.ticketsQR,
    activeTemporadaId,
    activeRole,
    activeUser.id,
    familyIds,
    myCategories,
    getUserCategoriesInTemporada,
  ]);

  const fondoCreditsFromSales = useMemo(() => {
    const targetIds =
      activeRole === 'SOCIO_TUTOR'
        ? familyIds
        : activeRole === 'JUGADOR'
        ? [activeUser.id]
        : [];
    if (targetIds.length === 0) return [];
    return state.fondoPropioMovimientos
      .filter((m) => targetIds.includes(m.usuario_id) && m.tipo === 'ACREDITACION_VENTA')
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [state.fondoPropioMovimientos, activeRole, activeUser.id, familyIds]);

  const cuotasSectionMeta = (() => {
    switch (activeRole) {
      case 'SOCIO_TUTOR':
        return {
          title: 'Historial de Cuotas Pagadas del Grupo Familiar',
          subtitle: `Pagos aprobados y exenciones de ${activeUser.nombre} ${activeUser.apellido} y dependientes bajo DNI ${activeUser.dni}`,
        };
      case 'JUGADOR':
        return {
          title: 'Mi Historial de Cuotas Pagadas',
          subtitle: 'Cuotas societarias y deportivas regularizadas a tu nombre',
        };
      case 'MANAGER':
        return {
          title: 'Cuotas Pagadas (Personal y División)',
          subtitle: `Tus cuotas personales y pagos regularizados en ${myCategories[0]?.nombre ?? 'tu categoría'}`,
        };
      case 'TESORERO':
        return {
          title: 'Registro de Cuotas Cobradas (Tesorería)',
          subtitle: 'Auditoría de cuotas regularizadas vía Mercado Pago, Ventanilla o Anualidad',
        };
      case 'COMISION':
        return {
          title: 'Historial de Cuotas Pagadas del Club (Solo Lectura)',
          subtitle: 'Supervisión institucional de cuotas aprobadas en cajas virtuales',
        };
      case 'ADMIN':
        return {
          title: 'Historial Global de Cuotas Pagadas',
          subtitle: 'Control integral de cuotas aprobadas y cobertura anual 2026',
        };
      default:
        return {
          title: 'Mi Historial de Cuotas Pagadas',
          subtitle: 'Comprobantes de cuotas abonadas a tu nombre',
        };
    }
  })();

  const ventasSectionMeta = (() => {
    switch (activeRole) {
      case 'JUGADOR':
        return {
          title: 'Estado de Mis Ventas Asociadas',
          subtitle: 'Seguimiento de campañas declaradas, vouchers QR y créditos a Fondo Propio',
        };
      case 'SOCIO_TUTOR':
        return {
          title: 'Estado de Ventas del Grupo Familiar',
          subtitle: 'Campañas declaradas por tus dependientes, mínimos de venta y tickets QR',
        };
      case 'MANAGER':
        return {
          title: 'Ventas Asociadas de Tu Categoría',
          subtitle: `Cumplimiento de campañas y vouchers QR en ${myCategories[0]?.nombre ?? 'tu división'}`,
        };
      case 'COORDINADOR':
        return {
          title: 'Estado General de Ventas de Temporada',
          subtitle: 'Avance de declaraciones, mínimos de unidad y canje de vouchers QR por campaña',
        };
      case 'TESORERO':
      case 'COMISION':
        return {
          title: 'Estado Financiero de Ventas Asociadas',
          subtitle: 'Rendiciones declaradas en campañas de recaudación y estado de ingreso en caja',
        };
      default:
        return {
          title: 'Estado Consolidado de Ventas Asociadas',
          subtitle: 'Supervisión de todas las declaraciones y tickets QR de la temporada',
        };
    }
  })();

  return (
    <div className="space-y-6">
      {/* 1. Datos Personales + Contexto del Rol Activo */}
      <section
        aria-labelledby="perfil-datos-heading"
        className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-slate-900 text-white font-display font-bold text-lg flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>Rol activo: {roleInfo?.label}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">DNI {activeUser.dni}</span>
                <span aria-hidden="true">·</span>
                <span>{activeTemporada.nombre}</span>
              </div>
              <h2
                id="perfil-datos-heading"
                className="font-display text-xl font-bold text-slate-900 mt-0.5 truncate"
              >
                {activeUser.nombre} {activeUser.apellido}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {anualidadCubierta && (
              <StatusLabel tone="emerald" label="Anualidad 2026 Cubierta" />
            )}
            <StatusLabel
              tone={activeUser.activo ? 'emerald' : 'rose'}
              label={activeUser.activo ? 'Padrón Activo' : 'Inactivo'}
            />
          </div>
        </div>

        {/* Grilla limpia de datos personales */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          <div>
            <dt className="text-xs text-slate-500">Correo electrónico</dt>
            <dd className="text-sm font-medium text-slate-900 mt-0.5 break-all">
              {activeUser.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">WhatsApp y notificaciones</dt>
            <dd className="text-sm font-medium text-slate-900 mt-0.5 font-mono tabular-nums">
              {activeUser.telefono_whatsapp ?? 'No registrado'}{' '}
              <span className="font-sans text-xs font-normal text-slate-500">
                ({activeUser.notificar_whatsapp ? 'Opt-in activo' : 'Sin opt-in'})
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Fecha de nacimiento</dt>
            <dd className="text-sm font-medium text-slate-900 mt-0.5 font-mono tabular-nums">
              {formatDateAR(activeUser.fecha_nacimiento)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Billetera Fondo Propio</dt>
            <dd className="text-sm font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
              {formatARS(activeUser.saldo_fondo_propio)}
              <span className="font-sans text-xs font-normal text-slate-500 ml-2">
                {activeUser.saldo_fondo_propio >= 10000
                  ? 'Habilitado para Fichaje / 3T'
                  : 'Saldo bajo para débitos'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Roles habilitados en sistema</dt>
            <dd className="text-sm font-medium text-slate-900 mt-0.5">
              {activeUser.roles
                .map((r) => ROLE_OPTIONS.find((opt) => opt.id === r)?.shortLabel ?? r)
                .join(' · ')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">Cobertura societaria 2026</dt>
            <dd className="text-sm font-medium text-slate-900 mt-0.5">
              {anualidadCubierta
                ? 'Anualidad cubriendo cuotas societarias'
                : 'Facturación mensual regular'}
            </dd>
          </div>
        </dl>

        {/* Contexto específico del Rol Activo */}
        <div className="pt-5 border-t border-slate-100 space-y-3">
          {activeRole === 'SOCIO_TUTOR' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-600 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Grupo Familiar Vinculado (depende_de DNI {activeUser.dni})
                  </h3>
                </div>
                <span className="font-mono tabular-nums text-xs text-slate-500">
                  {dependants.length} dependiente(s)
                </span>
              </div>
              {dependants.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {dependants.map((dep) => {
                    const depCats = getUserCategoriesInTemporada(dep.id, activeTemporadaId);
                    const depFichaje = state.fichajes.find(
                      (f) => f.temporada_id === activeTemporadaId && f.jugador_id === dep.id
                    );
                    return (
                      <div
                        key={dep.id}
                        className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 text-sm">
                            {dep.nombre} {dep.apellido}
                          </span>
                          <span className="text-slate-500 ml-2 font-mono tabular-nums">
                            DNI {dep.dni}
                          </span>
                          <div className="text-slate-600 mt-0.5">
                            {depCats.map((c) => c.nombre).join(', ') || 'Sin división'} · Apto:{' '}
                            {depFichaje?.estado_habilitacion ?? 'Sin fichaje'}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono tabular-nums font-semibold text-emerald-700">
                            Fondo Propio: {formatARS(dep.saldo_fondo_propio)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Sin dependientes vinculados.</p>
              )}
            </>
          )}

          {activeRole === 'JUGADOR' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-600 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Situación Deportiva ({activeTemporada.nombre})
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  División:{' '}
                  <strong className="text-slate-900">
                    {myCategories.map((c) => c.nombre).join(', ') || 'Sin asignar'}
                  </strong>{' '}
                  · Vto Apto Médico:{' '}
                  <span className="font-mono tabular-nums">
                    {formatDateAR(myFichaje?.fecha_vencimiento_apto ?? null)}
                  </span>{' '}
                  · Cuotas de Fichaje:{' '}
                  <span className="font-mono tabular-nums">
                    {myFichaje ? `${myFichaje.cuotas_pagas}/${myFichaje.cuotas_totales}` : '—'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusLabel
                  tone={
                    myFichaje?.estado_habilitacion === 'HABILITADO'
                      ? 'emerald'
                      : myFichaje?.estado_habilitacion === 'VENCIDO' ||
                        myFichaje?.estado_habilitacion === 'PENDIENTE_APTO'
                      ? 'rose'
                      : 'amber'
                  }
                  label={myFichaje?.estado_habilitacion ?? 'SIN_FICHAJE'}
                />
                {hasScreenAccess(activeRole, 'dep_mis_fichajes') && (
                  <button
                    onClick={() => setActiveScreen('dep_mis_fichajes')}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Ver fichaje</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {activeRole === 'MANAGER' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Asignación de Manager y Custodia de Efectivo
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  División a cargo:{' '}
                  <strong className="text-slate-900">
                    {myCategories.map((c) => `${c.nombre} (${c.codigo_caja_contable})`).join(', ') ||
                      'M16 Juvenil'}
                  </strong>{' '}
                  · Rendiciones en efectivo a tu nombre pendientes de validación:{' '}
                  <strong className="font-mono tabular-nums text-slate-900">
                    {managerPendingCash.length}
                  </strong>
                </p>
              </div>
              {hasScreenAccess(activeRole, 'dep_config_fichajes') && (
                <button
                  onClick={() => setActiveScreen('dep_config_fichajes')}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>Gestionar división</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {(activeRole === 'TESORERO' ||
            activeRole === 'ADMIN' ||
            activeRole === 'COORDINADOR' ||
            activeRole === 'COMISION') && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Alcance Institucional del Rol ({roleInfo?.label})
                  </h3>
                </div>
                <p className="text-xs text-slate-600">
                  {activeRole === 'TESORERO' &&
                    `${state.cuotasDetalle.filter((d) => d.activa).length} subtipos de cuota activos · ${state.ordenesMP.length} órdenes Mercado Pago aprobadas · ${allPendingCash.length} rendición(es) en efectivo por confirmar.`}
                  {activeRole === 'COORDINADOR' &&
                    `${state.campaniasVenta.filter((c) => c.temporada_id === activeTemporadaId).length} campaña(s) de venta · ${state.torneos.filter((t) => t.temporada_id === activeTemporadaId).length} torneo(s) · ${state.referees.filter((r) => r.temporada_id === activeTemporadaId).length} referee(s) habilitados.`}
                  {activeRole === 'COMISION' &&
                    `${state.asambleas.length} minuta(s) semanales registradas · ${state.noticias.length} noticias publicadas · ${state.eventosAyuda.length} convocatorias Ayuda al Club.`}
                  {activeRole === 'ADMIN' &&
                    `${state.usuarios.filter((u) => u.activo).length} usuarios activos · ${state.temporadas.length} temporadas · ${allPendingCash.length} rendición(es) de efectivo pendientes de validación.`}
                </p>
              </div>
              {activeRole === 'TESORERO' && hasScreenAccess(activeRole, 'cuotas_pagos') && (
                <button
                  onClick={() => setActiveScreen('cuotas_pagos')}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>Ir a Ver Pagos y Cajas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {activeRole === 'COORDINADOR' && hasScreenAccess(activeRole, 'ventas_configurar') && (
                <button
                  onClick={() => setActiveScreen('ventas_configurar')}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>Configurar campañas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {activeRole === 'COMISION' && hasScreenAccess(activeRole, 'club_abm') && (
                <button
                  onClick={() => setActiveScreen('club_abm')}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>Gestionar actas y noticias</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {activeRole === 'ADMIN' && hasScreenAccess(activeRole, 'admin_config') && (
                <button
                  onClick={() => setActiveScreen('admin_config')}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>Ir a Bandeja Admin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. Historial de Cuotas Pagadas (adaptado al rol activo) */}
      <section
        aria-labelledby="perfil-cuotas-heading"
        className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-start gap-2.5">
            <Receipt className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
            <div>
              <h2
                id="perfil-cuotas-heading"
                className="font-display text-base font-semibold text-slate-900"
              >
                {cuotasSectionMeta.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{cuotasSectionMeta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-[11px] text-slate-500">
                {paidCuotasHistory.length} cuota(s) regularizada(s)
              </div>
              <div className="font-mono tabular-nums text-sm font-bold text-slate-900">
                {formatARS(totalCuotasPagadasMonto)}
              </div>
            </div>
            {hasScreenAccess(activeRole, 'cuotas_pagar') && (
              <button
                onClick={() => setActiveScreen('cuotas_pagar')}
                className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Pagar Cuotas</span>
              </button>
            )}
          </div>
        </div>

        {paidCuotasHistory.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-xs text-slate-500">
              No se registran cuotas pagadas para este perfil en la sesión actual.
            </p>
            {hasScreenAccess(activeRole, 'cuotas_pagar') && (
              <button
                onClick={() => setActiveScreen('cuotas_pagar')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                Ir al portal de pagos de cuotas
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 pr-4">Período / Fecha Pago</th>
                  <th className="py-2.5 pr-4">Cuota y Caja</th>
                  {(isClubTreasuryView ||
                    activeRole === 'SOCIO_TUTOR' ||
                    activeRole === 'MANAGER') && <th className="py-2.5 pr-4">Beneficiario</th>}
                  <th className="py-2.5 pr-4">Canal de Pago</th>
                  <th className="py-2.5 pr-4 text-right">Importe</th>
                  <th className="py-2.5 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paidCuotasHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{item.periodoLabel}</div>
                      <div className="font-mono tabular-nums text-[11px] text-slate-500">
                        {item.fechaPago ? formatDateTimeAR(item.fechaPago) : 'Exención automática'}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-slate-900">
                        <span className="font-mono">{item.codigo}</span> · {item.descripcion}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">{item.caja}</div>
                    </td>
                    {(isClubTreasuryView ||
                      activeRole === 'SOCIO_TUTOR' ||
                      activeRole === 'MANAGER') && (
                      <td className="py-3 pr-4 whitespace-nowrap text-slate-700">
                        {item.beneficiarioNombre}
                        {item.esPropiaOFamiliar && isClubTreasuryView && (
                          <span className="text-slate-400 ml-1">(Propia)</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 pr-4 text-slate-600">{item.medioPago}</td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {formatARS(item.montoFinal)}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <StatusLabel
                        tone={item.estado === 'EXENTA_POR_ANUAL' ? 'sky' : 'emerald'}
                        label={item.estado}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 3. Estado de Ventas Asociadas (adaptado al rol activo) */}
      <section
        aria-labelledby="perfil-ventas-heading"
        className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-start gap-2.5">
            <ShoppingBag className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
            <div>
              <h2
                id="perfil-ventas-heading"
                className="font-display text-base font-semibold text-slate-900"
              >
                {ventasSectionMeta.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{ventasSectionMeta.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasScreenAccess(activeRole, 'ventas_mis_ventas') && (
              <button
                onClick={() => setActiveScreen('ventas_mis_ventas')}
                className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>Ir a Mis Ventas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {activeRole === 'COORDINADOR' &&
              hasScreenAccess(activeRole, 'ventas_validar_ticket') && (
                <button
                  onClick={() => setActiveScreen('ventas_validar_ticket')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Validar QR</span>
                </button>
              )}
          </div>
        </div>

        {associatedSales.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-xs text-slate-500">
              No hay declaraciones de venta asociadas en {activeTemporada.nombre} para este perfil.
            </p>
            {hasScreenAccess(activeRole, 'ventas_mis_ventas') && (
              <button
                onClick={() => setActiveScreen('ventas_mis_ventas')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                Declarar ventas en campañas activas
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {associatedSales.map((sale) => (
              <div
                key={sale.id}
                className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {activeRole !== 'JUGADOR' && (
                      <>
                        <span className="font-medium text-slate-700">
                          Vendedor: {sale.vendedorNombre}
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    )}
                    <span className="font-mono tabular-nums">
                      Límite: {formatDateAR(sale.fechaLimite)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {sale.destinoGanancia === 'FONDO_JUGADOR'
                        ? `Fondo Propio (${sale.porcentajeGanancia}%)`
                        : `Destino: ${sale.destinoGanancia}`}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-slate-900 leading-snug">
                    {sale.campaniaTitulo}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="font-mono tabular-nums">
                      Unidades: <strong className="text-slate-900">{sale.cantidadDeclarada}</strong>{' '}
                      / mín. {sale.minimoUnidades}
                    </span>
                    <span className="font-mono tabular-nums">
                      QR: {sale.ticketsTotal} emitido(s) ({sale.ticketsCanjeados} canjeado ·{' '}
                      {sale.ticketsPendientes} disponible)
                    </span>
                    {sale.gananciaFondo > 0 && (
                      <span className="font-mono tabular-nums text-emerald-700 font-medium">
                        Fondo Propio: +{formatARS(sale.gananciaFondo)}
                      </span>
                    )}
                    {sale.multaGenerada && sale.montoMulta > 0 && (
                      <span className="font-mono tabular-nums text-rose-700 font-medium">
                        Cargo mínimo incumplido: +{formatARS(sale.montoMulta)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500">
                      {sale.cumpleMinimo ? 'Mínimo cubierto' : 'Debajo del mínimo'}
                    </div>
                    <div className="font-mono tabular-nums text-sm font-bold text-slate-900">
                      {formatARS(sale.montoTotal)}
                    </div>
                  </div>
                  <StatusLabel
                    tone={
                      sale.estadoPago === 'PAGADA'
                        ? 'emerald'
                        : sale.estadoPago === 'PENDIENTE_RECEPCION_EFECTIVO'
                        ? 'amber'
                        : sale.multaGenerada
                        ? 'rose'
                        : 'slate'
                    }
                    label={sale.estadoPago}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Acreditaciones previas de ventas a Fondo Propio (solo para Jugador o Socio/Tutor si existen) */}
        {fondoCreditsFromSales.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Acreditaciones previas a Fondo Propio por ventas</span>
            </div>
            <div className="divide-y divide-slate-100">
              {fondoCreditsFromSales.map((mov) => {
                const owner = state.usuarios.find((u) => u.id === mov.usuario_id);
                return (
                  <div
                    key={mov.id}
                    className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-mono tabular-nums text-slate-500 mr-2">
                        {formatDateAR(mov.fecha)}
                      </span>
                      <span className="text-slate-800 font-medium">{mov.descripcion}</span>
                      {activeRole === 'SOCIO_TUTOR' && owner && (
                        <span className="text-slate-500 ml-1.5">
                          ({owner.nombre} {owner.apellido})
                        </span>
                      )}
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-emerald-700 whitespace-nowrap">
                      +{formatARS(mov.monto)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
