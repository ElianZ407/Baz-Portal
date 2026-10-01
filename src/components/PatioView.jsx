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
import { FLOTA_TOTAL } from '../constants/fleetConstants';
import { tieneRutaAsignada, consolidarUnidadesPatioPorEconomico } from '../utils/fleetUtils';

export const PatioView = () => {
  const { 
    units, 
    catalogoFlota,
    updateStatus, 
    setSelectedUnit, 
    setIsModalOpen, 
    retireUnitFromFleet,
    showConfirm,
    searchQuery,
    setSearchQuery 
  } = useFleet();

  const [filterTipo, setFilterTipo] = useState('ALL');
  const [filterViaje, setFilterViaje] = useState('ALL'); // 'ALL' | 'CON_VIAJE' | 'LIBRE'

  const isUnitAssignedOrViaje = tieneRutaAsignada;

  // Función de ordenamiento prioritario para Patio:
  // Unidades con Viaje activo o asignadas van ARRIBA de todo
  const sortPatioUnits = (items) => {
    return [...items].sort((a, b) => {
      const aHasViaje = isUnitAssignedOrViaje(a);
      const bHasViaje = isUnitAssignedOrViaje(b);

      // 1. Ruta asignada (prioridad máxima arriba)
      if (aHasViaje !== bHasViaje) return aHasViaje ? -1 : 1;
      // 3. Orden por número económico
      const numA = parseInt(String(a.economico || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.economico || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return String(a.economico || '').localeCompare(String(b.economico || ''));
    });
  };

  // Catálogo completo de la flota vehicular
  const flotaList = catalogoFlota && Array.isArray(catalogoFlota) && catalogoFlota.length > 0
    ? catalogoFlota
    : FLOTA_TOTAL;

  // Unidades activas mapeadas por número económico
  const activeUnitsMap = consolidarUnidadesPatioPorEconomico(units || []);

  // Helper de clasificación por tipo según catálogo oficial BAZ
  const isCamioneta = (u) => Number(u.capUnidad) === 18 || String(u.tipo || '').toLowerCase().includes('camioneta');
  const isRabon = (u) => [40, 50].includes(Number(u.capUnidad)) || String(u.tipo || '').toLowerCase().includes('rango medio') || String(u.tipo || '').toLowerCase().includes('rabon');
  const isFull = (u) => [90, 110, 180].includes(Number(u.capUnidad)) || String(u.tipo || '').toLowerCase().includes('tracto') || String(u.tipo || '').toLowerCase().includes('full');

  // Consolidar toda la flota física para Patio:
  // Toda unidad de la flota que no tenga viaje activo ni taller está DISPONIBLE en patio
  const fullPatioUnits = flotaList.map(f => {
    const ecoKey = String(f.eco);
    const catalogStatus = String(f.estatus || 'ACTIVO').trim().toUpperCase();
    const isCatalogTaller = catalogStatus.includes('TALLER');
    const isCatalogOutOfOperation = catalogStatus !== 'ACTIVO' && !isCatalogTaller;
    const active = activeUnitsMap.get(ecoKey);
    if (active) {
      if (isCatalogOutOfOperation && !isUnitAssignedOrViaje(active)) {
        return { ...active, estatus: catalogStatus, estatusPatio: 'No Disponible' };
      }
      return active;
    }
    return {
      id: `fleet-${ecoKey}`,
      soloCatalogo: true,
      economico: ecoKey,
      placas: f.placas || '',
      tipo: f.tipo || 'Camioneta',
      capUnidad: Number(f.capUnidad || 18),
      linea: f.linea || 'LTI - VHS',
      operador: f.operador || '',
      idOperador: f.idOperador || '',
      turno: 'M1',
      cortina: '',
      numCarga: '',
      numSucursal: '',
      sucursalOrigen: 'CEDIS VILLAHERMOSA',
      destino: '',
      destinosSecundarios: [],
      closter: 'HUB-VHSA',
      fl: 'LOCAL',
      estatus: catalogStatus,
      estatusPatio: isCatalogTaller ? 'Taller' : isCatalogOutOfOperation ? 'No Disponible' : 'Disponible',
      estatusPlaneacion: 'PENDIENTE',
      estatusSupervisor: isCatalogTaller ? 'No Disponible' : 'Pendiente',
      observaciones: f.observaciones || ''
    };
  });

  // Agregar cualquier unidad física registrada en 'units' con ECO que no esté en el catálogo
  (units || []).forEach(u => {
    const eco = String(u.economico || '').trim();
    if (eco && !flotaList.some(f => String(f.eco) === eco)) {
      fullPatioUnits.push(u);
    }
  });

  // Filtrado de unidades en Patio o que impactan el CD
  const allPatioUnits = fullPatioUnits.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      (u.economico && u.economico.toLowerCase().includes(q)) ||
      (u.observaciones && u.observaciones.toLowerCase().includes(q)) ||
      (u.operador && u.operador.toLowerCase().includes(q)) ||
      (u.destino && u.destino.toLowerCase().includes(q)) ||
      (u.noViaje && String(u.noViaje).toLowerCase().includes(q)) ||
      (u.placas && u.placas.toLowerCase().includes(q));

    let matchesTipo = true;
    if (filterTipo === 'CAMIONETA') matchesTipo = isCamioneta(u);
    else if (filterTipo === 'RABON') matchesTipo = isRabon(u);
    else if (filterTipo === 'FULL') matchesTipo = isFull(u);

    return matchesSearch && matchesTipo;
  });

  const totalConViaje = allPatioUnits.filter(isUnitAssignedOrViaje).length;
  const totalLibres = allPatioUnits.filter(u => u.estatusPatio === 'Disponible' && !isUnitAssignedOrViaje(u)).length;

  const patioUnits = allPatioUnits.filter(u => {
    if (filterViaje === 'CON_VIAJE') return isUnitAssignedOrViaje(u);
    if (filterViaje === 'LIBRE') return u.estatusPatio === 'Disponible' && !isUnitAssignedOrViaje(u);
    return true;
  });

  const columns = [
    {
      id: 'Disponible',
      title: 'Disponible en Patio',
      subtitle: 'Sin ruta asignada; listas para programar',
      icon: CheckCircle2,
      color: 'var(--status-green-text)',
      badgeClass: 'status-disponible',
      items: sortPatioUnits(patioUnits.filter(u => u.estatusPatio === 'Disponible' && !isUnitAssignedOrViaje(u)))
    },
    {
      id: 'Ruta asignada',
      title: 'Ruta asignada',
      subtitle: 'En patio, pero no disponible para otra ruta',
      icon: ArrowRightCircle,
      color: 'var(--status-cyan-text)',
      badgeClass: 'status-colocado-p-carga',
      items: sortPatioUnits(patioUnits.filter(u => u.estatusPatio === 'Disponible' && isUnitAssignedOrViaje(u)))
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

          <div className="filter-pills" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tipo:</span>
            <button 
              className={`pill-btn ${filterTipo === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterTipo('ALL')}
            >
              Todos
            </button>
            <button 
              className={`pill-btn ${filterTipo === 'CAMIONETA' ? 'active' : ''}`}
              onClick={() => setFilterTipo(filterTipo === 'CAMIONETA' ? 'ALL' : 'CAMIONETA')}
              style={filterTipo === 'CAMIONETA' ? { background: 'rgba(16, 185, 129, 0.25)', borderColor: '#10b981', color: '#34d399', fontWeight: 800 } : {}}
            >
              Camionetas ({allPatioUnits.filter(isCamioneta).length})
            </button>
            <button 
              className={`pill-btn ${filterTipo === 'RABON' ? 'active' : ''}`}
              onClick={() => setFilterTipo(filterTipo === 'RABON' ? 'ALL' : 'RABON')}
              style={filterTipo === 'RABON' ? { background: 'rgba(6, 182, 212, 0.25)', borderColor: '#06b6d4', color: '#22d3ee', fontWeight: 800 } : {}}
            >
              Rabones ({allPatioUnits.filter(isRabon).length})
            </button>
            <button 
              className={`pill-btn ${filterTipo === 'FULL' ? 'active' : ''}`}
              onClick={() => setFilterTipo(filterTipo === 'FULL' ? 'ALL' : 'FULL')}
              style={filterTipo === 'FULL' ? { background: 'rgba(168, 85, 247, 0.25)', borderColor: '#a855f7', color: '#c084fc', fontWeight: 800 } : {}}
            >
              Tractos / Fulles ({allPatioUnits.filter(isFull).length})
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
                                title: `¿Dar de baja la unidad ECO ${unit.economico}?`,
                                message: 'Se marcará como BAJA en el padrón y se retirarán sus viajes diarios. Esta acción la quitará de los tableros operativos.',
                                unit: unit,
                                confirmText: 'Sí, dar de baja',
                                confirmType: 'danger',
                                onConfirm: () => retireUnitFromFleet(unit)
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
