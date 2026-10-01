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

      {/* 4. Disponibilidad estimada para mañana */}
      <div 
        className={`kpi-card manana ${filterStatus === 'DISP_MANANA' ? 'active-filter' : ''}`}
        onClick={() => setFilterStatus(filterStatus === 'DISP_MANANA' ? 'ALL' : 'DISP_MANANA')}
        style={{ 
          cursor: 'pointer',
          background: filterStatus === 'DISP_MANANA' ? 'rgba(16, 185, 129, 0.22)' : undefined,
          borderColor: filterStatus === 'DISP_MANANA' ? '#10b981' : undefined
        }}
        title="Libres en patio + unidades que regresan de viaje foráneo largo. No incluye camionetas ni viajes locales, que regresan en el mismo día."
      >
        <div className="kpi-info" style={{ width: '100%' }}>
          <h3>Disponibles Mañana</h3>
          <div className="kpi-value" style={{ color: '#34d399' }}>{kpis.disponiblesManana}</div>
          <span style={{ display: 'block', marginTop: '0.2rem', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
            {kpis.libresManana} libres · {kpis.regresanManana} regresan
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.45rem' }}>
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                setFilterStatus(filterStatus === 'REGRESAN_MANANA' ? 'ALL' : 'REGRESAN_MANANA');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.55rem',
                borderRadius: '4px',
                background: filterStatus === 'REGRESAN_MANANA' ? 'rgba(56, 189, 248, 0.28)' : 'rgba(56, 189, 248, 0.12)',
                border: '1px solid ' + (filterStatus === 'REGRESAN_MANANA' ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)'),
                color: '#38bdf8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: filterStatus === 'REGRESAN_MANANA' ? '0 0 8px rgba(56, 189, 248, 0.3)' : 'none'
              }}
              title="Ver unidades en viaje foráneo largo que regresan mañana (Clic para filtrar)"
            >
              <span>{kpis.regresanManana} regresan de viaje foráneo</span>
            </button>

            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                setFilterStatus(filterStatus === 'POR_CONFIRMAR' ? 'ALL' : 'POR_CONFIRMAR');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.55rem',
                borderRadius: '4px',
                background: filterStatus === 'POR_CONFIRMAR' ? 'rgba(251, 191, 36, 0.28)' : 'rgba(251, 191, 36, 0.12)',
                border: '1px solid ' + (filterStatus === 'POR_CONFIRMAR' ? '#fbbf24' : 'rgba(251, 191, 36, 0.3)'),
                color: '#fbbf24',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: filterStatus === 'POR_CONFIRMAR' ? '0 0 8px rgba(251, 191, 36, 0.3)' : 'none'
              }}
              title="Ver unidades que necesitan confirmar hora de salida o duración (Clic para filtrar)"
            >
              <span>{kpis.porConfirmarManana} por confirmar</span>
            </button>

            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                setFilterStatus(filterStatus === 'SIN_UNIDAD' ? 'ALL' : 'SIN_UNIDAD');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.55rem',
                borderRadius: '4px',
                background: filterStatus === 'SIN_UNIDAD' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.08)',
                border: '1px solid ' + (filterStatus === 'SIN_UNIDAD' ? '#94a3b8' : 'rgba(148, 163, 184, 0.2)'),
                color: '#cbd5e1',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxShadow: filterStatus === 'SIN_UNIDAD' ? '0 0 8px rgba(148, 163, 184, 0.3)' : 'none'
              }}
              title="Ver viajes sin económico asignado (Clic para filtrar)"
            >
              <span>{kpis.viajesSinUnidadAsignada} sin unidad asignada</span>
            </button>
          </div>
        </div>
        <div className="kpi-icon-wrapper" style={{ color: '#34d399' }}>
          <Sunrise size={28} />
        </div>
      </div>
    </section>
  );
};
