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
  FileSpreadsheet
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';

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

  // Filtrado de unidades en planeación
  const planeacionUnits = units.filter(u => {
    const matchesSearch = 
      (u.economico && u.economico.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.operador && u.operador.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.destino && u.destino.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.numCarga && u.numCarga.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.placas && u.placas.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.cortina && u.cortina.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBloque = filterBloque === 'ALL' || String(u.bloque) === filterBloque;

    return matchesSearch && matchesBloque;
  });

  const unidadesEnCortina = units.filter(u => 
    u.estatusPlaneacion === 'En Cortina' || u.estatusPatio === 'Colocado p/ Carga'
  );

  const handleEdit = (unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const despacharRuta = (unitId) => {
    updateStatus(unitId, 'planeacion', 'Liberado a Ruta');
  };

  return (
    <div className="planeacion-view">
      {/* Cabecera Corporativa Sobria */}
      <div style={{
        backgroundColor: '#0d131f',
        border: '1px solid var(--border-color)',
        borderLeft: '4px solid var(--brand-primary)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.9rem 1.35rem',
        marginBottom: '1rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.15rem' }}>
            <FileSpreadsheet size={19} color="#60a5fa" />
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              Planeación de Embarques — BAZ Entregas
            </h1>
            <span style={{ 
              background: '#1e293b', 
              color: '#94a3b8', 
              padding: '0.15rem 0.45rem', 
              borderRadius: 'var(--radius-xs)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              border: '1px solid #334155'
            }}>
              10/09/2026
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Programación de viajes, asignación de bloques, operadores, cargas y cortinas de embarque
          </p>
        </div>

        {/* Métricas rápidas de Planeación */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#111827', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Viajes Registrados</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
              {units.filter(u => u.noViaje).length}
            </div>
          </div>
          <div style={{ background: '#111827', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>En Cortina Activa</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24' }}>
              {unidadesEnCortina.length}
            </div>
          </div>
          <div style={{ background: '#111827', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Despachados a Ruta</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>
              {units.filter(u => u.estatusSupervisor === 'En Ruta' || u.estatusPlaneacion === 'Despachado').length}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Bloques */}
      <div className="controls-bar">
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.3rem' }}>
            Filtrar por Bloque:
          </span>
          <button 
            className={`pill-btn ${filterBloque === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterBloque('ALL')}
          >
            Todos los Bloques
          </button>
          {[1, 2, 3, 4, 5, 6].map(b => (
            <button 
              key={b}
              className={`pill-btn ${filterBloque === String(b) ? 'active' : ''}`}
              onClick={() => setFilterBloque(String(b))}
            >
              Bloque {b}
            </button>
          ))}
        </div>

        <div className="search-input-group" style={{ maxWidth: '380px' }}>
          <Search size={15} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Buscar viaje, ECO, operador, carga, cortina..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA PRINCIPAL: Réplica exacta del Excel de Planeación */}
      <div className="table-card">
        <div className="table-header-title">
          <h2>
            <CalendarClock size={20} color="var(--accent-cyan)" />
            Matriz de Embarques y Despacho ({planeacionUnits.filter(u => u.noViaje).length} Viajes)
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Campos oficiales: No. Viaje, ECO, Bloque, Placas, Cap., Línea, Operador, # Carga, Sucursales y Cortinas
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table" style={{ fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ background: '#0b253a' }}>
                <th style={{ textAlign: 'center', width: '70px' }}>NO. VIAJE</th>
                <th>ECO UNIDAD</th>
                <th style={{ textAlign: 'center' }}>BLOQUE</th>
                <th>PLACAS</th>
                <th style={{ textAlign: 'center' }}>CAP.</th>
                <th>LÍNEA</th>
                <th>OPERADOR</th>
                <th>FECHA</th>
                <th># CARGA</th>
                <th style={{ textAlign: 'center' }}># SUC</th>
                <th>SUCURSAL / DESTINO</th>
                <th style={{ textAlign: 'center' }}>CORTINAS</th>
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
                        {unit.linea || 'LTI - VHS'}
                      </td>

                      {/* OPERADOR */}
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>
                          {unit.operador}
                        </div>
                        {unit.turno === 'AUDITORIA' && (
                          <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontStyle: 'italic' }}>
                            (En Auditoría de Carga)
                          </span>
                        )}
                      </td>

                      {/* FECHA */}
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {unit.fecha || '10/09/2026'}
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
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                        {unit.numSucursal || '—'}
                      </td>

                      {/* SUCURSAL / DESTINO (Con desglose multipunto si existe) */}
                      <td>
                        {unit.sucursalesDestino && unit.sucursalesDestino.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {unit.sucursalesDestino.map((suc, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>[{suc.num}]</span>
                                <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{suc.nombre}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontWeight: 600 }}>{unit.destino}</span>
                        )}
                      </td>

                      {/* CORTINAS */}
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: '1rem', 
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
                              title="Dar salida a ruta (Pasa al Supervisor)"
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
