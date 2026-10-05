import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CalendarClock, 
  Radio, 
  Tv, 
  PlusCircle, 
  Clock, 
  FileSpreadsheet,
  Save,
  History,
  UploadCloud,
  Calendar
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { exportByModule } from '../utils/exportOfficialExcel';
import { ThemeSelector } from './ThemeSelector';

export const Header = () => {
  const { 
    activeArea, 
    setActiveArea, 
    setIsModalOpen, 
    setSelectedUnit, 
    units,
    kpis,
    savedPlans,
    setIsSavePlanModalOpen,
    setIsHistoryModalOpen,
    setIsImportModalOpen,
    formattedPlanDate,
    formattedPlanDateLong,
    historicalPlanView
  } = useFleet();

  const handleExportExcel = () => {
    exportByModule(activeArea, units);
  };

  const getExportButtonLabel = () => {
    switch (activeArea) {
      case 'patio': return 'Excel Patio';
      case 'supervisor': return 'Excel Supervisor';
      case 'tv': return 'Excel Resumen';
      default: return 'Excel Oficial';
    }
  };

  const getExportButtonTitle = () => {
    switch (activeArea) {
      case 'patio': return 'Descargar reporte Excel del control de patio y andenes';
      case 'supervisor': return 'Descargar reporte Excel de supervisión y estatus en ruta';
      case 'tv': return 'Descargar reporte Excel del resumen general de monitoreo';
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
          <span className="tab-full-text">1. Patio (En CD)</span>
          <span className="tab-short-text">Patio</span>
        </button>

        <button 
          className={`nav-tab ${activeArea === 'planeacion' ? 'active' : ''}`}
          onClick={() => setActiveArea('planeacion')}
          title="2. Planeación: Unidades en Cortina, Asignación de Folios y Turnos"
        >
          <CalendarClock size={16} />
          <span className="tab-full-text">2. Planeación</span>
          <span className="tab-short-text">Planeación</span>
        </button>

        <button 
          className={`nav-tab ${activeArea === 'supervisor' ? 'active' : ''}`}
          onClick={() => setActiveArea('supervisor')}
          title="3. Supervisor: En Ruta, Retorno, Espera Descarga, Descargando"
        >
          <Radio size={16} />
          <span className="tab-full-text">3. Supervisor (Ruta)</span>
          <span className="tab-short-text">Supervisor</span>
        </button>

        <button 
          className={`nav-tab tv-tab ${activeArea === 'tv' ? 'active' : ''}`}
          onClick={() => setActiveArea('tv')}
          title="Resumen General de Unidades y Embarques en Tiempo Real"
        >
          <Tv size={16} />
          <span className="tab-full-text">Resumen General</span>
          <span className="tab-short-text">Resumen</span>
          <span className="badge-counter">{kpis.totalFlota}</span>
        </button>
      </nav>

      {/* Acciones y Reloj */}
      <div className="header-actions">
        {formattedPlanDate && (
          <div 
            className="plan-date-indicator"
            title={historicalPlanView ? `Plan Histórico: ${formattedPlanDateLong}` : `Plan activo de embarques: ${formattedPlanDateLong}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              background: historicalPlanView ? 'rgba(245, 158, 11, 0.16)' : 'rgba(6, 182, 212, 0.14)',
              border: '1px solid ' + (historicalPlanView ? 'rgba(245, 158, 11, 0.4)' : 'rgba(6, 182, 212, 0.4)'),
              color: historicalPlanView ? '#fbbf24' : '#22d3ee',
              whiteSpace: 'nowrap',
              boxShadow: historicalPlanView ? '0 2px 8px rgba(245, 158, 11, 0.2)' : '0 2px 8px rgba(6, 182, 212, 0.2)'
            }}
          >
            <Calendar size={14} color={historicalPlanView ? '#fbbf24' : 'var(--accent-cyan)'} />
            <span>
              {historicalPlanView ? 'Historial: ' : 'Plan: '}
              <strong style={{ color: '#fff', marginLeft: '0.2rem' }}>{formattedPlanDate}</strong>
            </span>
          </div>
        )}

        <div className="live-clock" title="Hora de sistema sincronizada">
          <span className="clock-dot"></span>
          <Clock size={14} />
          <span className="clock-full-text">{dateString.toUpperCase()} | {timeString}</span>
          <span className="clock-short-text">{timeString}</span>
        </div>

        <ThemeSelector />

        {activeArea === 'planeacion' && (
          <>
            <button 
              className="btn btn-secondary btn-header-action"
              style={{
                borderColor: 'rgba(56, 189, 248, 0.45)',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8'
              }}
              onClick={() => setIsImportModalOpen(true)}
              title="Subir archivo de planeación Excel o CSV"
            >
              <UploadCloud size={15} color="#38bdf8" />
              <span className="btn-label-text" style={{ fontWeight: 700 }}>Subir Excel</span>
            </button>

            <button 
              className="btn btn-primary btn-header-action"
              onClick={handleOpenNewUnit}
              title="Registrar nuevo viaje en planeación"
            >
              <PlusCircle size={16} />
              <span className="btn-label-text">Nuevo Viaje</span>
            </button>
          </>
        )}

        <button 
          className="btn btn-secondary btn-header-action" 
          style={{ 
            borderColor: 'rgba(6, 182, 212, 0.4)', 
            background: 'rgba(6, 182, 212, 0.12)',
            color: '#22d3ee'
          }}
          onClick={() => setIsSavePlanModalOpen(true)}
          title="Guardar / Archivar el plan del día y opcionalmente comenzar nuevo día"
        >
          <Save size={15} color="#22d3ee" />
          <span className="btn-label-text" style={{ fontWeight: 700 }}>Guardar Día</span>
        </button>

        <button 
          className="btn btn-secondary btn-header-action" 
          style={{ 
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
          <span className="btn-label-text" style={{ fontWeight: 700 }}>Historial</span>
          {savedPlans && savedPlans.length > 0 && (
            <span className="history-badge">
              {savedPlans.length}
            </span>
          )}
        </button>

        {activeArea !== 'planeacion' && (
          <button 
            className="btn btn-secondary btn-header-action" 
            style={{ 
              borderColor: 'rgba(34, 197, 94, 0.45)', 
              background: 'rgba(34, 197, 94, 0.12)',
              color: '#4ade80'
            }}
            onClick={handleExportExcel}
            title={getExportButtonTitle()}
          >
            <FileSpreadsheet size={15} color="#4ade80" />
            <span className="btn-label-text" style={{ fontWeight: 700 }}>{getExportButtonLabel()}</span>
          </button>
        )}
      </div>
    </header>
  );
};
