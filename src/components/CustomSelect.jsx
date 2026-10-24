import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, Plus } from 'lucide-react';

export const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  searchable,
  allowCustom = false,
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const showSearch = allowCustom || (searchable !== false && options.length > 5);

  const selected = options.find(o => String(o.value) === String(value)) || (
    value !== undefined && value !== null && value !== ''
      ? { value, label: String(value), sub: allowCustom ? 'Personalizado' : undefined }
      : null
  );

  const filtered = options.filter(o => {
    if (!search.trim()) return true;
    return (String(o.label) + ' ' + (o.sub || '')).toLowerCase().includes(search.toLowerCase());
  });

  const hasExactMatch = options.some(o => 
    String(o.label).toLowerCase() === search.trim().toLowerCase() || 
    String(o.value).toLowerCase() === search.trim().toLowerCase()
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

  const handleSelect = (opt) => {
    onChange(opt.value);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => setIsOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.55rem 0.85rem',
          background: 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${isOpen ? 'var(--accent-cyan, #06b6d4)' : 'rgba(255, 255, 255, 0.12)'}`,
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(6, 182, 212, 0.2)' : 'none',
          userSelect: 'none',
          minHeight: '38px',
          ...style
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
          <span style={{
            fontSize: '0.855rem',
            fontWeight: selected ? 600 : 400,
            color: selected ? (selected.color || '#f1f5f9') : 'var(--text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {selected ? selected.label : placeholder}
          </span>
          {selected?.sub && (
            <span style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              whiteSpace: 'nowrap'
            }}>
              {selected.sub}
            </span>
          )}
        </div>
        <ChevronDown
          size={15}
          color="var(--text-muted)"
          style={{
            flexShrink: 0,
            marginLeft: '0.5rem',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s'
          }}
        />
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: '#0d1929',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.75)',
          zIndex: 9999,
          overflow: 'hidden',
          maxHeight: '290px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {showSearch && (
            <div style={{
              padding: '0.5rem 0.75rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(6, 182, 212, 0.08)'
            }}>
              <Search size={14} color="var(--accent-cyan, #06b6d4)" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar o escribir opción..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f1f5f9',
                  fontSize: '0.82rem',
                  flex: 1,
                  fontFamily: 'var(--font-sans)'
                }}
              />
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {allowCustom && search.trim() && !hasExactMatch && (
              <div
                onClick={() => handleSelect({ value: search.trim(), label: search.trim(), sub: 'Personalizado' })}
                style={{
                  padding: '0.55rem 0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(16, 185, 129, 0.12)',
                  borderBottom: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#34d399',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  transition: 'background 0.12s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)'; }}
              >
                <Plus size={14} color="#34d399" />
                <span>Usar: "<strong>{search.trim()}</strong>" (Personalizado)</span>
              </div>
            )}

            {filtered.length === 0 && (!allowCustom || !search.trim()) ? (
              <div style={{ padding: '0.85rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Sin resultados
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    style={{
                      padding: '0.55rem 0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                      transition: 'background 0.12s'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(6, 182, 212, 0.15)' : 'transparent'; }}
                  >
                    <div>
                      <div style={{
                        fontSize: '0.845rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: opt.color || (isSelected ? 'var(--accent-cyan)' : '#f1f5f9')
                      }}>
                        {opt.label}
                      </div>
                      {opt.sub && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          {opt.sub}
                        </div>
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
