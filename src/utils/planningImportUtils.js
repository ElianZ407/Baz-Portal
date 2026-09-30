/**
 * Utilidades para Importar Archivos de Planeación (Excel .xlsx/.xls y CSV)
 * BAZ Entregas CD Villahermosa
 *
 * Lee archivos completos con las 24 columnas operativas:
 * NO. VIAJE | ECO UNIDAD | BLOQUES | PLACAS | CAP UNIDAD | LINEA | OPERADOR | FECHA |
 * # CARGA | # SUC | SUCURSAL | CORTINA | ESTATUS | PLAN DE COLOCACIÓN | COLOCACION |
 * PLAN FIN DE CARGA | ENTREGADO EN CASETA | FOLIO ENVIO | SELLOS |
 * NO. VALE DE ESTRUCTURAS | MOTOS ESTRUCTURAS | MOTOS CARTON | REMOLQUE | MTRS
 */

import { buscarSucursal, crearIndiceFlota, crearIndiceSucursales } from './fleetUtils';

// Clave de comparación para eco, placas, operador o sucursal: sin acentos ni mayúsculas
const claveEco = (value) => String(value === null || value === undefined ? '' : value)
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

// Destinos que exigen pernocta fuera de Villahermosa
const KEYWORDS_FORANEO = [
  'chiapas', 'tuxtla', 'san cristobal', 'tapachula', 'comitan', 'ocosingo', 'palenque',
  'villaflores', 'arriaga', 'tonala', 'cintalapa', 'jiquipilas', 'pichucalco',
  'veracruz', 'coatzacoalcos', 'minatitlan', 'acayucan', 'san andres', 'texistepec', 'oluta',
  'oaxaca', 'tabasco' // Nota: tabasco sin ciudad específica puede ser foráneo
];

const KEYWORDS_LOCAL = [
  'villahermosa', 'cunduacan', 'cárdenas', 'cardenas', 'comalcalco',
  'paraiso', 'paraíso', 'macuspana', 'balancán', 'balancan', 'tenosique',
  'huimanguillo', 'jalpa', 'jonuta', 'nacajuca', 'centla', 'tab', 'vhsa'
];

// Busca la sucursal por índice y cae al barrido lineal solo si no hay coincidencia exacta
const buscarSucursalIndexada = (query, indice) => {
  if (!query) return null;
  const clave = claveEco(query);
  if (!clave) return null;
  return indice.porId.get(clave) || indice.porNombre.get(clave) || buscarSucursal(query, indice.lista);
};

// Inferir F/L: primero el catálogo de sucursales, luego keywords del destino
const inferirFL = (destName = '', numSuc = '', sucInfoData = null) => {
  if (sucInfoData?.fl) return sucInfoData.fl === 'LOCAL' ? 'LOCAL' : sucInfoData.fl;

  const destino = String(destName || '').toLowerCase();
  for (const keyword of KEYWORDS_LOCAL) {
    if (destino.includes(keyword)) return 'LOCAL';
  }
  for (const keyword of KEYWORDS_FORANEO) {
    if (destino.includes(keyword)) return 'FORANEO';
  }
  return 'LOCAL';
};

// Normaliza nombres de encabezados quitando acentos, puntuación, saltos de línea y espacios no separables
export const normalizeHeaderKey = (rawHeader) => {
  if (!rawHeader) return '';
  return String(rawHeader)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .toLowerCase()
    .replace(/[\r\n\t\v\f]/g, ' ')   // Convertir saltos de línea a espacios
    .replace(/[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ') // Espacios especiales
    .replace(/[#._\-/:,№°º]/g, ' ') // Quitar signos comunes en encabezados
    .replace(/\s+/g, ' ')
    .trim();
};

// Diccionario de sinónimos para detectar las 24 columnas oficiales
export const COLUMN_DEFINITIONS = {
  // 1. Número de Viaje
  noViaje: [
    'no viaje', 'viaje', 'num viaje', 'numero viaje', 'n viaje', 
    'no de viaje', 'viaje no', 'id viaje', 'folio viaje'
  ],
  // 2. Económico / Unidad
  economico: [
    'eco unidad', 'eco', 'economico', 'no eco', 'num eco', 
    'unidad', 'tracto', 'camion', 'vehiculo'
  ],
  // 3. Bloques
  bloque: [
    'bloques', 'bloque', 'blq', 'bloq', 'bloq no'
  ],
  // 4. Placas
  placas: [
    'placas', 'placa', 'matricula'
  ],
  // 5. Capacidad
  capUnidad: [
    'cap unidad', 'capacidad unidad', 'capacidad', 'cap', 'tamano unidad'
  ],
  // 6. Línea Fletera
  linea: [
    'linea', 'linea transporte', 'linea fletera', 'fletera', 'empresa transporte'
  ],
  // 7. Operador
  operador: [
    'operador', 'chofer', 'conductor', 'nombre operador', 'operador unidad'
  ],
  // 8. Fecha
  fecha: [
    'fecha', 'dia', 'date', 'fecha viaje', 'fecha embarque'
  ],
  tiempoEstimadoHrs: [
    'horas de ida', 'tiempo estimado ida hrs', 'tiempo estimado de ida hrs',
    'duracion de ida hrs', 'horas de manejo ida'
  ],
  // 9. # Carga (Debe ser específico para no colisionar con fin de carga)
  numCarga: [
    'carga', 'num carga', 'no carga', 'numero carga', 'cve carga', 'embarque', 'id carga'
  ],
  // 10. # Sucursal (Número de Tienda)
  numSucursal: [
    'suc', 'num suc', 'no suc', 'numero suc', 'tienda', 'num tienda', 'no tienda', 'id sucursal'
  ],
  // 11. Sucursal / Destino (Nombre completo de la tienda)
  destino: [
    'sucursal', 'destino', 'nombre sucursal', 'nombre tienda', 'destino sucursal', 'tienda destino'
  ],
  // 12. Cortina
  cortina: [
    'cortina', 'cortinas', 'anden', 'andenes', 'rampa', 'puerta'
  ],
  // 13. Estatus
  estatus: [
    'estatus', 'estado', 'status', 'estatus planeacion', 'estatus embarque'
  ],
  // 14. Plan de Colocación
  horaColocacion: [
    'plan de colocacion', 'plan colocacion', 'colocacion programada', 'h colocacion', 'hora colocacion'
  ],
  // 15. Colocación Real
  horaColocacionReal: [
    'colocacion', 'colocacion real', 'hora colocacion real', 'colocado a las'
  ],
  // 16. Plan Fin de Carga
  horaFinCarga: [
    'plan fin de carga', 'plan fin carga', 'fin carga', 'fin de carga', 'hora fin carga'
  ],
  // 17. Entregado en Caseta
  horaCaseta: [
    'entregado en caseta', 'entrega caseta', 'caseta', 'hora caseta', 'salida caseta', 'hora salida caseta'
  ],
  // 18. Folio Envío
  folioEnvio: [
    'folio envio', 'folio envio', 'folio', 'folio embarque', 'remision', 'remision envio'
  ],
  // 19. Sellos
  sellos: [
    'sellos', 'sello', 'sellos seguridad', 'candados', 'sellos caseta'
  ],
  // 20. Vale de Estructuras
  valeEstructura: [
    'no vale de estructuras', 'no vale de estructura', 'vale de estructuras', 
    'vale estructuras', 'vale estructura', 'no vale estructuras', 'num vale estructuras'
  ],
  // 21. Motos Estructuras
  motosEstructuras: [
    'motos estructuras', 'motos estructura', 'estructuras', 'motos est'
  ],
  // 22. Motos Cartón
  motosCarton: [
    'motos carton', 'motos en carton', 'carton', 'motos cart'
  ],
  // 23. Remolque
  remolque: [
    'remolque', 'no remolque', 'caja', 'placas remolque', 'num remolque'
  ],
  // 24. Metros (MTRS)
  mtrs: [
    'mtrs', 'metros', 'mts', 'metros lineales', 'volumen'
  ]
};

// Índice de encabezados precompilado: se arma una sola vez al cargar el módulo
// para no crear decenas de RegEx por cada celda candidata a encabezado.
const HEADER_EXACTOS = new Map();
const HEADER_PATRONES = [];

Object.entries(COLUMN_DEFINITIONS).forEach(([canonicalKey, synonyms]) => {
  synonyms.forEach(syn => {
    const norm = normalizeHeaderKey(syn);
    if (!norm) return;
    // Gana la primera columna declarada que use ese sinónimo
    if (!HEADER_EXACTOS.has(norm)) HEADER_EXACTOS.set(norm, canonicalKey);
    const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    HEADER_PATRONES.push({
      key: canonicalKey,
      len: norm.length,
      re: new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i')
    });
  });
});

// El patrón más largo (más específico) se prueba primero: 'plan de colocacion' gana sobre 'colocacion'
HEADER_PATRONES.sort((a, b) => b.len - a.len);

// Determina el campo canónico para un encabezado dado con prioridad exacta para evitar colisiones
export const matchColumnKey = (rawHeader) => {
  const norm = normalizeHeaderKey(rawHeader);
  if (!norm) return null;

  // Paso 1: Coincidencia EXACTA (Garantiza que 'sucursal' vaya a 'destino' y no a 'numSucursal')
  const exacto = HEADER_EXACTOS.get(norm);
  if (exacto) return exacto;

  // Paso 2: Coincidencia por palabra completa, gana la más específica
  for (const patron of HEADER_PATRONES) {
    if (patron.re.test(norm)) return patron.key;
  }

  return null;
};

// Normaliza el valor crudo de una celda resolviendo fórmulas, texto enriquecido,
// hipervínculos y errores de Excel para no perder información al leer el archivo
const normalizeCellValue = (val) => {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return val;
  if (typeof val !== 'object') return val;

  if (val.error) return '';
  if (val.result !== undefined && val.result !== null) {
    if (typeof val.result === 'object' && val.result.error) return '';
    return normalizeCellValue(val.result);
  }
  if (Array.isArray(val.richText)) {
    return val.richText.map(t => t.text || '').join('').trim();
  }
  if (val.hyperlink !== undefined) return String(val.text || val.hyperlink).trim();
  if (val.text !== undefined) return String(val.text).trim();

  return '';
};

// Vuelca una fila de ExcelJS a un arreglo denso de valores primitivos.
// Usa row.values (mucho más rápido que getCell en cada columna) y conserva el
// índice absoluto de columna para alinear con el mapa de encabezados.
const extractRowValues = (row) => {
  if (!row) return [];
  const values = row.values;
  if (!values || values.length <= 1) return [];

  const out = new Array(values.length - 1);
  let hasAnyValue = false;
  for (let c = 1; c < values.length; c++) {
    const val = normalizeCellValue(values[c]);
    out[c - 1] = val;
    if (val !== '') hasAnyValue = true;
  }

  return hasAnyValue ? out : [];
};

// Lee todas las filas de una hoja respetando los índices reales de fila
const extractSheetRows = (worksheet) => {
  const rows = [];
  const maxRow = Math.max(worksheet.rowCount || 0, worksheet.actualRowCount || 0);

  if (maxRow > 0) {
    for (let r = 1; r <= maxRow; r++) {
      rows.push(extractRowValues(worksheet.getRow(r)));
    }
    return rows;
  }

  worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    rows[rowNumber - 1] = extractRowValues(row);
  });
  return rows;
};

// Formateador de Horas (soporta fracciones de Excel, fechas y strings)
export const parseTimeValue = (val) => {
  if (val === null || val === undefined || val === '') return '';

  // Si ya es un string con formato tipo "6:00", "06:00", "06:00:00", "6:00 AM", etc.
  const str = String(val).trim();
  const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i;
  const match = str.match(timeRegex);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[4]?.toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  // Si es un objeto Date
  if (val instanceof Date) {
    // Si el año es 1899 o 1900 (fecha base de tiempo en Excel)
    if (val.getFullYear() <= 1901) {
      const utcHours = val.getUTCHours();
      const utcMinutes = val.getUTCMinutes();
      return `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
    }
    const hh = String(val.getHours()).padStart(2, '0');
    const mm = String(val.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // Si es número (fracción de día en Excel, ej. 0.25 = 06:00)
  if (typeof val === 'number') {
    if (val >= 0 && val < 1) {
      const totalMinutes = Math.round(val * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    if (val >= 1 && val <= 24) {
      return `${String(Math.floor(val)).padStart(2, '0')}:00`;
    }
  }

  return str;
};

// Formateador de Fechas
export const parseDateValue = (val, fallbackDate = '') => {
  if (val === null || val === undefined || val === '') return fallbackDate;

  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }

  if (typeof val === 'number' && val > 30000 && val < 70000) {
    // Número serial de Excel (días desde 1899-12-30)
    const days = Math.floor(val);
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + days * 86400000);
    return jsDate.toISOString().split('T')[0];
  }

  const str = String(val).trim();
  // Formato tipo "9/25/2026" o "25/09/2026" o "2026-09-25"
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      let [p1, p2, p3] = parts;
      if (p3.length === 2) p3 = `20${p3}`;
      // Si p1 > 12, es DD/MM/YYYY
      if (parseInt(p1, 10) > 12) {
        return `${p3}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      }
      // Por defecto en Excel en formato US: MM/DD/YYYY
      return `${p3}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
    }
  }

  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return str;
    }
  }

  return fallbackDate || new Date().toISOString().split('T')[0];
};

// Los tres estatus canónicos que consumen las vistas de la app
const ESTADO_PENDIENTE = { estatusPlaneacion: 'PENDIENTE', estatusPatio: 'Disponible', estatusSupervisor: 'Pendiente' };
const ESTADO_COLOCADO = { estatusPlaneacion: 'COLOCADO', estatusPatio: 'Colocado p/ Carga', estatusSupervisor: 'Pendiente' };
const ESTADO_CARGADO = { estatusPlaneacion: 'CARGADO', estatusPatio: 'Cargado', estatusSupervisor: 'Cargado' };
const ESTADO_EN_RUTA = { estatusPlaneacion: 'CARGADO', estatusPatio: 'En Ruta', estatusSupervisor: 'En Ruta' };
const ESTADO_ESPERA_DESCARGA = { estatusPlaneacion: 'CARGADO', estatusPatio: 'En Ruta', estatusSupervisor: 'Espera Descarga' };
const ESTADO_DESCARGANDO = { estatusPlaneacion: 'CARGADO', estatusPatio: 'Descargando', estatusSupervisor: 'Descargando' };
const ESTADO_RETRASADO = { estatusPlaneacion: 'CARGADO', estatusPatio: 'En Ruta', estatusSupervisor: 'Retrasado' };
const ESTADO_RETORNO = { estatusPlaneacion: 'RETORNO', estatusPatio: 'Disponible', estatusSupervisor: 'Retorno' };
const ESTADO_COMPLETADO = { estatusPlaneacion: 'COMPLETADO', estatusPatio: 'Disponible', estatusSupervisor: 'Completado' };
const ESTADO_TALLER = { estatusPlaneacion: 'PENDIENTE', estatusPatio: 'Taller', estatusSupervisor: 'No Disponible' };
const ESTADO_NO_DISPONIBLE = { estatusPlaneacion: 'PENDIENTE', estatusPatio: 'No Disponible', estatusSupervisor: 'No Disponible' };

// Valores literales que emite BAZ (y el export oficial de la app)
const ESTATUS_EXACTOS = {
  'PENDIENTE': ESTADO_PENDIENTE,
  'SIN ESTATUS': ESTADO_PENDIENTE,
  'NO ASIGNADO': ESTADO_PENDIENTE,
  'PLAN DE COLOCACION': ESTADO_PENDIENTE,
  'PROGRAMADO': ESTADO_PENDIENTE,
  'COLOCADO': ESTADO_COLOCADO,
  'EN COLOCACION': ESTADO_COLOCADO,
  'ACOMODADO': ESTADO_COLOCADO,
  'CARGADO': ESTADO_CARGADO,
  'EN CASETA': ESTADO_CARGADO,
  'CASETA': ESTADO_CARGADO,
  'CARGADO EN CASETA': ESTADO_CARGADO,
  'EN RUTA': ESTADO_EN_RUTA,
  'RUTA': ESTADO_EN_RUTA,
  'EN CAMINO': ESTADO_EN_RUTA,
  'TRANSITO': ESTADO_EN_RUTA,
  'ESPERA DESCARGA': ESTADO_ESPERA_DESCARGA,
  'EN ESPERA DESCARGA': ESTADO_ESPERA_DESCARGA,
  'ESPERANDO DESCARGA': ESTADO_ESPERA_DESCARGA,
  'RETRASADO': ESTADO_RETRASADO,
  'EN RETRASO': ESTADO_RETRASADO,
  'DESCARGANDO': ESTADO_DESCARGANDO,
  'EN DESCARGA': ESTADO_DESCARGANDO,
  'EN SUCURSAL': ESTADO_DESCARGANDO,
  'RETORNO': ESTADO_RETORNO,
  'EN RETORNO': ESTADO_RETORNO,
  'COMPLETADO': ESTADO_COMPLETADO,
  'FINALIZADO': ESTADO_COMPLETADO,
  'ENTREGADO': ESTADO_COMPLETADO,
  'CERRADO': ESTADO_COMPLETADO,
  'TALLER': ESTADO_TALLER,
  'EN TALLER': ESTADO_TALLER,
  'MANTENIMIENTO': ESTADO_TALLER,
  'NO DISPONIBLE': ESTADO_NO_DISPONIBLE,
  'FUERA DE OPERACION': ESTADO_NO_DISPONIBLE,
  'FUERA DE SERVICIO': ESTADO_NO_DISPONIBLE,
  'BAJA': ESTADO_NO_DISPONIBLE,
  'VACACION': ESTADO_NO_DISPONIBLE,
  'INCAPACIDAD': ESTADO_NO_DISPONIBLE
};

// Reglas por palabra clave. El orden es la prioridad: gana la primera que coincide,
// por eso DESCARGA va antes que CARGADO ('DESCARGADO' contiene 'CARGADO').
const REGLAS_ESTATUS = [
  { estado: ESTADO_TALLER, claves: ['TALLER', 'MANTENIMIENTO', 'MECANICO', 'LAVADO', 'REPARACION'] },
  { estado: ESTADO_NO_DISPONIBLE, claves: ['NO DISPONIBLE', 'FUERA DE OPERACION', 'FUERA DE SERVICIO', 'BAJA', 'VACACION', 'INCAPACIDAD', 'INVENTARIO', 'AUDITORIA'] },
  { estado: ESTADO_COMPLETADO, claves: ['COMPLETADO', 'COMPLETAR', 'FINALIZADO', 'FINALIZ', 'CERRADO', 'CERRAD', 'ENTREGADO', 'ENTREGA REALIZADA', 'LIQUIDADO', 'CONCLUIDO'] },
  { estado: ESTADO_RETORNO, claves: ['RETORNO', 'REGRESO', 'REGRESANDO', 'VUELTA'] },
  { estado: ESTADO_RETRASADO, claves: ['RETRASADO', 'RETRASO', 'DEMORA', 'DETERIORADO'] },
  { estado: ESTADO_ESPERA_DESCARGA, claves: ['ESPERA DESCARGA', 'ESPERA', 'ESPERANDO', 'EN COLA', 'ACHACASO', 'ACACHO'] },
  { estado: ESTADO_DESCARGANDO, claves: ['DESCARGA', 'DESCARGANDO', 'DESCARGADO', 'DESCARGUE', 'RAMPA'] },
  { estado: ESTADO_EN_RUTA, claves: ['RUTA', 'TRANSITO', 'EN CAMINO', 'SALIO', 'SALIENDO', 'PARTIO', 'PARTIDA', 'SALIDA', 'DISTRIBUCION', 'TRASLADO'] },
  { estado: ESTADO_CARGADO, claves: ['CASETA', 'CARGADO', 'CARGADA', 'CARGA CERRADA'] },
  { estado: ESTADO_COLOCADO, claves: ['COLOCADO', 'COLOCACION', 'ACOMODADO', 'POSICIONADO', 'LISTO PARA CARGA', 'CORTINA'] }
];

// Compara estatus sin acentos, mayúsculas ni espacios extra
const normalizeEstatus = (value) => String(value === null || value === undefined ? '' : value)
  .trim()
  .toUpperCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ');

// Mapeador de Estatus Oficial BAZ.
// Devuelve los tres estatus canónicos y `conocido` para avisar en la previsualización
// cuando el archivo trae un valor que ninguna regla reconoce.
export const parseEstatusBaz = (rawEstatus) => {
  const norm = normalizeEstatus(rawEstatus);
  if (!norm) return { ...ESTADO_PENDIENTE, conocido: true };

  const exacto = ESTATUS_EXACTOS[norm];
  if (exacto) return { ...exacto, conocido: true };

  for (const regla of REGLAS_ESTATUS) {
    for (const clave of regla.claves) {
      if (norm.includes(clave)) return { ...regla.estado, conocido: true };
    }
  }

  return { ...ESTADO_PENDIENTE, conocido: false };
};

// Dos estatus son equivalentes cuando la app los mostraría igual. Sirve para saber
// si una fila sin unidad es una parada del viaje actual o un viaje nuevo.
export const estatusEquivalentes = (a, b) => {
  if (!a || !b) return false;
  return a.estatusPlaneacion === b.estatusPlaneacion && a.estatusSupervisor === b.estatusSupervisor;
};

// Clave de caché del libro ya leído en memoria
const cacheKeyOf = (file) => `${file.name}|${file.size}|${file.lastModified || 0}`;

// Libros ya leídos: cambiar de pestaña NO vuelve a descomprimir ni a reparsear el archivo
const LIBROS_CACHE = new Map();
const MAX_LIBROS_EN_CACHE = 3;

// Lee el archivo UNA sola vez y guarda todas sus pestañas con sus filas crudas.
// A partir de aquí, cambiar de día es solo un recorrido de memoria.
const leerLibroCompleto = async (file) => {
  const clave = cacheKeyOf(file);
  const enCache = LIBROS_CACHE.get(clave);
  if (enCache) return enCache;

  const fileName = file.name.toLowerCase();
  const esCsv = fileName.endsWith('.csv');
  let hojas = [];
  let activeTab = 0;

  if (esCsv) {
    const rows = parseCsvToRows(await file.text()).map(fila => (fila.some(v => v !== '') ? fila : []));
    hojas = [{
      index: 1,
      id: '1',
      name: 'Archivo CSV',
      displayName: 'Archivo CSV',
      dayNumber: null,
      esDiaActual: false,
      rowCount: rows.length,
      rows
    }];
  } else {
    const ExcelJSModule = await import('exceljs/dist/exceljs.min.js');
    const ExcelJS = ExcelJSModule.default || ExcelJSModule;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());

    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      throw new Error('El archivo Excel no contiene hojas de cálculo legibles.');
    }

    activeTab = workbook.views?.[0]?.activeTab ?? 0;
    const hoy = new Date().getDate();

    // Pestañas diarias identificadas por su NOMBRE (ej: '26', '25', '08')
    hojas = workbook.worksheets.map((ws, idx) => {
      const tabName = String(ws.name || '').trim();
      const numVal = parseInt(tabName, 10);
      const isDayTab = !isNaN(numVal) && numVal >= 1 && numVal <= 31;
      const rows = extractSheetRows(ws);

      return {
        index: idx + 1,
        id: String(ws.id || idx + 1),
        name: tabName || `Hoja ${idx + 1}`,
        displayName: isDayTab ? `Día ${tabName}` : (tabName || `Hoja ${idx + 1}`),
        dayNumber: isDayTab ? numVal : null,
        esDiaActual: isDayTab && numVal === hoy,
        rowCount: rows.length,
        rows
      };
    });
  }

  const libro = { hojas, activeTab };
  LIBROS_CACHE.set(clave, libro);
  if (LIBROS_CACHE.size > MAX_LIBROS_EN_CACHE) {
    LIBROS_CACHE.delete(LIBROS_CACHE.keys().next().value);
  }
  return libro;
};

// Elige la pestaña a importar: la que pidió el usuario, luego la que estaba activa
// en Excel y, si no, la más cercana al día de hoy.
const elegirHoja = (libro, preferredSheet) => {
  const hojas = libro.hojas;
  const pref = preferredSheet === null || preferredSheet === undefined ? '' : String(preferredSheet).trim();
  let elegida = null;

  if (pref) {
    const prefLower = pref.toLowerCase();
    const prefNum = parseInt(pref, 10);

    elegida = hojas.find(h => h.name.toLowerCase() === prefLower) || null;

    if (!elegida && !isNaN(prefNum)) {
      elegida = hojas.find(h => h.dayNumber === prefNum) || null;
    }

    if (!elegida) {
      elegida = hojas.find(h => h.name.toLowerCase().includes(prefLower)) || null;
    }
  }

  if (!elegida && libro.activeTab > 0) {
    elegida = hojas[libro.activeTab] || null;
  }

  const hoy = new Date().getDate();
  if (!elegida) {
    elegida = hojas.find(h => h.dayNumber === hoy) || null;
  }

  if (!elegida) {
    const dias = hojas.filter(h => h.dayNumber !== null);
    elegida = dias.length > 0
      ? dias.reduce((mejor, h) => (Math.abs(h.dayNumber - hoy) < Math.abs(mejor.dayNumber - hoy) ? h : mejor))
      : hojas[hojas.length - 1];
  }

  return elegida;
};

// Si la fecha del encabezado no corresponde al día de la pestaña, se corrige al día
const ajustarFechaAlDia = (fechaIso, dayNumber) => {
  if (!fechaIso || !dayNumber) return fechaIso;
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  if (!anio || !mes || !dia) return fechaIso;

  const ultimoDiaDelMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const diaObjetivo = Math.min(dayNumber, ultimoDiaDelMes);
  if (diaObjetivo === dia) return fechaIso;

  return `${anio}-${String(mes).padStart(2, '0')}-${String(diaObjetivo).padStart(2, '0')}`;
};

/**
 * Lee un archivo Excel (.xlsx / .xls) o CSV y extrae TODOS los viajes y entregas
 */
export const parsePlanningFile = async (
  file, 
  catalogoFlota = [], 
  catalogoSucursales = [], 
  preferredSheet = null
) => {
  const libro = await leerLibroCompleto(file);
  const hoja = elegirHoja(libro, preferredSheet);
  if (!hoja) throw new Error('El archivo seleccionado está vacío.');

  return construirPlanDesdeFilas(hoja, libro, catalogoFlota, catalogoSucursales);
};

// Convierte las filas crudas de una pestaña en los viajes del plan.
// Las filas ya están en memoria: este paso es el que corre al cambiar de día.
const construirPlanDesdeFilas = (hoja, libro, catalogoFlota = [], catalogoSucursales = []) => {
  const rows = hoja.rows || [];
  if (rows.length === 0) {
    throw new Error('El archivo seleccionado está vacío.');
  }

  // 1. Detectar Fila de Encabezados (Buscar en las primeras 50 filas)
  let headerRowIndex = -1;
  let columnMap = {}; // { colIndex: 'canonicalKey' }
  let maxMatches = 0;
  let fileHeaderDate = '';

  for (let r = 0; r < Math.min(rows.length, 50); r++) {
    const candidateRow = rows[r];
    if (!Array.isArray(candidateRow) || candidateRow.length === 0) continue;

    // Buscar si hay alguna fecha en las filas anteriores al header (como la fila 1 de BAZ)
    if (r < 5 && !fileHeaderDate) {
      for (const cellVal of candidateRow) {
        if (cellVal) {
          const strVal = String(cellVal).trim();
          if (strVal.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/)) {
            fileHeaderDate = parseDateValue(strVal);
            break;
          }
        }
      }
    }

    const currentMap = {};
    let matchesCount = 0;

    candidateRow.forEach((cell, idx) => {
      if (!cell) return;
      const canonical = matchColumnKey(cell);
      if (canonical) {
        currentMap[idx] = canonical;
        matchesCount++;
      }
    });

    // Si tiene al menos 3 encabezados reconocidos (ej. eco, sucursal, carga)
    if (matchesCount >= 3 && matchesCount > maxMatches) {
      maxMatches = matchesCount;
      headerRowIndex = r;
      columnMap = currentMap;
    }
  }

  if (headerRowIndex === -1 || maxMatches < 3) {
    throw new Error('No se encontraron los encabezados oficiales de planeación en el archivo. Verifica que contenga columnas como: NO. VIAJE, ECO UNIDAD, SUCURSAL, CARGA, OPERADOR.');
  }

  // 2. Índices de catálogo: buscar por eco, operador o sucursal deja de ser un barrido lineal
  const indiceFlota = crearIndiceFlota(catalogoFlota);
  const indiceSucursales = crearIndiceSucursales(catalogoSucursales);
  const columnas = Object.entries(columnMap).map(([colIdx, key]) => [Number(colIdx), key]);

  // 3. Procesar TODAS las Filas de Datos sin omisiones
  const parsedUnits = [];
  const estatusSinReconocer = new Set();
  let currentUnit = null;
  const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const defaultDate = ajustarFechaAlDia(
    fileHeaderDate || new Date().toISOString().split('T')[0],
    hoja.dayNumber
  );

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const rawRow = rows[i];
    if (!rawRow || rawRow.length === 0) continue;

    // Extraer campos de la fila según columnMap
    const rowData = {};
    for (let c = 0; c < columnas.length; c++) {
      const val = rawRow[columnas[c][0]];
      rowData[columnas[c][1]] = val === undefined || val === null ? '' : val;
    }

    const eco = String(rowData.economico || '').trim();
    const noViaje = String(rowData.noViaje || '').trim();
    const sucursal = String(rowData.destino || '').replace(/\s*\(Retorno\)/gi, '').trim();
    const numSucursal = String(rowData.numSucursal || '').trim();
    const numCarga = String(rowData.numCarga || '').trim();
    const cortina = String(rowData.cortina || '').trim();
    const operador = String(rowData.operador || '').trim();
    const bloque = rowData.bloque !== '' && rowData.bloque !== undefined ? Number(rowData.bloque) : null;
    const placas = String(rowData.placas || '').trim();
    const linea = String(rowData.linea || '').trim();
    const estatusRaw = String(rowData.estatus || '').trim();
    const horaColocacion = parseTimeValue(rowData.horaColocacion) || '';
    const mtrs = Number(rowData.mtrs) || 0;

    // Fila completamente en blanco -> ignorar
    const hasAnySignificantData = eco || noViaje || sucursal || numSucursal || numCarga || 
      operador || cortina || (bloque !== null && !isNaN(bloque)) || placas || linea || estatusRaw;
    if (!hasAnySignificantData) {
      continue;
    }

    // Regla de Oro BAZ: ¿Cuándo una fila es una PARADA SECUNDARIA vs un VIAJE INDEPENDIENTE?
    // Es una parada secundaria ÚNICAMENTE cuando:
    // 1. Hay un viaje activo previo (currentUnit).
    // 2. NO tiene económico, NO tiene viaje, NO tiene operador, NO tiene placas, NO tiene línea.
    // 3. NO tiene bloque propio o coincide con el bloque del viaje previo.
    // 4. NO tiene cortina propia o coincide con la del viaje previo.
    // 5. NO tiene carga propia o coincide con la carga del viaje previo.
    // 6. NO tiene hora de colocación propia.
    // 7. Su estatus es vacío o equivalente al del viaje en curso (el estatus es del viaje, no de la fila).
    // 8. Y SÍ tiene sucursal o # sucursal.
    const estatusObj = parseEstatusBaz(estatusRaw);
    if (estatusRaw && !estatusObj.conocido) estatusSinReconocer.add(estatusRaw);

    const estatusCompatible = !estatusRaw || !currentUnit ||
      estatusEquivalentes(estatusObj, currentUnit);

    const hasTripOwnershipMarkers = Boolean(
      eco || 
      noViaje || 
      operador || 
      placas || 
      linea ||
      (numCarga && currentUnit && numCarga !== currentUnit.numCarga) ||
      (bloque !== null && currentUnit && bloque !== currentUnit.bloque) ||
      (cortina && currentUnit && cortina !== currentUnit.cortina) ||
      horaColocacion
    );

    const isSecondaryStop = Boolean(
      currentUnit && !hasTripOwnershipMarkers && estatusCompatible && (sucursal || numSucursal)
    );

    if (isSecondaryStop) {
      const parada = {
        id: `parada-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        numSucursal: numSucursal,
        destino: sucursal,
        numCarga: numCarga || currentUnit.numCarga || '',
        cortina: cortina || currentUnit.cortina || '',
        mtrs: mtrs
      };

      // Si la sucursal secundaria existe en catálogo, autocompletar clóster
      const sucInfo = buscarSucursalIndexada(numSucursal || sucursal, indiceSucursales);
      if (sucInfo) {
        parada.closter = sucInfo.closter || '';
        if (!parada.destino) parada.destino = sucInfo.nombre;
        if (!parada.numSucursal) parada.numSucursal = String(sucInfo.id);
      }

      currentUnit.destinosSecundarios.push(parada);
      continue;
    }

    // VIAJE NUEVO / INDEPENDIENTE (incluso si aún no tiene ECO asignado, como viajes programados en cortina)
    const unitDate = parseDateValue(rowData.fecha, defaultDate);

    // Auto-completar datos con catálogo de flota
    const fleetMaster = eco ? indiceFlota.porEco.get(claveEco(eco)) || null : null;
    const finalPlacas = placas || fleetMaster?.placas || '';
    const finalCap = Number(rowData.capUnidad || fleetMaster?.capUnidad) || 18;
    const finalLinea = linea || fleetMaster?.linea || 'LTI - VHS';
    const finalOperador = operador || fleetMaster?.operador || '';
    const finalIdOperador = finalOperador
      ? (indiceFlota.idOperadorPorNombre.get(claveEco(finalOperador)) || '')
      : (fleetMaster?.idOperador || '');

    // Auto-completar datos con catálogo de sucursales
    const sucInfo = buscarSucursalIndexada(numSucursal || sucursal, indiceSucursales);
    const finalDestino = sucursal || (sucInfo ? sucInfo.nombre : '');
    const finalNumSuc = numSucursal || (sucInfo ? String(sucInfo.id) : '');
    const finalCloster = sucInfo ? (sucInfo.closter || '') : 'HUB-VHSA';
    const finalCapMax = sucInfo ? (sucInfo.capMax || '') : '';

    const finalFL = inferirFL(finalDestino, finalNumSuc, sucInfo);

    const newUnit = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : `baz-imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      noViaje: noViaje,
      economico: eco,
      bloque: (bloque !== null && !isNaN(bloque)) ? bloque : (currentUnit?.bloque || 1),
      placas: finalPlacas,
      capUnidad: finalCap,
      linea: finalLinea,
      tipo: fleetMaster?.tipo || (finalCap > 18 ? 'Sencillo' : 'Camioneta'),
      operador: finalOperador,
      idOperador: finalIdOperador,
      turno: 'M1',
      cortina: cortina,
      numCarga: numCarga,
      numSucursal: finalNumSuc,
      sucursalOrigen: 'CEDIS VILLAHERMOSA',
      destino: finalDestino,
      destinosSecundarios: [],
      closter: finalCloster,
      fl: finalFL,
      capMax: finalCapMax,
      fecha: unitDate,
      horaSalida: parseTimeValue(rowData.horaCaseta) || '',
      tiempoEstimadoHrs: Number(rowData.tiempoEstimadoHrs) || 0,
      eta: '',
      horaColocacion: horaColocacion || '06:00',
      horaColocacionReal: parseTimeValue(rowData.horaColocacionReal) || '',
      horaFinCarga: parseTimeValue(rowData.horaFinCarga) || '07:30',
      horaCaseta: parseTimeValue(rowData.horaCaseta) || '',
      folioEnvio: String(rowData.folioEnvio || '').trim(),
      sellos: String(rowData.sellos || '').trim(),
      valeEstructura: String(rowData.valeEstructura || '0').trim(),
      motosEstructuras: Number(rowData.motosEstructuras) || 0,
      motosCarton: Number(rowData.motosCarton) || 0,
      remolque: String(rowData.remolque || '0').trim(),
      mtrs: mtrs || finalCap,
      estatusPatio: estatusObj.estatusPatio,
      estatusPlaneacion: estatusObj.estatusPlaneacion,
      estatusSupervisor: estatusObj.estatusSupervisor,
      estatusOrigen: estatusRaw,
      observaciones: '',
      actualizadoEn: now
    };

    parsedUnits.push(newUnit);
    currentUnit = newUnit;
  }

  if (parsedUnits.length === 0) {
    throw new Error('No se detectaron viajes válidos en el archivo. Asegúrate de que las filas tengan al menos el número de carga, sucursal o unidad.');
  }

  return {
    units: parsedUnits,
    totalViajes: parsedUnits.length,
    fechaDetectada: defaultDate,
    nombreHoja: hoja.name,
    indiceHoja: hoja.index,
    hojasDisponibles: libro.hojas.map(h => ({
      index: h.index,
      id: h.id,
      name: h.name,
      displayName: h.displayName,
      dayNumber: h.dayNumber,
      esDiaActual: h.esDiaActual,
      rowCount: h.rowCount
    })),
    estatusSinReconocer: [...estatusSinReconocer],
    columnasDetectadas: Object.values(columnMap)
  };
};

// Parser robusto de texto CSV compatible con comillas y delimitadores variados (, ; \t)
function parseCsvToRows(text) {
  const lines = text.split(/\r\n|\n|\r/);
  if (lines.length === 0) return [];

  // Detectar delimitador inspeccionando la primera línea no vacía
  const sampleLine = lines.find(l => l.trim().length > 0) || '';
  let delimiter = ',';
  const commaCount = (sampleLine.match(/,/g) || []).length;
  const semiCount = (sampleLine.match(/;/g) || []).length;
  const tabCount = (sampleLine.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semiCount) delimiter = '\t';
  else if (semiCount > commaCount) delimiter = ';';

  const rows = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const row = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      const nextChar = line[c + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          c++; // saltar comilla escapada
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === delimiter && !insideQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    row.push(currentCell.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Genera y descarga una plantilla oficial en Excel (.xlsx) con los 24 encabezados y estilos
 */
export const downloadPlanningTemplate = async () => {
  const ExcelJSModule = await import('exceljs/dist/exceljs.min.js');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BAZ Entregas CD Villahermosa';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('PLANEACION_EMBARQUES', {
    views: [{ showGridLines: true }]
  });

  const FONT_FAMILY = 'Arial';
  const COLOR_TEAL = 'FF1F6877';
  const COLOR_BLACK = 'FF000000';
  const COLOR_YELLOW_SOFT = 'FFFFFF99';
  const COLOR_WHITE = 'FFFFFFFF';
  const BORDER_BLACK_THIN = { style: 'thin', color: { argb: 'FF000000' } };
  const ALL_BORDERS = {
    top: BORDER_BLACK_THIN,
    left: BORDER_BLACK_THIN,
    bottom: BORDER_BLACK_THIN,
    right: BORDER_BLACK_THIN
  };

  const todayStr = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Fila 1: Fecha centrada
  worksheet.addRow([]);
  worksheet.mergeCells('J1:L1');
  const dateCell = worksheet.getCell('J1');
  dateCell.value = todayStr;
  dateCell.font = { name: FONT_FAMILY, size: 11, bold: true, underline: true };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Fila 2: Encabezados Oficiales
  const HEADERS = [
    'NO. VIAJE',
    'ECO UNIDAD',
    'BLOQUES',
    'PLACAS',
    'CAP UNIDAD',
    'LINEA',
    'OPERADOR',
    'FECHA',
    '# CARGA',
    '# SUC',
    'SUCURSAL',
    'CORTINA',
    'ESTATUS',
    'PLAN DE COLOCACIÓN',
    'COLOCACION',
    'PLAN FIN DE CARGA',
    'ENTREGADO EN CASETA',
    'FOLIO ENVIO',
    'SELLOS',
    'NO. VALE DE ESTRUCTURAS',
    'MOTOS ESTRUCTURAS',
    'MOTOS CARTON',
    'REMOLQUE',
    'MTRS'
  ];

  const headerRow = worksheet.addRow(HEADERS);
  headerRow.height = 28;

  headerRow.eachCell((cell, colNum) => {
    const isPlanColocacion = colNum === 14;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isPlanColocacion ? COLOR_BLACK : COLOR_TEAL }
    };
    cell.font = { name: FONT_FAMILY, size: 9, bold: true, color: { argb: COLOR_WHITE } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = ALL_BORDERS;
  });

  // Anchos
  const widths = [12, 13, 10, 12, 12, 14, 30, 12, 16, 10, 32, 10, 14, 16, 14, 16, 16, 14, 18, 18, 14, 14, 12, 10];
  widths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w;
  });

  // Filas de ejemplo (1 viaje simple + 1 viaje con entrega consolidada/parada secundaria)
  const sampleRows = [
    [
      1, '3471', 1, 'CV4395F', 18, 'LTI - VHS', 'JESUS CRUZ PEREZ', todayStr,
      'C800380794', '191', 'EKT CARDENAS BANDALA', '18', 'EN CASETA',
      '06:00', '04:22', '06:55', '07:23', '151688', '1295824-1295825',
      '0', 0, 0, '0', 10
    ],
    // Parada secundaria del viaje 1
    [
      '', '', '', '', '', '', '', '',
      'C800380794', '2560', 'EKT CARDENAS TABASCO', '', '',
      '', '', '', '', '', '',
      '', '', '', '', 5
    ],
    // Viaje 2
    [
      2, '3153', 1, 'CV4372F', 18, 'LTI - VHS', 'VICTOR MANUEL RAMIREZ CORREA', todayStr,
      'C800380796', '192', 'MI EKT COMALCALCO JUAREZ', '30', 'COLOCADO',
      '06:00', '04:22', '07:09', '07:23', '151690', '1295826-1295827',
      '0', 0, 0, '0', 15
    ]
  ];

  sampleRows.forEach(rowVals => {
    const row = worksheet.addRow(rowVals);
    row.height = 20;
    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.font = { name: FONT_FAMILY, size: 9 };
      cell.border = ALL_BORDERS;
      cell.alignment = (colNum === 7 || colNum === 11) ? { horizontal: 'left', vertical: 'middle' } : { horizontal: 'center', vertical: 'middle' };
      if (colNum >= 1 && colNum <= 5 && cell.value) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_YELLOW_SOFT } };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `PLANTILLA_PLANEACION_BAZ_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
