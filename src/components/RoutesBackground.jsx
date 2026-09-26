import React, { useEffect, useRef, memo } from 'react';

/**
 * RoutesBackground — Red de Rutas y Nodos Conectados (Logistics Neural Network)
 * BAZ Entregas CD Villahermosa
 *
 * Fondo animado sereno y temático de logística:
 * - Nodos de entrega (Sucursales y Hubs) que flotan suavemente.
 * - Líneas de conexión dinámicas que se enlazan entre sucursales cercanas.
 * - Destellos de luz en tránsito ("unidades en ruta") que viajan pacíficamente entre nodos.
 * - Nodo central destacado: CD VILLAHERMOSA con pulso de baliza.
 * - Pausa automática cuando la pestaña está en segundo plano para 0% consumo de CPU.
 */
export const RoutesBackground = memo(function RoutesBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;

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

    let nodes = [];
    let transitPulses = [];
    const MAX_DISTANCE = 190;
    const TOTAL_NODES = 32;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      initNodes();
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

      // 4. Inicializar 7 pulsos / viajes en tránsito sobre las rutas
      for (let i = 0; i < 7; i++) {
        createRandomPulse();
      }
    };

    const createRandomPulse = () => {
      if (nodes.length < 2) return;
      const startIdx = Math.floor(Math.random() * nodes.length);
      // Buscar un nodo conectado cercano
      const candidates = [];
      for (let j = 0; j < nodes.length; j++) {
        if (startIdx === j) continue;
        const dx = nodes[startIdx].x - nodes[j].x;
        const dy = nodes[startIdx].y - nodes[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_DISTANCE) {
          candidates.push(j);
        }
      }

      if (candidates.length > 0) {
        const endIdx = candidates[Math.floor(Math.random() * candidates.length)];
        transitPulses.push({
          from: startIdx,
          to: endIdx,
          progress: Math.random(), // iniciar en punto aleatorio
          speed: 0.0018 + Math.random() * 0.0022, // movimiento tranquilo y fluido
          color: nodes[startIdx].color || '#22d3ee'
        });
      }
    };

    // Bucle de Renderizado
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Resplandor ambiental de fondo muy sutil
      const grad = ctx.createRadialGradient(
        width * 0.72, height * 0.22, 20,
        width * 0.72, height * 0.22, 500
      );
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.025)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Actualizar posiciones de nodos
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.025;

        // Rebote suave en los bordes
        if (n.x < 20) { n.x = 20; n.vx *= -1; }
        if (n.x > width - 20) { n.x = width - 20; n.vx *= -1; }
        if (n.y < 20) { n.y = 20; n.vy *= -1; }
        if (n.y > height - 20) { n.y = height - 20; n.vy *= -1; }
      }

      // 3. Dibujar Líneas de Rutas Conectadas
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DISTANCE) {
            const alpha = (1 - dist / MAX_DISTANCE) * 0.35;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);

            // Gradiente suave entre los dos nodos
            const lineGrad = ctx.createLinearGradient(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y);
            lineGrad.addColorStop(0, `rgba(6, 182, 212, ${alpha})`);
            lineGrad.addColorStop(1, `rgba(16, 185, 129, ${alpha})`);
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = nodes[i].isHub || nodes[j].isHub ? 1.5 : 1;
            ctx.stroke();
          }
        }
      }

      // 4. Dibujar Unidades / Pulsos en Tránsito a lo largo de las rutas
      for (let p = transitPulses.length - 1; p >= 0; p--) {
        const pulse = transitPulses[p];
        pulse.progress += pulse.speed;

        const nodeA = nodes[pulse.from];
        const nodeB = nodes[pulse.to];

        if (!nodeA || !nodeB || pulse.progress >= 1) {
          transitPulses.splice(p, 1);
          createRandomPulse();
          continue;
        }

        // Posición interpolada a lo largo del camino
        const px = nodeA.x + (nodeB.x - nodeA.x) * pulse.progress;
        const py = nodeA.y + (nodeB.y - nodeA.y) * pulse.progress;

        // Estela y destello de luz de la unidad
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = pulse.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // Asegurar que siempre haya 7 pulsos activos en la red
      while (transitPulses.length < 7) {
        createRandomPulse();
      }

      // 5. Dibujar Nodos y Etiquetas
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const pulseScale = Math.sin(n.pulse);

        // Halo / resplandor exterior
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + (n.isHub ? 8 + pulseScale * 3 : 4 + pulseScale * 2), 0, Math.PI * 2);
        ctx.fillStyle = n.color === '#fbbf24' 
          ? 'rgba(245, 158, 11, 0.12)' 
          : (n.color === '#34d399' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(6, 182, 212, 0.15)');
        ctx.fill();

        // Anillo de pulso extra para el Hub principal
        if (n.isHub) {
          ctx.beginPath();
          const ringRadius = 14 + ((n.pulse * 8) % 24);
          const ringAlpha = Math.max(0, 1 - (ringRadius - 14) / 24);
          ctx.arc(n.x, n.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(34, 211, 238, ${ringAlpha * 0.6})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Núcleo del nodo
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.shadowColor = n.color;
        ctx.shadowBlur = n.isHub ? 14 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Centro brillante blanco
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Etiquetas para nodos reconocidos
        if (n.name) {
          ctx.font = n.isHub 
            ? 'bold 10px "JetBrains Mono", monospace' 
            : '9px "JetBrains Mono", monospace';
          ctx.fillStyle = n.isHub ? '#38bdf8' : '#94a3b8';
          ctx.fillText(n.name, n.x + n.radius + 6, n.y + 3);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Manejo de eventos
    window.addEventListener('resize', resize);
    resize();
    render();

    // Pausar animación cuando la pestaña está en segundo plano para ahorrar batería/CPU
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
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
