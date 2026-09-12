import React from 'react';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Header } from './components/Header';
import { PatioView } from './components/PatioView';
import { PlaneacionView } from './components/PlaneacionView';
import { SupervisorView } from './components/SupervisorView';
import { TvDashboardView } from './components/TvDashboardView';
import { UnitModal } from './components/UnitModal';
import { ConfirmModal } from './components/ConfirmModal';

const AppContent = () => {
  const { activeArea } = useFleet();

  return (
    <div className={`app-container ${activeArea === 'tv' ? 'tv-mode' : ''}`}>
      <Header />
      
      <main className="main-content">
        {activeArea === 'patio' && <PatioView />}
        {activeArea === 'planeacion' && <PlaneacionView />}
        {activeArea === 'supervisor' && <SupervisorView />}
        {activeArea === 'tv' && <TvDashboardView />}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '1.25rem 2rem',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        background: 'rgba(10, 15, 28, 0.9)'
      }}>
        <span>BAZ Entregas — Sistema Integrado de Control de Flota y Patio</span>
        <span style={{ margin: '0 0.5rem' }}>•</span>
        <span>Áreas: Patio (En CD) | Planeación | Supervisor (Fuera de CD) | Tablero TV</span>
      </footer>

      <UnitModal />
      <ConfirmModal />
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
