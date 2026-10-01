import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tv, 
  MapPin, 
  Search 
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { KpiBar } from './KpiBar';
import { evaluarDisponibilidadMananaPorUnidad, tieneRutaAsignada } from '../utils/fleetUtils';

export const TvDashboardView = () => {
  const { 
    units, 
    filterStatus, 
    setFilterStatus, 
    searchQuery, 
    setSearchQuery,
    catalogoFlota
  } = useFleet();

  const [filterFL, setFilterFL] = useState('ALL'); // 'ALL' | 'LOCAL' | 'FORANEO'
  const [filterCapType, setFilterCapType] = useState('ALL'); // 'ALL' | 'CAMIONETA' | 'RABON' | 'FULL'
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
      return availabilityByUnitId.get(String(unit.id))?.disponible || false;
    }
    if (filterStatus === 'REGRESAN_MANANA') {
      return availabilityByUnitId.get(String(unit.id))?.regresaManana || false;
    }
    if (filterStatus === 'POR_CONFIRMAR') {
      return Boolean(ecoStr) && availabilityByUnitId.get(String(unit.id))?.badge === 'POR CONFIRMAR';
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
      {/* Banner Principal de Pizarra TV */}
      <div className="tv-header-banner">
        <div className="tv-title-area" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="brand-logo-container tv-logo-box">
            <img 
              src="/baz-entregas-logo.png" 
              alt="BAZ Entregas" 
              style={{ height: '42px', width: 'auto', objectFit: 'contain' }} 
            />
          </div>
          <div>
            <h1>MONITOREO DE UNIDADES EN TIEMPO REAL</h1>
            <p>Pizarra de Control de Flota y Embarques — CD Villahermosa</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Fecha Operativa
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', color: 'var(--accent-cyan)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
              <span>{currentDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 KPIs Superiores de Telemetría */}
      <KpiBar filterFL={filterFL} setFilterFL={setFilterFL} />

      {/* Resumen de Flota por Tipo de Unidad — clicables como filtro */}
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

        const handleCardClick = (typeKey) => {
          setFilterCapType(prev => prev === typeKey ? 'ALL' : typeKey);
        };

        const cardStyle = (color, typeKey) => {
          const isActive = filterCapType === typeKey;
          return {
            flex: 1,
            background: isActive
              ? `linear-gradient(135deg, ${color}35 0%, ${color}18 100%)`
              : `linear-gradient(135deg, ${color}10 0%, rgba(13,22,38,0.95) 100%)`,
            border: `2px solid ${isActive ? color : color + '35'}`,
            borderRadius: '12px',
            padding: '0.85rem 1.3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isActive
              ? `0 0 0 3px ${color}30, 0 6px 24px rgba(0,0,0,0.4)`
              : `0 4px 14px rgba(0,0,0,0.25)`,
            transform: isActive ? 'translateY(-2px)' : 'none'
          };
        };

        const statBox = (label, value, color) => (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.67rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.2rem' }}>{label}</div>
          </div>
        );

        const divider = <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.08)' }} />;

        const activeIndicator = (color) => (
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: color, boxShadow: `0 0 8px ${color}`,
            flexShrink: 0
          }} />
        );

        return (
          <div style={{ display: 'flex', gap: '0.85rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {/* Camionetas */}
            <div
              style={cardStyle('#10b981', 'CAMIONETA')}
              onClick={() => handleCardClick('CAMIONETA')}
              title="Clic para filtrar la tabla por Camionetas (Cap. 18 m³)"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {filterCapType === 'CAMIONETA' && activeIndicator('#34d399')}
                <div>
                  <div style={{ fontSize: '0.72rem', color: filterCapType === 'CAMIONETA' ? '#34d399' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Camionetas</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.1rem' }}>Cap. 18 m³ {filterCapType === 'CAMIONETA' ? '— Filtrando ✓' : '· Clic para filtrar'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                {statBox('Activas', camionetas.activas, '#34d399')}
                {divider}
                {statBox('Taller', camionetas.taller, '#f87171')}
                {divider}
                {statBox('Total', camionetas.total, '#e2e8f0')}
              </div>
            </div>

            {/* Rabones */}
            <div
              style={cardStyle('#06b6d4', 'RABON')}
              onClick={() => handleCardClick('RABON')}
              title="Clic para filtrar la tabla por Rabones (Cap. 40–50 m³)"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {filterCapType === 'RABON' && activeIndicator('#22d3ee')}
                <div>
                  <div style={{ fontSize: '0.72rem', color: filterCapType === 'RABON' ? '#22d3ee' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Rabones</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.1rem' }}>Cap. 40–50 m³ {filterCapType === 'RABON' ? '— Filtrando ✓' : '· Clic para filtrar'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                {statBox('Activas', rabones.activas, '#22d3ee')}
                {divider}
                {statBox('Taller', rabones.taller, '#f87171')}
                {divider}
                {statBox('Total', rabones.total, '#e2e8f0')}
              </div>
            </div>

            {/* Fulles / Tractos */}
            <div
              style={cardStyle('#a855f7', 'FULL')}
              onClick={() => handleCardClick('FULL')}
              title="Clic para filtrar la tabla por Fulles/Tractos (Cap. 90–180 m³)"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {filterCapType === 'FULL' && activeIndicator('#c084fc')}
                <div>
                  <div style={{ fontSize: '0.72rem', color: filterCapType === 'FULL' ? '#c084fc' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Fulles / Tractos</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.1rem' }}>Cap. 90–180 m³ {filterCapType === 'FULL' ? '— Filtrando ✓' : '· Clic para filtrar'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                {statBox('Activas', fulles.activas, '#c084fc')}
                {divider}
                {statBox('Taller', fulles.taller, '#f87171')}
                {divider}
                {statBox('Total', fulles.total, '#e2e8f0')}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabla Pizarra para TV Panorámica */}
      <div className="table-card">
        <div className="table-header-title" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2>
              <Tv size={20} color="var(--accent-cyan)" />
              {filterStatus === 'SIN_UNIDAD' 
                ? `Viajes Pendientes de Asignar (${filteredUnits.length} Viajes)`
                : `Flota y Embarques del Día (${filteredEcosCount} Unidades)`}
            </h2>
            {filterStatus !== 'ALL' && (
              <button 
                className="pill-btn"
                style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                onClick={() => setFilterStatus('ALL')}
              >
                Limpiar Filtro ({filterStatus === 'SIN_UNIDAD' ? 'Sin Asignar' : 'KPI'}) ×
              </button>
            )}
            {filterCapType !== 'ALL' && (
              <button
                className="pill-btn"
                style={{ background: 'rgba(239, 68, 68, 0.2)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                onClick={() => setFilterCapType('ALL')}
              >
                Limpiar tipo ({filterCapType === 'CAMIONETA' ? 'Camionetas' : filterCapType === 'RABON' ? 'Rabones' : 'Fulles'}) ×
              </button>
            )}

            {/* Selector Rápido F/L para TV */}
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
            <div className="search-input-group" style={{ maxWidth: '320px' }}>
              <Search size={15} className="search-icon" />
              <input 
                type="text"
                className="search-input"
                placeholder="Buscar en resumen general..."
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
                <th>ECO UNIDAD</th>
                <th style={{ textAlign: 'center' }}>BLOQUE</th>
                <th style={{ textAlign: 'center' }}>CORTINA</th>
                <th>OPERADOR</th>
                <th>LÍNEA</th>
                <th># CARGA</th>
                <th>DESTINO, CLÓSTER & TIPO</th>
                <th>SALIDA</th>
                <th>ETA</th>
                <th style={{ textAlign: 'center' }}>ESTATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No hay unidades con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredUnits.map(unit => {
                  const isLate = unit.estatusSupervisor === 'Retrasado';
                  return (
                    <tr 
                      key={unit.id}
                      style={{
                        background: isLate ? 'rgba(239, 68, 68, 0.14)' : 'transparent',
                        borderLeft: isLate ? '5px solid #ef4444' : 'none'
                      }}
                    >
                      {/* VIAJE */}
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem' }}>
                        {unit.noViaje ? (
                          <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                            {unit.noViaje}
                          </span>
                        ) : '—'}
                      </td>

                      {/* ECO UNIDAD */}
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
                            SIN UNIDAD ASIGNADA
                          </span>
                        )}
                      </td>

                      {/* BLOQUE */}
                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {unit.bloque ? `B-${unit.bloque}` : '—'}
                      </td>

                      {/* CORTINA */}
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ 
                          fontFamily: 'var(--font-mono)', 
                          fontWeight: 700, 
                          color: 'var(--accent-cyan)',
                          background: 'rgba(6, 182, 212, 0.15)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {unit.cortina || '—'}
                        </span>
                      </td>

                      {/* OPERADOR */}
                      <td>
                        <div className="operator-cell">
                          <span className="operator-name" style={{ fontSize: '0.98rem' }}>
                            {unit.operador || 'POR ASIGNAR'}
                          </span>
                          <span className="operator-shift">
                            {unit.placas ? `Placas: ${unit.placas}` : ''} {unit.capUnidad ? `• Cap: ${unit.capUnidad}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* LINEA */}
                      <td style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        {unit.linea || 'LINEA 1 - VHS'}
                      </td>

                      {/* # CARGA */}
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#e2e8f0' }}>
                          {unit.numCarga || '—'}
                        </span>
                      </td>

                      {/* DESTINO / SUCURSAL / CLÓSTER / F-L */}
                      <td>
                        <div className="route-cell" style={{ fontSize: '0.98rem', fontWeight: 600 }}>
                          <MapPin size={15} color="var(--accent-cyan)" />
                          <span>{unit.destino ? unit.destino.replace(/\s*\(Retorno\)/gi, '').trim() : 'Sin definir'}</span>
                        </div>
                        {unit.destinosSecundarios && unit.destinosSecundarios.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.74rem',
                              background: 'rgba(6, 182, 212, 0.18)',
                              color: '#38bdf8',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              padding: '0.12rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: 700
                            }}>
                              +{unit.destinosSecundarios.length} Entrega{unit.destinosSecundarios.length > 1 ? 's' : ''}:
                            </span>
                            {unit.destinosSecundarios.map((p, pIdx) => (
                              <span key={pIdx} style={{
                                fontSize: '0.74rem',
                                color: p.esVtex ? '#fef08a' : '#e2e8f0',
                                background: p.esVtex ? 'rgba(250, 204, 21, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid ' + (p.esVtex ? 'rgba(250, 204, 21, 0.35)' : 'rgba(255, 255, 255, 0.12)'),
                                padding: '0.12rem 0.5rem',
                                borderRadius: '4px',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                📍 {p.esVtex ? (p.destino?.startsWith('VTEX') ? p.destino : `VTEX (S-${p.numSucursal || ''})`) : (p.destino || `#${p.numSucursal}`)}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className={unit.fl === 'FORANEO' ? 'badge-fl-foraneo' : 'badge-fl-local'}>
                            {unit.fl === 'FORANEO' ? 'FORÁNEO' : 'LOCAL'}
                          </span>
                          <span className="badge-closter">
                            {unit.closter || 'HUB-VHSA'}
                          </span>
                          {availabilityByUnitId.get(String(unit.id))?.regresaManana && (
                            <span className="badge-fl-foraneo" style={{ background: 'rgba(56, 189, 248, 0.25)', color: '#38bdf8', border: '1px solid #38bdf8', fontWeight: 800 }}>
                              🔄 REGRESA MAÑANA
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SALIDA */}
                      <td className="eta-cell" style={{ fontSize: '1rem' }}>
                        {unit.horaSalida}
                      </td>

                      {/* ETA */}
                      <td>
                        <span 
                          className="eta-cell" 
                          style={{ 
                            fontSize: '1.05rem', 
                            color: isLate ? '#f87171' : '#38bdf8' 
                          }}
                        >
                          {unit.eta}
                        </span>
                      </td>

                      {/* ESTATUS */}
                      <td style={{ textAlign: 'center' }}>
                        {(() => {
                          const opStatus = getUnitOperationalStatus(unit);
                          return (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <span className={`status-badge ${opStatus.badgeClass}`} style={{ fontSize: '0.92rem', padding: '0.35rem 0.85rem' }}>
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
