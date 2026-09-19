import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, User, Clock } from 'lucide-react';
import { FLOTA_TOTAL } from '../data/flotaMaestraData';
import { useFleet } from '../context/FleetContext';

export const OperadorSelector = ({ value, onChange, placeholder = 'Ej: ANTONIO PEREZ PALMA...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  const { units } = useFleet();

  const allOperadores = useMemo(() => {
    const fromCatalog = FLOTA_TOTAL
      .filter(u => u.operador && u.operador !== 'VACANTE' && u.operador !== 'BAJA' && u.estatus === 'ACTIVO')
      .map(u => ({ nombre: u.operador, idOperador: u.idOperador || '', source: 'catalog', eco: u.eco }));

    const fromUnits = (units || [])
      .filter(u => u.operador && u.operador.trim().length > 2)
      .map(u => ({
        nombre: u.operador.trim().toUpperCase(),
        idOperador: u.idOperador || '',
        source: 'recent',
        eco: u.economico,
        numCarga: u.numCarga,
        cortina: u.cortina,
        closter: u.closter
      }));

    const seen = new Set();
    const merged = [];
    for (const op of fromUnits) {
      const key = op.nombre.toUpperCase();
      if (!seen.has(key)) { seen.add(key); merged.push({ ...op, nombre: key }); }
    }
    for (const op of fromCatalog) {
      const key = op.nombre.toUpperCase();
      if (!seen.has(key)) { seen.add(key); merged.push({ ...op, nombre: key }); }
    }
    return merged;
  }, [units]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allOperadores.slice(0, 30);
    return allOperadores.filter(op => op.nombre.toLowerCase().includes(q)).slice(0, 20);
  }, [allOperadores, search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => { if (searchRef.current) searchRef.current.focus(); }, 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (op) => { onChange(op.nombre); setIsOpen(false); setSearch(''); };
  const handleInputChange = (e) => onChange(e.target.value.toUpperCase());
  const handleClear = () => { onChange(''); setSearch(''); if (inputRef.current) inputRef.current.focus(); };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <User size={14} style={{ position: 'absolute', left: '0.7rem', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
        <input
          ref={inputRef}
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          style={{ paddingLeft: '2rem', paddingRight: '4rem', fontWeight: value ? 600 : 400, color: value ? '#f1f5f9' : undefined }}
        />
        <div style={{ position: 'absolute', right: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
          {value && (
            <button type="button" onClick={handleClear} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
              <X size={13} />
            </button>
          )}
          <button type="button" onClick={() => setIsOpen(o => !o)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex' }}>
            <ChevronDown size={15} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#0f1c2e', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 9999, overflow: 'hidden', maxHeight: '320px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6, 182, 212, 0.05)' }}>
            <Search size={14} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <input ref={searchRef} type="text" placeholder="Buscar operador..." value={search} onChange={(e) => setSearch(e.target.value)} onClick={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.83rem', flex: 1, fontFamily: 'var(--font-sans)' }} />
            {search && <button type="button" onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={13} /></button>}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '1.1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No se encontraron operadores. Puedes escribir uno nuevo arriba.</div>
            ) : (
              filtered.map((op, idx) => {
                const isSelected = (value || '').toUpperCase() === op.nombre;
                const isRecent = op.source === 'recent';
                return (
                  <div key={`${op.nombre}-${idx}`} onClick={() => handleSelect(op)}
                    style={{ padding: '0.6rem 0.85rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'rgba(6, 182, 212, 0.18)' : 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={13} color={isRecent ? '#22d3ee' : '#64748b'} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, fontSize: '0.83rem', color: isSelected ? 'var(--accent-cyan)' : '#f1f5f9', letterSpacing: '0.01em' }}>{op.nombre}</span>
                      </div>
                      {isRecent && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.65rem', fontWeight: 700, background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '4px', padding: '0.1rem 0.4rem' }}>
                          <Clock size={9} />Reciente
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ padding: '0.4rem 0.85rem', borderTop: '1px solid var(--border-color)', fontSize: '0.69rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)' }}>
            {allOperadores.filter(o => o.source === 'recent').length} recientes · {allOperadores.filter(o => o.source === 'catalog').length} en catálogo
          </div>
        </div>
      )}
    </div>
  );
};
