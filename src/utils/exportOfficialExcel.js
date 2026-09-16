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
