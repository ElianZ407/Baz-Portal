import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, ChevronDown, Check, X, User, UserPlus, Clock, Hash } from 'lucide-react';
import { FLOTA_TOTAL } from '../constants/fleetConstants';
import { useFleet } from '../context/FleetContext';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #0284c7, #0369a1)',
  'linear-gradient(135deg, #0d9488, #115e59)',
  'linear-gradient(135deg, #059669, #047857)',
  'linear-gradient(135deg, #7c3aed, #6d28d9)',
  'linear-gradient(135deg, #d97706, #b45309)',
  'linear-gradient(135deg, #e11d48, #be123c)',
  'linear-gradient(135deg, #4f46e5, #4338ca)',
  'linear-gradient(135deg, #0891b2, #0e7490)'
];

const getInitials = (name) => {
  if (!name) return 'OP';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getAvatarGradient = (name) => {
  if (!name) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  }
  return AVATAR_GRADIENTS[hash];
};

export const OperadorSelector = ({ value, onChange, placeholder = 'Seleccionar Operador Asignado...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const { units, catalogoFlota } = useFleet();

  const allOperadores = useMemo(() => {
    const flotaList = catalogoFlota && Array.isArray(catalogoFlota) && catalogoFlota.length > 0 ? catalogoFlota : FLOTA_TOTAL;
    
    const fromUnits = (units || [])
      .filter((u) => u.operador && u.operador.trim().length > 2 && u.operador !== 'VACANTE' && u.operador !== 'BAJA')
      .map((u) => ({
        nombre: u.operador.trim().toUpperCase(),
        idOperador: u.idOperador || '',
        source: 'recent',
        eco: u.economico || '',
        numCarga: u.numCarga || '',
        linea: u.linea || '',
        telefono: u.telefono || ''
      }));

    const fromCatalog = flotaList
      .filter((u) => u.operador && u.operador !== 'VACANTE' && u.operador !== 'BAJA' && u.estatus === 'ACTIVO')
      .map((u) => ({
        nombre: u.operador.trim().toUpperCase(),
        idOperador: u.idOperador || '',
        source: 'catalog',
        eco: u.eco || '',
        linea: u.linea || '',
        telefono: u.telefono || ''
      }));

    const seen = new Set();
    const merged = [];

    for (const op of fromUnits) {
      const key = op.nombre.toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({ ...op, nombre: key });
      }
    }

    for (const op of fromCatalog) {
      const key = op.nombre.toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push({ ...op, nombre: key });
      }
    }

    return merged.sort((a, b) => {
      if (a.source === 'recent' && b.source !== 'recent') return -1;
      if (b.source === 'recent' && a.source !== 'recent') return 1;
      return a.nombre.localeCompare(b.nombre, 'es');
    });
  }, [units, catalogoFlota]);

  const selectedOp = useMemo(() => {
    if (!value) return null;
    const cleanVal = String(value).trim().toUpperCase();
    return allOperadores.find((o) => o.nombre.toUpperCase() === cleanVal) || null;
  }, [allOperadores, value]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allOperadores.filter((op) => {
      const matchesSearch = !q || 
        op.nombre.toLowerCase().includes(q) || 
        String(op.idOperador || '').toLowerCase().includes(q) ||
        String(op.eco || '').toLowerCase().includes(q) ||
        String(op.linea || '').toLowerCase().includes(q);

      const matchesCategory = 
        categoryFilter === 'ALL' ||
        (categoryFilter === 'RECENT' && op.source === 'recent') ||
        (categoryFilter === 'CATALOG' && op.source === 'catalog');

      return matchesSearch && matchesCategory;
    });
  }, [allOperadores, search, categoryFilter]);

  const recentCount = useMemo(() => allOperadores.filter((o) => o.source === 'recent').length, [allOperadores]);
  const catalogCount = useMemo(() => allOperadores.filter((o) => o.source === 'catalog').length, [allOperadores]);

  const categories = [
    { id: 'ALL', label: `Todos (${allOperadores.length})` },
    { id: 'RECENT', label: `En Ruta (${recentCount})` },
    { id: 'CATALOG', label: `Padrón VHS (${catalogCount})` }
  ];

  const searchClean = search.trim();
  const exactMatch = useMemo(() => {
    if (!searchClean) return true;
    return allOperadores.some((o) => o.nombre.toUpperCase() === searchClean.toUpperCase());
  }, [allOperadores, searchClean]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        if (searchRef.current) searchRef.current.focus();
      }, 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      setSearch('');
      setFocusedIndex(-1);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = useCallback((op) => {
    onChange(op.nombre, op.idOperador || '');
    setIsOpen(false);
    setSearch('');
  }, [onChange]);

  const handleSelectCustom = useCallback((customName) => {
    const formatted = customName.trim().toUpperCase();
    onChange(formatted, '');
    setIsOpen(false);
    setSearch('');
  }, [onChange]);

  const handleClear = () => {
    onChange('', '');
    setSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filtered.length) {
        handleSelect(filtered[focusedIndex]);
      } else if (searchClean && !exactMatch) {
        handleSelectCustom(searchClean);
      } else if (filtered.length > 0) {
        handleSelect(filtered[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const children = listRef.current.querySelectorAll('.custom-select-option-item');
      if (children[focusedIndex]) {
        children[focusedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  return (
    <div className="custom-select-container" ref={dropdownRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
      >
        {selectedOp ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', flex: 1 }}>
            <div 
              className="operator-avatar-circle"
              style={{ background: getAvatarGradient(selectedOp.nombre) }}
            >
              {getInitials(selectedOp.nombre)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '0.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: '0.85rem' }}>
                  {selectedOp.nombre}
                </span>
                {selectedOp.idOperador && (
                  <span className="operator-id-pill">
                    <Hash size={10} /> {selectedOp.idOperador}
                  </span>
                )}
                {selectedOp.eco && (
                  <span className="eco-pill" style={{ fontSize: '0.72rem', padding: '0.08rem 0.35rem' }}>
                    ECO {selectedOp.eco}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : value ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden', flex: 1 }}>
            <div 
              className="operator-avatar-circle"
              style={{ background: getAvatarGradient(value) }}
            >
              {getInitials(value)}
            </div>
            <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.85rem' }}>
              {value}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--text-muted)' }}>
            <User size={15} color="var(--accent-cyan)" />
            <span>{placeholder}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto', flexShrink: 0 }}>
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              title="Quitar operador asignado"
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
          <ChevronDown 
            size={16} 
            color="var(--text-muted)" 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'none', 
              transition: 'transform 0.2s ease' 
            }} 
          />
        </div>
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          <div className="custom-select-search-box">
            <Search size={15} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <input 
              ref={searchRef}
              type="text"
              placeholder="Buscar por nombre, nómina, ECO o línea..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
            />
            {search && (
              <button 
                type="button" 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
                onClick={() => {
                  setSearch('');
                  if (searchRef.current) searchRef.current.focus();
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="custom-select-filter-chips">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`custom-chip-btn ${categoryFilter === c.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryFilter(c.id);
                  setFocusedIndex(-1);
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          {searchClean && !exactMatch && (
            <div 
              className="operator-custom-card"
              onClick={() => handleSelectCustom(searchClean)}
            >
              <div 
                className="operator-avatar-circle"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', width: '26px', height: '26px' }}
              >
                <UserPlus size={13} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#34d399' }}>
                  Asignar: &quot;{searchClean.toUpperCase()}&quot;
                </div>
                <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
                  Guardar como operador externo o nuevo ingreso
                </div>
              </div>
            </div>
          )}

          <div className="custom-select-options-list" ref={listRef}>
            {filtered.length === 0 && !searchClean ? (
              <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No hay operadores registrados en este filtro.
              </div>
            ) : filtered.length === 0 && searchClean ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No se encontró ningún operador con ese nombre en catálogo. Haz clic arriba para asignarlo como nuevo.
              </div>
            ) : (
              filtered.map((op, idx) => {
                const isSelected = (value || '').toUpperCase() === op.nombre.toUpperCase();
                const isFocused = idx === focusedIndex;
                const isRecent = op.source === 'recent';

                return (
                  <div
                    key={`${op.nombre}-${op.idOperador || idx}`}
                    className={`custom-select-option-item ${isSelected ? 'selected' : ''}`}
                    style={isFocused ? { borderColor: 'var(--accent-cyan)', background: '#132038' } : undefined}
                    onClick={() => handleSelect(op)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                        <div 
                          className="operator-avatar-circle"
                          style={{ background: getAvatarGradient(op.nombre) }}
                        >
                          {getInitials(op.nombre)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', minWidth: 0 }}>
                          <span style={{ 
                            fontWeight: 800, 
                            fontSize: '0.84rem', 
                            color: isSelected ? 'var(--accent-cyan)' : '#f1f5f9',
                            letterSpacing: '0.01em',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {op.nombre}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {op.idOperador ? (
                              <span className="operator-id-pill">
                                <Hash size={10} /> {op.idOperador}
                              </span>
                            ) : null}
                            {op.eco ? (
                              <span className="eco-pill" style={{ fontSize: '0.70rem', padding: '0.08rem 0.35rem' }}>
                                ECO {op.eco}
                              </span>
                            ) : null}
                            {op.linea ? (
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {op.linea}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                        {isRecent ? (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            fontSize: '0.68rem', 
                            fontWeight: 800, 
                            background: 'rgba(6, 182, 212, 0.15)', 
                            color: '#22d3ee', 
                            border: '1px solid rgba(6, 182, 212, 0.35)', 
                            borderRadius: '4px', 
                            padding: '0.15rem 0.45rem' 
                          }}>
                            <Clock size={10} /> En Ruta
                          </span>
                        ) : (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem', 
                            fontSize: '0.68rem', 
                            fontWeight: 700, 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            color: '#94a3b8', 
                            border: '1px solid rgba(255, 255, 255, 0.1)', 
                            borderRadius: '4px', 
                            padding: '0.15rem 0.45rem' 
                          }}>
                            Padrón
                          </span>
                        )}
                        {isSelected && (
                          <Check size={16} color="var(--accent-cyan)" strokeWidth={2.8} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ 
            padding: '0.45rem 0.85rem', 
            borderTop: '1px solid var(--border-color)', 
            fontSize: '0.70rem', 
            color: 'var(--text-muted)', 
            background: 'rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>{filtered.length} operadores listados ({recentCount} en ruta)</span>
            <span style={{ color: '#64748b' }}>Enter para seleccionar · Esc para cerrar</span>
          </div>
        </div>
      )}
    </div>
  );
};
