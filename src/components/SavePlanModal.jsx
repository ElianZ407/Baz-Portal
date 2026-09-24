import React, { useState } from 'react';
import { 
  X, 
  BookmarkCheck, 
  CheckCircle2, 
  Save, 
  AlertCircle 
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const SavePlanModal = () => {
  const { 
    units, 
    isSavePlanModalOpen, 
    setIsSavePlanModalOpen, 
    saveCurrentPlan, 
    showAlert 
  } = useFleet();

  const todayStr = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(todayStr);
  const [nombre, setNombre] = useState('');
  const [startNewDay, setStartNewDay] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isSavePlanModalOpen) return null;

  const totalViajes = units.length;
  const completados = units.filter(u => u.estatusPlaneacion === 'COMPLETADO' || u.estatusSupervisor === 'Completado').length;
  const enRuta = units.filter(u => ['En Ruta', 'Espera Descarga', 'Descargando', 'Retorno', 'Retrasado'].includes(u.estatusSupervisor)).length;
  const pendientes = units.filter(u => (!u.estatusPlaneacion || u.estatusPlaneacion === 'PENDIENTE') && !u.estatusSupervisor).length;

  const handleSave = async (e) => {
    e.preventDefault();
    if (totalViajes === 0) {
      showAlert({
        title: 'Sin Viajes Activos',
        message: 'No hay viajes en el tablero actual para guardar.',
        confirmType: 'warning',
        confirmText: 'Entendido'
      });
      return;
    }

    try {
      setIsSaving(true);
      await saveCurrentPlan({
        nombre: nombre.trim() || `Plan del ${fecha}`,
        fecha,
        startNewDay
      });
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsSavePlanModalOpen(false);
      }, 1200);
    } catch (err) {
      setIsSaving(false);
      showAlert({
        title: 'Error al Guardar Plan',
        message: 'Ocurrió un error al guardar el plan: ' + err.message,
        confirmType: 'danger',
        confirmText: 'Entendido'
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsSavePlanModalOpen(false)}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '560px', border: '1px solid rgba(6, 182, 212, 0.35)', background: '#0d1527' }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.15)',
              padding: '0.45rem',
              borderRadius: '8px',
              display: 'flex',
              color: 'var(--accent-cyan)'
            }}>
              <BookmarkCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Guardar Plan / Día Operativo
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                Guarda una instantánea completa para historial y reportes
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setIsSavePlanModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {saveSuccess ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <CheckCircle2 size={46} color="#34d399" style={{ margin: '0 auto 0.8rem' }} />
            <h4 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.3rem' }}>
              ¡Plan Guardado con Éxito!
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              {startNewDay 
                ? 'El día fue archivado y el tablero se reinició limpio para el nuevo turno.' 
                : 'El plan fue registrado en el historial y puedes seguir editando.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ padding: '1.25rem 1.4rem' }}>
            {/* Resumen del Tablero Actual */}
            <div style={{
              background: '#101b30',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.2rem'
            }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Resumen de Unidades a Guardar
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginTop: '0.5rem', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.45rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f1f5f9', fontFamily: 'var(--font-mono)' }}>{totalViajes}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Totales</div>
                </div>
                <div style={{ background: 'rgba(16,185,129,0.08)', padding: '0.45rem', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>{completados}</div>
                  <div style={{ fontSize: '0.65rem', color: '#6ee7b7' }}>Completados</div>
                </div>
                <div style={{ background: 'rgba(6,182,212,0.08)', padding: '0.45rem', borderRadius: '6px', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>{enRuta}</div>
                  <div style={{ fontSize: '0.65rem', color: '#67e8f9' }}>En Ruta</div>
                </div>
                <div style={{ background: 'rgba(234,179,8,0.08)', padding: '0.45rem', borderRadius: '6px', border: '1px solid rgba(234,179,8,0.2)' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#facc15', fontFamily: 'var(--font-mono)' }}>{pendientes}</div>
                  <div style={{ fontSize: '0.65rem', color: '#fde047' }}>Pendientes</div>
                </div>
              </div>
            </div>

            {/* Inputs de Fecha y Nombre */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.85rem', marginBottom: '1.1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Fecha del Plan
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="date"
                    className="form-control"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    required
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.6rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  Nombre / Descripción del Día
                </label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder={`Ej: Plan Embarques ${fecha} - Turno Matutino`}
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
                />
              </div>
            </div>

            {/* Opción de Cierre de Día / Empezar Limpio */}
            <div 
              style={{
                background: startNewDay ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                border: startNewDay ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '1.4rem'
              }}
              onClick={() => setStartNewDay(prev => !prev)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <input 
                  type="checkbox" 
                  checked={startNewDay}
                  onChange={e => setStartNewDay(e.target.checked)}
                  style={{ marginTop: '0.2rem', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                  onClick={e => e.stopPropagation()}
                />
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: startNewDay ? '#34d399' : '#f1f5f9' }}>
                    Guardar y Comenzar Nuevo Día (Limpiar Tablero Activo)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem', lineHeight: '1.3' }}>
                    Archiva este plan en el historial y reinicia el tablero operativo en 0 para programar los viajes del día de mañana.
                  </div>
                </div>
              </div>
            </div>

            {totalViajes === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.78rem', marginBottom: '1rem' }}>
                <AlertCircle size={15} />
                <span>El tablero actual está vacío. Registra viajes antes de guardar un plan.</span>
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setIsSavePlanModalOpen(false)}
                style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSaving || totalViajes === 0}
                style={{ 
                  fontSize: '0.82rem', 
                  padding: '0.45rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  opacity: (isSaving || totalViajes === 0) ? 0.6 : 1
                }}
              >
                <Save size={15} />
                <span>{isSaving ? 'Guardando...' : (startNewDay ? 'Guardar y Nuevo Día' : 'Guardar en Historial')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
