import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useClub } from '../../context/ClubContext';

export const ToastStack: React.FC = () => {
  const { toasts, dismissToast, clearToasts, setActiveScreen } = useClub();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
      role="region"
      aria-label="Alertas y notificaciones emergentes"
    >
      {toasts.length > 1 && (
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={clearToasts}
            className="text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md px-2.5 py-1 shadow-sm transition-colors"
          >
            Cerrar todas ({toasts.length})
          </button>
        </div>
      )}

      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : toast.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          ) : toast.type === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          );

        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto bg-white border border-slate-200 rounded-lg shadow-lg p-3.5 flex items-start gap-3"
          >
            {icon}
            <div className="flex-1 min-w-0">
              {(toast.category || toast.timestamp) && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-0.5">
                  {toast.category && <span className="font-medium text-slate-700">{toast.category}</span>}
                  {toast.category && toast.timestamp && <span aria-hidden="true">·</span>}
                  {toast.timestamp && (
                    <span className="font-mono tabular-nums">{toast.timestamp}</span>
                  )}
                </div>
              )}
              <div className="text-sm font-semibold text-slate-900 leading-snug">{toast.title}</div>
              {toast.description && (
                <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {toast.description}
                </div>
              )}
              {toast.actionLabel && toast.targetScreen && (
                <div className="mt-2">
                  <button
                    onClick={() => {
                      if (toast.targetScreen) {
                        setActiveScreen(toast.targetScreen);
                      }
                      dismissToast(toast.id);
                    }}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>{toast.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

