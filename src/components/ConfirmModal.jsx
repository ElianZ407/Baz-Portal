import React, { useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  MapPin, 
  UserCheck, 
  CheckCircle2 
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const ConfirmModal = () => {
  const { confirmModal, closeConfirm } = useFleet();

  useEffect(() => {
    if (!confirmModal?.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeConfirm();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (confirmModal.onConfirm) {
          confirmModal.onConfirm();
        }
        closeConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal, closeConfirm]);

  if (!confirmModal || !confirmModal.isOpen) return null;

  const {
    title = '¿Confirmar acción?',
    message = '',
    unit = null,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmType = 'danger',
    hideCancel = false,
    onConfirm
  } = confirmModal;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    closeConfirm();
  };

  const getIcon = () => {
    if (confirmType === 'danger') {
      return <Trash2 size={22} />;
    }
    if (confirmType === 'warning') {
      return <AlertTriangle size={22} />;
    }
    if (confirmType === 'primary') {
      return <CheckCircle2 size={22} />;
    }
    return <AlertTriangle size={22} />;
  };

  return (
    <div 
      className="confirm-modal-overlay" 
      onClick={closeConfirm}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="confirm-modal-box" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-header">
          <div className={`confirm-icon-wrap ${confirmType}`}>
            {getIcon()}
          </div>
          <div className="confirm-text-area">
            <h3>{title}</h3>
            {message && <p style={{ whiteSpace: 'pre-line' }}>{message}</p>}
          </div>
          <button 
            className="confirm-close-btn" 
            onClick={closeConfirm}
            title="Cerrar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {unit && (
          <div className="confirm-unit-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="eco-pill">ECO {unit.economico}</span>
              <span style={{ 
                fontSize: '0.75rem', 
                background: 'rgba(255,255,255,0.08)', 
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                color: 'var(--text-secondary)'
              }}>
                {unit.tipo}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.35rem' }}>
              {unit.operador && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fff' }}>
                  <UserCheck size={13} color="var(--accent-cyan)" />
                  <span><strong>Operador:</strong> {unit.operador}</span>
                </div>
              )}
              {unit.destino && unit.destino !== 'Sin asignar' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={13} color="#fbbf24" />
                  <span><strong>Destino:</strong> {unit.destino}</span>
                </div>
              )}
              {unit.placas && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Placas: <strong style={{ color: '#cbd5e1' }}>{unit.placas}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="confirm-modal-footer">
          {!hideCancel && (
            <button 
              type="button" 
              className="btn-confirm-cancel" 
              onClick={closeConfirm}
            >
              {cancelText}
            </button>
          )}
          <button 
            type="button" 
            className={`btn-confirm-action ${confirmType}`}
            onClick={handleConfirm}
            autoFocus
          >
            {getIcon()}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );

};
