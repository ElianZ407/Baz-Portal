/**
 * Utilidades para Importar Archivos de Planeación (Excel .xlsx/.xls y CSV)
 * BAZ Entregas CD Villahermosa
 *
 * Lee archivos con las 24 columnas operativas:
 * NO. VIAJE | ECO UNIDAD | BLOQUES | PLACAS | CAP UNIDAD | LINEA | OPERADOR | FECHA |
 * # CARGA | # SUC | SUCURSAL | CORTINA | ESTATUS | PLAN DE COLOCACIÓN | COLOCACION |
 * PLAN FIN DE CARGA | ENTREGADO EN CASETA | FOLIO ENVIO | SELLOS |
 * NO. VALE DE ESTRUCTURAS | MOTOS ESTRUCTURAS | MOTOS CARTON | REMOLQUE | MTRS
 */

import { buscarSucursal, buscarUnidadPorEco, buscarIdOperadorPorNombre } from './fleetUtils';

// Normaliza nombres de encabezados quitando acentos, puntuación y espacios
export const normalizeHeaderKey = (rawHeader) => {
  if (!rawHeader) return '';
  return String(rawHeader)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .toLowerCase()
    .replace(/[#._\-/:,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Diccionario de sinónimos para detectar las 24 columnas
export const COLUMN_DEFINITIONS = {
  noViaje: ['no viaje', 'viaje', 'num viaje', 'numero viaje', 'n viaje', 'no de viaje', 'viaje no'],
  economico: ['eco unidad', 'eco', 'economico', 'no eco', 'num eco', 'unidad', 'tracto', 'camion'],
  bloque: ['bloques', 'bloque', 'blq', 'bloq'],
  placas: ['placas', 'placa', 'matricula'],
  capUnidad: ['cap unidad', 'capacidad', 'cap', 'capacidad unidad', 'tamano'],
  linea: ['linea', 'linea transporte', 'linea fletera', 'fletera', 'empresa'],
  operador: ['operador', 'chofer', 'conductor', 'nombre operador'],
  fecha: ['fecha', 'dia', 'date', 'fecha viaje'],
  numCarga: ['carga', 'num carga', 'no carga', 'numero carga', 'cve carga', 'embarque'],
  numSucursal: ['suc', 'num suc', 'no suc', 'numero suc', 'tienda', 'num tienda', 'id sucursal'],
  destino: ['sucursal', 'destino', 'nombre sucursal', 'nombre tienda', 'destino sucursal'],
  cortina: ['cortina', 'cortinas', 'anden', 'rampa', 'puerta'],
  estatus: ['estatus', 'estado', 'status', 'estatus planeacion'],
  horaColocacion: ['plan de colocacion', 'plan colocacion', 'colocacion programada', 'h colocacion', 'hora colocacion'],
  horaColocacionReal: ['colocacion', 'colocacion real', 'hora colocacion real', 'colocado a las'],
  horaFinCarga: ['plan fin de carga', 'plan fin carga', 'fin carga', 'fin de carga', 'hora fin carga'],
  horaCaseta: ['entregado en caseta', 'entrega caseta', 'caseta', 'hora caseta', 'salida caseta'],
  folioEnvio: ['folio envio', 'folio envio', 'folio', 'folio embarque', 'remision'],
  sellos: ['sellos', 'sello', 'sellos seguridad', 'candados'],
  valeEstructura: ['no vale de estructuras', 'vale estructuras', 'vale estructura', 'no vale estructuras', 'num vale estructuras'],
  motosEstructuras: ['motos estructuras', 'motos estructura', 'estructuras', 'motos est'],
  motosCarton: ['motos carton', 'motos en carton', 'carton', 'motos cart'],
  remolque: ['remolque', 'no remolque', 'caja', 'placas remolque'],
  mtrs: ['mtrs', 'metros', 'mts', 'metros lineales', 'volumen']
};

// Determina el campo canónico para un encabezado dado
export const matchColumnKey = (rawHeader) => {
  const norm = normalizeHeaderKey(rawHeader);
  if (!norm) return null;

  for (const [canonicalKey, synonyms] of Object.entries(COLUMN_DEFINITIONS)) {
    if (synonyms.some(syn => norm === syn || norm.includes(syn))) {
      return canonicalKey;
    }
  }
  return null;
};

// Formateador de Horas (soporta fracciones de Excel, fechas y strings)
export const parseTimeValue = (val) => {
  if (val === null || val === undefined || val === '') return '';

  // Si es un objeto Date
  if (val instanceof Date) {
    const hh = String(val.getHours()).padStart(2, '0');
    const mm = String(val.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // Si es número (fracción de día en Excel, ej. 0.25 = 06:00)
  if (typeof val === 'number') {
    // Si es un entero de 0 a 24, asumimos que son horas directas
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

  const str = String(val).trim();
  // Formato tipo "6:00", "06:00", "06:00:00", "6:00 AM", etc.
  const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i;
  const match = str.match(timeRegex);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[4]?.toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  return str;
};

// Formateador de Fechas
export const parseDateValue = (val, fallbackDate = '') => {
  if (val === null || val === undefined || val === '') return fallbackDate;

  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }

  if (typeof val === 'number' && val > 30000 && val < 60000) {
    // Número serial de Excel (días desde 1900-01-01)
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + val * 86400000);
    return jsDate.toISOString().split('T')[0];
  }

  const str = String(val).trim();
  // Casos "9/25/2026" o "25/09/2026" o "2026-09-25"
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      let [p1, p2, p3] = parts;
      if (p3.length === 2) p3 = `20${p3}`;
      // Si p1 > 12, es DD/MM/YYYY
      if (parseInt(p1, 10) > 12) {
        return `${p3}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      }
      // Por defecto en Excel en inglés: MM/DD/YYYY
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
 * Lee un archivo Excel (.xlsx / .xls) o CSV y extrae las unidades/viajes listos para BAZ
 */
export const parsePlanningFile = async (file, catalogoFlota = [], catalogoSucursales = []) => {
  const fileName = file.name.toLowerCase();
  const isCsv = fileName.endsWith('.csv');

  let rows = [];

  if (isCsv) {
    const text = await file.text();
    rows = parseCsvToRows(text);
  } else {
    // Excel con ExcelJS
    const ExcelJSModule = await import('exceljs/dist/exceljs.min.js');
    const ExcelJS = ExcelJSModule.default || ExcelJSModule;
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('El archivo Excel no contiene hojas de cálculo legibles.');
    }

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const rowValues = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let val = cell.value;
        // Si la celda contiene una fórmula o formato enriquecido
        if (val && typeof val === 'object') {
          if (val.result !== undefined) val = val.result;
          else if (val.text !== undefined) val = val.text;
          else if (val.richText) val = val.richText.map(t => t.text).join('');
        }
        rowValues[colNumber - 1] = val;
      });
      rows.push(rowValues);
    });
  }

  if (rows.length === 0) {
    throw new Error('El archivo seleccionado está vacío.');
  }

  // 1. Detectar Fila de Encabezados (Buscar entre las primeras 15 filas)
  let headerRowIndex = -1;
  let columnMap = {}; // { colIndex: 'canonicalKey' }
  let maxMatches = 0;
  let fileHeaderDate = '';

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const candidateRow = rows[r];
    if (!Array.isArray(candidateRow)) continue;

    // Buscar si hay alguna fecha en las filas anteriores al header (como la fila 1 de BAZ)
    if (r < 3 && !fileHeaderDate) {
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

  // 2. Procesar Filas de Datos
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
    const mtrs = Number(rowData.mtrs) || 0;

    // Fila completamente en blanco -> ignorar
    const hasAnySignificantData = eco || noViaje || sucursal || numSucursal || numCarga || rowData.operador;
    if (!hasAnySignificantData) {
      continue;
    }

    // Detectar si es una Parada Secundaria (Múltiple entrega dentro del mismo viaje)
    // En las plantillas BAZ, si ECO y NO. VIAJE están vacíos pero hay SUCURSAL o # SUC,
    // pertenece a una segunda entrega del viaje previo.
    const isSecondaryStop = (!eco && !noViaje) && (sucursal || numSucursal) && currentUnit;

    if (isSecondaryStop) {
      const parada = {
        id: `parada-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        numSucursal: numSucursal,
        destino: sucursal,
        numCarga: numCarga || currentUnit.numCarga || '',
        cortina: cortina || currentUnit.cortina || '',
        mtrs: mtrs
      };

      // Si la sucursal secundaria existe en catálogo, completar closter
      const sucInfo = buscarSucursal(numSucursal || sucursal, catalogoSucursales);
      if (sucInfo) {
        parada.closter = sucInfo.closter || '';
        if (!parada.destino) parada.destino = sucInfo.nombre;
        if (!parada.numSucursal) parada.numSucursal = String(sucInfo.id);
      }

      currentUnit.destinosSecundarios.push(parada);
      continue;
    }

    // Si tiene ECO o NO. VIAJE o SUCURSAL -> Crear nueva unidad de viaje
    const unitDate = parseDateValue(rowData.fecha, defaultDate);
    const estatusObj = parseEstatusBaz(rowData.estatus);

    // Auto-completar datos con catálogo de flota
    const fleetMaster = eco ? buscarUnidadPorEco(eco, catalogoFlota) : null;
    const finalPlacas = String(rowData.placas || fleetMaster?.placas || '').trim();
    const finalCap = Number(rowData.capUnidad || fleetMaster?.capUnidad) || 18;
    const finalLinea = String(rowData.linea || fleetMaster?.linea || 'LTI - VHS').trim();
    const finalOperador = String(rowData.operador || fleetMaster?.operador || '').trim();
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
      bloque: Number(rowData.bloque) || 1,
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
      horaColocacion: parseTimeValue(rowData.horaColocacion) || '06:00',
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
    throw new Error('No se detectaron viajes válidos en el archivo. Asegúrate de que las filas tengan al menos el número económico o la sucursal.');
  }

  return {
    units: parsedUnits,
    totalViajes: parsedUnits.length,
    fechaDetectada: defaultDate,
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
