import React from 'react';
import { CheckCircle2, Navigation, Wrench, Sunrise } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const KpiBar = () => {
  const { kpis, filterStatus, setFilterStatus } = useFleet();

  return (
    <section className="kpi-grid">
      {/* 1. Disponibles en Patio */}
      <div 
        className={`kpi-card disponible ${filterStatus === 'DISPONIBLE_PATIO' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus(filterStatus === 'DISPONIBLE_PATIO' ? 'ALL' : 'DISPONIBLE_PATIO')}
        style={{ cursor: 'pointer' }}
        title="Unidades disponibles actualmente en patio listas para asignar (Clic para filtrar)"
      >
        <div className="kpi-info">
          <h3>Disponibles Patio</h3>
          <div className="kpi-value">{kpis.disponiblesPatio}</div>
        </div>
        <div className="kpi-icon-wrapper">
          <CheckCircle2 size={28} />
        </div>
      </div>

      {/* 2. En Ruta */}
      <div 
        className={`kpi-card transito ${filterStatus === 'EN_TRANSITO' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus(filterStatus === 'EN_TRANSITO' ? 'ALL' : 'EN_TRANSITO')}
        style={{ cursor: 'pointer' }}
        title="Unidades actualmente en tránsito hacia su destino (Clic para filtrar)"
      >
        <div className="kpi-info">
          <h3>En Ruta</h3>
          <div className="kpi-value">{kpis.enTransito}</div>
        </div>
        <div className="kpi-icon-wrapper">
          <Navigation size={28} />
        </div>
      </div>

      {/* 3. En Taller */}
      <div 
        className={`kpi-card taller ${filterStatus === 'EN_TALLER' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus(filterStatus === 'EN_TALLER' ? 'ALL' : 'EN_TALLER')}
        style={{ cursor: 'pointer' }}
        title="Unidades en taller mecánico fuera de servicio (Clic para filtrar)"
      >
        <div className="kpi-info">
          <h3>En Taller</h3>
          <div className="kpi-value">{kpis.enTaller}</div>
        </div>
        <div className="kpi-icon-wrapper">
          <Wrench size={28} />
        </div>
      </div>

      {/* 4. Disponibles para Mañana (Criterio BAZ: Salida, destino local/foráneo y retorno) */}
      <div 
        className={`kpi-card manana ${filterStatus === 'DISP_MANANA' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus(filterStatus === 'DISP_MANANA' ? 'ALL' : 'DISP_MANANA')}
        style={{ 
          cursor: 'pointer',
          background: filterStatus === 'DISP_MANANA' ? 'rgba(16, 185, 129, 0.22)' : undefined,
          borderColor: filterStatus === 'DISP_MANANA' ? '#10b981' : undefined
        }}
        title="Estimación de unidades disponibles para mañana (En patio, locales que regresan hoy y foráneos que retornan antes de 22:00 hrs) — Clic para filtrar"
      >
        <div className="kpi-info">
          <h3>Disponibles Mañana</h3>
          <div className="kpi-value" style={{ color: '#34d399' }}>{kpis.disponiblesManana}</div>
        </div>
        <div className="kpi-icon-wrapper" style={{ color: '#34d399' }}>
          <Sunrise size={28} />
        </div>
      </div>
    </section>
  );
};
