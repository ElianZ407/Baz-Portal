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
  Trash2,
  Calendar
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const SupervisorView = () => {
  const { 
    units, 
    updateStatus, 
    setSelectedUnit, 
    setIsModalOpen, 
    deleteUnit,
    showConfirm,
    showAlert,
    clearAllUnits,
    searchQuery, 
    setSearchQuery,
    formattedPlanDate,
    formattedPlanDateLong,
    isPlanDateToday
  } = useFleet();

  const [filterSubStatus, setFilterSubStatus] = useState('ALL');
  const [filterFL, setFilterFL] = useState('ALL');

  const TRANSIT_STATUSES = ['En Ruta', 'Espera Descarga', 'Descargando', 'Retorno', 'Retrasado', 'Completado'];

  const getEffectiveSupervisorStatus = (unit) => {
    if (!unit) return 'Pendiente';
    if (unit.estatusPlaneacion === 'CARGADO' && (!unit.estatusSupervisor || ['No Disponible', 'Pendiente', 'Cargado', 'Disponible'].includes(unit.estatusSupervisor))) {
      return 'Cargado';
    }
    return unit.estatusSupervisor || 'Pendiente';
  };

  const supervisorBaseUnits = units.filter(u => {
    const isTaller = u.estatusPatio === 'Taller' || u.estatus === 'TALLER';
    if (isTaller) return false;
    const isCargado = u.estatusPlaneacion === 'CARGADO';
    const hasTransitStatus = TRANSIT_STATUSES.includes(u.estatusSupervisor);
    return isCargado || hasTransitStatus;
  });

  const supervisorUnits = supervisorBaseUnits.filter(u => {
    const matchesSearch = 
      u.economico.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.operador && u.operador.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.destino && u.destino.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.closter && u.closter.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.sucursalOrigen && u.sucursalOrigen.toLowerCase().includes(searchQuery.toLowerCase()));

    const effectiveStatus = getEffectiveSupervisorStatus(u);
    const matchesStatus = 
      filterSubStatus === 'ALL' || 
      effectiveStatus === filterSubStatus;

    const matchesFL = 
      filterFL === 'ALL' || 
      (u.fl || 'LOCAL') === filterFL;

    return matchesSearch && matchesStatus && matchesFL;
  });

  const activeTransitUnits = supervisorUnits.filter(u => u.estatusSupervisor !== 'Completado');
  const completedTransitUnits = supervisorUnits.filter(u => u.estatusSupervisor === 'Completado');

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const handleLimpiarTodo = () => {
    showConfirm({
      title: '¿Limpiar todo el tablero y reiniciar día?',
      message: 'Esta acción vaciará todos los viajes de Planeación y Supervisión.\n\nTodas las unidades del catálogo volverán a estar Disponibles en Patio para una nueva jornada.\n\n¿Estás seguro de que deseas reiniciar todo?',
      confirmText: 'Sí, Limpiar Todo',
      cancelText: 'Cancelar',
      confirmType: 'danger',
      onConfirm: async () => {
        await clearAllUnits();
        showAlert({
          title: 'Operación Reiniciada',
          message: 'Se han limpiado todos los viajes. Todas las unidades del catálogo se encuentran Disponibles en Patio.',
          confirmType: 'success'
        });
      }
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'En Ruta': return 'status-en-ruta';
      case 'Espera Descarga': return 'status-espera-descarga';
      case 'Descargando': return 'status-descargando';
      case 'Retorno': return 'status-retorno';
      case 'Retrasado': return 'status-retrasado';
      case 'Completado': return 'status-completado';
      case 'Cargado': return 'status-encaseta';
      default: return 'status-encaseta';
    }
  };

  const cargadosCount = supervisorBaseUnits.filter(u => getEffectiveSupervisorStatus(u) === 'Cargado').length;
  const unidadesLocales = supervisorBaseUnits.filter(u => (u.fl || 'LOCAL') === 'LOCAL');
  const unidadesForaneas = supervisorBaseUnits.filter(u => u.fl === 'FORANEO');
  const enRutaCount = supervisorBaseUnits.filter(u => u.estatusSupervisor === 'En Ruta').length;
  const esperaCount = supervisorBaseUnits.filter(u => u.estatusSupervisor === 'Espera Descarga').length;
  const descargandoCount = supervisorBaseUnits.filter(u => u.estatusSupervisor === 'Descargando').length;
  const retornoCount = supervisorBaseUnits.filter(u => u.estatusSupervisor === 'Retorno').length;
  const retrasadoCount = supervisorBaseUnits.filter(u => u.estatusSupervisor === 'Retrasado').length;
  const completadoCount = supervisorBaseUnits.filter(u => u.estatusSupervisor === 'Completado').length;

  const renderUnitRow = (unit, isCompleted = false) => (
    <tr key={unit.id} style={{
      background: unit.estatusSupervisor === 'Retrasado' 
        ? 'rgba(239, 68, 68, 0.05)' 
        : (isCompleted ? 'rgba(16, 185, 129, 0.03)' : 'transparent')
    }}>
      <td>
        {unit.economico ? (
          <span className="eco-pill" style={isCompleted ? { borderColor: 'rgba(16, 185, 129, 0.35)', color: '#6ee7b7' } : {}}>
            ECO {unit.economico}
          </span>
        ) : (
          <span style={{ 
            fontSize: '0.72rem', 
            color: '#94a3b8', 
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px dashed rgba(148, 163, 184, 0.35)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            POR ASIGNAR
          </span>
        )}
      </td>
      <td>
        <div className="operator-cell">
          <span className="operator-name">{unit.operador || 'POR ASIGNAR'}</span>
          <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
            <span className="operator-shift">Turno: {unit.turno || 'M1'}</span>
            {unit.idOperador && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                • ID: {unit.idOperador}
              </span>
            )}
          </div>
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
          color: unit.estatusSupervisor === 'Retrasado' ? '#f87171' : (isCompleted ? '#6ee7b7' : '#38bdf8') 
        }}>
          {unit.eta || '—'}
        </span>
      </td>
      <td>
        {(() => {
          const effStatus = getEffectiveSupervisorStatus(unit);
          const labelMap = {
            'En Ruta': 'EN RUTA',
            'Espera Descarga': 'EN SUCURSAL',
            'Descargando': 'DESCARGANDO',
            'Retorno': 'RETORNO',
            'Retrasado': 'ALERTA / RETRASADO',
            'Completado': 'COMPLETADO',
            'Cargado': 'CARGADO (CASETA)'
          };
          return (
            <span className={`status-badge ${getStatusBadgeClass(effStatus)}`}>
              {labelMap[effStatus] || effStatus}
            </span>
          );
        })()}
      </td>
      <td>
        {isCompleted ? (
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <button 
              className="btn-move"
              style={{
                borderColor: 'rgba(192, 132, 252, 0.45)',
                color: '#c084fc',
                fontWeight: 700,
                background: 'rgba(192, 132, 252, 0.08)'
              }}
              onClick={() => updateStatus(unit.id, 'supervisor', 'Retorno')}
              title="Reactivar viaje y regresar a estatus Retorno"
            >
              <RotateCcw size={12} style={{ display: 'inline', marginRight: '3px' }} />
              Reactivar (Retorno)
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {unit.estatusSupervisor !== 'En Ruta' && (
              <button 
                className="btn-move"
                style={{
                  borderColor: 'rgba(52, 211, 153, 0.4)',
                  color: '#34d399',
                  fontWeight: 700
                }}
                onClick={() => updateStatus(unit.id, 'supervisor', 'En Ruta')}
                title="Cambiar a En Ruta (Tránsito hacia sucursal o siguiente entrega)"
              >
                Ruta
              </button>
            )}
            {unit.estatusSupervisor !== 'Espera Descarga' && (
              <button 
                className="btn-move"
                style={{
                  borderColor: 'rgba(251, 191, 36, 0.4)',
                  color: '#fbbf24',
                  fontWeight: 700
                }}
                onClick={() => updateStatus(unit.id, 'supervisor', 'Espera Descarga')}
                title="Llegó a la sucursal y espera rampa/descarga"
              >
                En Sucursal
              </button>
            )}
            {unit.estatusSupervisor !== 'Descargando' && (
              <button 
                className="btn-move"
                style={{
                  borderColor: 'rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontWeight: 700
                }}
                onClick={() => updateStatus(unit.id, 'supervisor', 'Descargando')}
                title="En proceso de descarga activa en rampa"
              >
                Descargando
              </button>
            )}
            {unit.estatusSupervisor !== 'Retorno' && (
              <button 
                className="btn-move"
                style={{
                  borderColor: 'rgba(192, 132, 252, 0.4)',
                  color: '#c084fc',
                  fontWeight: 700
                }}
                onClick={() => updateStatus(unit.id, 'supervisor', 'Retorno')}
                title="Retorno a CEDIS Villahermosa tras terminar entregas"
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
            <button 
              className="btn-move"
              style={{
                borderColor: 'rgba(16, 185, 129, 0.55)',
                color: '#6ee7b7',
                background: 'rgba(16, 185, 129, 0.12)',
                fontWeight: 800
              }}
              onClick={() => updateStatus(unit.id, 'supervisor', 'Completado')}
              title="Ciclo completado y cerrado. Desplaza hacia abajo a viajes finalizados."
            >
              Fin
            </button>
          </div>
        )}
      </td>
      <td>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>
          {unit.observaciones || 'Sin incidencias registradas'}
        </div>
      </td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', alignItems: 'center' }}>
          <button 
            className="btn-action-icon"
            onClick={() => handleEdit(unit)}
            title="Modificar viaje o registro"
          >
            <Edit3 size={13} />
          </button>
          <button 
            className="btn-action-icon"
            style={{ color: '#f87171' }}
            onClick={() => {
              showConfirm({
                title: `¿Eliminar viaje / unidad ECO ${unit.economico}?`,
                message: 'Esta unidad será retirada de monitoreo, planeación y patio.',
                unit: unit,
                confirmText: 'Sí, eliminar',
                confirmType: 'danger',
                onConfirm: () => deleteUnit(unit.id)
              });
            }}
            title={`Eliminar unidad ECO ${unit.economico}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="supervisor-view">
      <div className="controls-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-input-group" style={{ maxWidth: '320px' }}>
            <input 
              type="text"
              className="search-input"
              placeholder="Buscar por ECO, operador, clóster o destino..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-secondary"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.45)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.45rem 0.85rem'
            }}
            onClick={handleLimpiarTodo}
            title="Limpiar todos los viajes y poner todas las unidades en Disponible"
          >
            <RotateCcw size={14} color="#f87171" />
            <span>Limpiar Todo</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
              Todos ({supervisorBaseUnits.length})
            </button>
            {cargadosCount > 0 && (
              <button 
                className={`pill-btn ${filterSubStatus === 'Cargado' ? 'active' : ''}`}
                onClick={() => setFilterSubStatus('Cargado')}
                style={filterSubStatus === 'Cargado' ? { background: '#fef08a', borderColor: '#eab308', color: '#713f12', fontWeight: 800 } : {}}
              >
                Cargados ({cargadosCount})
              </button>
            )}
            <button 
              className={`pill-btn ${filterSubStatus === 'En Ruta' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('En Ruta')}
            >
              <Navigation size={13} style={{ display: 'inline', marginRight: '3px' }} />
              En Ruta {enRutaCount > 0 && `(${enRutaCount})`}
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'Espera Descarga' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('Espera Descarga')}
            >
              <Clock size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Espera Descarga {esperaCount > 0 && `(${esperaCount})`}
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'Descargando' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('Descargando')}
            >
              <ArrowDownCircle size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Descargando {descargandoCount > 0 && `(${descargandoCount})`}
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'Retorno' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('Retorno')}
            >
              <RotateCcw size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Retorno {retornoCount > 0 && `(${retornoCount})`}
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'Retrasado' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('Retrasado')}
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              <AlertTriangle size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Retrasado / Alerta {retrasadoCount > 0 && `(${retrasadoCount})`}
            </button>
            <button 
              className={`pill-btn ${filterSubStatus === 'Completado' ? 'active' : ''}`}
              onClick={() => setFilterSubStatus('Completado')}
            >
              <CheckCircle2 size={13} style={{ display: 'inline', marginRight: '3px' }} />
              Completado {completadoCount > 0 && `(${completadoCount})`}
            </button>
          </div>
        </div>
      </div>

      {filterSubStatus !== 'Completado' && (
        <div className="table-card" style={{ marginBottom: '1.75rem' }}>
          <div className="table-header-title">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Radio size={20} color="var(--accent-cyan)" />
              <span>Unidades en Tránsito Activo ({activeTransitUnits.length})</span>
              {formattedPlanDate && (
                <span 
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-cyan)',
                    background: 'rgba(6, 182, 212, 0.12)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                  title={`Fecha del plan de embarques: ${formattedPlanDateLong}`}
                >
                  <Calendar size={13} />
                  {isPlanDateToday ? `Plan de Hoy: ${formattedPlanDate}` : `Plan: ${formattedPlanDate}`}
                </span>
              )}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Monitoreo en tiempo real. Al presionar «Fin», el viaje concluye y se desplaza abajo a la sección de finalizados.
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
                {activeTransitUnits.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No hay unidades en tránsito activo con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  activeTransitUnits.map(unit => renderUnitRow(unit, false))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(filterSubStatus === 'ALL' || filterSubStatus === 'Completado') && (
        <div className="table-card" style={{ border: '1px solid rgba(16, 185, 129, 0.28)', background: 'rgba(16, 185, 129, 0.02)' }}>
          <div className="table-header-title" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <CheckCircle2 size={20} color="#10b981" />
              <span style={{ color: '#34d399' }}>Viajes Finalizados ({completedTransitUnits.length})</span>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#6ee7b7',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.15rem 0.55rem',
                borderRadius: '12px'
              }}>
                Ciclo Concluido
              </span>
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Viajes que concluyeron su ciclo de entrega y retorno a CEDIS. La unidad se encuentra disponible en Patio.
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
                  <th>ETA / LLEGADA</th>
                  <th>ESTATUS ACTUAL</th>
                  <th>CAMBIO RÁPIDO DE ESTATUS (SUPERVISOR)</th>
                  <th>OBSERVACIONES / BITÁCORA</th>
                  <th style={{ textAlign: 'center' }}>ACCIÓN</th>
                </tr>
              </thead>
              <tbody>
                {completedTransitUnits.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No hay viajes finalizados en este momento. Al dar clic en «Fin» en cualquier viaje, se desplazará a este apartado.
                    </td>
                  </tr>
                ) : (
                  completedTransitUnits.map(unit => renderUnitRow(unit, true))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
