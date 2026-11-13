import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Upload,
  Wallet,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Fichaje } from '../../types/srs';
import { daysUntil, formatARS, formatDateAR } from '../../utils/format';
import { StatusLabel } from '../shared/StatusIndicator';

// -----------------------------------------------------------------------------
// PANTALLA 5: Configurar Fichajes y Apto Médico (Vista Manager / Tesorero / Admin)
// -----------------------------------------------------------------------------
export const DeportivoConfigFichajesScreen: React.FC = () => {
  const {
    state,
    activeRole,
    activeUser,
    activeTemporadaId,
    activeTemporada,
    getUserCategoriesInTemporada,
    actualizarAptoMedico,
    actualizarValorFichajeCategoria,
  } = useClub();

  const managerCats = getUserCategoriesInTemporada(activeUser.id, activeTemporadaId);
  const visibleCats =
    activeRole === 'MANAGER' && managerCats.length > 0 ? managerCats : state.categorias;

  const [selectedCatId, setSelectedCatId] = useState<number>(visibleCats[0]?.id ?? 2);
  const [montoAnual, setMontoAnual] = useState<number>(36000);
  const [cuotasTotales, setCuotasTotales] = useState<number>(3);

  const [aptoModal, setAptoModal] = useState<Fichaje | null>(null);
  const [aptoFile, setAptoFile] = useState<string>('apto_medico_actualizado_2026.pdf');
  const [aptoVto, setAptoVto] = useState<string>('2027-06-30');

  const fichajesFiltrados = useMemo(() => {
    return state.fichajes.filter(
      (f) =>
        f.temporada_id === activeTemporadaId &&
        (activeRole !== 'MANAGER' || visibleCats.some((c) => c.id === f.categoria_id))
    );
  }, [state.fichajes, activeTemporadaId, activeRole, visibleCats]);

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarValorFichajeCategoria(selectedCatId, montoAnual, cuotasTotales);
  };

  const handleSaveApto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptoModal) return;
    actualizarAptoMedico(aptoModal.id, aptoFile, aptoVto);
    setAptoModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs text-slate-500">
          Módulo Deportivo · {activeTemporada.nombre}
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
          Configurar Fichajes y Control de Apto Médico
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Parametrización de valor y cuotas del Fichaje Anual por categoría y validación del certificado médico con fecha de vencimiento.
        </p>
      </div>

      {/* Configuración de Plan de Fichaje por Categoría */}
      <form
        onSubmit={handleSavePlan}
        className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-wrap items-end gap-4"
      >
        <label className="text-xs font-medium text-slate-700">
          Categoría
          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(Number(e.target.value))}
            className="mt-1 block px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
          >
            {visibleCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.codigo_caja_contable})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-700">
          Valor Anual Fichaje (ARS)
          <input
            type="number"
            min={1000}
            value={montoAnual}
            onChange={(e) => setMontoAnual(Number(e.target.value))}
            className="mt-1 block px-3 py-2 border border-slate-300 rounded-md font-mono text-sm w-40"
          />
        </label>
        <label className="text-xs font-medium text-slate-700">
          Plan de Cuotas
          <input
            type="number"
            min={1}
            max={6}
            value={cuotasTotales}
            onChange={(e) => setCuotasTotales(Number(e.target.value))}
            className="mt-1 block px-3 py-2 border border-slate-300 rounded-md font-mono text-sm w-28"
          />
        </label>
        <button
          type="submit"
          disabled={activeTemporada.estado === 'CERRADA'}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 disabled:opacity-40"
        >
          Actualizar Plan de Fichaje
        </button>
      </form>

      {/* Padrón de Habilitación */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Padrón de Habilitación Médica y Financiera ({fichajesFiltrados.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="text-left py-2.5 px-4 font-medium">Jugador</th>
                <th className="text-left py-2.5 px-4 font-medium">Categoría</th>
                <th className="text-left py-2.5 px-4 font-medium">Apto Médico</th>
                <th className="text-left py-2.5 px-4 font-medium">Vencimiento</th>
                <th className="text-left py-2.5 px-4 font-medium">Estado</th>
                <th className="text-right py-2.5 px-4 font-medium">Cuotas / Pendiente</th>
                <th className="text-right py-2.5 px-4 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fichajesFiltrados.map((f) => {
                const j = state.usuarios.find((u) => u.id === f.jugador_id);
                const c = state.categorias.find((cat) => cat.id === f.categoria_id);
                const dias = daysUntil(f.fecha_vencimiento_apto);
                return (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {j?.nombre} {j?.apellido}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c?.nombre}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {f.apto_medico_archivo ?? 'Sin certificado'}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {formatDateAR(f.fecha_vencimiento_apto)}
                      {dias !== null && dias >= 0 && dias <= 30 && (
                        <span className="ml-1.5 text-amber-600 font-semibold">({dias}d)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusLabel
                        tone={
                          f.estado_habilitacion === 'HABILITADO'
                            ? 'emerald'
                            : f.estado_habilitacion === 'PENDIENTE_APTO'
                            ? 'amber'
                            : 'rose'
                        }
                        label={f.estado_habilitacion}
                      />
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      <div>
                        {f.cuotas_pagas}/{f.cuotas_totales} pagas
                      </div>
                      <div className="text-slate-500">Resta {formatARS(f.monto_pendiente)}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setAptoModal(f);
                          setAptoFile(f.apto_medico_archivo ?? `apto_${j?.apellido.toLowerCase()}_2026.pdf`);
                          setAptoVto(f.fecha_vencimiento_apto ?? '2027-06-30');
                        }}
                        className="px-2.5 py-1 border border-slate-300 rounded text-xs font-medium hover:bg-slate-100"
                      >
                        Validar Apto
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {aptoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleSaveApto}
            className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="font-display text-base font-bold text-slate-900">
              Cargar / Validar Certificado Apto Médico
            </h3>
            <label className="block text-xs font-medium text-slate-700">
              Archivo del Certificado Médico
              <input
                type="text"
                required
                value={aptoFile}
                onChange={(e) => setAptoFile(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Fecha de Vencimiento
              <input
                type="date"
                required
                value={aptoVto}
                onChange={(e) => setAptoVto(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAptoModal(null)}
                className="px-4 py-2 text-xs border border-slate-300 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
              >
                Guardar y Habilitar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 6: Mis Fichajes (Vista Jugador / Tutor con Pago MP, Efectivo y Fondo Propio)
// -----------------------------------------------------------------------------
export const DeportivoMisFichajesScreen: React.FC = () => {
  const {
    state,
    activeRole,
    activeUser,
    activeTemporadaId,
    activeTemporada,
    getDependantsOf,
    getManagersForCategoria,
    openMercadoPagoCheckout,
    registrarPagoEfectivoManager,
    pagarConFondoPropio,
    actualizarAptoMedico,
  } = useClub();

  const dependants = getDependantsOf(activeUser.dni);
  const familyIds =
    activeRole === 'ADMIN' || activeRole === 'MANAGER'
      ? state.fichajes.map((f) => f.jugador_id)
      : [activeUser.id, ...dependants.map((d) => d.id)];

  const fichajesActuales = state.fichajes.filter(
    (f) => f.temporada_id === activeTemporadaId && familyIds.includes(f.jugador_id)
  );
  const fichajesHistoricos = state.fichajes.filter(
    (f) => f.temporada_id !== activeTemporadaId && familyIds.includes(f.jugador_id)
  );

  const [cashFichaje, setCashFichaje] = useState<{
    fichaje: Fichaje;
    cuotaMonto: number;
    caja: string;
  } | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<number>(4);

  const handleUploadAptoRapido = (f: Fichaje) => {
    const j = state.usuarios.find((u) => u.id === f.jugador_id);
    actualizarAptoMedico(
      f.id,
      `apto_${j?.apellido.toLowerCase() ?? 'jugador'}_renovado_2026.pdf`,
      '2027-11-15'
    );
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs text-slate-500">
          Módulo Deportivo · {activeTemporada.nombre}
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
          Mis Fichajes, Apto Médico y Pasarela de Pago
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Aboná cuotas de fichaje mediante Mercado Pago, Efectivo (con selección de Manager) o Fondo Propio (validación de saldo en tiempo real).
        </p>
      </div>

      {/* Fichajes Temporada Actual */}
      <div className="space-y-4">
        {fichajesActuales.map((f) => {
          const jugador = state.usuarios.find((u) => u.id === f.jugador_id);
          const cat = state.categorias.find((c) => c.id === f.categoria_id);
          const managersCat = getManagersForCategoria(f.categoria_id);
          const dias = daysUntil(f.fecha_vencimiento_apto);
          const cuotaUnitaria = Math.round(f.monto_anual / f.cuotas_totales);
          const montoAPagar = Math.min(f.monto_pendiente, cuotaUnitaria);
          const saldoJugador = jugador?.saldo_fondo_propio ?? 0;
          const fondoSuficiente = saldoJugador >= montoAPagar && montoAPagar > 0;

          return (
            <section
              key={f.id}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">
                    {cat?.nombre} · Caja contable:{' '}
                    <span className="font-mono">{cat?.codigo_caja_contable}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                    {jugador?.nombre} {jugador?.apellido}
                  </h2>
                </div>
                <StatusLabel
                  tone={
                    f.estado_habilitacion === 'HABILITADO'
                      ? 'emerald'
                      : f.estado_habilitacion === 'PENDIENTE_APTO'
                      ? 'amber'
                      : 'rose'
                  }
                  label={f.estado_habilitacion}
                />
              </div>

              {/* Alerta de vencimiento de Apto Médico */}
              {(f.estado_habilitacion === 'VENCIDO' ||
                f.estado_habilitacion === 'PENDIENTE_APTO' ||
                (dias !== null && dias <= 30)) && (
                <div
                  className={`rounded-md p-3.5 border flex flex-wrap items-center justify-between gap-3 text-xs ${
                    f.estado_habilitacion === 'VENCIDO'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      {f.estado_habilitacion === 'PENDIENTE_APTO'
                        ? 'Falta presentar el certificado de Apto Médico para habilitar el fichaje.'
                        : f.estado_habilitacion === 'VENCIDO'
                        ? `Apto Médico vencido el ${formatDateAR(f.fecha_vencimiento_apto)}.`
                        : `Alerta: tu Apto Médico vence en ${dias} días (${formatDateAR(
                            f.fecha_vencimiento_apto
                          )}).`}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUploadAptoRapido(f)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar Certificado Médico</span>
                  </button>
                </div>
              )}

              {/* Estado financiero del fichaje */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <div className="text-slate-500">Valor Anual</div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 text-sm mt-0.5">
                    {formatARS(f.monto_anual)}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <div className="text-slate-500">Cuotas Abonadas</div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 text-sm mt-0.5">
                    {f.cuotas_pagas} / {f.cuotas_totales}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <div className="text-slate-500">Saldo Pendiente</div>
                  <div className="font-mono tabular-nums font-bold text-slate-900 text-sm mt-0.5">
                    {formatARS(f.monto_pendiente)}
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <div className="text-slate-500">Fondo Propio Jugador</div>
                  <div
                    className={`font-mono tabular-nums font-bold text-sm mt-0.5 ${
                      fondoSuficiente ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatARS(saldoJugador)}
                  </div>
                </div>
              </div>

              {/* Pasarela de Pago: MP / Efectivo / Fondo Propio */}
              {f.monto_pendiente > 0 ? (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Abonar próxima cuota ({formatARS(montoAPagar)}):
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        openMercadoPagoCheckout(
                          [
                            {
                              tipo_obligacion: 'FICHAJE',
                              obligacion_id: f.id,
                              descripcion: `Cuota Fichaje ${activeTemporada.anio} ${cat?.nombre} — ${jugador?.nombre} ${jugador?.apellido}`,
                              monto: montoAPagar,
                              codigo_caja_contable: cat?.codigo_caja_contable ?? 'CAJA_CAT_M16',
                              meta: { fichaje_id: f.id },
                            },
                          ],
                          activeUser.id
                        )
                      }
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-md inline-flex items-center gap-2 whitespace-nowrap"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pagar con Mercado Pago ({formatARS(montoAPagar)})</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedManagerId(managersCat[0]?.id ?? 4);
                        setCashFichaje({
                          fichaje: f,
                          cuotaMonto: montoAPagar,
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
                          origenTipo: 'FICHAJE',
                          origenId: f.id,
                          descripcion: `Cuota Fichaje ${activeTemporada.anio} ${cat?.nombre} (${jugador?.nombre} ${jugador?.apellido})`,
                          usuarioId: f.jugador_id,
                          monto: montoAPagar,
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
                          ? `Usar Fondo Propio (${formatARS(montoAPagar)})`
                          : `Fondo Propio Insuficiente (${formatARS(saldoJugador)} < ${formatARS(
                              montoAPagar
                            )})`}
                      </span>
                    </button>
                  </div>

                  {!fondoSuficiente && (
                    <div className="text-[11px] text-rose-700 font-medium">
                      Alerta de Billetera: el saldo actual de Fondo Propio ({formatARS(saldoJugador)}) no cubre la cuota de {formatARS(montoAPagar)}. Alterná el simulador en la barra superior o aboná con Mercado Pago / Efectivo.
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fichaje {activeTemporada.anio} completamente abonado.</span>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Historial temporadas anteriores */}
      {fichajesHistoricos.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <h2 className="font-display text-sm font-semibold text-slate-900">
            Historial de Temporadas Anteriores
          </h2>
          <div className="divide-y divide-slate-100 text-xs">
            {fichajesHistoricos.map((fh) => {
              const j = state.usuarios.find((u) => u.id === fh.jugador_id);
              const c = state.categorias.find((cat) => cat.id === fh.categoria_id);
              return (
                <div key={fh.id} className="py-2.5 flex items-center justify-between">
                  <span>
                    Temporada {fh.temporada_id} · {j?.nombre} {j?.apellido} ({c?.nombre})
                  </span>
                  <StatusLabel tone="emerald" label={`${fh.estado_habilitacion} · Pago Total`} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal Efectivo a Manager */}
      {cashFichaje && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const j = state.usuarios.find((u) => u.id === cashFichaje.fichaje.jugador_id);
              registrarPagoEfectivoManager({
                origenTipo: 'FICHAJE',
                origenId: cashFichaje.fichaje.id,
                descripcion: `Cuota Fichaje ${activeTemporada.anio} (${j?.nombre} ${j?.apellido})`,
                usuarioId: cashFichaje.fichaje.jugador_id,
                monto: cashFichaje.cuotaMonto,
                receptorEfectivoId: selectedManagerId,
                codigoCajaContable: cashFichaje.caja,
              });
              setCashFichaje(null);
            }}
            className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="font-display text-base font-bold text-slate-900">
              Pago de Fichaje en Efectivo
            </h3>
            <p className="text-xs text-slate-600">
              Monto: <strong className="font-mono">{formatARS(cashFichaje.cuotaMonto)}</strong>. Seleccioná obligatoriamente al Manager/Encargado que recibió el dinero.
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
                onClick={() => setCashFichaje(null)}
                className="px-4 py-2 text-xs border border-slate-300 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md"
              >
                Confirmar Entrega
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
