import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const ThemeSelector = () => {
  const { theme, setTheme } = useFleet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const THEMES = [
    {
      id: 'aviation',
      name: 'Aviation & Control',
      badge: 'Radar Táctico',
      color: '#10b981',
      desc: 'Antracita mate, verde radar fósforo y ámbar aeronáutico'
    },
    {
      id: 'swiss',
      name: 'Swiss Logistics',
      badge: 'Nórdico Minimal',
      color: '#3b82f6',
      desc: 'Bento Grid, líneas arquitectónicas y azul cobalto'
    },
    {
      id: 'titanium',
      name: 'Executive Titanium',
      badge: 'Lujo Corporativo',
      color: '#d97706',
      desc: 'Grafito pulido, bordes platino y oro champagne'
    },
    {
      id: 'tactical',
      name: 'Tactical Slate',
      badge: 'Consola Automotriz',
      color: '#f97316',
      desc: 'Gris plomo mate, profundidad suave y naranja cockpit'
    }
  ];

  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="theme-selector-container" ref={dropdownRef} style={{ position: 'relative', zIndex: 999999 }}>
      <button
        type="button"
        className="btn btn-secondary theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.45rem 0.75rem',
          fontSize: '0.8rem',
          fontWeight: 700,
          background: 'rgba(255, 255, 255, 0.08)',
          borderColor: currentThemeObj.color + '88',
          color: currentThemeObj.color
        }}
        title="Cambiar diseño visual de la interfaz"
      >
        <Palette size={14} color={currentThemeObj.color} />
        <span className="theme-btn-label">{currentThemeObj.name}</span>
      </button>

      {isOpen && (
        <div 
          className="theme-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: '320px',
            backgroundColor: '#090d16',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '12px',
            padding: '0.75rem',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.98), 0 0 20px rgba(0, 0, 0, 0.8)',
            zIndex: 9999999,
            opacity: 1
          }}
        >
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0.2rem 0.4rem 0.6rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Estilo Visual de Interfaz</span>
            <span style={{ fontSize: '0.68rem', color: currentThemeObj.color, fontWeight: 700 }}>
              {currentThemeObj.badge}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
            {THEMES.map(t => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.6rem',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${t.color}` : '1px solid #1e293b',
                    backgroundColor: isSelected ? 'rgba(30, 41, 59, 0.95)' : '#111827',
                    color: '#ffffff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? `0 0 12px ${t.color}35` : 'none'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span style={{
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: t.color,
                        boxShadow: `0 0 8px ${t.color}`,
                        flexShrink: 0
                      }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isSelected ? t.color : '#f1f5f9' }}>
                        {t.name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', paddingLeft: '1.1rem', lineHeight: 1.3 }}>
                      {t.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: `${t.color}25`,
                      border: `1px solid ${t.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Check size={12} color={t.color} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
