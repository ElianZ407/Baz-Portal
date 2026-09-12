import React from 'react';
import { 
  Calendar, 
  ChevronDown, 
  Maximize, 
  Plus
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const Header = () => {
  const { 
    activeArea, 
    setActiveArea, 
    setIsModalOpen, 
    setSelectedUnit, 
    currentTime
  } = useFleet();

  const handleOpenNewUnit = () => {
    setSelectedUnit(null);
    setIsModalOpen(true);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error al activar pantalla completa", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const timeString = currentTime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  return (
    <header className="top-header">
      <div className="header-left-cluster">
        {/* Logo BAZ Entregas */}
        <div className="brand-section">
          <div className="brand-badge-box">
            B
          </div>
          <div className="brand-labels">
            <span className="brand-name">BAZ</span>
            <span className="brand-sub">Entregas</span>
          </div>
        </div>

        <div className="header-divider"></div>

        {/* Dropdown Operación / Fecha */}
        <button className="operation-dropdown" title="Cambiar fecha de operación">
          <Calendar size={18} className="operation-calendar-icon" />
          <div className="operation-info-text">
            <span className="operation-label">Operación</span>
            <span className="operation-date">Miércoles, 11 Sep 2026</span>
          </div>
          <ChevronDown size={14} className="operation-arrow" />
        </button>
      </div>

      {/* Tabs centrales de Navegación con subtítulos */}
      <nav className="nav-areas">
        <button 
          className={`nav-tab-item ${activeArea === 'patio' ? 'active' : ''}`}
          onClick={() => setActiveArea('patio')}
        >
          <span className="nav-tab-title">Patio</span>
          <span className="nav-tab-subtitle">En CD</span>
        </button>

        <button 
          className={`nav-tab-item ${activeArea === 'planeacion' ? 'active' : ''}`}
          onClick={() => setActiveArea('planeacion')}
        >
          <span className="nav-tab-title">Planeación</span>
          <span className="nav-tab-subtitle">Embarques</span>
        </button>

        <button 
          className={`nav-tab-item ${activeArea === 'supervisor' ? 'active' : ''}`}
          onClick={() => setActiveArea('supervisor')}
        >
          <span className="nav-tab-title">Supervisor</span>
          <span className="nav-tab-subtitle">En ruta</span>
        </button>

        <button 
          className={`nav-tab-item ${activeArea === 'tv' ? 'active' : ''}`}
          onClick={() => setActiveArea('tv')}
        >
          <span className="nav-tab-title">Tablero TV</span>
          <span className="nav-tab-subtitle">En vivo</span>
        </button>
      </nav>

      {/* Acciones del lado derecho */}
      <div className="header-right-cluster">
        {/* Reloj con indicador verde */}
        <div className="live-clock-badge">
          <span className="clock-live-dot"></span>
          <span>{timeString} CDMX</span>
        </div>

        {/* Pantalla completa */}
        <button 
          className="btn-fullscreen" 
          onClick={toggleFullScreen}
          title="Modo pantalla completa"
        >
          <Maximize size={16} />
        </button>

        {/* Botón + Nueva unidad */}
        <button 
          className="btn-new-unit-cyan"
          onClick={handleOpenNewUnit}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Nueva unidad</span>
        </button>
      </div>
    </header>
  );
};
