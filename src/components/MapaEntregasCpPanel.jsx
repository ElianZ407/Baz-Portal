import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  MapPin,
  ClipboardPaste,
  Download,
  RotateCcw,
  Search,
  Navigation,
  Trash2,
  Route,
  Compass,
  Clock,
  Layers
} from 'lucide-react';

const CEDIS = { name: '5796 · CE CD Villahermosa', lat: 17.989, lon: -92.928 };

const CACHE_GEO_KEY = 'baz_cp_geocache_v1';
const CACHE_OSRM_KEY = 'baz_cp_osrm_table_v1';

let leafletPromise = null;

const cargarLeaflet = () => {
  if (typeof window !== 'undefined' && window.L) {
    return Promise.resolve(window.L);
  }
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css-cdn')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-cdn';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => {
      leafletPromise = null;
      reject(new Error('No se pudo cargar el motor de mapas.'));
    };
    document.head.appendChild(script);
  });

  return leafletPromise;
};

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
  '29950': { localidad: 'Ocosingo', estado: 'Chiapas', lat: 16.906, lon: -92.094, carretera: 'MEX-186 / MEX-199 Selva', kmBase: 256 },
  '29955': { localidad: 'Ocosingo Zona Sur', estado: 'Chiapas', lat: 16.845, lon: -92.045, carretera: 'MEX-186 / MEX-199 Selva', kmBase: 264 },
  '29960': { localidad: 'Palenque', estado: 'Chiapas', lat: 17.509, lon: -91.982, carretera: 'MEX-186 Villahermosa–Escárcega', kmBase: 144 },
  '29930': { localidad: 'Yajalón', estado: 'Chiapas', lat: 17.173, lon: -92.333, carretera: 'MEX-186 / Ramal Tulijá', kmBase: 215 },
  '29200': { localidad: 'San Cristóbal Centro', estado: 'Chiapas', lat: 16.737, lon: -92.637, carretera: 'MEX-195 / MEX-190D Altos', kmBase: 288 },
  '29264': { localidad: 'San Cristóbal Sur', estado: 'Chiapas', lat: 16.705, lon: -92.625, carretera: 'MEX-195 / MEX-190D Altos', kmBase: 292 },
  '29000': { localidad: 'Tuxtla Gutiérrez', estado: 'Chiapas', lat: 16.752, lon: -93.116, carretera: 'MEX-187 / MEX-145D Las Choapas–Ocozocoautla', kmBase: 285 },
  '29500': { localidad: 'Reforma', estado: 'Chiapas', lat: 17.865, lon: -93.148, carretera: 'MEX-180 / Ramal Reforma', kmBase: 36 },
  '29520': { localidad: 'Pichucalco', estado: 'Chiapas', lat: 17.509, lon: -93.116, carretera: 'MEX-195 Villahermosa–Tuxtla', kmBase: 78 },
  '29770': { localidad: 'Bochil', estado: 'Chiapas', lat: 16.996, lon: -92.890, carretera: 'MEX-195 Sierra Chiapas', kmBase: 198 },
  '30000': { localidad: 'Comitán Centro', estado: 'Chiapas', lat: 16.235, lon: -92.135, carretera: 'MEX-190 Panamericana', kmBase: 376 },
  '30068': { localidad: 'Comitán Norte', estado: 'Chiapas', lat: 16.285, lon: -92.138, carretera: 'MEX-190 Panamericana', kmBase: 372 },
  '30140': { localidad: 'Frontera Comalapa', estado: 'Chiapas', lat: 15.661, lon: -92.141, carretera: 'MEX-190 / MEX-211 Fronteriza', kmBase: 452 },
  '30200': { localidad: 'Venustiano Carranza', estado: 'Chiapas', lat: 16.340, lon: -92.564, carretera: 'MEX-190 / Ramal Angostura', kmBase: 342 },
  '30400': { localidad: 'Cintalapa', estado: 'Chiapas', lat: 16.695, lon: -93.720, carretera: 'MEX-145D / MEX-190', kmBase: 332 },
  '30450': { localidad: 'Arriaga', estado: 'Chiapas', lat: 16.236, lon: -93.902, carretera: 'MEX-145D / MEX-200 Costera', kmBase: 378 },
  '30470': { localidad: 'Villaflores', estado: 'Chiapas', lat: 16.233, lon: -93.268, carretera: 'MEX-145D / MEX-230 Frailesca', kmBase: 356 },
  '30500': { localidad: 'Tonalá', estado: 'Chiapas', lat: 16.089, lon: -93.751, carretera: 'MEX-200 Costera Pacífico', kmBase: 402 },
  '30540': { localidad: 'Pijijiapan', estado: 'Chiapas', lat: 15.690, lon: -93.210, carretera: 'MEX-200 Costera Soconusco', kmBase: 472 },
  '30560': { localidad: 'Mapastepec', estado: 'Chiapas', lat: 15.439, lon: -92.899, carretera: 'MEX-200 Costera Soconusco', kmBase: 516 },
  '30640': { localidad: 'Huixtla', estado: 'Chiapas', lat: 15.137, lon: -92.466, carretera: 'MEX-200 Costera Soconusco', kmBase: 578 },
  '30700': { localidad: 'Tapachula Centro', estado: 'Chiapas', lat: 14.906, lon: -92.263, carretera: 'MEX-200 Costera Soconusco', kmBase: 618 },
  '30740': { localidad: 'Tapachula Oriente', estado: 'Chiapas', lat: 14.935, lon: -92.225, carretera: 'MEX-200 Costera Soconusco', kmBase: 622 },
  '30750': { localidad: 'Tapachula Poniente', estado: 'Chiapas', lat: 14.909, lon: -92.305, carretera: 'MEX-200 Costera Soconusco', kmBase: 615 },
  '30799': { localidad: 'Tapachula Sur', estado: 'Chiapas', lat: 14.855, lon: -92.250, carretera: 'MEX-200 /MEX-225 Puerto Madero', kmBase: 626 },
  '30840': { localidad: 'Cd. Hidalgo (Suchiate)', estado: 'Chiapas', lat: 14.680, lon: -92.151, carretera: 'MEX-200 Frontera Sur', kmBase: 654 },
  '24100': { localidad: 'Cd. del Carmen', estado: 'Campeche', lat: 18.643, lon: -91.832, carretera: 'MEX-180 Costera del Golfo', kmBase: 168 },
  '24000': { localidad: 'Campeche', estado: 'Campeche', lat: 19.830, lon: -90.535, carretera: 'MEX-180 / MEX-186 Golfo', kmBase: 382 },
  '24300': { localidad: 'Candelaria', estado: 'Campeche', lat: 18.186, lon: -91.045, carretera: 'MEX-186 Villahermosa–Escárcega', kmBase: 262 },
  '24350': { localidad: 'Escárcega', estado: 'Campeche', lat: 18.609, lon: -90.745, carretera: 'MEX-186 Villahermosa–Escárcega', kmBase: 298 },
  '70000': { localidad: 'Juchitán de Zaragoza', estado: 'Oaxaca', lat: 16.436, lon: -95.020, carretera: 'MEX-185 Transístmica / MEX-190', kmBase: 416 },
  '70110': { localidad: 'Cd. Ixtepec', estado: 'Oaxaca', lat: 16.561, lon: -95.098, carretera: 'MEX-185 Transístmica / MEX-185D', kmBase: 412 },
  '70300': { localidad: 'Matías Romero', estado: 'Oaxaca', lat: 16.879, lon: -95.040, carretera: 'MEX-185 Transístmica', kmBase: 362 },
  '70600': { localidad: 'Salina Cruz Centro', estado: 'Oaxaca', lat: 16.165, lon: -95.195, carretera: 'MEX-185 Transístmica Sur', kmBase: 462 },
  '70613': { localidad: 'Salina Cruz Norte', estado: 'Oaxaca', lat: 16.215, lon: -95.198, carretera: 'MEX-185 Transístmica Sur', kmBase: 458 },
  '70760': { localidad: 'Tehuantepec', estado: 'Oaxaca', lat: 16.325, lon: -95.241, carretera: 'MEX-185 / MEX-190 Istmo', kmBase: 444 },
  '86000': { localidad: 'Villahermosa Centro', estado: 'Tabasco', lat: 17.989, lon: -92.928, carretera: 'Zona Metropolitana VHSA', kmBase: 8 },
  '86100': { localidad: 'Villahermosa Norte', estado: 'Tabasco', lat: 18.015, lon: -92.920, carretera: 'Zona Metropolitana VHSA', kmBase: 9 },
  '86150': { localidad: 'Villahermosa Tamulté', estado: 'Tabasco', lat: 17.971, lon: -92.952, carretera: 'Zona Metropolitana VHSA', kmBase: 11 },
  '86200': { localidad: 'Jalpa de Méndez', estado: 'Tabasco', lat: 18.176, lon: -93.063, carretera: 'Estatal VHSA–Comalcalco', kmBase: 38 },
  '86300': { localidad: 'Comalcalco', estado: 'Tabasco', lat: 18.263, lon: -93.224, carretera: 'MEX-187 / Vía Corta Comalcalco', kmBase: 58 },
  '86400': { localidad: 'Huimanguillo', estado: 'Tabasco', lat: 17.835, lon: -93.390, carretera: 'MEX-180 / MEX-187', kmBase: 68 },
  '86418': { localidad: 'La Venta (Huimanguillo)', estado: 'Tabasco', lat: 18.097, lon: -94.041, carretera: 'MEX-180D Villahermosa–Coatzacoalcos', kmBase: 124 },
  '86500': { localidad: 'Cárdenas', estado: 'Tabasco', lat: 17.989, lon: -93.376, carretera: 'MEX-180D Villahermosa–Cárdenas', kmBase: 49 },
  '86600': { localidad: 'Paraíso', estado: 'Tabasco', lat: 18.399, lon: -93.214, carretera: 'MEX-187 Cárdenas–Paraíso', kmBase: 74 },
  '86690': { localidad: 'Cunduacán', estado: 'Tabasco', lat: 18.066, lon: -93.172, carretera: 'MEX-180D / Vía Corta', kmBase: 32 },
  '86700': { localidad: 'Macuspana', estado: 'Tabasco', lat: 17.761, lon: -92.596, carretera: 'MEX-186 Villahermosa–Macuspana', kmBase: 52 },
  '86750': { localidad: 'Frontera', estado: 'Tabasco', lat: 18.543, lon: -92.645, carretera: 'MEX-180 Costera del Golfo', kmBase: 78 },
  '86800': { localidad: 'Teapa', estado: 'Tabasco', lat: 17.549, lon: -92.952, carretera: 'MEX-195 Villahermosa–Teapa', kmBase: 58 },
  '86900': { localidad: 'Tenosique', estado: 'Tabasco', lat: 17.471, lon: -91.422, carretera: 'MEX-186 / MEX-203 Emiliano Zapata–Tenosique', kmBase: 224 },
  '86980': { localidad: 'Emiliano Zapata', estado: 'Tabasco', lat: 17.742, lon: -91.766, carretera: 'MEX-186 / MEX-203', kmBase: 148 },
  '95700': { localidad: 'San Andrés Tuxtla', estado: 'Veracruz', lat: 18.448, lon: -95.213, carretera: 'MEX-180 Costera Los Tuxtlas', kmBase: 324 },
  '96000': { localidad: 'Acayucan Centro', estado: 'Veracruz', lat: 17.949, lon: -94.925, carretera: 'MEX-180D / MEX-145D', kmBase: 236 },
  '96160': { localidad: 'Soconusco / Acayucan', estado: 'Veracruz', lat: 17.968, lon: -94.875, carretera: 'MEX-180D / MEX-185', kmBase: 231 },
  '96280': { localidad: 'Jáltipan de Morelos', estado: 'Veracruz', lat: 17.962, lon: -94.716, carretera: 'MEX-180 / MEX-185 Transístmica', kmBase: 212 },
  '96400': { localidad: 'Coatzacoalcos Centro', estado: 'Veracruz', lat: 18.148, lon: -94.415, carretera: 'MEX-180D Villahermosa–Coatzacoalcos', kmBase: 168 },
  '96538': { localidad: 'Coatzacoalcos Poniente', estado: 'Veracruz', lat: 18.132, lon: -94.495, carretera: 'MEX-180D Villahermosa–Coatzacoalcos', kmBase: 174 },
  '96680': { localidad: 'Agua Dulce', estado: 'Veracruz', lat: 18.141, lon: -94.142, carretera: 'MEX-180D / Ramal Agua Dulce', kmBase: 134 },
  '96700': { localidad: 'Minatitlán Centro', estado: 'Veracruz', lat: 17.991, lon: -94.547, carretera: 'MEX-180D / Autopista Nuevo Teapa–Cosoleacaque', kmBase: 186 },
  '96729': { localidad: 'Minatitlán Norte', estado: 'Veracruz', lat: 18.018, lon: -94.595, carretera: 'MEX-180D / Autopista Nuevo Teapa–Cosoleacaque', kmBase: 191 },
  '96757': { localidad: 'Minatitlán Santa Clara', estado: 'Veracruz', lat: 18.035, lon: -94.558, carretera: 'MEX-180D / Autopista Nuevo Teapa–Cosoleacaque', kmBase: 189 },
  '96980': { localidad: 'Las Choapas', estado: 'Veracruz', lat: 17.913, lon: -94.094, carretera: 'MEX-180D / MEX-145D Las Choapas', kmBase: 138 }
};

const STATE_COLORS = {
  Chiapas: '#38bdf8',
  Veracruz: '#34d399',
  Oaxaca: '#c084fc',
  Campeche: '#fbbf24',
  Tabasco: '#fb7185',
  Otra: '#94a3b8'
};

const calcularKmHaversineCarretera = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(5, Math.round(R * c * 1.34));
};

const inferirCorredorCarretero = (cp, estado) => {
  if (cp.startsWith('305') || cp.startsWith('306') || cp.startsWith('307') || cp.startsWith('308')) return 'MEX-200 Costera Soconusco';
  if (cp.startsWith('299')) return 'MEX-186 / MEX-199 Selva';
  if (cp.startsWith('292') || cp.startsWith('300') || cp.startsWith('301') || cp.startsWith('302')) return 'MEX-195 / MEX-190 Altos–Frontera';
  if (cp.startsWith('29')) return 'MEX-195 / MEX-145D Chiapas Centro';
  if (cp.startsWith('70') || cp.startsWith('71') || estado === 'Oaxaca') return 'MEX-185 Transístmica / Istmo';
  if (cp.startsWith('95') || cp.startsWith('96') || estado === 'Veracruz') return 'MEX-180D Corredor Golfo Sur';
  if (cp.startsWith('24') || estado === 'Campeche') return 'MEX-180 / MEX-186 Península';
  if (cp.startsWith('86') || estado === 'Tabasco') return 'Red Estatal / MEX-180 Tabasco';
  return 'Red Federal Sureste';
};

const resolverInfoCpBase = (cpRaw, dynamicGeoMap = {}) => {
  const cp = String(cpRaw || '').replace(/\D/g, '').padStart(5, '0').slice(0, 5);
  if (CATALOGO_CP_SURESTE[cp]) {
    return { cp, ...CATALOGO_CP_SURESTE[cp] };
  }
  if (dynamicGeoMap[cp]) {
    const dyn = dynamicGeoMap[cp];
    return {
      cp,
      localidad: dyn.localidad,
      estado: dyn.estado,
      lat: dyn.lat,
      lon: dyn.lon,
      carretera: dyn.carretera || inferirCorredorCarretero(cp, dyn.estado),
      kmBase: dyn.kmBase || calcularKmHaversineCarretera(CEDIS.lat, CEDIS.lon, dyn.lat, dyn.lon)
    };
  }
  const jitter = ((parseInt(cp.slice(-2), 10) || 0) - 50) * 0.004;
  let base;
  if (cp.startsWith('29')) base = { localidad: `Zona CP ${cp}`, estado: 'Chiapas', lat: 16.85 + jitter, lon: -92.65 + jitter };
  else if (cp.startsWith('30')) base = { localidad: `Zona CP ${cp}`, estado: 'Chiapas', lat: 15.55 + jitter, lon: -92.55 + jitter };
  else if (cp.startsWith('86')) base = { localidad: `Zona CP ${cp}`, estado: 'Tabasco', lat: 17.98 + jitter, lon: -92.95 + jitter };
  else if (cp.startsWith('95') || cp.startsWith('96')) base = { localidad: `Zona CP ${cp}`, estado: 'Veracruz', lat: 18.08 + jitter, lon: -94.65 + jitter };
  else if (cp.startsWith('70') || cp.startsWith('71')) base = { localidad: `Zona CP ${cp}`, estado: 'Oaxaca', lat: 16.45 + jitter, lon: -95.08 + jitter };
  else if (cp.startsWith('24')) base = { localidad: `Zona CP ${cp}`, estado: 'Campeche', lat: 18.62 + jitter, lon: -91.55 + jitter };
  else base = { localidad: `CP ${cp}`, estado: 'Otra', lat: 17.6 + jitter, lon: -93.1 + jitter };

  return {
    cp,
    ...base,
    carretera: inferirCorredorCarretero(cp, base.estado),
    kmBase: calcularKmHaversineCarretera(CEDIS.lat, CEDIS.lon, base.lat, base.lon)
  };
};

const formatearDuracion = (horasFloat) => {
  if (!Number.isFinite(horasFloat) || horasFloat <= 0) return '—';
  const totalMin = Math.round(horasFloat * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
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
  const [tileMode, setTileMode] = useState('carretero');
  const [leafletReady, setLeafletReady] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [apiStatus, setApiStatus] = useState('calculando');

  const [dynamicGeoMap, setDynamicGeoMap] = useState(() => {
    try {
      const saved = localStorage.getItem(CACHE_GEO_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [osrmMetrics, setOsrmMetrics] = useState(() => {
    try {
      const saved = localStorage.getItem(CACHE_OSRM_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedRouteGeometry, setSelectedRouteGeometry] = useState(null);

  const mapCardRef = useRef(null);
  const leafletContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routesLayerRef = useRef(null);

  const rawItems = useMemo(
    () => (Array.isArray(items) && items.length > 0 ? items : DEFAULT_MAPA_CP_DATA),
    [items]
  );

  useEffect(() => {
    const desconocidos = rawItems
      .map((r) => String(r.cp || '').replace(/\D/g, '').padStart(5, '0').slice(0, 5))
      .filter((cp) => cp.length === 5 && !CATALOGO_CP_SURESTE[cp] && !dynamicGeoMap[cp]);

    if (desconocidos.length === 0) return;

    let cancelado = false;
    const resolverRemotos = async () => {
      const nuevos = {};
      for (const cp of desconocidos.slice(0, 15)) {
        try {
          const resp = await fetch(`https://api.zippopotam.us/mx/${cp}`);
          if (!resp.ok) continue;
          const json = await resp.json();
          const place = json?.places?.[0];
          if (place) {
            const lat = Number(place.latitude);
            const lon = Number(place.longitude);
            const estadoRaw = String(place.state || '');
            let estado = 'Otra';
            if (/chiapas/i.test(estadoRaw)) estado = 'Chiapas';
            else if (/veracruz/i.test(estadoRaw)) estado = 'Veracruz';
            else if (/oaxaca/i.test(estadoRaw)) estado = 'Oaxaca';
            else if (/campeche/i.test(estadoRaw)) estado = 'Campeche';
            else if (/tabasco/i.test(estadoRaw)) estado = 'Tabasco';
            if (Number.isFinite(lat) && Number.isFinite(lon)) {
              nuevos[cp] = {
                localidad: place['place name'] || `CP ${cp}`,
                estado,
                lat,
                lon,
                carretera: inferirCorredorCarretero(cp, estado),
                kmBase: calcularKmHaversineCarretera(CEDIS.lat, CEDIS.lon, lat, lon)
              };
            }
          }
        } catch {
        }
      }
      if (!cancelado && Object.keys(nuevos).length > 0) {
        setDynamicGeoMap((prev) => {
          const merged = { ...prev, ...nuevos };
          try {
            localStorage.setItem(CACHE_GEO_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    };
    resolverRemotos();
    return () => {
      cancelado = true;
    };
  }, [rawItems, dynamicGeoMap]);

  const enrichedData = useMemo(() => {
    return rawItems
      .map((row) => {
        const base = resolverInfoCpBase(row.cp, dynamicGeoMap);
        const osrm = osrmMetrics[base.cp];
        const kmIda = osrm?.km || base.kmBase;
        const horasIda = osrm?.horas || Number((kmIda / 68).toFixed(2));
        return {
          ...base,
          total: Number(row.total) || 0,
          kmIda,
          kmRedondo: kmIda * 2,
          horasIda,
          tiempoTexto: formatearDuracion(horasIda),
          esApiReal: Boolean(osrm?.km)
        };
      })
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [rawItems, dynamicGeoMap, osrmMetrics]);

  useEffect(() => {
    const faltantes = enrichedData.filter((d) => !osrmMetrics[d.cp]);
    if (faltantes.length === 0) {
      setApiStatus('conectado');
      return;
    }

    let cancelado = false;
    const consultarOsrmTable = async () => {
      setApiStatus('calculando');
      try {
        const coords = [
          `${CEDIS.lon},${CEDIS.lat}`,
          ...faltantes.map((d) => `${d.lon},${d.lat}`)
        ].join(';');
        const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance,duration`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('OSRM status ' + resp.status);
        const json = await resp.json();
        const distances = json?.distances?.[0];
        const durations = json?.durations?.[0];
        if (!Array.isArray(distances)) throw new Error('Sin matriz de distancias');

        const nuevos = {};
        faltantes.forEach((d, idx) => {
          const metros = distances[idx + 1];
          const segundos = durations?.[idx + 1];
          if (Number.isFinite(metros) && metros > 0) {
            nuevos[d.cp] = {
              km: Math.max(1, Math.round(metros / 1000)),
              horas: Number.isFinite(segundos) ? Number((segundos / 3600).toFixed(2)) : Number((metros / 1000 / 68).toFixed(2))
            };
          }
        });

        if (!cancelado && Object.keys(nuevos).length > 0) {
          setOsrmMetrics((prev) => {
            const merged = { ...prev, ...nuevos };
            try {
              localStorage.setItem(CACHE_OSRM_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
          setApiStatus('conectado');
        }
      } catch {
        if (!cancelado) setApiStatus('estimado');
      }
    };

    consultarOsrmTable();
    return () => {
      cancelado = true;
    };
  }, [enrichedData, osrmMetrics]);

  useEffect(() => {
    if (!selectedCp) {
      setSelectedRouteGeometry(null);
      return;
    }
    const target = enrichedData.find((d) => d.cp === selectedCp);
    if (!target) return;

    let cancelado = false;
    const cargarGeometriaCarretera = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${CEDIS.lon},${CEDIS.lat};${target.lon},${target.lat}?overview=full&geometries=geojson`;
        const resp = await fetch(url);
        if (!resp.ok) return;
        const json = await resp.json();
        const coords = json?.routes?.[0]?.geometry?.coordinates;
        if (!cancelado && Array.isArray(coords) && coords.length > 1) {
          setSelectedRouteGeometry({
            cp: target.cp,
            estado: target.estado,
            latLngs: coords.map(([lon, lat]) => [lat, lon])
          });
        }
      } catch {
      }
    };
    cargarGeometriaCarretera();
    return () => {
      cancelado = true;
    };
  }, [selectedCp, enrichedData]);

  const totalGeneral = useMemo(
    () => enrichedData.reduce((acc, d) => acc + d.total, 0),
    [enrichedData]
  );

  const stateTotals = useMemo(() => {
    const map = {};
    enrichedData.forEach((d) => {
      if (!map[d.estado]) map[d.estado] = { entregas: 0, kmSuma: 0, cps: 0 };
      map[d.estado].entregas += d.total;
      map[d.estado].kmSuma += d.kmIda;
      map[d.estado].cps += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].entregas - a[1].entregas);
  }, [enrichedData]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedData.filter((d) => {
      if (selectedState !== 'TODOS' && d.estado !== selectedState) return false;
      if (!q) return true;
      return (
        d.cp.includes(q) ||
        d.localidad.toLowerCase().includes(q) ||
        d.estado.toLowerCase().includes(q) ||
        d.carretera.toLowerCase().includes(q)
      );
    });
  }, [enrichedData, selectedState, search]);

  const filteredSum = useMemo(
    () => filteredData.reduce((acc, d) => acc + d.total, 0),
    [filteredData]
  );

  const kmCoberturaTotal = useMemo(
    () => filteredData.reduce((acc, d) => acc + d.kmIda, 0),
    [filteredData]
  );

  const kmPromedioPonderado = useMemo(() => {
    if (filteredSum === 0) return 0;
    const sumaPond = filteredData.reduce((acc, d) => acc + d.kmIda * d.total, 0);
    return Math.round(sumaPond / filteredSum);
  }, [filteredData, filteredSum]);

  const rutaMasLarga = useMemo(() => {
    if (filteredData.length === 0) return null;
    return [...filteredData].sort((a, b) => b.kmIda - a.kmIda)[0];
  }, [filteredData]);

  useEffect(() => {
    let cancelado = false;
    cargarLeaflet().then((L) => {
      if (cancelado || !leafletContainerRef.current) return;
      if (!leafletMapRef.current) {
        const map = L.map(leafletContainerRef.current, {
          center: [16.85, -93.35],
          zoom: 7,
          zoomControl: true,
          attributionControl: false
        });
        routesLayerRef.current = L.layerGroup().addTo(map);
        markersLayerRef.current = L.layerGroup().addTo(map);
        leafletMapRef.current = map;
        setLeafletReady(true);
      }

      const map = leafletMapRef.current;
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const tileUrl = tileMode === 'carretero'
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 18,
        crossOrigin: true
      }).addTo(map);
    }).catch(() => {});

    return () => {
      cancelado = true;
    };
  }, [tileMode]);

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        tileLayerRef.current = null;
        markersLayerRef.current = null;
        routesLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = typeof window !== 'undefined' ? window.L : null;
    const map = leafletMapRef.current;
    if (!L || !map || !markersLayerRef.current || !routesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    routesLayerRef.current.clearLayers();

    if (showRoutes) {
      filteredData.forEach((d) => {
        const isSel = selectedCp === d.cp;
        if (isSel && selectedRouteGeometry?.cp === d.cp) return;
        const color = STATE_COLORS[d.estado] || '#38bdf8';
        L.polyline(
          [[CEDIS.lat, CEDIS.lon], [d.lat, d.lon]],
          {
            color,
            weight: isSel ? 3 : 1.4,
            opacity: isSel ? 0.85 : 0.35,
            dashArray: '5, 5'
          }
        ).addTo(routesLayerRef.current);
      });
    }

    if (selectedRouteGeometry && Array.isArray(selectedRouteGeometry.latLngs)) {
      const color = STATE_COLORS[selectedRouteGeometry.estado] || '#38bdf8';
      L.polyline(selectedRouteGeometry.latLngs, {
        color: '#070b14',
        weight: 6.5,
        opacity: 0.85
      }).addTo(routesLayerRef.current);
      L.polyline(selectedRouteGeometry.latLngs, {
        color,
        weight: 4,
        opacity: 1
      }).addTo(routesLayerRef.current);
    }

    const cedisIcon = L.divIcon({
      className: 'baz-cedis-marker',
      html: `<div style="width:18px;height:18px;background:#fbbf24;border:2.5px solid #070b14;transform:rotate(45deg);box-shadow:0 0 12px rgba(251,191,36,0.9);"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    L.marker([CEDIS.lat, CEDIS.lon], { icon: cedisIcon })
      .bindTooltip(
        `<div style="font-weight:800;color:#070b14;">5796 · CE CD Villahermosa</div><div style="font-size:11px;">Centro de Distribución Origen</div>`,
        { direction: 'top' }
      )
      .addTo(markersLayerRef.current);

    filteredData.forEach((d) => {
      const isSel = selectedCp === d.cp;
      const color = STATE_COLORS[d.estado] || '#38bdf8';
      const radius = 7 + Math.sqrt(d.total) * 3.1;

      const circle = L.circleMarker([d.lat, d.lon], {
        radius: isSel ? radius + 3 : radius,
        fillColor: color,
        fillOpacity: isSel ? 0.95 : 0.82,
        color: isSel ? '#ffffff' : '#070b14',
        weight: isSel ? 2.5 : 1.5
      });

      circle.bindTooltip(
        `<div style="font-family:monospace;font-weight:800;font-size:12px;">CP ${d.cp} · ${d.localidad} (${d.estado})</div>
         <div style="font-size:11px;margin-top:2px;"><b>Carretera:</b> ${d.carretera}</div>
         <div style="font-size:11px;"><b>Distancia carretera:</b> ~${d.kmIda} km ida (${d.kmRedondo} km redondo) · <b>${d.tiempoTexto}</b></div>
         <div style="font-size:12px;margin-top:3px;color:#0284c7;"><b>Total entregas: ${d.total}</b></div>`,
        { direction: 'top' }
      );

      circle.on('click', () => {
        setSelectedCp((prev) => (prev === d.cp ? null : d.cp));
      });

      circle.addTo(markersLayerRef.current);
    });
  }, [leafletReady, filteredData, selectedCp, showRoutes, selectedRouteGeometry, tileMode]);

  const handleResetView = () => {
    setSelectedCp(null);
    setSelectedRouteGeometry(null);
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([16.85, -93.35], 7);
    }
  };

  const handleSelectRow = (d) => {
    const next = selectedCp === d.cp ? null : d.cp;
    setSelectedCp(next);
    if (next && leafletMapRef.current && window.L) {
      const bounds = window.L.latLngBounds([[CEDIS.lat, CEDIS.lon], [d.lat, d.lon]]);
      leafletMapRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 10 });
    }
  };

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
    showToast(`Mapa actualizado: ${parsed.length} códigos postales (${suma} entregas totales). Calculando kilómetros por carretera...`);
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
      link.download = `Mapa_Carretero_CP_Villahermosa.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Mapa carretero descargado en imagen HD.');
    } catch {
      showToast('No se pudo exportar la imagen del mapa.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedObj = enrichedData.find((d) => d.cp === selectedCp);

  return (
    <div className="mapa-cp-wrapper" ref={mapCardRef}>
      <div className="mapa-cp-header-card">
        <div>
          <div className="mapa-cp-eyebrow">
            5796 · CE CD VILLAHERMOSA · {fechaTexto} · {apiStatus === 'conectado' ? 'API OSRM CARRETERAS ACTIVA' : 'CÁLCULO CARRETERO SURESTE'}
          </div>
          <h2 className="mapa-cp-title">
            <Route size={19} color="#38bdf8" />
            <span>Mapa Carretero y Estimado de Kilómetros por CP</span>
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
            onClick={() => setTileMode((m) => (m === 'carretero' ? 'oscuro' : 'carretero'))}
            title="Alternar entre Mapa Carretero Oficial (OSM) y Mapa Táctico Oscuro"
          >
            <Layers size={14} />
            <span>Vista: {tileMode === 'carretero' ? 'Carreteras' : 'Oscuro'}</span>
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
          <span className="mapa-cp-kpi-label">Volumen y Zonas</span>
          <strong className="mapa-cp-kpi-value">{filteredSum} <small style={{ fontSize: '0.85rem', color: '#94a3b8' }}>entregas</small></strong>
          <span className="mapa-cp-kpi-sub">{filteredData.length} códigos postales activos</span>
        </div>
        <div className="mapa-cp-kpi-card">
          <span className="mapa-cp-kpi-label">Distancia Promedio por Entrega</span>
          <strong className="mapa-cp-kpi-value" style={{ color: '#38bdf8' }}>{kmPromedioPonderado} km</strong>
          <span className="mapa-cp-kpi-sub">~{formatearDuracion(kmPromedioPonderado / 68)} tiempo prom. desde CEDIS</span>
        </div>
        <div className="mapa-cp-kpi-card">
          <span className="mapa-cp-kpi-label">Suma Red Carretera (Ida a CPs)</span>
          <strong className="mapa-cp-kpi-value" style={{ color: '#34d399' }}>{kmCoberturaTotal.toLocaleString('es-MX')} km</strong>
          <span className="mapa-cp-kpi-sub">{(kmCoberturaTotal * 2).toLocaleString('es-MX')} km circuito redondo</span>
        </div>
        <div className="mapa-cp-kpi-card">
          <span className="mapa-cp-kpi-label">Punto Más Lejano en Ruta</span>
          <strong className="mapa-cp-kpi-value" style={{ color: '#fbbf24' }}>
            {rutaMasLarga ? `${rutaMasLarga.kmIda} km` : '—'}
          </strong>
          <span className="mapa-cp-kpi-sub">
            {rutaMasLarga ? `CP ${rutaMasLarga.cp} · ${rutaMasLarga.localidad} (${rutaMasLarga.tiempoTexto})` : 'Sin datos'}
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
          {stateTotals.map(([st, info]) => (
            <button
              key={st}
              type="button"
              className={`pill-btn ${selectedState === st ? 'active' : ''}`}
              onClick={() => setSelectedState(st)}
            >
              <span className="mapa-cp-dot" style={{ background: STATE_COLORS[st] || '#94a3b8' }} />
              {st} ({info.entregas})
            </button>
          ))}
        </div>

        <div className="mapa-cp-search">
          <Search size={14} color="#64748b" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar CP, ciudad o carretera (ej. MEX-180, 29950)..."
          />
        </div>
      </div>

      <div className="mapa-cp-main-grid">
        <div className="mapa-cp-canvas-card">
          <div className="mapa-cp-canvas-topbar">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Compass size={14} color="#38bdf8" />
              <span>Red Carretera Federal Sureste (OpenStreetMap + OSRM Routing API)</span>
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem' }}
              onClick={handleResetView}
              title="Restablecer zoom a toda la región Sureste"
            >
              <RotateCcw size={12} />
              <span>Ver Todo el Sureste</span>
            </button>
          </div>

          <div className="mapa-cp-svg-wrap">
            <div
              ref={leafletContainerRef}
              style={{ width: '100%', height: '100%', zIndex: 1 }}
            />
          </div>

          <div className="mapa-cp-selected-bar">
            {selectedObj ? (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <span className="mapa-cp-dot" style={{ background: STATE_COLORS[selectedObj.estado] }} />
                  <strong>CP {selectedObj.cp} · {selectedObj.localidad}, {selectedObj.estado}</strong>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>({selectedObj.carretera})</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  <span style={{ color: '#34d399' }}>~{selectedObj.kmIda} km ida ({selectedObj.kmRedondo} km redondo)</span>
                  <span style={{ color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={13} /> {selectedObj.tiempoTexto}
                  </span>
                  <span>{selectedObj.total} entregas</span>
                </span>
              </>
            ) : (
              <span style={{ color: '#94a3b8' }}>
                Haz clic en cualquier código postal de la tabla o del mapa para trazar la carretera real desde CEDIS Villahermosa y ver kilómetros y tiempo estimado.
              </span>
            )}
          </div>
        </div>

        <div className="mapa-cp-table-card">
          <div className="mapa-cp-canvas-topbar">
            <span>Kilómetros y Carretera por CP</span>
            <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {filteredData.length} CPs · {filteredSum} ent.
            </span>
          </div>
          <div className="mapa-cp-table-scroll">
            <table className="mapa-cp-table">
              <thead>
                <tr>
                  <th>CP / Zona</th>
                  <th>Carretera / Tiempo</th>
                  <th style={{ textAlign: 'right' }}>Km Ida</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((d) => (
                  <tr
                    key={d.cp}
                    className={selectedCp === d.cp ? 'active-row' : ''}
                    onClick={() => handleSelectRow(d)}
                  >
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f8fafc' }}>
                        <span className="mapa-cp-dot" style={{ background: STATE_COLORS[d.estado] }} />
                        {d.cp}
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#cbd5e1', fontWeight: 600 }}>{d.localidad}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{d.estado}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>{d.carretera}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                        ⏱ {d.tiempoTexto} · {d.kmRedondo} km red.
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#34d399', whiteSpace: 'nowrap' }}>
                      {d.kmIda} km
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
          Resumen Regional por Estado (Entregas y Kilómetros de Cobertura)
        </div>
        <div className="mapa-cp-states-grid">
          {stateTotals.map(([st, info]) => {
            const pct = totalGeneral > 0 ? ((info.entregas / totalGeneral) * 100).toFixed(1) : '0.0';
            const kmProm = info.cps > 0 ? Math.round(info.kmSuma / info.cps) : 0;
            return (
              <div key={st} className="mapa-cp-state-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
                  <span>{st}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{info.entregas} ({pct}%)</span>
                </div>
                <div className="mapa-cp-bar-track">
                  <div
                    className="mapa-cp-bar-fill"
                    style={{ width: `${pct}%`, background: STATE_COLORS[st] || '#38bdf8' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                  <span>{info.cps} CPs</span>
                  <span style={{ color: '#34d399' }}>Prom: ~{kmProm} km</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
