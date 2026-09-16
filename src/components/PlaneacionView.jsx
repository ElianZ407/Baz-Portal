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
  Trash2
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { validarRestriccionesViaje, buscarSucursal } from '../data/sucursalesData';
import { BLOQUES } from '../data/initialFleetData';
import { exportOfficialExcel } from '../utils/exportOfficialExcel';

export const PlaneacionView = () => {
  const { 
    units, 
    updateStatus, 
    setSelectedUnit, 
    setIsModalOpen, 
    deleteUnit,
    showConfirm,
    searchQuery, 
    setSearchQuery 
  } = useFleet();

  const [filterBloque, setFilterBloque] = useState('ALL');
  const [filterFL, setFilterFL] = useState('ALL'); // 'ALL' | 'LOCAL' | 'FORANEO'
  const [filterEstatus, setFilterEstatus] = useState('ALL'); // 'ALL' | 'PENDIENTE' | 'COLOCADO' | 'EN CASETA' | 'TALLER'

  // Filtrado de unidades en planeación:
  // Aparecen todas las unidades que están en patio (Disponible, Colocado p/ Carga, Cargado) y las que están en taller.
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

  const enCasetaCount = planeacionBaseUnits.filter(u => u.estatusPatio !== 'Taller' && u.estatusPlaneacion === 'EN CASETA').length;
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
    // Si la unidad está en taller, no se puede cambiar estatus ni colocar
    const target = units.find(u => u.id === unitId);
    if (target && (target.estatusPatio === 'Taller' || target.estatus === 'TALLER')) {
      alert('Esta unidad se encuentra en Taller y no puede ser seleccionada ni colocada en planeación.');
      return;
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
              CD VILLAHERMOSA • 10/09/2026
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Estatus oficial de embarque: COLOCADO, EN CASETA y PENDIENTE con control de cargas y cortinas
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
            <span style={{ fontSize: '0.68rem', color: '#facc15', textTransform: 'uppercase', fontWeight: 700 }}>EN CASETA</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#fef08a' }}>
              {enCasetaCount}
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
              className={`pill-btn ${filterEstatus === 'EN CASETA' ? 'active' : ''}`}
              onClick={() => setFilterEstatus('EN CASETA')}
              style={filterEstatus === 'EN CASETA' ? { background: '#fef08a', borderColor: '#eab308', color: '#713f12', fontWeight: 800 } : {}}
            >
              EN CASETA ({enCasetaCount})
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
            Estatus Oficial: COLOCADO, EN CASETA, PENDIENTE (Sincronizado en tiempo real)
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
                  const isEnCaseta = !isEnTaller && estatusPlan === 'EN CASETA';
                  const isColocado = !isEnTaller && estatusPlan === 'COLOCADO';
                  
                  // Validación de restricciones de matriz Villahermosa
                  const warnings = validarRestriccionesViaje(
                    [unit.numSucursal || unit.destino], 
                    Number(unit.capUnidad || 50)
                  );

                  return (
                    <tr 
                      key={unit.id}
                      style={{
                        background: isEnTaller 
                          ? 'rgba(239, 68, 68, 0.06)' 
                          : isEnCaseta 
                          ? 'rgba(234, 179, 8, 0.06)' 
                          : isColocado 
                          ? 'rgba(6, 182, 212, 0.04)' 
                          : 'transparent',
                        borderLeft: isEnTaller 
                          ? '4px solid #ef4444' 
                          : isEnCaseta 
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
                          <div style={{ fontWeight: 600, color: '#fff' }}>
                            {unit.operador}
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
                        ) : (
                          <span className={`status-badge ${
                            isEnCaseta ? 'status-encaseta' :
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
                          ) : (
                            <>
                              {estatusPlan === 'PENDIENTE' && (
                                <button 
                                  className="btn btn-primary"
                                  style={{ padding: '0.28rem 0.55rem', fontSize: '0.72rem' }}
                                  onClick={() => handleStatusChange(unit.id, 'COLOCADO')}
                                  title="Colocar unidad en cortina para carga"
                                >
                                  <DoorOpen size={12} />
                                  <span>Colocar</span>
                                </button>
                              )}
                              {estatusPlan === 'COLOCADO' && (
                                <button 
                                  className="btn"
                                  style={{ 
                                    padding: '0.28rem 0.6rem', 
                                    fontSize: '0.72rem', 
                                    background: '#fef08a', 
                                    color: '#713f12', 
                                    border: '1px solid #eab308',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}
                                  onClick={() => handleStatusChange(unit.id, 'EN CASETA')}
                                  title="Carga terminada: Pasar a Caseta y liberar a ruta"
                                >
                                  <Send size={12} />
                                  <span>A Caseta</span>
                                </button>
                              )}
                              {estatusPlan === 'EN CASETA' && (
                                <button 
                                  className="btn-move"
                                  style={{ padding: '0.25rem 0.45rem', fontSize: '0.7rem' }}
                                  onClick={() => handleStatusChange(unit.id, 'COLOCADO')}
                                  title="Regresar a Colocado si hay ajuste"
                                >
                                  Retornar
                                </button>
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
