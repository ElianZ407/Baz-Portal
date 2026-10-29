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
    .trim();

const REGLAS_LINEAS = [
  { match: (t) => t.includes('YODLOGIX'), valor: 'YODLOGIXTRADE' },
  { match: (t) => t.includes('MADRINA'), valor: 'LTI MADRINA - VHS' },
  { match: (t) => t.includes('LTI FULL') || t.includes('FULL - VHS'), valor: 'LTI FULL - VHS' },
  { match: (t) => t.includes('HUB TUXTLA') && t.includes('LTI'), valor: 'LTI - HUB TUXTLA' },
  { match: (t) => t.includes('LIBRAS EXPRESS'), valor: 'LIBRAS EXPRESS' },
  { match: (t) => t.includes('LIBRA EXPRESS') || t.includes('LIBRA '), valor: 'LIBRA EXPRESS' },
  { match: (t) => t.includes('VALLEY'), valor: 'VALLEY' },
  { match: (t) => t.includes('BRITO'), valor: 'BRITO' },
  { match: (t) => t.includes('ROLDAN'), valor: 'ROLDAN' },
  { match: (t) => t.includes('LTI'), valor: 'LTI - VHS' }
];

const REGLAS_DESTINOS = [
  { claves: ['8267', '7414', 'MACUSPANA'], destino: 'Macuspana', tipo: 'Retail' },
  { claves: ['6381', 'PARAISO'], destino: 'Paraíso', tipo: 'Retail' },
  { claves: ['6703', '2804', '3156', 'COATZACOALCOS'], destino: 'Coatzacoalcos', tipo: 'Foráneo' },
  { claves: ['4860', '6460', '9912', '2963', 'COMALCALCO'], destino: 'Comalcalco', tipo: 'Retail' },
  { claves: ['2590', '2968', 'CARDENAS'], destino: 'Cárdenas Tabasco', tipo: 'Foráneo' },
  { claves: ['8358', 'EMILIANO ZAPATA'], destino: 'Emiliano Zapata', tipo: 'Foráneo' },
  { claves: ['6025', '5061', 'FRONTERA'], destino: 'Frontera', tipo: 'Retail' },
  { claves: ['6542', '2944', 'TEAPA'], destino: 'Teapa', tipo: 'Retail' },
  { claves: ['2204', 'PICHUCALCO'], destino: 'Pichucalco', tipo: 'Foráneo' },
  { claves: ['6107', 'REFORMA'], destino: 'Reforma Chiapas', tipo: 'Foráneo' },
  { claves: ['2077', 'OCOSINGO'], destino: 'Ocosingo', tipo: 'Foráneo' },
  { claves: ['7579', 'PALENQUE'], destino: 'Palenque Chiapas', tipo: 'Foráneo' },
  { claves: ['1606', '5678', '8372', 'SAN ANDRES TUXTLA'], destino: 'San Andrés Tuxtla', tipo: 'Foráneo' },
  { claves: ['9464', 'CARRANZA'], destino: 'V. Carranza Chiapas', tipo: 'Foráneo' },
  { claves: ['2209', 'ESCARCEGA'], destino: 'Escárcega', tipo: 'Foráneo' },
  { claves: ['2016', 'TEHUANTEPEC'], destino: 'Tehuantepec Oaxaca', tipo: 'Foráneo' },
  { claves: ['6011', '1492', 'TAPACHULA'], destino: 'Tapachula', tipo: 'Foráneo' },
  { claves: ['4239', '6204', 'MATIAS ROMERO'], destino: 'Matías Romero', tipo: 'HUB' },
  { claves: ['2078', 'CD. HIDALGO', 'CD HIDALGO', 'CHIAPAS CD'], destino: 'Cd. Hidalgo Chiapas', tipo: 'Foráneo' },
  { claves: ['9269', 'BDR SANTA ANA', 'SANTA ANA'], destino: 'BDR Santa Ana', tipo: 'Foráneo' },
  { claves: ['3221', 'LA CONCORDIA', 'CONCORDIA'], destino: 'La Concordia', tipo: 'HUB' },
  { claves: ['4750', '6208', '2206', 'VILLAHERMOSA'], destino: 'Villahermosa', tipo: 'Retail' },
  { claves: ['7362', 'TENOSIQUE'], destino: 'Tenosique Tabasco', tipo: 'Foráneo' },
  { claves: ['6305', '8396', 'JUCHITAN'], destino: 'Juchitán', tipo: 'Foráneo' },
  { claves: ['2601', '2969', 'COMITAN'], destino: 'Comitán', tipo: 'Foráneo' },
  { claves: ['1656', '7203', '4689', 'SAN CRISTOBAL'], destino: 'San Cristóbal de las Casas', tipo: 'Foráneo' },
  { claves: ['6018', 'LA VENTA'], destino: 'La Venta Tabasco', tipo: 'Foráneo' },
  { claves: ['2971', '2707', '5512', '7269', 'MINATITLAN'], destino: 'Minatitlán', tipo: 'Foráneo' },
  { claves: ['9757', 'JALPA DE MENDEZ', 'JALPA'], destino: 'Jalpa de Méndez', tipo: 'HUB' },
  { claves: ['HUB TUXTLA'], destino: 'HUB Tuxtla', tipo: 'Retail' },
  { claves: ['9661', 'TUXTLA GUTIERREZ'], destino: 'Tuxtla Gutiérrez', tipo: 'Foráneo' },
  { claves: ['419', 'TONALA'], destino: 'Tonalá Chiapas', tipo: 'Foráneo' },
  { claves: ['1294', 'LAS CHOAPAS', 'CHOAPAS'], destino: 'Las Choapas', tipo: 'Foráneo' },
  { claves: ['7540', '2190', 'HUIMANGUILLO'], destino: 'Huimanguillo', tipo: 'Foráneo' },
  { claves: ['5173', '4489', 'CUNDUACAN'], destino: 'Cunduacán', tipo: 'Retail' },
  { claves: ['4720', 'JALAPA TABASCO'], destino: 'Jalapa Tabasco', tipo: 'Retail' },
  { claves: ['5771', 'NACAJUCA'], destino: 'Nacajuca', tipo: 'Retail' },
  { claves: ['6015', '8981', 'AGUA DULCE', 'AGUADULCE'], destino: 'Agua Dulce', tipo: 'Foráneo' },
  { claves: ['3001', '7809', 'ACAYUCAN'], destino: 'Acayucan', tipo: 'Foráneo' },
  { claves: ['9684', '8403', 'SALINA CRUZ'], destino: 'Salina Cruz', tipo: 'Foráneo' },
  { claves: ['6431', '5067', 'PUERTO ESCONDIDO'], destino: 'Puerto Escondido', tipo: 'Foráneo' },
  { claves: ['2207', '7710', 'HUATULCO'], destino: 'Huatulco', tipo: 'Foráneo' },
  { claves: ['6761', '1449', 'CD DEL CARMEN', 'CARMEN'], destino: 'Cd. del Carmen', tipo: 'Foráneo' },
  { claves: ['6398', 'CAMPECHE'], destino: 'Campeche', tipo: 'Foráneo' },
  { claves: ['8651', 'ARRIAGA'], destino: 'Arriaga', tipo: 'Foráneo' },
  { claves: ['6240', 'CINTALAPA'], destino: 'Cintalapa', tipo: 'Foráneo' },
  { claves: ['3049', 'VILLA FLORES', 'VILLAFLORES'], destino: 'Villaflores', tipo: 'Foráneo' },
  { claves: ['1258', '2486', 'HUIXTLA'], destino: 'Huixtla', tipo: 'Foráneo' }
];

const CAPACIDADES_VALIDAS = [153, 180, 110, 90, 80, 50, 40, 18];

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
  'DESTINO / OPERACION'
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
    .replace(/\s*-\s*\d+\s*\(MOTOS\)/i, '')
    .replace(/\s*\(RETORNO\)/gi, '')
    .trim();

const extraerCapacidadDeLinea = (lineaNorm) => {
  const matchM3 = lineaNorm.match(/\b(18|40|50|80|90|110|153|180)\s*M/);
  if (matchM3) return Number(matchM3[1]);

  const corte = lineaNorm.split(/CS00|\d{1,2}\/\d{1,2}\/\d{2,4}/)[0] || lineaNorm;
  const tokens = corte.match(/\b(18|40|50|80|90|110|153|180)\b/g);
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

export const extraerCargasDesdeTextoOcr = (textoCrudo, catalogoSucursales = []) => {
  const lineas = String(textoCrudo || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 4);

  const resultado = [];

  lineas.forEach((lineaRaw) => {
    const lineaNorm = normalizarTexto(lineaRaw);
    if (PALABRAS_ENCABEZADO.some((enc) => lineaNorm.includes(enc))) return;

    const reglaDirecta = REGLAS_DESTINOS.find((r) =>
      r.claves.some((clave) =>
        /^\d+$/.test(clave)
          ? new RegExp(`\\b${clave}\\b`).test(lineaNorm)
          : lineaNorm.includes(clave)
      )
    );

    const sucursalCat = !reglaDirecta
      ? (catalogoSucursales || []).find((s) => {
          const nomNorm = normalizarTexto(limpiarNombreSucursal(s.nombre));
          return nomNorm.length >= 4 && lineaNorm.includes(nomNorm);
        })
      : null;

    if (!reglaDirecta && !sucursalCat) return;

    const destino = reglaDirecta
      ? reglaDirecta.destino
      : limpiarNombreSucursal(sucursalCat.nombre);

    const tipoExplicito = REGLAS_TIPO_EXPLICITO.find((r) => r.match(lineaNorm))?.valor;
    const tipo = tipoExplicito || (reglaDirecta ? reglaDirecta.tipo : (sucursalCat?.fl === 'LOCAL' ? 'Retail' : 'Foráneo'));
    const capacidad = extraerCapacidadDeLinea(lineaNorm) || CAPACIDADES_VALIDAS[5];
    const linea = extraerLineaDeTexto(lineaNorm, reglaDirecta);

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

const preprocesarImagenEnCanvas = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const scale = img.width < 1600 ? 2 : 1.5;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.filter = 'contrast(1.35) saturate(0.2)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer el archivo de imagen seleccionado.'));
    };

    img.src = objectUrl;
  });

export const extraerCargasDesdeImagen = async (file, catalogoSucursales = []) => {
  const [Tesseract, canvas] = await Promise.all([
    cargarTesseract(),
    preprocesarImagenEnCanvas(file)
  ]);

  const { data } = await Tesseract.recognize(canvas, 'spa+eng');
  return extraerCargasDesdeTextoOcr(data?.text || '', catalogoSucursales);
};
