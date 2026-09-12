import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { INITIAL_UNITS } from '../data/initialFleetData';

const FleetContext = createContext(null);

const STORAGE_KEY = 'baz_entregas_fleet_seed_v2';
const CLIENT_ID = Math.random().toString(36).substring(2) + Date.now().toString(36);

export const FleetProvider = ({ children }) => {
  const [units, setUnits] = useState(() => {
    try {
      // Purgar almacenamiento de versiones anteriores para cargar el nuevo seed
      localStorage.removeItem('baz_entregas_fleet_data_v1');
      localStorage.removeItem('baz_entregas_fleet_live_clean_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Reloj de fondo con intervalo no agresivo (cada 30s) para no saturar re-renders globales
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Sincronización en tiempo real entre ventanas/pestañas (BroadcastChannel y Storage Event)
  useEffect(() => {
    let channel;
    try {
      channel = new BroadcastChannel('baz_fleet_realtime_sync');
      channel.onmessage = (event) => {
        // Ignorar mensajes generados por la misma pestaña para evitar bucles y renderizados duplicados
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

  // Guardar en localStorage y emitir evento en vivo a OTRAS pantallas/ventanas
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

  // KPIs en tiempo real basados exactamente en el tablero TV (Imagen 3)
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
  const saveUnit = (unitData) => {
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    setUnits(prev => {
      const exists = prev.some(u => u.id === unitData.id);
      if (exists) {
        return prev.map(u => u.id === unitData.id ? { ...u, ...unitData, actualizadoEn: now } : u);
      } else {
        const newUnit = {
          ...unitData,
          id: unitData.id || `unit-${unitData.economico || Date.now()}`,
          actualizadoEn: now
        };
        return [newUnit, ...prev];
      }
    });
  };

  // Eliminar unidad
  const deleteUnit = (id) => {
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  // Cambio rápido de estatus por área
  const updateStatus = (unitId, area, newStatus) => {
    const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    setUnits(prev => prev.map(u => {
      if (u.id !== unitId) return u;

      const updated = { ...u, actualizadoEn: now };

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
          updated.destino = `${u.sucursalOrigen || 'CEDIS VILLAHERMOSA'} (Retorno)`;
        }
      }

      return updated;
    }));
  };

  // Purgar / Limpiar todos los datos del tablero
  const clearAllUnits = () => {
    setUnits([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('baz_entregas_fleet_data_v1');
    localStorage.removeItem('baz_entregas_fleet_live_clean_v1');
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('baz_fleet_realtime_sync');
      bc.postMessage({ type: 'SYNC_UNITS', units: [], senderId: CLIENT_ID });
      bc.close();
    }
  };

  // Restablecer datos a la configuración inicial (1 de cada estatus)
  const resetData = () => {
    setUnits(INITIAL_UNITS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_UNITS));
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
      currentTime,
      saveUnit,
      deleteUnit,
      updateStatus,
      resetData,
      clearAllUnits
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
