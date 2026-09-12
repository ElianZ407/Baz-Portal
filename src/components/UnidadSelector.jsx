import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Truck, Wrench, AlertTriangle } from 'lucide-react';
import { FLOTA_TOTAL } from '../data/flotaMaestraData';

export const UnidadSelector = ({ value, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('ALL');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Unidad actualmente seleccionada
  const selectedUnidad = FLOTA_TOTAL.find(
    u => u.eco === String(value) || u.placas.toLowerCase() === String(value).toLowerCase()
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
    }
    setIsOpen(!isOpen);
  };

  const filteredUnidades = FLOTA_TOTAL.filter(u => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      u.eco.toLowerCase().includes(q) || 
      u.placas.toLowerCase().includes(q) || 
      u.operador.toLowerCase().includes(q);

    const matchesTipo = tipoFilter === 'ALL' || 
      (tipoFilter === 'CAMIONETA' && u.capUnidad === 18) ||
      (tipoFilter === 'RANGO_MEDIO' && (u.capUnidad === 40 || u.capUnidad === 50)) ||
      (tipoFilter === 'TRACTO' && (u.capUnidad === 90 || u.capUnidad === 110));

    return matchesSearch && matchesTipo;
  });

  const categories = [
    { id: 'ALL', label: 'Todas (45)' },
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
            <span style={{ fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {selectedUnidad.operador}
            </span>
            <span style={{ 
              fontSize: '0.72rem', 
              color: selectedUnidad.estatus === 'ACTIVO' ? '#34d399' : selectedUnidad.estatus === 'TALLER' ? '#f87171' : '#fbbf24',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700
            }}>
              [{selectedUnidad.estatus}]
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>
            {value ? `ECO ${value}` : 'Seleccionar ECO Unidad del Padrón...'}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
          <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          <div className="custom-select-search-box">
            <Search size={15} color="var(--accent-cyan)" />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por número ECO, placas u operador..."
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
            {filteredUnidades.length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No se encontraron unidades con ese criterio.
              </div>
            ) : (
              filteredUnidades.map(u => {
                const isSelected = selectedUnidad && selectedUnidad.eco === u.eco;
                const isTaller = u.estatus === 'TALLER';
                return (
                  <div
                    key={u.eco}
                    className={`custom-select-option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelect(u);
                      setIsOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="eco-pill" style={{ fontSize: '0.82rem' }}>
                          ECO {u.eco}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#e2e8f0', fontWeight: 600 }}>
                          Placas: {u.placas}
                        </span>
                        <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
                          • {u.operador}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          background: isTaller ? 'rgba(239, 68, 68, 0.2)' : u.estatus === 'ACTIVO' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: isTaller ? '#f87171' : u.estatus === 'ACTIVO' ? '#34d399' : '#fbbf24',
                          border: `1px solid ${isTaller ? 'rgba(239, 68, 68, 0.4)' : u.estatus === 'ACTIVO' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                        }}>
                          {u.estatus}
                        </span>
                        {isSelected && <Check size={14} color="var(--accent-cyan)" />}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span>{u.tipo}</span>
                      <span>• Capacidad: <strong style={{ color: '#cbd5e1' }}>{u.capUnidad}</strong></span>
                      <span>• {u.linea}</span>
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
