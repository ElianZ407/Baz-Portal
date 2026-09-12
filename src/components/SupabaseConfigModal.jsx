import React, { useState } from 'react';
import { Database, X, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, Key, Globe, RefreshCw } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { getSupabaseCredentials, saveSupabaseCredentials, clearSupabaseCredentials } from '../lib/supabaseClient';

export const SupabaseConfigModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const { isCloudConnected, isCloudLoading, reloadCloudData } = useFleet();
  const currentCreds = getSupabaseCredentials();

  const [url, setUrl] = useState(currentCreds.url || '');
  const [key, setKey] = useState(currentCreds.key || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = () => {
    if (!url || !key) {
      alert('Por favor ingresa tanto la URL del proyecto como la Anon Public Key.');
      return;
    }

    if (!url.startsWith('https://')) {
      alert('La URL debe comenzar con https:// (ejemplo: https://xyzcompany.supabase.co)');
      return;
    }

    saveSupabaseCredentials(url, key);
    setSavedMsg(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleDisconnect = () => {
    if (window.confirm('¿Desconectar la base de datos en la nube y volver al modo de almacenamiento local?')) {
      clearSupabaseCredentials();
      window.location.reload();
    }
  };

  const handleCopySqlInfo = () => {
    // Leer el archivo o dar indicación
    navigator.clipboard.writeText(
      `-- El archivo supabase_schema.sql se encuentra generado en la raíz del proyecto.\n-- Ábrelo o cópialo directamente al SQL Editor de Supabase.`
    );
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 12000 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '640px', width: '92%', borderRadius: '16px', padding: '0', overflow: 'hidden' }}
      >
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98))',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)'
            }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>
                Base de Datos en la Nube (Supabase)
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                Sincronización en vivo y en tiempo real entre múltiples dispositivos
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-secondary btn-icon-only"
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', maxHeight: '78vh', overflowY: 'auto' }}>
          
          {/* Status Banner */}
          <div style={{
            padding: '1rem',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isCloudConnected 
              ? 'rgba(16, 185, 129, 0.12)' 
              : 'rgba(245, 158, 11, 0.12)',
            border: isCloudConnected 
              ? '1px solid rgba(16, 185, 129, 0.35)' 
              : '1px solid rgba(245, 158, 11, 0.35)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isCloudConnected ? (
                <CheckCircle2 size={24} color="#10b981" />
              ) : (
                <AlertCircle size={24} color="#f59e0b" />
              )}
              <div>
                <div style={{ 
                  fontWeight: 700, 
                  fontSize: '0.95rem',
                  color: isCloudConnected ? '#10b981' : '#f59e0b' 
                }}>
                  {isCloudConnected 
                    ? 'Conectado a la Nube (Real-Time Activo)' 
                    : 'Modo Local (Sin Conexión Central)'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {isCloudConnected 
                    ? 'Cualquier cambio se sincroniza al instante en computadoras, caseta, celulares y TV.' 
                    : 'Los datos se guardan solo en este navegador. Para sincronizar varios dispositivos, conecta tu proyecto.'}
                </div>
              </div>
            </div>

            {isCloudConnected && (
              <button 
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() => reloadCloudData()}
                title="Forzar actualización de datos"
              >
                <RefreshCw size={14} className={isCloudLoading ? 'spin-anim' : ''} />
                <span>Refrescar</span>
              </button>
            )}
          </div>

          {/* Quick Steps Guide */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-cyan)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚀</span> ¿Cómo activar la nube en 3 minutos?
            </div>
            <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.6' }}>
              <li>
                Crea una cuenta o inicia sesión gratis en{' '}
                <a 
                  href="https://supabase.com" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: '#38bdf8', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                >
                  supabase.com <ExternalLink size={12} />
                </a>
                {' '}y crea un nuevo proyecto (ej. <strong>baz-villahermosa</strong>).
              </li>
              <li>
                En Supabase, ve al menú izquierdo <strong>SQL Editor</strong>, pega y ejecuta el archivo:
                <div style={{ 
                  margin: '0.4rem 0', 
                  padding: '0.4rem 0.6rem', 
                  background: 'rgba(0,0,0,0.35)', 
                  borderRadius: '6px', 
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <span style={{ color: 'var(--accent-green)' }}>supabase_schema.sql</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                    (Crea viajes_diarios, 45 unidades y 80+ tiendas)
                  </span>
                </div>
              </li>
              <li>
                Ve a <strong>Project Settings → API</strong> en Supabase, copia tu <strong>Project URL</strong> y tu <strong>anon public key</strong>, y pégalos abajo.
              </li>
            </ol>
          </div>

          {/* Form Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                fontSize: '0.82rem', 
                fontWeight: 600, 
                color: '#e2e8f0', 
                marginBottom: '0.35rem' 
              }}>
                <Globe size={15} color="var(--accent-cyan)" />
                <span>Project URL de Supabase</span>
              </label>
              <input 
                type="text"
                placeholder="https://xyzabcdefghijklmnop.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                fontSize: '0.82rem', 
                fontWeight: 600, 
                color: '#e2e8f0', 
                marginBottom: '0.35rem' 
              }}>
                <Key size={15} color="var(--accent-green)" />
                <span>Anon Public API Key</span>
              </label>
              <textarea 
                rows={2}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {savedMsg && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid #10b981',
              color: '#10b981',
              fontSize: '0.85rem',
              textAlign: 'center',
              fontWeight: 600
            }}>
              ✓ Credenciales guardadas. Conectando y recargando aplicación...
            </div>
          )}

          {/* Buttons Footer */}
          <div style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <div>
              {isCloudConnected && (
                <button 
                  onClick={handleDisconnect}
                  className="btn btn-secondary"
                  style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                >
                  Desconectar Nube
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cerrar
              </button>

              <button 
                onClick={handleSave}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderColor: '#10b981',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                <Database size={16} />
                <span>Guardar y Conectar</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
