import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Wrench, 
  PackageCheck, 
  ArrowRightCircle, 
  Truck, 
  Edit3, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const PatioView = () => {
  const { 
    units, 
    updateStatus, 
    setSelectedUnit, 
    setIsModalOpen, 
    deleteUnit,
    searchQuery,
    setSearchQuery 
  } = useFleet();

  const [filterTipo, setFilterTipo] = useState('ALL');

  // Filtrado de unidades en Patio o que impactan el CD
  const patioUnits = units.filter(u => {
    const matchesSearch = 
      u.economico.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.operador && u.operador.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.observaciones && u.observaciones.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTipo = filterTipo === 'ALL' || u.tipo === filterTipo;

    return matchesSearch && matchesTipo;
  });

  const columns = [
    {
      id: 'Disponible',
      title: 'Disponible en Patio',
      subtitle: 'Unidades libres listas para asignar',
      icon: CheckCircle2,
      color: 'var(--status-green-text)',
      badgeClass: 'status-disponible',
      items: patioUnits.filter(u => u.estatusPatio === 'Disponible')
    },
    {
      id: 'Colocado p/ Carga',
      title: 'Colocado p/ Carga',
      subtitle: 'En rampa/cajón esperando mercancía',
      icon: ArrowRightCircle,
      color: 'var(--status-amber-text)',
      badgeClass: 'status-colocado-p-carga',
      items: patioUnits.filter(u => u.estatusPatio === 'Colocado p/ Carga')
    },
    {
      id: 'Cargado',
      title: 'Cargado',
      subtitle: 'Mercancía completa, lista para planeación',
      icon: PackageCheck,
      color: 'var(--status-cyan-text)',
      badgeClass: 'status-cargado',
      items: patioUnits.filter(u => u.estatusPatio === 'Cargado')
    },
    {
      id: 'Taller',
      title: 'Taller / Mtto',
      subtitle: 'Fuera de servicio por revisión mecánica',
      icon: Wrench,
      color: 'var(--status-red-text)',
      badgeClass: 'status-taller',
      items: patioUnits.filter(u => u.estatusPatio === 'Taller')
    }
  ];

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  return (
    <div className="patio-view">
      {/* Controles de Búsqueda y Filtros de Unidad */}
      <div className="controls-bar">
        <div className="search-input-group">
          <input 
            type="text"
            className="search-input"
            placeholder="Buscar por ECO, operador, nota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.3rem' }}>
            Tipo de unidad:
          </span>
          <button 
            className={`pill-btn ${filterTipo === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterTipo('ALL')}
          >
            Todos ({patioUnits.length})
          </button>
          <button 
            className={`pill-btn ${filterTipo === 'Sencillo' ? 'active' : ''}`}
            onClick={() => setFilterTipo('Sencillo')}
          >
            Sencillos ({patioUnits.filter(u => u.tipo === 'Sencillo').length})
          </button>
          <button 
            className={`pill-btn ${filterTipo === 'Tracto' ? 'active' : ''}`}
            onClick={() => setFilterTipo('Tracto')}
          >
            Tractos ({patioUnits.filter(u => u.tipo === 'Tracto').length})
          </button>
        </div>
      </div>

      {/* Tablero Kanban de Patio según Pizarrón */}
      <div className="kanban-grid">
        {columns.map(col => {
          const Icon = col.icon;
          return (
            <div key={col.id} className="kanban-column">
              <div className="kanban-column-header">
                <div>
                  <h3>
                    <Icon size={18} style={{ color: col.color }} />
                    <span>{col.title}</span>
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{col.subtitle}</p>
                </div>
                <span className={`status-badge ${col.badgeClass}`}>
                  {col.items.length}
                </span>
              </div>

              <div className="kanban-cards-wrapper">
                {col.items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Sin unidades en este estatus
                  </div>
                ) : (
                  col.items.map(unit => (
                    <div key={unit.id} className="unit-card">
                      <div className="unit-card-header">
                        <span className="eco-pill">ECO {unit.economico}</span>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          background: 'rgba(255,255,255,0.08)', 
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)'
                        }}>
                          {unit.tipo}
                        </span>
                      </div>

                      <div className="unit-card-body">
                        <div>
                          <strong style={{ color: '#fff' }}>Operador: </strong>
                          <span>{unit.operador || 'Sin Asignar'}</span>
                        </div>
                        {unit.cortina && unit.cortina !== 'Sin asignar' && (
                          <div>
                            <strong style={{ color: '#fff' }}>Cortina/Rampa: </strong>
                            <span style={{ color: 'var(--accent-cyan)' }}>{unit.cortina}</span>
                          </div>
                        )}
                        {unit.destino && unit.destino !== 'Sin asignar' && (
                          <div>
                            <strong style={{ color: '#fff' }}>Destino previsto: </strong>
                            <span>{unit.destino}</span>
                          </div>
                        )}
                        {unit.observaciones && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                            "{unit.observaciones}"
                          </div>
                        )}
                      </div>

                      <div className="unit-card-footer">
                        {/* Acciones para mover estatus en Patio */}
                        <div className="unit-card-actions">
                          {col.id !== 'Disponible' && (
                            <button 
                              className="btn-move"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(unit.id, 'patio', 'Disponible');
                              }}
                              title="Marcar como Disponible"
                            >
                              Disp.
                            </button>
                          )}
                          {col.id !== 'Colocado p/ Carga' && (
                            <button 
                              className="btn-move"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(unit.id, 'patio', 'Colocado p/ Carga');
                              }}
                              title="Colocar para carga"
                            >
                              Carga
                            </button>
                          )}
                          {col.id !== 'Cargado' && (
                            <button 
                              className="btn-move"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(unit.id, 'patio', 'Cargado');
                              }}
                              title="Marcar como Cargado"
                            >
                              Cargado
                            </button>
                          )}
                          {col.id !== 'Taller' && (
                            <button 
                              className="btn-move"
                              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(unit.id, 'patio', 'Taller');
                              }}
                              title="Enviar a Taller"
                            >
                              Taller
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button 
                            className="btn-action-icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(unit);
                            }}
                            title="Editar información"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            className="btn-action-icon"
                            style={{ color: '#f87171' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`¿Eliminar la unidad ECO ${unit.economico}?`)) {
                                deleteUnit(unit.id);
                              }
                            }}
                            title="Eliminar unidad"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
