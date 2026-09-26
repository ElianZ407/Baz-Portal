import React, { memo } from 'react';

/**
 * SatelliteBackground
 * Fondo animado sutil para el Centro de Control de Flota (BAZ Entregas CD Villahermosa).
 * Incluye:
 * - Malla geométrica en perspectiva sutil (Cyber Grid)
 * - Puntos de coordenadas e intersecciones satelitales
 * - Barrido suave de radar de monitoreo (Scanline lento de 22s)
 * - Pulso tenue de radar circular (Beacon CD Villahermosa)
 * - Resplandor ambiental de respiración (Glow orgánico de 18s)
 * - Viñeta radial para mantener el contraste y legibilidad óptima de tablas y tarjetas
 */
export const SatelliteBackground = memo(function SatelliteBackground() {
  return (
    <div className="satellite-bg-wrapper" aria-hidden="true">
      {/* 1. Malla Satelital con perspectiva tenue */}
      <div className="satellite-grid" />

      {/* 2. Resplandor ambiental respiratorio */}
      <div className="satellite-ambient-glow" />

      {/* 3. Pulso de radar circular (CD Villahermosa) */}
      <div className="satellite-radar-pulse" />

      {/* 4. Barrido de radar / escaneo satelital suave */}
      <div className="satellite-scan-beam" />

      {/* 5. Viñeta radial oscura para proteger legibilidad de datos */}
      <div className="satellite-vignette" />
    </div>
  );
});
