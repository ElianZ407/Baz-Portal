import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Wrench, 
  PackageCheck, 
  ArrowRightCircle, 
  Edit3, 
  Trash2, 
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
  const [filterViaje, setFilterViaje] = useState('ALL'); // 'ALL' | 'CON_VIAJE' | 'LIBRE'

  const isUnitAssignedOrViaje = (u) => {
    const hasViaje = Boolean(u.noViaje && String(u.noViaje).trim() !== '');
    const hasOp = Boolean(
      u.operador && 
      u.operador.trim() !== '' && 
      u.operador.toUpperCase() !== 'POR ASIGNAR' && 
      u.operador.toUpperCase() !== 'SIN OPERADOR'
    );
    return hasViaje || hasOp;
  };

  // Función de ordenamiento prioritario para Patio:
  // Unidades con Viaje activo o asignadas van ARRIBA de todo
  const sortPatioUnits = (items) => {
    return [...items].sort((a, b) => {
      const aHasViaje = Boolean(a.noViaje && String(a.noViaje).trim() !== '');
      const bHasViaje = Boolean(b.noViaje && String(b.noViaje).trim() !== '');
      const aHasOp = Boolean(
        a.operador && 
        a.operador.trim() !== '' && 
        a.operador.toUpperCase() !== 'POR ASIGNAR' && 
        a.operador.toUpperCase() !== 'SIN OPERADOR'
      );
      const bHasOp = Boolean(
        b.operador && 
        b.operador.trim() !== '' && 
        b.operador.toUpperCase() !== 'POR ASIGNAR' && 
        b.operador.toUpperCase() !== 'SIN OPERADOR'
      );

      // 1. Viaje asignado (prioridad máxima arriba)
      if (aHasViaje !== bHasViaje) return aHasViaje ? -1 : 1;
      // 2. Operador asignado
      if (aHasOp !== bHasOp) return aHasOp ? -1 : 1;
      // 3. Orden por número económico
      const numA = parseInt(String(a.economico || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.economico || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return String(a.economico || '').localeCompare(String(b.economico || ''));
    });
  };

  // Filtrado de unidades en Patio o que impactan el CD
  const allPatioUnits = units.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (u.economico && u.economico.toLowerCase().includes(q)) ||
      (u.observaciones && u.observaciones.toLowerCase().includes(q)) ||
      (u.operador && u.operador.toLowerCase().includes(q)) ||
      (u.destino && u.destino.toLowerCase().includes(q)) ||
      (u.noViaje && String(u.noViaje).toLowerCase().includes(q)) ||
      (u.placas && u.placas.toLowerCase().includes(q));

    const matchesTipo = filterTipo === 'ALL' || u.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const totalConViaje = allPatioUnits.filter(isUnitAssignedOrViaje).length;
  const totalLibres = allPatioUnits.filter(u => !isUnitAssignedOrViaje(u)).length;

  const patioUnits = allPatioUnits.filter(u => {
    if (filterViaje === 'CON_VIAJE') return isUnitAssignedOrViaje(u);
    if (filterViaje === 'LIBRE') return !isUnitAssignedOrViaje(u);
    return true;
  });

  const columns = [
    {
      id: 'Disponible',
      title: 'Disponible en Patio',
      subtitle: 'Unidades libres listas para asignar',
      icon: CheckCircle2,
      color: 'var(--status-green-text)',
      badgeClass: 'status-disponible',
      items: sortPatioUnits(patioUnits.filter(u => u.estatusPatio === 'Disponible'))
    },
    {
      id: 'Colocado p/ Carga',
      title: 'Colocado p/ Carga',
      subtitle: 'En rampa/cajón esperando mercancía',
      icon: ArrowRightCircle,
      color: 'var(--status-amber-text)',
      badgeClass: 'status-colocado-p-carga',
      items: sortPatioUnits(patioUnits.filter(u => u.estatusPatio === 'Colocado p/ Carga'))
    },
    {
      id: 'Cargado',
      title: 'Cargado',
      subtitle: 'Mercancía completa, lista para planeación',
      icon: PackageCheck,
      color: 'var(--status-cyan-text)',
      badgeClass: 'status-cargado',
      items: sortPatioUnits(patioUnits.filter(u => u.estatusPatio === 'Cargado'))
    },
    {
      id: 'Taller',
      title: 'Taller / Mtto',
      subtitle: 'Fuera de servicio por revisión mecánica',
      icon: Wrench,
      color: 'var(--status-red-text)',
      badgeClass: 'status-taller',
      items: sortPatioUnits(patioUnits.filter(u => u.estatusPatio === 'Taller'))
    }
  ];

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  return (
    <div className="patio-view">
      {/* Controles de Búsqueda y Filtros de Unidad */}
      <div className="controls-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-group">
            <input 
              type="text"
              className="search-input"
              placeholder="Buscar por ECO, viaje, operador, destino..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtro rápido de Viajes Asignados */}
          <div className="filter-pills" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Asignación:</span>
            <button 
              className={`pill-btn ${filterViaje === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterViaje('ALL')}
            >
              Todos ({allPatioUnits.length})
            </button>
            <button 
              className={`pill-btn ${filterViaje === 'CON_VIAJE' ? 'active' : ''}`}
              style={filterViaje === 'CON_VIAJE' ? { background: 'rgba(6, 182, 212, 0.22)', borderColor: '#22d3ee', color: '#22d3ee', fontWeight: 800 } : {}}
              onClick={() => setFilterViaje('CON_VIAJE')}
              title="Mostrar únicamente unidades que tienen un Viaje u Operador asignado"
            >
              🎯 Con Viaje / Asignadas ({totalConViaje})
            </button>
            <button 
              className={`pill-btn ${filterViaje === 'LIBRE' ? 'active' : ''}`}
              onClick={() => setFilterViaje('LIBRE')}
              title="Mostrar unidades disponibles sin viaje asignado"
            >
              Libres ({totalLibres})
            </button>
          </div>

          {/* Filtro por Tipo de Vehículo */}
          <div className="filter-pills" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tipo:</span>
            <button 
              className={`pill-btn ${filterTipo === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterTipo('ALL')}
            >
              Todos
            </button>
            <button 
              className={`pill-btn ${filterTipo === 'Sencillo' ? 'active' : ''}`}
              onClick={() => setFilterTipo('Sencillo')}
            >
              Sencillos ({allPatioUnits.filter(u => u.tipo === 'Sencillo').length})
            </button>
            <button 
              className={`pill-btn ${filterTipo === 'Tracto' ? 'active' : ''}`}
              onClick={() => setFilterTipo('Tracto')}
            >
              Tractos ({allPatioUnits.filter(u => u.tipo === 'Tracto').length})
            </button>
          </div>
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
                            {unit.economico ? (
                              <span className="eco-pill">ECO {unit.economico}</span>
                            ) : (
                              <span className="eco-pill" style={{ 
                                background: 'rgba(234, 179, 8, 0.15)', 
                                color: '#facc15', 
                                border: '1px dashed #eab308' 
                              }}>
                                POR ASIGNAR
                              </span>
                            )}
                            {hasViaje && (
                              <span style={{ 
                                fontSize: '0.72rem', 
                                fontWeight: 800, 
                                background: 'rgba(6, 182, 212, 0.22)', 
                                color: '#22d3ee', 
                                border: '1px solid rgba(6, 182, 212, 0.55)', 
                                padding: '0.15rem 0.5rem', 
                                borderRadius: '4px',
                                fontFamily: 'var(--font-mono)',
                                boxShadow: '0 0 8px rgba(6, 182, 212, 0.25)'
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

                          {unit.destino && (
                            <div>
                              <strong style={{ color: '#fff' }}>Destino: </strong>
                              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{unit.destino}</span>
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
              {/* Espaciador inferior para garantizar visibilidad total de la última tarjeta */}
              {col.items.length > 0 && <div style={{ height: '2.5rem', flexShrink: 0 }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
