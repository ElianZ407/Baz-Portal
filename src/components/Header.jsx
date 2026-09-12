import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Layers, 
  CalendarClock, 
  Radio, 
  Tv, 
  PlusCircle, 
  Maximize, 
  RotateCcw,
  Clock
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const Header = () => {
  const { 
    activeArea, 
    setActiveArea, 
    setIsModalOpen, 
    setSelectedUnit, 
    resetData,
    units
  } = useFleet();

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
        <div className="brand-logo">
          <Truck size={24} />
        </div>
        <div className="brand-text">
          <h1>
            BAZ Entregas
            <span className="brand-badge">Control Operativo</span>
          </h1>
          <p className="brand-subtitle">Gestión de Flota, Patio y Monitoreo en Tiempo Real</p>
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

        <button 
          className="btn btn-primary"
          onClick={handleOpenNewUnit}
          title="Registrar nueva unidad en el sistema"
        >
          <PlusCircle size={16} />
          <span>Nueva Unidad</span>
        </button>

        <button 
          className="btn btn-secondary btn-icon-only" 
          onClick={toggleFullScreen}
          title="Pantalla Completa (Modo Sala de Monitoreo)"
        >
          <Maximize size={16} />
        </button>

        <button 
          className="btn btn-secondary btn-icon-only" 
          onClick={() => {
            if (window.confirm("¿Deseas restablecer las unidades originales del tablero?")) {
              resetData();
            }
          }}
          title="Restablecer datos originales"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </header>
  );
};
