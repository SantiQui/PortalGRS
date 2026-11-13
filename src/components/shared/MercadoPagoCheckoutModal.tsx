import React from 'react';
import { CheckCircle2, CreditCard, Layers, Lock, ShieldCheck, X } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatARS } from '../../utils/format';

export const MercadoPagoCheckoutModal: React.FC = () => {
  const { pendingCheckout, closeMercadoPagoCheckout, confirmMercadoPagoPayment, state } = useClub();

  if (!pendingCheckout) return null;

  const pagador = state.usuarios.find((u) => u.id === pendingCheckout.pagadorUsuarioId);
  const totalBruto = pendingCheckout.items.reduce((acc, i) => acc + i.monto, 0);
  const comisionPct = state.configGlobal.comision_mp_pct;
  const totalComision = Math.round(totalBruto * (comisionPct / 100));
  const totalNeto = totalBruto - totalComision;

  // Agrupación por codigo_caja_contable
  const cajasMap = pendingCheckout.items.reduce<Record<string, number>>((acc, it) => {
    acc[it.codigo_caja_contable] = (acc[it.codigo_caja_contable] ?? 0) + it.monto;
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout Pro Mercado Pago"
    >
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        {/* Cabecera Sky-500 identidad Mercado Pago */}
        <div className="bg-sky-500 text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white/15 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold leading-tight">
                Checkout Pro — Mercado Pago (Cuenta Única)
              </h2>
              <p className="text-xs text-sky-100">
                Guaycurues Rugby Sunchales · Imputación automática por Caja Virtual
              </p>
            </div>
          </div>
          <button
            onClick={closeMercadoPagoCheckout}
            className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
            aria-label="Cerrar checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Datos de preferencia */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 text-xs text-slate-600">
            <div>
              <span className="text-slate-500">Pagador:</span>{' '}
              <span className="font-semibold text-slate-900">
                {pagador ? `${pagador.nombre} ${pagador.apellido}` : 'Socio'}
              </span>{' '}
              <span className="text-slate-400">·</span>{' '}
              <span className="font-mono">DNI {pagador?.dni}</span>
            </div>
            <div className="font-mono text-slate-500">
              ref: {pendingCheckout.externalReference} · {pendingCheckout.mpPreferenceId}
            </div>
          </div>

          {/* Array de ítems enviados a API MP */}
          <div>
            <h3 className="text-xs font-semibold text-slate-700 mb-2">
              Detalle de ítems en Ordenes_Pago_MP_Items ({pendingCheckout.items.length})
            </h3>
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium">Concepto</th>
                    <th className="text-left py-2 px-3 font-medium">Tipo</th>
                    <th className="text-left py-2 px-3 font-medium">Caja Virtual</th>
                    <th className="text-right py-2 px-3 font-medium">Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingCheckout.items.map((item, idx) => (
                    <tr key={`${item.tipo_obligacion}-${item.obligacion_id}-${idx}`}>
                      <td className="py-2.5 px-3 text-slate-900 font-medium">{item.descripcion}</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                        {item.tipo_obligacion}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-sky-700">
                        {item.codigo_caja_contable}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatARS(item.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Clasificación contable automática por Caja */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Distribución Contable Automática (Webhook IPN)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(cajasMap).map(([caja, monto]) => {
                const com = Math.round(monto * (comisionPct / 100));
                const neto = monto - com;
                return (
                  <div
                    key={caja}
                    className="bg-white border border-slate-200 rounded px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-mono text-xs font-semibold text-slate-900">{caja}</div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">
                        Neto: {formatARS(neto)} (-{comisionPct}% MP)
                      </div>
                    </div>
                    <div className="font-mono tabular-nums text-sm font-semibold text-slate-900">
                      {formatARS(monto)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totales */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200">
            <div className="space-y-0.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Sin comprobantes manuales · Acreditación inmediata vía IPN</span>
              </div>
              <div className="font-mono tabular-nums">
                Bruto: {formatARS(totalBruto)} · Comisión MP ({comisionPct}%): -{formatARS(totalComision)} · Neto club:{' '}
                <strong className="text-slate-900">{formatARS(totalNeto)}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={closeMercadoPagoCheckout}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Cancelar
              </button>
              <button
                onClick={confirmMercadoPagoPayment}
                className="px-4 py-2 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-md transition-colors inline-flex items-center gap-2 whitespace-nowrap shadow-xs"
              >
                <Lock className="w-4 h-4" />
                <span>Confirmar Pago ({formatARS(totalBruto)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
