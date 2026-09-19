import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect — reusable styled dropdown matching the BAZ Portal design system.
 *
 * Props:
 *   value        — current selected value
 *   onChange     — (value) => void
 *   options      — [{ value, label, sub?, color? }]
 *   placeholder  — string shown when nothing is selected
 *   searchable   — boolean, shows search box when >6 options
 *   style        — extra style for trigger
 */
export const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  searchable,
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const showSearch = searchable !== false && options.length > 6;

  const selected = options.find(o => String(o.value) === String(value));

  const filtered = options.filter(o => {
    if (!search.trim()) return true;
    return (o.label + (o.sub || '')).toLowerCase().includes(search.toLowerCase());
  });

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

  const handleSelect = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.55rem 0.85rem',
          background: 'var(--bg-card)',
          border: `1px solid ${isOpen ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: isOpen ? '0 0 0 2px rgba(6,182,212,0.15)' : 'none',
          userSelect: 'none',
          minHeight: '38px',
          ...style
        }}
      >
        <span style={{
          fontSize: '0.875rem',
          fontWeight: selected ? 600 : 400,
          color: selected ? (selected.color || '#f1f5f9') : 'var(--text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          color="var(--text-muted)"
          style={{ flexShrink: 0, marginLeft: '0.5rem', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#0f1c2e',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 9999,
          overflow: 'hidden',
          maxHeight: '280px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {showSearch && (
            <div style={{ padding: '0.45rem 0.7rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(6, 182, 212, 0.05)' }}>
              <input
                ref={searchRef}
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '0.82rem', flex: 1, fontFamily: 'var(--font-sans)' }}
              />
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '0.85rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin resultados</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: '0.52rem 0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                      transition: 'background 0.12s'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent'; }}
                  >
                    <div>
                      <div style={{ fontSize: '0.845rem', fontWeight: isSelected ? 700 : 500, color: opt.color || (isSelected ? 'var(--accent-cyan)' : '#f1f5f9') }}>
                        {opt.label}
                      </div>
                      {opt.sub && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{opt.sub}</div>
                      )}
                    </div>
                    {isSelected && <Check size={14} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />}
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
