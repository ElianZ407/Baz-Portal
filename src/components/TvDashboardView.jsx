import React, { useState } from 'react';
import { 
  Tv, 
  MapPin, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { KpiBar } from './KpiBar';

export const TvDashboardView = () => {
  const { 
    units, 
    filterStatus, 
    setFilterStatus, 
    searchQuery, 
    setSearchQuery,
    currentTime
  } = useFleet();

  // Filtrar según el estado seleccionado o búsqueda
  const filteredUnits = units.filter(unit => {
    const matchesSearch = 
      (unit.economico && unit.economico.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.operador && unit.operador.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.destino && unit.destino.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.numCarga && unit.numCarga.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.cortina && unit.cortina.toLowerCase().includes(searchQuery.toLowerCase()));

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
      case 'EN SUCURSAL':
      case 'En Cortina':
        return 'status-espera-descarga';
      case 'Descargando':
      case 'Cargado':
        return 'status-descargando';
      case 'Retorno':
        return 'status-retorno';
      case 'Retrasado':
      case 'RETRASADO':
        return 'status-retrasado';
      case 'Completado':
      case 'COMPLETADO':
        return 'status-completado';
      default:
        return 'status-disponible';
    }
  };

  return (
    <div className="tv-container">
      {/* Banner Principal de Pizarra TV */}
      <div className="tv-header-banner">
        <div className="tv-title-area">
          <h1>MONITOREO DE UNIDADES EN TIEMPO REAL</h1>
          <p>Pizarra de Control para Proyección en Pantalla / TV — BAZ Entregas</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fecha Operativa
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              <span>10/09/2026</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Transmisión
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', color: '#34d399', fontWeight: 600 }}>
              <span className="clock-dot"></span>
              <span>EN VIVO</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPIs Superiores de Telemetría */}
      <KpiBar />

      {/* Tabla Pizarra para TV Panorámica */}
      <div className="table-card">
        <div className="table-header-title" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2>
              <Tv size={20} color="var(--accent-cyan)" />
              Flota y Embarques del Día ({filteredUnits.length} Unidades)
            </h2>
            {filterStatus !== 'ALL' && (
              <button 
                className="pill-btn"
                style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                onClick={() => setFilterStatus('ALL')}
              >
                Limpiar Filtro de KPI (X)
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="search-input-group" style={{ maxWidth: '320px' }}>
              <Search size={15} className="search-icon" />
              <input 
                type="text"
                className="search-input"
                placeholder="Buscar en pantalla TV..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table tv-data-table">
            <thead>
              <tr style={{ background: '#0b253a' }}>
                <th style={{ textAlign: 'center', width: '60px' }}>VIAJE</th>
                <th>ECO UNIDAD</th>
                <th style={{ textAlign: 'center' }}>BLOQUE</th>
                <th style={{ textAlign: 'center' }}>CORTINA</th>
                <th>OPERADOR</th>
                <th>LÍNEA</th>
                <th># CARGA</th>
                <th>DESTINO / SUCURSALES</th>
                <th>SALIDA</th>
                <th>ETA</th>
                <th style={{ textAlign: 'center' }}>ESTATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No hay unidades con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredUnits.map(unit => {
                  const isLate = unit.estatusSupervisor === 'Retrasado';
                  return (
                    <tr 
                      key={unit.id}
                      style={{
                        background: isLate ? 'rgba(239, 68, 68, 0.14)' : 'transparent',
                        borderLeft: isLate ? '5px solid #ef4444' : 'none'
                      }}
                    >
                      {/* VIAJE */}
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem' }}>
                        {unit.noViaje ? (
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                            {unit.noViaje}
                          </span>
                        ) : '—'}
                      </td>

                      {/* ECO UNIDAD */}
                      <td>
                        <span className="eco-pill">{unit.economico}</span>
                      </td>

                      {/* BLOQUE */}
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {unit.bloque ? `B-${unit.bloque}` : '—'}
                      </td>

                      {/* CORTINA */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontWeight: 700, 
                          color: 'var(--accent-cyan)',
                          background: 'rgba(6, 182, 212, 0.15)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {unit.cortina || '—'}
                        </span>
                      </td>

                      {/* OPERADOR */}
                      <td>
                        <div className="operator-cell">
                          <span className="operator-name" style={{ fontSize: '1rem' }}>
                            {unit.operador || 'POR ASIGNAR'}
                          </span>
                          <span className="operator-shift">
                            {unit.placas ? `Placas: ${unit.placas}` : ''} {unit.capUnidad ? `• Cap: ${unit.capUnidad}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* LINEA */}
                      <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {unit.linea || 'LTI - VHS'}
                      </td>

                      {/* # CARGA */}
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#e2e8f0' }}>
                          {unit.numCarga || '—'}
                        </span>
                      </td>

                      {/* DESTINO / SUCURSAL */}
                      <td>
                        <div className="route-cell" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                          <MapPin size={15} color="var(--accent-cyan)" />
                          <span>{unit.destino || 'Sin definir'}</span>
                        </div>
                      </td>

                      {/* SALIDA */}
                      <td className="eta-cell" style={{ fontSize: '1rem' }}>
                        {unit.horaSalida}
                      </td>

                      {/* ETA */}
                      <td>
                        <span 
                          className="eta-cell" 
                          style={{ 
                            fontSize: '1.05rem', 
                            color: isLate ? '#f87171' : '#38bdf8' 
                          }}
                        >
                          {unit.eta}
                        </span>
                      </td>

                      {/* ESTATUS */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${getStatusBadgeClass(unit.estatusSupervisor)}`}>
                          {unit.estatusSupervisor === 'En Ruta' ? 'EN RUTA (TRÁNSITO)' :
                           unit.estatusSupervisor === 'Espera Descarga' ? 'EN SUCURSAL (ESPERA)' :
                           unit.estatusSupervisor === 'Descargando' ? 'DESCARGANDO' :
                           unit.estatusSupervisor === 'Retorno' ? 'EN RETORNO' :
                           unit.estatusSupervisor === 'Retrasado' ? 'RETRASADO / ALERTA' :
                           unit.estatusSupervisor === 'Completado' ? 'COMPLETADO' :
                           unit.estatusPlaneacion === 'En Cortina' ? 'EN CORTINA' :
                           unit.estatusPatio.toUpperCase()}
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
