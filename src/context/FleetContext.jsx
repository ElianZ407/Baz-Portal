import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  supabase, 
  isSupabaseConfigured, 
  fetchViajesDb, 
  upsertViajeDb, 
  deleteViajeDb, 
  mapDbToUnit,
  fetchPlanesHistoricosDb,
  savePlanHistoricoDb,
  deletePlanHistoricoDb,
  fetchUnidadesDb,
  fetchFlotaMaestraDb,
  fetchSucursalesDb
} from '../lib/supabaseClient';
import { FLOTA_TOTAL, SUCURSALES_MAESTRAS } from '../constants/fleetConstants';
import { buscarIdOperadorPorNombre, buscarOperadorPorEco, checkTieneViajeYOperador } from '../utils/fleetUtils';

const FleetContext = createContext(null);

const STORAGE_KEY = 'baz_entregas_fleet_v4';
const HISTORIAL_KEY = 'baz_historial_planes_v1';
const CLIENT_ID = Math.random().toString(36).substring(2) + Date.now().toString(36);

const cleanUnitDestino = (unit) => {
  if (!unit) return unit;
  let res = { ...unit };
  if (res.destino && typeof res.destino === 'string') {
    res.destino = res.destino.replace(/\s*\(Retorno\)/gi, '').trim();
  }

  // Garantizar array válido para destinosSecundarios (múltiples entregas / paradas por viaje)
  if (!Array.isArray(res.destinosSecundarios)) {
    if (typeof res.destinosSecundarios === 'string' && res.destinosSecundarios.trim().startsWith('[')) {
      try {
        res.destinosSecundarios = JSON.parse(res.destinosSecundarios);
      } catch {
        res.destinosSecundarios = [];
      }
    } else if (res.observaciones && typeof res.observaciones === 'string' && res.observaciones.includes('__PARADAS__:')) {
      try {
        const match = res.observaciones.match(/__PARADAS__:(\[.*?\])(?:$|\n)/s);
        if (match && match[1]) {
          res.destinosSecundarios = JSON.parse(match[1]);
          res.observaciones = res.observaciones.replace(/__PARADAS__:\[.*?\](?:\n|$)/gs, '').trim();
        } else {
          res.destinosSecundarios = [];
        }
      } catch {
        res.destinosSecundarios = [];
      }
    } else {
      res.destinosSecundarios = [];
    }
  }

  // Si falta idOperador, auto-completar desde el catálogo por nombre o por eco
  if (!res.idOperador) {
    if (res.operador) {
      const foundId = buscarIdOperadorPorNombre(res.operador);
      if (foundId) res.idOperador = foundId;
    }
    if (!res.idOperador && res.economico) {
      const foundEco = buscarOperadorPorEco(res.economico);
      if (foundEco?.idOperador) res.idOperador = foundEco.idOperador;
    }
  }
  // Preservar siempre los estados activos de tránsito del Supervisor
  const TRANSIT_STATUSES_LIST = ['En Ruta', 'Espera Descarga', 'Descargando', 'Retorno', 'Retrasado', 'Completado', 'Cargado'];
  if (res.estatusPlaneacion === 'CARGADO' && (!res.estatusSupervisor || !TRANSIT_STATUSES_LIST.includes(res.estatusSupervisor))) {
    res.estatusSupervisor = 'Cargado';
  }
  return res;
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

  const [activeArea, setActiveArea] = useState('tv'); // 'patio' | 'planeacion' | 'supervisor' | 'tv'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Referencia persistente de BroadcastChannel multi-pestaña
  const broadcastRef = useRef(null);

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
      onConfirm: config.onConfirm || (() => {})
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

  // Reloj de fondo con intervalo no agresivo (cada 30s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Función para recargar datos desde Supabase
  const reloadCloudData = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      setIsCloudLoading(true);
      const remoteData = await fetchViajesDb();
      if (remoteData) {
        const cleaned = remoteData.map(cleanUnitDestino);
        setUnits(cleaned);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        setIsCloudConnected(true);
      }
    } catch (err) {
      console.error('Error al sincronizar con Supabase:', err);
    } finally {
      setIsCloudLoading(false);
    }
  }, []);

  // Función para recargar historial de planes desde Supabase
  const reloadHistoricalPlans = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const remotePlans = await fetchPlanesHistoricosDb();
      if (remotePlans && Array.isArray(remotePlans)) {
        const formatted = remotePlans.map(p => ({
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
          tipo: f.tipo || 'Camioneta',
          capUnidad: Number(f.cap_unidad || f.capUnidad) || 18,
          estatus: f.estatus || 'ACTIVO',
          linea: f.linea || 'LTI - VHS'
        }));
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
      await reloadCatalogos();
      await reloadCloudData();
      await reloadHistoricalPlans();
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
          if (payload.eventType === 'INSERT') {
            const newUnit = cleanUnitDestino(mapDbToUnit(payload.new));
            setUnits(prev => {
              if (prev.some(u => String(u.id) === String(newUnit.id))) {
                return prev.map(u => String(u.id) === String(newUnit.id) ? newUnit : u);
              }
              return [newUnit, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedUnit = cleanUnitDestino(mapDbToUnit(payload.new));
            setUnits(prev => prev.map(u => String(u.id) === String(updatedUnit.id) ? updatedUnit : u));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setUnits(prev => prev.filter(u => String(u.id) !== String(deletedId)));
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsCloudConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('Estado del canal Realtime Supabase:', status);
          setIsCloudConnected(false);
          // Si el canal se desconecta o se duerme, forzar refresco
          reloadCloudData();
        }
      });

    // Polling inteligente de respaldo cada 7 segundos para garantizar sincronía total entre computadoras
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        reloadCloudData();
      }
    }, 7000);

    // Re-sincronizar inmediatamente al volver a enfocar la ventana o cambiar de monitor
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        reloadCloudData();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(pollInterval);
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
          setUnits(event.data.units.map(cleanUnitDestino));
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel no soportado:', e);
    }

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const remoteUnits = JSON.parse(e.newValue);
          if (Array.isArray(remoteUnits)) {
            setUnits(remoteUnits.map(cleanUnitDestino));
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
      if (broadcastRef.current) {
        broadcastRef.current.postMessage({ type: 'SYNC_UNITS', units, senderId: CLIENT_ID });
      }
    } catch (e) {
      console.error('Error guardando en localStorage', e);
    }
  }, [units]);

  // Si estamos en modo consulta histórica, mostrar las unidades de ese plan
  const displayedUnits = useMemo(() => {
    if (historicalPlanView && Array.isArray(historicalPlanView.unidades)) {
      return historicalPlanView.unidades.map(cleanUnitDestino);
    }
    return units;
  }, [historicalPlanView, units]);

  // KPIs en tiempo real basados en la flota completa y unidades en pantalla
  const kpis = useMemo(() => {
    const total = displayedUnits.length;
    const enTransito = displayedUnits.filter(u => u.estatusSupervisor === 'En Ruta').length;
    const enSucursalRampa = displayedUnits.filter(u => 
      ['Espera Descarga', 'Descargando'].includes(u.estatusSupervisor) ||
      u.estatusPatio === 'En Sucursal'
    ).length;
    const retrasadas = displayedUnits.filter(u => u.estatusSupervisor === 'Retrasado').length;
    const enTaller = displayedUnits.filter(u => u.estatusPatio === 'Taller' || u.estatus === 'TALLER').length;

    const totalFlotaCount = catalogoFlota && catalogoFlota.length > 0 ? catalogoFlota.length : (FLOTA_TOTAL.length || 56);
    const ocupadasSet = new Set(
      displayedUnits
        .filter(u => u.economico && (
          u.estatusPatio === 'Taller' || 
          u.estatus === 'TALLER' ||
          u.estatusSupervisor === 'En Ruta' || 
          u.estatusPatio === 'Colocado p/ Carga' || 
          u.estatusPatio === 'Cargado' || 
          u.estatusPatio === 'En Sucursal' || 
          u.estatusPatio === 'Descargando'
        ))
        .map(u => String(u.economico))
    );
    (catalogoFlota || []).forEach(f => {
      if (f.estatus === 'TALLER' || (f.estatus || '').toLowerCase().includes('taller')) {
        ocupadasSet.add(String(f.eco));
      }
    });
    const disponiblesPatio = Math.max(0, totalFlotaCount - ocupadasSet.size);
    const cargadasPatio = displayedUnits.filter(u => u.estatusPatio === 'Cargado').length;

    // ==========================================
    // DISPONIBLES PARA MAÑANA (Estimación Inteligente)
    // ==========================================
    // Reglas:
    // 1. Unidades actualmente Disponibles en Patio => disponibles mañana (excepto taller)
    // 2. Unidades LOCAL en ruta/sucursal => regresan hoy, disponibles mañana
    // 3. Unidades FORÁNEO:
    //    - Si hora salida <= 10:00 => regresan hoy (ida y vuelta ~8-10 hrs)
    //    - Si hora salida > 10:00 => probablemente NO regresan hoy
    //    - Si están en Retorno => ya vienen de regreso, disponibles mañana
    //    - Si están Completado => ya en patio, disponibles mañana
    // 4. Unidades en Taller => NO disponibles mañana (salvo que sean liberadas)

    const tallerEcos = new Set();
    (catalogoFlota || []).forEach(f => {
      if (f.estatus === 'TALLER' || (f.estatus || '').toLowerCase().includes('taller')) {
        tallerEcos.add(String(f.eco));
      }
    });
    displayedUnits.forEach(u => {
      if (u.economico && (u.estatusPatio === 'Taller' || u.estatus === 'TALLER')) {
        tallerEcos.add(String(u.economico));
      }
    });

    // Contar unidades que NO estarán disponibles mañana
    const noDisponiblesMananaSet = new Set([...tallerEcos]);

    displayedUnits.forEach(u => {
      if (!u.economico) return;
      const eco = String(u.economico);
      if (tallerEcos.has(eco)) return; // Ya contada como taller

      const isForaneo = (u.fl || 'LOCAL').toUpperCase() === 'FORANEO';
      const supervisor = u.estatusSupervisor || '';
      const isEnRuta = supervisor === 'En Ruta';
      const isEnSucursal = ['Espera Descarga', 'Descargando'].includes(supervisor);
      const isRetorno = supervisor === 'Retorno' || u.estatusPlaneacion === 'RETORNO';
      const isCompletado = supervisor === 'Completado' || u.estatusPlaneacion === 'COMPLETADO';

      if (isCompletado || isRetorno) {
        // Ya viene de regreso o ya llegó => disponible mañana
        return;
      }

      if (isForaneo && (isEnRuta || isEnSucursal)) {
        // Foráneo en ruta o en sucursal: evaluar hora de salida
        const horaSalida = u.horaSalida || '';
        let horaNum = 6; // default temprano
        if (horaSalida) {
          const parts = horaSalida.split(':');
          horaNum = parseInt(parts[0], 10) || 6;
        }
        const tiempoViaje = Number(u.tiempoEstimadoHrs) || 0;
        // Si salió tarde y el viaje es largo, no regresa hoy
        if (horaNum >= 10 || (horaNum + tiempoViaje * 2) >= 22) {
          noDisponiblesMananaSet.add(eco);
        }
        // Si salió temprano y viaje < 5hrs ida, regresa hoy => disponible mañana
      }
      // LOCAL en ruta/sucursal => siempre regresan hoy
    });

    const disponiblesManana = Math.max(0, totalFlotaCount - noDisponiblesMananaSet.size);

    return {
      total,
      enTransito,
      enSucursalRampa,
      retrasadas,
      enTaller,
      disponiblesPatio,
      cargadasPatio,
      disponiblesManana
    };
  }, [displayedUnits, catalogoFlota]);

  // Actualizar o crear unidad
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
    
    // Resolver la unidad completa de forma síncrona
    let existingUnit = units.find(u => u.id === unitData.id);
    if (!existingUnit && unitData.economico) {
      // Si no trae ID (ej. creado desde 'Nuevo Viaje') pero el ECO ya existe en la lista de hoy
      // sin un viaje activo asignado, actualizar esa unidad en vez de duplicarla
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

    // Actualizar estado local inmediatamente (optimistic UI)
    setUnits(prev => {
      const exists = prev.some(u => u.id === fullUnit.id);
      return exists 
        ? prev.map(u => u.id === fullUnit.id ? fullUnit : u) 
        : [fullUnit, ...prev];
    });

    // Guardar en Supabase si está configurado
    if (isSupabaseConfigured() && fullUnit) {
      try {
        await upsertViajeDb(fullUnit);
      } catch (err) {
        console.error('Error al persistir unidad en Supabase:', err);
      }
    }
  };

  // Eliminar unidad
  const deleteUnit = async (id) => {
    if (historicalPlanView) {
      showAlert({
        title: 'Modo Consulta Histórico',
        message: 'Estás consultando un plan del historial en modo lectura. Para realizar cambios, vuelve a tu plan de hoy o restáuralo como plan activo.',
        confirmType: 'warning'
      });
      return;
    }

    setUnits(prev => prev.filter(u => u.id !== id));
    if (isSupabaseConfigured()) {
      try {
        await deleteViajeDb(id);
      } catch (err) {
        console.error('Error al eliminar unidad en Supabase:', err);
      }
    }
  };

  // Cambio rápido de estatus por área
  const updateStatus = async (unitId, area, newStatus) => {
    if (historicalPlanView) {
      showAlert({
        title: 'Modo Consulta Histórico',
        message: 'Estás consultando un plan del historial en modo lectura. Para realizar cambios, vuelve a tu plan de hoy o restáuralo como plan activo.',
        confirmType: 'warning'
      });
      return;
    }

    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    
    let targetUnit = units.find(u => String(u.id) === String(unitId));
    if (!targetUnit && String(unitId).startsWith('fleet-')) {
      const cleanEco = String(unitId).replace('fleet-', '');
      const master = (catalogoFlota || []).find(f => String(f.eco) === cleanEco);
      if (master) {
        targetUnit = {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `baz-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          economico: String(master.eco),
          placas: master.placas || '',
          tipo: master.tipo || 'Camioneta',
          capUnidad: Number(master.capUnidad || 18),
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

    // Validación oficial: Si se intenta colocar o poner en caseta/cargado, DEBE tener No. de Viaje, Operador y Destino
    if (
      (area === 'planeacion' && (newStatus === 'COLOCADO' || newStatus === 'CARGADO')) ||
      (area === 'patio' && (newStatus === 'Colocado p/ Carga' || newStatus === 'Cargado'))
    ) {
      const { valid } = checkTieneViajeYOperador(targetUnit);
      if (!valid) {
        console.warn(`[Validación Bloqueada] La unidad ECO ${targetUnit.economico} requiere No. de Viaje, Operador y Destino para pasar a ${newStatus}.`);
        return;
      }
    }

    const updated = { ...targetUnit, actualizadoEn: now };

    if (area === 'patio') {
      updated.estatusPatio = newStatus;
      if (newStatus === 'Colocado p/ Carga') {
        updated.area = 'planeacion';
        updated.estatusPlaneacion = 'COLOCADO';
        if (updated.estatusSupervisor === 'No Disponible') {
          updated.estatusSupervisor = 'Pendiente';
        }
      } else if (newStatus === 'Taller') {
        updated.area = 'patio';
        updated.estatusSupervisor = 'No Disponible';
        updated.estatusPlaneacion = 'PENDIENTE';
      } else if (newStatus === 'Disponible') {
        updated.area = 'patio';
        updated.estatusSupervisor = 'Pendiente';
      }
    } else if (area === 'planeacion') {
      updated.estatusPlaneacion = newStatus;
      if (newStatus === 'COLOCADO') {
        updated.area = 'planeacion';
        updated.estatusPatio = 'Colocado p/ Carga';
        if (updated.estatusSupervisor === 'No Disponible') {
          updated.estatusSupervisor = 'Pendiente';
        }
      } else if (newStatus === 'CARGADO') {
        updated.area = 'supervisor';
        updated.estatusPatio = 'Cargado';
        if (['No Disponible', 'Pendiente', 'Disponible', ''].includes(updated.estatusSupervisor) || !updated.estatusSupervisor) {
          updated.estatusSupervisor = 'Cargado';
        }
      } else if (newStatus === 'PENDIENTE') {
        updated.area = 'planeacion';
        updated.estatusPatio = 'Disponible';
        updated.estatusSupervisor = 'Pendiente';
      }
    } else if (area === 'supervisor') {
      updated.estatusSupervisor = newStatus;
      updated.area = 'supervisor';

      if (newStatus === 'Completado') {
        updated.estatusPatio = 'Disponible';
        updated.estatusPlaneacion = 'COMPLETADO';
        updated.area = 'patio';
      } else if (newStatus === 'Retorno') {
        updated.estatusPlaneacion = 'RETORNO';
        updated.estatusPatio = 'Disponible';
      } else if (newStatus === 'En Ruta') {
        // En Ruta hacia el destino o siguiente parada multiparada
        updated.estatusPlaneacion = 'CARGADO';
        updated.estatusPatio = 'En Ruta';
      } else if (newStatus === 'Espera Descarga') {
        // Llegó a sucursal y espera rampa
        updated.estatusPlaneacion = 'CARGADO';
        updated.estatusPatio = 'En Sucursal';
      } else if (newStatus === 'Descargando') {
        // Proceso activo de descarga en rampa de la sucursal
        updated.estatusPlaneacion = 'CARGADO';
        updated.estatusPatio = 'Descargando';
      } else if (newStatus === 'Retrasado') {
        updated.estatusPlaneacion = 'CARGADO';
      }
    }

    const exists = units.some(u => String(u.id) === String(targetUnit.id));
    const nextUnits = exists 
      ? units.map(u => String(u.id) === String(targetUnit.id) ? updated : u)
      : [updated, ...units];

    // Actualizar estado local inmediatamente
    setUnits(nextUnits);

    // Notificar multi-pestaña local instantáneamente
    if (broadcastRef.current) {
      try {
        broadcastRef.current.postMessage({ type: 'SYNC_UNITS', units: nextUnits, senderId: CLIENT_ID });
      } catch {}
    }

    // Sincronizar actualización en Supabase
    if (isSupabaseConfigured()) {
      try {
        await upsertViajeDb(updated);
      } catch (err) {
        console.error('Error al actualizar estatus en Supabase:', err);
      }
    }
  };

  // Purgar / Limpiar todos los datos del tablero
  const clearAllUnits = async () => {
    setUnits([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('baz_entregas_fleet_data_v1');
    localStorage.removeItem('baz_entregas_fleet_live_clean_v1');
    
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('viajes_diarios').delete().neq('id', '___non_existent___');
      } catch (err) {
        console.error('Error al vaciar viajes_diarios en Supabase:', err);
      }
    }

    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('baz_fleet_realtime_sync');
      bc.postMessage({ type: 'SYNC_UNITS', units: [], senderId: CLIENT_ID });
      bc.close();
    }
  };

  // Guardar el plan o día actual
  const saveCurrentPlan = async ({ nombre, fecha, startNewDay = false }) => {
    const planDate = fecha || new Date().toISOString().split('T')[0];
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
      const todayDate = new Date().toISOString().split('T')[0];
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
    const restoredUnits = plan.unidades.map(cleanUnitDestino);
    setUnits(restoredUnits);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredUnits));

    // Si Supabase está configurado, actualizar viajes_diarios
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('viajes_diarios').delete().neq('id', '___non_existent___');
        for (const u of restoredUnits) {
          await upsertViajeDb(u);
        }
      } catch (err) {
        console.warn('Error al sincronizar restauración en Supabase:', err);
      }
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
      activeArea,
      setActiveArea,
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
      reloadCatalogos
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
