import React from 'react';
import { Truck, Navigation, Warehouse, AlertTriangle } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const KpiBar = () => {
  const { kpis, filterStatus, setFilterStatus } = useFleet();

  return (
    <section className="kpi-grid">
      {/* 1. Total Unidades */}
      <div 
        className={`kpi-card total ${filterStatus === 'ALL' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus('ALL')}
        style={{ cursor: 'pointer' }}
        title="Ver todas las unidades registradas"
      >
        <div className="kpi-info">
          <h3>Unidades Registradas</h3>
          <div className="kpi-value">{kpis.total}</div>
        </div>
        <div className="kpi-icon-wrapper">
          <Truck size={28} />
        </div>
      </div>

      {/* 2. En Tránsito */}
      <div 
        className={`kpi-card transito ${filterStatus === 'EN_TRANSITO' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus(filterStatus === 'EN_TRANSITO' ? 'ALL' : 'EN_TRANSITO')}
        style={{ cursor: 'pointer' }}
        title="Filtrar unidades actualmente en tránsito"
      >
        <div className="kpi-info">
          <h3>En Tránsito</h3>
          <div className="kpi-value">{kpis.enTransito}</div>
        </div>
        <div className="kpi-icon-wrapper">
          <Navigation size={28} />
        </div>
      </div>

      {/* 3. En Sucursal / Rampa */}
      <div 
        className={`kpi-card rampa ${filterStatus === 'EN_SUCURSAL' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus(filterStatus === 'EN_SUCURSAL' ? 'ALL' : 'EN_SUCURSAL')}
        style={{ cursor: 'pointer' }}
        title="Filtrar unidades en cortinas, andenes o espera de descarga"
      >
        <div className="kpi-info">
          <h3>En Sucursal / Rampa</h3>
          <div className="kpi-value">{kpis.enSucursalRampa}</div>
        </div>
        <div className="kpi-icon-wrapper">
          <Warehouse size={28} />
        </div>
      </div>

      {/* 4. Retrasadas / Alerta */}
      <div 
        className={`kpi-card alerta ${filterStatus === 'RETRASADAS' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus(filterStatus === 'RETRASADAS' ? 'ALL' : 'RETRASADAS')}
        style={{ cursor: 'pointer' }}
        title="Filtrar unidades que presentan retraso o alerta crítica"
      >
        <div className="kpi-info">
          <h3>Retrasadas / Alerta</h3>
          <div className="kpi-value">{kpis.retrasadas}</div>
        </div>
        <div className="kpi-icon-wrapper">
          <AlertTriangle size={28} />
        </div>
      </div>
    </section>
  );
};
