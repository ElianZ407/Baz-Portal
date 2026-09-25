import React from 'react';
import { CheckCircle2, Navigation, Wrench, Warehouse, Sunrise } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const KpiBar = () => {
  const { kpis, filterStatus, setFilterStatus } = useFleet();

  return (
    <section className="kpi-grid">
      {/* 1. Disponibles en Patio */}
      <div 
        className={`kpi-card disponible ${filterStatus === 'ALL' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus('ALL')}
        style={{ cursor: 'pointer' }}
        title="Unidades disponibles actualmente en patio listas para asignar"
      >
        <div className="kpi-info">
          <h3>Disponibles</h3>
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
        title="Unidades actualmente en tránsito hacia su destino"
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
        title="Unidades en taller mecánico fuera de servicio"
      >
        <div className="kpi-info">
          <h3>En Taller</h3>
          <div className="kpi-value">{kpis.enTaller}</div>
        </div>
        <div className="kpi-icon-wrapper">
          <Wrench size={28} />
        </div>
      </div>

      {/* 4. En Sucursal */}
      <div 
        className={`kpi-card rampa ${filterStatus === 'EN_SUCURSAL' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus(filterStatus === 'EN_SUCURSAL' ? 'ALL' : 'EN_SUCURSAL')}
        style={{ cursor: 'pointer' }}
        title="Unidades que están en sucursal descargando o esperando descarga"
      >
        <div className="kpi-info">
          <h3>En Sucursal</h3>
          <div className="kpi-value">{kpis.enSucursalRampa}</div>
        </div>
        <div className="kpi-icon-wrapper">
          <Warehouse size={28} />
        </div>
      </div>

      {/* 5. Disponibles para Mañana */}
      <div 
        className={`kpi-card manana ${filterStatus === 'DISP_MANANA' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus(filterStatus === 'DISP_MANANA' ? 'ALL' : 'DISP_MANANA')}
        style={{ cursor: 'pointer' }}
        title="Estimación de unidades disponibles para mañana, considerando hora de salida, destino (local/foráneo) y retorno"
      >
        <div className="kpi-info">
          <h3>Disponibles Mañana</h3>
          <div className="kpi-value">{kpis.disponiblesManana}</div>
        </div>
        <div className="kpi-icon-wrapper">
          <Sunrise size={28} />
        </div>
      </div>
    </section>
  );
};
