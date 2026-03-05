import { useEffect, useRef, useCallback } from 'react';

const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const PARTICLE_COUNT = 40;
const COLUMN_COUNT = 30;

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
}

interface MatrixColumn {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  length: number;
  opacity: number;
}

/** Parse a CSS hex color (#rrggbb) into [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/** Read current theme colours from CSS custom properties */
function readThemeColors() {
  const style = getComputedStyle(document.documentElement);
  const bgHex = style.getPropertyValue('--cyber-bg').trim() || '#0a0e1a';
  const primaryHex = style.getPropertyValue('--cyber-primary').trim() || '#00d4ff';
  return { bg: hexToRgb(bgHex), primary: hexToRgb(primaryHex) };
}

export default function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const columnsRef = useRef<MatrixColumn[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);
  const colorsRef = useRef(readThemeColors());

  const initParticles = useCallback((w: number, h: number) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));
  }, []);

  const initColumns = useCallback((w: number, h: number) => {
    columnsRef.current = Array.from({ length: COLUMN_COUNT }, () => {
      const length = Math.floor(Math.random() * 15) + 5;
      return {
        x: Math.random() * w,
        y: Math.random() * h - h,
        speed: Math.random() * 1.5 + 0.3,
        chars: Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]),
        length,
        opacity: Math.random() * 0.12 + 0.03,
      };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    /* Re-read colours whenever the data-theme attribute changes */
    const observer = new MutationObserver(() => {
      colorsRef.current = readThemeColors();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (particlesRef.current.length === 0) {
        initParticles(canvas.width, canvas.height);
        initColumns(canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove);

    const draw = () => {
      timeRef.current += 0.016;
      const w = canvas.width;
      const h = canvas.height;
      const { bg, primary } = colorsRef.current;
      const [br, bg2, bb] = bg;
      const [pr, pg, pb] = primary;

      // Clear – use the theme background colour
      ctx.fillStyle = `rgba(${br}, ${bg2}, ${bb}, 0.15)`;
      ctx.fillRect(0, 0, w, h);

      // Draw grid
      ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, 0.015)`;
      ctx.lineWidth = 0.5;
      const gridSize = 50;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw matrix columns
      columnsRef.current.forEach((col) => {
        ctx.font = '14px "JetBrains Mono", monospace';
        col.chars.forEach((char, i) => {
          const alpha = col.opacity * (1 - i / col.length);
          ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${alpha})`;
          ctx.fillText(char, col.x, col.y + i * 18);
        });
        col.y += col.speed;
        if (col.y > h + col.length * 18) {
          col.y = -col.length * 18;
          col.x = Math.random() * w;
          col.chars = col.chars.map(() => CHARS[Math.floor(Math.random() * CHARS.length)]);
        }
        if (Math.random() < 0.05) {
          const idx = Math.floor(Math.random() * col.chars.length);
          col.chars[idx] = CHARS[Math.floor(Math.random() * CHARS.length)];
        }
      });

      // Draw particles
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particlesRef.current.forEach((p) => {
        p.pulse += p.pulseSpeed;
        const pulseOpacity = p.opacity + Math.sin(p.pulse) * 0.15;

        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          p.speedX -= (dx / dist) * force * 0.05;
          p.speedY -= (dy / dist) * force * 0.05;
        }

        p.x += p.speedX;
        p.y += p.speedY;
        p.speedX *= 0.99;
        p.speedY *= 0.99;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${Math.max(0, pulseOpacity)})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, ${Math.max(0, pulseOpacity * 0.3)})`);
        gradient.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0)`);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Draw connections
      ctx.strokeStyle = `rgba(${pr}, ${pg}, ${pb}, 0.04)`;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            ctx.globalAlpha = (1 - dist / 200) * 0.3;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Scanning line
      const scanY = (timeRef.current * 30) % h;
      const scanGradient = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGradient.addColorStop(0, `rgba(${pr}, ${pg}, ${pb}, 0)`);
      scanGradient.addColorStop(0.5, `rgba(${pr}, ${pg}, ${pb}, 0.02)`);
      scanGradient.addColorStop(1, `rgba(${pr}, ${pg}, ${pb}, 0)`);
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanY - 30, w, 60);

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initParticles, initColumns]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
