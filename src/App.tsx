import React from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopSimulationBar } from './components/layout/TopSimulationBar';
import { AdminScreen } from './components/screens/AdminScreen';
import { ClubInstitucionalScreen } from './components/screens/ClubScreens';
import {
  CuotasAPagarScreen,
  CuotasConfigurarScreen,
  CuotasGenerarScreen,
  CuotasVerPagosScreen,
} from './components/screens/CuotasScreens';
import {
  DeportivoConfigPartidoScreen,
  DeportivoConfigTorneoScreen,
  DeportivoFixtureScreen,
  DeportivoMisPartidosScreen,
  DeportivoTemporadaScreen,
} from './components/screens/DeportivoCoreScreens';
import {
  DeportivoConfigFichajesScreen,
  DeportivoMisFichajesScreen,
} from './components/screens/DeportivoFichajesScreens';
import { HomeScreen } from './components/screens/HomeScreen';
import {
  TercerTiempoConfigurarScreen,
  TercerTiempoMisTTScreen,
} from './components/screens/TercerTiempoScreens';
import {
  VentasConfigurarScreen,
  VentasMisVentasScreen,
  VentasValidarTicketScreen,
  VentasVistaTicketScreen,
} from './components/screens/VentasScreens';
import { MercadoPagoCheckoutModal } from './components/shared/MercadoPagoCheckoutModal';
import { ToastStack } from './components/shared/ToastStack';
import { ClubProvider, useClub } from './context/ClubContext';

const ScreenRouter: React.FC = () => {
  const { activeScreen } = useClub();

  switch (activeScreen) {
    case 'home':
      return <HomeScreen />;
    case 'cuotas_configurar':
      return <CuotasConfigurarScreen />;
    case 'cuotas_generar':
      return <CuotasGenerarScreen />;
    case 'cuotas_pagos':
      return <CuotasVerPagosScreen />;
    case 'cuotas_pagar':
      return <CuotasAPagarScreen />;
    case 'ventas_configurar':
      return <VentasConfigurarScreen />;
    case 'ventas_mis_ventas':
      return <VentasMisVentasScreen />;
    case 'ventas_vista_ticket':
      return <VentasVistaTicketScreen />;
    case 'ventas_validar_ticket':
      return <VentasValidarTicketScreen />;
    case 'dep_temporada':
      return <DeportivoTemporadaScreen />;
    case 'dep_config_partido':
      return <DeportivoConfigPartidoScreen />;
    case 'dep_config_torneo':
      return <DeportivoConfigTorneoScreen />;
    case 'dep_mis_partidos':
      return <DeportivoMisPartidosScreen />;
    case 'dep_fixture':
      return <DeportivoFixtureScreen />;
    case 'dep_config_fichajes':
      return <DeportivoConfigFichajesScreen />;
    case 'dep_mis_fichajes':
      return <DeportivoMisFichajesScreen />;
    case 'tt_configurar':
      return <TercerTiempoConfigurarScreen />;
    case 'tt_mis_tercer_tiempo':
      return <TercerTiempoMisTTScreen />;
    case 'club_institucional':
      return <ClubInstitucionalScreen />;
    case 'club_abm':
      return <ClubInstitucionalScreen forceABM />;
    case 'admin_config':
      return <AdminScreen />;
    default:
      return <HomeScreen />;
  }
};

const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <TopSimulationBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <ScreenRouter />
          </div>
        </main>
      </div>
      <MercadoPagoCheckoutModal />
      <ToastStack />
    </div>
  );
};

export default function App() {
  return (
    <ClubProvider>
      <AppShell />
    </ClubProvider>
  );
}
