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
  Compass
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { validarRestriccionesViaje, buscarSucursal } from '../data/sucursalesData';

export const PlaneacionView = () => {
  const { 
    units, 
    updateStatus, 
    setSelectedUnit, 
    setIsModalOpen, 
    searchQuery, 
    setSearchQuery 
  } = useFleet();

  const [activeTab, setActiveTab] = useState('programacion'); // 'programacion' | 'cortinas'
  const [filterBloque, setFilterBloque] = useState('ALL');
  const [filterFL, setFilterFL] = useState('ALL'); // 'ALL' | 'LOCAL' | 'FORANEO'

  // Filtrado de unidades en planeación
  const planeacionUnits = units.filter(u => {
    const matchesSearch = 
      (u.economico && u.economico.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.operador && u.operador.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.destino && u.destino.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.numCarga && u.numCarga.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.placas && u.placas.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.cortina && u.cortina.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.closter && u.closter.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBloque = filterBloque === 'ALL' || String(u.bloque) === filterBloque;
    const matchesFL = filterFL === 'ALL' || (u.fl || 'LOCAL') === filterFL;

    return matchesSearch && matchesBloque && matchesFL;
  });

  const unidadesEnCortina = units.filter(u => 
    u.estatusPlaneacion === 'En Cortina' || u.estatusPatio === 'Colocado p/ Carga'
  );

  const viajesLocales = units.filter(u => (u.fl || 'LOCAL') === 'LOCAL');
  const viajesForaneos = units.filter(u => u.fl === 'FORANEO');

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const despacharRuta = (unitId) => {
    updateStatus(unitId, 'planeacion', 'Liberado a Ruta');
  };

  return (
    <div className="planeacion-view">
      {/* Cabecera Oficial de Planeación Mejorada con Matriz CD Villahermosa */}
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
            Programación con Matriz Operativa Oficial: Clústeres, Rutas Locales vs Foráneas y Control de Capacidades
          </p>
        </div>

        {/* Métricas rápidas de Planeación */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#101b30', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Viajes Totales</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              {units.filter(u => u.noViaje).length}
            </div>
          </div>
          <div style={{ background: '#101b30', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 600 }}>Locales (Tabasco)</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
              {viajesLocales.length}
            </div>
          </div>
          <div style={{ background: '#101b30', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(168, 85, 247, 0.3)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 600 }}>Foráneos (Rutas)</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#c084fc' }}>
              {viajesForaneos.length}
            </div>
          </div>
          <div style={{ background: '#101b30', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 600 }}>En Cortina</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
              {unidadesEnCortina.length}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros: Bloques y Clasificación F/L */}
      <div className="controls-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filtro F/L */}
          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>
              Tipo F/L:
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
              Locales ({viajesLocales.length})
            </button>
            <button 
              className={`pill-btn ${filterFL === 'FORANEO' ? 'active' : ''}`}
              onClick={() => setFilterFL('FORANEO')}
              style={filterFL === 'FORANEO' ? { background: 'rgba(168, 85, 247, 0.25)', borderColor: '#a855f7', color: '#c084fc' } : {}}
            >
              Foráneos ({viajesForaneos.length})
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
            {[1, 2, 3, 4, 5, 6].map(b => (
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

        <div className="search-input-group" style={{ maxWidth: '340px' }}>
          <Search size={15} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Buscar viaje, ECO, clóster, operador, cortina..."
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
            Clasificación Local vs Foráneo, Clósteres CD Villahermosa, Cargas y Cortinas
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
                <th style={{ textAlign: 'center' }}>ESTATUS</th>
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
                  const enCortina = unit.estatusPlaneacion === 'En Cortina' || unit.estatusPatio === 'Colocado p/ Carga';
                  const yaDespachado = unit.estatusSupervisor === 'En Ruta' || unit.estatusPlaneacion === 'Despachado';
                  
                  // Validación de restricciones de matriz Villahermosa
                  const warnings = validarRestriccionesViaje(
                    [unit.numSucursal || unit.destino], 
                    Number(unit.capUnidad || 50)
                  );

                  return (
                    <tr 
                      key={unit.id}
                      style={{
                        background: enCortina ? 'rgba(245, 158, 11, 0.04)' : 'transparent'
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
                        {unit.linea || 'LINEA 1 - VHS'}
                      </td>

                      {/* OPERADOR */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>
                          {unit.operador || 'POR ASIGNAR'}
                        </div>
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

                      {/* ESTATUS */}
                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-badge ${
                          yaDespachado ? 'status-en-ruta' :
                          enCortina ? 'status-en-cortina' :
                          'status-disponible'
                        }`}>
                          {yaDespachado ? 'EN RUTA' :
                           enCortina ? 'EN CORTINA' :
                           unit.estatusPatio.toUpperCase()}
                        </span>
                      </td>

                      {/* ACCIONES */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          {enCortina && (
                            <button 
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                              onClick={() => despacharRuta(unit.id)}
                              title="Dar salida a ruta (Pasa a monitoreo Supervisor)"
                            >
                              <Send size={12} />
                              <span>Despachar</span>
                            </button>
                          )}
                          <button 
                            className="btn-action-icon"
                            onClick={() => handleEdit(unit)}
                            title="Editar datos de viaje"
                          >
                            <Edit3 size={13} />
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
