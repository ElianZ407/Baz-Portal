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

  // Unidades en seguimiento por el Supervisor (Fuera de CD)
  const supervisorUnits = units.filter(u => {
    // Buscar texto
    const matchesSearch = 
      u.economico.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.operador && u.operador.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.destino && u.destino.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.sucursalOrigen && u.sucursalOrigen.toLowerCase().includes(searchQuery.toLowerCase()));

    // Filtrar por subestado
    const matchesStatus = 
      filterSubStatus === 'ALL' || 
      u.estatusSupervisor === filterSubStatus;

    return matchesSearch && matchesStatus;
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

  return (
    <div className="supervisor-view">
      {/* Controles de Búsqueda y Filtros de Estados del Supervisor */}
      <div className="controls-bar">
        <div className="search-input-group">
          <input 
            type="text"
            className="search-input"
            placeholder="Buscar por ECO, operador o destino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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

      {/* Tabla de Monitoreo de Supervisor */}
      <div className="table-card">
        <div className="table-header-title">
          <h2>
            <Radio size={20} color="var(--accent-cyan)" />
            2. Supervisor: Monitoreo de Unidades Fuera de CD
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Actualice el estatus de la unidad con un solo clic conforme se reciban reportes
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Económico</th>
                <th>Operador</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Salida</th>
                <th>Tiempo Est.</th>
                <th>ETA</th>
                <th>Estatus Actual</th>
                <th>Cambio Rápido de Estatus (Supervisor)</th>
                <th>Observaciones / Bitácora</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {supervisorUnits.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
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
                      <span style={{ color: 'var(--text-secondary)' }}>{unit.sucursalOrigen}</span>
                    </td>
                    <td>
                      <div className="route-cell">
                        <MapPin size={14} color="var(--accent-cyan)" />
                        <span style={{ fontWeight: 600 }}>{unit.destino || 'Sin definir'}</span>
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
                            Espera
                          </button>
                        )}
                        {unit.estatusSupervisor !== 'Descargando' && (
                          <button 
                            className="btn-move"
                            onClick={() => updateStatus(unit.id, 'supervisor', 'Descargando')}
                            title="En maniobra de descarga"
                          >
                            Descarga
                          </button>
                        )}
                        {unit.estatusSupervisor !== 'Retorno' && (
                          <button 
                            className="btn-move"
                            style={{ borderColor: 'rgba(168, 85, 247, 0.4)', color: '#c084fc' }}
                            onClick={() => updateStatus(unit.id, 'supervisor', 'Retorno')}
                            title="Inicia trayecto de retorno al CD"
                          >
                            Retorno
                          </button>
                        )}
                        {unit.estatusSupervisor !== 'Retrasado' && (
                          <button 
                            className="btn-move"
                            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                            onClick={() => updateStatus(unit.id, 'supervisor', 'Retrasado')}
                            title="Marcar alerta de retraso"
                          >
                            ! Retraso
                          </button>
                        )}
                        {unit.estatusSupervisor !== 'Completado' && (
                          <button 
                            className="btn-move"
                            style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                            onClick={() => updateStatus(unit.id, 'supervisor', 'Completado')}
                            title="Finalizar viaje y liberar a disponible"
                          >
                            ✓ Fin
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ maxWidth: '220px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {unit.observaciones ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                          <MessageSquare size={13} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--text-muted)' }} />
                          <span>{unit.observaciones}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sin notas</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn-action-icon"
                        onClick={() => handleEdit(unit)}
                        title="Editar información completa"
                      >
                        <Edit3 size={14} />
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
