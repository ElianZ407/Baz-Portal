import React, { useEffect, useRef, useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

const NIP_LENGTH = 4;
const SESSION_KEY = 'baz_colocacion_nip_token';
const LOCKOUT_KEY = 'baz_colocacion_nip_lockout';
const ATTEMPTS_KEY = 'baz_colocacion_nip_attempts';
const MAX_INTENTOS = 5;
const TIEMPO_BLOQUEO_MS = 30000;

const NIP_CONFIGURADO = String(import.meta.env.VITE_PLAN_COLOCACION_NIP || '').trim();
const NIP_VALIDO = new RegExp(`^\\d{${NIP_LENGTH}}$`).test(NIP_CONFIGURADO);

const generarFingerprintNip = (valor) => {
  const entrada = `baz_v1_salt_${valor}_cd_vhsa`;
  let h1 = 0xdeadbeef ^ entrada.length;
  let h2 = 0x41c6ce57 ^ entrada.length;
  for (let i = 0; i < entrada.length; i++) {
    const ch = entrada.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
};

const compararTiempoConstante = (a, b) => {
  const strA = String(a || '');
  const strB = String(b || '');
  const len = Math.max(strA.length, strB.length);
  let diff = strA.length ^ strB.length;
  for (let i = 0; i < len; i++) {
    diff |= (strA.charCodeAt(i) || 0) ^ (strB.charCodeAt(i) || 0);
  }
  return diff === 0;
};

const TOKEN_ESPERADO = NIP_VALIDO ? generarFingerprintNip(NIP_CONFIGURADO) : '';

const leerStorageSeguro = (clave, fallback = '') => {
  try {
    return sessionStorage.getItem(clave) ?? fallback;
  } catch {
    return fallback;
  }
};

const escribirStorageSeguro = (clave, valor) => {
  try {
    sessionStorage.setItem(clave, String(valor));
  } catch {}
};

const eliminarStorageSeguro = (clave) => {
  try {
    sessionStorage.removeItem(clave);
  } catch {}
};

const yaDesbloqueado = () =>
  NIP_VALIDO && compararTiempoConstante(leerStorageSeguro(SESSION_KEY), TOKEN_ESPERADO);

const obtenerBloqueoRestanteSeg = () => {
  const hasta = Number(leerStorageSeguro(LOCKOUT_KEY, '0')) || 0;
  return Math.max(0, Math.ceil((hasta - Date.now()) / 1000));
};

const guardarIntentoFallidoStorage = () => {
  const previos = Number(leerStorageSeguro(ATTEMPTS_KEY, '0')) || 0;
  const nuevos = previos + 1;
  escribirStorageSeguro(ATTEMPTS_KEY, nuevos);
  if (nuevos >= MAX_INTENTOS) {
    escribirStorageSeguro(LOCKOUT_KEY, Date.now() + TIEMPO_BLOQUEO_MS);
    return Math.ceil(TIEMPO_BLOQUEO_MS / 1000);
  }
  return 0;
};

export const NipGate = ({ children }) => {
  const [desbloqueado, setDesbloqueado] = useState(yaDesbloqueado);
  const [digitos, setDigitos] = useState(() => Array(NIP_LENGTH).fill(''));
  const [error, setError] = useState(false);
  const [segundosBloqueo, setSegundosBloqueo] = useState(obtenerBloqueoRestanteSeg);
  const refs = useRef([]);

  useEffect(() => {
    if (segundosBloqueo <= 0) return undefined;
    const timer = setInterval(() => {
      const restante = obtenerBloqueoRestanteSeg();
      setSegundosBloqueo(restante);
      if (restante <= 0) {
        eliminarStorageSeguro(LOCKOUT_KEY);
        eliminarStorageSeguro(ATTEMPTS_KEY);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [segundosBloqueo]);

  if (desbloqueado) return children;

  const bloqueadoPorIntentos = segundosBloqueo > 0;

  const verificar = (lista) => {
    if (bloqueadoPorIntentos) return;
    const candidatoHash = generarFingerprintNip(lista.join(''));
    const coincide = compararTiempoConstante(candidatoHash, TOKEN_ESPERADO);

    if (coincide) {
      escribirStorageSeguro(SESSION_KEY, TOKEN_ESPERADO);
      eliminarStorageSeguro(ATTEMPTS_KEY);
      eliminarStorageSeguro(LOCKOUT_KEY);
      setDesbloqueado(true);
      return;
    }

    const segBloqueo = guardarIntentoFallidoStorage();
    if (segBloqueo > 0) setSegundosBloqueo(segBloqueo);
    setError(true);
    setTimeout(() => {
      setDigitos(Array(NIP_LENGTH).fill(''));
      setError(false);
      refs.current[0]?.focus();
    }, 650);
  };

  const handleChange = (indice, valor) => {
    if (error || bloqueadoPorIntentos) return;
    const limpio = valor.replace(/\D/g, '').slice(-1);
    const siguiente = digitos.map((d, i) => (i === indice ? limpio : d));
    setDigitos(siguiente);
    if (!limpio) return;

    const siguienteInput = refs.current[indice + 1];
    if (siguienteInput) {
      siguienteInput.focus();
      return;
    }
    if (siguiente.every(Boolean)) verificar(siguiente);
  };

  const handleKeyDown = (indice, evento) => {
    const retroceder = evento.key === 'Backspace' && !digitos[indice] && indice > 0;
    if (retroceder) refs.current[indice - 1]?.focus();
  };

  const handlePaste = (evento) => {
    if (bloqueadoPorIntentos) return;
    const pegado = evento.clipboardData.getData('text').replace(/\D/g, '').slice(0, NIP_LENGTH);
    if (!pegado) return;
    evento.preventDefault();
    const siguiente = Array.from({ length: NIP_LENGTH }, (_, i) => pegado[i] || '');
    setDigitos(siguiente);
    if (pegado.length === NIP_LENGTH) verificar(siguiente);
  };

  const mensajeFeedback = bloqueadoPorIntentos
    ? `Demasiados intentos. Espera ${segundosBloqueo}s.`
    : 'NIP incorrecto';

  return (
    <section className="nip-gate" aria-labelledby="nip-gate-titulo">
      <div className={`nip-gate-card ${error || bloqueadoPorIntentos ? 'nip-gate-card-error' : ''}`}>
        <div className="nip-gate-icon">
          {NIP_VALIDO ? <Lock size={28} /> : <ShieldAlert size={28} />}
        </div>
        <h1 id="nip-gate-titulo" className="nip-gate-title">Plan de Colocación</h1>
        {NIP_VALIDO ? (
          <>
            <p className="nip-gate-text">Ingresa el NIP de {NIP_LENGTH} dígitos para continuar.</p>
            <div className="nip-gate-inputs" onPaste={handlePaste}>
              {digitos.map((digito, indice) => (
                <input
                  key={indice}
                  id={`nip-digito-${indice}`}
                  ref={(el) => { refs.current[indice] = el; }}
                  className="nip-gate-input"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={1}
                  disabled={bloqueadoPorIntentos}
                  value={digito}
                  autoFocus={indice === 0}
                  aria-label={`Dígito ${indice + 1} del NIP`}
                  onChange={(e) => handleChange(indice, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(indice, e)}
                />
              ))}
            </div>
            <p className={`nip-gate-feedback ${error || bloqueadoPorIntentos ? 'nip-gate-feedback-visible' : ''}`} role="alert">
              {mensajeFeedback}
            </p>
          </>
        ) : (
          <p className="nip-gate-text">
            Este módulo está protegido, pero el NIP no está configurado. Define
            {' '}<strong>VITE_PLAN_COLOCACION_NIP</strong> con {NIP_LENGTH} dígitos en el archivo .env
            y en las variables de entorno del despliegue.
          </p>
        )}
      </div>
    </section>
  );
};
