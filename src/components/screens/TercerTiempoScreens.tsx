import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Plus,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { TercerTiempo } from '../../types/srs';
import { formatARS, formatDateTimeAR } from '../../utils/format';
import { StatusLabel } from '../shared/StatusIndicator';

// -----------------------------------------------------------------------------
// PANTALLA 1: Configurar Tercer Tiempo
// -----------------------------------------------------------------------------
export const TercerTiempoConfigurarScreen: React.FC = () => {
  const {
    state,
    activeRole,
    activeUser,
    activeTemporadaId,
    activeTemporada,
    getUserCategoriesInTemporada,
    crearTercerTiempo,
    liquidarTercerTiempo,
  } = useClub();

  const managerCats = getUserCategoriesInTemporada(activeUser.id, activeTemporadaId);
  const allowedCatIds =
    activeRole === 'MANAGER' && managerCats.length > 0
      ? managerCats.map((c) => c.id)
      : state.categorias.map((c) => c.id);

  const partidosLocales = state.partidos.filter(
    (p) =>
      p.temporada_id === activeTemporadaId &&
      p.condicion === 'LOCAL' &&
      allowedCatIds.includes(p.categoria_id)
  );

  const [partidoId, setPartidoId] = useState<number>(partidosLocales[0]?.id ?? 1);
  const [titulo, setTitulo] = useState<string>('');
  const [montoInicial, setMontoInicial] = useState<number>(6000);
  const [tareas, setTareas] = useState<{ tarea_descripcion: string; cupo_requerido: number }[]>([
    { tarea_descripcion: 'Bebidas y hielo para visitantes', cupo_requerido: 2 },
    { tarea_descripcion: 'Mesa de frutas y sándwiches', cupo_requerido: 3 },
  ]);
  const [nuevaTareaDesc, setNuevaTareaDesc] = useState('');
  const [nuevaTareaCupo, setNuevaTareaCupo] = useState(2);

  const [liquidacionMontos, setLiquidacionMontos] = useState<Record<number, number>>({});

  const selectedPartido = partidosLocales.find((p) => p.id === partidoId) ?? partidosLocales[0];
  const selectedCat = selectedPartido
    ? state.categorias.find((c) => c.id === selectedPartido.categoria_id)
    : null;

  const handleAddTarea = () => {
    if (!nuevaTareaDesc.trim()) return;
    setTareas((prev) => [
      ...prev,
      { tarea_descripcion: nuevaTareaDesc.trim(), cupo_requerido: nuevaTareaCupo },
    ]);
    setNuevaTareaDesc('');
  };

  const handleCrearTT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartido) return;
    crearTercerTiempo(
      {
        temporada_id: activeTemporadaId,
        partido_id: selectedPartido.id,
        torneo_id: selectedPartido.torneo_id,
        categoria_id: selectedPartido.categoria_id,
        titulo:
          titulo.trim() ||
          `3er Tiempo ${selectedCat?.nombre} vs ${selectedPartido.rival}`,
        fecha: selectedPartido.fecha_hora,
        monto_por_jugador: montoInicial,
        estado: 'ABIERTO',
      },
      tareas
    );
    setTitulo('');
  };

  const ttVisibles = state.tercerosTiempos.filter(
    (tt) => tt.temporada_id === activeTemporadaId && allowedCatIds.includes(tt.categoria_id)
  );

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs text-slate-500">
          Módulo Tercer Tiempo · {activeTemporada.nombre}
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
          Configurar Tercer Tiempo y Liquidación Post-Partido
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Asociado a partidos o torneos de local. Si la categoría tiene es_menor_edad = true, delega tareas y cobro al tutor (depende_de).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleCrearTT}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-slate-900">
            Nuevo Tercer Tiempo (Partido de Local)
          </h2>

          <label className="block text-xs font-medium text-slate-700">
            Partido de Local Asociado
            <select
              value={selectedPartido?.id ?? ''}
              onChange={(e) => setPartidoId(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white"
            >
              {partidosLocales.map((p) => {
                const c = state.categorias.find((cat) => cat.id === p.categoria_id);
                return (
                  <option key={p.id} value={p.id}>
                    {c?.nombre} vs {p.rival} ({formatDateTimeAR(p.fecha_hora)})
                  </option>
                );
              })}
            </select>
          </label>

          {selectedCat && (
            <div className="bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs text-slate-700">
              Categoría: <strong>{selectedCat.nombre}</strong> · Caja:{' '}
              <span className="font-mono">{selectedCat.codigo_caja_contable}</span> ·{' '}
              <span className="font-semibold">
                {selectedCat.es_menor_edad
                  ? 'es_menor_edad = true (Delega al Tutor depende_de)'
                  : 'es_menor_edad = false (Directo al Jugador)'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-slate-700">
              Título (Opcional)
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Autogenerado si queda vacío"
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
              />
            </label>
            <label className="text-xs font-medium text-slate-700">
              Monto Estimado p/Jugador
              <input
                type="number"
                min={500}
                value={montoInicial}
                onChange={(e) => setMontoInicial(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
              />
            </label>
          </div>

          {/* Checklist builder */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <div className="text-xs font-semibold text-slate-800">
              Checklist Colaborativo de Voluntarios
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevaTareaDesc}
                onChange={(e) => setNuevaTareaDesc(e.target.value)}
                placeholder="Nueva tarea (ej. Limpieza quincho)"
                className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded text-xs"
              />
              <input
                type="number"
                min={1}
                max={20}
                value={nuevaTareaCupo}
                onChange={(e) => setNuevaTareaCupo(Number(e.target.value))}
                className="w-16 px-2 py-1.5 border border-slate-300 rounded font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleAddTarea}
                className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-xs font-semibold hover:bg-slate-200"
              >
                +
              </button>
            </div>
            <div className="space-y-1">
              {tareas.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5"
                >
                  <span>{t.tarea_descripcion}</span>
                  <span className="font-mono text-slate-600">{t.cupo_requerido} cupos</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedPartido}
            className="w-full py-2.5 px-4 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 disabled:opacity-40"
          >
            Publicar Tercer Tiempo
          </button>
        </form>

        {/* Listado y liquidación post-partido */}
        <div className="lg:col-span-7 space-y-4">
          {ttVisibles.map((tt) => {
            const cat = state.categorias.find((c) => c.id === tt.categoria_id);
            const liqVal = liquidacionMontos[tt.id] ?? tt.monto_por_jugador;
            return (
              <div
                key={tt.id}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">
                      {cat?.nombre} ·{' '}
                      {cat?.es_menor_edad ? 'Delegación Automática a Tutor' : 'Cuenta Directa Jugador'}
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
                      {tt.titulo}
                    </h3>
                  </div>
                  <StatusLabel
                    tone={tt.estado === 'LIQUIDADO' ? 'emerald' : 'amber'}
                    label={tt.estado}
                  />
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                  {tt.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-2 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-800">{item.tarea_descripcion}</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {item.usuarios_asignados_ids.length}/{item.cupo_requerido} voluntarios
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-600">
                    Liquidación Post-Partido (por jugador):{' '}
                    <strong className="font-mono text-slate-900">
                      {formatARS(tt.monto_por_jugador)}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={500}
                      value={liqVal}
                      onChange={(e) =>
                        setLiquidacionMontos((prev) => ({
                          ...prev,
                          [tt.id]: Number(e.target.value),
                        }))
                      }
                      className="w-28 px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs"
                    />
                    <button
                      onClick={() => liquidarTercerTiempo(tt.id, liqVal)}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 whitespace-nowrap"
                    >
                      Liquidar Monto Final
                    </button>
                  </div>
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
// PANTALLA 2: Mis Tercer Tiempo (Tareas y Pago con Validación Fondo Propio)
// -----------------------------------------------------------------------------
export const TercerTiempoMisTTScreen: React.FC = () => {
  const {
    state,
    activeRole,
    activeUser,
    activeTemporadaId,
    getDependantsOf,
    getManagersForCategoria,
    toggleInscripcionChecklistTT,
    openMercadoPagoCheckout,
    registrarPagoEfectivoManager,
    pagarConFondoPropio,
  } = useClub();

  const dependants = getDependantsOf(activeUser.dni);
  const relevantIds =
    activeRole === 'SOCIO_TUTOR' && dependants.length > 0
      ? dependants.map((d) => d.id)
      : [activeUser.id];

  // Jugador/beneficiario objetivo para pagar
  const [selectedBeneficiarioId, setSelectedBeneficiarioId] = useState<number>(
    relevantIds[0] ?? activeUser.id
  );
  const targetPlayer =
    state.usuarios.find((u) => u.id === selectedBeneficiarioId) ?? activeUser;

  const [cashTT, setCashTT] = useState<{
    tt: TercerTiempo;
    caja: string;
  } | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<number>(4);

  const tercerosTiempos = state.tercerosTiempos.filter(
    (tt) => tt.temporada_id === activeTemporadaId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">
            Módulo Tercer Tiempo · Checklist y Liquidación
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            Mis Tercer Tiempo (Tareas y Pagos)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Inscribite a tareas colaborativas y aboná tu cuota de Tercer Tiempo por Mercado Pago, Efectivo o Fondo Propio.
          </p>
        </div>

        {dependants.length > 0 && (
          <label className="text-xs font-medium text-slate-700 shrink-0">
            Dependiente a cargo:
            <select
              value={targetPlayer.id}
              onChange={(e) => setSelectedBeneficiarioId(Number(e.target.value))}
              className="ml-2 px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
            >
              {dependants.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} {d.apellido} (Fondo Propio: {formatARS(d.saldo_fondo_propio)})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="space-y-6">
        {tercerosTiempos.map((tt) => {
          const cat = state.categorias.find((c) => c.id === tt.categoria_id);
          const managersCat = getManagersForCategoria(tt.categoria_id);
          const yaPago = tt.pagos_jugadores_ids.includes(targetPlayer.id);
          const pendienteEfectivo = state.transacciones.some(
            (tx) =>
              tx.origen_tipo === 'TERCER_TIEMPO' &&
              tx.origen_id === tt.id &&
              tx.usuario_id === targetPlayer.id &&
              tx.estado_validacion === 'PENDIENTE_RECEPCION_EFECTIVO'
          );

          // Regla de Fondo Propio: saldo del jugador (o del usuario activo si es mayor)
          const walletOwner =
            cat?.es_menor_edad && targetPlayer.id !== activeUser.id
              ? targetPlayer
              : activeUser;
          const saldoDisponible = walletOwner.saldo_fondo_propio;
          const fondoSuficiente = saldoDisponible >= tt.monto_por_jugador;

          return (
            <section
              key={tt.id}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="text-xs text-slate-500">
                    {cat?.nombre} · {formatDateTimeAR(tt.fecha)} · Caja:{' '}
                    <span className="font-mono">{cat?.codigo_caja_contable}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                    {tt.titulo}
                  </h2>
                  {cat?.es_menor_edad && (
                    <div className="text-xs text-sky-700 font-medium mt-1">
                      Categoría de menores (es_menor_edad = true): las tareas y el pago se asignan automáticamente al Padre/Tutor responsable (depende_de).
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="font-mono tabular-nums text-lg font-bold text-slate-900">
                    {formatARS(tt.monto_por_jugador)}
                  </div>
                  <StatusLabel
                    tone={
                      yaPago
                        ? 'emerald'
                        : pendienteEfectivo
                        ? 'amber'
                        : 'slate'
                    }
                    label={
                      yaPago
                        ? 'Pagado'
                        : pendienteEfectivo
                        ? 'Pendiente Recepción Efectivo'
                        : tt.estado
                    }
                  />
                </div>
              </div>

              {/* Checklist colaborativo */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Checklist Colaborativo de Voluntarios</span>
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-md">
                  {tt.checklist.map((item) => {
                    const isAssigned = item.usuarios_asignados_ids.includes(activeUser.id);
                    const full = item.usuarios_asignados_ids.length >= item.cupo_requerido;
                    const names = item.usuarios_asignados_ids
                      .map((uid) => {
                        const u = state.usuarios.find((usr) => usr.id === uid);
                        return u ? `${u.nombre} ${u.apellido}` : '';
                      })
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <div
                        key={item.id}
                        className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-medium text-slate-900">{item.tarea_descripcion}</div>
                          <div className="text-slate-500 mt-0.5">
                            Cupo:{' '}
                            <span className="font-mono tabular-nums font-semibold">
                              {item.usuarios_asignados_ids.length}/{item.cupo_requerido}
                            </span>
                            {names && ` · Inscriptos: ${names}`}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            toggleInscripcionChecklistTT(tt.id, item.id, activeUser.id)
                          }
                          disabled={!isAssigned && full}
                          className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors whitespace-nowrap ${
                            isAssigned
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : full
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isAssigned ? 'Inscripto (Quitarme)' : full ? 'Cupo Completo' : 'Postularme'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pasarela de Pago 3er Tiempo */}
              {!yaPago && !pendienteEfectivo && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Abonar gasto de Tercer Tiempo ({formatARS(tt.monto_por_jugador)}) · Billetera{' '}
                    {walletOwner.nombre}:{' '}
                    <span className="font-mono">{formatARS(saldoDisponible)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        openMercadoPagoCheckout(
                          [
                            {
                              tipo_obligacion: 'TERCER_TIEMPO',
                              obligacion_id: tt.id,
                              descripcion: `${tt.titulo} (${targetPlayer.nombre} ${targetPlayer.apellido})`,
                              monto: tt.monto_por_jugador,
                              codigo_caja_contable:
                                cat?.codigo_caja_contable ?? 'CAJA_CAT_M16',
                              meta: {
                                tercer_tiempo_id: tt.id,
                                jugador_id: targetPlayer.id,
                              },
                            },
                          ],
                          activeUser.id
                        )
                      }
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-md inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pagar con Mercado Pago ({formatARS(tt.monto_por_jugador)})</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedManagerId(managersCat[0]?.id ?? 4);
                        setCashTT({
                          tt,
                          caja: cat?.codigo_caja_contable ?? 'CAJA_CAT_M16',
                        });
                      }}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-md hover:bg-slate-50 whitespace-nowrap"
                    >
                      Pagar en Efectivo a Manager
                    </button>

                    <button
                      disabled={!fondoSuficiente}
                      onClick={() =>
                        pagarConFondoPropio({
                          origenTipo: 'TERCER_TIEMPO',
                          origenId: tt.id,
                          descripcion: `${tt.titulo} (${targetPlayer.nombre} ${targetPlayer.apellido})`,
                          usuarioId: walletOwner.id,
                          monto: tt.monto_por_jugador,
                          codigoCajaContable: cat?.codigo_caja_contable ?? 'CAJA_CAT_M16',
                        })
                      }
                      className={`px-4 py-2 text-xs font-semibold rounded-md inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
                        fondoSuficiente
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed opacity-70'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span>
                        {fondoSuficiente
                          ? `Usar Fondo Propio (${formatARS(tt.monto_por_jugador)})`
                          : `Fondo Propio Insuficiente (${formatARS(saldoDisponible)})`}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {yaPago && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Gasto de Tercer Tiempo liquidado para {targetPlayer.nombre}.</span>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Modal Efectivo a Manager */}
      {cashTT && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              registrarPagoEfectivoManager({
                origenTipo: 'TERCER_TIEMPO',
                origenId: cashTT.tt.id,
                descripcion: `${cashTT.tt.titulo} (${targetPlayer.nombre} ${targetPlayer.apellido})`,
                usuarioId: targetPlayer.id,
                monto: cashTT.tt.monto_por_jugador,
                receptorEfectivoId: selectedManagerId,
                codigoCajaContable: cashTT.caja,
              });
              setCashTT(null);
            }}
            className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="font-display text-base font-bold text-slate-900">
              Pago de Tercer Tiempo en Efectivo
            </h3>
            <p className="text-xs text-slate-600">
              Importe: <strong className="font-mono">{formatARS(cashTT.tt.monto_por_jugador)}</strong>. Quedará en estado PENDIENTE_RECEPCION_EFECTIVO hasta que el encargado lo confirme.
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
                      {m.nombre} {m.apellido}
                    </option>
                  ))}
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCashTT(null)}
                className="px-4 py-2 text-xs border border-slate-300 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md"
              >
                Registrar Entrega
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
