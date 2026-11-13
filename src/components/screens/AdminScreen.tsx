import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Coins,
  CreditCard,
  Layers,
  Shield,
  Users,
  Wallet,
} from 'lucide-react';
import { ROLE_OPTIONS } from '../../config/rbac';
import { useClub } from '../../context/ClubContext';
import { BloqueDeportivo, Categoria, RoleId } from '../../types/srs';
import { formatARS, formatDateTimeAR } from '../../utils/format';
import { StatusLabel } from '../shared/StatusIndicator';

type AdminTab = 'roles' | 'categorias' | 'efectivo' | 'fondo_propio' | 'webhook_notif';

export const AdminScreen: React.FC = () => {
  const {
    state,
    toggleUsuarioRol,
    upsertCategoria,
    confirmarRecepcionEfectivo,
    updateConfigGlobal,
  } = useClub();

  const [tab, setTab] = useState<AdminTab>('efectivo');

  // Form categoría
  const [editingCat, setEditingCat] = useState<Partial<Categoria> | null>(null);

  // Config global MP & Notificaciones
  const [cfg, setCfg] = useState(state.configGlobal);

  const pendientesEfectivo = state.transacciones.filter(
    (t) => t.estado_validacion === 'PENDIENTE_RECEPCION_EFECTIVO'
  );
  const historialEfectivo = state.transacciones.filter((t) => t.medio_pago === 'EFECTIVO');

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs text-slate-500">Módulo Admin · Configuración Global y Seguridad</div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mt-0.5">
          Panel de Administración y Auditoría (SRS Sección 4.7)
        </h1>
      </div>

      {/* Sub-paneles en pestañas */}
      <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
        {[
          { id: 'efectivo', label: `Bandeja Efectivo (${pendientesEfectivo.length})`, icon: Coins },
          { id: 'categorias', label: 'Categorías y Cajas Contables', icon: Layers },
          { id: 'roles', label: 'Roles RBAC y Usuarios', icon: Shield },
          { id: 'fondo_propio', label: 'Auditoría Fondo Propio', icon: Wallet },
          { id: 'webhook_notif', label: 'Webhook MP y Notificaciones', icon: Bell },
        ].map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as AdminTab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                active ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. BANDEJA CONFIRMACIÓN DE EFECTIVO EN MANOS DE MANAGERS */}
      {tab === 'efectivo' && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Pendientes de Confirmación de Recepción (PENDIENTE_RECEPCION_EFECTIVO)
                </h2>
                <p className="text-xs text-slate-500">
                  Pagos en efectivo declarados en Ventas, Fichajes y Tercer Tiempo esperando confirmación del Manager/Admin.
                </p>
              </div>
              <StatusLabel
                tone={pendientesEfectivo.length > 0 ? 'amber' : 'emerald'}
                label={`${pendientesEfectivo.length} pendiente(s)`}
              />
            </div>

            {pendientesEfectivo.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {pendientesEfectivo.map((tx) => {
                  const pagador = state.usuarios.find((u) => u.id === tx.usuario_id);
                  const receptor = state.usuarios.find((u) => u.id === tx.receptor_efectivo_id);
                  return (
                    <div
                      key={tx.id}
                      className="p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1 text-xs">
                        <div className="font-semibold text-slate-900">{tx.descripcion}</div>
                        <div className="text-slate-600">
                          Entregado por: <strong>{pagador?.nombre} {pagador?.apellido}</strong> →
                          Receptor designado:{' '}
                          <strong className="text-slate-900">
                            {receptor?.nombre} {receptor?.apellido}
                          </strong>
                        </div>
                        <div className="font-mono text-slate-500">
                          {tx.origen_tipo} · Caja: {tx.codigo_caja_contable} ·{' '}
                          {formatDateTimeAR(tx.fecha)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono tabular-nums text-base font-bold text-slate-900">
                          {formatARS(tx.monto)}
                        </span>
                        <button
                          onClick={() => confirmarRecepcionEfectivo(tx.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmar Recepción</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                No hay rendiciones de efectivo pendientes de confirmación.
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Control Histórico de Efectivo Rendido ({historialEfectivo.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium">Fecha</th>
                    <th className="text-left py-2 px-4 font-medium">Concepto</th>
                    <th className="text-left py-2 px-4 font-medium">Receptor</th>
                    <th className="text-left py-2 px-4 font-medium">Caja</th>
                    <th className="text-left py-2 px-4 font-medium">Estado</th>
                    <th className="text-right py-2 px-4 font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historialEfectivo.map((tx) => {
                    const rec = state.usuarios.find((u) => u.id === tx.receptor_efectivo_id);
                    return (
                      <tr key={tx.id}>
                        <td className="py-2.5 px-4 font-mono text-slate-500">
                          {formatDateTimeAR(tx.fecha)}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">{tx.descripcion}</td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {rec ? `${rec.nombre} ${rec.apellido}` : 'Tesorería'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {tx.codigo_caja_contable}
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusLabel
                            tone={
                              tx.estado_validacion === 'EFECTIVO_RECIBIDO' ? 'emerald' : 'amber'
                            }
                            label={tx.estado_validacion}
                            mono
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          {formatARS(tx.monto)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* 2. ABM DE CATEGORÍAS Y CAJAS CONTABLES */}
      {tab === 'categorias' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                setEditingCat({
                  nombre: '',
                  bloque_deportivo: 'JUVENIL',
                  es_menor_edad: true,
                  codigo_caja_contable: 'CAJA_CAT_NUEVA',
                  managers_habilitados_ids: [4],
                })
              }
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800"
            >
              + Nueva Categoría
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.categorias.map((cat) => {
              const managers = state.usuarios.filter((u) =>
                cat.managers_habilitados_ids.includes(u.id)
              );
              return (
                <div
                  key={cat.id}
                  className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs text-sky-700 font-semibold">
                        {cat.codigo_caja_contable}
                      </div>
                      <h3 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                        {cat.nombre}
                      </h3>
                    </div>
                    <button
                      onClick={() => setEditingCat(cat)}
                      className="text-xs font-medium text-sky-600 hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      Bloque deportivo: <strong>{cat.bloque_deportivo}</strong>
                    </div>
                    <div>
                      Flag es_menor_edad:{' '}
                      <strong className="font-mono">
                        {cat.es_menor_edad ? 'true (Delega Tercer Tiempo a Tutor)' : 'false'}
                      </strong>
                    </div>
                    <div>
                      Managers autorizados a recibir efectivo:{' '}
                      <strong>
                        {managers.map((m) => `${m.nombre} ${m.apellido}`).join(', ') || 'Ninguno'}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {editingCat && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingCat.nombre) return;
                upsertCategoria({
                  id: editingCat.id,
                  nombre: editingCat.nombre,
                  bloque_deportivo: (editingCat.bloque_deportivo ?? 'JUVENIL') as BloqueDeportivo,
                  es_menor_edad: Boolean(editingCat.es_menor_edad),
                  codigo_caja_contable: editingCat.codigo_caja_contable ?? 'CAJA_CAT',
                  managers_habilitados_ids: editingCat.managers_habilitados_ids ?? [4],
                });
                setEditingCat(null);
              }}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3 max-w-xl"
            >
              <h3 className="font-display text-sm font-bold text-slate-900">
                {editingCat.id ? `Editar ${editingCat.nombre}` : 'Nueva Categoría'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Nombre (ej. M18 Juvenil)"
                  value={editingCat.nombre ?? ''}
                  onChange={(e) => setEditingCat({ ...editingCat, nombre: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="codigo_caja_contable"
                  value={editingCat.codigo_caja_contable ?? ''}
                  onChange={(e) =>
                    setEditingCat({ ...editingCat, codigo_caja_contable: e.target.value })
                  }
                  className="px-3 py-2 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <select
                  value={editingCat.bloque_deportivo}
                  onChange={(e) =>
                    setEditingCat({
                      ...editingCat,
                      bloque_deportivo: e.target.value as BloqueDeportivo,
                    })
                  }
                  className="px-3 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="INFANTIL">INFANTIL</option>
                  <option value="JUVENIL">JUVENIL</option>
                  <option value="MAYOR">MAYOR</option>
                </select>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(editingCat.es_menor_edad)}
                    onChange={(e) =>
                      setEditingCat({ ...editingCat, es_menor_edad: e.target.checked })
                    }
                  />
                  <span>es_menor_edad (delega 3er Tiempo a Tutor)</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-1.5 border border-slate-300 text-xs rounded"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. GESTIÓN DE USUARIOS Y ROLES RBAC */}
      {tab === 'roles' && (
        <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Matriz de Usuarios y Acumulación de Roles RBAC
            </h2>
            <p className="text-xs text-slate-500">
              Un mismo usuario puede acumular múltiples roles simultáneos según Sección 2 del SRS.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="text-left py-2.5 px-4 font-medium">Usuario / DNI</th>
                  <th className="text-left py-2.5 px-4 font-medium">Roles Asignados (Clic para alternar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.usuarios.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {u.nombre} {u.apellido}
                      </div>
                      <div className="font-mono text-slate-500">
                        DNI {u.dni} · {u.email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {ROLE_OPTIONS.filter((r) => r.id !== 'PUBLICO_COMERCIO').map((role) => {
                          const has = u.roles.includes(role.id as RoleId);
                          return (
                            <button
                              key={role.id}
                              onClick={() => toggleUsuarioRol(u.id, role.id as RoleId)}
                              className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                                has
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {role.shortLabel}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. AUDITORÍA DE FONDO PROPIO */}
      {tab === 'fondo_propio' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {state.usuarios
              .filter((u) => u.saldo_fondo_propio > 0 || u.roles.includes('JUGADOR'))
              .map((u) => (
                <div
                  key={u.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs"
                >
                  <div className="text-xs font-semibold text-slate-900">
                    {u.nombre} {u.apellido}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">DNI {u.dni}</div>
                  <div className="mt-2 font-mono tabular-nums text-lg font-bold text-emerald-700">
                    {formatARS(u.saldo_fondo_propio)}
                  </div>
                </div>
              ))}
          </div>

          <section className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Historial Auditable de Movimientos de Billetera (Fondo Propio)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="text-left py-2 px-4 font-medium">Fecha</th>
                    <th className="text-left py-2 px-4 font-medium">Jugador</th>
                    <th className="text-left py-2 px-4 font-medium">Tipo</th>
                    <th className="text-left py-2 px-4 font-medium">Descripción</th>
                    <th className="text-right py-2 px-4 font-medium">Monto</th>
                    <th className="text-right py-2 px-4 font-medium">Saldo Resultante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {state.fondoPropioMovimientos.map((m) => {
                    const u = state.usuarios.find((usr) => usr.id === m.usuario_id);
                    return (
                      <tr key={m.id}>
                        <td className="py-2.5 px-4 font-mono text-slate-500">
                          {formatDateTimeAR(m.fecha)}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900">
                          {u?.nombre} {u?.apellido}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{m.tipo}</td>
                        <td className="py-2.5 px-4 text-slate-700">{m.descripcion}</td>
                        <td
                          className={`py-2.5 px-4 text-right font-mono tabular-nums font-semibold ${
                            m.monto >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {m.monto >= 0 ? `+${formatARS(m.monto)}` : formatARS(m.monto)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                          {formatARS(m.saldo_resultante)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* 5. CONFIGURACIÓN WEBHOOK MP Y NOTIFICACIONES */}
      {tab === 'webhook_notif' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateConfigGlobal(cfg);
            }}
            className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-sky-500" />
              <h2 className="font-display text-base font-semibold text-slate-900">
                Pasarela Mercado Pago (Cuenta Única) y Canales
              </h2>
            </div>

            <label className="block text-xs font-medium text-slate-700">
              MP Public Key
              <input
                type="text"
                value={cfg.mp_public_key}
                onChange={(e) => setCfg({ ...cfg, mp_public_key: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              URL Webhook IPN
              <input
                type="text"
                value={cfg.webhook_ipn_url}
                onChange={(e) => setCfg({ ...cfg, webhook_ipn_url: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-slate-700">
                Comisión MP (%)
                <input
                  type="number"
                  step="0.01"
                  value={cfg.comision_mp_pct}
                  onChange={(e) => setCfg({ ...cfg, comision_mp_pct: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
                />
              </label>
              <label className="text-xs font-medium text-slate-700">
                Servidor SMTP (Email Obligatorio)
                <input
                  type="text"
                  value={cfg.smtp_host}
                  onChange={(e) => setCfg({ ...cfg, smtp_host: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded font-mono text-xs"
                />
              </label>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={cfg.whatsapp_api_enabled}
                onChange={(e) => setCfg({ ...cfg, whatsapp_api_enabled: e.target.checked })}
              />
              <span>Canal Opcional WhatsApp Business API ({cfg.whatsapp_provider})</span>
            </label>
            <div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md hover:bg-slate-800"
              >
                Guardar Parámetros Globales
              </button>
            </div>
          </form>

          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Log de Notificaciones (Email Obligatorio / WhatsApp Opcional)
              </h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {state.notificaciones.map((n) => (
                <div key={n.id} className="p-3.5 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-slate-900">
                      [{n.canal}] {n.destinatario}
                    </span>
                    <StatusLabel
                      tone={n.estado === 'ENVIADO' ? 'emerald' : 'amber'}
                      label={n.estado}
                      mono
                    />
                  </div>
                  <div className="text-slate-600">{n.asunto}</div>
                  <div className="font-mono text-[11px] text-slate-400">
                    {formatDateTimeAR(n.fecha)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
