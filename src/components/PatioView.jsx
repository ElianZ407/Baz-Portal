import React, { useState } from 'react';
import { 
  RotateCw, 
  MoreHorizontal, 
  AlertTriangle, 
  ExternalLink, 
  SendHorizontal 
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const PatioView = () => {
  const { 
    units, 
    updateStatus, 
    setSelectedUnit, 
    setIsModalOpen, 
    currentTime 
  } = useFleet();

  const [filterTipo, setFilterTipo] = useState('ALL');

  // Filtrado por tipo
  const filteredUnits = units.filter(u => {
    if (filterTipo === 'ALL') return true;
    return u.tipo && u.tipo.toUpperCase() === filterTipo.toUpperCase();
  });

  const timeSyncString = currentTime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  // 4 Columnas exactas de la imagen
  const columns = [
    {
      id: 'Disponible',
      title: 'Disponible en Patio',
      dotClass: 'status-dot-green',
      items: filteredUnits.filter(u => u.estatusPatio === 'Disponible')
    },
    {
      id: 'Colocado p/ Carga',
      title: 'Colocado p/ Carga',
      dotClass: 'status-dot-amber',
      items: filteredUnits.filter(u => u.estatusPatio === 'Colocado p/ Carga')
    },
    {
      id: 'Cargado',
      title: 'Cargado',
      dotClass: 'status-dot-blue',
      items: filteredUnits.filter(u => u.estatusPatio === 'Cargado')
    },
    {
      id: 'Taller',
      title: 'Taller / Mantenimiento',
      dotClass: 'status-dot-red',
      items: filteredUnits.filter(u => u.estatusPatio === 'Taller')
    }
  ];

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const despacharUnidad = (unitId) => {
    updateStatus(unitId, 'planeacion', 'Liberado a Ruta');
  };

  const getInitials = (name) => {
    if (!name) return 'OP';
    const parts = name.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="patio-module-view">
      {/* Subcabecera del Módulo */}
      <div className="module-header-row">
        <div>
          <div className="module-meta-tag">MÓDULO 01 · CENTRO DE DISTRIBUCIÓN</div>
          <h1 className="module-title-h1">Patio operativo</h1>
          <p className="module-subtitle-text">
            12 unidades registradas · 10 activas · Última sincronización {timeSyncString}
          </p>
        </div>

        <div className="module-actions-group">
          {/* Botón Sincronizar */}
          <button className="btn-sync-outline" onClick={() => window.location.reload()}>
            <RotateCw size={14} />
            <span>Sincronizar</span>
          </button>

          {/* Segmented control Todos / Sencillos / Tractos */}
          <div className="type-filter-segmented">
            <button 
              className={`segmented-btn ${filterTipo === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterTipo('ALL')}
            >
              Todos
            </button>
            <button 
              className={`segmented-btn ${filterTipo === 'SENCILLO' ? 'active' : ''}`}
              onClick={() => setFilterTipo('SENCILLO')}
            >
              Sencillos
            </button>
            <button 
              className={`segmented-btn ${filterTipo === 'TRACTO' ? 'active' : ''}`}
              onClick={() => setFilterTipo('TRACTO')}
            >
              Tractos
            </button>
          </div>
        </div>
      </div>

      {/* Tablero Kanban de 4 Columnas */}
      <div className="patio-kanban-board">
        {columns.map(col => (
          <div key={col.id} className="kanban-column-box">
            {/* Cabecera de Columna */}
            <div className="column-header-bar">
              <div className="column-title-group">
                <span className={`status-dot-circle ${col.dotClass}`}></span>
                <span className="column-header-name">{col.title}</span>
              </div>
              <div className="column-header-actions">
                <span className="column-count-number">{col.items.length}</span>
                <button className="btn-more-dots" title="Opciones">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Lista de Tarjetas */}
            <div className="cards-list-flow">
              {col.items.map(unit => (
                <div key={unit.id} className="kanban-unit-card">
                  {/* Top row: ECO + Tag + Menú */}
                  <div className="card-top-row">
                    <div className="card-eco-tag-wrap">
                      <span className="card-eco-text">{unit.economico}</span>
                      <span className="card-type-pill">{unit.tipo || 'SENCILLO'}</span>
                    </div>
                    <button className="btn-more-dots" onClick={() => handleEdit(unit)}>
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  {/* Fila del Operador */}
                  <div className="card-operator-row">
                    <div className="operator-avatar-circle">
                      {unit.iniciales || getInitials(unit.operador)}
                    </div>
                    <div className="operator-info-box">
                      <span className="operator-full-name">{unit.operador || 'Sin Asignar'}</span>
                      <span className="operator-assigned-subtitle">Operador asignado</span>
                    </div>
                  </div>

                  {/* Grid Cortina y Último Evento */}
                  <div className="card-data-grid-two">
                    <div className="data-cell-item">
                      <span className="data-cell-label">Cortina</span>
                      <span className="data-cell-val cortina-highlight">
                        {unit.cortina || '—'}
                      </span>
                    </div>
                    <div className="data-cell-item">
                      <span className="data-cell-label">Último evento</span>
                      <span className="data-cell-val">
                        {unit.ultimoEvento || 'Sin novedades'}
                      </span>
                    </div>
                  </div>

                  {/* Alerta de estado si aplica (Prioridad cliente, etc.) */}
                  {unit.alerta && (
                    <div className={`card-alert-line ${col.id === 'Taller' ? 'alert-red' : ''}`}>
                      <AlertTriangle size={13} />
                      <span>{unit.alerta}</span>
                    </div>
                  )}

                  {/* Footer con Ver Detalle y Despachar */}
                  <div className="card-bottom-actions">
                    <button className="link-ver-detalle" onClick={() => handleEdit(unit)}>
                      <span>Ver detalle</span>
                      <ExternalLink size={12} />
                    </button>

                    {col.id === 'Cargado' && (
                      <button 
                        className="link-despachar-action" 
                        onClick={() => despacharUnidad(unit.id)}
                        title="Despachar unidad a ruta"
                      >
                        <span>Despachar</span>
                        <SendHorizontal size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
