// Constantes generales de operación BAZ Entregas
export const INITIAL_UNITS = [];

export const LINEAS_TRANSPORTE = [
  "LTI - VHS",
  "VALLEY",
  "LTI - VHS - MADRINA",
  "PROPIA BAZ"
];

export const TURNOS = [
  { id: "M1", nombre: "Turno M1 (Mañana 1)" },
  { id: "M2", nombre: "Turno M2 (Mañana 2)" },
  { id: "M3", nombre: "Turno M3 (Tarde)" },
  { id: "AUDITORIA", nombre: "Auditoría de Carga" },
  { id: "VAC", nombre: "Vacaciones" },
  { id: "INC", nombre: "Incapacidad" }
];

export const BLOQUES = Array.from({ length: 19 }, (_, i) => i + 1);

// Catálogos vacíos por defecto (se alimentan dinámicamente desde Supabase)
export const FLOTA_TOTAL = [];
export const SUCURSALES_MAESTRAS = [];
export const OPERADORES_ACTIVOS = [];
export const CAJAS_SECAS = [];

export const RAMPAS_RECIBO_NUM = Array.from({ length: 16 }, (_, i) => String(i + 1));
export const RAMPAS_RECIBO_ESP = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
export const RAMPAS_EMBARQUE_NUM = Array.from({ length: 16 }, (_, i) => String(i + 17));
export const RAMPAS_EMBARQUE_ESP = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
export const RAMPAS_DS = ['DS 1', 'DS 2', 'DS 3'];

export const CATALOGO_RAMPAS = {
  recibo: {
    id: 'recibo',
    nombre: 'Recibo',
    subtitulo: '1 al 16 / R1 a R6',
    numericas: RAMPAS_RECIBO_NUM,
    especiales: RAMPAS_RECIBO_ESP,
    todas: [...RAMPAS_RECIBO_NUM, ...RAMPAS_RECIBO_ESP]
  },
  embarque: {
    id: 'embarque',
    nombre: 'Embarque',
    subtitulo: '17 al 32 / S1 a S6',
    numericas: RAMPAS_EMBARQUE_NUM,
    especiales: RAMPAS_EMBARQUE_ESP,
    todas: [...RAMPAS_EMBARQUE_NUM, ...RAMPAS_EMBARQUE_ESP]
  },
  ds: {
    id: 'ds',
    nombre: 'DS',
    subtitulo: 'DS 1, 2, 3',
    numericas: [],
    especiales: RAMPAS_DS,
    todas: RAMPAS_DS
  }
};

export const TODAS_LAS_RAMPAS = [
  ...RAMPAS_RECIBO_NUM,
  ...RAMPAS_RECIBO_ESP,
  ...RAMPAS_EMBARQUE_NUM,
  ...RAMPAS_EMBARQUE_ESP,
  ...RAMPAS_DS
];

export const detectarZonaRampa = (cortina) => {
  const norm = String(cortina || '').trim().toUpperCase();
  if (!norm) return null;
  if (norm.startsWith('DS')) return 'ds';
  const num = Number(norm);
  if (norm.startsWith('R') || (!Number.isNaN(num) && num >= 1 && num <= 16)) return 'recibo';
  if (norm.startsWith('S') || (!Number.isNaN(num) && num >= 17 && num <= 32)) return 'embarque';
  return null;
};
