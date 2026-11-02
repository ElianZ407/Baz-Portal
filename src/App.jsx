import React, { Suspense, lazy } from 'react';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Header } from './components/Header';
import { HistoricalBanner } from './components/HistoricalBanner';
import { RoutesBackground } from './components/RoutesBackground';
import { NipGate } from './components/NipGate';

const PatioView = lazy(() => import('./components/PatioView').then(m => ({ default: m.PatioView })));
const PlaneacionView = lazy(() => import('./components/PlaneacionView').then(m => ({ default: m.PlaneacionView })));
const SupervisorView = lazy(() => import('./components/SupervisorView').then(m => ({ default: m.SupervisorView })));
const TvDashboardView = lazy(() => import('./components/TvDashboardView').then(m => ({ default: m.TvDashboardView })));
const PlanColocacionView = lazy(() => import('./components/PlanColocacionView').then(m => ({ default: m.PlanColocacionView })));

const UnitModal = lazy(() => import('./components/UnitModal').then(m => ({ default: m.UnitModal })));
const ConfirmModal = lazy(() => import('./components/ConfirmModal').then(m => ({ default: m.ConfirmModal })));
const SavePlanModal = lazy(() => import('./components/SavePlanModal').then(m => ({ default: m.SavePlanModal })));
const PlanHistoryModal = lazy(() => import('./components/PlanHistoryModal').then(m => ({ default: m.PlanHistoryModal })));
const ImportarPlaneacionModal = lazy(() => import('./components/ImportarPlaneacionModal').then(m => ({ default: m.ImportarPlaneacionModal })));

const ModuloCargando = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#94a3b8', gap: '0.75rem', fontSize: '0.9rem' }}>
    <div style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'colocacion-spin 0.8s linear infinite' }} />
    <span>Cargando módulo...</span>
  </div>
);

const AppContent = () => {
  const {
    activeArea,
    theme,
    isModalOpen,
    confirmModal,
    isSavePlanModalOpen,
    isHistoryModalOpen,
    isImportModalOpen
  } = useFleet();

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
        <Suspense fallback={<ModuloCargando />}>
          {activeArea === 'patio' && <PatioView />}
          {activeArea === 'planeacion' && <PlaneacionView />}
          {activeArea === 'supervisor' && <SupervisorView />}
          {activeArea === 'tv' && <TvDashboardView />}
          {activeArea === 'colocacion' && (
            <NipGate>
              <PlanColocacionView />
            </NipGate>
          )}
        </Suspense>
      </main>

      <footer className="app-footer">
        <span className="app-footer-brand">BAZ Entregas — Sistema Integrado de Control de Flota y Patio</span>
        <span className="app-footer-divider">•</span>
        <span className="app-footer-modules">Patio (En CD) | Planeación | Supervisor (Ruta) | Resumen General | Colocación</span>
      </footer>

      {isModalOpen && (
        <Suspense fallback={null}>
          <UnitModal />
        </Suspense>
      )}
      {confirmModal?.isOpen && (
        <Suspense fallback={null}>
          <ConfirmModal />
        </Suspense>
      )}
      {isSavePlanModalOpen && (
        <Suspense fallback={null}>
          <SavePlanModal />
        </Suspense>
      )}
      {isHistoryModalOpen && (
        <Suspense fallback={null}>
          <PlanHistoryModal />
        </Suspense>
      )}
      {isImportModalOpen && (
        <Suspense fallback={null}>
          <ImportarPlaneacionModal />
        </Suspense>
      )}
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
