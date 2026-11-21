let tesseractPromise = null;

const cargarTesseract = () => {
  if (typeof window !== 'undefined' && window.Tesseract) {
    return Promise.resolve(window.Tesseract);
  }
  if (tesseractPromise) return tesseractPromise;

  tesseractPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => {
      tesseractPromise = null;
      reject(new Error('No se pudo cargar el lector óptico de imágenes. Verifica tu conexión a internet.'));
    };
    document.head.appendChild(script);
  });

  return tesseractPromise;
};

const normalizarTexto = (str) =>
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

const capitalizarTitulo = (str) =>
  String(str || '')
    .toLowerCase()
    .replace(/(^|\s|[-./])([a-záéíóúñü])/g, (m, sep, ch) => `${sep}${ch.toUpperCase()}`)
    .replace(/\b(De|Del|La|Las|Los|Y)\b/g, (m) => m.toLowerCase())
    .replace(/^(de|del|la|las|los)\b/, (m) => m.charAt(0).toUpperCase() + m.slice(1))
    .replace(/\bVtex\b/gi, 'VTEX')
    .replace(/\bBdr\b/gi, 'BDR')
    .replace(/\bHub\b/gi, 'HUB')
    .replace(/\bCd\.?\b/gi, 'Cd.')
    .trim();

const REGLAS_LINEAS = [
  { match: (t) => t.includes('YODLOGIX'), valor: 'YODLOGIXTRADE' },
  { match: (t) => t.includes('NUEVA ALIANZA') || t.includes('ALIANZA'), valor: 'NUEVA ALIANZA' },
  { match: (t) => t.includes('MADRINA'), valor: 'LTI - VHS - MADRINA' },
  { match: (t) => t.includes('FULL') && t.includes('TUXTLA'), valor: 'LTI FULL - HUB TUXTLA' },
  { match: (t) => t.includes('LTI FULL') || t.includes('FULL - VHS') || t.includes('FULL-VHS'), valor: 'LTI FULL - VHS' },
  { match: (t) => t.includes('HUB TUXTLA') && t.includes('LTI'), valor: 'LTI - HUB TUXTLA' },
  { match: (t) => t.includes('LIBRAS EXPRESS'), valor: 'LIBRAS EXPRESS' },
  { match: (t) => t.includes('LIBRA EXPRESS') || t.includes('LIBRA '), valor: 'LIBRA EXPRESS' },
  { match: (t) => t.includes('VALLEY'), valor: 'VALLEY' },
  { match: (t) => t.includes('BRITO'), valor: 'BRITO' },
  { match: (t) => t.includes('ROLDAN'), valor: 'ROLDAN' },
  { match: (t) => t.includes('LTI'), valor: 'LTI - VHS' }
];

const REGLAS_DESTINOS = [
  { claves: ['8285', 'CANDELARIA', 'CANDELAR'], destino: 'Candelaria Campeche', tipo: 'Foráneo' },
  { claves: ['2214', 'PARRILLA', 'PARRILL'], destino: 'Parrilla Tabasco', tipo: 'Retail' },
  { claves: ['2205', 'TIERRA COLORADA', 'TIERRA COLOR'], destino: 'Tierra Colorada', tipo: 'Retail' },
  { claves: ['2957', 'COMALAPA', 'COMALAP'], destino: 'Comalapa Chiapas', tipo: 'Foráneo' },
  { claves: ['1205', 'BOCHIL', 'BOCH1L', 'APA BOCH'], destino: 'Bochil Chiapas', tipo: 'Foráneo' },
  { claves: ['7109', 'YAJALON', 'YAJAL'], destino: 'Yajalón Chiapas', tipo: 'Foráneo' },
  { claves: ['4834', 'BENEMERITO', 'BENEMERIT', 'DE LAS AMERICAS'], destino: 'Benemérito de las Américas', tipo: 'Foráneo' },
  { claves: ['4774', 'IXTEPEC', 'IXTEP'], destino: 'Cd. Ixtepec', tipo: 'Foráneo' },
  { claves: ['VTEX ZONA CENTRO', 'ZONA CENTRO', 'VTEX'], destino: 'VTEX Zona Centro', tipo: 'Retail' },
  { claves: ['8267', '7414', 'MACUSPANA', 'MACUSP'], destino: 'Macuspana', tipo: 'Retail' },
  { claves: ['6381', 'PARAISO', 'PARAIS', 'PARA1SO'], destino: 'Paraíso', tipo: 'Retail' },
  { claves: ['6703', '2804', '3156', 'COATZACOALCOS', 'COATZAC'], destino: 'Coatzacoalcos', tipo: 'Foráneo' },
  { claves: ['4860', '6460', '9912', '2963', '192', 'COMALCALCO', 'COMALCAL'], destino: 'Comalcalco', tipo: 'Retail' },
  { claves: ['2590', '2968', '191', 'CARDENAS', 'CARDEN', 'SAMSALA'], destino: 'Cárdenas Tabasco', tipo: 'Foráneo' },
  { claves: ['8358', 'EMILIANO ZAPATA', 'ZAPATA'], destino: 'Emiliano Zapata', tipo: 'Foráneo' },
  { claves: ['6025', '5061', 'FRONTERA', 'FRONTER', 'PINO SUAREZ'], destino: 'Frontera', tipo: 'Retail' },
  { claves: ['6542', '2944', 'TEAPA', 'EKT TEAP'], destino: 'Teapa', tipo: 'Retail' },
  { claves: ['2204', 'PICHUCALCO', 'PICHUCAL'], destino: 'Pichucalco', tipo: 'Foráneo' },
  { claves: ['6107', 'REFORMA', 'REFORM'], destino: 'Reforma Chiapas', tipo: 'Foráneo' },
  { claves: ['2977', '2077', 'OCOSINGO', 'OCOSING'], destino: 'Ocosingo', tipo: 'Foráneo' },
  { claves: ['7579', '4274', 'PALENQUE', 'PALENQ', 'LENQUE', 'LERQUE'], destino: 'Palenque Chiapas', tipo: 'Foráneo' },
  { claves: ['1606', '5678', '8372', 'SAN ANDRES TUXTLA', 'SAN ANDRES'], destino: 'San Andrés Tuxtla', tipo: 'Foráneo' },
  { claves: ['9464', 'CARRANZA', 'CARRANZ'], destino: 'V. Carranza Chiapas', tipo: 'Foráneo' },
  { claves: ['2209', 'ESCARCEGA', 'ESCARCEG'], destino: 'Escárcega', tipo: 'Foráneo' },
  { claves: ['2916', '2016', 'TEHUANTEPEC', 'TEHUANTEP'], destino: 'Tehuantepec Oaxaca', tipo: 'Foráneo' },
  { claves: ['6911', '6011', '1492', 'TAPACHULA', 'TAPACHUL', 'MERCADO SAN JUAN'], destino: 'Tapachula', tipo: 'Foráneo' },
  { claves: ['4239', '6204', 'MATIAS ROMERO', 'MATIAS ROM'], destino: 'Matías Romero', tipo: 'HUB' },
  { claves: ['2978', '2078', 'CD. HIDALGO', 'CD HIDALGO', 'CHIAPAS CD', 'HIDALGO'], destino: 'Cd. Hidalgo Chiapas', tipo: 'Foráneo' },
  { claves: ['9269', 'BDR SANTA ANA', 'SANTA ANA', 'SANTA AN'], destino: 'BDR Santa Ana', tipo: 'Foráneo' },
  { claves: ['3221', 'LA CONCORDIA', 'CONCORDIA'], destino: 'La Concordia', tipo: 'HUB' },
  { claves: ['4750', '6208', '2206', '2558', '9542', 'VILLAHERMOSA', 'VILLAH', 'PLAZA CRISTAL', 'TAMULTE'], destino: 'Villahermosa', tipo: 'Retail' },
  { claves: ['7362', 'TENOSIQUE', 'TENOSIQ'], destino: 'Tenosique Tabasco', tipo: 'Foráneo' },
  { claves: ['6305', '8396', 'JUCHITAN', 'JUCHIT'], destino: 'Juchitán', tipo: 'Foráneo' },
  { claves: ['2901', '2601', '2969', 'COMITAN', 'MOTOS COMIT'], destino: 'Comitán', tipo: 'Foráneo' },
  { claves: ['1656', '7203', '4689', 'SAN CRISTOBAL', 'CRISTOBAL'], destino: 'San Cristóbal de las Casas', tipo: 'Foráneo' },
  { claves: ['6018', 'LA VENTA'], destino: 'La Venta Tabasco', tipo: 'Foráneo' },
  { claves: ['2971', '2707', '5512', '7269', 'MINATITLAN', 'MINATIT'], destino: 'Minatitlán', tipo: 'Foráneo' },
  { claves: ['9757', 'JALPA DE MENDEZ', 'JALPA DE', 'DE MENDEZ'], destino: 'Jalpa de Méndez', tipo: 'HUB' },
  { claves: ['HUB TUXTLA'], destino: 'HUB Tuxtla', tipo: 'Retail' },
  { claves: ['9661', 'TUXTLA GUTIERREZ', 'GUTIERREZ'], destino: 'Tuxtla Gutiérrez', tipo: 'Foráneo' },
  { claves: ['1803', '419', 'TONALA', 'TONAL'], destino: 'Tonalá Chiapas', tipo: 'Foráneo' },
  { claves: ['1294', 'LAS CHOAPAS', 'CHOAPAS'], destino: 'Las Choapas', tipo: 'Foráneo' },
  { claves: ['7540', '2190', 'HUIMANGUILLO', 'HUIMANG'], destino: 'Huimanguillo', tipo: 'Foráneo' },
  { claves: ['5173', '4489', 'CUNDUACAN', 'CUNDUAC'], destino: 'Cunduacán', tipo: 'Retail' },
  { claves: ['4720', 'JALAPA TABASCO'], destino: 'Jalapa Tabasco', tipo: 'Retail' },
  { claves: ['5771', 'NACAJUCA', 'NACAJUC'], destino: 'Nacajuca', tipo: 'Retail' },
  { claves: ['6015', '8981', 'AGUA DULCE', 'AGUADULCE'], destino: 'Agua Dulce', tipo: 'Foráneo' },
  { claves: ['3001', '7809', 'ACAYUCAN', 'ACAYUC'], destino: 'Acayucan', tipo: 'Foráneo' },
  { claves: ['9684', '8403', 'SALINA CRUZ', 'SALINA CR'], destino: 'Salina Cruz', tipo: 'Foráneo' },
  { claves: ['6431', '5067', 'PUERTO ESCONDIDO'], destino: 'Puerto Escondido', tipo: 'Foráneo' },
  { claves: ['2207', '7710', 'HUATULCO'], destino: 'Huatulco', tipo: 'Foráneo' },
  { claves: ['6761', '1449', 'CD DEL CARMEN', 'CARMEN'], destino: 'Cd. del Carmen', tipo: 'Foráneo' },
  { claves: ['6398', 'CAMPECHE'], destino: 'Campeche', tipo: 'Foráneo' },
  { claves: ['8651', 'ARRIAGA'], destino: 'Arriaga', tipo: 'Foráneo' },
  { claves: ['6240', 'CINTALAPA', 'CINTALAP'], destino: 'Cintalapa', tipo: 'Foráneo' },
  { claves: ['3049', 'VILLA FLORES', 'VILLAFLORES'], destino: 'Villaflores', tipo: 'Foráneo' },
  { claves: ['1258', '2486', 'HUIXTLA'], destino: 'Huixtla', tipo: 'Foráneo' }
];

const CAPACIDADES_VALIDAS = [180, 153, 110, 90, 80, 50, 40, 20, 18, 10];

const REGLAS_TIPO_EXPLICITO = [
  { match: (t) => /\bHUB\b/.test(t), valor: 'HUB' },
  { match: (t) => /\bRETAIL\b/.test(t), valor: 'Retail' },
  { match: (t) => /\bFORANEO\b/.test(t), valor: 'Foráneo' },
  { match: (t) => /\bLOCAL\b/.test(t), valor: 'Local' }
];

const PALABRAS_ENCABEZADO = [
  'NO. VIAJE',
  'ECO UNIDAD',
  'PLAN DE COLOCACION',
  'PLAN FIN DE CARGA',
  'RESUMEN DE CARGAS EJECUTADAS',
  'DESTINO / OPERACION',
  'ENTREGADO EN CASETA',
  'FOLIO ENVIO'
];

const limpiarNombreSucursal = (nombre) =>
  String(nombre || '')
    .replace(/^MI\s+EKT\s+/i, '')
    .replace(/^EKT\s+MEGA\s+TAB\s+/i, '')
    .replace(/^EKT\s+MEGA\s+/i, '')
    .replace(/^EKT\s+MOTOS\s+/i, '')
    .replace(/^ELEKTRA\s+MOTOS\s+/i, '')
    .replace(/^MEGA\s+ELEKTRA\s+/i, '')
    .replace(/^MEGA\s+/i, '')
    .replace(/^EKT\s+/i, '')
    .replace(/^APA\s+/i, '')
    .replace(/^SYR\s+/i, '')
    .replace(/\s*-\s*\d+\s*\(MOTOS\)/i, '')
    .replace(/\s*\(RETORNO\)/gi, '')
    .trim();

const buscarDestinoEnReglasOCatalogo = (textoNorm, numSucursal, catalogoSucursales = []) => {
  const numLimpio = String(numSucursal || '').replace(/\D/g, '').trim();

  if (numLimpio && numLimpio !== '0') {
    const porIdRegla = REGLAS_DESTINOS.find((r) => r.claves.includes(numLimpio));
    if (porIdRegla) return { destino: porIdRegla.destino, tipo: porIdRegla.tipo, regla: porIdRegla };

    const porIdCat = (catalogoSucursales || []).find((s) => String(s.id || '').trim() === numLimpio);
    if (porIdCat) {
      return {
        destino: capitalizarTitulo(limpiarNombreSucursal(porIdCat.nombre)),
        tipo: porIdCat.fl === 'LOCAL' ? 'Retail' : 'Foráneo',
        regla: null
      };
    }
  }

  const reglaDirecta = REGLAS_DESTINOS.find((r) =>
    r.claves.some((clave) =>
      /^\d+$/.test(clave)
        ? new RegExp(`\\b${clave}\\b`).test(textoNorm)
        : textoNorm.includes(clave)
    )
  );
  if (reglaDirecta) return { destino: reglaDirecta.destino, tipo: reglaDirecta.tipo, regla: reglaDirecta };

  const sucursalCat = (catalogoSucursales || []).find((s) => {
    const nomNorm = normalizarTexto(limpiarNombreSucursal(s.nombre));
    return nomNorm.length >= 4 && textoNorm.includes(nomNorm);
  });
  if (sucursalCat) {
    return {
      destino: capitalizarTitulo(limpiarNombreSucursal(sucursalCat.nombre)),
      tipo: sucursalCat.fl === 'LOCAL' ? 'Retail' : 'Foráneo',
      regla: null
    };
  }

  return null;
};

const extraerDestinoFallbackDeLineaOcr = (lineaNorm) => {
  const matchPrefijo = lineaNorm.match(
    /\b(?:MI\s+EKT|EKT\s+MEGA\s+TAB|EKT\s+MEGA|EKT\s+MOTOS|MEGA\s+ELEKTRA|EKT|MEGA|APA|BDR|SYR|VTEX)\s+([A-Z0-9.\s]{3,45})/
  );
  if (!matchPrefijo) return null;
  const crudo = matchPrefijo[0]
    .replace(/\b(EN\s*CASETA|ENCAS\w*|COLOCADO|CARGADO|PENDIENTE|COMPLETADO|RETORNO|NO\s+SE\s+CUBRE)\b.*$/i, '')
    .replace(/\b(S\d+|R\d+|C\d+|\d+DS|\d{1,2}:\d{2})\b.*$/i, '')
    .replace(/\s+\d{1,2}\s*$/, '')
    .trim();
  const limpio = limpiarNombreSucursal(crudo);
  if (limpio.length < 4 || /\bENCAS/i.test(limpio)) return null;
  return capitalizarTitulo(limpio);
};

const extraerCapacidadDeLinea = (lineaNorm) => {
  const matchM3 = lineaNorm.match(/\b(10|18|20|40|50|80|90|110|153|180)\s*M/);
  if (matchM3) return Number(matchM3[1]);

  const antesDeLinea = lineaNorm.match(
    /\b(10|18|20|40|50|80|90|110|153|180)\b(?=\s+(?:LTI|BRITO|LIBRA|VALLEY|NUEVA|YODLOGIX|ROLDAN))/
  );
  if (antesDeLinea) return Number(antesDeLinea[1]);

  const corte = lineaNorm.split(/CS00|\d{1,2}\/\d{1,2}\/\d{2,4}/)[0] || lineaNorm;
  const tokens = corte.match(/\b(10|18|20|40|50|80|90|110|153|180)\b/g);
  return tokens && tokens.length > 0 ? Number(tokens[tokens.length - 1]) : 50;
};

const extraerLineaDeTexto = (lineaNorm, reglaDestino) => {
  const regla = REGLAS_LINEAS.find((r) => r.match(lineaNorm));
  if (regla) return regla.valor;
  return reglaDestino?.tipo === 'HUB' ? 'BRITO' : 'LTI - VHS';
};

export const deduplicarCargasUnicas = (lista) => {
  const vistos = new Set();
  return (lista || []).filter((item) => {
    const clave = normalizarTexto(item?.destino);
    if (!clave || vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  }).map((item, idx) => ({
    ...item,
    id: idx + 1
  }));
};

const detectarColumnasTsv = (filas) => {
  for (let i = 0; i < Math.min(filas.length, 5); i++) {
    const cols = filas[i].map(normalizarTexto);
    const idxSucursal = cols.findIndex((c) => c === 'SUCURSAL' || c.includes('DESTINO'));
    if (idxSucursal >= 0) {
      return {
        headerRow: i,
        idxSucursal,
        idxNumSuc: cols.findIndex((c) => c.includes('# SUC') || c === 'SUC' || c === 'NO. SUC'),
        idxCap: cols.findIndex((c) => c.includes('CAP')),
        idxLinea: cols.findIndex((c) => c.includes('LINEA')),
        idxEstatus: cols.findIndex((c) => c.includes('ESTATUS'))
      };
    }
  }

  for (const colsRaw of filas) {
    const cols = colsRaw.map(normalizarTexto);
    const idxCarga = cols.findIndex((c) => /^CS\d{5,}|^VTEX$/.test(c));
    if (idxCarga >= 0 && cols.length > idxCarga + 2) {
      return {
        headerRow: -1,
        idxSucursal: idxCarga + 2,
        idxNumSuc: idxCarga + 1,
        idxCap: cols.findIndex((c, idx) => idx < idxCarga && CAPACIDADES_VALIDAS.includes(Number(c))),
        idxLinea: cols.findIndex((c, idx) => idx < idxCarga && REGLAS_LINEAS.some((r) => r.match(c))),
        idxEstatus: -1
      };
    }
  }

  return null;
};

const extraerCargasDesdeTsv = (textoCrudo, catalogoSucursales = []) => {
  const lineasRaw = String(textoCrudo || '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const filas = lineasRaw.map((l) => l.split('\t').map((c) => c.trim()));
  const mapa = detectarColumnasTsv(filas);
  if (!mapa) return null;

  const resultado = [];

  filas.forEach((cols, rowIndex) => {
    if (rowIndex <= mapa.headerRow) return;
    if (cols.length <= mapa.idxSucursal) return;

    const sucursalRaw = cols[mapa.idxSucursal] || '';
    const numSucRaw = mapa.idxNumSuc >= 0 ? (cols[mapa.idxNumSuc] || '') : '';
    const capRaw = mapa.idxCap >= 0 ? (cols[mapa.idxCap] || '') : '';
    const lineaRaw = mapa.idxLinea >= 0 ? (cols[mapa.idxLinea] || '') : '';
    const rowNorm = normalizarTexto(cols.join(' '));

    if (!sucursalRaw || PALABRAS_ENCABEZADO.some((enc) => normalizarTexto(sucursalRaw).includes(enc))) return;
    if (/^\d+(\.\d+)?$/.test(sucursalRaw.trim())) return;

    const sucNorm = normalizarTexto(sucursalRaw);
    const match = buscarDestinoEnReglasOCatalogo(sucNorm, numSucRaw, catalogoSucursales);
    const destino = match
      ? match.destino
      : capitalizarTitulo(limpiarNombreSucursal(sucursalRaw) || sucursalRaw);

    if (!destino || destino.length < 2) return;

    const tipoExplicito = REGLAS_TIPO_EXPLICITO.find((r) => r.match(rowNorm))?.valor;
    const tipo = tipoExplicito || match?.tipo || 'Foráneo';

    const capNum = Number(String(capRaw).replace(/[^\d.]/g, ''));
    const capacidad = CAPACIDADES_VALIDAS.includes(capNum)
      ? capNum
      : (extraerCapacidadDeLinea(rowNorm) || 50);

    const lineaNorm = normalizarTexto(lineaRaw || rowNorm);
    const linea = extraerLineaDeTexto(lineaNorm, match?.regla);

    resultado.push({
      id: resultado.length + 1,
      destino,
      tipo,
      capacidad,
      linea,
      estatus: 'Ejecutada'
    });
  });

  return deduplicarCargasUnicas(resultado);
};

export const extraerCargasDesdeTextoOcr = (textoCrudo, catalogoSucursales = []) => {
  const texto = String(textoCrudo || '');
  if (texto.includes('\t')) {
    const tsvResultado = extraerCargasDesdeTsv(texto, catalogoSucursales);
    if (tsvResultado && tsvResultado.length > 0) {
      return tsvResultado;
    }
  }

  const lineas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 4);

  const resultado = [];

  lineas.forEach((lineaRaw) => {
    const lineaNorm = normalizarTexto(lineaRaw);
    if (PALABRAS_ENCABEZADO.some((enc) => lineaNorm.includes(enc))) return;

    const match = buscarDestinoEnReglasOCatalogo(lineaNorm, '', catalogoSucursales);
    const destinoFallback = !match ? extraerDestinoFallbackDeLineaOcr(lineaNorm) : null;

    if (!match && !destinoFallback) return;

    const destino = match ? match.destino : destinoFallback;
    const tipoExplicito = REGLAS_TIPO_EXPLICITO.find((r) => r.match(lineaNorm))?.valor;
    const tipo = tipoExplicito || (match ? match.tipo : 'Foráneo');
    const capacidad = extraerCapacidadDeLinea(lineaNorm) || 50;
    const linea = extraerLineaDeTexto(lineaNorm, match?.regla);

    resultado.push({
      id: resultado.length + 1,
      destino,
      tipo,
      capacidad,
      linea,
      estatus: 'Ejecutada'
    });
  });

  return deduplicarCargasUnicas(resultado);
};

const limpiarFondoParaOcr = (ctx, width, height) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const esFondoAmarilloONaranja = r > 170 && g > 125 && b < 115 && (r - b) > 55;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    let val;
    if (esFondoAmarilloONaranja || lum > 215) {
      val = 255;
    } else if (lum < 145) {
      val = 0;
    } else {
      val = Math.round(((lum - 145) / 70) * 255);
    }
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
};

const crearFranjaCanvas = (img, sx, sy, sw, sh, scale) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  limpiarFondoParaOcr(ctx, canvas.width, canvas.height);
  return canvas;
};

const cargarImagenDesdeArchivo = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer el archivo de imagen seleccionado.'));
    };
    img.src = objectUrl;
  });

const generarFranjasOcr = (img, soloMitadIzquierda) => {
  const cropW = soloMitadIzquierda ? Math.round(img.width * 0.62) : img.width;
  const scale = Math.max(2.2, Math.min(4, 2400 / Math.max(1, cropW)));
  const numFranjas = img.height >= 360 ? 3 : 1;

  if (numFranjas === 1) {
    return [crearFranjaCanvas(img, 0, 0, cropW, img.height, scale)];
  }

  const franjas = [
    [0, 0.38],
    [0.32, 0.70],
    [0.64, 1.0]
  ];

  return franjas.map(([inicio, fin]) => {
    const sy = Math.floor(img.height * inicio);
    const sh = Math.ceil(img.height * (fin - inicio));
    return crearFranjaCanvas(img, 0, sy, cropW, sh, scale);
  });
};

export const extraerCargasDesdeImagen = async (file, catalogoSucursales = []) => {
  const [Tesseract, img] = await Promise.all([
    cargarTesseract(),
    cargarImagenDesdeArchivo(file)
  ]);

  const esTablaAncha = img.width / Math.max(1, img.height) >= 1.5;
  const franjas = generarFranjasOcr(img, esTablaAncha);

  const textos = [];
  if (typeof Tesseract.createWorker === 'function') {
    const worker = await Tesseract.createWorker('spa');
    try {
      await worker.setParameters({ tessedit_pageseg_mode: '6' });
      for (const canvas of franjas) {
        const { data } = await worker.recognize(canvas);
        if (data?.text) textos.push(data.text);
      }
      let cargas = extraerCargasDesdeTextoOcr(textos.join('\n'), catalogoSucursales);
      if (esTablaAncha && cargas.length < 3) {
        const completas = generarFranjasOcr(img, false);
        const textosCompletos = [];
        for (const canvas of completas) {
          const { data } = await worker.recognize(canvas);
          if (data?.text) textosCompletos.push(data.text);
        }
        const cargasCompletas = extraerCargasDesdeTextoOcr(textosCompletos.join('\n'), catalogoSucursales);
        if (cargasCompletas.length > cargas.length) cargas = cargasCompletas;
      }
      return cargas;
    } finally {
      await worker.terminate();
    }
  }

  for (const canvas of franjas) {
    const { data } = await Tesseract.recognize(canvas, 'spa+eng');
    if (data?.text) textos.push(data.text);
  }
  return extraerCargasDesdeTextoOcr(textos.join('\n'), catalogoSucursales);
};

const valorCeldaExcel = (cell) => {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  const v = cell.value;
  if (typeof v === 'object') {
    if (v.text) return String(v.text);
    if (Array.isArray(v.richText)) return v.richText.map((r) => r.text || '').join('');
    if (v.result !== undefined && v.result !== null) return String(v.result);
    if (v instanceof Date) {
      const dd = String(v.getDate()).padStart(2, '0');
      const mm = String(v.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${v.getFullYear()}`;
    }
  }
  return String(v);
};

export const extraerCargasDesdeExcel = async (file, catalogoSucursales = []) => {
  const nombre = String(file?.name || '').toLowerCase();
  if (nombre.endsWith('.csv') || nombre.endsWith('.tsv') || nombre.endsWith('.txt')) {
    const texto = await file.text();
    const tsv = texto.includes('\t') ? texto : texto.replace(/,/g, '\t');
    return extraerCargasDesdeTextoOcr(tsv, catalogoSucursales);
  }

  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  let mejorResultado = [];
  for (const worksheet of workbook.worksheets) {
    const lineas = [];
    worksheet.eachRow((row) => {
      const cols = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cols[colNumber - 1] = valorCeldaExcel(cell).replace(/\r?\n/g, ' ').trim();
      });
      if (cols.some(Boolean)) {
        lineas.push(cols.map((c) => c || '').join('\t'));
      }
    });
    const cargasHoja = extraerCargasDesdeTextoOcr(lineas.join('\n'), catalogoSucursales);
    if (cargasHoja.length > mejorResultado.length) {
      mejorResultado = cargasHoja;
    }
  }

  return mejorResultado;
};
