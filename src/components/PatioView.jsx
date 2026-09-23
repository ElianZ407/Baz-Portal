import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Wrench, 
  PackageCheck, 
  ArrowRightCircle, 
  Truck, 
  Edit3, 
  Trash2,
  AlertCircle,
  PlusCircle,
  UserCheck
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const PatioView = () => {
  const { 
    units, 
    updateStatus, 
    setSelectedUnit, 
    setIsModalOpen, 
    deleteUnit,
    showConfirm,
    searchQuery,
    setSearchQuery 
  } = useFleet();

  const [filterTipo, setFilterTipo] = useState('ALL');

  // Filtrado de unidades en Patio o que impactan el CD
  const patioUnits = units.filter(u => {
    const matchesSearch = 
      u.economico.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            placeholder="Buscar por ECO, nota..."
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

        <button 
          className="btn btn-primary"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderColor: '#10b981',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.95rem',
            fontSize: '0.84rem'
          }}
          onClick={() => {
            setSelectedUnit(null);
            setIsModalOpen(true);
          }}
          title="Registrar nueva unidad física en patio (solo vehículo, sin operador)"
        >
          <PlusCircle size={16} />
          <span>Registrar Unidad en Patio</span>
        </button>
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
                  col.items.map(unit => {
                    const hasOperator = Boolean(
                      unit.operador && 
                      unit.operador.trim() !== '' && 
                      unit.operador.toUpperCase() !== 'POR ASIGNAR' && 
                      unit.operador.toUpperCase() !== 'SIN OPERADOR'
                    );
                    const hasViaje = Boolean(unit.noViaje && String(unit.noViaje).trim() !== '');

                    return (
                      <div key={unit.id} className={`unit-card ${hasOperator ? 'unit-card-assigned' : ''}`}>
                        <div className="unit-card-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span className="eco-pill">ECO {unit.economico}</span>
                            {hasViaje && (
                              <span style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 800, 
                                background: 'rgba(6, 182, 212, 0.18)', 
                                color: '#22d3ee', 
                                border: '1px solid rgba(6, 182, 212, 0.4)', 
                                padding: '0.12rem 0.45rem', 
                                borderRadius: '4px',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                VIAJE #{unit.noViaje}
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {hasOperator && (
                              <span style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: 800, 
                                background: 'rgba(16, 185, 129, 0.18)', 
                                color: '#34d399', 
                                border: '1px solid rgba(16, 185, 129, 0.4)', 
                                padding: '0.12rem 0.45rem', 
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em'
                              }}>
                                ASIGNADA
                              </span>
                            )}
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
                        </div>

                        <div className="unit-card-body">
                          {unit.placas && (
                            <div>
                              <strong style={{ color: '#fff' }}>Placas: </strong>
                              <span style={{ color: 'var(--text-secondary)' }}>{unit.placas}</span>
                            </div>
                          )}
                          <div>
                            <strong style={{ color: '#fff' }}>Capacidad: </strong>
                            <span style={{ color: 'var(--accent-cyan)' }}>{unit.capUnidad || 18} m³</span>
                          </div>
                          {unit.cortina && unit.cortina !== 'Sin asignar' && (
                            <div>
                              <strong style={{ color: '#fff' }}>Cajón / Rampa: </strong>
                              <span style={{ color: '#34d399', fontWeight: 600 }}>{unit.cortina}</span>
                            </div>
                          )}

                          {/* Operador Asignado */}
                          {hasOperator && (
                            <div style={{
                              marginTop: '0.45rem',
                              padding: '0.45rem 0.65rem',
                              background: 'rgba(6, 182, 212, 0.1)',
                              border: '1px solid rgba(6, 182, 212, 0.3)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <UserCheck size={16} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                              <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{ 
                                  fontSize: '0.64rem', 
                                  color: 'var(--accent-cyan)', 
                                  fontWeight: 800, 
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  lineHeight: 1
                                }}>
                                  Operador Asignado
                                </div>
                                <div style={{ 
                                  fontSize: '0.82rem', 
                                  color: '#fff', 
                                  fontWeight: 700, 
                                  whiteSpace: 'nowrap', 
                                  textOverflow: 'ellipsis', 
                                  overflow: 'hidden',
                                  marginTop: '0.15rem'
                                }}>
                                  {unit.operador}
                                </div>
                              </div>
                            </div>
                          )}

                          {unit.observaciones && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                              "{unit.observaciones}"
                            </div>
                          )}
                        </div>

                      <div className="unit-card-footer">
                        {/* Patio: solo mover a Taller o liberar de Taller */}
                        <div className="unit-card-actions">
                          {col.id === 'Taller' ? (
                            <button 
                              className="btn-move"
                              style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(unit.id, 'patio', 'Disponible');
                              }}
                              title="Liberar de Taller — Disponible en Patio"
                            >
                              Disponible
                            </button>
                          ) : (
                            <button 
                              className="btn-move"
                              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateStatus(unit.id, 'patio', 'Taller');
                              }}
                              title="Enviar a Taller Mecánico"
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
                              showConfirm({
                                title: `¿Eliminar la unidad ECO ${unit.economico}?`,
                                message: 'Esta unidad será retirada de patio y de los tableros operativos de monitoreo.',
                                unit: unit,
                                confirmText: 'Sí, eliminar',
                                confirmType: 'danger',
                                onConfirm: () => deleteUnit(unit.id)
                              });
                            }}
                            title="Eliminar unidad"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
