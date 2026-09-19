import React, { useState } from 'react';
import { 
  CalendarClock, 
  Send, 
  Edit3, 
  DoorOpen, 
  Truck, 
  MapPin, 
  Hash, 
  Layers, 
  Search, 
  CheckCircle2, 
  FileSpreadsheet,
  AlertTriangle,
  Compass,
  ArrowRight,
  Wrench,
  Trash2,
  Clock,
  ArrowDownCircle,
  RotateCcw
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { BLOQUES } from '../constants/fleetConstants';
import { validarRestriccionesViaje, buscarSucursal, checkTieneViajeYOperador } from '../utils/fleetUtils';
import { exportOfficialExcel } from '../utils/exportOfficialExcel';

// Configuración de colores e iconos para los estados de Supervisor reflejados en Planeación
const getSupervisorStatusConfig = (status) => {
  switch (status) {
    case 'Descargando':
      return {
        label: 'DESCARGANDO',
        color: '#38bdf8', // Cyan idéntico a supervisor
        bg: 'rgba(56, 189, 248, 0.18)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderColor: '#38bdf8',
        rowBg: 'rgba(56, 189, 248, 0.05)',
        icon: <ArrowDownCircle size={11} />
      };
    case 'En Ruta':
      return {
        label: 'EN RUTA',
        color: '#34d399', // Verde idéntico a supervisor
        bg: 'rgba(16, 185, 129, 0.18)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderColor: '#34d399',
        rowBg: 'rgba(16, 185, 129, 0.05)',
        icon: <ArrowRight size={11} />
      };
    case 'Espera Descarga':
      return {
        label: 'ESPERA DESCARGA',
        color: '#fbbf24', // Ámbar idéntico a supervisor
        bg: 'rgba(245, 158, 11, 0.18)',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        borderColor: '#f59e0b',
        rowBg: 'rgba(245, 158, 11, 0.05)',
        icon: <Clock size={11} />
      };
    case 'Retorno':
      return {
        label: 'RETORNO',
        color: '#c084fc', // Púrpura idéntico a supervisor
        bg: 'rgba(168, 85, 247, 0.18)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        borderColor: '#a855f7',
        rowBg: 'rgba(168, 85, 247, 0.06)',
        icon: <RotateCcw size={11} />
      };
    case 'Retrasado':
      return {
        label: 'RETRASADO / ALERTA',
        color: '#f87171', // Rojo idéntico a supervisor
        bg: 'rgba(239, 68, 68, 0.18)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderColor: '#ef4444',
        rowBg: 'rgba(239, 68, 68, 0.06)',
        icon: <AlertTriangle size={11} />
      };
    default:
      return null;
  }
};

export const PlaneacionView = () => {
  const { 
    units, 
    updateStatus, 
    setSelectedUnit, 
    setIsModalOpen, 
    deleteUnit,
    showConfirm,
    showAlert,
    catalogoSucursales,
    searchQuery, 
    setSearchQuery 
  } = useFleet();

  const [filterBloque, setFilterBloque] = useState('ALL');
  const [filterFL, setFilterFL] = useState('ALL'); // 'ALL' | 'LOCAL' | 'FORANEO'
  const [filterEstatus, setFilterEstatus] = useState('ALL'); // 'ALL' | 'PENDIENTE' | 'COLOCADO' | 'CARGADO' | 'TALLER'

  // Filtrado de unidades en planeación:
  // Aparecen TODAS las unidades que están en patio (Disponible, Colocado p/ Carga, Cargado) y las que están en taller.
  const SUPERVISOR_ACTIVE_STATUSES = ['En Ruta', 'Espera Descarga', 'Descargando', 'Retorno', 'Retrasado', 'Completado'];

  const planeacionBaseUnits = units.filter(u => {
    const isTaller = u.estatusPatio === 'Taller' || u.estatus === 'TALLER';
    const isPatio = ['Disponible', 'Colocado p/ Carga', 'Cargado'].includes(u.estatusPatio) || !u.estatusPatio;
    return isPatio || isTaller;
  });

  const planeacionUnits = planeacionBaseUnits.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (u.economico && u.economico.toLowerCase().includes(q)) ||
      (u.operador && u.operador.toLowerCase().includes(q)) ||
      (u.destino && u.destino.toLowerCase().includes(q)) ||
      (u.numCarga && u.numCarga.toLowerCase().includes(q)) ||
      (u.placas && u.placas.toLowerCase().includes(q)) ||
      (u.cortina && u.cortina.toLowerCase().includes(q)) ||
      (u.closter && u.closter.toLowerCase().includes(q));

    const isTaller = u.estatusPatio === 'Taller' || u.estatus === 'TALLER';
    const matchesBloque = filterBloque === 'ALL' || String(u.bloque) === filterBloque;
    const matchesFL = filterFL === 'ALL' || (u.fl || 'LOCAL') === filterFL;
    
    let matchesEstatus = true;
    if (filterEstatus === 'ALL') {
      matchesEstatus = true;
    } else if (filterEstatus === 'TALLER') {
      matchesEstatus = isTaller;
    } else {
      matchesEstatus = !isTaller && (u.estatusPlaneacion || 'PENDIENTE') === filterEstatus;
    }

    return matchesSearch && matchesBloque && matchesFL && matchesEstatus;
  });

  const cargadoCount = planeacionBaseUnits.filter(u => u.estatusPatio !== 'Taller' && u.estatusPlaneacion === 'CARGADO').length;
  const colocadoCount = planeacionBaseUnits.filter(u => u.estatusPatio !== 'Taller' && u.estatusPlaneacion === 'COLOCADO').length;
  const pendienteCount = planeacionBaseUnits.filter(u => u.estatusPatio !== 'Taller' && (u.estatusPlaneacion || 'PENDIENTE') === 'PENDIENTE').length;
  const tallerCount = planeacionBaseUnits.filter(u => u.estatusPatio === 'Taller' || u.estatus === 'TALLER').length;
  const disponiblesPatioCount = planeacionBaseUnits.filter(u => u.estatusPatio === 'Disponible').length;

  const viajesLocales = planeacionBaseUnits.filter(u => (u.fl || 'LOCAL') === 'LOCAL');
  const viajesForaneos = planeacionBaseUnits.filter(u => u.fl === 'FORANEO');

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const handleStatusChange = (unitId, newStatus) => {
    const target = units.find(u => u.id === unitId);
    if (!target) return;

    // Si la unidad está en taller, no se puede cambiar estatus ni colocar
    if (target.estatusPatio === 'Taller' || target.estatus === 'TALLER') {
      showAlert({
        title: 'Unidad en Taller Mecánico',
        message: `La unidad ECO ${target.economico} se encuentra en Taller Mecánico y no puede ser programada ni colocada en planeación.`,
        unit: target,
        confirmType: 'danger',
        confirmText: 'Entendido'
      });
      return;
    }

    // Validación oficial: No se puede colocar ni poner en caseta (CARGADO) si no tiene viaje y operador
    if (newStatus === 'COLOCADO' || newStatus === 'CARGADO') {
      const { valid, hasViaje, hasOperador } = checkTieneViajeYOperador(target);
      if (!valid) {
        const faltantes = [];
        if (!hasViaje) faltantes.push('Número de Viaje');
        if (!hasOperador) faltantes.push('Operador Asignado');
        const accion = newStatus === 'COLOCADO' ? 'colocar en cortina' : 'poner en caseta (marcar cargada)';
        
        showAlert({
          title: 'Validación Operativa — BAZ Entregas',
          message: `No se puede ${accion} la unidad ECO ${target.economico}.\n\nRequisito obligatorio faltante:\n• ${faltantes.join('\n• ')}\n\nPor favor complete estos datos para continuar.`,
          unit: target,
          confirmType: 'warning',
          confirmText: 'Completar Datos',
          onConfirm: () => handleEdit(target)
        });
        return;
      }
    }

    updateStatus(unitId, 'planeacion', newStatus);
  };

  return (
    <div className="planeacion-view">
      {/* Cabecera Oficial de Planeación Mejorada con Estatus Oficiales */}
      <div style={{
        backgroundColor: '#0d1527',
        border: '1px solid var(--border-color)',
        borderLeft: '4px solid var(--accent-cyan)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.15rem 1.6rem',
        marginBottom: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <FileSpreadsheet size={20} color="var(--accent-cyan)" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              Planeación de Embarques — BAZ Entregas
            </h1>
            <span style={{ 
              background: 'rgba(6, 182, 212, 0.15)', 
              color: 'var(--accent-cyan)', 
              padding: '0.15rem 0.55rem', 
              borderRadius: 'var(--radius-xs)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 700,
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              CD VILLAHERMOSA • {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Estatus oficial de embarque: COLOCADO, CARGADO y PENDIENTE con control de cargas y cortinas
          </p>
        </div>

        {/* Métricas rápidas de Planeación con colores oficiales del Excel */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#101b30', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.4)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>Disponibles Patio</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#6ee7b7' }}>
              {disponiblesPatioCount}
            </div>
          </div>
          <div style={{ background: '#101b30', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.3)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#22d3ee', textTransform: 'uppercase', fontWeight: 700 }}>COLOCADO</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#22d3ee' }}>
              {colocadoCount}
            </div>
          </div>
          <div style={{ background: '#101b30', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(234, 179, 8, 0.4)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#facc15', textTransform: 'uppercase', fontWeight: 700 }}>CARGADO</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#fef08a' }}>
              {cargadoCount}
            </div>
          </div>
          <div style={{ background: '#101b30', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(148, 163, 184, 0.3)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>PENDIENTE</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#cbd5e1' }}>
              {pendienteCount}
            </div>
          </div>
          <div style={{ background: '#101b30', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.4)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 700 }}>EN TALLER (BLOQUEADAS)</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#fca5a5' }}>
              {tallerCount}
            </div>
          </div>

          <button 
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #107c41, #0b5c30)',
              borderColor: '#107c41',
              color: '#fff',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(16, 124, 65, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem'
            }}
            onClick={() => exportOfficialExcel(planeacionUnits)}
            title="Descargar archivo Excel con formato y colores idénticos a la plantilla oficial BAZ"
          >
            <FileSpreadsheet size={17} />
            <span>Exportar Excel Oficial</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros: Estatus Oficial, Tipo F/L y Bloques */}
      <div className="controls-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filtro Estatus Oficial (Excel) */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>
              Estatus:
            </span>
            <button 
              className={`pill-btn ${filterEstatus === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterEstatus('ALL')}
            >
              Todos ({planeacionBaseUnits.length})
            </button>
            <button 
              className={`pill-btn ${filterEstatus === 'CARGADO' ? 'active' : ''}`}
              onClick={() => setFilterEstatus('CARGADO')}
              style={filterEstatus === 'CARGADO' ? { background: '#fef08a', borderColor: '#eab308', color: '#713f12', fontWeight: 800 } : {}}
            >
              CARGADO ({cargadoCount})
            </button>
            <button 
              className={`pill-btn ${filterEstatus === 'COLOCADO' ? 'active' : ''}`}
              onClick={() => setFilterEstatus('COLOCADO')}
              style={filterEstatus === 'COLOCADO' ? { background: 'rgba(6, 182, 212, 0.25)', borderColor: '#06b6d4', color: '#22d3ee', fontWeight: 800 } : {}}
            >
              COLOCADO ({colocadoCount})
            </button>
            <button 
              className={`pill-btn ${filterEstatus === 'PENDIENTE' ? 'active' : ''}`}
              onClick={() => setFilterEstatus('PENDIENTE')}
              style={filterEstatus === 'PENDIENTE' ? { background: 'rgba(148, 163, 184, 0.25)', borderColor: '#94a3b8', color: '#cbd5e1', fontWeight: 800 } : {}}
            >
              PENDIENTE ({pendienteCount})
            </button>
            <button 
              className={`pill-btn ${filterEstatus === 'TALLER' ? 'active' : ''}`}
              onClick={() => setFilterEstatus('TALLER')}
              style={filterEstatus === 'TALLER' ? { background: 'rgba(239, 68, 68, 0.25)', borderColor: '#ef4444', color: '#f87171', fontWeight: 800 } : {}}
            >
              EN TALLER ({tallerCount})
            </button>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }}></div>

          {/* Filtro F/L */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>
              F/L:
            </span>
            <button 
              className={`pill-btn ${filterFL === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterFL('ALL')}
            >
              Todos
            </button>
            <button 
              className={`pill-btn ${filterFL === 'LOCAL' ? 'active' : ''}`}
              onClick={() => setFilterFL('LOCAL')}
              style={filterFL === 'LOCAL' ? { background: 'rgba(16, 185, 129, 0.25)', borderColor: '#10b981', color: '#34d399' } : {}}
            >
              Locales
            </button>
            <button 
              className={`pill-btn ${filterFL === 'FORANEO' ? 'active' : ''}`}
              onClick={() => setFilterFL('FORANEO')}
              style={filterFL === 'FORANEO' ? { background: 'rgba(168, 85, 247, 0.25)', borderColor: '#a855f7', color: '#c084fc' } : {}}
            >
              Foráneos
            </button>
          </div>

          <div style={{ height: '20px', width: '1px', background: 'var(--border-color)' }}></div>

          {/* Filtro Bloques */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>
              Bloque:
            </span>
            <button 
              className={`pill-btn ${filterBloque === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterBloque('ALL')}
            >
              Todos
            </button>
            {BLOQUES.map(b => (
              <button 
                key={b}
                className={`pill-btn ${filterBloque === String(b) ? 'active' : ''}`}
                onClick={() => setFilterBloque(String(b))}
              >
                B-{b}
              </button>
            ))}
          </div>
        </div>

        <div className="search-input-group" style={{ maxWidth: '300px' }}>
          <Search size={15} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Buscar viaje, ECO, clóster, cortina..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL: Matriz Operativa de Embarques */}
      <div className="table-card">
        <div className="table-header-title">
          <h2>
            <CalendarClock size={20} color="var(--accent-cyan)" />
            Matriz de Embarques y Despacho ({planeacionUnits.filter(u => u.noViaje).length} Viajes Filtrados)
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Estatus Oficial: COLOCADO, CARGADO, PENDIENTE (Sincronizado en tiempo real)
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table" style={{ fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ background: '#0b253a' }}>
                <th style={{ textAlign: 'center', width: '65px' }}>NO. VIAJE</th>
                <th>ECO UNIDAD</th>
                <th style={{ textAlign: 'center' }}>BLOQUE</th>
                <th>PLACAS</th>
                <th style={{ textAlign: 'center' }}>CAP.</th>
                <th>LÍNEA</th>
                <th>OPERADOR</th>
                <th># CARGA</th>
                <th style={{ textAlign: 'center' }}># SUC</th>
                <th>SUCURSAL / DESTINO</th>
                <th>CLÓSTER & TIPO</th>
                <th style={{ textAlign: 'center' }}>CORTINA</th>
                <th style={{ textAlign: 'center', minWidth: '120px' }}>ESTATUS</th>
                <th style={{ textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {planeacionUnits.length === 0 ? (
                <tr>
                  <td colSpan="14" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron registros de planeación con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                planeacionUnits.map(unit => {
                  const isEnTaller = unit.estatusPatio === 'Taller' || unit.estatus === 'TALLER';
                  const estatusPlan = unit.estatusPlaneacion || 'PENDIENTE';
                  const estatusSup = unit.estatusSupervisor || null;
                  const isCompletado = estatusPlan === 'COMPLETADO' || estatusSup === 'Completado';

                  // Estados activos que vienen de Supervisor con su propio color oficial
                  const SUPERVISOR_ACTIVE_LIST = ['En Ruta', 'Espera Descarga', 'Descargando', 'Retorno', 'Retrasado'];
                  const isSupervisorActive = !isEnTaller && !isCompletado && SUPERVISOR_ACTIVE_LIST.includes(estatusSup);
                  const supConfig = isSupervisorActive ? getSupervisorStatusConfig(estatusSup) : null;

                  const isCargado = !isEnTaller && !isSupervisorActive && estatusPlan === 'CARGADO';
                  const isColocado = !isEnTaller && !isSupervisorActive && estatusPlan === 'COLOCADO';
                  
                  // Validación oficial: Requisito de Viaje y Operador para poder colocar o poner en caseta
                  const { valid: canColocarOCargar, hasViaje: tieneViaje, hasOperador: tieneOperador } = checkTieneViajeYOperador(unit);

                  // Validación de restricciones de matriz Villahermosa
                  const warnings = validarRestriccionesViaje(
                    [unit.numSucursal || unit.destino], 
                    Number(unit.capUnidad || 50),
                    catalogoSucursales
                  );

                  return (
                    <tr 
                      key={unit.id}
                      style={{
                        background: isEnTaller 
                          ? 'rgba(239, 68, 68, 0.06)' 
                          : isCompletado
                          ? 'rgba(16, 185, 129, 0.04)'
                          : supConfig
                          ? supConfig.rowBg
                          : isCargado 
                          ? 'rgba(234, 179, 8, 0.06)' 
                          : isColocado 
                          ? 'rgba(6, 182, 212, 0.04)' 
                          : 'transparent',
                        borderLeft: isEnTaller 
                          ? '4px solid #ef4444' 
                          : isCompletado
                          ? '4px solid #10b981'
                          : supConfig
                          ? `4px solid ${supConfig.borderColor}`
                          : isCargado 
                          ? '4px solid #eab308' 
                          : isColocado 
                          ? '4px solid #06b6d4' 
                          : 'none',
                        opacity: isEnTaller ? 0.85 : 1
                      }}
                    >
                      {/* NO. VIAJE */}
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem' }}>
                        {unit.noViaje ? (
                          <span style={{ 
                            background: 'rgba(255, 255, 255, 0.08)', 
                            padding: '0.2rem 0.55rem', 
                            borderRadius: '4px',
                            color: '#fff'
                          }}>
                            {unit.noViaje}
                          </span>
                        ) : '—'}
                      </td>

                      {/* ECO UNIDAD */}
                      <td>
                        <span className="eco-pill" style={{ fontSize: '0.88rem' }}>
                          {unit.economico}
                        </span>
                      </td>

                      {/* BLOQUE */}
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {unit.bloque ? (
                          <span style={{ 
                            background: 'rgba(6, 182, 212, 0.15)', 
                            color: 'var(--accent-cyan)', 
                            padding: '0.15rem 0.45rem', 
                            borderRadius: '4px' 
                          }}>
                            B-{unit.bloque}
                          </span>
                        ) : '—'}
                      </td>

                      {/* PLACAS */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {unit.placas || '—'}
                      </td>

                      {/* CAP UNIDAD */}
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff' }}>
                        {unit.capUnidad ? `${unit.capUnidad}` : '—'}
                      </td>

                      {/* LINEA */}
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {unit.linea || 'LTI - VHS'}
                      </td>

                      {/* OPERADOR */}
                      <td>
                        {unit.operador ? (
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>
                              {unit.operador}
                            </div>
                            {unit.idOperador && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                ID: {unit.idOperador}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                            {isEnTaller ? '—' : 'Por Asignar'}
                          </span>
                        )}
                        {unit.turno === 'AUDITORIA' && (
                          <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontStyle: 'italic' }}>
                            (En Auditoría de Carga)
                          </span>
                        )}
                      </td>

                      {/* # CARGA */}
                      <td>
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: '0.78rem', 
                          background: 'rgba(255,255,255,0.05)', 
                          padding: '0.2rem 0.45rem', 
                          borderRadius: '4px',
                          color: '#e2e8f0'
                        }}>
                          {unit.numCarga || '—'}
                        </span>
                      </td>

                      {/* # SUC */}
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                        {unit.numSucursal || '—'}
                      </td>

                      {/* SUCURSAL / DESTINO */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{unit.destino || 'Sin destino'}</span>
                          {warnings.length > 0 && (
                            <span 
                              className="alert-restriction-pill"
                              title={warnings.join('\n')}
                            >
                              <AlertTriangle size={11} />
                              <span>Restricción de Acceso ({unit.capUnidad} &gt; Permitido)</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CLÓSTER & TIPO F/L */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
                          <span className={unit.fl === 'FORANEO' ? 'badge-fl-foraneo' : 'badge-fl-local'}>
                            {unit.fl === 'FORANEO' ? 'FORÁNEO' : 'LOCAL'}
                          </span>
                          <span className="badge-closter">
                            {unit.closter || 'HUB-VHSA'}
                          </span>
                        </div>
                      </td>

                      {/* CORTINAS */}
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: '0.95rem', 
                          color: 'var(--accent-cyan)',
                          background: 'rgba(6, 182, 212, 0.1)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(6, 182, 212, 0.3)'
                        }}>
                          {unit.cortina || '—'}
                        </strong>
                      </td>

                      {/* ESTATUS OFICIAL (EXCEL) */}
                      <td style={{ textAlign: 'center' }}>
                        {isEnTaller ? (
                          <span className="status-badge" style={{ 
                            background: 'rgba(239, 68, 68, 0.2)', 
                            color: '#f87171', 
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Wrench size={11} />
                            <span>TALLER (BLOQUEADA)</span>
                          </span>
                        ) : isCompletado ? (
                          <span className="status-badge" style={{
                            background: 'rgba(16, 185, 129, 0.25)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.5)',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <CheckCircle2 size={11} />
                            <span>COMPLETADO</span>
                          </span>
                        ) : supConfig ? (
                          <span className="status-badge" style={{
                            background: supConfig.bg,
                            color: supConfig.color,
                            border: supConfig.border,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            {supConfig.icon}
                            <span>{supConfig.label}</span>
                          </span>
                        ) : (
                          <span className={`status-badge ${
                            isCargado ? 'status-encaseta' :
                            isColocado ? 'status-colocado' :
                            'status-pendiente'
                          }`}>
                            {estatusPlan}
                          </span>
                        )}
                      </td>

                      {/* ACCIONES Y TRANSICIÓN RÁPIDA */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', alignItems: 'center' }}>
                          {isEnTaller ? (
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.28rem 0.6rem',
                                borderRadius: 'var(--radius-xs)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                cursor: 'not-allowed',
                                userSelect: 'none'
                              }}
                              title="Unidad en Taller Mecánico — No se puede seleccionar para embarque ni colocar en cortina"
                            >
                              <Wrench size={12} />
                              <span>En Taller (No Seleccionable)</span>
                            </span>
                          ) : isCompletado ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.28rem 0.6rem',
                                borderRadius: 'var(--radius-xs)',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                userSelect: 'none'
                              }}
                            >
                              <CheckCircle2 size={12} />
                              <span>Viaje Completado</span>
                            </span>
                          ) : isSupervisorActive ? (
                            <span style={{
                              fontSize: '0.72rem',
                              color: supConfig?.color || '#38bdf8',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.22rem 0.55rem',
                              borderRadius: '4px',
                              background: supConfig?.bg || 'transparent',
                              border: supConfig?.border || 'none'
                            }}>
                              {supConfig?.icon}
                              <span>En Supervisor</span>
                            </span>
                          ) : (
                            <>
                              {estatusPlan === 'PENDIENTE' && (
                                <button 
                                  className="btn"
                                  style={{ 
                                    padding: '0.28rem 0.55rem', 
                                    fontSize: '0.72rem',
                                    background: canColocarOCargar ? 'var(--accent-cyan)' : 'rgba(51, 65, 85, 0.4)',
                                    color: canColocarOCargar ? '#0a0f1d' : '#94a3b8',
                                    border: canColocarOCargar ? 'none' : '1px dashed rgba(148, 163, 184, 0.4)',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleStatusChange(unit.id, 'COLOCADO')}
                                  title={canColocarOCargar 
                                    ? "Colocar unidad en cortina para carga" 
                                    : `⚠️ Requiere ${!tieneViaje && !tieneOperador ? 'No. de Viaje y Operador' : !tieneViaje ? 'No. de Viaje' : 'Operador'} para poder colocar`}
                                >
                                  <DoorOpen size={12} />
                                  <span>Colocar</span>
                                  {!canColocarOCargar && (
                                    <AlertTriangle size={11} style={{ color: '#fbbf24', marginLeft: '1px' }} />
                                  )}
                                </button>
                              )}
                              {estatusPlan === 'COLOCADO' && (
                                <button 
                                  className="btn"
                                  style={{ 
                                    padding: '0.28rem 0.6rem', 
                                    fontSize: '0.72rem', 
                                    background: canColocarOCargar ? '#fef08a' : 'rgba(51, 65, 85, 0.4)', 
                                    color: canColocarOCargar ? '#713f12' : '#94a3b8', 
                                    border: canColocarOCargar ? '1px solid #eab308' : '1px dashed rgba(148, 163, 184, 0.4)',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleStatusChange(unit.id, 'CARGADO')}
                                  title={canColocarOCargar 
                                    ? "Carga terminada: marcar como Cargado / En Caseta" 
                                    : `⚠️ Requiere ${!tieneViaje && !tieneOperador ? 'No. de Viaje y Operador' : !tieneViaje ? 'No. de Viaje' : 'Operador'} para poner en caseta`}
                                >
                                  <Send size={12} />
                                  <span>Cargado</span>
                                  {!canColocarOCargar && (
                                    <AlertTriangle size={11} style={{ color: '#fbbf24', marginLeft: '1px' }} />
                                  )}
                                </button>
                              )}
                              {isCargado && (
                                <span style={{
                                  fontSize: '0.72rem',
                                  color: '#facc15',
                                  fontStyle: 'italic',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <Send size={11} />
                                  <span>Listo p/ Salida</span>
                                </span>
                              )}
                            </>
                          )}
                          <button 
                            className="btn-action-icon"
                            onClick={() => handleEdit(unit)}
                            title="Editar o consultar datos de la unidad"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button 
                            className="btn-action-icon"
                            style={{ color: '#f87171' }}
                            onClick={() => {
                              showConfirm({
                                title: `¿Eliminar viaje / unidad ECO ${unit.economico}?`,
                                message: 'Esta unidad será retirada de planeación, patio y de los tableros operativos de monitoreo.',
                                unit: unit,
                                confirmText: 'Sí, eliminar',
                                confirmType: 'danger',
                                onConfirm: () => deleteUnit(unit.id)
                              });
                            }}
                            title={`Eliminar viaje / unidad ECO ${unit.economico}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
