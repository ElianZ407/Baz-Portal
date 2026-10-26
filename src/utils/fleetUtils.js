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

const CAPACIDADES_SOLO_KANGOO = ['18', 'Kangoo / 18'];
const CAPACIDAD_MAXIMA_KANGOO = 18;

const REGLAS_INCOMPATIBILIDAD = [
  {
    grupo: ['9464'],
    contra: ['2057', '143', '449'],
    mensaje: 'Restricción en Carranza: Sucursal 9464 NO debe enviarse combinada con 2057, 143 o 449'
  },
  {
    grupo: ['8396', '6305'],
    contra: ['3803', '8403', '9684'],
    mensaje: 'Restricción en Juchitán: No debe enviarse combinada con 3803, 8403 o 9684'
  },
  {
    grupo: ['6134'],
    contra: ['6240', '3049', '4158', '7548'],
    mensaje: 'Restricción en Chiapa de Corzo (6134): No enviar con 6240, 3049, 4158 o 7548'
  },
  {
    grupo: ['3049'],
    contra: ['6240', '6134'],
    mensaje: 'Restricción en Villaflores (3049): No enviar con 6240 o 6134'
  }
];

export const validarRestriccionesViaje = (sucursalesList, capUnidad, catalogo = SUCURSALES_MAESTRAS) => {
  if (!sucursalesList || !Array.isArray(sucursalesList) || sucursalesList.length === 0) return [];
  const sucursales = sucursalesList
    .map(item => typeof item === 'string' ? buscarSucursal(item, catalogo) : buscarSucursal(item?.id || item?.num, catalogo))
    .filter(Boolean);

  const alertasCapacidad = sucursales
    .filter(s => CAPACIDADES_SOLO_KANGOO.includes(s.capMax) && capUnidad > CAPACIDAD_MAXIMA_KANGOO)
    .map(s => `Sucursal ${s.id} (${s.nombre}) tiene restricción de acceso: Solo admite unidades Kangoo / 18 (Cap. asignada: ${capUnidad})`);

  const ids = sucursales.map(s => String(s.id));
  const alertasIncompatibilidad = REGLAS_INCOMPATIBILIDAD
    .filter(regla => ids.some(id => regla.grupo.includes(id)) && ids.some(id => regla.contra.includes(id)))
    .map(regla => regla.mensaje);

  return [...alertasCapacidad, ...alertasIncompatibilidad];
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

const INVALIDOS_VIAJE = ['—', '-', '0', 'sin viaje', 'por asignar'];
const INVALIDOS_OPERADOR = ['—', '-', 'por asignar', 'sin asignar', 'vacante', 'baja'];
const INVALIDOS_DESTINO = ['—', '-', 'sin destino', 'por asignar', 'sin asignar'];

const esValorAsignado = (valor, invalidos) => {
  const texto = String(valor || '').trim();
  return Boolean(texto) && !invalidos.includes(texto.toLowerCase());
};

export const checkTieneViajeYOperador = (unit) => {
  if (!unit) return { valid: false, hasViaje: false, hasOperador: false, hasDestino: false };

  const hasViaje = esValorAsignado(unit.noViaje, INVALIDOS_VIAJE);
  const hasOperador = esValorAsignado(unit.operador, INVALIDOS_OPERADOR);
  const hasDestino = esValorAsignado(unit.destino || unit.numSucursal, INVALIDOS_DESTINO);

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

const RESULTADO_SIN_DATOS = {
  disponible: false,
  regresaManana: false,
  motivo: 'Sin datos',
  badge: 'DESCONOCIDO',
  color: '#94a3b8'
};

const RESULTADO_CAMIONETA = {
  disponible: false,
  regresaManana: false,
  noRegresaManana: false,
  esCamioneta: true,
  badge: 'CAMIONETA LOCAL',
  motivo: 'Retorno diario automático',
  detalle: 'Camioneta (18 m³). Retorno diario garantizado.',
  color: '#94a3b8'
};

const RESULTADO_TALLER = {
  disponible: false,
  regresaManana: false,
  badge: 'NO DISPONIBLE',
  motivo: 'En Taller mecánico',
  detalle: 'No disponible por mantenimiento',
  color: '#ef4444'
};

const RESULTADO_FORANEO_SIN_MATRIZ = {
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

const MOTIVOS_PADRON_NO_ACTIVO = { BAJA: 'Unidad dada de baja' };
const MOTIVO_PADRON_FUERA_OPERACION = 'Fuera de operación';
const ESTATUS_PLANEACION_CERRADA = ['COMPLETADO', 'NO SE CUBRE', 'CANCELADO'];
const NUMEROS_DE_VIAJE_VACIOS = ['—', '-', '0'];
const HORAS_VIAJE_LOCAL_POR_DEFECTO = 6;
const LIMITE_HORAS_VIAJE_LARGO = 24;
const LIMITE_DIAS_VIAJE_LARGO = 1.0;

const esViajeCompletado = unit =>
  unit.estatusSupervisor === 'Completado' || ESTATUS_PLANEACION_CERRADA.includes(unit.estatusPlaneacion);

const normalizarDestino = (texto) => {
  if (!texto) return '';
  return String(texto)
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


const buscarEnMatriz = (tabla, destino) => {
  if (tabla[destino] !== undefined) return tabla[destino];
  const clave = Object.keys(tabla).find(nombre => destino.includes(nombre));
  return clave === undefined ? null : tabla[clave];
};

const getDuracionViajeHrs = (destinoStr) => {
  if (!destinoStr) return 0;
  return buscarEnMatriz(DURACION_VIAJES_HORAS, normalizarDestino(destinoStr)) ?? 0;
};

const getDuracionViajeDias = (destinoStr, duracionHrs) => {
  const respaldo = duracionHrs > 0 ? Math.round((duracionHrs / 24) * 100) / 100 : 0;
  if (!destinoStr) return respaldo;
  return buscarEnMatriz(DURACION_VIAJES_DIAS, normalizarDestino(destinoStr)) ?? respaldo;
};

const evaluarCamioneta = ({ units, fleetUnit }) =>
  esCamioneta(units[0]) || (fleetUnit && esCamioneta(fleetUnit)) ? { ...RESULTADO_CAMIONETA } : null;

const evaluarTaller = ({ units, fleetStatus }) => {
  const enTaller = units.some(unit => unit.estatusPatio === 'Taller' || unit.estatus === 'TALLER') ||
    fleetStatus.includes('TALLER');
  return enTaller ? { ...RESULTADO_TALLER } : null;
};

const evaluarEstatusPadron = ({ fleetUnit, fleetStatus }) => {
  const fueraDePadronActivo = fleetStatus && fleetStatus !== 'ACTIVO';
  return fueraDePadronActivo
    ? {
      disponible: false,
      regresaManana: false,
      badge: 'NO DISPONIBLE',
      motivo: MOTIVOS_PADRON_NO_ACTIVO[fleetStatus] || MOTIVO_PADRON_FUERA_OPERACION,
      detalle: `Estatus del padrón: ${fleetUnit.estatus}`,
      color: '#ef4444'
    }
    : null;
};

const REGLAS_PREVIAS_DISPONIBILIDAD = [evaluarCamioneta, evaluarTaller, evaluarEstatusPadron];

const agruparViajesActivos = (units) => {
  const viajesPorClave = new Map();
  units.filter(unit => !esViajeCompletado(unit) && tieneRutaAsignada(unit)).forEach(unit => {
    const numeroViaje = String(unit.noViaje || '').trim();
    const clave = numeroViaje && !NUMEROS_DE_VIAJE_VACIOS.includes(numeroViaje)
      ? `trip-${numeroViaje}`
      : `id-${unit.id}`;
    if (!viajesPorClave.has(clave)) viajesPorClave.set(clave, unit);
  });
  return [...viajesPorClave.values()];
};

const evaluarSinViajes = (units) => {
  const patioLibre = units.some(unit =>
    (unit.estatusPatio === 'Disponible' || !unit.estatusPatio) && !hasTripNumber(unit)
  );
  const disponible = patioLibre || units.some(esViajeCompletado);
  return {
    disponible,
    regresaManana: false,
    badge: disponible ? 'DISPONIBLE' : 'POR CONFIRMAR',
    motivo: disponible ? 'Unidad libre en CEDIS' : 'Por confirmar',
    detalle: disponible ? 'Sin viajes pendientes para esta unidad' : 'Confirma los viajes asignados a la unidad',
    color: disponible ? '#10b981' : '#f59e0b'
  };
};

const evaluarViajesActivos = (trips) => {
  const trip = trips.find(esViajeForaneo) || trips[0];
  const foraneo = esViajeForaneo(trip);
  const horasBase = Number(trip.tiempoEstimadoHrs) || getDuracionViajeHrs(trip.destino);
  const horas = horasBase || (foraneo ? 0 : HORAS_VIAJE_LOCAL_POR_DEFECTO);
  const dias = getDuracionViajeDias(trip.destino, horas);
  const esViajeLargo = dias > LIMITE_DIAS_VIAJE_LARGO || horas > LIMITE_HORAS_VIAJE_LARGO;

  if (esViajeLargo) {
    return {
      disponible: false,
      regresaManana: false,
      noRegresaManana: true,
      dias,
      horas,
      badge: 'NO DISPONIBLE',
      motivo: `Viaje largo (${dias} días)`,
      detalle: `Duración de ${horas} hrs (${dias} días según matriz). No alcanza a regresar mañana.`,
      color: '#f59e0b'
    };
  }

  if (horas === 0 && foraneo) return { ...RESULTADO_FORANEO_SIN_MATRIZ };

  return {
    disponible: true,
    regresaManana: true,
    noRegresaManana: false,
    dias,
    horas,
    badge: 'REGRESA MAÑANA',
    motivo: yaPartioDeRuta(trip) ? 'En ruta' : 'Ruta programada',
    detalle: `Duración: ${horas} hrs (${dias} días según matriz). Retorno estimado para mañana.`,
    color: '#38bdf8'
  };
};

export const evaluarDisponibilidadManana = (unitOrTrips, catalogoFlota = []) => {
  const units = (Array.isArray(unitOrTrips) ? unitOrTrips : [unitOrTrips]).filter(Boolean);
  if (units.length === 0) return { ...RESULTADO_SIN_DATOS };

  const eco = String(units[0].economico || '').trim();
  const fleetUnit = (catalogoFlota || []).find(f => String(f.eco).trim() === eco);
  const fleetStatus = String(fleetUnit?.estatus || '').trim().toUpperCase();

  const contexto = { units, fleetUnit, fleetStatus };
  const resultadoPrevio = REGLAS_PREVIAS_DISPONIBILIDAD.map(regla => regla(contexto)).find(Boolean);
  if (resultadoPrevio) return resultadoPrevio;

  const trips = agruparViajesActivos(units);
  return trips.length === 0 ? evaluarSinViajes(units) : evaluarViajesActivos(trips);
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

const CATEGORIAS_FLOTA = [
  ['taller', situacion => situacion.isTaller],
  ['fueraOperacion', situacion => situacion.fueraOperacion],
  ['cargadas', situacion => situacion.isCargada],
  ['colocadas', situacion => situacion.isColocada],
  ['pendientes', situacion => situacion.isPendiente]
];

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

    const situacion = { isTaller, fueraOperacion: masterStatus !== 'ACTIVO', isCargada, isColocada, isPendiente };
    const categoria = CATEGORIAS_FLOTA.find(([, cumple]) => cumple(situacion));
    if (categoria) counts[categoria[0]]++;
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

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_SEMANA_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_ANIO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_ANIO_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const extraerAnioMesDia = (texto) => {
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  const dmy = texto.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  return dmy ? [Number(dmy[3]), Number(dmy[2]), Number(dmy[1])] : null;
};

const FORMATOS_FECHA_PLAN = {
  largo: (fecha, d, y) => `${DIAS_SEMANA[fecha.getDay()]} ${d} de ${MESES_ANIO[fecha.getMonth()]}, ${y}`,
  corto: (fecha, d, y) => `${DIAS_SEMANA_CORTOS[fecha.getDay()]} ${String(d).padStart(2, '0')}/${MESES_ANIO_CORTOS[fecha.getMonth()]}/${y}`
};

export const formatearFechaPlan = (fechaStr, formato = 'corto') => {
  if (!fechaStr) return '';
  const clean = String(fechaStr).trim();
  const partes = extraerAnioMesDia(clean);
  if (!partes) return clean;

  const [y, m, d] = partes;
  const formatear = FORMATOS_FECHA_PLAN[formato] || FORMATOS_FECHA_PLAN.corto;
  return formatear(new Date(y, m - 1, d), d, y);
};

