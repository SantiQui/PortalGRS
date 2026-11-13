import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BellRing,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Send,
  X,
} from 'lucide-react';
import { hasScreenAccess, ROLE_OPTIONS } from '../../config/rbac';
import { useClub } from '../../context/ClubContext';
import { CriticalAlertItem, CriticalAlertKind } from '../../types/srs';
import { StatusLabel } from './StatusIndicator';

type FilterTab = 'ALL' | 'PARTIDO_PROXIMO' | 'CUOTA_VENCIDA' | 'CONFIRMACION_PAGO';

interface NotificationPanelProps {
  variant?: 'inline' | 'popover';
}

const mapSeverityToTone = (
  severity: CriticalAlertItem['severity']
): 'sky' | 'rose' | 'emerald' | 'amber' => {
  if (severity === 'error') return 'rose';
  if (severity === 'success') return 'emerald';
  if (severity === 'warning') return 'amber';
  return 'sky';
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ variant = 'inline' }) => {
  const {
    activeRole,
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
    setActiveScreen,
  } = useClub();

  const [filter, setFilter] = useState<FilterTab>('ALL');

  useEffect(() => {
    if (variant !== 'popover' || !notificationPanelOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotificationPanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [variant, notificationPanelOpen, setNotificationPanelOpen]);

  if (variant === 'popover' && !notificationPanelOpen) {
    return null;
  }

  const roleLabel = ROLE_OPTIONS.find((r) => r.id === activeRole)?.label ?? activeRole;

  const matchesFilter = (kind: CriticalAlertKind) => {
    if (filter === 'ALL') return true;
    if (filter === 'PARTIDO_PROXIMO') return kind === 'PARTIDO_PROXIMO';
    if (filter === 'CUOTA_VENCIDA') return kind === 'CUOTA_VENCIDA' || kind === 'APTO_MEDICO';
    return kind === 'CONFIRMACION_PAGO' || kind === 'EFECTIVO_PENDIENTE';
  };

  const filteredAlerts = criticalAlerts.filter((a) => matchesFilter(a.kind));

  const filterTabs: { id: FilterTab; label: string; count: number }[] = [
    { id: 'ALL', label: 'Todas', count: criticalAlerts.length },
    {
      id: 'PARTIDO_PROXIMO',
      label: 'Partido próximo',
      count: criticalAlerts.filter((a) => a.kind === 'PARTIDO_PROXIMO').length,
    },
    {
      id: 'CUOTA_VENCIDA',
      label: 'Cuota vencida',
      count: criticalAlerts.filter(
        (a) => a.kind === 'CUOTA_VENCIDA' || a.kind === 'APTO_MEDICO'
      ).length,
    },
    {
      id: 'CONFIRMACION_PAGO',
      label: 'Confirmación de pago',
      count: criticalAlerts.filter(
        (a) => a.kind === 'CONFIRMACION_PAGO' || a.kind === 'EFECTIVO_PENDIENTE'
      ).length,
    },
  ];

  const containerClasses =
    variant === 'popover'
      ? 'absolute right-0 mt-2 w-[480px] max-w-[calc(100vw-1.5rem)] max-h-[82vh] flex flex-col bg-white border border-slate-200 rounded-lg shadow-xl z-50 text-slate-900'
      : 'bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4';

  return (
    <section
      aria-label="Panel de Notificaciones y Alertas Críticas"
      role={variant === 'popover' ? 'dialog' : undefined}
      className={containerClasses}
    >
      {/* Cabecera */}
      <div
        className={`flex flex-wrap items-start justify-between gap-3 ${
          variant === 'popover' ? 'p-4 border-b border-slate-200' : ''
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-700 shrink-0" />
            <h2 className="font-display text-base font-semibold text-slate-900">
              Panel de Notificaciones Críticas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            <span>{roleLabel}</span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono tabular-nums">{criticalAlerts.length} evento(s)</span>
            <span aria-hidden="true"> · </span>
            <span className="font-mono tabular-nums font-medium text-slate-700">
              {unreadAlertCount} sin leer
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {unreadAlertCount > 0 && (
            <button
              onClick={markAllAlertsRead}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar leídas</span>
            </button>
          )}
          <button
            onClick={() => triggerAllCriticalAlerts()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Emitir alertas en Toast</span>
          </button>
          {variant === 'popover' && (
            <button
              onClick={() => setNotificationPanelOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
              aria-label="Cerrar panel de notificaciones"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs de filtro por tipo de evento crítico */}
      <div className={variant === 'popover' ? 'px-4 pt-3' : ''}>
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit max-w-full">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono tabular-nums text-[11px] text-slate-500">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Listado de eventos críticos */}
      <div
        className={`divide-y divide-slate-100 ${
          variant === 'popover' ? 'overflow-y-auto px-4 flex-1' : ''
        }`}
      >
        {filteredAlerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No hay alertas registradas en esta categoría para la temporada activa.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isRead = readAlertIds.includes(alert.id);
            const canNavigate = hasScreenAccess(activeRole, alert.targetScreen);

            return (
              <div
                key={alert.id}
                className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isRead ? 'opacity-75' : ''
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <StatusLabel tone={mapSeverityToTone(alert.severity)} label={alert.eventLabel} />
                    <span className="text-slate-500">{alert.categoryTag}</span>
                    <span className="text-slate-300" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">{alert.timestamp}</span>
                    {!isRead && (
                      <>
                        <span className="text-slate-300" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-[11px] font-semibold text-sky-600">Nueva</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{alert.title}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => triggerAlertToast(alert)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-600" />
                    <span>Mostrar en Toast</span>
                  </button>
                  {canNavigate && (
                    <button
                      onClick={() => {
                        markAlertRead(alert.id);
                        setActiveScreen(alert.targetScreen);
                        if (variant === 'popover') {
                          setNotificationPanelOpen(false);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>{alert.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Disparador rápido de eventos críticos vía ToastStack */}
      <div
        className={`border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 ${
          variant === 'popover' ? 'p-4 bg-slate-50 rounded-b-lg' : 'pt-3'
        }`}
      >
        <span className="text-xs font-medium text-slate-600">
          Disparar alerta crítica en ToastStack:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => simulateCriticalEvent('PARTIDO_PROXIMO')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Partido próximo</span>
          </button>
          <button
            onClick={() => simulateCriticalEvent('CUOTA_VENCIDA')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Cuota vencida</span>
          </button>
          <button
            onClick={() => simulateCriticalEvent('CONFIRMACION_PAGO')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmación de pago recibida</span>
          </button>
        </div>
      </div>
    </section>
  );
};
