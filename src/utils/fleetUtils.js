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

// Valida si una unidad/viaje cuenta con Número de Viaje, Operador y Destino asignado
export const checkTieneViajeYOperador = (unit) => {
  if (!unit) return { valid: false, hasViaje: false, hasOperador: false, hasDestino: false };

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

  const destinoStr = String(unit.destino || unit.numSucursal || '').trim();
  const hasDestino = Boolean(
    destinoStr &&
    destinoStr !== '—' &&
    destinoStr !== '-' &&
    destinoStr.toLowerCase() !== 'sin destino' &&
    destinoStr.toLowerCase() !== 'por asignar' &&
    destinoStr.toLowerCase() !== 'sin asignar'
  );

  return {
    valid: hasViaje && hasOperador && hasDestino,
    hasViaje,
    hasOperador,
    hasDestino
  };
};

/**
 * Evalúa si una unidad estará disponible para operar mañana
 * Criterios Oficiales BAZ Entregas:
 * 1. TALLER: Si está en taller mecánico => NO DISPONIBLE
 * 2. PATIO DISPONIBLE: Si no tiene viaje activo o está libre en patio => DISPONIBLE
 * 3. LOCAL: Viajes locales (Villahermosa, Cárdenas, Comalcalco, Paraíso, etc.) retornan hoy => DISPONIBLE
 * 4. RETORNO / COMPLETADO: Ya en regreso o completadas en CEDIS => DISPONIBLE
 * 5. FORÁNEO:
 *    - Si salió temprano (<= 10:00 AM) y el tiempo total ida+vuelta le permite volver hoy antes de 22:00 => DISPONIBLE
 *    - Si salió tarde (> 10:00 AM), o es viaje largo (> 5 hrs ida), o no ha salido aún a esta hora => NO DISPONIBLE
 */
export const evaluarDisponibilidadManana = (unit, catalogoFlota = []) => {
  if (!unit) return { disponible: false, motivo: 'Sin datos', badge: 'DESCONOCIDO', color: '#94a3b8' };

  // 1. Taller mecánico
  const isTaller = 
    unit.estatusPatio === 'Taller' || 
    unit.estatus === 'TALLER' ||
    (catalogoFlota || []).some(f => String(f.eco) === String(unit.economico) && (f.estatus === 'TALLER' || (f.estatus || '').toLowerCase().includes('taller')));
  
  if (isTaller) {
    return {
      disponible: false,
      badge: 'NO DISPONIBLE',
      motivo: 'En Taller mecánico',
      detalle: 'Bloqueada por mantenimiento',
      color: '#ef4444'
    };
  }

  // 2. Unidad libre en patio sin viaje asignado
  const hasViaje = Boolean(unit.noViaje && String(unit.noViaje).trim() !== '' && unit.noViaje !== '—');
  const isPatioLibre = (unit.estatusPatio === 'Disponible' || !unit.estatusPatio) && !hasViaje;
  if (isPatioLibre) {
    return {
      disponible: true,
      badge: 'DISPONIBLE',
      motivo: 'En Patio (Libre)',
      detalle: 'Lista en patio para nueva asignación',
      color: '#10b981'
    };
  }

  // 3. Estatus de retorno o completado
  const estatusSup = unit.estatusSupervisor || '';
  if (estatusSup === 'Retorno' || unit.estatusPlaneacion === 'RETORNO' || estatusSup === 'Completado' || unit.estatusPlaneacion === 'COMPLETADO') {
    return {
      disponible: true,
      badge: 'DISPONIBLE',
      motivo: 'En Retorno / Concluido',
      detalle: 'Ya en retorno al CEDIS o viaje concluido',
      color: '#10b981'
    };
  }

  // 4. Tipo de viaje: LOCAL vs FORÁNEO
  const isForaneo = (unit.fl || 'LOCAL').toUpperCase() === 'FORANEO';

  if (!isForaneo) {
    // Viaje Local: regresa hoy mismo
    return {
      disponible: true,
      badge: 'DISPONIBLE',
      motivo: 'Ruta Local (Regresa hoy)',
      detalle: `${unit.destino || 'Destino local'} • Retorno garantizado hoy`,
      color: '#10b981'
    };
  }

  // 5. Viaje Foráneo: evaluar hora de salida y tiempo de viaje
  const horaSalida = unit.horaSalida || unit.horaCaseta || '';
  let horaSalidaNum = 6;
  if (horaSalida && horaSalida.includes(':')) {
    horaSalidaNum = parseInt(horaSalida.split(':')[0], 10) || 6;
  }

  const tiempoEstimadoHrs = Number(unit.tiempoEstimadoHrs) || 4; // default 4 hrs ida
  const horaRetornoEstimada = horaSalidaNum + (tiempoEstimadoHrs * 2);

  // Si salió temprano (<= 10:00) y el tiempo total le permite volver antes de las 22:00
  if (horaSalidaNum <= 10 && horaRetornoEstimada <= 22) {
    return {
      disponible: true,
      badge: 'DISPONIBLE',
      motivo: 'Foráneo temprano (Retorna hoy)',
      detalle: `Salida ${horaSalida || '06:00'} • Retorno estimado ${Math.min(23, Math.floor(horaRetornoEstimada))}:00 hrs`,
      color: '#10b981'
    };
  }

  // Foráneo tarde o viaje muy largo: no regresa hoy
  return {
    disponible: false,
    badge: 'NO DISPONIBLE',
    motivo: 'Foráneo no retorna hoy',
    detalle: `Salida ${horaSalida || 'tarde'} a ${unit.destino || 'Foráneo'} • Pernocta fuera de CD`,
    color: '#f59e0b'
  };
};

