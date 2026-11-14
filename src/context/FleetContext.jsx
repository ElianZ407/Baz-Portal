import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  supabase, 
  isSupabaseConfigured, 
  fetchViajesDb, 
  upsertViajeDb, 
  deleteViajeDb, 
  mapDbToUnit,
  sanitizarMeta,
  fetchPlanesHistoricosDb,
  savePlanHistoricoDb,
  deletePlanHistoricoDb,
  fetchUnidadesDb,
  fetchFlotaMaestraDb,
  fetchSucursalesDb,
  bulkUpsertViajesDb,
  clearViajesDb,
  retireFleetUnitDb,
  updateEstatusUnidadFlotaDb
} from '../lib/supabaseClient';
import { FLOTA_TOTAL, SUCURSALES_MAESTRAS } from '../constants/fleetConstants';
import { buscarIdOperadorPorNombre, buscarOperadorPorEco, checkTieneViajeYOperador, evaluarDisponibilidadManana, evaluarDisponibilidadMananaPorUnidad, resumirFlotaPorEstado, contarViajesSinUnidadAsignada, construirPadronManana, unidadContableManana, esCamioneta, formatearFechaPlan } from '../utils/fleetUtils';

const FleetContext = createContext(null);

const STORAGE_KEY = 'baz_entregas_fleet_v4';
const HISTORIAL_KEY = 'baz_historial_planes_v1';
const CLIENT_ID = Math.random().toString(36).substring(2) + Date.now().toString(36);

const parsearJsonSeguro = (texto, fallback) => {
  try {
    return JSON.parse(texto);
  } catch {
    return fallback;
  }
};

const extraerDestinosSecundarios = (unit) => {
  if (Array.isArray(unit.destinosSecundarios)) return unit.destinosSecundarios;
  if (typeof unit.destinosSecundarios === 'string' && unit.destinosSecundarios.trim().startsWith('[')) {
    return parsearJsonSeguro(unit.destinosSecundarios, []);
  }
  const match = typeof unit.observaciones === 'string' && unit.observaciones.match(/__PARADAS__:(\[.*?\])(?:$|\n)/s);
  return match ? parsearJsonSeguro(match[1], []) : [];
};

const extraerMetadatosObservaciones = (observaciones) => {
  if (typeof observaciones !== 'string') return { meta: {}, obsLimpia: observaciones || '' };
  const match = observaciones.match(/__META__:(\{.*?\})(?:$|\n)/s);
  const meta = match ? sanitizarMeta(parsearJsonSeguro(match[1], {})) : {};
  const obsLimpia = observaciones
    .replace(/__PARADAS__:\[.*?\](?:\n|$)/gs, '')
    .replace(/__META__:\{.*?\}(?:\n|$)/gs, '')
    .trim();
  return { meta, obsLimpia };
};

const resolverIdOperador = (unit) => {
  if (unit.idOperador) return unit.idOperador;
  if (unit.operador) return buscarIdOperadorPorNombre(unit.operador) || '';
  if (unit.economico) return buscarOperadorPorEco(unit.economico)?.idOperador || '';
  return '';
};

const TRANSIT_STATUSES_LIST = ['En Ruta', 'Espera Descarga', 'Descargando', 'Retorno', 'Retrasado', 'Completado', 'Cargado'];

const cleanUnitDestino = (unit) => {
  if (!unit) return unit;
  const { meta, obsLimpia } = extraerMetadatosObservaciones(unit.observaciones);
  const base = { ...meta, ...unit };
  const destinoLimpio = typeof base.destino === 'string' ? base.destino.replace(/\s*\(Retorno\)/gi, '').trim() : base.destino;
  const destinosSecundarios = extraerDestinosSecundarios(unit);
  const idOperador = resolverIdOperador(base);
  const estatusSupervisor = (base.estatusPlaneacion === 'CARGADO' && (!base.estatusSupervisor || !TRANSIT_STATUSES_LIST.includes(base.estatusSupervisor)))
    ? 'Cargado'
    : base.estatusSupervisor;
  const horaEmrampe = base.horaEmrampe || '';
  const horaDesemrampe = horaEmrampe
    ? (base.horaDesemrampe || '')
    : (base.horaDesemrampe && base.horaDesemrampe !== '07:30' ? base.horaDesemrampe : '');

  return {
    ...base,
    destino: destinoLimpio,
    destinosSecundarios,
    observaciones: obsLimpia,
    idOperador,
    estatusSupervisor,
    horaEmrampe,
    horaDesemrampe
  };
};

const REQUIERE_VALIDACION_VIAJE = {
  planeacion: ['COLOCADO', 'CARGADO'],
  patio: ['Colocado p/ Carga', 'Cargado']
};

const TRANSICIONES_ESTATUS = {
  patio: {
    'Colocado p/ Carga': (u) => ({
      area: 'planeacion',
      estatus: 'ACTIVO',
      estatusPatio: 'Colocado p/ Carga',
      estatusPlaneacion: 'COLOCADO',
      estatusSupervisor: u.estatusSupervisor === 'No Disponible' ? 'Pendiente' : u.estatusSupervisor
    }),
    'Taller': () => ({
      area: 'patio',
      estatus: 'TALLER',
      estatusPatio: 'Taller',
      estatusSupervisor: 'No Disponible',
      estatusPlaneacion: 'PENDIENTE'
    }),
    'Disponible': () => ({
      area: 'patio',
      estatus: 'ACTIVO',
      estatusPatio: 'Disponible',
      estatusSupervisor: 'Pendiente'
    })
  },
  planeacion: {
    'COLOCADO': (u) => ({
      area: 'planeacion',
      estatus: 'ACTIVO',
      estatusPlaneacion: 'COLOCADO',
      estatusPatio: 'Colocado p/ Carga',
      estatusSupervisor: u.estatusSupervisor === 'No Disponible' ? 'Pendiente' : u.estatusSupervisor
    }),
    'CARGADO': (u) => ({
      area: 'supervisor',
      estatus: 'ACTIVO',
      estatusPlaneacion: 'CARGADO',
      estatusPatio: 'Cargado',
      estatusSupervisor: ['No Disponible', 'Pendiente', 'Disponible', ''].includes(u.estatusSupervisor) || !u.estatusSupervisor
        ? 'Cargado'
        : u.estatusSupervisor
    }),
    'PENDIENTE': () => ({
      area: 'planeacion',
      estatus: 'ACTIVO',
      estatusPlaneacion: 'PENDIENTE',
      estatusPatio: 'Disponible',
      estatusSupervisor: 'Pendiente'
    }),
    'NO SE CUBRE': () => ({
      area: 'planeacion',
      estatus: 'ACTIVO',
      estatusPlaneacion: 'NO SE CUBRE',
      estatusPatio: 'Disponible',
      estatusSupervisor: 'No Disponible'
    })
  },
  supervisor: {
    'Completado': () => ({
      area: 'patio',
      estatusSupervisor: 'Completado',
      estatusPatio: 'Disponible',
      estatusPlaneacion: 'COMPLETADO'
    }),
    'Retorno': () => ({
      area: 'supervisor',
      estatusSupervisor: 'Retorno',
      estatusPlaneacion: 'RETORNO',
      estatusPatio: 'Disponible'
    }),
    'En Ruta': () => ({
      area: 'supervisor',
      estatusSupervisor: 'En Ruta',
      estatusPlaneacion: 'CARGADO',
      estatusPatio: 'En Ruta'
    }),
    'Espera Descarga': () => ({
      area: 'supervisor',
      estatusSupervisor: 'Espera Descarga',
      estatusPlaneacion: 'CARGADO',
      estatusPatio: 'En Sucursal'
    }),
    'Descargando': () => ({
      area: 'supervisor',
      estatusSupervisor: 'Descargando',
      estatusPlaneacion: 'CARGADO',
      estatusPatio: 'Descargando'
    }),
    'Retrasado': () => ({
      area: 'supervisor',
      estatusSupervisor: 'Retrasado',
      estatusPlaneacion: 'CARGADO'
    })
  }
};

export const FleetProvider = ({ children }) => {
  const [units, setUnits] = useState(() => {
    try {
      localStorage.removeItem('baz_entregas_fleet_data_v1');
      localStorage.removeItem('baz_entregas_fleet_live_clean_v1');
      localStorage.removeItem('baz_entregas_fleet_seed_v2');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map(cleanUnitDestino);
        }
      }
    } catch (e) {
      console.error('Error cargando datos de localStorage', e);
    }
    return [];
  });

  const checkIsMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    const isTouchMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    return isTouchMobile || isSmallScreen;
  };

  const [isMobile, setIsMobile] = useState(() => {
    try {
      return checkIsMobileDevice();
    } catch {
      return false;
    }
  });

  const [esRolPatio, setEsRolPatio] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const rolParam = params.get('rol') || params.get('modulo') || params.get('area');
        if (rolParam && ['patio', 'emrampe'].includes(rolParam.toLowerCase())) {
          localStorage.setItem('baz_rol_patio', 'true');
          return true;
        }
        if (rolParam && ['normal', 'admin', 'supervisor', 'tv', 'general'].includes(rolParam.toLowerCase())) {
          localStorage.removeItem('baz_rol_patio');
          return false;
        }
        return localStorage.getItem('baz_rol_patio') === 'true';
      }
    } catch {}
    return false;
  });

  const [activeArea, setActiveArea] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        if (checkIsMobileDevice()) {
          return 'emrampe';
        }
        const params = new URLSearchParams(window.location.search);
        const rolParam = params.get('rol') || params.get('modulo') || params.get('area');
        if (rolParam && ['patio', 'emrampe'].includes(rolParam.toLowerCase())) {
          return 'emrampe';
        }
        if (rolParam && ['tv', 'planeacion', 'supervisor', 'colocacion', 'patio'].includes(rolParam.toLowerCase())) {
          return rolParam.toLowerCase();
        }
      }
    } catch {}
    return 'tv';
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(checkIsMobileDevice());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activarModoPatio = () => {
    try {
      localStorage.setItem('baz_rol_patio', 'true');
    } catch {}
    setEsRolPatio(true);
    setActiveArea('emrampe');
  };

  const desactivarModoPatio = () => {
    try {
      localStorage.removeItem('baz_rol_patio');
    } catch {}
    setEsRolPatio(false);
    setActiveArea('tv');
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('baz_theme');
      if (saved && saved !== 'aviation') return saved;
      return 'corporate';
    } catch {
      return 'corporate';
    }
  });

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('baz_theme', newTheme);
    } catch {}
  };

  // Referencia persistente de BroadcastChannel multi-pestaña
  const broadcastRef = useRef(null);
  const isBulkOperatingRef = useRef(false);
  const realtimeQueueRef = useRef([]);
  const realtimeTimeoutRef = useRef(null);
  const lastUnitsJsonRef = useRef('');
  const escriturasPendientesRef = useRef(0);
  const versionLocalRef = useRef(0);
  const catalogoFlotaRef = useRef([]);
  const activeAreaRef = useRef(activeArea);
  useEffect(() => {
    activeAreaRef.current = activeArea;
  }, [activeArea]);

  // Estados de conectividad Cloud / Supabase
  const [isCloudConnected, setIsCloudConnected] = useState(isSupabaseConfigured());
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // Catálogos maestros dinámicos (cargados de Supabase para no exponer datos sensibles en GitHub)
  const [catalogoFlota, setCatalogoFlota] = useState(FLOTA_TOTAL);
  const [catalogoSucursales, setCatalogoSucursales] = useState(SUCURSALES_MAESTRAS);

  // Estados de Historial de Planes / Días
  const [savedPlans, setSavedPlans] = useState(() => {
    try {
      const saved = localStorage.getItem(HISTORIAL_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error al cargar historial_planes de localStorage:', e);
    }
    return [];
  });
  const [isSavePlanModalOpen, setIsSavePlanModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [historicalPlanView, setHistoricalPlanView] = useState(null); // null o el objeto plan que se está consultando

  const showConfirm = (config) => {
    setConfirmModal({
      isOpen: true,
      title: config.title || '¿Confirmar acción?',
      message: config.message || '',
      unit: config.unit || null,
      confirmText: config.confirmText || 'Confirmar',
      cancelText: config.cancelText || 'Cancelar',
      confirmType: config.confirmType || 'danger',
      hideCancel: Boolean(config.hideCancel),
      onConfirm: config.onConfirm || (() => {}),
      onCancel: config.onCancel || null
    });
  };

  const showAlert = (config) => {
    const cfg = typeof config === 'string' ? { message: config } : config;
    setConfirmModal({
      isOpen: true,
      title: cfg.title || 'Validación Operativa — BAZ',
      message: cfg.message || '',
      unit: cfg.unit || null,
      confirmText: cfg.confirmText || 'Entendido',
      cancelText: 'Cerrar',
      confirmType: cfg.confirmType || 'warning',
      hideCancel: true,
      onConfirm: cfg.onConfirm || (() => {})
    });
  };

  const closeConfirm = () => {
    setConfirmModal(null);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(prev => (prev && prev.getMinutes() === now.getMinutes() ? prev : now));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Función para recargar datos desde Supabase
  const reloadCloudData = useCallback(async (silent = false) => {
    if (!isSupabaseConfigured()) return;
    if (isBulkOperatingRef.current) return;
    if (escriturasPendientesRef.current > 0) return;
    const versionInicial = versionLocalRef.current;
    try {
      if (!silent) setIsCloudLoading(true);
      const remoteData = await fetchViajesDb();
      if (escriturasPendientesRef.current > 0 || versionLocalRef.current !== versionInicial) return;
      if (remoteData) {
        const cleaned = remoteData.map(cleanUnitDestino);
        const serialized = JSON.stringify(cleaned);
        if (serialized !== lastUnitsJsonRef.current) {
          lastUnitsJsonRef.current = serialized;
          setUnits(cleaned);
          localStorage.setItem(STORAGE_KEY, serialized);
        }
        setIsCloudConnected(true);
      }
    } catch (err) {
      console.error('Error al sincronizar con Supabase:', err);
    } finally {
      if (!silent) setIsCloudLoading(false);
    }
  }, []);

  // Función para recargar historial de planes desde Supabase
  const reloadHistoricalPlans = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const remotePlans = await fetchPlanesHistoricosDb();
      if (remotePlans && Array.isArray(remotePlans)) {
        const formatted = remotePlans
          .filter(p => !String(p.id || '').startsWith('__EMRAMPE_'))
          .map(p => ({
            id: p.id,
            fecha: p.fecha,
            nombre: p.nombre,
            totalViajes: p.total_viajes,
            totalCompletados: p.total_completados,
            unidades: p.datos || [],
            createdAt: p.created_at
          }));
        setSavedPlans(formatted);
        localStorage.setItem(HISTORIAL_KEY, JSON.stringify(formatted));
      }
    } catch (err) {
      console.warn('No se pudo cargar el historial de planes desde Supabase:', err);
    }
  }, []);

  // Función para recargar catálogos maestros desde Supabase (Operadores y Sucursales)
  const reloadCatalogos = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      let [flotaRemote, sucursalesRemote] = await Promise.all([
        fetchUnidadesDb(),
        fetchSucursalesDb()
      ]);
      if (!flotaRemote || !Array.isArray(flotaRemote) || flotaRemote.length === 0) {
        flotaRemote = await fetchFlotaMaestraDb();
      }
      if (flotaRemote && Array.isArray(flotaRemote) && flotaRemote.length > 0) {
        const formattedFlota = flotaRemote.map(f => ({
          eco: String(f.eco),
          placas: f.placas || '',
          idOperador: f.id_operador || f.idOperador || '',
          operador: f.operador || '',
          tipo: f.tipo || '',
          capUnidad: Number(f.cap_unidad || f.capUnidad) || 0,
          estatus: f.estatus || 'ACTIVO',
          linea: f.linea || 'LTI - VHS'
        })).filter(unit => String(unit.estatus).trim().toUpperCase() !== 'BAJA');
        setCatalogoFlota(formattedFlota);
      }
      if (sucursalesRemote && Array.isArray(sucursalesRemote) && sucursalesRemote.length > 0) {
        const formattedSucursales = sucursalesRemote.map(s => ({
          id: String(s.id),
          nombre: s.nombre,
          closter: s.closter || '',
          sec: s.sec || 1,
          region: s.region || '',
          formato: s.formato || '',
          fl: s.fl || 'LOCAL',
          capMax: s.cap_max || s.capMax || '',
          restriccion: s.restriccion || null
        }));
        setCatalogoSucursales(formattedSucursales);
      }
    } catch (e) {
      console.warn('Error al cargar catálogos dinámicos de Supabase:', e);
    }
  }, []);

  // Sincronización Inicial y Suscripción Realtime con Supabase (Multi-Dispositivo)
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      return;
    }

    // Cargar catálogos remotos, datos remotos y planes históricos al inicio
    const initData = async () => {
      await Promise.all([
        reloadCatalogos(),
        reloadCloudData(),
        reloadHistoricalPlans()
      ]);
    };
    initData();

    // Suscribirse a cambios en tiempo real en la tabla viajes_diarios
    const channelId = `realtime_viajes_${CLIENT_ID}_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'viajes_diarios' },
        (payload) => {
          if (isBulkOperatingRef.current) return;

          realtimeQueueRef.current.push(payload);

          if (!realtimeTimeoutRef.current) {
            realtimeTimeoutRef.current = setTimeout(() => {
              realtimeTimeoutRef.current = null;
              const queue = realtimeQueueRef.current;
              realtimeQueueRef.current = [];
              if (queue.length === 0) return;

              if (queue.length >= 10) {
                reloadCloudData(true);
                return;
              }

              const manejadoresRealtime = {
                INSERT: (lista, item) => {
                  const newUnit = cleanUnitDestino(mapDbToUnit(item.new));
                  const idx = lista.findIndex(u => String(u.id) === String(newUnit.id));
                  return idx >= 0
                    ? lista.map((u, i) => (i === idx ? newUnit : u))
                    : [...lista, newUnit];
                },
                UPDATE: (lista, item) => {
                  const updatedUnit = cleanUnitDestino(mapDbToUnit(item.new));
                  return lista.map(u => String(u.id) === String(updatedUnit.id) ? updatedUnit : u);
                },
                DELETE: (lista, item) => {
                  const deletedId = item.old?.id;
                  return deletedId ? lista.filter(u => String(u.id) !== String(deletedId)) : lista;
                }
              };

              setUnits(prev => queue.reduce((lista, item) => {
                const manejador = manejadoresRealtime[item.eventType];
                return manejador ? manejador(lista, item) : lista;
              }, [...prev]));
            }, 60);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'unidades' },
        () => {
          reloadCatalogos();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsCloudConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('Estado del canal Realtime Supabase:', status);
          setIsCloudConnected(false);
          // Si el canal se desconecta o se duerme, forzar refresco
          reloadCloudData(true);
        }
      });

    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden && activeAreaRef.current !== 'emrampe') {
        reloadCloudData(true);
      }
    }, 15000);

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden && activeAreaRef.current !== 'emrampe') {
        reloadCloudData(true);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(pollInterval);
      if (realtimeTimeoutRef.current) {
        clearTimeout(realtimeTimeoutRef.current);
      }
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      supabase.removeChannel(channel);
    };
  }, [reloadCloudData, reloadCatalogos, reloadHistoricalPlans]);

  // Sincronización multi-pestaña inmediata en la misma computadora (BroadcastChannel persistente y Storage Event)
  useEffect(() => {
    try {
      broadcastRef.current = new BroadcastChannel('baz_fleet_realtime_sync');
      broadcastRef.current.onmessage = (event) => {
        if (
          event.data && 
          event.data.type === 'SYNC_UNITS' && 
          event.data.senderId !== CLIENT_ID && 
          Array.isArray(event.data.units)
        ) {
          if (escriturasPendientesRef.current > 0) return;
          const recibidas = event.data.units.map(cleanUnitDestino);
          const serialized = JSON.stringify(recibidas);
          if (serialized === lastUnitsJsonRef.current) return;
          lastUnitsJsonRef.current = serialized;
          setUnits(recibidas);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel no soportado:', e);
    }

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          if (escriturasPendientesRef.current > 0) return;
          const remoteUnits = JSON.parse(e.newValue);
          if (Array.isArray(remoteUnits)) {
            const recibidas = remoteUnits.map(cleanUnitDestino);
            const serialized = JSON.stringify(recibidas);
            if (serialized === lastUnitsJsonRef.current) return;
            lastUnitsJsonRef.current = serialized;
            setUnits(recibidas);
          }
        } catch (err) {
          console.error('Error al sincronizar localStorage remoto:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (broadcastRef.current) {
        broadcastRef.current.close();
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Guardar en localStorage de respaldo y emitir BroadcastChannel local
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const serialized = JSON.stringify(units);
        if (serialized === lastUnitsJsonRef.current) return;
        lastUnitsJsonRef.current = serialized;
        localStorage.setItem(STORAGE_KEY, serialized);
        if (broadcastRef.current) {
          broadcastRef.current.postMessage({ type: 'SYNC_UNITS', units, senderId: CLIENT_ID });
        }
      } catch (e) {
        console.error('Error guardando en localStorage', e);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [units]);

  const displayedUnits = useMemo(() => {
    if (historicalPlanView && Array.isArray(historicalPlanView.unidades)) {
      return historicalPlanView.unidades.map(cleanUnitDestino);
    }
    return units;
  }, [historicalPlanView, units]);

  const todayIso = useMemo(() => {
    const now = currentTime || new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentTime]);

  const currentPlanDate = useMemo(() => {
    if (historicalPlanView?.fecha) return String(historicalPlanView.fecha).trim();
    if (historicalPlanView?.nombre) {
      const match = historicalPlanView.nombre.match(/\d{4}-\d{2}-\d{2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}/);
      if (match) return match[0];
    }
    const found = displayedUnits.find(u => u.fecha && String(u.fecha).trim());
    if (found?.fecha) return String(found.fecha).trim();
    return todayIso;
  }, [historicalPlanView, displayedUnits, todayIso]);

  const isPlanDateToday = useMemo(() => {
    return currentPlanDate === todayIso;
  }, [currentPlanDate, todayIso]);


  const formattedPlanDate = useMemo(() => {
    return formatearFechaPlan(currentPlanDate, 'corto');
  }, [currentPlanDate]);

  const formattedPlanDateLong = useMemo(() => {
    return formatearFechaPlan(currentPlanDate, 'largo');
  }, [currentPlanDate]);

  // KPIs en tiempo real basados en la flota completa y unidades en pantalla
  const kpis = useMemo(() => {
    const fleetStatusCounts = resumirFlotaPorEstado(displayedUnits, catalogoFlota);
    const countUniqueEcos = predicate => new Set(displayedUnits
      .filter(u => String(u.economico || '').trim() && predicate(u))
      .map(u => String(u.economico).trim())).size;
    const total = fleetStatusCounts.total;
    const enTransito = countUniqueEcos(u => u.estatusSupervisor === 'En Ruta');
    const enSucursalRampa = countUniqueEcos(u =>
      ['Espera Descarga', 'Descargando'].includes(u.estatusSupervisor) ||
      u.estatusPatio === 'En Sucursal'
    );
    const retrasadas = countUniqueEcos(u => u.estatusSupervisor === 'Retrasado');
    const enTaller = fleetStatusCounts.taller;
    const disponiblesPatio = fleetStatusCounts.disponibles;
    const cargadasPatio = fleetStatusCounts.cargadas;

    // ==========================================
    // Pronóstico para mañana: contar económicos únicos y separar los que faltan confirmar.
    const activeEcos = new Set();
    const disponiblesMananaActivas = new Set();
    const regresanManana = new Set();
    const noRegresanManana = new Set();
    const porConfirmarManana = new Set();
    const availabilityByUnitId = evaluarDisponibilidadMananaPorUnidad(displayedUnits, catalogoFlota);
    const viajesSinUnidadAsignada = contarViajesSinUnidadAsignada(displayedUnits);

    const padronManana = construirPadronManana(catalogoFlota);

    displayedUnits.forEach(u => {
      const eco = String(u.economico || '').trim();
      if (!eco) return;
      activeEcos.add(eco);
      if (!unidadContableManana(u, padronManana)) return;
      const evalResult = availabilityByUnitId.get(String(u.id));
      if (!evalResult) return;
      const unitKey = `eco-${eco}`;
      if (evalResult.disponible) {
        disponiblesMananaActivas.add(unitKey);
        if (evalResult.regresaManana) regresanManana.add(unitKey);
      } else if (evalResult.noRegresaManana) {
        noRegresanManana.add(unitKey);
      } else if (evalResult.badge === 'POR CONFIRMAR') {
        porConfirmarManana.add(unitKey);
      }
    });

    porConfirmarManana.forEach(key => disponiblesMananaActivas.delete(key));

    const flotaLibreEnPatio = new Set((catalogoFlota || [])
      .filter(f => String(f.estatus || 'ACTIVO').trim().toUpperCase() === 'ACTIVO' && !esCamioneta(f))
      .map(f => String(f.eco || '').trim())
      .filter(eco => eco && !activeEcos.has(eco))).size;

    const disponiblesManana = disponiblesMananaActivas.size + flotaLibreEnPatio;

    return {
      total,
      totalFlota: fleetStatusCounts.total,
      enTransito,
      enSucursalRampa,
      retrasadas,
      enTaller,
      disponiblesPatio,
      cargadasPatio,
      disponiblesManana,
      libresManana: disponiblesManana - regresanManana.size,
      regresanManana: regresanManana.size,
      noRegresanManana: noRegresanManana.size,
      porConfirmarManana: porConfirmarManana.size,
      viajesSinUnidadAsignada,
      fueraOperacion: fleetStatusCounts.fueraOperacion
    };
  }, [displayedUnits, catalogoFlota]);

  useEffect(() => {
    catalogoFlotaRef.current = catalogoFlota || [];
  }, [catalogoFlota]);

  const ejecutarEscritura = useCallback(async (operacion, mensajeError) => {
    versionLocalRef.current += 1;
    escriturasPendientesRef.current += 1;
    let exito = true;
    try {
      await operacion();
    } catch (err) {
      exito = false;
      console.error(mensajeError, err);
      setConfirmModal({
        isOpen: true,
        title: 'No se guardó el cambio',
        message: `${mensajeError}\n\n${err?.message || 'Verifica tu conexión a internet.'}\n\nSe recargarán los datos reales de la nube.`,
        unit: null,
        confirmText: 'Entendido',
        cancelText: 'Cerrar',
        confirmType: 'danger',
        hideCancel: true,
        onConfirm: () => {}
      });
    } finally {
      escriturasPendientesRef.current = Math.max(0, escriturasPendientesRef.current - 1);
    }
    if (escriturasPendientesRef.current === 0) {
      versionLocalRef.current += 1;
      await reloadCloudData(true);
    }
    return exito;
  }, [reloadCloudData]);

  const sincronizarEstatusCatalogo = useCallback(async (eco, estatusPatio, forzar = false) => {
    const cleanEco = String(eco || '').trim();
    if (!cleanEco || !estatusPatio) return;
    const master = catalogoFlotaRef.current.find(f => String(f.eco).trim() === cleanEco);
    if (!master) return;
    const estatusActual = String(master.estatus || 'ACTIVO').trim().toUpperCase();
    let nuevoEstatusCatalogo = null;
    if (estatusPatio === 'Taller') nuevoEstatusCatalogo = 'TALLER';
    else if (forzar && estatusPatio === 'Disponible') nuevoEstatusCatalogo = 'ACTIVO';
    else if (estatusActual === 'TALLER' && estatusPatio !== 'No Disponible') nuevoEstatusCatalogo = 'ACTIVO';
    if (!nuevoEstatusCatalogo || nuevoEstatusCatalogo === estatusActual) return;
    catalogoFlotaRef.current = catalogoFlotaRef.current.map(f =>
      String(f.eco).trim() === cleanEco ? { ...f, estatus: nuevoEstatusCatalogo } : f
    );
    setCatalogoFlota(prev => prev.map(f =>
      String(f.eco).trim() === cleanEco ? { ...f, estatus: nuevoEstatusCatalogo } : f
    ));
    if (isSupabaseConfigured()) {
      await updateEstatusUnidadFlotaDb(cleanEco, nuevoEstatusCatalogo);
    }
  }, []);

  const saveUnit = async (unitData) => {
    if (historicalPlanView) {
      showAlert({
        title: 'Modo Consulta Histórico',
        message: 'Estás consultando un plan del historial en modo lectura. Para realizar cambios, vuelve a tu plan de hoy o restáuralo como plan activo.',
        confirmType: 'warning'
      });
      return;
    }

    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    
    let existingUnit = units.find(u => u.id === unitData.id);
    if (!existingUnit && unitData.economico && !String(unitData.id || '').startsWith('emrampe-')) {
      existingUnit = units.find(u => 
        String(u.economico) === String(unitData.economico) &&
        (!u.noViaje || (u.estatusPlaneacion || 'PENDIENTE') === 'PENDIENTE')
      );
    }
    const cleanId = (unitData.id && !String(unitData.id).startsWith('fleet-'))
      ? unitData.id
      : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `baz-unit-${Date.now()}-${Math.random().toString(36).substring(2)}`);

    const fullUnitRaw = existingUnit
      ? { ...existingUnit, ...unitData, id: existingUnit.id, actualizadoEn: now }
      : {
          ...unitData,
          id: cleanId,
          actualizadoEn: now
        };
    const fullUnit = cleanUnitDestino(fullUnitRaw);

    versionLocalRef.current += 1;
    setUnits(prev => {
      const exists = prev.some(u => u.id === fullUnit.id);
      return exists 
        ? prev.map(u => u.id === fullUnit.id ? fullUnit : u) 
        : [fullUnit, ...prev];
    });

    if (fullUnit.economico && fullUnit.estatusPatio) {
      const cambioPatio = Boolean(existingUnit) && existingUnit.estatusPatio !== fullUnit.estatusPatio;
      sincronizarEstatusCatalogo(fullUnit.economico, fullUnit.estatusPatio, cambioPatio);
    }

    if (isSupabaseConfigured() && fullUnit) {
      await ejecutarEscritura(
        () => upsertViajeDb(fullUnit),
        `No se pudo guardar la unidad ECO ${fullUnit.economico || ''} en Supabase.`
      );
    }
  };

  const deleteUnit = async (idOrIds) => {
    if (historicalPlanView) {
      showAlert({
        title: 'Modo Consulta Histórico',
        message: 'Estás consultando un plan del historial en modo lectura. Para realizar cambios, vuelve a tu plan de hoy o restáuralo como plan activo.',
        confirmType: 'warning'
      });
      return;
    }

    const idsList = (Array.isArray(idOrIds) ? idOrIds : [idOrIds]).map(String).filter(Boolean);
    const idsSet = new Set(idsList);
    versionLocalRef.current += 1;
    setUnits(prev => prev.filter(u => !idsSet.has(String(u.id))));
    if (isSupabaseConfigured()) {
      await ejecutarEscritura(
        () => Promise.all(idsList.filter(id => !id.startsWith('fleet-')).map(id => deleteViajeDb(id))),
        'No se pudo eliminar el viaje en Supabase.'
      );
    }
  };

  const retireUnitFromFleet = async (unit) => {
    if (historicalPlanView) {
      showAlert({
        title: 'Modo Consulta Histórico',
        message: 'Estás consultando un plan del historial en modo lectura. Para realizar cambios, vuelve a tu plan de hoy.',
        confirmType: 'warning'
      });
      return false;
    }

    const eco = String(unit?.economico || '').trim();
    versionLocalRef.current += 1;
    setUnits(prev => prev.filter(current => {
      if (eco) return String(current.economico || '').trim() !== eco;
      return String(current.id) !== String(unit?.id);
    }));
    if (!isSupabaseConfigured()) return true;
    return ejecutarEscritura(async () => {
      if (eco) {
        await retireFleetUnitDb(eco);
      } else if (unit?.id && !String(unit.id).startsWith('fleet-')) {
        await deleteViajeDb(unit.id);
      }
    }, 'No se pudo limpiar el registro de la unidad.');
  };

  const updateStatus = async (unitIdOrIds, area, newStatus) => {
    if (historicalPlanView) {
      showAlert({
        title: 'Modo Consulta Histórico',
        message: 'Estás consultando un plan del historial en modo lectura. Para realizar cambios, vuelve a tu plan de hoy o restáuralo como plan activo.',
        confirmType: 'warning'
      });
      return;
    }

    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const idsList = Array.isArray(unitIdOrIds) ? unitIdOrIds.map(String) : [String(unitIdOrIds)];
    const primaryId = idsList[0];
    
    let targetUnit = units.find(u => String(u.id) === primaryId);
    if (!targetUnit && primaryId.startsWith('fleet-')) {
      const cleanEco = primaryId.replace('fleet-', '');
      const master = (catalogoFlota || []).find(f => String(f.eco) === cleanEco);
      if (master) {
        targetUnit = {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `baz-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          economico: String(master.eco),
          placas: master.placas || '',
          tipo: master.tipo || '',
          capUnidad: Number(master.capUnidad) || 0,
          linea: master.linea || 'LTI - VHS',
          operador: master.operador || '',
          idOperador: master.idOperador || '',
          turno: 'M1',
          cortina: '',
          numCarga: '',
          numSucursal: '',
          sucursalOrigen: 'CEDIS VILLAHERMOSA',
          destino: '',
          destinosSecundarios: [],
          closter: 'HUB-VHSA',
          fl: 'LOCAL',
          estatusPatio: 'Disponible',
          estatusPlaneacion: 'PENDIENTE',
          estatusSupervisor: 'Pendiente',
          bloque: 1
        };
      }
    }
    if (!targetUnit) return;

    const camposArea = {
      patio: 'estatusPatio',
      planeacion: 'estatusPlaneacion',
      supervisor: 'estatusSupervisor'
    };

    const requiereValidacion = REQUIERE_VALIDACION_VIAJE[area]?.includes(newStatus);
    if (requiereValidacion && !checkTieneViajeYOperador(targetUnit).valid) {
      console.warn(`[Validación Bloqueada] La unidad ECO ${targetUnit.economico} requiere No. de Viaje, Operador y Destino para pasar a ${newStatus}.`);
      return;
    }

    const resolverTransicion = TRANSICIONES_ESTATUS[area]?.[newStatus];
    const cleanTargetEco = String(targetUnit.economico || '').trim();
    const matchByEcoInPatio = area === 'patio' && (newStatus === 'Taller' || newStatus === 'Disponible') && cleanTargetEco;
    const aplicarCambio = (u) => {
      const cambios = resolverTransicion
        ? resolverTransicion(u)
        : { area, [camposArea[area] || 'estatusSupervisor']: newStatus };
      return { ...u, ...cambios, actualizadoEn: now };
    };
    const debeActualizar = (u) =>
      idsList.includes(String(u.id)) || (matchByEcoInPatio && String(u.economico || '').trim() === cleanTargetEco);

    const nuevaFila = units.some(u => String(u.id) === String(targetUnit.id)) ? null : aplicarCambio(targetUnit);
    const toUpsert = nuevaFila ? [nuevaFila] : units.filter(debeActualizar).map(aplicarCambio);
    if (toUpsert.length === 0) return;
    const actualizadasPorId = new Map(toUpsert.map(u => [String(u.id), u]));

    versionLocalRef.current += 1;
    setUnits(prev => {
      const siguiente = prev.map(u => {
        if (!debeActualizar(u)) return u;
        return actualizadasPorId.has(String(u.id)) ? aplicarCambio(u) : u;
      });
      if (nuevaFila && !siguiente.some(u => String(u.id) === String(nuevaFila.id))) {
        return [nuevaFila, ...siguiente];
      }
      return siguiente;
    });

    if (cleanTargetEco && toUpsert[0]?.estatusPatio) {
      sincronizarEstatusCatalogo(cleanTargetEco, toUpsert[0].estatusPatio, area === 'patio');
    }

    if (isSupabaseConfigured()) {
      await ejecutarEscritura(
        () => Promise.all(toUpsert.map(u => upsertViajeDb(u))),
        `No se pudo actualizar el estatus de ECO ${cleanTargetEco} a "${newStatus}".`
      );
    }
  };

  // Purgar / Limpiar todos los datos del tablero
  const clearAllUnits = async () => {
    isBulkOperatingRef.current = true;
    setUnits([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('baz_entregas_fleet_data_v1');
    localStorage.removeItem('baz_entregas_fleet_live_clean_v1');
    
    if (isSupabaseConfigured() && supabase) {
      try {
        await clearViajesDb();
      } catch (err) {
        console.error('Error al vaciar viajes_diarios en Supabase:', err);
      } finally {
        setTimeout(() => {
          isBulkOperatingRef.current = false;
        }, 2000);
      }
    } else {
      isBulkOperatingRef.current = false;
    }

    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('baz_fleet_realtime_sync');
      bc.postMessage({ type: 'SYNC_UNITS', units: [], senderId: CLIENT_ID });
      bc.close();
    }
  };

  // Guardar el plan o día actual
  const saveCurrentPlan = async ({ nombre, fecha, startNewDay = false }) => {
    const planDate = fecha || todayIso;
    const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const snapshotUnits = JSON.parse(JSON.stringify(units));
    
    const newPlan = {
      id: planId,
      fecha: planDate,
      nombre: (nombre && nombre.trim()) ? nombre.trim() : `Plan del ${planDate}`,
      totalViajes: snapshotUnits.length,
      totalCompletados: snapshotUnits.filter(u => u.estatusPlaneacion === 'COMPLETADO' || u.estatusSupervisor === 'Completado').length,
      unidades: snapshotUnits,
      createdAt: new Date().toISOString()
    };

    // Actualizar estado local e historial en localStorage
    setSavedPlans(prev => {
      const updated = [newPlan, ...prev.filter(p => p.id !== planId)];
      localStorage.setItem(HISTORIAL_KEY, JSON.stringify(updated));
      return updated;
    });

    // Sincronizar en Supabase si está disponible
    if (isSupabaseConfigured()) {
      try {
        await savePlanHistoricoDb(newPlan);
      } catch (e) {
        console.warn('El plan se guardó localmente pero falló en Supabase:', e);
      }
    }

    // Si el usuario eligió comenzar un nuevo día, limpiar el tablero activo
    if (startNewDay) {
      await clearAllUnits();
    }

    return newPlan;
  };

  // Importación masiva de planeación (desde archivo Excel o CSV)
  const importViajesPlaneacion = async (importedUnits, mode = 'replace') => {
    if (historicalPlanView) {
      showAlert({
        title: 'Modo Consulta Histórico',
        message: 'Estás consultando un plan del historial en modo lectura. Para importar viajes, vuelve a tu plan de hoy.',
        confirmType: 'warning'
      });
      return false;
    }

    const cleanedImported = importedUnits.map(cleanUnitDestino);

    let finalUnits = [];
    if (mode === 'replace') {
      finalUnits = cleanedImported;
    } else {
      // mode === 'merge': actualizar existentes o agregar nuevos
      const mergedMap = new Map();
      units.forEach(u => mergedMap.set(String(u.id), u));
      units.forEach(u => {
        if (u.economico) mergedMap.set(`eco-${u.economico}`, u);
      });

      cleanedImported.forEach(u => {
        const ecoKey = u.economico ? `eco-${u.economico}` : null;
        const prevPorEco = ecoKey ? mergedMap.get(ecoKey) : null;
        const prevPorId = mergedMap.get(String(u.id));
        const basePrev = prevPorEco || prevPorId;
        const updated = basePrev ? { ...basePrev, ...u, id: basePrev.id } : u;
        mergedMap.set(String(updated.id), updated);
        if (ecoKey) mergedMap.set(ecoKey, updated);
      });

      const seenIds = new Set();
      finalUnits = [];
      mergedMap.forEach((val) => {
        if (val && val.id && !seenIds.has(String(val.id))) {
          seenIds.add(String(val.id));
          finalUnits.push(val);
        }
      });
    }

    isBulkOperatingRef.current = true;
    setUnits(finalUnits);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalUnits));

    // Notificar multi-pestaña local
    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage({ type: 'SYNC_UNITS', units: finalUnits, senderId: CLIENT_ID });
      } catch {}
    }

    // Sincronizar en la nube con Supabase
    if (isSupabaseConfigured()) {
      try {
        setIsCloudLoading(true);
        if (mode === 'replace') {
          await clearViajesDb();
        }
        await bulkUpsertViajesDb(finalUnits);
      } catch (err) {
        console.error('Error al sincronizar importación masiva en Supabase:', err);
      } finally {
        setIsCloudLoading(false);
        setTimeout(() => {
          isBulkOperatingRef.current = false;
        }, 2000);
      }
    } else {
      isBulkOperatingRef.current = false;
    }

    return true;
  };

  const updatePlanDate = async (newDate) => {
    if (!newDate) return false;
    const cleanDate = String(newDate).trim();
    isBulkOperatingRef.current = true;
    setUnits(prev => {
      const updated = prev.map(u => ({ ...u, fecha: cleanDate }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured() && supabase) {
      try {
        setIsCloudLoading(true);
        await supabase
          .from('viajes_diarios')
          .update({ fecha: cleanDate })
          .neq('id', '___non_existent___');
      } catch (err) {
        console.error('Error al actualizar fecha del plan en Supabase:', err);
      } finally {
        setIsCloudLoading(false);
        setTimeout(() => {
          isBulkOperatingRef.current = false;
        }, 1500);
      }
    } else {
      isBulkOperatingRef.current = false;
    }

    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage({
          type: 'SYNC_UNITS',
          units: units.map(u => ({ ...u, fecha: cleanDate })),
          senderId: CLIENT_ID
        });
      } catch {}
    }
    return true;
  };

  const iniciarNuevoPlanHoy = async () => {
    if (units.length === 0) {
      showConfirm({
        title: '¿Iniciar Plan Vacío de Hoy?',
        message: `El tablero se preparará para la jornada de hoy (${todayIso}). Todas las unidades de la flota estarán Disponibles en Patio para comenzar la nueva planeación.`,
        confirmText: 'Sí, Iniciar Plan',
        cancelText: 'Cancelar',
        confirmType: 'success',
        onConfirm: async () => {
          await clearAllUnits();
          showAlert({
            title: 'Plan de Hoy Iniciado',
            message: 'El tablero está listo y vacío para comenzar a planear la jornada de hoy.',
            confirmType: 'success'
          });
        }
      });
      return;
    }

    const planFecha = units.find(u => u.fecha)?.fecha || '';
    const yaGuardado = savedPlans.some(p => 
      (p.fecha === planFecha && Math.abs((p.totalViajes || 0) - units.length) <= 1) ||
      (p.fecha === planFecha && Array.isArray(p.unidades) && p.unidades.length === units.length)
    );

    if (yaGuardado) {
      showConfirm({
        title: '¿Crear Nuevo Plan Vacío para Hoy?',
        message: `El plan actual (${formattedPlanDateLong || planFecha}) ya se encuentra respaldado en el Historial de Planes.\n\nAl iniciar el nuevo plan de hoy, el tablero activo se vaciará y todas las unidades volverán a estar Disponibles en Patio para la nueva jornada.\n\n¿Deseas continuar?`,
        confirmText: 'Sí, Crear Plan Vacío',
        cancelText: 'Cancelar',
        confirmType: 'warning',
        onConfirm: async () => {
          await clearAllUnits();
          showAlert({
            title: 'Nuevo Plan Iniciado',
            message: 'Se ha creado un nuevo plan vacío para la jornada de hoy.',
            confirmType: 'success'
          });
        }
      });
    } else {
      showConfirm({
        title: '⚠️ Advertencia: Plan Actual No Guardado',
        message: `El plan actual (${formattedPlanDateLong || planFecha}) con ${units.length} viaje(s) NO ha sido guardado en el Historial de Planes.\n\nSi creas un plan vacío ahora sin guardarlo, estos viajes se descartarán.\n\n¿Deseas guardarlo en el historial antes de iniciar el plan vacío de hoy?`,
        confirmText: 'Guardar y Crear Nuevo Plan',
        cancelText: 'Descartar sin Guardar',
        confirmType: 'danger',
        onConfirm: async () => {
          await saveCurrentPlan({
            nombre: `Plan del ${planFecha || todayIso}`,
            fecha: planFecha || todayIso,
            startNewDay: true
          });
          showAlert({
            title: 'Plan Guardado y Nuevo Día Iniciado',
            message: 'El plan anterior se respaldó con éxito en el Historial y el tablero se preparó vacío para la jornada de hoy.',
            confirmType: 'success'
          });
        },
        onCancel: () => {
          showConfirm({
            title: '¿Confirmar Descarte de Viajes?',
            message: '¿Estás completamente seguro de descartar los viajes del plan actual sin guardarlos en el historial?',
            confirmText: 'Sí, Descartar y Vaciar',
            cancelText: 'Volver',
            confirmType: 'danger',
            onConfirm: async () => {
              await clearAllUnits();
              showAlert({
                title: 'Nuevo Plan Vacío Iniciado',
                message: 'El tablero se ha vaciado para comenzar la planeación de hoy.',
                confirmType: 'success'
              });
            }
          });
        }
      });
    }
  };

  // 1. Ver un plan histórico en MODO CONSULTA (sin borrar ni reemplazar el plan activo de hoy)
  const viewHistoricalPlan = (planId) => {
    const plan = savedPlans.find(p => p.id === planId);
    if (!plan || !Array.isArray(plan.unidades)) return false;
    setHistoricalPlanView(plan);
    setIsHistoryModalOpen(false);
    return true;
  };

  // 2. Salir del modo consulta histórica y regresar al plan de hoy intacto
  const exitHistoricalPlanView = () => {
    setHistoricalPlanView(null);
  };

  // 3. Restaurar un plan histórico como el activo (con RESPALDO AUTOMÁTICO garantizado de tu plan actual)
  const restorePlanAsActive = async (planId) => {
    const plan = savedPlans.find(p => p.id === planId);
    if (!plan || !Array.isArray(plan.unidades)) return false;

    // Respaldo automático del plan actual si contiene unidades para que NADA se pierda
    if (units.length > 0) {
      const todayDate = todayIso;
      const timeStr = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      const backupPlan = {
        id: `backup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fecha: todayDate,
        nombre: `Respaldo Automático (Previo a cargar ${plan.nombre}) - ${timeStr}`,
        totalViajes: units.length,
        totalCompletados: units.filter(u => u.estatusPlaneacion === 'COMPLETADO' || u.estatusSupervisor === 'Completado').length,
        unidades: JSON.parse(JSON.stringify(units)),
        createdAt: new Date().toISOString()
      };

      setSavedPlans(prev => {
        const updated = [backupPlan, ...prev];
        localStorage.setItem(HISTORIAL_KEY, JSON.stringify(updated));
        return updated;
      });

      if (isSupabaseConfigured()) {
        try {
          await savePlanHistoricoDb(backupPlan);
        } catch (e) {
          console.warn('Error al guardar respaldo automático en Supabase:', e);
        }
      }
    }

    // Restaurar unidades en el plan activo
    isBulkOperatingRef.current = true;
    const restoredUnits = plan.unidades.map(cleanUnitDestino);
    setUnits(restoredUnits);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredUnits));

    // Si Supabase está configurado, actualizar viajes_diarios
    if (isSupabaseConfigured() && supabase) {
      try {
        setIsCloudLoading(true);
        await clearViajesDb();
        await bulkUpsertViajesDb(restoredUnits);
      } catch (err) {
        console.warn('Error al sincronizar restauración en Supabase:', err);
      } finally {
        setIsCloudLoading(false);
        setTimeout(() => {
          isBulkOperatingRef.current = false;
        }, 2000);
      }
    } else {
      isBulkOperatingRef.current = false;
    }

    // Notificar en broadcast channel
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('baz_fleet_realtime_sync');
      bc.postMessage({ type: 'SYNC_UNITS', units: restoredUnits, senderId: CLIENT_ID });
      bc.close();
    }

    // Salir del modo consulta
    setHistoricalPlanView(null);
    setIsHistoryModalOpen(false);

    showAlert({
      title: 'Plan Restaurado con Éxito',
      message: `Se ha cargado "${plan.nombre}". Para tu tranquilidad, se generó automáticamente un respaldo de tu plan anterior en el Historial.`,
      confirmType: 'success',
      confirmText: 'Aceptar'
    });

    return true;
  };

  // Mantener loadSavedPlan apuntando a restorePlanAsActive para retrocompatibilidad
  const loadSavedPlan = restorePlanAsActive;

  // Eliminar un plan histórico
  const deleteSavedPlan = async (planId) => {
    setSavedPlans(prev => {
      const filtered = prev.filter(p => p.id !== planId);
      localStorage.setItem(HISTORIAL_KEY, JSON.stringify(filtered));
      return filtered;
    });

    if (isSupabaseConfigured()) {
      try {
        await deletePlanHistoricoDb(planId);
      } catch (e) {
        console.warn('Error al eliminar en Supabase:', e);
      }
    }
  };

  return (
    <FleetContext.Provider value={{
      units: displayedUnits,
      activeUnits: units,
      isViewingHistorical: Boolean(historicalPlanView),
      historicalPlanView,
      viewHistoricalPlan,
      exitHistoricalPlanView,
      restorePlanAsActive,
      kpis,
      activeArea: isMobile ? 'emrampe' : activeArea,
      setActiveArea: (area) => {
        if (isMobile) return;
        setActiveArea(area);
      },
      isMobile,
      esRolPatio,
      activarModoPatio,
      desactivarModoPatio,
      searchQuery,
      setSearchQuery,
      filterStatus,
      setFilterStatus,
      selectedUnit,
      setSelectedUnit,
      isModalOpen,
      setIsModalOpen,
      isCloudConnected,
      isCloudLoading,
      reloadCloudData,
      currentTime,
      saveUnit,
      deleteUnit,
      retireUnitFromFleet,
      updateStatus,
      clearAllUnits,
      confirmModal,
      showConfirm,
      showAlert,
      closeConfirm,
      // Historial de Planes
      savedPlans,
      isSavePlanModalOpen,
      setIsSavePlanModalOpen,
      isHistoryModalOpen,
      setIsHistoryModalOpen,
      saveCurrentPlan,
      loadSavedPlan,
      deleteSavedPlan,
      reloadHistoricalPlans,
      // Catálogos dinámicos
      catalogoFlota,
      catalogoSucursales,
      reloadCatalogos,
      // Importación Masiva de Planeación
      isImportModalOpen,
      setIsImportModalOpen,
      importViajesPlaneacion,
      evaluarDisponibilidadManana,
      currentPlanDate,
      todayIso,
      updatePlanDate,
      iniciarNuevoPlanHoy,
      formattedPlanDate,
      formattedPlanDateLong,
      isPlanDateToday,
      theme,
      setTheme
    }}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => {
  const context = useContext(FleetContext);
  if (!context) {
    throw new Error('useFleet debe ser utilizado dentro de un FleetProvider');
  }
  return context;
};
