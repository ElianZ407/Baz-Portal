import React, { memo } from 'react';

/**
 * SatelliteBackground
 * Fondo animado visible y elegante para el Centro de Control BAZ Entregas.
 * Estilo: Radar Satelital & Malla Ciber-Logística
 *
 * Incluye:
 * 1. Malla geométrica de coordenadas claramente visible.
 * 2. Barrido de radar láser horizontal que desciende suavemente.
 * 3. Pantalla de radar circular con barrido giratorio de 360° (CEDIS Villahermosa).
 * 4. Puntos de telemetría y unidades flotantes en tránsito.
 * 5. Resplandores ambientales cian y esmeralda.
 */
export const SatelliteBackground = memo(function SatelliteBackground() {
  return (
    <div className="satellite-bg-wrapper" aria-hidden="true">
      {/* 1. Resplandores ambientales de fondo */}
      <div className="sat-glow-orb sat-glow-cyan" />
      <div className="sat-glow-orb sat-glow-emerald" />

      {/* 2. Malla geométrica satelital */}
      <div className="sat-grid-layer" />
      <div className="sat-grid-dots" />

      {/* 3. Estación de Radar Circular (CEDIS Villahermosa Beacon) */}
      <div className="sat-radar-station">
        {/* Anillos de alcance */}
        <div className="sat-radar-ring ring-1" />
        <div className="sat-radar-ring ring-2" />
        <div className="sat-radar-ring ring-3" />
        <div className="sat-radar-ring ring-4" />
        
        {/* Retícula cruzada */}
        <div className="sat-radar-crosshair-h" />
        <div className="sat-radar-crosshair-v" />

        {/* Haz de barrido giratorio (Sweep 360°) */}
        <div className="sat-radar-sweep" />

        {/* Punto central del Hub */}
        <div className="sat-radar-hub-dot">
          <span className="sat-hub-ping" />
        </div>

        {/* Etiqueta satelital */}
        <div className="sat-hub-label">
          <span className="sat-hub-status-dot" />
          <span>CD VILLAHERMOSA • RADAR SATELITAL ACTIVO</span>
        </div>
      </div>

      {/* 4. Barrido de Láser Satelital Horizontal (Escaneo de arriba a abajo) */}
      <div className="sat-laser-scanline">
        <div className="sat-laser-beam" />
        <div className="sat-laser-tail" />
      </div>

      {/* 5. Nodos de Tránsito / Telemetría flotantes */}
      <div className="sat-node sat-node-1">
        <span className="sat-node-dot" />
        <span className="sat-node-label">ECO 3153 • RUTA</span>
      </div>
      <div className="sat-node sat-node-2">
        <span className="sat-node-dot node-emerald" />
        <span className="sat-node-label">ECO 3393 • CARDENAS</span>
      </div>
      <div className="sat-node sat-node-3">
        <span className="sat-node-dot node-amber" />
        <span className="sat-node-label">C12 • COATZA</span>
      </div>
    </div>
  );
});
