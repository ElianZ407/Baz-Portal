import React from 'react';
import { CheckCircle2, Navigation, Wrench, Sunrise, RotateCcw, AlertTriangle, HelpCircle } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const KpiBar = ({ filterFL = 'ALL', setFilterFL }) => {
  const { kpis, filterStatus, setFilterStatus } = useFleet();

  const handleSelectStatus = (status) => {
    const nextStatus = filterStatus === status ? 'ALL' : status;
    setFilterStatus(nextStatus);
    if (setFilterFL) setFilterFL('ALL');
  };

  const isMananaActive = ['DISP_MANANA', 'REGRESAN_MANANA', 'NO_REGRESAN_MANANA', 'POR_CONFIRMAR', 'SIN_UNIDAD'].includes(filterStatus);

  const regresanLabel = filterFL === 'FORANEO' 
    ? 'Regresan de Viaje Foráneo' 
    : filterFL === 'LOCAL' 
    ? 'Regresan de Viaje Local' 
    : 'Regresan de Viaje';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
      <section className="kpi-grid" style={{ marginBottom: 0 }}>
        {/* 1. Disponibles en Patio */}
        <div 
          className={`kpi-card disponible ${filterStatus === 'DISPONIBLE_PATIO' ? 'active-filter' : ''}`}
          onClick={() => handleSelectStatus('DISPONIBLE_PATIO')}
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
          onClick={() => handleSelectStatus('EN_TRANSITO')}
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
          onClick={() => handleSelectStatus('EN_TALLER')}
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
          className={`kpi-card manana ${isMananaActive ? 'active-filter' : ''}`}
          onClick={() => handleSelectStatus('DISP_MANANA')}
          style={{ 
            cursor: 'pointer',
            background: isMananaActive ? 'rgba(16, 185, 129, 0.18)' : undefined,
            borderColor: isMananaActive ? '#10b981' : undefined
          }}
          title="Libres en patio + unidades que regresan de viaje. Clic para ver opciones de filtro."
        >
          <div className="kpi-info">
            <h3>Disponibles Mañana</h3>
            <div className="kpi-value" style={{ color: '#34d399' }}>{kpis.disponiblesManana}</div>
            <span style={{ display: 'block', marginTop: '0.3rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
              {kpis.libresManana} libres · {kpis.regresanManana} regresan mañana
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ color: '#34d399' }}>
            <Sunrise size={28} />
          </div>
        </div>
      </section>

      {/* Barra de Sub-filtros amplia y clara para Disponibles Mañana */}
      {isMananaActive && (
        <div style={{
          background: 'linear-gradient(135deg, #0d1a30 0%, #091324 100%)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '12px',
          padding: '0.85rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: 800, fontSize: '0.88rem' }}>
              <Sunrise size={18} />
              <span>Filtrar Disponibilidad Mañana:</span>
            </div>

            <button
              type="button"
              className="btn"
              onClick={() => handleSelectStatus('DISP_MANANA')}
              style={{
                fontSize: '0.84rem',
                padding: '0.45rem 1rem',
                fontWeight: 700,
                background: filterStatus === 'DISP_MANANA' ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(16, 185, 129, 0.12)',
                color: filterStatus === 'DISP_MANANA' ? '#fff' : '#34d399',
                border: '1px solid ' + (filterStatus === 'DISP_MANANA' ? '#10b981' : 'rgba(16, 185, 129, 0.35)'),
                boxShadow: filterStatus === 'DISP_MANANA' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              <span>Todas Disponibles ({kpis.disponiblesManana})</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => handleSelectStatus('REGRESAN_MANANA')}
              style={{
                fontSize: '0.84rem',
                padding: '0.45rem 1rem',
                fontWeight: 700,
                background: filterStatus === 'REGRESAN_MANANA' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'rgba(56, 189, 248, 0.12)',
                color: filterStatus === 'REGRESAN_MANANA' ? '#fff' : '#38bdf8',
                border: '1px solid ' + (filterStatus === 'REGRESAN_MANANA' ? '#38bdf8' : 'rgba(56, 189, 248, 0.35)'),
                boxShadow: filterStatus === 'REGRESAN_MANANA' ? '0 4px 12px rgba(56, 189, 248, 0.3)' : 'none'
              }}
              title="Ver unidades que están en viaje y regresan mañana a CEDIS"
            >
              <RotateCcw size={14} />
              <span>{regresanLabel} ({kpis.regresanManana})</span>
            </button>

            {kpis.noRegresanManana > 0 && (
              <button
                type="button"
                className="btn"
                onClick={() => handleSelectStatus('NO_REGRESAN_MANANA')}
                style={{
                  fontSize: '0.84rem',
                  padding: '0.45rem 1rem',
                  fontWeight: 700,
                  background: filterStatus === 'NO_REGRESAN_MANANA' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(245, 158, 11, 0.12)',
                  color: filterStatus === 'NO_REGRESAN_MANANA' ? '#fff' : '#fbbf24',
                  border: '1px solid ' + (filterStatus === 'NO_REGRESAN_MANANA' ? '#f59e0b' : 'rgba(245, 158, 11, 0.35)'),
                  boxShadow: filterStatus === 'NO_REGRESAN_MANANA' ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                }}
                title="Ver unidades en viajes largos que tardan más de 1 día y no regresan mañana"
              >
                <span>⏳ No Regresan ({kpis.noRegresanManana})</span>
              </button>
            )}

            <button
              type="button"
              className="btn"
              onClick={() => handleSelectStatus('POR_CONFIRMAR')}
              style={{
                fontSize: '0.84rem',
                padding: '0.45rem 1rem',
                fontWeight: 700,
                background: filterStatus === 'POR_CONFIRMAR' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(251, 191, 36, 0.12)',
                color: filterStatus === 'POR_CONFIRMAR' ? '#fff' : '#fbbf24',
                border: '1px solid ' + (filterStatus === 'POR_CONFIRMAR' ? '#fbbf24' : 'rgba(251, 191, 36, 0.35)'),
                boxShadow: filterStatus === 'POR_CONFIRMAR' ? '0 4px 12px rgba(251, 191, 36, 0.3)' : 'none'
              }}
            >
              <AlertTriangle size={14} />
              <span>Por Confirmar ({kpis.porConfirmarManana})</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => handleSelectStatus('SIN_UNIDAD')}
              style={{
                fontSize: '0.84rem',
                padding: '0.45rem 1rem',
                fontWeight: 600,
                background: filterStatus === 'SIN_UNIDAD' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.08)',
                color: filterStatus === 'SIN_UNIDAD' ? '#fff' : '#cbd5e1',
                border: '1px solid ' + (filterStatus === 'SIN_UNIDAD' ? '#cbd5e1' : 'rgba(148, 163, 184, 0.25)')
              }}
            >
              <HelpCircle size={14} />
              <span>Sin Unidad Asignada ({kpis.viajesSinUnidadAsignada})</span>
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleSelectStatus('ALL')}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            ✕ Ver Todos los Viajes
          </button>
        </div>
      )}
    </div>
  );
};
