import React, { useRef, useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

const NIP_LENGTH = 4;
const SESSION_KEY = 'baz_colocacion_nip_ok';
const NIP_CONFIGURADO = String(import.meta.env.VITE_PLAN_COLOCACION_NIP || '').trim();
const NIP_VALIDO = new RegExp(`^\\d{${NIP_LENGTH}}$`).test(NIP_CONFIGURADO);

const yaDesbloqueado = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === NIP_CONFIGURADO;
  } catch {
    return false;
  }
};

export const NipGate = ({ children }) => {
  const [desbloqueado, setDesbloqueado] = useState(() => NIP_VALIDO && yaDesbloqueado());
  const [digitos, setDigitos] = useState(() => Array(NIP_LENGTH).fill(''));
  const [error, setError] = useState(false);
  const refs = useRef([]);

  if (desbloqueado) return children;

  const verificar = (lista) => {
    if (lista.join('') === NIP_CONFIGURADO) {
      try {
        sessionStorage.setItem(SESSION_KEY, NIP_CONFIGURADO);
      } catch {}
      setDesbloqueado(true);
      return;
    }
    setError(true);
    setTimeout(() => {
      setDigitos(Array(NIP_LENGTH).fill(''));
      setError(false);
      refs.current[0]?.focus();
    }, 650);
  };

  const handleChange = (indice, valor) => {
    if (error) return;
    const limpio = valor.replace(/\D/g, '').slice(-1);
    const siguiente = [...digitos];
    siguiente[indice] = limpio;
    setDigitos(siguiente);
    if (!limpio) return;
    if (indice < NIP_LENGTH - 1) {
      refs.current[indice + 1]?.focus();
      return;
    }
    if (siguiente.every(Boolean)) verificar(siguiente);
  };

  const handleKeyDown = (indice, evento) => {
    if (evento.key === 'Backspace' && !digitos[indice] && indice > 0) {
      refs.current[indice - 1]?.focus();
    }
  };

  const handlePaste = (evento) => {
    const pegado = evento.clipboardData.getData('text').replace(/\D/g, '').slice(0, NIP_LENGTH);
    if (!pegado) return;
    evento.preventDefault();
    const siguiente = Array(NIP_LENGTH).fill('').map((_, i) => pegado[i] || '');
    setDigitos(siguiente);
    if (pegado.length === NIP_LENGTH) verificar(siguiente);
  };

  return (
    <section className="nip-gate" aria-labelledby="nip-gate-titulo">
      <div className={`nip-gate-card ${error ? 'nip-gate-card-error' : ''}`}>
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
                  value={digito}
                  autoFocus={indice === 0}
                  aria-label={`Dígito ${indice + 1} del NIP`}
                  onChange={(e) => handleChange(indice, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(indice, e)}
                />
              ))}
            </div>
            <p className={`nip-gate-feedback ${error ? 'nip-gate-feedback-visible' : ''}`} role="alert">
              NIP incorrecto
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
