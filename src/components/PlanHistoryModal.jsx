import React, { useState, useMemo } from 'react';
import { 
  X, 
  History, 
  Search, 
  Calendar, 
  FileSpreadsheet, 
  UploadCloud, 
  Trash2, 
  CheckCircle2, 
  Truck, 
  Clock, 
  Bookmark,
  ArrowRight,
  AlertTriangle,
  Eye,
  RotateCcw
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { exportOfficialExcel } from '../utils/exportOfficialExcel';

export const PlanHistoryModal = () => {
  const { 
    savedPlans, 
    isHistoryModalOpen, 
    setIsHistoryModalOpen, 
    viewHistoricalPlan,
    restorePlanAsActive,
    loadSavedPlan, 
    deleteSavedPlan,
    setIsSavePlanModalOpen,
    showConfirm,
    showAlert
  } = useFleet();

  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const filteredPlans = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return savedPlans;
    return savedPlans.filter(p => 
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.fecha && p.fecha.toLowerCase().includes(q))
    );
  }, [savedPlans, searchTerm]);

  if (!isHistoryModalOpen) return null;

  const handleDownloadExcel = async (plan) => {
    try {
      setDownloadingId(plan.id);
      await exportOfficialExcel(plan.unidades || [], plan.fecha);
      setDownloadingId(null);
    } catch (err) {
      setDownloadingId(null);
      console.error('Error al exportar Excel histórico:', err);
      showAlert({
        title: 'Error al Generar Excel',
        message: 'Ocurrió un error al generar el archivo Excel: ' + err.message,
        confirmType: 'danger',
        confirmText: 'Entendido'
      });
    }
  };

  const handleViewPlan = (plan) => {
    viewHistoricalPlan(plan.id);
  };

  const handleRestorePlan = (plan) => {
    showConfirm({
      title: `¿Restaurar "${plan.nombre}" como Plan Activo?`,
      message: `Esta acción cargará los ${plan.totalViajes} viajes en el tablero activo. Para proteger tu trabajo, el sistema guardará automáticamente una copia de respaldo de tu plan actual en el Historial para que nunca pierdas nada.`,
      confirmText: 'Sí, Restaurar con Respaldo',
      confirmType: 'primary',
      onConfirm: async () => {
        await restorePlanAsActive(plan.id);
      }
    });
  };

  const handleDeletePlan = (plan) => {
    showConfirm({
      title: `¿Eliminar del historial?`,
      message: `¿Estás seguro de eliminar el registro "${plan.nombre}" (${plan.fecha})? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, Eliminar',
      confirmType: 'danger',
      onConfirm: async () => {
        await deleteSavedPlan(plan.id);
      }
    });
  };

  return (
    <div className="modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '780px', 
          maxHeight: '88vh', 
          border: '1px solid rgba(6, 182, 212, 0.35)', 
          background: '#0d1527',
          display: 'flex',
          flexDirection: 'column'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '1rem 1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.15)',
              padding: '0.45rem',
              borderRadius: '8px',
              display: 'flex',
              color: 'var(--accent-cyan)'
            }}>
              <History size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Historial de Planes y Días Guardados
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0' }}>
                {savedPlans.length} {savedPlans.length === 1 ? 'plan archivado' : 'planes archivados'} · Consulta, descarga Excel o restaura cualquier día
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setIsHistoryModalOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Buscador y Controles */}
        <div style={{ padding: '0.85rem 1.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', background: '#0a101d' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text"
                className="form-control"
                placeholder="Buscar por fecha (ej: 2026-09-19) o nombre..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.2rem', fontSize: '0.82rem', height: '36px' }}
              />
            </div>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => {
                setIsHistoryModalOpen(false);
                setIsSavePlanModalOpen(true);
              }}
              style={{ fontSize: '0.8rem', padding: '0 0.9rem', height: '36px', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
            >
              <Bookmark size={14} />
              <span>Guardar Día Actual</span>
            </button>
          </div>
        </div>

        {/* Lista de Planes Guardados */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '1rem 1.4rem' }}>
          {filteredPlans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
              <History size={40} style={{ margin: '0 auto 0.8rem', opacity: 0.3 }} />
              <h4 style={{ color: '#f1f5f9', fontWeight: 700, margin: '0 0 0.3rem' }}>
                {searchTerm ? 'No se encontraron planes con ese filtro' : 'Aún no hay planes guardados'}
              </h4>
              <p style={{ fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto 1.2rem' }}>
                {searchTerm 
                  ? 'Intenta buscar con otra fecha o término.' 
                  : 'Guarda el plan operativo de hoy para archivarlo en el historial y poder consultarlo o descargarlo en cualquier momento.'}
              </p>
              {!searchTerm && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setIsHistoryModalOpen(false);
                    setIsSavePlanModalOpen(true);
                  }}
                  style={{ fontSize: '0.82rem', padding: '0.45rem 1.1rem' }}
                >
                  Guardar Plan Actual Ahora
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredPlans.map(plan => {
                const unidades = plan.unidades || [];
                const ecos = unidades.map(u => u.economico).filter(Boolean);
                const isDownloading = downloadingId === plan.id;

                return (
                  <div 
                    key={plan.id}
                    style={{
                      background: '#101b30',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem 1.15rem',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    {/* Fila Superior: Título, Fecha y Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.6rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <span style={{ 
                            background: 'rgba(6, 182, 212, 0.15)', 
                            color: 'var(--accent-cyan)', 
                            padding: '0.2rem 0.55rem', 
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Calendar size={12} />
                            {plan.fecha}
                          </span>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#fff' }}>
                            {plan.nombre}
                          </h4>
                        </div>
                        {plan.createdAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Clock size={11} />
                            Guardado: {new Date(plan.createdAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>

                      {/* Métricas de este plan */}
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '0.74rem', 
                          fontWeight: 700, 
                          padding: '0.2rem 0.55rem', 
                          borderRadius: '4px', 
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#f1f5f9'
                        }}>
                          {plan.totalViajes} viajes
                        </span>
                        <span style={{ 
                          fontSize: '0.74rem', 
                          fontWeight: 700, 
                          padding: '0.2rem 0.55rem', 
                          borderRadius: '4px', 
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                          {plan.totalCompletados} completados
                        </span>
                      </div>
                    </div>

                    {/* Resumen de Unidades ECO */}
                    {ecos.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Unidades:</span>
                        {ecos.slice(0, 10).map((eco, i) => (
                          <span key={i} style={{ 
                            fontSize: '0.68rem', 
                            fontWeight: 700, 
                            fontFamily: 'var(--font-mono)',
                            background: 'rgba(6, 182, 212, 0.08)',
                            color: '#22d3ee',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                            border: '1px solid rgba(6, 182, 212, 0.2)'
                          }}>
                            {eco}
                          </span>
                        ))}
                        {ecos.length > 10 && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>+{ecos.length - 10} más</span>
                        )}
                      </div>
                    )}

                    {/* Barra de Acciones del Plan */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      alignItems: 'center',
                      gap: '0.5rem', 
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
                      paddingTop: '0.65rem',
                      flexWrap: 'wrap'
                    }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => handleDownloadExcel(plan)}
                        disabled={isDownloading}
                        style={{ 
                          fontSize: '0.76rem', 
                          padding: '0.35rem 0.75rem', 
                          gap: '0.35rem',
                          color: '#4ade80',
                          borderColor: 'rgba(34, 197, 94, 0.4)',
                          background: 'rgba(34, 197, 94, 0.08)'
                        }}
                        title="Descargar archivo Excel oficial con los datos de este día"
                      >
                        <FileSpreadsheet size={13} color="#4ade80" />
                        <span>{isDownloading ? 'Generando...' : 'Descargar Excel'}</span>
                      </button>

                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={() => handleViewPlan(plan)}
                        style={{ 
                          fontSize: '0.76rem', 
                          padding: '0.35rem 0.85rem', 
                          gap: '0.35rem',
                          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                          borderColor: '#38bdf8'
                        }}
                        title="Ver y consultar este día en el tablero sin modificar ni borrar tu plan actual"
                      >
                        <Eye size={13} />
                        <span>Ver en Tablero</span>
                      </button>

                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => handleRestorePlan(plan)}
                        style={{ 
                          fontSize: '0.76rem', 
                          padding: '0.35rem 0.75rem', 
                          gap: '0.35rem',
                          color: '#c084fc',
                          borderColor: 'rgba(168, 85, 247, 0.4)',
                          background: 'rgba(168, 85, 247, 0.08)'
                        }}
                        title="Restaurar este plan como el activo (se genera un respaldo automático de tu plan actual)"
                      >
                        <RotateCcw size={13} color="#c084fc" />
                        <span>Restaurar</span>
                      </button>

                      <button 
                        type="button" 
                        className="btn-action-icon"
                        onClick={() => handleDeletePlan(plan)}
                        style={{ color: '#f87171', padding: '0.35rem 0.45rem' }}
                        title="Eliminar este plan del historial"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
