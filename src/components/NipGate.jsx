import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

const NIP_LENGTH = 4;
const MAX_INTENTOS = 5;
const TIEMPO_BLOQUEO_MS = 30000;

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

const guardarFalloStorage = (attemptsKey, lockoutKey) => {
  const ahora = Date.now();
  const previos = Number(leerStorageSeguro(attemptsKey, '0')) || 0;
  const nuevos = previos + 1;
  escribirStorageSeguro(attemptsKey, nuevos);
  if (nuevos >= MAX_INTENTOS) {
    escribirStorageSeguro(lockoutKey, ahora + TIEMPO_BLOQUEO_MS);
    return Math.ceil(TIEMPO_BLOQUEO_MS / 1000);
  }
  return 0;
};

export const NipGate = ({ 
  children,
  title = 'Plan de Colocación',
  subtitle = 'Ingresa el NIP de 4 dígitos para continuar.',
  sessionKey = 'baz_colocacion_nip_token',
  lockoutKey = 'baz_colocacion_nip_lockout',
  attemptsKey = 'baz_colocacion_nip_attempts',
  nipConfigurado,
  defaultNip = '',
  envVarName = 'VITE_PLAN_COLOCACION_NIP'
}) => {
  const effectiveNip = useMemo(() => {
    const fromEnv = nipConfigurado !== undefined 
      ? nipConfigurado 
      : import.meta.env[envVarName];
    const clean = String(fromEnv || defaultNip || '').trim();
    return clean;
  }, [nipConfigurado, defaultNip, envVarName]);

  const nipValido = useMemo(() => {
    return new RegExp(`^\\d{${NIP_LENGTH}}$`).test(effectiveNip);
  }, [effectiveNip]);

  const tokenEsperado = useMemo(() => {
    return nipValido ? generarFingerprintNip(effectiveNip) : '';
  }, [nipValido, effectiveNip]);

  const [desbloqueado, setDesbloqueado] = useState(() => {
    return nipValido && compararTiempoConstante(leerStorageSeguro(sessionKey), tokenEsperado);
  });

  const [digitos, setDigitos] = useState(() => Array(NIP_LENGTH).fill(''));
  const [error, setError] = useState(false);
  const [segundosBloqueo, setSegundosBloqueo] = useState(() => {
    const hasta = Number(leerStorageSeguro(lockoutKey, '0')) || 0;
    return Math.max(0, Math.ceil((hasta - Date.now()) / 1000));
  });
  const refs = useRef([]);

  const estaDesbloqueado = desbloqueado || (nipValido && compararTiempoConstante(leerStorageSeguro(sessionKey), tokenEsperado));

  const checkBloqueo = useCallback(() => {
    const hasta = Number(leerStorageSeguro(lockoutKey, '0')) || 0;
    return Math.max(0, Math.ceil((hasta - Date.now()) / 1000));
  }, [lockoutKey]);

  useEffect(() => {
    if (segundosBloqueo <= 0) return undefined;
    const timer = setInterval(() => {
      const restante = checkBloqueo();
      setSegundosBloqueo(restante);
      if (restante <= 0) {
        eliminarStorageSeguro(lockoutKey);
        eliminarStorageSeguro(attemptsKey);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [segundosBloqueo, checkBloqueo, lockoutKey, attemptsKey]);

  if (estaDesbloqueado) return children;

  const bloqueadoPorIntentos = segundosBloqueo > 0;

  const verificar = (lista) => {
    if (bloqueadoPorIntentos) return;
    const candidatoHash = generarFingerprintNip(lista.join(''));
    const coincide = compararTiempoConstante(candidatoHash, tokenEsperado);

    if (coincide) {
      escribirStorageSeguro(sessionKey, tokenEsperado);
      eliminarStorageSeguro(attemptsKey);
      eliminarStorageSeguro(lockoutKey);
      setDesbloqueado(true);
      return;
    }

    const segBloqueo = guardarFalloStorage(attemptsKey, lockoutKey);
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
          {nipValido ? <Lock size={28} /> : <ShieldAlert size={28} />}
        </div>
        <h1 id="nip-gate-titulo" className="nip-gate-title">{title}</h1>
        {nipValido ? (
          <>
            <p className="nip-gate-text">{subtitle}</p>
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
            {' '}<strong>{envVarName}</strong> con {NIP_LENGTH} dígitos en el archivo .env
            y en las variables de entorno del despliegue.
          </p>
        )}
      </div>
    </section>
  );
};
