import React, { useState, useEffect, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { fetchPlanesColocacionDb, savePlanColocacionDb, isSupabaseConfigured } from '../lib/supabaseClient';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Copy, 
  Edit3, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Boxes, 
  Truck, 
  FileWarning, 
  ClipboardList, 
  Cloud,
  CloudOff,
  RefreshCw,
  Sparkles,
  Save,
  X
} from 'lucide-react';

const STORAGE_KEY = 'baz_plan_colocacion_records_v1';

const DEFAULT_CATEGORIES = [
  { id: 1, categoria: 'Italikas', cantidad: 0 },
  { id: 2, categoria: 'Conectividad', cantidad: 0 },
  { id: 3, categoria: 'Colchones y Box', cantidad: 0 },
  { id: 4, categoria: 'Entretenimiento', cantidad: 0 },
  { id: 5, categoria: 'Muebles y Hogar', cantidad: 0 },
  { id: 6, categoria: 'LB Enseres', cantidad: 0 }
];

const DEFAULT_PV_FILAS = [
  { tipo: 'Camiones', activas: 8, taller: 5 },
  { tipo: 'Rabones', activas: 12, taller: 7 },
  { tipo: 'Tracto', activas: 1, taller: 0 },
  { tipo: 'Fulles', activas: 0, taller: 0 }
];

const getEmptyPvFilas = () => [
  { tipo: 'Camiones', activas: 0, taller: 0 },
  { tipo: 'Rabones', activas: 0, taller: 0 },
  { tipo: 'Tracto', activas: 0, taller: 0 },
  { tipo: 'Fulles', activas: 0, taller: 0 }
];

const DEFAULT_HC_FILAS = [
  { tipo: 'Op. Camioneta', autorizado: 15, activo: 13, vacantes: 1, incapacidades: 1 },
  { tipo: 'Op. RM', autorizado: 19, activo: 16, vacantes: 2, incapacidades: 1 },
  { tipo: 'Op. Tractor', autorizado: 1, activo: 1, vacantes: 0, incapacidades: 0 },
  { tipo: 'Op. Fuller', autorizado: 0, activo: 0, vacantes: 0, incapacidades: 0 },
  { tipo: 'Auxiliares', autorizado: 25, activo: 23, vacantes: 1, incapacidades: 1 }
];

const getEmptyHcFilas = () => [
  { tipo: 'Op. Camioneta', autorizado: 0, activo: 0, vacantes: 0, incapacidades: 0 },
  { tipo: 'Op. RM', autorizado: 0, activo: 0, vacantes: 0, incapacidades: 0 },
  { tipo: 'Op. Tractor', autorizado: 0, activo: 0, vacantes: 0, incapacidades: 0 },
  { tipo: 'Op. Fuller', autorizado: 0, activo: 0, vacantes: 0, incapacidades: 0 },
  { tipo: 'Auxiliares', autorizado: 0, activo: 0, vacantes: 0, incapacidades: 0 }
];

const formatDateToSpanish = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  return `${day} DE ${meses[date.getMonth()]} DE ${year}`;
};

const getNextDayShort = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const nextDate = new Date(year, month - 1, day + 1);
  const meses = [
    'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
    'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
  ];
  return `${nextDate.getDate()} ${meses[nextDate.getMonth()]}`;
};

const getNextDayFormatted = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const nextDate = new Date(year, month - 1, day + 1);
  const meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  return `TOTAL PLAN DE CARGAS N-02 ${nextDate.getDate()} ${meses[nextDate.getMonth()]} ${nextDate.getFullYear()}`;
};

const getEmptyRecord = (targetDate) => ({
  fecha: targetDate,
  fechaTexto: formatDateToSpanish(targetDate),
  plaza: 'VILLAHERMOSA',
  kpis: {
    planProgramado: 0,
    cargasEjecutadas: 0,
    pendientes: 0,
    cumplimiento: 0,
    metrosRemisionados: 0
  },
  cargasEjecutadas: [],
  piezas: {
    ppes: 0,
    dotCom: 0,
    categorias: DEFAULT_CATEGORIES.map((c) => ({ ...c }))
  },
  comportamiento: {
    promedioDiarioAsignadoFC: 0,
    promedioDiarioOperado: 0,
    remisionadoAcumulado: 0
  },
  planProximo: {
    titulo: getNextDayFormatted(targetDate),
    cargasProgramadas: 0,
    cargasPendientes: [],
    resumenFolio: '',
    resumenM3: '',
    observacionPendientes: ''
  },
  pvActivo: {
    filas: getEmptyPvFilas()
  },
  headcount: {
    filas: getEmptyHcFilas()
  },
  observacionesGenerales: ''
});

const cleanNumericInput = (val, isDecimal = false) => {
  if (val === undefined || val === null) return '';
  const str = String(val);
  let cleaned = isDecimal ? str.replace(/[^0-9.]/g, '') : str.replace(/[^0-9]/g, '');
  if (isDecimal) {
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
  } else if (cleaned.length > 1 && cleaned.startsWith('0')) {
    cleaned = cleaned.replace(/^0+/, '');
  }
  return cleaned;
};

const BoxParcelIcon = () => (
  <svg width="38" height="38" viewBox="0 0 48 48" fill="none" className="parcel-svg-icon">
    <path d="M24 4L42 14L24 24L6 14L24 4Z" fill="#d99859" stroke="#b46f2e" strokeWidth="1.5" />
    <path d="M6 14L24 24V44L6 33V14Z" fill="#b97635" stroke="#92531a" strokeWidth="1.5" />
    <path d="M24 24L42 14V33L24 44V24Z" fill="#c78440" stroke="#92531a" strokeWidth="1.5" />
    <path d="M24 4L24 24M24 24V44" stroke="#edd2b4" strokeWidth="2.2" strokeOpacity="0.85" />
    <path d="M15 9L33 19" stroke="#edd2b4" strokeWidth="2.2" strokeOpacity="0.85" />
  </svg>
);

const normalizeRecord = (raw, dateKey) => {
  const targetDate = (raw && raw.fecha) || dateKey || '2026-10-12';
  if (!raw || typeof raw !== 'object') {
    return getEmptyRecord(targetDate);
  }

  const rawKpis = raw.kpis || {};
  const planProg = rawKpis.planProgramado !== undefined && rawKpis.planProgramado !== ''
    ? Number(rawKpis.planProgramado) || 0
    : 0;

  const rawCargas = Array.isArray(raw.cargasEjecutadas)
    ? raw.cargasEjecutadas
    : [];
  const cargasEjec = rawCargas.map((c, i) => ({
    id: c.id ?? i + 1,
    destino: c.destino || '',
    tipo: c.tipo || 'Foráneo',
    capacidad: Number(c.capacidad) || 0,
    linea: c.linea || 'VALLEY',
    estatus: c.estatus || 'Ejecutada'
  }));

  const ejecCount = rawKpis.cargasEjecutadas !== undefined && rawKpis.cargasEjecutadas !== ''
    ? Number(rawKpis.cargasEjecutadas) || 0
    : cargasEjec.length;

  const pendCount = rawKpis.pendientes !== undefined && rawKpis.pendientes !== ''
    ? Number(rawKpis.pendientes) || 0
    : Math.max(0, planProg - ejecCount);

  const cumpl = rawKpis.cumplimiento !== undefined && rawKpis.cumplimiento !== ''
    ? Number(rawKpis.cumplimiento) || 0
    : (planProg > 0 ? Number(((ejecCount / planProg) * 100).toFixed(1)) : 0);

  const totalMetros = cargasEjec.reduce((acc, c) => acc + (Number(c.capacidad) || 0), 0);

  const metrosRem = rawKpis.metrosRemisionados !== undefined && rawKpis.metrosRemisionados !== ''
    ? Number(rawKpis.metrosRemisionados) || 0
    : totalMetros;

  const rawCategorias = Array.isArray(raw.piezas?.categorias)
    ? raw.piezas.categorias
    : DEFAULT_CATEGORIES;
  const categorias = rawCategorias.map((cat, i) => ({
    id: cat.id ?? i + 1,
    categoria: cat.categoria || '',
    cantidad: Number(cat.cantidad) || 0
  }));

  const rawPendientes = Array.isArray(raw.planProximo?.cargasPendientes)
    ? raw.planProximo.cargasPendientes
    : [];
  const cargasPendientes = rawPendientes.map((p, i) => ({
    id: p.id ?? i + 1,
    folioDestino: p.folioDestino || '',
    capacidad: Number(p.capacidad) || 0,
    observacion: p.observacion || ''
  }));

  const rawPiezas = raw.piezas || {};
  const rawComp = raw.comportamiento || {};
  const rawPlanProx = raw.planProximo || {};

  const PV_ORDER = ['Camiones', 'Rabones', 'Tracto', 'Fulles'];
  const rawPv = raw.pvActivo || {};
  const rawFilas = Array.isArray(rawPv.filas) ? rawPv.filas : null;
  const pvFilas = PV_ORDER.map((tipo) => {
    const found = rawFilas
      ? rawFilas.find((f) => {
          const t = String(f.tipo || '').toLowerCase();
          if (tipo === 'Camiones') return t.includes('camion');
          if (tipo === 'Rabones') return t.includes('rabon') || t.includes('rabón');
          if (tipo === 'Tracto') return t === 'tracto' || t.includes('sencillo');
          if (tipo === 'Fulles') return t.includes('full');
          return t === tipo.toLowerCase();
        })
      : null;
    const fallback = DEFAULT_PV_FILAS.find((f) => f.tipo.toLowerCase() === tipo.toLowerCase()) || { activas: 0, taller: 0 };
    return {
      tipo,
      activas: found ? (Number(found.activas) || 0) : fallback.activas,
      taller: found ? (Number(found.taller) || 0) : fallback.taller
    };
  });

  const pvActivo = {
    filas: pvFilas
  };

  const HC_ORDER = ['Op. Camioneta', 'Op. RM', 'Op. Tractor', 'Op. Fuller', 'Auxiliares'];
  const rawHc = raw.headcount || {};
  const rawHcFilas = Array.isArray(rawHc.filas) ? rawHc.filas : null;
  const hcFilas = HC_ORDER.map((tipo) => {
    const found = rawHcFilas
      ? rawHcFilas.find((f) => {
          const t = String(f.tipo || '').toLowerCase();
          if (tipo === 'Op. Camioneta') return t.includes('camion') || t.includes('camioneta');
          if (tipo === 'Op. RM') return t.includes('rm') || t.includes('rabon') || t.includes('rabón') || t.includes('medio');
          if (tipo === 'Op. Tractor') return t.includes('tractor') || t === 'tracto' || t.includes('sencillo');
          if (tipo === 'Op. Fuller') return t.includes('full') || t.includes('fuller');
          if (tipo === 'Auxiliares') return t.includes('auxiliar') || t.includes('ayudante');
          return t === tipo.toLowerCase();
        })
      : null;
    const fallback = DEFAULT_HC_FILAS.find((f) => f.tipo.toLowerCase() === tipo.toLowerCase()) || { autorizado: 0, activo: 0, vacantes: 0, incapacidades: 0 };
    return {
      tipo,
      autorizado: found ? (Number(found.autorizado) || 0) : fallback.autorizado,
      activo: found ? (Number(found.activo) || 0) : fallback.activo,
      vacantes: found ? (Number(found.vacantes) || 0) : fallback.vacantes,
      incapacidades: found ? (Number(found.incapacidades) || 0) : fallback.incapacidades
    };
  });

  const headcount = {
    filas: hcFilas
  };

  return {
    fecha: targetDate,
    fechaTexto: raw.fechaTexto || formatDateToSpanish(targetDate),
    plaza: raw.plaza || 'VILLAHERMOSA',
    updatedAt: raw.updatedAt || undefined,
    kpis: {
      planProgramado: planProg,
      cargasEjecutadas: ejecCount,
      pendientes: pendCount,
      cumplimiento: cumpl,
      metrosRemisionados: metrosRem
    },
    cargasEjecutadas: cargasEjec,
    piezas: {
      ppes: rawPiezas.ppes !== undefined && rawPiezas.ppes !== '' ? Number(rawPiezas.ppes) || 0 : 0,
      dotCom: rawPiezas.dotCom !== undefined && rawPiezas.dotCom !== '' ? Number(rawPiezas.dotCom) || 0 : 0,
      categorias
    },
    comportamiento: {
      promedioDiarioAsignadoFC: rawComp.promedioDiarioAsignadoFC !== undefined && rawComp.promedioDiarioAsignadoFC !== ''
        ? Number(rawComp.promedioDiarioAsignadoFC) || 0
        : 0,
      promedioDiarioOperado: rawComp.promedioDiarioOperado !== undefined && rawComp.promedioDiarioOperado !== ''
        ? Number(rawComp.promedioDiarioOperado) || 0
        : 0,
      remisionadoAcumulado: rawComp.remisionadoAcumulado !== undefined && rawComp.remisionadoAcumulado !== ''
        ? Number(rawComp.remisionadoAcumulado) || 0
        : 0
    },
    planProximo: {
      titulo: rawPlanProx.titulo || getNextDayFormatted(targetDate),
      cargasProgramadas: rawPlanProx.cargasProgramadas !== undefined && rawPlanProx.cargasProgramadas !== ''
        ? Number(rawPlanProx.cargasProgramadas) || 0
        : 0,
      resumenFolio: rawPlanProx.resumenFolio !== undefined ? String(rawPlanProx.resumenFolio) : '',
      resumenM3: rawPlanProx.resumenM3 !== undefined ? String(rawPlanProx.resumenM3) : '',
      observacionPendientes: rawPlanProx.observacionPendientes !== undefined 
        ? String(rawPlanProx.observacionPendientes) 
        : '',
      cargasPendientes
    },
    pvActivo,
    headcount,
    observacionesGenerales: raw.observacionesGenerales !== undefined 
      ? raw.observacionesGenerales 
      : ''
  };
};

export const PlanColocacionView = () => {
  const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [records, setRecords] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch {}
    return {};
  });

  const [currentDate, setCurrentDate] = useState(() => {
    try {
      const savedLast = window.localStorage.getItem('baz_plan_colocacion_active_date');
      if (savedLast) return savedLast;
    } catch {}
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const handleDateChange = (newDate) => {
    if (!newDate) return;
    setCurrentDate(newDate);
    try {
      window.localStorage.setItem('baz_plan_colocacion_active_date', newDate);
    } catch {}
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [activeTab, setActiveTab] = useState('kpis');
  const [toastMessage, setToastMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const [cloudStatus, setCloudStatus] = useState(isSupabaseConfigured() ? 'loading' : 'offline');

  const flyerRef = useRef(null);

  const applyCloudRows = (rows) => {
    if (!rows) {
      setCloudStatus('error');
      return;
    }
    setRecords((prev) => {
      const next = { ...prev };
      rows.forEach((row) => {
        if (!row.fecha) return;
        next[row.fecha] = normalizeRecord({ ...row.datos, updatedAt: row.updated_at }, row.fecha);
      });
      return next;
    });
    setCloudStatus('synced');
  };

  const loadFromCloud = async () => {
    if (!isSupabaseConfigured()) {
      setCloudStatus('offline');
      return;
    }
    setCloudStatus('loading');
    applyCloudRows(await fetchPlanesColocacionDb());
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    fetchPlanesColocacionDb().then(applyCloudRows);
  }, []);

  const persistToCloud = async (record) => {
    if (!isSupabaseConfigured()) {
      setCloudStatus('offline');
      return false;
    }
    setCloudStatus('saving');
    try {
      await savePlanColocacionDb(record.fecha, record);
      setCloudStatus('synced');
      return true;
    } catch {
      setCloudStatus('error');
      return false;
    }
  };

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      return;
    }
  }, [records]);

  const showToast = (msg) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const currentData = useMemo(() => {
    return normalizeRecord(records[currentDate], currentDate);
  }, [records, currentDate]);

  const savedDates = useMemo(() => Object.keys(records).sort().reverse(), [records]);

  const handlePrevDay = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    handleDateChange(toDateKey(new Date(y, m - 1, d - 1)));
  };

  const handleNextDay = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    handleDateChange(toDateKey(new Date(y, m - 1, d + 1)));
  };

  const handleToday = () => {
    handleDateChange(toDateKey(new Date()));
  };

  const handleOpenEdit = (tab = 'kpis') => {
    const base = normalizeRecord(currentData, currentDate);
    setEditForm({
      ...base,
      kpis: {
        planProgramado: String(base.kpis.planProgramado ?? ''),
        cargasEjecutadas: String(base.kpis.cargasEjecutadas ?? ''),
        pendientes: String(base.kpis.pendientes ?? ''),
        cumplimiento: String(base.kpis.cumplimiento ?? ''),
        metrosRemisionados: String(base.kpis.metrosRemisionados ?? '')
      },
      cargasEjecutadas: base.cargasEjecutadas.map((c) => ({
        ...c,
        capacidad: String(c.capacidad ?? '')
      })),
      piezas: {
        ppes: String(base.piezas?.ppes ?? ''),
        dotCom: String(base.piezas?.dotCom ?? ''),
        categorias: base.piezas.categorias.map((cat) => ({
          ...cat,
          cantidad: String(cat.cantidad ?? '')
        }))
      },
      comportamiento: {
        promedioDiarioAsignadoFC: String(base.comportamiento?.promedioDiarioAsignadoFC ?? ''),
        promedioDiarioOperado: String(base.comportamiento?.promedioDiarioOperado ?? ''),
        remisionadoAcumulado: String(base.comportamiento?.remisionadoAcumulado ?? '')
      },
      planProximo: {
        ...base.planProximo,
        cargasProgramadas: String(base.planProximo?.cargasProgramadas ?? ''),
        resumenFolio: String(base.planProximo?.resumenFolio ?? ''),
        resumenM3: String(base.planProximo?.resumenM3 ?? ''),
        observacionPendientes: String(base.planProximo?.observacionPendientes ?? ''),
        cargasPendientes: base.planProximo.cargasPendientes.map((p) => ({
          ...p,
          capacidad: String(p.capacidad ?? '')
        }))
      },
      pvActivo: {
        filas: (base.pvActivo?.filas || DEFAULT_PV_FILAS).map((f) => ({
          tipo: f.tipo,
          activas: String(f.activas ?? 0),
          taller: String(f.taller ?? 0)
        }))
      },
      headcount: {
        filas: (base.headcount?.filas || DEFAULT_HC_FILAS).map((f) => ({
          tipo: f.tipo,
          autorizado: String(f.autorizado ?? 0),
          activo: String(f.activo ?? 0),
          vacantes: String(f.vacantes ?? 0),
          incapacidades: String(f.incapacidades ?? 0)
        }))
      }
    });
    setIsEditing(true);
    setActiveTab(tab);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    try {
      const targetFecha = editForm.fecha || currentDate;
      const normalized = normalizeRecord(editForm, targetFecha);
      normalized.updatedAt = new Date().toISOString();

      setRecords((prev) => ({
        ...prev,
        [targetFecha]: normalized
      }));

      handleDateChange(targetFecha);

      setIsEditing(false);
      setEditForm(null);

      const ok = await persistToCloud(normalized);
      if (ok) {
        showToast(`¡Plan del ${formatDateToSpanish(targetFecha)} guardado en la nube!`);
      } else if (isSupabaseConfigured()) {
        showToast('Guardado en este equipo, pero falló la sincronización con la nube.');
      } else {
        showToast('Guardado localmente en este equipo.');
      }
    } catch {
      showToast('Error al guardar los datos del día.');
    }
  };

  const handleSaveDay = async () => {
    try {
      const normalized = normalizeRecord(currentData, currentDate);
      normalized.updatedAt = new Date().toISOString();

      setRecords((prev) => ({
        ...prev,
        [currentDate]: normalized
      }));

      const ok = await persistToCloud(normalized);
      if (ok) {
        showToast(`¡Día guardado en la nube con éxito! (${formatDateToSpanish(currentDate)})`);
      } else if (isSupabaseConfigured()) {
        showToast('Guardado en este equipo, pero falló la sincronización con Supabase.');
      } else {
        showToast('Guardado localmente en este equipo.');
      }
    } catch {
      showToast('Ocurrió un error al guardar el día.');
    }
  };

  const handleDownloadImage = async () => {
    if (!flyerRef.current) return;
    setIsExporting(true);
    showToast('Generando imagen de alta resolución...');

    try {
      const flyerEl = flyerRef.current;
      const flyerWidth = flyerEl.offsetWidth || 1260;
      const flyerHeight = flyerEl.offsetHeight;

      const canvas = await html2canvas(flyerEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: flyerWidth,
        height: flyerHeight,
        windowWidth: flyerWidth + 40,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0
      });

      const image = canvas.toDataURL('image/png');
      const link = window.document.createElement('a');
      link.href = image;
      link.download = `Plan_Colocacion_Villahermosa_${currentDate}.png`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      showToast('¡Imagen descargada exitosamente en alta definición!');
    } catch {
      showToast('Error al generar la imagen. Intenta nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!flyerRef.current) return;
    setIsExporting(true);
    showToast('Copiando infografía al portapapeles...');

    try {
      const flyerEl = flyerRef.current;
      const flyerWidth = flyerEl.offsetWidth || 1260;
      const flyerHeight = flyerEl.offsetHeight;

      const canvas = await html2canvas(flyerEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: flyerWidth,
        height: flyerHeight,
        windowWidth: flyerWidth + 40,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('No se pudo crear el archivo de imagen.');
          setIsExporting(false);
          return;
        }

        try {
          if (window.ClipboardItem && window.navigator.clipboard?.write) {
            const item = new window.ClipboardItem({ 'image/png': blob });
            await window.navigator.clipboard.write([item]);
            showToast('¡Imagen copiada al portapapeles! Lista para pegar (Ctrl+V) en WhatsApp o Teams.');
          } else {
            showToast('El navegador no soporta copiado directo. Usa Descargar PNG.');
          }
        } catch {
          showToast('No se pudo copiar directamente. Puedes usar el botón de Descargar Imagen.');
        } finally {
          setIsExporting(false);
        }
      }, 'image/png');
    } catch {
      showToast('No se pudo copiar directamente. Puedes usar el botón de Descargar Imagen.');
      setIsExporting(false);
    }
  };

  const handleKpiChange = (field, rawVal) => {
    const isDecimal = field === 'cumplimiento';
    const val = cleanNumericInput(rawVal, isDecimal);

    setEditForm((prev) => {
      const nextKpis = { ...prev.kpis, [field]: val };
      if (field === 'planProgramado' || field === 'cargasEjecutadas') {
        const prog = Number(field === 'planProgramado' ? val : nextKpis.planProgramado) || 0;
        const ejec = Number(field === 'cargasEjecutadas' ? val : nextKpis.cargasEjecutadas) || 0;
        nextKpis.pendientes = String(Math.max(0, prog - ejec));
        nextKpis.cumplimiento = prog > 0 ? String(Number(((ejec / prog) * 100).toFixed(1))) : '0';
      }
      return { ...prev, kpis: nextKpis };
    });
  };

  const handleNumericKeyDown = (e, currentValue, onChangeFn, step = 1, isDecimal = false) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const num = Number(currentValue) || 0;
      const next = isDecimal ? Number((num + step).toFixed(1)) : num + step;
      onChangeFn(String(next));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const num = Number(currentValue) || 0;
      const next = Math.max(0, isDecimal ? Number((num - step).toFixed(1)) : num - step);
      onChangeFn(String(next));
    }
  };

  const handleAddCarga = () => {
    setEditForm((prev) => {
      const newId = (prev.cargasEjecutadas.length > 0 ? Math.max(...prev.cargasEjecutadas.map((c) => c.id)) : 0) + 1;
      return {
        ...prev,
        cargasEjecutadas: [
          ...prev.cargasEjecutadas,
          { id: newId, destino: 'Nuevo Destino', tipo: 'Foráneo', capacidad: '50', linea: 'VALLEY', estatus: 'Ejecutada' }
        ]
      };
    });
  };

  const handleUpdateCarga = (id, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      cargasEjecutadas: prev.cargasEjecutadas.map((c) => {
        if (c.id === id) {
          const val = field === 'capacidad' ? cleanNumericInput(value) : value;
          return { ...c, [field]: val };
        }
        return c;
      })
    }));
  };

  const handleRemoveCarga = (id) => {
    setEditForm((prev) => ({
      ...prev,
      cargasEjecutadas: prev.cargasEjecutadas.filter((c) => c.id !== id)
    }));
  };

  const handleAddCategoriaPieza = () => {
    setEditForm((prev) => {
      const newId = (prev.piezas.categorias.length > 0 ? Math.max(...prev.piezas.categorias.map((c) => c.id)) : 0) + 1;
      return {
        ...prev,
        piezas: {
          ...prev.piezas,
          categorias: [
            ...prev.piezas.categorias,
            { id: newId, categoria: 'Nueva Categoría', cantidad: '0' }
          ]
        }
      };
    });
  };

  const handleUpdatePieza = (field, value) => {
    const cleaned = cleanNumericInput(value);
    setEditForm((prev) => ({
      ...prev,
      piezas: {
        ...prev.piezas,
        [field]: cleaned
      }
    }));
  };

  const handleUpdateCategoriaPieza = (id, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      piezas: {
        ...prev.piezas,
        categorias: prev.piezas.categorias.map((c) => {
          if (c.id === id) {
            const val = field === 'cantidad' ? cleanNumericInput(value) : value;
            return { ...c, [field]: val };
          }
          return c;
        })
      }
    }));
  };

  const handleRemoveCategoriaPieza = (id) => {
    setEditForm((prev) => ({
      ...prev,
      piezas: {
        ...prev.piezas,
        categorias: prev.piezas.categorias.filter((c) => c.id !== id)
      }
    }));
  };

  const handleUpdateComportamiento = (field, value) => {
    const cleaned = cleanNumericInput(value);
    setEditForm((prev) => ({
      ...prev,
      comportamiento: {
        ...prev.comportamiento,
        [field]: cleaned
      }
    }));
  };

  const handleUpdateCargasProgramadas = (value) => {
    const cleaned = cleanNumericInput(value);
    setEditForm((prev) => ({
      ...prev,
      planProximo: {
        ...prev.planProximo,
        cargasProgramadas: cleaned
      }
    }));
  };

  const handleAddCargaPendiente = () => {
    setEditForm((prev) => {
      const newId = (prev.planProximo.cargasPendientes.length > 0 ? Math.max(...prev.planProximo.cargasPendientes.map((c) => c.id)) : 0) + 1;
      return {
        ...prev,
        planProximo: {
          ...prev.planProximo,
          cargasPendientes: [
            ...prev.planProximo.cargasPendientes,
            { id: newId, folioDestino: 'CS00000000 - NUEVO DESTINO', capacidad: '50', observacion: 'MOTIVO / OBSERVACION' }
          ]
        }
      };
    });
  };

  const handleUpdateCargaPendiente = (id, field, value) => {
    setEditForm((prev) => ({
      ...prev,
      planProximo: {
        ...prev.planProximo,
        cargasPendientes: prev.planProximo.cargasPendientes.map((p) => {
          if (p.id === id) {
            const val = field === 'capacidad' ? cleanNumericInput(value) : value;
            return { ...p, [field]: val };
          }
          return p;
        })
      }
    }));
  };

  const handleRemoveCargaPendiente = (id) => {
    setEditForm((prev) => ({
      ...prev,
      planProximo: {
        ...prev.planProximo,
        cargasPendientes: prev.planProximo.cargasPendientes.filter((c) => c.id !== id)
      }
    }));
  };

  const handleUpdatePvFila = (tipo, field, value) => {
    const cleaned = cleanNumericInput(value);
    setEditForm((prev) => ({
      ...prev,
      pvActivo: {
        ...prev.pvActivo,
        filas: (prev.pvActivo?.filas || DEFAULT_PV_FILAS).map((f) => {
          if (f.tipo === tipo) {
            return { ...f, [field]: cleaned };
          }
          return f;
        })
      }
    }));
  };

  const handleUpdateHcFila = (tipo, field, value) => {
    const cleaned = cleanNumericInput(value);
    setEditForm((prev) => ({
      ...prev,
      headcount: {
        ...prev.headcount,
        filas: (prev.headcount?.filas || DEFAULT_HC_FILAS).map((f) => {
          if (f.tipo === tipo) {
            return { ...f, [field]: cleaned };
          }
          return f;
        })
      }
    }));
  };

  const totalCargasCount = currentData.cargasEjecutadas.length;
  const totalCargasMetros = currentData.cargasEjecutadas.reduce((acc, c) => acc + (Number(c.capacidad) || 0), 0);
  const totalPiezasCount = currentData.piezas.categorias.reduce((acc, cat) => acc + (Number(cat.cantidad) || 0), 0);
  const totalPendientesMetros = currentData.planProximo.cargasPendientes.reduce((acc, c) => acc + (Number(c.capacidad) || 0), 0);
  const cargasPendientesKpi = Number(currentData.kpis.pendientes) || 0;

  const pvFilas = currentData.pvActivo?.filas || DEFAULT_PV_FILAS;
  const pvSumActivas = pvFilas.reduce((acc, f) => acc + (Number(f.activas) || 0), 0);
  const pvSumTaller = pvFilas.reduce((acc, f) => acc + (Number(f.taller) || 0), 0);
  const pvSumTotal = pvSumActivas + pvSumTaller;
  const pvSumPct = pvSumTotal > 0 ? ((pvSumActivas / pvSumTotal) * 100).toFixed(1) : '0.0';

  const hcFilas = currentData.headcount?.filas || DEFAULT_HC_FILAS;
  const hcSumAutorizado = hcFilas.reduce((acc, f) => acc + (Number(f.autorizado) || 0), 0);
  const hcSumActivo = hcFilas.reduce((acc, f) => acc + (Number(f.activo) || 0), 0);
  const hcSumVacantes = hcFilas.reduce((acc, f) => acc + (Number(f.vacantes) || 0), 0);
  const hcSumIncapacidades = hcFilas.reduce((acc, f) => acc + (Number(f.incapacidades) || 0), 0);
  const hcSumPctActivo = hcSumAutorizado > 0 ? ((hcSumActivo / hcSumAutorizado) * 100).toFixed(1) : '0.0';
  const hcSumPctAutorizado = hcSumAutorizado > 0 ? (((hcSumAutorizado - hcSumVacantes) / hcSumAutorizado) * 100).toFixed(1) : '0.0';

  return (
    <div className="plan-colocacion-page">
      {toastMessage && (
        <div className="colocacion-toast">
          <Sparkles size={16} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="colocacion-topbar">
        <div className="colocacion-date-nav">
          <button className="btn btn-secondary btn-sm" onClick={handlePrevDay} title="Día anterior">
            <ChevronLeft size={16} />
          </button>
          
          <div className="colocacion-date-input-wrap">
            <Calendar size={16} className="colocacion-calendar-icon" />
            <input 
              type="date" 
              className="colocacion-date-input" 
              value={currentDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleNextDay} title="Día siguiente">
            <ChevronRight size={16} />
          </button>

          <button className="btn btn-secondary btn-sm" onClick={handleToday} title="Ir a hoy">
            Hoy
          </button>

          {savedDates.length > 0 && (
            <select
              className="colocacion-saved-select"
              value={savedDates.includes(currentDate) ? currentDate : ''}
              onChange={(e) => e.target.value && handleDateChange(e.target.value)}
              title="Ir a un día guardado"
            >
              <option value="">Días guardados ({savedDates.length})</option>
              {savedDates.map((key) => (
                <option key={key} value={key}>{formatDateToSpanish(key)}</option>
              ))}
            </select>
          )}

          <button
            className={`badge-status-pill cloud-pill cloud-${cloudStatus}`}
            onClick={loadFromCloud}
            title="Clic para sincronizar con la nube"
          >
            {cloudStatus === 'synced' && <><Cloud size={12} /> {records[currentDate]?.updatedAt ? 'En la nube' : 'Sin guardar este día'}</>}
            {cloudStatus === 'loading' && <><RefreshCw size={12} className="spin-icon" /> Consultando...</>}
            {cloudStatus === 'saving' && <><RefreshCw size={12} className="spin-icon" /> Guardando...</>}
            {cloudStatus === 'error' && <><CloudOff size={12} /> Error de nube (reintentar)</>}
            {cloudStatus === 'offline' && <><CloudOff size={12} /> Solo local</>}
          </button>
        </div>

        <div className="colocacion-actions">
          <button 
            className="btn btn-primary btn-header-action btn-save-action"
            onClick={handleSaveDay}
            disabled={cloudStatus === 'saving'}
            title="Guardar y respaldar los datos de este día en la nube (Supabase)"
          >
            {cloudStatus === 'saving' ? (
              <>
                <RefreshCw size={15} className="spin-icon" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Guardar Día</span>
              </>
            )}
          </button>

          <button 
            className="btn btn-secondary btn-header-action"
            onClick={() => handleOpenEdit('kpis')}
            title="Editar la información de este día"
          >
            <Edit3 size={15} />
            <span>Editar Datos</span>
          </button>

          <button 
            className="btn btn-secondary btn-header-action btn-copy-action"
            onClick={handleCopyImage}
            disabled={isExporting}
            title="Copiar infografía al portapapeles para pegar en WhatsApp o Teams"
          >
            <Copy size={15} />
            <span>Copiar Imagen</span>
          </button>

          <button 
            className="btn btn-accent btn-header-action"
            onClick={handleDownloadImage}
            disabled={isExporting}
            title="Descargar infografía en alta resolución PNG"
          >
            <Download size={15} />
            <span>Descargar PNG HD</span>
          </button>
        </div>
      </div>

      <div className="colocacion-mobile-hint">
        <span>↔ Desliza hacia los lados para explorar toda la infografía</span>
      </div>

      <div className="colocacion-flyer-outer">
        <div 
          ref={flyerRef} 
          id="plan-colocacion-flyer" 
          className="colocacion-flyer-container"
        >
          <header className="flyer-header">
            <div className="flyer-header-left">
              <img 
                src="/baz-entregas-logo-clean.png" 
                alt="baz entregas" 
                className="flyer-logo-img"
                width="245"
                height="54"
              />
            </div>

            <div className="flyer-header-center">
              <h1 className="flyer-main-title">
                PLAN DE COLOCACIÓN VILLAHERMOSA
              </h1>
              <div className="flyer-badge-date">
                <span className="flyer-badge-item">
                  <span className="badge-emoji">📅</span> {currentData.fechaTexto || formatDateToSpanish(currentData.fecha)}
                </span>
                <span className="flyer-badge-item">
                  <span className="badge-emoji">📍</span> {currentData.plaza || 'VILLAHERMOSA'}
                </span>
              </div>
            </div>

            <div className="flyer-header-right">
              <div className="flyer-cedis-photo-card" title="CEDIS Villahermosa - Andenes y Flota de Tractos">
                <img 
                  src="/cedis-patio-trucks-header.png" 
                  alt="Flota de tractocamiones en andenes CEDIS Villahermosa" 
                  className="flyer-cedis-img"
                  width="370"
                  height="160"
                />
              </div>
            </div>
          </header>

          <section className="flyer-kpi-strip">
            <div className="flyer-kpi-card kpi-programado">
              <div className="kpi-card-header">
                <div className="kpi-icon-pill icon-programado">
                  <ClipboardList size={17} />
                </div>
                <span className="kpi-label">Plan programado</span>
              </div>
              <div className="kpi-card-value">
                {currentData.kpis.planProgramado} <span className="kpi-unit">cargas</span>
              </div>
            </div>

            <div className="flyer-kpi-card kpi-ejecutadas">
              <div className="kpi-card-header">
                <div className="kpi-icon-pill icon-ejecutadas">
                  <Truck size={17} />
                </div>
                <span className="kpi-label">Cargas ejecutadas</span>
              </div>
              <div className="kpi-card-value">
                {currentData.kpis.cargasEjecutadas}
              </div>
            </div>

            <div className="flyer-kpi-card kpi-pendientes">
              <div className="kpi-card-header">
                <div className="kpi-icon-pill icon-pendientes">
                  <FileWarning size={17} />
                </div>
                <span className="kpi-label">Pendientes</span>
              </div>
              <div className="kpi-card-value">
                {currentData.kpis.pendientes}
              </div>
            </div>

            <div className="flyer-kpi-card kpi-cumplimiento">
              <div className="kpi-card-header">
                <div className="kpi-icon-pill icon-cumplimiento">
                  <TrendingUp size={17} />
                </div>
                <span className="kpi-label">Cumplimiento</span>
              </div>
              <div className="kpi-card-value">
                {currentData.kpis.cumplimiento}%
              </div>
            </div>

            <div className="flyer-kpi-card kpi-metros">
              <div className="kpi-card-header">
                <div className="kpi-icon-pill icon-metros">
                  <Boxes size={17} />
                </div>
                <span className="kpi-label">Metros remisionados</span>
              </div>
              <div className="kpi-card-value">
                {Number(currentData.kpis.metrosRemisionados).toLocaleString()} <span className="kpi-unit">m³</span>
              </div>
            </div>

            <div className="flyer-kpi-card kpi-plan-n2">
              <div className="kpi-card-header">
                <div className="kpi-icon-pill icon-plan-n2">
                  <Calendar size={17} />
                </div>
                <span className="kpi-label">Plan N-02 ({getNextDayShort(currentData.fecha)})</span>
              </div>
              <div className="kpi-card-value">
                {currentData.planProximo.cargasProgramadas} <span className="kpi-unit">cargas</span>
              </div>
            </div>
          </section>

          <main className="flyer-content-grid">
            <div className="flyer-col-left">
              <div className="flyer-panel panel-resumen-cargas">
                <div className="panel-header header-green">
                  <span>1. RESUMEN DE CARGAS EJECUTADAS – {currentData.fechaTexto}</span>
                </div>

                <div className="panel-table-wrap">
                  <table className="flyer-table table-cargas">
                    <thead>
                      <tr>
                        <th style={{ width: '38px', textAlign: 'center' }}>#</th>
                        <th style={{ textAlign: 'left' }}>Destino / Operación</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Tipo</th>
                        <th style={{ width: '90px', textAlign: 'center' }}>Capacidad</th>
                        <th style={{ width: '130px', textAlign: 'center' }}>Línea</th>
                        <th style={{ width: '110px', textAlign: 'center' }}>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.cargasEjecutadas.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748b', fontWeight: 700, fontSize: '0.85rem' }}>
                            Sin cargas ejecutadas registradas
                          </td>
                        </tr>
                      ) : (
                        currentData.cargasEjecutadas.map((c, idx) => (
                          <tr key={c.id || idx} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                            <td className="cell-num">{idx + 1}</td>
                            <td className="cell-dest">{c.destino}</td>
                            <td className="cell-tipo">{c.tipo}</td>
                            <td className="cell-cap">{c.capacidad} m³</td>
                            <td className="cell-linea">{c.linea}</td>
                            <td className="cell-estatus">
                              <span className="badge-ejecutada">
                                <span className="badge-check-icon">✓</span>Ejecutada
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="panel-footer footer-green">
                  <span>
                    TOTAL {totalCargasCount} cargas – {Number(totalCargasMetros).toLocaleString()} metros remisionados
                  </span>
                </div>
              </div>

              <div className="flyer-panel panel-hc-operadores">
                <div className="panel-header header-navy">
                  <span>6. PLANTILLA / HEADCOUNT</span>
                </div>
                <div 
                  className="hc-operadores-card"
                  onClick={() => handleOpenEdit('headcount')}
                  title="Clic para editar Headcount de Operadores y Auxiliares"
                >
                  <table className="pv-table hc-table">
                    <thead>
                      <tr className="pv-header-row-sub hc-header-row">
                        <th className="pv-th-sub hc-col-tipo">Puesto / Rol</th>
                        <th className="pv-th-sub hc-col-num">HC Autorizado</th>
                        <th className="pv-th-sub hc-col-num">HC Activo</th>
                        <th className="pv-th-sub hc-col-num">- Vacantes</th>
                        <th className="pv-th-sub hc-col-num">- Incapacidades</th>
                        <th className="pv-th-sub hc-col-pct">% Total Activo</th>
                        <th className="pv-th-sub hc-col-pct">% Autorizado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hcFilas.map((f, idx) => {
                        const aut = Number(f.autorizado) || 0;
                        const act = Number(f.activo) || 0;
                        const vac = Number(f.vacantes) || 0;
                        const inc = Number(f.incapacidades) || 0;
                        const pctActivo = aut > 0 ? ((act / aut) * 100).toFixed(1) : '0.0';
                        const pctAutorizado = aut > 0 ? (((aut - vac) / aut) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={f.tipo || idx} className={idx % 2 === 0 ? 'pv-row-even' : 'pv-row-odd'}>
                            <td className="pv-td-tipo hc-td-tipo">{f.tipo}</td>
                            <td className="pv-td-num">{aut}</td>
                            <td className="pv-td-num">{act}</td>
                            <td className="pv-td-num" style={{ color: vac > 0 ? '#dc2626' : undefined, fontWeight: vac > 0 ? 800 : undefined }}>
                              {vac > 0 ? `-${vac}` : '0'}
                            </td>
                            <td className="pv-td-num" style={{ color: inc > 0 ? '#d97706' : undefined, fontWeight: inc > 0 ? 800 : undefined }}>
                              {inc > 0 ? `-${inc}` : '0'}
                            </td>
                            <td className="pv-td-pct">
                              <span className={`pv-pct-badge ${Number(pctActivo) >= 85 ? 'pct-high' : Number(pctActivo) >= 70 ? 'pct-med' : 'pct-low'}`}>
                                {aut > 0 ? `${pctActivo}%` : '—'}
                              </span>
                            </td>
                            <td className="pv-td-pct">
                              <span className={`pv-pct-badge ${Number(pctAutorizado) >= 90 ? 'pct-high' : Number(pctAutorizado) >= 75 ? 'pct-med' : 'pct-low'}`}>
                                {aut > 0 ? `${pctAutorizado}%` : '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="pv-row-total hc-row-total">
                        <td className="pv-td-total-lbl hc-td-total-lbl">TOTAL PLANTILLA</td>
                        <td className="pv-td-total-num">{hcSumAutorizado}</td>
                        <td className="pv-td-total-num">{hcSumActivo}</td>
                        <td className="pv-td-total-num" style={{ color: hcSumVacantes > 0 ? '#fca5a5' : undefined }}>
                          {hcSumVacantes > 0 ? `-${hcSumVacantes}` : '0'}
                        </td>
                        <td className="pv-td-total-num" style={{ color: hcSumIncapacidades > 0 ? '#fde68a' : undefined }}>
                          {hcSumIncapacidades > 0 ? `-${hcSumIncapacidades}` : '0'}
                        </td>
                        <td className="pv-td-total-pct">
                          <span className="hc-total-pct-badge">
                            {hcSumAutorizado > 0 ? `${hcSumPctActivo}%` : '0.0%'}
                          </span>
                        </td>
                        <td className="pv-td-total-pct">
                          <span className="hc-total-pct-badge">
                            {hcSumAutorizado > 0 ? `${hcSumPctAutorizado}%` : '0.0%'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flyer-col-right">
              <div className="flyer-panel panel-movimientos">
                <div className="panel-header header-navy">
                  <span>2. MOVIMIENTOS Y PIEZAS DEL DÍA</span>
                </div>

                <div className="panel-body body-movimientos">
                  <div className="movimientos-table-col">
                    <table className="flyer-table table-piezas">
                      <tbody>
                        {currentData.piezas.categorias.map((cat, idx) => (
                          <tr key={cat.id || idx} className={idx % 2 === 0 ? 'row-piezas-even' : 'row-piezas-odd'}>
                            <td className="piezas-cat-name">{cat.categoria}</td>
                            <td className="piezas-cat-qty">{Number(cat.cantidad).toLocaleString()}</td>
                          </tr>
                        ))}
                        <tr className="row-piezas-total">
                          <td className="piezas-total-lbl">TOTAL:</td>
                          <td className="piezas-total-val">{Number(totalPiezasCount).toLocaleString()} piezas</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="movimientos-boxes-col">
                    <div className="box-mini-card">
                      <div className="box-icon-container">
                        <BoxParcelIcon />
                      </div>
                      <div className="box-mini-info">
                        <span className="box-title">PPE'S:</span>
                        <span className="box-val">{currentData.piezas.ppes}</span>
                      </div>
                    </div>

                    <div className="box-mini-card">
                      <div className="box-icon-container">
                        <BoxParcelIcon />
                      </div>
                      <div className="box-mini-info">
                        <span className="box-title">.COM:</span>
                        <span className="box-val">{currentData.piezas.dotCom}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flyer-panel panel-comportamiento">
                <div className="panel-header header-purple">
                  <span>3. COMPORTAMIENTO DIARIO ASIGNADO VS REMISIONADO</span>
                </div>

                <div className="panel-body body-comportamiento">
                  <div className="comportamiento-icon-col">
                    <div className="comportamiento-trend-box">
                      <TrendingUp size={34} color="#ffffff" strokeWidth={2.4} />
                    </div>
                  </div>

                  <div className="comportamiento-metrics-col">
                    <div className="comportamiento-item">
                      <span className="comportamiento-metric-lbl">Promedio Diario Asignado a FC:</span>
                      <span className="comportamiento-metric-val">{Number(currentData.comportamiento.promedioDiarioAsignadoFC).toLocaleString()} m³</span>
                    </div>
                    <div className="comportamiento-item">
                      <span className="comportamiento-metric-lbl">Promedio Diario Operado:</span>
                      <span className="comportamiento-metric-val">{Number(currentData.comportamiento.promedioDiarioOperado).toLocaleString()} m³</span>
                    </div>
                    <div className="comportamiento-item">
                      <span className="comportamiento-metric-lbl">Remisionado Acumulado:</span>
                      <span className="comportamiento-metric-val highlight">{Number(currentData.comportamiento.remisionadoAcumulado).toLocaleString()} m³</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flyer-panel panel-n2-pendientes">
                <div className="panel-header header-forest">
                  <span>4. CARGAS PENDIENTES / ESCALONADAS</span>
                </div>
                <div className="panel-body body-n2-right">
                  <table className="flyer-table table-n2">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', width: '38%' }}>Folio / Destino</th>
                        <th style={{ width: '60px', textAlign: 'center' }}>m³</th>
                        <th style={{ textAlign: 'left' }}>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.planProximo.cargasPendientes.length === 0 ? (
                        <tr 
                          onClick={() => handleOpenEdit('pendientes')}
                          style={{ cursor: 'pointer' }}
                          title="Clic para editar Cuadro 4"
                        >
                          <td className="n2-folio-cell" style={{ fontWeight: 800, color: '#166534' }}>
                            {currentData.planProximo.resumenFolio || (cargasPendientesKpi > 0 ? `${cargasPendientesKpi} CARGAS PENDIENTES` : 'Sin cargas pendientes')}
                          </td>
                          <td className="n2-cap-cell">
                            {currentData.planProximo.resumenM3
                              ? (currentData.planProximo.resumenM3.includes('m') || currentData.planProximo.resumenM3 === '-'
                                  ? currentData.planProximo.resumenM3
                                  : `${currentData.planProximo.resumenM3} m³`)
                              : '-'}
                          </td>
                          <td className="n2-obs-cell">
                            {currentData.planProximo.observacionPendientes || ''}
                          </td>
                        </tr>
                      ) : (
                        currentData.planProximo.cargasPendientes.map((p, idx) => (
                          <tr 
                            key={p.id || idx} 
                            className={idx % 2 === 0 ? 'row-n2-even' : 'row-n2-odd'}
                            onClick={() => handleOpenEdit('pendientes')}
                            style={{ cursor: 'pointer' }}
                            title="Clic para editar Cuadro 4"
                          >
                            <td className="n2-folio-cell">{p.folioDestino}</td>
                            <td className="n2-cap-cell">{p.capacidad ? `${p.capacidad} m³` : '-'}</td>
                            <td className="n2-obs-cell">{p.observacion || currentData.planProximo.observacionPendientes || ''}</td>
                          </tr>
                        ))
                      )}
                      <tr className="n2-total-row">
                        <td className="n2-total-lbl" style={{ textAlign: 'left', paddingLeft: '0.65rem' }}>
                          TOTAL PENDIENTES:
                        </td>
                        <td className="n2-total-val" style={{ whiteSpace: 'nowrap', color: '#fef08a' }}>
                          {currentData.planProximo.cargasPendientes.length || cargasPendientesKpi} cargas
                        </td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 700, paddingRight: '0.65rem', textAlign: 'right', color: '#e2e8f0' }}>
                          {totalPendientesMetros > 0 ? `${totalPendientesMetros} m³` : ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flyer-panel panel-pv-activo">
                <div className="panel-header header-emerald">
                  <span>5. PARQUE VEHICULAR (PV ACTIVO)</span>
                </div>
                <div 
                  className="pv-activo-card"
                  onClick={() => handleOpenEdit('pvActivo')}
                  title="Clic para editar Parque Vehicular (PV Activo)"
                >
                  <table className="pv-table">
                    <thead>
                      <tr className="pv-header-row-sub">
                        <th className="pv-th-sub pv-col-tipo">Tipo de Unidad</th>
                        <th className="pv-th-sub pv-col-num">Activas</th>
                        <th className="pv-th-sub pv-col-num">Taller</th>
                        <th className="pv-th-sub pv-col-num">Total Flota</th>
                        <th className="pv-th-sub pv-col-pct">% Activo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pvFilas.map((f, idx) => {
                        const act = Number(f.activas) || 0;
                        const tal = Number(f.taller) || 0;
                        const tot = act + tal;
                        const pct = tot > 0 ? ((act / tot) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={f.tipo || idx} className={idx % 2 === 0 ? 'pv-row-even' : 'pv-row-odd'}>
                            <td className="pv-td-tipo">{f.tipo}</td>
                            <td className="pv-td-num">{act}</td>
                            <td className="pv-td-num">{tal}</td>
                            <td className="pv-td-num pv-td-total">{tot}</td>
                            <td className="pv-td-pct">
                              <span className={`pv-pct-badge ${Number(pct) >= 70 ? 'pct-high' : Number(pct) >= 40 ? 'pct-med' : 'pct-low'}`}>
                                {tot > 0 ? `${pct}%` : '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="pv-row-total">
                        <td className="pv-td-total-lbl">
                          TOTAL FLOTA
                        </td>
                        <td className="pv-td-total-num">{pvSumActivas}</td>
                        <td className="pv-td-total-num">{pvSumTaller}</td>
                        <td className="pv-td-total-num pv-td-grand-total">{pvSumTotal}</td>
                        <td className="pv-td-total-pct">
                          <span className="pv-total-pct-badge">
                            {pvSumTotal > 0 ? `${pvSumPct}%` : '0.0%'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>

          <footer className="flyer-footer-obs">
            <span className="obs-footer-badge">OBSERVACIONES:</span>
            <span className="obs-footer-text">
              {currentData.observacionesGenerales || 'Operación en curso sin novedades extraordinarias reportadas en CEDIS Villahermosa.'}
            </span>
          </footer>
        </div>
      </div>

      {isEditing && editForm && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div className="modal-content modal-colocacion-edit" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Edit3 size={20} color="#38bdf8" />
                <div>
                  <h3>Editar Plan de Colocación</h3>
                  <p className="modal-subtitle">Captura diaria de métricas, cargas ejecutadas, movimientos y plan N-02</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm btn-save-modal-action"
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={handleSaveEdit}
                  disabled={cloudStatus === 'saving'}
                  title="Guardar todos los cambios"
                >
                  {cloudStatus === 'saving' ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Guardar</span>
                    </>
                  )}
                </button>
                <button className="btn-close-modal modal-close" onClick={handleCloseEdit} title="Cerrar ventana">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="colocacion-edit-tabs">
              <button 
                className={`edit-tab ${activeTab === 'kpis' ? 'active' : ''}`}
                onClick={() => setActiveTab('kpis')}
              >
                1. KPIs Generales
              </button>
              <button 
                className={`edit-tab ${activeTab === 'cargas' ? 'active' : ''}`}
                onClick={() => setActiveTab('cargas')}
              >
                2. Cargas Ejecutadas ({editForm.cargasEjecutadas.length})
              </button>
              <button 
                className={`edit-tab ${activeTab === 'piezas' ? 'active' : ''}`}
                onClick={() => setActiveTab('piezas')}
              >
                3. Movimientos y Piezas
              </button>
              <button 
                className={`edit-tab ${activeTab === 'comportamiento' ? 'active' : ''}`}
                onClick={() => setActiveTab('comportamiento')}
              >
                4. Comportamiento y N-02
              </button>
              <button 
                className={`edit-tab ${activeTab === 'pendientes' ? 'active' : ''}`}
                onClick={() => setActiveTab('pendientes')}
              >
                5. Cargas Pendientes (Cuadro 4)
              </button>
              <button 
                className={`edit-tab ${activeTab === 'pvActivo' ? 'active' : ''}`}
                onClick={() => setActiveTab('pvActivo')}
              >
                6. PV Activo
              </button>
              <button 
                className={`edit-tab ${activeTab === 'headcount' ? 'active' : ''}`}
                onClick={() => setActiveTab('headcount')}
              >
                7. Headcount ({editForm.headcount?.filas?.reduce((acc, f) => acc + (Number(f.activo) || 0), 0) || 0}/{editForm.headcount?.filas?.reduce((acc, f) => acc + (Number(f.autorizado) || 0), 0) || 0})
              </button>
            </div>

            <div className="modal-body colocacion-modal-body">
              {activeTab === 'kpis' && (
                <div className="edit-section-grid">
                  <div className="form-group">
                    <label>Fecha del Reporte</label>
                    <input 
                      type="date" 
                      className="form-control"
                      value={editForm.fecha}
                      onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Plaza / Centro</label>
                    <input 
                      type="text" 
                      className="form-control"
                      value={editForm.plaza}
                      onChange={(e) => setEditForm({ ...editForm, plaza: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Plan Programado (cargas)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      className="form-control"
                      placeholder="Ej: 36"
                      value={editForm.kpis.planProgramado}
                      onChange={(e) => handleKpiChange('planProgramado', e.target.value)}
                      onKeyDown={(e) => handleNumericKeyDown(e, editForm.kpis.planProgramado, (v) => handleKpiChange('planProgramado', v))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Cargas Ejecutadas</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      className="form-control"
                      placeholder="Ej: 33"
                      value={editForm.kpis.cargasEjecutadas}
                      onChange={(e) => handleKpiChange('cargasEjecutadas', e.target.value)}
                      onKeyDown={(e) => handleNumericKeyDown(e, editForm.kpis.cargasEjecutadas, (v) => handleKpiChange('cargasEjecutadas', v))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Pendientes (Calculado)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      className="form-control"
                      value={editForm.kpis.pendientes}
                      onChange={(e) => handleKpiChange('pendientes', e.target.value)}
                      onKeyDown={(e) => handleNumericKeyDown(e, editForm.kpis.pendientes, (v) => handleKpiChange('pendientes', v))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Cumplimiento (%)</label>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      className="form-control"
                      placeholder="Ej: 91.7"
                      value={editForm.kpis.cumplimiento}
                      onChange={(e) => handleKpiChange('cumplimiento', e.target.value)}
                      onKeyDown={(e) => handleNumericKeyDown(e, editForm.kpis.cumplimiento, (v) => handleKpiChange('cumplimiento', v), 0.1, true)}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Metros Remisionados (m³)</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      className="form-control"
                      placeholder="Ej: 1237"
                      value={editForm.kpis.metrosRemisionados}
                      onChange={(e) => handleKpiChange('metrosRemisionados', e.target.value)}
                      onKeyDown={(e) => handleNumericKeyDown(e, editForm.kpis.metrosRemisionados, (v) => handleKpiChange('metrosRemisionados', v))}
                    />
                    <small className="form-hint">Nota: Se actualiza también al sumar las capacidades de las cargas ejecutadas.</small>
                  </div>
                </div>
              )}

              {activeTab === 'cargas' && (
                <div className="edit-cargas-section">
                  <div className="edit-section-header-bar">
                    <span>Listado de Cargas Ejecutadas</span>
                    <button className="btn btn-sm btn-primary" onClick={handleAddCarga}>
                      <Plus size={14} /> Agregar Carga
                    </button>
                  </div>

                  <div className="cargas-edit-list">
                    {editForm.cargasEjecutadas.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.25rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        No hay cargas ejecutadas registradas. Haz clic en "Agregar Carga" para añadir una.
                      </div>
                    ) : (
                      editForm.cargasEjecutadas.map((carga, index) => (
                      <div key={carga.id} className="carga-edit-row">
                        <span className="carga-row-index">#{index + 1}</span>

                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Destino / Operación"
                          value={carga.destino}
                          onChange={(e) => handleUpdateCarga(carga.id, 'destino', e.target.value)}
                        />

                        <select 
                          className="form-control select-tipo"
                          value={carga.tipo}
                          onChange={(e) => handleUpdateCarga(carga.id, 'tipo', e.target.value)}
                        >
                          <option value="Foráneo">Foráneo</option>
                          <option value="Retail">Retail</option>
                          <option value="HUB">HUB</option>
                          <option value="Local">Local</option>
                        </select>

                        <div className="input-with-unit">
                          <input 
                            type="text" 
                            inputMode="numeric"
                            className="form-control input-cap" 
                            placeholder="m³"
                            value={carga.capacidad}
                            onChange={(e) => handleUpdateCarga(carga.id, 'capacidad', e.target.value)}
                            onKeyDown={(e) => handleNumericKeyDown(e, carga.capacidad, (v) => handleUpdateCarga(carga.id, 'capacidad', v))}
                          />
                          <span className="unit-label">m³</span>
                        </div>

                        <input 
                          type="text" 
                          className="form-control input-linea" 
                          placeholder="Línea transportista"
                          value={carga.linea}
                          onChange={(e) => handleUpdateCarga(carga.id, 'linea', e.target.value)}
                        />

                        <button 
                          className="btn-delete-row"
                          onClick={() => handleRemoveCarga(carga.id)}
                          title="Eliminar esta fila"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )))}
                  </div>

                  <div className="form-group full-width" style={{ marginTop: '1.25rem' }}>
                    <label>Observaciones Generales del Día (Pie del Reporte)</label>
                    <textarea 
                      className="form-control"
                      rows={2}
                      placeholder="Observaciones de la operación..."
                      value={editForm.observacionesGenerales || ''}
                      onChange={(e) => setEditForm({ ...editForm, observacionesGenerales: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'piezas' && (
                <div className="edit-piezas-section">
                  <div className="edit-section-grid" style={{ marginBottom: '1.25rem' }}>
                    <div className="form-group">
                      <label>PPE'S</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="form-control"
                        placeholder="0"
                        value={editForm.piezas.ppes}
                        onChange={(e) => handleUpdatePieza('ppes', e.target.value)}
                        onKeyDown={(e) => handleNumericKeyDown(e, editForm.piezas.ppes, (v) => handleUpdatePieza('ppes', v))}
                      />
                    </div>

                    <div className="form-group">
                      <label>.COM</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="form-control"
                        placeholder="0"
                        value={editForm.piezas.dotCom}
                        onChange={(e) => handleUpdatePieza('dotCom', e.target.value)}
                        onKeyDown={(e) => handleNumericKeyDown(e, editForm.piezas.dotCom, (v) => handleUpdatePieza('dotCom', v))}
                      />
                    </div>
                  </div>

                  <div className="edit-section-header-bar">
                    <span>Piezas por Categoría</span>
                    <button className="btn btn-sm btn-primary" onClick={handleAddCategoriaPieza}>
                      <Plus size={14} /> Agregar Categoría
                    </button>
                  </div>

                  <div className="piezas-edit-list">
                    {editForm.piezas.categorias.map((cat) => (
                      <div key={cat.id} className="pieza-edit-row">
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Nombre de la categoría"
                          value={cat.categoria}
                          onChange={(e) => handleUpdateCategoriaPieza(cat.id, 'categoria', e.target.value)}
                        />

                        <input 
                          type="text" 
                          inputMode="numeric"
                          className="form-control input-qty" 
                          placeholder="Cantidad"
                          value={cat.cantidad}
                          onChange={(e) => handleUpdateCategoriaPieza(cat.id, 'cantidad', e.target.value)}
                          onKeyDown={(e) => handleNumericKeyDown(e, cat.cantidad, (v) => handleUpdateCategoriaPieza(cat.id, 'cantidad', v))}
                        />

                        <button 
                          className="btn-delete-row"
                          onClick={() => handleRemoveCategoriaPieza(cat.id)}
                          title="Eliminar categoría"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'comportamiento' && (
                <div className="edit-comportamiento-section">
                  <h4 className="edit-subheading">Comportamiento Diario (m³)</h4>
                  <div className="edit-section-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="form-group">
                      <label>Promedio Diario Asignado a FC (m³)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="form-control"
                        value={editForm.comportamiento.promedioDiarioAsignadoFC}
                        onChange={(e) => handleUpdateComportamiento('promedioDiarioAsignadoFC', e.target.value)}
                        onKeyDown={(e) => handleNumericKeyDown(e, editForm.comportamiento.promedioDiarioAsignadoFC, (v) => handleUpdateComportamiento('promedioDiarioAsignadoFC', v))}
                      />
                    </div>

                    <div className="form-group">
                      <label>Promedio Diario Operado (m³)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="form-control"
                        value={editForm.comportamiento.promedioDiarioOperado}
                        onChange={(e) => handleUpdateComportamiento('promedioDiarioOperado', e.target.value)}
                        onKeyDown={(e) => handleNumericKeyDown(e, editForm.comportamiento.promedioDiarioOperado, (v) => handleUpdateComportamiento('promedioDiarioOperado', v))}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Remisionado Acumulado (m³)</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="form-control"
                        value={editForm.comportamiento.remisionadoAcumulado}
                        onChange={(e) => handleUpdateComportamiento('remisionadoAcumulado', e.target.value)}
                        onKeyDown={(e) => handleNumericKeyDown(e, editForm.comportamiento.remisionadoAcumulado, (v) => handleUpdateComportamiento('remisionadoAcumulado', v))}
                      />
                    </div>
                  </div>

                  <h4 className="edit-subheading">Plan Próximo (N-02)</h4>
                  <div className="edit-section-grid">
                    <div className="form-group full-width">
                      <label>Título del Plan Próximo</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={editForm.planProximo.titulo}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          planProximo: { ...editForm.planProximo, titulo: e.target.value }
                        })}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Total Cargas Programadas N-02</label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        className="form-control"
                        value={editForm.planProximo.cargasProgramadas}
                        onChange={(e) => handleUpdateCargasProgramadas(e.target.value)}
                        onKeyDown={(e) => handleNumericKeyDown(e, editForm.planProximo.cargasProgramadas, handleUpdateCargasProgramadas)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pendientes' && (
                <div>
                  <h4 className="edit-subheading" style={{ color: '#38bdf8' }}>
                    Cuadro 4: Cargas Pendientes y Observaciones
                  </h4>
                  <div className="edit-section-grid" style={{ marginBottom: '1.25rem' }}>
                    <div className="form-group full-width">
                      <label>Observaciones del Cuadro 4 (Texto en Azul)</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="SE SUMAN LAS CARGAS PENDIENTES CON LAS DEL PLAN N-02"
                        value={editForm.planProximo.observacionPendientes}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          planProximo: { ...editForm.planProximo, observacionPendientes: e.target.value }
                        })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Texto Folio / Destino (Resumen Cuadro 4)</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder={Number(editForm.kpis.pendientes) > 0 ? `${editForm.kpis.pendientes} CARGAS PENDIENTES` : 'Sin cargas pendientes'}
                        value={editForm.planProximo.resumenFolio}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          planProximo: { ...editForm.planProximo, resumenFolio: e.target.value }
                        })}
                      />
                      <small style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '0.25rem', display: 'block' }}>
                        Dejar en blanco para valor automático ({Number(editForm.kpis.pendientes) > 0 ? `${editForm.kpis.pendientes} CARGAS PENDIENTES` : 'Sin cargas pendientes'})
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Metros Cúbicos m³ (Resumen Cuadro 4)</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="-"
                        value={editForm.planProximo.resumenM3}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          planProximo: { ...editForm.planProximo, resumenM3: e.target.value }
                        })}
                      />
                      <small style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '0.25rem', display: 'block' }}>
                        Por defecto muestra &quot;-&quot;
                      </small>
                    </div>
                  </div>

                  <div className="edit-section-header-bar">
                    <span>Cargas Escalonadas Individuales (Detalle Opcional)</span>
                    <button type="button" className="btn btn-sm btn-primary" onClick={handleAddCargaPendiente}>
                      <Plus size={14} /> Agregar Escalonada
                    </button>
                  </div>

                  <div className="piezas-edit-list">
                    {editForm.planProximo.cargasPendientes.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        No hay cargas pendientes individuales. Se mostrará la fila resumen del Cuadro 4 con la observación y cantidad de pendientes.
                      </div>
                    ) : (
                      editForm.planProximo.cargasPendientes.map((p) => (
                        <div key={p.id} className="pendiente-edit-row">
                          <input 
                            type="text" 
                            className="form-control input-folio" 
                            placeholder="Folio y Destino"
                            value={p.folioDestino}
                            onChange={(e) => handleUpdateCargaPendiente(p.id, 'folioDestino', e.target.value)}
                          />

                          <div className="input-with-unit">
                            <input 
                              type="text" 
                              inputMode="numeric"
                              className="form-control input-cap" 
                              placeholder="m³"
                              value={p.capacidad}
                              onChange={(e) => handleUpdateCargaPendiente(p.id, 'capacidad', e.target.value)}
                              onKeyDown={(e) => handleNumericKeyDown(e, p.capacidad, (v) => handleUpdateCargaPendiente(p.id, 'capacidad', v))}
                            />
                            <span className="unit-label">m³</span>
                          </div>

                          <input 
                            type="text" 
                            className="form-control input-obs" 
                            placeholder="Observaciones (ej: UNA UNIDAD ESCALONADA POR DIA)"
                            value={p.observacion || ''}
                            onChange={(e) => handleUpdateCargaPendiente(p.id, 'observacion', e.target.value)}
                          />

                          <button 
                            type="button"
                            className="btn-delete-row"
                            onClick={() => handleRemoveCargaPendiente(p.id)}
                            title="Eliminar fila"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="form-group full-width" style={{ marginTop: '1.25rem' }}>
                    <label>Observaciones Generales del Día (Pie del Reporte)</label>
                    <textarea 
                      className="form-control"
                      rows={2}
                      placeholder="Notas u observaciones generales de la operación..."
                      value={editForm.observacionesGenerales || ''}
                      onChange={(e) => setEditForm({ ...editForm, observacionesGenerales: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'pvActivo' && (
                <div className="edit-pv-section">
                  <div className="edit-section-header-bar">
                    <span>Parque Vehicular (PV Activo)</span>
                  </div>

                  <div className="pv-edit-table-wrap">
                    <table className="flyer-table pv-edit-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '0.45rem 0.65rem' }}>Tipo de Unidad</th>
                          <th style={{ textAlign: 'center', width: '90px' }}>Activas</th>
                          <th style={{ textAlign: 'center', width: '90px' }}>Taller</th>
                          <th style={{ textAlign: 'center', width: '90px' }}>Total</th>
                          <th style={{ textAlign: 'center', width: '100px' }}>% Activo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(editForm.pvActivo?.filas || []).map((fila) => {
                          const act = Number(fila.activas) || 0;
                          const tal = Number(fila.taller) || 0;
                          const tot = act + tal;
                          const pct = tot > 0 ? ((act / tot) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={fila.tipo}>
                              <td style={{ fontWeight: 800, color: 'var(--text-primary)', padding: '0.45rem 0.65rem' }}>
                                {fila.tipo}
                              </td>
                              <td style={{ padding: '0.25rem' }}>
                                <input 
                                  type="text"
                                  inputMode="numeric"
                                  className="form-control form-control-sm"
                                  style={{ textAlign: 'center', fontWeight: 800 }}
                                  value={fila.activas}
                                  onChange={(e) => handleUpdatePvFila(fila.tipo, 'activas', e.target.value)}
                                  onKeyDown={(e) => handleNumericKeyDown(e, fila.activas, (v) => handleUpdatePvFila(fila.tipo, 'activas', v))}
                                />
                              </td>
                              <td style={{ padding: '0.25rem' }}>
                                <input 
                                  type="text"
                                  inputMode="numeric"
                                  className="form-control form-control-sm"
                                  style={{ textAlign: 'center', fontWeight: 800 }}
                                  value={fila.taller}
                                  onChange={(e) => handleUpdatePvFila(fila.tipo, 'taller', e.target.value)}
                                  onKeyDown={(e) => handleNumericKeyDown(e, fila.taller, (v) => handleUpdatePvFila(fila.tipo, 'taller', v))}
                                />
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '0.95rem' }}>
                                {tot}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 900, color: Number(pct) >= 70 ? '#22c55e' : '#f59e0b' }}>
                                {tot > 0 ? `${pct}%` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'headcount' && (
                <div className="edit-pv-section">
                  <div className="edit-section-header-bar">
                    <span>Plantilla / Headcount (Operadores y Auxiliares)</span>
                  </div>

                  <div className="pv-edit-table-wrap">
                    <table className="flyer-table pv-edit-table hc-edit-table">
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '0.45rem 0.65rem' }}>Puesto / Rol</th>
                          <th style={{ textAlign: 'center', width: '90px' }}>HC Autorizado</th>
                          <th style={{ textAlign: 'center', width: '90px' }}>HC Activo</th>
                          <th style={{ textAlign: 'center', width: '90px' }}>- Vacantes</th>
                          <th style={{ textAlign: 'center', width: '90px' }}>- Incapacidades</th>
                          <th style={{ textAlign: 'center', width: '100px' }}>% Total Activo</th>
                          <th style={{ textAlign: 'center', width: '100px' }}>% Autorizado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(editForm.headcount?.filas || []).map((fila) => {
                          const aut = Number(fila.autorizado) || 0;
                          const act = Number(fila.activo) || 0;
                          const vac = Number(fila.vacantes) || 0;
                          const pctActivo = aut > 0 ? ((act / aut) * 100).toFixed(1) : '0.0';
                          const pctAutorizado = aut > 0 ? (((aut - vac) / aut) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={fila.tipo}>
                              <td style={{ fontWeight: 800, color: 'var(--text-primary)', padding: '0.45rem 0.65rem' }}>
                                {fila.tipo}
                              </td>
                              <td style={{ padding: '0.25rem' }}>
                                <input 
                                  type="text"
                                  inputMode="numeric"
                                  className="form-control form-control-sm"
                                  style={{ textAlign: 'center', fontWeight: 800 }}
                                  value={fila.autorizado}
                                  onChange={(e) => handleUpdateHcFila(fila.tipo, 'autorizado', e.target.value)}
                                  onKeyDown={(e) => handleNumericKeyDown(e, fila.autorizado, (v) => handleUpdateHcFila(fila.tipo, 'autorizado', v))}
                                />
                              </td>
                              <td style={{ padding: '0.25rem' }}>
                                <input 
                                  type="text"
                                  inputMode="numeric"
                                  className="form-control form-control-sm"
                                  style={{ textAlign: 'center', fontWeight: 800 }}
                                  value={fila.activo}
                                  onChange={(e) => handleUpdateHcFila(fila.tipo, 'activo', e.target.value)}
                                  onKeyDown={(e) => handleNumericKeyDown(e, fila.activo, (v) => handleUpdateHcFila(fila.tipo, 'activo', v))}
                                />
                              </td>
                              <td style={{ padding: '0.25rem' }}>
                                <input 
                                  type="text"
                                  inputMode="numeric"
                                  className="form-control form-control-sm"
                                  style={{ textAlign: 'center', fontWeight: 800, color: '#dc2626' }}
                                  value={fila.vacantes}
                                  onChange={(e) => handleUpdateHcFila(fila.tipo, 'vacantes', e.target.value)}
                                  onKeyDown={(e) => handleNumericKeyDown(e, fila.vacantes, (v) => handleUpdateHcFila(fila.tipo, 'vacantes', v))}
                                />
                              </td>
                              <td style={{ padding: '0.25rem' }}>
                                <input 
                                  type="text"
                                  inputMode="numeric"
                                  className="form-control form-control-sm"
                                  style={{ textAlign: 'center', fontWeight: 800, color: '#d97706' }}
                                  value={fila.incapacidades}
                                  onChange={(e) => handleUpdateHcFila(fila.tipo, 'incapacidades', e.target.value)}
                                  onKeyDown={(e) => handleNumericKeyDown(e, fila.incapacidades, (v) => handleUpdateHcFila(fila.tipo, 'incapacidades', v))}
                                />
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 900, color: Number(pctActivo) >= 85 ? '#22c55e' : '#f59e0b' }}>
                                {aut > 0 ? `${pctActivo}%` : '—'}
                              </td>
                              <td style={{ textAlign: 'center', fontWeight: 900, color: Number(pctAutorizado) >= 90 ? '#22c55e' : '#f59e0b' }}>
                                {aut > 0 ? `${pctAutorizado}%` : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseEdit}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveEdit}
                disabled={cloudStatus === 'saving'}
              >
                {cloudStatus === 'saving' ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" /> Guardando en la Nube...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Guardar Día en la Nube
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
