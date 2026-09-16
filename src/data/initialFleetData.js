// Base de datos de viajes diarios BAZ Entregas CD Villahermosa — Tablero limpio sin datos precargados
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

