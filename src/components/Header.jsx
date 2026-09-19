import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Layers, 
  CalendarClock, 
  Radio, 
  Tv, 
  PlusCircle, 
  Maximize, 
  Clock, 
  HelpCircle, 
  FileSpreadsheet,
  Save,
  History
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { exportOfficialExcel, exportByModule } from '../utils/exportOfficialExcel';

export const Header = () => {
  const { 
    activeArea, 
    setActiveArea, 
    setIsModalOpen, 
    setSelectedUnit, 
    units,
    savedPlans,
    setIsSavePlanModalOpen,
    setIsHistoryModalOpen
  } = useFleet();

  const handleExportExcel = () => {
    exportByModule(activeArea, units);
  };

  const getExportButtonLabel = () => {
    switch (activeArea) {
      case 'patio': return 'Excel Patio';
      case 'supervisor': return 'Excel Supervisor';
      case 'tv': return 'Excel Monitoreo';
      default: return 'Excel Oficial';
    }
  };

  const getExportButtonTitle = () => {
    switch (activeArea) {
      case 'patio': return 'Descargar reporte Excel del control de patio y andenes';
      case 'supervisor': return 'Descargar reporte Excel de supervisión y estatus en ruta';
      case 'tv': return 'Descargar reporte Excel del tablero de monitoreo en tiempo real';
      default: return 'Descargar archivo Excel oficial BAZ';
    }
  };

  const [headerTime, setHeaderTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setHeaderTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const timeString = headerTime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = headerTime.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  return (
    <header className="top-header">
      {/* Brand */}
      <div className="brand-section">
        <div className="brand-logo-container">
          <img 
            src="/baz-entregas-logo.png" 
            alt="BAZ Entregas" 
            className="brand-logo-img" 
          />
        </div>
        <div className="brand-text">
          <h1>
            Control de Flota
            <span className="brand-badge">CD Villahermosa</span>
          </h1>
          <p className="brand-subtitle">Patio, Planeación y Monitoreo Satelital en Vivo</p>
        </div>
      </div>

      {/* Navegación por Áreas según el Pizarrón de Operaciones */}
      <nav className="nav-areas">
        <button 
          className={`nav-tab ${activeArea === 'patio' ? 'active' : ''}`}
          onClick={() => setActiveArea('patio')}
          title="1. Patio (En CD: Cargado, Taller, Disponible, Colocado p/ carga)"
        >
          <Layers size={16} />
          <span>1. Patio (En CD)</span>
        </button>

        <button 
          className={`nav-tab ${activeArea === 'planeacion' ? 'active' : ''}`}
          onClick={() => setActiveArea('planeacion')}
          title="2. Planeación: Unidades en Cortina, Asignación de Folios y Turnos"
        >
          <CalendarClock size={16} />
          <span>2. Planeación</span>
        </button>

        <button 
          className={`nav-tab ${activeArea === 'supervisor' ? 'active' : ''}`}
          onClick={() => setActiveArea('supervisor')}
          title="3. Supervisor: En Ruta, Retorno, Espera Descarga, Descargando"
        >
          <Radio size={16} />
          <span>3. Supervisor (Ruta)</span>
        </button>

        <button 
          className={`nav-tab tv-tab ${activeArea === 'tv' ? 'active' : ''}`}
          onClick={() => setActiveArea('tv')}
          title="Pizarra de Control para Proyección en Pantalla / TV"
        >
          <Tv size={16} />
          <span>Tablero TV en Vivo</span>
          <span className="badge-counter">{units.length}</span>
        </button>
      </nav>

      {/* Acciones y Reloj */}
      <div className="header-actions">
        <div className="live-clock" title="Hora de sistema sincronizada">
          <span className="clock-dot"></span>
          <Clock size={14} />
          <span>{dateString.toUpperCase()} | {timeString}</span>
        </div>

        {activeArea === 'planeacion' && (
          <button 
            className="btn btn-primary"
            onClick={handleOpenNewUnit}
            title="Registrar nuevo viaje en planeación"
          >
            <PlusCircle size={16} />
            <span>Nuevo Viaje</span>
          </button>
        )}

        <button 
          className="btn btn-secondary" 
          style={{ 
            padding: '0.45rem 0.85rem', 
            fontSize: '0.82rem', 
            gap: '0.45rem', 
            borderColor: 'rgba(6, 182, 212, 0.4)', 
            background: 'rgba(6, 182, 212, 0.12)',
            color: '#22d3ee'
          }}
          onClick={() => setIsSavePlanModalOpen(true)}
          title="Guardar / Archivar el plan del día y opcionalmente comenzar nuevo día"
        >
          <Save size={15} color="#22d3ee" />
          <span style={{ fontWeight: 700 }}>Guardar Día</span>
        </button>

        <button 
          className="btn btn-secondary" 
          style={{ 
            padding: '0.45rem 0.85rem', 
            fontSize: '0.82rem', 
            gap: '0.45rem', 
            borderColor: 'rgba(168, 85, 247, 0.4)', 
            background: 'rgba(168, 85, 247, 0.12)',
            color: '#c084fc',
            display: 'flex',
            alignItems: 'center'
          }}
          onClick={() => setIsHistoryModalOpen(true)}
          title="Consultar historial de planes guardados, exportar sus Excel o restaurarlos"
        >
          <History size={15} color="#c084fc" />
          <span style={{ fontWeight: 700 }}>Historial</span>
          {savedPlans && savedPlans.length > 0 && (
            <span style={{
              background: '#a855f7',
              color: '#fff',
              borderRadius: '10px',
              padding: '0.05rem 0.4rem',
              fontSize: '0.65rem',
              fontWeight: 800,
              marginLeft: '0.1rem'
            }}>
              {savedPlans.length}
            </span>
          )}
        </button>

        {activeArea !== 'planeacion' && (
          <button 
            className="btn btn-secondary" 
            style={{ 
              padding: '0.45rem 0.85rem', 
              fontSize: '0.82rem', 
              gap: '0.45rem', 
              borderColor: 'rgba(34, 197, 94, 0.45)', 
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#4ade80'
            }}
            onClick={handleExportExcel}
            title={getExportButtonTitle()}
          >
            <FileSpreadsheet size={15} color="#4ade80" />
            <span style={{ fontWeight: 700 }}>{getExportButtonLabel()}</span>
          </button>
        )}

        <button 
          className="btn btn-secondary" 
          style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', gap: '0.4rem', border: '1px solid rgba(6, 182, 212, 0.35)' }}
          onClick={() => {
            const btn = document.querySelector('.floating-help-btn');
            if (btn) btn.click();
          }}
          title="Manual de Usuario y Flujo Operativo"
        >
          <HelpCircle size={15} color="var(--accent-cyan)" />
          <span>Ayuda</span>
        </button>

        <button 
          className="btn btn-secondary btn-icon-only" 
          onClick={toggleFullScreen}
          title="Pantalla Completa (Modo Sala de Monitoreo)"
        >
          <Maximize size={16} />
        </button>
      </div>
    </header>
  );
};
