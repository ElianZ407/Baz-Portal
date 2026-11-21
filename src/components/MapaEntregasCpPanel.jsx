import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  MapPin,
  ClipboardPaste,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Search,
  Navigation,
  Tag,
  Trash2
} from 'lucide-react';

const CEDIS = { name: '5796 · CE CD Villahermosa', lat: 17.989, lon: -92.928 };

export const DEFAULT_MAPA_CP_DATA = [
  { cp: '29950', total: 18 },
  { cp: '24100', total: 15 },
  { cp: '30700', total: 12 },
  { cp: '29200', total: 12 },
  { cp: '96400', total: 12 },
  { cp: '30640', total: 12 },
  { cp: '96538', total: 11 },
  { cp: '70110', total: 10 },
  { cp: '96700', total: 9 },
  { cp: '29264', total: 9 },
  { cp: '70000', total: 9 },
  { cp: '96280', total: 8 },
  { cp: '95700', total: 8 },
  { cp: '30799', total: 7 },
  { cp: '86418', total: 7 },
  { cp: '70613', total: 6 },
  { cp: '70600', total: 6 },
  { cp: '30068', total: 6 },
  { cp: '70760', total: 6 },
  { cp: '30740', total: 5 },
  { cp: '96757', total: 5 },
  { cp: '30540', total: 4 },
  { cp: '96729', total: 4 },
  { cp: '30560', total: 4 },
  { cp: '29955', total: 3 },
  { cp: '70300', total: 3 },
  { cp: '96160', total: 3 },
  { cp: '96980', total: 3 },
  { cp: '30750', total: 3 },
  { cp: '96000', total: 3 },
  { cp: '30000', total: 2 },
  { cp: '96680', total: 2 },
  { cp: '30840', total: 2 },
  { cp: '30200', total: 1 }
];

const CATALOGO_CP_SURESTE = {
  '29950': { localidad: 'Ocosingo', estado: 'Chiapas', lat: 16.906, lon: -92.094 },
  '29955': { localidad: 'Ocosingo Zona Sur', estado: 'Chiapas', lat: 16.845, lon: -92.045 },
  '29960': { localidad: 'Palenque', estado: 'Chiapas', lat: 17.509, lon: -91.982 },
  '29930': { localidad: 'Yajalón', estado: 'Chiapas', lat: 17.173, lon: -92.333 },
  '29200': { localidad: 'San Cristóbal Centro', estado: 'Chiapas', lat: 16.737, lon: -92.637 },
  '29264': { localidad: 'San Cristóbal Sur', estado: 'Chiapas', lat: 16.705, lon: -92.625 },
  '29000': { localidad: 'Tuxtla Gutiérrez', estado: 'Chiapas', lat: 16.752, lon: -93.116 },
  '29500': { localidad: 'Reforma', estado: 'Chiapas', lat: 17.865, lon: -93.148 },
  '29520': { localidad: 'Pichucalco', estado: 'Chiapas', lat: 17.509, lon: -93.116 },
  '29770': { localidad: 'Bochil', estado: 'Chiapas', lat: 16.996, lon: -92.890 },
  '30000': { localidad: 'Comitán Centro', estado: 'Chiapas', lat: 16.235, lon: -92.135 },
  '30068': { localidad: 'Comitán Norte', estado: 'Chiapas', lat: 16.285, lon: -92.138 },
  '30140': { localidad: 'Frontera Comalapa', estado: 'Chiapas', lat: 15.661, lon: -92.141 },
  '30200': { localidad: 'Venustiano Carranza', estado: 'Chiapas', lat: 16.340, lon: -92.564 },
  '30400': { localidad: 'Cintalapa', estado: 'Chiapas', lat: 16.695, lon: -93.720 },
  '30450': { localidad: 'Arriaga', estado: 'Chiapas', lat: 16.236, lon: -93.902 },
  '30470': { localidad: 'Villaflores', estado: 'Chiapas', lat: 16.233, lon: -93.268 },
  '30500': { localidad: 'Tonalá', estado: 'Chiapas', lat: 16.089, lon: -93.751 },
  '30540': { localidad: 'Pijijiapan', estado: 'Chiapas', lat: 15.690, lon: -93.210 },
  '30560': { localidad: 'Mapastepec', estado: 'Chiapas', lat: 15.439, lon: -92.899 },
  '30640': { localidad: 'Huixtla', estado: 'Chiapas', lat: 15.137, lon: -92.466 },
  '30700': { localidad: 'Tapachula Centro', estado: 'Chiapas', lat: 14.906, lon: -92.263 },
  '30740': { localidad: 'Tapachula Oriente', estado: 'Chiapas', lat: 14.935, lon: -92.225 },
  '30750': { localidad: 'Tapachula Poniente', estado: 'Chiapas', lat: 14.909, lon: -92.305 },
  '30799': { localidad: 'Tapachula Sur', estado: 'Chiapas', lat: 14.855, lon: -92.250 },
  '30840': { localidad: 'Cd. Hidalgo (Suchiate)', estado: 'Chiapas', lat: 14.680, lon: -92.151 },
  '24100': { localidad: 'Cd. del Carmen', estado: 'Campeche', lat: 18.643, lon: -91.832 },
  '24000': { localidad: 'Campeche', estado: 'Campeche', lat: 19.830, lon: -90.535 },
  '24300': { localidad: 'Candelaria', estado: 'Campeche', lat: 18.186, lon: -91.045 },
  '24350': { localidad: 'Escárcega', estado: 'Campeche', lat: 18.609, lon: -90.745 },
  '70000': { localidad: 'Juchitán de Zaragoza', estado: 'Oaxaca', lat: 16.436, lon: -95.020 },
  '70110': { localidad: 'Cd. Ixtepec', estado: 'Oaxaca', lat: 16.561, lon: -95.098 },
  '70300': { localidad: 'Matías Romero', estado: 'Oaxaca', lat: 16.879, lon: -95.040 },
  '70600': { localidad: 'Salina Cruz Centro', estado: 'Oaxaca', lat: 16.165, lon: -95.195 },
  '70613': { localidad: 'Salina Cruz Norte', estado: 'Oaxaca', lat: 16.215, lon: -95.198 },
  '70760': { localidad: 'Tehuantepec', estado: 'Oaxaca', lat: 16.325, lon: -95.241 },
  '86000': { localidad: 'Villahermosa Centro', estado: 'Tabasco', lat: 17.989, lon: -92.928 },
  '86100': { localidad: 'Villahermosa Norte', estado: 'Tabasco', lat: 18.015, lon: -92.920 },
  '86150': { localidad: 'Villahermosa Tamulté', estado: 'Tabasco', lat: 17.971, lon: -92.952 },
  '86200': { localidad: 'Jalpa de Méndez', estado: 'Tabasco', lat: 18.176, lon: -93.063 },
  '86300': { localidad: 'Comalcalco', estado: 'Tabasco', lat: 18.263, lon: -93.224 },
  '86400': { localidad: 'Huimanguillo', estado: 'Tabasco', lat: 17.835, lon: -93.390 },
  '86418': { localidad: 'La Venta (Huimanguillo)', estado: 'Tabasco', lat: 18.097, lon: -94.041 },
  '86500': { localidad: 'Cárdenas', estado: 'Tabasco', lat: 17.989, lon: -93.376 },
  '86600': { localidad: 'Paraíso', estado: 'Tabasco', lat: 18.399, lon: -93.214 },
  '86690': { localidad: 'Cunduacán', estado: 'Tabasco', lat: 18.066, lon: -93.172 },
  '86700': { localidad: 'Macuspana', estado: 'Tabasco', lat: 17.761, lon: -92.596 },
  '86750': { localidad: 'Frontera', estado: 'Tabasco', lat: 18.543, lon: -92.645 },
  '86800': { localidad: 'Teapa', estado: 'Tabasco', lat: 17.549, lon: -92.952 },
  '86900': { localidad: 'Tenosique', estado: 'Tabasco', lat: 17.471, lon: -91.422 },
  '86980': { localidad: 'Emiliano Zapata', estado: 'Tabasco', lat: 17.742, lon: -91.766 },
  '95700': { localidad: 'San Andrés Tuxtla', estado: 'Veracruz', lat: 18.448, lon: -95.213 },
  '96000': { localidad: 'Acayucan Centro', estado: 'Veracruz', lat: 17.949, lon: -94.925 },
  '96160': { localidad: 'Soconusco / Acayucan', estado: 'Veracruz', lat: 17.968, lon: -94.875 },
  '96280': { localidad: 'Jáltipan de Morelos', estado: 'Veracruz', lat: 17.962, lon: -94.716 },
  '96400': { localidad: 'Coatzacoalcos Centro', estado: 'Veracruz', lat: 18.148, lon: -94.415 },
  '96538': { localidad: 'Coatzacoalcos Poniente', estado: 'Veracruz', lat: 18.132, lon: -94.495 },
  '96680': { localidad: 'Agua Dulce', estado: 'Veracruz', lat: 18.141, lon: -94.142 },
  '96700': { localidad: 'Minatitlán Centro', estado: 'Veracruz', lat: 17.991, lon: -94.547 },
  '96729': { localidad: 'Minatitlán Norte', estado: 'Veracruz', lat: 18.018, lon: -94.595 },
  '96757': { localidad: 'Minatitlán Santa Clara', estado: 'Veracruz', lat: 18.035, lon: -94.558 },
  '96980': { localidad: 'Las Choapas', estado: 'Veracruz', lat: 17.913, lon: -94.094 }
};

const STATE_COLORS = {
  Chiapas: '#38bdf8',
  Veracruz: '#34d399',
  Oaxaca: '#c084fc',
  Campeche: '#fbbf24',
  Tabasco: '#fb7185',
  Otra: '#94a3b8'
};

const LAND_POLYGON = [
  [-96.0, 19.3], [-95.7, 18.95], [-95.2, 18.7], [-94.75, 18.3], [-94.4, 18.15],
  [-94.0, 18.22], [-93.5, 18.35], [-93.15, 18.45], [-92.65, 18.62], [-92.2, 18.68],
  [-91.8, 18.67], [-91.3, 18.92], [-90.8, 19.3], [-90.8, 17.8], [-90.95, 17.8],
  [-90.95, 17.25], [-91.45, 17.25], [-91.45, 16.75], [-90.9, 16.1], [-91.6, 15.8],
  [-92.05, 15.2], [-92.15, 14.53], [-92.42, 14.68], [-92.95, 15.25], [-93.65, 15.8],
  [-94.1, 16.05], [-94.75, 16.22], [-95.22, 16.16], [-95.65, 15.95], [-96.0, 15.75]
];

const STATE_BORDERS = [
  [[-94.12, 18.2], [-94.12, 17.8], [-93.65, 17.35], [-93.1, 17.45], [-92.55, 17.68], [-92.0, 17.8], [-91.45, 17.25]],
  [[-94.12, 17.8], [-94.65, 17.15], [-94.2, 16.5], [-93.9, 16.0]],
  [[-95.7, 18.0], [-95.15, 17.5], [-94.65, 17.15]],
  [[-92.45, 18.65], [-92.35, 18.1], [-91.75, 17.8], [-91.45, 17.8]]
];

const STATE_LABELS = [
  { name: 'VERACRUZ', lat: 18.28, lon: -94.88 },
  { name: 'TABASCO', lat: 17.92, lon: -93.35 },
  { name: 'CAMPECHE', lat: 18.65, lon: -91.28 },
  { name: 'OAXACA', lat: 16.65, lon: -95.48 },
  { name: 'CHIAPAS', lat: 16.38, lon: -93.12 }
];

const BOUNDS = { minLon: -95.95, maxLon: -90.95, minLat: 14.4, maxLat: 19.1 };
const W = 840;
const H = 540;
const PAD = 28;

const project = (lat, lon) => {
  const x = PAD + ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * (W - PAD * 2);
  const y = PAD + ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (H - PAD * 2);
  return [x, y];
};

const buildPath = (coords, close = false) =>
  coords.map(([lon, lat], i) => {
    const [x, y] = project(lat, lon);
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ') + (close ? ' Z' : '');

const resolverInfoCp = (cpRaw) => {
  const cp = String(cpRaw || '').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
  if (CATALOGO_CP_SURESTE[cp]) {
    return { cp, ...CATALOGO_CP_SURESTE[cp] };
  }
  const jitter = ((parseInt(cp.slice(-2), 10) || 0) - 50) * 0.004;
  if (cp.startsWith('29')) return { cp, localidad: `Zona CP ${cp}`, estado: 'Chiapas', lat: 16.85 + jitter, lon: -92.65 + jitter };
  if (cp.startsWith('30')) return { cp, localidad: `Zona CP ${cp}`, estado: 'Chiapas', lat: 15.55 + jitter, lon: -92.55 + jitter };
  if (cp.startsWith('86')) return { cp, localidad: `Zona CP ${cp}`, estado: 'Tabasco', lat: 17.98 + jitter, lon: -92.95 + jitter };
  if (cp.startsWith('95') || cp.startsWith('96')) return { cp, localidad: `Zona CP ${cp}`, estado: 'Veracruz', lat: 18.08 + jitter, lon: -94.65 + jitter };
  if (cp.startsWith('70') || cp.startsWith('71')) return { cp, localidad: `Zona CP ${cp}`, estado: 'Oaxaca', lat: 16.45 + jitter, lon: -95.08 + jitter };
  if (cp.startsWith('24')) return { cp, localidad: `Zona CP ${cp}`, estado: 'Campeche', lat: 18.62 + jitter, lon: -91.55 + jitter };
  return { cp, localidad: `CP ${cp}`, estado: 'Otra', lat: 17.6 + jitter, lon: -93.1 + jitter };
};

export const parsearTablaCp = (textoCrudo) => {
  const lineas = String(textoCrudo || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const acumulador = new Map();

  lineas.forEach((linea) => {
    const upper = linea.toUpperCase();
    if (
      upper.includes('TOTAL GENERAL') ||
      upper.includes('CUENTA DE PEDIDO') ||
      upper.includes('ETIQUETAS DE COLUMNA') ||
      upper.includes('CE CD VILLAHERMOSA')
    ) {
      return;
    }

    const cols = linea.includes('\t')
      ? linea.split('\t').map((c) => c.trim()).filter(Boolean)
      : linea.split(/\s+/).filter(Boolean);

    if (cols.length < 2) return;

    const cpToken = cols[0].replace(/\D/g, '');
    if (cpToken.length !== 5) return;

    const numeros = cols.slice(1)
      .map((c) => Number(String(c).replace(/[^\d.]/g, '')))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (numeros.length === 0) return;

    const total = numeros[numeros.length - 1];
    acumulador.set(cpToken, (acumulador.get(cpToken) || 0) + total);
  });

  return Array.from(acumulador.entries())
    .map(([cp, total]) => ({ cp, total }))
    .sort((a, b) => b.total - a.total);
};

export const MapaEntregasCpPanel = ({
  items,
  fechaTexto,
  onUpdateItems,
  showToast
}) => {
  const [selectedState, setSelectedState] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [selectedCp, setSelectedCp] = useState(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [labelMode, setLabelMode] = useState('top');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);

  const dragRef = useRef({ active: false, startX: 0, startY: 0 });
  const mapCardRef = useRef(null);
  const mapWrapRef = useRef(null);

  const enrichedData = useMemo(() => {
    const source = Array.isArray(items) && items.length > 0 ? items : DEFAULT_MAPA_CP_DATA;
    return source
      .map((row) => ({
        ...resolverInfoCp(row.cp),
        total: Number(row.total) || 0
      }))
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [items]);

  const totalGeneral = useMemo(
    () => enrichedData.reduce((acc, d) => acc + d.total, 0),
    [enrichedData]
  );

  const stateTotals = useMemo(() => {
    const map = {};
    enrichedData.forEach((d) => {
      map[d.estado] = (map[d.estado] || 0) + d.total;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [enrichedData]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedData.filter((d) => {
      if (selectedState !== 'TODOS' && d.estado !== selectedState) return false;
      if (!q) return true;
      return (
        d.cp.includes(q) ||
        d.localidad.toLowerCase().includes(q) ||
        d.estado.toLowerCase().includes(q)
      );
    });
  }, [enrichedData, selectedState, search]);

  const filteredSum = useMemo(
    () => filteredData.reduce((acc, d) => acc + d.total, 0),
    [filteredData]
  );

  const aplicarTextoPegado = useCallback((texto) => {
    const parsed = parsearTablaCp(texto);
    if (parsed.length === 0) {
      showToast('No se detectaron códigos postales (5 dígitos + total). Copia las columnas CE y Total general desde Excel.');
      return false;
    }
    const suma = parsed.reduce((acc, r) => acc + r.total, 0);
    onUpdateItems(parsed);
    setSelectedState('TODOS');
    setSelectedCp(null);
    showToast(`Mapa actualizado: ${parsed.length} códigos postales (${suma} entregas totales).`);
    return true;
  }, [onUpdateItems, showToast]);

  const handlePasteButton = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const texto = await navigator.clipboard.readText();
        if (texto && texto.trim()) {
          aplicarTextoPegado(texto);
          return;
        }
      }
      showToast('Copia primero las filas de Excel (CE y Total general) con Ctrl+C y presiona Ctrl+V aquí.');
    } catch {
      showToast('Usa Ctrl+V directamente en el teclado para pegar tu tabla de códigos postales.');
    }
  };

  useEffect(() => {
    const onPaste = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const texto = e.clipboardData?.getData('text/plain') || '';
      if (texto && (texto.includes('\n') || texto.includes('\t'))) {
        if (parsearTablaCp(texto).length > 0) {
          e.preventDefault();
          aplicarTextoPegado(texto);
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [aplicarTextoPegado]);

  const handleDownloadMap = async () => {
    if (!mapCardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const canvas = await html2canvas(mapCardRef.current, {
        scale: 2,
        backgroundColor: '#070b14',
        useCORS: true
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.download = `Mapa_CP_Entregas_Villahermosa.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Mapa descargado en imagen HD.');
    } catch {
      showToast('No se pudo exportar la imagen del mapa.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleMouseDown = (e) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (dragRef.current.active) {
      const dx = (e.clientX - dragRef.current.startX) / zoom;
      const dy = (e.clientY - dragRef.current.startY) / zoom;
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }
    if (hoveredItem && mapWrapRef.current) {
      const rect = mapWrapRef.current.getBoundingClientRect();
      setTooltipPos({
        x: Math.min(rect.width - 205, Math.max(12, e.clientX - rect.left + 14)),
        y: Math.min(rect.height - 90, Math.max(12, e.clientY - rect.top - 12))
      });
    }
  };

  const handleMouseUp = () => {
    dragRef.current.active = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.2 : 0.84;
    setZoom((z) => {
      const next = Math.max(1, Math.min(6, z * factor));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleSelectCp = (item, zoomToPoint = false) => {
    const nextCp = selectedCp === item.cp ? null : item.cp;
    setSelectedCp(nextCp);
    if (nextCp && zoomToPoint) {
      const [px, py] = project(item.lat, item.lon);
      setZoom((z) => Math.max(z, 1.9));
      setPan({ x: W / 2 - px, y: H / 2 - py });
    }
  };

  const [cedisX, cedisY] = project(CEDIS.lat, CEDIS.lon);
  const invZoom = 1 / Math.sqrt(zoom);
  const vbW = W / zoom;
  const vbH = H / zoom;
  const vbX = (W - vbW) / 2 - pan.x;
  const vbY = (H - vbH) / 2 - pan.y;

  const topCp = enrichedData[0] || { cp: '—', localidad: '', total: 0 };
  const topState = stateTotals[0] || ['—', 0];
  const selectedObj = enrichedData.find((d) => d.cp === selectedCp);

  return (
    <div className="mapa-cp-wrapper" ref={mapCardRef}>
      <div className="mapa-cp-header-card">
        <div>
          <div className="mapa-cp-eyebrow">5796 · CE CD VILLAHERMOSA · {fechaTexto}</div>
          <h2 className="mapa-cp-title">
            <MapPin size={19} color="#38bdf8" />
            <span>Mapa de Códigos Postales de Entrega</span>
          </h2>
        </div>

        <div className="mapa-cp-toolbar-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handlePasteButton}
            title="Copiar tabla de Excel (CE y Total general) y pegarla aquí (o presiona Ctrl+V)"
          >
            <ClipboardPaste size={14} />
            <span>Pegar tabla CP (Ctrl+V)</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowRoutes((v) => !v)}
          >
            <Navigation size={14} />
            <span>Rutas: {showRoutes ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setLabelMode((m) => (m === 'top' ? 'all' : m === 'all' ? 'none' : 'top'))}
          >
            <Tag size={14} />
            <span>CPs: {labelMode === 'top' ? 'Top' : labelMode === 'all' ? 'Todos' : 'Ocultos'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleDownloadMap}
            disabled={isExporting}
          >
            <Download size={14} />
            <span>{isExporting ? 'Generando...' : 'Descargar PNG'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onUpdateItems(DEFAULT_MAPA_CP_DATA);
              setSelectedState('TODOS');
              setSelectedCp(null);
              showToast('Restaurados los 34 códigos postales base (230 entregas).');
            }}
            title="Restaurar datos base"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mapa-cp-kpi-grid">
        <div className="mapa-cp-kpi-card">
          <span className="mapa-cp-kpi-label">Total general</span>
          <strong className="mapa-cp-kpi-value">{totalGeneral}</strong>
          <span className="mapa-cp-kpi-sub">entregas registradas</span>
        </div>
        <div className="mapa-cp-kpi-card">
          <span className="mapa-cp-kpi-label">Códigos Postales</span>
          <strong className="mapa-cp-kpi-value">{enrichedData.length}</strong>
          <span className="mapa-cp-kpi-sub">zonas de entrega</span>
        </div>
        <div className="mapa-cp-kpi-card">
          <span className="mapa-cp-kpi-label">CP con mayor volumen</span>
          <strong className="mapa-cp-kpi-value" style={{ color: '#38bdf8' }}>{topCp.cp}</strong>
          <span className="mapa-cp-kpi-sub">{topCp.localidad} · {topCp.total} entregas</span>
        </div>
        <div className="mapa-cp-kpi-card">
          <span className="mapa-cp-kpi-label">Estado líder</span>
          <strong className="mapa-cp-kpi-value" style={{ color: '#34d399' }}>{topState[0]}</strong>
          <span className="mapa-cp-kpi-sub">
            {topState[1]} entregas ({totalGeneral > 0 ? ((topState[1] / totalGeneral) * 100).toFixed(1) : '0.0'}%)
          </span>
        </div>
      </div>

      <div className="mapa-cp-filters-row">
        <div className="mapa-cp-pills">
          <button
            type="button"
            className={`pill-btn ${selectedState === 'TODOS' ? 'active' : ''}`}
            onClick={() => setSelectedState('TODOS')}
          >
            Todos ({totalGeneral})
          </button>
          {stateTotals.map(([st, val]) => (
            <button
              key={st}
              type="button"
              className={`pill-btn ${selectedState === st ? 'active' : ''}`}
              onClick={() => setSelectedState(st)}
            >
              <span className="mapa-cp-dot" style={{ background: STATE_COLORS[st] || '#94a3b8' }} />
              {st} ({val})
            </button>
          ))}
        </div>

        <div className="mapa-cp-search">
          <Search size={14} color="#64748b" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar CP o localidad..."
          />
        </div>
      </div>

      <div className="mapa-cp-main-grid">
        <div className="mapa-cp-canvas-card">
          <div className="mapa-cp-canvas-topbar">
            <span>Cobertura Sureste · Proyección Geográfica</span>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn-action-icon"
                onClick={() => setZoom((z) => Math.min(6, z * 1.35))}
                title="Acercar"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                className="btn-action-icon"
                onClick={() => {
                  setZoom((z) => {
                    const next = Math.max(1, z / 1.35);
                    if (next === 1) setPan({ x: 0, y: 0 });
                    return next;
                  });
                }}
                title="Alejar"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                className="btn-action-icon"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  setSelectedCp(null);
                }}
                title="Centrar mapa"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          <div
            className="mapa-cp-svg-wrap"
            ref={mapWrapRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              handleMouseUp();
              setHoveredItem(null);
            }}
          >
            <svg
              className="mapa-cp-svg"
              viewBox={`${vbX.toFixed(1)} ${vbY.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}`}
              preserveAspectRatio="xMidYMid meet"
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
            >
              <rect x="-400" y="-400" width="1640" height="1340" fill="#07101f" />

              {[-95, -94, -93, -92, -91].map((lon) => {
                const [gx] = project(17, lon);
                return (
                  <line
                    key={`lon-${lon}`}
                    x1={gx}
                    y1={0}
                    x2={gx}
                    y2={H}
                    stroke="#1e293b"
                    strokeWidth={0.7 * invZoom}
                    strokeDasharray="3 4"
                  />
                );
              })}

              {[15, 16, 17, 18, 19].map((lat) => {
                const [, gy] = project(lat, -93);
                return (
                  <line
                    key={`lat-${lat}`}
                    x1={0}
                    y1={gy}
                    x2={W}
                    y2={gy}
                    stroke="#1e293b"
                    strokeWidth={0.7 * invZoom}
                    strokeDasharray="3 4"
                  />
                );
              })}

              <path
                d={buildPath(LAND_POLYGON, true)}
                fill="#0f1b33"
                stroke="#253b5e"
                strokeWidth={1.4 * invZoom}
              />

              {STATE_BORDERS.map((border, idx) => (
                <path
                  key={`border-${idx}`}
                  d={buildPath(border, false)}
                  fill="none"
                  stroke="#334e78"
                  strokeWidth={1.1 * invZoom}
                  strokeDasharray="4 3"
                />
              ))}

              {STATE_LABELS.map((sl) => {
                const [sx, sy] = project(sl.lat, sl.lon);
                return (
                  <text
                    key={sl.name}
                    x={sx}
                    y={sy}
                    textAnchor="middle"
                    fontSize={11 * invZoom}
                    fontWeight="700"
                    letterSpacing="2"
                    fill="#64748b"
                    opacity="0.5"
                  >
                    {sl.name}
                  </text>
                );
              })}

              {showRoutes && filteredData.map((d) => {
                const [tx, ty] = project(d.lat, d.lon);
                const mx = (cedisX + tx) / 2;
                const my = (cedisY + ty) / 2 - Math.hypot(tx - cedisX, ty - cedisY) * 0.08;
                const isSel = selectedCp === d.cp;
                return (
                  <path
                    key={`route-${d.cp}`}
                    d={`M${cedisX.toFixed(1)},${cedisY.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}`}
                    fill="none"
                    stroke={STATE_COLORS[d.estado] || '#38bdf8'}
                    strokeWidth={(isSel ? 2.4 : 1) * invZoom}
                    strokeOpacity={isSel ? 0.92 : 0.25}
                  />
                );
              })}

              {filteredData.map((d) => {
                const [x, y] = project(d.lat, d.lon);
                const r = (5.5 + Math.sqrt(d.total) * 3.1) * invZoom;
                const color = STATE_COLORS[d.estado] || '#38bdf8';
                const isSel = selectedCp === d.cp;
                const showLbl = isSel || labelMode === 'all' || (labelMode === 'top' && d.total >= 9);

                return (
                  <g
                    key={d.cp}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredItem(d)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleSelectCp(d, false);
                    }}
                  >
                    {isSel && (
                      <circle
                        cx={x}
                        cy={y}
                        r={r + 6 * invZoom}
                        fill="none"
                        stroke={color}
                        strokeWidth={2 * invZoom}
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={color}
                      fillOpacity={isSel ? 0.96 : 0.76}
                      stroke="#070b14"
                      strokeWidth={1.4 * invZoom}
                    />
                    {(r >= 8.5 * invZoom || isSel) && (
                      <text
                        x={x}
                        y={y + 3.4 * invZoom}
                        textAnchor="middle"
                        fontSize={9.5 * invZoom}
                        fontWeight="800"
                        fill="#04070f"
                        style={{ pointerEvents: 'none' }}
                      >
                        {d.total}
                      </text>
                    )}
                    {showLbl && (
                      <text
                        x={x}
                        y={y - r - 3.5 * invZoom}
                        textAnchor="middle"
                        fontSize={9.5 * invZoom}
                        fontWeight="700"
                        fill="#f8fafc"
                        stroke="#070b14"
                        strokeWidth={2.8 * invZoom}
                        paintOrder="stroke"
                        style={{ pointerEvents: 'none' }}
                      >
                        {d.cp}
                      </text>
                    )}
                  </g>
                );
              })}

              <g style={{ pointerEvents: 'none' }}>
                <circle cx={cedisX} cy={cedisY} r={13 * invZoom} fill="#fbbf24" fillOpacity="0.18" />
                <polygon
                  points={`${cedisX},${cedisY - 8.5 * invZoom} ${cedisX + 8.5 * invZoom},${cedisY} ${cedisX},${cedisY + 8.5 * invZoom} ${cedisX - 8.5 * invZoom},${cedisY}`}
                  fill="#fbbf24"
                  stroke="#070b14"
                  strokeWidth={1.5 * invZoom}
                />
                <text
                  x={cedisX}
                  y={cedisY - 11.5 * invZoom}
                  textAnchor="middle"
                  fontSize={10 * invZoom}
                  fontWeight="800"
                  fill="#fbbf24"
                  stroke="#070b14"
                  strokeWidth={3 * invZoom}
                  paintOrder="stroke"
                >
                  CEDIS VILLAHERMOSA
                </text>
              </g>
            </svg>

            {hoveredItem && (
              <div
                className="mapa-cp-tooltip"
                style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
              >
                <div className="mapa-cp-tooltip-title">CP {hoveredItem.cp}</div>
                <div className="mapa-cp-tooltip-loc">{hoveredItem.localidad}, {hoveredItem.estado}</div>
                <div className="mapa-cp-tooltip-val">
                  Total general: <strong>{hoveredItem.total}</strong> ({totalGeneral > 0 ? ((hoveredItem.total / totalGeneral) * 100).toFixed(1) : '0.0'}%)
                </div>
              </div>
            )}

            <div className="mapa-cp-legend">
              <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: '0.2rem' }}>Tamaño = Entregas</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span>● 1–4</span>
                <span>● 5–10</span>
                <span>● 11+</span>
                <span style={{ color: '#fbbf24' }}>◆ CEDIS</span>
              </div>
            </div>
          </div>

          <div className="mapa-cp-selected-bar">
            {selectedObj ? (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span className="mapa-cp-dot" style={{ background: STATE_COLORS[selectedObj.estado] }} />
                  <strong>CP {selectedObj.cp}</strong> · {selectedObj.localidad}, {selectedObj.estado}
                </span>
                <strong>
                  {selectedObj.total} entregas ({totalGeneral > 0 ? ((selectedObj.total / totalGeneral) * 100).toFixed(1) : '0.0'}%)
                </strong>
              </>
            ) : (
              <span style={{ color: '#94a3b8' }}>
                Haz clic en cualquier burbuja o fila para enfocar el código postal, o presiona Ctrl+V con tu tabla de Excel.
              </span>
            )}
          </div>
        </div>

        <div className="mapa-cp-table-card">
          <div className="mapa-cp-canvas-topbar">
            <span>Detalle por Código Postal (CE)</span>
            <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {filteredData.length} CPs · {filteredSum}
            </span>
          </div>
          <div className="mapa-cp-table-scroll">
            <table className="mapa-cp-table">
              <thead>
                <tr>
                  <th>CP (CE)</th>
                  <th>Localidad</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((d) => (
                  <tr
                    key={d.cp}
                    className={selectedCp === d.cp ? 'active-row' : ''}
                    onClick={() => handleSelectCp(d, true)}
                  >
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      <span className="mapa-cp-dot" style={{ background: STATE_COLORS[d.estado] }} />
                      {d.cp}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{d.localidad}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{d.estado}</div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#38bdf8' }}>
                      {d.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mapa-cp-states-card">
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.65rem' }}>
          Distribución por Estado
        </div>
        <div className="mapa-cp-states-grid">
          {stateTotals.map(([st, val]) => {
            const pct = totalGeneral > 0 ? ((val / totalGeneral) * 100).toFixed(1) : '0.0';
            const countCps = enrichedData.filter((d) => d.estado === st).length;
            return (
              <div key={st} className="mapa-cp-state-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
                  <span>{st}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{val} ({pct}%)</span>
                </div>
                <div className="mapa-cp-bar-track">
                  <div
                    className="mapa-cp-bar-fill"
                    style={{ width: `${pct}%`, background: STATE_COLORS[st] || '#38bdf8' }}
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  {countCps} códigos postales
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
