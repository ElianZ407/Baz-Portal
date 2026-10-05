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
  if (planningStatus === 'COMPLETADO' || supervisorStatus === 'COMPLETADO' || planningStatus === 'NO SE CUBRE' || planningStatus === 'CANCELADO') return false;
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

export const esCamioneta = (item) =>
  Number(item?.capUnidad) === 18 || String(item?.tipo || '').toLowerCase().includes('camioneta');

export const construirPadronManana = (catalogoFlota = []) => {
  const padron = new Set();
  (catalogoFlota || []).forEach(f => {
    const eco = String(f.eco || '').trim();
    const status = String(f.estatus || 'ACTIVO').trim().toUpperCase();
    if (eco && status === 'ACTIVO' && !esCamioneta(f)) padron.add(eco);
  });
  return padron;
};

export const unidadContableManana = (unit, padron) => {
  const eco = String(unit?.economico || '').trim();
  if (!eco) return false;
  if (padron && padron.size > 0) return padron.has(eco);
  return !esCamioneta(unit);
};

export const evaluarDisponibilidadManana = (unitOrTrips, catalogoFlota = []) => {
  const units = (Array.isArray(unitOrTrips) ? unitOrTrips : [unitOrTrips]).filter(Boolean);
  if (units.length === 0) {
    return { disponible: false, regresaManana: false, motivo: 'Sin datos', badge: 'DESCONOCIDO', color: '#94a3b8' };
  }

  const eco = units[0].economico;
  const fleetUnit = (catalogoFlota || []).find(f => String(f.eco).trim() === String(eco || '').trim());
  const fleetStatus = String(fleetUnit?.estatus || '').trim().toUpperCase();

  if (esCamioneta(units[0]) || (fleetUnit && esCamioneta(fleetUnit))) {
    return {
      disponible: false,
      regresaManana: false,
      noRegresaManana: false,
      esCamioneta: true,
      badge: 'CAMIONETA LOCAL',
      motivo: 'Retorno diario automático',
      detalle: 'Camioneta (18 m³). Retorno diario garantizado.',
      color: '#94a3b8'
    };
  }

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

  const isCompleted = unit => 
    unit.estatusSupervisor === 'Completado' || 
    unit.estatusPlaneacion === 'COMPLETADO' || 
    unit.estatusPlaneacion === 'NO SE CUBRE' ||
    unit.estatusPlaneacion === 'CANCELADO';
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

  const normalizeDest = (str) => {
    if (!str) return '';
    return String(str)
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

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
    'CD HIDALGO': 36.27,
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
    'JUCHITAN': 26.50,
    'TONALA': 22.30,
    'ARRIAGA': 21.88,
    'SAN CRISTOBAL DE LAS CASAS': 21.15,
    'SAN CRISTOBAL': 21.15,
    'CINTALAPA': 19.98,
    'TUXTLA GUTIERREZ': 19.18,
    'JUAN SABINES': 19.18,
    'SAN ANDRES TUXTLA': 17.87,
    'BENEMERITO': 16.13,
    'OCOSINGO': 15.65,
    'ACAYUCAN': 15.25,
    'HUB TUXTLA': 15.09,
    'ESCARCEGA': 15.00,
    'MINATITLAN': 13.79,
    'COATZACOALCOS': 13.25,
    'PLAZA FLORIDA': 13.25,
    'AVIACION': 11.50,
    'YAJALON': 10.78,
    'LAS CHOAPAS': 9.02,
    'TENOSIQUE': 8.96,
    'AGUA DULCE': 8.83,
    'PALENQUE': 8.45,
    'LA VENTA': 8.31,
    'CANDELARIA': 8.32,
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
    'JALPA DE MENDEZ': 3.58,
    'CUNDUACAN': 3.55,
    'CENTRO': 2.76,
    'VILLAHERMOSA': 2.76,
    'VILLA HERMOSA': 2.76
  };

  const DURACION_VIAJES_DIAS = {
    'BANCOS CHIAPAS': 3.51,
    'BANCOS OAXACA': 2.86,
    'ITALIKA LERMA': 2.23,
    'TOLUCA': 2.23,
    'BANCOS VERACRUZ': 2.18,
    'RIO GRANDE': 2.02,
    'PUERTO ESCONDIDO': 1.96,
    'POCHUTLA': 1.87,
    'HUATULCO': 1.82,
    'CIUDAD HIDALGO': 1.51,
    'CD HIDALGO': 1.51,
    'MOTOZINTLA': 1.48,
    'TAPACHULA': 1.46,
    'HUIXTLA': 1.41,
    'MATIAS ROMERO': 1.38,
    'MAPASTEPEC': 1.33,
    'SALINA CRUZ': 1.31,
    'COMALAPA': 1.29,
    'TEHUANTEPEC': 1.29,
    'COMITAN': 1.29,
    'PIJIJIAPAN': 1.28,
    'JUCHITAN': 1.10,
    'TONALA': 0.93,
    'ARRIAGA': 0.91,
    'SAN CRISTOBAL DE LAS CASAS': 0.88,
    'SAN CRISTOBAL': 0.88,
    'CINTALAPA': 0.83,
    'TUXTLA GUTIERREZ': 0.80,
    'JUAN SABINES': 0.80,
    'SAN ANDRES TUXTLA': 0.74,
    'BENEMERITO': 0.67,
    'OCOSINGO': 0.65,
    'ACAYUCAN': 0.64,
    'HUB TUXTLA': 0.63,
    'ESCARCEGA': 0.63,
    'MINATITLAN': 0.57,
    'COATZACOALCOS': 0.55,
    'PLAZA FLORIDA': 0.55,
    'AVIACION': 0.48,
    'YAJALON': 0.45,
    'LAS CHOAPAS': 0.38,
    'TENOSIQUE': 0.37,
    'AGUA DULCE': 0.37,
    'PALENQUE': 0.35,
    'LA VENTA': 0.35,
    'CANDELARIA': 0.35,
    'BALANCAN': 0.34,
    'JONUTA': 0.30,
    'EMILIANO ZAPATA': 0.29,
    'PARAISO': 0.21,
    'SALTO DE AGUA': 0.21,
    'HUIMANGUILLO': 0.21,
    'PICHUCALCO': 0.20,
    'FRONTERA': 0.19,
    'COMALCALCO': 0.19,
    'CARDENAS': 0.18,
    'TEAPA': 0.18,
    'REFORMA': 0.17,
    'MACUSPANA': 0.17,
    'JALAPA': 0.16,
    'JALPA DE MENDEZ': 0.15,
    'CUNDUACAN': 0.15,
    'CENTRO': 0.12,
    'VILLAHERMOSA': 0.12,
    'VILLA HERMOSA': 0.12
  };

  const getDuracionViajeHrs = (destinoStr) => {
    if (!destinoStr) return 0;
    const dest = normalizeDest(destinoStr);
    if (DURACION_VIAJES_HORAS[dest]) return DURACION_VIAJES_HORAS[dest];
    for (const [key, hrs] of Object.entries(DURACION_VIAJES_HORAS)) {
      if (dest.includes(key)) return hrs;
    }
    return 0;
  };

  const getDuracionViajeDias = (destinoStr, duracionHrs) => {
    if (!destinoStr) return duracionHrs > 0 ? Math.round((duracionHrs / 24) * 100) / 100 : 0;
    const dest = normalizeDest(destinoStr);
    if (DURACION_VIAJES_DIAS[dest] !== undefined) return DURACION_VIAJES_DIAS[dest];
    for (const [key, dias] of Object.entries(DURACION_VIAJES_DIAS)) {
      if (dest.includes(key)) return dias;
    }
    return duracionHrs > 0 ? Math.round((duracionHrs / 24) * 100) / 100 : 0;
  };

  const trip = trips.find(t => esViajeForaneo(t)) || trips[0];
  let duracion = Number(trip.tiempoEstimadoHrs) || 0;
  if (!duracion && trip.destino) {
    duracion = getDuracionViajeHrs(trip.destino);
  }

  const foraneo = esViajeForaneo(trip);
  if (duracion === 0 && !foraneo) {
    duracion = 6;
  }

  const diasMatriz = getDuracionViajeDias(trip.destino, duracion);
  const esViajeLargo = diasMatriz > 1.0 || duracion > 24;

  if (esViajeLargo) {
    return {
      disponible: false,
      regresaManana: false,
      noRegresaManana: true,
      dias: diasMatriz,
      horas: duracion,
      badge: 'NO DISPONIBLE',
      motivo: `Viaje largo (${diasMatriz} días)`,
      detalle: `Duración de ${duracion} hrs (${diasMatriz} días según matriz). No alcanza a regresar mañana.`,
      color: '#f59e0b'
    };
  }

  if (duracion === 0 && foraneo) {
    return {
      disponible: false,
      regresaManana: false,
      noRegresaManana: false,
      dias: null,
      horas: 0,
      badge: 'POR CONFIRMAR',
      motivo: 'Foráneo sin matriz',
      detalle: 'Destino foráneo sin duración registrada en matriz.',
      color: '#f59e0b'
    };
  }

  const isEnRuta = yaPartioDeRuta(trip);
  return {
    disponible: true,
    regresaManana: true,
    noRegresaManana: false,
    dias: diasMatriz,
    horas: duracion,
    badge: 'REGRESA MAÑANA',
    motivo: isEnRuta ? 'En ruta' : 'Ruta programada',
    detalle: `Duración: ${duracion} hrs (${diasMatriz} días según matriz). Retorno estimado para mañana.`,
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
    const masterStatusStr = String(master?.estatus || '').toLowerCase();
    const isTaller = master?.estatus === 'TALLER' || masterStatusStr.includes('taller') || masterStatusStr.includes('siniestro') || records.some(unit =>
      unit.estatusPatio === 'Taller' || unit.estatus === 'TALLER' || unit.estatus === 'SINIESTRO' || unit.estatusPatio === 'Siniestro'
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
    const planStatus = String(unit.estatusPlaneacion || '').trim().toUpperCase();
    if (planStatus === 'NO SE CUBRE' || planStatus === 'CANCELADO') return;
    const noViaje = String(unit.noViaje || '').trim();
    const hasTripNumber = noViaje && !['—', '-', '0', 'SIN VIAJE', 'POR ASIGNAR'].includes(noViaje.toUpperCase());
    tripKeys.add(hasTripNumber ? `viaje-${noViaje}` : `id-${unit.id}`);
  });
  return tripKeys.size;
};

