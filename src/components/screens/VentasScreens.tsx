import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Plus,
  QrCode,
  ScanLine,
  ShieldAlert,
  ShoppingBag,
  Store,
  Timer,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useClub } from '../../context/ClubContext';
import { VentaCampania } from '../../types/srs';
import { formatARS, formatDateAR, formatDateTimeAR } from '../../utils/format';
import { StatusLabel } from '../shared/StatusIndicator';

// -----------------------------------------------------------------------------
// PANTALLA 1: Configurar Ventas
// -----------------------------------------------------------------------------
export const VentasConfigurarScreen: React.FC = () => {
  const { state, activeTemporadaId, crearCampaniaVenta } = useClub();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [alcance, setAlcance] = useState<'GLOBAL' | 'LOCAL'>('LOCAL');
  const [selectedCats, setSelectedCats] = useState<number[]>([2]);
  const [destino, setDestino] = useState<'CLUB' | 'CATEGORIA' | 'FONDO_JUGADOR'>('FONDO_JUGADOR');
  const [valorUnitario, setValorUnitario] = useState<number>(10000);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number>(40);
  const [minimoUnidades, setMinimoUnidades] = useState<number>(5);
  const [fechaLimite, setFechaLimite] = useState<string>('2026-11-30');
  const [flyerTexto, setFlyerTexto] = useState<string>(
    'Retiro en Quincho Guaycurues Sunchales · Sábado 12:00 hs'
  );

  const toggleCat = (catId: number) => {
    setSelectedCats((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    crearCampaniaVenta({
      temporada_id: activeTemporadaId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || 'Campaña oficial de recaudación Guaycurues Rugby Sunchales.',
      tipo_alcance: alcance,
      categorias_ids:
        alcance === 'GLOBAL' ? state.categorias.map((c) => c.id) : selectedCats,
      destino_ganancia: destino,
      valor_unitario: valorUnitario,
      porcentaje_ganancia: porcentajeGanancia,
      minimo_unidades: minimoUnidades,
      fecha_limite: fechaLimite,
      flyer_texto: flyerTexto,
      simular_vencida: false,
    });
    setTitulo('');
    setDescripcion('');
  };

  const campaniasTemporada = state.campaniasVenta.filter(
    (c) => c.temporada_id === activeTemporadaId
  );

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs text-slate-500">Módulo Ventas · Coordinación</div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
          Configurar Campañas de Venta
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Definí alcance global o local por categoría, destino de ganancia (Club/Categoría o Fondo Propio), mínimo obligatorio y fecha límite.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de creación */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-slate-900">
            Nueva Campaña (Temporada {activeTemporadaId})
          </h2>

          <label className="block text-xs font-medium text-slate-700">
            Título de Campaña
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Pizzas Caseras Pro-Viaje M16"
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </label>

          <label className="block text-xs font-medium text-slate-700">
            Descripción
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle del producto y objetivo..."
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-700">
              Alcance
              <select
                value={alcance}
                onChange={(e) => setAlcance(e.target.value as 'GLOBAL' | 'LOCAL')}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option value="GLOBAL">Global (Todo el Club)</option>
                <option value="LOCAL">Local (Por Categorías)</option>
              </select>
            </label>

            <label className="block text-xs font-medium text-slate-700">
              Destino de Ganancia
              <select
                value={destino}
                onChange={(e) =>
                  setDestino(e.target.value as 'CLUB' | 'CATEGORIA' | 'FONDO_JUGADOR')
                }
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              >
                <option value="FONDO_JUGADOR">Fondo Propio Jugador</option>
                <option value="CATEGORIA">Caja de Categoría</option>
                <option value="CLUB">Caja Global del Club</option>
              </select>
            </label>
          </div>

          {alcance === 'LOCAL' && (
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1.5">
                Categorías habilitadas
              </div>
              <div className="flex flex-wrap gap-2">
                {state.categorias.map((cat) => {
                  const active = selectedCats.includes(cat.id);
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => toggleCat(cat.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <label className="block text-xs font-medium text-slate-700">
              Valor Unit. ($)
              <input
                type="number"
                min={100}
                required
                value={valorUnitario}
                onChange={(e) => setValorUnitario(Number(e.target.value))}
                className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded-md font-mono text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              % Ganancia
              <input
                type="number"
                min={1}
                max={100}
                required
                value={porcentajeGanancia}
                onChange={(e) => setPorcentajeGanancia(Number(e.target.value))}
                className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded-md font-mono text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Mínimo (u.)
              <input
                type="number"
                min={0}
                required
                value={minimoUnidades}
                onChange={(e) => setMinimoUnidades(Number(e.target.value))}
                className="mt-1 w-full px-2.5 py-2 border border-slate-300 rounded-md font-mono text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-700">
              Fecha Límite
              <input
                type="date"
                required
                value={fechaLimite}
                onChange={(e) => setFechaLimite(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Flyer / Punto de Retiro
              <input
                type="text"
                value={flyerTexto}
                onChange={(e) => setFlyerTexto(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar Campaña de Venta</span>
          </button>
        </form>

        {/* Listado de campañas */}
        <div className="lg:col-span-7 space-y-3">
          {campaniasTemporada.map((camp) => {
            const cats = state.categorias
              .filter((c) => camp.categorias_ids.includes(c.id))
              .map((c) => c.nombre)
              .join(', ');
            return (
              <div
                key={camp.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-500">
                      {camp.tipo_alcance === 'GLOBAL' ? 'Alcance Global' : `Local: ${cats}`} ·
                      Límite <span className="font-mono">{formatDateAR(camp.fecha_limite)}</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                      {camp.titulo}
                    </h3>
                  </div>
                  <StatusLabel
                    tone={camp.destino_ganancia === 'FONDO_JUGADOR' ? 'emerald' : 'sky'}
                    label={
                      camp.destino_ganancia === 'FONDO_JUGADOR'
                        ? `Fondo Propio (${camp.porcentaje_ganancia}%)`
                        : `${camp.destino_ganancia} (${camp.porcentaje_ganancia}%)`
                    }
                  />
                </div>
                <p className="text-xs text-slate-600">{camp.descripcion}</p>
                <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-700">
                  Flyer: {camp.flyer_texto}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-mono tabular-nums text-slate-700">
                  <span>Valor unitario: {formatARS(camp.valor_unitario)}</span>
                  <span>Mínimo obligatorio: {camp.minimo_unidades} unidades</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 2: Mis Ventas y Detalle de Venta
// -----------------------------------------------------------------------------
export const VentasMisVentasScreen: React.FC = () => {
  const {
    state,
    activeRole,
    activeUser,
    activeTemporadaId,
    getDependantsOf,
    getUserCategoriesInTemporada,
    getManagersForCategoria,
    declararVentas,
    toggleSimularFechaVencida,
    openMercadoPagoCheckout,
    registrarPagoEfectivoManager,
    setSelectedTicketToken,
    setActiveScreen,
  } = useClub();

  const dependants = getDependantsOf(activeUser.dni);
  const candidatePlayers = useMemo(() => {
    if (activeRole === 'SOCIO_TUTOR' && dependants.length > 0) return dependants;
    if (activeRole === 'JUGADOR') return [activeUser];
    return state.usuarios.filter((u) => u.roles.includes('JUGADOR'));
  }, [activeRole, activeUser, dependants, state.usuarios]);

  const [selectedJugadorId, setSelectedJugadorId] = useState<number>(
    candidatePlayers[0]?.id ?? 7
  );
  const currentJugador =
    candidatePlayers.find((p) => p.id === selectedJugadorId) ?? candidatePlayers[0] ?? activeUser;

  const jugadorCats = getUserCategoriesInTemporada(currentJugador.id, activeTemporadaId);
  const jugadorCat = jugadorCats[0] ?? state.categorias[1];
  const managersCat = getManagersForCategoria(jugadorCat.id);

  const visibleCampaigns = useMemo(() => {
    return state.campaniasVenta.filter((c) => {
      if (c.temporada_id !== activeTemporadaId) return false;
      if (activeRole === 'ADMIN' || activeRole === 'COORDINADOR' || activeRole === 'MANAGER') {
        return true;
      }
      if (c.tipo_alcance === 'GLOBAL') return true;
      return c.categorias_ids.some((cid) => jugadorCats.some((jc) => jc.id === cid));
    });
  }, [state.campaniasVenta, activeTemporadaId, activeRole, jugadorCats]);

  type PreviousSaleEntry = {
    id: string;
    fecha: string;
    titulo: string;
    detalle: string;
    monto: number;
    esAcreditacionFondo?: boolean;
    tone: 'emerald' | 'amber' | 'sky' | 'slate';
    estadoLabel: string;
  };

  const previousSalesEntries = useMemo<PreviousSaleEntry[]>(() => {
    const entries: PreviousSaleEntry[] = [];

    // 1. Declaraciones ya rendidas/pagadas o de temporadas anteriores del jugador
    state.declaracionesVenta
      .filter((d) => {
        if (d.jugador_id !== currentJugador.id) return false;
        const camp = state.campaniasVenta.find((c) => c.id === d.venta_id);
        const isOtherSeason = camp ? camp.temporada_id !== activeTemporadaId : false;
        return d.estado_pago === 'PAGADA' || isOtherSeason;
      })
      .forEach((d) => {
        const camp = state.campaniasVenta.find((c) => c.id === d.venta_id);
        const temp = camp ? state.temporadas.find((t) => t.id === camp.temporada_id) : undefined;
        const montoBase = d.cantidad_declarada * (camp?.valor_unitario ?? 0);
        const montoTotal = montoBase + (d.multa_minimo_generada ? d.monto_multa : 0);
        entries.push({
          id: `decl-${d.id}`,
          fecha: camp?.fecha_limite ?? '2026-11-01',
          titulo: camp?.titulo ?? `Campaña #${d.venta_id}`,
          detalle: `${d.cantidad_declarada} u. declaradas${temp ? ` · ${temp.nombre}` : ''}`,
          monto: montoTotal,
          tone:
            d.estado_pago === 'PAGADA'
              ? 'emerald'
              : d.estado_pago === 'PENDIENTE_RECEPCION_EFECTIVO'
              ? 'amber'
              : 'slate',
          estadoLabel: d.estado_pago,
        });
      });

    // 2. Transacciones de ventas confirmadas o en recepción del jugador
    state.transacciones
      .filter((t) => t.origen_tipo === 'VENTA' && t.usuario_id === currentJugador.id)
      .forEach((t) => {
        entries.push({
          id: `tx-venta-${t.id}`,
          fecha: t.fecha,
          titulo: t.descripcion,
          detalle: `Caja ${t.codigo_caja_contable} · ${
            t.medio_pago === 'MERCADO_PAGO' ? 'Mercado Pago' : 'Efectivo Manager'
          }`,
          monto: t.monto,
          tone: t.estado_validacion === 'PENDIENTE_RECEPCION_EFECTIVO' ? 'amber' : 'emerald',
          estadoLabel:
            t.estado_validacion === 'PENDIENTE_RECEPCION_EFECTIVO'
              ? 'PENDIENTE_RECEPCION'
              : 'Rendición Aprobada',
        });
      });

    // 3. Acreditaciones previas en Fondo Propio originadas por ventas
    state.fondoPropioMovimientos
      .filter((m) => m.usuario_id === currentJugador.id && m.tipo === 'ACREDITACION_VENTA')
      .forEach((m) => {
        entries.push({
          id: `fp-venta-${m.id}`,
          fecha: m.fecha,
          titulo: m.descripcion,
          detalle: 'Comisión acreditada en Billetera Fondo Propio',
          monto: m.monto,
          esAcreditacionFondo: true,
          tone: 'sky',
          estadoLabel: 'Fondo Propio',
        });
      });

    return entries.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [
    state.declaracionesVenta,
    state.campaniasVenta,
    state.temporadas,
    state.transacciones,
    state.fondoPropioMovimientos,
    currentJugador.id,
    activeTemporadaId,
  ]);

  const [bulkQty, setBulkQty] = useState<Record<number, number>>({});
  const [buyerNameInput, setBuyerNameInput] = useState<Record<number, string>>({});
  const [cashModalDecl, setCashModalDecl] = useState<{
    declId: number;
    camp: VentaCampania;
    montoTotal: number;
    descripcion: string;
  } | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<number>(
    managersCat[0]?.id ?? state.usuarios[3].id
  );

  const handleOpenVistaQR = (tokenHash: string) => {
    setSelectedTicketToken(tokenHash);
    setActiveScreen('ventas_vista_ticket');
  };

  const handleOpenValidarQR = (tokenHash: string) => {
    setSelectedTicketToken(tokenHash);
    setActiveScreen('ventas_validar_ticket');
  };

  const handleRendirMP = (camp: VentaCampania, declId: number, cantidad: number, multa: number) => {
    const montoVentas = cantidad * camp.valor_unitario;
    const total = montoVentas + multa;
    const ganancia = Math.round(montoVentas * (camp.porcentaje_ganancia / 100));
    const caja =
      camp.destino_ganancia === 'CLUB' ? 'CAJA_VENTAS_GLOBAL' : jugadorCat.codigo_caja_contable;

    openMercadoPagoCheckout(
      [
        {
          tipo_obligacion: 'VENTA',
          obligacion_id: declId,
          descripcion: `${camp.titulo} (${cantidad} u.${multa > 0 ? ' + cargo mínimo' : ''}) — ${
            currentJugador.nombre
          } ${currentJugador.apellido}`,
          monto: total,
          codigo_caja_contable: caja,
          meta: {
            venta_declaracion_id: declId,
            destino_ganancia: camp.destino_ganancia,
            jugador_id: currentJugador.id,
            ganancia_monto: ganancia,
          },
        },
      ],
      activeUser.id
    );
  };

  const handleConfirmCashToManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashModalDecl || !selectedManagerId) return;
    const caja =
      cashModalDecl.camp.destino_ganancia === 'CLUB'
        ? 'CAJA_VENTAS_GLOBAL'
        : jugadorCat.codigo_caja_contable;

    registrarPagoEfectivoManager({
      origenTipo: 'VENTA',
      origenId: cashModalDecl.declId,
      descripcion: cashModalDecl.descripcion,
      usuarioId: currentJugador.id,
      monto: cashModalDecl.montoTotal,
      receptorEfectivoId: selectedManagerId,
      codigoCajaContable: caja,
    });
    setCashModalDecl(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">Módulo Ventas · Declaración y Rendición</div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            Mis Ventas, Tickets QR y Rendición
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Declaración individual o masiva con generación instantánea de vouchers QR y simulador de fecha límite vencida.
          </p>
        </div>

        <label className="text-xs font-medium text-slate-700 shrink-0">
          Jugador / Cuenta:
          <select
            value={currentJugador.id}
            onChange={(e) => setSelectedJugadorId(Number(e.target.value))}
            className="ml-2 px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs font-medium"
          >
            {candidatePlayers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido} (Fondo Propio: {formatARS(p.saldo_fondo_propio)})
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Tarjetas por campaña */}
      <div className="space-y-6">
        {visibleCampaigns.map((camp) => {
          const decl = state.declaracionesVenta.find(
            (d) => d.venta_id === camp.id && d.jugador_id === currentJugador.id
          );
          const qtyDeclarada = decl?.cantidad_declarada ?? 0;
          const faltanteMinimo = Math.max(0, camp.minimo_unidades - qtyDeclarada);
          const ticketsCamp = decl
            ? state.ticketsQR.filter((t) => t.declaracion_id === decl.id)
            : [];
          const montoTotalVenta = qtyDeclarada * camp.valor_unitario;
          const montoMulta = decl?.multa_minimo_generada ? decl.monto_multa : 0;
          const totalARendir = montoTotalVenta + montoMulta;
          const gananciaEstimada = Math.round(montoTotalVenta * (camp.porcentaje_ganancia / 100));

          return (
            <section
              key={camp.id}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5"
            >
              {/* Encabezado campaña + Simulador fecha límite vencida */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{camp.tipo_alcance === 'GLOBAL' ? 'Global Club' : 'Local Categoría'}</span>
                    <span>·</span>
                    <span>
                      Destino:{' '}
                      <strong className="text-slate-800">
                        {camp.destino_ganancia === 'FONDO_JUGADOR'
                          ? `Fondo Propio (${camp.porcentaje_ganancia}%)`
                          : camp.destino_ganancia}
                      </strong>
                    </span>
                    <span>·</span>
                    <span className="font-mono">Límite: {formatDateAR(camp.fecha_limite)}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900">{camp.titulo}</h2>
                  <p className="text-xs text-slate-600">{camp.flyer_texto}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleSimularFechaVencida(camp.id)}
                    className={`px-3 py-1.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      camp.simular_vencida
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Timer className="w-3.5 h-3.5" />
                    <span>
                      {camp.simular_vencida
                        ? 'Simulador: Fecha Límite Vencida (ON)'
                        : 'Simular Fecha Límite Vencida'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Métricas de progreso + Alerta multa por mínimo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="text-[11px] text-slate-500">Declaradas / Mínimo</div>
                  <div className="font-mono tabular-nums text-lg font-bold text-slate-900 mt-0.5">
                    {qtyDeclarada} / {camp.minimo_unidades} u.
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="text-[11px] text-slate-500">Total Venta</div>
                  <div className="font-mono tabular-nums text-lg font-bold text-slate-900 mt-0.5">
                    {formatARS(montoTotalVenta)}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="text-[11px] text-slate-500">
                    {camp.destino_ganancia === 'FONDO_JUGADOR' ? 'Tu Fondo Propio' : 'Ganancia Club'}
                  </div>
                  <div className="font-mono tabular-nums text-lg font-bold text-emerald-700 mt-0.5">
                    +{formatARS(gananciaEstimada)}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="text-[11px] text-slate-500">Estado Rendición</div>
                  <div className="mt-1">
                    {decl ? (
                      <StatusLabel
                        tone={
                          decl.estado_pago === 'PAGADA'
                            ? 'emerald'
                            : decl.estado_pago === 'PENDIENTE_RECEPCION_EFECTIVO'
                            ? 'amber'
                            : 'slate'
                        }
                        label={decl.estado_pago}
                      />
                    ) : (
                      <span className="text-xs text-slate-500">Sin ventas</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Alerta roja de cargo por mínimo incumplido */}
              {camp.simular_vencida && faltanteMinimo > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-bold text-sm">
                        Fecha límite vencida · Cargo automático por mínimo de venta incumplido
                      </div>
                      <div className="mt-0.5">
                        Faltaron <strong>{faltanteMinimo}</strong> unidad(es) para alcanzar el mínimo de{' '}
                        {camp.minimo_unidades}. Se suma el porcentaje de ganancia faltante ({camp.porcentaje_ganancia}%):{' '}
                        <strong className="font-mono">{formatARS(montoMulta)}</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Controles de Declaración Incremental (+ Vendí 1) y Masiva (Vendí X) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-md p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del comprador (opcional)"
                    value={buyerNameInput[camp.id] ?? ''}
                    onChange={(e) =>
                      setBuyerNameInput((prev) => ({ ...prev, [camp.id]: e.target.value }))
                    }
                    className="px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white w-56"
                  />
                  <button
                    onClick={() => {
                      const buyer = buyerNameInput[camp.id]?.trim();
                      declararVentas(
                        camp.id,
                        currentJugador.id,
                        1,
                        buyer ? [buyer] : undefined
                      );
                      setBuyerNameInput((prev) => ({ ...prev, [camp.id]: '' }));
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Vendí 1</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Carga masiva:</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={bulkQty[camp.id] ?? 3}
                    onChange={(e) =>
                      setBulkQty((prev) => ({
                        ...prev,
                        [camp.id]: Math.max(1, Number(e.target.value)),
                      }))
                    }
                    className="w-16 px-2 py-1.5 border border-slate-300 rounded-md text-xs font-mono bg-white"
                  />
                  <button
                    onClick={() =>
                      declararVentas(camp.id, currentJugador.id, bulkQty[camp.id] ?? 3)
                    }
                    className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-md hover:bg-slate-100 transition-colors whitespace-nowrap"
                  >
                    Vendí {bulkQty[camp.id] ?? 3} en total
                  </button>
                </div>
              </div>

              {/* Botones de Rendición (Solo MP o Efectivo a Manager) */}
              {decl && decl.estado_pago === 'PENDIENTE' && totalARendir > 0 && (
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() =>
                      setCashModalDecl({
                        declId: decl.id,
                        camp,
                        montoTotal: totalARendir,
                        descripcion: `Rendición Efectivo · ${camp.titulo} (${qtyDeclarada} u.)`,
                      })
                    }
                    className="px-4 py-2 border border-slate-300 bg-white text-slate-800 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    Rendir en Efectivo a Manager ({formatARS(totalARendir)})
                  </button>
                  <button
                    onClick={() => handleRendirMP(camp, decl.id, qtyDeclarada, montoMulta)}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Rendir con Mercado Pago ({formatARS(totalARendir)})</span>
                  </button>
                </div>
              )}

              {/* Tabla de Vouchers QR generados */}
              {ticketsCamp.length > 0 && (
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Tickets QR generados ({ticketsCamp.length})</span>
                    <span className="font-normal text-slate-500">
                      Link público individual de un solo uso
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {ticketsCamp.map((tk) => (
                      <div
                        key={tk.id}
                        className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <QrCode className="w-4 h-4 text-slate-500 shrink-0" />
                          <div>
                            <div className="font-medium text-slate-900">{tk.nombre_comprador}</div>
                            <div className="font-mono text-slate-500">{tk.token_hash}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusLabel
                            tone={tk.estado === 'ENTREGADO' ? 'rose' : 'emerald'}
                            label={tk.estado === 'ENTREGADO' ? 'Canjeado' : 'Disponible'}
                          />
                          <button
                            onClick={() => handleOpenVistaQR(tk.token_hash)}
                            className="px-2.5 py-1 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Ver Voucher</span>
                          </button>
                          {(activeRole === 'ADMIN' ||
                            activeRole === 'COORDINADOR' ||
                            activeRole === 'MANAGER') && (
                            <button
                              onClick={() => handleOpenValidarQR(tk.token_hash)}
                              className="px-2.5 py-1 bg-slate-900 text-white rounded hover:bg-slate-800 inline-flex items-center gap-1"
                            >
                              <ScanLine className="w-3 h-3" />
                              <span>Validar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Ventas Anteriores e Historial de Rendiciones (solo si existen movimientos previos) */}
      {previousSalesEntries.length > 0 && (
        <section
          aria-labelledby="ventas-anteriores-heading"
          className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-600 shrink-0" />
              <div>
                <h2
                  id="ventas-anteriores-heading"
                  className="font-display text-base font-semibold text-slate-900"
                >
                  Ventas Anteriores y Rendiciones
                </h2>
                <p className="text-xs text-slate-500">
                  Historial previo de campañas rendidas y acreditaciones a Fondo Propio de{' '}
                  {currentJugador.nombre} {currentJugador.apellido}
                </p>
              </div>
            </div>
            <span className="font-mono tabular-nums text-xs text-slate-500">
              {previousSalesEntries.length} registro(s)
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {previousSalesEntries.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-mono tabular-nums text-slate-500">
                    {formatDateAR(item.fecha)}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 leading-snug">
                    {item.titulo}
                  </div>
                  <div className="text-xs text-slate-600">{item.detalle}</div>
                </div>

                <div className="flex items-center justify-end gap-3 shrink-0">
                  <span
                    className={`font-mono tabular-nums text-sm font-bold whitespace-nowrap ${
                      item.esAcreditacionFondo ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {item.esAcreditacionFondo ? `+${formatARS(item.monto)}` : formatARS(item.monto)}
                  </span>
                  <StatusLabel tone={item.tone} label={item.estadoLabel} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal obligatorio de selección de Manager para Efectivo */}
      {cashModalDecl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleConfirmCashToManager}
            className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="font-display text-base font-bold text-slate-900">
              Rendición Presencial en Efectivo
            </h3>
            <p className="text-xs text-slate-600">
              Total a declarar: <strong className="font-mono">{formatARS(cashModalDecl.montoTotal)}</strong>. El pago quedará en estado{' '}
              <span className="font-mono text-amber-700">PENDIENTE_RECEPCION_EFECTIVO</span> hasta que el encargado confirme la recepción.
            </p>

            <label className="block text-xs font-medium text-slate-700">
              ¿A qué Manager/Encargado de tu categoría le entregaste el efectivo?
              <select
                required
                value={selectedManagerId}
                onChange={(e) => setSelectedManagerId(Number(e.target.value))}
                className="mt-1.5 w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
              >
                {state.usuarios
                  .filter((u) => u.roles.includes('MANAGER') || u.roles.includes('ADMIN'))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} {m.apellido} (DNI {m.dni})
                    </option>
                  ))}
              </select>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCashModalDecl(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md"
              >
                Declarar Entrega de Efectivo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 3: Vista Ticket (Acceso Público sin Login - QR SVG Determinístico)
// -----------------------------------------------------------------------------
export const VentasVistaTicketScreen: React.FC = () => {
  const {
    state,
    activeRole,
    selectedTicketToken,
    setSelectedTicketToken,
    setActiveScreen,
  } = useClub();

  const currentTicket =
    state.ticketsQR.find((t) => t.token_hash === selectedTicketToken) ?? state.ticketsQR[0];
  const camp = currentTicket
    ? state.campaniasVenta.find((c) => c.id === currentTicket.venta_id)
    : null;

  const isPublicMode = activeRole === 'PUBLICO_COMERCIO';

  return (
    <div className={isPublicMode ? 'max-w-md mx-auto py-4 space-y-4' : 'space-y-6'}>
      {isPublicMode && (
        <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-2">
          <button
            onClick={() => setActiveScreen('ventas_vista_ticket')}
            className="flex-1 py-2 text-xs font-semibold rounded bg-slate-900 text-white"
          >
            Vista Voucher (Comprador)
          </button>
          <button
            onClick={() => setActiveScreen('ventas_validar_ticket')}
            className="flex-1 py-2 text-xs font-semibold rounded text-slate-700 hover:bg-slate-100"
          >
            Validar en Comercio (Escaneo)
          </button>
        </div>
      )}

      {!isPublicMode && (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500">Módulo Ventas · Link Público Sin Sesión</div>
            <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
              Vista Ticket QR (Voucher de Retiro)
            </h1>
          </div>
          <label className="text-xs font-medium text-slate-700">
            Seleccionar voucher:
            <select
              value={currentTicket?.token_hash ?? ''}
              onChange={(e) => setSelectedTicketToken(e.target.value)}
              className="ml-2 px-3 py-1.5 border border-slate-300 rounded-md font-mono text-xs bg-white"
            >
              {state.ticketsQR.map((t) => (
                <option key={t.id} value={t.token_hash}>
                  {t.token_hash} — {t.nombre_comprador} ({t.estado})
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {currentTicket && camp ? (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-300">Guaycurues Rugby Sunchales</div>
              <div className="font-display text-base font-bold mt-0.5">
                Voucher Digital de Retiro
              </div>
            </div>
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="p-6 flex flex-col items-center text-center space-y-4">
            <StatusLabel
              tone={currentTicket.estado === 'ENTREGADO' ? 'rose' : 'emerald'}
              label={
                currentTicket.estado === 'ENTREGADO'
                  ? 'TICKET YA CANJEADO'
                  : 'VÁLIDO PARA RETIRO (1 USO)'
              }
            />

            <div>
              <div className="font-display text-lg font-bold text-slate-900">{camp.titulo}</div>
              <div className="text-xs text-slate-600 mt-1">{camp.flyer_texto}</div>
            </div>

            {/* QR SVG Determinístico Escaneable */}
            <div
              className={`p-4 bg-white border-2 rounded-lg ${
                currentTicket.estado === 'ENTREGADO'
                  ? 'border-rose-300 opacity-50'
                  : 'border-slate-900'
              }`}
            >
              <QRCodeSVG
                value={JSON.stringify({
                  club: 'GUAYCURUES_SUNCHALES',
                  token: currentTicket.token_hash,
                  venta_id: currentTicket.venta_id,
                })}
                size={188}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Token Hash:</span>
                <span className="font-mono font-bold text-slate-900">
                  {currentTicket.token_hash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Comprador:</span>
                <span className="font-medium text-slate-900">{currentTicket.nombre_comprador}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Emisión:</span>
                <span className="font-mono text-slate-700">
                  {formatDateTimeAR(currentTicket.fecha_emision)}
                </span>
              </div>
              {currentTicket.fecha_entrega && (
                <div className="flex justify-between text-rose-700 font-medium">
                  <span>Fecha Canje:</span>
                  <span className="font-mono">{formatDateTimeAR(currentTicket.fecha_entrega)}</span>
                </div>
              )}
            </div>

            {isPublicMode && (
              <div className="w-full pt-2">
                <label className="block text-[11px] text-slate-500 mb-1">
                  Cambiar voucher de prueba:
                </label>
                <select
                  value={currentTicket.token_hash}
                  onChange={(e) => setSelectedTicketToken(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs bg-white"
                >
                  {state.ticketsQR.map((t) => (
                    <option key={t.id} value={t.token_hash}>
                      {t.token_hash} ({t.estado})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500">No hay tickets QR disponibles.</div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 4: Validar Ticket (Escaneo en Comercio - Idempotencia 1 solo uso)
// -----------------------------------------------------------------------------
export const VentasValidarTicketScreen: React.FC = () => {
  const {
    state,
    activeRole,
    selectedTicketToken,
    setSelectedTicketToken,
    canjearTicketQR,
    setActiveScreen,
  } = useClub();

  const [inputToken, setInputToken] = useState<string>(selectedTicketToken ?? 'GQR-M16A94K2');
  const [scanResult, setScanResult] = useState<{
    status: 'SUCCESS' | 'ALREADY_REDEEMED' | 'NOT_FOUND';
    message: string;
  } | null>(null);

  const isPublicMode = activeRole === 'PUBLICO_COMERCIO';

  const matchedTicket = state.ticketsQR.find(
    (t) => t.token_hash.toUpperCase() === inputToken.trim().toUpperCase()
  );
  const matchedCamp = matchedTicket
    ? state.campaniasVenta.find((c) => c.id === matchedTicket.venta_id)
    : null;

  const handleConfirmDelivery = () => {
    const res = canjearTicketQR(inputToken);
    setScanResult({ status: res.status, message: res.message });
  };

  return (
    <div className={isPublicMode ? 'max-w-lg mx-auto py-4 space-y-4' : 'space-y-6'}>
      {isPublicMode && (
        <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-2">
          <button
            onClick={() => setActiveScreen('ventas_vista_ticket')}
            className="flex-1 py-2 text-xs font-semibold rounded text-slate-700 hover:bg-slate-100"
          >
            Vista Voucher (Comprador)
          </button>
          <button
            onClick={() => setActiveScreen('ventas_validar_ticket')}
            className="flex-1 py-2 text-xs font-semibold rounded bg-slate-900 text-white"
          >
            Validar en Comercio (Escaneo)
          </button>
        </div>
      )}

      {!isPublicMode && (
        <div className="pb-4 border-b border-slate-200">
          <div className="text-xs text-slate-500">Módulo Ventas · Punto de Retiro</div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            Validar Ticket QR en Comercio (Idempotente)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Confirmación de entrega por única vez. Cualquier intento posterior sobre un QR redimido queda bloqueado en rojo.
          </p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Terminal de Validación — Punto de Entrega
            </h2>
            <p className="text-xs text-slate-500">
              Ingresá o seleccioná el token_hash del QR escaneado
            </p>
          </div>
        </div>

        {/* Selector rápido + Input manual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs font-medium text-slate-700">
            Código QR escaneado (token_hash)
            <input
              type="text"
              value={inputToken}
              onChange={(e) => {
                setInputToken(e.target.value);
                setScanResult(null);
              }}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm uppercase"
            />
          </label>
          <label className="text-xs font-medium text-slate-700">
            Simular lectura rápida de QR
            <select
              value={matchedTicket?.token_hash ?? ''}
              onChange={(e) => {
                setInputToken(e.target.value);
                setSelectedTicketToken(e.target.value);
                setScanResult(null);
              }}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs bg-white"
            >
              {state.ticketsQR.map((t) => (
                <option key={t.id} value={t.token_hash}>
                  {t.token_hash} · {t.nombre_comprador} [{t.estado}]
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Detalle del ticket encontrado */}
        {matchedTicket && matchedCamp ? (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">
                {matchedTicket.token_hash}
              </span>
              <StatusLabel
                tone={matchedTicket.estado === 'ENTREGADO' ? 'rose' : 'emerald'}
                label={matchedTicket.estado}
                mono
              />
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <div>
                Campaña: <strong>{matchedCamp.titulo}</strong>
              </div>
              <div>
                Comprador: <strong>{matchedTicket.nombre_comprador}</strong>
              </div>
              {matchedTicket.fecha_entrega && (
                <div className="text-rose-700 font-semibold">
                  Ya fue canjeado el {formatDateTimeAR(matchedTicket.fecha_entrega)}
                </div>
              )}
            </div>

            <button
              onClick={handleConfirmDelivery}
              className={`w-full py-3 px-4 rounded-md text-sm font-bold transition-colors inline-flex items-center justify-center gap-2 ${
                matchedTicket.estado === 'ENTREGADO'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              <span>
                {matchedTicket.estado === 'ENTREGADO'
                  ? 'Intentar Segundo Escaneo (Probar Bloqueo)'
                  : 'Confirmar Entrega (Un solo uso)'}
              </span>
            </button>
          </div>
        ) : (
          <div className="p-4 border border-slate-200 rounded-md text-xs text-slate-500">
            Código QR no encontrado en el padrón de tickets emitidos.
          </div>
        )}

        {/* Banner resultado de idempotencia */}
        {scanResult && (
          <div
            className={`rounded-lg p-4 border flex items-start gap-3 ${
              scanResult.status === 'SUCCESS'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {scanResult.status === 'SUCCESS' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-bold text-sm">
                {scanResult.status === 'SUCCESS'
                  ? 'ENTREGA CONFIRMADA — VOUCHER QUEMADO'
                  : scanResult.status === 'ALREADY_REDEEMED'
                  ? 'ACCESO DENEGADO — TICKET YA CANJEADO'
                  : 'TOKEN INVÁLIDO'}
              </div>
              <div className="mt-0.5">{scanResult.message}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
