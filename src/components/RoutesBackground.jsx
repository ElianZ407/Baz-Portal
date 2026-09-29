import React, { useEffect, useRef, memo } from 'react';

// Etiquetas reales de la operación BAZ para los nodos principales
const CITY_NODES = [
  { name: 'CEDIS VILLAHERMOSA', isHub: true, color: '#22d3ee' },
  { name: 'EKT CARDENAS', isHub: false, color: '#34d399' },
  { name: 'EKT COMALCALCO', isHub: false, color: '#22d3ee' },
  { name: 'MEGA COATZACOALCOS', isHub: false, color: '#fbbf24' },
  { name: 'EKT PARAISO', isHub: false, color: '#34d399' },
  { name: 'EKT MACUSPANA', isHub: false, color: '#22d3ee' },
  { name: 'EKT HUIMANGUILLO', isHub: false, color: '#34d399' },
  { name: 'EKT FRONTERA', isHub: false, color: '#22d3ee' },
  { name: 'EKT TEAPA', isHub: false, color: '#34d399' }
];

const MAX_DISTANCE = 190;
const TOTAL_NODES = 32;
const TARGET_PULSES = 7;
const EDGE_REFRESH_SECONDS = 2;
const REFERENCE_STEP = 1 / 60;
const MAX_FRAME_SECONDS = 0.1;
const ALPHA_BUCKETS = 16;

const parseHex = (hex) => {
  const h = String(hex).replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16)
  ];
};

const NODE_RGB = new Map();
const rgbOf = (hex) => {
  if (!NODE_RGB.has(hex)) NODE_RGB.set(hex, parseHex(hex));
  return NODE_RGB.get(hex);
};

const rgbaOf = (hex, alpha) => {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export const RoutesBackground = memo(function RoutesBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let running = false;
    let resizeFrameId = 0;
    let width = 0;
    let height = 0;
    let lastTime = 0;
    let edgeTimer = 0;
    let ambientGradient = null;

    let nodes = [];
    let edges = [];
    let transitPulses = [];

    // Estilos de línea precalculados: combinaciones finitas de colores x alfa.
    const lineStyleCache = new Map();
    const labelWidthCache = new Map();

    const getLineStyle = (colorA, colorB, alphaBucket) => {
      const key = `${colorA}|${colorB}|${alphaBucket}`;
      let style = lineStyleCache.get(key);
      if (!style) {
        const a = rgbOf(colorA);
        const b = rgbOf(colorB);
        const mid = [
          Math.round((a[0] + b[0]) / 2),
          Math.round((a[1] + b[1]) / 2),
          Math.round((a[2] + b[2]) / 2)
        ];
        style = `rgba(${mid[0]}, ${mid[1]}, ${mid[2]}, ${(alphaBucket / ALPHA_BUCKETS * 0.35).toFixed(4)})`;
        lineStyleCache.set(key, style);
      }
      return style;
    };

    // Sprites de resplandor pre-renderizados: sustituyen a shadowBlur por frame.
    const glowCache = new Map();
    const getGlowSprite = (hex, radius) => {
      const r = Math.max(2, Math.ceil(radius));
      const key = `${hex}|${r}`;
      let sprite = glowCache.get(key);
      if (sprite) return sprite;
      sprite = document.createElement('canvas');
      sprite.width = r * 2;
      sprite.height = r * 2;
      const g = sprite.getContext('2d');
      const glow = g.createRadialGradient(r, r, 0, r, r, r);
      glow.addColorStop(0, '#ffffff');
      glow.addColorStop(0.2, hex);
      glow.addColorStop(0.55, rgbaOf(hex, 0.28));
      glow.addColorStop(1, rgbaOf(hex, 0));
      g.fillStyle = glow;
      g.fillRect(0, 0, r * 2, r * 2);
      glowCache.set(key, sprite);
      return sprite;
    };

    const buildAmbientGradient = () => {
      const cx = width * 0.72;
      const cy = height * 0.22;
      ambientGradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, 500);
      ambientGradient.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      ambientGradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.025)');
      ambientGradient.addColorStop(1, 'transparent');
    };

    // Las aristas se recalculan desde las posiciones actuales, no se mantienen
    // estáticas: los nodos derivan y las conexiones deben seguir siendo reales.
    const rebuildEdges = () => {
      const next = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (distance(nodes[i], nodes[j]) < MAX_DISTANCE) next.push([i, j]);
        }
      }
      edges = next;
    };

    const initNodes = () => {
      nodes = [];
      transitPulses = [];

      // 1. Nodo Central: Hub Villahermosa (posición superior derecha / centro superior)
      nodes.push({
        x: width * 0.72,
        y: height * 0.22,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        radius: 6,
        color: '#22d3ee',
        isHub: true,
        name: 'CEDIS VILLAHERMOSA',
        pulse: 0
      });

      // 2. Nodos representativos con nombres de sucursales
      CITY_NODES.slice(1).forEach((city, idx) => {
        const angle = (idx / (CITY_NODES.length - 1)) * Math.PI * 2;
        const dist = 140 + Math.random() * 220;
        nodes.push({
          x: Math.max(50, Math.min(width - 50, (width * 0.65) + Math.cos(angle) * dist)),
          y: Math.max(80, Math.min(height - 60, (height * 0.35) + Math.sin(angle) * dist)),
          vx: (Math.random() - 0.5) * 0.14,
          vy: (Math.random() - 0.5) * 0.14,
          radius: 3.5,
          color: city.color,
          isHub: false,
          name: city.name,
          pulse: Math.random() * Math.PI
        });
      });

      // 3. Nodos secundarios de la red de transporte distribuidos por toda la pantalla
      for (let i = nodes.length; i < TOTAL_NODES; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          radius: 2 + Math.random() * 1.8,
          color: Math.random() > 0.4 ? '#06b6d4' : (Math.random() > 0.5 ? '#10b981' : '#f59e0b'),
          isHub: false,
          name: '',
          pulse: Math.random() * Math.PI
        });
      }

      rebuildEdges();
      refillPulses();
    };

    // Devuelve false cuando no hay ninguna arista disponible. Nunca se queda
    // colgado: el llamador debe respetar ese false en vez de insistir.
    const createRandomPulse = () => {
      if (edges.length === 0) return false;
      const edge = edges[Math.floor(Math.random() * edges.length)];
      const from = edge[0];
      const to = edge[1];
      transitPulses.push({
        from,
        to,
        progress: Math.random(),
        speed: 0.0018 + Math.random() * 0.0022,
        color: nodes[from].color || '#22d3ee'
      });
      return true;
    };

    const refillPulses = () => {
      let attempts = 0;
      while (transitPulses.length < TARGET_PULSES) {
        if (!createRandomPulse()) break;
        if (++attempts > TARGET_PULSES * 4) break;
      }
    };

    const update = (deltaFactor) => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx * deltaFactor;
        n.y += n.vy * deltaFactor;
        n.pulse += 0.025 * deltaFactor;

        if (n.x < 20) { n.x = 20; n.vx *= -1; }
        if (n.x > width - 20) { n.x = width - 20; n.vx *= -1; }
        if (n.y < 20) { n.y = 20; n.vy *= -1; }
        if (n.y > height - 20) { n.y = height - 20; n.vy *= -1; }
      }

      for (let p = transitPulses.length - 1; p >= 0; p--) {
        const pulse = transitPulses[p];
        pulse.progress += pulse.speed * deltaFactor;
        const nodeA = nodes[pulse.from];
        const nodeB = nodes[pulse.to];
        const tooFar = !nodeA || !nodeB || distance(nodeA, nodeB) > MAX_DISTANCE * 1.8;
        if (pulse.progress >= 1 || tooFar) {
          transitPulses.splice(p, 1);
          if (!createRandomPulse()) refillPulses();
        }
      }
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);

      if (ambientGradient) {
        ctx.fillStyle = ambientGradient;
        ctx.fillRect(0, 0, width, height);
      }

      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dist = distance(nodeA, nodeB);
          if (dist >= MAX_DISTANCE) continue;
          const alphaBucket = Math.round((1 - dist / MAX_DISTANCE) * ALPHA_BUCKETS);
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.strokeStyle = getLineStyle(nodeA.color, nodeB.color, alphaBucket);
          ctx.lineWidth = nodeA.isHub || nodeB.isHub ? 1.5 : 1;
          ctx.stroke();
        }
      }

      for (let i = 0; i < transitPulses.length; i++) {
        const pulse = transitPulses[i];
        const nodeA = nodes[pulse.from];
        const nodeB = nodes[pulse.to];
        if (!nodeA || !nodeB) continue;
        const px = nodeA.x + (nodeB.x - nodeA.x) * pulse.progress;
        const py = nodeA.y + (nodeB.y - nodeA.y) * pulse.progress;
        const glow = getGlowSprite(pulse.color, 12);
        ctx.drawImage(glow, px - glow.width / 2, py - glow.height / 2);
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      let currentFont = '';
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulseScale = Math.sin(n.pulse);

        const haloRadius = n.radius + (n.isHub ? 8 + pulseScale * 3 : 4 + pulseScale * 2);
        ctx.beginPath();
        ctx.arc(n.x, n.y, haloRadius, 0, Math.PI * 2);
        ctx.fillStyle = n.isHub ? 'rgba(6, 182, 212, 0.15)' : rgbaOf(n.color, 0.12);
        ctx.fill();

        if (n.isHub) {
          const ringPhase = (n.pulse * 8) % 24;
          const ringRadius = 14 + ringPhase;
          const ringAlpha = Math.max(0, 1 - ringPhase / 24);
          ctx.beginPath();
          ctx.arc(n.x, n.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${(ringAlpha * 0.6).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        const glow = getGlowSprite(n.color, n.radius + (n.isHub ? 14 : 8));
        ctx.drawImage(glow, n.x - glow.width / 2, n.y - glow.height / 2);

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        if (n.name) {
          const font = n.isHub ? 'bold 10px "JetBrains Mono", monospace' : '9px "JetBrains Mono", monospace';
          if (font !== currentFont) {
            ctx.font = font;
            currentFont = font;
          }
          const textX = n.x + n.radius + 6;
          const cacheKey = `${currentFont}|${n.name}`;
          let measured = labelWidthCache.get(cacheKey);
          if (measured === undefined) {
            measured = ctx.measureText(n.name).width;
            labelWidthCache.set(cacheKey, measured);
          }
          ctx.fillStyle = n.isHub ? '#38bdf8' : '#94a3b8';
          ctx.fillText(n.name, textX + measured > width ? Math.max(4, n.x - n.radius - 6 - measured) : textX, n.y + 3);
        }
      }
    };

    const frame = (now) => {
      const seconds = lastTime ? (now - lastTime) / 1000 : REFERENCE_STEP;
      lastTime = now;
      const deltaFactor = Math.min(seconds, MAX_FRAME_SECONDS) / REFERENCE_STEP;

      update(deltaFactor);

      edgeTimer += Math.min(seconds, MAX_FRAME_SECONDS);
      if (edgeTimer >= EDGE_REFRESH_SECONDS) {
        edgeTimer = 0;
        rebuildEdges();
      }

      paint();
      animationFrameId = requestAnimationFrame(frame);
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const start = () => {
      if (running || motionQuery.matches) return;
      running = true;
      lastTime = 0;
      animationFrameId = requestAnimationFrame(frame);
    };

    const stop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(animationFrameId);
    };

    const drawStaticFrame = () => {
      if (running) return;
      update(0);
      paint();
    };

    const applyResize = () => {
      resizeFrameId = 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      // setTransform (no scale) para que el DPR no se acumule entre resizes.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildAmbientGradient();
      initNodes();
      drawStaticFrame();
    };

    const handleResize = () => {
      if (resizeFrameId) return;
      resizeFrameId = requestAnimationFrame(applyResize);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };

    const handleMotionPreference = () => {
      if (motionQuery.matches) {
        stop();
        drawStaticFrame();
      } else {
        start();
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    motionQuery.addEventListener('change', handleMotionPreference);

    applyResize();
    start();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery.removeEventListener('change', handleMotionPreference);
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      stop();
    };
  }, []);

  return (
    <div
      className="routes-background-wrapper"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: '#060a15'
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
});
