import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, MapPin, AlertTriangle } from 'lucide-react';
import { SUCURSALES_MAESTRAS } from '../data/sucursalesData';

export const SucursalSelector = ({ value, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Encontrar la sucursal seleccionada actualmente
  const selectedSucursal = SUCURSALES_MAESTRAS.find(
    s => s.id === String(value) || s.nombre.toLowerCase() === String(value).toLowerCase()
  );

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Autoenfocar el buscador al abrir
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Al abrir, resetear el buscador para que SIEMPRE aparezcan todas las opciones
  const handleToggle = () => {
    if (!isOpen) {
      setSearch('');
    }
    setIsOpen(!isOpen);
  };

  const filteredSucursales = SUCURSALES_MAESTRAS.filter(s => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      s.nombre.toLowerCase().includes(q) || 
      s.id.includes(q) || 
      s.closter.toLowerCase().includes(q) ||
      (s.region && s.region.toLowerCase().includes(q));

    const matchesRegion = regionFilter === 'ALL' || 
      (s.region && s.region.toUpperCase().includes(regionFilter.toUpperCase()));

    return matchesSearch && matchesRegion;
  });

  const regions = [
    { id: 'ALL', label: 'Todas (+80)' },
    { id: 'TABASCO', label: 'Tabasco' },
    { id: 'VERACRUZ', label: 'Veracruz' },
    { id: 'CHIAPAS', label: 'Chiapas' },
    { id: 'OAXACA', label: 'Oaxaca' },
    { id: 'CAMPECHE', label: 'Península' }
  ];

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      {/* Gatillo visual que muestra la selección actual */}
      <div 
        className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
      >
        {selectedSucursal ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span style={{ 
              background: 'rgba(6, 182, 212, 0.2)', 
              color: 'var(--accent-cyan)', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              padding: '0.12rem 0.45rem', 
              borderRadius: '4px' 
            }}>
              #{selectedSucursal.id}
            </span>
            <span style={{ fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {selectedSucursal.nombre}
            </span>
            <span className={selectedSucursal.fl === 'FORANEO' ? 'badge-fl-foraneo' : 'badge-fl-local'}>
              {selectedSucursal.fl}
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>
            {value ? String(value) : 'Seleccionar Sucursal Destino...'}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
          <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </div>

      {/* Menú Flotante con buscador y todas las opciones */}
      {isOpen && (
        <div className="custom-select-dropdown">
          {/* Campo de Búsqueda Integrado */}
          <div className="custom-select-search-box">
            <Search size={15} color="var(--accent-cyan)" />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por nombre, # ID, clóster o ciudad..."
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

          {/* Chips de Regiones para Filtrado Rápido */}
          <div className="custom-select-filter-chips">
            {regions.map(r => (
              <button
                key={r.id}
                type="button"
                className={`custom-chip-btn ${regionFilter === r.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setRegionFilter(r.id);
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Lista de Opciones Completa y Scrolleable */}
          <div className="custom-select-options-list">
            {filteredSucursales.length === 0 ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No se encontraron sucursales coincidentes.
              </div>
            ) : (
              filteredSucursales.map(s => {
                const isSelected = selectedSucursal && selectedSucursal.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={`custom-select-option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      onSelect(s);
                      setIsOpen(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: '0.78rem', 
                          fontWeight: 800, 
                          color: 'var(--accent-cyan)',
                          background: 'rgba(6, 182, 212, 0.15)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '3px'
                        }}>
                          #{s.id}
                        </span>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem' }}>
                          {s.nombre}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className={s.fl === 'FORANEO' ? 'badge-fl-foraneo' : 'badge-fl-local'}>
                          {s.fl}
                        </span>
                        {isSelected && <Check size={14} color="var(--accent-cyan)" />}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span className="badge-closter" style={{ fontSize: '0.68rem' }}>
                        {s.closter}
                      </span>
                      <span>• {s.region}</span>
                      <span>• Cap. Máx: <strong style={{ color: '#cbd5e1' }}>{s.capMax}</strong></span>
                      {s.restriccion && (
                        <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                          <AlertTriangle size={11} /> {s.restriccion}
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
