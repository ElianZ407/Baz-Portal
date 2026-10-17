import React from 'react';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Header } from './components/Header';
import { PatioView } from './components/PatioView';
import { PlaneacionView } from './components/PlaneacionView';
import { SupervisorView } from './components/SupervisorView';
import { TvDashboardView } from './components/TvDashboardView';
import { UnitModal } from './components/UnitModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SavePlanModal } from './components/SavePlanModal';
import { PlanHistoryModal } from './components/PlanHistoryModal';
import { HistoricalBanner } from './components/HistoricalBanner';
import { ImportarPlaneacionModal } from './components/ImportarPlaneacionModal';
import { RoutesBackground } from './components/RoutesBackground';
import { PlanColocacionView } from './components/PlanColocacionView';

const AppContent = () => {
  const { activeArea, theme } = useFleet();

  React.useEffect(() => {
    const currentTheme = theme || 'corporate';
    document.documentElement.className = `theme-${currentTheme}`;
    document.body.className = `theme-${currentTheme}`;
  }, [theme]);

  return (
    <div className={`app-container theme-${theme || 'corporate'} ${activeArea === 'tv' ? 'tv-mode' : ''}`}>
      <RoutesBackground />
      <Header />
      <HistoricalBanner />
      
      <main className="main-content">
        {activeArea === 'patio' && <PatioView />}
        {activeArea === 'planeacion' && <PlaneacionView />}
        {activeArea === 'supervisor' && <SupervisorView />}
        {activeArea === 'tv' && <TvDashboardView />}
        {activeArea === 'colocacion' && <PlanColocacionView />}
      </main>

      <footer className="app-footer">
        <span className="app-footer-brand">BAZ Entregas — Sistema Integrado de Control de Flota y Patio</span>
        <span className="app-footer-divider">•</span>
        <span className="app-footer-modules">Patio (En CD) | Planeación | Supervisor (Ruta) | Resumen General | Colocación</span>
      </footer>

      <UnitModal />
      <ConfirmModal />
      <SavePlanModal />
      <PlanHistoryModal />
      <ImportarPlaneacionModal />
    </div>
  );
};

export default function App() {
  return (
    <FleetProvider>
      <AppContent />
    </FleetProvider>
  );
}
