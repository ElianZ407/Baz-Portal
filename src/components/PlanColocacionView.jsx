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

const DEFAULT_RECORD = {
  fecha: '2026-10-11',
  fechaTexto: '11 DE OCTUBRE DE 2026',
  plaza: 'VILLAHERMOSA',
  kpis: {
    planProgramado: 36,
    cargasEjecutadas: 33,
    pendientes: 3,
    cumplimiento: 91.7,
    metrosRemisionados: 1237
  },
  cargasEjecutadas: [
    { id: 1, destino: 'Frontera', tipo: 'Retail', capacidad: 18, linea: 'LTI - VHS', estatus: 'Ejecutada' },
    { id: 2, destino: 'Cárdenas Tabasco', tipo: 'Foráneo', capacidad: 50, linea: 'VALLEY', estatus: 'Ejecutada' },
    { id: 3, destino: 'Jalpa de Méndez', tipo: 'HUB', capacidad: 50, linea: 'BRITO', estatus: 'Ejecutada' },
    { id: 4, destino: 'HUB Tuxtla', tipo: 'Retail', capacidad: 153, linea: 'VALLEY', estatus: 'Ejecutada' },
    { id: 5, destino: 'Coatzacoalcos', tipo: 'Foráneo', capacidad: 50, linea: 'VALLEY', estatus: 'Ejecutada' },
    { id: 6, destino: 'Tonalá Chiapas', tipo: 'Foráneo', capacidad: 90, linea: 'LIBRA EXPRESS', estatus: 'Ejecutada' },
    { id: 7, destino: 'Tapachula', tipo: 'Foráneo', capacidad: 110, linea: 'VALLEY', estatus: 'Ejecutada' },
    { id: 8, destino: 'Matías Romero', tipo: 'HUB', capacidad: 110, linea: 'BRITO', estatus: 'Ejecutada' },
    { id: 9, destino: 'Pichucalco', tipo: 'Foráneo', capacidad: 50, linea: 'LTI - VHS', estatus: 'Ejecutada' },
    { id: 10, destino: 'Las Choapas', tipo: 'Foráneo', capacidad: 50, linea: 'LTI - VHS', estatus: 'Ejecutada' },
    { id: 11, destino: 'Huimanguillo', tipo: 'Foráneo', capacidad: 110, linea: 'LIBRA EXPRESS', estatus: 'Ejecutada' }
  ],
  piezas: {
    ppes: 0,
    dotCom: 0,
    categorias: [
      { id: 1, categoria: 'Italikas', cantidad: 484 },
      { id: 2, categoria: 'Conectividad', cantidad: 378 },
      { id: 3, categoria: 'Colchones y Box', cantidad: 61 },
      { id: 4, categoria: 'Entretenimiento', cantidad: 479 },
      { id: 5, categoria: 'Muebles y Hogar', cantidad: 29 },
      { id: 6, categoria: 'LB Enseres', cantidad: 312 }
    ]
  },
  comportamiento: {
    promedioDiarioAsignadoFC: 2797,
    promedioDiarioOperado: 1539,
    remisionadoAcumulado: 16624
  },
  planProximo: {
    titulo: 'TOTAL PLAN DE CARGAS N-02 12 OCTUBRE 2026',
    cargasProgramadas: 58,
    cargasPendientes: [
      { id: 1, folioDestino: 'CS00381549 - 2077 EKT OCOSINGO DE 50M', capacidad: 50, observacion: 'UNA UNIDAD ESCALONADA POR DIA' },
      { id: 2, folioDestino: 'CS00381519 - 7809 EKT ACAYUCAN DE 50M', capacidad: 50, observacion: 'AFECTACION QUE TUVO CEDIS CON SISTEMAS PARA EL VALLEY' },
      { id: 3, folioDestino: 'CS00381535 - 7579 EKT MEGA PALENQUE 50M', capacidad: 50, observacion: 'UNIDAD INGRESO A TALLER' }
    ]
  },
  observacionesGenerales: 'UNA UNIDAD ESCALONADA POR DÍA. AFECTACIÓN QUE TUVO CEDIS CON SISTEMAS PARA EL VALLEY. UNIDAD INGRESÓ A TALLER.'
};

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
  const targetDate = (raw && raw.fecha) || dateKey || '2026-10-11';
  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_RECORD,
      fecha: targetDate,
      fechaTexto: formatDateToSpanish(targetDate),
      planProximo: {
        ...DEFAULT_RECORD.planProximo,
        titulo: getNextDayFormatted(targetDate)
      }
    };
  }

  const planProg = Number(raw.kpis?.planProgramado) || 0;
  const rawCargas = Array.isArray(raw.cargasEjecutadas) ? raw.cargasEjecutadas : DEFAULT_RECORD.cargasEjecutadas;
  const cargasEjec = rawCargas.map((c, i) => ({
    id: c.id ?? i + 1,
    destino: c.destino || '',
    tipo: c.tipo || 'Foráneo',
    capacidad: Number(c.capacidad) || 0,
    linea: c.linea || 'VALLEY',
    estatus: c.estatus || 'Ejecutada'
  }));

  const ejecCount = cargasEjec.length || (Number(raw.kpis?.cargasEjecutadas) || 0);
  const pendCount = Math.max(0, planProg - ejecCount);
  const cumpl = planProg > 0 ? Number(((ejecCount / planProg) * 100).toFixed(1)) : 0;
  const totalMetros = cargasEjec.reduce((acc, c) => acc + (Number(c.capacidad) || 0), 0);

  const rawCategorias = Array.isArray(raw.piezas?.categorias) ? raw.piezas.categorias : DEFAULT_RECORD.piezas.categorias;
  const categorias = rawCategorias.map((cat, i) => ({
    id: cat.id ?? i + 1,
    categoria: cat.categoria || '',
    cantidad: Number(cat.cantidad) || 0
  }));

  const rawPendientes = Array.isArray(raw.planProximo?.cargasPendientes) ? raw.planProximo.cargasPendientes : DEFAULT_RECORD.planProximo.cargasPendientes;
  const cargasPendientes = rawPendientes.map((p, i) => ({
    id: p.id ?? i + 1,
    folioDestino: p.folioDestino || '',
    capacidad: Number(p.capacidad) || 0,
    observacion: p.observacion || ''
  }));

  return {
    ...DEFAULT_RECORD,
    ...raw,
    fecha: targetDate,
    fechaTexto: raw.fechaTexto || formatDateToSpanish(targetDate),
    plaza: raw.plaza || 'VILLAHERMOSA',
    updatedAt: raw.updatedAt || undefined,
    kpis: {
      ...DEFAULT_RECORD.kpis,
      ...(raw.kpis || {}),
      planProgramado: planProg,
      cargasEjecutadas: ejecCount,
      pendientes: raw.kpis?.pendientes !== undefined ? Number(raw.kpis.pendientes) : pendCount,
      cumplimiento: raw.kpis?.cumplimiento !== undefined ? Number(raw.kpis.cumplimiento) : cumpl,
      metrosRemisionados: totalMetros > 0 ? totalMetros : (Number(raw.kpis?.metrosRemisionados) || DEFAULT_RECORD.kpis.metrosRemisionados)
    },
    cargasEjecutadas: cargasEjec,
    piezas: {
      ...DEFAULT_RECORD.piezas,
      ...(raw.piezas || {}),
      ppes: Number(raw.piezas?.ppes) || 0,
      dotCom: Number(raw.piezas?.dotCom) || 0,
      categorias
    },
    comportamiento: {
      ...DEFAULT_RECORD.comportamiento,
      ...(raw.comportamiento || {}),
      promedioDiarioAsignadoFC: Number(raw.comportamiento?.promedioDiarioAsignadoFC) || DEFAULT_RECORD.comportamiento.promedioDiarioAsignadoFC,
      promedioDiarioOperado: Number(raw.comportamiento?.promedioDiarioOperado) || DEFAULT_RECORD.comportamiento.promedioDiarioOperado,
      remisionadoAcumulado: Number(raw.comportamiento?.remisionadoAcumulado) || DEFAULT_RECORD.comportamiento.remisionadoAcumulado
    },
    planProximo: {
      ...DEFAULT_RECORD.planProximo,
      ...(raw.planProximo || {}),
      titulo: raw.planProximo?.titulo || getNextDayFormatted(targetDate),
      cargasProgramadas: Number(raw.planProximo?.cargasProgramadas) || DEFAULT_RECORD.planProximo.cargasProgramadas,
      cargasPendientes
    },
    observacionesGenerales: raw.observacionesGenerales !== undefined 
      ? raw.observacionesGenerales 
      : DEFAULT_RECORD.observacionesGenerales
  };
};

export const PlanColocacionView = () => {
  const [records, setRecords] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            '2026-10-11': DEFAULT_RECORD,
            ...parsed
          };
        }
      }
    } catch {
      return { '2026-10-11': DEFAULT_RECORD };
    }
    return { '2026-10-11': DEFAULT_RECORD };
  });

  const [currentDate, setCurrentDate] = useState('2026-10-11');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [activeTab, setActiveTab] = useState('kpis');
  const [toastMessage, setToastMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const [cloudStatus, setCloudStatus] = useState(isSupabaseConfigured() ? 'loading' : 'offline');

  const flyerRef = useRef(null);

  const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const applyCloudRows = (rows) => {
    if (!rows) {
      setCloudStatus('error');
      return;
    }
    setRecords((prev) => {
      const next = { ...prev };
      rows.forEach((row) => {
        if (!row.fecha) return;
        const local = next[row.fecha];
        const cloudTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        const localTime = local?.updatedAt ? new Date(local.updatedAt).getTime() : 0;
        if (!local || cloudTime >= localTime) {
          next[row.fecha] = normalizeRecord({ ...row.datos, updatedAt: row.updated_at }, row.fecha);
        }
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
    setCurrentDate(toDateKey(new Date(y, m - 1, d - 1)));
  };

  const handleNextDay = () => {
    const [y, m, d] = currentDate.split('-').map(Number);
    setCurrentDate(toDateKey(new Date(y, m - 1, d + 1)));
  };

  const handleToday = () => {
    setCurrentDate(toDateKey(new Date()));
  };

  const handleOpenEdit = () => {
    const base = normalizeRecord(currentData, currentDate);
    setEditForm({
      ...base,
      kpis: {
        ...base.kpis,
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
        ...base.piezas,
        ppes: String(base.piezas.ppes ?? ''),
        dotCom: String(base.piezas.dotCom ?? ''),
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
        cargasPendientes: base.planProximo.cargasPendientes.map((p) => ({
          ...p,
          capacidad: String(p.capacidad ?? '')
        }))
      }
    });
    setIsEditing(true);
    setActiveTab('kpis');
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

      if (targetFecha !== currentDate) {
        setCurrentDate(targetFecha);
      }

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
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1240
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
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1240
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
    let val = isDecimal ? rawVal.replace(/[^0-9.]/g, '') : rawVal.replace(/[^0-9]/g, '');
    if (isDecimal) {
      const parts = val.split('.');
      if (parts.length > 2) val = `${parts[0]}.${parts.slice(1).join('')}`;
    }

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
          const val = field === 'capacidad' ? value.replace(/[^0-9]/g, '') : value;
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
    const cleaned = value.replace(/[^0-9]/g, '');
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
            const val = field === 'cantidad' ? value.replace(/[^0-9]/g, '') : value;
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
    const cleaned = value.replace(/[^0-9]/g, '');
    setEditForm((prev) => ({
      ...prev,
      comportamiento: {
        ...prev.comportamiento,
        [field]: cleaned
      }
    }));
  };

  const handleUpdateCargasProgramadas = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
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
        cargasPendientes: prev.planProximo.cargasPendientes.map((c) => {
          if (c.id === id) {
            const val = field === 'capacidad' ? value.replace(/[^0-9]/g, '') : value;
            return { ...c, [field]: val };
          }
          return c;
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

  const totalCargasCount = currentData.cargasEjecutadas.length;
  const totalCargasMetros = currentData.cargasEjecutadas.reduce((acc, c) => acc + (Number(c.capacidad) || 0), 0);
  const totalPiezasCount = currentData.piezas.categorias.reduce((acc, cat) => acc + (Number(cat.cantidad) || 0), 0);
  const totalPendientesMetros = currentData.planProximo.cargasPendientes.reduce((acc, c) => acc + (Number(c.capacidad) || 0), 0);

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
              onChange={(e) => setCurrentDate(e.target.value)}
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
              onChange={(e) => e.target.value && setCurrentDate(e.target.value)}
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
            onClick={handleOpenEdit}
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
                  src="/cedis-patio-trucks.png" 
                  alt="Flota de tractocamiones en andenes CEDIS Villahermosa" 
                  className="flyer-cedis-img"
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
                      {currentData.cargasEjecutadas.map((c, idx) => (
                        <tr key={c.id || idx} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                          <td className="cell-num">{idx + 1}</td>
                          <td className="cell-dest">{c.destino}</td>
                          <td className="cell-tipo">{c.tipo}</td>
                          <td className="cell-cap">{c.capacidad} m³</td>
                          <td className="cell-linea">{c.linea}</td>
                          <td className="cell-estatus">
                            <span className="badge-ejecutada">
                              <span className="badge-check-icon">✓</span>
                              <span>Ejecutada</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="panel-footer footer-green">
                  <span>
                    TOTAL {totalCargasCount} cargas – {Number(totalCargasMetros).toLocaleString()} metros remisionados
                  </span>
                </div>

                <div className="flyer-observaciones-cargas">
                  <span className="obs-cargas-badge">OBSERVACIONES:</span>
                  <span className="obs-cargas-text">
                    {currentData.observacionesGenerales || 'Sin observaciones registradas.'}
                  </span>
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
                      {currentData.planProximo.cargasPendientes.map((p, idx) => (
                        <tr key={p.id || idx} className={idx % 2 === 0 ? 'row-n2-even' : 'row-n2-odd'}>
                          <td className="n2-folio-cell">{p.folioDestino}</td>
                          <td className="n2-cap-cell">{p.capacidad} m³</td>
                          <td className="n2-obs-cell">{p.observacion || '-'}</td>
                        </tr>
                      ))}
                      <tr className="n2-total-row">
                        <td className="n2-total-lbl">TOTAL:</td>
                        <td className="n2-total-val">{totalPendientesMetros} m³</td>
                        <td className="n2-total-empty"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
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
              <button className="btn-close-modal modal-close" onClick={handleCloseEdit} title="Cerrar ventana">
                <X size={18} />
              </button>
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
                    {editForm.cargasEjecutadas.map((carga, index) => (
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
                    ))}
                  </div>

                  <div className="form-group full-width" style={{ marginTop: '1.25rem' }}>
                    <label>Observaciones (Aparece abajo del Total de Cargas)</label>
                    <textarea 
                      className="form-control"
                      rows={2}
                      placeholder="Observaciones de la operación (ej: UNA UNIDAD ESCALONADA POR DÍA...)"
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
                  <div className="edit-section-grid" style={{ marginBottom: '1rem' }}>
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

                    <div className="form-group">
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

                  <div className="edit-section-header-bar">
                    <span>Cargas Pendientes / Escalonadas N-02</span>
                    <button className="btn btn-sm btn-primary" onClick={handleAddCargaPendiente}>
                      <Plus size={14} /> Agregar Escalonada
                    </button>
                  </div>

                  <div className="piezas-edit-list">
                    {editForm.planProximo.cargasPendientes.map((p) => (
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
                          className="btn-delete-row"
                          onClick={() => handleRemoveCargaPendiente(p.id)}
                          title="Eliminar fila"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="form-group full-width" style={{ marginTop: '1.25rem' }}>
                    <label>Observaciones Generales del Día (Opcional)</label>
                    <textarea 
                      className="form-control"
                      rows={2}
                      placeholder="Notas u observaciones generales para el pie de la infografía..."
                      value={editForm.observacionesGenerales || ''}
                      onChange={(e) => setEditForm({ ...editForm, observacionesGenerales: e.target.value })}
                    />
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
