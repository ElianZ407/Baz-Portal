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

// Clave de comparación sin acentos ni mayúsculas
const claveNormalizada = (value) => String(value === null || value === undefined ? '' : value)
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

// Índices O(1) del padrón de flota. Evitan el barrido lineal por cada fila al importar
// un archivo de planeación con cientos de viajes.
export const crearIndiceFlota = (catalogo = FLOTA_TOTAL) => {
  const lista = catalogo && Array.isArray(catalogo) && catalogo.length > 0 ? catalogo : FLOTA_TOTAL;
  const porEco = new Map();
  const idOperadorPorNombre = new Map();

  lista.forEach(unidad => {
    const eco = claveNormalizada(unidad.eco);
    if (eco && !porEco.has(eco)) porEco.set(eco, unidad);

    const placas = claveNormalizada(unidad.placas);
    if (placas && !porEco.has(placas)) porEco.set(placas, unidad);

    const operador = claveNormalizada(unidad.operador);
    if (operador && !idOperadorPorNombre.has(operador)) {
      idOperadorPorNombre.set(operador, unidad.idOperador || '');
    }
  });

  return { porEco, idOperadorPorNombre, lista };
};

// Índices O(1) del catálogo de sucursales por ID y por nombre
export const crearIndiceSucursales = (catalogo = SUCURSALES_MAESTRAS) => {
  const lista = catalogo && Array.isArray(catalogo) && catalogo.length > 0 ? catalogo : SUCURSALES_MAESTRAS;
  const porId = new Map();
  const porNombre = new Map();

  lista.forEach(sucursal => {
    const id = claveNormalizada(sucursal.id);
    if (id && !porId.has(id)) porId.set(id, sucursal);

    const nombre = claveNormalizada(sucursal.nombre);
    if (nombre && !porNombre.has(nombre)) porNombre.set(nombre, sucursal);
  });

  return { porId, porNombre, lista };
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

// Normaliza texto para comparar sin acentos ni mayúsculas (Rabón = RABON).
const normalizarTexto = value => String(value || '')
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

// Estados que confirman que la unidad ya salió del CEDIS y está en camino.
const PARTIO_PLANEACION = ['CARGADO', 'EN CASETA', 'RETORNO'];
const PARTIO_PATIO = ['CARGADO', 'EN SUCURSAL', 'EN RUTA', 'DESCARGANDO', 'RETORNO'];
const PARTIO_SUPERVISOR = ['EN RUTA', 'ESPERA DESCARGA', 'DESCARGANDO', 'RETORNO', 'RETRASADO'];

// La flota ya viene clasificada en el campo `tipo` del padrón. Solo se listan
// aquí los sinónimos que deben tratarse como camioneta (vuelven en el mismo día).
const TIPOS_CAMIONETA = ['CAMIONETA', 'VAN', 'SPRINTER', 'KANGOO', 'PICKUP'];
const CAPACIDAD_CAMIONETA = 18;

export const esUnidadCamioneta = (unit) => {
  if (!unit) return false;
  const tipo = normalizarTexto(unit.tipo);
  if (tipo) return TIPOS_CAMIONETA.some(alias => tipo.includes(alias));
  return Number(unit.capUnidad) === CAPACIDAD_CAMIONETA;
};

// `fl` viene de la sucursal destino y se copia a la fila del viaje. Solo el
// foraneo puede pernoctar: un local regresa dentro del mismo dia.
const esViajeForaneo = unit => String(unit?.fl || '').trim().toUpperCase() === 'FORANEO';

// El `tipo` del padron manda; `capUnidad` solo resuelve registros sin tipo.
const clasificarTipoUnidad = (units, fleetUnit) => {
  const candidatos = [fleetUnit, ...units].filter(Boolean);
  const conTipo = candidatos.find(u => String(u.tipo || '').trim());
  if (!conTipo) return 'DESCONOCIDO';
  return esUnidadCamioneta(conTipo) ? 'CAMIONETA' : 'LARGO';
};

const yaPartioDeRuta = (unit) => {
  if (!unit) return false;
  return PARTIO_PLANEACION.includes(normalizarTexto(unit.estatusPlaneacion)) ||
    PARTIO_PATIO.includes(normalizarTexto(unit.estatusPatio)) ||
    PARTIO_SUPERVISOR.includes(normalizarTexto(unit.estatusSupervisor));
};

export const regresaMananaDeViajeLargo = (units, fleetUnit) => {
  const registros = (Array.isArray(units) ? units : [units]).filter(Boolean);
  if (registros.length === 0) return false;
  const tipo = clasificarTipoUnidad(registros, fleetUnit);
  if (tipo === 'CAMIONETA' || tipo === 'DESCONOCIDO') return false;
  return registros.some(yaPartioDeRuta);
};

// Filas del catálogo sin viaje (sintetizadas en Patio/TV) traen `operador` del padrón
// y no son un viaje: por eso se marcan con `soloCatalogo`.
const isViajeProgramadoConOperador = (unit) => {
  if (unit.soloCatalogo) return false;
  const operador = String(unit.operador || '').trim();
  const idOperador = String(unit.idOperador || '').trim();
  if (!operador && !idOperador) return false;
  const destino = String(unit.destino || '').trim().toUpperCase();
  return !destino || ['SIN DEFINIR', 'SIN DESTINO', 'POR ASIGNAR'].includes(destino);
};

export const tieneRutaAsignada = (unit) => {
  if (!unit) return false;
  const planningStatus = String(unit.estatusPlaneacion || '').trim().toUpperCase();
  const patioStatus = String(unit.estatusPatio || '').trim().toUpperCase();
  const supervisorStatus = String(unit.estatusSupervisor || '').trim().toUpperCase();
  if (planningStatus === 'COMPLETADO' || supervisorStatus === 'COMPLETADO') return false;
  const destination = String(unit.destino || '').trim().toUpperCase();
  const cargo = String(unit.numCarga || '').trim().toUpperCase();
  const hasSecondaryStops = Array.isArray(unit.destinosSecundarios) && unit.destinosSecundarios.length > 0;
  return hasTripNumber(unit) ||
    hasSecondaryStops ||
    String(unit.observaciones || '').includes('__PARADAS__:') ||
    ['COLOCADO', 'CARGADO', 'EN CASETA', 'RETORNO'].includes(planningStatus) ||
    ['COLOCADO P/ CARGA', 'CARGADO', 'EN RUTA', 'EN SUCURSAL', 'DESCARGANDO'].includes(patioStatus) ||
    ['EN RUTA', 'ESPERA DESCARGA', 'DESCARGANDO', 'RETORNO', 'RETRASADO'].includes(supervisorStatus) ||
    Boolean(destination && !['SIN DEFINIR', 'SIN DESTINO', 'POR ASIGNAR'].includes(destination)) ||
    Boolean(cargo && !['—', '-', '0', 'POR ASIGNAR'].includes(cargo)) ||
    isViajeProgramadoConOperador(unit);
};

export const consolidarUnidadesPatioPorEconomico = (units = []) => {
  const unitsByEco = new Map();
  units.forEach(unit => {
    const eco = String(unit.economico || '').trim();
    if (!eco) return;
    const existing = unitsByEco.get(eco);
    if (!existing || tieneRutaAsignada(unit) || !tieneRutaAsignada(existing)) {
      unitsByEco.set(eco, unit);
    }
  });
  return unitsByEco;
};

export const evaluarDisponibilidadManana = (unitOrTrips, catalogoFlota = []) => {
  const units = (Array.isArray(unitOrTrips) ? unitOrTrips : [unitOrTrips]).filter(Boolean);
  if (units.length === 0) {
    return { disponible: false, regresaManana: false, motivo: 'Sin datos', badge: 'DESCONOCIDO', color: '#94a3b8' };
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
      regresaManana: false,
      badge: 'NO DISPONIBLE',
      motivo: 'En Taller mecánico',
      detalle: 'No disponible por mantenimiento',
      color: '#ef4444'
    };
  }

  if (fleetStatus && fleetStatus !== 'ACTIVO') {
    return {
      disponible: false,
      regresaManana: false,
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

  if (trips.length === 0) {
    const isPatioLibre = units.some(unit =>
      (unit.estatusPatio === 'Disponible' || !unit.estatusPatio) && !hasTripNumber(unit)
    );
    const available = isPatioLibre || units.some(isCompleted);
    return {
      disponible: available,
      regresaManana: false,
      badge: available ? 'DISPONIBLE' : 'POR CONFIRMAR',
      motivo: available ? 'Unidad libre en CEDIS' : 'Por confirmar',
      detalle: available ? 'Sin viajes pendientes para esta unidad' : 'Confirma los viajes asignados a la unidad',
      color: available ? '#10b981' : '#f59e0b'
    };
  }

  // Diccionario de duraciones oficiales en horas (Total de Ida y Vuelta + tiempos)
  const DURACION_VIAJES_HORAS = {
    'BANCOS CHIAPAS': 84.31,
    'BANCOS OAXACA': 68.54,
    'ITALIKA LERMA': 53.54,
    'TOLUCA': 53.54,
    'BANCOS VERACRUZ': 52.38,
    'RIO GRANDE': 48.55,
    'PUERTO ESCONDIDO': 47.08,
    'POCHUTLA': 44.95,
    'HUATULCO': 43.75,
    'CIUDAD HIDALGO': 36.27,
    'MOTOZINTLA': 35.47,
    'TAPACHULA': 35.07,
    'HUIXTLA': 33.82,
    'MATIAS ROMERO': 33.08,
    'MAPASTEPEC': 31.96,
    'SALINA CRUZ': 31.35,
    'COMALAPA': 30.98,
    'TEHUANTEPEC': 30.92,
    'COMITAN': 30.92,
    'PIJIJIAPAN': 30.62,
    'TONALA': 22.30,
    'ARRIAGA': 21.88,
    'SAN CRISTOBAL DE LAS CASAS': 21.15,
    'SAN CRISTOBAL': 21.15,
    'CINTALAPA': 19.98,
    'TUXTLA GUTIERREZ': 19.18,
    'SAN ANDRES TUXTLA': 17.87,
    'BENEMERITO': 16.13,
    'OCOSINGO': 15.65,
    'ACAYUCAN': 15.25,
    'HUB TUXTLA': 15.09,
    'MINATITLAN': 13.79,
    'COATZACOALCOS': 13.25,
    'YAJALON': 10.78,
    'LAS CHOAPAS': 9.02,
    'TENOSIQUE': 8.95,
    'AGUA DULCE': 8.03,
    'PALENQUE': 8.45,
    'LA VENTA': 8.31,
    'BALANCAN': 8.25,
    'JONUTA': 7.27,
    'EMILIANO ZAPATA': 6.96,
    'PARAISO': 5.12,
    'SALTO DE AGUA': 5.03,
    'HUIMANGUILLO': 4.96,
    'PICHUCALCO': 4.92,
    'FRONTERA': 4.65,
    'COMALCALCO': 4.59,
    'CARDENAS': 4.33,
    'TEAPA': 4.28,
    'REFORMA': 4.12,
    'MACUSPANA': 4.01,
    'JALAPA': 3.85,
    'JALPA DE MENDEZ': 3.50,
    'CUNDUACAN': 3.55,
    'CENTRO': 2.76,
    'CANDELARIA': 8.32,
    'JUCHITAN': 0.0,
  };

  const getDuracionViajeHrs = (destinoStr) => {
    if (!destinoStr) return 0;
    const dest = String(destinoStr).toUpperCase().trim();
    // Búsqueda directa o parcial
    if (DURACION_VIAJES_HORAS[dest]) return DURACION_VIAJES_HORAS[dest];
    for (const [key, hrs] of Object.entries(DURACION_VIAJES_HORAS)) {
      if (dest.includes(key)) return hrs;
    }
    return 0;
  };

  // Analizar la disponibilidad basada en el viaje asignado (sin importar si ya partió o está pendiente)
  const trip = trips.find(t => esViajeForaneo(t)) || trips[0]; // Usar el viaje más largo/foráneo si hay
  
  // Determinar la duración del viaje en horas (priorizando el tiempo estimado cargado, o el diccionario)
  let duracion = Number(trip.tiempoEstimadoHrs) || 0;
  if (!duracion && trip.destino) {
    duracion = getDuracionViajeHrs(trip.destino);
  }

  // Si no logramos inferir duración, aplicamos un default según F/L para no romper la matemática
  if (duracion === 0) {
    duracion = esViajeForaneo(trip) ? 36 : 6;
  }

  // Regla del negocio: Viajes de más de 36 horas son foráneos largos que se toman varios días (no regresan mañana)
  if (duracion > 36) {
    const diasEstimados = Math.round((duracion / 24) * 10) / 10;
    const diasEnteros = Math.ceil(duracion / 24);
    return {
      disponible: false,
      regresaManana: false,
      badge: 'NO DISPONIBLE',
      motivo: `Viaje largo (${diasEnteros} días)`,
      detalle: `Duración de ${duracion} hrs (~${diasEstimados} días en ruta). No alcanza a regresar mañana.`,
      color: '#f59e0b' // Ámbar
    };
  } 

  // Si el viaje dura 36 horas o menos, SÍ regresa mañana
  const isEnRuta = yaPartioDeRuta(trip);
  const diasEstimados = Math.round((duracion / 24) * 10) / 10;
  return {
    disponible: true,
    regresaManana: true,
    badge: 'REGRESA MAÑANA',
    motivo: isEnRuta ? 'En ruta' : 'Ruta programada',
    detalle: `Duración: ${duracion} hrs (~${diasEstimados} días). Retorno estimado para mañana.`,
    color: '#38bdf8'
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
    const status = String(unit.estatus || '').trim().toUpperCase();
    if (eco && status !== 'BAJA') fleetByEco.set(eco, unit);
  });

  const ecoRoster = fleetByEco.size > 0
    ? [...fleetByEco.keys()]
    : [...unitsByEco.keys()];
  const counts = { total: ecoRoster.length, disponibles: 0, colocadas: 0, cargadas: 0, pendientes: 0, taller: 0, fueraOperacion: 0 };
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

