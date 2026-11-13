import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingBag,
  Trophy,
  Utensils,
  X,
} from 'lucide-react';
import { hasScreenAccess, ROLE_OPTIONS, SIDEBAR_MODULES } from '../../config/rbac';
import { useClub } from '../../context/ClubContext';
import { ModuleId } from '../../types/srs';

const MODULE_ICONS: Record<ModuleId, React.ComponentType<{ className?: string }>> = {
  general: LayoutDashboard,
  cuotas: CreditCard,
  ventas: ShoppingBag,
  deportivo: Trophy,
  tercer_tiempo: Utensils,
  club: Building2,
  admin: Settings,
};

export const Sidebar: React.FC = () => {
  const {
    activeRole,
    activeUser,
    activeScreen,
    sidebarPinned,
    mobileMenuOpen,
    setActiveScreen,
    setSidebarPinned,
    setMobileMenuOpen,
  } = useClub();

  const [openModules, setOpenModules] = useState<Record<ModuleId, boolean>>({
    general: true,
    cuotas: true,
    ventas: true,
    deportivo: true,
    tercer_tiempo: true,
    club: false,
    admin: false,
  });

  // Si el rol es Público / Comercio QR, oculta la Sidebar por completo
  if (activeRole === 'PUBLICO_COMERCIO') {
    return null;
  }

  const visibleModules = SIDEBAR_MODULES.map((mod) => ({
    ...mod,
    screens: mod.screens.filter((s) => hasScreenAccess(activeRole, s.id)),
  })).filter((mod) => mod.screens.length > 0);

  const toggleAccordion = (modId: ModuleId) => {
    if (!sidebarPinned) {
      setSidebarPinned(true);
      setOpenModules((prev) => ({ ...prev, [modId]: true }));
      return;
    }
    setOpenModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const roleMeta = ROLE_OPTIONS.find((r) => r.id === activeRole);

  const renderContent = (isMobileDrawer: boolean) => {
    const expanded = isMobileDrawer || sidebarPinned;
    return (
      <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
        {/* Encabezado Sidebar */}
        <div className="px-3 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
          {expanded ? (
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {activeUser.nombre} {activeUser.apellido}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {roleMeta?.label} · DNI <span className="font-mono">{activeUser.dni}</span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-md bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">
              {activeUser.nombre[0]}
              {activeUser.apellido[0]}
            </div>
          )}

          {isMobileDrawer ? (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
              aria-label="Cerrar menú"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setSidebarPinned(!sidebarPinned)}
              className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 shrink-0"
              title={sidebarPinned ? 'Colapsar barra lateral' : 'Fijar barra lateral'}
              aria-label={sidebarPinned ? 'Colapsar barra lateral' : 'Fijar barra lateral'}
            >
              {sidebarPinned ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Acordeón filtrado por RBAC */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Navegación principal">
          {visibleModules.map((mod) => {
            const Icon = MODULE_ICONS[mod.id];
            const isOpen = openModules[mod.id];
            const hasActiveChild = mod.screens.some((s) => s.id === activeScreen);

            // Módulo con 1 sola pantalla (General o Admin) va directo
            if (mod.screens.length === 1) {
              const single = mod.screens[0];
              const isSelected = activeScreen === single.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveScreen(single.id)}
                  title={expanded ? undefined : single.label}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {expanded && <span className="truncate">{single.label}</span>}
                </button>
              );
            }

            return (
              <div key={mod.id} className="space-y-0.5">
                <button
                  onClick={() => toggleAccordion(mod.id)}
                  title={expanded ? undefined : mod.label}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    hasActiveChild
                      ? 'text-slate-900 bg-slate-100'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    {expanded && <span className="truncate">{mod.label}</span>}
                  </div>
                  {expanded &&
                    (isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ))}
                </button>

                {expanded && isOpen && (
                  <div className="pl-6 pr-1 py-0.5 space-y-0.5">
                    {mod.screens.map((screen) => {
                      const isSelected = activeScreen === screen.id;
                      return (
                        <button
                          key={screen.id}
                          onClick={() => setActiveScreen(screen.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors truncate ${
                            isSelected
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {screen.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {expanded && (
          <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500">
            <div>Temporada activa: {stateTemporadaLabel(activeRole)}</div>
            <div className="mt-0.5 text-slate-400">
              {visibleModules.reduce((acc, m) => acc + m.screens.length, 0)} pantallas habilitadas
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          sidebarPinned ? 'w-64' : 'w-16'
        }`}
      >
        <div className="sticky top-[53px] h-[calc(100vh-53px)]">{renderContent(false)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-50 w-72 max-w-[85vw] h-full">{renderContent(true)}</aside>
        </div>
      )}
    </>
  );
};

function stateTemporadaLabel(role: string): string {
  return role === 'ADMIN' || role === 'COORDINADOR'
    ? 'Control BD.UAR + RBAC'
    : 'Vista filtrada RBAC';
}
