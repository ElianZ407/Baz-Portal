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

import { buscarSucursal, buscarUnidadPorEco, buscarIdOperadorPorNombre } from './fleetUtils';

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

// Determina el campo canónico para un encabezado dado con prioridad exacta para evitar colisiones
export const matchColumnKey = (rawHeader) => {
  const norm = normalizeHeaderKey(rawHeader);
  if (!norm) return null;

  // Paso 1: Coincidencia EXACTA (Garantiza que 'sucursal' vaya a 'destino' y no a 'numSucursal')
  for (const [canonicalKey, synonyms] of Object.entries(COLUMN_DEFINITIONS)) {
    if (synonyms.includes(norm)) {
      return canonicalKey;
    }
  }

  // Paso 2: Coincidencia por palabra clave más larga / específica
  let bestMatch = null;
  let longestMatchLength = 0;

  for (const [canonicalKey, synonyms] of Object.entries(COLUMN_DEFINITIONS)) {
    for (const syn of synonyms) {
      // Coincidencia de palabra completa usando límites de palabra
      const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
      if (regex.test(norm) && syn.length > longestMatchLength) {
        longestMatchLength = syn.length;
        bestMatch = canonicalKey;
      }
    }
  }

  return bestMatch;
};

// Extrae el valor limpio de una celda de ExcelJS evitando pérdidas por fórmulas u objetos
const extractExcelCellValue = (cell) => {
  if (!cell) return '';
  let val = cell.value;
  if (val === null || val === undefined) return '';

  if (val instanceof Date) return val;

  // Si es un objeto de ExcelJS
  if (typeof val === 'object') {
    // Si contiene el resultado de una fórmula
    if (val.result !== undefined && val.result !== null) {
      if (typeof val.result === 'object' && val.result.error) return '';
      return val.result;
    }
    // Si es texto enriquecido (RichText)
    if (Array.isArray(val.richText)) {
      return val.richText.map(t => t.text || '').join('').trim();
    }
    // Si es un hipervínculo
    if (val.text !== undefined) return String(val.text).trim();
    if (val.hyperlink !== undefined) return String(val.text || val.hyperlink).trim();
    if (val.error) return '';
  }

  // Si cell.text tiene un valor formateado legible, puede usarse de respaldo
  if (cell.text && typeof cell.text === 'string' && cell.text !== '[object Object]') {
    const trimmed = cell.text.trim();
    // Si el valor original era número o fecha y cell.text está bien formateado
    if (typeof val === 'number' && (trimmed.includes(':') || trimmed.includes('/'))) {
      return trimmed;
    }
  }

  return val;
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

// Mapeador de Estatus Oficial BAZ
export const parseEstatusBaz = (rawEstatus) => {
  const norm = String(rawEstatus || '').trim().toUpperCase();
  if (!norm || norm === 'PENDIENTE') {
    return {
      estatusPlaneacion: 'PENDIENTE',
      estatusPatio: 'Disponible',
      estatusSupervisor: 'Pendiente'
    };
  }
  if (norm.includes('CASETA') || norm.includes('CARGADO')) {
    return {
      estatusPlaneacion: 'CARGADO',
      estatusPatio: 'Cargado',
      estatusSupervisor: 'Cargado'
    };
  }
  if (norm.includes('COLOCAD')) {
    return {
      estatusPlaneacion: 'COLOCADO',
      estatusPatio: 'Colocado p/ Carga',
      estatusSupervisor: 'Pendiente'
    };
  }
  if (norm.includes('RUTA') || norm.includes('TRANSITO')) {
    return {
      estatusPlaneacion: 'CARGADO',
      estatusPatio: 'En Ruta',
      estatusSupervisor: 'En Ruta'
    };
  }
  if (norm.includes('TALLER')) {
    return {
      estatusPlaneacion: 'PENDIENTE',
      estatusPatio: 'Taller',
      estatusSupervisor: 'No Disponible'
    };
  }
  if (norm.includes('DESCARGA') || norm.includes('RAMPA')) {
    return {
      estatusPlaneacion: 'CARGADO',
      estatusPatio: 'Descargando',
      estatusSupervisor: 'Descargando'
    };
  }
  if (norm.includes('RETORNO')) {
    return {
      estatusPlaneacion: 'RETORNO',
      estatusPatio: 'Disponible',
      estatusSupervisor: 'Retorno'
    };
  }

  return {
    estatusPlaneacion: 'PENDIENTE',
    estatusPatio: 'Disponible',
    estatusSupervisor: 'Pendiente'
  };
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
  const fileName = file.name.toLowerCase();
  const isCsv = fileName.endsWith('.csv');

  let rows = [];
  let sheetName = 'Hoja 1';
  let targetWorksheetIndex = 1;
  let allSheets = [];

  if (isCsv) {
    const text = await file.text();
    rows = parseCsvToRows(text);
    sheetName = 'Archivo CSV';
    allSheets = [{ index: 1, name: 'Archivo CSV', rowCount: rows.length }];
  } else {
    // Excel con ExcelJS
    const ExcelJSModule = await import('exceljs/dist/exceljs.min.js');
    const ExcelJS = ExcelJSModule.default || ExcelJSModule;
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    if (!workbook.worksheets || workbook.worksheets.length === 0) {
      throw new Error('El archivo Excel no contiene hojas de cálculo legibles.');
    }

    // Listar todas las hojas disponibles en el libro
    allSheets = workbook.worksheets.map((ws, idx) => ({
      index: idx + 1,
      id: ws.id,
      name: ws.name || `Hoja ${idx + 1}`,
      rowCount: ws.rowCount
    }));

    // Selección de la Hoja Objetivo (Prioridad Día 26 / Hoja 26 solicitada por el usuario)
    let targetWorksheet = null;

    // 1. Si el usuario seleccionó una hoja específica desde la interfaz
    if (preferredSheet !== null && preferredSheet !== undefined) {
      const preferredNum = Number(preferredSheet);
      if (!isNaN(preferredNum) && preferredNum >= 1 && preferredNum <= workbook.worksheets.length) {
        targetWorksheet = workbook.worksheets[preferredNum - 1];
        targetWorksheetIndex = preferredNum;
      } else if (typeof preferredSheet === 'string') {
        const foundIdx = workbook.worksheets.findIndex(ws => 
          ws.name.toLowerCase().trim() === preferredSheet.toLowerCase().trim()
        );
        if (foundIdx !== -1) {
          targetWorksheet = workbook.worksheets[foundIdx];
          targetWorksheetIndex = foundIdx + 1;
        }
      }
    }

    // 2. Si no se especificó hoja, buscar prioritariamente la HOJA 26
    if (!targetWorksheet) {
      // A. Buscar hoja que se llame "26" o contenga "26"
      const idx26ByName = workbook.worksheets.findIndex(ws => {
        const n = ws.name.trim().toLowerCase();
        return n === '26' || n === 'hoja 26' || n === 'dia 26' || n === 'día 26' || n.includes('26');
      });

      if (idx26ByName !== -1) {
        targetWorksheet = workbook.worksheets[idx26ByName];
        targetWorksheetIndex = idx26ByName + 1;
      } else if (workbook.worksheets.length >= 26) {
        // B. Si hay 26 o más hojas, seleccionar directamente la hoja 26 (posición 26)
        targetWorksheet = workbook.worksheets[25];
        targetWorksheetIndex = 26;
      } else {
        // C. Buscar hoja correspondiente al día actual del mes
        const currentDayOfMonth = new Date().getDate();
        const idxToday = workbook.worksheets.findIndex(ws => {
          const n = ws.name.trim().toLowerCase();
          return n === String(currentDayOfMonth) || n.includes(String(currentDayOfMonth));
        });

        if (idxToday !== -1) {
          targetWorksheet = workbook.worksheets[idxToday];
          targetWorksheetIndex = idxToday + 1;
        } else {
          // D. Seleccionar la última hoja del libro
          targetWorksheet = workbook.worksheets[workbook.worksheets.length - 1];
          targetWorksheetIndex = workbook.worksheets.length;
        }
      }
    }

    sheetName = targetWorksheet.name || `Hoja ${targetWorksheetIndex}`;

    // 3. Extraer TODAS las filas de la hoja seleccionada con coordenadas absolutas
    const totalRowsInSheet = targetWorksheet.rowCount;
    const totalColsInSheet = Math.max(targetWorksheet.columnCount || 0, 35);

    for (let r = 1; r <= totalRowsInSheet; r++) {
      const row = targetWorksheet.getRow(r);
      const rowValues = [];
      let hasAnyValueInRow = false;

      for (let c = 1; c <= totalColsInSheet; c++) {
        const cell = row.getCell(c);
        const cellVal = extractExcelCellValue(cell);
        rowValues[c - 1] = cellVal;
        if (cellVal !== '' && cellVal !== null && cellVal !== undefined) {
          hasAnyValueInRow = true;
        }
      }

      // Mantener la fila para respetar los índices exactos de fila
      rows.push(hasAnyValueInRow ? rowValues : []);
    }
  }

  if (rows.length === 0) {
    throw new Error('El archivo seleccionado está vacío.');
  }

  // 3. Detectar Fila de Encabezados (Buscar en las primeras 25 filas)
  let headerRowIndex = -1;
  let columnMap = {}; // { colIndex: 'canonicalKey' }
  let maxMatches = 0;
  let fileHeaderDate = '';

  for (let r = 0; r < Math.min(rows.length, 25); r++) {
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

  // 4. Procesar TODAS las Filas de Datos sin omisiones
  const parsedUnits = [];
  let currentUnit = null;
  const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const defaultDate = fileHeaderDate || new Date().toISOString().split('T')[0];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const rawRow = rows[i];
    if (!rawRow || rawRow.length === 0) continue;

    // Extraer campos de la fila según columnMap
    const rowData = {};
    Object.entries(columnMap).forEach(([colIdx, key]) => {
      const val = rawRow[Number(colIdx)];
      rowData[key] = val !== undefined && val !== null ? val : '';
    });

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
    // 7. Y SÍ tiene sucursal o # sucursal.
    const hasTripOwnershipMarkers = Boolean(
      eco || 
      noViaje || 
      operador || 
      placas || 
      linea ||
      (numCarga && currentUnit && numCarga !== currentUnit.numCarga) ||
      (bloque !== null && currentUnit && bloque !== currentUnit.bloque) ||
      (cortina && currentUnit && cortina !== currentUnit.cortina) ||
      horaColocacion ||
      (estatusRaw && estatusRaw.toUpperCase() !== 'PENDIENTE')
    );

    const isSecondaryStop = currentUnit && !hasTripOwnershipMarkers && (sucursal || numSucursal);

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
      const sucInfo = buscarSucursal(numSucursal || sucursal, catalogoSucursales);
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
    const estatusObj = parseEstatusBaz(estatusRaw);

    // Auto-completar datos con catálogo de flota
    const fleetMaster = eco ? buscarUnidadPorEco(eco, catalogoFlota) : null;
    const finalPlacas = placas || fleetMaster?.placas || '';
    const finalCap = Number(rowData.capUnidad || fleetMaster?.capUnidad) || 18;
    const finalLinea = linea || fleetMaster?.linea || 'LTI - VHS';
    const finalOperador = operador || fleetMaster?.operador || '';
    const finalIdOperador = finalOperador ? buscarIdOperadorPorNombre(finalOperador, catalogoFlota) : (fleetMaster?.idOperador || '');

    // Auto-completar datos con catálogo de sucursales
    const sucInfo = buscarSucursal(numSucursal || sucursal, catalogoSucursales);
    const finalDestino = sucursal || (sucInfo ? sucInfo.nombre : '');
    const finalNumSuc = numSucursal || (sucInfo ? String(sucInfo.id) : '');
    const finalCloster = sucInfo ? (sucInfo.closter || '') : 'HUB-VHSA';
    const finalFL = sucInfo ? (sucInfo.fl || 'LOCAL') : 'LOCAL';
    const finalCapMax = sucInfo ? (sucInfo.capMax || '') : '';

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
      tiempoEstimadoHrs: 0,
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
    nombreHoja: sheetName,
    indiceHoja: targetWorksheetIndex,
    hojasDisponibles: allSheets,
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
