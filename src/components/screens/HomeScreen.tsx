import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileCheck,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import { ROLE_OPTIONS } from '../../config/rbac';
import { useClub } from '../../context/ClubContext';
import { ScreenId } from '../../types/srs';
import { daysUntil, formatARS, formatDateAR, formatDateTimeAR } from '../../utils/format';
import { StatusLabel } from '../shared/StatusIndicator';
import { MiPerfilView } from './MiPerfilView';

export const HomeScreen: React.FC = () => {
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

  const [activeTab, setActiveTab] = useState<'actividad' | 'perfil'>('actividad');
  const roleInfo = ROLE_OPTIONS.find((r) => r.id === activeRole);
  const dependants = getDependantsOf(activeUser.dni);
  const familyIds = [activeUser.id, ...dependants.map((d) => d.id)];
  const anualidadCubierta = isUserCoveredByAnualidad(activeUser.id, 2026);

  // Cuotas pendientes propias + depende_de
  const pendingFamilyCuotas = state.cuotasEmitidas.filter(
    (ce) =>
      ce.responsable_pago_dni === activeUser.dni &&
      ce.estado === 'PENDIENTE' &&
      !(
        anualidadCubierta &&
        state.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id)?.naturaleza === 'SOCIETARIA'
      )
  );
  const totalPendingFamily = pendingFamilyCuotas.reduce((s, c) => s + c.monto_final, 0);

  // Categorías asignadas en la temporada
  const myCategories = getUserCategoriesInTemporada(activeUser.id, activeTemporadaId);
  const familyCategories = familyIds.flatMap((id) =>
    getUserCategoriesInTemporada(id, activeTemporadaId)
  );
  const uniqueFamilyCategories = Array.from(
    new Map(familyCategories.map((c) => [c.id, c])).values()
  );

  // Próximo partido relevante
  const relevantCategoryIds =
    uniqueFamilyCategories.length > 0
      ? uniqueFamilyCategories.map((c) => c.id)
      : state.categorias.map((c) => c.id);

  const nextMatch = state.partidos
    .filter(
      (p) =>
        p.temporada_id === activeTemporadaId &&
        p.estado === 'PROGRAMADO' &&
        relevantCategoryIds.includes(p.categoria_id)
    )
    .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))[0];

  // Fichajes relevantes (propios o de dependientes)
  const relevantFichajes = state.fichajes.filter(
    (f) => f.temporada_id === activeTemporadaId && familyIds.includes(f.jugador_id)
  );

  // KPIs financieros y de actividad
  const totalRecaudado = state.transacciones
    .filter((t) => t.estado_validacion !== 'PENDIENTE_RECEPCION_EFECTIVO')
    .reduce((acc, t) => acc + t.monto, 0);

  const efectivoPendienteConfirmacion = state.transacciones.filter(
    (t) => t.estado_validacion === 'PENDIENTE_RECEPCION_EFECTIVO'
  );

  const myPendingCashConfirmations = efectivoPendienteConfirmacion.filter(
    (t) => t.receptor_efectivo_id === activeUser.id || activeRole === 'ADMIN'
  );

  const activeCampaigns = state.campaniasVenta.filter(
    (c) =>
      c.temporada_id === activeTemporadaId &&
      (c.tipo_alcance === 'GLOBAL' ||
        c.categorias_ids.some((cid) => relevantCategoryIds.includes(cid)))
  );

  const openTT = state.tercerosTiempos.filter(
    (tt) => tt.temporada_id === activeTemporadaId && tt.estado === 'ABIERTO'
  );

  const currentMonth = 11; // Noviembre 2026
  const currentYear = 2026;

  const recaudacionMensual = state.transacciones
    .filter((t) => {
      if (t.estado_validacion === 'PENDIENTE_RECEPCION_EFECTIVO') return false;
      const d = new Date(t.fecha);
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
    })
    .reduce((acc, t) => acc + t.monto, 0);

  const recaudacionMensualMPNeto = state.transacciones
    .filter((t) => {
      if (t.medio_pago !== 'MERCADO_PAGO') return false;
      const d = new Date(t.fecha);
      return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth;
    })
    .reduce((acc, t) => acc + t.monto_neto, 0);

  const totalCuotasPendientesClub = state.cuotasEmitidas
    .filter((ce) => ce.estado === 'PENDIENTE')
    .reduce((acc, ce) => acc + ce.monto_final, 0);

  const totalCuotasEmitidasValidas = state.cuotasEmitidas.filter((c) => c.estado !== 'ANULADA').length;
  const totalCuotasRegularizadas = state.cuotasEmitidas.filter(
    (c) => c.estado === 'PAGADA' || c.estado === 'EXENTA_POR_ANUAL'
  ).length;
  const efectividadCobroPct =
    totalCuotasEmitidasValidas > 0
      ? Math.round((totalCuotasRegularizadas / totalCuotasEmitidasValidas) * 100)
      : 0;

  const pendingFichajesAmount = relevantFichajes.reduce((acc, f) => acc + f.monto_pendiente, 0);
  const pendingTTCount = openTT.filter((tt) =>
    familyIds.every((fid) => !tt.pagos_jugadores_ids.includes(fid))
  ).length;
  const totalDeudasPendientesUsuario = totalPendingFamily + pendingFichajesAmount;

  const upcomingMatchesManager = state.partidos
    .filter(
      (p) =>
        p.temporada_id === activeTemporadaId &&
        p.estado === 'PROGRAMADO' &&
        (myCategories.length === 0 || myCategories.some((c) => c.id === p.categoria_id))
    )
    .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));

  const upcomingMatchesClub = state.partidos
    .filter((p) => p.temporada_id === activeTemporadaId && p.estado === 'PROGRAMADO')
    .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));

  const aptosIrregularesManager = state.fichajes.filter(
    (f) =>
      f.temporada_id === activeTemporadaId &&
      (myCategories.length === 0 || myCategories.some((c) => c.id === f.categoria_id)) &&
      f.estado_habilitacion !== 'HABILITADO'
  );

  const aptosIrregularesFamilia = relevantFichajes.filter(
    (f) => f.estado_habilitacion !== 'HABILITADO'
  );

  const pendingCashAmount = myPendingCashConfirmations.reduce((acc, t) => acc + t.monto, 0);

  const ticketsPendientesQR = state.ticketsQR.filter((t) => t.estado === 'PENDIENTE').length;
  const ticketsCanjeadosQR = state.ticketsQR.filter((t) => t.estado === 'ENTREGADO').length;
  const totalCuposAyuda = state.eventosAyuda.reduce((acc, e) => acc + e.cupo, 0);
  const totalInscriptosAyuda = state.eventosAyuda.reduce(
    (acc, e) => acc + e.inscriptos_ids.length,
    0
  );

  type ActivityCard = {
    id: string;
    title: string;
    value: string;
    subtext: string;
    statusTone: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';
    statusLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    actionLabel: string;
    targetScreen: ScreenId;
  };

  const activityCards: ActivityCard[] = (() => {
    switch (activeRole) {
      case 'SOCIO_TUTOR':
        return [
          {
            id: 'deudas',
            title: 'Deudas pendientes',
            value: formatARS(totalDeudasPendientesUsuario),
            subtext: `${pendingFamilyCuotas.length} cuota(s) · ${formatARS(pendingFichajesAmount)} en fichajes`,
            statusTone: totalDeudasPendientesUsuario > 0 ? 'amber' : 'emerald',
            statusLabel: totalDeudasPendientesUsuario > 0 ? 'Por abonar' : 'Al día',
            icon: CreditCard,
            actionLabel: 'Ir al carrito MP',
            targetScreen: 'cuotas_pagar',
          },
          {
            id: 'anualidad',
            title: 'Cobertura societaria',
            value: anualidadCubierta ? 'Cubierta 2026' : 'Mensual activa',
            subtext: anualidadCubierta
              ? 'Exento de CS-M / CSG-M todo el año'
              : `${dependants.length} dependiente(s) bajo tu DNI`,
            statusTone: anualidadCubierta ? 'emerald' : 'sky',
            statusLabel: anualidadCubierta ? 'Anualidad Paga' : 'Grupo Familiar',
            icon: ShieldCheck,
            actionLabel: 'Ver detalle',
            targetScreen: 'cuotas_pagar',
          },
          {
            id: 'fondo',
            title: 'Fondo Propio dependientes',
            value: formatARS(
              dependants.reduce((acc, d) => acc + d.saldo_fondo_propio, activeUser.saldo_fondo_propio)
            ),
            subtext: 'Disponible para Fichajes y Tercer Tiempo',
            statusTone: 'emerald',
            statusLabel: 'Billetera activa',
            icon: Wallet,
            actionLabel: 'Aplicar en fichajes',
            targetScreen: 'dep_mis_fichajes',
          },
          {
            id: 'aptos_tt',
            title: 'Aptos médicos y 3er Tiempo',
            value: `${aptosIrregularesFamilia.length} alerta(s)`,
            subtext: `${pendingTTCount} Tercer Tiempo delegado(s) a tutor`,
            statusTone: aptosIrregularesFamilia.length > 0 ? 'rose' : 'emerald',
            statusLabel: aptosIrregularesFamilia.length > 0 ? 'Requiere atención' : 'Habilitados',
            icon: AlertTriangle,
            actionLabel: 'Gestionar tareas',
            targetScreen: 'tt_mis_tercer_tiempo',
          },
        ];

      case 'JUGADOR': {
        const myFichaje = relevantFichajes[0];
        const myDiasApto = daysUntil(myFichaje?.fecha_vencimiento_apto);
        return [
          {
            id: 'deudas_jug',
            title: 'Deudas pendientes',
            value: formatARS(totalDeudasPendientesUsuario),
            subtext: `${pendingFamilyCuotas.length} cuota(s) · ${formatARS(pendingFichajesAmount)} fichaje`,
            statusTone: totalDeudasPendientesUsuario > 0 ? 'amber' : 'emerald',
            statusLabel: totalDeudasPendientesUsuario > 0 ? 'Pendiente' : 'Al día',
            icon: CreditCard,
            actionLabel: 'Pagar cuotas',
            targetScreen: 'cuotas_pagar',
          },
          {
            id: 'fondo_jug',
            title: 'Saldo Fondo Propio',
            value: formatARS(activeUser.saldo_fondo_propio),
            subtext: 'Ganancias acumuladas por campañas de venta',
            statusTone: activeUser.saldo_fondo_propio >= 10000 ? 'emerald' : 'rose',
            statusLabel:
              activeUser.saldo_fondo_propio >= 10000 ? 'Saldo Suficiente' : 'Saldo Insuficiente',
            icon: Wallet,
            actionLabel: 'Declarar ventas',
            targetScreen: 'ventas_mis_ventas',
          },
          {
            id: 'partidos_jug',
            title: 'Partidos próximos',
            value: `${upcomingMatchesManager.length} encuentro(s)`,
            subtext: nextMatch
              ? `vs ${nextMatch.rival} · ${formatDateAR(nextMatch.fecha_hora)}`
              : 'Sin partidos programados',
            statusTone: upcomingMatchesManager.length > 0 ? 'sky' : 'slate',
            statusLabel: nextMatch ? nextMatch.condicion : 'Temporada',
            icon: Trophy,
            actionLabel: 'Ver mis partidos',
            targetScreen: 'dep_mis_partidos',
          },
          {
            id: 'apto_jug',
            title: 'Vigencia Apto Médico',
            value:
              myDiasApto !== null
                ? myDiasApto >= 0
                  ? `${myDiasApto} días`
                  : 'Vencido'
                : 'Sin cargar',
            subtext: myFichaje?.fecha_vencimiento_apto
              ? `Vence el ${formatDateAR(myFichaje.fecha_vencimiento_apto)}`
              : 'Cargar certificado médico vigente',
            statusTone:
              myFichaje?.estado_habilitacion === 'VENCIDO' ||
              myFichaje?.estado_habilitacion === 'PENDIENTE_APTO'
                ? 'rose'
                : myDiasApto !== null && myDiasApto <= 30
                ? 'amber'
                : 'emerald',
            statusLabel: myFichaje?.estado_habilitacion ?? 'PENDIENTE_APTO',
            icon: FileCheck,
            actionLabel: 'Ir a mi fichaje',
            targetScreen: 'dep_mis_fichajes',
          },
        ];
      }

      case 'MANAGER':
        return [
          {
            id: 'partidos_mgr',
            title: 'Partidos próximos',
            value: `${upcomingMatchesManager.length} programado(s)`,
            subtext: upcomingMatchesManager[0]
              ? `vs ${upcomingMatchesManager[0].rival} · ${formatDateTimeAR(
                  upcomingMatchesManager[0].fecha_hora
                )}`
              : 'Sin encuentros pendientes en tu división',
            statusTone: upcomingMatchesManager.length > 0 ? 'sky' : 'slate',
            statusLabel: myCategories[0]?.nombre ?? 'Categoría asignada',
            icon: Calendar,
            actionLabel: 'Configurar partido',
            targetScreen: 'dep_config_partido',
          },
          {
            id: 'aptos_mgr',
            title: 'Aptos médicos por regularizar',
            value: `${aptosIrregularesManager.length} jugador(es)`,
            subtext: 'Con estado VENCIDO o PENDIENTE_APTO',
            statusTone: aptosIrregularesManager.length > 0 ? 'rose' : 'emerald',
            statusLabel: aptosIrregularesManager.length > 0 ? 'Alerta plantel' : '100% Habilitado',
            icon: FileCheck,
            actionLabel: 'Revisar padrón',
            targetScreen: 'dep_config_fichajes',
          },
          {
            id: 'efectivo_mgr',
            title: 'Efectivo pendiente de confirmar',
            value: formatARS(pendingCashAmount),
            subtext: `${myPendingCashConfirmations.length} rendición(es) declarada(s) a tu nombre`,
            statusTone: myPendingCashConfirmations.length > 0 ? 'amber' : 'emerald',
            statusLabel:
              myPendingCashConfirmations.length > 0
                ? 'PENDIENTE_RECEPCION'
                : 'Sin pendientes',
            icon: AlertTriangle,
            actionLabel: 'Ir a Fichajes',
            targetScreen: 'dep_config_fichajes',
          },
          {
            id: 'tt_mgr',
            title: 'Tercer Tiempo de categoría',
            value: `${openTT.length} abierto(s)`,
            subtext: 'Control de cupos de voluntarios y liquidación',
            statusTone: openTT.length > 0 ? 'sky' : 'slate',
            statusLabel: 'Logística Local',
            icon: Utensils,
            actionLabel: 'Configurar 3er Tiempo',
            targetScreen: 'tt_configurar',
          },
        ];

      case 'TESORERO':
        return [
          {
            id: 'rec_mensual',
            title: 'Recaudación mensual (Nov 2026)',
            value: formatARS(recaudacionMensual),
            subtext: `Acumulado total confirmado: ${formatARS(totalRecaudado)}`,
            statusTone: 'emerald',
            statusLabel: 'Ingresos del mes',
            icon: CreditCard,
            actionLabel: 'Ver cajas virtuales',
            targetScreen: 'cuotas_pagos',
          },
          {
            id: 'morosidad',
            title: 'Deuda pendiente por cobrar',
            value: formatARS(totalCuotasPendientesClub),
            subtext: `Efectividad de cobro actual: ${efectividadCobroPct}%`,
            statusTone: totalCuotasPendientesClub > 0 ? 'amber' : 'emerald',
            statusLabel: `${efectividadCobroPct}% efectividad`,
            icon: AlertTriangle,
            actionLabel: 'Cobrar por DNI',
            targetScreen: 'cuotas_pagos',
          },
          {
            id: 'mp_neto',
            title: 'Acreditado Mercado Pago',
            value: formatARS(state.ordenesMP.reduce((acc, o) => acc + o.monto_neto, 0)),
            subtext: `${state.ordenesMP.length} órdenes aprobadas (Nov neto: ${formatARS(
              recaudacionMensualMPNeto
            )})`,
            statusTone: 'sky',
            statusLabel: 'Webhook IPN Activo',
            icon: ShieldCheck,
            actionLabel: 'Monitor MP',
            targetScreen: 'cuotas_pagos',
          },
          {
            id: 'emision',
            title: 'Facturación estacional',
            value: `${state.cuotasDetalle.filter((d) => d.activa).length} subtipos`,
            subtext: `${state.coberturasAnuales.length} beneficiario(s) con anualidad paga`,
            statusTone: 'slate',
            statusLabel: 'Calendario 2026',
            icon: Calendar,
            actionLabel: 'Generar cuotas',
            targetScreen: 'cuotas_generar',
          },
        ];

      case 'COORDINADOR':
        return [
          {
            id: 'campanias',
            title: 'Campañas de venta activas',
            value: `${activeCampaigns.length} campaña(s)`,
            subtext: `${state.declaracionesVenta.reduce(
              (a, d) => a + d.cantidad_declarada,
              0
            )} unidades declaradas`,
            statusTone: 'emerald',
            statusLabel: 'En curso',
            icon: ShoppingBag,
            actionLabel: 'Configurar ventas',
            targetScreen: 'ventas_configurar',
          },
          {
            id: 'qr_pendientes',
            title: 'Tickets QR por redimir',
            value: `${ticketsPendientesQR} pendiente(s)`,
            subtext: `${ticketsCanjeadosQR} voucher(s) ya entregado(s) en comercio`,
            statusTone: ticketsPendientesQR > 0 ? 'sky' : 'emerald',
            statusLabel: 'Idempotencia QR',
            icon: CheckCircle2,
            actionLabel: 'Validar tickets',
            targetScreen: 'ventas_validar_ticket',
          },
          {
            id: 'partidos_coord',
            title: 'Partidos próximos del club',
            value: `${upcomingMatchesClub.length} encuentro(s)`,
            subtext: `${
              state.torneos.filter((t) => t.temporada_id === activeTemporadaId).length
            } torneo(s) en temporada`,
            statusTone: 'sky',
            statusLabel: activeTemporada.nombre,
            icon: Trophy,
            actionLabel: 'Ver Fixture General',
            targetScreen: 'dep_fixture',
          },
          {
            id: 'referees_coord',
            title: 'Padrón de Referees',
            value: `${
              state.referees.filter((r) => r.temporada_id === activeTemporadaId).length
            } árbitro(s)`,
            subtext: 'Habilitados para designación en temporada',
            statusTone: 'slate',
            statusLabel: 'BD.UAR',
            icon: Users,
            actionLabel: 'Gestión Temporada',
            targetScreen: 'dep_temporada',
          },
        ];

      case 'COMISION':
        return [
          {
            id: 'rec_comision',
            title: 'Recaudación mensual (Lectura)',
            value: formatARS(recaudacionMensual),
            subtext: `Total histórico verificado: ${formatARS(totalRecaudado)}`,
            statusTone: 'emerald',
            statusLabel: 'Solo Lectura',
            icon: CreditCard,
            actionLabel: 'Auditar cajas',
            targetScreen: 'cuotas_pagos',
          },
          {
            id: 'asambleas_com',
            title: 'Asambleas semanales',
            value: `${state.asambleas.length} minuta(s)`,
            subtext: state.asambleas[0]
              ? `Última: ${formatDateAR(state.asambleas[0].fecha)}`
              : 'Sin actas registradas',
            statusTone: 'sky',
            statusLabel: 'Comisión Directiva',
            icon: ShieldCheck,
            actionLabel: 'Gestionar minutas',
            targetScreen: 'club_abm',
          },
          {
            id: 'ayuda_com',
            title: 'Voluntariado Ayuda al Club',
            value: `${totalInscriptosAyuda} / ${totalCuposAyuda}`,
            subtext: `${state.eventosAyuda.length} jornada(s) solidaria(s) activa(s)`,
            statusTone: 'emerald',
            statusLabel: 'Cupos cubiertos',
            icon: Users,
            actionLabel: 'Ver convocatorias',
            targetScreen: 'club_institucional',
          },
          {
            id: 'noticias_com',
            title: 'Noticias institucionales',
            value: `${state.noticias.length} publicada(s)`,
            subtext: 'Cartelera oficial para socios y familias',
            statusTone: 'slate',
            statusLabel: 'Comunicación',
            icon: Calendar,
            actionLabel: 'Publicar novedad',
            targetScreen: 'club_abm',
          },
        ];

      default: // ADMIN
        return [
          {
            id: 'rec_admin',
            title: 'Recaudación total verificada',
            value: formatARS(totalRecaudado),
            subtext: `Mensual Nov 2026: ${formatARS(recaudacionMensual)}`,
            statusTone: 'emerald',
            statusLabel: 'Cajas Virtuales',
            icon: CreditCard,
            actionLabel: 'Ver conciliación',
            targetScreen: 'cuotas_pagos',
          },
          {
            id: 'efectivo_admin',
            title: 'Efectivo pendiente de recepción',
            value: `${myPendingCashConfirmations.length} rendición(es)`,
            subtext: `Monto en mano de Managers: ${formatARS(pendingCashAmount)}`,
            statusTone: myPendingCashConfirmations.length > 0 ? 'amber' : 'emerald',
            statusLabel:
              myPendingCashConfirmations.length > 0 ? 'Requiere validación' : 'Todo rendido',
            icon: AlertTriangle,
            actionLabel: 'Ir a Bandeja Efectivo',
            targetScreen: 'admin_config',
          },
          {
            id: 'partidos_admin',
            title: 'Partidos próximos',
            value: `${upcomingMatchesClub.length} encuentro(s)`,
            subtext: `${
              state.fichajes.filter(
                (f) => f.temporada_id === activeTemporadaId && f.estado_habilitacion !== 'HABILITADO'
              ).length
            } fichaje(s) con apto irregular`,
            statusTone: 'sky',
            statusLabel: activeTemporada.nombre,
            icon: Trophy,
            actionLabel: 'Ir a Fixture',
            targetScreen: 'dep_fixture',
          },
          {
            id: 'notif_admin',
            title: 'Notificaciones y Webhooks MP',
            value: `${state.notificaciones.length} aviso(s)`,
            subtext: `${state.ordenesMP.length} órdenes MP aprobadas · ${state.usuarios.length} usuarios`,
            statusTone: 'slate',
            statusLabel: 'Sistema Activo',
            icon: ShieldCheck,
            actionLabel: 'Panel Admin',
            targetScreen: 'admin_config',
          },
        ];
    }
  })();

  return (
    <div className="space-y-6">
      {/* Encabezado limpio adaptado al rol */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">
            Guaycurues Rugby Sunchales · {activeTemporada.nombre} · Rol activo: {roleInfo?.label}
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-1">
            Hola, {activeUser.nombre} {activeUser.apellido}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">{roleInfo?.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {anualidadCubierta && (
            <StatusLabel tone="emerald" label="Anualidad 2026 Cubierta" />
          )}

          {/* Selector de vista dentro de HomeScreen: Dashboard de Actividad / Mi Perfil */}
          <div
            role="tablist"
            aria-label="Vistas de inicio"
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'actividad'}
              onClick={() => setActiveTab('actividad')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'actividad'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard de Actividad
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'perfil'}
              onClick={() => setActiveTab('perfil')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'perfil'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mi Perfil
            </button>
          </div>

          {activeRole === 'TESORERO' && (
            <button
              onClick={() => setActiveScreen('cuotas_pagos')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Ir a Conciliación y Caja
            </button>
          )}
          {(activeRole === 'SOCIO_TUTOR' || activeRole === 'JUGADOR') && (
            <button
              onClick={() => setActiveScreen('cuotas_pagar')}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-500 rounded-md hover:bg-sky-600 transition-colors whitespace-nowrap"
            >
              Ver Carrito de Cuotas ({pendingFamilyCuotas.length})
            </button>
          )}
          {activeRole === 'MANAGER' && (
            <button
              onClick={() => setActiveScreen('dep_config_partido')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Gestionar Partidos y Planillas
            </button>
          )}
          {activeRole === 'ADMIN' && (
            <button
              onClick={() => setActiveScreen('admin_config')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Consola de Administración
            </button>
          )}
          {activeRole === 'COORDINADOR' && (
            <button
              onClick={() => setActiveScreen('ventas_configurar')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Nueva Campaña de Venta
            </button>
          )}
          {activeRole === 'COMISION' && (
            <button
              onClick={() => setActiveScreen('club_abm')}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Publicar Minuta / Noticia
            </button>
          )}
        </div>
      </div>

      {activeTab === 'perfil' ? (
        <MiPerfilView />
      ) : (
        /* Dashboard de Actividad adaptado al Rol Activo */
        <section aria-labelledby="dashboard-actividad-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2
                id="dashboard-actividad-heading"
                className="font-display text-base font-semibold text-slate-900"
              >
                Dashboard de Actividad
              </h2>
              <p className="text-xs text-slate-500">
                Indicadores principales para el perfil {roleInfo?.label}
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">{activeTemporada.nombre}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {activityCards.map((card) => {
              const CardIcon = card.icon;
              return (
                <div
                  key={card.id}
                  className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-600">{card.title}</span>
                      <CardIcon className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                    <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 tracking-tight">
                      {card.value}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{card.subtext}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <StatusLabel tone={card.statusTone} label={card.statusLabel} />
                    <button
                      onClick={() => setActiveScreen(card.targetScreen)}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>{card.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
