import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Warehouse, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  ArrowRight,
  History,
  FileSpreadsheet,
  FolderCheck,
  Eye,
  RotateCcw,
  User
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { CATALOGO_RAMPAS, detectarZonaRampa } from '../constants/fleetConstants';
import { OperadorSelector } from './OperadorSelector';
import {
  supabase,
  isSupabaseConfigured,
  EMRAMPE_ACTIVO_ROW_ID,
  fetchEmrampeActivoDb,
  saveEmrampeActivoDb,
  fetchHistorialEmrampeDb,
  saveHistorialEmrampeDb,
  deleteHistorialEmrampeDb
} from '../lib/supabaseClient';

const STORAGE_EMRAMPE_ACTIVO = 'baz_control_emrampe_activo_v1';
const STORAGE_EMRAMPE_HISTORIAL = 'baz_control_emrampe_historial_v1';

export const ControlEmrampeView = () => {
  const { 
    catalogoFlota, 
    showConfirm,
    showAlert
  } = useFleet();

  const [registros, setRegistros] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EMRAMPE_ACTIVO);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      return [];
    }
    return [];
  });

  const [historial, setHistorial] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EMRAMPE_HISTORIAL);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      return [];
    }
    return [];
  });

  const [corteEnConsulta, setCorteEnConsulta] = useState(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaveCorteModalOpen, setIsSaveCorteModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [zonaRampa, setZonaRampa] = useState('embarque');
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  const hoyIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [corteForm, setCorteForm] = useState({
    nombre: '',
    fecha: hoyIso,
    limpiarTablero: false
  });

  const [formData, setFormData] = useState(() => ({
    economico: '',
    numCarga: '',
    operador: '',
    cortina: '',
    destino: '',
    horaEmrampe: '',
    horaDesemrampe: '',
    patiero: (() => {
      try {
        return localStorage.getItem('baz_patiero_activo') || '';
      } catch {
        return '';
      }
    })()
  }));

  const lastJsonRef = useRef(JSON.stringify(registros));
  const isLocalMutatingRef = useRef(false);

  const recargarDesdeNube = useCallback(async () => {
    if (!isSupabaseConfigured() || isLocalMutatingRef.current) return;
    try {
      const [remotosActivos, remotosHistorial] = await Promise.all([
        fetchEmrampeActivoDb(),
        fetchHistorialEmrampeDb()
      ]);

      if (Array.isArray(remotosActivos) && !isLocalMutatingRef.current) {
        const serialized = JSON.stringify(remotosActivos);
        if (serialized !== lastJsonRef.current) {
          lastJsonRef.current = serialized;
          setRegistros(remotosActivos);
          localStorage.setItem(STORAGE_EMRAMPE_ACTIVO, serialized);
        }
      }

      if (Array.isArray(remotosHistorial)) {
        setHistorial(remotosHistorial);
        localStorage.setItem(STORAGE_EMRAMPE_HISTORIAL, JSON.stringify(remotosHistorial));
      }
    } catch (err) {
      console.warn('Error al sincronizar control de emrampe:', err);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    recargarDesdeNube();

    const channel = supabase
      .channel(`realtime_emrampe_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'historial_planes' },
        (payload) => {
          const rowId = String(payload?.new?.id || payload?.old?.id || '');
          if (rowId === EMRAMPE_ACTIVO_ROW_ID || rowId.startsWith('__EMRAMPE_')) {
            recargarDesdeNube();
          }
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        recargarDesdeNube();
      }
    }, 12000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [recargarDesdeNube]);

  const persistirRegistrosActivos = async (nuevosRegistros) => {
    const serialized = JSON.stringify(nuevosRegistros);
    lastJsonRef.current = serialized;
    setRegistros(nuevosRegistros);
    localStorage.setItem(STORAGE_EMRAMPE_ACTIVO, serialized);

    if (isSupabaseConfigured()) {
      isLocalMutatingRef.current = true;
      setIsSavingCloud(true);
      try {
        await saveEmrampeActivoDb(nuevosRegistros);
      } catch (err) {
        console.error('Error al guardar emrampe en la nube:', err);
      } finally {
        setIsSavingCloud(false);
        setTimeout(() => {
          isLocalMutatingRef.current = false;
        }, 800);
      }
    }
  };

  const getHoraActual = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const openNewModal = () => {
    if (corteEnConsulta) {
      showAlert({
        title: 'Modo Consulta de Historial',
        message: 'Estás visualizando un corte guardado. Vuelve al tablero activo para registrar nuevos emrampes.',
        confirmType: 'warning'
      });
      return;
    }
    let defaultPatiero = '';
    try {
      defaultPatiero = localStorage.getItem('baz_patiero_activo') || '';
    } catch {}
    setEditingUnitId(null);
    setZonaRampa('embarque');
    setFormData({
      economico: '',
      numCarga: '',
      operador: '',
      cortina: '',
      destino: '',
      horaEmrampe: getHoraActual(),
      horaDesemrampe: '',
      patiero: defaultPatiero
    });
    setIsModalOpen(true);
  };

  const openEditModal = (unit) => {
    if (corteEnConsulta) {
      showAlert({
        title: 'Modo Consulta de Historial',
        message: 'Estás visualizando un corte guardado. Vuelve al tablero activo para editar registros.',
        confirmType: 'warning'
      });
      return;
    }
    setEditingUnitId(unit.id);
    const detectada = detectarZonaRampa(unit.cortina);
    setZonaRampa(detectada || 'embarque');
    setFormData({
      economico: unit.economico || '',
      numCarga: unit.numCarga || '',
      operador: unit.operador || '',
      cortina: unit.cortina || '',
      destino: unit.destino || '',
      horaEmrampe: unit.horaEmrampe || '',
      horaDesemrampe: unit.horaDesemrampe || '',
      patiero: unit.patiero || (() => {
        try {
          return localStorage.getItem('baz_patiero_activo') || '';
        } catch {
          return '';
        }
      })()
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUnitId(null);
  };

  const handleEcoChange = (ecoValor) => {
    const cleanEco = String(ecoValor).trim();
    if (editingUnitId) {
      setFormData(prev => ({ ...prev, economico: cleanEco }));
      return;
    }

    const existingPending = registros.find(
      u => String(u.economico).trim() === cleanEco && !u.horaDesemrampe
    );
    const fromMaster = (catalogoFlota || []).find(f => String(f.eco).trim() === cleanEco);

    if (existingPending || fromMaster) {
      const nextCortina = existingPending?.cortina || '';
      const autoZona = detectarZonaRampa(nextCortina);
      if (autoZona) setZonaRampa(autoZona);

      setFormData(prev => ({
        ...prev,
        economico: cleanEco,
        operador: existingPending?.operador || fromMaster?.operador || prev.operador || '',
        destino: existingPending?.destino || prev.destino || '',
        numCarga: existingPending?.numCarga || prev.numCarga || '',
        cortina: nextCortina || prev.cortina || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        economico: cleanEco
      }));
    }
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    const cleanEco = String(formData.economico || '').trim();
    if (!cleanEco) return;

    let targetUnit = editingUnitId ? registros.find(u => u.id === editingUnitId) : null;
    if (!targetUnit && !editingUnitId) {
      targetUnit = registros.find(
        u => String(u.economico).trim() === cleanEco && !u.horaDesemrampe
      );
    }

    const nowStr = getHoraActual();
    const horaEmr = formData.horaEmrampe ? String(formData.horaEmrampe).trim() : '';
    const horaDes = formData.horaDesemrampe ? String(formData.horaDesemrampe).trim() : '';
    const patieroLimpio = String(formData.patiero || '').trim();

    if (patieroLimpio) {
      try {
        localStorage.setItem('baz_patiero_activo', patieroLimpio);
      } catch {}
    }

    const payload = {
      ...(targetUnit || {}),
      id: targetUnit?.id || `emrampe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      economico: cleanEco,
      numCarga: String(formData.numCarga || '').trim(),
      operador: String(formData.operador || '').trim(),
      patiero: patieroLimpio,
      cortina: String(formData.cortina || '').trim(),
      destino: String(formData.destino || '').trim(),
      horaEmrampe: horaEmr,
      horaDesemrampe: horaDes,
      fechaRegistro: targetUnit?.fechaRegistro || hoyIso,
      actualizadoEn: nowStr
    };

    const exists = registros.some(u => u.id === payload.id);
    const nextList = exists
      ? registros.map(u => (u.id === payload.id ? payload : u))
      : [payload, ...registros];

    closeModal();
    await persistirRegistrosActivos(nextList);
  };

  const handleQuickEmrampar = async (unit) => {
    if (corteEnConsulta) return;
    const hora = getHoraActual();
    const nextList = registros.map(u =>
      u.id === unit.id ? { ...u, horaEmrampe: hora, actualizadoEn: hora } : u
    );
    await persistirRegistrosActivos(nextList);
  };

  const handleQuickDesemrampar = async (unit) => {
    if (corteEnConsulta) return;
    const hora = getHoraActual();
    const nextList = registros.map(u =>
      u.id === unit.id ? { ...u, horaDesemrampe: hora, actualizadoEn: hora } : u
    );
    await persistirRegistrosActivos(nextList);
  };

  const handleRemoveEmrampe = async (unit) => {
    if (corteEnConsulta) return;
    const nextList = registros.filter(u => u.id !== unit.id);
    await persistirRegistrosActivos(nextList);
  };

  const openGuardarCorteModal = () => {
    if (registros.length === 0) {
      showAlert({
        title: 'Sin registros para guardar',
        message: 'Agrega al menos un registro de emrampe antes de guardar un corte en el historial.',
        confirmType: 'warning'
      });
      return;
    }
    setCorteForm({
      nombre: `Corte Emrampe ${hoyIso}`,
      fecha: hoyIso,
      limpiarTablero: false
    });
    setIsSaveCorteModalOpen(true);
  };

  const handleConfirmGuardarCorte = async (e) => {
    e.preventDefault();
    const copia = JSON.parse(JSON.stringify(registros));
    const corteId = `__EMRAMPE_HIST__${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nombreFinal = (corteForm.nombre || '').trim() || `Corte Emrampe ${corteForm.fecha || hoyIso}`;
    const fechaFinal = corteForm.fecha || hoyIso;

    const nuevoCorte = {
      id: corteId,
      fecha: fechaFinal,
      nombre: nombreFinal,
      totalRegistros: copia.length,
      totalDesemrampados: copia.filter(r => Boolean(r.horaDesemrampe)).length,
      registros: copia,
      createdAt: new Date().toISOString()
    };

    const nuevoHistorial = [nuevoCorte, ...historial];
    setHistorial(nuevoHistorial);
    localStorage.setItem(STORAGE_EMRAMPE_HISTORIAL, JSON.stringify(nuevoHistorial));
    setIsSaveCorteModalOpen(false);

    if (isSupabaseConfigured()) {
      try {
        await saveHistorialEmrampeDb(nuevoCorte);
      } catch (err) {
        console.error('Error al guardar corte de emrampe en Supabase:', err);
      }
    }

    if (corteForm.limpiarTablero) {
      await persistirRegistrosActivos([]);
    }

    showAlert({
      title: 'Corte de Emrampe Guardado',
      message: `Se guardó "${nombreFinal}" con ${copia.length} registro(s) en la tabla independiente de Control de Emrampe.`,
      confirmType: 'success'
    });
  };

  const handleDeleteCorte = async (corte) => {
    const nextHist = historial.filter(h => h.id !== corte.id);
    setHistorial(nextHist);
    localStorage.setItem(STORAGE_EMRAMPE_HISTORIAL, JSON.stringify(nextHist));
    if (corteEnConsulta?.id === corte.id) {
      setCorteEnConsulta(null);
    }
    if (isSupabaseConfigured()) {
      try {
        await deleteHistorialEmrampeDb(corte.id);
      } catch (err) {
        console.error('Error al eliminar corte de emrampe:', err);
      }
    }
  };

  const handleExportExcel = async (listaExportar = emrampeUnits, tituloArchivo = '') => {
    if (!listaExportar || listaExportar.length === 0) {
      showAlert({
        title: 'Sin datos para exportar',
        message: 'No hay registros de emrampe en la vista actual para exportar a Excel.',
        confirmType: 'warning'
      });
      return;
    }

    try {
      const ExcelJSModule = await import('exceljs');
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Control de Emrampe');

      sheet.columns = [
        { header: 'UNIDAD (ECO)', key: 'economico', width: 16 },
        { header: 'NUM DE CARGA', key: 'numCarga', width: 18 },
        { header: 'OPERADOR', key: 'operador', width: 32 },
        { header: 'PATIERO', key: 'patiero', width: 22 },
        { header: 'ZONA', key: 'zona', width: 14 },
        { header: 'RAMPA / CORTINA', key: 'cortina', width: 18 },
        { header: 'DESTINO', key: 'destino', width: 26 },
        { header: 'HORA EMRAMPE', key: 'horaEmrampe', width: 18 },
        { header: 'HORA DESEMRAMPE', key: 'horaDesemrampe', width: 20 },
        { header: 'ESTATUS', key: 'estatus', width: 18 }
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }
      };

      listaExportar.forEach(u => {
        const zona = detectarZonaRampa(u.cortina);
        const etiquetaZona = zona === 'recibo' ? 'RECIBO' : zona === 'embarque' ? 'EMBARQUE' : zona === 'ds' ? 'DS' : 'GENERAL';
        const estatus = u.horaDesemrampe ? 'DESEMRAMPADA' : u.horaEmrampe ? 'EN RAMPA' : 'PENDIENTE';
        sheet.addRow({
          economico: `ECO ${u.economico || ''}`,
          numCarga: u.numCarga || '—',
          operador: u.operador || 'Sin asignar',
          patiero: u.patiero || '—',
          zona: u.cortina ? etiquetaZona : '—',
          cortina: u.cortina || 'Sin rampa',
          destino: u.destino || 'Sin definir',
          horaEmrampe: u.horaEmrampe || '—',
          horaDesemrampe: u.horaDesemrampe || '—',
          estatus
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sufijo = (tituloArchivo || corteEnConsulta?.fecha || hoyIso).replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `Control_Emrampe_${sufijo}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar Excel de emrampe:', err);
    }
  };

  const emrampeUnits = useMemo(() => {
    if (corteEnConsulta && Array.isArray(corteEnConsulta.registros)) {
      return corteEnConsulta.registros;
    }
    return registros;
  }, [corteEnConsulta, registros]);

  const rampasOcupadas = useMemo(() => {
    const map = new Map();
    emrampeUnits.forEach(u => {
      if (u.id === editingUnitId) return;
      if (u.cortina && u.horaEmrampe && !u.horaDesemrampe) {
        map.set(String(u.cortina).trim().toUpperCase(), u.economico);
      }
    });
    return map;
  }, [emrampeUnits, editingUnitId]);

  const kpis = useMemo(() => {
    let enRampa = 0;
    let desemrampadas = 0;
    let pendientes = 0;

    emrampeUnits.forEach(u => {
      if (u.horaDesemrampe) {
        desemrampadas++;
      } else if (u.horaEmrampe) {
        enRampa++;
      } else {
        pendientes++;
      }
    });

    return {
      total: emrampeUnits.length,
      enRampa,
      desemrampadas,
      pendientes
    };
  }, [emrampeUnits]);

  const filteredUnits = useMemo(() => {
    const q = search.trim().toLowerCase();

    return emrampeUnits.filter(u => {
      if (filterTab === 'EN_RAMPA' && (!u.horaEmrampe || u.horaDesemrampe)) return false;
      if (filterTab === 'DESEMRAMPADAS' && !u.horaDesemrampe) return false;
      if (filterTab === 'PENDIENTES' && Boolean(u.horaEmrampe)) return false;

      if (!q) return true;

      const eco = String(u.economico || '').toLowerCase();
      const carga = String(u.numCarga || '').toLowerCase();
      const op = String(u.operador || '').toLowerCase();
      const rampa = String(u.cortina || '').toLowerCase();
      const dest = String(u.destino || '').toLowerCase();
      const pat = String(u.patiero || '').toLowerCase();
      const zona = (detectarZonaRampa(u.cortina) || '').toLowerCase();

      return eco.includes(q) || carga.includes(q) || op.includes(q) || rampa.includes(q) || dest.includes(q) || pat.includes(q) || zona.includes(q);
    });
  }, [emrampeUnits, filterTab, search]);

  const renderRampaBadge = (cortina) => {
    if (!cortina) {
      return <span className="rampa-pill rampa-pill-empty">Sin Rampa</span>;
    }
    const zona = detectarZonaRampa(cortina);
    const etiquetaZona = zona === 'recibo' ? 'RECIBO' : zona === 'embarque' ? 'EMBARQUE' : zona === 'ds' ? 'DS' : '';
    const claseZona = zona ? `rampa-pill-${zona}` : 'rampa-pill-default';

    return (
      <span className={`rampa-pill ${claseZona}`} title={etiquetaZona ? `Zona ${etiquetaZona}: ${cortina}` : `Rampa ${cortina}`}>
        {etiquetaZona && <span className="rampa-zona-tag">{etiquetaZona}</span>}
        <span className="rampa-num-val">{cortina}</span>
      </span>
    );
  };

  return (
    <div className="emrampe-container">
      {corteEnConsulta && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          marginBottom: '0.85rem',
          borderRadius: '10px',
          background: 'rgba(245, 158, 11, 0.14)',
          border: '1px solid rgba(245, 158, 11, 0.45)',
          color: '#fef3c7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', fontWeight: 700 }}>
            <History size={18} color="#fbbf24" />
            <span>
              Consultando corte histórico: <strong style={{ color: '#fff' }}>{corteEnConsulta.nombre}</strong> ({corteEnConsulta.fecha})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCorteEnConsulta(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid rgba(251, 191, 36, 0.6)',
              background: 'rgba(245, 158, 11, 0.25)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
            Volver al Tablero Activo
          </button>
        </div>
      )}

      <div className="emrampe-top-action-bar">
        <div className="emrampe-search-box">
          <Search size={18} className="emrampe-search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por unidad, rampa, operador, destino..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="emrampe-search-input"
          />
          {search && (
            <button className="emrampe-search-clear" onClick={() => setSearch('')}>
              <X size={15} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {!corteEnConsulta && (
            <button 
              type="button" 
              className="btn-emrampe-primary btn-top-add-emrampe"
              onClick={openNewModal}
              title="Registrar nuevo emrampe en patio"
            >
              <Plus size={18} />
              <span>+ Registrar Emrampe</span>
            </button>
          )}

          {!corteEnConsulta && (
            <button
              type="button"
              onClick={openGuardarCorteModal}
              title="Guardar corte de registros de emrampe en su propio historial"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.62rem 0.95rem',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                background: 'rgba(16, 185, 129, 0.16)',
                color: '#34d399',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              <FolderCheck size={16} />
              <span>Guardar Corte</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsHistorialModalOpen(true)}
            title="Ver cortes guardados de Control de Emrampe"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.62rem 0.95rem',
              borderRadius: '10px',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#38bdf8',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <History size={16} />
            <span>Historial ({historial.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportExcel(emrampeUnits)}
            title="Descargar registros en archivo Excel (.xlsx)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.62rem 0.95rem',
              borderRadius: '10px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#e2e8f0',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Excel</span>
          </button>
        </div>
      </div>

      <div className="emrampe-kpi-grid">
        <div 
          className={`emrampe-kpi-card ${filterTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilterTab('ALL')}
        >
          <div className="emrampe-kpi-num">{kpis.total}</div>
          <div className="emrampe-kpi-lbl">Total Registros</div>
        </div>

        <div 
          className={`emrampe-kpi-card kpi-en-rampa ${filterTab === 'EN_RAMPA' ? 'active' : ''}`}
          onClick={() => setFilterTab('EN_RAMPA')}
        >
          <div className="emrampe-kpi-num">{kpis.enRampa}</div>
          <div className="emrampe-kpi-lbl">En Rampa Ahora</div>
        </div>

        <div 
          className={`emrampe-kpi-card kpi-pendientes ${filterTab === 'PENDIENTES' ? 'active' : ''}`}
          onClick={() => setFilterTab('PENDIENTES')}
        >
          <div className="emrampe-kpi-num">{kpis.pendientes}</div>
          <div className="emrampe-kpi-lbl">Por Emrampar</div>
        </div>

        <div 
          className={`emrampe-kpi-card kpi-desemrampadas ${filterTab === 'DESEMRAMPADAS' ? 'active' : ''}`}
          onClick={() => setFilterTab('DESEMRAMPADAS')}
        >
          <div className="emrampe-kpi-num">{kpis.desemrampadas}</div>
          <div className="emrampe-kpi-lbl">Desemrampadas</div>
        </div>
      </div>

      <div className="emrampe-toolbar">
        <div className="emrampe-filter-pills">
          <button 
            type="button" 
            className={`filter-pill ${filterTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterTab('ALL')}
          >
            Todas ({kpis.total})
          </button>
          <button 
            type="button" 
            className={`filter-pill ${filterTab === 'EN_RAMPA' ? 'active' : ''}`}
            onClick={() => setFilterTab('EN_RAMPA')}
          >
            En Rampa ({kpis.enRampa})
          </button>
          <button 
            type="button" 
            className={`filter-pill ${filterTab === 'PENDIENTES' ? 'active' : ''}`}
            onClick={() => setFilterTab('PENDIENTES')}
          >
            Pendientes ({kpis.pendientes})
          </button>
          <button 
            type="button" 
            className={`filter-pill ${filterTab === 'DESEMRAMPADAS' ? 'active' : ''}`}
            onClick={() => setFilterTab('DESEMRAMPADAS')}
          >
            Desemrampadas ({kpis.desemrampadas})
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
          {isSavingCloud ? 'Guardando en la nube...' : 'Guardado automático independiente activo'}
        </div>
      </div>

      <div className="emrampe-table-wrapper desktop-only">
        <table className="emrampe-table">
          <thead>
            <tr>
              <th>UNIDAD</th>
              <th>NUM DE CARGA</th>
              <th>OPERADOR</th>
              <th>RAMPA</th>
              <th>DESTINO</th>
              <th>HORA DE EMRAMPE</th>
              <th>HORA DE DESEMRAMPE</th>
              <th>PATIERO</th>
              <th style={{ textAlign: 'center' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan="9" className="emrampe-empty-cell">
                  <Warehouse size={32} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                  <div>No se encontraron registros de emrampe con los filtros actuales.</div>
                  {!corteEnConsulta && (
                    <button type="button" className="btn-emrampe-link" onClick={openNewModal}>
                      + Registrar primer emrampe
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredUnits.map((u) => {
                const isEnRampa = Boolean(u.horaEmrampe && !u.horaDesemrampe);
                const isDesemrampada = Boolean(u.horaDesemrampe);

                return (
                  <tr key={u.id} className={isEnRampa ? 'row-en-rampa' : isDesemrampada ? 'row-desemrampada' : ''}>
                    <td>
                      <span className="eco-pill-emrampe">
                        ECO {u.economico}
                      </span>
                    </td>
                    <td>
                      <span className="emrampe-carga-text">
                        {u.numCarga || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="emrampe-operador-text">
                        {u.operador || 'Sin asignar'}
                      </span>
                    </td>
                    <td>
                      {renderRampaBadge(u.cortina)}
                    </td>
                    <td>
                      <span className="emrampe-destino-text">
                        {u.destino || 'Sin definir'}
                      </span>
                    </td>
                    <td>
                      {u.horaEmrampe ? (
                        <span className="hora-emrampe-badge">
                          <Clock size={13} />
                          {u.horaEmrampe}
                        </span>
                      ) : !corteEnConsulta ? (
                        <button 
                          type="button" 
                          className="btn-quick-emrampe"
                          onClick={() => handleQuickEmrampar(u)}
                          title="Fijar hora actual como emrampe"
                        >
                          Emrampar
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      {u.horaDesemrampe ? (
                        <span className="hora-desemrampe-badge">
                          <CheckCircle2 size={13} />
                          {u.horaDesemrampe}
                        </span>
                      ) : u.horaEmrampe && !corteEnConsulta ? (
                        <button 
                          type="button" 
                          className="btn-quick-desemrampe"
                          onClick={() => handleQuickDesemrampar(u)}
                          title="Fijar hora actual como desemrampe"
                        >
                          Desemrampar
                        </button>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className="patiero-text">
                        {u.patiero || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="emrampe-row-actions">
                        <button 
                          type="button" 
                          className="btn-icon-action"
                          onClick={() => openEditModal(u)}
                          title="Editar información"
                          disabled={Boolean(corteEnConsulta)}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          type="button" 
                          className="btn-icon-action btn-icon-delete"
                          disabled={Boolean(corteEnConsulta)}
                          onClick={() => {
                            showConfirm({
                              title: `¿Eliminar registro ECO ${u.economico}?`,
                              message: 'Esta acción removerá el registro de la tabla de Control de Emrampe.',
                              confirmText: 'Sí, eliminar',
                              confirmType: 'danger',
                              onConfirm: () => handleRemoveEmrampe(u)
                            });
                          }}
                          title="Eliminar registro"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="emrampe-cards-list mobile-only">
        {filteredUnits.length === 0 ? (
          <div className="emrampe-empty-mobile">
            <Warehouse size={40} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
            <p>No hay registros de emrampe para mostrar.</p>
            {!corteEnConsulta && (
              <button type="button" className="btn-emrampe-primary" onClick={openNewModal} style={{ marginTop: '0.75rem' }}>
                <Plus size={16} />
                <span>Nuevo Emrampe</span>
              </button>
            )}
          </div>
        ) : (
          filteredUnits.map((u) => {
            const isEnRampa = Boolean(u.horaEmrampe && !u.horaDesemrampe);
            const isDesemrampada = Boolean(u.horaDesemrampe);

            return (
              <div 
                key={u.id} 
                className={`emrampe-mobile-card ${isEnRampa ? 'card-en-rampa' : isDesemrampada ? 'card-desemrampada' : ''}`}
              >
                <div className="card-top-row">
                  <div className="card-eco-wrap">
                    <span className="eco-pill-emrampe">ECO {u.economico}</span>
                    {renderRampaBadge(u.cortina)}
                  </div>
                  <div className="card-status-indicator">
                    {isDesemrampada ? (
                      <span className="status-tag tag-desemrampada">DESEMRAMPADA</span>
                    ) : isEnRampa ? (
                      <span className="status-tag tag-en-rampa">EN RAMPA</span>
                    ) : (
                      <span className="status-tag tag-pendiente">PENDIENTE</span>
                    )}
                  </div>
                </div>

                <div className="card-details-grid">
                  <div className="card-detail-item">
                    <span className="card-detail-lbl">Carga:</span>
                    <span className="card-detail-val">{u.numCarga || '—'}</span>
                  </div>

                  <div className="card-detail-item">
                    <span className="card-detail-lbl">Destino:</span>
                    <span className="card-detail-val">{u.destino || 'Sin definir'}</span>
                  </div>

                  <div className="card-detail-item full-width">
                    <span className="card-detail-lbl">Operador:</span>
                    <span className="card-detail-val">{u.operador || 'Sin asignar'}</span>
                  </div>
                </div>

                <div className="card-horas-strip">
                  <div className="card-hora-col">
                    <span className="hora-lbl">Emrampe</span>
                    {u.horaEmrampe ? (
                      <span className="hora-val-badge">
                        <Clock size={13} />
                        {u.horaEmrampe}
                      </span>
                    ) : !corteEnConsulta ? (
                      <button 
                        type="button" 
                        className="btn-card-emrampar"
                        onClick={() => handleQuickEmrampar(u)}
                      >
                        Emrampar
                      </button>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>—</span>
                    )}
                  </div>

                  <div className="card-hora-divider">
                    <ArrowRight size={14} color="#64748b" />
                  </div>

                  <div className="card-hora-col">
                    <span className="hora-lbl">Desemrampe</span>
                    {u.horaDesemrampe ? (
                      <span className="hora-val-badge badge-desemrampe">
                        <CheckCircle2 size={13} />
                        {u.horaDesemrampe}
                      </span>
                    ) : u.horaEmrampe && !corteEnConsulta ? (
                      <button 
                        type="button" 
                        className="btn-card-desemrampar"
                        onClick={() => handleQuickDesemrampar(u)}
                      >
                        Desemrampar
                      </button>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>—</span>
                    )}
                  </div>
                </div>

                <div className="card-footer-strip">
                  <div className="card-patiero-info">
                    <User size={13} color="#38bdf8" />
                    <span>Patio: <strong>{u.patiero || '—'}</strong></span>
                  </div>

                  {!corteEnConsulta && (
                    <div className="card-actions">
                      <button 
                        type="button" 
                        className="btn-card-action"
                        onClick={() => openEditModal(u)}
                        title="Editar"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button 
                        type="button" 
                        className="btn-card-action btn-card-delete"
                        onClick={() => {
                          showConfirm({
                            title: `¿Eliminar ECO ${u.economico}?`,
                            message: 'Se removerá el registro de emrampe.',
                            confirmText: 'Sí, eliminar',
                            confirmType: 'danger',
                            onConfirm: () => handleRemoveEmrampe(u)
                          });
                        }}
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {isSaveCorteModalOpen && (
        <div className="emrampe-modal-overlay" onClick={() => setIsSaveCorteModalOpen(false)}>
          <div className="emrampe-modal-card" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="emrampe-modal-header">
              <div className="modal-title-wrap">
                <FolderCheck size={20} color="#34d399" />
                <h3>Guardar Corte de Emrampe</h3>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setIsSaveCorteModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmGuardarCorte} className="emrampe-modal-form">
              <div className="form-group-emrampe">
                <label>Nombre del Corte *</label>
                <input
                  type="text"
                  required
                  value={corteForm.nombre}
                  onChange={(e) => setCorteForm(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej. Corte Matutino Patio"
                  className="emrampe-input"
                />
              </div>

              <div className="form-group-emrampe">
                <label>Fecha del Corte</label>
                <input
                  type="date"
                  value={corteForm.fecha}
                  onChange={(e) => setCorteForm(prev => ({ ...prev, fecha: e.target.value }))}
                  className="emrampe-input"
                />
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: '#e2e8f0'
              }}>
                <input
                  type="checkbox"
                  checked={corteForm.limpiarTablero}
                  onChange={(e) => setCorteForm(prev => ({ ...prev, limpiarTablero: e.target.checked }))}
                />
                <span>Limpiar tablero activo al guardar (iniciar nuevo turno/día)</span>
              </label>

              <div className="emrampe-modal-footer">
                <button type="button" className="btn-emrampe-cancel" onClick={() => setIsSaveCorteModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-emrampe-submit">
                  <Save size={16} />
                  <span>Guardar en Historial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isHistorialModalOpen && (
        <div className="emrampe-modal-overlay" onClick={() => setIsHistorialModalOpen(false)}>
          <div className="emrampe-modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="emrampe-modal-header">
              <div className="modal-title-wrap">
                <History size={20} color="#38bdf8" />
                <h3>Historial de Control de Emrampe ({historial.length})</h3>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setIsHistorialModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1rem 1.25rem', maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {historial.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
                  No hay cortes guardados de Control de Emrampe todavía.
                </div>
              ) : (
                historial.map((corte) => (
                  <div
                    key={corte.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      borderRadius: '10px',
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.92rem' }}>
                        {corte.nombre}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        Fecha: {corte.fecha} · {corte.totalRegistros} registro(s) · {corte.totalDesemrampados} desemrampada(s)
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCorteEnConsulta(corte);
                          setIsHistorialModalOpen(false);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.7rem',
                          borderRadius: '7px',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={14} />
                        Consultar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExportExcel(corte.registros || [], corte.nombre)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.4rem 0.7rem',
                          borderRadius: '7px',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          background: 'rgba(16, 185, 129, 0.15)',
                          color: '#34d399',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <FileSpreadsheet size={14} />
                        Excel
                      </button>

                      <button
                        type="button"
                        className="btn-icon-action btn-icon-delete"
                        onClick={() => {
                          showConfirm({
                            title: `¿Eliminar "${corte.nombre}"?`,
                            message: 'Se eliminará este corte del historial de Control de Emrampe.',
                            confirmText: 'Sí, eliminar',
                            confirmType: 'danger',
                            onConfirm: () => handleDeleteCorte(corte)
                          });
                        }}
                        title="Eliminar corte"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="emrampe-modal-overlay" onClick={closeModal}>
          <div className="emrampe-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="emrampe-modal-header">
              <div className="modal-title-wrap">
                <Warehouse size={20} color="var(--accent-cyan)" />
                <h3>{editingUnitId ? 'Editar Emrampe' : 'Nuevo Emrampe'}</h3>
              </div>
              <div className="modal-header-actions-right">
                <button 
                  type="submit" 
                  form="form-emrampe" 
                  className="btn-modal-header-save"
                  title="Guardar registro de emrampe"
                >
                  <Save size={15} />
                  <span>Guardar</span>
                </button>
                <button type="button" className="btn-modal-close" onClick={closeModal} title="Cerrar">
                  <X size={18} />
                </button>
              </div>
            </div>

            <form id="form-emrampe" onSubmit={handleSaveForm} className="emrampe-modal-form">
              <div className="form-group-emrampe">
                <label>Número de Unidad (ECO) *</label>
                <input 
                  type="text" 
                  placeholder="Ej. 5054"
                  required
                  value={formData.economico}
                  onChange={(e) => handleEcoChange(e.target.value)}
                  className="emrampe-input"
                  autoFocus={!editingUnitId}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group-emrampe">
                  <label>Num de Carga</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Carga 1, 95123..."
                    value={formData.numCarga}
                    onChange={(e) => setFormData({ ...formData, numCarga: e.target.value })}
                    className="emrampe-input"
                  />
                </div>

                <div className="form-group-emrampe">
                  <label>Destino</label>
                  <input 
                    type="text" 
                    placeholder="Ej. San Cristóbal, Cárdenas, BDR Santa Ana..."
                    value={formData.destino}
                    onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    className="emrampe-input"
                  />
                </div>
              </div>

              <div className="form-group-emrampe">
                <label>Operador Asignado</label>
                <OperadorSelector 
                  value={formData.operador}
                  onChange={(nombre) => setFormData(prev => ({ ...prev, operador: nombre }))}
                  placeholder="Buscar operador por nombre..."
                  soloCatalogo={true}
                />
              </div>

              <div className="form-group-emrampe rampa-section-card">
                <div className="rampa-header-flex">
                  <label style={{ margin: 0, fontWeight: 800 }}>Rampa / Cortina</label>
                  {formData.cortina && (
                    <span className="selected-rampa-preview">
                      Seleccionada: <strong style={{ color: '#fff' }}>{formData.cortina}</strong>
                      {detectarZonaRampa(formData.cortina) && (
                        <span className={`preview-zona-tag preview-zona-${detectarZonaRampa(formData.cortina)}`}>
                          {detectarZonaRampa(formData.cortina).toUpperCase()}
                        </span>
                      )}
                    </span>
                  )}
                </div>

                <div className="rampa-input-with-clear">
                  <input 
                    type="text" 
                    placeholder="Selecciona abajo o escribe rampa..."
                    value={formData.cortina}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ ...formData, cortina: val });
                      const autoZona = detectarZonaRampa(val);
                      if (autoZona) setZonaRampa(autoZona);
                    }}
                    className="emrampe-input"
                  />
                  {formData.cortina && (
                    <button 
                      type="button" 
                      className="btn-clear-rampa" 
                      onClick={() => setFormData({ ...formData, cortina: '' })}
                      title="Quitar rampa"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                <div className="rampa-zonas-tabs">
                  <button 
                    type="button"
                    className={`rampa-zona-btn zona-recibo ${zonaRampa === 'recibo' ? 'active' : ''}`}
                    onClick={() => setZonaRampa('recibo')}
                  >
                    <span className="zona-badge-dot dot-recibo"></span>
                    Recibo (1-16 / R1-R6)
                  </button>

                  <button 
                    type="button"
                    className={`rampa-zona-btn zona-embarque ${zonaRampa === 'embarque' ? 'active' : ''}`}
                    onClick={() => setZonaRampa('embarque')}
                  >
                    <span className="zona-badge-dot dot-embarque"></span>
                    Embarque (17-32 / S1-S6)
                  </button>

                  <button 
                    type="button"
                    className={`rampa-zona-btn zona-ds ${zonaRampa === 'ds' ? 'active' : ''}`}
                    onClick={() => setZonaRampa('ds')}
                  >
                    <span className="zona-badge-dot dot-ds"></span>
                    DS (1, 2, 3)
                  </button>
                </div>

                <div className="rampa-pills-container">
                  {zonaRampa === 'recibo' && (
                    <>
                      <div className="rampa-subgroup-label">Cortinas Numéricas (1 al 16):</div>
                      <div className="rampa-pills-grid">
                        {CATALOGO_RAMPAS.recibo.numericas.map(r => {
                          const ocupadaEco = rampasOcupadas.get(r.toUpperCase());
                          return (
                            <button 
                              key={r}
                              type="button" 
                              className={`rampa-pill-btn pill-recibo ${formData.cortina === r ? 'active' : ''} ${ocupadaEco ? 'pill-ocupada' : ''}`}
                              onClick={() => setFormData({ ...formData, cortina: r })}
                              title={ocupadaEco ? `En rampa: ECO ${ocupadaEco}` : `Rampa ${r}`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>

                      <div className="rampa-subgroup-label" style={{ marginTop: '0.45rem' }}>Especiales Recibo (R1 a R6):</div>
                      <div className="rampa-pills-grid rampa-pills-esp">
                        {CATALOGO_RAMPAS.recibo.especiales.map(r => {
                          const ocupadaEco = rampasOcupadas.get(r.toUpperCase());
                          return (
                            <button 
                              key={r}
                              type="button" 
                              className={`rampa-pill-btn pill-recibo-esp ${formData.cortina === r ? 'active' : ''} ${ocupadaEco ? 'pill-ocupada' : ''}`}
                              onClick={() => setFormData({ ...formData, cortina: r })}
                              title={ocupadaEco ? `En rampa: ECO ${ocupadaEco}` : `Rampa ${r}`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {zonaRampa === 'embarque' && (
                    <>
                      <div className="rampa-subgroup-label">Cortinas Embarque (17 al 32):</div>
                      <div className="rampa-pills-grid">
                        {CATALOGO_RAMPAS.embarque.numericas.map(r => {
                          const ocupadaEco = rampasOcupadas.get(r.toUpperCase());
                          return (
                            <button 
                              key={r}
                              type="button" 
                              className={`rampa-pill-btn pill-embarque ${formData.cortina === r ? 'active' : ''} ${ocupadaEco ? 'pill-ocupada' : ''}`}
                              onClick={() => setFormData({ ...formData, cortina: r })}
                              title={ocupadaEco ? `En rampa: ECO ${ocupadaEco}` : `Rampa ${r}`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>

                      <div className="rampa-subgroup-label" style={{ marginTop: '0.45rem' }}>Especiales Embarque (S1 a S6):</div>
                      <div className="rampa-pills-grid rampa-pills-esp">
                        {CATALOGO_RAMPAS.embarque.especiales.map(r => {
                          const ocupadaEco = rampasOcupadas.get(r.toUpperCase());
                          return (
                            <button 
                              key={r}
                              type="button" 
                              className={`rampa-pill-btn pill-embarque-esp ${formData.cortina === r ? 'active' : ''} ${ocupadaEco ? 'pill-ocupada' : ''}`}
                              onClick={() => setFormData({ ...formData, cortina: r })}
                              title={ocupadaEco ? `En rampa: ECO ${ocupadaEco}` : `Rampa ${r}`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {zonaRampa === 'ds' && (
                    <>
                      <div className="rampa-subgroup-label">Rampas DS (Descarga / Especial):</div>
                      <div className="rampa-pills-grid rampa-pills-ds">
                        {CATALOGO_RAMPAS.ds.especiales.map(r => {
                          const ocupadaEco = rampasOcupadas.get(r.toUpperCase());
                          return (
                            <button 
                              key={r}
                              type="button" 
                              className={`rampa-pill-btn pill-ds ${formData.cortina === r ? 'active' : ''} ${ocupadaEco ? 'pill-ocupada' : ''}`}
                              onClick={() => setFormData({ ...formData, cortina: r })}
                              title={ocupadaEco ? `En rampa: ECO ${ocupadaEco}` : `Rampa ${r}`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group-emrampe">
                  <div className="label-with-action">
                    <label>Hora de Emrampe</label>
                    <button 
                      type="button" 
                      className="btn-set-now"
                      onClick={() => setFormData({ ...formData, horaEmrampe: getHoraActual() })}
                    >
                      Ahora
                    </button>
                  </div>
                  <input 
                    type="time" 
                    value={formData.horaEmrampe}
                    onChange={(e) => setFormData({ ...formData, horaEmrampe: e.target.value })}
                    className="emrampe-input"
                  />
                </div>

                <div className="form-group-emrampe">
                  <div className="label-with-action">
                    <label>Hora de Desemrampe</label>
                    <button 
                      type="button" 
                      className="btn-set-now"
                      onClick={() => setFormData({ ...formData, horaDesemrampe: getHoraActual() })}
                    >
                      Ahora
                    </button>
                  </div>
                  <input 
                    type="time" 
                    value={formData.horaDesemrampe}
                    onChange={(e) => setFormData({ ...formData, horaDesemrampe: e.target.value })}
                    className="emrampe-input"
                  />
                </div>
              </div>

              <div className="form-group-emrampe">
                <label>Patio (Nombre del Patiero / Auxiliar)</label>
                <input 
                  type="text" 
                  placeholder="Nombre del patiero o auxiliar encargado..."
                  value={formData.patiero}
                  onChange={(e) => setFormData({ ...formData, patiero: e.target.value })}
                  className="emrampe-input"
                />
              </div>

              <div className="emrampe-modal-footer">
                <button type="button" className="btn-emrampe-cancel" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-emrampe-submit">
                  <Save size={16} />
                  <span>Guardar Emrampe</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
