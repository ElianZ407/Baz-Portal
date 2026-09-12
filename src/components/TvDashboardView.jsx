import React, { useState } from 'react';
import { 
  Tv, 
  MapPin, 
  Search, 
  XCircle 
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { KpiBar } from './KpiBar';

export const TvDashboardView = () => {
  const { 
    units, 
    filterStatus, 
    setFilterStatus, 
    searchQuery, 
    setSearchQuery 
  } = useFleet();

  // Filtrado de unidades según la tarjeta KPI activa o el buscador
  const filteredUnits = units.filter(unit => {
    const matchesSearch = 
      (unit.economico && unit.economico.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.operador && unit.operador.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.destino && unit.destino.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.sucursalOrigen && unit.sucursalOrigen.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'EN_TRANSITO') {
      return unit.estatusSupervisor === 'En Ruta';
    }
    if (filterStatus === 'EN_SUCURSAL') {
      return (
        ['Espera Descarga', 'Descargando'].includes(unit.estatusSupervisor) ||
        unit.estatusPlaneacion === 'En Cortina' ||
        unit.estatusPatio === 'Colocado p/ Carga'
      );
    }
    if (filterStatus === 'RETRASADAS') {
      return unit.estatusSupervisor === 'Retrasado';
    }

    return true;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'En Ruta':
      case 'EN TRÁNSITO':
        return 'status-en-ruta';
      case 'Espera Descarga':
      case 'EN SUCURSAL / RAMPA':
      case 'En Cortina':
        return 'status-espera-descarga';
      case 'Descargando':
      case 'Cargado':
        return 'status-descargando';
      case 'Retorno':
        return 'status-retorno';
      case 'Retrasado':
      case 'RETRASADO / ALERTA':
        return 'status-retrasado';
      case 'Completado':
      case 'COMPLETADO':
        return 'status-completado';
      default:
        return 'status-disponible';
    }
  };

  const getFormattedStatus = (status) => {
    switch (status) {
      case 'En Ruta': return 'EN TRÁNSITO';
      case 'Espera Descarga': return 'EN SUCURSAL / RAMPA';
      case 'Descargando': return 'DESCARGANDO';
      case 'Retorno': return 'RETORNO';
      case 'Retrasado': return 'RETRASADO / ALERTA';
      case 'Completado': return 'COMPLETADO';
      default: return status ? status.toUpperCase() : 'DISPONIBLE';
    }
  };

  return (
    <div className="tv-container">
      {/* Banner Principal de Pizarra TV (Imagen 3 de Excel) */}
      <div className="tv-header-banner">
        <div className="tv-title-area">
          <h1>MONITOREO DE UNIDADES EN TIEMPO REAL</h1>
          <p>Pizarra de Control para Proyección en Pantalla / TV — Baz Entregas</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Transmisión
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'flex-end', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>
              <span className="clock-live-dot"></span>
              <span>EN VIVO</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPIs Superiores (Imagen 3) */}
      <KpiBar />

      {/* Tabla Pizarra para TV (Imagen 3 de Excel) */}
      <div className="table-card">
        <div className="table-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <h2>
              <Tv size={18} color="#06b6d4" />
              <span>Unidades en Seguimiento ({filteredUnits.length} de {units.length})</span>
            </h2>
            {filterStatus !== 'ALL' && (
              <button 
                className="btn-sync-outline"
                style={{ borderColor: '#ef4444', color: '#f87171', padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                onClick={() => setFilterStatus('ALL')}
              >
                <XCircle size={13} />
                <span>Quitar filtro de KPI</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                placeholder="Filtrar en pantalla TV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.75rem 0.45rem 2.2rem',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table tv-data-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Económico</th>
                <th>Operador</th>
                <th style={{ textAlign: 'center', width: '90px' }}>N° Suc.</th>
                <th>Sucursal Origen</th>
                <th>Fecha</th>
                <th>Hora Salida</th>
                <th>Destino</th>
                <th style={{ textAlign: 'center' }}>Tiempo Viaje (hrs)</th>
                <th>Llegada Est. (ETA)</th>
                <th style={{ textAlign: 'center' }}>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    No hay unidades con los filtros seleccionados en este momento.
                  </td>
                </tr>
              ) : (
                filteredUnits.map(unit => {
                  const isLate = unit.estatusSupervisor === 'Retrasado';
                  return (
                    <tr 
                      key={unit.id}
                      style={{
                        backgroundColor: isLate ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                        borderLeft: isLate ? '4px solid #ef4444' : 'none'
                      }}
                    >
                      {/* Económico */}
                      <td>
                        <span className="eco-pill">{unit.economico}</span>
                      </td>

                      {/* Operador */}
                      <td>
                        <div className="operator-cell">
                          <span className="operator-name">{unit.operador || 'POR ASIGNAR'}</span>
                          <span className="operator-shift">{unit.tipo}</span>
                        </div>
                      </td>

                      {/* N° Sucursal */}
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {unit.numSucursal || '10'}
                      </td>

                      {/* Sucursal Origen */}
                      <td>
                        <span style={{ color: 'var(--text-secondary)' }}>{unit.sucursalOrigen || 'CEDIS BAZ'}</span>
                      </td>

                      {/* Fecha */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {unit.fecha || '2026-09-11'}
                      </td>

                      {/* Hora Salida */}
                      <td className="eta-cell">
                        {unit.horaSalida}
                      </td>

                      {/* Destino */}
                      <td>
                        <div className="route-cell">
                          <MapPin size={14} color="#06b6d4" />
                          <span>{unit.destino || 'Sin definir'}</span>
                        </div>
                      </td>

                      {/* Tiempo Viaje (hrs) */}
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {unit.tiempoEstimadoHrs ? `${unit.tiempoEstimadoHrs}` : '—'}
                      </td>

                      {/* Llegada Est. (ETA) */}
                      <td>
                        <span 
                          className="eta-cell" 
                          style={{ 
                            color: isLate ? '#f87171' : '#38bdf8' 
                          }}
                        >
                          {unit.eta}
                        </span>
                      </td>

                      {/* Estatus */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${getStatusBadgeClass(unit.estatusSupervisor)}`}>
                          {getFormattedStatus(unit.estatusSupervisor)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
