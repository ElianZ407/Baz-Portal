import { FLOTA_TOTAL, SUCURSALES_MAESTRAS } from '../constants/fleetConstants';

// Buscar una sucursal por ID o nombre en el catálogo activo
export const buscarSucursal = (query, catalogo = SUCURSALES_MAESTRAS) => {
  if (!query) return null;
  const q = String(query).trim().toLowerCase();
  const list = catalogo && Array.isArray(catalogo) && catalogo.length > 0 ? catalogo : SUCURSALES_MAESTRAS;
  return list.find(s => 
    String(s.id).toLowerCase() === q || 
    (s.nombre && s.nombre.toLowerCase().includes(q))
  ) || null;
};

// Validador de Restricciones Operativas
export const validarRestriccionesViaje = (sucursalesList, capUnidad, catalogo = SUCURSALES_MAESTRAS) => {
  if (!sucursalesList || !Array.isArray(sucursalesList) || sucursalesList.length === 0) return [];
  const alertas = [];
  const sucursales = sucursalesList
    .map(item => typeof item === 'string' ? buscarSucursal(item, catalogo) : buscarSucursal(item?.id || item?.num, catalogo))
    .filter(Boolean);

  // 1. Validar Capacidad Máxima Vehicular
  sucursales.forEach(s => {
    if (s.capMax === "18" || s.capMax === "Kangoo / 18") {
      if (capUnidad > 18) {
        alertas.push(`Sucursal ${s.id} (${s.nombre}) tiene restricción de acceso: Solo admite unidades Kangoo / 18 (Cap. asignada: ${capUnidad})`);
      }
    }
  });

  // 2. Validar Restricciones de Incompatibilidad
  const ids = sucursales.map(s => String(s.id));
  
  if (ids.includes("9464") && ids.some(id => ["2057", "143", "449"].includes(id))) {
    alertas.push("Restricción en Carranza: Sucursal 9464 NO debe enviarse combinada con 2057, 143 o 449");
  }

  if (ids.some(id => ["8396", "6305"].includes(id)) && ids.some(id => ["3803", "8403", "9684"].includes(id))) {
    alertas.push("Restricción en Juchitán: No debe enviarse combinada con 3803, 8403 o 9684");
  }

  if (ids.includes("6134") && ids.some(id => ["6240", "3049", "4158", "7548"].includes(id))) {
    alertas.push("Restricción en Chiapa de Corzo (6134): No enviar con 6240, 3049, 4158 o 7548");
  }

  if (ids.includes("3049") && ids.some(id => ["6240", "6134"].includes(id))) {
    alertas.push("Restricción en Villaflores (3049): No enviar con 6240 o 6134");
  }

  return alertas;
};

// Buscar una unidad motriz por su número económico o placa
export const buscarUnidadPorEco = (ecoQuery, catalogo = FLOTA_TOTAL) => {
  if (!ecoQuery) return null;
  const clean = String(ecoQuery).trim().toLowerCase();
  return (catalogo || FLOTA_TOTAL).find(u => 
    (u.eco || '').toLowerCase() === clean || 
    (u.placas || '').toLowerCase() === clean
  ) || null;
};

// Buscar ID de Operador por su Nombre Oficial
export const buscarIdOperadorPorNombre = (nombreOperador, catalogo = FLOTA_TOTAL) => {
  if (!nombreOperador) return '';
  const clean = String(nombreOperador).trim().toLowerCase();
  const found = (catalogo || FLOTA_TOTAL).find(u => (u.operador || '').trim().toLowerCase() === clean);
  return found?.idOperador || '';
};

// Buscar Unidad y Operador por número económico
export const buscarOperadorPorEco = (eco, catalogo = FLOTA_TOTAL) => {
  if (!eco) return null;
  const clean = String(eco).trim().toLowerCase();
  return (catalogo || FLOTA_TOTAL).find(u => (u.eco || '').toLowerCase() === clean) || null;
};

// Valida si una unidad/viaje cuenta con Número de Viaje, Operador y Destino asignado
export const checkTieneViajeYOperador = (unit) => {
  if (!unit) return { valid: false, hasViaje: false, hasOperador: false, hasDestino: false };

  const noViajeStr = String(unit.noViaje || '').trim();
  const hasViaje = Boolean(
    noViajeStr &&
    noViajeStr !== '—' &&
    noViajeStr !== '-' &&
    noViajeStr !== '0' &&
    noViajeStr.toLowerCase() !== 'sin viaje' &&
    noViajeStr.toLowerCase() !== 'por asignar'
  );

  const operadorStr = String(unit.operador || '').trim();
  const hasOperador = Boolean(
    operadorStr &&
    operadorStr !== '—' &&
    operadorStr !== '-' &&
    operadorStr.toLowerCase() !== 'por asignar' &&
    operadorStr.toLowerCase() !== 'sin asignar' &&
    operadorStr.toLowerCase() !== 'vacante' &&
    operadorStr.toLowerCase() !== 'baja'
  );

  const destinoStr = String(unit.destino || unit.numSucursal || '').trim();
  const hasDestino = Boolean(
    destinoStr &&
    destinoStr !== '—' &&
    destinoStr !== '-' &&
    destinoStr.toLowerCase() !== 'sin destino' &&
    destinoStr.toLowerCase() !== 'por asignar' &&
    destinoStr.toLowerCase() !== 'sin asignar'
  );

  return {
    valid: hasViaje && hasOperador && hasDestino,
    hasViaje,
    hasOperador,
    hasDestino
  };
};

// Una unidad solo se pronostica disponible si está libre o terminó su viaje.
const hasTripNumber = unit => Boolean(unit.noViaje && !['—', '-', '0'].includes(String(unit.noViaje).trim()));

export const tieneRutaAsignada = (unit) => {
  if (!unit) return false;
  const planningStatus = String(unit.estatusPlaneacion || '').trim().toUpperCase();
  const patioStatus = String(unit.estatusPatio || '').trim().toUpperCase();
  const supervisorStatus = String(unit.estatusSupervisor || '').trim().toUpperCase();
  const destination = String(unit.destino || '').trim().toUpperCase();
  const cargo = String(unit.numCarga || '').trim().toUpperCase();
  return hasTripNumber(unit) ||
    ['COLOCADO', 'CARGADO', 'EN CASETA', 'RETORNO'].includes(planningStatus) ||
    ['COLOCADO P/ CARGA', 'CARGADO', 'EN RUTA', 'EN SUCURSAL', 'DESCARGANDO'].includes(patioStatus) ||
    ['EN RUTA', 'ESPERA DESCARGA', 'DESCARGANDO', 'RETORNO', 'RETRASADO'].includes(supervisorStatus) ||
    Boolean(destination && !['SIN DEFINIR', 'SIN DESTINO', 'POR ASIGNAR'].includes(destination)) ||
    Boolean(cargo && !['—', '-', '0', 'POR ASIGNAR'].includes(cargo));
};

export const evaluarDisponibilidadManana = (unitOrTrips, catalogoFlota = []) => {
  const units = (Array.isArray(unitOrTrips) ? unitOrTrips : [unitOrTrips]).filter(Boolean);
  if (units.length === 0) {
    return { disponible: false, motivo: 'Sin datos', badge: 'DESCONOCIDO', color: '#94a3b8' };
  }

  const eco = units[0].economico;
  const fleetUnit = (catalogoFlota || []).find(f => String(f.eco).trim() === String(eco || '').trim());
  const fleetStatus = String(fleetUnit?.estatus || '').trim().toUpperCase();
  const isTaller = units.some(unit =>
    unit.estatusPatio === 'Taller' ||
    unit.estatus === 'TALLER'
  ) || fleetStatus.includes('TALLER');

  if (isTaller) {
    return {
      disponible: false,
      badge: 'NO DISPONIBLE',
      motivo: 'En Taller mecánico',
      detalle: 'Bloqueada por mantenimiento',
      color: '#ef4444'
    };
  }

  if (fleetStatus && fleetStatus !== 'ACTIVO') {
    return {
      disponible: false,
      badge: 'NO DISPONIBLE',
      motivo: fleetStatus === 'BAJA' ? 'Unidad dada de baja' : 'Fuera de operación',
      detalle: `Estatus del padrón: ${fleetUnit.estatus}`,
      color: '#ef4444'
    };
  }

  const isCompleted = unit => unit.estatusSupervisor === 'Completado' || unit.estatusPlaneacion === 'COMPLETADO';
  const activeTripsById = new Map();
  units.filter(unit => !isCompleted(unit) && tieneRutaAsignada(unit)).forEach(unit => {
    const tripNumber = String(unit.noViaje || '').trim();
    const key = tripNumber && !['—', '-', '0'].includes(tripNumber)
      ? `trip-${tripNumber}`
      : `id-${unit.id}`;
    if (!activeTripsById.has(key)) activeTripsById.set(key, unit);
  });
  const trips = [...activeTripsById.values()];

  if (trips.length > 0) {
    const tripCount = trips.length;
    return {
      disponible: false,
      badge: 'NO DISPONIBLE',
      motivo: 'Tiene ruta programada',
      detalle: `Asignada a ${tripCount} ${tripCount === 1 ? 'viaje' : 'viajes'}; se libera al completar sus rutas`,
      color: '#f59e0b'
    };
  }

  if (trips.length === 0) {
    const isPatioLibre = units.some(unit =>
      (unit.estatusPatio === 'Disponible' || !unit.estatusPatio) && !hasTripNumber(unit)
    );
    const available = isPatioLibre || units.some(isCompleted);
    return {
      disponible: available,
      badge: available ? 'DISPONIBLE' : 'POR CONFIRMAR',
      motivo: available ? 'Unidad libre en CEDIS' : 'Por confirmar',
      detalle: available ? 'Sin viajes pendientes para esta unidad' : 'Confirma los viajes asignados a la unidad',
      color: available ? '#10b981' : '#f59e0b'
    };
  }
};

export const evaluarDisponibilidadMananaPorUnidad = (units = [], catalogoFlota = []) => {
  const groups = new Map();
  units.forEach(unit => {
    const eco = String(unit.economico || '').trim();
    const groupKey = eco ? `eco-${eco}` : `id-${unit.id}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(unit);
  });

  const statusByUnitId = new Map();
  groups.forEach(group => {
    const status = evaluarDisponibilidadManana(group, catalogoFlota);
    group.forEach(unit => statusByUnitId.set(String(unit.id), status));
  });
  return statusByUnitId;
};

export const resumirFlotaPorEstado = (units = [], catalogoFlota = []) => {
  const unitsByEco = new Map();
  units.forEach(unit => {
    const eco = String(unit.economico || '').trim();
    if (!eco) return;
    if (!unitsByEco.has(eco)) unitsByEco.set(eco, []);
    unitsByEco.get(eco).push(unit);
  });

  const fleetByEco = new Map();
  (catalogoFlota || []).forEach(unit => {
    const eco = String(unit.eco || '').trim();
    const status = String(unit.estatus || '').trim().toUpperCase();
    if (eco && status !== 'BAJA') fleetByEco.set(eco, unit);
  });

  const ecoRoster = fleetByEco.size > 0
    ? [...fleetByEco.keys()]
    : [...unitsByEco.keys()];
  const counts = { total: fleetByEco.size || 55, disponibles: 0, colocadas: 0, cargadas: 0, pendientes: 0, taller: 0, fueraOperacion: 0 };
  const activeStatuses = ['En Ruta', 'Espera Descarga', 'Descargando', 'Retorno', 'Retrasado'];

  ecoRoster.forEach(eco => {
    const records = unitsByEco.get(eco) || [];
    const master = fleetByEco.get(eco);
    const isTaller = master?.estatus === 'TALLER' || (master?.estatus || '').toLowerCase().includes('taller') || records.some(unit =>
      unit.estatusPatio === 'Taller' || unit.estatus === 'TALLER'
    );
    const isCargada = records.some(unit =>
      unit.estatusPlaneacion === 'CARGADO' ||
      unit.estatusPatio === 'Cargado' ||
      activeStatuses.includes(unit.estatusSupervisor)
    );
    const isColocada = records.some(unit =>
      unit.estatusPlaneacion === 'COLOCADO' || unit.estatusPatio === 'Colocado p/ Carga'
    );
    const isPendiente = records.some(unit =>
      (unit.estatusPlaneacion || 'PENDIENTE') === 'PENDIENTE' && tieneRutaAsignada(unit)
    );
    const masterStatus = String(master?.estatus || 'ACTIVO').trim().toUpperCase();

    if (isTaller) counts.taller++;
    else if (masterStatus !== 'ACTIVO') counts.fueraOperacion++;
    else if (isCargada) counts.cargadas++;
    else if (isColocada) counts.colocadas++;
    else if (isPendiente) counts.pendientes++;
  });

  counts.disponibles = Math.max(0, counts.total - counts.taller - counts.fueraOperacion - counts.cargadas - counts.colocadas - counts.pendientes);
  return counts;
};

export const contarViajesSinUnidadAsignada = (units = []) => {
  const tripKeys = new Set();
  units.forEach(unit => {
    if (String(unit.economico || '').trim()) return;
    const noViaje = String(unit.noViaje || '').trim();
    const hasTripNumber = noViaje && !['—', '-', '0', 'SIN VIAJE', 'POR ASIGNAR'].includes(noViaje.toUpperCase());
    tripKeys.add(hasTripNumber ? `viaje-${noViaje}` : `id-${unit.id}`);
  });
  return tripKeys.size;
};

