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

/**
 * Estima disponibilidad para el día siguiente usando la hora de regreso al CEDIS.
 * tiempoEstimadoHrs representa horas de manejo de ida; el regreso usa la misma duración.
 */
export const evaluarDisponibilidadManana = (unitOrTrips, catalogoFlota = []) => {
  const units = (Array.isArray(unitOrTrips) ? unitOrTrips : [unitOrTrips]).filter(Boolean);
  if (units.length === 0) {
    return { disponible: false, motivo: 'Sin datos', badge: 'DESCONOCIDO', color: '#94a3b8' };
  }

  const eco = units[0].economico;
  const isTaller = units.some(unit =>
    unit.estatusPatio === 'Taller' ||
    unit.estatus === 'TALLER'
  ) || (catalogoFlota || []).some(f =>
    String(f.eco) === String(eco) && (f.estatus === 'TALLER' || (f.estatus || '').toLowerCase().includes('taller'))
  );

  if (isTaller) {
    return {
      disponible: false,
      badge: 'NO DISPONIBLE',
      motivo: 'En Taller mecánico',
      detalle: 'Bloqueada por mantenimiento',
      color: '#ef4444'
    };
  }

  const isCompleted = unit => unit.estatusSupervisor === 'Completado' || unit.estatusPlaneacion === 'COMPLETADO';
  const hasTrip = unit => Boolean(unit.noViaje && !['—', '-', '0'].includes(String(unit.noViaje).trim()));
  const activeTripsById = new Map();
  units.filter(unit => !isCompleted(unit)).forEach(unit => {
    const tripNumber = String(unit.noViaje || '').trim();
    const key = tripNumber && !['—', '-', '0'].includes(tripNumber)
      ? `trip-${tripNumber}`
      : `id-${unit.id}`;
    if (!activeTripsById.has(key)) activeTripsById.set(key, unit);
  });
  const trips = [...activeTripsById.values()];

  if (trips.length === 0) {
    const isPatioLibre = units.some(unit =>
      (unit.estatusPatio === 'Disponible' || !unit.estatusPatio) && !hasTrip(unit)
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

  const scheduledTrips = [];
  for (const trip of trips) {
    const horaSalida = trip.horaSalida || trip.horaCaseta || '';
    const tiempoEstimadoHrs = Number(trip.tiempoEstimadoHrs);
    const departureMatch = String(horaSalida).trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
    const departureHour = departureMatch ? Number(departureMatch[1]) : NaN;
    const departureMinute = departureMatch ? Number(departureMatch[2]) : NaN;
    const meridiem = departureMatch?.[3]?.toUpperCase();
    const normalizedHour = meridiem === 'PM' && departureHour < 12
      ? departureHour + 12
      : meridiem === 'AM' && departureHour === 12
        ? 0
        : departureHour;

    if (
      !departureMatch ||
      !Number.isFinite(tiempoEstimadoHrs) ||
      tiempoEstimadoHrs <= 0 ||
      normalizedHour > 23 ||
      departureMinute > 59
    ) {
      return {
        disponible: false,
        badge: 'POR CONFIRMAR',
        motivo: 'Por confirmar',
        detalle: `Faltan hora de salida u horas de ida en el viaje ${trip.noViaje || ''}`.trim(),
        color: '#f59e0b'
      };
    }

    const today = new Date();
    const dateMatch = String(trip.fecha || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const departureDate = dateMatch
      ? new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3]))
      : new Date(today.getFullYear(), today.getMonth(), today.getDate());
    departureDate.setHours(normalizedHour, departureMinute, 0, 0);
    scheduledTrips.push({ trip, departureAt: departureDate, durationMs: tiempoEstimadoHrs * 2 * 60 * 60 * 1000 });
  }

  scheduledTrips.sort((a, b) => a.departureAt - b.departureAt);
  const firstDeparture = scheduledTrips[0].departureAt;
  let lastReturn = null;

  scheduledTrips.forEach(({ departureAt, durationMs }) => {
    const actualDeparture = lastReturn && departureAt < lastReturn ? lastReturn : departureAt;
    lastReturn = new Date(actualDeparture.getTime() + durationMs);
  });

  const cutoff = new Date(firstDeparture.getFullYear(), firstDeparture.getMonth(), firstDeparture.getDate() + 1, 6, 0, 0, 0);
  const available = lastReturn < cutoff;
  const returnLabel = lastReturn.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const tripCount = trips.length;

  return {
    disponible: available,
    badge: available ? 'DISPONIBLE' : 'NO DISPONIBLE',
    motivo: available ? 'Todos sus viajes terminan antes de las 06:00' : 'Sus viajes terminan después de las 06:00',
    detalle: `Regreso estimado tras ${tripCount} ${tripCount === 1 ? 'viaje' : 'viajes'}: ${returnLabel} • sin sumar espera de descarga`,
    color: available ? '#10b981' : '#f59e0b'
  };
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
    if (eco) fleetByEco.set(eco, unit);
  });

  const ecoRoster = fleetByEco.size > 0
    ? [...fleetByEco.keys()]
    : [...unitsByEco.keys()];
  const counts = { total: fleetByEco.size || 55, disponibles: 0, colocadas: 0, cargadas: 0, pendientes: 0, taller: 0 };
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
    const isPendiente = records.some(unit => (unit.estatusPlaneacion || 'PENDIENTE') === 'PENDIENTE');

    if (isTaller) counts.taller++;
    else if (isCargada) counts.cargadas++;
    else if (isColocada) counts.colocadas++;
    else if (isPendiente) counts.pendientes++;
  });

  counts.disponibles = Math.max(0, counts.total - counts.taller - counts.cargadas - counts.colocadas - counts.pendientes);
  return counts;
};

