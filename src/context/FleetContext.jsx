import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_UNITS } from '../data/initialFleetData';
import { 
  supabase, 
  isSupabaseConfigured, 
  fetchViajesDb, 
  upsertViajeDb, 
  deleteViajeDb, 
  mapDbToUnit 
} from '../lib/supabaseClient';

const FleetContext = createContext(null);

const STORAGE_KEY = 'baz_entregas_fleet_seed_v2';
const CLIENT_ID = Math.random().toString(36).substring(2) + Date.now().toString(36);

const cleanUnitDestino = (unit) => {
  if (!unit) return unit;
  if (unit.destino && typeof unit.destino === 'string') {
    return {
      ...unit,
      destino: unit.destino.replace(/\s*\(Retorno\)/gi, '').trim()
    };
  }
  return unit;
};

export const FleetProvider = ({ children }) => {
  const [units, setUnits] = useState(() => {
    try {
      localStorage.removeItem('baz_entregas_fleet_data_v1');
      localStorage.removeItem('baz_entregas_fleet_live_clean_v1');
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
    return INITIAL_UNITS;
  });

  const [activeArea, setActiveArea] = useState('tv'); // 'patio' | 'planeacion' | 'supervisor' | 'tv'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Estados de conectividad Cloud / Supabase
  const [isCloudConnected, setIsCloudConnected] = useState(isSupabaseConfigured());
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  const showConfirm = (config) => {
    setConfirmModal({
      isOpen: true,
      title: config.title || '¿Confirmar acción?',
      message: config.message || '',
      unit: config.unit || null,
      confirmText: config.confirmText || 'Confirmar',
      confirmType: config.confirmType || 'danger',
      onConfirm: config.onConfirm || (() => {})
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
      if (remoteData && remoteData.length > 0) {
        const cleaned = remoteData.map(cleanUnitDestino);
        setUnits(cleaned);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        setIsCloudConnected(true);
      } else if (remoteData && remoteData.length === 0) {
        // Si la tabla en Supabase está vacía, poblamos con los viajes representativos iniciales
        for (const u of INITIAL_UNITS) {
          await upsertViajeDb(u);
        }
        setUnits(INITIAL_UNITS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_UNITS));
        setIsCloudConnected(true);
      }
    } catch (err) {
      console.error('Error al sincronizar con Supabase:', err);
    } finally {
      setIsCloudLoading(false);
    }
  }, []);

  // Sincronización Inicial y Suscripción Realtime con Supabase
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setIsCloudConnected(false);
      return;
    }

    // Cargar datos remotos
    reloadCloudData();

    // Suscribirse a cambios en tiempo real en la tabla viajes_diarios
    const channel = supabase
      .channel('realtime:public:viajes_diarios')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'viajes_diarios' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newUnit = mapDbToUnit(payload.new);
            setUnits(prev => {
              if (prev.some(u => u.id === newUnit.id)) {
                return prev.map(u => u.id === newUnit.id ? newUnit : u);
              }
              return [newUnit, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedUnit = mapDbToUnit(payload.new);
            setUnits(prev => prev.map(u => u.id === updatedUnit.id ? updatedUnit : u));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setUnits(prev => prev.filter(u => u.id !== deletedId));
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsCloudConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Estado del canal Realtime Supabase:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reloadCloudData]);

  // Sincronización local multi-pestaña como respaldo (BroadcastChannel y Storage Event)
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('baz_fleet_realtime_sync');
      channel.onmessage = (event) => {
        if (
          event.data && 
          event.data.type === 'SYNC_UNITS' && 
          event.data.senderId !== CLIENT_ID && 
          Array.isArray(event.data.units)
        ) {
          setUnits(event.data.units);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel no soportado:', e);
    }

    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const remoteUnits = JSON.parse(e.newValue);
          setUnits(remoteUnits);
        } catch (err) {
          console.error('Error al sincronizar localStorage remoto:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Guardar en localStorage de respaldo y emitir BroadcastChannel local
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('baz_fleet_realtime_sync');
        bc.postMessage({ type: 'SYNC_UNITS', units, senderId: CLIENT_ID });
        bc.close();
      }
    } catch (e) {
      console.error('Error guardando en localStorage', e);
    }
  }, [units]);

  // KPIs en tiempo real basados exactamente en el tablero TV
  const kpis = useMemo(() => {
    const total = units.length;
    const enTransito = units.filter(u => u.estatusSupervisor === 'En Ruta').length;
    const enSucursalRampa = units.filter(u => 
      ['Espera Descarga', 'Descargando'].includes(u.estatusSupervisor) ||
      u.estatusPlaneacion === 'En Cortina' ||
      u.estatusPatio === 'Colocado p/ Carga'
    ).length;
    const retrasadas = units.filter(u => u.estatusSupervisor === 'Retrasado').length;
    const enTaller = units.filter(u => u.estatusPatio === 'Taller').length;
    const disponiblesPatio = units.filter(u => u.estatusPatio === 'Disponible').length;
    const cargadasPatio = units.filter(u => u.estatusPatio === 'Cargado').length;

    return {
      total,
      enTransito,
      enSucursalRampa,
      retrasadas,
      enTaller,
      disponiblesPatio,
      cargadasPatio
    };
  }, [units]);

  // Actualizar o crear unidad
  const saveUnit = async (unitData) => {
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    
    // Resolver la unidad completa de forma síncrona
    const existingUnit = units.find(u => u.id === unitData.id);
    const fullUnitRaw = existingUnit
      ? { ...existingUnit, ...unitData, actualizadoEn: now }
      : {
          ...unitData,
          id: unitData.id || `baz-unit-${unitData.economico || Date.now()}`,
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
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    
    const targetUnit = units.find(u => u.id === unitId);
    if (!targetUnit) return;

    const updated = { ...targetUnit, actualizadoEn: now };

    if (area === 'patio') {
      updated.estatusPatio = newStatus;
      if (newStatus === 'Colocado p/ Carga') {
        updated.area = 'planeacion';
        updated.estatusPlaneacion = 'COLOCADO';
      } else if (newStatus === 'Taller') {
        updated.area = 'patio';
        updated.estatusSupervisor = 'No Disponible';
        updated.estatusPlaneacion = 'PENDIENTE';
      }
    } else if (area === 'planeacion') {
      updated.estatusPlaneacion = newStatus;
      if (newStatus === 'COLOCADO') {
        updated.area = 'planeacion';
        updated.estatusPatio = 'Colocado p/ Carga';
      } else if (newStatus === 'EN CASETA') {
        updated.area = 'supervisor';
        updated.estatusPatio = 'Cargado';
        if (updated.estatusSupervisor === 'Pendiente' || !updated.estatusSupervisor) {
          updated.estatusSupervisor = 'En Ruta';
        }
      } else if (newStatus === 'PENDIENTE') {
        updated.area = 'planeacion';
        updated.estatusPatio = 'Disponible';
        updated.estatusSupervisor = 'Pendiente';
      }
    } else if (area === 'supervisor') {
      updated.estatusSupervisor = newStatus;
      if (newStatus === 'Completado') {
        updated.estatusPatio = 'Disponible';
        updated.estatusPlaneacion = 'PENDIENTE';
      } else if (newStatus === 'Retorno') {
        updated.destino = 'CEDIS VILLAHERMOSA';
      }
    }

    // Actualizar estado local inmediatamente
    setUnits(prev => prev.map(u => u.id === unitId ? updated : u));

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

  // Restablecer datos a la configuración inicial (1 de cada estatus)
  const resetData = async () => {
    setUnits(INITIAL_UNITS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_UNITS));

    if (isSupabaseConfigured() && supabase) {
      try {
        // Borrar actuales y poblar con INITIAL_UNITS
        await supabase.from('viajes_diarios').delete().neq('id', '___non_existent___');
        for (const u of INITIAL_UNITS) {
          await upsertViajeDb(u);
        }
      } catch (err) {
        console.error('Error al restablecer datos en Supabase:', err);
      }
    }

    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('baz_fleet_realtime_sync');
      bc.postMessage({ type: 'SYNC_UNITS', units: INITIAL_UNITS, senderId: CLIENT_ID });
      bc.close();
    }
  };

  return (
    <FleetContext.Provider value={{
      units,
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
      resetData,
      clearAllUnits,
      confirmModal,
      showConfirm,
      closeConfirm
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
