import React, { useState, useMemo } from 'react';
import { 
  Tv, 
  MapPin, 
  Search,
  Calendar
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { KpiBar } from './KpiBar';
import { evaluarDisponibilidadMananaPorUnidad, tieneRutaAsignada, construirPadronManana, unidadContableManana } from '../utils/fleetUtils';

export const TvDashboardView = () => {
  const { 
    units, 
    filterStatus, 
    setFilterStatus, 
    searchQuery, 
    setSearchQuery,
    catalogoFlota,
    formattedPlanDate,
    formattedPlanDateLong
  } = useFleet();

  const [filterFL, setFilterFL] = useState('ALL');
  const [filterCapType, setFilterCapType] = useState('ALL');

  const tripEcos = useMemo(
    () => new Set(units.map(unit => String(unit.economico || '').trim()).filter(Boolean)),
    [units]
  );
  const catalogOnlyUnits = useMemo(() => (catalogoFlota || [])
    .filter(unit => !tripEcos.has(String(unit.eco || '').trim()))
    .map(unit => {
      const eco = String(unit.eco || '').trim();
      const status = String(unit.estatus || 'ACTIVO').trim().toUpperCase();
      const isWorkshop = status.includes('TALLER');
      return {
        id: `catalog-${eco}`,
        soloCatalogo: true,
        economico: eco,
        noViaje: '',
        placas: unit.placas || '',
        operador: unit.operador || '',
        idOperador: unit.idOperador || '',
        tipo: unit.tipo || '',
        capUnidad: unit.capUnidad || 0,
        linea: unit.linea || '',
        destino: '',
        destinosSecundarios: [],
        fl: 'LOCAL',
        estatus: status,
        estatusPatio: isWorkshop ? 'Taller' : status === 'ACTIVO' ? 'Disponible' : 'No Disponible',
        estatusPlaneacion: 'PENDIENTE',
        estatusSupervisor: 'Pendiente'
      };
    }),
  [catalogoFlota, tripEcos]);
  const includeCatalogOnly = ['DISP_MANANA', 'DISPONIBLE_PATIO', 'DISPONIBLES', 'EN_TALLER'].includes(filterStatus);
  const unitsForFilter = useMemo(
    () => includeCatalogOnly ? [...units, ...catalogOnlyUnits] : units,
    [units, catalogOnlyUnits, includeCatalogOnly]
  );
  const availabilityByUnitId = useMemo(
    () => evaluarDisponibilidadMananaPorUnidad(unitsForFilter, catalogoFlota),
    [unitsForFilter, catalogoFlota]
  );
  const padronManana = useMemo(() => construirPadronManana(catalogoFlota), [catalogoFlota]);

  const unassignedTripsCount = useMemo(
    () => units.filter(u => !String(u.economico || '').trim()).length,
    [units]
  );

  // Filtrar según el estado seleccionado, búsqueda y F/L
  const filteredUnits = unitsForFilter.filter(unit => {
    const ecoStr = String(unit.economico || '').trim();
    const matchesSearch = 
      (ecoStr && ecoStr.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.operador && unit.operador.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.destino && unit.destino.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.numCarga && unit.numCarga.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.cortina && unit.cortina.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.closter && unit.closter.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.noViaje && String(unit.noViaje).toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Filtro F/L
    if (filterFL !== 'ALL' && (unit.fl || 'LOCAL') !== filterFL) {
      return false;
    }

    // Filtro por tipo de unidad (Camioneta / Rabon / Full)
    if (filterCapType !== 'ALL') {
      const cap = Number(unit.capUnidad || 0);
      if (filterCapType === 'CAMIONETA' && cap !== 18) return false;
      if (filterCapType === 'RABON' && ![40, 50].includes(cap)) return false;
      if (filterCapType === 'FULL' && ![90, 110, 180].includes(cap)) return false;
    }

    // Filtros de estado por KPI
    if (filterStatus === 'EN_TRANSITO') {
      return unit.estatusSupervisor === 'En Ruta';
    }
    if (filterStatus === 'EN_SUCURSAL') {
      return ['Espera Descarga', 'Descargando'].includes(unit.estatusSupervisor);
    }
    if (filterStatus === 'RETRASADAS') {
      return unit.estatusSupervisor === 'Retrasado';
    }
    if (filterStatus === 'EN_TALLER') {
      return unit.estatusPatio === 'Taller' || unit.estatus === 'TALLER';
    }
    if (filterStatus === 'DISPONIBLE_PATIO' || filterStatus === 'DISPONIBLES') {
      return unit.estatusPatio === 'Disponible' && !tieneRutaAsignada(unit);
    }
    if (filterStatus === 'DISP_MANANA') {
      return unidadContableManana(unit, padronManana) && (availabilityByUnitId.get(String(unit.id))?.disponible || false);
    }
    if (filterStatus === 'REGRESAN_MANANA') {
      return unidadContableManana(unit, padronManana) && (availabilityByUnitId.get(String(unit.id))?.regresaManana || false);
    }
    if (filterStatus === 'NO_REGRESAN_MANANA') {
      return unidadContableManana(unit, padronManana) && Boolean(availabilityByUnitId.get(String(unit.id))?.noRegresaManana);
    }
    if (filterStatus === 'POR_CONFIRMAR') {
      return unidadContableManana(unit, padronManana) && availabilityByUnitId.get(String(unit.id))?.badge === 'POR CONFIRMAR';
    }
    if (filterStatus === 'SIN_UNIDAD') {
      return !ecoStr;
    }

    // Por defecto en la pantalla de TV: solo mostrar unidades físicas con ECO asignado
    if (!ecoStr) {
      return false;
    }

    return true;
  });
  const filteredEcosCount = new Set(
    filteredUnits.map(unit => String(unit.economico || '').trim()).filter(Boolean)
  ).size;

  const getUnitOperationalStatus = (unit) => {
    if (!unit) return { text: 'PROGRAMADO', badgeClass: 'status-programado' };

    const isTaller = unit.estatusPatio === 'Taller' || unit.estatus === 'TALLER';
    if (isTaller) {
      return { text: 'TALLER', badgeClass: 'status-retrasado' };
    }

    const estatusSup = unit.estatusSupervisor;
    const estatusPlan = unit.estatusPlaneacion;

    // 1. Estados de tránsito activo del Supervisor (máxima jerarquía operativa)
    if (estatusSup === 'En Ruta') {
      return { text: 'EN RUTA (TRÁNSITO)', badgeClass: 'status-en-ruta' };
    }
    if (estatusSup === 'Espera Descarga') {
      return { text: 'EN SUCURSAL (ESPERA)', badgeClass: 'status-espera-descarga' };
    }
    if (estatusSup === 'Descargando') {
      return { text: 'DESCARGANDO', badgeClass: 'status-descargando' };
    }
    if (estatusSup === 'Retorno') {
      return { text: 'EN RETORNO', badgeClass: 'status-retorno' };
    }
    if (estatusSup === 'Retrasado') {
      return { text: 'RETRASADO / ALERTA', badgeClass: 'status-retrasado' };
    }
    if (estatusSup === 'Completado' || estatusPlan === 'COMPLETADO') {
      return { text: 'COMPLETADO', badgeClass: 'status-completado' };
    }

    // 2. Estados de patio / planeación
    if (estatusPlan === 'NO SE CUBRE' || estatusPlan === 'CANCELADO') {
      return { text: 'NO SE CUBRE', badgeClass: 'status-nosecubre' };
    }
    if (estatusPlan === 'CARGADO' || estatusPlan === 'EN CASETA' || estatusSup === 'Cargado' || unit.estatusPatio === 'Cargado') {
      return { text: 'EN CASETA (SALIDA)', badgeClass: 'status-encaseta' };
    }
    if (estatusPlan === 'COLOCADO' || unit.estatusPatio === 'Colocado p/ Carga') {
      return { text: 'COLOCADO EN CORTINA', badgeClass: 'status-colocado' };
    }

    return { text: 'PROGRAMADO', badgeClass: 'status-programado' };
  };

  return (
    <div className="tv-container">
      <KpiBar filterFL={filterFL} setFilterFL={setFilterFL} />

      {(() => {
        const CAP_CAMIONETA = [18];
        const CAP_RABON = [40, 50];
        const CAP_FULL = [90, 110, 180];
        const flota = catalogoFlota || [];

        const countByType = (caps) => {
          const nonBaja = flota.filter(u => caps.includes(Number(u.capUnidad)) && String(u.estatus || 'ACTIVO').toUpperCase() !== 'BAJA');
          const taller = nonBaja.filter(u => String(u.estatus || '').toUpperCase().includes('TALLER') || String(u.estatus || '').toUpperCase().includes('SINIESTRO')).length;
          return { activas: nonBaja.length - taller, taller, total: nonBaja.length };
        };

        const camionetas = countByType(CAP_CAMIONETA);
        const rabones = countByType(CAP_RABON);
        const fulles = countByType(CAP_FULL);

        return (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tipo de Flota:
            </span>
            <button 
              className={`pill-btn ${filterCapType === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterCapType('ALL')}
            >
              Todos ({flota.length})
            </button>
            <button 
              className={`pill-btn ${filterCapType === 'CAMIONETA' ? 'active' : ''}`}
              onClick={() => setFilterCapType(prev => prev === 'CAMIONETA' ? 'ALL' : 'CAMIONETA')}
              style={filterCapType === 'CAMIONETA' ? { background: 'rgba(16, 185, 129, 0.25)', borderColor: '#10b981', color: '#34d399', fontWeight: 800 } : {}}
            >
              Camionetas ({camionetas.activas} activas · {camionetas.total} total)
            </button>
            <button 
              className={`pill-btn ${filterCapType === 'RABON' ? 'active' : ''}`}
              onClick={() => setFilterCapType(prev => prev === 'RABON' ? 'ALL' : 'RABON')}
              style={filterCapType === 'RABON' ? { background: 'rgba(6, 182, 212, 0.25)', borderColor: '#06b6d4', color: '#22d3ee', fontWeight: 800 } : {}}
            >
              Rabones ({rabones.activas} activas · {rabones.total} total)
            </button>
            <button 
              className={`pill-btn ${filterCapType === 'FULL' ? 'active' : ''}`}
              onClick={() => setFilterCapType(prev => prev === 'FULL' ? 'ALL' : 'FULL')}
              style={filterCapType === 'FULL' ? { background: 'rgba(168, 85, 247, 0.25)', borderColor: '#a855f7', color: '#c084fc', fontWeight: 800 } : {}}
            >
              Tractos / Fulles ({fulles.activas} activas · {fulles.total} total)
            </button>
          </div>
        );
      })()}

      <div className="table-card">
        <div className="table-header-title" style={{ flexWrap: 'wrap', gap: '0.75rem', padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Tv size={18} color="var(--accent-cyan)" />
              <span>
                {filterStatus === 'SIN_UNIDAD' 
                  ? `Viajes Pendientes de Asignar (${filteredUnits.length})`
                  : `Flota y Embarques del Día (${filteredEcosCount})`}
              </span>
              {formattedPlanDate && (
                <span 
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    marginLeft: '0.35rem'
                  }}
                  title={`Fecha del plan de embarques: ${formattedPlanDateLong}`}
                >
                  <Calendar size={13} />
                  Plan: {formattedPlanDate}
                </span>
              )}
            </h2>

            <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                className={`pill-btn ${filterFL === 'ALL' && filterStatus !== 'SIN_UNIDAD' ? 'active' : ''}`}
                onClick={() => {
                  setFilterFL('ALL');
                  if (filterStatus === 'SIN_UNIDAD') setFilterStatus('ALL');
                }}
              >
                Todas
              </button>
              <button 
                className={`pill-btn ${filterFL === 'LOCAL' && filterStatus !== 'SIN_UNIDAD' ? 'active' : ''}`}
                onClick={() => {
                  setFilterFL('LOCAL');
                  if (filterStatus === 'SIN_UNIDAD') setFilterStatus('ALL');
                }}
                style={filterFL === 'LOCAL' && filterStatus !== 'SIN_UNIDAD' ? { background: 'rgba(16, 185, 129, 0.25)', borderColor: '#10b981', color: '#34d399' } : {}}
              >
                Locales (Tabasco)
              </button>
              <button 
                className={`pill-btn ${filterFL === 'FORANEO' && filterStatus !== 'SIN_UNIDAD' ? 'active' : ''}`}
                onClick={() => {
                  setFilterFL('FORANEO');
                  if (filterStatus === 'SIN_UNIDAD') setFilterStatus('ALL');
                }}
                style={filterFL === 'FORANEO' && filterStatus !== 'SIN_UNIDAD' ? { background: 'rgba(168, 85, 247, 0.25)', borderColor: '#a855f7', color: '#c084fc' } : {}}
              >
                Foráneos (Rutas)
              </button>
              {unassignedTripsCount > 0 && (
                <button 
                  className={`pill-btn ${filterStatus === 'SIN_UNIDAD' ? 'active' : ''}`}
                  onClick={() => setFilterStatus(prev => prev === 'SIN_UNIDAD' ? 'ALL' : 'SIN_UNIDAD')}
                  style={filterStatus === 'SIN_UNIDAD' 
                    ? { background: 'rgba(234, 179, 8, 0.3)', borderColor: '#eab308', color: '#fde047', fontWeight: 700 } 
                    : { borderColor: 'rgba(234, 179, 8, 0.4)', color: '#facc15' }}
                  title="Ver viajes importados que aún no tienen una unidad (ECO) asignada"
                >
                  ⚠️ Sin Asignar ({unassignedTripsCount})
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="search-input-group" style={{ maxWidth: '280px' }}>
              <Search size={15} className="search-icon" />
              <input 
                type="text"
                className="search-input"
                placeholder="Buscar en resumen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table tv-data-table">
            <thead>
              <tr style={{ background: '#0b253a' }}>
                <th style={{ textAlign: 'center', width: '60px' }}>VIAJE</th>
                <th style={{ width: '100px' }}>ECO UNIDAD</th>
                <th>OPERADOR</th>
                <th style={{ width: '110px' }}># CARGA</th>
                <th>DESTINO & RUTA</th>
                <th style={{ textAlign: 'center', width: '85px' }}>SALIDA</th>
                <th style={{ textAlign: 'center', width: '85px' }}>ETA</th>
                <th style={{ textAlign: 'center', width: '170px' }}>ESTATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No hay unidades con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredUnits.map(unit => {
                  const isLate = unit.estatusSupervisor === 'Retrasado';
                  const avail = availabilityByUnitId.get(String(unit.id));
                  return (
                    <tr 
                      key={unit.id}
                      style={{
                        background: isLate ? 'rgba(239, 68, 68, 0.14)' : 'transparent',
                        borderLeft: isLate ? '5px solid #ef4444' : 'none'
                      }}
                    >
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem' }}>
                        {unit.noViaje ? (
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                            {unit.noViaje}
                          </span>
                        ) : '—'}
                      </td>

                      <td>
                        {unit.economico ? (
                          <span className="eco-pill">{unit.economico}</span>
                        ) : (
                          <span style={{ 
                            fontSize: '0.72rem', 
                            color: '#94a3b8', 
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px dashed rgba(148, 163, 184, 0.35)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }}>
                            SIN UNIDAD
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="operator-cell">
                          <span className="operator-name" style={{ fontSize: '0.95rem' }}>
                            {unit.operador || 'POR ASIGNAR'}
                          </span>
                          <span className="operator-shift" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {unit.placas ? `Placas: ${unit.placas}` : ''} {unit.capUnidad ? `• Cap: ${unit.capUnidad} m³` : ''}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#e2e8f0' }}>
                          {unit.numCarga || '—'}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <div className="route-cell" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                            <MapPin size={14} color="var(--accent-cyan)" />
                            <span>{unit.destino ? unit.destino.replace(/\s*\(Retorno\)/gi, '').trim() : 'Sin definir'}</span>
                          </div>
                          <span className={unit.fl === 'FORANEO' ? 'badge-fl-foraneo' : 'badge-fl-local'}>
                            {unit.fl === 'FORANEO' ? 'FORÁNEO' : 'LOCAL'}
                          </span>
                          {!avail?.esCamioneta && avail?.regresaManana && (
                            <span style={{ fontSize: '0.72rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }} title={avail?.detalle}>
                              🔄 Regresa Mañana
                            </span>
                          )}
                          {!avail?.esCamioneta && avail?.noRegresaManana && (
                            <span style={{ fontSize: '0.72rem', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }} title={avail?.detalle}>
                              ⏳ No regresa ({avail.dias}d)
                            </span>
                          )}
                        </div>

                        {unit.destinosSecundarios && unit.destinosSecundarios.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ color: '#38bdf8', fontWeight: 600 }}>+{unit.destinosSecundarios.length} entrega{unit.destinosSecundarios.length > 1 ? 's' : ''}:</span>
                            {unit.destinosSecundarios.map((p, pIdx) => (
                              <span key={pIdx} style={{ color: p.esVtex ? '#fde047' : '#cbd5e1' }}>
                                {p.esVtex ? (p.destino?.startsWith('VTEX') ? p.destino : `VTEX S-${p.numSucursal || ''}`) : (p.destino || `#${p.numSucursal}`)}{pIdx < unit.destinosSecundarios.length - 1 ? ' · ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="eta-cell" style={{ fontSize: '0.95rem', textAlign: 'center' }}>
                        {unit.horaSalida || '—'}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span 
                          className="eta-cell" 
                          style={{ 
                            fontSize: '0.95rem', 
                            color: isLate ? '#f87171' : '#38bdf8' 
                          }}
                        >
                          {unit.eta || '—'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {(() => {
                          const opStatus = getUnitOperationalStatus(unit);
                          return (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <span className={`status-badge ${opStatus.badgeClass}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                                {opStatus.text}
                              </span>
                            </div>
                          );
                        })()}
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
