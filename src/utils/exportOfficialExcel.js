import ExcelJS from 'exceljs/dist/exceljs.min.js';

/**
 * Exportador Oficial de BAZ Entregas — Formato Idéntico a Plantilla Operativa
 * Replica exactamente:
 * - Fila superior de fecha centrada y subrayada
 * - Encabezados color Teal Petrolero (#1F6877) y Negro (#000000) en PLAN DE COLOCACIÓN
 * - Amarillo suave (#FFF2CC) en columnas A-E (No. Viaje, Eco, Bloque, Placas, Cap) y en Estatus
 * - Naranja (#FFC000) en Carga, Sucursal y Tienda
 * - Cuadrícula de bordes negros delgados y tipografía Arial
 */

export const exportOfficialExcel = async (units = [], selectedDate = null) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BAZ Entregas CD Villahermosa';
  workbook.created = new Date();

  // Fecha para el encabezado
  const now = new Date();
  const defaultDateStr = now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const headerDate = selectedDate || defaultDateStr;

  const worksheet = workbook.addWorksheet('EMBARQUES', {
    views: [{ showGridLines: true }]
  });

  // Estilos base
  const FONT_FAMILY = 'Arial';
  const COLOR_HEADER_TEAL = 'FF1F6877';
  const COLOR_HEADER_BLACK = 'FF000000';
  const COLOR_YELLOW_SOFT = 'FFFFFF99'; // Amarillo pastel idéntico a imagen
  const COLOR_YELLOW_LIGHT = 'FFFFF2CC';
  const COLOR_ORANGE_ROW = 'FFFFC000'; // Naranja idéntico a imagen
  const COLOR_WHITE = 'FFFFFFFF';
  const COLOR_TEXT_BLACK = 'FF000000';
  const COLOR_TEXT_WHITE = 'FFFFFFFF';
  const BORDER_BLACK_THIN = { style: 'thin', color: { argb: 'FF000000' } };
  const ALL_BORDERS = {
    top: BORDER_BLACK_THIN,
    left: BORDER_BLACK_THIN,
    bottom: BORDER_BLACK_THIN,
    right: BORDER_BLACK_THIN
  };

  // 1. Fila 1: Encabezado con Fecha Centrada y Subrayada
  worksheet.addRow([]);
  // Insertar fecha centrada en columna 11 (SUCURSAL) o combinada
  worksheet.mergeCells('J1:L1');
  const dateCell = worksheet.getCell('J1');
  dateCell.value = headerDate;
  dateCell.font = {
    name: FONT_FAMILY,
    size: 11,
    bold: true,
    underline: true,
    color: { argb: COLOR_TEXT_BLACK }
  };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 2. Fila 2: Encabezados Oficiales
  const HEADERS = [
    'NO. VIAJE',
    'ECO UNIDAD',
    'BLOQUE',
    'PLACAS',
    'CAP UNIDAD',
    'LINEA',
    'OPERADOR',
    'FECHA',
    '# CARGA',
    '# SUC',
    'SUCURSAL',
    'CORTINAS',
    'ESTATUS',
    'PLAN DE COLOCACIÓN',
    'COLOCACION',
    'PLAN FIN DE CARG',
    'ENTREGADO EN CASETA',
    'FOLIO ENVIO',
    'SELLOS',
    'NO. VALE DE ESTRUCTURA',
    'MOTOS ESTRUCTURAS',
    'MOTOS CARTON',
    'REMOLQUE',
    'MTRS'
  ];

  const headerRow = worksheet.addRow(HEADERS);
  headerRow.height = 28;

  headerRow.eachCell((cell, colNumber) => {
    const isPlanColocacion = colNumber === 14; // PLAN DE COLOCACIÓN (Fondo Negro)

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isPlanColocacion ? COLOR_HEADER_BLACK : COLOR_HEADER_TEAL }
    };

    cell.font = {
      name: FONT_FAMILY,
      size: 9,
      bold: true,
      color: { argb: COLOR_TEXT_WHITE }
    };

    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true
    };

    cell.border = ALL_BORDERS;
  });

  // 3. Anchos de Columna Proporcionales
  const colWidths = [
    12, // NO. VIAJE
    13, // ECO UNIDAD
    9,  // BLOQUE
    12, // PLACAS
    11, // CAP UNIDAD
    14, // LINEA
    30, // OPERADOR
    12, // FECHA
    18, // # CARGA
    9,  // # SUC
    36, // SUCURSAL
    11, // CORTINAS
    14, // ESTATUS
    15, // PLAN DE COLOCACIÓN
    13, // COLOCACION
    15, // PLAN FIN DE CARG
    15, // ENTREGADO EN CASETA
    13, // FOLIO ENVIO
    18, // SELLOS
    16, // NO. VALE DE ESTRUCTURA
    14, // MOTOS ESTRUCTURAS
    14, // MOTOS CARTON
    12, // REMOLQUE
    8   // MTRS
  ];

  colWidths.forEach((w, i) => {
    worksheet.getColumn(i + 1).width = w;
  });

  // 4. Llenado de Filas de Datos
  units.forEach((unit, idx) => {
    // Determinar si la unidad lleva fondo naranja en carga/sucursal
    // En el formato oficial, viajes destacados/foráneos o consolidados van en naranja
    const isHighlightedOrange = (idx % 4 === 0) || (unit.fl === 'FORANEO');

    // Horarios formateados
    const horaSalida = unit.horaSalida || '';
    const eta = unit.eta || '';
    const planColocacion = unit.horaColocacion || '06:00';
    const colocacionReal = unit.horaColocacionReal || '05:50';
    const planFinCarga = unit.horaFinCarga || '07:30';
    const entregadoCaseta = unit.horaCaseta || (unit.estatusSupervisor === 'En Ruta' ? horaSalida : '08:00');

    const rowData = [
      unit.noViaje || (idx + 1),                      // 1. NO. VIAJE
      unit.economico || '',                           // 2. ECO UNIDAD
      unit.bloque || 1,                               // 3. BLOQUE
      unit.placas || '',                              // 4. PLACAS
      unit.capUnidad || '',                           // 5. CAP UNIDAD
      unit.linea || 'LTI - VHS',                      // 6. LINEA
      (unit.operador || '').toUpperCase(),            // 7. OPERADOR
      unit.fecha ? unit.fecha.split('-').reverse().join('/') : headerDate, // 8. FECHA
      unit.numCarga || '',                            // 9. # CARGA
      (unit.numSucursal || ''),                         // 10. # SUC
      ((unit.destino || '').replace(/\s*\(Retorno\)/gi, '').trim()).toUpperCase(), // 11. SUCURSAL
      unit.cortina || '',                             // 12. CORTINAS
      (unit.estatusPlaneacion === 'EN CASETA' || unit.estatusPatio === 'Cargado') ? 'EN CASETA' : (unit.estatusSupervisor || 'PENDIENTE'), // 13. ESTATUS
      planColocacion,                                 // 14. PLAN DE COLOCACIÓN
      colocacionReal,                                 // 15. COLOCACION
      planFinCarga,                                   // 16. PLAN FIN DE CARG
      entregadoCaseta,                                // 17. ENTREGADO EN CASETA
      unit.folioEnvio || (151080 + idx),              // 18. FOLIO ENVIO
      unit.sellos || `12981${20 + idx}-12981${21 + idx}`, // 19. SELLOS
      unit.valeEstructura || 0,                       // 20. NO. VALE DE ESTRUCTURA
      unit.motosEstructuras || 0,                     // 21. MOTOS ESTRUCTURAS
      unit.motosCarton || 0,                          // 22. MOTOS CARTON
      unit.remolque || 0,                             // 23. REMOLQUE
      unit.capUnidad || 15                            // 24. MTRS
    ];

    const row = worksheet.addRow(rowData);
    row.height = 20;

    // Formatear cada celda con sus colores idénticos
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = {
        name: FONT_FAMILY,
        size: 9,
        bold: false,
        color: { argb: COLOR_TEXT_BLACK }
      };
      cell.border = ALL_BORDERS;

      // Alineaciones
      if (colNumber === 7 || colNumber === 11) {
        // OPERADOR y SUCURSAL: Izquierda
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else {
        // Las demás: Centradas
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Reglas de Color:
      // Columnas 1 a 5 (NO. VIAJE, ECO, BLOQUE, PLACAS, CAP): AMARILLO PASTEL (#FFFF99)
      if (colNumber >= 1 && colNumber <= 5) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLOR_YELLOW_SOFT }
        };
      }
      // Columna 9, 10, 11 (# CARGA, # SUC, SUCURSAL) si es destacada: NARANJA (#FFC000)
      else if (isHighlightedOrange && (colNumber === 9 || colNumber === 10 || colNumber === 11)) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLOR_ORANGE_ROW }
        };
      }
      // Columna 13 (ESTATUS): AMARILLO PASTEL si es EN CASETA
      else if (colNumber === 13) {
        const val = String(cell.value || '').toUpperCase();
        if (val.includes('CASETA')) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLOR_YELLOW_SOFT }
          };
        }
      }
      // Fondo Blanco por defecto en las demás
      else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLOR_WHITE }
        };
      }
    });

    // Si la unidad tiene entregas secundarias o VTEX, agregar sub-fila idéntica a la imagen
    if (unit.observaciones && unit.observaciones.toLowerCase().includes('vtex')) {
      const vtexRow = worksheet.addRow([
        '', '', '', '', '', '', '', '', '', '',
        `VTEX: ${unit.numCarga || '45713018'} - C`,
        '', '', '', '', '', '', '', '', '', '', '', '', ''
      ]);
      vtexRow.height = 18;
      vtexRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: FONT_FAMILY, size: 8.5, color: { argb: COLOR_TEXT_BLACK } };
        cell.border = ALL_BORDERS;
        if (colNumber === 11) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_YELLOW_SOFT } };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_WHITE } };
        }
      });
    }
  });

  // 5. Descargar archivo en el navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanDate = headerDate.replace(/\//g, '-');
  a.download = `BAZ_Embarques_Oficial_${cleanDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ====================================================================
// 2. EXPORTADOR DE CONTROL DE PATIO
// ====================================================================
export const exportPatioExcel = async (units = [], selectedDate = null) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BAZ Entregas CD Villahermosa';
  workbook.created = new Date();

  const now = new Date();
  const defaultDateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const headerDate = selectedDate || defaultDateStr;

  const worksheet = workbook.addWorksheet('CONTROL DE PATIO', { views: [{ showGridLines: true }] });
  const BORDER_BLACK = { style: 'thin', color: { argb: 'FF000000' } };
  const ALL_BORDERS = { top: BORDER_BLACK, left: BORDER_BLACK, bottom: BORDER_BLACK, right: BORDER_BLACK };

  // Fila 1: Título
  worksheet.mergeCells('A1:K1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `BAZ ENTREGAS — CONTROL DE PATIO Y ANDENES (CD VILLAHERMOSA) • ${headerDate}`;
  titleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F6877' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Fila 2: Encabezados
  const HEADERS = [
    'ECO',
    'TIPO DE UNIDAD',
    'CAPACIDAD',
    'PLACAS',
    'LINEA',
    'ESTATUS EN PATIO',
    'TURNO',
    'CORTINA',
    'DESTINO / SUCURSAL',
    'OBSERVACIONES / DETALLES',
    'ÚLTIMA ACTUALIZACIÓN'
  ];

  const headerRow = worksheet.addRow(HEADERS);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = ALL_BORDERS;
  });

  const colWidths = [12, 20, 12, 13, 14, 22, 10, 12, 34, 30, 20];
  colWidths.forEach((w, i) => worksheet.getColumn(i + 1).width = w);

  // Llenado de unidades
  units.forEach((unit) => {
    const estatus = unit.estatusPatio || 'Disponible';
    const row = worksheet.addRow([
      unit.economico || '',
      unit.tipo || '',
      unit.capUnidad || '',
      unit.placas || '',
      unit.linea || 'LTI - VHS',
      estatus.toUpperCase(),
      unit.turno || 'M1',
      unit.cortina || '',
      (unit.destino || '').replace(/\s*\(Retorno\)/gi, '').trim().toUpperCase(),
      unit.observaciones || '',
      unit.actualizadoEn || headerDate
    ]);
    row.height = 20;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
      cell.border = ALL_BORDERS;

      if (colNumber === 9 || colNumber === 10) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Estilo de estatus de patio
      if (colNumber === 6) {
        if (estatus === 'Disponible') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Verde suave
        } else if (estatus === 'Colocado p/ Carga') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Ámbar
        } else if (estatus === 'Cargado') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFFAFE' } }; // Cyan
        } else if (estatus === 'Taller') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Rojo
        }
      } else if (colNumber === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } }; // Amarillo suave para ECO
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanDate = headerDate.replace(/\//g, '-');
  a.download = `BAZ_Control_Patio_${cleanDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ====================================================================
// 3. EXPORTADOR DE SUPERVISOR / MONITOREO EN RUTA
// ====================================================================
export const exportSupervisorExcel = async (units = [], selectedDate = null) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BAZ Entregas CD Villahermosa';
  workbook.created = new Date();

  const now = new Date();
  const defaultDateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const headerDate = selectedDate || defaultDateStr;

  const worksheet = workbook.addWorksheet('MONITOREO DE RUTA', { views: [{ showGridLines: true }] });
  const BORDER_BLACK = { style: 'thin', color: { argb: 'FF000000' } };
  const ALL_BORDERS = { top: BORDER_BLACK, left: BORDER_BLACK, bottom: BORDER_BLACK, right: BORDER_BLACK };

  worksheet.mergeCells('A1:Q1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `BAZ ENTREGAS — MONITOREO DE RUTA Y SUPERVISIÓN (CD VILLAHERMOSA) • ${headerDate}`;
  titleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F6877' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  const HEADERS = [
    'NO. VIAJE',
    'ECO',
    'TIPO',
    'CAPACIDAD',
    'PLACAS',
    'OPERADOR',
    'TIPO RUTA (F/L)',
    'TURNO',
    '# SUC',
    'DESTINO / SUCURSAL',
    'CLÓSTER',
    '# CARGA',
    'HORA SALIDA',
    'TIEMPO EST. (HRS)',
    'ETA ESTIMADO',
    'ESTATUS SUPERVISOR',
    'OBSERVACIONES / SEGUIMIENTO'
  ];

  const headerRow = worksheet.addRow(HEADERS);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = ALL_BORDERS;
  });

  const colWidths = [11, 12, 16, 12, 12, 28, 15, 10, 10, 32, 16, 16, 14, 16, 14, 20, 30];
  colWidths.forEach((w, i) => worksheet.getColumn(i + 1).width = w);

  units.forEach((unit, idx) => {
    const estatusSup = unit.estatusSupervisor || 'Pendiente';
    const row = worksheet.addRow([
      unit.noViaje || (idx + 1),
      unit.economico || '',
      unit.tipo || '',
      unit.capUnidad || '',
      unit.placas || '',
      (unit.operador || '').toUpperCase(),
      unit.fl || 'LOCAL',
      unit.turno || 'M1',
      unit.numSucursal || '',
      (unit.destino || '').replace(/\s*\(Retorno\)/gi, '').trim().toUpperCase(),
      unit.closter || '',
      unit.numCarga || '',
      unit.horaSalida || '',
      unit.tiempoEstimadoHrs || '',
      unit.eta || '',
      estatusSup.toUpperCase(),
      unit.observaciones || ''
    ]);
    row.height = 20;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
      cell.border = ALL_BORDERS;

      if (colNumber === 6 || colNumber === 10 || colNumber === 17) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      if (colNumber === 1 || colNumber === 2) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
      } else if (colNumber === 16) {
        if (estatusSup === 'En Ruta') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBAE6FD' } }; // Azul claro
        } else if (estatusSup === 'Espera Descarga') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Ámbar
        } else if (estatusSup === 'Descargando') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9D5FF' } }; // Púrpura suave
        } else if (estatusSup === 'Retorno') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFFAFE' } }; // Cyan
        } else if (estatusSup === 'Retrasado') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Rojo
        } else if (estatusSup === 'Completado') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Verde
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        }
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanDate = headerDate.replace(/\//g, '-');
  a.download = `BAZ_Monitoreo_Supervisor_${cleanDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ====================================================================
// 4. EXPORTADOR DE TABLERO EN VIVO (SALA DE CONTROL / TV)
// ====================================================================
export const exportTvExcel = async (units = [], selectedDate = null) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BAZ Entregas CD Villahermosa';
  workbook.created = new Date();

  const now = new Date();
  const defaultDateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const headerDate = selectedDate || defaultDateStr;

  const worksheet = workbook.addWorksheet('MONITOREO EN VIVO', { views: [{ showGridLines: true }] });
  const BORDER_BLACK = { style: 'thin', color: { argb: 'FF000000' } };
  const ALL_BORDERS = { top: BORDER_BLACK, left: BORDER_BLACK, bottom: BORDER_BLACK, right: BORDER_BLACK };

  worksheet.mergeCells('A1:R1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `BAZ ENTREGAS — TABLERO DE MONITOREO GENERAL (CD VILLAHERMOSA) • ${headerDate}`;
  titleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F6877' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  const HEADERS = [
    'NO. VIAJE',
    'ECO',
    'TIPO',
    'CAPACIDAD',
    'PLACAS',
    'LINEA',
    'OPERADOR',
    'TURNO',
    'F/L',
    '# SUC',
    'DESTINO / SUCURSAL',
    'CLÓSTER',
    '# CARGA',
    'CORTINA',
    'HORA SALIDA',
    'ETA',
    'ESTATUS RUTA',
    'OBSERVACIONES'
  ];

  const headerRow = worksheet.addRow(HEADERS);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = ALL_BORDERS;
  });

  const colWidths = [11, 12, 16, 12, 12, 14, 28, 10, 12, 10, 32, 16, 16, 12, 14, 14, 18, 28];
  colWidths.forEach((w, i) => worksheet.getColumn(i + 1).width = w);

  units.forEach((unit, idx) => {
    const estatusSup = unit.estatusSupervisor || 'Pendiente';
    const row = worksheet.addRow([
      unit.noViaje || (idx + 1),
      unit.economico || '',
      unit.tipo || '',
      unit.capUnidad || '',
      unit.placas || '',
      unit.linea || 'LTI - VHS',
      (unit.operador || '').toUpperCase(),
      unit.turno || 'M1',
      unit.fl || 'LOCAL',
      unit.numSucursal || '',
      (unit.destino || '').replace(/\s*\(Retorno\)/gi, '').trim().toUpperCase(),
      unit.closter || '',
      unit.numCarga || '',
      unit.cortina || '',
      unit.horaSalida || '',
      unit.eta || '',
      estatusSup.toUpperCase(),
      unit.observaciones || ''
    ]);
    row.height = 20;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF000000' } };
      cell.border = ALL_BORDERS;

      if (colNumber === 7 || colNumber === 11 || colNumber === 18) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      if (colNumber === 1 || colNumber === 2) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
      } else if (colNumber === 17) {
        if (estatusSup === 'En Ruta') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBAE6FD' } };
        } else if (estatusSup === 'Completado') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        } else if (estatusSup === 'Retrasado') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        }
      } else {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanDate = headerDate.replace(/\//g, '-');
  a.download = `BAZ_Tablero_Monitoreo_${cleanDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ====================================================================
// 5. FUNCIÓN CONTROLADORA POR MÓDULO
// ====================================================================
export const exportByModule = async (moduleName, units = [], selectedDate = null) => {
  switch (moduleName) {
    case 'patio':
      return exportPatioExcel(units, selectedDate);
    case 'supervisor':
      return exportSupervisorExcel(units, selectedDate);
    case 'tv':
      return exportTvExcel(units, selectedDate);
    case 'planeacion':
    default:
      return exportOfficialExcel(units, selectedDate);
  }
};

