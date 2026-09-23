import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Truck, Wrench, AlertTriangle } from 'lucide-react';
import { FLOTA_TOTAL } from '../constants/fleetConstants';
import { useFleet } from '../context/FleetContext';

export const UnidadSelector = ({ value, onSelect, mode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('ALL');
  const [tallerNotice, setTallerNotice] = useState(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const { units, activeArea, catalogoFlota } = useFleet();
  const isPlaneacion = mode === 'planeacion' || (!mode && activeArea === 'planeacion');
  const flotaList = catalogoFlota && Array.isArray(catalogoFlota) && catalogoFlota.length > 0 ? catalogoFlota : FLOTA_TOTAL;

  // Unidad actualmente seleccionada
  const selectedUnidad = flotaList.find(
    u => u.eco === String(value) || (u.placas && u.placas.toLowerCase() === String(value).toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      setSearch('');
      setTallerNotice(null);
    }
    setIsOpen(!isOpen);
  };

  const patioUnitsMap = new Map();
  (units || [])
    .filter(u => {
      const isPatio = ['Disponible', 'Colocado p/ Carga', 'Cargado', 'Taller'].includes(u.estatusPatio) || !u.estatusPatio;
      const isTaller = u.estatusPatio === 'Taller' || u.estatus === 'TALLER';
      return isPatio || isTaller;
    })
    .forEach(u => {
      if (!u.economico) return;
      const ecoKey = String(u.economico);
      if (!patioUnitsMap.has(ecoKey)) {
        const master = flotaList.find(f => String(f.eco) === ecoKey);
        patioUnitsMap.set(ecoKey, {
          eco: ecoKey,
          placas: u.placas || master?.placas || '',
          tipo: u.tipo || master?.tipo || 'Camioneta',
          capUnidad: Number(u.capUnidad || master?.capUnidad || 18),
          linea: u.linea || master?.linea || 'LTI - VHS',
          estatusPatio: u.estatusPatio || 'Disponible',
          estatus: (u.estatusPatio === 'Taller' || u.estatus === 'TALLER') ? 'TALLER' : 'ACTIVO'
        });
      }
    });

  const patioUnits = Array.from(patioUnitsMap.values());

  const sourceList = isPlaneacion ? patioUnits : flotaList;

  const filteredUnidades = sourceList.filter(u => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      u.eco.toLowerCase().includes(q) || 
      u.placas.toLowerCase().includes(q);

    const matchesTipo = tipoFilter === 'ALL' || 
      (tipoFilter === 'CAMIONETA' && u.capUnidad === 18) ||
      (tipoFilter === 'RANGO_MEDIO' && (u.capUnidad === 40 || u.capUnidad === 50)) ||
      (tipoFilter === 'TRACTO' && (u.capUnidad === 90 || u.capUnidad === 110));

    return matchesSearch && matchesTipo;
  });

  const categories = [
    { id: 'ALL', label: `Todas (${filteredUnidades.length})` },
    { id: 'CAMIONETA', label: 'Camionetas (18)' },
    { id: 'RANGO_MEDIO', label: 'Rango Medio (50)' },
    { id: 'TRACTO', label: 'Quintas / Fulles (110)' }
  ];

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
      >
        {selectedUnidad ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span className="eco-pill" style={{ fontSize: '0.8rem', padding: '0.12rem 0.45rem' }}>
              ECO {selectedUnidad.eco}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#94a3b8' }}>
              [{selectedUnidad.placas}]
            </span>
            <span style={{ 
              fontSize: '0.72rem', 
              color: selectedUnidad.estatus === 'ACTIVO' ? '#34d399' : selectedUnidad.estatus === 'TALLER' ? '#f87171' : '#fbbf24',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700
            }}>
              [{selectedUnidad.estatus === 'TALLER' ? 'TALLER' : 'PATIO'}]
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>
            {value ? `ECO ${value}` : isPlaneacion ? 'Seleccionar Unidad de Patio...' : 'Seleccionar ECO Unidad del Padrón...'}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              title="Quitar unidad asignada (dejar sin unidad)"
              style={{ 
                padding: '0.2rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                color: 'var(--text-muted)',
                borderRadius: '4px',
                transition: 'color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          {/* Aviso contextual para Planeación */}
          {isPlaneacion && (
            <div style={{
              background: 'rgba(6, 182, 212, 0.1)',
              borderBottom: '1px solid rgba(6, 182, 212, 0.25)',
              padding: '0.45rem 0.85rem',
              fontSize: '0.75rem',
              color: 'var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <Truck size={13} />
              <span>
                <strong>Unidades en Patio:</strong> Solo unidades presentes en Patio (sin operador). Taller bloqueado para selección.
              </span>
            </div>
          )}

          {/* Notificación si intenta seleccionar una unidad en taller */}
          {tallerNotice && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '0.5rem 0.85rem',
              fontSize: '0.76rem',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={14} color="#f87171" style={{ flexShrink: 0 }} />
                <span>{tallerNotice}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setTallerNotice(null)}
                style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0 }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div className="custom-select-search-box">
            <Search size={15} color="var(--accent-cyan)" />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por número ECO o placas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {search && (
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setSearch('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="custom-select-filter-chips">
            {categories.map(c => (
              <button
                key={c.id}
                type="button"
                className={`custom-chip-btn ${tipoFilter === c.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setTipoFilter(c.id);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="custom-select-options-list">
            {/* Opción para registrar viaje sin unidad física asignada */}
            {isPlaneacion && (
              <div
                className={`custom-select-option-item ${!value ? 'selected' : ''}`}
                style={{ 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
                  cursor: 'pointer',
                  background: !value ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.02)'
                }}
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ 
                    fontSize: '0.74rem', 
                    color: 'var(--accent-cyan)', 
                    fontWeight: 700, 
                    fontFamily: 'var(--font-mono)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.35)'
                  }}>
                    SIN UNIDAD
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    Registrar viaje sin unidad asignada (Por asignar en patio)
                  </span>
                </div>
              </div>
            )}

            {filteredUnidades.length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No se encontraron unidades con ese criterio.
              </div>
            ) : (
              filteredUnidades.map(u => {
                const isTaller = (u.estatusPatio === 'Taller') || u.estatus === 'TALLER';
                const isSelected = selectedUnidad && selectedUnidad.eco === u.eco;
                const isUnselectable = isPlaneacion && isTaller;

                return (
                  <div
                    key={u.eco}
                    className={`custom-select-option-item ${isSelected ? 'selected' : ''}`}
                    style={{
                      cursor: isUnselectable ? 'not-allowed' : 'pointer',
                      opacity: isUnselectable ? 0.58 : 1,
                      backgroundColor: isUnselectable ? 'rgba(239, 68, 68, 0.05)' : undefined,
                      borderLeft: isUnselectable ? '3px solid #ef4444' : undefined
                    }}
                    title={isUnselectable ? 'Unidad en Taller Mecánico — No se puede seleccionar para planeación' : `Seleccionar ECO ${u.eco}`}
                    onClick={(e) => {
                      if (isUnselectable) {
                        e.stopPropagation();
                        setTallerNotice(`La unidad ECO ${u.eco} (${u.placas}) está en TALLER MECÁNICO y no puede ser seleccionada para planeación.`);
                        return;
                      }
                      onSelect(u);
                      setIsOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="eco-pill" style={{ 
                          fontSize: '0.82rem',
                          background: isTaller ? 'rgba(239, 68, 68, 0.2)' : undefined,
                          borderColor: isTaller ? 'rgba(239, 68, 68, 0.5)' : undefined,
                          color: isTaller ? '#fca5a5' : undefined
                        }}>
                          ECO {u.eco}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>
                          Placas: {u.placas}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {isUnselectable ? (
                          <span style={{ 
                            fontSize: '0.72rem', 
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            background: 'rgba(239, 68, 68, 0.25)',
                            color: '#f87171',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Wrench size={10} />
                            <span>EN TALLER (BLOQUEADA)</span>
                          </span>
                        ) : (
                          <span style={{ 
                            fontSize: '0.72rem', 
                            padding: '0.12rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            background: isTaller ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: isTaller ? '#f87171' : '#34d399',
                            border: `1px solid ${isTaller ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                          }}>
                            {isTaller ? 'TALLER' : 'DISPONIBLE'}
                          </span>
                        )}
                        {isSelected && !isUnselectable && <Check size={14} color="var(--accent-cyan)" />}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span>{u.tipo}</span>
                      <span>• Capacidad: <strong style={{ color: '#cbd5e1' }}>{u.capUnidad}</strong></span>
                      <span>• {u.linea}</span>
                      {isUnselectable && (
                        <span style={{ color: '#fca5a5', fontWeight: 600, marginLeft: 'auto' }}>
                          ⛔ No seleccionable
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
