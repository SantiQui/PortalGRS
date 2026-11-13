import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Edit3,
  Mail,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { getScreenAccessLevel } from '../../config/rbac';
import { useClub } from '../../context/ClubContext';
import { CheckoutItemRequest, CodigoCuota, CuotaConfigDetalle, CuotaEmitida } from '../../types/srs';
import { formatARS, formatDateTimeAR, MESES_CORTOS, MESES_NOMBRES } from '../../utils/format';
import { StatusLabel } from '../shared/StatusIndicator';

// -----------------------------------------------------------------------------
// PANTALLA 1: Configurar Cuotas (Catálogo Estacional y Descuentos)
// -----------------------------------------------------------------------------
export const CuotasConfigurarScreen: React.FC = () => {
  const { state, upsertCuotaDetalle, deleteCuotaDetalle, updateCuotasCabecera } = useClub();
  const cabecera = state.cuotasCabecera[0];

  const [descFam, setDescFam] = useState<number>(cabecera?.descuento_grupo_familiar_pct ?? 15);
  const [descAnual, setDescAnual] = useState<number>(cabecera?.descuento_anual_anticipado_pct ?? 20);

  const [editing, setEditing] = useState<Partial<CuotaConfigDetalle> | null>(null);

  const openNewModal = () => {
    setEditing({
      cabecera_id: cabecera?.id ?? 1,
      codigo: 'CS-M',
      descripcion: '',
      codigo_caja_contable: 'CAJA_CLUB_SOCIETARIA',
      naturaleza: 'SOCIETARIA',
      es_grupal: false,
      periodicidad: 'MENSUAL',
      monto: 15000,
      meses_activos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      activa: true,
    });
  };

  const toggleMonthInEditor = (mes: number) => {
    if (!editing) return;
    const current = editing.meses_activos ?? [];
    const next = current.includes(mes)
      ? current.filter((m) => m !== mes)
      : [...current, mes].sort((a, b) => a - b);
    setEditing({ ...editing, meses_activos: next });
  };

  const handleSaveEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.descripcion || !editing.codigo) return;
    upsertCuotaDetalle({
      id: editing.id,
      cabecera_id: editing.cabecera_id ?? 1,
      codigo: editing.codigo as CodigoCuota,
      descripcion: editing.descripcion,
      codigo_caja_contable: editing.codigo_caja_contable ?? 'CAJA_CLUB_SOCIETARIA',
      naturaleza: editing.naturaleza ?? 'SOCIETARIA',
      es_grupal: Boolean(editing.es_grupal),
      periodicidad: editing.periodicidad ?? 'MENSUAL',
      monto: Number(editing.monto ?? 0),
      meses_activos: editing.meses_activos ?? [],
      activa: editing.activa ?? true,
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">Módulo Cuotas · Catálogo Estacional</div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            Configurar Cuotas (Cabecera - Detalle)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Parametrización de las 6 cuotas oficiales, cajas virtuales y calendario de meses activos (receso de verano).
          </p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Cuota</span>
        </button>
      </div>

      {/* Cabecera: Reglas de descuento y vigencia */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Cabecera: {cabecera?.nombre_configuracion}
            </h2>
            <p className="text-xs text-slate-500">
              Vigencia Temporada {cabecera?.temporada_id} · Reglas de bonificación automática
            </p>
          </div>
          <StatusLabel tone="emerald" label="Esquema Vigente" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <label className="block text-xs font-medium text-slate-700">
            Descuento Grupo Familiar (%)
            <input
              type="number"
              min={0}
              max={60}
              value={descFam}
              onChange={(e) => setDescFam(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Descuento Anual Anticipado (%)
            <input
              type="number"
              min={0}
              max={60}
              value={descAnual}
              onChange={(e) => setDescAnual(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono tabular-nums text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </label>
          <div>
            <button
              onClick={() => updateCuotasCabecera(descFam, descAnual)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Guardar Reglas de Cabecera
            </button>
          </div>
        </div>
      </section>

      {/* Detalle: Grilla de 6 subtipos oficiales con píldoras de 12 meses */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Detalle: Subtipos de Cuota y Calendario Estacional (Ene - Dic)
          </h2>
          <span className="text-xs text-slate-500">
            Dic-Ene inactivo en Mayor/Juvenil · Dic-Ene-Feb inactivo en Infantil
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
              <tr>
                <th className="text-left py-2.5 px-4 font-medium">Código</th>
                <th className="text-left py-2.5 px-4 font-medium">Descripción y Caja Contable</th>
                <th className="text-left py-2.5 px-4 font-medium">Periodicidad</th>
                <th className="text-right py-2.5 px-4 font-medium">Monto</th>
                <th className="text-left py-2.5 px-4 font-medium">Meses Activos de Cobro (1 al 12)</th>
                <th className="text-right py-2.5 px-4 font-medium">ABM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.cuotasDetalle
                .filter((d) => d.activa)
                .map((det) => (
                  <tr key={det.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900">
                      {det.codigo}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{det.descripcion}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {det.naturaleza} · {det.codigo_caja_contable}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">{det.periodicidad}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatARS(det.monto)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {MESES_CORTOS.map((mName, idx) => {
                          const mesNum = idx + 1;
                          const isActive = det.meses_activos.includes(mesNum);
                          return (
                            <span
                              key={mesNum}
                              className={`px-1.5 py-0.5 text-[11px] font-mono rounded border ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                              }`}
                            >
                              {mName}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => setEditing(det)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Modificar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCuotaDetalle(det.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          title="Dar de baja"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Editor ABM */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={handleSaveEditor}
            className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4"
          >
            <h3 className="font-display text-lg font-bold text-slate-900">
              {editing.id ? `Modificar Subtipo ${editing.codigo}` : 'Nuevo Subtipo de Cuota'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-slate-700">
                Código
                <input
                  type="text"
                  required
                  value={editing.codigo ?? ''}
                  onChange={(e) => setEditing({ ...editing, codigo: e.target.value as CodigoCuota })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Monto (ARS)
                <input
                  type="number"
                  required
                  value={editing.monto ?? 0}
                  onChange={(e) => setEditing({ ...editing, monto: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-sm"
                />
              </label>
            </div>

            <label className="block text-xs font-medium text-slate-700">
              Descripción
              <input
                type="text"
                required
                value={editing.descripcion ?? ''}
                onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-slate-700">
                Caja Contable
                <select
                  value={editing.codigo_caja_contable}
                  onChange={(e) => setEditing({ ...editing, codigo_caja_contable: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs"
                >
                  <option value="CAJA_CLUB_SOCIETARIA">CAJA_CLUB_SOCIETARIA</option>
                  <option value="CAJA_DEP_INFANTIL">CAJA_DEP_INFANTIL</option>
                  <option value="CAJA_DEP_MYJ">CAJA_DEP_MYJ</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-700">
                Naturaleza / Periodicidad
                <select
                  value={`${editing.naturaleza}|${editing.periodicidad}`}
                  onChange={(e) => {
                    const [nat, per] = e.target.value.split('|') as [
                      'SOCIETARIA' | 'DEPORTIVA',
                      'MENSUAL' | 'ANUAL'
                    ];
                    setEditing({ ...editing, naturaleza: nat, periodicidad: per });
                  }}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                >
                  <option value="SOCIETARIA|MENSUAL">Societaria · Mensual</option>
                  <option value="SOCIETARIA|ANUAL">Societaria · Anual</option>
                  <option value="DEPORTIVA|MENSUAL">Deportiva · Mensual</option>
                </select>
              </label>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-700 mb-1.5">
                Meses Activos de Cobro (clic para activar/eximir)
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {MESES_CORTOS.map((mName, idx) => {
                  const mesNum = idx + 1;
                  const active = editing.meses_activos?.includes(mesNum);
                  return (
                    <button
                      type="button"
                      key={mesNum}
                      onClick={() => toggleMonthInEditor(mesNum)}
                      className={`py-1.5 text-xs font-mono rounded border transition-colors ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {mName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                Guardar Subtipo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 2: Generar Cuotas y Padrón
// -----------------------------------------------------------------------------
export const CuotasGenerarScreen: React.FC = () => {
  const { state, generarCuotasPeriodo, editarCuotaEmitida, isUserCoveredByAnualidad } = useClub();
  const [selectedMes, setSelectedMes] = useState<number>(3); // Marzo por defecto, probando Ene/Feb/Mar
  const [selectedAnio, setSelectedAnio] = useState<number>(2026);
  const [enviarWhatsapp, setEnviarWhatsapp] = useState<boolean>(true);
  const [lastResult, setLastResult] = useState<{
    generadas: number;
    exentas: number;
    omitidasPorCalendario: number;
  } | null>(null);

  // Qué subtipos mensuales aplican al mes seleccionado
  const activeSubtypesForMes = useMemo(() => {
    return state.cuotasDetalle.filter(
      (d) => d.activa && d.periodicidad === 'MENSUAL' && d.meses_activos.includes(selectedMes)
    );
  }, [state.cuotasDetalle, selectedMes]);

  const handleGenerate = () => {
    const res = generarCuotasPeriodo(selectedMes, selectedAnio, enviarWhatsapp);
    setLastResult(res);
  };

  const recentCuotas = state.cuotasEmitidas.slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs text-slate-500">Módulo Cuotas · Facturación Masiva</div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
          Generar Cuotas y Padrón de Socios
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Emisión automática por período respetando el calendario estacional (Dic-Ene-Feb) y eximiendo a quienes poseen Anualidad Paga.
        </p>
      </div>

      {/* Selector de Mes + Previsualización Estacional en vivo */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-medium text-slate-700">
              Mes a facturar
              <select
                value={selectedMes}
                onChange={(e) => setSelectedMes(Number(e.target.value))}
                className="ml-2 px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium bg-white"
              >
                {MESES_NOMBRES.map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-slate-700">
              Año
              <select
                value={selectedAnio}
                onChange={(e) => setSelectedAnio(Number(e.target.value))}
                className="ml-2 px-3 py-1.5 border border-slate-300 rounded-md text-sm font-mono bg-white"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer ml-2">
              <input
                type="checkbox"
                checked={enviarWhatsapp}
                onChange={(e) => setEnviarWhatsapp(e.target.checked)}
                className="rounded border-slate-300"
              />
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enviar aviso paralelo por WhatsApp (opcional)</span>
            </label>
          </div>

          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generar Cuotas del Período ({MESES_NOMBRES[selectedMes - 1]})</span>
          </button>
        </div>

        {/* Filtro en vivo de calendario estacional */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-800">
            Simulación de Calendario Estacional para {MESES_NOMBRES[selectedMes - 1]} {selectedAnio}:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {state.cuotasDetalle
              .filter((d) => d.activa && d.periodicidad === 'MENSUAL')
              .map((det) => {
                const aplica = det.meses_activos.includes(selectedMes);
                return (
                  <div
                    key={det.id}
                    className={`border rounded px-3 py-2 text-xs ${
                      aplica
                        ? 'bg-white border-emerald-200 text-slate-900'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-semibold">
                      <span>{det.codigo}</span>
                      <span className={aplica ? 'text-emerald-700' : 'text-amber-700'}>
                        {aplica ? 'SE EMITE' : 'EXENTO RECESO'}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate">{det.descripcion}</div>
                  </div>
                );
              })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
            <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>
              Correo electrónico obligatorio garantizado para todos los titulares · Quienes posean{' '}
              <strong className="text-slate-900">Anualidad Paga</strong> serán omitidos de cuotas societarias mensuales.
            </span>
          </div>
        </div>

        {lastResult && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-md px-4 py-3 text-xs text-emerald-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Último lote ejecutado: <strong>{lastResult.generadas}</strong> cuotas generadas ·{' '}
                <strong>{lastResult.exentas}</strong> omitidas por Anualidad Paga ·{' '}
                <strong>{lastResult.omitidasPorCalendario}</strong> exentas por receso estacional.
              </span>
            </div>
            <span className="font-mono">Emails despachados: OK</span>
          </div>
        )}
      </section>

      {/* Grilla de Padrón de Socios */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Padrón de Socios y Jugadores ({state.usuarios.length})
          </h2>
          <span className="text-xs text-slate-500">Email obligatorio · WhatsApp opcional</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="text-left py-2.5 px-3 font-medium">DNI</th>
                <th className="text-left py-2.5 px-3 font-medium">Nombre y Apellido</th>
                <th className="text-left py-2.5 px-3 font-medium">Correo (Obligatorio)</th>
                <th className="text-left py-2.5 px-3 font-medium">WhatsApp (Opcional)</th>
                <th className="text-left py-2.5 px-3 font-medium">depende_de</th>
                <th className="text-left py-2.5 px-3 font-medium">Cuotas Asignadas</th>
                <th className="text-left py-2.5 px-3 font-medium">Cobertura Anual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.usuarios.map((u) => {
                const cubierto = isUserCoveredByAnualidad(u.id, selectedAnio);
                const subtipos = u.cuotas_asignadas_ids
                  .map((cid) => state.cuotasDetalle.find((d) => d.id === cid)?.codigo)
                  .filter(Boolean)
                  .join(', ');
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-slate-700">{u.dni}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {u.nombre} {u.apellido}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{u.email}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {u.telefono_whatsapp
                        ? `${u.telefono_whatsapp} ${u.notificar_whatsapp ? '(Activo)' : '(Pausado)'}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {u.depende_de_dni ?? 'Titular'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{subtipos || '—'}</td>
                    <td className="py-2.5 px-3">
                      {cubierto ? (
                        <StatusLabel tone="emerald" label="Anualidad Cubierta" />
                      ) : (
                        <span className="text-slate-500">Facturación mensual</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edición Post-Generación */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Edición Post-Generación (Últimas Cuotas Emitidas)
          </h2>
          <p className="text-xs text-slate-500">
            Permite ajustar montos o anular una cuota emitida por error.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="text-left py-2.5 px-3 font-medium">ID</th>
                <th className="text-left py-2.5 px-3 font-medium">Socio / Jugador</th>
                <th className="text-left py-2.5 px-3 font-medium">Concepto</th>
                <th className="text-left py-2.5 px-3 font-medium">Período</th>
                <th className="text-right py-2.5 px-3 font-medium">Monto Final</th>
                <th className="text-left py-2.5 px-3 font-medium">Estado</th>
                <th className="text-right py-2.5 px-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentCuotas.map((ce) => {
                const u = state.usuarios.find((usr) => usr.id === ce.usuario_id);
                const det = state.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id);
                return (
                  <tr key={ce.id}>
                    <td className="py-2.5 px-3 font-mono text-slate-500">#{ce.id}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">
                      {u?.nombre} {u?.apellido}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{det?.codigo}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {ce.mes ? MESES_NOMBRES[ce.mes - 1] : 'Anual'} {ce.anio}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatARS(ce.monto_final)}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusLabel
                        tone={
                          ce.estado === 'PAGADA'
                            ? 'emerald'
                            : ce.estado === 'PENDIENTE'
                            ? 'amber'
                            : ce.estado === 'EXENTA_POR_ANUAL'
                            ? 'sky'
                            : 'rose'
                        }
                        label={ce.estado}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {ce.estado === 'PENDIENTE' && (
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() =>
                              editarCuotaEmitida(ce.id, Math.round(ce.monto_final * 0.85), 'PENDIENTE')
                            }
                            className="px-2 py-1 border border-slate-300 rounded text-[11px] hover:bg-slate-50"
                          >
                            -15% Bonif.
                          </button>
                          <button
                            onClick={() => editarCuotaEmitida(ce.id, ce.monto_final, 'ANULADA')}
                            className="px-2 py-1 border border-rose-200 text-rose-700 rounded text-[11px] hover:bg-rose-50"
                          >
                            Anular
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 3: Ver Pagos y Acción Cobrar (Conciliación MP y Caja)
// -----------------------------------------------------------------------------
export const CuotasVerPagosScreen: React.FC = () => {
  const { state, activeRole, cobrarCuotasEfectivoTesorero } = useClub();
  const accessLevel = getScreenAccessLevel(activeRole, 'cuotas_pagos');
  const isReadOnly = accessLevel === 'LECTURA';

  const [dniSearch, setDniSearch] = useState<string>('30456789');
  const [selectedCuotaIds, setSelectedCuotaIds] = useState<number[]>([]);

  // Clasificación automática por Caja Contable (Bruto/Neto MP vs Efectivo)
  const cajasResumen = useMemo(() => {
    const map: Record<
      string,
      { mpBruto: number; mpNeto: number; efectivo: number; fondoPropio: number; total: number }
    > = {};

    state.transacciones
      .filter((t) => t.estado_validacion !== 'PENDIENTE_RECEPCION_EFECTIVO')
      .forEach((tx) => {
        if (!map[tx.codigo_caja_contable]) {
          map[tx.codigo_caja_contable] = {
            mpBruto: 0,
            mpNeto: 0,
            efectivo: 0,
            fondoPropio: 0,
            total: 0,
          };
        }
        const entry = map[tx.codigo_caja_contable];
        if (tx.medio_pago === 'MERCADO_PAGO') {
          entry.mpBruto += tx.monto;
          entry.mpNeto += tx.monto_neto;
        } else if (tx.medio_pago === 'EFECTIVO') {
          entry.efectivo += tx.monto;
        } else {
          entry.fondoPropio += tx.monto;
        }
        entry.total += tx.monto;
      });
    return Object.entries(map);
  }, [state.transacciones]);

  const totalCuotasEmitidas = state.cuotasEmitidas.filter((c) => c.estado !== 'ANULADA').length;
  const cuotasCobradas = state.cuotasEmitidas.filter(
    (c) => c.estado === 'PAGADA' || c.estado === 'EXENTA_POR_ANUAL'
  ).length;
  const efectividadPct =
    totalCuotasEmitidas > 0 ? Math.round((cuotasCobradas / totalCuotasEmitidas) * 100) : 0;

  // Búsqueda por DNI (titular + dependientes)
  const matchedTitular = useMemo(() => {
    const q = dniSearch.trim();
    if (!q) return null;
    const direct = state.usuarios.find((u) => u.dni.includes(q));
    if (!direct) return null;
    if (direct.depende_de_dni) {
      return state.usuarios.find((u) => u.dni === direct.depende_de_dni) ?? direct;
    }
    return direct;
  }, [dniSearch, state.usuarios]);

  const cuotasByDni = useMemo(() => {
    if (!matchedTitular) return [];
    return state.cuotasEmitidas.filter(
      (ce) => ce.responsable_pago_dni === matchedTitular.dni && ce.estado === 'PENDIENTE'
    );
  }, [matchedTitular, state.cuotasEmitidas]);

  const toggleSelect = (id: number) => {
    setSelectedCuotaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCobrarEfectivo = () => {
    if (selectedCuotaIds.length === 0 || isReadOnly) return;
    cobrarCuotasEfectivoTesorero(selectedCuotaIds);
    setSelectedCuotaIds([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">Módulo Cuotas · Auditoría de Tesorería</div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            Ver Pagos, Cajas Virtuales y Acción Cobrar
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Desglose automático por codigo_caja_contable, cobro presencial por DNI y log en vivo de Webhooks Mercado Pago.
          </p>
        </div>
        {isReadOnly && <StatusLabel tone="amber" label="Modo Solo Lectura (Comisión)" />}
      </div>

      {/* KPIs + Tabla por Caja Virtual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="text-xs text-slate-500">Efectividad de Cobranza</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-emerald-700">
            {efectividadPct}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {cuotasCobradas} de {totalCuotasEmitidas} obligaciones regularizadas
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="text-xs text-slate-500">Ingresos Mercado Pago (Neto)</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-sky-600">
            {formatARS(
              cajasResumen.reduce((acc, [, v]) => acc + v.mpNeto, 0)
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Bruto:{' '}
            <span className="font-mono tabular-nums">
              {formatARS(cajasResumen.reduce((acc, [, v]) => acc + v.mpBruto, 0))}
            </span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="text-xs text-slate-500">Ingresos en Efectivo Verificados</div>
          <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-slate-900">
            {formatARS(
              cajasResumen.reduce((acc, [, v]) => acc + v.efectivo, 0)
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">Ventanilla Tesorería + Managers</div>
        </div>
      </div>

      {/* Balance por Cajas Virtuales */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Balance Clasificado por Caja Contable (codigo_caja_contable)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="text-left py-2.5 px-4 font-medium">Código Caja Virtual</th>
                <th className="text-right py-2.5 px-4 font-medium">MP Bruto</th>
                <th className="text-right py-2.5 px-4 font-medium">MP Neto</th>
                <th className="text-right py-2.5 px-4 font-medium">Efectivo</th>
                <th className="text-right py-2.5 px-4 font-medium">Fondo Propio</th>
                <th className="text-right py-2.5 px-4 font-medium">Total Imputado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cajasResumen.map(([caja, vals]) => (
                <tr key={caja}>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{caja}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {formatARS(vals.mpBruto)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-sky-700 font-medium">
                    {formatARS(vals.mpNeto)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700">
                    {formatARS(vals.efectivo)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700">
                    {formatARS(vals.fondoPropio)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                    {formatARS(vals.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Acción Cobrar en Efectivo por DNI */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Acción Cobrar — Ventanilla de Tesorería (Efectivo)
            </h2>
            <p className="text-xs text-slate-500">
              Buscá por DNI para traer al socio titular y sus dependientes (depende_de) y liquidar en efectivo sin comprobantes.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={dniSearch}
              onChange={(e) => {
                setDniSearch(e.target.value);
                setSelectedCuotaIds([]);
              }}
              placeholder="Buscar DNI (ej. 30456789)"
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {matchedTitular ? (
          <div className="space-y-3">
            <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-3 py-2">
              Titular responsable: <strong className="text-slate-900">{matchedTitular.nombre} {matchedTitular.apellido}</strong>{' '}
              · DNI <span className="font-mono">{matchedTitular.dni}</span> · {matchedTitular.email}
            </div>

            {cuotasByDni.length > 0 ? (
              <>
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="py-2 px-3 w-10"></th>
                        <th className="text-left py-2 px-3 font-medium">Beneficiario</th>
                        <th className="text-left py-2 px-3 font-medium">Concepto</th>
                        <th className="text-left py-2 px-3 font-medium">Caja</th>
                        <th className="text-right py-2 px-3 font-medium">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cuotasByDni.map((ce) => {
                        const u = state.usuarios.find((usr) => usr.id === ce.usuario_id);
                        const det = state.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id);
                        const checked = selectedCuotaIds.includes(ce.id);
                        return (
                          <tr key={ce.id} className={checked ? 'bg-emerald-50/40' : ''}>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                disabled={isReadOnly}
                                checked={checked}
                                onChange={() => toggleSelect(ce.id)}
                                className="rounded border-slate-300"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {u?.nombre} {u?.apellido}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">
                              {det?.codigo} · {ce.mes ? MESES_NOMBRES[ce.mes - 1] : 'Anual'} {ce.anio}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              {det?.codigo_caja_contable}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                              {formatARS(ce.monto_final)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-xs text-slate-600 font-mono tabular-nums">
                      Seleccionado:{' '}
                      <strong>
                        {formatARS(
                          cuotasByDni
                            .filter((c) => selectedCuotaIds.includes(c.id))
                            .reduce((s, c) => s + c.monto_final, 0)
                        )}
                      </strong>
                    </span>
                    <button
                      disabled={selectedCuotaIds.length === 0}
                      onClick={handleCobrarEfectivo}
                      className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Cobrar en Efectivo ({selectedCuotaIds.length})
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-slate-500 py-2">
                No registra cuotas pendientes de pago para este grupo familiar.
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500">Ingresá un DNI válido para consultar su estado.</div>
        )}
      </section>

      {/* Monitor de Órdenes Mercado Pago (Webhook) */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Monitor de Órdenes Mercado Pago (Webhooks IPN)
          </h2>
          <span className="font-mono text-xs text-sky-600">{state.ordenesMP.length} órdenes</span>
        </div>
        <div className="divide-y divide-slate-100">
          {state.ordenesMP.map((ord) => {
            const pagador = state.usuarios.find((u) => u.id === ord.pagador_usuario_id);
            return (
              <div key={ord.id} className="p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="font-mono font-semibold text-slate-900">{ord.mp_payment_id}</span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="text-slate-700 font-medium">
                      {pagador?.nombre} {pagador?.apellido}
                    </span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="font-mono text-slate-500">{formatDateTimeAR(ord.fecha_aprobacion)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono tabular-nums text-xs text-slate-700">
                      Bruto {formatARS(ord.monto_total)} → Neto <strong>{formatARS(ord.monto_neto)}</strong>
                    </span>
                    <StatusLabel tone="emerald" label={ord.mp_status} mono />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ord.items.map((it) => (
                    <span
                      key={it.id}
                      className="text-[11px] font-mono bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700"
                    >
                      {it.codigo_caja_contable}: {formatARS(it.monto_aplicado)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// -----------------------------------------------------------------------------
// PANTALLA 4: Ver Cuotas a Pagar (Carrito Familiar Unificado MP)
// -----------------------------------------------------------------------------
export const CuotasAPagarScreen: React.FC = () => {
  const {
    state,
    activeRole,
    activeUser,
    isUserCoveredByAnualidad,
    getDependantsOf,
    openMercadoPagoCheckout,
  } = useClub();

  // Permite a Admin/Tesorero auditar la vista de un titular específico
  const titulares = state.usuarios.filter((u) => !u.depende_de_dni);
  const [previewTitularId, setPreviewTitularId] = useState<number>(activeUser.id);
  const targetUser =
    activeRole === 'ADMIN' || activeRole === 'TESORERO'
      ? state.usuarios.find((u) => u.id === previewTitularId) ?? activeUser
      : activeUser;

  const titularDni = targetUser.depende_de_dni ?? targetUser.dni;
  const titularUser = state.usuarios.find((u) => u.dni === titularDni) ?? targetUser;
  const dependants = getDependantsOf(titularUser.dni);
  const anualidadCubierta = isUserCoveredByAnualidad(titularUser.id, 2026);

  const pendingCuotas = useMemo(() => {
    return state.cuotasEmitidas.filter((ce) => {
      if (ce.responsable_pago_dni !== titularUser.dni || ce.estado !== 'PENDIENTE') return false;
      const det = state.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id);
      if (anualidadCubierta && det?.naturaleza === 'SOCIETARIA') return false;
      return true;
    });
  }, [state.cuotasEmitidas, state.cuotasDetalle, titularUser.dni, anualidadCubierta]);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleId = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedCuotas = pendingCuotas.filter((c) => selectedIds.includes(c.id));
  const totalSelected = selectedCuotas.reduce((s, c) => s + c.monto_final, 0);

  const handleCheckoutSelected = () => {
    const items: CheckoutItemRequest[] = selectedCuotas.map((ce) => {
      const det = state.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id);
      const u = state.usuarios.find((usr) => usr.id === ce.usuario_id);
      return {
        tipo_obligacion: 'CUOTA',
        obligacion_id: ce.id,
        descripcion: `${det?.codigo ?? 'CUOTA'} ${ce.mes ? MESES_NOMBRES[ce.mes - 1] : 'Anual'} ${
          ce.anio
        } — ${u?.nombre} ${u?.apellido}`,
        monto: ce.monto_final,
        codigo_caja_contable: det?.codigo_caja_contable ?? 'CAJA_CLUB_SOCIETARIA',
      };
    });
    openMercadoPagoCheckout(items, titularUser.id);
    setSelectedIds([]);
  };

  // Pago Anual Anticipado (CS-A o CSG-A)
  const cuotaAnualSubtipo = useMemo(() => {
    const isGrupal = dependants.length > 0;
    return state.cuotasDetalle.find((d) =>
      isGrupal ? d.codigo === 'CSG-A' : d.codigo === 'CS-A'
    );
  }, [dependants.length, state.cuotasDetalle]);

  const handlePagarAnualAnticipado = () => {
    if (!cuotaAnualSubtipo) return;
    openMercadoPagoCheckout(
      [
        {
          tipo_obligacion: 'CUOTA',
          obligacion_id: cuotaAnualSubtipo.id,
          descripcion: `${cuotaAnualSubtipo.codigo} ${cuotaAnualSubtipo.descripcion} 2026 (${titularUser.nombre} ${titularUser.apellido})`,
          monto: cuotaAnualSubtipo.monto,
          codigo_caja_contable: cuotaAnualSubtipo.codigo_caja_contable,
          meta: {
            es_cuota_anual: true,
            titular_dni: titularUser.dni,
          },
        },
      ],
      titularUser.id
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">Módulo Cuotas · Portal de Autogestión</div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
            Ver Cuotas a Pagar (Carrito Familiar)
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Titular responsable: <strong>{titularUser.nombre} {titularUser.apellido}</strong> · DNI{' '}
            <span className="font-mono">{titularUser.dni}</span>
            {dependants.length > 0 && ` · ${dependants.length} dependiente(s) unificado(s)`}
          </p>
        </div>

        {(activeRole === 'ADMIN' || activeRole === 'TESORERO') && (
          <label className="text-xs font-medium text-slate-700">
            Auditar cuenta de:
            <select
              value={titularUser.id}
              onChange={(e) => {
                setPreviewTitularId(Number(e.target.value));
                setSelectedIds([]);
              }}
              className="ml-2 px-3 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
            >
              {titulares.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.apellido} (DNI {t.dni})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Estado de Anualidad */}
      {anualidadCubierta ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-3 text-emerald-900">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <div className="text-sm font-bold">
              Cuota Societaria Anual 2026 Cubierta - Sin deuda societaria
            </div>
            <div className="text-xs text-emerald-800 mt-0.5">
              El titular y todo su grupo familiar (depende_de) están exentos de cuotas societarias mensuales durante 2026. Solo verás cuotas deportivas si practican actividad en meses activos.
            </div>
          </div>
        </div>
      ) : (
        cuotaAnualSubtipo && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Opción de Pago Anual Anticipado ({cuotaAnualSubtipo.codigo})
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Cancelá todo el año societario 2026 en un solo pago y eximí automáticamente las cuotas mensuales pendientes y futuras de tu grupo familiar.
              </div>
            </div>
            <button
              onClick={handlePagarAnualAnticipado}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-md hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
            >
              Abonar Anualidad ({formatARS(cuotaAnualSubtipo.monto)})
            </button>
          </div>
        )
      )}

      {/* Listado Unificado con Selección Múltiple */}
      <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Cuotas Pendientes (Propias + Dependientes)
          </h2>
          {pendingCuotas.length > 0 && (
            <button
              onClick={() =>
                setSelectedIds(
                  selectedIds.length === pendingCuotas.length
                    ? []
                    : pendingCuotas.map((c) => c.id)
                )
              }
              className="text-xs font-medium text-sky-600 hover:text-sky-700"
            >
              {selectedIds.length === pendingCuotas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
            </button>
          )}
        </div>

        {pendingCuotas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                <tr>
                  <th className="py-2.5 px-4 w-10"></th>
                  <th className="text-left py-2.5 px-4 font-medium">Integrante</th>
                  <th className="text-left py-2.5 px-4 font-medium">Subtipo de Cuota</th>
                  <th className="text-left py-2.5 px-4 font-medium">Período</th>
                  <th className="text-left py-2.5 px-4 font-medium">Caja Virtual</th>
                  <th className="text-right py-2.5 px-4 font-medium">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingCuotas.map((ce) => {
                  const u = state.usuarios.find((usr) => usr.id === ce.usuario_id);
                  const det = state.cuotasDetalle.find((d) => d.id === ce.cuota_detalle_id);
                  const checked = selectedIds.includes(ce.id);
                  const isDep = u?.depende_de_dni !== null;
                  return (
                    <tr
                      key={ce.id}
                      onClick={() => toggleId(ce.id)}
                      className={`cursor-pointer transition-colors ${
                        checked ? 'bg-sky-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleId(ce.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {u?.nombre} {u?.apellido}
                        </div>
                        <div className="text-xs text-slate-500">
                          {isDep ? 'Dependiente (depende_de)' : 'Titular'} · DNI{' '}
                          <span className="font-mono">{u?.dni}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{det?.descripcion}</div>
                        <div className="font-mono text-xs text-slate-500">{det?.codigo}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700">
                        {ce.mes ? MESES_NOMBRES[ce.mes - 1] : 'Anual'} {ce.anio}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-sky-700">
                        {det?.codigo_caja_contable}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatARS(ce.monto_final)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            ¡Excelente! No tenés cuotas pendientes en tu bandeja familiar.
          </div>
        )}
      </section>

      {/* Nota explícita de canales de pago (Cero transferencias / Cero comprobantes) */}
      <div className="bg-slate-100 border border-slate-200 rounded-md px-4 py-3 flex items-start gap-2.5 text-xs text-slate-600">
        <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <span>
          <strong>Canales exclusivos habilitados:</strong> Los pagos en línea se procesan únicamente mediante{' '}
          <strong>Checkout Pro de Mercado Pago</strong> con acreditación automática, o en{' '}
          <strong>Efectivo presencial</strong> en secretaría del club. No se utilizan transferencias CBU/Alias ni carga de comprobantes.
        </span>
      </div>

      {/* Barra flotante totalizadora */}
      {selectedCuotas.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl bg-slate-900 text-white rounded-lg shadow-xl border border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">Carrito Unificado Mercado Pago</div>
            <div className="font-mono tabular-nums text-base font-bold">
              {selectedCuotas.length} cuota(s) · Total {formatARS(totalSelected)}
            </div>
          </div>
          <button
            onClick={handleCheckoutSelected}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              Pagar {selectedCuotas.length} cuotas juntas con Mercado Pago ({formatARS(totalSelected)})
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
