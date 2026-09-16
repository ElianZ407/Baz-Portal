import React, { useState } from 'react';
import { 
  Radio, 
  Navigation, 
  Clock, 
  ArrowDownCircle, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Edit3,
  MessageSquare
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const SupervisorView = () => {
  const { 
    units, 
    updateStatus, 
    setSelectedUnit, 
    setIsModalOpen, 
    searchQuery, 
    setSearchQuery 
  } = useFleet();

  const [filterSubStatus, setFilterSubStatus] = useState('ALL');
  const [filterFL, setFilterFL] = useState('ALL'); // 'ALL' | 'LOCAL' | 'FORANEO'

  // Unidades en seguimiento por el Supervisor (Fuera de CD)
  const supervisorUnits = units.filter(u => {
    // Buscar texto
    const matchesSearch = 
      u.economico.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.operador && u.operador.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.destino && u.destino.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.closter && u.closter.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.sucursalOrigen && u.sucursalOrigen.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filtrar por subestado
    const matchesStatus = 
      filterSubStatus === 'ALL' || 
      u.estatusSupervisor === filterSubStatus;

    // Filtrar por F/L
    const matchesFL = 
      filterFL === 'ALL' || 
      (u.fl || 'LOCAL') === filterFL;

    return matchesSearch && matchesStatus && matchesFL;
  });

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'En Ruta': return 'status-en-ruta';
      case 'Espera Descarga': return 'status-espera-descarga';
      case 'Descargando': return 'status-descargando';
      case 'Retorno': return 'status-retorno';
      case 'Retrasado': return 'status-retrasado';
      case 'Completado': return 'status-completado';
      default: return 'status-disponible';
    }
  };

  const unidadesLocales = units.filter(u => (u.fl || 'LOCAL') === 'LOCAL');
  const unidadesForaneas = units.filter(u => u.fl === 'FORANEO');

  return (
    <div className="supervisor-view">
      {/* Controles de Búsqueda y Filtros de Estados del Supervisor */}
      <div className="controls-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
        <div className="search-input-group" style={{ maxWidth: '340px' }}>
          <input 
            type="text"
            className="search-input"
            placeholder="Buscar por ECO, operador, clóster o destino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Selector Local vs Foráneo */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button 
              className={`pill-btn ${filterFL === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterFL('ALL')}
            >
              Todas
            </button>
            <button 
              className={`pill-btn ${filterFL === 'LOCAL' ? 'active' : ''}`}
              onClick={() => setFilterFL('LOCAL')}
              style={filterFL === 'LOCAL' ? { background: 'rgba(16, 185, 129, 0.25)', borderColor: '#10b981', color: '#34d399' } : {}}
            >
              Locales ({unidadesLocales.length})
            </button>
            <button 
              className={`pill-btn ${filterFL === 'FORANEO' ? 'active' : ''}`}
              onClick={() => setFilterFL('FORANEO')}
              style={filterFL === 'FORANEO' ? { background: 'rgba(168, 85, 247, 0.25)', borderColor: '#a855f7', color: '#c084fc' } : {}}
            >
              Foráneas ({unidadesForaneas.length})
            </button>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }}></div>

          <div className="filter-pills">
            <button 
              className={`pill-btn ${filterSubStatus === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('ALL')}
            >
              Todos ({units.filter(u => u.estatusSupervisor !== 'Pendiente' && u.estatusSupervisor !== 'No Disponible').length})
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'En Ruta' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('En Ruta')}
            >
              <Navigation size={13} style={{ display: 'inline', marginRight: '3px' }} />
              En Ruta
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'Espera Descarga' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('Espera Descarga')}
            >
              <Clock size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Espera Descarga
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'Descargando' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('Descargando')}
            >
              <ArrowDownCircle size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Descargando
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'Retorno' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('Retorno')}
            >
              <RotateCcw size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Retorno
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'Retrasado' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('Retrasado')}
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              <AlertTriangle size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Retrasado / Alerta
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'Completado' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('Completado')}
            >
              <CheckCircle2 size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Completado
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Monitoreo de Supervisor */}
      <div className="table-card">
        <div className="table-header-title">
          <h2>
            <Radio size={20} color="var(--accent-cyan)" />
            Supervisor: Monitoreo en Tránsito y Sucursales (CD Villahermosa)
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Actualice el estatus de la unidad con un solo clic conforme se reciban reportes satelitales o de operadores
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr style={{ background: '#0b253a' }}>
                <th>ECONÓMICO</th>
                <th>OPERADOR</th>
                <th>DESTINO, CLÓSTER & TIPO</th>
                <th>SALIDA</th>
                <th>TIEMPO EST.</th>
                <th>ETA</th>
                <th>ESTATUS ACTUAL</th>
                <th>CAMBIO RÁPIDO DE ESTATUS (SUPERVISOR)</th>
                <th>OBSERVACIONES / BITÁCORA</th>
                <th style={{ textAlign: 'center' }}>ACCIÓN</th>
              </tr>
            </thead>
            <tbody>
              {supervisorUnits.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No se encontraron unidades en monitoreo con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                supervisorUnits.map(unit => (
                  <tr key={unit.id} style={{
                    background: unit.estatusSupervisor === 'Retrasado' ? 'rgba(239, 68, 68, 0.05)' : 'transparent'
                  }}>
                    <td>
                      <span className="eco-pill">ECO {unit.economico}</span>
                    </td>
                    <td>
                      <div className="operator-cell">
                        <span className="operator-name">{unit.operador || 'POR ASIGNAR'}</span>
                        <span className="operator-shift">Turno: {unit.turno || 'M1'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="route-cell">
                        <MapPin size={14} color="var(--accent-cyan)" />
                        <span style={{ fontWeight: 600 }}>
                          {unit.destino ? unit.destino.replace(/\s*\(Retorno\)/gi, '').trim() : 'Sin definir'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem', alignItems: 'center' }}>
                        <span className={unit.fl === 'FORANEO' ? 'badge-fl-foraneo' : 'badge-fl-local'}>
                          {unit.fl === 'FORANEO' ? 'FORÁNEO' : 'LOCAL'}
                        </span>
                        <span className="badge-closter" style={{ fontSize: '0.68rem' }}>
                          {unit.closter || 'HUB-VHSA'}
                        </span>
                      </div>
                    </td>
                    <td className="eta-cell">{unit.horaSalida}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {unit.tiempoEstimadoHrs ? `${unit.tiempoEstimadoHrs} hrs` : '—'}
                    </td>
                    <td>
                      <span className="eta-cell" style={{ 
                        color: unit.estatusSupervisor === 'Retrasado' ? '#f87171' : '#38bdf8' 
                      }}>
                        {unit.eta}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(unit.estatusSupervisor)}`}>
                        {unit.estatusSupervisor}
                      </span>
                    </td>
                    <td>
                      {/* Botones de flujo del Supervisor según pizarra */}
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {unit.estatusSupervisor !== 'En Ruta' && (
                          <button 
                            className="btn-move"
                            onClick={() => updateStatus(unit.id, 'supervisor', 'En Ruta')}
                            title="Poner En Ruta"
                          >
                            Ruta
                          </button>
                        )}
                        {unit.estatusSupervisor !== 'Espera Descarga' && (
                          <button 
                            className="btn-move"
                            onClick={() => updateStatus(unit.id, 'supervisor', 'Espera Descarga')}
                            title="Llegó y espera rampa/descarga"
                          >
                            En Sucursal
                          </button>
                        )}
                        {unit.estatusSupervisor !== 'Descargando' && (
                          <button 
                            className="btn-move"
                            onClick={() => updateStatus(unit.id, 'supervisor', 'Descargando')}
                            title="Proceso de descarga en rampa"
                          >
                            Descargando
                          </button>
                        )}
                        {unit.estatusSupervisor !== 'Retorno' && (
                          <button 
                            className="btn-move"
                            onClick={() => updateStatus(unit.id, 'supervisor', 'Retorno')}
                            title="Retorno a CEDIS"
                          >
                            Retorno
                          </button>
                        )}
                        {unit.estatusSupervisor !== 'Retrasado' && (
                          <button 
                            className="btn-move"
                            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
                            onClick={() => updateStatus(unit.id, 'supervisor', 'Retrasado')}
                            title="Reportar retraso o incidente"
                          >
                            Alerta
                          </button>
                        )}
                        {unit.estatusSupervisor !== 'Completado' && (
                          <button 
                            className="btn-move"
                            style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#6ee7b7' }}
                            onClick={() => updateStatus(unit.id, 'supervisor', 'Completado')}
                            title="Ciclo completado"
                          >
                            Fin
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                        {unit.observaciones || 'Sin incidencias registradas'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn-action-icon"
                        onClick={() => handleEdit(unit)}
                        title="Modificar viaje o registro"
                      >
                        <Edit3 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
