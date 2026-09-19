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

// Validador de Restricciones Operativas
export const validarRestriccionesViaje = (sucursalesList, capUnidad, catalogo = SUCURSALES_MAESTRAS) => {
  if (!sucursalesList || !Array.isArray(sucursalesList) || sucursalesList.length === 0) return [];
  const alertas = [];
  const sucursales = sucursalesList
    .map(item => typeof item === 'string' ? buscarSucursal(item, catalogo) : buscarSucursal(item?.id || item?.num, catalogo))
    .filter(Boolean);

  // 1. Validar Capacidad Máxima Vehicular
  sucursales.forEach(s => {
    if (s.capMax === "18" || s.capMax === "Kangoo / 18") {
      if (capUnidad > 18) {
        alertas.push(`Sucursal ${s.id} (${s.nombre}) tiene restricción de acceso: Solo admite unidades Kangoo / 18 (Cap. asignada: ${capUnidad})`);
      }
    }
  });

  // 2. Validar Restricciones de Incompatibilidad
  const ids = sucursales.map(s => String(s.id));
  
  if (ids.includes("9464") && ids.some(id => ["2057", "143", "449"].includes(id))) {
    alertas.push("Restricción en Carranza: Sucursal 9464 NO debe enviarse combinada con 2057, 143 o 449");
  }

  if (ids.some(id => ["8396", "6305"].includes(id)) && ids.some(id => ["3803", "8403", "9684"].includes(id))) {
    alertas.push("Restricción en Juchitán: No debe enviarse combinada con 3803, 8403 o 9684");
  }

  if (ids.includes("6134") && ids.some(id => ["6240", "3049", "4158", "7548"].includes(id))) {
    alertas.push("Restricción en Chiapa de Corzo (6134): No enviar con 6240, 3049, 4158 o 7548");
  }

  if (ids.includes("3049") && ids.some(id => ["6240", "6134"].includes(id))) {
    alertas.push("Restricción en Villaflores (3049): No enviar con 6240 o 6134");
  }

  return alertas;
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

// Valida si una unidad/viaje cuenta con Número de Viaje y Operador asignado
export const checkTieneViajeYOperador = (unit) => {
  if (!unit) return { valid: false, hasViaje: false, hasOperador: false };

  const noViajeStr = String(unit.noViaje || '').trim();
  const hasViaje = Boolean(
    noViajeStr &&
    noViajeStr !== '—' &&
    noViajeStr !== '-' &&
    noViajeStr !== '0' &&
    noViajeStr.toLowerCase() !== 'sin viaje' &&
    noViajeStr.toLowerCase() !== 'por asignar'
  );

  const operadorStr = String(unit.operador || '').trim();
  const hasOperador = Boolean(
    operadorStr &&
    operadorStr !== '—' &&
    operadorStr !== '-' &&
    operadorStr.toLowerCase() !== 'por asignar' &&
    operadorStr.toLowerCase() !== 'sin asignar' &&
    operadorStr.toLowerCase() !== 'vacante' &&
    operadorStr.toLowerCase() !== 'baja'
  );

  return {
    valid: hasViaje && hasOperador,
    hasViaje,
    hasOperador
  };
};
