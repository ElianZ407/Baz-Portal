import React, { useEffect, useRef, memo } from 'react';

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
const TARGET_PULSES = 8;
const DUST_COUNT = 46;
const TRAIL_STEPS = 11;
const EDGE_REFRESH_SECONDS = 2;
const REFERENCE_STEP = 1 / 60;
const MAX_FRAME_SECONDS = 0.1;
const ALPHA_BUCKETS = 16;
const HUB_COLOR = '#22d3ee';

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

// Curvatura estable por arista: depende solo de los índices, nunca del frame.
const bendFor = (i, j) => {
  const h = (Math.imul(i, 73856093) ^ Math.imul(j, 19349663)) >>> 0;
  return ((h % 1000) / 1000) * 0.24 - 0.12;
};

const edgeKey = (i, j) => Math.min(i, j) * 256 + Math.max(i, j);

const controlPoint = (a, b, bend) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const k = len * bend;
  return {
    cx: (a.x + b.x) / 2 - (dy / len) * k,
    cy: (a.y + b.y) / 2 + (dx / len) * k
  };
};

const pointOnCurve = (a, b, cp, t) => {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * cp.cx + t * t * b.x,
    y: u * u * a.y + 2 * u * t * cp.cy + t * t * b.y
  };
};

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

    let nodes = [];
    let edges = [];
    let transitPulses = [];
    let dust = [];
    const activeEdges = new Set();

    const lineStyleCache = new Map();
    const labelWidthCache = new Map();

    const getLineStyle = (colorA, colorB, alphaBucket) => {
      const key = `${colorA}|${colorB}|${alphaBucket}`;
      let style = lineStyleCache.get(key);
      if (!style) {
        const a = rgbOf(colorA);
        const b = rgbOf(colorB);
        style = `rgba(${Math.round((a[0] + b[0]) / 2)}, ${Math.round((a[1] + b[1]) / 2)}, ${Math.round((a[2] + b[2]) / 2)}, ${(alphaBucket / ALPHA_BUCKETS * 0.32).toFixed(4)})`;
        lineStyleCache.set(key, style);
      }
      return style;
    };

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
      glow.addColorStop(0.18, hex);
      glow.addColorStop(0.5, rgbaOf(hex, 0.3));
      glow.addColorStop(1, rgbaOf(hex, 0));
      g.fillStyle = glow;
      g.fillRect(0, 0, r * 2, r * 2);
      glowCache.set(key, sprite);
      return sprite;
    };

    const makeNode = (x, y, radius, color, isHub, name) => ({
      x, y,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      radius,
      color,
      isHub,
      name,
      depth: isHub ? 1 : 0.35 + Math.random() * 0.6,
      pulse: Math.random() * Math.PI
    });

    const initDust = () => {
      dust = Array.from({ length: DUST_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.05,
        vy: -0.02 - Math.random() * 0.05,
        r: 0.4 + Math.random() * 0.9,
        twinkle: Math.random() * Math.PI * 2
      }));
    };

    const rebuildEdges = () => {
      const next = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dist = distance(nodes[i], nodes[j]);
          if (dist < MAX_DISTANCE) next.push([i, j, dist]);
        }
      }
      edges = next;
    };

    const initNodes = () => {
      nodes = [makeNode(width * 0.72, height * 0.22, 6, HUB_COLOR, true, 'CEDIS VILLAHERMOSA')];

      CITY_NODES.slice(1).forEach((city, idx) => {
        const angle = (idx / (CITY_NODES.length - 1)) * Math.PI * 2;
        const dist = 140 + Math.random() * 220;
        const x = Math.max(50, Math.min(width - 50, (width * 0.65) + Math.cos(angle) * dist));
        const y = Math.max(80, Math.min(height - 60, (height * 0.35) + Math.sin(angle) * dist));
        const node = makeNode(x, y, 3.6, city.color, false, city.name);
        node.depth = 0.82;
        node.vx = (Math.random() - 0.5) * 0.12;
        node.vy = (Math.random() - 0.5) * 0.12;
        nodes.push(node);
      });

      while (nodes.length < TOTAL_NODES) {
        const node = makeNode(
          Math.random() * width,
          Math.random() * height,
          1.4 + Math.random() * 1.6,
          Math.random() > 0.45 ? '#06b6d4' : (Math.random() > 0.5 ? '#10b981' : '#a855f7'),
          false,
          ''
        );
        node.vx *= 0.6;
        node.vy *= 0.6;
        nodes.push(node);
      }

      initDust();
      rebuildEdges();
      refillPulses();
    };

    // Devuelve false si no hay aristas; el refill debe respetar ese false.
    const createRandomPulse = () => {
      if (edges.length === 0) return false;
      const [from, to] = edges[Math.floor(Math.random() * edges.length)];
      transitPulses.push({
        from,
        to,
        key: edgeKey(from, to),
        progress: Math.random(),
        speed: 0.0016 + Math.random() * 0.0022,
        color: nodes[from].color || HUB_COLOR
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

      for (let i = 0; i < dust.length; i++) {
        const p = dust[i];
        p.x += p.vx * deltaFactor;
        p.y += p.vy * deltaFactor;
        p.twinkle += 0.02 * deltaFactor;
        if (p.y < -4) { p.y = height + 4; p.x = Math.random() * width; }
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;
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

    const paintNetwork = () => {
      activeEdges.clear();
      for (let i = 0; i < transitPulses.length; i++) activeEdges.add(transitPulses[i].key);

      for (let i = 0; i < edges.length; i++) {
        const [iA, iB] = edges[i];
        const a = nodes[iA];
        const b = nodes[iB];
        const dist = distance(a, b);
        if (dist >= MAX_DISTANCE) continue;

        const live = activeEdges.has(edgeKey(iA, iB));
        const base = 1 - dist / MAX_DISTANCE;
        const alphaBucket = Math.min(ALPHA_BUCKETS, Math.round(base * ALPHA_BUCKETS * (live ? 1.5 : 0.85)));
        if (alphaBucket < 1) continue;

        const cp = controlPoint(a, b, bendFor(iA, iB));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cp.cx, cp.cy, b.x, b.y);
        ctx.strokeStyle = getLineStyle(a.color, b.color, alphaBucket);
        ctx.lineWidth = live ? 1.4 : (a.isHub || b.isHub ? 1.1 : 0.9);
        ctx.stroke();
      }
    };

    const paintPulses = () => {
      for (let p = 0; p < transitPulses.length; p++) {
        const pulse = transitPulses[p];
        const a = nodes[pulse.from];
        const b = nodes[pulse.to];
        if (!a || !b) continue;
        const cp = controlPoint(a, b, bendFor(pulse.from, pulse.to));
        const head = pointOnCurve(a, b, cp, pulse.progress);
        const tailSpan = pulse.speed * 46;

        for (let s = TRAIL_STEPS; s >= 1; s--) {
          const t = pulse.progress - tailSpan * s;
          if (t <= 0) continue;
          const pt = pointOnCurve(a, b, cp, t);
          const fade = 1 - s / (TRAIL_STEPS + 1);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 0.6 + fade * 2.4, 0, Math.PI * 2);
          ctx.fillStyle = rgbaOf(pulse.color, fade * fade * 0.55);
          ctx.fill();
        }

        const glow = getGlowSprite(pulse.color, 15);
        ctx.drawImage(glow, head.x - glow.width / 2, head.y - glow.height / 2);
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    };

    const paintNodes = () => {
      let currentFont = '';
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const breath = Math.sin(n.pulse);
        const lift = 0.55 + n.depth * 0.45;

        if (n.isHub) {
          ctx.save();
          ctx.translate(n.x, n.y);
          ctx.rotate(n.pulse * 0.22);
          ctx.beginPath();
          ctx.arc(0, 0, 21, 0, Math.PI * 2);
          ctx.strokeStyle = rgbaOf(HUB_COLOR, 0.28);
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 7]);
          ctx.stroke();
          ctx.restore();

          const ringPhase = (n.pulse * 8) % 26;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 15 + ringPhase, 0, Math.PI * 2);
          ctx.strokeStyle = rgbaOf(HUB_COLOR, Math.max(0, 1 - ringPhase / 26) * 0.55);
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + (n.isHub ? 9 + breath * 3 : 4 + breath * 2), 0, Math.PI * 2);
        ctx.fillStyle = rgbaOf(n.color, 0.1 * lift);
        ctx.fill();

        if (n.name && !n.isHub) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 7, 0, Math.PI * 2);
          ctx.strokeStyle = rgbaOf(n.color, 0.22 * lift);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        const glow = getGlowSprite(n.color, n.radius + (n.isHub ? 15 : 8 + n.depth * 5));
        ctx.globalAlpha = lift;
        ctx.drawImage(glow, n.x - glow.width / 2, n.y - glow.height / 2);
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = rgbaOf(n.color, 0.45 + lift * 0.55);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.35 + lift * 0.5).toFixed(2)})`;
        ctx.fill();

        if (!n.name) continue;

        const font = n.isHub ? 'bold 10px "JetBrains Mono", monospace' : '9px "JetBrains Mono", monospace';
        if (font !== currentFont) {
          ctx.font = font;
          currentFont = font;
        }
        const cacheKey = `${font}|${n.name}`;
        let measured = labelWidthCache.get(cacheKey);
        if (measured === undefined) {
          measured = ctx.measureText(n.name).width;
          labelWidthCache.set(cacheKey, measured);
        }

        const right = n.x + n.radius + 12;
        const flip = right + measured + 8 > width;
        const textX = flip ? n.x - n.radius - 12 - measured : right;
        const textY = n.y + 3;

        ctx.strokeStyle = rgbaOf(n.color, 0.35 * lift);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(flip ? n.x - n.radius - 5 : n.x + n.radius + 4, n.y);
        ctx.lineTo(flip ? textX + measured + 4 : textX - 4, n.y);
        ctx.stroke();

        ctx.fillStyle = n.color;
        ctx.fillRect(flip ? textX - 7 : textX - 9, textY - 5, 2.5, 6);

        ctx.fillStyle = n.isHub ? '#7dd3fc' : rgbaOf(n.color, 0.55 + lift * 0.35);
        ctx.fillText(n.name, textX, textY);
      }
    };

    const paintDust = () => {
      for (let i = 0; i < dust.length; i++) {
        const p = dust[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 197, 224, ${(0.05 + Math.abs(Math.sin(p.twinkle)) * 0.16).toFixed(3)})`;
        ctx.fill();
      }
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      paintDust();
      paintNetwork();
      paintPulses();
      paintNodes();
    };

    const frame = (now) => {
      const seconds = lastTime ? (now - lastTime) / 1000 : REFERENCE_STEP;
      lastTime = now;
      const clamped = Math.min(seconds, MAX_FRAME_SECONDS);

      update(clamped / REFERENCE_STEP);

      edgeTimer += clamped;
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
    <div className="routes-background-wrapper" aria-hidden="true">
      <div className="routes-bg-glow routes-bg-glow-cyan" />
      <div className="routes-bg-glow routes-bg-glow-emerald" />
      <div className="routes-bg-glow routes-bg-glow-purple" />
      <div className="routes-bg-grid" />
      <canvas ref={canvasRef} className="routes-bg-canvas" />
      <div className="routes-bg-vignette" />
    </div>
  );
});
