import React from 'react';
import { Eye, ArrowLeft, RefreshCw, Calendar } from 'lucide-react';
import { useFleet } from '../context/FleetContext';

export const HistoricalBanner = () => {
  const { 
    isViewingHistorical, 
    historicalPlanView, 
    exitHistoricalPlanView, 
    restorePlanAsActive,
    showConfirm
  } = useFleet();

  if (!isViewingHistorical || !historicalPlanView) return null;

  const handleConfirmRestore = () => {
    showConfirm({
      title: `¿Restaurar "${historicalPlanView.nombre}" como Plan Activo?`,
      message: `Esta acción cargará los ${historicalPlanView.totalViajes} viajes en el tablero activo. Se creará automáticamente un respaldo de tu plan actual en el Historial para que nunca pierdas nada.`,
      confirmText: 'Sí, Restaurar con Respaldo',
      confirmType: 'primary',
      onConfirm: () => {
        restorePlanAsActive(historicalPlanView.id);
      }
    });
  };

  return (
    <div className="historical-banner-bar">
      <div className="historical-banner-left">
        <div className="historical-badge-pulse">
          <Eye size={16} />
          <span>MODO CONSULTA HISTÓRICA</span>
        </div>
        <div className="historical-banner-info">
          <span className="historical-plan-name">
            {historicalPlanView.nombre}
          </span>
          <span className="historical-plan-meta">
            <Calendar size={13} />
            <span>{historicalPlanView.fecha}</span>
            <span>•</span>
            <span>{historicalPlanView.totalViajes} Viajes</span>
          </span>
        </div>
      </div>

      <div className="historical-banner-actions">
        <button 
          className="btn btn-primary btn-exit-historical"
          onClick={exitHistoricalPlanView}
          title="Regresar a tu plan actual de trabajo sin modificar nada"
        >
          <ArrowLeft size={16} />
          <span>Volver a mi Plan de Hoy</span>
        </button>

        <button 
          className="btn btn-secondary btn-restore-historical"
          onClick={handleConfirmRestore}
          title="Reemplazar el día de hoy por este plan (con respaldo automático de seguridad)"
        >
          <RefreshCw size={14} />
          <span>Restaurar como Activo</span>
        </button>
      </div>
    </div>
  );
};
