import { createClient } from '@supabase/supabase-js';

// Obtener credenciales desde localStorage (configurables en la UI) o desde variables de entorno Vite (.env / Vercel)
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

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return {
      url: envUrl.trim(),
      key: envKey.trim(),
      source: 'env'
    };
  }

  return { url: '', key: '', source: 'none' };
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
export const mapDbToUnit = (row) => ({
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
  destino: row.destino || '',
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
  observaciones: row.observaciones || '',
  actualizadoEn: row.actualizado_en || ''
});

export const mapUnitToDb = (unit) => ({
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
  destino: unit.destino || '',
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
  observaciones: unit.observaciones || '',
  actualizado_en: unit.actualizadoEn || '',
  updated_at: new Date().toISOString()
});

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
