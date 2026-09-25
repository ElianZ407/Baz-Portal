import { createClient } from '@supabase/supabase-js';

// Credenciales oficiales de Supabase para BAZ Entregas CD Villahermosa
// Clave anon pública con Row-Level Security activado para acceso seguro cliente
const OFFICIAL_BAZ_SUPABASE_URL = 'https://gwqtxcceyzgkndyxpjdp.supabase.co';
const OFFICIAL_BAZ_SUPABASE_ANON_KEY = 'sb_publishable_YJEgIM_tqk6pQXdpfGGBWQ_IuourZfR';

// Obtener credenciales desde localStorage (personalizadas), variables de entorno (.env/Vercel) o valores oficiales por defecto
export const getSupabaseCredentials = () => {
  try {
    const localUrl = localStorage.getItem('baz_supabase_url');
    const localKey = localStorage.getItem('baz_supabase_anon_key');
    if (localUrl && localKey) {
      return {
        url: localUrl.trim(),
        key: localKey.trim(),
        source: 'manual'
      };
    }
  } catch (e) {
    console.warn('No se pudo acceder a localStorage para Supabase:', e);
  }

  const envUrl = 
    import.meta.env.VITE_SUPABASE_URL || 
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
    
  const envKey = 
    import.meta.env.VITE_SUPABASE_ANON_KEY || 
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (envUrl && envKey) {
    return {
      url: envUrl.trim(),
      key: envKey.trim(),
      source: 'env'
    };
  }

  // Fallback garantizado: permite que cualquier computadora conecte inmediatamente a la nube
  return {
    url: OFFICIAL_BAZ_SUPABASE_URL,
    key: OFFICIAL_BAZ_SUPABASE_ANON_KEY,
    source: 'official'
  };
};

const credentials = getSupabaseCredentials();

export const isSupabaseConfigured = () => {
  const creds = getSupabaseCredentials();
  return Boolean(creds.url && creds.key && creds.url.startsWith('https://'));
};

// Crear cliente Supabase (o null si aún no está configurado)
export const supabase = isSupabaseConfigured()
  ? createClient(credentials.url, credentials.key, {
      auth: {
        persistSession: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null;

// Guardar credenciales desde la UI de la aplicación (para que el usuario no necesite tocar código)
export const saveSupabaseCredentials = (url, key) => {
  if (!url || !key) return false;
  localStorage.setItem('baz_supabase_url', url.trim());
  localStorage.setItem('baz_supabase_anon_key', key.trim());
  return true;
};

// Limpiar credenciales
export const clearSupabaseCredentials = () => {
  localStorage.removeItem('baz_supabase_url');
  localStorage.removeItem('baz_supabase_anon_key');
};

// Mapeo de columnas de Base de Datos (snake_case) <-> Objeto de Viaje (camelCase)
export const mapDbToUnit = (row) => {
  let destinosSecundarios = [];
  let obs = row.observaciones || '';
  let meta = {};

  if (obs.includes('__META__:')) {
    try {
      const match = obs.match(/__META__:(\{.*?\})(?:$|\n)/s);
      if (match && match[1]) {
        meta = JSON.parse(match[1]);
        obs = obs.replace(/__META__:\{.*?\}(?:\n|$)/gs, '').trim();
      }
    } catch {}
  }

  if (obs.includes('__PARADAS__:')) {
    try {
      const match = obs.match(/__PARADAS__:(\[.*?\])(?:$|\n)/s);
      if (match && match[1]) {
        destinosSecundarios = JSON.parse(match[1]);
        obs = obs.replace(/__PARADAS__:\[.*?\](?:\n|$)/gs, '').trim();
      }
    } catch {
      destinosSecundarios = [];
    }
  }

  return {
    ...meta,
    id: row.id,
    noViaje: row.no_viaje || '',
    economico: row.economico || '',
    bloque: Number(row.bloque) || 1,
    placas: row.placas || '',
    capUnidad: Number(row.cap_unidad) || 0,
    linea: row.linea || 'LTI - VHS',
    tipo: row.tipo || '',
    operador: row.operador || '',
    idOperador: row.id_operador || '',
    turno: row.turno || 'M1',
    cortina: row.cortina || '',
    numCarga: row.num_carga || '',
    numSucursal: row.num_sucursal || '',
    sucursalOrigen: row.sucursal_origen || 'CEDIS VILLAHERMOSA',
    destino: (row.destino || '').replace(/\s*\(Retorno\)/gi, '').trim(),
    destinosSecundarios: Array.isArray(destinosSecundarios) ? destinosSecundarios : [],
    closter: row.closter || '',
    fl: row.fl || 'LOCAL',
    capMax: row.cap_max || '',
    fecha: row.fecha || '',
    horaSalida: row.hora_salida || '',
    tiempoEstimadoHrs: Number(row.tiempo_estimado_hrs) || 0,
    eta: row.eta || '',
    estatusPatio: row.estatus_patio || 'Disponible',
    estatusPlaneacion: row.estatus_planeacion || 'PENDIENTE',
    estatusSupervisor: row.estatus_supervisor || 'Pendiente',
    observaciones: obs,
    actualizadoEn: row.actualizado_en || '',
    horaColocacion: meta.horaColocacion || '06:00',
    horaColocacionReal: meta.horaColocacionReal || '',
    horaFinCarga: meta.horaFinCarga || '07:30',
    horaCaseta: meta.horaCaseta || '',
    folioEnvio: meta.folioEnvio || '',
    sellos: meta.sellos || '',
    valeEstructura: meta.valeEstructura || '0',
    motosEstructuras: Number(meta.motosEstructuras) || 0,
    motosCarton: Number(meta.motosCarton) || 0,
    remolque: meta.remolque || '0',
    mtrs: Number(meta.mtrs) || 0
  };
};

export const mapUnitToDb = (unit) => {
  let obs = unit.observaciones || '';
  if (Array.isArray(unit.destinosSecundarios) && unit.destinosSecundarios.length > 0) {
    obs = obs.replace(/__PARADAS__:\[.*?\](?:\n|$)/gs, '').trim();
    obs = obs 
      ? `${obs}\n__PARADAS__:${JSON.stringify(unit.destinosSecundarios)}` 
      : `__PARADAS__:${JSON.stringify(unit.destinosSecundarios)}`;
  }

  // Serializar campos adicionales de planeación oficial para preservación total
  const meta = {};
  if (unit.horaColocacion) meta.horaColocacion = unit.horaColocacion;
  if (unit.horaColocacionReal) meta.horaColocacionReal = unit.horaColocacionReal;
  if (unit.horaFinCarga) meta.horaFinCarga = unit.horaFinCarga;
  if (unit.horaCaseta) meta.horaCaseta = unit.horaCaseta;
  if (unit.folioEnvio) meta.folioEnvio = unit.folioEnvio;
  if (unit.sellos) meta.sellos = unit.sellos;
  if (unit.valeEstructura) meta.valeEstructura = unit.valeEstructura;
  if (unit.motosEstructuras !== undefined) meta.motosEstructuras = unit.motosEstructuras;
  if (unit.motosCarton !== undefined) meta.motosCarton = unit.motosCarton;
  if (unit.remolque) meta.remolque = unit.remolque;
  if (unit.mtrs !== undefined) meta.mtrs = unit.mtrs;

  if (Object.keys(meta).length > 0) {
    obs = obs.replace(/__META__:\{.*?\}(?:\n|$)/gs, '').trim();
    obs = obs ? `${obs}\n__META__:${JSON.stringify(meta)}` : `__META__:${JSON.stringify(meta)}`;
  }

  return {
    id: unit.id,
    no_viaje: unit.noViaje || '',
    economico: unit.economico || '',
    bloque: Number(unit.bloque) || 1,
    placas: unit.placas || '',
    cap_unidad: Number(unit.capUnidad) || 0,
    linea: unit.linea || 'LTI - VHS',
    tipo: unit.tipo || '',
    operador: unit.operador || '',
    id_operador: unit.idOperador || '',
    turno: unit.turno || 'M1',
    cortina: unit.cortina || '',
    num_carga: unit.numCarga || '',
    num_sucursal: unit.numSucursal || '',
    sucursal_origen: unit.sucursalOrigen || 'CEDIS VILLAHERMOSA',
    destino: (unit.destino || '').replace(/\s*\(Retorno\)/gi, '').trim(),
    closter: unit.closter || '',
    fl: unit.fl || 'LOCAL',
    cap_max: unit.capMax || '',
    fecha: unit.fecha || '',
    hora_salida: unit.horaSalida || '',
    tiempo_estimado_hrs: Number(unit.tiempoEstimadoHrs) || 0,
    eta: unit.eta || '',
    estatus_patio: unit.estatusPatio || 'Disponible',
    estatus_planeacion: unit.estatusPlaneacion || 'PENDIENTE',
    estatus_supervisor: unit.estatusSupervisor || 'Pendiente',
    observaciones: obs,
    actualizado_en: unit.actualizadoEn || '',
    updated_at: new Date().toISOString()
  };
};

// Helpers de operaciones en Supabase
export const fetchViajesDb = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('viajes_diarios')
    .select('*')
    .order('bloque', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error al consultar viajes_diarios en Supabase:', error);
    return null;
  }
  return data.map(mapDbToUnit);
};

export const upsertViajeDb = async (unit) => {
  if (!supabase) return null;
  const dbRow = mapUnitToDb(unit);
  const { data, error } = await supabase
    .from('viajes_diarios')
    .upsert(dbRow, { onConflict: 'id' });

  if (error) {
    console.error('Error al guardar viaje en Supabase:', error);
    throw error;
  }
  return data;
};

// Guardado en lote (bulk) para importaciones de Excel
export const bulkUpsertViajesDb = async (units) => {
  if (!supabase || !Array.isArray(units) || units.length === 0) return null;
  const dbRows = units.map(mapUnitToDb);

  // Procesar en chunks de 50 para evitar exceder límites de request
  const CHUNK_SIZE = 50;
  for (let i = 0; i < dbRows.length; i += CHUNK_SIZE) {
    const chunk = dbRows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('viajes_diarios')
      .upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error('Error en bulkUpsertViajesDb chunk:', error);
      throw error;
    }
  }
  return true;
};

// Vaciar viajes activos en Supabase (para reemplazo limpio)
export const clearViajesDb = async () => {
  if (!supabase) return null;
  const { error } = await supabase
    .from('viajes_diarios')
    .delete()
    .neq('id', '___non_existent___');
  if (error) {
    console.error('Error al vaciar viajes_diarios:', error);
    throw error;
  }
  return true;
};

export const deleteViajeDb = async (id) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('viajes_diarios')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error al eliminar viaje en Supabase:', error);
    throw error;
  }
  return data;
};

// ==========================================
// OPERACIONES HISTÓRICAS DE PLANES / DÍAS
// ==========================================

export const fetchPlanesHistoricosDb = async () => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('historial_planes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Si la tabla aún no fue creada en Supabase, no lanzar error fatal
      console.warn('Advertencia al consultar historial_planes:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Excepción al consultar historial_planes:', err);
    return null;
  }
};

export const savePlanHistoricoDb = async (plan) => {
  if (!supabase) return null;
  try {
    const row = {
      id: plan.id,
      fecha: plan.fecha,
      nombre: plan.nombre || `Plan ${plan.fecha}`,
      total_viajes: plan.totalViajes || (plan.unidades ? plan.unidades.length : 0),
      total_completados: plan.totalCompletados || 0,
      datos: plan.unidades || [],
      created_at: plan.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('historial_planes')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('Error al guardar en historial_planes en Supabase:', error);
      throw error;
    }
    return data;
  } catch (err) {
    console.warn('Excepción al guardar en historial_planes:', err);
    throw err;
  }
};

export const deletePlanHistoricoDb = async (id) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('historial_planes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al eliminar plan histórico en Supabase:', err);
    throw err;
  }
};

// ==========================================
// CATÁLOGO DE UNIDADES BAZ
// ==========================================

export const fetchUnidadesDb = async () => {
  if (!supabase) return null;
  try {
    // Intentar leer de la tabla unidades; si no existe aún, intentar de flota_maestra
    let { data, error } = await supabase
      .from('unidades')
      .select('*')
      .order('eco', { ascending: true });

    if (error && error.code === '42P01') {
      // Tabla unidades no existe aún en el esquema, fallback a flota_maestra
      const resFallback = await supabase
        .from('flota_maestra')
        .select('*')
        .order('eco', { ascending: true });
      return resFallback.data;
    }

    if (error) {
      console.warn('Advertencia al consultar unidades en Supabase:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Excepción al consultar unidades en Supabase:', err);
    return null;
  }
};

export const upsertUnidadDb = async (unidad) => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('unidades')
      .upsert(unidad, { onConflict: 'eco' });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error al guardar unidad en Supabase:', err);
    throw err;
  }
};

export const fetchFlotaMaestraDb = async () => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('flota_maestra')
      .select('*')
      .order('eco', { ascending: true });

    if (error) {
      console.warn('Advertencia al consultar flota_maestra en Supabase:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Excepción al consultar flota_maestra en Supabase:', err);
    return null;
  }
};

export const fetchSucursalesDb = async () => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('sucursales_maestras')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Advertencia al consultar sucursales_maestras en Supabase:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Excepción al consultar sucursales_maestras en Supabase:', err);
    return null;
  }
};


