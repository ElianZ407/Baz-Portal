const TOTAL_PROTECT_API_BASE = import.meta.env.VITE_TOTAL_PROTECT_API_URL || 'https://api.totalprotect.mx/v1';

let cachedToken = null;
let tokenExpirationTime = 0;

export const authenticateTotalProtect = async (username, password) => {
  const user = username || import.meta.env.VITE_TOTAL_PROTECT_USER;
  const pass = password || import.meta.env.VITE_TOTAL_PROTECT_PASSWORD;

  if (!user || !pass) {
    throw new Error('Credenciales de Total Protect no configuradas.');
  }

  const now = Date.now();
  if (cachedToken && now < tokenExpirationTime) {
    return cachedToken;
  }

  const response = await fetch(`${TOTAL_PROTECT_API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      username: user,
      password: pass
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error de autenticación en Total Protect (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const token = data.token || data.access_token || data.jwt || (data.data && data.data.token);
  
  if (!token) {
    throw new Error('Respuesta de autenticación inválida: no se recibió token.');
  }

  cachedToken = token;
  const expiresInMs = (data.expires_in ? data.expires_in * 1000 : 3600 * 1000) - (60 * 1000);
  tokenExpirationTime = now + expiresInMs;

  return cachedToken;
};

export const fetchLivePositions = async () => {
  const token = await authenticateTotalProtect();

  const response = await fetch(`${TOTAL_PROTECT_API_BASE}/fleet/positions/live`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      cachedToken = null;
      tokenExpirationTime = 0;
    }
    const errorBody = await response.text();
    throw new Error(`Error al consultar posiciones de Total Protect (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  const rawList = Array.isArray(result) ? result : (result.data || result.vehicles || result.units || []);

  return rawList.map(item => normalizeTotalProtectPosition(item));
};

export const normalizeTotalProtectPosition = (item) => {
  const rawEco = item.economico || item.eco || item.unitNumber || item.name || item.plate || '';
  const cleanEco = String(rawEco).replace(/\D/g, '');

  const lat = Number(item.latitude ?? item.lat ?? 0);
  const lng = Number(item.longitude ?? item.lng ?? item.lon ?? 0);
  const speedKmh = Math.round(Number(item.speed ?? item.velocidad ?? 0));
  const ignition = Boolean(item.ignition ?? item.motor ?? item.engineOn ?? (speedKmh > 0));

  let motionStatus = 'STOPPED';
  if (ignition && speedKmh > 5) {
    motionStatus = 'MOVING';
  } else if (ignition) {
    motionStatus = 'IDLE';
  }

  return {
    idGps: String(item.id || item.deviceId || cleanEco),
    economico: cleanEco,
    placas: String(item.plate || item.placas || '').trim().toUpperCase(),
    latitud: lat,
    longitud: lng,
    velocidadKmh: speedKmh,
    rumbo: Number(item.heading ?? item.course ?? item.direction ?? 0),
    motorEncendido: ignition,
    estatusMovimiento: motionStatus,
    direccionReferencia: String(item.address || item.geofence || item.locationName || ''),
    fechaGps: item.timestamp || item.updatedAt || new Date().toISOString(),
    bateria: item.batteryLevel ?? null
  };
};

export const matchGpsToFleetUnits = (fleetUnits = [], gpsPositions = []) => {
  const gpsMap = new Map();
  
  gpsPositions.forEach(pos => {
    if (pos.economico) {
      gpsMap.set(pos.economico, pos);
    }
    if (pos.placas) {
      const cleanPlate = pos.placas.replace(/[\s-]/g, '').toUpperCase();
      gpsMap.set(cleanPlate, pos);
    }
  });

  return fleetUnits.map(unit => {
    const ecoKey = String(unit.economico || '').replace(/\D/g, '');
    const plateKey = String(unit.placas || '').replace(/[\s-]/g, '').toUpperCase();

    const gpsData = gpsMap.get(ecoKey) || gpsMap.get(plateKey) || null;

    return {
      ...unit,
      gps: gpsData
    };
  });
};
