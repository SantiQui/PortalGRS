import React, { useEffect, useRef } from 'react';
import { Bell, Calendar, Menu, RotateCcw, Shield, Wallet } from 'lucide-react';
import { ROLE_OPTIONS } from '../../config/rbac';
import { useClub } from '../../context/ClubContext';
import { RoleId } from '../../types/srs';
import { formatARS } from '../../utils/format';
import { NotificationPanel } from '../shared/NotificationPanel';

export const TopSimulationBar: React.FC = () => {
  const {
    state,
    activeRole,
    activeTemporadaId,
    simulatedWalletBalance,
    isAnualidadSimActive,
    mobileMenuOpen,
    unreadAlertCount,
    notificationPanelOpen,
    setActiveRole,
    setActiveTemporadaId,
    setMobileMenuOpen,
    setNotificationPanelOpen,
    toggleFondoPropioSim,
    toggleAnualidadSim,
    resetDemo,
  } = useClub();

  const popoverRef = useRef<HTMLDivElement>(null);
  const hasSufficientFondo = simulatedWalletBalance >= 10000;

  useEffect(() => {
    if (!notificationPanelOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setNotificationPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationPanelOpen, setNotificationPanelOpen]);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-slate-100 border-b border-slate-800">
      <div className="px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Identidad + Menú móvil */}
        <div className="flex items-center gap-3 shrink-0">
          {activeRole !== 'PUBLICO_COMERCIO' && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white"
              aria-label="Abrir menú de módulos"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-600 text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
              GR
            </div>
            <div className="leading-tight">
              <div className="font-display text-sm font-semibold text-white whitespace-nowrap">
                Guaycurues Rugby Sunchales
              </div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap">
                Sistema Integral SRS · Simulador en Vivo
              </div>
            </div>
          </div>
        </div>

        {/* Controles obligatorios de Simulación Global */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* 1. Selector de Rol Activo (RBAC) */}
          <label className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs">
            <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-slate-400 hidden xl:inline whitespace-nowrap">Rol RBAC:</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as RoleId)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Selector de Rol Activo"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {/* 2. Selector Global de Temporada (Estilo BD.UAR) */}
          <label className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={activeTemporadaId}
              onChange={(e) => setActiveTemporadaId(Number(e.target.value))}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
              aria-label="Selector Global de Temporada"
            >
              {state.temporadas.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                  {t.nombre} ({t.estado === 'EN_CURSO' ? 'En Curso' : t.estado === 'CERRADA' ? 'Cerrada' : 'Planificación'})
                </option>
              ))}
            </select>
          </label>

          {/* 3. Simulador de Billetera Fondo Propio */}
          <button
            onClick={toggleFondoPropioSim}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              hasSufficientFondo
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-rose-950/60 border-rose-700 text-rose-300 hover:bg-rose-900/60'
            }`}
            title="Alternar saldo simulado de Fondo Propio ($42.000 vs $1.500)"
          >
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <span>Fondo Propio:</span>
            <span className="font-mono tabular-nums font-semibold">
              {formatARS(simulatedWalletBalance)}
            </span>
            <span className="hidden md:inline text-[11px] opacity-85">
              ({hasSufficientFondo ? 'Suficiente' : 'Insuficiente'})
            </span>
          </button>

          {/* 4. Switch Anualidad Societaria 2026 Paga */}
          <button
            onClick={toggleAnualidadSim}
            role="switch"
            aria-checked={isAnualidadSimActive}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              isAnualidadSimActive
                ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Simular Anualidad Societaria 2026 Paga para eximir cuotas societarias mensuales"
          >
            <span>Anualidad 2026:</span>
            <span className="font-semibold">{isAnualidadSimActive ? 'Sí (Cubierta)' : 'No'}</span>
          </button>

          {/* 5. Panel de Notificaciones Críticas */}
          {activeRole !== 'PUBLICO_COMERCIO' && (
            <div ref={popoverRef} className="relative">
              <button
                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                aria-expanded={notificationPanelOpen}
                aria-haspopup="dialog"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  notificationPanelOpen
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white'
                }`}
                title="Abrir Panel de Notificaciones y Alertas Críticas"
              >
                <Bell className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Alertas</span>
                <span
                  className={`font-mono tabular-nums text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                    unreadAlertCount > 0
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {unreadAlertCount}
                </span>
              </button>
              <NotificationPanel variant="popover" />
            </div>
          )}

          {/* 6. Botón Reiniciar Demo */}
          <button
            onClick={resetDemo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            title="Restaurar todos los datos de prueba en localStorage"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Reiniciar Demo</span>
          </button>
        </div>
      </div>
    </header>
  );
};

